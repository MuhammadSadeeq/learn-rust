//! A Server-Sent Events (SSE) parser that reads the bytes as they arrive.
//!
//! SSE is plain text sent over HTTP. An event is a few lines, such as
//! `event: name` and `data: ...`, and a blank line ends it. Network chunks do
//! not follow event boundaries. A chunk can end in the middle of a line, or in
//! the middle of a multi-byte UTF-8 character. So the parser keeps what it has
//! seen and waits for the rest.
//!
//! This is a simplified parser. It reads `event` and `data` lines, skips
//! comments, and accepts LF or CRLF line endings, which is what real servers
//! send. It ignores `id` and `retry`. It does not handle a bare CR as a line
//! ending.
//!
//! Laravel counterpart: nothing in the framework. Think of reading a
//! `StreamedResponse` one chunk at a time, and of never assuming a chunk is a
//! whole message.

/// One complete event.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SseEvent {
    /// The `event:` name, if the server sent one.
    pub event: Option<String>,
    /// The `data:` lines, joined with newlines.
    pub data: String,
}

/// Keeps the half-read line and the half-built event between chunks.
#[derive(Debug, Default)]
pub struct SseParser {
    /// Bytes of the line we are still reading. We keep bytes, not text, so a
    /// chunk may end inside a character.
    line: Vec<u8>,
    event: Option<String>,
    data: String,
    has_data: bool,
}

impl SseParser {
    pub fn new() -> Self {
        Self::default()
    }

    /// Feeds one chunk and returns every event it completed. A chunk may
    /// complete none, one or several.
    pub fn push(&mut self, chunk: &[u8]) -> Vec<SseEvent> {
        let mut events = Vec::new();
        for &byte in chunk {
            if byte != b'\n' {
                self.line.push(byte);
                continue;
            }
            // We split on `\n` only. That byte never appears inside a
            // multi-byte UTF-8 character, so each full line decodes cleanly.
            let bytes = std::mem::take(&mut self.line);
            let decoded = String::from_utf8_lossy(&bytes);
            let line: &str = decoded.strip_suffix('\r').unwrap_or(&decoded);
            if let Some(event) = self.apply_line(line) {
                events.push(event);
            }
        }
        events
    }

    fn apply_line(&mut self, line: &str) -> Option<SseEvent> {
        if line.is_empty() {
            // A blank line ends the event.
            return self.dispatch();
        }
        if line.starts_with(':') {
            // A comment. Servers send them as keep-alive pings. Ignore it.
            return None;
        }
        // `name: value`. One space after the colon is part of the syntax, not
        // part of the value.
        let (name, value) = match line.split_once(':') {
            Some((name, value)) => (name, value.strip_prefix(' ').unwrap_or(value)),
            None => (line, ""),
        };
        match name {
            "event" => self.event = Some(value.to_string()),
            "data" => {
                self.data.push_str(value);
                self.data.push('\n');
                self.has_data = true;
            }
            _ => {}
        }
        None
    }

    fn dispatch(&mut self) -> Option<SseEvent> {
        // The name belongs to one event only, so clear it whether or not this
        // event has data.
        let event = self.event.take();
        if !self.has_data {
            return None;
        }
        self.has_data = false;
        let mut data = std::mem::take(&mut self.data);
        // Every data line added a newline. Remove the last one.
        data.pop();
        Some(SseEvent { event, data })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Parses a whole text in one push.
    fn parse_all(text: &str) -> Vec<SseEvent> {
        SseParser::new().push(text.as_bytes())
    }

    #[test]
    fn two_events_in_one_chunk() {
        let events = parse_all("data: one\n\ndata: two\n\n");
        assert_eq!(
            events,
            vec![
                SseEvent {
                    event: None,
                    data: "one".into()
                },
                SseEvent {
                    event: None,
                    data: "two".into()
                },
            ]
        );
    }

    #[test]
    fn event_name_and_multi_line_data() {
        let events = parse_all("event: delta\ndata: first\ndata: second\n\n");
        assert_eq!(
            events,
            vec![SseEvent {
                event: Some("delta".into()),
                data: "first\nsecond".into()
            }]
        );
    }

    #[test]
    fn comments_and_crlf_line_endings_are_handled() {
        let events = parse_all(": keep-alive\r\ndata: hi\r\n\r\n");
        assert_eq!(events.len(), 1);
        assert_eq!(events[0].data, "hi");
    }

    #[test]
    fn an_event_waits_for_its_blank_line() {
        let mut parser = SseParser::new();
        assert!(parser.push(b"data: half").is_empty());
        assert!(parser.push(b"\n").is_empty());
        let events = parser.push(b"\n");
        assert_eq!(events[0].data, "half");
    }

    #[test]
    fn every_split_point_gives_the_same_events() {
        // The `é` is two bytes, so some splits fall inside a character.
        let text = "data: café\n\nevent: x\ndata: a\ndata: b\n\n";
        let whole = parse_all(text);
        assert_eq!(whole.len(), 2);

        let bytes = text.as_bytes();
        for cut in 0..=bytes.len() {
            let mut parser = SseParser::new();
            let mut events = parser.push(&bytes[..cut]);
            events.extend(parser.push(&bytes[cut..]));
            assert_eq!(events, whole, "split at byte {cut}");
        }
    }

    #[test]
    fn a_blank_line_with_no_data_dispatches_nothing() {
        assert!(parse_all("\n\n").is_empty());
    }
}
