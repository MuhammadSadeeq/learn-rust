/* Motion explainers and interaction data for Chapter 06: One Owner. Each rust
   field and each OX_CH06_LEASH program is compiled by tools/check-snippets.mjs,
   and the error check and stdout are verified there. */
(window.OX_MOTION = window.OX_MOTION || []).push({
  id: "ch06-scope",
  title: "Drop runs at the closing brace",
  w: 640,
  h: 300,
  rust: `fn main() {
    {
        let s = String::from("hi");
        println!("{s}");
    }
    println!("after the block");
}`,
  check: "ok",
  stdout: "hi\nafter the block",
  actors: [
    { id: "block", box: true, x: 220, y: 150, w: 360, h: 230, label: "block" },
    { id: "s", cast: "crab", x: 110, y: 150, size: 84, label: "s", hidden: true },
    { id: "f", cast: "fluffy", x: 260, y: 150, size: 84, label: "String", hidden: true },
  ],
  beats: [
    {
      line: 3,
      say: "<p><code>let s = String::from(...)</code> makes crab <b>s</b> the owner. Its leash runs to the fluffy on the heap.</p>",
      do: [
        ["pop", "s", 0],
        ["pop", "f", 250],
        ["link", "lk", "s", "f", "own", 600],
      ],
    },
    {
      line: 4,
      say: "<p><code>println!</code> reads <code>s</code> while the block is still open.</p>",
      do: [["pose", "s", "talk", 1000, 0]],
    },
    {
      line: 5,
      ask: {
        q: "The block reaches its <code>}</code>. What happens to the fluffy?",
        choices: ["It stays on the heap until the whole program ends", "It is dropped right here, at the brace"],
        answer: 1,
        explain: "<code>s</code> owns the fluffy, and <code>s</code> goes out of scope at the brace. Its drop frees the bytes.",
      },
      say: "<p>The <code>}</code> ends the block. <code>s</code> waves, walks out of the block, and its scope ends there.</p>",
      do: [
        ["pose", "s", "happy", 900, 0],
        ["move", "s", { x: 520, y: 150 }, 700, 900],
        ["fade", "s", 0, 400, 1500],
      ],
    },
    {
      line: 5,
      say: "<p>The drop frees the fluffy, and its leash goes with it. The bytes are handed back, not wiped. Drop runs at a line you can point to: the <code>}</code> on line 5.</p>",
      do: [
        ["poof", "f", 0],
        ["unlink", "lk", 0],
      ],
    },
  ],
});

(window.OX_MOTION = window.OX_MOTION || []).push({
  id: "ch06-fn-move",
  title: "Passing a String moves it",
  w: 640,
  h: 300,
  rust: `fn takes(s: String) {
    println!("{s}");
}

fn main() {
    let s = String::from("hi");
    takes(s);
}`,
  check: "ok",
  stdout: "hi",
  actors: [
    { id: "main", box: true, x: 110, y: 150, w: 190, h: 250, label: "main", cls: "is-stack" },
    { id: "tp", box: true, x: 300, y: 150, w: 150, h: 210, label: "takes()" },
    { id: "heap", box: true, x: 530, y: 150, w: 200, h: 250, label: "Heap", cls: "is-heap" },
    { id: "s", cast: "crab", x: 110, y: 120, size: 84, label: "s", hidden: true },
    { id: "p", cast: "crab", x: 110, y: 120, size: 80, label: "s", hidden: true },
    { id: "f", cast: "fluffy", x: 530, y: 150, size: 90, label: "String", hidden: true },
  ],
  beats: [
    {
      line: 6,
      say: "<p><code>String::from</code> makes a fluffy on the heap. Crab <b>s</b> owns it, and its leash is the only one.</p>",
      do: [
        ["pop", "s", 0],
        ["pop", "f", 200],
        ["link", "lk", "s", "f", "own", 500],
      ],
    },
    {
      line: 7,
      ask: {
        q: "After <code>takes(s)</code>, can <code>main</code> still use <code>s</code>?",
        choices: ["Yes, the function gave it back", "No, s was moved into takes"],
        answer: 1,
        explain: "Passing <code>s</code> by value moves it. <code>takes</code> owns the String now, and drops it when <code>takes</code> returns.",
      },
      say: "<p><code>takes(s)</code> moves the String: the leash passes to the parameter, a new crab inside the function. The caller's crab turns grey.</p>",
      do: [
        ["unlink", "lk", 0],
        ["pop", "p", 0],
        ["arc", "p", { x: 300, y: 135 }, 700, 250, 60],
        ["link", "lk", "p", "f", "own", 1100],
        ["kind", "s", "ghost", 1100],
      ],
    },
    {
      line: 2,
      say: "<p>Inside <code>takes</code>, the parameter <code>s</code> owns the String and can read it. This is the only leash.</p>",
      do: [["pose", "p", "talk", 900, 0]],
    },
    {
      line: 3,
      say: "<p>The function's <code>}</code> drops its parameter. The String is freed, and the caller's crab is a ghost with nothing left to use.</p>",
      do: [
        ["poof", "f", 0],
        ["unlink", "lk", 0],
        ["fade", "p", 0, 350, 200],
      ],
    },
    {
      line: 7,
      rust: `fn takes(s: &String) {
    println!("{s}");
}

fn main() {
    let s = String::from("hi");
    takes(&s);
}`,
      check: "ok",
      say: "<p>Preview for Chapter 7. <code>takes(&amp;s)</code> lends the String instead: a shared borrow, seen through glasses. The leash stays with the caller, and nothing moves.</p>",
      do: [
        ["pop", "f", 0],
        ["kind", "s", "", 0],
        ["link", "lk", "s", "f", "own", 300],
        ["pop", "p", 0],
        ["art", "p", { cast: "crab", opts: { gear: ["glasses"] } }, 0],
        ["kind", "p", "ref", 0],
        ["link", "lk2", "p", "f", "ref", 400],
      ],
    },
  ],
});

(window.OX_CH06_LEASH = window.OX_CH06_LEASH || []).push(
  {
    id: "ok",
    name: "Without the bad line",
    rust: `fn consume(s: String) {
    println!("consumed {s}");
}

fn main() {
    let a = String::from("hi");
    let b = a;
    let c = b.clone();
    consume(b);
    println!("{c}");
}`,
    check: "ok",
    stdout: "consumed hi\nhi",
  },
  {
    id: "bad",
    name: "With the bad line",
    rust: `fn consume(s: String) {
    println!("consumed {s}");
}

fn main() {
    let a = String::from("hi");
    let b = a;
    let c = b.clone();
    consume(b);
    println!("{c}");
    println!("{b}");
}`,
    check: "E0382",
  },
);
