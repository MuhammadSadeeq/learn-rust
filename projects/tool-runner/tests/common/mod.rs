//! The mock model server. It plays a script. Each request gets the next reply,
//! and the last reply repeats once the script runs out.
//!
//! It speaks the course protocol on `POST /v1/turn`. It streams each reply as
//! SSE, and it cuts the bytes into 7-byte pieces. So the client sees events
//! split in odd places, as it would on a real network.
//!
//! Tests start it with `start`. `examples/mock_server.rs` runs the demo script
//! with `serve_demo`, so you can try the CLI by hand.
//!
//! Laravel counterpart: `Http::fake()`, which answers outgoing requests with
//! canned responses and lets a test look at what was sent.

// Each test file and the example use a different part of this module.
#![allow(dead_code)]

use std::convert::Infallible;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::{Arc, Mutex};
use std::time::Duration;

use axum::Json;
use axum::Router;
use axum::body::Body;
use axum::extract::State;
use axum::http::{HeaderMap, StatusCode, header};
use axum::response::{IntoResponse, Response};
use axum::routing::post;
use serde_json::{Value, json};
use tokio::net::TcpListener;
use tool_runner::client::Client;

/// One scripted reply: how long to wait, then what to send.
#[derive(Clone)]
pub struct Reply {
    delay: Duration,
    outcome: Outcome,
}

#[derive(Clone)]
enum Outcome {
    Events(Vec<Value>),
    Status { code: u16, retry_after: Option<u64> },
    Redirect(String),
}

impl Reply {
    /// A 200 with these events, sent as an SSE stream.
    pub fn events(events: Vec<Value>) -> Self {
        Reply {
            delay: Duration::ZERO,
            outcome: Outcome::Events(events),
        }
    }

    /// An error status with an empty body.
    pub fn status(code: u16) -> Self {
        Reply {
            delay: Duration::ZERO,
            outcome: Outcome::Status {
                code,
                retry_after: None,
            },
        }
    }

    /// An error status with a `Retry-After` header, in seconds.
    pub fn status_retry_after(code: u16, seconds: u64) -> Self {
        Reply {
            delay: Duration::ZERO,
            outcome: Outcome::Status {
                code,
                retry_after: Some(seconds),
            },
        }
    }

    /// A 307 redirect to another URL. The client must not follow it.
    pub fn redirect(to: &str) -> Self {
        Reply {
            delay: Duration::ZERO,
            outcome: Outcome::Redirect(to.to_string()),
        }
    }

    /// Waits this long before answering. Use it for timeouts and cancellation.
    pub fn delayed(mut self, delay: Duration) -> Self {
        self.delay = delay;
        self
    }
}

/// Events for a text answer: one `text_delta` per piece, then `done` with
/// `end_turn`.
pub fn text_turn(pieces: &[&str]) -> Vec<Value> {
    let mut events: Vec<Value> = pieces
        .iter()
        .map(|piece| json!({"type": "text_delta", "text": piece}))
        .collect();
    events.push(json!({"type": "done", "stop_reason": "end_turn"}));
    events
}

/// Events for a turn where the model asks for one tool and stops with
/// `tool_use`.
pub fn tool_turn(id: &str, name: &str, input: Value) -> Vec<Value> {
    vec![
        json!({"type": "tool_use", "id": id, "name": name, "input": input}),
        json!({"type": "done", "stop_reason": "tool_use"}),
    ]
}

/// The demo script for `examples/mock_server.rs`: one calculator call, then
/// the answer.
pub fn demo_replies() -> Vec<Reply> {
    vec![
        Reply::events(tool_turn(
            "call_1",
            "calculator",
            json!({"a": 6, "b": 7, "op": "mul"}),
        )),
        Reply::events(text_turn(&["6 times 7 ", "is 42."])),
    ]
}

/// State shared by the handler and the test that started the server.
struct Shared {
    replies: Vec<Reply>,
    served: AtomicUsize,
    requests: Mutex<Vec<Value>>,
    authorizations: Mutex<Vec<String>>,
}

impl Shared {
    fn new(replies: Vec<Reply>) -> Self {
        Shared {
            replies,
            served: AtomicUsize::new(0),
            requests: Mutex::new(Vec::new()),
            authorizations: Mutex::new(Vec::new()),
        }
    }
}

/// A running mock. The test runtime stops the server task when the test ends.
pub struct Mock {
    pub base_url: String,
    shared: Arc<Shared>,
}

impl Mock {
    /// Every request body the server received, oldest first.
    pub fn requests(&self) -> Vec<Value> {
        self.shared.requests.lock().unwrap().clone()
    }

    /// The Authorization header of each request, oldest first ("" when absent).
    pub fn authorizations(&self) -> Vec<String> {
        self.shared.authorizations.lock().unwrap().clone()
    }
}

/// A client for the local mock. It builds its own reqwest client with
/// `.no_proxy()`, so a proxy on this machine never sees the request. The
/// production client, `Client::new`, still honors the system proxy.
pub fn local_client(base_url: &str) -> Client {
    let http = reqwest::Client::builder()
        .no_proxy()
        .redirect(reqwest::redirect::Policy::none())
        .build()
        .expect("the test client should start");
    Client::with_http(base_url, http)
}

/// Starts the mock on a free port on 127.0.0.1.
pub async fn start(replies: Vec<Reply>) -> Mock {
    assert!(!replies.is_empty(), "a mock needs at least one reply");
    let listener = TcpListener::bind("127.0.0.1:0")
        .await
        .expect("bind a free port");
    let base_url = format!("http://{}", listener.local_addr().expect("a local address"));
    let shared = Arc::new(Shared::new(replies));
    let app = router(shared.clone());
    tokio::spawn(async move { axum::serve(listener, app).await.expect("mock server") });
    Mock { base_url, shared }
}

/// Runs the demo script until the process stops. Used by the example.
pub async fn serve_demo(addr: &str) {
    let listener = TcpListener::bind(addr)
        .await
        .expect("bind the mock address");
    println!(
        "mock model server on http://{}",
        listener.local_addr().expect("a local address")
    );
    println!("it asks for the calculator once, then answers. Press Ctrl+C to stop.");
    let shared = Arc::new(Shared::new(demo_replies()));
    axum::serve(listener, router(shared))
        .await
        .expect("mock server");
}

fn router(shared: Arc<Shared>) -> Router {
    Router::new()
        .route("/v1/turn", post(turn))
        .with_state(shared)
}

async fn turn(
    State(shared): State<Arc<Shared>>,
    headers: HeaderMap,
    Json(body): Json<Value>,
) -> Response {
    let authorization = headers
        .get(header::AUTHORIZATION)
        .and_then(|value| value.to_str().ok())
        .unwrap_or("")
        .to_string();
    shared.authorizations.lock().unwrap().push(authorization);
    // The client always streams. A request that does not ask for a stream is
    // a bug in the client, so the mock says so.
    let wants_stream = body["stream"] == json!(true);
    shared.requests.lock().unwrap().push(body);

    // The script moves forward one reply per request. Past the end, the last
    // reply repeats.
    let index = shared.served.fetch_add(1, Ordering::SeqCst);
    let reply = shared.replies[index.min(shared.replies.len() - 1)].clone();
    if !reply.delay.is_zero() {
        tokio::time::sleep(reply.delay).await;
    }
    if !wants_stream {
        return (
            StatusCode::BAD_REQUEST,
            "this mock only streams: send \"stream\": true",
        )
            .into_response();
    }

    match reply.outcome {
        Outcome::Events(events) => sse_response(&events),
        Outcome::Redirect(to) => {
            let mut response = StatusCode::TEMPORARY_REDIRECT.into_response();
            response.headers_mut().insert(
                header::LOCATION,
                to.parse().expect("a valid location header"),
            );
            response
        }
        Outcome::Status { code, retry_after } => {
            let mut response = StatusCode::from_u16(code)
                .expect("a valid status code")
                .into_response();
            if let Some(seconds) = retry_after {
                response.headers_mut().insert(
                    header::RETRY_AFTER,
                    seconds
                        .to_string()
                        .parse()
                        .expect("digits are a header value"),
                );
            }
            response
        }
    }
}

/// Renders events as an SSE body, then cuts it into 7-byte pieces. The cuts
/// land in the middle of lines and in the middle of characters.
fn sse_response(events: &[Value]) -> Response {
    let text: String = events
        .iter()
        .map(|event| format!("data: {event}\n\n"))
        .collect();
    let pieces: Vec<Result<Vec<u8>, Infallible>> = text
        .as_bytes()
        .chunks(7)
        .map(|piece| Ok(piece.to_vec()))
        .collect();
    Response::builder()
        .status(StatusCode::OK)
        .header(header::CONTENT_TYPE, "text/event-stream")
        .body(Body::from_stream(futures::stream::iter(pieces)))
        .expect("a valid response")
}
