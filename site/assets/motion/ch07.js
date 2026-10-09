/* Chapter 07 (Borrowing) motion: many readers or one writer.
   Scene ch07-readers-writer. The rust field is the program as written. Line 8
   reads the readers after the lock on line 6, so rustc rejects it with E0502
   (checked by tools/check-snippets.mjs). The last beat is the fix: move line 8
   above line 6, so the readers finish first. */
(function () {
  "use strict";
  const LOOK = { cast: "crab", opts: { gear: ["glasses"] } };   // glasses: a shared borrow
  const PLAIN = { cast: "crab", opts: {} };
  const READERS = ["r1", "r2", "r3"];

  // Each reader: appears, puts on its glasses, and links to v as a shared borrow.
  const readerOps = READERS.flatMap((r, i) => {
    const d = i * 250;
    return [
      ["pop", r, d],
      ["art", r, LOOK, d + 350],
      ["kind", r, "ref", d + 350],
      ["link", r, r, "v", "ref", d + 700],
    ];
  });
  // The readers finish: glasses off, borrows end.
  const readersDone = READERS.flatMap((r) => [
    ["unlink", r, 0],
    ["art", r, PLAIN, 0],
    ["kind", r, "", 0],
  ]);

  (window.OX_MOTION = window.OX_MOTION || []).push({
    id: "ch07-readers-writer",
    title: "Many readers or one writer",
    w: 640,
    h: 300,
    rust: [
      "fn main() {",
      "    let mut v = vec![1, 2, 3];",
      "    let r1 = &v;",
      "    let r2 = &v;",
      "    let r3 = &v;",
      "    let w = &mut v;",
      "    w.push(4);",
      '    println!("{r1:?} {r2:?} {r3:?}");',
      "}",
    ].join("\n"),
    check: "E0502",
    actors: [
      { id: "v", cast: "fluffy", x: 500, y: 150, size: 130, label: "v" },
      { id: "r1", cast: "crab", x: 110, y: 78, size: 72, label: "r1", hidden: true },
      { id: "r2", cast: "crab", x: 110, y: 150, size: 72, label: "r2", hidden: true },
      { id: "r3", cast: "crab", x: 110, y: 222, size: 72, label: "r3", hidden: true },
      { id: "w", cast: "crab", x: 300, y: 80, size: 76, label: "w", hidden: true },
      { id: "lock", prop: "borrows", x: 500, y: 36, size: 84, hidden: true },
      { id: "ins", cast: "inspector", x: 300, y: 232, size: 92, hidden: true },
    ],
    beats: [
      {
        say: "<p>Three crabs put on glasses to look at <code>v</code>. Any number of readers may look at once.</p>",
        line: 3,
        do: readerOps,
      },
      {
        say: "<p><code>w</code> asks for the lock on line 6, while the readers still look at <code>v</code>.</p>",
        line: 6,
        ask: {
          q: "Can w take the lock on line 6 while the readers are still used?",
          choices: ["Yes, the readers are done with v", "No, the readers are still used on line 8"],
          answer: 1,
          explain: "A &amp;mut borrow can't exist while a shared borrow is still used later. Line 8 still reads the readers.",
        },
        do: [
          ["pop", "lock", 0],
          ["pop", "w", 200],
          ["kind", "w", "mutref", 200],
          ["link", "w", "w", "v", "mut", 500],
        ],
      },
      {
        say: "<p>The Inspector stamps <b>E0502</b> on <code>w</code>. Line 8 still reads the readers, so the lock is refused.</p>",
        line: 8,
        do: [
          ["pop", "ins", 0],
          ["say", "ins", "<b>E0502</b>", 2000, 350],
          ["label", "w", "E0502", 200],
          ["unlink", "w", 200],
          ["link", "w2", "w", "v", "bad", 500],
          ["pose", "w", "oops", 0, 500],
          ["shake", "w", 700],
        ],
      },
      {
        say: "<p>Move line 8 above line 6, so the readers finish first. Their glasses come off, and the lock is allowed.</p>",
        line: 8,
        do: [
          ["poof", "ins", 0],
          ["unlink", "w2", 0],
          ["label", "w", "w", 0],
          ...readersDone,
          ["link", "w3", "w", "v", "mut", 400],
          ["pose", "w", "happy", 1400, 500],
          ["confetti", "w", 500],
        ],
      },
    ],
  });
})();
