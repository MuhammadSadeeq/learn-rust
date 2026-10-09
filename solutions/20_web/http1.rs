// ============================================================================
//  SOLUTION http1 · Parse a request                 Chapter 20 · Rust on the Web
// ----------------------------------------------------------------------------
//  Split the message at the first blank line. The head becomes a request line
//  plus header lines, and everything after the blank line is the body, copied
//  as-is. str::lines handles \r\n, and let ... else gives the request line its
//  error without a nested match.
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
    // The first blank line ends the head. No blank line means no body.
    let (head, body) = raw.split_once("\r\n\r\n").unwrap_or((raw, ""));

    // lines() splits on \r\n and does not yield an empty line for a trailing
    // line break, so a request without headers still parses cleanly.
    let mut lines = head.lines();
    let request_line = lines.next().ok_or(ParseError::Empty)?;

    // Exactly three parts: method, target and version. The fourth must be None.
    let mut parts = request_line.split_whitespace();
    let (Some(method), Some(target), Some(version), None) =
        (parts.next(), parts.next(), parts.next(), parts.next())
    else {
        return Err(ParseError::BadRequestLine);
    };
    if !version.starts_with("HTTP/") {
        return Err(ParseError::BadRequestLine);
    }

    let method = match method {
        "GET" => Method::Get,
        "POST" => Method::Post,
        "PUT" => Method::Put,
        "DELETE" => Method::Delete,
        // Methods are case-sensitive, so "get" is unknown too.
        other => return Err(ParseError::UnknownMethod(other.to_string())),
    };

    // The query starts at the first '?'. Split it off before anything else.
    let (path, query_str) = target.split_once('?').unwrap_or((target, ""));
    let query: HashMap<String, String> = query_str
        .split('&')
        .filter(|pair| !pair.is_empty())
        .map(|pair| {
            // A pair with no '=' gets an empty value.
            let (key, value) = pair.split_once('=').unwrap_or((pair, ""));
            (key.to_string(), value.to_string())
        })
        .collect();

    let mut headers: HashMap<String, String> = HashMap::new();
    for line in lines {
        let (name, value) = line
            .split_once(':')
            .ok_or_else(|| ParseError::BadHeader(line.to_string()))?;
        let name = name.trim();
        if name.is_empty() {
            return Err(ParseError::BadHeader(line.to_string()));
        }
        // Header names are case-insensitive, so store them in lowercase.
        headers.insert(name.to_lowercase(), value.trim().to_string());
    }

    Ok(Request {
        method,
        path: path.to_string(),
        query,
        headers,
        body: body.to_string(),
    })
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
