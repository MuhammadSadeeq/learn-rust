// ============================================================================
//  SOLUTION http2 · A tiny router                 Chapter 20 · Rust on the Web
// ----------------------------------------------------------------------------
//  match_pattern walks both paths segment by segment. dispatch returns the
//  first route whose method and pattern both match. It remembers whether some
//  route matched the path with the wrong method, so it answers 405 only when
//  no route accepts the request.
// ============================================================================

use std::collections::HashMap;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum Method {
    Get,
    Post,
}

type Params = HashMap<String, String>;
type Handler = fn(&Params) -> Response;

#[derive(Debug, PartialEq, Eq)]
struct Response {
    status: u16,
    body: String,
}

struct Router {
    routes: Vec<(Method, String, Handler)>,
}

impl Router {
    fn new() -> Self {
        Router { routes: Vec::new() }
    }

    fn get(&mut self, pattern: &str, handler: Handler) {
        self.routes.push((Method::Get, pattern.to_string(), handler));
    }

    fn post(&mut self, pattern: &str, handler: Handler) {
        self.routes.push((Method::Post, pattern.to_string(), handler));
    }

    fn dispatch(&self, method: Method, path: &str) -> Response {
        let mut path_matched = false;
        for (route_method, pattern, handler) in &self.routes {
            if let Some(params) = match_pattern(pattern, path) {
                if *route_method == method {
                    return handler(&params);
                }
                // The path fits this route, but the method does not. Keep
                // looking, because a later route may accept both.
                path_matched = true;
            }
        }
        if path_matched {
            Response { status: 405, body: "Method Not Allowed".to_string() }
        } else {
            Response { status: 404, body: "Not Found".to_string() }
        }
    }
}

// Returns the captured parameters when `path` matches `pattern`.
fn match_pattern(pattern: &str, path: &str) -> Option<Params> {
    let wanted: Vec<&str> = pattern.split('/').collect();
    let actual: Vec<&str> = path.split('/').collect();
    // zip stops at the shorter side, so compare the lengths first.
    if wanted.len() != actual.len() {
        return None;
    }

    let mut params = Params::new();
    for (want, got) in wanted.iter().zip(&actual) {
        if let Some(name) = want.strip_prefix('{').and_then(|rest| rest.strip_suffix('}')) {
            // A parameter needs a value: "/users/" does not match "/users/{id}".
            if got.is_empty() {
                return None;
            }
            params.insert(name.to_string(), got.to_string());
        } else if want != got {
            return None;
        }
    }
    Some(params)
}

fn main() {
    let mut router = Router::new();
    router.get("/", |_| Response { status: 200, body: "Welcome".to_string() });
    router.get("/users/{id}", |p| Response { status: 200, body: format!("user {}", p["id"]) });
    router.post("/users", |_| Response { status: 201, body: "created".to_string() });

    for (method, path) in [(Method::Get, "/"), (Method::Get, "/users/42"), (Method::Get, "/users")] {
        let res = router.dispatch(method, path);
        println!("{method:?} {path} -> {} {}", res.status, res.body);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn static_route_matches_exactly() {
        let mut router = Router::new();
        router.get("/health", |_| Response { status: 200, body: "ok".to_string() });
        assert_eq!(
            router.dispatch(Method::Get, "/health"),
            Response { status: 200, body: "ok".to_string() }
        );
    }

    #[test]
    fn captures_path_parameters() {
        let mut router = Router::new();
        router.get("/users/{id}/posts/{post}", |p| Response {
            status: 200,
            body: format!("user {} post {}", p["id"], p["post"]),
        });
        let res = router.dispatch(Method::Get, "/users/7/posts/42");
        assert_eq!(res.status, 200);
        assert_eq!(res.body, "user 7 post 42");
    }

    #[test]
    fn unknown_paths_are_404() {
        let mut router = Router::new();
        router.get("/users/{id}", |_| Response { status: 200, body: String::new() });
        assert_eq!(router.dispatch(Method::Get, "/posts/1").status, 404);
        // Too many segments, too few, and an empty parameter all miss.
        assert_eq!(router.dispatch(Method::Get, "/users/1/extra").status, 404);
        assert_eq!(router.dispatch(Method::Get, "/users").status, 404);
        assert_eq!(router.dispatch(Method::Get, "/users/").status, 404);
    }

    #[test]
    fn method_mismatch_is_405_unless_another_route_matches() {
        let mut router = Router::new();
        router.post("/items/{id}", |_| Response { status: 201, body: "created".to_string() });
        router.get("/items/new", |_| Response { status: 200, body: "form".to_string() });

        // "/items/new" fits both patterns, and only the GET route takes GET.
        assert_eq!(router.dispatch(Method::Get, "/items/new").body, "form");
        // The POST route matches this path, but nothing accepts GET for it.
        assert_eq!(router.dispatch(Method::Get, "/items/9").status, 405);
        assert_eq!(router.dispatch(Method::Post, "/items/9").status, 201);
    }
}
