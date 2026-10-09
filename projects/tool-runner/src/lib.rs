//! A small agent harness: a model, a few tools, and the loop that joins them.
//!
//! The binary (`src/main.rs`) is the command-line front end. Everything else
//! lives in this library, so the integration tests in `tests/` can drive the
//! same loop against the mock model server.
//!
//! Read in this order: `protocol.rs` (the JSON we send and read), `sse.rs` (the
//! stream parser), `client.rs` (HTTP, timeouts, retries), `tools/` (what the
//! model may ask for), and `agent.rs` (the loop that ties them together).

pub mod agent;
pub mod client;
pub mod protocol;
pub mod provider;
pub mod sse;
pub mod tools;
