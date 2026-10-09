//! The router. Laravel counterpart: `routes/api.php` plus the middleware
//! registered in `bootstrap/app.php`.

use std::time::Duration;

use axum::Router;
use axum::http::StatusCode;
use axum::routing::get;
use tower_http::timeout::TimeoutLayer;
use tower_http::trace::TraceLayer;

use crate::handlers;
use crate::state::AppState;

pub fn app(state: AppState) -> Router {
    // Route::apiResource('notes', NoteController::class), spelled out.
    let notes = Router::new()
        .route("/", get(handlers::index).post(handlers::store))
        .route(
            "/{id}",
            get(handlers::show)
                .patch(handlers::update)
                .delete(handlers::destroy),
        );

    Router::new()
        .route("/health", get(|| async { "ok" }))
        .nest("/api/notes", notes)
        // Layers wrap everything added above them. The last one added is
        // the outermost: a request meets TraceLayer first.
        .layer(TimeoutLayer::with_status_code(
            StatusCode::REQUEST_TIMEOUT,
            Duration::from_secs(10),
        ))
        .layer(TraceLayer::new_for_http())
        .with_state(state)
}
