/* Motion explainers for Chapter 16: Modules and Cargo.
   ch16-fetch: Cargo fetches crates, the Forge builds them, Cargo.lock keeps the
   exact versions. ch16-doors: pub opens a door, a private item stays shut, and
   the Forge stamps E0603. The door program is checked by tools/check-snippets.mjs. */
(window.OX_MOTION = window.OX_MOTION || []).push({
  id: "ch16-fetch",
  title: "Cargo fetches the crates",
  w: 640,
  h: 300,
  actors: [
    { id: "oxi", cast: "oxi", x: 58, y: 230, size: 84 },
    { id: "toml", prop: "scroll", x: 130, y: 76, size: 118, opts: { label: "Cargo.toml" } },
    { id: "harbor", box: true, x: 560, y: 150, w: 150, h: 250, label: "crates.io" },
    { id: "c1", prop: "crate", x: 560, y: 92, size: 84, opts: { label: "serde" } },
    { id: "c2", prop: "crate", x: 560, y: 190, size: 84, opts: { label: "serde_derive" } },
    { id: "cargo", cast: "cargo", x: 160, y: 258, size: 104, opts: { crates: 0 } },
    { id: "forge", cast: "forge", x: 330, y: 150, size: 120 },
    { id: "ingot", prop: "ingot", x: 330, y: 40, size: 96, opts: { label: "shop" }, hidden: true },
    { id: "tk", prop: "ticket", x: 160, y: 168, size: 112, opts: { label: "1.0.229" }, label: "Cargo.lock", hidden: true },
  ],
  beats: [
    {
      say: "<p><code>Cargo.toml</code> asks for <b>serde</b>, with the <code>derive</code> feature turned on. Cargo reads that file first.</p>",
      do: [
        ["pose", "oxi", "talk", 1200],
        ["pulse", "toml", 0],
      ],
    },
    {
      say: "<p>Cargo sails to crates.io and loads <b>serde</b> and <b>serde_derive</b>. The derive feature needs <code>serde_derive</code> to write the code.</p>",
      do: [
        ["move", "cargo", { x: 400, y: 258 }, 900],
        ["fade", "c1", 0, 300, 900],
        ["fade", "c2", 0, 300, 1050],
        ["art", "cargo", { cast: "cargo", opts: { crates: 2 } }, 1200],
        ["move", "cargo", { x: 160, y: 258 }, 900, 1600],
      ],
    },
    {
      say: "<p><code>cargo build</code> gives the project and every crate to the Forge. The Forge checks them all before anything runs.</p>",
      do: [
        ["move", "cargo", { x: 400, y: 258 }, 800],
        ["arc", "toml", { x: 330, y: 150, scale: 0.3 }, 800, 0, 40],
        ["fade", "toml", 0, 250, 700],
        ["pose", "forge", "chomp", 900, 700],
        ["art", "cargo", { cast: "cargo", opts: { crates: 0 } }, 900],
        ["move", "cargo", { x: 160, y: 258 }, 800, 1600],
      ],
    },
    {
      say: "<p>The Forge hands back an ingot, the built program. Building is the only step so far. Nothing has run yet.</p>",
      do: [
        ["pop", "ingot", 200],
        ["pose", "forge", "happy", 1000, 200],
      ],
    },
    {
      say: "<p><code>Cargo.lock</code> is a ticket. It records the exact version of each crate that was used, so every build reuses the same one.</p>",
      do: [
        ["pop", "tk", 0],
        ["pulse", "tk", 0],
      ],
      ask: {
        q: "A new 1.x release of <code>serde</code> comes out. <code>Cargo.toml</code> still says <code>\"1\"</code>, which allows it. Which version does the next <code>cargo build</code> use?",
        choices: ["The newest 1.x, because the range allows it.", "The version recorded in Cargo.lock."],
        answer: 1,
        explain: "Cargo.lock records the exact versions, and a build reuses them. Only <code>cargo update</code> moves them forward, and only inside the range in Cargo.toml.",
      },
    },
  ],
});

(window.OX_MOTION = window.OX_MOTION || []).push({
  id: "ch16-doors",
  title: "pub opens a door",
  w: 640,
  h: 300,
  rust: 'mod billing {\n    pub fn total(cents: u32) -> u32 {\n        cents + fee()\n    }\n\n    fn fee() -> u32 {\n        50\n    }\n}\n\nfn main() {\n    println!("{}", billing::total(100));\n    println!("{}", billing::fee());\n}',
  check: "E0603",
  actors: [
    { id: "mainbox", box: true, x: 100, y: 150, w: 180, h: 250, label: "main.rs" },
    { id: "billing", box: true, x: 510, y: 150, w: 240, h: 250, label: "mod billing" },
    { id: "caller", cast: "crab", x: 100, y: 240, size: 70, label: "main" },
    { id: "forge", cast: "forge", x: 320, y: 150, size: 96 },
    { id: "total", prop: "door", x: 470, y: 150, size: 56, opts: { open: true }, label: "total()" },
    { id: "fee", prop: "door", x: 570, y: 150, size: 56, label: "fee()" },
    { id: "err", prop: "errscroll", x: 320, y: 150, size: 90, opts: { label: "E0603" }, hidden: true, z: 6 },
  ],
  beats: [
    {
      say: "<p>Each module is a house. A <code>pub</code> function has an open door. A private function sits behind a closed one.</p>",
      line: 2,
      do: [["pose", "caller", "talk", 1200]],
    },
    {
      say: "<p><code>main</code> calls <code>billing::total</code>. Its door is open, so the call goes through and the answer comes back.</p>",
      line: 12,
      do: [
        ["move", "caller", { x: 470, y: 240 }, 800],
        ["pose", "caller", "happy", 1000, 800],
      ],
    },
    {
      say: "<p>The crab knocks on <code>fee</code>, and the door stays shut. <code>fee</code> is private, so the Forge is asked to decide.</p>",
      line: 13,
      do: [
        ["move", "caller", { x: 570, y: 240 }, 800],
        ["pose", "caller", "think", 900, 500],
      ],
      ask: {
        q: "<code>main</code> calls <code>billing::fee()</code>. Does the Forge let the call through?",
        choices: ["Yes. Both functions are in the same file.", "No. A private item is visible only inside its module."],
        answer: 1,
        explain: "<code>billing</code> is a module, and <code>fee</code> has no <code>pub</code>. Code outside <code>billing</code> can't see <code>fee</code>, even in the same file.",
      },
    },
    {
      say: "<p>The Forge stamps <code>E0603</code> on the call and hands back an error scroll. The build fails, so there is no program to run.</p>",
      line: 13,
      do: [
        ["pose", "forge", "chomp", 700, 400],
        ["pose", "forge", "oops", 1400, 400],
        ["pose", "caller", "oops", 1400, 400],
        ["show", "err", 1500],
        ["arc", "err", { x: 570, y: 235, scale: 0.5 }, 800, 1600, 40],
      ],
    },
  ],
});
