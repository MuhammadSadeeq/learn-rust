//! Loading the quest list (`quests/quests.toml`) and the learner's progress.
//!
//! The Forge has no dependencies, so this module contains a tiny parser for
//! the subset of TOML the quest list uses: `[[quest]]` tables with string,
//! integer, boolean and `"""multi-line"""` values.

use std::collections::BTreeSet;
use std::fmt;
use std::fs;
use std::io;
use std::path::{Path, PathBuf};

/// How a quest is checked.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub enum Kind {
    /// One `.rs` file, compiled with `rustc --test`.
    #[default]
    Std,
    /// A small cargo package under `quests/pkgs/`, checked with `cargo test`.
    Cargo,
}

/// One exercise, as described in `quests.toml`.
#[derive(Debug, Clone, Default)]
pub struct Quest {
    pub name: String,
    pub chapter: u32,
    pub path: String,
    pub title: String,
    pub summary: String,
    pub hint: String,
    pub boss: bool,
    pub kind: Kind,
}

impl Quest {
    /// Absolute path of the learner's file for this quest. For a cargo quest
    /// it is the package directory.
    pub fn file(&self, root: &Path) -> PathBuf {
        root.join("quests").join(&self.path)
    }

    /// Absolute path of the reference solution. For a cargo quest it is the
    /// package directory.
    pub fn solution(&self, root: &Path) -> PathBuf {
        root.join("solutions").join(&self.path)
    }

    /// The file the learner is asked to open, relative to `quests/`.
    pub fn edit_path(&self) -> String {
        match self.kind {
            Kind::Std => self.path.clone(),
            Kind::Cargo => format!("{}/src/lib.rs", self.path),
        }
    }

    /// The files a quest is made of, given its `file` or `solution` path. A
    /// cargo quest has its manifest and every `.rs` file under `src/` and `tests/`.
    pub fn source_files(&self, base: &Path) -> Vec<PathBuf> {
        match self.kind {
            Kind::Std => vec![base.to_path_buf()],
            Kind::Cargo => {
                let mut files = vec![base.join("Cargo.toml")];
                collect_rs(&base.join("src"), &mut files);
                collect_rs(&base.join("tests"), &mut files);
                files.sort();
                files
            }
        }
    }
}

/// Adds every `.rs` file under `dir`, recursively, to `out`. A missing directory adds nothing.
fn collect_rs(dir: &Path, out: &mut Vec<PathBuf>) {
    let Ok(entries) = fs::read_dir(dir) else {
        return;
    };
    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            collect_rs(&path, out);
        } else if path.extension().is_some_and(|ext| ext == "rs") {
            out.push(path);
        }
    }
}

#[derive(Debug)]
pub struct ParseError {
    pub line: usize,
    pub message: String,
}

impl fmt::Display for ParseError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "quests.toml line {}: {}", self.line, self.message)
    }
}

impl std::error::Error for ParseError {}

/// Parses the quest list. Unknown keys are ignored so the format can grow.
pub fn parse(text: &str) -> Result<Vec<Quest>, ParseError> {
    let mut quests: Vec<Quest> = Vec::new();
    let mut lines = text.lines().enumerate();

    while let Some((index, raw)) = lines.next() {
        let line_no = index + 1;
        let line = raw.trim();
        if line.is_empty() || line.starts_with('#') {
            continue;
        }
        if line == "[[quest]]" {
            quests.push(Quest::default());
            continue;
        }
        let Some((key, value)) = line.split_once('=') else {
            return Err(ParseError {
                line: line_no,
                message: format!("expected `key = value`, found `{line}`"),
            });
        };
        let key = key.trim();
        let value = value.trim();
        let Some(quest) = quests.last_mut() else {
            return Err(ParseError {
                line: line_no,
                message: "a key appeared before the first [[quest]]".into(),
            });
        };

        let parsed = if let Some(rest) = value.strip_prefix("\"\"\"") {
            // Multi-line string: collect lines until the closing """.
            let mut body = String::new();
            if let Some(inline) = rest.strip_suffix("\"\"\"") {
                body.push_str(inline);
            } else {
                if !rest.is_empty() {
                    body.push_str(rest);
                    body.push('\n');
                }
                loop {
                    let Some((_, next)) = lines.next() else {
                        return Err(ParseError {
                            line: line_no,
                            message: "unterminated \"\"\" string".into(),
                        });
                    };
                    if let Some(last) = next.trim_end().strip_suffix("\"\"\"") {
                        body.push_str(last);
                        break;
                    }
                    body.push_str(next);
                    body.push('\n');
                }
            }
            Value::Text(body.trim_end().to_string())
        } else if let Some(inner) = value.strip_prefix('"').and_then(|v| v.strip_suffix('"')) {
            Value::Text(unescape(inner))
        } else if value == "true" || value == "false" {
            Value::Bool(value == "true")
        } else if let Ok(n) = value.parse::<u32>() {
            Value::Number(n)
        } else {
            return Err(ParseError {
                line: line_no,
                message: format!("can't read the value `{value}`"),
            });
        };

        match (key, parsed) {
            ("name", Value::Text(s)) => quest.name = s,
            ("path", Value::Text(s)) => quest.path = s,
            ("title", Value::Text(s)) => quest.title = s,
            ("summary", Value::Text(s)) => quest.summary = s,
            ("hint", Value::Text(s)) => quest.hint = s,
            ("chapter", Value::Number(n)) => quest.chapter = n,
            ("boss", Value::Bool(b)) => quest.boss = b,
            ("kind", Value::Text(s)) => {
                quest.kind = match s.as_str() {
                    "std" => Kind::Std,
                    "cargo" => Kind::Cargo,
                    other => {
                        return Err(ParseError {
                            line: line_no,
                            message: format!("unknown kind `{other}`. Use \"std\" or \"cargo\"."),
                        });
                    }
                };
            }
            _ => {} // unknown or mistyped keys are ignored
        }
    }

    for (i, q) in quests.iter().enumerate() {
        if q.name.is_empty() || q.path.is_empty() {
            return Err(ParseError {
                line: 0,
                message: format!("quest #{} is missing a name or path", i + 1),
            });
        }
    }
    Ok(quests)
}

enum Value {
    Text(String),
    Number(u32),
    Bool(bool),
}

fn unescape(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    let mut chars = s.chars();
    while let Some(c) = chars.next() {
        if c != '\\' {
            out.push(c);
            continue;
        }
        match chars.next() {
            Some('n') => out.push('\n'),
            Some('t') => out.push('\t'),
            Some(other) => out.push(other),
            None => {}
        }
    }
    out
}

/// Which quests the learner has passed. Stored as one quest name per line in
/// `.forge-progress` at the repo root, so it can be committed with your work.
#[derive(Debug, Default)]
pub struct Progress {
    path: PathBuf,
    pub solved: BTreeSet<String>,
}

impl Progress {
    pub fn load(root: &Path) -> Progress {
        let path = root.join(".forge-progress");
        let solved = fs::read_to_string(&path)
            .map(|text| {
                text.lines()
                    .map(str::trim)
                    .filter(|l| !l.is_empty() && !l.starts_with('#'))
                    .map(String::from)
                    .collect()
            })
            .unwrap_or_default();
        Progress { path, solved }
    }

    pub fn is_solved(&self, quest: &Quest) -> bool {
        self.solved.contains(&quest.name)
    }

    pub fn mark(&mut self, quest: &Quest, solved: bool) -> io::Result<()> {
        let changed = if solved {
            self.solved.insert(quest.name.clone())
        } else {
            self.solved.remove(&quest.name)
        };
        if changed { self.save() } else { Ok(()) }
    }

    fn save(&self) -> io::Result<()> {
        let mut text =
            String::from("# Quests you have passed in the Forge. Managed by `cargo forge`.\n");
        for name in &self.solved {
            text.push_str(name);
            text.push('\n');
        }
        fs::write(&self.path, text)
    }
}

/// Index of the first quest not yet solved, if any.
pub fn current(quests: &[Quest], progress: &Progress) -> Option<usize> {
    quests.iter().position(|q| !progress.is_solved(q))
}

#[cfg(test)]
mod tests {
    use super::*;

    const SAMPLE: &str = r#"
# comment
[[quest]]
name = "hello1"
chapter = 1
path = "01_hello/hello1.rs"
title = "First words"
summary = "Say \"hi\"."
hint = """
1. Look at the macro.
2. It needs a `!`.
"""

[[quest]]
name = "boss1"
chapter = 4
path = "04/boss1.rs"
title = "Boss"
boss = true
hint = """One line."""
"#;

    #[test]
    fn parses_quests() {
        let qs = parse(SAMPLE).unwrap();
        assert_eq!(qs.len(), 2);
        assert_eq!(qs[0].name, "hello1");
        assert_eq!(qs[0].chapter, 1);
        assert_eq!(qs[0].summary, "Say \"hi\".");
        assert_eq!(qs[0].hint, "1. Look at the macro.\n2. It needs a `!`.");
        assert!(!qs[0].boss);
        assert!(qs[1].boss);
        assert_eq!(qs[1].hint, "One line.");
    }

    #[test]
    fn reports_bad_lines() {
        let err = parse("[[quest]]\nname \"x\"").unwrap_err();
        assert_eq!(err.line, 2);
    }

    #[test]
    fn rejects_quest_without_path() {
        assert!(parse("[[quest]]\nname = \"x\"").is_err());
    }

    #[test]
    fn parses_kind_and_defaults_to_std() {
        let text =
            "[[quest]]\nname = \"clap1\"\nchapter = 16\nkind = \"cargo\"\npath = \"pkgs/clap1\"\n";
        let qs = parse(text).unwrap();
        assert_eq!(qs[0].kind, Kind::Cargo);
        assert_eq!(parse(SAMPLE).unwrap()[0].kind, Kind::Std);
    }

    #[test]
    fn rejects_unknown_kind() {
        let err = parse("[[quest]]\nname = \"x\"\npath = \"x.rs\"\nkind = \"wasm\"").unwrap_err();
        assert_eq!(err.line, 4);
    }

    /// The real list must be consistent: unique names, a file or package for
    /// each quest, a solution, and a [workspace] in every cargo package.
    #[test]
    fn shipped_quests_are_well_formed() {
        let root = Path::new(env!("CARGO_MANIFEST_DIR")).join("..");
        let text = fs::read_to_string(root.join("quests/quests.toml")).expect("read quests.toml");
        let quests = parse(&text).expect("parse quests.toml");
        let mut names = BTreeSet::new();
        for q in &quests {
            assert!(names.insert(q.name.clone()), "duplicate quest {}", q.name);
            let file = q.file(&root);
            assert!(q.solution(&root).exists(), "{} has no solution", q.name);
            match q.kind {
                Kind::Std => assert!(file.is_file(), "{} has no file", q.name),
                Kind::Cargo => {
                    let manifest = fs::read_to_string(file.join("Cargo.toml"))
                        .unwrap_or_else(|_| panic!("{} has no Cargo.toml", q.name));
                    // An empty [workspace] keeps the package out of the course workspace.
                    assert!(
                        manifest.contains("[workspace]"),
                        "{} needs [workspace]",
                        q.name
                    );
                    // The Forge cleans the package by this name (see runner.rs).
                    assert!(
                        manifest.contains(&format!("name = \"{}\"", q.name)),
                        "{} needs a package named after it",
                        q.name
                    );
                    assert!(
                        file.join("src/lib.rs").is_file(),
                        "{} has no src/lib.rs",
                        q.name
                    );
                }
            }
        }
    }
}
