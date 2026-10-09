//! The handlers. Laravel counterpart: a resource controller
//! (`index`, `store`, `show`, `update`, `destroy`).
//!
//! Each handler is a plain async fn. Its arguments are extractors (they run
//! before the body), and its return type implements `IntoResponse`.

use axum::Json;
use axum::extract::{Path, State};
use axum::http::StatusCode;

use crate::error::AppError;
use crate::models::{CreateNote, Note, UpdateNote};
use crate::state::AppState;
use crate::validation::ValidJson;

/// GET /api/notes
pub async fn index(State(state): State<AppState>) -> Json<Vec<Note>> {
    let db = state.db.read().await;
    Json(db.all())
}

/// POST /api/notes
pub async fn store(
    State(state): State<AppState>,
    ValidJson(input): ValidJson<CreateNote>,
) -> (StatusCode, Json<Note>) {
    let note = state.db.write().await.insert(input);
    tracing::info!(id = note.id, "note created");
    (StatusCode::CREATED, Json(note))
}

/// GET /api/notes/{id}
pub async fn show(
    State(state): State<AppState>,
    Path(id): Path<u64>,
) -> Result<Json<Note>, AppError> {
    let db = state.db.read().await;
    let note = db.find(id).ok_or(AppError::NotFound(id))?;
    Ok(Json(note.clone()))
}

/// PATCH /api/notes/{id}
pub async fn update(
    State(state): State<AppState>,
    Path(id): Path<u64>,
    ValidJson(patch): ValidJson<UpdateNote>,
) -> Result<Json<Note>, AppError> {
    let note = state
        .db
        .write()
        .await
        .update(id, patch)
        .ok_or(AppError::NotFound(id))?;
    Ok(Json(note))
}

/// DELETE /api/notes/{id}
pub async fn destroy(
    State(state): State<AppState>,
    Path(id): Path<u64>,
) -> Result<StatusCode, AppError> {
    state
        .db
        .write()
        .await
        .remove(id)
        .ok_or(AppError::NotFound(id))?;
    Ok(StatusCode::NO_CONTENT)
}
