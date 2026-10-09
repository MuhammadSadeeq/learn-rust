//! Agent loop tests, run against the mock. Each one checks a rule from
//! `src/agent.rs`. The model is scripted, so the tests need no network.

mod common;

use std::path::PathBuf;
use std::sync::Arc;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::time::{Duration, Instant};

use common::{Reply, local_client, start, text_turn, tool_turn};
use serde_json::{Value, json};
use tokio_util::sync::CancellationToken;
use tool_runner::agent::{Agent, AgentConfig, AgentError, Answer};
use tool_runner::protocol::StopReason;
use tool_runner::tools::calculator::Calculator;
use tool_runner::tools::read_file::ReadFile;
use tool_runner::tools::run_command::RunCommand;
use tool_runner::tools::{Registry, Tool, ToolFuture};

/// A folder for this test's files, under cargo's target directory. It is
/// emptied first, so each run starts clean.
fn fixture_dir(name: &str) -> PathBuf {
    let dir = PathBuf::from(env!("CARGO_TARGET_TMPDIR")).join(name);
    let _ = std::fs::remove_dir_all(&dir);
    std::fs::create_dir_all(&dir).expect("create the fixture folder");
    dir
}

fn config(max_turns: u32, parallel: usize) -> AgentConfig {
    AgentConfig {
        max_turns,
        max_parallel_tools: parallel,
    }
}

/// Runs one prompt and returns the answer, plus the text streamed to the
/// callback.
async fn run(agent: &Agent, prompt: &str) -> Result<(Answer, String), AgentError> {
    let cancel = CancellationToken::new();
    let mut streamed = String::new();
    let answer = agent
        .run(prompt, &cancel, &mut |piece: &str| streamed.push_str(piece))
        .await?;
    Ok((answer, streamed))
}

#[tokio::test]
async fn full_tool_loop_calls_the_tool_and_answers() {
    let mock = start(vec![
        Reply::events(tool_turn(
            "call_1",
            "calculator",
            json!({"a": 6, "b": 7, "op": "mul"}),
        )),
        Reply::events(text_turn(&["6 times 7 is 42."])),
    ])
    .await;
    let mut registry = Registry::new();
    registry.register(Calculator);
    let agent = Agent::new(local_client(&mock.base_url), registry, config(5, 2));

    let (answer, streamed) = run(&agent, "What is 6 times 7?").await.unwrap();

    assert_eq!(answer.text, "6 times 7 is 42.");
    assert_eq!(answer.turns, 2);
    assert_eq!(streamed, "6 times 7 is 42.");

    // The second request carries the tool's answer, tied to the same id.
    let requests = mock.requests();
    assert_eq!(requests.len(), 2);
    assert_eq!(
        requests[1]["messages"][2]["content"][0],
        json!({"type": "tool_result", "tool_use_id": "call_1", "content": "42", "is_error": false})
    );
    // The first request advertised the tool with its schema.
    assert_eq!(requests[0]["tools"][0]["name"], "calculator");
}

#[tokio::test]
async fn a_refused_tool_call_goes_back_to_the_model_as_an_error() {
    let root = fixture_dir("agent_refused");
    let mock = start(vec![
        Reply::events(tool_turn(
            "call_9",
            "read_file",
            json!({"path": "../secret.txt"}),
        )),
        Reply::events(text_turn(&["I cannot read that file."])),
    ])
    .await;
    let mut registry = Registry::new();
    registry.register(ReadFile::new(&root).unwrap());
    let agent = Agent::new(local_client(&mock.base_url), registry, config(5, 2));

    let (answer, _) = run(&agent, "Read the secret").await.unwrap();

    // The loop did not crash. The model saw the refusal and answered.
    assert_eq!(answer.text, "I cannot read that file.");
    let result = &mock.requests()[1]["messages"][2]["content"][0];
    assert_eq!(result["is_error"], true);
    assert!(result["content"].as_str().unwrap().contains("'..'"));
}

#[tokio::test]
async fn an_unknown_tool_name_is_an_error_result() {
    let mock = start(vec![
        Reply::events(tool_turn("call_3", "teleport", json!({}))),
        Reply::events(text_turn(&["There is no such tool."])),
    ])
    .await;
    let agent = Agent::new(local_client(&mock.base_url), Registry::new(), config(5, 2));

    let (answer, _) = run(&agent, "Teleport me").await.unwrap();

    assert_eq!(answer.text, "There is no such tool.");
    let result = &mock.requests()[1]["messages"][2]["content"][0];
    assert_eq!(result["is_error"], true);
}

#[tokio::test]
async fn max_turns_stops_a_runaway_model() {
    // Every reply asks for the calculator again. The last reply repeats, so the
    // model never finishes.
    let mock = start(vec![Reply::events(tool_turn(
        "call_x",
        "calculator",
        json!({"a": 1, "b": 1, "op": "add"}),
    ))])
    .await;
    let mut registry = Registry::new();
    registry.register(Calculator);
    let agent = Agent::new(local_client(&mock.base_url), registry, config(3, 2));

    let error = run(&agent, "loop forever").await.unwrap_err();

    assert!(matches!(error, AgentError::MaxTurns(3)));
    assert_eq!(mock.requests().len(), 3, "exactly three model turns");
}

#[tokio::test]
async fn cancellation_stops_the_loop() {
    // The model would answer after five seconds. We cancel after 50 ms.
    let mock = start(vec![
        Reply::events(text_turn(&["too late"])).delayed(Duration::from_secs(5)),
    ])
    .await;
    let agent = Agent::new(local_client(&mock.base_url), Registry::new(), config(5, 2));
    let cancel = CancellationToken::new();
    let trigger = cancel.clone();
    tokio::spawn(async move {
        tokio::time::sleep(Duration::from_millis(50)).await;
        trigger.cancel();
    });

    let started = Instant::now();
    let error = agent
        .run("hello", &cancel, &mut |_: &str| {})
        .await
        .unwrap_err();

    assert!(matches!(error, AgentError::Cancelled));
    assert!(
        started.elapsed() < Duration::from_secs(2),
        "the run should stop long before the 5 second reply"
    );
}

#[tokio::test]
async fn max_tokens_returns_the_partial_answer_with_its_reason() {
    let events = vec![
        json!({"type": "text_delta", "text": "The start of an answer"}),
        json!({"type": "done", "stop_reason": "max_tokens"}),
    ];
    let mock = start(vec![Reply::events(events)]).await;
    let agent = Agent::new(local_client(&mock.base_url), Registry::new(), config(5, 2));

    let (answer, _) = run(&agent, "long question").await.unwrap();

    assert_eq!(answer.text, "The start of an answer");
    assert_eq!(answer.stop_reason, StopReason::MaxTokens);
}

/// A tool that holds its slot for 100 ms and records how many calls overlap.
struct SlowTool {
    in_flight: Arc<AtomicUsize>,
    high_water: Arc<AtomicUsize>,
}

impl Tool for SlowTool {
    fn name(&self) -> &str {
        "slow"
    }

    fn description(&self) -> &str {
        "Waits 100 ms, then returns its number."
    }

    fn input_schema(&self) -> Value {
        json!({"type": "object", "properties": {"n": {"type": "integer"}}, "required": ["n"]})
    }

    fn call<'a>(&'a self, input: Value) -> ToolFuture<'a> {
        Box::pin(async move {
            let now = self.in_flight.fetch_add(1, Ordering::SeqCst) + 1;
            self.high_water.fetch_max(now, Ordering::SeqCst);
            tokio::time::sleep(Duration::from_millis(100)).await;
            self.in_flight.fetch_sub(1, Ordering::SeqCst);
            Ok(input["n"].to_string())
        })
    }
}

#[tokio::test]
async fn the_parallel_limit_is_honored() {
    // One reply asks for five calls at once. Then the model answers.
    let mut events: Vec<Value> = (0..5)
        .map(|n| json!({"type": "tool_use", "id": format!("call_{n}"), "name": "slow", "input": {"n": n}}))
        .collect();
    events.push(json!({"type": "done", "stop_reason": "tool_use"}));
    let mock = start(vec![
        Reply::events(events),
        Reply::events(text_turn(&["all done"])),
    ])
    .await;

    let in_flight = Arc::new(AtomicUsize::new(0));
    let high_water = Arc::new(AtomicUsize::new(0));
    let mut registry = Registry::new();
    registry.register(SlowTool {
        in_flight: in_flight.clone(),
        high_water: high_water.clone(),
    });
    let agent = Agent::new(local_client(&mock.base_url), registry, config(5, 2));

    let (answer, _) = run(&agent, "go").await.unwrap();

    assert_eq!(answer.text, "all done");
    assert_eq!(
        high_water.load(Ordering::SeqCst),
        2,
        "never more than two at once, and two did overlap"
    );

    // The results come back in the same order as the calls.
    let results = mock.requests()[1]["messages"][2]["content"].clone();
    let ids: Vec<&str> = results
        .as_array()
        .unwrap()
        .iter()
        .map(|result| result["tool_use_id"].as_str().unwrap())
        .collect();
    assert_eq!(ids, ["call_0", "call_1", "call_2", "call_3", "call_4"]);
    let contents: Vec<&str> = results
        .as_array()
        .unwrap()
        .iter()
        .map(|result| result["content"].as_str().unwrap())
        .collect();
    assert_eq!(contents, ["0", "1", "2", "3", "4"]);
}

/// A web handler runs the agent on its own task, so the future must be Send.
#[tokio::test]
async fn the_agent_can_run_in_a_spawned_task() {
    let mock = start(vec![Reply::events(text_turn(&["from a task"]))]).await;
    let agent = Agent::new(local_client(&mock.base_url), Registry::new(), config(5, 2));

    let (answer, _) = tokio::spawn(async move { run(&agent, "go").await })
        .await
        .expect("the task finishes")
        .expect("the run succeeds");

    assert_eq!(answer.text, "from a task");
}

#[tokio::test]
async fn a_zero_parallel_limit_still_runs_the_tools() {
    // A limit of 0 would make every tool call wait forever. The agent treats
    // it as 1, so the read finishes.
    let root = fixture_dir("zero_parallel");
    std::fs::write(root.join("note.txt"), "hello").unwrap();
    let mut registry = Registry::new();
    registry.register(ReadFile::new(&root).unwrap());
    let mock = start(vec![
        Reply::events(tool_turn("c1", "read_file", json!({"path": "note.txt"}))),
        Reply::events(text_turn(&["read it"])),
    ])
    .await;
    let agent = Agent::new(local_client(&mock.base_url), registry, config(5, 0));

    let (answer, _) = tokio::time::timeout(Duration::from_secs(5), run(&agent, "go"))
        .await
        .expect("the run finishes")
        .unwrap();

    assert_eq!(answer.text, "read it");
}

#[tokio::test]
async fn cancelling_stops_the_program_a_tool_started() {
    // The program would write its file one second after it starts. The cancel
    // comes first, so the program must be stopped before it writes.
    let root = fixture_dir("cancel_tool");
    let mut registry = Registry::new();
    registry.register(RunCommand::new(&root, vec!["sh".to_string()]).unwrap());
    let mock = start(vec![Reply::events(tool_turn(
        "c1",
        "run_command",
        json!({"program": "sh", "args": ["-c", "sleep 1; touch finished.txt"]}),
    ))])
    .await;
    let agent = Agent::new(local_client(&mock.base_url), registry, config(5, 2));
    let cancel = CancellationToken::new();
    let stopper = cancel.clone();
    tokio::spawn(async move {
        tokio::time::sleep(Duration::from_millis(300)).await;
        stopper.cancel();
    });

    let result = agent.run("go", &cancel, &mut |_: &str| {}).await;

    assert!(
        matches!(result, Err(AgentError::Cancelled)),
        "the run should be cancelled"
    );
    tokio::time::sleep(Duration::from_millis(1500)).await;
    assert!(
        !root.join("finished.txt").exists(),
        "the program kept running after the cancel"
    );
}
