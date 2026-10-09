//! Shared application state. Laravel counterpart: a singleton bound in the
//! service container, plus the repository that owns the data.

use std::collections::BTreeMap;
use std::sync::Arc;

use tokio::sync::RwLock;

use crate::models::{CreateNote, Note, UpdateNote};

/// Cloned into every handler that asks for `State<AppState>`.
/// Cloning only bumps the `Arc` counter: every clone sees the same notes.
#[derive(Clone, Default)]
pub struct AppState {
    pub db: Arc<RwLock<Db>>,
}

/// An in-memory table. A `BTreeMap` keeps the ids sorted, so listing the
/// notes always returns them in creation order.
#[derive(Debug, Default)]
pub struct Db {
    notes: BTreeMap<u64, Note>,
    last_id: u64,
}

impl Db {
    pub fn all(&self) -> Vec<Note> {
        self.notes.values().cloned().collect()
    }

    pub fn find(&self, id: u64) -> Option<&Note> {
        self.notes.get(&id)
    }

    pub fn insert(&mut self, input: CreateNote) -> Note {
        self.last_id += 1;
        let note = Note {
            id: self.last_id,
            title: input.title.trim().to_string(),
            body: input.body,
            pinned: input.pinned,
        };
        self.notes.insert(note.id, note.clone());
        note
    }

    /// Applies only the fields that are `Some`. Returns `None` if the id
    /// doesn't exist.
    pub fn update(&mut self, id: u64, patch: UpdateNote) -> Option<Note> {
        let note = self.notes.get_mut(&id)?;
        if let Some(title) = patch.title {
            note.title = title.trim().to_string();
        }
        if let Some(body) = patch.body {
            note.body = body;
        }
        if let Some(pinned) = patch.pinned {
            note.pinned = pinned;
        }
        Some(note.clone())
    }

    pub fn remove(&mut self, id: u64) -> Option<Note> {
        self.notes.remove(&id)
    }
}
