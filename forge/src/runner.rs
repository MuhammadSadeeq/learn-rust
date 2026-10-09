//! Compiling a quest with `rustc --test` and running its tests.
//!
//! Each quest is a single file, so the Forge calls `rustc` directly instead of
//! going through Cargo: it's faster, and one broken quest can never stop
//! another from building.

use std::fs;
use std::io::{self, Read};
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::thread;
use std::time::{Duration, Instant};

/// How long a quest's tests may run before the Forge assumes an infinite loop.
const TEST_TIMEOUT: Duration = Duration::from_secs(20);

#[derive(Debug)]
pub enum Outcome {
    /// `rustc` rejected the file. `output` holds the diagnostics.
    CompileError { output: String },
    /// It compiled, but at least one test failed or panicked.
    TestsFailed { output: String },
    /// The tests did not finish in time.
    TimedOut,
    /// Compiled and every test passed.
    Passed { tests: usize, warnings: String },
}

impl Outcome {
    pub fn passed(&self) -> bool {
        matches!(self, Outcome::Passed { .. })
    }
}

/// Compiles `file` as a test binary and runs it.
pub fn run(root: &Path, file: &Path, name: &str, color: bool) -> io::Result<Outcome> {
    let out_dir = root.join("target").join("forge");
    fs::create_dir_all(&out_dir)?;
    let bin = binary_path(&out_dir, name);

    let compile = Command::new(rustc())
        .args(["--edition", "2024", "--test", "--crate-name"])
        .arg(crate_name(name))
        .args(["--color", if color { "always" } else { "never" }])
        .arg("-o")
        .arg(&bin)
        // A path relative to the repo root keeps error messages short:
        // `--> quests/06_ownership/move1.rs:16:17`.
        .arg(file.strip_prefix(root).unwrap_or(file))
        .current_dir(root)
        .stdin(Stdio::null())
        .output()
        .map_err(|e| {
            if e.kind() == io::ErrorKind::NotFound {
                io::Error::new(e.kind(), "`rustc` was not found. Install Rust from https://rustup.rs and open a new terminal.")
            } else {
                e
            }
        })?;

    let diagnostics = String::from_utf8_lossy(&compile.stderr).into_owned();
    if !compile.status.success() {
        return Ok(Outcome::CompileError {
            output: diagnostics,
        });
    }

    let mut child = Command::new(&bin)
        .args([
            "--test-threads",
            "1",
            "--color",
            if color { "always" } else { "never" },
        ])
        .env("RUST_BACKTRACE", "0")
        .current_dir(root)
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()?;

    // Read both pipes on helper threads so a chatty test can't block on a
    // full pipe while we wait for it.
    let mut stdout = child.stdout.take().expect("piped stdout");
    let mut stderr = child.stderr.take().expect("piped stderr");
    let out_reader = thread::spawn(move || {
        let mut s = String::new();
        let _ = stdout.read_to_string(&mut s);
        s
    });
    let err_reader = thread::spawn(move || {
        let mut s = String::new();
        let _ = stderr.read_to_string(&mut s);
        s
    });

    let started = Instant::now();
    let status = loop {
        if let Some(status) = child.try_wait()? {
            break Some(status);
        }
        if started.elapsed() > TEST_TIMEOUT {
            let _ = child.kill();
            let _ = child.wait();
            break None;
        }
        thread::sleep(Duration::from_millis(20));
    };
    let stdout = out_reader.join().unwrap_or_default();
    let stderr = err_reader.join().unwrap_or_default();

    match status {
        None => Ok(Outcome::TimedOut),
        Some(s) if s.success() => Ok(Outcome::Passed {
            tests: count_passed(&stdout),
            warnings: diagnostics,
        }),
        Some(_) => Ok(Outcome::TestsFailed {
            output: format!("{stdout}{stderr}"),
        }),
    }
}

fn rustc() -> PathBuf {
    std::env::var_os("RUSTC")
        .map(PathBuf::from)
        .unwrap_or_else(|| PathBuf::from("rustc"))
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

/// Reads "test result: ok. 3 passed; ..." from libtest's output.
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
    fn strips_ansi() {
        assert_eq!(strip_ansi("\u{1b}[1;31merror\u{1b}[0m: x"), "error: x");
    }

    #[test]
    fn crate_names_are_identifiers() {
        assert_eq!(crate_name("boss1-receipt"), "boss1_receipt");
    }
}
