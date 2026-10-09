//! The agent loop. Ask the model, run the tools it asks for, send the
//! results back, and repeat until the model is done or we run out of turns.
//!
//! ```text
//! prompt -> ask the model (stream the text) -> why did it stop?
//!              end_turn   -> done: return the text
//!              tool_use   -> run the tools, up to N at once
//!                            send the results, then ask again
//!              too many turns -> stop with an error
//! ```
//!
//! Cancellation: each wait races a `CancellationToken`. When the token fires,
//! the future we were waiting on is dropped. In Rust, dropping a future is how
//! it stops, so the request ends at once.
//!
//! Laravel counterpart: a queued job with a `Tries` limit. The loop keeps
//! going until the work is done, and the turn limit is the guard against a job
//! that retries forever.

use futures::future::join_all;
use serde_json::Value;
use tokio::sync::Semaphore;
use tokio_util::sync::CancellationToken;

use crate::client::{Client, ClientError, Turn};
use crate::protocol::{ContentBlock, Message, Request, Role, StopReason, StreamEvent};
use crate::tools::{Registry, ToolError};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct AgentConfig {
    /// Model turns allowed before we stop. A model that keeps asking for tools
    /// is cut off here.
    pub max_turns: u32,
    /// Tool calls allowed to run at the same time.
    pub max_parallel_tools: usize,
}

/// What a finished run returns.
#[derive(Debug, Clone, PartialEq)]
pub struct Answer {
    pub text: String,
    pub turns: u32,
    pub stop_reason: StopReason,
}

#[derive(Debug, thiserror::Error)]
pub enum AgentError {
    #[error(transparent)]
    Client(#[from] ClientError),
    #[error("the model did not finish within {0} turns")]
    MaxTurns(u32),
    #[error("the run was cancelled")]
    Cancelled,
    #[error("the model asked for tools but named none: {0}")]
    Protocol(String),
}

/// One tool request, copied out of a `tool_use` block.
struct ToolCall {
    id: String,
    name: String,
    input: Value,
}

pub struct Agent {
    client: Client,
    registry: Registry,
    config: AgentConfig,
}

impl Agent {
    pub fn new(client: Client, registry: Registry, config: AgentConfig) -> Self {
        // A limit of 0 would make every tool wait forever, so we treat it as 1.
        let config = AgentConfig {
            max_parallel_tools: config.max_parallel_tools.max(1),
            ..config
        };
        Agent {
            client,
            registry,
            config,
        }
    }

    /// Runs one prompt to the end. `on_text` gets each piece of text as it
    /// arrives from the model.
    pub async fn run(
        &self,
        prompt: &str,
        cancel: &CancellationToken,
        on_text: &mut dyn FnMut(&str),
    ) -> Result<Answer, AgentError> {
        let mut messages = vec![Message::user_text(prompt)];

        for turn in 1..=self.config.max_turns {
            tracing::info!(turn, "asking the model");
            let request = Request {
                messages: messages.clone(),
                tools: self.registry.definitions(),
                stream: true,
            };
            let reply = self.ask(&request, cancel, on_text).await?;
            messages.push(Message {
                role: Role::Assistant,
                content: reply.content.clone(),
            });

            match reply.stop_reason {
                StopReason::ToolUse => {
                    let calls: Vec<ToolCall> = reply
                        .content
                        .iter()
                        .filter_map(|block| match block {
                            ContentBlock::ToolUse { id, name, input } => Some(ToolCall {
                                id: id.clone(),
                                name: name.clone(),
                                input: input.clone(),
                            }),
                            _ => None,
                        })
                        .collect();
                    if calls.is_empty() {
                        return Err(AgentError::Protocol(
                            "stop_reason was tool_use, but there were no tool_use blocks".into(),
                        ));
                    }
                    let results = self.run_tools(calls, cancel).await?;
                    messages.push(Message {
                        role: Role::User,
                        content: results,
                    });
                }
                stop_reason => {
                    return Ok(Answer {
                        text: reply.text(),
                        turns: turn,
                        stop_reason,
                    });
                }
            }
        }
        Err(AgentError::MaxTurns(self.config.max_turns))
    }

    /// One model turn. Only the text goes to the caller. Tool requests are
    /// handled after the turn ends.
    async fn ask(
        &self,
        request: &Request,
        cancel: &CancellationToken,
        on_text: &mut dyn FnMut(&str),
    ) -> Result<Turn, AgentError> {
        let mut show = |event: &StreamEvent| {
            if let StreamEvent::TextDelta { text } = event {
                on_text(text);
            }
        };
        // `biased` checks the cancel token first, so a cancelled run never
        // starts another read.
        tokio::select! {
            biased;
            _ = cancel.cancelled() => Err(AgentError::Cancelled),
            turn = self.client.stream_turn(request, &mut show) => Ok(turn?),
        }
    }

    /// Runs every requested tool, with at most `max_parallel_tools` running at
    /// once. The results keep the order of the calls.
    async fn run_tools(
        &self,
        calls: Vec<ToolCall>,
        cancel: &CancellationToken,
    ) -> Result<Vec<ContentBlock>, AgentError> {
        // A semaphore is a counter of free slots. A tool takes a slot while it
        // runs and gives it back when it finishes.
        let slots = Semaphore::new(self.config.max_parallel_tools);
        // `join_all` polls all the futures in this one task. They run
        // concurrently, not on separate threads. The semaphore decides how many
        // may be inside a tool at once.
        let runs = calls.iter().map(|call| self.run_one(call, &slots));
        tokio::select! {
            biased;
            _ = cancel.cancelled() => Err(AgentError::Cancelled),
            results = join_all(runs) => Ok(results),
        }
    }

    async fn run_one(&self, call: &ToolCall, slots: &Semaphore) -> ContentBlock {
        // The permit is returned when `_slot` goes out of scope at the end of
        // this function.
        let _slot = slots
            .acquire()
            .await
            .expect("the semaphore is never closed");
        tracing::info!(tool = %call.name, "running tool");

        let outcome = match self.registry.get(&call.name) {
            Some(tool) => tool.call(call.input.clone()).await,
            None => Err(ToolError::Denied(format!(
                "there is no tool named '{}'",
                call.name
            ))),
        };
        // A refusal or a failure is not a crash. It goes back to the model as
        // an error result, and the loop continues.
        match outcome {
            Ok(text) => ContentBlock::ToolResult {
                tool_use_id: call.id.clone(),
                content: text,
                is_error: false,
            },
            Err(error) => {
                tracing::warn!(tool = %call.name, "tool refused or failed");
                ContentBlock::ToolResult {
                    tool_use_id: call.id.clone(),
                    content: error.to_string(),
                    is_error: true,
                }
            }
        }
    }
}
