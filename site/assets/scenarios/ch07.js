/* Memory X-Ray scenarios and Lifetime Timelines for Chapter 07 — Borrowing */
(window.OX_XRAY = window.OX_XRAY || []).push(
  {
    id: "borrow-len",
    title: "len(&s) lends s and gets it back untouched",
    code: `
fn main() {
    let s = String::from("hello");
    let n = len(&s);
    println!("{s} has {n} bytes");
}

fn len(s: &String) -> usize {
    s.len()
}`,
    steps: [
      { line: 1, say: `<p>Calling <code>main</code> pushes its <strong>stack frame</strong>.</p>`, ops: [["frame", "main"]] },
      { line: 2, say: `<p><code>String::from</code> copies <code>hello</code> into five heap bytes. <code>s</code> is their <span class="c-own">owner</span>.</p>`, ops: [["alloc", "h1", "hello", 5, { label: "String bytes" }], ["let", "s", "String", { ptr: "h1", meta: { len: 5, cap: 5 } }]] },
      { line: 3, say: `<p><code>&amp;s</code> is a reference. Calling <code>len</code> pushes a frame, and its parameter is also called <code>s</code>. The <span class="c-ref">blue</span> arrow points at <code>main</code>'s <code>s</code>, not at the heap. The parameter has its own id, so the two names never clash.</p>`, ops: [["frame", "len"], ["let", "s", "&String", { ref: "s" }, { id: "s_len", frame: "len" }]] },
      { line: 8, say: `<p><code>s.len()</code> reads the length through the reference. The bytes are not copied and not moved.</p>` },
      {
        line: 9,
        ask: {
          q: "<code>len</code> returns, and its parameter <code>s</code> disappears. Is the String freed?",
          choices: [
            "Yes. The parameter went out of scope, so the String it points to is dropped.",
            "No. The parameter only borrowed the String. <code>main</code>'s <code>s</code> is still its owner."
          ],
          answer: 1,
          explain: "A reference never owns what it points to, so dropping it frees nothing."
        },
        say: `<p>The frame for <code>len</code> is popped. Its parameter is gone, and the heap bytes stay with <code>main</code>'s <code>s</code>. Nothing was freed.</p>`,
        ops: [["drop", "s_len"], ["pop"]]
      },
      { line: 3, say: `<p>Back in <code>main</code>, <code>len</code> returned <code>5</code>. That number is copied into <code>n</code>.</p>`, ops: [["let", "n", "usize", "5"]] },
      { line: 4, say: `<p><code>s</code> is still valid, so both values print.</p>`, ops: [["out", "hello has 5 bytes"]] },
      { line: 5, say: `<p>The closing brace of <code>main</code> drops <code>n</code>, then <code>s</code>. <code>s</code> owns the heap bytes, so they are freed here.</p>`, ops: [["drop", "n"], ["drop", "s"], ["pop"]] }
    ]
  },
  {
    id: "mut-borrow",
    title: "&mut lets one writer in and shuts everyone else out",
    check: "E0502",
    code: `
fn main() {
    let mut v = vec![1, 2];
    let m = &mut v;
    println!("{v:?}");
    m.push(3);
}`,
    steps: [
      { line: 1, say: `<p>A frame for <code>main</code>.</p>`, ops: [["frame", "main"]] },
      { line: 2, say: `<p><code>v</code> owns a heap buffer with two numbers. It is declared <code>mut</code>, so it may change later.</p>`, ops: [["alloc", "h1", [1, 2], 2, { label: "Vec buffer" }], ["let", "v", "Vec<i32>", { ptr: "h1", meta: { len: 2, cap: 2 } }, { mut: true }]] },
      { line: 3, say: `<p><code>&amp;mut v</code> creates a mutable borrow. <code>m</code> is the one key to the editing room. The <span class="c-mut">magenta</span> arrow shows that <code>m</code> can change <code>v</code>.</p>`, ops: [["let", "m", "&mut Vec<i32>", { mut: "v" }]] },
      {
        line: 4,
        error: true,
        ask: {
          q: "<code>m</code> is still used on line 5. Can <code>main</code> read <code>v</code> on line 4?",
          choices: [
            "Yes. Reading never conflicts with anything.",
            "No. While <code>m</code> is alive, nothing else may even look at <code>v</code>.",
            "Yes, because <code>println!</code> only copies the number inside."
          ],
          answer: 1,
          explain: "A <code>&amp;mut</code> is exclusive. A second path to <code>v</code> could see half-finished changes."
        },
        say: `<p><strong>error[E0502]: cannot borrow <code>v</code> as immutable because it is also borrowed as mutable</strong></p><p>The <code>println!</code> needs <code>&amp;v</code> on line 4, while <code>m</code> still holds its exclusive borrow until line 5.</p>`,
        ops: [["err", "v"]]
      },
      { line: 5, say: `<p>The rule covers the whole life of <code>m</code>: from line 3 to its last use on line 5. Any read of <code>v</code> inside that span is rejected.</p>` }
    ]
  },
  {
    id: "invalidate",
    title: "Why push can't run while first is alive",
    check: "E0502",
    code: `
fn main() {
    let mut v = vec![1, 2, 3];
    let first = &v[0];
    v.push(4);
    println!("{first}");
}`,
    steps: [
      { line: 1, say: `<p>A frame for <code>main</code>.</p>`, ops: [["frame", "main"]] },
      { line: 2, say: `<p><code>vec![1, 2, 3]</code> allocates a buffer with room for exactly three numbers. The buffer is full.</p>`, ops: [["alloc", "h1", [1, 2, 3], 3, { label: "Vec buffer" }], ["let", "v", "Vec<i32>", { ptr: "h1", meta: { len: 3, cap: 3 } }, { mut: true }]] },
      { line: 3, say: `<p><code>&amp;v[0]</code> borrows the first element. The arrow points into the buffer, at slot 0. It does not point at <code>v</code>.</p>`, ops: [["let", "first", "&i32", { ref: "h1", at: 0 }]] },
      {
        line: 4,
        ask: {
          q: "The buffer is full. If Rust let <code>push</code> run, what would happen to <code>first</code>?",
          choices: [
            "Nothing. <code>first</code> still points at element 0.",
            "The push needs a bigger buffer. The numbers are copied there and the old buffer is freed, so <code>first</code> would point at freed memory.",
            "The push writes 4 into spare room, and <code>first</code> sees the new number."
          ],
          answer: 1,
          explain: "Growing a <code>Vec</code> moves its elements. Any reference into the old buffer would dangle."
        },
        say: `<p><code>v.push(4)</code> needs a fourth slot, and the buffer has none. The question is what happens to <code>first</code>.</p>`
      },
      {
        line: 4,
        error: true,
        say: `<p>If the push were allowed, the buffer would move to a new place (here, six slots). <code>first</code> would still point at the old one, which is now freed, so its arrow has nowhere to go.</p><p><strong>error[E0502]: cannot borrow <code>v</code> as mutable because it is also borrowed as immutable</strong></p><p>Rust refuses the push while <code>first</code> is alive.</p>`,
        ops: [["realloc", "h1", "h2", [1, 2, 3, 4], 6], ["err", "first"]]
      },
      { line: 5, say: `<p><code>println!</code> still needs <code>first</code>, so <code>first</code> has to stay valid until this line. That is why the push is rejected.</p>` }
    ]
  }
);

(window.OX_TIMELINES = window.OX_TIMELINES || []).push(
  {
    id: "nll-ok",
    title: "The borrow ends at its last use",
    check: "ok",
    code: `
fn main() {
    let mut s = String::from("hi");
    let r = &s;
    println!("{r}");
    s.push('!');
    println!("{s}");
}`,
    vars: [
      { name: "s", kind: "own", from: 2, to: 7 },
      { name: "r", kind: "ref", from: 3, to: 4, label: "&s" },
      { name: "push", kind: "mut", from: 5, to: 5, label: "&mut s" }
    ],
    marks: [
      { var: "r", line: 3, text: "borrow" },
      { var: "r", line: 4, text: "last use" }
    ],
    steps: [
      { line: 2, say: `<p><code>s</code> owns the String. Nothing borrows it yet.</p>` },
      { line: 3, say: `<p><code>let r = &amp;s</code> starts a shared borrow. The <span class="c-ref">r</span> bar starts here, and it has to last until <code>r</code> is used for the last time.</p>` },
      { line: 4, say: `<p>This line is the last use of <code>r</code>, so its bar ends here. <code>r</code> is still in scope, but no borrow is alive any more.</p>` },
      { line: 5, say: `<p><code>s.push('!')</code> needs a temporary <code>&amp;mut s</code>. No borrow is alive on this line, so it is allowed.</p>` },
      { line: 6, say: `<p>Reading <code>s</code> is fine, and nothing conflicts with it.</p>` },
      { line: 7, say: `<p>The owner's scope ends here, and <code>s</code> is dropped.</p>` }
    ]
  },
  {
    id: "nll-bad",
    title: "Use r after the push, and the borrow must survive it",
    check: "E0502",
    code: `
fn main() {
    let mut s = String::from("hi");
    let r = &s;
    s.push('!');
    println!("{r}");
    println!("{s}");
}`,
    vars: [
      { name: "s", kind: "own", from: 2, to: 7 },
      { name: "r", kind: "ref", from: 3, to: 5, label: "&s", bad: [4] },
      { name: "push", kind: "mut", from: 4, to: 4, label: "&mut s", bad: [4] }
    ],
    marks: [
      { var: "r", line: 3, text: "borrow" },
      { var: "r", line: 5, text: "last use" },
      { var: "push", line: 4, text: "clash", bad: true }
    ],
    steps: [
      { line: 2, say: `<p><code>s</code> owns the String.</p>` },
      { line: 3, say: `<p><code>let r = &amp;s</code> starts a shared borrow. It has to stay valid until its last use.</p>` },
      { line: 4, error: true, say: `<p><strong>error[E0502]: cannot borrow <code>s</code> as mutable because it is also borrowed as immutable</strong></p><p>The push needs <code>&amp;mut s</code> on line 4, but <code>r</code> is still alive, because line 5 uses it. The red stripes mark the clash.</p>` },
      { line: 5, say: `<p>The use on line 5 is what keeps <code>r</code> alive through line 4. Move that use above the push, and the clash disappears.</p>` },
      { line: 6, say: `<p><code>r</code> has no later use, so its bar has ended. Reading <code>s</code> here is fine.</p>` },
      { line: 7, say: `<p>The owner's scope ends here, and <code>s</code> is dropped.</p>` }
    ]
  }
);
