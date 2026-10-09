/* Chapter 11 · Errors: motion scene.
   ch11-question: three functions as stations. An Ok car rolls through every
   `?`. An Err car is switched back to the caller at the `?`, and the next
   station never runs. With `.unwrap()` in place of `?`, the car derails.
   The rust field compiles, and its stdout is checked by the snippet checker. */
(window.OX_MOTION = window.OX_MOTION || []).push({
  id: "ch11-question",
  title: "Ok rolls on, Err switches back",
  w: 640,
  h: 300,
  rust: `fn read_text(raw: &str) -> Result<&str, String> {
    Ok(raw.trim())
}

fn parse_age(text: &str) -> Result<u32, String> {
    text.parse::<u32>().map_err(|e| e.to_string())
}

fn next_year(age: u32) -> Result<u32, String> {
    Ok(age + 1)
}

fn run(raw: &str) -> Result<u32, String> {
    let text = read_text(raw)?;
    let age = parse_age(text)?;
    let year = next_year(age)?;
    Ok(year)
}

fn main() {
    println!("{:?}", run(" 41 "));
    println!("{:?}", run("x"));
}`,
  check: "ok",
  stdout: 'Ok(42)\nErr("invalid digit found in string")',
  actors: [
    { id: "oxi", cast: "oxi", x: 60, y: 252, size: 76 },
    { id: "swi", cast: "switchman", x: 60, y: 118, size: 64 },
    { id: "main", box: true, x: 320, y: 40, w: 300, h: 46, label: "main" },
    { id: "st1", box: true, x: 170, y: 180, w: 130, h: 64, label: "read_text" },
    { id: "st2", box: true, x: 320, y: 180, w: 130, h: 64, label: "parse_age" },
    { id: "st3", box: true, x: 470, y: 180, w: 130, h: 64, label: "next_year" },
    { id: "lev1", prop: "lever", opts: { on: false }, x: 170, y: 116, size: 40 },
    { id: "lev2", prop: "lever", opts: { on: false }, x: 320, y: 116, size: 40 },
    { id: "lev3", prop: "lever", opts: { on: false }, x: 470, y: 116, size: 40 },
    { id: "car1", prop: "car", opts: { kind: "ok", label: "41" }, x: 62, y: 180, size: 92, hidden: true },
    { id: "car2", prop: "car", opts: { kind: "ok", label: "x" }, x: 62, y: 180, size: 92, hidden: true },
    { id: "car3", prop: "car", opts: { kind: "ok", label: "x" }, x: 62, y: 180, size: 92, hidden: true },
  ],
  beats: [
    {
      say: "<p>Each <code>?</code> is a station on the line. An <b>Ok</b> car, a <code>Result</code> holding a value, rolls through every one of them.</p>",
      line: 14,
      do: [
        ["pose", "oxi", "talk", 1200],
        ["pose", "swi", "talk", 1200],
        ["show", "car1", 0],
      ],
    },
    {
      say: "<p><code>read_text</code> returns <code>Ok</code>, so its <code>?</code> lets the car roll on.</p>",
      line: 14,
      do: [["move", "car1", { x: 170, y: 180 }, 600, 0]],
    },
    {
      say: "<p><code>parse_age</code> returns <code>Ok</code> as well, and the car rolls to the third station.</p>",
      line: 15,
      do: [["move", "car1", { x: 320, y: 180 }, 600, 0]],
    },
    {
      say: "<p><code>next_year</code> returns <code>Ok(42)</code>. The last <code>?</code> passes, and the car reaches <code>main</code> with the answer.</p>",
      line: 16,
      do: [
        ["move", "car1", { x: 470, y: 180 }, 600, 0],
        ["art", "car1", { prop: "car", opts: { kind: "ok", label: "42" } }, 900],
        ["arc", "car1", { x: 420, y: 40, scale: 1 }, 700, 900, 60],
        ["pose", "swi", "happy", 1000, 1000],
        ["pose", "oxi", "happy", 1200, 1000],
      ],
    },
    {
      say: "<p>The second <code>?</code> sees <code>Err</code> and returns it early. The lever is thrown, the car goes back to <code>main</code>, and <code>next_year</code> never runs.</p>",
      line: 15,
      do: [
        ["show", "car2", 0],
        ["move", "car2", { x: 170, y: 180 }, 600, 0],
        ["move", "car2", { x: 320, y: 180 }, 600, 600],
        ["pose", "swi", "talk", 800, 600],
        ["art", "car2", { prop: "car", opts: { kind: "err", label: "x" } }, 1200],
        ["art", "lev2", { prop: "lever", opts: { on: true } }, 1200],
        ["arc", "car2", { x: 250, y: 40, scale: 1 }, 700, 1400, 60],
        ["pose", "oxi", "oops", 1400, 1400],
      ],
      ask: {
        q: "Now the input is <code>x</code>, so the second <code>?</code> gets an <code>Err</code>. Where does the car go next?",
        choices: ["On to next_year, then main", "Back to main, and next_year never runs"],
        answer: 1,
        explain: "A <code>?</code> on an <code>Err</code> returns from <code>run</code> at once. The caller gets the error, and station 3 is skipped.",
      },
    },
    {
      say: '<p>Put <code>.unwrap()</code> in place of that <code>?</code>. Nothing switches the car, so it derails and the thread panics: <code>called `Result::unwrap()` on an `Err` value: "invalid digit found in string"</code></p>',
      line: 15,
      do: [
        ["art", "lev2", { prop: "lever", opts: { on: false } }, 0],
        ["show", "car3", 0],
        ["move", "car3", { x: 170, y: 180 }, 600, 0],
        ["move", "car3", { x: 320, y: 180 }, 600, 600],
        ["art", "car3", { prop: "car", opts: { kind: "err", label: "x" } }, 1200],
        ["pose", "swi", "ouch", 1600, 1300],
        ["shake", "car3", 1300],
        ["arc", "car3", { x: 330, y: 272, scale: 1 }, 600, 1800, 30],
        ["fade", "car3", 0.3, 300, 1800],
      ],
    },
  ],
});
