//! The read_file tool, with a sandbox. The model can read text files inside
//! one folder, and nowhere else.
//!
//! The rules, in the order the code checks them:
//! 1. The path must be relative. An absolute path would ignore the folder.
//! 2. No `..` part. It would climb out of the folder.
//! 3. Symbolic links are followed, and the real path must still be inside the
//!    folder. A link inside the folder can point outside it.
//! 4. Only a regular file can be read. A folder, a named pipe (FIFO) or a
//!    device is refused before it is opened. Opening a FIFO with no writer
//!    waits forever, so the check must come first.
//! 5. The read stops at 64 KiB. One call cannot fill the model's context or
//!    our memory.
//!
//! This is a teaching sandbox. It checks the path once, and then it reads.
//! Another program could swap a file between the check and the read, and get
//! past the check. Real sandboxes need operating system features for that.
//!
//! Laravel counterpart: a filesystem disk, such as `Storage::disk('local')`,
//! which is also rooted in one folder.

use std::io;
use std::path::{Component, Path, PathBuf};

use serde::Deserialize;
use serde_json::{Value, json};
use tokio::io::AsyncReadExt;

use super::{Tool, ToolError, ToolFuture};

/// The most we read from one file: 64 KiB.
pub const MAX_BYTES: u64 = 64 * 1024;

#[derive(Deserialize)]
struct Input {
    path: String,
}

pub struct ReadFile {
    root: PathBuf,
}

impl ReadFile {
    /// The root is resolved once, here. The checks then compare real paths.
    pub fn new(root: &Path) -> io::Result<Self> {
        Ok(ReadFile {
            root: root.canonicalize()?,
        })
    }

    /// Checks a requested path and returns the real file path inside the root.
    pub fn resolve(&self, requested: &str) -> Result<PathBuf, ToolError> {
        let relative = Path::new(requested);

        // Rule 1: relative only.
        if relative.is_absolute() || relative.has_root() {
            return Err(ToolError::Denied(format!(
                "'{requested}' is an absolute path. Use a path inside the sandbox."
            )));
        }

        // Rule 2: no `..` part. We check one component at a time, so a name
        // such as `a..b` is fine.
        if relative
            .components()
            .any(|part| part == Component::ParentDir)
        {
            return Err(ToolError::Denied(format!("'{requested}' contains '..'")));
        }

        // Rule 3: follow symbolic links, then check the real path.
        let real = self
            .root
            .join(relative)
            .canonicalize()
            .map_err(|e| ToolError::Failed(format!("could not open '{requested}': {e}")))?;
        if !real.starts_with(&self.root) {
            return Err(ToolError::Denied(format!(
                "'{requested}' leads outside the sandbox"
            )));
        }
        // Rule 4: metadata reads the file's type without opening it.
        let meta = std::fs::metadata(&real)
            .map_err(|e| ToolError::Failed(format!("could not look at '{requested}': {e}")))?;
        if !meta.is_file() {
            return Err(ToolError::Denied(format!(
                "'{requested}' is not a regular file (a folder, a pipe or a device)"
            )));
        }
        Ok(real)
    }
}

impl Tool for ReadFile {
    fn name(&self) -> &str {
        "read_file"
    }

    fn description(&self) -> &str {
        "Reads a UTF-8 text file. The path is relative to the sandbox folder."
    }

    fn input_schema(&self) -> Value {
        json!({
            "type": "object",
            "properties": {
                "path": {"type": "string", "description": "A relative path, such as notes/todo.txt"}
            },
            "required": ["path"]
        })
    }

    fn call<'a>(&'a self, input: Value) -> ToolFuture<'a> {
        Box::pin(async move {
            let input: Input =
                serde_json::from_value(input).map_err(|e| ToolError::BadInput(e.to_string()))?;
            let path = self.resolve(&input.path)?;
            let file = tokio::fs::File::open(&path)
                .await
                .map_err(|e| ToolError::Failed(format!("could not open '{}': {e}", input.path)))?;

            // Read one byte past the cap. Getting that byte proves the file is
            // too big. We never read more than the cap plus one.
            let mut bytes = Vec::new();
            file.take(MAX_BYTES + 1)
                .read_to_end(&mut bytes)
                .await
                .map_err(|e| ToolError::Failed(format!("could not read '{}': {e}", input.path)))?;
            if bytes.len() as u64 > MAX_BYTES {
                return Err(ToolError::Failed(format!(
                    "'{}' is larger than 64 KiB",
                    input.path
                )));
            }
            String::from_utf8(bytes)
                .map_err(|_| ToolError::Failed(format!("'{}' is not UTF-8 text", input.path)))
        })
    }
}
