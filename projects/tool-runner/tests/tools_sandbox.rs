//! Tool safety tests. Most of them call the tools directly, with no model,
//! so each rule is checked on its own.
//!
//! The `run_command` tests and the symlink test are Unix only. They start
//! real programs such as `echo` and `sleep`.

use std::path::PathBuf;
use std::time::{Duration, Instant};

use serde_json::json;
use tool_runner::tools::read_file::{MAX_BYTES, ReadFile};
use tool_runner::tools::run_command::RunCommand;
use tool_runner::tools::{Tool, ToolError};

/// A folder for this test's files, under cargo's target directory. It is
/// emptied first, so each run starts clean.
fn fixture_dir(name: &str) -> PathBuf {
    let dir = PathBuf::from(env!("CARGO_TARGET_TMPDIR")).join(name);
    let _ = std::fs::remove_dir_all(&dir);
    std::fs::create_dir_all(&dir).expect("create the fixture folder");
    dir
}

#[cfg(unix)]
fn allow(names: &[&str]) -> Vec<String> {
    names.iter().map(|name| name.to_string()).collect()
}

#[tokio::test]
async fn read_file_reads_a_file_inside_the_sandbox() {
    let root = fixture_dir("read_inside");
    std::fs::create_dir_all(root.join("notes")).unwrap();
    std::fs::write(root.join("notes/todo.txt"), "buy milk").unwrap();
    let tool = ReadFile::new(&root).unwrap();

    let text = tool.call(json!({"path": "notes/todo.txt"})).await.unwrap();

    assert_eq!(text, "buy milk");
}

#[tokio::test]
async fn read_file_rejects_parent_directory_escapes() {
    let root = fixture_dir("read_parent");
    let tool = ReadFile::new(&root).unwrap();

    for path in ["../outside.txt", "notes/../../outside.txt"] {
        let error = tool.call(json!({"path": path})).await.unwrap_err();
        assert!(
            matches!(error, ToolError::Denied(_)),
            "{path} should be denied, got {error:?}"
        );
    }
}

#[tokio::test]
async fn read_file_rejects_absolute_paths() {
    let root = fixture_dir("read_absolute");
    let tool = ReadFile::new(&root).unwrap();

    let error = tool.call(json!({"path": "/etc/passwd"})).await.unwrap_err();

    assert!(matches!(error, ToolError::Denied(_)));
}

#[cfg(unix)]
#[tokio::test]
async fn read_file_rejects_a_symlink_that_points_outside() {
    // Layout: <base>/outside.txt is outside the sandbox. The sandbox is
    // <base>/sandbox, and it holds a link to the outside file.
    let base = fixture_dir("read_symlink");
    std::fs::write(base.join("outside.txt"), "private").unwrap();
    let root = base.join("sandbox");
    std::fs::create_dir_all(&root).unwrap();
    std::os::unix::fs::symlink(base.join("outside.txt"), root.join("link.txt")).unwrap();
    let tool = ReadFile::new(&root).unwrap();

    let error = tool.call(json!({"path": "link.txt"})).await.unwrap_err();

    assert!(
        matches!(error, ToolError::Denied(_)),
        "a link out of the sandbox should be denied, got {error:?}"
    );
}

#[tokio::test]
async fn read_file_refuses_files_over_the_cap() {
    let root = fixture_dir("read_big");
    let big = "a".repeat(MAX_BYTES as usize + 10);
    std::fs::write(root.join("big.txt"), big).unwrap();
    let tool = ReadFile::new(&root).unwrap();

    let error = tool.call(json!({"path": "big.txt"})).await.unwrap_err();

    match error {
        ToolError::Failed(message) => assert!(message.contains("larger than 64 KiB")),
        other => panic!("expected a failure, got {other:?}"),
    }
}

#[tokio::test]
async fn read_file_reports_a_missing_file() {
    let root = fixture_dir("read_missing");
    let tool = ReadFile::new(&root).unwrap();

    let error = tool.call(json!({"path": "nope.txt"})).await.unwrap_err();

    assert!(matches!(error, ToolError::Failed(_)));
}

#[cfg(unix)]
#[tokio::test]
async fn run_command_runs_an_allowed_program() {
    let root = fixture_dir("run_echo");
    let tool = RunCommand::new(&root, allow(&["echo"])).unwrap();

    let report = tool
        .call(json!({"program": "echo", "args": ["hi", "there"]}))
        .await
        .unwrap();

    assert!(report.contains("exit code: 0"), "report was: {report}");
    assert!(report.contains("hi there"), "report was: {report}");
}

#[cfg(unix)]
#[tokio::test]
async fn run_command_refuses_a_program_that_is_not_on_the_list() {
    let root = fixture_dir("run_not_listed");
    let tool = RunCommand::new(&root, allow(&["echo"])).unwrap();

    let error = tool
        .call(json!({"program": "sh", "args": ["-c", "echo hacked"]}))
        .await
        .unwrap_err();

    assert!(matches!(error, ToolError::Denied(_)));
}

#[cfg(unix)]
#[tokio::test]
async fn run_command_matches_the_exact_name_not_a_path() {
    let root = fixture_dir("run_path");
    let tool = RunCommand::new(&root, allow(&["echo"])).unwrap();

    // The same program under a different name is still refused.
    let error = tool
        .call(json!({"program": "/bin/echo", "args": ["hi"]}))
        .await
        .unwrap_err();

    assert!(matches!(error, ToolError::Denied(_)));
}

#[cfg(unix)]
#[tokio::test]
async fn run_command_refuses_arguments_that_point_outside() {
    let root = fixture_dir("run_args");
    let tool = RunCommand::new(&root, allow(&["cat"])).unwrap();

    let absolute = tool
        .call(json!({"program": "cat", "args": ["/etc/passwd"]}))
        .await
        .unwrap_err();
    let parent = tool
        .call(json!({"program": "cat", "args": ["../secret.txt"]}))
        .await
        .unwrap_err();

    assert!(matches!(absolute, ToolError::Denied(_)));
    assert!(matches!(parent, ToolError::Denied(_)));
}

#[cfg(unix)]
#[tokio::test]
async fn run_command_refuses_a_symlink_that_points_outside() {
    // `cat` would follow the link and print the outside file. The name
    // `link.txt` looks harmless, so the check must resolve the link.
    let base = fixture_dir("run_symlink");
    std::fs::write(base.join("outside.txt"), "private").unwrap();
    let root = base.join("sandbox");
    std::fs::create_dir_all(&root).unwrap();
    std::os::unix::fs::symlink(base.join("outside.txt"), root.join("link.txt")).unwrap();
    let tool = RunCommand::new(&root, allow(&["cat"])).unwrap();

    let error = tool
        .call(json!({"program": "cat", "args": ["link.txt"]}))
        .await
        .unwrap_err();

    assert!(
        matches!(error, ToolError::Denied(_)),
        "a link out of the sandbox should be denied, got {error:?}"
    );
}

#[cfg(unix)]
#[tokio::test]
async fn run_command_does_not_use_a_shell() {
    let root = fixture_dir("run_no_shell");
    let tool = RunCommand::new(&root, allow(&["echo"])).unwrap();

    // With a shell, `$HOME` would expand and `;` would start a second command.
    // Here both are plain characters, and echo prints them as they are.
    let report = tool
        .call(json!({"program": "echo", "args": ["$HOME; echo hacked"]}))
        .await
        .unwrap();

    assert!(
        report.contains("$HOME; echo hacked"),
        "report was: {report}"
    );
}

#[cfg(unix)]
#[tokio::test]
async fn run_command_clears_the_environment() {
    let root = fixture_dir("run_env");
    let tool = RunCommand::new(&root, allow(&["printenv"])).unwrap();

    let report = tool.call(json!({"program": "printenv"})).await.unwrap();

    assert!(
        report.contains("PATH=/usr/bin:/bin"),
        "report was: {report}"
    );
    assert!(
        !report.contains("HOME="),
        "our environment leaked: {report}"
    );
}

#[cfg(unix)]
#[tokio::test]
async fn run_command_stops_a_program_that_runs_too_long() {
    let root = fixture_dir("run_timeout");
    let tool = RunCommand::new(&root, allow(&["sleep"]))
        .unwrap()
        .with_timeout(Duration::from_millis(200));

    let started = Instant::now();
    let error = tool
        .call(json!({"program": "sleep", "args": ["30"]}))
        .await
        .unwrap_err();

    match error {
        ToolError::Failed(message) => assert!(message.contains("timed out"), "{message}"),
        other => panic!("expected a timeout, got {other:?}"),
    }
    assert!(
        started.elapsed() < Duration::from_secs(5),
        "the program should be stopped, not waited for"
    );
}

#[cfg(unix)]
#[tokio::test]
async fn run_command_caps_the_output_and_stops_a_noisy_program() {
    // `yes` prints forever. The cap stops it long before the timeout.
    let root = fixture_dir("run_cap");
    let tool = RunCommand::new(&root, allow(&["yes"]))
        .unwrap()
        .with_timeout(Duration::from_secs(5));

    let started = Instant::now();
    let report = tool.call(json!({"program": "yes"})).await.unwrap();

    assert!(
        report.contains("[stdout cut at 16384 bytes]"),
        "report was: {report}"
    );
    assert!(
        started.elapsed() < Duration::from_secs(4),
        "the program should be stopped at the cap"
    );
}
