# Oxidize authoring guide

This is the contract every page, quest and lab in Oxidize follows. Read it
fully before writing anything. The reference implementation is
`site/chapters/06-ownership.html` with `site/assets/scenarios/ch06.js` and
`site/assets/cards/ch06.js`. When in doubt, do what that chapter does.

The learner: an experienced **PHP / Laravel developer**, a complete beginner in
Rust and in systems programming (stack, heap and pointers are new). They want
to learn fast, intuitively, and reach real expertise. They are motivated by
the shift to Rust for tooling, runtimes and AI-agent harnesses, and they will
spend a lot of time *reviewing Rust written by AI agents*.

---

## 1. Teaching method (non-negotiable)

1. **Make the invisible visible.** Rust is hard because its rules are about
   things you can't see: memory, ownership, time. Every core concept gets a
   visual: a Memory X-Ray, a Lifetime Timeline, an inline SVG diagram, or a
   small custom interactive.
2. **Predict before you reveal.** Before explaining something surprising, ask
   the learner to guess: a quiz, a `THINK FIRST` block, or an X-Ray `ask`
   step. Then explain. Guessing first (even wrongly) is what makes it stick.
3. **Concrete before abstract.** Show a short program, then name the concept.
4. **Anchor in PHP, then show where the analogy breaks.** Use `ox-bridge`
   (PHP left, Rust right) and `data-kind="php"` callouts. Always say where the
   comparison stops being true.
5. **Become the compiler.** Include "does this compile?" checks. The goal is
   that the learner can predict rustc's verdict.
6. **Errors are teachers.** Show real rustc output (`<pre class="rustc">`) and
   walk through how to read it.
7. **Small steps, constant checks.** Never more than ~3 paragraphs before a
   code block, visual or interaction. Every `h2` section ends with, or
   contains, a check (quiz, fill, match, order, think).
8. **Interleave.** Occasionally quiz a concept from an earlier chapter.
9. **Agent-era lens.** Each chapter has at least one `data-kind="ai"` callout:
   how this concept shows up in AI-written code, what to check in review, or
   how to prompt an agent about it.
10. **Explain it back.** The recap ends with an "Explain it back" `ox-think`
    block that asks the learner to explain the core idea in their own words,
    and gives a model answer.

## 2. Voice

- Plain, direct, warm. Second person. Short sentences. Treat the reader as a
  capable adult who is new to this.
- Say when something is genuinely hard ("this trips most people up").
- No emoji. No hype ("amazing", "magic", "blazingly"). No "Great question".
  Few exclamation marks (ideally none).
- Avoid mannered devices: em-dash asides, "not X, but Y" framing,
  colon-then-reveal sentences, scare quotes around invented labels, stock
  phrases such as "it's worth noting", "let's dive in", "under the hood" as
  filler.
- **American English** spelling (behavior, color, optimize, practice).
- Precise vocabulary: "move", "copy", "clone", "borrow", "drop", "owner",
  "reference", "lifetime", "scope". Do not say "pass by reference" loosely.

### Shared metaphors (use these, keep them consistent)

| Concept | Metaphor used everywhere |
|---|---|
| Ownership | A value is a **parcel with exactly one name on its label**. Move = the label is rewritten. Clone = a photocopy, a new parcel. Drop = the owner disposes of it when leaving the room (scope). |
| Borrowing | **Many readers or one writer.** `&T` is a read-only pass; any number can exist. `&mut T` is the one key to the editing room; while it exists nobody else may even look. |
| Lifetimes | The **span of lines** where a borrow must stay valid. Annotations describe *relationships* between borrows, never durations. |
| `Option<T>` | A **box that may be empty**; you must open it before you use what's inside. |
| `Result<T, E>` | A **two-track railway** (Ok track, Err track). `?` is an **exit ramp** onto the error track. |
| Traits | **Capabilities / contracts** like PHP interfaces, but you can attach them to types you didn't write. |
| Generics | **Stamps**: the compiler stamps out a concrete copy per type (monomorphization). |
| Iterators | A **lazy conveyor belt**: nothing moves until a consumer (`collect`, `sum`, `for`) pulls. |
| `Box` / `Rc` / `RefCell` | Box: a parcel stored on the heap, one owner. Rc: a shared parcel with an **owner counter** on the label. RefCell: a **borrow desk** that checks the rules at runtime and panics on violation. |
| `Mutex` | The **single key** to a room; whoever holds the key may enter. |
| Futures | A **paused recipe**. An executor is the cook who resumes whichever recipe is ready. `.await` = "pause here, let others work". |

Semantic colors are fixed across the whole course: **oxide (orange) = owner**,
**blue = shared borrow `&`**, **magenta = `&mut`**, **grey dashed = moved /
invalid**. In prose use `<span class="c-own">`, `c-ref`, `c-mut`, `c-ghost`,
`c-ok`, `c-bad`.

## 3. Rust accuracy

- **Edition 2024, stable rustc 1.97** (installed in this environment).
  Modern idioms: inline format args (`println!("{name}")`), `let ... else`,
  `if let` chains where natural, `impl Trait` in argument position, etc.
- **Every `<pre class="rs">` block is compiled by `node tools/check-snippets.mjs`.**
  A block without `data-check` must compile. Blocks without `fn main` are
  wrapped in `fn main() { ... }` (items like `struct`/`fn`/`impl` inside it are
  fine). Mark expectations:
  - `data-check="E0382"` must fail with exactly that error code (comma-separate several)
  - `data-check="error"` must fail (any reason; prefer a specific code)
  - `data-check="panic"` must compile and panic at runtime
  - `data-check="skip"` not checked: only for code that needs external crates
    (tokio, axum, serde…) or for a deliberately partial fragment. Use sparingly.
  - `data-stdout="line1\nline2"` must run and print exactly this. Use it for
    every "what does this print?" quiz.
- Run the checker on your files until it reports 0 failures:
  `node tools/check-snippets.mjs site/chapters/NN-name.html site/assets/scenarios/chNN.js`
  (data files are only checked when listed explicitly or when no file is given).
- **Compiler output** shown in `<pre class="rustc">` must be real: compile the
  snippet with `rustc --edition 2024 --color never x.rs`, replace the file path
  with `src/main.rs`, and remove unrelated warnings. Keep the `For more
  information…` line.
- Crate examples: pin major versions in any `Cargo.toml` you show (`tokio = { version = "1", features = ["full"] }`, `serde = { version = "1", features = ["derive"] }`, `serde_json = "1"`, `anyhow = "1"`, `thiserror = "2"`, `clap = { version = "4", features = ["derive"] }`). crates.io is reachable from this
  environment: if a chapter relies on a crate API, build the example in a
  scratch cargo project under your scratchpad to confirm it compiles, and use
  the version that resolved.
- Never invent benchmark numbers. Qualitative claims only, unless you measure.

## 4. Page template

Copy the `<head>` exactly from `06-ownership.html`, changing only `<title>`,
the card/scenario script names, and `data-chapter`. Script order matters:
`course-data.js`, `quests-data.js`, `cards/chNN.js`, `scenarios/chNN.js` (if
any), `oxidize.js`, `xray.js`.

```html
<body data-chapter="7">
<a class="ox-skip" href="#main">Skip to content</a>
<header class="ox-top"></header>
<div class="ox-page">
<aside class="ox-rail" aria-label="Chapter contents"></aside>
<main class="ox-main" id="main">
  <header class="ox-hero" data-auto>   <!-- number, title, idea come from course-data.js -->
    <ul><li>outcome</li>…</ul>          <!-- 3–5 "By the end you can" outcomes -->
  </header>
  <section><h2 id="slug">Heading</h2> … </section>
  …
  <section><h2 id="quests">Forge quests</h2><div class="ox-quests" data-chapter="7"></div></section>
  <section><h2 id="recap">Recap</h2>
    <div class="ox-recap"><h3>…</h3><ul>…</ul></div>
    <div class="ox-deck" data-chapter="7"></div>
    <details class="ox-think">…explain it back…</details>
    <div class="ox-complete-host"></div>
  </section>
</main></div></body>
```

Every `h2` needs an `id` (it feeds the table of contents). Keep h2 text short
(2–6 words). Use `data-toc="Short"` on an h2 if its text is long.

Size: a chapter is 30–50 minutes of work. Typically 7–10 `h2` sections,
10–25 code blocks, 5–10 checks.

## 5. Component reference

All components are plain HTML enhanced by `oxidize.js`. In HTML, escape `<`,
`>` and `&` inside code (`&lt;`, `&gt;`, `&amp;`).

**Code.** `<pre class="rs">` (Rust), `php`, `sh`, `toml`, `rustc` (compiler
output), `text`. Indentation is dedented automatically.
- `data-run` adds a Run button (Rust Playground) + "playground ↗" link. Use on
  complete, interesting programs.
- `data-edit` makes it editable (combine with `data-run` for "try changing this").
- `data-title="src/main.rs"` shows a file name.
- `data-hl="3,5-7"` highlights lines; `data-err="4"` marks lines red; `data-dim="1-2"` dims.
- `data-badge="error"` / `"ok"` shows "won't compile" / "compiles". Don't use it
  on quiz snippets (it gives the answer away).

**Callouts.** `<aside class="ox-callout" data-kind="KIND">…</aside>`
kinds: `insight` (mental model), `php` (your PHP brain says), `trap`,
`compiler` (the compiler says), `ai` (agent-era note), `deep` (under the hood),
`win` (why this is good). Optional `data-label="Custom label"`.
Collapsible: `<details class="ox-callout" data-kind="deep"><summary>Title</summary>…</details>`.

**PHP ↔ Rust bridge.**
```html
<div class="ox-bridge">
  <pre class="php">…</pre>
  <pre class="rs">…</pre>
  <div class="ox-bridge-note"><p>Where the analogy holds and where it breaks.</p></div>
</div>
```

**Multiple-choice quiz.** (put `data-check`/`data-stdout` on the snippet)
```html
<div class="ox-quiz" data-id="07:unique-id" data-xp="10" data-label="Check yourself">
  <p class="ox-q">Question?</p>
  <pre class="rs" data-check="E0502">…</pre>
  <ol class="ox-choices">
    <li>Wrong option</li>
    <li data-correct>Right option</li>
    <li data-feedback="Shown if picked">Another wrong option</li>
  </ol>
  <div class="ox-why"><p>Explanation shown after answering.</p></div>
</div>
```
`data-id` must be unique per page; use `"NN:slug"`.

**Fill in the blanks.** Blanks are `[[answer|alternative]]` inside the code.
The checker compiles the code with the first answer filled in. Don't put any
`<div>` before the `<pre>` inside an `ox-fill`.
```html
<div class="ox-fill" data-id="07:fill-x">
  <p class="ox-q">Instruction.</p>
  <pre class="rs">fn f(s: [[&amp;str|&amp;String]]) -> usize { s.len() }</pre>
  <div class="ox-why"><p>Explanation.</p></div>
</div>
```

**Matching.**
```html
<div class="ox-match" data-id="07:match" data-left-label="PHP" data-right-label="Rust">
  <ul><li data-left="left text">right side HTML</li>…</ul>
</div>
```

**Ordering.** Items in the *correct* order; they're shuffled for the learner.
```html
<div class="ox-order" data-id="07:order" data-label="Put the drops in order">
  <ol><li>first</li><li>second</li><li>third</li></ol>
  <div class="ox-why"><p>Why.</p></div>
</div>
```

**Think first.**
```html
<details class="ox-think"><summary>Question to think about</summary>
  <div class="ox-think-body"><p>Answer.</p></div></details>
```

**Tabs.** `<div class="ox-tabs"><div data-tab="Label">…</div>…</div>`

**Rules list.** `<div class="ox-rules"><div class="ox-rule"><div><p>Rule</p><p>detail</p></div></div>…</div>`

**Pull quote.** `<p class="ox-pull">One memorable sentence.</p>` (max one or two per chapter)

**Steps.** `<ol class="ox-steps"><li><div>…</div></li></ol>`

**Tables.** `<div class="ox-table-wrap"><table class="ox-table">…</table></div>`

**Figures.** Inline SVG inside `<figure class="ox-figure">…<figcaption>`. Use
the helper classes so colors follow the theme: fills `f-own f-ref f-mut f-stack
f-heap f-ghost f-ok f-bad f-plain`, strokes `s-own s-ref s-mut s-ink s-muted`,
text `t-muted t-own t-ref t-mut t-ok t-bad` (default text color is ink). Give
the svg a `viewBox`, a `width`, `role="img"` and an `aria-label`. Never
hard-code colors that only work in one theme.

**Wide.** Add class `ox-wide` to a figure, X-Ray, timeline or custom widget to
let it extend into the right margin on wide screens.

**Flashcards.** `<div class="ox-deck" data-chapter="7"></div>` renders the
chapter's cards from `site/assets/cards/ch07.js`:
```js
/* Recall cards — Chapter 07: Borrowing */
(window.OX_CARDS = window.OX_CARDS || []).push(
  { id: "c07-rule", ch: 7, q: "Question (supports `code`, **bold**, ```blocks```, blank-line paragraphs)", a: "Answer" },
  …
);
```
8–12 cards per chapter. Questions must require recall (not recognition).

**Forge quests.** `<div class="ox-quests" data-chapter="7"></div>` lists the
chapter's quests from `quests/quests.toml` automatically.

### Memory X-Ray

`<div class="ox-xray ox-wide" data-scenario="id"></div>` (or `"id1,id2"` for a
picker). Scenarios live in `site/assets/scenarios/chNN.js`:

```js
(window.OX_XRAY = window.OX_XRAY || []).push({
  id: "unique-id", title: "Short title",
  check: "ok",              // or "E0499" if the code deliberately doesn't compile
  code: `
fn main() {
    …
}`,
  steps: [
    { line: 1, say: "<p>HTML narration</p>", ops: [["frame", "main"]] },
    { line: 3, ask: { q: "Predict…", choices: ["…", "…"], answer: 1, explain: "short" }, say: "<p>…</p>", ops: [...] },
    { line: 5, error: true, say: "<p><strong>error[E0499]: …</strong></p>", ops: [["err", "r2"]] }
  ]
});
```
Line numbers count from the first line of `code` after the leading newline.
Ops (applied cumulatively, step by step):

| op | meaning |
|---|---|
| `["frame", "name"]` | push a stack frame for a function call |
| `["pop"]` | pop the top frame (its remaining variables vanish) |
| `["let", "x", "i32", "5"]` | new variable with a plain value |
| `["let", "s", "String", { ptr: "h1", meta: { len: 2, cap: 5 } }]` | owner pointing at heap block `h1` |
| `["let", "r", "&String", { ref: "s" }]` | shared reference to variable `s` (or to heap id `h1`) |
| `["let", "m", "&mut Vec<i32>", { mut: "v" }]` | mutable reference |
| `["let", "w", "&str", { ref: "h1", at: 2, meta: { len: 3 } }]` | reference into heap block at byte/element index 2 (slices) |
| 5th arg `{ id: "s2", mut: true, frame: "main" }` | unique id when names repeat, show `mut`, target frame |
| `["set", "x", "6"]` | change a variable's value (any value form) |
| `["move", "a", "b"]` | b gets a's value; a becomes moved (grey). Opts `{frame, id, type, mut}` |
| `["copy", "x", "y"]` | y gets a copy, x stays valid |
| `["clone", "a", "b", "h2"]` | deep copy into new heap block h2 |
| `["drop", "x"]` | remove variable; frees its heap block if it owns one (and wasn't moved). Rc-counted blocks decrement instead |
| `["forget", "x"]` | remove variable without freeing anything |
| `["end", "r"]` | mark a reference's last use passed (NLL), shown faded |
| `["err", "x"]` | highlight a variable as the problem |
| `["alloc", "h1", "hello", 8, { label: "String bytes", rc: 1 }]` | heap block; content string (chars) or array of cells; capacity |
| `["heap", "h1", "hello!", 8]` | change heap content (and capacity) |
| `["realloc", "h1", "h2", [1,2,3,4,5], 8]` | buffer moves; owners now point at h2 (dangling refs are why borrows forbid this) |
| `["free", "h1"]` | free a heap block explicitly |
| `["rc", "h1", 2]` | set a reference-count badge |
| `["label", "h1", "text"]` | relabel a block |
| `["out", "text"]` | append a stdout line |

Ops refer to variables by **id** (which defaults to the name). Reusing an
existing id with `let` overwrites that variable, so give repeated names
explicit ids (`{ id: "area.w" }`) when two frames both have a `w`.

Narration rules: 1–3 sentences per step, present tense, name the variable and
what changed. Use `ask` on the 1–3 most surprising steps per scenario.

### Lifetime Timeline

`<div class="ox-timeline ox-wide" data-scenario="id"></div>`, defined in the
same scenarios file:
```js
(window.OX_TIMELINES = window.OX_TIMELINES || []).push({
  id: "nll", title: "…", check: "ok" /* or "E0502" */,
  code: `…`,
  vars: [
    { name: "s", kind: "own", from: 2, to: 8 },                 // kind: own | ref | mut
    { name: "r1", kind: "ref", from: 3, to: 5, label: "&s" },
    { name: "m", kind: "mut", from: 6, to: 7, bad: [7] }        // bad lines drawn as conflict
  ],
  marks: [ { var: "r1", line: 3, text: "borrow" }, { var: "r1", line: 5, text: "last use" } ],
  steps: [ { line: 2, say: "…" }, { line: 7, say: "…", error: true } ]
});
```
Bars after the current step's line are dimmed, so the learner watches
lifetimes grow as they step.

### Custom interactives

Each chapter should have **one signature interactive** that makes its core
idea tangible (a bit-flipper for integer overflow, a conveyor belt for lazy
iterators, an executor simulator for async…). Write it inline in the chapter:
a `<div class="ox-figure ox-wide" id="…">` plus a `<style>` block (scoped with
that id, tokens only, no literal colors that only work in one theme) and a
`<script>` at the end of the body that runs after `DOMContentLoaded`. Rules:
plain JS, no libraries, keyboard accessible (real `<button>`s), works at 400px
width, respects `prefers-reduced-motion`, visible and meaningful before any
interaction (render a sensible initial state). You can call `Ox.award(xp,
"reason", "unique-key")` and `Ox.highlight(code, "rust")`.

## 6. Labs pages

Lab pages live in `site/labs/NAME.html`. Same `<head>` (path `../assets/`),
`<body data-crumb="Lab · Title">`, `<header class="ox-top"></header>`, then
`<main class="ox-lab" id="main">…</main>`. Put lab-specific CSS in a `<style>`
block that uses only the tokens from `oxidize.css`, and lab data in
`site/assets/labs/NAME-data.js` as `window.OX_SOMETHING = [ … ]` where every
item that contains Rust code has a `rust` field (plus `check`, optional
`stdout`, `fix`, `idiomatic`, `fixes: [{rust}]`). The snippet checker compiles
all of them.

## 7. Forge quests

- Starter in `quests/<dir>/<name>.rs`, reference solution in
  `solutions/<dir>/<name>.rs`, exactly as listed in `quests/quests.toml`.
  Do not edit `quests.toml` or `quests/Cargo.toml`; put hints in
  `docs/_hints/<your-part>.toml` (format: see `docs/_hints/example.toml`).
- **std only**, edition 2024. One file per quest with `fn main()` and a
  `#[cfg(test)] mod tests` that is byte-identical in starter and solution.
- The starter must **fail** as shipped (compile error for "fix this" quests,
  `todo!()` or a wrong implementation for "implement this" quests) and the
  solution must **pass**. Check with `node tools/check-quests.mjs name1 name2`.
- Header comment format: see `quests/06_ownership/move1.rs`. State the goal,
  constraints ("without .clone()") and that tests must not be edited.
- 2–4 tests per quest that check behavior, including an edge case.
- Hints: 2–3 progressive steps. The last may nearly give it away, never paste
  the full solution.
- Boss quests are bigger (80–200 lines in the solution), combine the act's
  concepts, and are themed on things a Laravel developer recognizes.
- Solutions are idiomatic, clippy-clean Rust: what you'd want an expert to
  write. Comments explain *why*.

## 8. Before you finish

1. `node tools/check-snippets.mjs <your html files> <your data files>` → 0 failures.
2. Quests: `node tools/check-quests.mjs <names>` → all ok.
3. Open your page in the headless browser if you can and fix console errors.
4. Don't edit shared files (`oxidize.css`, `oxidize.js`, `xray.js`,
   `course-data.js`, other people's chapters). If you need an engine change,
   describe it in your final report instead.
