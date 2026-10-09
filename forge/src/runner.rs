//! Compiling a quest and running its tests.
//!
//! A single-file quest is compiled with `rustc --test` and run as a test
//! binary, so one broken quest can never stop another from building.
//!
//! A cargo quest is a small package under `quests/pkgs/`. The Forge builds its
//! test programs with `cargo test --no-run`, under a long limit, because the
//! first build downloads crates. Then it runs each test program itself, under
//! the same short limit as a single-file quest. Every cargo quest builds into
//! the same directory, `target/forge-pkgs`, so a crate such as tokio is
//! compiled once.

use std::fs;
use std::io::{self, Read};
use std::path::{Path, PathBuf};
use std::process::{Child, Command, ExitStatus, Stdio};
use std::sync::atomic::{AtomicBool, Ordering};
use std::thread;
use std::time::{Duration, Instant};

use crate::json;
use crate::quests::{Kind, Quest};

/// How long one test program may run before the Forge assumes an infinite
/// loop. A single-file quest has one program; a cargo quest may have several.
pub const TEST_TIMEOUT: Duration = Duration::from_secs(20);

/// Cargo quests build their crates first, which can take minutes on a cold cache.
pub const CARGO_TIMEOUT: Duration = Duration::from_secs(15 * 60);

/// The shared build directory for cargo quests, relative to the repo root.
const PKG_TARGET: &str = "target/forge-pkgs";

/// Set once the first-build note has been shown, so it appears once per run.
static BUILD_NOTE_SHOWN: AtomicBool = AtomicBool::new(false);

#[derive(Debug)]
pub enum Outcome {
    /// The compiler rejected the code. `output` holds the diagnostics.
    CompileError { output: String },
    /// It compiled, but at least one test failed or panicked. `counts` holds
    /// (passed, failed) when libtest's summary line was found.
    TestsFailed {
        output: String,
        counts: Option<(usize, usize)>,
    },
    /// A time limit passed. The stage says which step was running.
    TimedOut(Stage),
    /// Compiled and every test passed.
    Passed { tests: usize, warnings: String },
}

impl Outcome {
    pub fn passed(&self) -> bool {
        matches!(self, Outcome::Passed { .. })
    }
}

/// The step that ran out of time.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Stage {
    /// Cargo was building the package, which downloads and compiles crates.
    Build,
    /// A test program was running.
    Run,
}

/// Compiles and tests one quest. `location` is what to test: the learner's
/// file, or the reference solution. For a cargo quest it is the package directory.
pub fn run(root: &Path, quest: &Quest, location: &Path, color: bool) -> io::Result<Outcome> {
    match quest.kind {
        Kind::Std => run_single(root, quest, location, color),
        Kind::Cargo => run_cargo(root, quest, location, color),
    }
}

/// Compiles `file` as a test binary and runs it.
fn run_single(root: &Path, quest: &Quest, file: &Path, color: bool) -> io::Result<Outcome> {
    let out_dir = root.join("target").join("forge");
    fs::create_dir_all(&out_dir)?;
    let bin = binary_path(&out_dir, &quest.name);

    let compile = Command::new(rustc())
        .args(["--edition", "2024", "--test", "--crate-name"])
        .arg(crate_name(&quest.name))
        .args(["--color", color_arg(color)])
        .arg("-o")
        .arg(&bin)
        // A path relative to the repo root keeps error messages short:
        // `--> quests/06_ownership/move1.rs:16:17`.
        .arg(file.strip_prefix(root).unwrap_or(file))
        .current_dir(root)
        .stdin(Stdio::null())
        .output()
        .map_err(|e| missing_tool(e, "rustc"))?;

    let diagnostics = String::from_utf8_lossy(&compile.stderr).into_owned();
    if !compile.status.success() {
        return Ok(Outcome::CompileError {
            output: diagnostics,
        });
    }

    let mut test = Command::new(&bin);
    test.args(["--test-threads", "1", "--color", color_arg(color)])
        .env("RUST_BACKTRACE", "0")
        .current_dir(root);
    Ok(match run_limited(&mut test, TEST_TIMEOUT, true)? {
        None => Outcome::TimedOut(Stage::Run),
        Some(done) if done.status.success() => Outcome::Passed {
            tests: count_passed(&done.stdout),
            warnings: diagnostics,
        },
        Some(done) => Outcome::TestsFailed {
            counts: count_results(&done.stdout),
            output: format!("{}{}", done.stdout, done.stderr),
        },
    })
}

/// Builds the package's test programs with `cargo test --no-run`, then runs
/// each one under TEST_TIMEOUT, the way cargo would: in order, stopping at the
/// first program that fails.
fn run_cargo(root: &Path, quest: &Quest, package: &Path, color: bool) -> io::Result<Outcome> {
    let target = root.join(PKG_TARGET);
    if !target.exists() && !BUILD_NOTE_SHOWN.swap(true, Ordering::Relaxed) {
        println!("First build of the crates can take a few minutes. Later checks reuse them.");
    }
    forget_package(root, &quest.name, package);

    // Build only. The JSON on stdout names each test program; the human-readable
    // diagnostics go to stderr, as they always did.
    let mut build = Command::new(cargo());
    build
        .args(["test", "--no-run", "--manifest-path"])
        .arg(package.join("Cargo.toml"))
        .args(["--message-format=json-render-diagnostics", "--color"])
        .arg(color_arg(color))
        .env("CARGO_TARGET_DIR", &target)
        .env("RUST_BACKTRACE", "0")
        .current_dir(root);
    let Some(built) =
        run_limited(&mut build, CARGO_TIMEOUT, true).map_err(|e| missing_tool(e, "cargo"))?
    else {
        return Ok(Outcome::TimedOut(Stage::Build));
    };
    if !built.status.success() {
        // A failed build: the crates could not be fetched, or the code does not compile.
        return Ok(Outcome::CompileError {
            output: without_progress(&built.stderr),
        });
    }
    let programs = test_programs(&built.stdout);
    if programs.is_empty() {
        return Ok(Outcome::CompileError {
            output: "cargo built no test programs for this package.".to_string(),
        });
    }

    let mut tests = 0;
    for program in programs {
        // Cargo runs each test program from the package directory, with this variable set.
        let mut test = Command::new(&program);
        test.args(["--color", color_arg(color)])
            .env("RUST_BACKTRACE", "0")
            .env("CARGO_MANIFEST_DIR", package)
            .current_dir(package);
        match run_limited(&mut test, TEST_TIMEOUT, true)? {
            None => return Ok(Outcome::TimedOut(Stage::Run)),
            Some(done) if done.status.success() => tests += count_passed(&done.stdout),
            Some(done) => {
                return Ok(Outcome::TestsFailed {
                    counts: count_results(&done.stdout),
                    output: format!("{}{}", done.stdout, done.stderr),
                });
            }
        }
    }
    Ok(Outcome::Passed {
        tests,
        // Compiler warnings from the build. Cargo's progress lines are not warnings.
        warnings: built.stderr,
    })
}

/// The paths of the test programs cargo built. Cargo prints one JSON message
/// per line. A test program is an artifact whose `profile.test` is true. Its
/// `target.test` is not enough: dependencies have it too, and their profile is
/// not a test profile.
fn test_programs(json_lines: &str) -> Vec<PathBuf> {
    json_lines
        .lines()
        .filter_map(json::parse)
        .filter(|message| {
            message.get("reason").and_then(json::Value::as_str) == Some("compiler-artifact")
        })
        .filter(|message| {
            message
                .get("profile")
                .and_then(|profile| profile.get("test"))
                .and_then(json::Value::as_bool)
                == Some(true)
        })
        .filter_map(|message| {
            message
                .get("executable")
                .and_then(json::Value::as_str)
                .map(PathBuf::from)
        })
        .collect()
}

/// Forgets the package's own build and keeps its dependencies. The learner's
/// file and the solution have the same package name, so cargo gives them one
/// artifact in the shared directory, and a run could test the other one.
/// `cargo clean -p` removes only that artifact, and the package rebuilds in seconds.
fn forget_package(root: &Path, name: &str, package: &Path) {
    let _ = Command::new(cargo())
        .args(["clean", "--manifest-path"])
        .arg(package.join("Cargo.toml"))
        .args(["-p", name])
        .env("CARGO_TARGET_DIR", root.join(PKG_TARGET))
        .current_dir(root)
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .status();
}

/// A process that finished in time, with everything it printed.
struct Finished {
    status: ExitStatus,
    stdout: String,
    stderr: String,
}

/// Runs `command` and waits up to `limit`. Returns None when the limit passed,
/// after killing the process. With `own_group`, on Unix, the process gets a
/// group of its own, so the kill also reaches the programs it started. Test
/// programs and cargo both start other programs, so both use the group.
fn run_limited(
    command: &mut Command,
    limit: Duration,
    own_group: bool,
) -> io::Result<Option<Finished>> {
    command
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());
    if own_group {
        set_own_group(command);
    }
    let mut child = command.spawn()?;

    // Read both pipes on helper threads so a chatty program can't block on a
    // full pipe while we wait for it.
    let mut stdout_pipe = child.stdout.take().expect("piped stdout");
    let mut stderr_pipe = child.stderr.take().expect("piped stderr");
    let out_reader = thread::spawn(move || {
        let mut s = String::new();
        let _ = stdout_pipe.read_to_string(&mut s);
        s
    });
    let err_reader = thread::spawn(move || {
        let mut s = String::new();
        let _ = stderr_pipe.read_to_string(&mut s);
        s
    });

    let started = Instant::now();
    let status = loop {
        if let Some(status) = child.try_wait()? {
            break status;
        }
        if started.elapsed() > limit {
            kill(&mut child, own_group);
            // The helper threads are not joined: a grandchild that outlived the
            // kill could hold the pipes open, and we must not wait for it.
            return Ok(None);
        }
        thread::sleep(Duration::from_millis(20));
    };
    // The child exited in time, but a program it started may still hold our
    // pipes open. Stop those too, or reading the output would wait for them
    // without any limit.
    if own_group {
        kill_group(child.id());
    }
    Ok(Some(Finished {
        status,
        stdout: out_reader.join().unwrap_or_default(),
        stderr: err_reader.join().unwrap_or_default(),
    }))
}

/// Stops the child, and with `own_group` the processes in its group too.
fn kill(child: &mut Child, own_group: bool) {
    if own_group {
        kill_group(child.id());
    }
    let _ = child.kill();
    let _ = child.wait();
}

#[cfg(unix)]
fn set_own_group(command: &mut Command) {
    use std::os::unix::process::CommandExt;
    command.process_group(0);
}

#[cfg(not(unix))]
fn set_own_group(_command: &mut Command) {}

/// `kill -KILL -- -PID` signals every process in the group whose id is PID.
#[cfg(unix)]
fn kill_group(pid: u32) {
    let _ = Command::new("kill")
        .args(["-KILL", "--", &format!("-{pid}")])
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .status();
}

#[cfg(not(unix))]
fn kill_group(_pid: u32) {}

fn rustc() -> PathBuf {
    std::env::var_os("RUSTC")
        .map(PathBuf::from)
        .unwrap_or_else(|| PathBuf::from("rustc"))
}

fn cargo() -> PathBuf {
    std::env::var_os("CARGO")
        .map(PathBuf::from)
        .unwrap_or_else(|| PathBuf::from("cargo"))
}

/// Explains a missing tool. Other errors pass through unchanged.
fn missing_tool(err: io::Error, tool: &str) -> io::Error {
    if err.kind() == io::ErrorKind::NotFound {
        io::Error::new(
            err.kind(),
            format!(
                "`{tool}` was not found. Install Rust from https://rustup.rs and open a new terminal."
            ),
        )
    } else {
        err
    }
}

fn color_arg(color: bool) -> &'static str {
    if color { "always" } else { "never" }
}

fn binary_path(dir: &Path, name: &str) -> PathBuf {
    let mut p = dir.join(name);
    if cfg!(windows) {
        p.set_extension("exe");
    }
    p
}

/// Crate names must be valid identifiers.
fn crate_name(name: &str) -> String {
    name.chars()
        .map(|c| if c.is_ascii_alphanumeric() { c } else { '_' })
        .collect()
}

/// Cargo's progress lines ("   Compiling clap1 v0.1.0") are noise on a
/// failure, so they are dropped. Diagnostics and warnings stay.
fn without_progress(stderr: &str) -> String {
    const VERBS: [&str; 10] = [
        "Compiling",
        "Checking",
        "Downloading",
        "Downloaded",
        "Locking",
        "Updating",
        "Blocking",
        "Finished",
        "Running",
        "Doc-tests",
    ];
    stderr
        .lines()
        .filter(|line| {
            let indented = line.starts_with(' ');
            let verb = line.split_whitespace().next().unwrap_or("");
            !(indented && VERBS.contains(&verb))
        })
        .collect::<Vec<_>>()
        .join("\n")
}

/// Reads "test result: ok. 3 passed; ..." from libtest's output, summed over
/// every test binary (a cargo package can have more than one).
fn count_passed(stdout: &str) -> usize {
    stdout
        .lines()
        .filter_map(|line| {
            line.split_once("test result: ")?
                .1
                .split_once(". ")?
                .1
                .split_once(" passed")
                .map(|(n, _)| n.trim().to_string())
        })
        .filter_map(|n| strip_ansi(&n).parse::<usize>().ok())
        .sum()
}

/// Reads "test result: FAILED. 3 passed; 2 failed; ..." from libtest's output,
/// summed over every test binary. Returns (passed, failed), or None when there
/// is no summary line.
fn count_results(stdout: &str) -> Option<(usize, usize)> {
    let plain = strip_ansi(stdout);
    let mut found = false;
    let (mut passed, mut failed) = (0, 0);
    for summary in plain
        .lines()
        .filter_map(|line| line.split_once("test result: ").map(|(_, rest)| rest))
    {
        found = true;
        passed += number_before(summary, " passed")?;
        failed += number_before(summary, " failed")?;
    }
    found.then_some((passed, failed))
}

/// The number just before `word`, as 3 is before " passed" in "3 passed".
fn number_before(text: &str, word: &str) -> Option<usize> {
    let (before, _) = text.split_once(word)?;
    before.split_whitespace().last()?.parse().ok()
}

/// Removes ANSI color sequences, for parsing colored output.
pub fn strip_ansi(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    let mut chars = s.chars().peekable();
    while let Some(c) = chars.next() {
        if c == '\u{1b}' && chars.peek() == Some(&'[') {
            chars.next();
            for c2 in chars.by_ref() {
                if c2.is_ascii_alphabetic() {
                    break;
                }
            }
        } else {
            out.push(c);
        }
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn counts_tests() {
        let out = "running 3 tests\n...\ntest result: ok. 3 passed; 0 failed; 0 ignored\n";
        assert_eq!(count_passed(out), 3);
    }

    #[test]
    fn counts_colored_tests() {
        let out = "test result: \u{1b}[32mok\u{1b}[0m. 2 passed; 0 failed;";
        assert_eq!(count_passed(out), 2);
    }

    #[test]
    fn counts_failed_results() {
        let out = "test result: FAILED. 3 passed; 2 failed; 0 ignored";
        assert_eq!(count_results(out), Some((3, 2)));
    }

    #[test]
    fn counts_colored_failed_results() {
        let out = "test result: \u{1b}[1;31mFAILED\u{1b}[0m. 3 passed; 2 failed; 0 ignored";
        assert_eq!(count_results(out), Some((3, 2)));
    }

    #[test]
    fn sums_results_across_test_binaries() {
        let out =
            "test result: ok. 2 passed; 0 failed\n\ntest result: FAILED. 1 passed; 1 failed\n";
        assert_eq!(count_results(out), Some((3, 1)));
        assert_eq!(count_passed(out), 3);
    }

    #[test]
    fn no_summary_means_no_counts() {
        assert_eq!(count_results("thread 'main' panicked at x"), None);
    }

    #[test]
    fn drops_cargo_progress_but_keeps_errors() {
        let err = "   Compiling clap1 v0.1.0 (/x)\nerror[E0599]: no function\n   Finished `test` profile\n";
        assert_eq!(without_progress(err), "error[E0599]: no function");
    }

    #[test]
    fn strips_ansi() {
        assert_eq!(strip_ansi("\u{1b}[1;31merror\u{1b}[0m: x"), "error: x");
    }

    #[test]
    fn crate_names_are_identifiers() {
        assert_eq!(crate_name("boss1-receipt"), "boss1_receipt");
    }

    /// Only the test programs count. A dependency's `target.test` is true too,
    /// but its profile is not a test profile.
    #[test]
    fn finds_the_test_programs_in_cargo_json() {
        let messages = concat!(
            r#"{"reason":"compiler-artifact","target":{"kind":["lib"],"name":"clap1","test":true},"profile":{"opt_level":"0","test":true},"executable":"/x/deps/clap1-abc"}"#,
            "\n",
            r#"{"reason":"compiler-artifact","target":{"kind":["lib"],"name":"serde","test":true},"profile":{"opt_level":"0","test":false},"executable":null}"#,
            "\n",
            r#"{"reason":"compiler-artifact","target":{"kind":["test"],"name":"api","test":true},"profile":{"test":true},"executable":"/x/deps/api-def"}"#,
            "\n",
            r#"{"reason":"build-finished","success":true}"#,
            "\n",
            "not json at all",
        );
        assert_eq!(
            test_programs(messages),
            vec![
                PathBuf::from("/x/deps/clap1-abc"),
                PathBuf::from("/x/deps/api-def")
            ]
        );
    }

    /// The shell starts a background subshell that writes a marker file a
    /// second later. When the limit passes, the whole group must stop, so the
    /// subshell never writes the marker.
    #[cfg(unix)]
    #[test]
    fn a_timeout_stops_the_programs_it_started() {
        let marker = std::env::temp_dir().join(format!("forge-group-{}", std::process::id()));
        let _ = fs::remove_file(&marker);
        let script = format!("(sleep 1; touch {}) & wait", marker.display());
        let mut command = Command::new("sh");
        command.args(["-c", &script]);
        let finished = run_limited(&mut command, Duration::from_millis(100), true).expect("runs");
        assert!(finished.is_none());
        thread::sleep(Duration::from_millis(1500));
        let survived = marker.exists();
        let _ = fs::remove_file(&marker);
        assert!(!survived, "the child kept running after the timeout");
    }

    /// A background child keeps the output pipe open after the shell has
    /// exited. That is a clean exit, so it must not wait for the child: the
    /// group is stopped, and the call returns long before the child would end.
    #[cfg(unix)]
    #[test]
    fn a_background_child_does_not_hold_a_clean_exit_open() {
        let mut command = Command::new("sh");
        command.args(["-c", "sleep 30 & echo done"]);
        let start = Instant::now();
        let finished = run_limited(&mut command, Duration::from_secs(5), true)
            .expect("runs")
            .expect("the shell exited in time");
        assert!(finished.status.success());
        assert_eq!(finished.stdout.trim(), "done");
        assert!(
            start.elapsed() < Duration::from_secs(10),
            "waited for the background child"
        );
    }
}
