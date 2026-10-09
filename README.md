# Oxidize

**Rust, made visible.** An interactive, visual Rust course for PHP and Laravel
developers. It starts at zero and goes all the way to expert topics:
ownership, borrowing, lifetimes, traits, smart pointers, concurrency, async,
building web services, and reviewing Rust that an AI agent wrote.

Rust is hard because its rules are about things you can't see: who owns a
piece of memory, who may change it, and for how long. This course draws them.
You step through programs in a **Memory X-Ray** that animates the stack, the
heap and every owner and borrow; you predict what the compiler will say before
it says it; and you write real code against the real compiler in **the Forge**.

## Start here

```sh
# 1. Install Rust 1.88 or newer (macOS / Linux). On Windows, run rustup-init.exe from https://rustup.rs
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 2. Get the course
git clone https://github.com/MuhammadSadeeq/learn-rust.git
cd learn-rust

# 3. Open the course in your browser
python3 -m http.server -d site 8000      # then visit http://localhost:8000
#    (or just double-click site/index.html)

# 4. In a second terminal, start the quests
cargo forge
```

Work through a chapter in the browser, then do its quests in your editor
(VS Code with rust-analyzer, or RustRover). The Forge watches the quest file,
recompiles every time you save, and moves you on when the tests pass.

## How it teaches

| | |
|---|---|
| **See the invisible** | Memory X-Ray step-throughs, lifetime timelines and a custom interactive in every chapter (a bit-level integer explorer, a UTF-8 byte explorer, a borrow desk, a lazy-iterator conveyor belt, a data-race simulator, an async executor simulator…). |
| **Predict first** | Before every surprising step you commit to an answer. Being wrong first is what makes the right answer stick. |
| **Become the compiler** | "Does this compile?" checks throughout, real `rustc` errors decoded, and a borrow-checker game. Once you can predict the compiler, Rust stops being a fight. |
| **Start from PHP** | Every concept starts next to the PHP you write today (PHP 8.5, Laravel 13: arrays, Collections, Eloquent, middleware, queues, enums, property hooks, the pipe operator) and then shows exactly where the comparison breaks. |
| **Write real code** | 77 quests and 5 boss projects, checked by the real compiler. |
| **Remember it** | Recall cards at the end of every chapter, reviewed on a spaced-repetition schedule in the Recall Deck. |
| **Agent era** | Every chapter shows how its concept appears in AI-written Rust, and the Agent Code Review Dojo trains you to review it. |

Every code sample on the site is compiled with `rustc` (edition 2024) before
it ships, including the ones that are *supposed* to fail: the checker confirms
they fail with exactly the error code the page claims.

## The route

| Act | Chapters |
|---|---|
| **I · Ore**: Foundations | 01 Hello, Crab · 02 Variables Are Promises · 03 Types Are Shapes · 04 Everything Is an Expression |
| **II · Smelt**: The Ownership Trilogy | 05 The Stack & The Heap · 06 One Owner · 07 Borrowing · 08 Strings & Slices |
| **III · Cast**: Shape Your Data | 09 Structs & Methods · 10 Enums & Pattern Matching · 11 Errors Are Values · 12 Collections · 13 Iterators & Closures |
| **IV · Temper**: Abstraction Without Cost | 14 Traits & Generics · 15 Lifetimes · 16 Modules, Crates & Tests · 17 Smart Pointers |
| **V · Alloy**: Fearless & Fast | 18 Fearless Concurrency · 19 Async Rust · 20 Rust on the Web · 21 Mastery |

Each act ends with a boss quest: a receipt printer, a text analyzer, a bank
ledger, a mini Blade template engine, and a Laravel-style job queue with
worker threads.

## Labs

- **Memory X-Ray**: every step-through program in the course in one place.
- **Be the Borrow Checker**: an arcade game of 45 programs. Accept or reject each one, then name the rule it breaks.
- **Error Museum**: the 25 compiler errors you'll meet most, each with real `rustc` output and fixes that compile.
- **PHP → Rust Rosetta**: 119 PHP 8.5 and Laravel 13 habits next to the Rust that replaces them, searchable.
- **Agent Code Review Dojo**: 18 programs an AI agent wrote. Flag the lines a senior reviewer would question, then compare with the reviewed version.
- **Recall Deck**: spaced-repetition review of every chapter's cards.

## The Forge

```text
cargo forge                 watch mode: work through quests in order
cargo forge list            every quest and your progress
cargo forge hint            a hint for the current quest
cargo forge check NAME      compile and test one quest once
cargo forge verify          re-check every quest and update your progress
cargo forge solution NAME   where the reference solution is (after you pass)
cargo forge reset NAME      restore a quest to its original state
```

Your progress is stored in `.forge-progress` at the repo root, so you can
commit it with your work. The Forge is about 1,200 lines of std-only Rust (tests included) in
`forge/src`; Chapter 21 invites you to read it.

## What's in the repo

| Path | What it is |
|---|---|
| `site/` | The course website: `index.html`, `chapters/`, `labs/`, `assets/`. Static files, no build step. |
| `quests/` | Your exercises. One file per quest; `quests.toml` lists them in order. |
| `solutions/` | Reference solutions. Look after you've passed. |
| `forge/` | The quest trainer behind `cargo forge`. |
| `projects/notes-api/` | A complete JSON API in axum, built in Chapter 20, with a map to its Laravel equivalents. |
| `tools/` | Maintainer scripts (see below). |
| `docs/AUTHORING.md` | How chapters, quests and labs are written. |

## For maintainers

```sh
node tools/check-snippets.mjs    # compile every Rust snippet on the site
node tools/check-php.mjs         # every PHP sample parses on PHP 8.5, no outdated idioms
node tools/check-quests.mjs      # starters must fail, solutions must pass
node tools/sync-quests.mjs       # regenerate quests/Cargo.toml + site data from quests.toml
cargo forge verify --solutions   # the same check from Rust
```

CI (`.github/workflows/ci.yml`) runs all of these, plus the Forge's fmt,
clippy and tests and the notes-api tests, on every pull request and every
push to `main`.

To put the course online, go to *Settings → Pages* and set the source to
*GitHub Actions*, then run the *Publish site* workflow from the Actions tab.
It publishes `site/` as it is; there is no build step.

Progress, XP and quiz answers are stored in your browser's `localStorage`.
Nothing is sent anywhere. The "Run" buttons on code samples send that code to
the official Rust Playground (play.rust-lang.org).
