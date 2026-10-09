/* Memory X-Ray scenarios for Chapter 12 — Collections */
(window.OX_XRAY = window.OX_XRAY || []).push(
  {
    id: "vec-grow",
    title: "A Vec grows by moving to a bigger buffer",
    check: "ok",
    code: `
fn main() {
    let mut v: Vec<i32> = Vec::new();
    v.push(10);
    v.push(20);
    v.push(30);
    v.push(40);
    v.push(50);
    println!("{}", v.len());
}`,
    steps: [
      { line: 1, say: "<p>A frame for <code>main</code>. Its variables are fixed in size, so the frame is sized when the program is compiled.</p>", ops: [["frame", "main"]] },
      { line: 2, say: "<p><code>Vec::new()</code> allocates nothing. On the stack, <code>v</code> is three numbers: a pointer, a length of 0 and a capacity of 0. There is no heap block yet.</p>", ops: [["let", "v", "Vec<i32>", { meta: { len: 0, cap: 0 } }, { mut: true }]] },
      { line: 3, say: "<p>The first push asks the allocator for a buffer. In Rust 1.97 an <code>i32</code> vector gets room for four elements on its first push. That number is an implementation detail, so do not build code that depends on it.</p>", ops: [["alloc", "h1", ["10"], 4, { label: "Vec<i32> buffer" }], ["set", "v", { ptr: "h1", meta: { len: 1, cap: 4 } }]] },
      { line: 4, say: "<p>The second push writes into a free slot. Nothing is allocated, because the buffer still has room.</p>", ops: [["heap", "h1", ["10", "20"]], ["set", "v", { ptr: "h1", meta: { len: 2, cap: 4 } }]] },
      { line: 5, say: "<p>The third push takes the next slot. One free slot is left.</p>", ops: [["heap", "h1", ["10", "20", "30"]], ["set", "v", { ptr: "h1", meta: { len: 3, cap: 4 } }]] },
      { line: 6, say: "<p>The fourth push fills the last slot. Four elements, four slots, no free space.</p>", ops: [["heap", "h1", ["10", "20", "30", "40"]], ["set", "v", { ptr: "h1", meta: { len: 4, cap: 4 } }]] },
      {
        line: 7,
        ask: {
          q: "The fifth push finds the buffer full. What does Rust do?",
          choices: [
            "Writes past the end of the buffer, into the memory next to it.",
            "Allocates a bigger buffer, copies the four values over, and frees the old buffer.",
            "Returns an error, because a Vec has a fixed size.",
            "Overwrites the first element to make room."
          ],
          answer: 1,
          explain: "A Vec grows by moving its elements to a new buffer. The old buffer is freed as soon as the copy is finished."
        },
        say: "<p>A new buffer with room for eight is allocated. The four values are copied in, the fifth is written after them, and the old buffer is freed. The pointer in <code>v</code> now points at the new buffer. Here the capacity doubles from 4 to 8, which is typical, but the exact rule is not a promise.</p>",
        ops: [["realloc", "h1", "h2", ["10", "20", "30", "40", "50"], 8], ["set", "v", { ptr: "h2", meta: { len: 5, cap: 8 } }]]
      },
      { line: 8, say: "<p><code>len()</code> counts the elements in use: 5. The capacity, 8, is the room that is left over, and the program does not print it.</p>", ops: [["out", "5"]] },
      { line: 9, say: "<p>The closing brace drops <code>v</code>. Its one buffer is freed, by its one owner. Every element here is an <code>i32</code>, so nothing else needs freeing. With <code>String</code> elements, dropping the Vec would drop each of them too.</p>", ops: [["drop", "v"], ["pop"]] }
    ]
  }
);
