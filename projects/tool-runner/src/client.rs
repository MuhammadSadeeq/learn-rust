//! The HTTP client. It sends one turn, reads the event stream, and retries
//! when the server is busy.
//!
//! Laravel counterpart: `Http::withToken($key)->timeout(60)->retry(3, 500)`.
//! The shape is close. The rules are the ones you would write yourself: retry
//! only what is safe to send again, and never retry a stream after it has
//! started, because the user would see the same text twice.

use std::time::Duration;

use futures::StreamExt;
use reqwest::StatusCode;
use serde_json::Value;

use crate::protocol::{ContentBlock, Request, StopReason, StreamEvent};
use crate::provider;
use crate::sse::SseParser;

/// What one streamed turn produced.
#[derive(Debug, Clone, PartialEq)]
pub struct Turn {
    /// Text and tool-use blocks, in the order they arrived.
    pub content: Vec<ContentBlock>,
    pub stop_reason: StopReason,
}

impl Turn {
    /// All the text in the turn, joined into one string.
    pub fn text(&self) -> String {
        self.content
            .iter()
            .filter_map(|block| match block {
                ContentBlock::Text { text } => Some(text.as_str()),
                _ => None,
            })
            .collect()
    }
}

#[derive(Debug, thiserror::Error)]
pub enum ClientError {
    #[error("the request timed out")]
    Timeout,
    #[error("could not reach the model server: {0}")]
    Network(String),
    #[error("the server answered with HTTP {code}")]
    Status { code: u16 },
    #[error("the model server reported an error: {0}")]
    Server(String),
    #[error("the stream ended before the answer was done")]
    Truncated,
    #[error("bad JSON: {0}")]
    Json(#[from] serde_json::Error),
}

/// How hard to try again after a busy answer (HTTP 429 or any 5xx).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct RetryPolicy {
    /// Total tries, including the first one.
    pub max_attempts: u32,
    /// The wait after the first failure. It doubles after each failure.
    pub base_delay: Duration,
    /// The longest we ever sleep, whatever the backoff or `Retry-After` says.
    pub max_delay: Duration,
}

impl Default for RetryPolicy {
    fn default() -> Self {
        RetryPolicy {
            max_attempts: 3,
            base_delay: Duration::from_millis(500),
            max_delay: Duration::from_secs(8),
        }
    }
}

impl RetryPolicy {
    /// The wait after failed try number `attempt` (1 is the first try).
    /// The waits are base, 2 * base, 4 * base, and so on, never more than
    /// `max_delay`.
    pub fn backoff(&self, attempt: u32) -> Duration {
        let doublings = attempt.saturating_sub(1);
        self.base_delay
            .saturating_mul(2u32.saturating_pow(doublings))
            .min(self.max_delay)
    }
}

/// Talks to one model server.
pub struct Client {
    http: reqwest::Client,
    base_url: String,
    api_key: Option<String>,
    /// Covers the whole turn: connecting, waiting, and reading the stream.
    timeout: Duration,
    retry: RetryPolicy,
}

impl Client {
    pub fn new(base_url: impl Into<String>) -> Self {
        let http = reqwest::Client::builder()
            .connect_timeout(Duration::from_secs(10))
            // A redirect could send our API key to another host, so we never
            // follow one.
            .redirect(reqwest::redirect::Policy::none())
            .build()
            .expect("the HTTP client should start with TLS support");
        Client {
            http,
            base_url: base_url.into(),
            api_key: None,
            timeout: Duration::from_secs(60),
            retry: RetryPolicy::default(),
        }
    }

    /// Sends the key as a bearer token. Keep it out of logs and error messages.
    pub fn with_api_key(mut self, key: impl Into<String>) -> Self {
        self.api_key = Some(key.into());
        self
    }

    pub fn with_timeout(mut self, timeout: Duration) -> Self {
        self.timeout = timeout;
        self
    }

    pub fn with_retry(mut self, retry: RetryPolicy) -> Self {
        self.retry = retry;
        self
    }

    /// Sends one turn and reads its stream. `on_event` sees every event as it
    /// arrives, so the caller can print text before the answer is finished.
    pub async fn stream_turn(
        &self,
        request: &Request,
        on_event: &mut dyn FnMut(&StreamEvent),
    ) -> Result<Turn, ClientError> {
        let body = provider::encode_request(request)?;
        let response = self.send_with_retry(&body).await?;

        let mut bytes = response.bytes_stream();
        let mut parser = SseParser::new();
        let mut content = Vec::new();
        let mut text = String::new();

        while let Some(chunk) = bytes.next().await {
            let chunk = chunk.map_err(network_error)?;
            for sse in parser.push(&chunk) {
                let event = provider::decode_event(&sse.data)?;
                on_event(&event);
                match event {
                    StreamEvent::TextDelta { text: piece } => text.push_str(&piece),
                    StreamEvent::ToolUse { id, name, input } => {
                        flush_text(&mut text, &mut content);
                        content.push(ContentBlock::ToolUse { id, name, input });
                    }
                    StreamEvent::Done { stop_reason } => {
                        flush_text(&mut text, &mut content);
                        return Ok(Turn {
                            content,
                            stop_reason,
                        });
                    }
                    StreamEvent::Error { message } => return Err(ClientError::Server(message)),
                }
            }
        }
        // The connection closed before `done`. Do not pretend the answer was
        // complete.
        Err(ClientError::Truncated)
    }

    /// Sends the request, retrying 429 and 5xx answers with backoff. Only the
    /// response headers are retried. Once a stream has started, we never send
    /// it again.
    async fn send_with_retry(&self, body: &Value) -> Result<reqwest::Response, ClientError> {
        let url = provider::turn_url(&self.base_url);
        let mut attempt = 1;
        loop {
            let mut builder = self.http.post(&url).timeout(self.timeout).json(body);
            if let Some(key) = &self.api_key {
                builder = builder.bearer_auth(key);
            }
            let response = builder.send().await.map_err(network_error)?;

            let status = response.status();
            if status.is_success() {
                return Ok(response);
            }
            let busy = status == StatusCode::TOO_MANY_REQUESTS || status.is_server_error();
            if !busy || attempt >= self.retry.max_attempts {
                return Err(ClientError::Status {
                    code: status.as_u16(),
                });
            }

            // The server may name the wait. We honor it, but we never sleep
            // longer than our own cap. If the server asks for more, we stop.
            let wait = match retry_after(&response) {
                Some(wait) if wait > self.retry.max_delay => {
                    tracing::warn!(
                        code = status.as_u16(),
                        "server asked for a longer wait than we allow"
                    );
                    return Err(ClientError::Status {
                        code: status.as_u16(),
                    });
                }
                Some(wait) => wait,
                None => self.retry.backoff(attempt),
            };
            tracing::warn!(code = status.as_u16(), attempt, wait = ?wait, "retrying after a busy answer");
            tokio::time::sleep(wait).await;
            attempt += 1;
        }
    }
}

/// Reads `Retry-After` when it holds a number of seconds. The HTTP-date form
/// is ignored, and the backoff is used instead.
fn retry_after(response: &reqwest::Response) -> Option<Duration> {
    let value = response.headers().get(reqwest::header::RETRY_AFTER)?;
    let seconds: u64 = value.to_str().ok()?.trim().parse().ok()?;
    Some(Duration::from_secs(seconds))
}

/// Keeps the timeout visible as its own error. Everything else is a network
/// error with the library's message.
fn network_error(error: reqwest::Error) -> ClientError {
    if error.is_timeout() {
        ClientError::Timeout
    } else {
        ClientError::Network(error.to_string())
    }
}

fn flush_text(text: &mut String, content: &mut Vec<ContentBlock>) {
    if !text.is_empty() {
        content.push(ContentBlock::Text {
            text: std::mem::take(text),
        });
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn backoff_doubles_and_stops_at_the_cap() {
        let policy = RetryPolicy {
            max_attempts: 5,
            base_delay: Duration::from_millis(100),
            max_delay: Duration::from_millis(500),
        };
        assert_eq!(policy.backoff(1), Duration::from_millis(100));
        assert_eq!(policy.backoff(2), Duration::from_millis(200));
        assert_eq!(policy.backoff(3), Duration::from_millis(400));
        assert_eq!(policy.backoff(4), Duration::from_millis(500));
        assert_eq!(policy.backoff(40), Duration::from_millis(500));
    }
}
