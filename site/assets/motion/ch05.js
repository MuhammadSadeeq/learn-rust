/* Motion explainers and interaction data for Chapter 05: Memory. Each rust
   field and each OX_CH05_PUSH program is compiled and run by
   tools/check-snippets.mjs, and its stdout must match. The capacities the
   Push the Vec widget shows are read from the program output below, so they
   are the ones rustc 1.97 prints for Vec<i32>. */
(window.OX_MOTION = window.OX_MOTION || []).push({
  id: "ch05-grow",
  title: "A Vec moves to a bigger plot (realloc)",
  w: 640,
  h: 300,
  rust: `fn main() {
    let mut v = vec![1, 2, 3, 4];
    v.push(5);
    println!("{v:?}");
}`,
  check: "ok",
  stdout: "[1, 2, 3, 4, 5]",
  actors: [
    { id: "stack", box: true, x: 110, y: 150, w: 190, h: 250, label: "Stack", cls: "is-stack" },
    { id: "heap", box: true, x: 430, y: 150, w: 400, h: 250, label: "Heap", cls: "is-heap" },
    { id: "plotA", box: true, x: 330, y: 95, w: 186, h: 62, label: "4 slots", cls: "is-plot" },
    { id: "plotB", box: true, x: 500, y: 212, w: 262, h: 70, label: "8 slots", cls: "is-plot" },
    { id: "v", cast: "crab", x: 110, y: 120, size: 84, label: "v", hidden: true },
    { id: "alloc", cast: "alloc", x: 280, y: 245, size: 72, label: "Alloc" },
    { id: "f1", cast: "fluffy", x: 275, y: 95, size: 30, label: "1", hidden: true },
    { id: "f2", cast: "fluffy", x: 313, y: 95, size: 30, label: "2", hidden: true },
    { id: "f3", cast: "fluffy", x: 351, y: 95, size: 30, label: "3", hidden: true },
    { id: "f4", cast: "fluffy", x: 389, y: 95, size: 30, label: "4", hidden: true },
    { id: "f5", cast: "fluffy", x: 518, y: 212, size: 28, label: "5", hidden: true },
  ],
  beats: [
    {
      line: 2,
      say: "<p><code>vec![1, 2, 3, 4]</code> asks Alloc, the allocator, for a plot with four slots. Alloc hands it to <code>v</code>, with fluffies 1 to 4 in it.</p>",
      do: [
        ["pose", "alloc", "talk", 1000, 0],
        ["cls", "plotA", "is-shown", true, 0],
        ["pop", "f1", 250],
        ["pop", "f2", 400],
        ["pop", "f3", 550],
        ["pop", "f4", 700],
        ["pop", "v", 0],
        ["link", "lv", "v", "plotA", "own", 900],
      ],
    },
    {
      line: 3,
      ask: {
        q: "You take a reference to <code>v[0]</code>, then call <code>push(5)</code>. Is that reference still valid afterwards?",
        choices: ["Yes, the fluffies never moved", "No, it would point at the old plot"],
        answer: 1,
        explain: "<code>push(5)</code> can move the whole buffer to a bigger plot and free the old one. A reference into the old plot would then point at freed memory, so the compiler refuses that program.",
      },
      say: "<p>The plot is full. Alloc fetches a bigger plot with room for eight and carries the four fluffies across. This is a realloc, and it happens when the block cannot grow where it sits.</p>",
      do: [
        ["cls", "plotB", "is-shown", true, 0],
        ["pose", "alloc", "wow", 900, 0],
        ["arc", "f1", { x: 390, y: 212 }, 800, 0, 60],
        ["arc", "f2", { x: 422, y: 212 }, 800, 200, 60],
        ["arc", "f3", { x: 454, y: 212 }, 800, 400, 60],
        ["arc", "f4", { x: 486, y: 212 }, 800, 600, 60],
        ["cls", "plotA", "is-shown", false, 1100],
        ["link", "lv", "v", "plotB", "own", 1200],
        ["pop", "f5", 1500],
      ],
    },
    {
      line: 3,
      say: "<p>The old plot is freed, and its bytes are not wiped. A reference taken before the push would still hold the old address, which now points at freed memory.</p>",
      do: [["pose", "v", "happy", 900, 0]],
    },
    {
      line: 3,
      say: "<p>Capacity is 8 now, so pushes six, seven and eight need no new plot. The ninth push grows it again.</p>",
      do: [["pulse", "plotB", 0]],
    },
  ],
});

(window.OX_CH05_PUSH = window.OX_CH05_PUSH || []).push(
  {
    id: "new",
    name: "Vec::new()",
    rust: `fn main() {
    let mut v: Vec<i32> = Vec::new();
    println!("0 {}", v.capacity());
    for n in 1..=12 {
        v.push(n);
        println!("{} {}", v.len(), v.capacity());
    }
}`,
    check: "ok",
    stdout: "0 0\n1 4\n2 4\n3 4\n4 4\n5 8\n6 8\n7 8\n8 8\n9 16\n10 16\n11 16\n12 16",
  },
  {
    id: "cap8",
    name: "Vec::with_capacity(8)",
    rust: `fn main() {
    let mut v: Vec<i32> = Vec::with_capacity(8);
    println!("0 {}", v.capacity());
    for n in 1..=12 {
        v.push(n);
        println!("{} {}", v.len(), v.capacity());
    }
}`,
    check: "ok",
    stdout: "0 8\n1 8\n2 8\n3 8\n4 8\n5 8\n6 8\n7 8\n8 8\n9 16\n10 16\n11 16\n12 16",
  },
);
