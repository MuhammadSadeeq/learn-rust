/* Chapter 15 — Lifetimes: Lifetime Timelines and the Lifetime Solver data.
   Every program here is compiled by tools/check-snippets.mjs. The `check` field
   is the verdict rustc gives. */
(window.OX_TIMELINES = window.OX_TIMELINES || []).push(
  {
    id: "inner-scope",
    title: "x is dropped before r is used",
    check: "E0597",
    code: `
fn main() {
    let r;
    {
        let x = 5;
        r = &x;
    }
    println!("{r}");
}`,
    vars: [
      { name: "x", kind: "own", from: 4, to: 6 },
      { name: "r", kind: "ref", from: 5, to: 7, label: "&x", bad: [7] }
    ],
    marks: [
      { var: "r", line: 5, text: "borrow" },
      { var: "r", line: 7, text: "use", bad: true }
    ],
    steps: [
      { line: 2, say: "<p><code>r</code> is declared with no value. It holds no borrow yet, so it has no bar.</p>" },
      { line: 4, say: "<p><code>x</code> is created inside the inner block. It owns its value, and its bar runs to the closing brace on line 6.</p>" },
      { line: 5, say: "<p><code>r = &amp;x</code> borrows <code>x</code>. The bar for <code>r</code> starts here. It has to last for as long as <code>r</code> is used.</p>" },
      { line: 6, say: "<p>The inner block closes, and <code>x</code> is dropped. Its bar ends. The bar for <code>r</code> keeps going, because <code>r</code> is still needed.</p>" },
      { line: 7, error: true, say: "<p><strong>error[E0597]: <code>x</code> does not live long enough</strong></p><p>The <code>println!</code> reads <code>r</code> after <code>x</code> is gone. <code>r</code> would point at a value that no longer exists, so rustc refuses the program.</p>" }
    ]
  },
  {
    id: "longest-ok",
    title: "Both owners outlive the result",
    check: "ok",
    code: `
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}

fn main() {
    let x = String::from("long string is long");
    let y = String::from("xyz");
    let result = longest(x.as_str(), y.as_str());
    println!("The longest string is {result}");
}`,
    vars: [
      { name: "x", kind: "own", from: 6, to: 10 },
      { name: "y", kind: "own", from: 7, to: 10 },
      { name: "result", kind: "ref", from: 8, to: 9, label: "from x, y" }
    ],
    marks: [
      { var: "result", line: 8, text: "borrow" },
      { var: "result", line: 9, text: "use" }
    ],
    steps: [
      { line: 6, say: "<p><code>x</code> owns its String. Its bar runs to the closing brace of <code>main</code>.</p>" },
      { line: 7, say: "<p><code>y</code> does too. Both owners are alive for the rest of <code>main</code>.</p>" },
      { line: 8, say: "<p><code>longest</code> returns a reference tied to <code>x</code> and <code>y</code>. The bar for <code>result</code> starts here.</p>" },
      { line: 9, say: "<p>The print reads <code>result</code>. Both owners are still alive, so the borrow is valid.</p>" },
      { line: 10, say: "<p><code>main</code> ends, and locals are dropped in reverse order: <code>y</code> first, then <code>x</code>. The bar for <code>result</code> ended on line 9, before either owner was dropped.</p>" }
    ]
  },
  {
    id: "longest-bad",
    title: "y is dropped while result still needs it",
    check: "E0597",
    code: `
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}

fn main() {
    let x = String::from("long string is long");
    let result;
    {
        let y = String::from("xyz");
        result = longest(x.as_str(), y.as_str());
    }
    println!("The longest string is {result}");
}`,
    vars: [
      { name: "x", kind: "own", from: 6, to: 13 },
      { name: "y", kind: "own", from: 9, to: 11 },
      { name: "result", kind: "ref", from: 10, to: 12, label: "from x, y", bad: [12] }
    ],
    marks: [
      { var: "result", line: 10, text: "borrow" },
      { var: "result", line: 12, text: "needs y", bad: true }
    ],
    steps: [
      { line: 6, say: "<p><code>x</code> owns its String and lives to the end of <code>main</code>.</p>" },
      { line: 7, say: "<p><code>result</code> is declared, but nothing is borrowed yet. It has no bar.</p>" },
      { line: 9, say: "<p><code>y</code> is created inside the inner block. Its bar ends at the closing brace on line 11.</p>" },
      { line: 10, say: "<p><code>longest</code> ties its output to both inputs, so <code>result</code> may borrow from <code>y</code>. The bar for <code>result</code> starts here.</p>" },
      { line: 11, say: "<p>The inner block closes, and <code>y</code> is dropped. <code>result</code> still borrows from it, so its bar keeps going.</p>" },
      { line: 12, error: true, say: "<p><strong>error[E0597]: <code>y</code> does not live long enough</strong></p><p>The print uses <code>result</code> after <code>y</code> is gone. The striped bar on this line is the conflict.</p>" }
    ]
  },
  {
    id: "excerpt-ok",
    title: "A struct lives inside the text it borrows",
    check: "ok",
    code: `
struct Excerpt<'a> {
    part: &'a str,
}

impl<'a> Excerpt<'a> {
    fn text(&self) -> &'a str {
        self.part
    }
}

fn main() {
    let text = String::from("call me Ishmael. Some years ago");
    let excerpt = Excerpt { part: &text[..15] };
    println!("{}", excerpt.text());
}`,
    vars: [
      { name: "text", kind: "own", from: 12, to: 15 },
      { name: "excerpt", kind: "ref", from: 13, to: 14, label: "&text" }
    ],
    marks: [
      { var: "excerpt", line: 13, text: "borrow" },
      { var: "excerpt", line: 14, text: "use" }
    ],
    steps: [
      { line: 12, say: "<p><code>text</code> owns the String. It lives until the end of <code>main</code>.</p>" },
      { line: 13, say: "<p>The slice <code>&amp;text[..15]</code> is stored inside an <code>Excerpt</code>. The <code>'a</code> in the struct ties the slice to <code>text</code>, so this bar sits inside the bar for <code>text</code>.</p>" },
      { line: 14, say: "<p><code>excerpt.text()</code> returns the slice with the same <code>'a</code>. <code>text</code> is still alive, so the slice is valid.</p>" },
      { line: 15, say: "<p><code>main</code> ends. <code>excerpt</code> is dropped first, then <code>text</code>. The struct never outlives the text it borrows.</p>" }
    ]
  }
);

/* The Lifetime Solver: eight real programs for the signature interactive.
   Each `rust` value was compiled with rustc 1.97 (edition 2024) and `check` is
   the verdict that compiler gave. `bars` are the source lines of x, y and the
   result (inclusive). tools/check-snippets.mjs compiles every entry. */
window.OX_CH15_SOLVER = [
  {
    id: "inner-inside-longest",
    inner: true,
    print: "inside",
    fn: "longest",
    check: "ok",
    rust: `fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}

fn main() {
    let x = String::from("long string is long");
    let result;
    {
        let y = String::from("xyz");
        result = longest(x.as_str(), y.as_str());
        println!("result: {result}");
    }
}`,
    bars: { x: [6, 13], y: [9, 12], result: [10, 11] },
    borrows: "x and y",
    message: null,
    reason: "The print runs inside y's block, so result is used while y is still alive. result may borrow from x or y, and both are valid on that line."
  },
  {
    id: "inner-inside-first",
    inner: true,
    print: "inside",
    fn: "first",
    check: "ok",
    rust: `fn first<'a>(x: &'a str, y: &str) -> &'a str {
    x
}

fn main() {
    let x = String::from("long string is long");
    let result;
    {
        let y = String::from("xyz");
        result = first(x.as_str(), y.as_str());
        println!("result: {result}");
    }
}`,
    bars: { x: [6, 13], y: [9, 12], result: [10, 11] },
    borrows: "x",
    message: null,
    reason: "first ties result to x alone, so how long y lives does not matter. The print runs inside y's block and reads only the borrow of x."
  },
  {
    id: "inner-after-longest",
    inner: true,
    print: "after",
    fn: "longest",
    check: "E0597",
    rust: `fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}

fn main() {
    let x = String::from("long string is long");
    let result;
    {
        let y = String::from("xyz");
        result = longest(x.as_str(), y.as_str());
    }
    println!("result: {result}");
}`,
    bars: { x: [6, 13], y: [9, 11], result: [10, 12] },
    borrows: "x and y",
    message: "error[E0597]: `y` does not live long enough",
    reason: "longest ties result to both x and y, so result may borrow from y. The print runs after y's block has ended, so y is already dropped while result still needs it."
  },
  {
    id: "inner-after-first",
    inner: true,
    print: "after",
    fn: "first",
    check: "ok",
    rust: `fn first<'a>(x: &'a str, y: &str) -> &'a str {
    x
}

fn main() {
    let x = String::from("long string is long");
    let result;
    {
        let y = String::from("xyz");
        result = first(x.as_str(), y.as_str());
    }
    println!("result: {result}");
}`,
    bars: { x: [6, 13], y: [9, 11], result: [10, 12] },
    borrows: "x",
    message: null,
    reason: "first ties result to x alone. y is dropped at the inner brace, and the print after the block reads only the borrow of x."
  },
  {
    id: "outer-inside-longest",
    inner: false,
    print: "inside",
    fn: "longest",
    check: "ok",
    rust: `fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}

fn main() {
    let x = String::from("long string is long");
    let y = String::from("xyz");
    let result = longest(x.as_str(), y.as_str());
    println!("result: {result}");
}`,
    bars: { x: [6, 10], y: [7, 10], result: [8, 9] },
    borrows: "x and y",
    message: null,
    reason: "y lives until the end of main, so it outlives every use of result. With no inner block, the print position changes nothing."
  },
  {
    id: "outer-inside-first",
    inner: false,
    print: "inside",
    fn: "first",
    check: "ok",
    rust: `fn first<'a>(x: &'a str, y: &str) -> &'a str {
    x
}

fn main() {
    let x = String::from("long string is long");
    let y = String::from("xyz");
    let result = first(x.as_str(), y.as_str());
    println!("result: {result}");
}`,
    bars: { x: [6, 10], y: [7, 10], result: [8, 9] },
    borrows: "x",
    message: null,
    reason: "y lives until the end of main, and first ties result to x alone. Nothing ends early."
  },
  {
    id: "outer-after-longest",
    inner: false,
    print: "after",
    fn: "longest",
    check: "ok",
    rust: `fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}

fn main() {
    let x = String::from("long string is long");
    let y = String::from("xyz");
    let result = longest(x.as_str(), y.as_str());
    println!("result: {result}");
}`,
    bars: { x: [6, 10], y: [7, 10], result: [8, 9] },
    borrows: "x and y",
    message: null,
    reason: "y lives until the end of main, and the print is still inside that span. With no inner block, the print position changes nothing."
  },
  {
    id: "outer-after-first",
    inner: false,
    print: "after",
    fn: "first",
    check: "ok",
    rust: `fn first<'a>(x: &'a str, y: &str) -> &'a str {
    x
}

fn main() {
    let x = String::from("long string is long");
    let y = String::from("xyz");
    let result = first(x.as_str(), y.as_str());
    println!("result: {result}");
}`,
    bars: { x: [6, 10], y: [7, 10], result: [8, 9] },
    borrows: "x",
    message: null,
    reason: "y lives until the end of main, and first ties result to x alone. With no inner block, the print position changes nothing."
  }
];
