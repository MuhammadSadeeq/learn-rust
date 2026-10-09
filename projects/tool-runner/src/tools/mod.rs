//! Tools: the things the model may ask us to run.
//!
//! Laravel counterpart: small invokable action classes, each one registered
//! under a name in the container.
//!
//! The model never runs anything itself. It asks by name, with JSON input. We
//! check the input, run the tool, and send the text back as a `tool_result`.
//! A tool that refuses (a path outside the sandbox, a program that is not on
//! the list) returns a `ToolError`. That error goes back to the model as an
//! error result, and the loop keeps going.

use std::collections::HashMap;
use std::future::Future;
use std::io;
use std::path::Path;
use std::pin::Pin;

use serde_json::Value;
use thiserror::Error;

use crate::protocol::ToolDefinition;

pub mod calculator;
pub mod read_file;
pub mod run_command;

/// What a tool call returns: a future that finishes with text or an error.
/// It is boxed so that different tools share one type.
pub type ToolFuture<'a> = Pin<Box<dyn Future<Output = Result<String, ToolError>> + Send + 'a>>;

#[derive(Debug, Error, PartialEq, Eq)]
pub enum ToolError {
    /// The input did not match the schema, or a value was not usable.
    #[error("bad input: {0}")]
    BadInput(String),
    /// A safety rule said no. Nothing was run.
    #[error("denied: {0}")]
    Denied(String),
    /// The tool ran and failed, or it ran too long.
    #[error("failed: {0}")]
    Failed(String),
}

/// A capability the model can call.
pub trait Tool: Send + Sync {
    /// The name the model uses to call the tool.
    fn name(&self) -> &str;
    /// One or two sentences the model reads when it picks a tool.
    fn description(&self) -> &str;
    /// A JSON Schema for the input object.
    fn input_schema(&self) -> Value;
    /// Runs the tool. The `'a` ties the future to `&self`, so the future
    /// cannot outlive the tool it came from.
    fn call<'a>(&'a self, input: Value) -> ToolFuture<'a>;
}

/// The tools we know, by name. Each name appears once.
#[derive(Default)]
pub struct Registry {
    tools: HashMap<String, Box<dyn Tool>>,
}

impl Registry {
    pub fn new() -> Self {
        Self::default()
    }

    /// Adds a tool under its own name. A second tool with the same name
    /// replaces the first.
    pub fn register(&mut self, tool: impl Tool + 'static) {
        self.tools.insert(tool.name().to_string(), Box::new(tool));
    }

    pub fn get(&self, name: &str) -> Option<&dyn Tool> {
        self.tools.get(name).map(|tool| tool.as_ref())
    }

    /// The definitions the model sees. Sorted by name, so the request is the
    /// same from one turn to the next.
    pub fn definitions(&self) -> Vec<ToolDefinition> {
        let mut definitions: Vec<ToolDefinition> = self
            .tools
            .values()
            .map(|tool| ToolDefinition {
                name: tool.name().to_string(),
                description: tool.description().to_string(),
                input_schema: tool.input_schema(),
            })
            .collect();
        definitions.sort_by(|a, b| a.name.cmp(&b.name));
        definitions
    }
}

/// The three built-in tools. The file tools are sandboxed to `root`, and
/// `run_command` may start only the programs in `allowed`.
pub fn standard(root: &Path, allowed: Vec<String>) -> io::Result<Registry> {
    let mut registry = Registry::new();
    registry.register(calculator::Calculator);
    registry.register(read_file::ReadFile::new(root)?);
    registry.register(run_command::RunCommand::new(root, allowed)?);
    Ok(registry)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn the_standard_registry_lists_three_tools_sorted_by_name() {
        let registry = standard(Path::new("."), vec!["echo".into()]).unwrap();
        let names: Vec<String> = registry
            .definitions()
            .into_iter()
            .map(|definition| definition.name)
            .collect();
        assert_eq!(names, ["calculator", "read_file", "run_command"]);
    }
}
