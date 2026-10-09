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
        .await?;
    tracing::info!("server stopped");
    Ok(())
}

/// Finish in-flight requests on Ctrl+C (SIGINT) or SIGTERM, the signal that
/// Docker and Kubernetes send when they stop a container.
async fn shutdown_signal() {
    let ctrl_c = async {
        tokio::signal::ctrl_c()
            .await
            .expect("could not listen for Ctrl+C");
    };

    #[cfg(unix)]
    let terminate = async {
        tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate())
            .expect("could not listen for SIGTERM")
            .recv()
            .await;
    };

    // Windows has no SIGTERM. This future never finishes, so Ctrl+C is the only trigger there.
    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    // Whichever signal comes first wins. The other future is dropped.
    tokio::select! {
        _ = ctrl_c => {}
        _ = terminate => {}
    }
    tracing::info!("shutdown signal received, finishing in-flight requests");
}
