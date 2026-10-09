//! One error type for the whole API. Laravel counterpart: the exception
//! handler (`bootstrap/app.php` -> `withExceptions`) that renders every
//! exception as a JSON response.

use axum::Json;
use axum::extract::rejection::JsonRejection;
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use serde_json::json;

#[derive(Debug)]
pub enum AppError {
    /// 404: no note with this id.
    NotFound(u64),
    /// 422: the JSON was well-formed but a rule failed.
    Validation {
        field: &'static str,
        message: String,
    },
    /// 400/415/422: axum could not turn the body into our type.
    BadJson(JsonRejection),
}

impl AppError {
    pub fn validation(field: &'static str, message: impl Into<String>) -> Self {
        AppError::Validation {
            field,
            message: message.into(),
        }
    }
}

/// Lets `?` turn axum's JSON rejection into our error type.
impl From<JsonRejection> for AppError {
    fn from(rejection: JsonRejection) -> Self {
        AppError::BadJson(rejection)
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, body) = match self {
            AppError::NotFound(id) => (
                StatusCode::NOT_FOUND,
                json!({ "message": format!("Note {id} not found.") }),
            ),
            AppError::Validation { field, message } => (
                StatusCode::UNPROCESSABLE_ENTITY,
                json!({ "message": message, "errors": { field: [message] } }),
            ),
            AppError::BadJson(rejection) => (
                rejection.status(),
                json!({ "message": rejection.body_text() }),
            ),
        };
        (status, Json(body)).into_response()
    }
}
