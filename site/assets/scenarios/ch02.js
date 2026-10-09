/* Memory X-Ray scenarios for Chapter 02 — Variables Are Promises */
(window.OX_XRAY = window.OX_XRAY || []).push(
  {
    id: "mut-same-box",
    title: "mut: one box, new value",
    code: `
fn main() {
    let mut n = 1;
    n = n + 1;
    n = n * 10;
    println!("{n}");
}`,
    steps: [
      { line: 1, say: "<p>Calling <code>main</code> pushes a <strong>stack frame</strong> for its local variables.</p>", ops: [["frame", "main"]] },
      { line: 2, say: "<p><code>let mut n = 1;</code> makes one box named <code>n</code> in the frame. It holds an <code>i32</code>. The <code>mut</code> means this box may be refilled later.</p>", ops: [["let", "n", "i32", "1", { mut: true }]] },
      {
        line: 3,
        ask: {
          q: "<code>n = n + 1</code> runs. What happens to the 1 that was in the box?",
          choices: [
            "It stays in memory, and <code>n</code> can still reach it.",
            "It is overwritten. The box now holds 2, and the 1 is gone.",
            "A second box named <code>n</code> is created, holding 2."
          ],
          answer: 1,
          explain: "Assignment reuses the box. Nothing new is created, so nothing old survives."
        },
        say: "<p>The same box now holds 2. The 1 was read to compute the 2, then replaced. There is still exactly one <code>n</code>.</p>",
        ops: [["set", "n", "2"]]
      },
      { line: 4, say: "<p><code>n * 10</code> reads the current 2 and produces 20. The box is refilled with 20. Its type stays <code>i32</code> throughout.</p>", ops: [["set", "n", "20"]] },
      { line: 5, say: "<p><code>println!</code> reads the box and prints 20.</p>", ops: [["out", "20"]] },
      { line: 6, say: "<p>The closing brace ends <code>main</code>. Its frame is popped, and <code>n</code> goes with it. An <code>i32</code> owns no heap bytes, so there is nothing to free.</p>", ops: [["drop", "n"], ["pop"]] }
    ]
  },
  {
    id: "shadow-new-box",
    title: "Shadowing: a new box each time",
    code: `
fn main() {
    let n = "5";
    let n: i32 = n.parse().unwrap();
    let n = n * 2;
    println!("{n}");
}`,
    steps: [
      { line: 1, say: "<p>Calling <code>main</code> pushes its frame.</p>", ops: [["frame", "main"]] },
      { line: 2, say: "<p>The first <code>n</code> holds the text <code>\"5\"</code>, a <code>&amp;str</code>. That text is stored inside the program itself, so no heap bytes are involved.</p>", ops: [["let", "n", "&str", "\"5\"", { id: "n1" }]] },
      {
        line: 3,
        ask: {
          q: "After the second <code>let n</code> on this line, how many variables named <code>n</code> exist in <code>main</code>?",
          choices: [
            "One. The new <code>n</code> replaces the old one.",
            "Two. Both still exist, but only the newest can be named.",
            "Zero. The old one was deleted when the new one was created."
          ],
          answer: 1,
          explain: "Shadowing never deletes anything. It creates a new variable and hides the old name."
        },
        say: "<p><code>n.parse()</code> reads the text and produces a number. The second <code>let</code> makes a new box, also named <code>n</code>, holding an <code>i32</code> with the value 5. The first box still exists until <code>main</code> ends, but no line of code can name it now.</p>",
        ops: [["let", "n", "i32", "5", { id: "n2" }], ["end", "n1"]]
      },
      { line: 4, say: "<p><code>n * 2</code> reads the newest <code>n</code>, which is 5, and produces 10. That result goes into a third box, also named <code>n</code>. The middle box is still there, and nothing can name it.</p>", ops: [["let", "n", "i32", "10", { id: "n3" }], ["end", "n2"]] },
      { line: 5, say: "<p><code>println!</code> names <code>n</code>. The name points at the newest box, so it prints 10.</p>", ops: [["out", "10"]] },
      { line: 6, say: "<p>The closing brace ends <code>main</code>. The three boxes are dropped in reverse order of creation. None of them owns heap bytes, so nothing is freed.</p>", ops: [["drop", "n3"], ["drop", "n2"], ["drop", "n1"], ["pop"]] }
    ]
  }
);
