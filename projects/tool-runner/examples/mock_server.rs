//! Runs the mock model server by hand, so you can try the CLI without a
//! provider.
//!
//! ```text
//! cargo run --example mock_server                 # listens on 127.0.0.1:8080
//! cargo run --example mock_server -- 127.0.0.1:9000
//! ```

// The same mock the tests use. The path attribute reads the file from tests/.
#[path = "../tests/common/mod.rs"]
mod common;

#[tokio::main]
async fn main() {
    let addr = std::env::args()
        .nth(1)
        .unwrap_or_else(|| "127.0.0.1:8080".to_string());
    common::serve_demo(&addr).await;
}
