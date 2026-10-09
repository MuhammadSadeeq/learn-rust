/* Motion explainers for Chapter 04: Expressions. The semicolon eats a block's
   value, and an if produces the value of the branch that runs. Each rust field
   is compiled by tools/check-snippets.mjs, beat rust included. The semicolon
   scene changes its code in the beat after each question, so the panel never
   shows an edit before the learner has answered. */
(window.OX_MOTION = window.OX_MOTION || []).push({
  id: "ch04-semicolon",
  title: "The semicolon eats the value",
  w: 640,
  h: 300,
  rust: `fn main() {
    let y: i32 = {
        let a = 3;
        a + 1
    };
    println!("{y}");
}`,
  check: "ok",
  stdout: "4",
  actors: [
    { id: "blk", box: true, x: 170, y: 150, w: 280, h: 200, label: "block" },
    { id: "y", cast: "crab", x: 530, y: 130, size: 96, label: "y", hidden: true },
    { id: "pb", prop: "pebble", opts: { type: "i32", value: "4" }, x: 200, y: 130, size: 60, hidden: true },
    { id: "semi", cast: "semi", x: 370, y: 250, size: 70, hidden: true },
    { id: "unit", prop: "unit", x: 370, y: 150, size: 56, hidden: true },
    { id: "forge", cast: "forge", x: 530, y: 240, size: 90, hidden: true },
    { id: "err", prop: "errscroll", opts: { label: "E0308" }, x: 530, y: 240, size: 90, z: 4, hidden: true },
  ],
  beats: [
    {
      say: "<p>A block is an expression. Its last line, <code>a + 1</code>, has no semicolon, so the block's value is 4.</p>",
      line: 4,
      do: [
        ["pop", "y", 0],
        ["pop", "pb", 250],
      ],
    },
    {
      say: "<p>The value floats out of the block and lands in <code>y</code>. Now <code>y</code> holds 4.</p>",
      line: 2,
      do: [
        ["arc", "pb", { x: 530, y: 130, scale: 0.6 }, 700, 0, 50],
        ["hide", "pb", 700],
        ["label", "y", "y = 4", 700],
        ["pose", "y", "happy", 900, 700],
      ],
    },
    {
      line: 4,
      ask: {
        q: "Now a semicolon goes after <code>a + 1</code>. What does <code>y</code> get?",
        choices: ["4, as before", "() the empty box"],
        answer: 1,
        explain: "The semicolon turns <code>a + 1</code> into a statement. The block then ends with nothing, so its value is <code>()</code>.",
      },
      say: "<p>Imagine the <code>;</code> after <code>a + 1</code>. <b>Semi</b> hops in, chomps the 4, and leaves the empty box <code>()</code>.</p>",
      do: [
        ["label", "y", "y", 0],
        ["move", "pb", { x: 200, y: 130 }, 0, 0],
        ["pop", "pb", 0],
        ["pop", "semi", 0],
        ["arc", "semi", { x: 370, y: 130 }, 500, 0, 30],
        ["arc", "pb", { x: 350, y: 130, scale: 0.6 }, 400, 600, 30],
        ["pose", "semi", "chomp", 900, 1050],
        ["hide", "pb", 1050],
        ["pop", "unit", 1100],
        ["arc", "unit", { x: 530, y: 130, scale: 0.8 }, 700, 1500, 50],
        ["hide", "unit", 2200],
        ["pose", "y", "oops", 1300, 2200],
        ["label", "y", "y = ()", 2200],
      ],
    },
    {
      line: 4,
      rust: `fn main() {
    let y: i32 = {
        let a = 3;
        a + 1;
    };
    println!("{y}");
}`,
      check: "E0308",
      say: "<p>Now the program has that <code>;</code>. The Forge checks types before anything runs: the block's value is <code>()</code>, which does not fit <code>y: i32</code>, so it hands back <b>E0308</b>.</p>",
      do: [
        ["pop", "forge", 0],
        ["pose", "forge", "oops", 1400, 0],
        ["pop", "err", 400],
        ["arc", "err", { x: 390, y: 250, scale: 1 }, 700, 900, 60],
      ],
    },
    {
      line: 4,
      rust: `fn main() {
    let y: i32 = {
        let a = 3;
        a + 1
    };
    println!("{y}");
}`,
      check: "ok",
      say: "<p>Delete the <code>;</code>. The block's value is 4 again, and <code>y</code> accepts it.</p>",
      do: [
        ["poof", "err", 0],
        ["hide", "forge", 0],
        ["hide", "semi", 0],
        ["label", "y", "y = 4", 0],
        ["pose", "y", "happy", 900, 0],
      ],
    },
  ],
});

(window.OX_MOTION = window.OX_MOTION || []).push({
  id: "ch04-if-value",
  title: "An if hands over one value",
  w: 640,
  h: 300,
  rust: `fn pick(n: i32) -> &'static str {
    let label = if n > 0 { "positive" } else { "zero or less" };
    label
}

fn main() {
    println!("{}", pick(5));
    println!("{}", pick(-2));
}`,
  check: "ok",
  stdout: "positive\nzero or less",
  actors: [
    { id: "n", prop: "pebble", opts: { type: "i32", value: "5" }, x: 70, y: 150, size: 62, label: "n" },
    { id: "cond", text: "if n > 0", x: 190, y: 150 },
    { id: "yes", text: '{ "positive" }', x: 340, y: 70, opacity: 0.4 },
    { id: "no", text: 'else { "zero or less" }', x: 340, y: 230, opacity: 0.4 },
    { id: "lab", cast: "crab", x: 500, y: 150, size: 96, label: "label", hidden: true },
    { id: "v1", text: '"positive"', x: 340, y: 150, hidden: true },
    { id: "v2", text: '"zero or less"', x: 340, y: 150, hidden: true },
  ],
  beats: [
    {
      line: 2,
      say: "<p>An <code>if</code> checks its condition first. With <code>n</code> at 5, <code>5 &gt; 0</code> is true, so the first branch runs.</p>",
      do: [
        ["fade", "yes", 1, 400],
        ["pulse", "cond", 0],
      ],
    },
    {
      line: 2,
      say: "<p>That branch's value, <code>\"positive\"</code>, becomes the value of the whole <code>if</code>. It goes into <code>label</code>.</p>",
      do: [
        ["pop", "lab", 0],
        ["pop", "v1", 0],
        ["arc", "v1", { x: 500, y: 44 }, 700, 300, 50],
        ["hide", "v1", 1000],
        ["label", "lab", 'label = "positive"', 1000],
        ["pose", "lab", "happy", 900, 1000],
      ],
    },
    {
      line: 2,
      say: "<p>With <code>n</code> at -2, <code>-2 &gt; 0</code> is false, so the <code>else</code> branch runs instead.</p>",
      ask: {
        q: "Now <code>n</code> is -2. Which value reaches <code>label</code>?",
        choices: ['"positive"', '"zero or less"'],
        answer: 1,
        explain: "<code>-2 &gt; 0</code> is false, so the <code>else</code> branch runs, and its value is the result.",
      },
      do: [
        ["art", "n", { prop: "pebble", opts: { type: "i32", value: "-2" } }, 0],
        ["fade", "yes", 0.4, 400],
        ["fade", "no", 1, 400],
        ["label", "lab", "label", 0],
      ],
    },
    {
      line: 2,
      say: "<p>The <code>else</code> value, <code>\"zero or less\"</code>, reaches <code>label</code> the same way.</p>",
      do: [
        ["pop", "v2", 0],
        ["arc", "v2", { x: 500, y: 44 }, 700, 300, 50],
        ["hide", "v2", 1000],
        ["label", "lab", 'label = "zero or less"', 1000],
        ["pose", "lab", "happy", 900, 1000],
      ],
    },
    {
      line: 3,
      say: "<p>Only the branch that ran gave a value. Both branches must give the same type, because <code>label</code> holds one.</p>",
      do: [],
    },
  ],
});
