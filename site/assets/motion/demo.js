/* Demo motion scenes: the authoring example and the test bed for motion.js.
   Two scenes: demo-compile (what cargo build does) and demo-move (a move hands
   the owner over). Both compile: the rust field is checked by
   tools/check-snippets.mjs. */
(window.OX_MOTION = window.OX_MOTION || []).push({
  id: "demo-compile",
  title: "What cargo build does",
  w: 640,
  h: 300,
  rust: 'fn main() {\n    println!("hello");\n}',
  check: "ok",
  actors: [
    { id: "oxi", cast: "oxi", x: 70, y: 226, size: 90 },
    { id: "note", text: "source code", x: 150, y: 58 },
    { id: "src", prop: "scroll", opts: { label: "main.rs" }, x: 150, y: 140, size: 100 },
    { id: "forge", cast: "forge", x: 330, y: 150, size: 150, pose: "sleep" },
    { id: "bin", prop: "ingot", opts: { label: "hello" }, x: 540, y: 150, size: 110, hidden: true },
    { id: "bug", prop: "scroll", opts: { label: "bad.rs" }, x: 150, y: 140, size: 100, z: 2, hidden: true },
    { id: "err", prop: "errscroll", opts: { label: "E0308" }, x: 330, y: 188, size: 100, scale: 0.4, z: 4, hidden: true },
  ],
  beats: [
    {
      say: "<p>You write Rust in a <code>.rs</code> file. Oxi walks you through what happens when you build it.</p>",
      line: 1,
      do: [["pose", "oxi", "talk", 1200]],
    },
    {
      say: "<p><code>cargo build</code> hands the file to the Forge, the compiler.</p>",
      line: 1,
      do: [
        ["arc", "src", { x: 330, y: 188, scale: 0.4 }, 700],
        ["fade", "src", 0, 250, 650],
        ["pose", "forge", "chomp", 900, 700],
      ],
    },
    {
      say: "<p>The Forge reads every line and checks it. Nothing has run yet.</p>",
      line: 2,
      do: [
        ["pose", "forge", "wow", 1000, 200],
        ["pose", "oxi", "think", 1000, 200],
      ],
    },
    {
      say: "<p>Out comes machine code: an ingot. Every check happened before the program ran.</p>",
      line: 3,
      do: [
        ["pop", "bin", 200],
        ["pose", "forge", "happy", 1200, 200],
      ],
      ask: {
        q: "When does the compiler check your code?",
        choices: ["Before the program runs", "While it runs"],
        answer: 0,
        explain: "Every check happens at build time, so the Forge decides before anything runs.",
      },
    },
    {
      say: "<p>A broken file makes the Forge spit back an error scroll instead. No ingot, so there is nothing to run.</p>",
      do: [
        ["pop", "bug", 0],
        ["arc", "bug", { x: 330, y: 188, scale: 0.4 }, 650, 250, 40],
        ["poof", "bug", 900],
        ["pose", "forge", "chomp", 800, 900],
        ["pose", "forge", "oops", 1400, 1300],
        ["pose", "oxi", "oops", 1400, 1300],
        ["show", "err", 1500],
        ["arc", "err", { x: 170, y: 236, scale: 1 }, 800, 1500, 50],
      ],
    },
  ],
});

(window.OX_MOTION = window.OX_MOTION || []).push({
  id: "demo-move",
  title: "Who owns the String?",
  w: 640,
  h: 300,
  rust: 'fn main() {\n    let a = String::from("hi");\n    let b = a;\n    println!("{b}");\n}',
  check: "ok",
  actors: [
    { id: "stack", box: true, x: 150, y: 150, w: 240, h: 230, label: "Stack", cls: "is-stack" },
    { id: "heap", box: true, x: 500, y: 150, w: 200, h: 230, label: "Heap", cls: "is-heap" },
    { id: "a", cast: "crab", x: 90, y: 150, size: 96, label: "a", hidden: true },
    { id: "b", cast: "crab", x: 210, y: 150, size: 96, label: "b", hidden: true },
    { id: "fl", cast: "fluffy", x: 500, y: 150, size: 110, label: "String", hidden: true },
  ],
  beats: [
    {
      say: "<p><code>String::from</code> makes a String on the heap, and crab <b>a</b> owns it. The rope is its owner's leash.</p>",
      line: 2,
      do: [
        ["pop", "fl", 0],
        ["pop", "a", 150],
        ["link", "a", "a", "fl", "own", 450],
      ],
    },
    {
      say: "<p><code>let b = a;</code> <b>moves</b> the String. The leash goes to b, and a turns grey.</p>",
      line: 3,
      do: [
        ["pop", "b", 0],
        ["unlink", "a", 0],
        ["link", "b", "b", "fl", "own", 450],
        ["kind", "a", "ghost", 850],
      ],
      ask: {
        q: "After let b = a;, can a still be used?",
        choices: ["Yes, a still owns the String", "No, the String moved to b"],
        answer: 1,
        explain: "A move hands the one owner over to b. a becomes a ghost, and using it is a compile error.",
      },
    },
    {
      say: "<p><code>println!</code> uses <b>b</b>, the new owner. Using <b>a</b> here would not compile.</p>",
      line: 4,
      do: [
        ["say", "a", "moved: can't be used", 2000],
        ["pulse", "b", 0],
      ],
    },
  ],
});
