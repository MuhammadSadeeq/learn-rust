// ============================================================================
//  SOLUTION builder1 · Builder pattern             Chapter 21 · Mastery
// ----------------------------------------------------------------------------
//  Each setter takes self, changes one field and returns self, so calls chain.
//  Optional settings stay None until build() fills in the defaults. Headers go
//  in a Vec rather than a map, so their order and any duplicates survive.
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
        self.url = Some(url.to_string());
        self
    }

    fn method(mut self, method: &str) -> Self {
        self.method = Some(method.to_string());
        self
    }

    fn header(mut self, name: &str, value: &str) -> Self {
        self.headers.push((name.to_string(), value.to_string()));
        self
    }

    fn timeout(mut self, secs: u64) -> Self {
        self.timeout_secs = Some(secs);
        self
    }

    fn build(self) -> Result<HttpRequest, String> {
        // ok_or turns a missing url into an Err, and `?` returns it early.
        let url = self.url.ok_or("url is required")?;
        Ok(HttpRequest {
            method: self.method.unwrap_or_else(|| "GET".to_string()),
            url,
            headers: self.headers,
            timeout_secs: self.timeout_secs.unwrap_or(30),
        })
    }
}

fn main() {
    let request = RequestBuilder::new()
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
