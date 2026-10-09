//! A small JSON notes API: axum + tokio + serde.
//!
//! The binary (`src/main.rs`) only boots the server. Everything else lives in
//! this library so the integration tests in `tests/` can build the exact same
//! router and send it requests without opening a socket.

pub mod error;
pub mod handlers;
pub mod models;
pub mod routes;
pub mod state;
pub mod validation;

pub use routes::app;
pub use state::AppState;
