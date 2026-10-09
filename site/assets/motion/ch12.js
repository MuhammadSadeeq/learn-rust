/* Chapter 12 · Collections: motion scene and the data for the Bouncer's door.
   ch12-door: the Bouncer lets each name into a HashSet once. insert returns
   true for a new value and false for a value already in the set.
   OX_CH12_DOOR: the programs behind the interactive door. The checker
   compiles them and runs their stdout. */
(window.OX_MOTION = window.OX_MOTION || []).push({
  id: "ch12-door",
  title: "The Bouncer lets each name in once",
  w: 640,
  h: 300,
  rust: `use std::collections::HashSet;

fn main() {
    let mut guests = HashSet::new();
    println!("{}", guests.insert("ana"));
    println!("{}", guests.insert("bo"));
    println!("{}", guests.insert("ana"));
}`,
  check: "ok",
  stdout: "true\ntrue\nfalse",
  actors: [
    { id: "oxi", cast: "oxi", x: 60, y: 252, size: 76 },
    { id: "bouncer", cast: "bouncer", x: 230, y: 150, size: 100 },
    { id: "door", prop: "door", opts: { label: "set" }, x: 300, y: 150, size: 70 },
    { id: "room", box: true, x: 470, y: 150, w: 280, h: 200, label: "HashSet" },
    { id: "ana1", cast: "crab", x: 60, y: 150, size: 70, label: "ana", hidden: true },
    { id: "bo", cast: "crab", x: 60, y: 150, size: 70, label: "bo", hidden: true },
    { id: "ana2", cast: "crab", x: 60, y: 150, size: 70, label: "ana", hidden: true },
  ],
  beats: [
    {
      say: "<p>The Bouncer keeps a <code>HashSet</code>, a guest list where each name gets in once.</p>",
      line: 4,
      do: [
        ["pose", "bouncer", "talk", 1200],
        ["pose", "oxi", "talk", 1200],
      ],
    },
    {
      say: '<p><code>insert("ana")</code> returns <code>true</code>: Ana is new, so she gets in.</p>',
      line: 5,
      do: [
        ["show", "ana1", 0],
        ["arc", "ana1", { x: 400, y: 120, scale: 1 }, 800, 0, 90],
        ["pose", "bouncer", "happy", 1000, 700],
        ["say", "bouncer", "<code>true</code>", 1400, 700],
      ],
    },
    {
      say: '<p><code>insert("bo")</code> returns <code>true</code>. Bo is new as well.</p>',
      line: 6,
      do: [
        ["show", "bo", 0],
        ["arc", "bo", { x: 480, y: 120, scale: 1 }, 800, 0, 90],
        ["pose", "bouncer", "happy", 1000, 700],
        ["say", "bouncer", "<code>true</code>", 1400, 700],
      ],
    },
    {
      say: '<p><code>insert("ana")</code> returns <code>false</code>. The set already holds Ana, so the Bouncer turns her away.</p>',
      line: 7,
      do: [
        ["show", "ana2", 0],
        ["arc", "ana2", { x: 215, y: 205, scale: 1 }, 700, 0, 50],
        ["pose", "bouncer", "oops", 1400, 800],
        ["say", "bouncer", "<code>false</code>", 1600, 800],
        ["shake", "ana2", 1500],
        ["arc", "ana2", { x: 60, y: 150, scale: 1 }, 700, 1500, 40],
        ["hide", "ana2", 2300],
      ],
      ask: {
        q: 'Ana comes back. What does <code>insert("ana")</code> return this time?',
        choices: ["true. The set takes her again", "false. She is already in the set"],
        answer: 1,
        explain: "A set keeps each value once. <code>insert</code> returns <code>false</code> for a value it already holds, and the set does not change.",
      },
    },
    {
      say: "<p>The set still holds two names. <code>insert</code> returns <code>true</code> only for a value it has not seen.</p>",
      line: 7,
      do: [
        ["pulse", "room", 0],
        ["pose", "bouncer", "happy", 1000, 0],
      ],
    },
  ],
});

/* The Bouncer's door (ch12) depends on these. Each is compiled by the checker,
   and the interactive widget only shows what these programs print:
   insert returns true for a new value and false for a repeat, and contains
   reports whether a value is in the set. */
(window.OX_CH12_DOOR = window.OX_CH12_DOOR || []).push(
  {
    id: "door-insert",
    rust: `use std::collections::HashSet;

fn main() {
    let mut guests = HashSet::new();
    println!("{}", guests.insert("ana"));
    println!("{}", guests.insert("bo"));
    println!("{}", guests.insert("ana"));
}`,
    check: "ok",
    stdout: "true\ntrue\nfalse",
  },
  {
    id: "door-contains",
    rust: `use std::collections::HashSet;

fn main() {
    let mut guests: HashSet<&str> = HashSet::new();
    guests.insert("ana");
    guests.insert("bo");
    println!("{}", guests.contains("bo"));
    println!("{}", guests.contains("x"));
}`,
    check: "ok",
    stdout: "true\nfalse",
  }
);
