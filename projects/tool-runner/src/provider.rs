//! The one module that knows a provider's names.
//!
//! The course protocol in `protocol.rs` is our own. A real provider uses the
//! same shape, but with its own URL, field names and event names. To talk to
//! one, change the functions in this file. The rest of the crate does not
//! need to change.
//!
//! The functions below use the course names. Each one is a plain serde call,
//! so nothing here is clever. Read a provider's current API reference before
//! you change them. This file does not claim any provider's names.
//!
//! Laravel counterpart: a mail transport chosen in `config/mail.php`. The
//! rest of the app calls one interface. Only the transport knows the vendor's
//! API.

use serde_json::Value;

use crate::protocol::{Request, StreamEvent};

/// Path of the turn endpoint on the model server. The mock serves this path.
pub const TURN_PATH: &str = "/v1/turn";

/// The full URL for one turn. A trailing slash on the base URL is removed, so
/// we never send `//v1/turn`.
pub fn turn_url(base_url: &str) -> String {
    format!("{}{TURN_PATH}", base_url.trim_end_matches('/'))
}

/// Turns our request into the JSON body. A real provider would rename fields
/// here.
pub fn encode_request(request: &Request) -> Result<Value, serde_json::Error> {
    serde_json::to_value(request)
}

/// Reads the JSON of one event into our event type. An unknown `type` is an
/// error, not a guess.
pub fn decode_event(data: &str) -> Result<StreamEvent, serde_json::Error> {
    serde_json::from_str(data)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn turn_url_has_no_double_slash() {
        assert_eq!(
            turn_url("http://127.0.0.1:8080/"),
            "http://127.0.0.1:8080/v1/turn"
        );
        assert_eq!(
            turn_url("http://127.0.0.1:8080"),
            "http://127.0.0.1:8080/v1/turn"
        );
    }
}
