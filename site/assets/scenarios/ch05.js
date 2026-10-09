/* Memory X-Ray scenarios for Chapter 05: The Stack & The Heap */
(window.OX_XRAY = window.OX_XRAY || []).push(
  {
    id: "calls-stack",
    title: "Each call gets its own frame",
    code: `
fn main() {
    let w = 3;
    let h = 4;
    let total = area(w, h);
    println!("{total}");
}

fn area(w: u32, h: u32) -> u32 {
    let a = w * h;
    a
}`,
    steps: [
      { line: 1, say: `<p>Calling <code>main</code> pushes a <strong>stack frame</strong>: a block of memory for its local variables. Its size was fixed when the program was compiled.</p>`, ops: [["frame", "main"]] },
      { line: 2, say: `<p><code>w</code> is a <code>u32</code>: exactly four bytes, stored inside the frame. Nothing goes on the heap.</p>`, ops: [["let", "w", "u32", "3"]] },
      { line: 3, say: `<p><code>h</code> is the same kind of value: four more bytes in the frame.</p>`, ops: [["let", "h", "u32", "4"]] },
      { line: 4, say: `<p>Calling <code>area(w, h)</code> pushes a second frame on top. The arguments are <strong>copied</strong> into its parameters. A <code>u32</code> is Copy, so <code>main</code> keeps its own <code>w</code> and <code>h</code>.</p>`, ops: [["frame", "area"], ["copy", "w", "w", { id: "area.w", frame: "area" }], ["copy", "h", "h", { id: "area.h", frame: "area" }]] },
      { line: 9, say: `<p>Inside <code>area</code>, <code>a</code> is computed as 3 times 4, which is 12. It is a new variable in the top frame, next to the copies of <code>w</code> and <code>h</code>.</p>`, ops: [["let", "a", "u32", "12", { id: "area.a", frame: "area" }]] },
      { line: 10, say: `<p>The last expression is <code>a</code>, with no semicolon. Its value is what <code>area</code> hands back to its caller.</p>`, ops: [] },
      {
        line: 11,
        ask: {
          q: `<code>area</code> is about to return. Where is <code>a</code> afterwards?`,
          choices: [
            `Still in the same place, and <code>main</code> can read it through <code>a</code>.`,
            `Gone with its frame. Only a copy of its value, 12, is handed back to <code>main</code>.`,
            `Moved onto the heap, so it outlives the call.`
          ],
          answer: 1,
          explain: `A returned value is copied out, and the frame it came from is then popped. Everything in that frame goes with it.`
        },
        say: `<p>The value 12 is copied into <code>total</code> in <code>main</code>. Then the frame is popped, and <code>a</code>, <code>w</code> and <code>h</code> disappear. Giving the space back is just moving the stack pointer.</p>`,
        ops: [["copy", "area.a", "total", { frame: "main" }], ["pop"]]
      },
      { line: 5, say: `<p><code>println!</code> reads <code>total</code>, which holds 12. Both variables in <code>main</code> are still valid.</p>`, ops: [["out", "12"]] },
      { line: 6, say: `<p><code>main</code> ends, and its frame is popped. Nothing in this program lived on the heap, so there was nothing to free.</p>`, ops: [["pop"]] }
    ]
  },
  {
    id: "string-grow",
    title: "A String outgrows its buffer",
    code: `
fn main() {
    let mut s = String::with_capacity(4);
    s.push_str("hi");
    s.push_str("!!");
    s.push_str("?");
    println!("{s}");
}`,
    steps: [
      { line: 1, say: `<p>Calling <code>main</code> pushes its frame.</p>`, ops: [["frame", "main"]] },
      { line: 2, say: `<p><code>String::with_capacity(4)</code> asks the allocator for a block of <strong>4 bytes</strong>. The block is empty: length 0, capacity 4. The variable <code>s</code> on the stack holds the pointer, the length and the capacity.</p>`, ops: [["alloc", "h1", "", 4, { label: "String bytes" }], ["let", "s", "String", { ptr: "h1", meta: { len: 0, cap: 4 } }, { mut: true }]] },
      { line: 3, say: `<p><code>push_str("hi")</code> copies two bytes into the block. They fit, so nothing is reallocated. Length is 2, capacity is still 4.</p>`, ops: [["heap", "h1", "hi", 4], ["set", "s", { ptr: "h1", meta: { len: 2, cap: 4 } }]] },
      { line: 4, say: `<p>Two more bytes. The block is now full: 4 of 4.</p>`, ops: [["heap", "h1", "hi!!", 4], ["set", "s", { ptr: "h1", meta: { len: 4, cap: 4 } }]] },
      {
        line: 5,
        ask: {
          q: `The buffer is full. What happens on the next <code>push_str</code>?`,
          choices: [
            `The bytes are written past the end of the block.`,
            `The allocator gives a bigger block, the bytes are copied across, and the old block is freed.`,
            `The push is refused, and the String stays unchanged.`
          ],
          answer: 1,
          explain: `Growing is handled by the standard library. It is also the reason the address can change.`
        },
        say: `<p>The new text needs 5 bytes, and the block holds 4, so the allocator is asked to <strong>reallocate</strong>. This picture shows the case where it finds a bigger block, copies the bytes across and frees the old one. Exact growth amounts are an implementation detail. This time the capacity went from 4 to 8.</p>`,
        ops: [["realloc", "h1", "h2", "hi!!?", 8], ["heap", "h2", "hi!!?", 8], ["set", "s", { ptr: "h2", meta: { len: 5, cap: 8 } }]]
      },
      { line: 6, say: `<p><code>s</code> now points at the new block, and the text is intact.</p>`, ops: [["out", "hi!!?"]] },
      { line: 7, say: `<p>End of <code>main</code>. <code>s</code> owns the block it points to now, and that block is freed here. The old block was already freed during the push.</p>`, ops: [["drop", "s"], ["pop"]] }
    ]
  },
  {
    id: "vec-grow",
    title: "A Vec grows the same way",
    code: `
fn main() {
    let mut v: Vec<i32> = Vec::with_capacity(2);
    v.push(1);
    v.push(2);
    v.push(3);
    v.push(4);
    v.push(5);
    println!("{v:?}");
}`,
    steps: [
      { line: 1, say: `<p>Calling <code>main</code> pushes its frame.</p>`, ops: [["frame", "main"]] },
      { line: 2, say: `<p><code>Vec::with_capacity(2)</code> reserves room for two <code>i32</code> values on the heap: 8 bytes. The <code>Vec</code> on the stack has the same three-word shape as a <code>String</code>. Here the cells are elements, not bytes.</p>`, ops: [["alloc", "h1", [], 2, { label: "Vec<i32> elements" }], ["let", "v", "Vec<i32>", { ptr: "h1", meta: { len: 0, cap: 2 } }, { mut: true }]] },
      { line: 3, say: `<p><code>push(1)</code> writes the first element. Length 1, capacity 2.</p>`, ops: [["heap", "h1", [1], 2], ["set", "v", { ptr: "h1", meta: { len: 1, cap: 2 } }]] },
      { line: 4, say: `<p><code>push(2)</code> fills the buffer: 2 of 2.</p>`, ops: [["heap", "h1", [1, 2], 2], ["set", "v", { ptr: "h1", meta: { len: 2, cap: 2 } }]] },
      {
        line: 5,
        ask: {
          q: `The buffer is full. What does <code>push(3)</code> do?`,
          choices: [
            `Writes 3 past the end of the buffer.`,
            `Gets a bigger buffer, copies 1 and 2 across, and frees the old one.`,
            `Overwrites the first element with 3.`
          ],
          answer: 1,
          explain: `A Vec never writes past its capacity. It makes room first, and the room comes from a new block.`
        },
        say: `<p>The Vec needs room for three. The allocator returns a bigger buffer, with capacity 4 this time. The elements 1 and 2 are copied across, the old buffer is freed, and <code>v</code> is switched to the new pointer.</p>`,
        ops: [["realloc", "h1", "h2", [1, 2, 3], 4], ["heap", "h2", [1, 2, 3], 4], ["set", "v", { ptr: "h2", meta: { len: 3, cap: 4 } }]]
      },
      { line: 6, say: `<p><code>push(4)</code> fits in the new buffer. No allocation happens at all.</p>`, ops: [["heap", "h2", [1, 2, 3, 4], 4], ["set", "v", { ptr: "h2", meta: { len: 4, cap: 4 } }]] },
      { line: 7, say: `<p>Full again, and a fifth element is coming. The buffer grows a second time, to capacity 8. Five pushes caused two reallocations. A <code>with_capacity(5)</code> would have caused none.</p>`, ops: [["realloc", "h2", "h3", [1, 2, 3, 4, 5], 8], ["heap", "h3", [1, 2, 3, 4, 5], 8], ["set", "v", { ptr: "h3", meta: { len: 5, cap: 8 } }]] },
      { line: 8, say: `<p><code>println!</code> prints the elements. Their values and order did not change during the growth. Only their place in memory did.</p>`, ops: [["out", "[1, 2, 3, 4, 5]"]] },
      { line: 9, say: `<p>End of <code>main</code>. <code>v</code> frees the block it points to, which is the latest one, exactly once.</p>`, ops: [["drop", "v"], ["pop"]] }
    ]
  },
  {
    id: "box-basic",
    title: "A Box holds one value on the heap",
    code: `
fn main() {
    let b = Box::new(5);
    println!("{b}");
}`,
    steps: [
      { line: 1, say: `<p>Calling <code>main</code> pushes its frame.</p>`, ops: [["frame", "main"]] },
      {
        line: 2,
        ask: {
          q: `After <code>let b = Box::new(5);</code>, how many bytes does <code>b</code> itself take in <code>main</code>'s frame?`,
          choices: [
            `4, the size of the i32 inside.`,
            `8, a pointer to the heap.`,
            `24, the same as a String.`
          ],
          answer: 1,
          explain: `The 5 lives on the heap. The frame only needs room for the address of those bytes.`
        },
        say: `<p><code>Box::new(5)</code> asks the allocator for four bytes and stores the <code>i32</code> 5 there, lowest byte first: 5, 0, 0, 0. The variable <code>b</code> holds only the address of those bytes, which is a pointer. It takes 8 bytes on a 64-bit machine.</p>`,
        ops: [["alloc", "h1", [5, 0, 0, 0], 4, { label: "Box target: i32" }], ["let", "b", "Box<i32>", { ptr: "h1" }]]
      },
      { line: 3, say: `<p><code>println!</code> follows the pointer and prints <code>5</code>. Printing a <code>Box</code> looks just like printing the value inside it.</p>`, ops: [["out", "5"]] },
      {
        line: 4,
        ask: {
          q: `<code>b</code> goes out of scope at this brace. What happens to the 5 on the heap?`,
          choices: [
            `Nothing. It leaks until the program exits.`,
            `It is freed right here, because <code>b</code> owns it.`,
            `A garbage collector frees it some time later.`
          ],
          answer: 1,
          explain: `A Box has exactly one owner. When that owner's scope ends, the heap value is dropped.`
        },
        say: `<p>The compiler puts a drop for <code>b</code> at the closing brace. The four heap bytes are returned, and the pointer disappears with the frame. This is the ownership rule from Chapter 06, applied to one heap value.</p>`,
        ops: [["drop", "b"], ["pop"]]
      }
    ]
  }
);
