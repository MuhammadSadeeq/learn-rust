/* Chapter 10 · Enums and match: motion scenes.
   ch10-arms: Octo catches each variant with its own arm. A new variant with
   no arm is refused at build time (E0004).
   ch10-option: an Option is a box that may be empty; open it before use.
   Both programs compile: the snippet checker runs the rust fields. */
(window.OX_MOTION = window.OX_MOTION || []).push({
  id: "ch10-arms",
  title: "Octo catches each variant",
  w: 640,
  h: 300,
  rust: `enum Message {
    Quit,
    Move { x: i32, y: i32 },
    Write(String),
    Color(u8, u8, u8),
}

fn handle(msg: &Message) -> &'static str {
    match msg {
        Message::Quit => "quit",
        Message::Move { .. } => "move",
        Message::Write(_) => "write",
        Message::Color(..) => "color",
    }
}

fn main() {
    let inbox = [
        Message::Quit,
        Message::Move { x: 3, y: -1 },
        Message::Write(String::from("hi")),
        Message::Color(230, 40, 40),
    ];
    for msg in &inbox {
        println!("{}", handle(msg));
    }
}`,
  check: "ok",
  stdout: "quit\nmove\nwrite\ncolor",
  actors: [
    { id: "oxi", cast: "oxi", x: 60, y: 252, size: 76 },
    { id: "octo", cast: "octo", opts: { arms: ["Quit", "Move", "Write", ""] }, x: 320, y: 118, size: 300 },
    { id: "tk_quit", prop: "ticket", opts: { label: "Quit" }, x: 70, y: 120, size: 84, hidden: true },
    { id: "tk_move", prop: "ticket", opts: { label: "Move" }, x: 70, y: 120, size: 84, hidden: true },
    { id: "tk_write", prop: "ticket", opts: { label: "Write" }, x: 70, y: 120, size: 84, hidden: true },
    { id: "tk_color", prop: "ticket", opts: { label: "Color" }, x: 70, y: 120, size: 84, hidden: true },
    { id: "forge", cast: "forge", x: 560, y: 226, size: 110, pose: "sleep" },
    { id: "err", prop: "errscroll", opts: { label: "E0004" }, x: 560, y: 110, size: 96, hidden: true },
  ],
  beats: [
    {
      say: "<p><code>match</code> is Octo, with one arm per variant. The empty slot is waiting for an arm.</p>",
      line: 9,
      do: [["pose", "oxi", "talk", 1200]],
    },
    {
      say: "<p>A <code>Quit</code> value lands on the Quit arm, and Octo catches it.</p>",
      line: 10,
      do: [
        ["show", "tk_quit", 0],
        ["arc", "tk_quit", { x: 216, y: 176, scale: 1 }, 600, 0, 40],
        ["poof", "tk_quit", 650],
        ["pose", "octo", "catch", 900, 600],
      ],
    },
    {
      say: "<p><code>Move</code> and <code>Write</code> are caught the same way, each by its own arm.</p>",
      line: 11,
      do: [
        ["show", "tk_move", 0],
        ["arc", "tk_move", { x: 286, y: 176, scale: 1 }, 600, 0, 40],
        ["poof", "tk_move", 650],
        ["pose", "octo", "catch", 900, 600],
        ["show", "tk_write", 1100],
        ["arc", "tk_write", { x: 355, y: 176, scale: 1 }, 600, 1100, 40],
        ["poof", "tk_write", 1750],
        ["pose", "octo", "catch", 900, 1700],
      ],
    },
    {
      say: "<p>The enum gets a <code>Color</code> variant. Octo's empty slot has no arm for it, so the value bounces off.</p>",
      line: 9,
      do: [
        ["show", "tk_color", 0],
        ["arc", "tk_color", { x: 423, y: 176, scale: 1 }, 600, 0, 40],
        ["arc", "tk_color", { x: 70, y: 120, scale: 1 }, 600, 700, 40],
        ["hide", "tk_color", 1300],
        ["pose", "octo", "think"],
      ],
      ask: {
        q: "PHP 8.5's match has no arm for Color either. What does it do when a Color value reaches it?",
        choices: ["Refuses to load the file, because PHP checks every arm first", "Throws UnhandledMatchError at runtime"],
        answer: 1,
        explain: "PHP finds the gap only when a Color reaches the match. Rust checks the match before the program exists.",
      },
    },
    {
      say: "<p>Rust does not wait for a Color to arrive. The Forge refuses the build with <b>E0004</b>, because the match does not cover <code>Color</code>.</p>",
      line: 9,
      do: [
        ["pose", "forge", "chomp", 700, 0],
        ["pose", "forge", "oops", 1400, 800],
        ["pose", "oxi", "oops", 1400, 800],
        ["pop", "err", 800],
      ],
    },
    {
      say: "<p>Write the <code>Color</code> arm, and the match covers every variant again. The Forge is happy.</p>",
      line: 13,
      do: [
        ["art", "octo", { cast: "octo", opts: { arms: ["Quit", "Move", "Write", "Color"] } }],
        ["poof", "err", 0],
        ["pose", "forge", "happy", 1400, 300],
        ["pose", "oxi", "happy", 1400, 300],
        ["show", "tk_color", 500],
        ["arc", "tk_color", { x: 423, y: 176, scale: 1 }, 600, 500, 40],
        ["poof", "tk_color", 1150],
        ["pose", "octo", "catch", 900, 1100],
      ],
    },
  ],
});

(window.OX_MOTION = window.OX_MOTION || []).push({
  id: "ch10-option",
  title: "An Option is a box that may be empty",
  w: 640,
  h: 300,
  rust: `fn main() {
    let some: Option<String> = Some(String::from("Ana"));
    let none: Option<String> = None;

    if let Some(name) = some {
        println!("hello {name}");
    }
    match none {
        Some(name) => println!("hello {name}"),
        None => println!("hello guest"),
    }
}`,
  check: "ok",
  stdout: "hello Ana\nhello guest",
  actors: [
    { id: "oxi", cast: "oxi", x: 60, y: 252, size: 76 },
    { id: "sbox", box: true, x: 160, y: 100, w: 200, h: 110, label: "Some(String)" },
    { id: "fl", cast: "fluffy", x: 160, y: 112, size: 80, label: "Ana" },
    { id: "nbox", box: true, x: 460, y: 100, w: 200, h: 110, label: "None" },
    { id: "nt", text: "nothing inside", x: 460, y: 108 },
    { id: "forge", cast: "forge", x: 520, y: 226, size: 104, pose: "sleep" },
    { id: "bad", prop: "scroll", opts: { label: "bad.rs" }, x: 150, y: 236, size: 96, hidden: true },
    { id: "err", prop: "errscroll", opts: { label: "E0308" }, x: 380, y: 236, size: 96, hidden: true },
    { id: "ingot", prop: "ingot", opts: { label: "hello" }, x: 380, y: 236, size: 100, hidden: true },
  ],
  beats: [
    {
      say: "<p><code>Option&lt;String&gt;</code> is a box that may be empty. <code>Some</code> holds the String, and <code>None</code> holds nothing.</p>",
      line: 2,
      do: [["pose", "oxi", "talk", 1200]],
    },
    {
      say: "<p>That line does not compile. The Forge stops it with <b>E0308</b>: it expected a <code>String</code> and found an <code>Option</code>.</p>",
      line: 2,
      do: [
        ["show", "bad", 0],
        ["arc", "bad", { x: 470, y: 236, scale: 0.4 }, 700, 0, 40],
        ["poof", "bad", 700],
        ["pose", "forge", "chomp", 600, 600],
        ["pose", "forge", "oops", 1400, 1200],
        ["pose", "oxi", "oops", 1400, 1200],
        ["pop", "err", 1300],
      ],
      ask: {
        q: "Can you use the String inside <code>some</code> without opening the box? For example: <code>let name: String = some;</code>",
        choices: ["Yes. The box is see-through", "No. It has to be opened first"],
        answer: 1,
        explain: "<code>Option&lt;String&gt;</code> is not a <code>String</code>. The type says so, and the Forge checks it before the program runs.",
      },
    },
    {
      say: "<p>Open the box first. <code>if let Some(name) = some</code> takes the String out, and the Forge is happy with this version.</p>",
      line: 5,
      do: [
        ["poof", "err", 0],
        ["pop", "ingot", 300],
        ["pulse", "sbox", 0],
        ["pose", "forge", "happy", 1400, 300],
        ["pose", "oxi", "happy", 1400, 300],
      ],
    },
    {
      say: "<p>The <code>None</code> arm covers the empty box, so every case is handled. The compiler checks that too.</p>",
      line: 10,
      do: [
        ["pulse", "nbox", 0],
        ["say", "nbox", "<code>hello guest</code>", 1600, 300],
      ],
    },
  ],
});
