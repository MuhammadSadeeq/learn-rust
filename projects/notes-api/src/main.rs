//! Boots the server. Laravel counterpart: `public/index.php` plus
//! `bootstrap/app.php`, except this runs once, not once per request.

use notes_api::{AppState, app};
use tokio::net::TcpListener;
use tracing_subscriber::EnvFilter;

#[tokio::main]
async fn main() -> std::io::Result<()> {
    // Log/Monolog: RUST_LOG=debug cargo run shows more.
    tracing_subscriber::fmt()
        .with_env_filter(
            EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| EnvFilter::new("notes_api=info,tower_http=debug")),
        )
        .init();

    let addr = std::env::var("APP_ADDR").unwrap_or_else(|_| "127.0.0.1:3000".to_string());
    let listener = TcpListener::bind(&addr).await?;
    tracing::info!("listening on http://{}", listener.local_addr()?);

    axum::serve(listener, app(AppState::default()))
        .with_graceful_shutdown(shutdown_signal())
        .await
}

/// Finish in-flight requests on Ctrl+C instead of cutting them off.
async fn shutdown_signal() {
    if let Err(err) = tokio::signal::ctrl_c().await {
        tracing::error!(%err, "could not listen for Ctrl+C");
    }
}
