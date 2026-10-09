//! The run_command tool. It runs one program from an allowlist, with fixed
//! arguments and a clean environment. It is the riskiest tool here, so it
//! has the most rules.
//!
//! 1. The program must be on the allowlist, by its exact name. A path such as
//!    `/bin/sh` is not a name on the list. Nothing runs through a shell. So
//!    `;`, `|`, `$(...)` and `>` are plain characters inside an argument.
//! 2. No argument may point outside the sandbox. The check looks at every
//!    place a path can start inside an argument: the whole argument, the text
//!    after an `=` (`--files0-from=/etc/x`), and the text after a short flag
//!    (`-f/etc/x`). Such a place may not be absolute or contain `..`. A name
//!    that exists must also resolve, through any symbolic link, to a place
//!    inside the sandbox. This is a guard rail, not a sandbox: see the README
//!    for what an allowed program can still do.
//! 3. The environment is cleared. The program gets one variable, a short PATH.
//!    Secrets in our environment never reach it.
//! 4. It runs in the sandbox folder.
//! 5. A timeout kills the program and every program it started. The program
//!    gets a process group of its own, and the group is killed. `kill_on_drop`
//!    is the backstop: if we stop waiting for any reason, the child is killed.
//!    When the program exits in time, the group is stopped too, so a
//!    background child cannot hold the output open.
//! 6. Each output stream is capped at 16 KiB. A program that prints more is
//!    stopped at once, with its whole group.
//!
//! This module targets Unix. The process groups, the `kill` command and the
//! PATH all assume Unix.
//!
//! Laravel counterpart: `Process::run(['php', 'artisan', 'migrate'])`. Laravel's
//! own examples mostly pass one command string, which runs through a shell.
//! The array form is the one that matches rule 1. `->path()`, `->env()` and
//! `->timeout()` map onto rules 3 to 5.

use std::io;
use std::path::{Path, PathBuf};
use std::process::{ExitStatus, Stdio};
use std::time::Duration;

use serde::Deserialize;
use serde_json::{Value, json};
use tokio::io::{AsyncRead, AsyncReadExt};
use tokio::process::Command;
use tokio::time::timeout;

use super::{Tool, ToolError, ToolFuture};

/// The most we keep from each output stream: 16 KiB.
pub const MAX_OUTPUT: usize = 16 * 1024;
/// How long a program may run by default.
pub const DEFAULT_TIMEOUT: Duration = Duration::from_secs(10);
/// The only PATH the program sees.
const SAFE_PATH: &str = "/usr/bin:/bin";

#[derive(Deserialize)]
struct Input {
    program: String,
    #[serde(default)]
    args: Vec<String>,
}

pub struct RunCommand {
    root: PathBuf,
    allowed: Vec<String>,
    timeout: Duration,
}

impl RunCommand {
    pub fn new(root: &Path, allowed: Vec<String>) -> io::Result<Self> {
        Ok(RunCommand {
            root: root.canonicalize()?,
            allowed,
            timeout: DEFAULT_TIMEOUT,
        })
    }

    pub fn with_timeout(mut self, timeout: Duration) -> Self {
        self.timeout = timeout;
        self
    }

    /// Rule 2, for one argument. Every place a path can start is checked.
    fn check_argument(&self, arg: &str) -> Result<(), ToolError> {
        for start in path_starts(arg) {
            let candidate = &arg[start..];
            if candidate.starts_with('/') || candidate.split('/').any(|part| part == "..") {
                return Err(ToolError::Denied(format!(
                    "argument '{arg}' points outside the sandbox"
                )));
            }
            // A symbolic link inside the root can point outside it, and the
            // program would follow it. Resolve the name and check the real
            // place. A name that does not exist has nothing to follow, so the
            // program will report its own error.
            let leaves = matches!(
                self.root.join(candidate).canonicalize(),
                Ok(real) if !real.starts_with(&self.root)
            );
            if leaves {
                return Err(ToolError::Denied(format!(
                    "argument '{arg}' leads outside the sandbox"
                )));
            }
        }
        Ok(())
    }

    async fn run(&self, input: Input) -> Result<String, ToolError> {
        // Rule 1: the exact name must be on the list.
        if !self.allowed.contains(&input.program) {
            return Err(ToolError::Denied(format!(
                "'{}' is not on the allowlist",
                input.program
            )));
        }
        for arg in &input.args {
            self.check_argument(arg)?;
        }

        let mut command = Command::new(&input.program);
        command
            .args(&input.args)
            // Rule 4: the working folder is the sandbox root.
            .current_dir(&self.root)
            // Rule 3: nothing from our environment, and a short PATH.
            .env_clear()
            .env("PATH", SAFE_PATH)
            .stdin(Stdio::null())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            // Rule 5, the backstop.
            .kill_on_drop(true);
        // Rule 5: the program leads a process group, so one kill reaches
        // everything it starts.
        #[cfg(unix)]
        command.process_group(0);
        let mut child = command
            .spawn()
            .map_err(|e| ToolError::Failed(format!("could not start '{}': {e}", input.program)))?;

        let pid = child.id();
        let stdout = child.stdout.take();
        let stderr = child.stderr.take();
        let finished = timeout(self.timeout, async {
            // Two jobs run side by side. The reads take the output. The wait
            // notes the exit and then stops the group. A program's child may
            // still hold a pipe open after the program has exited. Stopping
            // the group closes that pipe, so the reads reach the end.
            let reads = async { tokio::join!(read_capped(stdout, pid), read_capped(stderr, pid)) };
            let exit = async {
                let status = child.wait().await?;
                stop_group(pid).await;
                Ok::<ExitStatus, io::Error>(status)
            };
            let ((out, err), status) = tokio::join!(reads, exit);
            Ok::<_, io::Error>((status?, out?, err?))
        })
        .await;

        match finished {
            Ok(Ok((status, out, err))) => Ok(report(status, &out, &err)),
            Ok(Err(e)) => Err(ToolError::Failed(format!(
                "'{}' failed: {e}",
                input.program
            ))),
            Err(_) => {
                // Rule 5, the explicit kill. kill_on_drop would stop only the
                // program itself, so the group goes first.
                stop_group(pid).await;
                let _ = child.kill().await;
                Err(ToolError::Failed(format!(
                    "'{}' timed out after {} seconds and was stopped",
                    input.program,
                    self.timeout.as_secs_f64()
                )))
            }
        }
    }
}

/// The places a path can start inside one argument, as byte offsets: the start,
/// the text after each `=`, and, for a short-flag cluster such as `-f/etc/x`,
/// the text after each character of the cluster.
fn path_starts(arg: &str) -> Vec<usize> {
    let mut starts = vec![0];
    starts.extend(arg.match_indices('=').map(|(i, _)| i + 1));
    if arg.starts_with('-') && !arg.starts_with("--") {
        starts.extend((1..arg.len()).filter(|&i| arg.is_char_boundary(i)));
    }
    starts
}

/// Reads at most `MAX_OUTPUT` bytes from a pipe. The flag says whether there
/// was more. When there was more, the whole group is stopped at once.
async fn read_capped<R>(pipe: Option<R>, pid: Option<u32>) -> io::Result<(Vec<u8>, bool)>
where
    R: AsyncRead + Unpin,
{
    let Some(pipe) = pipe else {
        return Ok((Vec::new(), false));
    };
    let mut bytes = Vec::new();
    // Read one byte past the cap. Getting that byte proves there was more.
    pipe.take(MAX_OUTPUT as u64 + 1)
        .read_to_end(&mut bytes)
        .await?;
    let cut = bytes.len() > MAX_OUTPUT;
    if cut {
        // Rule 6: there is no point waiting for the program. The error is
        // ignored, because the group may have exited already.
        stop_group(pid).await;
    }
    bytes.truncate(MAX_OUTPUT);
    Ok((bytes, cut))
}

/// Stops every process in the program's group: the program and what it started.
#[cfg(unix)]
async fn stop_group(pid: Option<u32>) {
    let Some(pid) = pid else {
        return;
    };
    // `kill -KILL -- -PID` signals the group whose id is PID. The `kill`
    // program keeps this crate free of `unsafe`. Errors are ignored: the group
    // may be empty already.
    let _ = Command::new("kill")
        .args(["-KILL", "--", &format!("-{pid}")])
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .status()
        .await;
}

/// Without process groups only the program itself is stopped, by `kill_on_drop`.
#[cfg(not(unix))]
async fn stop_group(_pid: Option<u32>) {}

/// The text the model sees: the exit code, then each stream.
fn report(status: ExitStatus, out: &(Vec<u8>, bool), err: &(Vec<u8>, bool)) -> String {
    let code = match status.code() {
        Some(code) => code.to_string(),
        None => "none (the program was stopped by a signal)".to_string(),
    };
    format!(
        "exit code: {code}\n{}{}",
        render("stdout", out),
        render("stderr", err)
    )
}

fn render(name: &str, (bytes, cut): &(Vec<u8>, bool)) -> String {
    let mut text = format!("{name}:\n{}", String::from_utf8_lossy(bytes));
    if !text.ends_with('\n') {
        text.push('\n');
    }
    if *cut {
        text.push_str(&format!("[{name} cut at {MAX_OUTPUT} bytes]\n"));
    }
    text
}

impl Tool for RunCommand {
    fn name(&self) -> &str {
        "run_command"
    }

    fn description(&self) -> &str {
        "Runs one allowed program with a list of arguments. There is no shell, so pipes, globs and $VARIABLES do not work."
    }

    fn input_schema(&self) -> Value {
        json!({
            "type": "object",
            "properties": {
                "program": {"type": "string", "description": "The program name exactly as allowed, such as echo"},
                "args": {"type": "array", "items": {"type": "string"}}
            },
            "required": ["program"]
        })
    }

    fn call<'a>(&'a self, input: Value) -> ToolFuture<'a> {
        Box::pin(async move {
            let input: Input =
                serde_json::from_value(input).map_err(|e| ToolError::BadInput(e.to_string()))?;
            self.run(input).await
        })
    }
}
