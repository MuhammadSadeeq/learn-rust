/* Chapter 15 (Lifetimes): the sand timer scene (a reference outlives its owner)
   and the longest scene (the result is tied to both inputs). The rust fields,
   the beats' own rust (the fixed programs), are compiled by
   tools/check-snippets.mjs. */
(window.OX_MOTION = window.OX_MOTION || []).push({
  id: "ch15-sand",
  title: "The sand runs out before the reference is used",
  w: 640,
  h: 300,
  rust: `fn main() {
    let r;
    {
        let x = 5;
        r = &x;
    }
    println!("{r}");
}`,
  check: "E0597",
  actors: [
    { id: "outer", cast: "tick", opts: { level: 1 }, x: 110, y: 150, size: 110, label: "main" },
    { id: "inner", cast: "tick", opts: { level: 1 }, x: 300, y: 150, size: 80, label: "{ }", hidden: true },
    { id: "x", prop: "pebble", opts: { type: "i32", value: "5" }, x: 300, y: 240, size: 60, label: "x", hidden: true },
    { id: "r", cast: "crab", kind: "ref", x: 500, y: 150, size: 84, label: "r", hidden: true },
    { id: "insp", cast: "inspector", x: 580, y: 222, size: 90, label: "Inspector", hidden: true },
    { id: "err", prop: "errscroll", opts: { label: "E0597" }, x: 500, y: 45, size: 100, z: 5, hidden: true },
  ],
  beats: [
    {
      say: "<p><code>let r;</code> declares a reference with no value yet. The outer Tick is the lifetime of everything in <code>main</code>: the region of code where a reference must stay valid.</p>",
      line: 2,
      do: [["pose", "outer", "think", 1200]],
    },
    {
      say: "<p>Inside the block, <code>let x = 5;</code> makes a value. Its Tick is a shorter lifetime, because the block ends before <code>main</code> does.</p>",
      line: 4,
      do: [["pop", "inner", 0], ["pop", "x", 350]],
    },
    {
      say: "<p><code>r = &amp;x;</code> borrows <code>x</code>, so the lifetime of <code>r</code> must fit inside the lifetime of <code>x</code>. The glasses link <code>r</code> to the value, and <code>r</code> itself lives in <code>main</code>.</p>",
      line: 5,
      do: [["pop", "r", 0], ["link", "rx", "r", "x", "ref", 350]],
    },
    {
      say: "<p>The block is about to close. Its <code>}</code> drops <code>x</code>, and the sand in its Tick runs out: the lifetime of <code>x</code> ends here.</p>",
      line: 6,
      ask: {
        q: "Line 7 still reads <code>r</code> after the <code>}</code>. Is <code>r</code> still valid there?",
        choices: ["Yes, r keeps x alive", "No, x is dropped at the } while r still points at it"],
        answer: 1,
        explain: "A reference can't outlive the value it borrows. The sand ran out, so x is gone when line 7 runs.",
      },
      do: [
        ["art", "inner", { cast: "tick", opts: { level: 0 } }, 0],
        ["poof", "x", 250],
      ],
    },
    {
      say: "<p>Line 7 reads <code>r</code> after <code>x</code> is gone. The Inspector stamps E0597 on the reference, and its link turns red.</p>",
      line: 7,
      do: [
        ["link", "rx", "r", "x", "bad", 0],
        ["pop", "insp", 0],
        ["pop", "err", 300],
        ["shake", "r", 500],
      ],
    },
    {
      say: "<p>Fix it by using <code>r</code> before the <code>}</code>, while the sand still runs. The panel shows the fixed program, and it compiles.</p>",
      line: 6,
      rust: `fn main() {
    let r;
    {
        let x = 5;
        r = &x;
        println!("{r}");
    }
}`,
      check: "ok",
      do: [["unlink", "rx", 0], ["poof", "err", 0], ["hide", "insp", 0]],
    },
  ],
});

(window.OX_MOTION = window.OX_MOTION || []).push({
  id: "ch15-longest",
  title: "The result's lifetime is tied to both inputs",
  w: 640,
  h: 300,
  rust: `fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}

fn main() {
    let x = String::from("long string");
    let result;
    {
        let y = String::from("xyz");
        result = longest(x.as_str(), y.as_str());
    }
    println!("The longest string is {result}");
}`,
  check: "E0597",
  actors: [
    { id: "outer", cast: "tick", opts: { level: 1 }, x: 80, y: 150, size: 110, label: "main" },
    { id: "x", cast: "fluffy", x: 210, y: 85, size: 80, label: "x", hidden: true },
    { id: "inner", cast: "tick", opts: { level: 1 }, x: 320, y: 200, size: 66, label: "block", hidden: true },
    { id: "y", cast: "fluffy", x: 420, y: 200, size: 60, label: "y", hidden: true },
    { id: "result", cast: "crab", kind: "ref", x: 540, y: 130, size: 84, label: "result", hidden: true },
    { id: "insp", cast: "inspector", x: 560, y: 235, size: 90, label: "Inspector", hidden: true },
    { id: "err", prop: "errscroll", opts: { label: "E0597" }, x: 420, y: 265, size: 96, z: 5, hidden: true },
  ],
  beats: [
    {
      say: "<p><code>let x</code> lives for all of <code>main</code>, so its lifetime is the long outer Tick.</p>",
      line: 6,
      do: [["pop", "x", 0], ["pose", "outer", "think", 1200]],
    },
    {
      say: "<p>The block opens, and <code>let y</code> makes a second String. Its Tick is a shorter lifetime, because the block ends sooner.</p>",
      line: 9,
      do: [["pop", "inner", 0], ["pop", "y", 350]],
    },
    {
      say: "<p><code>longest(x, y)</code> ties the lifetime of <code>result</code> to both inputs. So <code>result</code> can't outlive the shorter of the two, and that is <code>y</code>.</p>",
      line: 10,
      do: [
        ["pop", "result", 0],
        ["link", "rx", "result", "x", "ref", 350],
        ["link", "ry", "result", "y", "ref", 550],
      ],
    },
    {
      say: "<p>The block closes at line 11, and the sand in <code>y</code>'s Tick runs out. Then line 12 prints <code>result</code>.</p>",
      line: 11,
      ask: {
        q: "<code>result</code> may be <code>y</code>. Can line 12 still read it after the brace?",
        choices: ["Yes, result is only tied to x", "No, y is dropped at the } while result may still point at it"],
        answer: 1,
        explain: "longest ties result to y as well, so result can't outlive y.",
      },
      do: [
        ["art", "inner", { cast: "tick", opts: { level: 0 } }, 0],
        ["poof", "y", 250],
      ],
    },
    {
      say: "<p>Line 12 reads <code>result</code> after <code>y</code> is gone. The Inspector stamps E0597 on <code>y</code>, and the link to <code>y</code> turns red.</p>",
      line: 12,
      do: [
        ["link", "ry", "result", "y", "bad", 0],
        ["pop", "insp", 0],
        ["pop", "err", 300],
        ["shake", "result", 500],
      ],
    },
    {
      say: "<p>Fix it by printing <code>result</code> inside the block, while <code>y</code> still exists. The panel shows the fixed version, and it compiles.</p>",
      line: 11,
      rust: `fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}

fn main() {
    let x = String::from("long string");
    let result;
    {
        let y = String::from("xyz");
        result = longest(x.as_str(), y.as_str());
        println!("The longest string is {result}");
    }
}`,
      check: "ok",
      do: [["unlink", "ry", 0], ["poof", "err", 0], ["hide", "insp", 0]],
    },
  ],
});
