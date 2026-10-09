// ============================================================================
//  QUEST builder1 · Builder pattern                       Chapter 21 · Mastery
// ----------------------------------------------------------------------------
//  Laravel sets options in a chain before the call:
//      Http::withHeaders([...])->timeout(5)->get($url);
//  Rust has no optional or named arguments, so a builder does the same job.
//  Each method takes self, changes it and returns it, so calls chain. build()
//  checks what is required and returns the finished request.
//
//  Implement the RequestBuilder methods. The defaults are method "GET" and a
//  timeout of 30 seconds. url is required, so build() returns Err without it.
//  Headers keep their order and duplicates. Don't edit the tests.
//
//  cargo forge          check your work (re-runs every time you save)
//  cargo forge hint     a nudge in the right direction
// ============================================================================

#[derive(Debug, PartialEq)]
struct HttpRequest {
    method: String,
    url: String,
    headers: Vec<(String, String)>,
    timeout_secs: u64,
}

// Everything is optional until build(), so each field starts empty.
#[derive(Debug, Default)]
struct RequestBuilder {
    url: Option<String>,
    method: Option<String>,
    headers: Vec<(String, String)>,
    timeout_secs: Option<u64>,
}

impl RequestBuilder {
    fn new() -> Self {
        Self::default()
    }

    fn url(mut self, url: &str) -> Self {
        todo!()
    }

    fn method(mut self, method: &str) -> Self {
        todo!()
    }

    fn header(mut self, name: &str, value: &str) -> Self {
        todo!()
    }

    fn timeout(mut self, secs: u64) -> Self {
        todo!()
    }

    fn build(self) -> Result<HttpRequest, String> {
        todo!()
    }
}

fn main() {
    let request = RequestBuilder::new()
        .method("POST")
        .url("https://api.example.com/orders")
        .header("Accept", "application/json")
        .timeout(5)
        .build()
        .expect("url was set");
    println!("{} {} (timeout {}s)", request.method, request.url, request.timeout_secs);
    for (name, value) in &request.headers {
        println!("{name}: {value}");
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn applies_defaults_when_only_the_url_is_set() {
        let req = RequestBuilder::new().url("https://example.com").build().unwrap();
        assert_eq!(req.method, "GET");
        assert_eq!(req.timeout_secs, 30);
        assert!(req.headers.is_empty());
    }

    #[test]
    fn sets_every_field_in_any_order() {
        let req = RequestBuilder::new()
            .timeout(5)
            .header("Accept", "application/json")
            .method("POST")
            .url("https://example.com/orders")
            .build()
            .unwrap();
        assert_eq!(req.method, "POST");
        assert_eq!(req.url, "https://example.com/orders");
        assert_eq!(req.timeout_secs, 5);
        assert_eq!(
            req.headers,
            vec![("Accept".to_string(), "application/json".to_string())]
        );
    }

    #[test]
    fn url_is_required() {
        let result = RequestBuilder::new().method("GET").timeout(5).build();
        assert!(result.is_err());
    }

    #[test]
    fn headers_keep_order_and_duplicates() {
        let req = RequestBuilder::new()
            .url("https://example.com")
            .header("X-Trace", "1")
            .header("X-Trace", "2")
            .build()
            .unwrap();
        assert_eq!(
            req.headers,
            vec![
                ("X-Trace".to_string(), "1".to_string()),
                ("X-Trace".to_string(), "2".to_string()),
            ]
        );
    }
}
