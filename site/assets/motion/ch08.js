/* Chapter 08 (Strings and slices) motion and data.
   Scene ch08-boundary: the rust field runs; the first slice prints "caf", and
   the second slice, &s[0..4], panics (checked with check: "panic").

   OX_CH08_CUT: the programs behind the Caterpillar cutter. Each one was run with
   rustc 1.97. The "message" field is the panic text rustc printed; the cutter
   builds the same text in JS (the chapter's u8Slice), and its output matches
   rustc for 603 cut pairs. The checker compiles each rust field. */
(function () {
  "use strict";
  const CHARS = ["c", "a", "f", "é"];

  (window.OX_MOTION = window.OX_MOTION || []).push({
    id: "ch08-boundary",
    title: "Where a slice may cut",
    w: 640,
    h: 300,
    rust: [
      "fn main() {",
      '    let s = "café";',
      "    let a = &s[0..3];",
      '    println!("{a}");',
      "    let b = &s[0..4];",
      '    println!("{b}");',
      "}",
    ].join("\n"),
    check: "panic",
    stdout: "caf",
    actors: [
      { id: "g", cast: "glyph", opts: { chars: CHARS }, x: 320, y: 140, size: 380, hidden: true },
      { id: "ta", text: '&s[0..3] is "caf"', x: 320, y: 36, hidden: true },
      { id: "tb", text: "&s[0..4] panics", x: 320, y: 268, hidden: true },
    ],
    beats: [
      {
        say: "<p>Glyph spells <code>café</code>. Each byte is one segment, and the <code>é</code> takes two.</p>",
        line: 2,
        do: [
          ["pop", "g", 0],
          ["pose", "g", "talk", 1600, 400],
        ],
      },
      {
        say: "<p><code>&amp;s[0..3]</code> cuts between two letters, after the <code>f</code>. The slice is <code>caf</code>.</p>",
        line: 3,
        do: [
          ["art", "g", { cast: "glyph", opts: { chars: CHARS, cut: 3 } }, 0],
          ["pop", "ta", 200],
          ["pose", "g", "happy", 1200, 400],
        ],
      },
      {
        say: "<p>Next comes <code>&amp;s[0..4]</code>. Read the question before you look at the answer.</p>",
        line: 5,
        ask: {
          q: "Does the cut &amp;s[0..4] fall between two characters?",
          choices: ["Yes, it falls after the é", "No, it falls inside the é"],
          answer: 1,
          explain: "é takes bytes 3 and 4. The slice 0..4 would keep only the first of them.",
        },
        do: [
          ["art", "g", { cast: "glyph", opts: { chars: CHARS, cut: 4 } }, 0],
          ["pop", "tb", 200],
        ],
      },
      {
        say: "<p>Rust panics here: <code>end byte index 4 is not a char boundary; it is inside 'é' (bytes 3..5 of string)</code>. The first slice ran fine.</p>",
        line: 5,
        do: [
          ["pose", "g", "ouch", 0, 0],
          ["shake", "g", 0],
        ],
      },
      {
        say: "<p>When the cut comes from input you don't control, call <code>s.get(0..4)</code>. It returns <code>None</code> instead of panicking.</p>",
        line: 5,
        do: [["pose", "g", "think", 0, 0]],
      },
    ],
  });

  (window.OX_CH08_CUT = window.OX_CH08_CUT || []).push(
    {
      id: "cafe-3-ok",
      text: "café",
      cut: 3,
      check: "ok",
      stdout: "caf | é",
      rust: [
        "fn main() {",
        '    let s = "café";',
        "    let left = &s[..3];",
        "    let right = &s[3..];",
        '    println!("{left} | {right}");',
        "}",
      ].join("\n"),
    },
    {
      id: "cafe-4-panic",
      text: "café",
      cut: 4,
      check: "panic",
      message: "end byte index 4 is not a char boundary; it is inside 'é' (bytes 3..5 of string)",
      rust: [
        "fn main() {",
        '    let s = "café";',
        "    let left = &s[..4];",
        "    let right = &s[4..];",
        '    println!("{left} | {right}");',
        "}",
      ].join("\n"),
    },
    {
      id: "naive-3-panic",
      text: "naïve",
      cut: 3,
      check: "panic",
      message: "end byte index 3 is not a char boundary; it is inside 'ï' (bytes 2..4 of string)",
      rust: [
        "fn main() {",
        '    let s = "naïve";',
        "    let left = &s[..3];",
        "    let right = &s[3..];",
        '    println!("{left} | {right}");',
        "}",
      ].join("\n"),
    },
    {
      id: "naive-4-ok",
      text: "naïve",
      cut: 4,
      check: "ok",
      stdout: "naï | ve",
      rust: [
        "fn main() {",
        '    let s = "naïve";',
        "    let left = &s[..4];",
        "    let right = &s[4..];",
        '    println!("{left} | {right}");',
        "}",
      ].join("\n"),
    },
    {
      id: "jp-1-panic",
      text: "日本",
      cut: 1,
      check: "panic",
      message: "end byte index 1 is not a char boundary; it is inside '日' (bytes 0..3 of string)",
      rust: [
        "fn main() {",
        '    let s = "日本";',
        "    let left = &s[..1];",
        "    let right = &s[1..];",
        '    println!("{left} | {right}");',
        "}",
      ].join("\n"),
    },
    {
      id: "crab-2-panic",
      text: "🦀 crab",
      cut: 2,
      check: "panic",
      message: "end byte index 2 is not a char boundary; it is inside '🦀' (bytes 0..4 of string)",
      rust: [
        "fn main() {",
        '    let s = "🦀 crab";',
        "    let left = &s[..2];",
        "    let right = &s[2..];",
        '    println!("{left} | {right}");',
        "}",
      ].join("\n"),
    }
  );
})();
