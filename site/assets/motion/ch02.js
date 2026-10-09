/* Chapter 02 motion scenes and data: Variables Are Promises.
   Scenes: ch02-mut (a crab that cannot be given a new pebble, then can) and
   ch02-shadow (a second let makes a new crab named x in front).
   OX_CH02_WHO: the program of the "Who answers to x?" interaction.
   Every rust field, and every stdout, is compiled by tools/check-snippets.mjs
   with rustc 1.97 (edition 2024). */

(window.OX_MOTION = window.OX_MOTION || []).push({
  id: "ch02-mut",
  title: "mut: the same crab, a new pebble",
  w: 640,
  h: 300,
  rust: 'fn main() {\n    let mut x = 5;\n    println!("{x}");\n    x = 6;\n    println!("{x}");\n}',
  check: "ok",
  stdout: "5\n6",
  actors: [
    { id: "x", cast: "crab", opts: { gear: ["pebble"] }, x: 180, y: 190, size: 120, label: "x" },
    { id: "v5", prop: "pebble", opts: { type: "i32", value: 5 }, x: 180, y: 110, size: 56 },
    { id: "v6", prop: "pebble", opts: { type: "i32", value: 6 }, x: 180, y: 110, size: 56, hidden: true },
    { id: "forge", cast: "forge", x: 480, y: 170, size: 130, pose: "sleep" },
    { id: "err", prop: "errscroll", opts: { label: "E0384" }, x: 480, y: 228, size: 100, scale: 0.4, z: 4, hidden: true },
  ],
  beats: [
    {
      line: 2,
      say: "<p>Crab <b>x</b> holds the pebble 5. Written without <code>mut</code>, the name cannot be given a new pebble later.</p>",
    },
    {
      line: 4,
      say: "<p><code>x = 6;</code> is refused. The Forge stops it with E0384, because a plain <code>let</code> is assigned once. The crab keeps its 5.</p>",
      do: [
        ["pose", "x", "oops"],
        ["shake", "x"],
        ["pose", "forge", "chomp", 800, 0],
        ["pose", "forge", "oops", 0, 900],
        ["show", "err", 700],
        ["arc", "err", { x: 330, y: 236, scale: 1 }, 800, 1000, 40],
      ],
    },
    {
      line: 2,
      say: "<p>Add <code>mut</code> to the <code>let</code>. The claw opens, the 5 drops away, and 6 arrives in the same claw.</p>",
      do: [
        ["poof", "err", 0],
        ["art", "x", { cast: "crab", opts: {} }, 0],
        ["move", "v5", { x: 120, y: 272, scale: 0.6 }, 450, 0],
        ["poof", "v5", 450],
        ["pop", "v6", 650],
        ["art", "x", { cast: "crab", opts: { gear: ["pebble"] } }, 650],
        ["pose", "x", "happy", 1300, 650],
      ],
    },
    {
      line: 5,
      say: "<p>With <code>mut</code>, the program builds and prints 5, then 6. It is still one box, and only its value changes.</p>",
      do: [["pulse", "v6"]],
    },
  ],
});

(window.OX_MOTION = window.OX_MOTION || []).push({
  id: "ch02-shadow",
  title: "Shadowing: a new crab takes the name",
  w: 640,
  h: 300,
  rust: 'fn main() {\n    let x = "5";\n    let x: i32 = x.parse().unwrap();\n    println!("{x}");\n}',
  check: "ok",
  stdout: "5",
  actors: [
    { id: "a", cast: "crab", x: 150, y: 190, size: 120, label: "x", hidden: true },
    { id: "tile", prop: "pebble", opts: { type: "char", value: '"5"' }, x: 150, y: 108, size: 56, hidden: true },
    { id: "b", cast: "crab", x: 240, y: 190, size: 120, label: "x", z: 5, hidden: true },
    { id: "five", prop: "pebble", opts: { type: "i32", value: 5 }, x: 240, y: 108, size: 56, z: 5, hidden: true },
  ],
  beats: [
    {
      line: 2,
      say: "<p><code>let x = \"5\";</code> makes crab <b>x</b> holding the text <code>\"5\"</code>. It is a string, not a number yet.</p>",
      do: [
        ["pop", "a", 0],
        ["pop", "tile", 250],
      ],
    },
    {
      line: 3,
      ask: {
        q: "<code>let x: i32 = x.parse().unwrap();</code> runs. Did the first x change?",
        choices: ["Yes, it became the number 5", "No. A new variable took the name, and the old one is still there"],
        answer: 1,
        explain: "Shadowing never changes the old variable. A new one takes the name, and the old one stays until its scope ends.",
      },
      say: "<p>A second <code>let</code> makes a new crab named <b>x</b>, in front, holding the pebble 5. The old crab fades behind it, still there but unreachable.</p>",
      do: [
        ["pop", "b", 0],
        ["pop", "five", 250],
        ["fade", "a", 0.35, 400, 0],
        ["fade", "tile", 0.35, 400, 0],
      ],
    },
    {
      line: 4,
      say: "<p><code>println!(\"{x}\")</code> reads the newest x, the pebble 5. The old crab is still there, but no name reaches it.</p>",
      do: [["pulse", "b", 0]],
    },
  ],
});

/* "Who answers to x?" (chapter 02): one program, stepped line by line. */
window.OX_CH02_WHO = [
  {
    id: "who",
    title: "Who answers to x?",
    rust: 'fn main() {\n    let x = 2;\n    let x = x * 10;\n    {\n        let x = x + 1;\n        println!("{x}");\n    }\n    println!("{x}");\n}',
    check: "ok",
    stdout: "21\n20",
  },
];
