//! The Oxidize Forge: a quest trainer for the Oxidize Rust course.
//!
//! Run it with `cargo forge` from anywhere inside the repository. It finds
//! your first unfinished quest, compiles it, and re-checks it every time you
//! save the file. When the tests pass, press Enter to move on.
//!
//! This program uses only the standard library. Chapter 21 invites you to read
//! it: everything here (enums, Result, iterators, threads, channels, process
//! spawning) is something the course teaches.

mod art;
mod quests;
mod runner;
mod ui;

use std::fs;
use std::io::{self, BufRead, Write};
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
    NO_COLOR=1 / FORGE_NO_ANIMATION=1   plain output / no animations
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
        return finish_output(io::stdout().lock().write_all(HELP.as_bytes()));
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
        "list" => finish_output(list(&ctx)),
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
    let outcome = runner::run(&ctx.root, &q, &q.file(&ctx.root), ctx.style.color)?;
    if outcome.passed() {
        ctx.progress.mark(&q, true)?;
    }
    header(ctx, i);
    report(ctx, &q, &outcome);
    Ok(outcome)
}

/// Prints the quest list. It writes through a locked stdout, so a closed pipe
/// (`cargo forge list | head`) comes back as an error that `finish_output` ignores.
fn list(ctx: &Ctx) -> io::Result<()> {
    let s = ctx.style;
    let mut out = io::stdout().lock();
    let current = quests::current(&ctx.quests, &ctx.progress);
    let mut last_chapter = 0;
    for (i, q) in ctx.quests.iter().enumerate() {
        if q.chapter != last_chapter {
            last_chapter = q.chapter;
            writeln!(
                out,
                "\n{}",
                s.bold(&format!(
                    "Chapter {:02} · {}",
                    q.chapter,
                    ctx.chapters.title(q.chapter)
                ))
            )?;
        }
        let (mark, name) = if ctx.progress.is_solved(q) {
            (s.green("✓"), s.dim(&format!("{:<18}", q.name)))
        } else if Some(i) == current {
            (s.oxide("▸"), s.oxide(&format!("{:<18}", q.name)))
        } else {
            (s.dim("·"), format!("{:<18}", q.name))
        };
        let boss = match art::boss_for(&q.name) {
            Some(b) => s.oxide(&format!(" BOSS · {}", b.name)),
            None if q.boss => s.oxide(" BOSS"),
            None => String::new(),
        };
        let here = if Some(i) == current {
            s.oxide("  ← you are here")
        } else {
            String::new()
        };
        writeln!(out, "  {mark} {name} {}{boss}{here}", q.title)?;
    }
    let done = ctx.progress.solved.len().min(ctx.quests.len());
    writeln!(
        out,
        "\n{} {}/{} quests passed\n",
        ui::progress_bar(done, ctx.quests.len(), 30),
        done,
        ctx.quests.len()
    )
}

/// `cargo forge list | head` closes the pipe early. That is the reader's
/// choice, not a failure, so the command ends quietly.
fn finish_output(result: io::Result<()>) -> Result<ExitCode, Box<dyn std::error::Error>> {
    match result {
        Ok(()) => Ok(ExitCode::SUCCESS),
        Err(e) if e.kind() == io::ErrorKind::BrokenPipe => Ok(ExitCode::SUCCESS),
        Err(e) => Err(e.into()),
    }
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
        let outcome = runner::run(&ctx.root, &q, &file, false)?;
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

        let mut seen = snapshot(&q, &ctx.root);
        let mut outcome = runner::run(&ctx.root, &q, &file, ctx.style.color)?;
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
                        list(ctx)?;
                        footer(ctx, passed);
                    }
                    "s" | "skip" => {
                        skipped.push(q.name.clone());
                        break;
                    }
                    _ => {
                        // Enter on an unsolved quest just re-checks it.
                        outcome = runner::run(&ctx.root, &q, &file, ctx.style.color)?;
                        passed = settle(ctx, i, &q, &outcome)?;
                    }
                },
                None => {
                    let now = snapshot(&q, &ctx.root);
                    if now != seen {
                        seen = now;
                        // Editors often save in two steps; give the write a moment to land.
                        thread::sleep(Duration::from_millis(80));
                        outcome = runner::run(&ctx.root, &q, &file, ctx.style.color)?;
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
    println!("Edit {}", s.cyan(&format!("quests/{}", q.edit_path())));
    println!();
}

/// Boss panels and the Oxi celebration are drawn this many columns wide.
const MOOD_WIDTH: usize = 50;

fn report(ctx: &Ctx, q: &Quest, outcome: &Outcome) {
    let s = ctx.style;
    let boss = art::boss_for(&q.name).filter(|_| q.boss);
    if let Some(lines) = boss.and_then(|b| boss_panel_for(ctx, q, b, outcome)) {
        for line in lines {
            println!("{line}");
        }
        println!();
    }
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
        Outcome::TestsFailed { output, .. } => {
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
            let n = tests_text(*tests);
            match boss {
                Some(b) => defeat(
                    s,
                    b,
                    *tests,
                    s.green(&format!("✓ Boss defeated. {n} green.")),
                ),
                None => celebrate(
                    s,
                    &[
                        s.green(&format!("✓ Quest passed. {n} green.")),
                        s.dim(art::oxi_flavor(&q.name, ctx.progress.solved.len())),
                    ],
                ),
            }
            if !warnings.trim().is_empty() {
                let count = runner::strip_ansi(warnings)
                    .lines()
                    .filter(|l| l.starts_with("warning") && !l.contains("generated"))
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

/// The boss panel for an outcome, or None when there is nothing to draw. A pass
/// has no panel: the defeat animation draws its own frames.
fn boss_panel_for(ctx: &Ctx, q: &Quest, b: &art::Boss, outcome: &Outcome) -> Option<Vec<String>> {
    let (hp, total, mood) = match outcome {
        Outcome::CompileError { .. } => {
            let total = full_hp(ctx, q);
            (total, total, b.taunt)
        }
        Outcome::TimedOut => {
            let total = full_hp(ctx, q);
            (total, total, art::TIMEOUT_TAUNT)
        }
        Outcome::TestsFailed {
            counts: Some((passed, failed)),
            ..
        } => (*failed, passed + failed, b.hurt),
        Outcome::TestsFailed { counts: None, .. } => {
            let total = full_hp(ctx, q);
            (total, total, b.hurt)
        }
        Outcome::Passed { .. } => return None,
    };
    let mood = ui::wrap(mood, MOOD_WIDTH);
    Some(boss_panel(ctx.style, b, hp, total, &mood, false))
}

/// A boss's full HP: the number of tests in the learner's files (0 if unreadable).
fn full_hp(ctx: &Ctx, q: &Quest) -> usize {
    q.source_files(&q.file(&ctx.root))
        .iter()
        .map(|path| fs::read_to_string(path).map_or(0, |src| art::count_tests(&src)))
        .sum()
}

/// The boss panel: the name, then the art with its HP line, weak spot and mood
/// beside it. A knocked-out boss is drawn dim, with `x` for eyes.
fn boss_panel(
    s: Style,
    b: &art::Boss,
    hp: usize,
    total: usize,
    mood: &[String],
    knocked_out: bool,
) -> Vec<String> {
    let title = format!(
        "{}{}",
        s.oxide(b.name),
        s.dim(&format!(" · Act {} boss", b.act))
    );
    let eye = if knocked_out { 'x' } else { b.eye };
    let left: Vec<String> = art::eyes(b.art, eye)
        .into_iter()
        .map(|line| if knocked_out { s.dim(&line) } else { line })
        .collect();
    let mut right = Vec::new();
    if total > 0 {
        right.push(hp_line(s, hp, total, knocked_out));
    }
    right.push(s.dim(&format!("Weak to: {}", b.weak)));
    right.push(String::new());
    right.extend(mood.iter().cloned());
    let mut lines = vec![title];
    lines.extend(art::side_by_side(&left, &right, art::BOSS_WIDTH, 1));
    lines
}

/// "HP ██████░░░░░░░░░░  3/8", with "   K.O." added once the boss is down.
fn hp_line(s: Style, hp: usize, total: usize, knocked_out: bool) -> String {
    let (filled, empty) = art::hp_cells(hp, total);
    let mut line = format!(
        "HP {}{}  {hp}/{total}",
        s.red(&"█".repeat(filled)),
        s.dim(&"░".repeat(empty))
    );
    if knocked_out {
        line.push_str(&s.green("   K.O."));
    }
    line
}

/// The defeat: the boss goes down one HP at a time, 70 ms apart, then Oxi
/// celebrates with the status line and the act's closing line.
fn defeat(s: Style, b: &art::Boss, total: usize, status: String) {
    let mood = ui::wrap(b.defeat, MOOD_WIDTH);
    let blank = vec![String::new(); mood.len()];
    let frames: Vec<Vec<String>> = (0..=total)
        .rev()
        .map(|hp| {
            let knocked_out = hp == 0;
            let lines = if knocked_out { &mood } else { &blank };
            boss_panel(s, b, hp, total, lines, knocked_out)
        })
        .collect();
    ui::animate(s, &frames, Duration::from_millis(70));
    println!();
    // Short on purpose: a line wider than the terminal wraps, and the
    // animation's redraw would then land one row too low.
    let act = format!("Act {} complete. Well earned.", b.act);
    celebrate(s, &[status, act]);
}

/// Oxi hops (120 ms per frame) with `right` beside it, on rows 2 and 3 of the
/// art. The crab is orange and the sparkles are yellow.
fn celebrate(s: Style, right: &[String]) {
    let frames: Vec<Vec<String>> = [
        art::OXI_GROUND,
        art::OXI_JUMP,
        art::OXI_GROUND,
        art::OXI_JUMP,
        art::OXI_SPARKLE,
    ]
    .iter()
    .map(|frame| {
        let left: Vec<String> = frame.iter().map(|line| paint_oxi(s, line)).collect();
        art::side_by_side(&left, right, art::OXI_WIDTH, 2)
    })
    .collect();
    ui::animate(s, &frames, Duration::from_millis(120));
}

/// Colors one line of Oxi: sparkles yellow, the crab orange, blank rows left empty.
fn paint_oxi(s: Style, line: &str) -> String {
    if line.trim().is_empty() {
        String::new()
    } else if line.contains('*') {
        s.yellow(line)
    } else {
        s.oxide(line)
    }
}

/// "1 test" or "6 tests", as the status line says it.
fn tests_text(n: usize) -> String {
    if n == 1 {
        "1 test".to_string()
    } else {
        format!("{n} tests")
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
    celebrate(s, &bosses_defeated());
    println!();
    println!("You have written ownership-correct, borrow-checked, thread-safe Rust from scratch,");
    println!("against the real compiler. Next: build something of your own. Chapter 21 has ideas.");
    println!();
}

/// The finale's right column: the five bosses, two names to a line so no
/// name is split.
fn bosses_defeated() -> Vec<String> {
    let mut lines = vec!["All five bosses defeated:".to_string()];
    let last = art::BOSSES.len() - 1;
    for (i, pair) in art::BOSSES.chunks(2).enumerate() {
        let names: Vec<&str> = pair.iter().map(|b| b.name).collect();
        let end = if i * 2 + pair.len() > last { "." } else { "," };
        lines.push(format!("{}{end}", names.join(", ")));
    }
    lines
}

/// The course targets Rust 1.88 or newer (edition 2024, let chains).
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
    // No let chains here: this check has to compile on the old toolchains
    // it is warning about.
    if minor.is_some_and(|m| m < 88) {
        println!("{}", s.yellow(&format!("Your Rust is {}. The course needs 1.88 or newer (edition 2024 and let chains). Run `rustup update`.", text.trim())));
        thread::sleep(Duration::from_secs(2));
    }
}

fn modified(path: &Path) -> Option<SystemTime> {
    fs::metadata(path).and_then(|m| m.modified()).ok()
}

/// Each file a quest is made of, with its modification time. Watch mode
/// re-checks when this changes, so an edit to any file of a cargo quest counts.
fn snapshot(q: &Quest, root: &Path) -> Vec<(PathBuf, Option<SystemTime>)> {
    q.source_files(&q.file(root))
        .into_iter()
        .map(|path| {
            let time = modified(&path);
            (path, time)
        })
        .collect()
}
