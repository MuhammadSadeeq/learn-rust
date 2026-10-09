// ============================================================================
//  QUEST axum1 · A handler with state and errors          Chapter 20 · Rust on the Web
// ----------------------------------------------------------------------------
//  A handler is an async function. axum fills its arguments from the request:
//    State(state)  the app's shared state, the same for every request
//    Json(body)    the request body, parsed from JSON into a NewNote
//  The return value becomes the response. A Result works too: an Ok value is
//  the success response, and an Err value must implement IntoResponse.
//
//  Write these three pieces:
//    - create_note stores body.text in the shared list and answers with the
//      note's position as {"id": N}. The first note has id 0. If the text is
//      empty after trim(), it returns AppError::EmptyText and stores nothing.
//    - impl IntoResponse for AppError answers 422 Unprocessable Entity with the
//      JSON body {"error":"text is empty"}. The body is valid JSON with a
//      refused value, so the status is 422, not 400. Chapter 20 explains why.
//    - app builds a Router with POST /notes, with the state attached.
//
//  The tests send requests straight to the Router with tower's oneshot, so no
//  server starts. Don't edit the tests.
//
//  cargo forge          check your work (re-runs every time you save)
//  cargo forge hint     a nudge in the right direction
// ============================================================================

use axum::extract::State;
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::routing::post;
use axum::{Json, Router};
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};

#[derive(Clone, Default)]
pub struct AppState {
    notes: Arc<Mutex<Vec<String>>>,
}

#[derive(Debug, Deserialize)]
pub struct NewNote {
    pub text: String,
}

#[derive(Debug, Serialize, PartialEq)]
pub struct Saved {
    pub id: usize,
}

#[derive(Debug, PartialEq)]
pub enum AppError {
    EmptyText,
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let message = match self {
            AppError::EmptyText => "text is empty",
        };
        (
            StatusCode::UNPROCESSABLE_ENTITY,
            Json(serde_json::json!({ "error": message })),
        )
            .into_response()
    }
}

pub async fn create_note(
    State(state): State<AppState>,
    Json(body): Json<NewNote>,
) -> Result<Json<Saved>, AppError> {
    if body.text.trim().is_empty() {
        return Err(AppError::EmptyText);
    }
    let mut notes = state.notes.lock().expect("the notes lock is not poisoned");
    notes.push(body.text);
    Ok(Json(Saved {
        id: notes.len() - 1,
    }))
}

pub fn app(state: AppState) -> Router {
    Router::new()
        .route("/notes", post(create_note))
        .with_state(state)
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::body::{to_bytes, Body};
    use axum::http::Request;
    use tower::ServiceExt;

    /// What the router answered: the status, the content type and the body text.
    struct Answer {
        status: StatusCode,
        content_type: String,
        body: String,
    }

    /// Sends one POST /notes request to the router and returns the answer.
    async fn post_note(app: &Router, json: &str) -> Answer {
        let request = Request::builder()
            .method("POST")
            .uri("/notes")
            .header("content-type", "application/json")
            .body(Body::from(json.to_string()))
            .expect("a valid request");
        let response = app.clone().oneshot(request).await.expect("the router answers");
        let status = response.status();
        let content_type = response
            .headers()
            .get("content-type")
            .and_then(|value| value.to_str().ok())
            .unwrap_or("")
            .to_string();
        let bytes = to_bytes(response.into_body(), 1024).await.expect("a body");
        Answer {
            status,
            content_type,
            body: String::from_utf8(bytes.to_vec()).expect("utf-8"),
        }
    }

    #[tokio::test]
    async fn saves_a_note_and_returns_its_id() {
        let state = AppState::default();
        let app = app(state.clone());
        let answer = post_note(&app, r#"{"text":"buy milk"}"#).await;
        assert_eq!(answer.status, StatusCode::OK);
        assert_eq!(answer.body, r#"{"id":0}"#);
        assert_eq!(state.notes.lock().unwrap().len(), 1);
    }

    #[tokio::test]
    async fn ids_count_up_from_zero() {
        let app = app(AppState::default());
        post_note(&app, r#"{"text":"first"}"#).await;
        let answer = post_note(&app, r#"{"text":"second"}"#).await;
        assert_eq!(answer.body, r#"{"id":1}"#);
    }

    #[tokio::test]
    async fn blank_text_is_a_422_json_answer_and_stores_nothing() {
        // The body is valid JSON, but its value is refused, so the status is
        // 422, not 400. A 400 is for a body that is not JSON at all.
        let state = AppState::default();
        let app = app(state.clone());
        let answer = post_note(&app, r#"{"text":"   "}"#).await;
        assert_eq!(answer.status, StatusCode::UNPROCESSABLE_ENTITY);
        assert_eq!(answer.content_type, "application/json");
        assert_eq!(answer.body, r#"{"error":"text is empty"}"#);
        assert!(state.notes.lock().unwrap().is_empty());
    }

    #[tokio::test]
    async fn a_body_without_text_is_rejected_by_axum() {
        let app = app(AppState::default());
        let answer = post_note(&app, r#"{"body":"no text field"}"#).await;
        assert_eq!(answer.status, StatusCode::UNPROCESSABLE_ENTITY);
    }
}
