//! Terminal output: colors, the progress bar and chapter names.

use std::fs;
use std::io::{self, IsTerminal, Write};
use std::path::Path;
use std::thread;
use std::time::Duration;

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

/// Breaks `text` into lines of at most `width` chars, on spaces. A word is never
/// split, so a word longer than `width` gets a line of its own.
pub fn wrap(text: &str, width: usize) -> Vec<String> {
    let mut lines = Vec::new();
    let mut line = String::new();
    for word in text.split_whitespace() {
        if !line.is_empty() && line.chars().count() + 1 + word.chars().count() > width {
            lines.push(std::mem::take(&mut line));
        }
        if !line.is_empty() {
            line.push(' ');
        }
        line.push_str(word);
    }
    if !line.is_empty() {
        lines.push(line);
    }
    lines
}

/// Draws `frames` one after another in the same place, `delay` apart. Every
/// frame must have the same number of lines. Without color, or with
/// FORGE_NO_ANIMATION set, only the last frame is printed, as plain text.
pub fn animate(style: Style, frames: &[Vec<String>], delay: Duration) {
    let Some(last) = frames.last() else {
        return;
    };
    debug_assert!(
        frames.iter().all(|f| f.len() == last.len()),
        "animation frames must all have the same height"
    );
    if !style.color || std::env::var_os("FORGE_NO_ANIMATION").is_some() {
        for line in last {
            println!("{line}");
        }
        return;
    }
    print!("\x1b[?25l");
    let mut height = 0;
    for (i, frame) in frames.iter().enumerate() {
        if i > 0 {
            thread::sleep(delay);
            // Move back up over the previous frame, then redraw this one.
            print!("\x1b[{height}F");
        }
        for line in frame {
            println!("\x1b[2K{line}");
        }
        let _ = io::stdout().flush();
        height = frame.len();
    }
    print!("\x1b[?25h");
    let _ = io::stdout().flush();
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

    #[test]
    fn wraps_on_spaces_only() {
        assert_eq!(wrap("aa bb cc", 5), vec!["aa bb", "cc"]);
        assert_eq!(wrap("abcdefgh ij", 5), vec!["abcdefgh", "ij"]);
    }
}
