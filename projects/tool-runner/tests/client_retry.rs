//! Client tests against the mock: streaming, retries, and timeouts. Retry
//! waits are short, so the tests run fast.

mod common;

use std::time::{Duration, Instant};

use common::{Reply, local_client, start, text_turn};
use serde_json::json;
use tool_runner::client::{ClientError, RetryPolicy};
use tool_runner::protocol::{Message, Request, StopReason, StreamEvent};

fn request(text: &str) -> Request {
    Request {
        messages: vec![Message::user_text(text)],
        tools: vec![],
        stream: true,
    }
}

/// Three tries, with waits of 10 ms and at most 100 ms.
fn quick_retry() -> RetryPolicy {
    RetryPolicy {
        max_attempts: 3,
        base_delay: Duration::from_millis(10),
        max_delay: Duration::from_millis(100),
    }
}

#[tokio::test]
async fn streaming_text_is_assembled_from_deltas() {
    let mock = start(vec![Reply::events(text_turn(&["Hel", "lo, ", "wörld"]))]).await;
    let client = local_client(&mock.base_url);
    let mut seen: Vec<StreamEvent> = Vec::new();

    let turn = client
        .stream_turn(&request("hi"), &mut |event: &StreamEvent| {
            seen.push(event.clone())
        })
        .await
        .unwrap();

    assert_eq!(turn.text(), "Hello, wörld");
    assert_eq!(turn.stop_reason, StopReason::EndTurn);
    // Three deltas, then done. Each one arrived as its own event.
    assert_eq!(seen.len(), 4);
}

#[tokio::test]
async fn retry_after_503_then_success() {
    let mock = start(vec![Reply::status(503), Reply::events(text_turn(&["ok"]))]).await;
    let client = local_client(&mock.base_url).with_retry(quick_retry());

    let turn = client
        .stream_turn(&request("hi"), &mut |_: &StreamEvent| {})
        .await
        .unwrap();

    assert_eq!(turn.text(), "ok");
    assert_eq!(
        mock.requests().len(),
        2,
        "one busy answer, then one good one"
    );
}

#[tokio::test]
async fn gives_up_after_the_last_attempt() {
    // The last reply repeats, so every try gets a 500.
    let mock = start(vec![Reply::status(500)]).await;
    let client = local_client(&mock.base_url).with_retry(quick_retry());

    let error = client
        .stream_turn(&request("hi"), &mut |_: &StreamEvent| {})
        .await
        .unwrap_err();

    assert!(matches!(error, ClientError::Status { code: 500 }));
    assert_eq!(mock.requests().len(), 3, "three tries in total");
}

#[tokio::test]
async fn a_400_is_not_retried() {
    let mock = start(vec![Reply::status(400)]).await;
    let client = local_client(&mock.base_url).with_retry(quick_retry());

    let error = client
        .stream_turn(&request("hi"), &mut |_: &StreamEvent| {})
        .await
        .unwrap_err();

    assert!(matches!(error, ClientError::Status { code: 400 }));
    assert_eq!(mock.requests().len(), 1, "a bad request is not sent twice");
}

#[tokio::test]
async fn retry_after_seconds_are_honored() {
    let mock = start(vec![
        Reply::status_retry_after(429, 1),
        Reply::events(text_turn(&["ok"])),
    ])
    .await;
    let policy = RetryPolicy {
        max_attempts: 2,
        base_delay: Duration::from_millis(1),
        max_delay: Duration::from_secs(2),
    };
    let client = local_client(&mock.base_url).with_retry(policy);

    let started = Instant::now();
    let turn = client
        .stream_turn(&request("hi"), &mut |_: &StreamEvent| {})
        .await
        .unwrap();

    assert_eq!(turn.text(), "ok");
    assert!(
        started.elapsed() >= Duration::from_millis(900),
        "the client waited for the server's second"
    );
}

#[tokio::test]
async fn a_retry_after_longer_than_our_cap_is_not_waited_for() {
    let mock = start(vec![
        Reply::status_retry_after(503, 3600),
        Reply::events(text_turn(&["never reached"])),
    ])
    .await;
    // The cap is 100 ms, so an hour is far too long to sleep.
    let client = local_client(&mock.base_url).with_retry(quick_retry());

    let started = Instant::now();
    let error = client
        .stream_turn(&request("hi"), &mut |_: &StreamEvent| {})
        .await
        .unwrap_err();

    assert!(matches!(error, ClientError::Status { code: 503 }));
    assert!(started.elapsed() < Duration::from_secs(2));
    assert_eq!(mock.requests().len(), 1);
}

#[tokio::test]
async fn the_per_request_timeout_fires() {
    let mock = start(vec![
        Reply::events(text_turn(&["late"])).delayed(Duration::from_secs(5)),
    ])
    .await;
    let client = local_client(&mock.base_url).with_timeout(Duration::from_millis(200));

    let started = Instant::now();
    let error = client
        .stream_turn(&request("hi"), &mut |_: &StreamEvent| {})
        .await
        .unwrap_err();

    assert!(matches!(error, ClientError::Timeout));
    assert!(started.elapsed() < Duration::from_secs(3));
}

#[tokio::test]
async fn a_stream_that_stops_before_done_is_an_error() {
    let events = vec![json!({"type": "text_delta", "text": "partial"})];
    let mock = start(vec![Reply::events(events)]).await;
    let client = local_client(&mock.base_url);

    let error = client
        .stream_turn(&request("hi"), &mut |_: &StreamEvent| {})
        .await
        .unwrap_err();

    assert!(matches!(error, ClientError::Truncated));
}

#[tokio::test]
async fn an_error_event_becomes_a_server_error() {
    let events = vec![json!({"type": "error", "message": "overloaded"})];
    let mock = start(vec![Reply::events(events)]).await;
    let client = local_client(&mock.base_url);

    let error = client
        .stream_turn(&request("hi"), &mut |_: &StreamEvent| {})
        .await
        .unwrap_err();

    match error {
        ClientError::Server(message) => assert_eq!(message, "overloaded"),
        other => panic!("expected a server error, got {other:?}"),
    }
}

#[tokio::test]
async fn one_deadline_covers_the_retries_and_their_waits() {
    // Two busy answers, each followed by a wait of about 250 ms, then a good
    // answer. The whole turn has 300 ms, so the turn must give up during the
    // wait, not after it.
    let mock = start(vec![
        Reply::status(503),
        Reply::status(503),
        Reply::events(text_turn(&["ok"])),
    ])
    .await;
    let policy = RetryPolicy {
        max_attempts: 3,
        base_delay: Duration::from_millis(250),
        max_delay: Duration::from_millis(500),
    };
    let client = local_client(&mock.base_url)
        .with_retry(policy)
        .with_timeout(Duration::from_millis(300));

    let started = Instant::now();
    let result = client.stream_turn(&request("hi"), &mut |_| {}).await;

    assert!(
        matches!(result, Err(ClientError::Timeout)),
        "got {result:?}"
    );
    assert!(
        started.elapsed() < Duration::from_millis(600),
        "the turn ran for {:?}",
        started.elapsed()
    );
}

#[tokio::test]
async fn the_key_is_sent_as_a_bearer_token() {
    let mock = start(vec![Reply::events(text_turn(&["ok"]))]).await;
    let client = local_client(&mock.base_url).with_api_key("k1");

    client
        .stream_turn(&request("hi"), &mut |_| {})
        .await
        .expect("the turn works");

    assert_eq!(mock.authorizations(), vec!["Bearer k1".to_string()]);
}

#[tokio::test]
async fn a_redirect_is_not_followed_so_the_key_stays_home() {
    // The first server redirects to the second. The key must never reach the
    // second server, so the client gives up at the 307.
    let elsewhere = start(vec![Reply::events(text_turn(&["leaked"]))]).await;
    let front = start(vec![Reply::redirect(&format!(
        "{}/v1/turn",
        elsewhere.base_url
    ))])
    .await;
    let client = local_client(&front.base_url).with_api_key("k1");

    let result = client.stream_turn(&request("hi"), &mut |_| {}).await;

    assert!(
        matches!(result, Err(ClientError::Status { code: 307 })),
        "got {result:?}"
    );
    assert!(elsewhere.requests().is_empty(), "the redirect was followed");
    assert!(
        elsewhere.authorizations().is_empty(),
        "the key was sent to another host"
    );
}
