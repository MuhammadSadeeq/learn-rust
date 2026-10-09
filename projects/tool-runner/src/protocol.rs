//! The wire protocol: the JSON we send to the model server and the events it
//! sends back.
//!
//! This is the course's own protocol. It has the common shape of current model
//! APIs. A conversation is a list of messages, and each message has content
//! blocks. Tools are described with a JSON Schema. When the model wants a tool,
//! it sends a `tool_use` block, and we answer with a `tool_result` block that
//! carries the same id. Text arrives in small pieces called deltas.
//!
//! Real providers use the same shape with their own field names. Only
//! `provider.rs` maps our names onto a provider's names.
//!
//! Laravel counterpart: the JSON your API resources return. The tagged enums
//! below replace the `if ($block['type'] === 'text')` checks you would write
//! in PHP. Serde picks the variant from the `type` field.

use serde::{Deserialize, Serialize};
use serde_json::Value;

/// Who wrote a message.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Role {
    User,
    Assistant,
}

/// One piece of a message. The `type` field picks the variant.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum ContentBlock {
    /// Plain text.
    Text { text: String },
    /// The model asks us to run a tool. `id` ties our answer to this request.
    ToolUse {
        id: String,
        name: String,
        input: Value,
    },
    /// Our answer to a `tool_use`. `is_error` tells the model the tool refused
    /// or failed, so it can try something else.
    ToolResult {
        tool_use_id: String,
        content: String,
        is_error: bool,
    },
}

/// One turn in the conversation.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Message {
    pub role: Role,
    pub content: Vec<ContentBlock>,
}

impl Message {
    /// A user message with one text block. This is how a prompt starts.
    pub fn user_text(text: impl Into<String>) -> Self {
        Message {
            role: Role::User,
            content: vec![ContentBlock::Text { text: text.into() }],
        }
    }
}

/// A tool as the model sees it: a name, a sentence about what it does, and a
/// JSON Schema for its input.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct ToolDefinition {
    pub name: String,
    pub description: String,
    pub input_schema: Value,
}

/// The body of `POST /v1/turn`.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Request {
    pub messages: Vec<Message>,
    pub tools: Vec<ToolDefinition>,
    /// The client always asks for a stream. The mock refuses `false`.
    pub stream: bool,
}

/// Why the model stopped.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum StopReason {
    /// The answer is finished.
    EndTurn,
    /// The model wants tools run. Send the results, then ask again.
    ToolUse,
    /// The answer hit the length limit and was cut off.
    MaxTokens,
}

/// One event in a streamed answer. Each arrives as one SSE event whose `data`
/// line is this JSON.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum StreamEvent {
    /// A piece of text. Show it as it arrives.
    TextDelta { text: String },
    /// A complete tool request. Real APIs often stream the input in pieces.
    /// This course sends it whole, to keep the parser small.
    ToolUse {
        id: String,
        name: String,
        input: Value,
    },
    /// The answer is complete. Nothing follows this event.
    Done { stop_reason: StopReason },
    /// The server failed partway through.
    Error { message: String },
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn request_has_the_course_shape() {
        let request = Request {
            messages: vec![Message::user_text("hi")],
            tools: vec![ToolDefinition {
                name: "calculator".into(),
                description: "Adds numbers.".into(),
                input_schema: json!({"type": "object"}),
            }],
            stream: true,
        };
        assert_eq!(
            serde_json::to_value(&request).unwrap(),
            json!({
                "messages": [{"role": "user", "content": [{"type": "text", "text": "hi"}]}],
                "tools": [{
                    "name": "calculator",
                    "description": "Adds numbers.",
                    "input_schema": {"type": "object"}
                }],
                "stream": true
            })
        );
    }

    #[test]
    fn tool_result_always_says_whether_it_failed() {
        let block = ContentBlock::ToolResult {
            tool_use_id: "call_1".into(),
            content: "42".into(),
            is_error: false,
        };
        assert_eq!(
            serde_json::to_value(&block).unwrap(),
            json!({"type": "tool_result", "tool_use_id": "call_1", "content": "42", "is_error": false})
        );
    }

    #[test]
    fn stream_events_are_read_by_their_type_field() {
        let event: StreamEvent =
            serde_json::from_str(r#"{"type":"done","stop_reason":"tool_use"}"#).unwrap();
        assert_eq!(
            event,
            StreamEvent::Done {
                stop_reason: StopReason::ToolUse
            }
        );
    }

    #[test]
    fn an_unknown_event_type_is_an_error() {
        let result = serde_json::from_str::<StreamEvent>(r#"{"type":"ping"}"#);
        assert!(result.is_err());
    }
}
