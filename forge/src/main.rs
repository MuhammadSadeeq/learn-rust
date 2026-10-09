//! The Oxidize Forge: a quest trainer for the Oxidize Rust course.
//!
//! Run it with `cargo forge` from anywhere inside the repository. It finds
//! your first unfinished quest, compiles it, and re-checks it every time you
//! save the file. When the tests pass, press Enter to move on.
//!
//! This program uses only the standard library. Chapter 21 invites you to read
//! it: everything here (enums, Result, iterators, threads, channels, process
//! spawning) is something the course teaches.

mod quests;
mod runner;
mod ui;

use std::fs;
use std::io::{self, BufRead};
use std::path::{Path, PathBuf};
use std::process::{Command, ExitCode};
use std::sync::mpsc::{self, RecvTimeoutError};
use std::thread;
use std::time::{Duration, SystemTime};

use quests::{Progress, Quest};
use runner::Outcome;
use ui::{Chapters, Style};

const HELP: &str = "\
Oxidize Forge: hands-on Rust quests, checked by the real compiler.

USAGE
    cargo forge                 watch mode: work through quests in order
    cargo forge list            every quest and your progress
    cargo forge hint [QUEST]    a hint for the current (or named) quest
    cargo forge check [QUEST]   compile and test one quest once
    cargo forge verify          re-check every quest and update your progress
    cargo forge solution QUEST  show where the reference solution is
    cargo forge reset QUEST     restore a quest file to its original state (git)
    cargo forge help            this text

IN WATCH MODE
    save the file   re-check automatically
    Enter           next quest (after you pass)
    h / l / s / q   hint / list / skip for now / quit   (type the letter, then Enter)
";

struct Ctx {
    root: PathBuf,
    quests: Vec<Quest>,
    progress: Progress,
    chapters: Chapters,
    style: Style,
}

fn main() -> ExitCode {
    let args: Vec<String> = std::env::args().skip(1).collect();
    let style = Style::detect();
    match run(&args, style) {
        Ok(code) => code,
        Err(e) => {
            eprintln!("{} {e}", style.red("forge:"));
            ExitCode::FAILURE
        }
    }
}

fn run(args: &[String], style: Style) -> Result<ExitCode, Box<dyn std::error::Error>> {
    let command = args.first().map(String::as_str).unwrap_or("watch");
    if matches!(command, "help" | "-h" | "--help") {
        print!("{HELP}");
        return Ok(ExitCode::SUCCESS);
    }

    let root = find_root().ok_or(
        "couldn't find quests/quests.toml. Run `cargo forge` inside the Oxidize repository.",
    )?;
    let quests = quests::parse(&fs::read_to_string(root.join("quests/quests.toml"))?)?;
    let progress = Progress::load(&root);
    let chapters = Chapters::load(&root);
    let mut ctx = Ctx {
        root,
        quests,
        progress,
        chapters,
        style,
    };
    let target = args.get(1).map(String::as_str);

    match command {
        "watch" => watch(&mut ctx)
            .map(|_| ExitCode::SUCCESS)
            .map_err(Into::into),
        "list" => {
            list(&ctx);
            Ok(ExitCode::SUCCESS)
        }
        "hint" => {
            let q = pick(&ctx, target)?;
            print_hint(&ctx, q);
            Ok(ExitCode::SUCCESS)
        }
        "check" => {
            let i = pick_index(&ctx, target)?;
            let outcome = check(&mut ctx, i)?;
            Ok(if outcome.passed() {
                ExitCode::SUCCESS
            } else {
                ExitCode::FAILURE
            })
        }
        "verify" => verify(&mut ctx, args.iter().any(|a| a == "--solutions")),
        "solution" => {
            let q = pick(&ctx, target)?;
            let path = q.solution(&ctx.root);
            if !ctx.progress.is_solved(q) {
                println!("{}", style.yellow("You haven't passed this quest yet. Peeking now skips the part where the learning happens."));
                println!(
                    "{}",
                    style.dim("Try `cargo forge hint` first. If you still want it:")
                );
            }
            println!("{}", path.display());
            Ok(ExitCode::SUCCESS)
        }
        "reset" => {
            let name = target.ok_or("which quest? e.g. `cargo forge reset move1`")?;
            let i = pick_index(&ctx, Some(name))?;
            reset(&mut ctx, i)?;
            Ok(ExitCode::SUCCESS)
        }
        other => Err(format!("unknown command `{other}`. Try `cargo forge help`.").into()),
    }
}

/// Walks up from the current directory looking for `quests/quests.toml`,
/// falling back to the directory this binary was built from.
fn find_root() -> Option<PathBuf> {
    let has_quests = |p: &Path| p.join("quests").join("quests.toml").is_file();
    if let Ok(mut dir) = std::env::current_dir() {
        loop {
            if has_quests(&dir) {
                return Some(dir);
            }
            if !dir.pop() {
                break;
            }
        }
    }
    let built_from = Path::new(env!("CARGO_MANIFEST_DIR"))
        .parent()?
        .to_path_buf();
    has_quests(&built_from).then_some(built_from)
}

fn pick_index(ctx: &Ctx, name: Option<&str>) -> Result<usize, String> {
    match name {
        Some(n) => ctx.quests.iter().position(|q| q.name == n).ok_or_else(|| {
            format!("there's no quest named `{n}`. `cargo forge list` shows them all.")
        }),
        None => quests::current(&ctx.quests, &ctx.progress)
            .ok_or_else(|| "every quest is solved. Name one explicitly.".to_string()),
    }
}

fn pick<'a>(ctx: &'a Ctx, name: Option<&str>) -> Result<&'a Quest, String> {
    pick_index(ctx, name).map(|i| &ctx.quests[i])
}

// ---------------------------------------------------------------- commands

fn check(ctx: &mut Ctx, i: usize) -> io::Result<Outcome> {
    let q = ctx.quests[i].clone();
    let outcome = runner::run(&ctx.root, &q.file(&ctx.root), &q.name, ctx.style.color)?;
    if outcome.passed() {
        ctx.progress.mark(&q, true)?;
    }
    header(ctx, i);
    report(ctx, &q, &outcome);
    Ok(outcome)
}

fn list(ctx: &Ctx) {
    let s = ctx.style;
    let current = quests::current(&ctx.quests, &ctx.progress);
    let mut last_chapter = 0;
    for (i, q) in ctx.quests.iter().enumerate() {
        if q.chapter != last_chapter {
            last_chapter = q.chapter;
            println!(
                "\n{}",
                s.bold(&format!(
                    "Chapter {:02} · {}",
                    q.chapter,
                    ctx.chapters.title(q.chapter)
                ))
            );
        }
        let (mark, name) = if ctx.progress.is_solved(q) {
            (s.green("✓"), s.dim(&format!("{:<18}", q.name)))
        } else if Some(i) == current {
            (s.oxide("▸"), s.oxide(&format!("{:<18}", q.name)))
        } else {
            (s.dim("·"), format!("{:<18}", q.name))
        };
        let boss = if q.boss {
            s.oxide(" BOSS")
        } else {
            String::new()
        };
        let here = if Some(i) == current {
            s.oxide("  ← you are here")
        } else {
            String::new()
        };
        println!("  {mark} {name} {}{boss}{here}", q.title);
    }
    let done = ctx.progress.solved.len().min(ctx.quests.len());
    println!(
        "\n{} {}/{} quests passed\n",
        ui::progress_bar(done, ctx.quests.len(), 30),
        done,
        ctx.quests.len()
    );
}

fn print_hint(ctx: &Ctx, q: &Quest) {
    let s = ctx.style;
    println!(
        "{} {}",
        s.oxide("Hint ·"),
        s.bold(&format!("{} ({})", q.title, q.name))
    );
    if q.hint.trim().is_empty() {
        println!(
            "No hint written for this quest yet. Re-read the header comment in the file, and the chapter it points to."
        );
    } else {
        for line in q.hint.lines() {
            println!("  {line}");
        }
    }
    if let Some(page) = ctx.chapters.page(q.chapter) {
        println!("{}", s.dim(&format!("\nThe chapter: {page}")));
    }
}

fn verify(ctx: &mut Ctx, solutions: bool) -> Result<ExitCode, Box<dyn std::error::Error>> {
    let s = ctx.style;
    let mut failed = 0;
    let total = ctx.quests.len();
    for i in 0..total {
        let q = ctx.quests[i].clone();
        let file = if solutions {
            q.solution(&ctx.root)
        } else {
            q.file(&ctx.root)
        };
        if !file.exists() {
            println!(
                "  {} {:<18} {}",
                s.yellow("?"),
                q.name,
                s.dim("file missing")
            );
            failed += 1;
            continue;
        }
        let outcome = runner::run(&ctx.root, &file, &q.name, false)?;
        let ok = outcome.passed();
        if !solutions {
            ctx.progress.mark(&q, ok)?;
        }
        if !ok {
            failed += 1;
        }
        let status = if ok { s.green("✓") } else { s.red("✗") };
        println!("  {status} {:<18} {}", q.name, s.dim(&q.title));
    }
    let passed = total - failed;
    println!(
        "\n{passed}/{total} {}",
        if solutions {
            "solutions pass"
        } else {
            "quests pass"
        }
    );
    // In --solutions mode a failure is a bug in the course; for learners an
    // unfinished quest is normal, so plain `verify` always exits 0.
    Ok(if solutions && failed > 0 {
        ExitCode::FAILURE
    } else {
        ExitCode::SUCCESS
    })
}

fn reset(ctx: &mut Ctx, i: usize) -> io::Result<()> {
    let q = ctx.quests[i].clone();
    let rel = Path::new("quests").join(&q.path);
    let status = Command::new("git")
        .arg("checkout")
        .arg("--")
        .arg(&rel)
        .current_dir(&ctx.root)
        .status()?;
    if status.success() {
        ctx.progress.mark(&q, false)?;
        println!("Restored {} to its original state.", rel.display());
    } else {
        println!(
            "git couldn't restore {}. Is this a git checkout?",
            rel.display()
        );
    }
    Ok(())
}

// ---------------------------------------------------------------- watch mode

enum Input {
    Line(String),
    Closed,
}

fn watch(ctx: &mut Ctx) -> io::Result<()> {
    check_toolchain(ctx.style);

    // Read stdin on its own thread and send each line through a channel, so
    // the main loop can wait for "a line OR a file change" at the same time.
    let (tx, rx) = mpsc::channel::<Input>();
    thread::spawn(move || {
        for line in io::stdin().lock().lines() {
            let Ok(line) = line else { break };
            if tx.send(Input::Line(line)).is_err() {
                return;
            }
        }
        let _ = tx.send(Input::Closed);
    });
    let mut stdin_open = true;
    let mut skipped: Vec<String> = Vec::new();

    loop {
        let next = ctx
            .quests
            .iter()
            .position(|q| !ctx.progress.is_solved(q) && !skipped.contains(&q.name))
            .or_else(|| {
                skipped.clear();
                quests::current(&ctx.quests, &ctx.progress)
            });
        let Some(i) = next else {
            finale(ctx);
            return Ok(());
        };
        let q = ctx.quests[i].clone();
        let file = q.file(&ctx.root);
        if !file.exists() {
            println!(
                "{} {} is missing. Run `cargo forge reset {}` or skip it with `s`.",
                ctx.style.red("!"),
                file.display(),
                q.name
            );
        }

        let mut seen = modified(&file);
        let mut outcome = runner::run(&ctx.root, &file, &q.name, ctx.style.color)?;
        let mut passed = settle(ctx, i, &q, &outcome)?;

        loop {
            let input = if stdin_open {
                match rx.recv_timeout(Duration::from_millis(300)) {
                    Ok(input) => Some(input),
                    Err(RecvTimeoutError::Timeout) => None,
                    Err(RecvTimeoutError::Disconnected) => Some(Input::Closed),
                }
            } else {
                thread::sleep(Duration::from_millis(300));
                None
            };

            match input {
                Some(Input::Closed) => stdin_open = false,
                Some(Input::Line(line)) => match line.trim() {
                    "" | "n" if passed => break,
                    "q" | "quit" | "exit" => return Ok(()),
                    "h" | "hint" => {
                        println!();
                        print_hint(ctx, &q);
                        footer(ctx, passed);
                    }
                    "l" | "list" => {
                        list(ctx);
                        footer(ctx, passed);
                    }
                    "s" | "skip" => {
                        skipped.push(q.name.clone());
                        break;
                    }
                    _ => {
                        // Enter on an unsolved quest just re-checks it.
                        outcome = runner::run(&ctx.root, &file, &q.name, ctx.style.color)?;
                        passed = settle(ctx, i, &q, &outcome)?;
                    }
                },
                None => {
                    let now = modified(&file);
                    if now != seen {
                        seen = now;
                        // Editors often save in two steps; give the write a moment to land.
                        thread::sleep(Duration::from_millis(80));
                        outcome = runner::run(&ctx.root, &file, &q.name, ctx.style.color)?;
                        passed = settle(ctx, i, &q, &outcome)?;
                    }
                }
            }
        }
    }
}

/// Draws the result and records a pass. Returns whether the quest passed.
fn settle(ctx: &mut Ctx, i: usize, q: &Quest, outcome: &Outcome) -> io::Result<bool> {
    let passed = outcome.passed();
    if passed {
        ctx.progress.mark(q, true)?;
    }
    ctx.style.clear();
    header(ctx, i);
    report(ctx, q, outcome);
    footer(ctx, passed);
    Ok(passed)
}

fn header(ctx: &Ctx, i: usize) {
    let s = ctx.style;
    let q = &ctx.quests[i];
    let done = ctx.progress.solved.len().min(ctx.quests.len());
    println!(
        "{}  {}  {}",
        s.oxide("⚒  OXIDIZE FORGE"),
        ui::progress_bar(done, ctx.quests.len(), 24),
        s.dim(&format!("{done}/{} passed", ctx.quests.len()))
    );
    println!("{}", s.dim(&"─".repeat(64)));
    let boss = if q.boss {
        s.oxide("BOSS · ")
    } else {
        String::new()
    };
    println!(
        "{}{} {}",
        boss,
        s.bold(&format!("Quest {} · {}", i + 1, q.title)),
        s.dim(&format!("({})", q.name))
    );
    println!(
        "{}",
        s.dim(&format!(
            "Chapter {:02} · {}",
            q.chapter,
            ctx.chapters.title(q.chapter)
        ))
    );
    if !q.summary.is_empty() {
        println!("{}", q.summary);
    }
    println!("Edit {}", s.cyan(&format!("quests/{}", q.path)));
    println!();
}

fn report(ctx: &Ctx, q: &Quest, outcome: &Outcome) {
    let s = ctx.style;
    match outcome {
        Outcome::CompileError { output } => {
            println!(
                "{} {}\n",
                s.red("✗ Doesn't compile yet."),
                s.dim("Read the first error carefully; it's usually the only one that matters.")
            );
            let (text, hidden) = ui::first_lines(output, 45);
            println!("{text}");
            if hidden > 0 {
                println!(
                    "{}",
                    s.dim(&format!(
                        "… {hidden} more lines. Fix the first error, then save."
                    ))
                );
            }
        }
        Outcome::TestsFailed { output } => {
            println!(
                "{} {}\n",
                s.yellow("◐ It compiles. Some tests fail."),
                s.dim("Compare the expected and actual values below.")
            );
            let (text, hidden) = ui::first_lines(output, 45);
            println!("{text}");
            if hidden > 0 {
                println!("{}", s.dim(&format!("… {hidden} more lines.")));
            }
        }
        Outcome::TimedOut => {
            println!(
                "{}",
                s.red("✗ The tests ran for 20 seconds without finishing.")
            );
            println!(
                "Look for a loop that never ends, such as a `loop` with no `break` or a counter that never changes."
            );
        }
        Outcome::Passed { tests, warnings } => {
            let n = if *tests == 1 {
                "1 test".to_string()
            } else {
                format!("{tests} tests")
            };
            if q.boss {
                println!("{}", s.green(&format!("✓ Boss defeated. {n} green.")));
                println!("That one combined everything from the act. Well earned.");
            } else {
                println!("{}", s.green(&format!("✓ Quest passed. {n} green.")));
            }
            if !warnings.trim().is_empty() {
                let count = runner::strip_ansi(warnings)
                    .lines()
                    .filter(|l| l.starts_with("warning"))
                    .count();
                if count > 0 {
                    println!("{}", s.yellow(&format!("  rustc left {count} warning(s). Worth a look: they're often idiom hints.")));
                }
            }
            println!(
                "{}",
                s.dim(&format!(
                    "  Compare with the reference: cargo forge solution {}",
                    q.name
                ))
            );
        }
    }
}

fn footer(ctx: &Ctx, passed: bool) {
    let s = ctx.style;
    println!("\n{}", s.dim(&"─".repeat(64)));
    if passed {
        println!(
            "{}  {}",
            s.green("Press Enter for the next quest."),
            s.dim("h hint · l list · q quit")
        );
    } else {
        println!("{}", s.dim("Save the file to re-check · h hint · l list · s skip for now · q quit  (letter + Enter)"));
    }
}

fn finale(ctx: &Ctx) {
    let s = ctx.style;
    s.clear();
    println!("{}", s.oxide("⚒  OXIDIZE FORGE"));
    println!("{}", s.dim(&"─".repeat(64)));
    println!(
        "{}",
        s.green(&format!(
            "Every quest passed: {} of {}.",
            ctx.quests.len(),
            ctx.quests.len()
        ))
    );
    println!();
    println!("You have written ownership-correct, borrow-checked, thread-safe Rust from scratch,");
    println!("against the real compiler. Next: build something of your own. Chapter 21 has ideas.");
    println!();
}

/// Edition 2024 needs Rust 1.85 or newer.
fn check_toolchain(s: Style) {
    let Ok(out) = Command::new("rustc").arg("--version").output() else {
        return;
    };
    let text = String::from_utf8_lossy(&out.stdout);
    let minor = text
        .split_whitespace()
        .nth(1)
        .and_then(|v| v.split('.').nth(1))
        .and_then(|m| m.parse::<u32>().ok());
    if let Some(minor) = minor
        && minor < 85
    {
        println!("{}", s.yellow(&format!("Your Rust is {}. The quests use edition 2024, which needs 1.85 or newer. Run `rustup update`.", text.trim())));
        thread::sleep(Duration::from_secs(2));
    }
}

fn modified(path: &Path) -> Option<SystemTime> {
    fs::metadata(path).and_then(|m| m.modified()).ok()
}
