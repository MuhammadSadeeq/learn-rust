/* Memory X-Ray scenarios for Chapter 04 — Everything Is an Expression */
(window.OX_XRAY = window.OX_XRAY || []).push(
  {
    id: "fn-frames",
    title: "Calling square copies the argument",
    code: `
fn main() {
    let x = 6;
    let result = square(x);
    println!("{result}");
}

fn square(n: i32) -> i32 {
    n * n
}`,
    steps: [
      { line: 1, say: "<p>Calling <code>main</code> pushes a <strong>stack frame</strong>: the block of memory for its local variables.</p>", ops: [["frame", "main"]] },
      { line: 2, say: "<p><code>x</code> is an <code>i32</code>. Its four bytes sit in <code>main</code>'s frame. Nothing goes on the heap.</p>", ops: [["let", "x", "i32", "6"]] },
      { line: 3, say: "<p><code>square(x)</code> pushes a new frame on top. The value of <code>x</code> is <strong>copied</strong> into the parameter <code>n</code>. Now there are two 6s, and they are independent.</p>", ops: [["frame", "square"], ["copy", "x", "n", { frame: "square" }]] },
      { line: 8, say: "<p><code>n * n</code> is 36. There is no semicolon after it, so 36 is the value that <code>square</code> returns.</p>", ops: [] },
      {
        line: 9,
        ask: {
          q: "When <code>square</code> returns, what happens to <code>n</code>?",
          choices: [
            "It is copied back into <code>x</code> in <code>main</code>.",
            "It disappears with the <code>square</code> frame. An <code>i32</code> owns nothing on the heap, so there is nothing to free.",
            "It stays alive until the program ends."
          ],
          answer: 1,
          explain: "Locals die with their frame. <code>x</code> was never touched, because <code>n</code> was a copy."
        },
        say: "<p>The closing brace ends <code>square</code>. Its frame is popped, and <code>n</code> goes with it. Only the number 36 travels back to the caller.</p>",
        ops: [["pop"]]
      },
      { line: 3, say: "<p>The returned 36 is stored in <code>result</code>. Returning a number copies it out, and the frame that produced it is already gone.</p>", ops: [["let", "result", "i32", "36"]] },
      { line: 4, say: "<p><code>println!</code> prints the value.</p>", ops: [["out", "36"]] },
      { line: 5, say: "<p>The end of <code>main</code>. <code>x</code> and <code>result</code> are plain numbers, so popping the frame frees nothing.</p>", ops: [["pop"]] }
    ]
  }
);
