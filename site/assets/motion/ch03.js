/* Chapter 03 motion scene and data: Types Are Shapes.
   Scene: ch03-overflow (255 + 1 in a u8, debug build against release build).
   OX_CH03_SORT: one program for every pebble and slot in the Shape sorter.
   An "ok" entry builds, and stdout is what it prints. Any other check is the
   rustc 1.97 error that rejects it (a code, or "error" for a lint with no code).
   Every rust field is compiled by tools/check-snippets.mjs. The debug and
   release behavior of the overflow scene was run with -C debug-assertions on
   and off. */

(window.OX_MOTION = window.OX_MOTION || []).push({
  id: "ch03-overflow",
  title: "255 + 1 in a u8: two builds, two results",
  w: 640,
  h: 300,
  rust: 'fn main() {\n    let x: u8 = "255".parse().unwrap();\n    let y = x + 1;\n    println!("{y}");\n}',
  check: "ok",
  actors: [
    { id: "dbg-box", box: true, x: 160, y: 150, w: 300, h: 270, label: "debug build" },
    { id: "rel-box", box: true, x: 480, y: 150, w: 300, h: 270, label: "release build" },
    { id: "dbg-p", prop: "pebble", opts: { type: "u8", value: "" }, x: 160, y: 92, size: 52, label: "255" },
    { id: "rel-p", prop: "pebble", opts: { type: "u8", value: "" }, x: 480, y: 92, size: 52, label: "255" },
    { id: "dbg", cast: "crab", x: 160, y: 190, size: 110, label: "x" },
    { id: "rel", cast: "crab", x: 480, y: 190, size: 110, label: "x" },
  ],
  beats: [
    {
      line: 2,
      say: "<p>Both builds run the same two lines. <code>x</code> is a <code>u8</code> holding 255, the largest value a u8 can hold.</p>",
    },
    {
      line: 3,
      ask: {
        q: "What does <code>x + 1</code> do in a release build?",
        choices: ["It panics, the same as a debug build", "It wraps around to 0"],
        answer: 1,
        explain: "A release build skips the overflow check, so 255 + 1 wraps to 0 in a u8.",
      },
      say: "<p>The debug build checks the addition and panics. The release build skips the check, and the value reads <b>0</b>.</p>",
      do: [
        ["pose", "dbg", "ouch"],
        ["shake", "dbg", 300],
        ["say", "dbg", "attempt to add with overflow", 2600, 300],
        ["label", "rel-p", "0", 500],
        ["pulse", "rel-p", 500],
        ["pose", "rel", "happy", 0, 500],
      ],
    },
    {
      line: 3,
      say: "<p>A debug panic stops the program. A release build keeps going with the wrong number. Pick the method that says what you mean, such as <code>checked_add</code>.</p>",
    },
  ],
});

/* Shape sorter (chapter 03). Each pebble is a value written as a literal, each
   slot a type. The program builds when the literal fits the type. */
function sortProgram(slot, lit) {
  return "fn main() {\n    let v: " + slot + " = " + lit + ";\n    println!(\"{v}\");\n}";
}

window.OX_CH03_SORT = [
  { pebble: "42", slot: "i32", check: "ok", stdout: "42", rust: sortProgram("i32", "42") },
  { pebble: "42", slot: "f64", check: "E0308", code: "E0308", why: "42 is a whole number. An f64 needs a decimal point, such as 42.0.", rust: sortProgram("f64", "42") },
  { pebble: "42", slot: "bool", check: "E0308", code: "E0308", why: "42 is a number, not a bool. A bool holds only true or false.", rust: sortProgram("bool", "42") },
  { pebble: "42", slot: "char", check: "E0308", code: "E0308", why: "42 is a number. A char is one character in single quotes, such as 'Z'.", rust: sortProgram("char", "42") },
  { pebble: "42", slot: "u8", check: "ok", stdout: "42", rust: sortProgram("u8", "42") },

  { pebble: "3.14", slot: "i32", check: "E0308", code: "E0308", why: "3.14 has a decimal part. An i32 holds whole numbers only.", rust: sortProgram("i32", "3.14") },
  { pebble: "3.14", slot: "f64", check: "ok", stdout: "3.14", rust: sortProgram("f64", "3.14") },
  { pebble: "3.14", slot: "bool", check: "E0308", code: "E0308", why: "3.14 is a float, not a bool. A bool holds only true or false.", rust: sortProgram("bool", "3.14") },
  { pebble: "3.14", slot: "char", check: "E0308", code: "E0308", why: "3.14 is a number. A char is one character in single quotes, such as 'Z'.", rust: sortProgram("char", "3.14") },
  { pebble: "3.14", slot: "u8", check: "E0308", code: "E0308", why: "3.14 has a decimal part. A u8 holds whole numbers from 0 to 255.", rust: sortProgram("u8", "3.14") },

  { pebble: "true", slot: "i32", check: "E0308", code: "E0308", why: "true is a bool, and a bool is not a number.", rust: sortProgram("i32", "true") },
  { pebble: "true", slot: "f64", check: "E0308", code: "E0308", why: "true is a bool, not a number, so it cannot be an f64.", rust: sortProgram("f64", "true") },
  { pebble: "true", slot: "bool", check: "ok", stdout: "true", rust: sortProgram("bool", "true") },
  { pebble: "true", slot: "char", check: "E0308", code: "E0308", why: "true is a bool. A char is one character in single quotes, such as 'Z'.", rust: sortProgram("char", "true") },
  { pebble: "true", slot: "u8", check: "E0308", code: "E0308", why: "true is a bool, not a number from 0 to 255.", rust: sortProgram("u8", "true") },

  { pebble: "é", slot: "i32", check: "E0308", code: "E0308", why: "é is a char, not a number.", rust: sortProgram("i32", "'é'") },
  { pebble: "é", slot: "f64", check: "E0308", code: "E0308", why: "é is a char, not a number.", rust: sortProgram("f64", "'é'") },
  { pebble: "é", slot: "bool", check: "E0308", code: "E0308", why: "é is a char. A bool holds only true or false.", rust: sortProgram("bool", "'é'") },
  { pebble: "é", slot: "char", check: "ok", stdout: "é", rust: sortProgram("char", "'é'") },
  { pebble: "é", slot: "u8", check: "E0308", code: "E0308", why: "é is a char, not a number. A u8 holds numbers from 0 to 255.", rust: sortProgram("u8", "'é'") },

  { pebble: "300", slot: "i32", check: "ok", stdout: "300", rust: sortProgram("i32", "300") },
  { pebble: "300", slot: "f64", check: "E0308", code: "E0308", why: "300 is a whole number. An f64 needs a decimal point, such as 300.0.", rust: sortProgram("f64", "300") },
  { pebble: "300", slot: "bool", check: "E0308", code: "E0308", why: "300 is a number, not a bool.", rust: sortProgram("bool", "300") },
  { pebble: "300", slot: "char", check: "E0308", code: "E0308", why: "300 is a number. A char is one character in single quotes, such as 'Z'.", rust: sortProgram("char", "300") },
  { pebble: "300", slot: "u8", check: "error", code: "", why: "300 doesn't fit in a u8: 0 to 255.", rust: sortProgram("u8", "300") },

  { pebble: "-1", slot: "i32", check: "ok", stdout: "-1", rust: sortProgram("i32", "-1") },
  { pebble: "-1", slot: "f64", check: "E0308", code: "E0308", why: "-1 is a whole number. An f64 needs a decimal point, such as -1.0.", rust: sortProgram("f64", "-1") },
  { pebble: "-1", slot: "bool", check: "E0308", code: "E0308", why: "-1 is a number, not a bool.", rust: sortProgram("bool", "-1") },
  { pebble: "-1", slot: "char", check: "E0600", code: "E0600", why: "-1 is a number. A char is one character in single quotes, such as 'Z'.", rust: sortProgram("char", "-1") },
  { pebble: "-1", slot: "u8", check: "E0600", code: "E0600", why: "-1 doesn't fit in a u8: 0 to 255, and a u8 has no negatives.", rust: sortProgram("u8", "-1") },

  { pebble: "255", slot: "i32", check: "ok", stdout: "255", rust: sortProgram("i32", "255") },
  { pebble: "255", slot: "f64", check: "E0308", code: "E0308", why: "255 is a whole number. An f64 needs a decimal point, such as 255.0.", rust: sortProgram("f64", "255") },
  { pebble: "255", slot: "bool", check: "E0308", code: "E0308", why: "255 is a number, not a bool.", rust: sortProgram("bool", "255") },
  { pebble: "255", slot: "char", check: "E0308", code: "E0308", why: "255 is a number. A char is one character in single quotes, such as 'Z'.", rust: sortProgram("char", "255") },
  { pebble: "255", slot: "u8", check: "ok", stdout: "255", rust: sortProgram("u8", "255") },

  { pebble: "Z", slot: "i32", check: "E0308", code: "E0308", why: "'Z' is a char, not a number.", rust: sortProgram("i32", "'Z'") },
  { pebble: "Z", slot: "f64", check: "E0308", code: "E0308", why: "'Z' is a char, not a number.", rust: sortProgram("f64", "'Z'") },
  { pebble: "Z", slot: "bool", check: "E0308", code: "E0308", why: "'Z' is a char. A bool holds only true or false.", rust: sortProgram("bool", "'Z'") },
  { pebble: "Z", slot: "char", check: "ok", stdout: "Z", rust: sortProgram("char", "'Z'") },
  { pebble: "Z", slot: "u8", check: "E0308", code: "E0308", why: "'Z' is a char, not a number. A u8 holds numbers from 0 to 255.", rust: sortProgram("u8", "'Z'") },
];
