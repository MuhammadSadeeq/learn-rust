//! The run_command tool. It runs one program from an allowlist, with fixed
//! arguments and a clean environment. It is the riskiest tool here, so it
//! has the most rules.
//!
//! 1. The program must be on the allowlist, by its exact name. A path such as
//!    `/bin/sh` is not a name on the list. Nothing runs through a shell. So
//!    `;`, `|`, `$(...)` and `>` are plain characters inside an argument.
//! 2. No argument may be an absolute path, or contain `..`. An argument that
//!    names an existing file must also resolve, through any symbolic link, to a
//!    place inside the sandbox. This is a guard rail, not a sandbox. It does
//!    not look inside an option such as `--file=/etc/x`, so keep the allowlist
//!    to programs you trust.
//! 3. The environment is cleared. The program gets one variable, a short PATH.
//!    Secrets in our environment never reach it.
//! 4. It runs in the sandbox folder.
//! 5. A timeout kills a program that runs too long. `kill_on_drop` is the
//!    backstop: if we stop waiting for any reason, the child is killed.
//! 6. Each output stream is capped at 16 KiB. A program that prints forever
//!    is stopped.
//!
//! This module targets Unix. The PATH and the program names assume Unix.
//!
//! Laravel counterpart: `Process::run(['php', 'artisan', 'migrate'])`, which
//! takes an array of arguments rather than one command string. That is the
//! same idea as rule 1. `->path()`, `->env()` and `->timeout()` map onto
//! rules 3 to 5.

use std::io;
use std::path::{Component, Path, PathBuf};
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

    async fn run(&self, input: Input) -> Result<String, ToolError> {
        // Rule 1: the exact name must be on the list.
        if !self.allowed.contains(&input.program) {
            return Err(ToolError::Denied(format!(
                "'{}' is not on the allowlist",
                input.program
            )));
        }
        // Rule 2: no argument may point outside the sandbox.
        for arg in &input.args {
            let path = Path::new(arg);
            if path.is_absolute() || path.components().any(|part| part == Component::ParentDir) {
                return Err(ToolError::Denied(format!(
                    "argument '{arg}' points outside the sandbox"
                )));
            }
            // A symbolic link inside the root can point outside it, and the
            // program would follow it. Resolve the name and check the real
            // place. A name that does not exist has nothing to follow, so the
            // program will report its own error.
            let inside = match self.root.join(arg).canonicalize() {
                Ok(real) => real.starts_with(&self.root),
                Err(_) => true,
            };
            if !inside {
                return Err(ToolError::Denied(format!(
                    "argument '{arg}' leads outside the sandbox"
                )));
            }
        }

        let mut child = Command::new(&input.program)
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
            .kill_on_drop(true)
            .spawn()
            .map_err(|e| ToolError::Failed(format!("could not start '{}': {e}", input.program)))?;

        let stdout = child.stdout.take();
        let stderr = child.stderr.take();
        let finished = timeout(self.timeout, async {
            // Read both pipes at once. If we read one and the program filled
            // the other, both would wait forever.
            let (out, err) = tokio::join!(read_capped(stdout), read_capped(stderr));
            let (out, err) = (out?, err?);
            if out.1 || err.1 {
                // Rule 6: too much output. There is no point waiting for the
                // program, so stop it. The error is ignored because the program
                // may have exited already.
                let _ = child.kill().await;
            }
            let status = child.wait().await?;
            Ok::<_, io::Error>((status, out, err))
        })
        .await;

        match finished {
            Ok(Ok((status, out, err))) => Ok(report(status, &out, &err)),
            Ok(Err(e)) => Err(ToolError::Failed(format!(
                "'{}' failed: {e}",
                input.program
            ))),
            Err(_) => {
                // Rule 5, the explicit kill. kill_on_drop would also do it.
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

/// Reads at most `MAX_OUTPUT` bytes from a pipe. The flag says whether there
/// was more.
async fn read_capped<R>(pipe: Option<R>) -> io::Result<(Vec<u8>, bool)>
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
    bytes.truncate(MAX_OUTPUT);
    Ok((bytes, cut))
}

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
