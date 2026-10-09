//! Terminal output: colors, the progress bar and chapter names.

use std::fs;
use std::io::{self, IsTerminal, Write};
use std::path::Path;

/// ANSI styling that switches itself off for pipes and `NO_COLOR`.
#[derive(Clone, Copy)]
pub struct Style {
    pub color: bool,
}

impl Style {
    pub fn detect() -> Style {
        let color = io::stdout().is_terminal() && std::env::var_os("NO_COLOR").is_none();
        Style { color }
    }

    fn paint(self, code: &str, text: &str) -> String {
        if self.color {
            format!("\u{1b}[{code}m{text}\u{1b}[0m")
        } else {
            text.to_string()
        }
    }

    pub fn bold(self, t: &str) -> String {
        self.paint("1", t)
    }
    pub fn dim(self, t: &str) -> String {
        self.paint("2", t)
    }
    pub fn red(self, t: &str) -> String {
        self.paint("1;31", t)
    }
    pub fn green(self, t: &str) -> String {
        self.paint("1;32", t)
    }
    pub fn yellow(self, t: &str) -> String {
        self.paint("33", t)
    }
    pub fn cyan(self, t: &str) -> String {
        self.paint("36", t)
    }
    /// The course's iron-oxide orange.
    pub fn oxide(self, t: &str) -> String {
        self.paint("1;38;5;202", t)
    }

    pub fn clear(self) {
        if self.color {
            print!("\u{1b}[2J\u{1b}[H");
            let _ = io::stdout().flush();
        }
    }
}

pub fn progress_bar(done: usize, total: usize, width: usize) -> String {
    let filled = (done * width).checked_div(total).unwrap_or(0).min(width);
    format!("{}{}", "▰".repeat(filled), "▱".repeat(width - filled))
}

/// Keeps the first `max` lines of long compiler output.
pub fn first_lines(text: &str, max: usize) -> (String, usize) {
    let lines: Vec<&str> = text.lines().collect();
    if lines.len() <= max {
        return (text.trim_end().to_string(), 0);
    }
    (lines[..max].join("\n"), lines.len() - max)
}

/// Chapter titles and page slugs, read from the website's course map so the
/// two never disagree. Falls back to "Chapter N" if the site is missing.
pub struct Chapters {
    entries: Vec<(u32, String, String)>, // (number, slug, title)
}

impl Chapters {
    pub fn load(root: &Path) -> Chapters {
        let text = fs::read_to_string(root.join("site/assets/course-data.js")).unwrap_or_default();
        let entries = text
            .lines()
            .filter_map(|line| {
                let n = field(line, "n:")?.trim().parse().ok()?;
                let slug = quoted(line, "slug:")?;
                let title = quoted(line, "title:")?;
                Some((n, slug, title))
            })
            .collect();
        Chapters { entries }
    }

    pub fn title(&self, n: u32) -> String {
        self.entries
            .iter()
            .find(|e| e.0 == n)
            .map(|e| e.2.clone())
            .unwrap_or_else(|| format!("Chapter {n}"))
    }

    pub fn page(&self, n: u32) -> Option<String> {
        self.entries
            .iter()
            .find(|e| e.0 == n)
            .map(|e| format!("site/chapters/{}.html", e.1))
    }
}

fn field<'a>(line: &'a str, key: &str) -> Option<&'a str> {
    let start = line.find(key)? + key.len();
    let rest = &line[start..];
    let end = rest.find(',').unwrap_or(rest.len());
    Some(&rest[..end])
}

fn quoted(line: &str, key: &str) -> Option<String> {
    let start = line.find(key)? + key.len();
    let rest = line[start..].trim_start().strip_prefix('"')?;
    let end = rest.find('"')?;
    Some(rest[..end].to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn bar_fills_proportionally() {
        assert_eq!(progress_bar(0, 4, 4), "▱▱▱▱");
        assert_eq!(progress_bar(2, 4, 4), "▰▰▱▱");
        assert_eq!(progress_bar(4, 4, 4), "▰▰▰▰");
        assert_eq!(progress_bar(0, 0, 3), "▱▱▱");
    }

    #[test]
    fn reads_chapter_lines() {
        let line = r#"    { n: 6,  act: 2, slug: "06-ownership", title: "One Owner", idea: "x", mins: 45 },"#;
        assert_eq!(field(line, "n:").map(str::trim), Some("6"));
        assert_eq!(quoted(line, "slug:").as_deref(), Some("06-ownership"));
        assert_eq!(quoted(line, "title:").as_deref(), Some("One Owner"));
    }

    #[test]
    fn truncates_long_output() {
        let (text, hidden) = first_lines("a\nb\nc\nd", 2);
        assert_eq!(text, "a\nb");
        assert_eq!(hidden, 2);
    }
}
