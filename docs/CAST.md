# Rustopia: the cast and the motion bible

Oxidize teaches with characters. Each one stands for exactly one Rust idea,
and each arrives in the chapter where that idea is taught. They pile up as
you go, so by Act V the island is busy. This file is the source of truth for
who they are, how they move, and how pages use them.

Art: `site/assets/cast-art.js` and `cast-art.css` (`OxCast`). Never draw a
character inline in a page; call `OxCast.el(name, opts)` or add a pose to the
library.

## 1. Rules

1. **A character is a concept.** Each one maps to one Rust idea and behaves
   like it. If a motion would teach something false (a moved value that is
   still usable, a borrow that outlives its owner), it is wrong, however cute.
2. **Introduce, then reuse.** A character is met once (a meet card in its
   chapter) and then shows up wherever its idea does. A later chapter may use
   any character introduced earlier, never a later one.
3. **Motion explains, decoration doesn't.** Idle loops stay tiny (blink, a
   2px bob, chimney smoke). Every bigger movement is a cause and effect the
   reader should notice: a leash handed over, a value eaten by `;`, a Vec
   carried to a bigger plot.
4. **Respect reduced motion.** Under `prefers-reduced-motion: reduce`, nothing
   moves. States change instantly, poses still switch, captions carry the
   meaning.
5. **Color keeps its meaning.** Oxide = owner, blue = `&` borrow, magenta =
   `&mut`, grey = moved or gone, red = rejected or freed. Characters never use
   these colors to mean something else.
6. **Friendly, not childish.** The reader is a working developer. Characters
   are charming and precise; jokes are short; nobody is mocked for a wrong
   answer (Oxi tilts its head, it never laughs).

## 2. The cast, in order of appearance

| Ch | Character | Stands for | Signature behavior |
|---|---|---|---|
| 1 | **Oxi** (`oxi`) | Your guide | Narrates, asks you to predict, cheers (`happy`), winces (`oops`), wonders (`think`). |
| 1 | **The Forge** (`forge`) | The compiler, rustc | Eats a source scroll (`chomp`), produces a machine-code ingot (`happy`) or spits an error scroll (`oops`). All before the program runs. |
| 2 | **Crabs** (`crab`) | Variables | Hold one value in the claw, name tag below. `mut` crabs may swap what they hold. Shadowing: a new crab with the same name steps in front. |
| 3 | **Pebbles** (prop `pebbles`, `pebble`) | Scalar types | Each type has a shape: `i32` round stone, `u8` small stone, `f64` smooth oval, `bool` coin, `char` tile. A value only fits a slot of its shape. |
| 4 | **Semi** (`semi`) | The semicolon | Eats an expression's value (`chomp`) and leaves the empty box `()` (prop `unit`). |
| 5 | **Fluffies** (`fluffy`) | Heap data | Live on the sandbank (heap). Exactly as long as their owner. They poof at drop. |
| 5 | **Alloc** (`alloc`) | The allocator | Hermit crab with a clipboard. Hands out heap plots, carries a growing Vec to a bigger plot (realloc), takes plots back. |
| 6 | **The Leash** (prop `leash`) | Ownership | Rope from owner crab to fluffy. One holder. A move hands it over; the old crab becomes a grey ghost. |
| 6 | **The Inspector** (`inspector`) | The borrow checker | Checks every leash (and, from Chapter 7, every borrow) before the program runs. Stamps an error code on the crab that breaks a rule. Other compile errors belong to the Forge. |
| 7 | **Glasses and the Lock** (prop `borrows`) | `&` and `&mut` | Glasses: any number of crabs may look. The lock: exactly one crab may change it, and nobody else may look meanwhile. |
| 8 | **Glyph** (`glyph`) | A UTF-8 string | Caterpillar, one segment per byte; a multi-byte char is several segments of one color. Cutting inside a char: `ouch` (panic). |
| 9 | **The Mold** (`mold`) | A struct definition | Casting mold with one cavity per field. Every value poured from it has exactly those fields. |
| 10 | **Octo** (`octo`) | `match` | One arm per pattern. A variant with no arm: Octo refuses to start (E0004). |
| 11 | **The Switchman** (`switchman`) | `Result` and `?` | Railway: Ok cars roll on, Err cars are switched back to the caller at `?`. A panic is a derailment. Props `car`, `lever`. |
| 12 | **The Bouncer** (`bouncer`) | `HashSet` | Lets each value in once; a duplicate is turned away. |
| 13 | **Clo** (`clo`) | Closures | Backpack crab. Packs what it captures: a look (`&`), a handle it may change (`&mut`), or the value itself (`move`). |
| 14 | **The Press** (`press`) | Generics | Stamps one specialized copy per concrete type, at compile time (`stamp`). Traits are **badges** (prop `badge`) a type earns with `impl`. |
| 15 | **Tick** (`tick`) | Lifetimes | An hourglass per scope (`level` 0–1). A reference tied to Tick must be finished before the sand runs out. |
| 16 | **Cargo** (`cargo`) | Cargo and crates | Tugboat bringing crates (prop `crate`) from the crates.io harbor. Modules are houses; `pub` is an open door (prop `door`). |
| 17 | **The Night Guard** (`guard`) | `RefCell` | Checks borrows at runtime with a flashlight. Break a rule and the alarm sounds: a panic. `Box` is a fluffy in a box, `Rc` a fluffy on several leashes with a count. |
| 18 | **The Keeper** (`keeper`) | `Mutex` | Holds the one key (prop `key`) to a shared room. One thread inside at a time. Threads are worker crabs; channels are tubes. |
| 19 | **The Waiter** (`waiter`) | The async executor | Juggles orders (prop `ticket`); returns to one only when its bell (prop `bell`) rings: the waker. |
| 20 | **Postie** (`postie`) | A request through middleware | Carries a request parcel (prop `parcel`) through each layer and back. |
| 21 | **Rustacean Oxi** (`graduate`) | You | Oxi after the last molt. The whole cast returns for the finale. |

Poses (any character): `happy`, `oops`, `think`, `wow`, `talk`, `sleep`,
`ouch`; plus `chomp` (Forge, Semi), `stamp` (Press), `catch` (Octo). Kinds
for crabs: `ref`, `mutref`, `ghost`, `ended`. Set them with
`OxCast.pose(node, "happy", 1600)`.

### The act bosses

Each act ends with a boss quest that combines everything from the act, and
each boss quest is guarded by a creature built from the quest's own problem.
Bosses are the only characters who are against you, and even they lose
gracefully: the `defeated` pose is X eyes and a slump, never anything worse.

| Act | Boss (`id`) | Guards | Weak to |
|---|---|---|---|
| I | **The Receipt Golem** (`golem`) | `boss1_receipt` · Print a receipt | functions, loops, `match` and format strings |
| II | **The Babel Beetle** (`beetle`) | `boss2_text_stats` · Text statistics | borrowing, `&str` slices and UTF-8 |
| III | **The Ledger Dragon** (`dragon`) | `boss3_ledger` · Bank ledger | enums, `Result`, `HashMap` and iterators |
| IV | **The Template Mimic** (`mimic`) | `boss4_template` · Mini Blade | traits, lifetimes and smart pointers |
| V | **The Queue Hydra** (`hydra`) | `boss5_job_queue` · Job queue | threads, channels, `Arc` and `Mutex` |

**One test is one hit point.** In the terminal, `cargo forge` draws the boss
beside every check of its quest: full HP while the file doesn't compile,
one HP per failing test after that, and a knockout when the last test turns
green. On the site, the boss card above the quest shows full HP until you tick
the quest, then plays the same defeat. Art: `OxCast.boss(id, { pose })`,
registry: `OxCast.bosses`. The terminal art lives in `forge/src/art.rs`.

## 3. Motion language

- **Entrances** pop with a slight overshoot: `cubic-bezier(.3, 1.4, .5, 1)`,
  400–600 ms. **Exits** ease in, 300–450 ms. **Moves** that carry meaning
  (a handoff, a reallocation) take 500–800 ms along a short arc, so the eye
  can follow them.
- **One thing at a time.** Within a beat, stagger related motions by
  150–300 ms instead of firing them together.
- **Cause before effect.** The Forge chomps, then the ingot appears. The
  leash travels, then the old crab turns grey.
- **Idle** is a blink every ~5 s and at most a 2 px bob. Nothing loops
  forever in a reader's peripheral vision except smoke, sand and water.
- **Celebrate small.** A right answer earns a hop and a short confetti burst
  from Oxi, never a full-screen effect. The only big moment is the level-up
  molt.

## 4. Components

| Markup | What it does | Built in |
|---|---|---|
| `<div class="ox-meet" data-cast="forge"></div>` | The first appearance of a character: a card with its art, name, what it stands for in Rust and its role. Entering the screen plays its entrance and adds it to the Field Guide. | `cast.js` |
| `<div class="ox-motion" data-scene="ch01-compile"></div>` | A motion explainer: a short animated scene in beats, with captions, play/pause, back/next and optional prediction questions. Scenes are data in `site/assets/motion/chNN.js`. | `motion.js` |
| `<div class="ox-xray" data-scenario="…">` | The Memory X-Ray, now with a **Story / Diagram** switch (Story is the default): crabs, fluffies, leashes and the Inspector act out the same states. | `xray.js` + `story.js` |
| quizzes, fill-ins, match, order | Oxi pops up beside the answer and reacts. | `cast.js` (listens to `ox:answer`) |
| level-up | Oxi molts: the old shell cracks and a bigger Oxi steps out with the new title. | `cast.js` (listens to `ox:levelup`) |
| `labs/cast.html` | The Field Guide: every character, in color once met, as a silhouette before. Below it, the WANTED wall of act bosses. | `cast.js` |
| boss quest cards | Automatic: every boss quest in an `.ox-quests` list gets its boss card (art, HP, weakness) and plays the defeat when ticked. | `cast.js` (listens to `ox:quest`) |
| the island map | Each boss has a lair beside its chapter's stone: awake until defeated, then grey with a flag. | `index.html` |
| `cargo forge` | Oxi celebrates every passed quest in ASCII; boss quests show the boss with an HP bar that drains as tests pass. | `forge/src/art.rs` |

Motion scene format and authoring rules: see the header of
`site/assets/motion.js`.
