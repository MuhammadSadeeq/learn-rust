/* Memory X-Ray scenarios and timelines for Chapter 08 — Strings & Slices */
(window.OX_XRAY = window.OX_XRAY || []).push(
  {
    id: "str-literal-vs-string",
    title: "A literal, an owned String and a view",
    code: `
fn main() {
    let lit = "hi";
    let owned = String::from("hi");
    let view: &str = &owned;
    println!("{lit} {owned} {view}");
}`,
    steps: [
      { line: 1, say: "<p>A frame for <code>main</code>. Three variables are about to hold text, and each holds it in a different way.</p>", ops: [["frame", "main"]] },
      { line: 2, say: "<p><code>\"hi\"</code> is a literal. Its two bytes are compiled into the program, in read-only memory, so the heap is not involved. <code>lit</code> holds a pointer to them and a length. That is a <code>&amp;'static str</code>.</p>", ops: [["alloc", "bin", "hi", 2, { label: "in the binary, not the heap" }], ["let", "lit", "&'static str", { ref: "bin", meta: { len: 2 } }]] },
      { line: 3, say: "<p><code>String::from(\"hi\")</code> asks the allocator for two heap bytes and copies the text in. <code>owned</code> is the <span class=\"c-own\">owner</span>: pointer, length 2, capacity 2.</p>", ops: [["alloc", "h2", "hi", 2, { label: "String bytes" }], ["let", "owned", "String", { ptr: "h2", meta: { len: 2, cap: 2 } }]] },
      {
        line: 4,
        ask: {
          q: "<code>view</code> is made from <code>&amp;owned</code>. What does it point at?",
          choices: [
            "A new copy of the bytes, made inside the binary.",
            "The heap bytes that <code>owned</code> owns. Nothing is copied.",
            "The variable <code>owned</code> on the stack."
          ],
          answer: 1,
          explain: "A <code>&amp;str</code> is a view. It needs no copy, so it points at the bytes that already exist."
        },
        say: "<p><code>view</code> is a <span class=\"c-ref\">shared borrow</span> of the heap bytes. The conversion from <code>&amp;String</code> to <code>&amp;str</code> happens at compile time: no bytes are copied and no new owner appears.</p>",
        ops: [["let", "view", "&str", { ref: "h2", meta: { len: 2 } }]]
      },
      { line: 5, say: "<p>Printing reads the bytes through each name. All three show <code>hi</code>. Only <code>owned</code> may free the heap buffer.</p>", ops: [["out", "hi hi hi"]] },
      { line: 6, say: "<p>End of <code>main</code>, in reverse order: the view frees nothing, then <code>owned</code> frees its heap bytes. The literal's bytes were never on the heap, so they stay where the program put them.</p>", ops: [["drop", "view"], ["drop", "owned"], ["drop", "lit"], ["pop"]] }
    ]
  },
  {
    id: "slice-window",
    title: "Two &str slices into one String",
    code: `
fn main() {
    let s = String::from("hello world");
    let hello = &s[0..5];
    let world = &s[6..11];
    println!("{hello}|{world}");
}`,
    steps: [
      { line: 1, say: "<p>A frame for <code>main</code>.</p>", ops: [["frame", "main"]] },
      { line: 2, say: "<p><code>s</code> owns 11 heap bytes: pointer, length 11, capacity 11. Every character here is ASCII, so one character is exactly one byte. (Section 4 shows what happens when that stops being true.)</p>", ops: [["alloc", "h1", "hello world", 11, { label: "s's bytes" }], ["let", "s", "String", { ptr: "h1", meta: { len: 11, cap: 11 } }]] },
      { line: 3, say: "<p><code>hello</code> is a <code>&amp;str</code>: a pointer to byte 0 of <code>s</code>'s buffer and a length of 5. No bytes were copied. There is no capacity field, because a view can't grow.</p>", ops: [["let", "hello", "&str", { ref: "h1", at: 0, meta: { len: 5 } }]] },
      {
        line: 4,
        ask: {
          q: "How many bytes does <code>world</code> copy?",
          choices: [
            "About 5 bytes. It makes a new copy of <code>\"world\"</code>.",
            "None. It points at byte 6 of <code>s</code>'s buffer and stores only a length.",
            "All 11 bytes of <code>s</code>, because a slice has to hold its whole owner."
          ],
          answer: 1,
          explain: "A slice is a pointer and a length. The bytes stay where they are."
        },
        say: "<p><code>world</code> points at byte 6, the <code>w</code>, with a length of 5. Both slices are <span class=\"c-ref\">shared borrows</span> of <code>s</code>. Two views into one buffer, and neither one copies anything.</p>",
        ops: [["let", "world", "&str", { ref: "h1", at: 6, meta: { len: 5 } }]]
      },
      { line: 5, say: "<p>Printing a <code>&amp;str</code> reads <code>len</code> bytes from its pointer. That is all a string slice is.</p>", ops: [["out", "hello|world"]] },
      { line: 6, say: "<p>End of <code>main</code>. The slices go first and free nothing. Then the owner <code>s</code> frees the buffer: one allocation, one free, and two views that cost nothing.</p>", ops: [["drop", "world"], ["drop", "hello"], ["drop", "s"], ["pop"]] }
    ]
  },
  {
    id: "slice-vec",
    title: "&[T]: a slice of a Vec",
    code: `
fn main() {
    let v = vec![10, 20, 30, 40];
    let mid: &[i32] = &v[1..3];
    println!("{mid:?} has {} items", mid.len());
}`,
    steps: [
      { line: 1, say: "<p>A frame for <code>main</code>.</p>", ops: [["frame", "main"]] },
      { line: 2, say: "<p><code>v</code> owns a heap buffer of four <code>i32</code>s (16 bytes). Like a <code>String</code>, the <code>Vec</code> itself is pointer, length and capacity.</p>", ops: [["alloc", "h1", ["10", "20", "30", "40"], 4, { label: "Vec buffer: 4 × i32" }], ["let", "v", "Vec<i32>", { ptr: "h1", meta: { len: 4, cap: 4 } }]] },
      {
        line: 3,
        ask: {
          q: "What does <code>mid</code> hold?",
          choices: ["A new <code>Vec</code> containing 20 and 30.", "A pointer to the <code>20</code> inside <code>v</code>'s buffer, plus the length 2.", "The numbers 20 and 30, copied onto the stack."],
          answer: 1,
          explain: "Same shape as <code>&amp;str</code>: pointer plus length."
        },
        say: "<p><code>&amp;v[1..3]</code> has type <code>&amp;[i32]</code>, a slice of <code>i32</code>s. It points at element 1 and records a length of 2. For <code>&amp;[T]</code> the length counts <em>elements</em>; for <code>&amp;str</code> it counts bytes.</p>",
        ops: [["let", "mid", "&[i32]", { ref: "h1", at: 1, meta: { len: 2 } }]]
      },
      { line: 4, say: "<p><code>mid.len()</code> reads the length stored in the slice itself. No counting needed.</p>", ops: [["out", "[20, 30] has 2 items"]] },
      { line: 5, say: "<p><code>mid</code> disappears without freeing anything, then <code>v</code> frees its buffer.</p>", ops: [["drop", "mid"], ["drop", "v"], ["pop"]] }
    ]
  },
  {
    id: "plus-moves",
    title: "s1 + &s2 reuses s1's buffer",
    code: `
fn main() {
    let s1 = String::from("tic");
    let s2 = String::from("-tac");
    let s3 = s1 + &s2;
    println!("{s3} {s2}");
}`,
    steps: [
      { line: 1, say: "<p>A frame for <code>main</code>.</p>", ops: [["frame", "main"]] },
      { line: 2, say: "<p><code>s1</code> owns 3 bytes, with capacity 3.</p>", ops: [["alloc", "h1", "tic", 3, { label: "s1's bytes" }], ["let", "s1", "String", { ptr: "h1", meta: { len: 3, cap: 3 } }]] },
      { line: 3, say: "<p><code>s2</code> owns 4 bytes of its own.</p>", ops: [["alloc", "h2", "-tac", 4, { label: "s2's bytes" }], ["let", "s2", "String", { ptr: "h2", meta: { len: 4, cap: 4 } }]] },
      {
        line: 4,
        ask: {
          q: "<code>+</code> on strings calls <code>fn add(self, s: &amp;str) -&gt; String</code>. What happens here?",
          choices: [
            "A brand-new buffer is allocated for <code>\"tic-tac\"</code>; <code>s1</code> and <code>s2</code> stay usable.",
            "<code>s1</code> is moved into <code>add</code>, its buffer grows to fit a copy of <code>s2</code>'s bytes, and that same String comes back as <code>s3</code>. <code>s2</code> is only borrowed.",
            "Both <code>s1</code> and <code>s2</code> are moved into <code>s3</code>."
          ],
          answer: 1,
          explain: "<code>self</code> by value means the left side is moved in."
        },
        say: "<p><code>add</code> takes <code>s1</code> by value and appends a copy of <code>s2</code>'s bytes. The buffer holds 3 bytes and needs 7, so it grows to capacity 8 (the allocator may move it while doing so). The result is returned as <code>s3</code>. <code>s1</code> is <span class=\"c-ghost\">moved</span>; <code>s2</code> was only borrowed for the call.</p>",
        ops: [["realloc", "h1", "h3", "tic-tac", 8], ["label", "h3", "s3's bytes (were s1's)"], ["move", "s1", "s3"], ["set", "s3", { ptr: "h3", meta: { len: 7, cap: 8 } }]]
      },
      { line: 5, say: "<p><code>s2</code> is still valid, so it prints. Writing <code>{s1}</code> here would be error E0382, borrow of moved value.</p>", ops: [["out", "tic-tac -tac"]] },
      { line: 6, say: "<p>End of <code>main</code>: <code>s3</code> frees the grown buffer, <code>s2</code> frees its own, and <code>s1</code> was moved, so it frees nothing. Two allocations, two frees.</p>", ops: [["drop", "s3"], ["drop", "s2"], ["drop", "s1"], ["pop"]] }
    ]
  }
);

(window.OX_TIMELINES = window.OX_TIMELINES || []).push({
  id: "first-word-clear",
  title: "A slice keeps its borrow alive",
  check: "E0502",
  code: `
fn first_word(s: &str) -> &str {
    let end = s.find(' ').unwrap_or(s.len());
    &s[..end]
}

fn main() {
    let mut s = String::from("hello world");
    let word = first_word(&s);
    s.clear();
    println!("first word: {word}");
}`,
  vars: [
    { name: "s", kind: "own", from: 7, to: 11 },
    { name: "word", kind: "ref", from: 8, to: 10, label: "&str into s" },
    { name: "clear", kind: "mut", from: 9, to: 9, label: "&mut s", bad: [9] }
  ],
  marks: [
    { var: "s", line: 7, text: "owner" },
    { var: "word", line: 8, text: "borrow" },
    { var: "word", line: 10, text: "last use" },
    { var: "clear", line: 9, text: "conflict", bad: true }
  ],
  steps: [
    { line: 1, say: "One <code>&amp;str</code> goes in, one <code>&amp;str</code> comes out. The compiler concludes that the result borrows from the argument." },
    { line: 7, say: "<code>s</code> owns the text <code>\"hello world\"</code>." },
    { line: 8, say: "<code>word</code> is a slice of <code>s</code>'s bytes, so it is a shared borrow of <code>s</code>. It stays alive until its last use on line 10." },
    { line: 9, error: true, say: "error[E0502]: <code>s.clear()</code> needs <code>&amp;mut s</code>, but <code>word</code> is still reading <code>s</code>. Many readers or one writer, never both." },
    { line: 10, say: "This is the use that keeps <code>word</code> alive. Move the <code>println!</code> above <code>s.clear()</code> and the borrow ends in time." }
  ]
});
