// ============================================================================
//  QUEST sse1 · Parse server-sent events                   Chapter 19 · Async Rust
// ----------------------------------------------------------------------------
//  Server-sent events (SSE) are text sent over one long HTTP response. Each
//  event is a few lines, and a blank line ends it:
//
//      event: tick
//      data: 1
//      data: 2
//      <blank line>
//
//  The network delivers bytes in pieces, and a piece can end anywhere: in the
//  middle of a line, or in the middle of a UTF-8 character. So the parser keeps
//  the bytes of an unfinished line, and waits for the rest.
//
//  Implement SseParser::push. This is a simplified SSE, with these rules:
//    - A line ends at '\n'. A '\r' before the '\n' is not part of the line.
//    - "data:" adds a line to the event's data. One space after the colon is
//      removed. Several data lines are joined with '\n'.
//    - "event:" sets the event's name. Without one, the name is None.
//    - A blank line ends the event and returns it. An event with no data lines
//      is not an event: nothing comes back, and its name is forgotten.
//    - Lines that start with ':' are comments. Other fields (id, retry) and
//      lines with no colon are ignored.
//
//  Turn a line into text only once the whole line has arrived. A '\n' byte
//  never sits inside a UTF-8 character, so the line is complete at its '\n'.
//  Use String::from_utf8_lossy for the conversion. Chapter 19 covers streams
//  and SSE. Don't edit the tests.
//
//  cargo forge          check your work (re-runs every time you save)
//  cargo forge hint     a nudge in the right direction
// ============================================================================

#[derive(Debug, PartialEq, Eq)]
pub struct Event {
    pub event: Option<String>,
    pub data: String,
}

#[derive(Debug, Default)]
pub struct SseParser {
    buffer: Vec<u8>,       // bytes of a line that has not ended yet
    event: Option<String>, // from the latest `event:` line
    data: Vec<String>,     // from the `data:` lines so far
}

impl SseParser {
    pub fn new() -> Self {
        Self::default()
    }

    /// Feeds one chunk of bytes. Returns the events that the chunk completed.
    pub fn push(&mut self, chunk: &[u8]) -> Vec<Event> {
        self.buffer.extend_from_slice(chunk);
        let mut events = Vec::new();
        // Every '\n' ends a line. The bytes after the last '\n' wait in the buffer.
        while let Some(end) = self.buffer.iter().position(|&b| b == b'\n') {
            let mut bytes: Vec<u8> = self.buffer.drain(..=end).collect();
            bytes.pop(); // the '\n'
            let text = String::from_utf8_lossy(&bytes).into_owned();
            let line = text.strip_suffix('\r').unwrap_or(&text);

            if line.is_empty() {
                // A blank line ends the event. The name is used up either way.
                let name = self.event.take();
                if !self.data.is_empty() {
                    let data = self.data.join("\n");
                    self.data.clear();
                    events.push(Event { event: name, data });
                }
            } else if let Some(value) = line.strip_prefix("data:") {
                self.data
                    .push(value.strip_prefix(' ').unwrap_or(value).to_string());
            } else if let Some(name) = line.strip_prefix("event:") {
                self.event = Some(name.strip_prefix(' ').unwrap_or(name).to_string());
            }
            // Comments and every other field are ignored.
        }
        events
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn event(name: Option<&str>, data: &str) -> Event {
        Event {
            event: name.map(str::to_string),
            data: data.to_string(),
        }
    }

    #[test]
    fn one_event_in_one_chunk() {
        let mut parser = SseParser::new();
        assert_eq!(parser.push("data: hello\n\n".as_bytes()), vec![event(None, "hello")]);
    }

    #[test]
    fn a_name_and_several_data_lines() {
        let mut parser = SseParser::new();
        let events = parser.push("event: tick\ndata: 1\ndata: 2\n\n".as_bytes());
        assert_eq!(events, vec![event(Some("tick"), "1\n2")]);
    }

    #[test]
    fn only_one_space_after_the_colon_is_removed() {
        let mut parser = SseParser::new();
        assert_eq!(parser.push("data:  two\n\n".as_bytes()), vec![event(None, " two")]);
        assert_eq!(parser.push("data:three\n\n".as_bytes()), vec![event(None, "three")]);
    }

    #[test]
    fn a_chunk_can_end_anywhere() {
        let stream = "event: tick\r\ndata: 1\r\n\r\ndata: x\n\n".as_bytes();
        let whole = SseParser::new().push(stream);
        assert_eq!(whole, vec![event(Some("tick"), "1"), event(None, "x")]);
        for cut in 0..=stream.len() {
            let mut parser = SseParser::new();
            let mut got = parser.push(&stream[..cut]);
            got.extend(parser.push(&stream[cut..]));
            assert_eq!(got, whole, "split at byte {cut}");
        }
    }

    #[test]
    fn a_utf8_character_can_be_split() {
        // "é" is the two bytes 0xC3 0xA9. The cut below falls between them.
        let bytes = "data: é\n\n".as_bytes();
        let mut parser = SseParser::new();
        assert!(parser.push(&bytes[..7]).is_empty());
        assert_eq!(parser.push(&bytes[7..]), vec![event(None, "é")]);
    }

    #[test]
    fn comments_and_other_fields_are_ignored() {
        let mut parser = SseParser::new();
        let events = parser.push(": keep-alive\nid: 7\nretry: 1000\nnoise\ndata: ok\n\n".as_bytes());
        assert_eq!(events, vec![event(None, "ok")]);
    }

    #[test]
    fn a_blank_line_with_no_data_sends_nothing() {
        let mut parser = SseParser::new();
        assert!(parser.push("event: ping\n\n".as_bytes()).is_empty());
        // The name "ping" was forgotten, so the next event has no name.
        assert_eq!(parser.push("data: next\n\n".as_bytes()), vec![event(None, "next")]);
    }

    #[test]
    fn events_come_out_in_order() {
        let mut parser = SseParser::new();
        let events = parser.push("data: a\n\ndata: b\n\n".as_bytes());
        assert_eq!(events, vec![event(None, "a"), event(None, "b")]);
    }
}
