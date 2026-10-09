# Oxidize

An interactive, visual Rust course for PHP and Laravel developers. It starts
from zero and goes all the way to expert topics: ownership, lifetimes,
concurrency, async, the web and reviewing AI-written Rust.

> Work in progress. The full guide to this repo is coming with the remaining
> chapters.

## What's here

| Path | What it is |
|---|---|
| `site/` | The course website. Open `site/index.html` (or serve `site/` with any static server). Chapters, Memory X-Ray, labs. |
| `quests/` | Hands-on coding exercises ("quests"). You edit these. |
| `forge/` | The Forge: a small Rust CLI that watches your quests and recompiles on every save (`cargo forge`). |
| `solutions/` | Reference solutions. Look only after you've passed a quest. |
| `tools/` | Maintainer scripts: every code sample on the site is compiled with the real `rustc` before it ships. |
| `docs/AUTHORING.md` | How chapters, quests and labs are written. |

## Quick start

```sh
# 1. Install Rust (macOS / Linux; on Windows use rustup-init.exe from rustup.rs)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 2. Read a chapter
python3 -m http.server -d site 8000   # then open http://localhost:8000

# 3. Start the quests
cargo forge
```
