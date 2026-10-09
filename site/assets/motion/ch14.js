/* Chapter 14 (Traits and generics): the badge door and the Press stamping
   plates. The rust fields are compiled by tools/check-snippets.mjs. */
(window.OX_MOTION = window.OX_MOTION || []).push({
  id: "ch14-badges",
  title: "Only badged crabs pass the door",
  w: 640,
  h: 300,
  rust: `trait Summary {
    fn summarize(&self) -> String;
}

struct Post {
    title: String,
}

struct Note {
    text: String,
}

impl Summary for Post {
    fn summarize(&self) -> String {
        format!("post: {}", self.title)
    }
}

fn notify(item: &impl Summary) {
    println!("{}", item.summarize());
}

fn main() {
    let post = Post { title: "hello".to_string() };
    notify(&post);
    let note = Note { text: "hi".to_string() };
    notify(&note);
}`,
  check: "E0277",
  actors: [
    { id: "door", prop: "door", opts: { label: "notify" }, x: 340, y: 160, size: 90 },
    { id: "post", cast: "crab", x: 80, y: 120, size: 90, label: "Post", hidden: true },
    { id: "note", cast: "crab", x: 80, y: 230, size: 90, label: "Note", hidden: true },
    { id: "badge", prop: "badge", opts: { label: "Summary" }, x: 80, y: 40, size: 56, hidden: true },
    { id: "forge", cast: "forge", x: 560, y: 180, size: 100, pose: "sleep" },
    { id: "err", prop: "errscroll", opts: { label: "E0277" }, x: 560, y: 180, size: 96, z: 5, hidden: true },
  ],
  beats: [
    {
      say: "<p><code>notify</code> is a door. It takes any <code>&amp;impl Summary</code>, so only a type with a <code>Summary</code> badge gets through.</p>",
      line: 19,
      do: [["pop", "post", 0], ["pop", "note", 300]],
    },
    {
      say: "<p><code>impl Summary for Post</code> gives Post the badge. Note has no impl, so it has no badge.</p>",
      line: 13,
      do: [["pop", "badge", 0], ["pulse", "post", 400]],
    },
    {
      say: "<p><code>notify(&amp;post)</code>: Post wears the badge, so the door opens and lets it through.</p>",
      line: 25,
      do: [
        ["art", "door", { prop: "door", opts: { label: "notify", open: true } }, 0],
        ["move", "post", { x: 340, y: 120 }, 600],
        ["move", "badge", { x: 340, y: 40 }, 600],
        ["hide", "post", 650],
        ["hide", "badge", 650],
      ],
    },
    {
      say: "<p>Next comes <code>notify(&amp;note)</code>. Note has no <code>Summary</code> badge.</p>",
      line: 27,
      ask: {
        q: "Can <code>notify(&amp;note)</code> let Note through?",
        choices: ["Yes, every crab passes", "No, Note has no Summary impl"],
        answer: 1,
        explain: "The check happens at the call, before anything runs. Note doesn't implement Summary, so the door refuses it.",
      },
      do: [
        ["move", "note", { x: 250, y: 230 }, 600],
        ["pose", "forge", "think", 1200, 200],
      ],
    },
    {
      say: "<p>The Forge checks the call before anything runs, and hands back an error scroll: E0277, <code>Note: Summary</code> is not satisfied. Note never gets through.</p>",
      line: 27,
      do: [
        ["pose", "forge", "oops", 900],
        ["pop", "err", 0],
        ["arc", "err", { x: 250, y: 150 }, 700, 250, 40],
        ["shake", "note", 700],
      ],
    },
  ],
});

(window.OX_MOTION = window.OX_MOTION || []).push({
  id: "ch14-stamp",
  title: "The Press stamps one plate per type",
  w: 640,
  h: 300,
  rust: `fn largest<T: PartialOrd + Copy>(list: &[T]) -> T {
    let mut largest = list[0];
    for &item in list {
        if item > largest {
            largest = item;
        }
    }
    largest
}

fn main() {
    let ints = [34, 50, 25, 100, 65];
    let floats = [1.5, 0.2, 9.75];
    println!("{}", largest::<i32>(&ints));
    println!("{}", largest::<f64>(&floats));
}`,
  check: "ok",
  stdout: "100\n9.75",
  actors: [
    { id: "press", cast: "press", x: 150, y: 150, size: 130 },
    { id: "tmpl", text: "largest<T>", x: 150, y: 262 },
    { id: "p32", prop: "ingot", opts: { label: "i32" }, x: 430, y: 85, size: 150, label: "largest::<i32>", hidden: true },
    { id: "p64", prop: "ingot", opts: { label: "f64" }, x: 430, y: 215, size: 150, label: "largest::<f64>", hidden: true },
  ],
  beats: [
    {
      say: "<p><code>largest&lt;T&gt;</code> is one template. Nothing is stamped yet, because nothing has called it.</p>",
      line: 1,
      do: [["pose", "press", "think", 1200]],
    },
    {
      say: "<p><code>largest::&lt;i32&gt;</code> makes the Press stamp one plate for <code>i32</code>. The stamp is made when the program is built.</p>",
      line: 14,
      do: [["pose", "press", "stamp", 700], ["pop", "p32", 350]],
    },
    {
      say: "<p><code>largest::&lt;f64&gt;</code> stamps a second plate from the same template, for <code>f64</code>.</p>",
      line: 15,
      do: [["pose", "press", "stamp", 700], ["pop", "p64", 350]],
    },
    {
      say: "<p>Each call goes straight to its plate. No lookup happens at runtime, and the program prints 100 and 9.75.</p>",
      line: 15,
      do: [["pulse", "p32", 0], ["pulse", "p64", 250]],
    },
  ],
});
