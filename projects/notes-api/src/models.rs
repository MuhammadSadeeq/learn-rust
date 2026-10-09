//! The data shapes. Laravel counterpart: the Eloquent model, the request
//! payloads a Form Request would accept, and the API resource. `Note`
//! serializes every field, so it also serves as the resource.

use serde::{Deserialize, Serialize};

/// A stored note. `Serialize` turns it into JSON for responses.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Note {
    pub id: u64,
    pub title: String,
    pub body: String,
    pub pinned: bool,
}

/// Body of `POST /api/notes`. Missing `body` and `pinned` fall back to
/// their defaults; a missing `title` is a deserialization error.
#[derive(Debug, Deserialize)]
pub struct CreateNote {
    pub title: String,
    #[serde(default)]
    pub body: String,
    #[serde(default)]
    pub pinned: bool,
}

/// Body of `PATCH /api/notes/{id}`. Every field is optional: `None` means
/// "leave this field alone".
#[derive(Debug, Default, Deserialize)]
pub struct UpdateNote {
    pub title: Option<String>,
    pub body: Option<String>,
    pub pinned: Option<bool>,
}
