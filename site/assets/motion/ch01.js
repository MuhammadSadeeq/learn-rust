/* Chapter 01 motion scenes and data: Hello, Crab.
   Scenes: ch01-two-worlds (PHP per request against Rust built once) and
   ch01-first-error (the chapter's first rustc error, through the Forge).
   OX_CH01_FORGE: the five programs of the "Feed the Forge" interaction.
   Every rust field, and every stdout, is compiled by tools/check-snippets.mjs
   with rustc 1.97 (edition 2024). */

(window.OX_MOTION = window.OX_MOTION || []).push({
  id: "ch01-two-worlds",
  title: "Two worlds: PHP per request, Rust built once",
  w: 640,
  h: 300,
  actors: [
    { id: "php", box: true, x: 150, y: 150, w: 290, h: 276, label: "PHP, every request" },
    { id: "rs", box: true, x: 490, y: 150, w: 290, h: 276, label: "Rust, built once" },
    { id: "fpm", box: true, x: 150, y: 96, w: 150, h: 52, label: "php-fpm" },
    { id: "src-php", prop: "scroll", opts: { label: "index.php" }, x: 150, y: 236, size: 84, hidden: true },
    { id: "r1", prop: "parcel", opts: { label: "GET /" }, x: 30, y: 96, size: 56, hidden: true },
    { id: "r2", prop: "parcel", opts: { label: "GET /" }, x: 30, y: 96, size: 56, hidden: true },
    { id: "r3", prop: "parcel", opts: { label: "GET /" }, x: 30, y: 96, size: 56, hidden: true },
    { id: "build", text: "cargo build", x: 500, y: 52, hidden: true },
    { id: "src-rs", prop: "scroll", opts: { label: "main.rs" }, x: 390, y: 246, size: 84, hidden: true },
    { id: "forge", cast: "forge", x: 500, y: 150, size: 116, pose: "sleep" },
    { id: "ingot", prop: "ingot", opts: { label: "binary" }, x: 500, y: 246, size: 92, hidden: true },
    { id: "q1", prop: "parcel", opts: { label: "GET /" }, x: 625, y: 246, size: 56, hidden: true },
    { id: "q2", prop: "parcel", opts: { label: "GET /" }, x: 625, y: 246, size: 56, hidden: true },
    { id: "q3", prop: "parcel", opts: { label: "GET /" }, x: 625, y: 246, size: 56, hidden: true },
  ],
  beats: [
    {
      say: "<p>One program, two worlds. On the left, PHP runs the script for every request. On the right, Rust builds it once, before any request arrives.</p>",
      do: [
        ["pop", "src-php", 0],
        ["pop", "src-rs", 250],
      ],
    },
    {
      say: "<p>A request arrives. <b>php-fpm</b> takes it and runs the script from the top.</p>",
      do: [
        ["pop", "r1", 0],
        ["arc", "r1", { x: 150, y: 96, scale: 0.35 }, 500, 250, 30],
        ["poof", "r1", 750],
        ["pulse", "fpm", 750],
        ["arc", "src-php", { x: 150, y: 182, scale: 0.8 }, 450, 750, 20],
        ["arc", "src-php", { x: 150, y: 236, scale: 1 }, 450, 1250, 20],
      ],
    },
    {
      say: "<p>Request two gets the same treatment. Its variables start empty, because request one's were freed when it ended.</p>",
      do: [
        ["pop", "r2", 0],
        ["arc", "r2", { x: 150, y: 96, scale: 0.35 }, 500, 250, 30],
        ["poof", "r2", 750],
        ["pulse", "fpm", 750],
        ["arc", "src-php", { x: 150, y: 182, scale: 0.8 }, 450, 750, 20],
        ["arc", "src-php", { x: 150, y: 236, scale: 1 }, 450, 1250, 20],
      ],
    },
    {
      say: "<p>Request three runs the same way. The script starts from the top again, and its code never changes between requests.</p>",
      do: [
        ["pop", "r3", 0],
        ["arc", "r3", { x: 150, y: 96, scale: 0.35 }, 500, 250, 30],
        ["poof", "r3", 750],
        ["pulse", "fpm", 750],
        ["arc", "src-php", { x: 150, y: 182, scale: 0.8 }, 450, 750, 20],
        ["arc", "src-php", { x: 150, y: 236, scale: 1 }, 450, 1250, 20],
      ],
    },
    {
      say: "<p>Now the Rust side. <code>cargo build</code> hands <code>main.rs</code> to the Forge once, before any request arrives.</p>",
      ask: {
        q: "When does Rust find a type error in a function that no request calls yet?",
        choices: ["When the first request calls that function", "At build time, before any request arrives"],
        answer: 1,
        explain: "The Forge checks every function when it builds, called or not. The error does not wait for a request.",
      },
      do: [
        ["show", "build", 0],
        ["arc", "src-rs", { x: 500, y: 150, scale: 0.35 }, 700, 0, 40],
        ["fade", "src-rs", 0, 250, 550],
        ["pose", "forge", "chomp", 800, 650],
        ["pop", "ingot", 1500],
        ["pose", "forge", "happy", 0, 1500],
      ],
    },
    {
      say: "<p>Three requests reach the same ingot. It is already machine code, so nothing is compiled when a request arrives.</p>",
      do: [
        ["pop", "q1", 0],
        ["arc", "q1", { x: 560, y: 246, scale: 0.35 }, 450, 0, 30],
        ["poof", "q1", 450],
        ["pulse", "ingot", 450],
        ["pop", "q2", 350],
        ["arc", "q2", { x: 560, y: 246, scale: 0.35 }, 450, 350, 30],
        ["poof", "q2", 800],
        ["pulse", "ingot", 800],
        ["pop", "q3", 700],
        ["arc", "q3", { x: 560, y: 246, scale: 0.35 }, 450, 700, 30],
        ["poof", "q3", 1150],
        ["pulse", "ingot", 1150],
      ],
    },
    {
      say: "<p>Same binary, every request. Build once, and run it as often as you like.</p>",
      do: [["pulse", "ingot", 0]],
    },
  ],
});

(window.OX_MOTION = window.OX_MOTION || []).push({
  id: "ch01-first-error",
  title: "The first error, through the Forge",
  w: 640,
  h: 300,
  rust: 'fn main() {\n    println("Hi");\n}',
  check: "E0423",
  actors: [
    { id: "oxi", cast: "oxi", x: 70, y: 226, size: 90 },
    { id: "src", prop: "scroll", opts: { label: "main.rs" }, x: 150, y: 140, size: 100, hidden: true },
    { id: "forge", cast: "forge", x: 360, y: 150, size: 150, pose: "sleep" },
    { id: "err", prop: "errscroll", opts: { label: "E0423" }, x: 360, y: 188, size: 100, scale: 0.4, z: 4, hidden: true },
    { id: "ingot", prop: "ingot", opts: { label: "hi" }, x: 560, y: 150, size: 110, hidden: true },
  ],
  beats: [
    {
      line: 2,
      say: "<p>This is the chapter's first error, as the panel shows it: <code>println</code> without its <code>!</code>. Watch what the Forge does with the file.</p>",
      do: [
        ["pop", "src", 0],
        ["pose", "oxi", "talk", 1400, 0],
      ],
    },
    {
      line: 2,
      say: "<p>The Forge reads the whole file before anything runs. It chomps the scroll and checks each line.</p>",
      do: [
        ["arc", "src", { x: 360, y: 188, scale: 0.4 }, 700, 0, 40],
        ["fade", "src", 0, 250, 600],
        ["pose", "forge", "chomp", 900, 650],
      ],
    },
    {
      line: 2,
      say: "<p>It does not build. The Forge hands back an error scroll with <b>E0423</b>: expected function, found macro.</p>",
      do: [
        ["pose", "forge", "oops"],
        ["show", "err", 0],
        ["arc", "err", { x: 165, y: 236, scale: 1 }, 800, 200, 50],
      ],
    },
    {
      line: 2,
      say: "<p>Oxi reads the code and the help line. The help line says to use <code>!</code> to invoke the macro.</p>",
      do: [["pose", "oxi", "think"]],
    },
    {
      line: 2,
      say: "<p>Add the <code>!</code> and the file builds. The scroll is fixed, the Forge is happy, and out comes an ingot. The panel keeps the file as it was first written.</p>",
      do: [
        ["poof", "err", 0],
        ["move", "src", { x: 150, y: 140, scale: 1 }, 0, 0],
        ["label", "src", "fixed", 0],
        ["pop", "src", 0],
        ["pose", "forge", "happy"],
        ["pop", "ingot", 500],
        ["pose", "oxi", "happy", 1200, 500],
      ],
    },
  ],
});

/* Feed the Forge (chapter 01): five whole programs. Each check is what rustc
   1.97 did with it: "ok" builds (stdout is what the ingot prints), an error
   code is the rejection, and "error" is a rejection with no code at all. */
window.OX_CH01_FORGE = [
  {
    id: "legs",
    rust: 'fn main() {\n    let legs: u8 = "four";\n    println!("{legs}");\n}',
    check: "E0308",
    code: "E0308",
    msg: "mismatched types: expected `u8`, found `&str`",
    why: "The name says u8, so the value must be a number. \"four\" is text.",
  },
  {
    id: "greet",
    rust: 'fn main() {\n    let greeting = "Hi";\n    println!("{greeting}, Ferris");\n}',
    check: "ok",
    stdout: "Hi, Ferris",
    why: "Both sides of the let have a type the Forge can settle before the program runs.",
  },
  {
    id: "semi",
    rust: 'fn main() {\n    let legs = 8\n    println!("{legs}");\n}',
    check: "error",
    code: "",
    msg: "expected `;`, found `println`",
    why: "A statement needs a ; at its end. The Forge wants one before the next line.",
  },
  {
    id: "double",
    rust: "fn double(n: i32) -> i32 {\n    n * 2\n}\n\nfn main() {\n    println!(\"{}\", double(21));\n}",
    check: "ok",
    stdout: "42",
    why: "The signature says i32 in and i32 out, and n * 2 is an i32.",
  },
  {
    id: "price",
    rust: 'fn main() {\n    let price = 3.5;\n    println!("price: {price:.2}");\n}',
    check: "ok",
    stdout: "price: 3.50",
    why: "A decimal literal is an f64 by default. {price:.2} rounds it on the way out.",
  },
];
