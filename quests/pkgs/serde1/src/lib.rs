// ============================================================================
//  QUEST serde1 · Tagged JSON enums                       Chapter 20 · Rust on the Web
// ----------------------------------------------------------------------------
//  A model answers with JSON blocks. A block is either text or a request to
//  run a tool, and the "type" field says which:
//
//      {"type":"text","text":"Hello"}
//      {"type":"tool_use","name":"calculator","input":{"expression":"2+2"}}
//
//  Make Block match that shape:
//    - Tag the enum with "type", and rename the variants to snake_case, so
//      Text is "text" and ToolUse is "tool_use". Use one #[serde(...)] line.
//    - input is a serde_json::Value, so a tool can take any JSON arguments.
//
//  Then write to_json and from_json. An unknown type, or a missing type, is an
//  error, not a default. Don't edit the tests.
//
//  cargo forge          check your work (re-runs every time you save)
//  cargo forge hint     a nudge in the right direction
// ============================================================================

use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, PartialEq, Serialize, Deserialize)]
pub enum Block {
    Text { text: String },
    ToolUse { name: String, input: Value },
}

pub fn to_json(block: &Block) -> Result<String, serde_json::Error> {
    todo!()
}

pub fn from_json(text: &str) -> Result<Block, serde_json::Error> {
    todo!()
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn a_text_block_has_the_type_tag_first() {
        let block = Block::Text {
            text: "hi".to_string(),
        };
        let json = to_json(&block).expect("serializes");
        assert_eq!(json, r#"{"type":"text","text":"hi"}"#);
    }

    #[test]
    fn a_tool_call_round_trips() {
        let block = Block::ToolUse {
            name: "calculator".to_string(),
            input: json!({ "expression": "2 + 2", "precision": 2 }),
        };
        let json = to_json(&block).expect("serializes");
        assert_eq!(from_json(&json).expect("parses"), block);
    }

    #[test]
    fn parses_a_tool_call_from_a_model() {
        let text = r#"{"type":"tool_use","name":"calculator","input":{"expression":"2+2"}}"#;
        let block = from_json(text).expect("parses");
        assert_eq!(
            block,
            Block::ToolUse {
                name: "calculator".to_string(),
                input: json!({ "expression": "2+2" }),
            }
        );
    }

    #[test]
    fn an_unknown_type_is_an_error() {
        assert!(from_json(r#"{"type":"image","url":"x"}"#).is_err());
    }

    #[test]
    fn a_missing_type_is_an_error() {
        assert!(from_json(r#"{"text":"hi"}"#).is_err());
    }

    #[test]
    fn input_can_be_any_json() {
        let text = r#"{"type":"tool_use","name":"search","input":{"terms":["rust","serde"],"limit":null}}"#;
        match from_json(text).expect("parses") {
            Block::ToolUse { input, .. } => {
                assert_eq!(input["terms"][1], "serde");
                assert!(input["limit"].is_null());
            }
            other => panic!("expected a tool call, got {other:?}"),
        }
    }
}
