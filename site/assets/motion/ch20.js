/* Chapter 20 motion explainers: a request body poured into the Mold.
   The code panel is std-only so the checker can compile it. serde's derive
   is described in the captions and shown in the chapter's own blocks. */
(window.OX_MOTION = window.OX_MOTION || []).push({
  id: "ch20-extract",
  title: "The Mold reads the parcel",
  w: 640,
  h: 300,
  rust: [
    "// The Mold: the shape of the JSON body. serde fills each field",
    "// from the key with the same name.",
    "struct CreateNote {",
    "    title: String,",
    "    body: String,",
    "    pinned: bool,",
    "}",
    "",
    "fn main() {",
    "    let note = CreateNote {",
    '        title: String::from("Learn axum"),',
    "        body: String::new(),",
    "        pinned: false,",
    "    };",
    '    println!("{} {:?} {}", note.title, note.body, note.pinned);',
    "}",
  ].join("\n"),
  check: "ok",
  stdout: 'Learn axum "" false',
  actors: [
    { id: "postie", cast: "postie", x: 70, y: 215, size: 96, label: "Postie" },
    { id: "parcel", prop: "parcel", opts: { label: "POST" }, x: 160, y: 190, size: 84 },
    {
      id: "mold",
      cast: "mold",
      opts: { name: "CreateNote", fields: ["title: String", "body: String", "pinned: bool"] },
      x: 460,
      y: 150,
      size: 220,
    },
    { id: "jt", text: '"title": "Learn axum"', x: 150, y: 70, hidden: true },
    { id: "jb", text: '"body": ""', x: 150, y: 100, hidden: true },
    { id: "jc", text: '"color": "red"', x: 150, y: 130, hidden: true },
    { id: "msg", text: "unknown field `color`", x: 460, y: 268, hidden: true },
  ],
  beats: [
    {
      say: "<p>A client sends <code>POST /api/notes</code> with a JSON body. Postie carries the request parcel to the handler.</p>",
      line: 3,
      do: [
        ["pose", "postie", "talk", 1200, 0],
        ["show", "jt", 400],
        ["show", "jb", 600],
      ],
    },
    {
      say: "<p>The parcel opens. The body is read with serde, and each key is poured into the field with the same name.</p>",
      line: 11,
      do: [
        ["poof", "parcel", 0],
        ["move", "jt", { x: 460, y: 139 }, 700, 300],
        ["move", "jb", { x: 460, y: 168 }, 700, 700],
        ["pose", "mold", "happy", 1400, 1200],
      ],
    },
    {
      say: "<p>serde skips <code>color</code>, because no field has that name. The Mold ignores it, and the note is created.</p>",
      line: 3,
      ask: {
        q: "The body also has a key named color. What does the default CreateNote do with it?",
        choices: [
          "It ignores color, and the note is created",
          "It rejects the request with 422",
        ],
        answer: 0,
        explain: "serde reads only the keys that a field names. Anything else is skipped, unless you ask it not to.",
      },
      do: [
        ["show", "jc", 0],
        ["fade", "jc", 0.35, 400, 600],
        ["pose", "mold", "happy", 1200, 400],
      ],
    },
    {
      say: "<p>Add <code>#[serde(deny_unknown_fields)]</code> to the struct. Now the Mold refuses <code>color</code>, and the parcel comes back.</p>",
      line: 3,
      do: [
        ["fade", "jc", 1, 300, 0],
        ["cls", "jc", "is-refused", true, 300],
        ["shake", "mold", 300],
        ["pose", "mold", "ouch", 1200, 300],
        ["move", "parcel", { x: 460, y: 235 }, 0, 0],
        ["show", "parcel", 900],
        ["art", "parcel", { prop: "parcel", opts: { label: "422" } }, 900],
        ["arc", "parcel", { x: 160, y: 190 }, 800, 1300, 60],
        ["pose", "postie", "oops", 1400, 1400],
      ],
    },
    {
      say: "<p>The parcel goes back as <b>422 Unprocessable Entity</b>. The error names the key: <code>unknown field `color`</code>. The handler never runs.</p>",
      line: 3,
      do: [
        ["show", "msg", 200],
        ["pulse", "jc", 200],
      ],
    },
  ],
});
