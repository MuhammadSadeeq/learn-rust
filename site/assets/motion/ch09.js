/* Chapter 09 (Structs) motion: the Mold, and what a struct update moves.
   Scene ch09-pour: pour two values, then a literal without age, which the Forge
   stops with E0063. The scene's rust is the program that compiles; the beat
   that shows the literal without age carries its own rust (checked).
   Scene ch09-update: ..ana takes email from ana, so email moves to bo.
   Verified with rustc 1.97: ana.name and ana.age stay usable, and reading
   ana.email is E0382 (the field that moved is email, not name). */
(function () {
  "use strict";

  (window.OX_MOTION = window.OX_MOTION || []).push({
    id: "ch09-pour",
    title: "Pour a value through the Mold",
    w: 640,
    h: 300,
    rust: [
      "struct User {",
      "    name: String,",
      "    age: u8,",
      "}",
      "",
      "fn main() {",
      '    let ana = User { name: String::from("Ana"), age: 31 };',
      '    let bo = User { name: String::from("Bo"), age: 27 };',
      '    println!("{} {}", ana.name, bo.age);',
      "}",
    ].join("\n"),
    check: "ok",
    stdout: "Ana 27",
    actors: [
      { id: "mold", cast: "mold", opts: { name: "User", fields: ["name: String", "age: u8"] }, x: 110, y: 150, size: 190 },
      { id: "ana", box: true, x: 470, y: 88, w: 210, h: 82, label: "ana: User", cls: "is-stack" },
      { id: "ana_n", text: 'name: "Ana"', x: 470, y: 72, hidden: true },
      { id: "ana_a", text: "age: 31", x: 470, y: 104, hidden: true },
      { id: "bo", box: true, x: 470, y: 222, w: 210, h: 82, label: "bo: User", cls: "is-stack" },
      { id: "bo_n", text: 'name: "Bo"', x: 470, y: 206, hidden: true },
      { id: "bo_a", text: "age: 27", x: 470, y: 238, hidden: true },
      { id: "forge", cast: "forge", x: 300, y: 150, size: 120, pose: "sleep" },
      { id: "bad", prop: "scroll", opts: { label: "bad.rs" }, x: 120, y: 262, size: 100, hidden: true },
      { id: "err", prop: "errscroll", opts: { label: "E0063" }, x: 300, y: 150, size: 100, scale: 0.4, z: 4, hidden: true },
    ],
    beats: [
      {
        say: "<p>A struct is a mold with one cavity per field. Every value poured from it has exactly these fields.</p>",
        line: 1,
        do: [],
      },
      {
        say: "<p>Pour in a name and an age, and <code>ana</code> comes out with both fields filled.</p>",
        line: 7,
        do: [
          ["pop", "ana_n", 0],
          ["pop", "ana_a", 300],
          ["pulse", "ana", 600],
        ],
      },
      {
        say: "<p>Imagine <code>bo</code>'s literal without <code>age</code>. The Forge stops it with <b>E0063</b>, and the next panel shows that literal.</p>",
        line: 8,
        ask: {
          q: "A literal sets only name and leaves out age. Will rustc accept it?",
          choices: ["Yes, age defaults to 0", "No, every field must be set"],
          answer: 1,
          explain: "A struct literal must set every field. Rust has no default field values, so the literal never becomes a value.",
        },
        do: [
          ["pop", "bad", 0],
          ["arc", "bad", { x: 300, y: 150, scale: 0.4 }, 700, 300, 40],
          ["poof", "bad", 1150],
          ["pose", "forge", "chomp", 700, 1050],
          ["pose", "forge", "oops", 1400, 1400],
          ["show", "err", 1500],
          ["arc", "err", { x: 300, y: 262, scale: 1 }, 800, 1500, 30],
        ],
      },
      {
        say: "<p>The panel shows the literal for <code>bo</code>. It leaves out <code>age</code>, so the struct literal does not compile: <b>E0063</b>. Nothing is poured.</p>",
        line: 8,
        rust: [
          "struct User {",
          "    name: String,",
          "    age: u8,",
          "}",
          "",
          "fn main() {",
          '    let ana = User { name: String::from("Ana"), age: 31 };',
          '    let bo = User { name: String::from("Bo") };',
          '    println!("{} {}", ana.name, bo.age);',
          "}",
        ].join("\n"),
        check: "E0063",
        do: [["pulse", "err", 0]],
      },
      {
        say: "<p>Add <code>age: 27</code> to the literal, and it pours. <code>bo</code> comes out with both fields.</p>",
        line: 8,
        rust: [
          "struct User {",
          "    name: String,",
          "    age: u8,",
          "}",
          "",
          "fn main() {",
          '    let ana = User { name: String::from("Ana"), age: 31 };',
          '    let bo = User { name: String::from("Bo"), age: 27 };',
          '    println!("{} {}", ana.name, bo.age);',
          "}",
        ].join("\n"),
        check: "ok",
        do: [
          ["poof", "err", 0],
          ["pop", "bo_n", 0],
          ["pop", "bo_a", 300],
          ["pulse", "bo", 600],
          ["pose", "forge", "happy", 1200, 300],
        ],
      },
    ],
  });

  (window.OX_MOTION = window.OX_MOTION || []).push({
    id: "ch09-update",
    title: "What the struct update ..ana moves",
    w: 640,
    h: 300,
    rust: [
      "struct User {",
      "    name: String,",
      "    email: String,",
      "    age: u8,",
      "}",
      "",
      "fn main() {",
      "    let ana = User {",
      '        name: String::from("Ana"),',
      '        email: String::from("ana@x.io"),',
      "        age: 31,",
      "    };",
      "    let bo = User {",
      '        name: String::from("Bo"),',
      "        ..ana",
      "    };",
      '    println!("{} {} {}", bo.name, bo.email, bo.age);',
      '    println!("{} {}", ana.name, ana.age);',
      "}",
    ].join("\n"),
    check: "ok",
    stdout: "Bo ana@x.io 31\nAna 31",
    actors: [
      { id: "ana", cast: "crab", x: 110, y: 150, size: 100, label: "ana" },
      { id: "nA", cast: "fluffy", x: 280, y: 70, size: 74, label: "name" },
      { id: "eM", cast: "fluffy", x: 280, y: 232, size: 74, label: "email" },
      { id: "ageA", prop: "pebble", opts: { type: "u8", value: "31" }, x: 110, y: 254, size: 64 },
      { id: "ins", cast: "inspector", x: 380, y: 150, size: 96, hidden: true },
      { id: "bo", cast: "crab", x: 520, y: 150, size: 100, label: "bo", hidden: true },
      { id: "nB", cast: "fluffy", x: 560, y: 70, size: 66, label: "name", hidden: true },
      { id: "ageB", prop: "pebble", opts: { type: "u8", value: "31" }, x: 540, y: 254, size: 64, hidden: true },
    ],
    beats: [
      {
        say: "<p><code>ana</code> is a <code>User</code>. Her name and email are heap data, and her age is a small pebble.</p>",
        line: 8,
        do: [
          ["link", "a-n", "ana", "nA", "own", 0],
          ["link", "a-e", "ana", "eM", "own", 400],
        ],
      },
      {
        say: "<p>The struct update <code>..ana</code> takes <code>email</code> from <code>ana</code>. The String moves, so its leash now belongs to <code>bo</code>.</p>",
        line: 15,
        ask: {
          q: "After bo is made with ..ana, can ana.email still be used?",
          choices: ["Yes, bo only copied it", "No, the String moved into bo"],
          answer: 1,
          explain: "email is not written in the literal, so the update takes it from ana. A String is not Copy, so it moves.",
        },
        do: [
          ["pop", "bo", 0],
          ["pop", "nB", 200],
          ["link", "b-n", "bo", "nB", "own", 400],
          ["unlink", "a-e", 900],
          ["label", "ana", "ana: email moved", 900],
          ["link", "b-e", "bo", "eM", "own", 1200],
        ],
      },
      {
        say: "<p><code>age</code> is a <code>u8</code>, which is <code>Copy</code>. The update copies it, so <code>ana</code> keeps her own.</p>",
        line: 15,
        do: [
          ["pop", "ageB", 0],
          ["pulse", "ageA", 300],
        ],
      },
      {
        say: "<p>Reading <code>ana.email</code> now is <b>E0382</b>: it moved to bo. <code>ana.name</code> is still fine, because the literal wrote <code>name</code>.</p>",
        line: 18,
        do: [
          ["pop", "ins", 0],
          ["say", "ins", "<b>E0382</b>", 2200, 300],
          ["pulse", "nA", 800],
        ],
      },
    ],
  });
})();
