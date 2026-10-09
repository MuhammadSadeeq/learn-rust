//! A small JSON reader for the messages `cargo test --message-format=json-render-diagnostics`
//! prints. The Forge has no dependencies, so it reads them itself. The reader
//! handles all of JSON: objects, arrays, strings with escapes, numbers and
//! the three words. Each message is one line, and `parse` reads one value.

/// One JSON value. The Forge reads only some of them, so the rest are kept
/// without their contents.
#[allow(dead_code)] // Numbers and arrays are parsed for completeness, never read.
#[derive(Debug, Clone, PartialEq)]
pub enum Value {
    Null,
    Bool(bool),
    Number,
    Text(String),
    Array(Vec<Value>),
    Object(Vec<(String, Value)>),
}

impl Value {
    /// The value under `key`, if this is an object that has that key.
    pub fn get(&self, key: &str) -> Option<&Value> {
        match self {
            Value::Object(fields) => fields.iter().find(|(k, _)| k == key).map(|(_, v)| v),
            _ => None,
        }
    }

    pub fn as_str(&self) -> Option<&str> {
        match self {
            Value::Text(text) => Some(text),
            _ => None,
        }
    }

    pub fn as_bool(&self) -> Option<bool> {
        match self {
            Value::Bool(flag) => Some(*flag),
            _ => None,
        }
    }
}

/// Reads one complete JSON value. Returns None when the text is not valid JSON.
pub fn parse(text: &str) -> Option<Value> {
    let mut parser = Parser { text, pos: 0 };
    let value = parser.value()?;
    parser.skip_space();
    (parser.pos == text.len()).then_some(value)
}

struct Parser<'a> {
    text: &'a str,
    pos: usize,
}

impl Parser<'_> {
    fn byte(&self) -> Option<u8> {
        self.text.as_bytes().get(self.pos).copied()
    }

    fn skip_space(&mut self) {
        while matches!(self.byte(), Some(b' ' | b'\t' | b'\n' | b'\r')) {
            self.pos += 1;
        }
    }

    /// Consumes `expected` if it is the next byte.
    fn eat(&mut self, expected: u8) -> bool {
        if self.byte() == Some(expected) {
            self.pos += 1;
            true
        } else {
            false
        }
    }

    fn word(&mut self, word: &str, value: Value) -> Option<Value> {
        if self.text[self.pos..].starts_with(word) {
            self.pos += word.len();
            Some(value)
        } else {
            None
        }
    }

    fn value(&mut self) -> Option<Value> {
        self.skip_space();
        match self.byte()? {
            b'{' => self.object(),
            b'[' => self.array(),
            b'"' => self.string().map(Value::Text),
            b't' => self.word("true", Value::Bool(true)),
            b'f' => self.word("false", Value::Bool(false)),
            b'n' => self.word("null", Value::Null),
            b'-' | b'0'..=b'9' => self.number(),
            _ => None,
        }
    }

    fn object(&mut self) -> Option<Value> {
        self.pos += 1; // the '{'
        let mut fields = Vec::new();
        self.skip_space();
        if self.eat(b'}') {
            return Some(Value::Object(fields));
        }
        loop {
            self.skip_space();
            if self.byte()? != b'"' {
                return None;
            }
            let key = self.string()?;
            self.skip_space();
            if !self.eat(b':') {
                return None;
            }
            fields.push((key, self.value()?));
            self.skip_space();
            if self.eat(b'}') {
                return Some(Value::Object(fields));
            }
            if !self.eat(b',') {
                return None;
            }
        }
    }

    fn array(&mut self) -> Option<Value> {
        self.pos += 1; // the '['
        let mut items = Vec::new();
        self.skip_space();
        if self.eat(b']') {
            return Some(Value::Array(items));
        }
        loop {
            items.push(self.value()?);
            self.skip_space();
            if self.eat(b']') {
                return Some(Value::Array(items));
            }
            if !self.eat(b',') {
                return None;
            }
        }
    }

    fn number(&mut self) -> Option<Value> {
        let start = self.pos;
        while matches!(
            self.byte(),
            Some(b'0'..=b'9' | b'-' | b'+' | b'.' | b'e' | b'E')
        ) {
            self.pos += 1;
        }
        self.text[start..self.pos]
            .parse::<f64>()
            .ok()
            .map(|_| Value::Number)
    }

    fn string(&mut self) -> Option<String> {
        self.pos += 1; // the opening quote
        let mut out = String::new();
        loop {
            match self.byte()? {
                b'"' => {
                    self.pos += 1;
                    return Some(out);
                }
                b'\\' => {
                    self.pos += 1;
                    out.push(self.escape()?);
                }
                _ => {
                    // Copy one whole character. Only ASCII bytes are skipped one at a
                    // time, so `pos` is always at a character boundary.
                    let c = self.text[self.pos..].chars().next()?;
                    out.push(c);
                    self.pos += c.len_utf8();
                }
            }
        }
    }

    fn escape(&mut self) -> Option<char> {
        let byte = self.byte()?;
        self.pos += 1;
        Some(match byte {
            b'"' => '"',
            b'\\' => '\\',
            b'/' => '/',
            b'b' => '\u{8}',
            b'f' => '\u{c}',
            b'n' => '\n',
            b'r' => '\r',
            b't' => '\t',
            b'u' => {
                let high = self.hex4()?;
                if (0xD800..0xDC00).contains(&high) {
                    // A surrogate pair: the low half must follow as another \uXXXX.
                    if !self.text[self.pos..].starts_with("\\u") {
                        return None;
                    }
                    self.pos += 2;
                    let low = self.hex4()?;
                    if !(0xDC00..0xE000).contains(&low) {
                        return None;
                    }
                    char::from_u32(0x10000 + ((high - 0xD800) << 10) + (low - 0xDC00))?
                } else {
                    char::from_u32(high)?
                }
            }
            _ => return None,
        })
    }

    fn hex4(&mut self) -> Option<u32> {
        let digits = self.text.get(self.pos..self.pos + 4)?;
        if !digits.bytes().all(|b| b.is_ascii_hexdigit()) {
            return None;
        }
        self.pos += 4;
        u32::from_str_radix(digits, 16).ok()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn reads_objects_arrays_and_words() {
        let value =
            parse(r#" {"reason": "x", "ok": true, "none": null, "list": [1, -2.5e3, "a"]} "#)
                .expect("valid JSON");
        assert_eq!(value.get("reason").and_then(Value::as_str), Some("x"));
        assert_eq!(value.get("ok").and_then(Value::as_bool), Some(true));
        assert_eq!(value.get("none"), Some(&Value::Null));
        assert!(value.get("missing").is_none());
    }

    #[test]
    fn decodes_escapes_and_surrogate_pairs() {
        let value = parse(r#""a\n\"\\\u00e9\ud83e\udd80""#).expect("valid JSON");
        assert_eq!(value.as_str(), Some("a\n\"\\é🦀"));
    }

    #[test]
    fn keeps_non_ascii_text_as_it_is() {
        let value = parse("\"héllo — 🦀\"").expect("valid JSON");
        assert_eq!(value.as_str(), Some("héllo — 🦀"));
    }

    #[test]
    fn rejects_broken_input() {
        for text in [
            r#"{"a":}"#,
            "[1,2",
            "tru",
            "\"abc",
            "1 2",
            "{\"a\" 1}",
            "\"\\x\"",
            "\"\\ud800\"",
        ] {
            assert!(parse(text).is_none(), "accepted {text:?}");
        }
    }
}
