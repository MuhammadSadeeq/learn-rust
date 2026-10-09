//! Validation rules and the `ValidJson` extractor. Laravel counterpart: a
//! Form Request. The handler only ever receives input that already passed.

use axum::Json;
use axum::extract::{FromRequest, Request};
use serde::de::DeserializeOwned;

use crate::error::AppError;
use crate::models::{CreateNote, UpdateNote};

const MAX_TITLE: usize = 120;

/// The `rules()` of a Form Request, as a trait.
pub trait Validate {
    fn validate(&self) -> Result<(), AppError>;
}

fn check_title(title: &str) -> Result<(), AppError> {
    let title = title.trim();
    if title.is_empty() {
        return Err(AppError::validation(
            "title",
            "The title field is required.",
        ));
    }
    if title.chars().count() > MAX_TITLE {
        return Err(AppError::validation(
            "title",
            format!("The title may not be greater than {MAX_TITLE} characters."),
        ));
    }
    Ok(())
}

impl Validate for CreateNote {
    fn validate(&self) -> Result<(), AppError> {
        check_title(&self.title)
    }
}

impl Validate for UpdateNote {
    fn validate(&self) -> Result<(), AppError> {
        match &self.title {
            Some(title) => check_title(title),
            None => Ok(()),
        }
    }
}

/// Like `Json<T>`, but also runs `T::validate`, and rejects with our
/// `AppError` (always a JSON body) instead of axum's plain-text rejection.
pub struct ValidJson<T>(pub T);

impl<S, T> FromRequest<S> for ValidJson<T>
where
    S: Send + Sync,
    T: DeserializeOwned + Validate,
{
    type Rejection = AppError;

    async fn from_request(req: Request, state: &S) -> Result<Self, Self::Rejection> {
        let Json(value) = Json::<T>::from_request(req, state).await?;
        value.validate()?;
        Ok(ValidJson(value))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn blank_title_is_rejected() {
        let input = CreateNote {
            title: "   ".into(),
            body: String::new(),
            pinned: false,
        };
        assert!(matches!(
            input.validate(),
            Err(AppError::Validation { field: "title", .. })
        ));
    }

    #[test]
    fn patch_without_title_is_fine() {
        assert!(UpdateNote::default().validate().is_ok());
    }
}
