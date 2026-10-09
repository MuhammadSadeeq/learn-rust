/* Memory X-Ray scenarios for Chapter 09 — Structs & Methods.
   The three receivers share one struct and one starting value. Only the call
   changes, so the picker compares them directly. */
(window.OX_XRAY = window.OX_XRAY || []).push(
  {
    id: "recv-ref",
    title: "&self: the method only looks",
    code: `
struct Rect {
    w: u32,
    h: u32,
}

impl Rect {
    fn area(&self) -> u32 {
        self.w * self.h
    }
}

fn main() {
    let r = Rect { w: 2, h: 3 };
    let a = r.area();
    println!("area {a}, still {} x {}", r.w, r.h);
}`,
    steps: [
      { line: 12, say: "<p>Calling <code>main</code> pushes its frame.</p>", ops: [["frame", "main"]] },
      { line: 13, say: "<p><code>r</code> is a <code>Rect</code>: two <code>u32</code> fields, eight bytes in all, stored inside <code>main</code>'s frame. It owns no heap memory. Nothing in this program changes <code>r</code>, so it is not <code>mut</code>.</p>", ops: [["let", "r", "Rect", { v: "Rect { w: 2, h: 3 }" }]] },
      {
        line: 14,
        ask: {
          q: "<code>area</code> takes <code>&amp;self</code>. After <code>r.area()</code> returns, can <code>main</code> still use <code>r</code>?",
          choices: ["No. The call moves <code>r</code> into <code>area</code>.", "Yes. <code>&amp;self</code> only borrows <code>r</code>, so <code>main</code> still owns it.", "Only if <code>r</code> is declared <code>mut</code>."],
          answer: 1,
          explain: "A <code>&amp;self</code> method takes a shared borrow, the same kind of reference as <code>&amp;T</code> from the last chapter. The owner never changes."
        },
        say: "<p><code>r.area()</code> is the same call as <code>Rect::area(&amp;r)</code>. The compiler takes the borrow for you, which is why you never write the <code>&amp;</code> yourself.</p>",
        ops: []
      },
      { line: 8, say: "<p>Inside <code>area</code>, <code>self</code> is a <code>&amp;Rect</code>: a shared borrow of <code>r</code>, drawn as a blue arrow. The method reads <code>self.w</code> and <code>self.h</code> and has no way to change them.</p>", ops: [["frame", "Rect::area"], ["let", "self", "&Rect", { ref: "r" }]] },
      { line: 14, say: "<p><code>area</code> returns <code>6</code>. Its frame is popped, and the borrow <code>self</code> disappears with it. <code>r</code> was only looked at, so <code>main</code> still owns it.</p>", ops: [["pop"], ["let", "a", "u32", "6"]] },
      { line: 15, say: "<p>Both fields of <code>r</code> are still valid to read.</p>", ops: [["out", "area 6, still 2 x 3"]] },
      { line: 16, say: "<p>End of <code>main</code>. <code>a</code> is dropped, then <code>r</code>, in reverse order of declaration. Neither holds heap memory, so there is nothing to free.</p>", ops: [["drop", "a"], ["drop", "r"], ["pop"]] }
    ]
  },
  {
    id: "recv-mut",
    title: "&mut self: the method changes r",
    code: `
struct Rect {
    w: u32,
    h: u32,
}

impl Rect {
    fn scale(&mut self, k: u32) {
        self.w *= k;
        self.h *= k;
    }
}

fn main() {
    let mut r = Rect { w: 2, h: 3 };
    r.scale(2);
    println!("now {} x {}", r.w, r.h);
}`,
    steps: [
      { line: 13, say: "<p>A frame for <code>main</code>.</p>", ops: [["frame", "main"]] },
      { line: 14, say: "<p><code>r</code> is declared <code>mut</code>, because the method below changes it. Mutability belongs to the binding, not to single fields, so every field of <code>r</code> can now change.</p>", ops: [["let", "r", "Rect", { v: "Rect { w: 2, h: 3 }" }, { mut: true }]] },
      {
        line: 15,
        ask: {
          q: "<code>scale</code> takes <code>&amp;mut self</code>. After the call, can <code>main</code> still use <code>r</code>, and what does it hold?",
          choices: ["No. A <code>&amp;mut</code> method moves <code>r</code> and gives it back later.", "Yes. <code>r</code> holds the changed fields, because the method changed it in place through a mutable borrow.", "Yes, but <code>r</code> is unchanged, because the method works on a copy."],
          answer: 1,
          explain: "<code>&amp;mut self</code> is the one key to the editing room. It lends <code>r</code> out for changes. It neither copies <code>r</code> nor moves it."
        },
        say: "<p><code>r.scale(2)</code> is the same call as <code>Rect::scale(&amp;mut r, 2)</code>. The compiler takes a mutable borrow of <code>r</code> for the length of the call.</p>",
        ops: []
      },
      { line: 8, say: "<p>Inside <code>scale</code>, <code>self</code> is a <code>&amp;mut Rect</code>, drawn in magenta. While it exists, nobody else may even look at <code>r</code>. The parameter <code>k</code> is a plain <code>u32</code>.</p>", ops: [["frame", "Rect::scale"], ["let", "self", "&mut Rect", { mut: "r" }], ["let", "k", "u32", "2"]] },
      { line: 8, say: "<p><code>self.w *= k</code> reads 2, multiplies it by 2 and writes 4 into the <code>w</code> field. <code>r</code> shows the new value, because the borrow points at <code>r</code> itself, not at a copy.</p>", ops: [["set", "r", "Rect { w: 4, h: 3 }"]] },
      { line: 9, say: "<p><code>self.h *= k</code> does the same to <code>h</code>. The method returns nothing. Its job was the change.</p>", ops: [["set", "r", "Rect { w: 4, h: 6 }"]] },
      { line: 10, say: "<p><code>scale</code> ends. Its frame is popped, <code>self</code> disappears, and the mutable borrow ends with it. <code>main</code> may look at <code>r</code> again.</p>", ops: [["pop"]] },
      { line: 16, say: "<p><code>r</code> was never moved or copied. <code>main</code> still owns it and sees the change.</p>", ops: [["out", "now 4 x 6"]] },
      { line: 17, say: "<p>End of <code>main</code>. <code>r</code> is dropped. It holds no heap memory, so there is nothing to free.</p>", ops: [["drop", "r"], ["pop"]] }
    ]
  },
  {
    id: "recv-owned",
    title: "self: the method takes r",
    check: "E0382",
    code: `
struct Rect {
    w: u32,
    h: u32,
}

impl Rect {
    fn into_square(self) -> Rect {
        let side = self.w.max(self.h);
        Rect { w: side, h: side }
    }
}

fn main() {
    let r = Rect { w: 2, h: 3 };
    let sq = r.into_square();
    println!("{} x {}", r.w, r.h);
    println!("square {}", sq.w);
}`,
    steps: [
      { line: 13, say: "<p>A frame for <code>main</code>.</p>", ops: [["frame", "main"]] },
      { line: 14, say: "<p><code>r</code> owns a <code>Rect</code>. Its two fields are plain numbers and the struct has no heap memory. A struct is <em>not</em> <code>Copy</code> unless you ask for it, which the derive section shows, so passing it by value is a move.</p>", ops: [["let", "r", "Rect", { v: "Rect { w: 2, h: 3 }" }]] },
      {
        line: 15,
        ask: {
          q: "<code>into_square</code> takes <code>self</code>, with no <code>&amp;</code>. After the call, can <code>main</code> still use <code>r</code>?",
          choices: ["Yes. <code>self</code> is a reference to <code>r</code>.", "No. <code>self</code> takes ownership of <code>r</code>, so <code>r</code> is moved into the method.", "Yes, because <code>Rect</code> holds only numbers, and numbers are copied."],
          answer: 1,
          explain: "A method that takes <code>self</code> works like a function that takes a parameter by value. Ownership moves in. Holding only numbers does not make a struct <code>Copy</code>."
        },
        say: "<p><code>r.into_square()</code> is the same call as <code>Rect::into_square(r)</code>. The receiver is passed by value, so the call moves <code>r</code>.</p>",
        ops: []
      },
      { line: 8, say: "<p>Inside the method, <code>self</code> is the new owner. The label on <code>r</code> has been rewritten, so <code>r</code> turns grey. Any later use of <code>r</code> is a compile error.</p>", ops: [["frame", "Rect::into_square"], ["move", "r", "self", { type: "Rect" }]] },
      { line: 9, say: "<p><code>side</code> is <code>max(2, 3)</code>, which is 3. It is a plain number on the stack.</p>", ops: [["let", "side", "u32", "3"]] },
      { line: 10, say: "<p>The method returns, and <code>self</code> is dropped. It owned only plain numbers, so nothing is freed.</p>", ops: [["pop"]] },
      { line: 15, say: "<p>The returned <code>Rect { w: 3, h: 3 }</code> is a new value, and it becomes <code>sq</code>. The old <code>r</code> stays moved.</p>", ops: [["let", "sq", "Rect", { v: "Rect { w: 3, h: 3 }" }]] },
      { line: 16, error: true, say: "<p><strong>error[E0382]: borrow of moved value: <code>r</code></strong></p><p><code>r</code> gave its value to <code>into_square</code>. Reading <code>r.w</code> now uses a value that no longer belongs to <code>main</code>. The compiler refuses to build the program, so this bug never reaches a running process.</p>", ops: [["err", "r"]] }
    ]
  }
);
