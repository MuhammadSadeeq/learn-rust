/* Chapter 21 motion explainers: what a macro writes, and the finale parade.
   The macro scene's expansion is the simplified public form the chapter's
   viewer already shows (scenarios/ch21.js). The parade runs through every
   entry of OxCast.list in order (sorted by ch), then Oxi molts into
   Rustacean Oxi. The sequence was copied from OxCast.list in cast-art.js. */
(function () {
  "use strict";

  /* ------------------------------------------------------------ macro */
  (window.OX_MOTION = window.OX_MOTION || []).push({
    id: "ch21-macro",
    title: "What vec! writes",
    w: 640,
    h: 300,
    rust: [
      "fn main() {",
      "    let v = vec![1, 2, 3];",
      '    println!("{v:?}");',
      "}",
    ].join("\n"),
    check: "ok",
    stdout: "[1, 2, 3]",
    actors: [
      { id: "oxi", cast: "oxi", x: 70, y: 226, size: 84 },
      { id: "scroll", prop: "scroll", opts: { label: "vec!" }, x: 150, y: 150, size: 110 },
      { id: "forge", cast: "forge", x: 545, y: 160, size: 120, pose: "sleep" },
      { id: "t1", text: "<[_]>::into_vec(", x: 160, y: 120, hidden: true },
      { id: "t2", text: "Box::new([", x: 275, y: 120, hidden: true },
      { id: "t3", text: "1, 2, 3", x: 355, y: 120, hidden: true },
      { id: "t4", text: "]))", x: 400, y: 120, hidden: true },
      { id: "bin", prop: "ingot", opts: { label: "[1, 2, 3]" }, x: 545, y: 262, size: 96, hidden: true },
    ],
    beats: [
      {
        say: "<p>The Forge checks your code after macros have run. Here is <code>vec![1, 2, 3]</code> on its way in.</p>",
        line: 2,
        do: [["pose", "oxi", "talk", 1200, 0]],
      },
      {
        say: "<p>The scroll unrolls into the code the macro writes. Your numbers, <code>1, 2, 3</code>, are the part that came from you.</p>",
        line: 2,
        do: [
          ["poof", "scroll", 0],
          ["pop", "t1", 300],
          ["pop", "t2", 500],
          ["pop", "t3", 700],
          ["cls", "t3", "is-arg", true, 700],
          ["pop", "t4", 900],
        ],
      },
      {
        say: "<p>The Forge checks the written code too. An error in it is reported at the <code>vec!</code> call.</p>",
        line: 2,
        ask: {
          q: "Does the compiler check the code vec! writes, or only the code you typed?",
          choices: [
            "Only the code I typed",
            "The written code too, so an error in it points at the vec! call",
          ],
          answer: 1,
          explain: "Macros expand before type checking. The expansion is checked like any other code.",
        },
        do: [
          ["move", "t1", { x: 545, y: 150 }, 450, 200],
          ["move", "t2", { x: 545, y: 150 }, 450, 300],
          ["move", "t3", { x: 545, y: 150 }, 450, 400],
          ["move", "t4", { x: 545, y: 150 }, 450, 500],
          ["hide", "t1", 650],
          ["hide", "t2", 750],
          ["hide", "t3", 850],
          ["hide", "t4", 950],
          ["pose", "forge", "chomp", 900, 700],
        ],
      },
      {
        say: "<p>The expansion compiles, and the Forge hands back an ingot. The <code>v</code> in your code is a <code>Vec&lt;i32&gt;</code>.</p>",
        line: 2,
        do: [
          ["pop", "bin", 300],
          ["pose", "forge", "happy", 1200, 300],
          ["pose", "oxi", "happy", 1200, 400],
        ],
      },
    ],
  });

  /* ------------------------------------------------------------ parade */
  // One entry per OxCast.list item, in its order (sorted by ch). Props are
  // OxCast.prop; characters are OxCast.el. Each entry crosses the stage and
  // pauses for one caption. The molt at the end uses Oxi again.
  var ORDER = [
    { id: "oxi", cast: "oxi", size: 96, cap: "Oxi: your guide. Chapter 1." },
    { id: "forge", cast: "forge", size: 110, y: 186, cap: "The Forge: the compiler. Chapter 1." },
    { id: "crab", cast: "crab", size: 96, cap: "Crabs: variables. Chapter 2." },
    { id: "pebbles", prop: "pebbles", size: 120, cap: "Pebbles: scalar types. Chapter 3." },
    { id: "semi", cast: "semi", size: 90, cap: "Semi: the semicolon. Chapter 4." },
    { id: "fluffy", cast: "fluffy", size: 96, cap: "Fluffies: data on the heap. Chapter 5." },
    { id: "alloc", cast: "alloc", size: 110, cap: "Alloc: the allocator. Chapter 5." },
    { id: "leash", prop: "leash", size: 120, cap: "The Leash: ownership. Chapter 6." },
    { id: "inspector", cast: "inspector", size: 96, cap: "The Inspector: the borrow checker. Chapter 6." },
    { id: "borrows", prop: "borrows", size: 120, cap: "Glasses and the Lock: &amp; and &amp;mut. Chapter 7." },
    { id: "glyph", cast: "glyph", size: 120, cap: "Glyph: a UTF-8 string. Chapter 8." },
    { id: "mold", cast: "mold", size: 120, opts: { name: "User", fields: ["name: String", "age: u8"] }, cap: "The Mold: a struct. Chapter 9." },
    { id: "octo", cast: "octo", size: 110, cap: "Octo: match. Chapter 10." },
    { id: "switchman", cast: "switchman", size: 96, cap: "The Switchman: Result and ?. Chapter 11." },
    { id: "bouncer", cast: "bouncer", size: 96, cap: "The Bouncer: HashSet. Chapter 12." },
    { id: "clo", cast: "clo", size: 96, cap: "Clo: closures. Chapter 13." },
    { id: "press", cast: "press", size: 110, cap: "The Press: generics. Chapter 14." },
    { id: "tick", cast: "tick", size: 80, y: 186, cap: "Tick: lifetimes. Chapter 15." },
    { id: "cargo", cast: "cargo", size: 150, y: 200, cap: "Cargo: crates and the harbor. Chapter 16." },
    { id: "guard", cast: "guard", size: 110, cap: "The Night Guard: RefCell. Chapter 17." },
    { id: "keeper", cast: "keeper", size: 96, cap: "The Keeper: Mutex. Chapter 18." },
    { id: "waiter", cast: "waiter", size: 96, cap: "The Waiter: the async executor. Chapter 19." },
    { id: "postie", cast: "postie", size: 96, cap: "Postie: a request through middleware. Chapter 20." },
  ];
  var BASE = 210, LEFT = -110, MID = 320, RIGHT = 740;

  var actors = ORDER.map(function (e) {
    var a = { id: e.id, x: LEFT, y: e.y || BASE, size: e.size, hidden: true };
    if (e.prop) a.prop = e.prop; else a.cast = e.cast;
    if (e.opts) a.opts = e.opts;
    return a;
  });
  actors.push({ id: "shell", prop: "shell", x: MID, y: BASE + 10, size: 130, hidden: true });
  actors.push({ id: "graduate", cast: "graduate", x: MID, y: BASE, size: 96, hidden: true });

  var beats = [];
  ORDER.forEach(function (e, k) {
    var ops = [];
    if (k > 0) {
      var prev = ORDER[k - 1].id;
      ops.push(["move", prev, { x: RIGHT }, 600]);
      ops.push(["hide", prev, 600]);
    }
    ops.push(["move", e.id, { x: LEFT }, 0]);
    ops.push(["show", e.id, 0]);
    ops.push(["move", e.id, { x: MID }, 800, 400]);
    if (e.prop) ops.push(["pulse", e.id, 1200]);
    else ops.push(["pose", e.id, "happy", 1200, 1200]);
    beats.push({ say: "<p>" + e.cap + "</p>", do: ops });
  });

  // The molt: Oxi comes back with its shell on, the shell cracks, and
  // Rustacean Oxi steps out.
  var last = ORDER[ORDER.length - 1].id;
  beats.push({
    say: "<p>Oxi comes back for the last molt. Its shell is still on, and it is about to crack.</p>",
    do: [
      ["move", last, { x: RIGHT }, 600],
      ["hide", last, 600],
      ["move", "oxi", { x: LEFT }, 0],
      ["show", "oxi", 0],
      ["move", "oxi", { x: MID }, 800, 400],
      ["pop", "shell", 1300],
      ["shake", "shell", 1900],
      ["shake", "shell", 2300],
    ],
  });
  beats.push({
    say: "<p>Rustacean Oxi: you. Chapter 21.</p>",
    do: [
      ["hide", "oxi", 0],
      ["poof", "shell", 0],
      ["pop", "graduate", 300],
      ["pose", "graduate", "happy", 1400, 400],
      ["confetti", "graduate", 400],
    ],
  });
  beats.push({
    say: "<p>You have met every one of these ideas. The next compiler error you read will point at one of them.</p>",
    do: [
      ["confetti", "graduate", 0],
      ["pose", "graduate", "happy", 1200, 0],
    ],
  });

  window.OX_MOTION.push({
    id: "ch21-parade",
    title: "The whole cast, in order",
    w: 640,
    h: 300,
    actors: actors,
    beats: beats,
  });
})();
