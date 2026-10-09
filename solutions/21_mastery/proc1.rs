// ============================================================================
//  QUEST proc1 · Run a program with a timeout             Chapter 21 · Mastery
// ----------------------------------------------------------------------------
//  Running another program is a request to the operating system: start it,
//  wait for it, read what it printed. A program can also hang, so the caller
//  needs a deadline.
//
//  Write run_with_timeout(cmd, args, timeout) so that it:
//    - starts the program with its stdout and stderr piped (Stdio::piped());
//    - returns RunError::Spawn if the program cannot start;
//    - checks the child with try_wait() in a loop. try_wait() returns Ok(None)
//      while the child runs, and Ok(Some(status)) when it has exited. Sleep
//      a few milliseconds between checks, so the loop does not spin;
//    - when the deadline passes, kills the child, waits for it, and returns
//      RunError::TimedOut;
//    - when the child exits in time, reads its stdout and stderr and returns
//      them in an Output.
//
//  Reading the pipes after the child exits is fine for small output. A program
//  that prints more than a pipe holds (about 64 KB) waits for the reader, and
//  the reader waits for it. The deadline ends that wait. Read on a thread if
//  you need large output. The tests use `rustc` and `sleep`. The `sleep` test
//  needs a Unix-like system: on Windows it fails with a Spawn error, which is
//  expected there. Chapter 21 covers Command, Stdio, timeout and kill.
//  Don't edit the tests.
//
//  cargo forge          check your work (re-runs every time you save)
//  cargo forge hint     a nudge in the right direction
// ============================================================================

use std::io::{self, Read};
use std::process::{Command, Output, Stdio};
use std::thread;
use std::time::{Duration, Instant};

#[derive(Debug)]
pub enum RunError {
    /// The program could not start, for example because it does not exist.
    Spawn(io::Error),
    /// The program was still running at the deadline. It has been killed.
    TimedOut,
    /// Checking the child or reading its output failed.
    Io(io::Error),
}

pub fn run_with_timeout(cmd: &str, args: &[&str], timeout: Duration) -> Result<Output, RunError> {
    let mut child = Command::new(cmd)
        .args(args)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(RunError::Spawn)?;

    let started = Instant::now();
    loop {
        match child.try_wait() {
            Ok(Some(status)) => {
                // The child has exited, so its output is complete.
                let mut stdout = Vec::new();
                let mut stderr = Vec::new();
                if let Some(mut pipe) = child.stdout.take() {
                    pipe.read_to_end(&mut stdout).map_err(RunError::Io)?;
                }
                if let Some(mut pipe) = child.stderr.take() {
                    pipe.read_to_end(&mut stderr).map_err(RunError::Io)?;
                }
                return Ok(Output {
                    status,
                    stdout,
                    stderr,
                });
            }
            Ok(None) if started.elapsed() >= timeout => {
                let _ = child.kill();
                let _ = child.wait();
                return Err(RunError::TimedOut);
            }
            Ok(None) => thread::sleep(Duration::from_millis(10)),
            Err(err) => return Err(RunError::Io(err)),
        }
    }
}

fn main() {
    match run_with_timeout("rustc", &["--version"], Duration::from_secs(10)) {
        Ok(out) => print!("{}", String::from_utf8_lossy(&out.stdout)),
        Err(err) => println!("could not run it: {err:?}"),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::Instant;

    #[test]
    fn captures_the_output_of_a_program() {
        let out = run_with_timeout("rustc", &["--version"], Duration::from_secs(60))
            .expect("rustc runs");
        assert!(out.status.success());
        assert!(String::from_utf8_lossy(&out.stdout).starts_with("rustc "));
    }

    #[test]
    fn a_failing_program_reports_its_status_and_stderr() {
        let out = run_with_timeout("rustc", &["--no-such-flag"], Duration::from_secs(60))
            .expect("rustc runs");
        assert!(!out.status.success());
        assert!(!out.stderr.is_empty());
    }

    #[test]
    fn a_missing_program_is_a_spawn_error() {
        let result = run_with_timeout("oxidize-no-such-program", &[], Duration::from_secs(5));
        assert!(matches!(result, Err(RunError::Spawn(_))), "got {result:?}");
    }

    #[test]
    fn a_long_program_is_killed_at_the_timeout() {
        let start = Instant::now();
        let result = run_with_timeout("sleep", &["5"], Duration::from_millis(200));
        assert!(matches!(result, Err(RunError::TimedOut)), "got {result:?}");
        // It stopped at the deadline, long before the five seconds were up.
        assert!(start.elapsed() < Duration::from_secs(4));
    }
}
