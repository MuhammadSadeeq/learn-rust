// ============================================================================
//  QUEST http1 · Parse a request                  Chapter 20 · Rust on the Web
// ----------------------------------------------------------------------------
//  A web server turns raw bytes into a typed request before your code runs. A
//  request is a request line ("GET /users?page=2 HTTP/1.1"), header lines
//  ("Name: value"), a blank line, then an optional body. Lines end in \r\n.
//
//  Implement parse_request with these rules:
//    - empty input is Empty
//    - the request line has three parts: METHOD, target, and a version that
//      starts with HTTP/. Anything else is BadRequestLine.
//    - GET, POST, PUT and DELETE are the only methods, and they are
//      case-sensitive. Anything else is UnknownMethod(the text).
//    - the target is the path, then an optional ?query of key=value pairs
//      separated by &. A pair with no = gets an empty value. No percent-decoding.
//    - header names are lowercased and values are trimmed. A line with no
//      colon, or with an empty name, is BadHeader(the whole line).
//    - the body is everything after the first blank line, copied as-is.
//
//  Don't edit the tests.
//
//  cargo forge          check your work (re-runs every time you save)
//  cargo forge hint     a nudge in the right direction
// ============================================================================

use std::collections::HashMap;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum Method {
    Get,
    Post,
    Put,
    Delete,
}

#[derive(Debug, PartialEq, Eq)]
struct Request {
    method: Method,
    path: String,
    query: HashMap<String, String>,
    headers: HashMap<String, String>,
    body: String,
}

#[derive(Debug, PartialEq, Eq)]
enum ParseError {
    Empty,
    BadRequestLine,
    UnknownMethod(String),
    BadHeader(String),
}

fn parse_request(raw: &str) -> Result<Request, ParseError> {
    todo!()
}

fn main() {
    let raw = "POST /users?notify=yes HTTP/1.1\r\nContent-Type: application/json\r\n\r\n{\"name\":\"Ana\"}";
    match parse_request(raw) {
        Ok(req) => {
            println!("{:?} {}", req.method, req.path);
            println!("notify = {:?}", req.query.get("notify"));
            println!("content-type = {:?}", req.headers.get("content-type"));
            println!("body = {}", req.body);
        }
        Err(err) => println!("bad request: {err:?}"),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_get_with_query_and_headers() {
        let raw = "GET /search?q=rust&page=2 HTTP/1.1\r\nHost: example.com\r\nAccept:  text/html \r\n\r\n";
        let req = parse_request(raw).expect("valid request");
        assert_eq!(req.method, Method::Get);
        assert_eq!(req.path, "/search");
        assert_eq!(req.query.get("q").map(String::as_str), Some("rust"));
        assert_eq!(req.query.get("page").map(String::as_str), Some("2"));
        assert_eq!(req.headers.get("host").map(String::as_str), Some("example.com"));
        assert_eq!(req.headers.get("accept").map(String::as_str), Some("text/html"));
        assert_eq!(req.body, "");
    }

    #[test]
    fn keeps_the_body_after_the_blank_line() {
        let raw = "POST /users HTTP/1.1\r\nContent-Type: application/json\r\n\r\nhello there";
        let req = parse_request(raw).expect("valid request");
        assert_eq!(req.method, Method::Post);
        assert_eq!(req.path, "/users");
        assert!(req.query.is_empty());
        // The body has no colon, so it must not be read as a header.
        assert_eq!(req.body, "hello there");
    }

    #[test]
    fn rejects_unknown_methods() {
        let raw = "PATCH /users/1 HTTP/1.1\r\n\r\n";
        assert_eq!(parse_request(raw).err(), Some(ParseError::UnknownMethod("PATCH".to_string())));
        // Methods are case-sensitive.
        assert_eq!(
            parse_request("get / HTTP/1.1\r\n\r\n").err(),
            Some(ParseError::UnknownMethod("get".to_string()))
        );
    }

    #[test]
    fn rejects_malformed_input() {
        assert_eq!(parse_request("").err(), Some(ParseError::Empty));
        assert_eq!(parse_request("GET /\r\n\r\n").err(), Some(ParseError::BadRequestLine));
        assert_eq!(
            parse_request("GET / HTTP/1.1\r\nHost example.com\r\n\r\n").err(),
            Some(ParseError::BadHeader("Host example.com".to_string()))
        );
    }
}
