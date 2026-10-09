/* Memory X-Ray scenarios for Chapter 06 — One Owner */
(window.OX_XRAY = window.OX_XRAY || []).push(
  {
    id: "scope-drop",
    title: "A String lives and dies with its scope",
    code: `
fn main() {
    let n = 7;
    {
        let s = String::from("hi");
        println!("{s} {n}");
    }
    println!("{n}");
}`,
    steps: [
      { line: 1, say: "<p>Calling <code>main</code> pushes a <strong>stack frame</strong>: a block of memory for its local variables. Its size is computed at compile time.</p>", ops: [["frame", "main"]] },
      { line: 2, say: "<p><code>n</code> is an <code>i32</code>: exactly 4 bytes. It lives directly inside the frame. Nothing on the heap.</p>", ops: [["let", "n", "i32", "7"]] },
      { line: 4, say: "<p><code>String::from</code> asks the allocator for heap space and copies <code>\"hi\"</code> into it. The variable <code>s</code> on the stack holds three things: a <strong>pointer</strong> to the bytes, the <strong>length</strong>, and the <strong>capacity</strong>. <code>s</code> is now the <span class=\"c-own\">owner</span> of those heap bytes.</p>", ops: [["alloc", "h1", "hi", 2, { label: "String bytes" }], ["let", "s", "String", { ptr: "h1", meta: { len: 2, cap: 2 } }]] },
      { line: 5, say: "<p>Reading <code>s</code> and <code>n</code> is fine: both are alive and valid.</p>", ops: [["out", "hi 7"]] },
      {
        line: 6,
        ask: { q: "The inner block closes on this line. What happens to the heap bytes <code>\"hi\"</code>?", choices: ["Nothing yet. They are freed when <code>main</code> returns.", "They are freed right here, because their owner <code>s</code> goes out of scope.", "A garbage collector frees them at some later point.", "They leak until the process exits."], answer: 1, explain: "Scope end of the owner means drop, at a point you can see in the source." },
        say: "<p>At this <code>}</code> the compiler inserted a call to <code>drop(s)</code>. The heap bytes are returned to the allocator <em>right now</em>, at a line you can point to. No garbage collector, no reference counting, no <code>free()</code> written by you.</p>",
        ops: [["drop", "s"]]
      },
      { line: 7, say: "<p><code>n</code> is still alive: its scope is the whole of <code>main</code>.</p>", ops: [["out", "7"]] },
      { line: 8, say: "<p><code>main</code> ends. Its frame is popped and <code>n</code> disappears with it. An <code>i32</code> owns nothing on the heap, so there is nothing else to clean up.</p>", ops: [["drop", "n"], ["pop"]] }
    ]
  },
  {
    id: "move-error",
    title: "let b = a; moves a String",
    check: "E0382",
    code: `
fn main() {
    let a = String::from("hi");
    let b = a;
    println!("{a}");
}`,
    steps: [
      { line: 1, say: "<p>A fresh frame for <code>main</code>.</p>", ops: [["frame", "main"]] },
      { line: 2, say: "<p><code>a</code> owns two heap bytes. On the stack it is 24 bytes on a 64-bit machine: pointer, length, capacity.</p>", ops: [["alloc", "h1", "hi", 2, { label: "String bytes" }], ["let", "a", "String", { ptr: "h1", meta: { len: 2, cap: 2 } }]] },
      {
        line: 3,
        ask: {
          q: "What does <code>let b = a;</code> do here?",
          choices: [
            "Copies the heap bytes, so <code>a</code> and <code>b</code> each own their own <code>\"hi\"</code>.",
            "Copies pointer, length and capacity into <code>b</code>. <code>a</code> can no longer be used.",
            "Makes <code>b</code> a reference that points at <code>a</code>.",
            "Copies the pointer, and now both <code>a</code> and <code>b</code> own the same bytes."
          ],
          answer: 1,
          explain: "This is a <strong>move</strong>."
        },
        say: "<p>The 24 stack bytes are copied into <code>b</code>, and the heap is untouched. Two owners of one buffer would both free it at the end of <code>main</code>, which is a <em>double free</em>. Rust prevents that by declaring <code>a</code> <span class=\"c-ghost\">moved</span>. The ownership travelled to <code>b</code>.</p>",
        ops: [["move", "a", "b"]]
      },
      {
        line: 4,
        error: true,
        say: "<p><strong>error[E0382]: borrow of moved value: <code>a</code></strong></p><p>The compiler tracked the move and refuses to let you read a variable that no longer owns anything. This check happens at compile time. The program never runs, so it can never crash this way.</p>",
        ops: [["err", "a"]]
      }
    ]
  },
  {
    id: "clone-string",
    title: "clone() makes a second parcel",
    code: `
fn main() {
    let a = String::from("hi");
    let b = a.clone();
    println!("{a} {b}");
}`,
    steps: [
      { line: 1, say: "<p>Frame for <code>main</code>.</p>", ops: [["frame", "main"]] },
      { line: 2, say: "<p><code>a</code> owns <code>\"hi\"</code> on the heap.</p>", ops: [["alloc", "h1", "hi", 2, { label: "a's bytes" }], ["let", "a", "String", { ptr: "h1", meta: { len: 2, cap: 2 } }]] },
      {
        line: 3,
        ask: { q: "How many heap allocations exist after <code>a.clone()</code>?", choices: ["One. <code>clone</code> just shares it.", "Two. <code>clone</code> allocates new bytes and copies them.", "Zero. Strings live on the stack."], answer: 1, explain: "Clone is a deep copy. You can see the cost in the code." },
        say: "<p><code>clone()</code> allocates a <strong>new</strong> heap buffer and copies the bytes. <code>b</code> owns the new one, <code>a</code> still owns the old one. Two owners of two parcels, so no conflict.</p>",
        ops: [["clone", "a", "b", "h2"], ["label", "h2", "b's bytes"]]
      },
      { line: 4, say: "<p>Both are valid, so both can be printed.</p>", ops: [["out", "hi hi"]] },
      { line: 5, say: "<p>End of <code>main</code>. Locals are dropped in <strong>reverse order of declaration</strong>: <code>b</code> first, then <code>a</code>. Each frees its own buffer exactly once.</p>", ops: [["drop", "b"]] },
      { line: 5, say: "<p>…then <code>a</code>. Two allocations, two frees, zero leaks. The compiler worked this out before the program ran.</p>", ops: [["drop", "a"], ["pop"]] }
    ]
  },
  {
    id: "fn-move",
    title: "Passing a String into a function",
    code: `
fn main() {
    let s = String::from("hey");
    let len = consume(s);
    println!("{len}");
}

fn consume(text: String) -> usize {
    let n = text.len();
    n
}`,
    steps: [
      { line: 1, say: "<p>Frame for <code>main</code>.</p>", ops: [["frame", "main"]] },
      { line: 2, say: "<p><code>s</code> owns <code>\"hey\"</code>.</p>", ops: [["alloc", "h1", "hey", 3, { label: "String bytes" }], ["let", "s", "String", { ptr: "h1", meta: { len: 3, cap: 3 } }]] },
      {
        line: 3,
        ask: { q: "<code>consume</code> takes a parameter of type <code>String</code> (no <code>&amp;</code>). What happens to <code>s</code> when we call it?", choices: ["<code>s</code> is copied, so <code>main</code> keeps its own version.", "<code>s</code> is moved into the parameter <code>text</code>. <code>main</code> can't use <code>s</code> anymore.", "<code>consume</code> borrows <code>s</code> and gives it back automatically."], answer: 1, explain: "Passing a value works exactly like <code>let text = s;</code>." },
        say: "<p>A call pushes a new frame. Passing <code>s</code> by value is a move, exactly like <code>let text = s;</code>. The parameter <code>text</code> is the new owner.</p>",
        ops: [["frame", "consume"], ["move", "s", "text"]]
      },
      { line: 8, say: "<p><code>text.len()</code> reads the length field. <code>n</code> is a <code>usize</code>, a plain number on the stack.</p>", ops: [["let", "n", "usize", "3"]] },
      {
        line: 10,
        ask: { q: "<code>consume</code> returns. What happens to the heap bytes <code>\"hey\"</code>?", choices: ["They go back to <code>s</code> in <code>main</code>.", "They are freed: <code>text</code> owned them and its scope just ended.", "They stay allocated until <code>main</code> ends."], answer: 1, explain: "Ownership went in and never came out." },
        say: "<p><code>text</code> goes out of scope at the end of <code>consume</code>, so the heap bytes are dropped <em>here</em>. Only the number <code>n</code> travels back to the caller.</p>",
        ops: [["drop", "text"], ["drop", "n"], ["pop"], ["let", "len", "usize", "3"]]
      },
      { line: 4, say: "<p><code>len</code> is a copy of the returned number.</p>", ops: [["out", "3"]] },
      { line: 5, say: "<p>End of <code>main</code>. <code>s</code> was moved, so dropping it frees nothing. The compiler already knew that while compiling. There is no runtime check here.</p>", ops: [["drop", "len"], ["drop", "s"], ["pop"]] }
    ]
  },
  {
    id: "give-back",
    title: "Returning a String hands ownership out",
    code: `
fn main() {
    let s = make();
    println!("{s}");
}

fn make() -> String {
    let t = String::from("new");
    t
}`,
    steps: [
      { line: 1, say: "<p>Frame for <code>main</code>.</p>", ops: [["frame", "main"]] },
      { line: 2, say: "<p>Calling <code>make</code> pushes its frame on top.</p>", ops: [["frame", "make"]] },
      { line: 7, say: "<p><code>t</code> allocates and owns <code>\"new\"</code>.</p>", ops: [["alloc", "h1", "new", 3, { label: "String bytes" }], ["let", "t", "String", { ptr: "h1", meta: { len: 3, cap: 3 } }]] },
      {
        line: 8,
        ask: { q: "<code>make</code> is about to end and <code>t</code> goes out of scope. Are the bytes <code>\"new\"</code> freed?", choices: ["Yes. <code>t</code>'s scope ends, so the value is dropped.", "No. Returning <code>t</code> moves ownership out to the caller's <code>s</code>."], answer: 1, explain: "A return is a move out of the function." },
        say: "<p>Returning <code>t</code> <strong>moves</strong> it to the caller. The 24 stack bytes travel into <code>main</code>'s <code>s</code>, and the heap buffer never moves. Because <code>t</code> was moved out, the end of <code>make</code> frees nothing.</p>",
        ops: [["move", "t", "s", { frame: "main" }], ["pop"]]
      },
      { line: 3, say: "<p><code>s</code> owns the bytes now.</p>", ops: [["out", "new"]] },
      { line: 4, say: "<p>End of <code>main</code>: <code>s</code> is the owner, so <code>s</code> frees the buffer. Exactly one free, by exactly one owner.</p>", ops: [["drop", "s"], ["pop"]] }
    ]
  }
);
