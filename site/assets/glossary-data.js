/* Oxidize glossary data: every keyword, core term, std type and trait, cargo
   tool and error code the course uses. Read by labs/glossary.html and by
   oxidize.js, which draws a "Terms you now know" box at the end of each
   chapter's recap (every entry whose ch matches the chapter).

   Fields:
   - id: anchor on the glossary page (labs/glossary.html#id).
   - term, kind: keyword | concept | type | trait | syntax | error | tool.
   - ch: the chapter that teaches it.
   - def: one or two plain sentences. `code` renders as code.
   - aka: the course picture (a character or prop), shown as secondary text.
   - see: ids of related entries. codes: related error codes, such as E0382.
   - rust: a minimal example. tools/check-snippets.mjs compiles it.
   - stdout: the output the example must print.
   - check: for error entries, the code it must fail with, or "panic".

   Check: node tools/check-snippets.mjs site/assets/glossary-data.js */
window.OX_GLOSSARY = [
  /* ---------------------------------------------------------------- keywords */
  { id: "let", term: "let", kind: "keyword", ch: 2,
    def: "Gives a name to a value: `let x = 5;`. The name is immutable unless you add `mut`.",
    see: ["mut", "binding", "shadowing"],
    rust: `fn main() {
    let word = "crab";
    println!("{word}");
}`,
    stdout: "crab" },
  { id: "mut", term: "mut", kind: "keyword", ch: 2,
    def: "Lets a binding change its value. Without it, assigning to the name again is a compile error, E0384.",
    see: ["let", "e0384"], codes: ["E0384"],
    rust: `fn main() {
    let mut count = 0;
    count += 1;
    println!("{count}");
}`,
    stdout: "1" },
  { id: "const", term: "const", kind: "keyword", ch: 2,
    def: "A named value the compiler computes before the program runs. It needs a type, and it is written in SCREAMING_SNAKE_CASE by convention.",
    see: ["static", "e0015"], codes: ["E0015"],
    rust: `const LIMIT: u32 = 3 * 60;

fn main() {
    println!("{LIMIT}");
}`,
    stdout: "180" },
  { id: "static", term: "static", kind: "keyword", ch: 2,
    def: "A single value with one fixed place in memory for the whole program. Unlike `const`, a static has an address. Changing a `static mut` needs `unsafe`.",
    see: ["const", "static-lifetime"],
    rust: `static GREETING: &str = "hello";

fn main() {
    println!("{GREETING}");
}`,
    stdout: "hello" },
  { id: "fn", term: "fn", kind: "keyword", ch: 1,
    def: "Declares a function. The parameters come in parentheses, each with its type, then `->` and the return type if there is one.",
    see: ["return", "method"],
    rust: `fn add(a: i32, b: i32) -> i32 {
    a + b
}

fn main() {
    println!("{}", add(2, 3));
}`,
    stdout: "5" },
  { id: "return", term: "return", kind: "keyword", ch: 4,
    def: "Leaves a function early, with a value. The last expression of a function is returned without `return`.",
    see: ["fn", "expression"],
    rust: `fn half(n: i32) -> i32 {
    if n % 2 != 0 {
        return -1;
    }
    n / 2
}

fn main() {
    println!("{}", half(7));
}`,
    stdout: "-1" },
  { id: "if", term: "if", kind: "keyword", ch: 4,
    def: "Runs a block when a condition is true. The condition must be a `bool`. `if` is an expression, so it can produce a value.",
    see: ["else", "if-let", "expression"],
    rust: `fn main() {
    let n = 7;
    let kind = if n % 2 == 0 { "even" } else { "odd" };
    println!("{kind}");
}`,
    stdout: "odd" },
  { id: "else", term: "else", kind: "keyword", ch: 4,
    def: "The block that runs when an `if` condition is false. An `else if` chain tests several conditions in order, and the first true one wins.",
    see: ["if", "match"],
    rust: `fn main() {
    let temp = 15;
    if temp > 25 {
        println!("warm");
    } else if temp > 10 {
        println!("mild");
    } else {
        println!("cold");
    }
}`,
    stdout: "mild" },
  { id: "match", term: "match", kind: "keyword", ch: 4,
    def: "Compares a value with patterns, one arm at a time, and runs the first arm that fits. Every possible value needs an arm, or the compiler reports E0004.",
    aka: "Octo, the octopus with one arm per pattern",
    see: ["exhaustive", "pattern", "enum", "wildcard"], codes: ["E0004"],
    rust: `fn main() {
    let n = 3;
    let word = match n {
        1 => "one",
        2 => "two",
        _ => "many",
    };
    println!("{word}");
}`,
    stdout: "many" },
  { id: "loop", term: "loop", kind: "keyword", ch: 4,
    def: "Repeats its block forever, until a `break` leaves it. `break` can carry a value out, and that value becomes the value of the `loop`.",
    see: ["while", "for", "break"],
    rust: `fn main() {
    let mut n = 0;
    let found = loop {
        n += 3;
        if n > 10 {
            break n;
        }
    };
    println!("{found}");
}`,
    stdout: "12" },
  { id: "while", term: "while", kind: "keyword", ch: 4,
    def: "Repeats its block while the condition is true. The condition is checked before each pass, so the block may not run at all.",
    see: ["loop", "while-let"],
    rust: `fn main() {
    let mut fuel = 3;
    while fuel > 0 {
        println!("{fuel}");
        fuel -= 1;
    }
}`,
    stdout: "3\n2\n1" },
  { id: "for", term: "for", kind: "keyword", ch: 4,
    def: "Runs its block once for each item of something you can loop over, such as a range, an array or a borrowed list: `for x in &list`.",
    see: ["ranges", "iterator", "break", "continue"],
    rust: `fn main() {
    let names = ["ana", "ben"];
    for name in names {
        println!("hi {name}");
    }
}`,
    stdout: "hi ana\nhi ben" },
  { id: "break", term: "break", kind: "keyword", ch: 4,
    def: "Leaves the nearest loop right away. Inside a `loop`, `break value` also gives the loop its value.",
    see: ["loop", "continue"],
    rust: `fn main() {
    for n in 1..10 {
        if n == 4 {
            break;
        }
        println!("{n}");
    }
}`,
    stdout: "1\n2\n3" },
  { id: "continue", term: "continue", kind: "keyword", ch: 4,
    def: "Skips the rest of this pass through the nearest loop and goes on to the next pass.",
    see: ["break", "for"],
    rust: `fn main() {
    for n in 1..=5 {
        if n % 2 == 0 {
            continue;
        }
        println!("{n}");
    }
}`,
    stdout: "1\n3\n5" },
  { id: "struct", term: "struct", kind: "keyword", ch: 9,
    def: "Declares a named type that groups named fields. A struct literal has to set every field.",
    see: ["impl", "newtype", "debug", "default"],
    rust: `struct Crab {
    name: String,
    claws: u8,
}

fn main() {
    let c = Crab { name: String::from("Oxi"), claws: 2 };
    println!("{} has {} claws", c.name, c.claws);
}`,
    stdout: "Oxi has 2 claws" },
  { id: "enum", term: "enum", kind: "keyword", ch: 10,
    def: "Declares a type that is exactly one of several variants. A variant can hold nothing, a tuple of values or named fields.",
    see: ["match", "option"],
    rust: `enum Shape {
    Dot,
    Circle(f64),
    Rect { w: f64, h: f64 },
}

fn main() {
    let s = Shape::Circle(1.0);
    let area = match s {
        Shape::Dot => 0.0,
        Shape::Circle(r) => 3.0 * r * r,
        Shape::Rect { w, h } => w * h,
    };
    println!("{area}");
}`,
    stdout: "3" },
  { id: "impl", term: "impl", kind: "keyword", ch: 9,
    def: "Starts a block of methods and associated functions for a type. `impl Trait for Type` is the same keyword, and it writes a trait for a type.",
    see: ["method", "trait", "self"],
    rust: `struct Counter {
    n: u32,
}

impl Counter {
    fn new() -> Self {
        Counter { n: 0 }
    }

    fn bump(&mut self) {
        self.n += 1;
    }
}

fn main() {
    let mut c = Counter::new();
    c.bump();
    println!("{}", c.n);
}`,
    stdout: "1" },
  { id: "self", term: "self", kind: "keyword", ch: 9,
    def: "In a method, the value the method was called on. `&self` reads it, `&mut self` changes it, and `self` takes ownership of it.",
    see: ["method", "impl", "ownership"],
    rust: `struct Tank {
    litres: u32,
}

impl Tank {
    fn level(&self) -> u32 {
        self.litres
    }
}

fn main() {
    let t = Tank { litres: 40 };
    println!("{}", t.level());
}`,
    stdout: "40" },
  { id: "pub", term: "pub", kind: "keyword", ch: 16,
    def: "Makes an item visible outside its module. Items are private by default. `pub(crate)` makes an item visible across the whole crate.",
    see: ["mod", "crate", "e0603"], codes: ["E0603"],
    rust: `mod shop {
    pub fn open() -> String {
        String::from("open")
    }

    fn secret() -> u32 {
        1
    }
}

fn main() {
    println!("{}", shop::open());
}`,
    stdout: "open" },
  { id: "mod", term: "mod", kind: "keyword", ch: 16,
    def: "Declares a module: a named group of items. Its body can sit in the same file, or `mod name;` can load it from its own file.",
    see: ["pub", "crate", "use"],
    rust: `mod geometry {
    pub fn double(n: i32) -> i32 {
        n * 2
    }
}

fn main() {
    println!("{}", geometry::double(4));
}`,
    stdout: "8" },
  { id: "use", term: "use", kind: "keyword", ch: 16,
    def: "Brings a path into scope under a short name. After `use std::collections::HashMap;` you can write `HashMap` alone.",
    see: ["mod", "pub", "crate"],
    rust: `use std::collections::HashMap;

fn main() {
    let mut ages = HashMap::new();
    ages.insert("ana", 31);
    println!("{}", ages["ana"]);
}`,
    stdout: "31" },
  { id: "crate", term: "crate", kind: "keyword", ch: 16,
    def: "One unit of compilation: a library or a binary, rooted at `src/lib.rs` or `src/main.rs`. `crate::` starts a path at the root of the current crate.",
    see: ["mod", "use"],
    rust: `mod util {
    pub fn twice(n: i32) -> i32 {
        n * 2
    }
}

fn main() {
    println!("{}", crate::util::twice(21));
}`,
    stdout: "42" },
  { id: "super", term: "super", kind: "keyword", ch: 16,
    def: "`super::` starts a path at the parent module of the current module.",
    see: ["mod", "crate", "self"],
    rust: `mod outer {
    pub fn value() -> i32 {
        7
    }

    pub mod inner {
        pub fn parent_value() -> i32 {
            super::value() + 1
        }
    }
}

fn main() {
    println!("{}", outer::inner::parent_value());
}`,
    stdout: "8" },
  { id: "type", term: "type", kind: "keyword", ch: 14,
    def: "In a trait or an impl, `type Name = ...;` names an associated type, such as the `Item` of an iterator. Outside a trait, `type Name = Other;` makes an alias for another type.",
    see: ["trait", "iterator"],
    rust: `struct Countdown {
    n: u32,
}

impl Iterator for Countdown {
    type Item = u32;

    fn next(&mut self) -> Option<u32> {
        if self.n == 0 {
            None
        } else {
            self.n -= 1;
            Some(self.n + 1)
        }
    }
}

fn main() {
    let v: Vec<u32> = Countdown { n: 3 }.collect();
    println!("{v:?}");
}`,
    stdout: "[3, 2, 1]" },
  { id: "as", term: "as", kind: "keyword", ch: 3,
    def: "Converts a number to another number type, without an error. Going to a narrower integer keeps the low bits, so `300 as u8` is 44. A float is cut toward zero and clamped to the target's range. Use `From` or `TryFrom` when the conversion may lose data.",
    see: ["from", "tryfrom"],
    rust: `fn main() {
    let big: u16 = 300;
    let small = big as u8;
    println!("{small}");
}`,
    stdout: "44" },
  { id: "move-closure", term: "move (closures)", kind: "keyword", ch: 13,
    def: "Placed before a closure's bars, `move` makes the closure take its captured values by ownership instead of by reference.",
    see: ["closure", "capture", "move"],
    rust: `fn main() {
    let name = String::from("crab");
    let greet = move || println!("hi {name}");
    greet();
}`,
    stdout: "hi crab" },
  { id: "dyn", term: "dyn", kind: "keyword", ch: 14,
    def: "Marks a trait object: a value whose concrete type is hidden behind a pointer, such as `Box<dyn Trait>`. Method calls go through a table of function pointers.",
    see: ["trait-object", "dyn-compatibility", "box"],
    rust: `trait Speak {
    fn say(&self) -> String;
}

struct Dog;

impl Speak for Dog {
    fn say(&self) -> String {
        "woof".to_string()
    }
}

fn main() {
    let animals: Vec<Box<dyn Speak>> = vec![Box::new(Dog)];
    for a in &animals {
        println!("{}", a.say());
    }
}`,
    stdout: "woof" },
  { id: "where", term: "where", kind: "keyword", ch: 14,
    def: "Puts trait bounds after a signature instead of inside the angle brackets. It is easier to read when a function has several bounds.",
    see: ["trait-bound", "generic"],
    rust: `fn show<T>(item: T) -> String
where
    T: std::fmt::Display,
{
    format!("<{item}>")
}

fn main() {
    println!("{}", show(5));
}`,
    stdout: "<5>" },
  { id: "unsafe", term: "unsafe", kind: "keyword", ch: 21,
    def: "Marks code the compiler cannot check for you. Inside an `unsafe` block you may use five extra operations, such as dereferencing a raw pointer. The borrow checker and the type checker still run.",
    see: ["raw-pointer", "safety-comment", "e0133"], codes: ["E0133"],
    rust: `fn main() {
    let x = 5;
    let p = &x as *const i32;
    let y = unsafe { *p };
    println!("{y}");
}`,
    stdout: "5" },
  { id: "async", term: "async", kind: "keyword", ch: 19,
    def: "Marks a function or a block that returns a future. Nothing in it runs until something polls the future.",
    see: ["future", "await", "executor"],
    rust: `async fn double(n: u32) -> u32 {
    println!("running");
    n * 2
}

fn main() {
    let _pending = double(4);
    println!("created, not run");
}`,
    stdout: "created, not run" },
  { id: "await", term: ".await", kind: "keyword", ch: 19,
    def: "Pauses the current async function until the future finishes, and lets other tasks run in the meantime. It works only inside async code.",
    see: ["async", "future", "poll"],
    rust: `async fn double(n: u32) -> u32 {
    n * 2
}

async fn run() -> u32 {
    let a = double(4).await;
    a + 1
}

fn main() {
    let _future = run();
}` },

  /* ---------------------------------------------------------------- syntax */
  { id: "question-mark", term: "?", kind: "syntax", ch: 11,
    def: "After a `Result` or an `Option`, returns early on `Err` or `None`, and otherwise unwraps the value. An error is converted with `From` on the way out.",
    aka: "An exit ramp onto the error track",
    see: ["result", "from", "error"],
    rust: `fn parse_pair(a: &str, b: &str) -> Result<i32, std::num::ParseIntError> {
    let x: i32 = a.parse()?;
    let y: i32 = b.parse()?;
    Ok(x + y)
}

fn main() {
    println!("{:?}", parse_pair("2", "3"));
}`,
    stdout: "Ok(5)" },
  { id: "ref-shared", term: "&", kind: "syntax", ch: 7,
    def: "Borrows a value without taking it: `&x` is a shared reference. Any number of shared borrows may exist, and none of them may change the value.",
    aka: "The glasses",
    see: ["ref-mut", "borrow", "reference"],
    rust: `fn main() {
    let v = vec![1, 2, 3];
    let r = &v;
    println!("{}", r.len());
    println!("{:?}", v);
}`,
    stdout: "3\n[1, 2, 3]" },
  { id: "ref-mut", term: "&mut", kind: "syntax", ch: 7,
    def: "Borrows a value so you can change it: `&mut x`. While this borrow lives, no other borrow of `x` may exist, and `x` must be declared with `mut`.",
    aka: "The lock. Unlike a Mutex it never waits: a conflict is a compile error",
    see: ["ref-shared", "borrow", "e0499"], codes: ["E0499", "E0596"],
    rust: `fn main() {
    let mut v = vec![1];
    let r = &mut v;
    r.push(2);
    println!("{v:?}");
}`,
    stdout: "[1, 2]" },
  { id: "lifetime-param", term: "'a", kind: "syntax", ch: 15,
    def: "A lifetime parameter, written with an apostrophe. It names the relationship between references in a signature. It never makes a value live longer.",
    see: ["lifetime", "static-lifetime"],
    rust: `fn longer<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() >= y.len() { x } else { y }
}

fn main() {
    println!("{}", longer("crab", "ferris"));
}`,
    stdout: "ferris" },
  { id: "static-lifetime", term: "'static", kind: "syntax", ch: 15,
    def: "The lifetime that lasts for the whole program. String literals have type `&'static str`. A bound `T: 'static` means the type holds no borrows that end before the program does.",
    see: ["lifetime", "lifetime-param", "static"],
    rust: `fn main() {
    let name: &'static str = "ferris";
    println!("{name}");
}`,
    stdout: "ferris" },
  { id: "ranges", term: "a..b and a..=b", kind: "syntax", ch: 4,
    def: "A range. `a..b` runs from a up to but not including b. `a..=b` includes b. Ranges work in `for` loops and with iterator methods.",
    see: ["for", "iterator"],
    rust: `fn main() {
    let open: Vec<i32> = (1..4).collect();
    let closed: Vec<i32> = (1..=4).collect();
    println!("{open:?} {closed:?}");
}`,
    stdout: "[1, 2, 3] [1, 2, 3, 4]" },
  { id: "derive-attr", term: "#[derive(...)]", kind: "syntax", ch: 9,
    def: "An attribute that writes trait impls for you. `#[derive(Debug, Clone, PartialEq)]` above a struct writes those three impls from its fields.",
    see: ["debug", "clone", "partialeq", "default"],
    rust: `#[derive(Debug, Clone, PartialEq)]
struct Point {
    x: i32,
    y: i32,
}

fn main() {
    let a = Point { x: 1, y: 2 };
    let b = a.clone();
    println!("{:?} {}", b, a == b);
}`,
    stdout: "Point { x: 1, y: 2 } true" },
  { id: "test-attr", term: "#[test]", kind: "syntax", ch: 16,
    def: "Marks a function as a test. `cargo test` runs each one, and it passes unless it panics. Tests sit in a `#[cfg(test)]` module, which is built only for tests.",
    see: ["cargo-test", "panic"],
    rust: `fn double(n: i32) -> i32 {
    n * 2
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn doubles_a_number() {
        assert_eq!(double(2), 4);
    }
}` },
  { id: "wildcard", term: "_", kind: "syntax", ch: 4,
    def: "A pattern that matches anything without naming it. As a type, `_` asks the compiler to work out the type.",
    see: ["match", "pattern"],
    rust: `fn main() {
    let pair = (1, "two");
    let (n, _) = pair;
    println!("{n}");
}`,
    stdout: "1" },
  { id: "semicolon", term: ";", kind: "syntax", ch: 4,
    def: "Turns an expression into a statement, and throws its value away. A block that ends in a semicolon produces `()`, not the value of its last expression.",
    see: ["expression", "statement", "e0308"], codes: ["E0308"],
    rust: `fn plus_one(n: i32) -> i32 {
    n + 1;
}

fn main() {
    println!("{}", plus_one(1));
}`,
    check: "E0308" },
  { id: "println", term: "println!", kind: "syntax", ch: 1,
    def: "Prints a line. The format string is checked at compile time. `{}` shows a Display value, `{:?}` shows a Debug value, and `{name}` uses a variable.",
    see: ["display", "debug"],
    rust: `fn main() {
    let name = "Ferris";
    println!("hello, {name}! {:?}", name);
}`,
    stdout: "hello, Ferris! \"Ferris\"" },
  { id: "if-let", term: "if let", kind: "syntax", ch: 10,
    def: "Handles one pattern and ignores every other value: `if let Some(x) = value { ... }`.",
    see: ["match", "option", "while-let", "let-else"],
    rust: `fn main() {
    let first = "crab".chars().next();
    if let Some(c) = first {
        println!("starts with {c}");
    }
}`,
    stdout: "starts with c" },
  { id: "while-let", term: "while let", kind: "syntax", ch: 10,
    def: "Loops for as long as a pattern matches: `while let Some(top) = stack.pop() { ... }` runs until `pop` returns `None`.",
    see: ["if-let", "while", "option"],
    rust: `fn main() {
    let mut stack = vec![1, 2, 3];
    while let Some(top) = stack.pop() {
        println!("{top}");
    }
}`,
    stdout: "3\n2\n1" },
  { id: "let-else", term: "let ... else", kind: "syntax", ch: 10,
    def: "Binds a pattern, or runs the `else` block. The `else` block must leave the scope, with `return`, `break`, `continue` or `panic!`.",
    see: ["if-let", "match"],
    rust: `fn first_char(s: &str) -> char {
    let Some(c) = s.chars().next() else {
        return '?';
    };
    c
}

fn main() {
    println!("{}", first_char(""));
}`,
    stdout: "?" },
  { id: "closure-syntax", term: "|x| ...", kind: "syntax", ch: 13,
    def: "A closure: the parameters go between two bars, then the body. `|x| x * 2` is a closure that doubles its argument.",
    see: ["closure", "capture", "adapter"],
    rust: `fn main() {
    let double = |x: i32| x * 2;
    println!("{}", double(21));
}`,
    stdout: "42" },
  { id: "macro-rules", term: "macro_rules!", kind: "syntax", ch: 21,
    def: "Defines a declarative macro. Its arms match pieces of syntax such as `$x:expr`, and the expansion writes the code for each match.",
    rust: `macro_rules! square {
    ($x:expr) => {
        $x * $x
    };
}

fn main() {
    println!("{}", square!(4));
}`,
    stdout: "16" },
  /* ---------------------------------------------------------------- concepts: ownership, memory, borrowing */
  { id: "ownership", term: "Ownership", kind: "concept", ch: 6,
    def: "The rule that every value has exactly one owner. When the owner goes out of scope, the value is dropped and its heap memory is freed.",
    aka: "The Leash",
    see: ["move", "drop", "borrow-checker", "copy"], codes: ["E0382"],
    rust: `fn count(text: String) -> usize {
    text.len()
}

fn main() {
    let s = String::from("crab");
    let len = count(s);
    println!("{len}");
}`,
    stdout: "4" },
  { id: "move", term: "Move", kind: "concept", ch: 6,
    def: "Handing a value to a new owner. After a move, the old name cannot be used. For a type that is not Copy, `let b = a;` moves the value.",
    see: ["ownership", "copy", "clone", "e0382"], codes: ["E0382"],
    rust: `fn main() {
    let a = String::from("hi");
    let b = a;
    println!("{b}");
}`,
    stdout: "hi" },
  { id: "drop", term: "Drop (scope end)", kind: "concept", ch: 6,
    def: "What happens when an owner's scope ends: the value is cleaned up and its heap memory is freed. Values are dropped in the reverse order they were declared.",
    see: ["scope", "ownership", "drop-trait"],
    rust: `fn main() {
    let len = {
        let s = String::from("heap text");
        s.len()
    };
    println!("{len}");
}`,
    stdout: "9" },
  { id: "scope", term: "Scope", kind: "concept", ch: 2,
    def: "The part of the code where a name is valid, usually the block that declares it. When the block ends, its names go away.",
    see: ["binding", "drop", "let"],
    rust: `fn main() {
    let x = 1;
    {
        let y = 2;
        println!("{}", x + y);
    }
}`,
    stdout: "3" },
  { id: "binding", term: "Binding", kind: "concept", ch: 2,
    def: "A name tied to a value by `let`. `let n = 5;` binds the name `n` to the value 5.",
    see: ["let", "mut", "shadowing", "scope"],
    rust: `fn main() {
    let total = 2 + 3;
    let doubled = total * 2;
    println!("{doubled}");
}`,
    stdout: "10" },
  { id: "shadowing", term: "Shadowing", kind: "concept", ch: 2,
    def: "A second `let` with the same name. It makes a new binding that hides the old one, and the new binding may have a different type.",
    see: ["binding", "let", "scope"],
    rust: `fn main() {
    let input = "42";
    let input: u32 = input.parse().unwrap();
    println!("{}", input + 1);
}`,
    stdout: "43" },
  { id: "stack", term: "Stack", kind: "concept", ch: 5,
    def: "Memory for values whose size is known at compile time, and for one frame per function call. Making room on the stack is cheap.",
    see: ["heap", "box", "unit-type"],
    rust: `fn main() {
    let a: [u8; 4] = [1, 2, 3, 4];
    println!("{}", a.len());
}`,
    stdout: "4" },
  { id: "heap", term: "Heap", kind: "concept", ch: 5,
    def: "Memory asked for at runtime, for data whose size is not known in advance. You get a pointer back, and exactly one owner must free the block.",
    aka: "Alloc hands out the plots",
    see: ["stack", "box", "string"],
    rust: `fn main() {
    let b = Box::new(5);
    println!("{}", *b + 1);
}`,
    stdout: "6" },
  { id: "borrow", term: "Borrow", kind: "concept", ch: 7,
    def: "A way to use a value without owning it. A shared borrow reads, and an exclusive borrow changes. The owner stays usable, and nothing is freed when a borrow ends.",
    see: ["reference", "ref-shared", "ref-mut", "borrow-checker", "nll"],
    rust: `fn main() {
    let s = String::from("crab");
    let a = &s;
    let b = &s;
    println!("{a} {b}");
}`,
    stdout: "crab crab" },
  { id: "reference", term: "Reference", kind: "concept", ch: 7,
    def: "A value that points at another value without owning it. The type `&T` is a shared reference, and `&mut T` is an exclusive one.",
    see: ["borrow", "ref-shared"],
    rust: `fn main() {
    let x = 5;
    let r = &x;
    println!("{}", *r + 1);
}`,
    stdout: "6" },
  { id: "borrow-checker", term: "Borrow checker", kind: "concept", ch: 6,
    def: "The part of the compiler that checks ownership, moves, borrows, mutability and lifetimes before the program runs. In this course it is the Inspector. Its errors include E0382, E0499, E0502 and E0505.",
    aka: "The Inspector",
    see: ["ownership", "borrow", "nll", "e0382"], codes: ["E0382", "E0499", "E0502", "E0505", "E0506", "E0596", "E0597"],
    rust: `fn main() {
    let s = String::from("hi");
    let t = s;
    println!("{s} {t}");
}`,
    check: "E0382" },
  { id: "nll", term: "NLL (non-lexical lifetimes)", kind: "concept", ch: 7,
    def: "The rule that a borrow lasts until its last use, not until the end of the scope. That is why this program compiles.",
    see: ["borrow", "borrow-checker", "lifetime"],
    rust: `fn main() {
    let mut s = String::from("a");
    let r = &s;
    println!("{r}");
    s.push('b');
    println!("{s}");
}`,
    stdout: "a\nab" },
  { id: "lifetime", term: "Lifetime", kind: "concept", ch: 15,
    def: "The span of code where a reference must stay valid. The compiler infers most lifetimes. An annotation such as `'a` describes how references relate. It never makes a value live longer.",
    aka: "Tick, the hourglass",
    see: ["lifetime-param", "static-lifetime", "nll", "e0597"], codes: ["E0597", "E0716", "E0106"],
    rust: `fn main() {
    let r;
    {
        let x = 5;
        r = &x;
    }
    println!("{r}");
}`,
    check: "E0597" },
  { id: "slice", term: "Slice", kind: "concept", ch: 8,
    def: "A borrowed view of part of a sequence: a pointer plus a length. `&s[0..2]` is a slice of a string, and `&v[1..]` is a slice of a Vec.",
    see: ["str-ref", "string", "utf-8"],
    rust: `fn main() {
    let s = String::from("crab");
    let part = &s[0..2];
    println!("{part}");
}`,
    stdout: "cr" },
  { id: "utf-8", term: "UTF-8", kind: "concept", ch: 8,
    def: "The encoding Rust uses for text. A character takes one to four bytes. A byte index is not always a character index, so you cannot index a string with `s[0]`.",
    aka: "Glyph, the caterpillar with one segment per byte",
    see: ["string", "str-ref", "slice"],
    rust: `fn main() {
    let s = "é";
    println!("{} {}", s.len(), s.chars().count());
}`,
    stdout: "2 1" },
  { id: "panic", term: "Panic", kind: "concept", ch: 11,
    def: "A runtime stop caused by a bug, such as an index out of range, an overflow in a debug build, or `unwrap` on `None`. The thread unwinds, dropping values on the way up, and then ends.",
    see: ["result", "option"],
    rust: `fn main() {
    let missing: Option<u8> = None;
    println!("before");
    missing.unwrap();
    println!("after");
}`,
    stdout: "before",
    check: "panic" },
  { id: "expression", term: "Expression", kind: "concept", ch: 4,
    def: "Code that produces a value, such as `2 + 2`, an `if`, a `match` or a block. A block's value is its last expression, when that line has no semicolon.",
    see: ["statement", "semicolon", "return"],
    rust: `fn main() {
    let n = { 2 + 2 };
    println!("{n}");
}`,
    stdout: "4" },
  { id: "statement", term: "Statement", kind: "concept", ch: 4,
    def: "A line that does something and produces no value, such as `let x = 1;`. Most statements end with a semicolon. A block-like statement, such as an `if` or a `match`, does not.",
    see: ["expression", "semicolon"],
    rust: `fn main() {
    let x = 1;
    let y = {
        let x = 2;
        x * 3
    };
    println!("{x} {y}");
}`,
    stdout: "1 6" },
  /* ---------------------------------------------------------------- concepts: patterns, types, traits, modules */
  { id: "pattern", term: "Pattern", kind: "concept", ch: 10,
    def: "A shape a value is compared with, and it can name parts of the value along the way. Examples: `Some(x)`, `(a, b)`, `1..=5`, `_`.",
    see: ["match", "if-let", "wildcard", "exhaustive"],
    rust: `fn main() {
    let (x, y) = (3, 9);
    match (x, y) {
        (3, n) => println!("x is 3 and y is {n}"),
        _ => println!("something else"),
    }
}`,
    stdout: "x is 3 and y is 9" },
  { id: "exhaustive", term: "Exhaustive", kind: "concept", ch: 10,
    def: "A `match` is exhaustive when every possible value fits some arm. The compiler rejects a `match` that leaves a case out, with E0004.",
    aka: "Octo: every variant needs an arm",
    see: ["match", "pattern", "e0004"], codes: ["E0004"],
    rust: `enum Light {
    Red,
    Amber,
    Green,
}

fn main() {
    let l = Light::Red;
    match l {
        Light::Red => println!("stop"),
        Light::Green => println!("go"),
    }
}`,
    check: "E0004" },
  { id: "method", term: "Method", kind: "concept", ch: 9,
    def: "A function declared in an `impl` block that takes `self`, `&self` or `&mut self` first. You call it with a dot: `value.method()`. A function with no `self` is an associated function, called as `Type::name()`.",
    see: ["impl", "self", "fn"],
    rust: `struct Square(u32);

impl Square {
    fn area(&self) -> u32 {
        self.0 * self.0
    }
}

fn main() {
    println!("{}", Square(4).area());
}`,
    stdout: "16" },
  { id: "newtype", term: "Newtype", kind: "concept", ch: 9,
    def: "A tuple struct with one field, such as `struct Meters(f64);`. It holds the same data as the field but is a different type, so the compiler keeps the two apart.",
    see: ["struct", "from"],
    rust: `struct Meters(f64);
struct Feet(f64);

fn main() {
    let m = Meters(3.0);
    let f = Feet(9.8);
    println!("{} {}", m.0, f.0);
}`,
    stdout: "3 9.8" },
  { id: "module", term: "Module", kind: "concept", ch: 16,
    def: "A named group of items inside a crate. Modules control privacy and give items their paths, such as `shop::open`. A module can live in its own file.",
    see: ["mod", "pub", "crate"] },
  { id: "trait", term: "trait", kind: "keyword", ch: 14,
    def: "Declares a set of methods that a type can promise to provide. Each `impl Summary for Type` is the promise, and the orphan rule says where that `impl` may be written.",
    see: ["impl", "trait-bound", "dyn", "orphan-rule", "e0046"], codes: ["E0046"],
    rust: `trait Summary {
    fn summary(&self) -> String;
}

struct Post {
    title: String,
}

impl Summary for Post {
    fn summary(&self) -> String {
        format!("post: {}", self.title)
    }
}

fn main() {
    let p = Post { title: String::from("Rust") };
    println!("{}", p.summary());
}`,
    stdout: "post: Rust" },
  { id: "trait-bound", term: "Trait bound", kind: "concept", ch: 14,
    def: "A requirement on a type parameter. `T: Summary` means T must implement the trait Summary. Without the bound, a generic body cannot call the trait's methods.",
    see: ["generic", "trait", "where", "e0277"], codes: ["E0277", "E0599", "E0369"],
    rust: `fn show<T>(item: T) -> String {
    format!("{item}")
}

fn main() {
    println!("{}", show(5));
}`,
    check: "E0277" },
  { id: "generic", term: "Generic", kind: "concept", ch: 14,
    def: "Code written once for any type that meets its bounds. Type parameters go in angle brackets, such as `<T>`. `Option<T>` and `Vec<T>` are generic types.",
    aka: "The Press stamps copies",
    see: ["trait-bound", "monomorphization", "where"],
    rust: `fn first<T: Copy>(items: &[T]) -> T {
    items[0]
}

fn main() {
    println!("{}", first(&[7, 8]));
}`,
    stdout: "7" },
  { id: "monomorphization", term: "Monomorphization", kind: "concept", ch: 14,
    def: "The compiler makes one specialized copy of a generic function for each concrete type it is used with. The calls are direct, so generics cost nothing at runtime, but the binary holds more code.",
    aka: "The Press stamps one copy per type",
    see: ["generic", "trait-object"],
    rust: `fn id<T>(x: T) -> T {
    x
}

fn main() {
    println!("{} {}", id(1), id("two"));
}`,
    stdout: "1 two" },
  { id: "trait-object", term: "Trait object", kind: "concept", ch: 14,
    def: "A value whose concrete type is unknown, used through `dyn Trait` behind a pointer. It is one copy of the calling code plus a pointer to a table of methods, the vtable.",
    see: ["dyn", "dyn-compatibility", "monomorphization", "box"],
    rust: `fn main() {
    let x: &dyn std::fmt::Debug = &5;
    println!("{x:?}");
}`,
    stdout: "5" },
  { id: "dyn-compatibility", term: "Dyn compatibility", kind: "concept", ch: 14,
    def: "A trait can be used as `dyn Trait` only if the compiler can build one table of its methods for it. A method that returns `Self`, takes a type parameter, or takes `Self` in an argument breaks that, and so does an associated constant. A method can be excluded with `where Self: Sized`. Otherwise the compiler reports E0038.",
    see: ["trait-object", "dyn", "e0038"], codes: ["E0038"],
    rust: `trait Cloner {
    fn dup(&self) -> Self;
}

struct A;

impl Cloner for A {
    fn dup(&self) -> Self {
        A
    }
}

fn main() {
    let _x: Box<dyn Cloner> = Box::new(A);
}`,
    check: "E0038" },
  { id: "orphan-rule", term: "Orphan rule", kind: "concept", ch: 14,
    def: "You may implement a trait for a type only when the trait or the type is defined in your crate. A local type that appears as a trait parameter, as in `impl From<Mine> for Vec<u8>`, counts as yours too. The rule stops two crates from writing conflicting impls. A newtype is the usual way around it.",
    see: ["trait", "newtype", "e0117"], codes: ["E0117"],
    rust: `impl std::fmt::Display for Vec<u8> {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        write!(f, "bytes")
    }
}

fn main() {}`,
    check: "E0117" },
  /* ---------------------------------------------------------------- concepts: closures and iterators */
  { id: "closure", term: "Closure", kind: "concept", ch: 13,
    def: "A small anonymous function that can use variables from where it was written. It captures them by reference, by mutable reference or by value, depending on how its body uses them.",
    aka: "Clo, the crab with a backpack",
    see: ["capture", "closure-syntax", "fn-trait", "move-closure"],
    rust: `fn main() {
    let factor = 3;
    let times = |n: i32| n * factor;
    println!("{}", times(4));
}`,
    stdout: "12" },
  { id: "capture", term: "Capture", kind: "concept", ch: 13,
    def: "A variable a closure uses from its surroundings. The closure keeps a reference to it, or takes it, depending on what the body does with it.",
    see: ["closure", "fn-trait", "fnmut", "fnonce", "move-closure"],
    rust: `fn main() {
    let mut count = 0;
    let mut bump = || count += 1;
    bump();
    bump();
    println!("{count}");
}`,
    stdout: "2" },
  { id: "adapter", term: "Iterator adapter", kind: "concept", ch: 13,
    def: "A method on an iterator that returns a new iterator, such as `map`, `filter` or `take`. Adapters do no work until a consumer such as `collect`, `sum` or `count` pulls items through them.",
    see: ["iterator", "lazy", "closure"],
    rust: `fn main() {
    let n = (1..10).filter(|x| x % 2 == 0).count();
    println!("{n}");
}`,
    stdout: "4" },
  { id: "lazy", term: "Lazy iterator", kind: "concept", ch: 13,
    def: "An iterator chain does nothing by itself. Each item is produced only when a consumer asks for it, so the work happens one item at a time.",
    see: ["adapter", "iterator", "collect"],
    rust: `fn main() {
    let it = (1..4).map(|n| {
        println!("visit {n}");
        n * 2
    });
    println!("built");
    let v: Vec<i32> = it.collect();
    println!("{v:?}");
}`,
    stdout: "built\nvisit 1\nvisit 2\nvisit 3\n[2, 4, 6]" },
  /* ---------------------------------------------------------------- concepts: smart pointers, concurrency, async */
  { id: "smart-pointer", term: "Smart pointer", kind: "concept", ch: 17,
    def: "A type that owns the value it points to and adds behavior. `Box` stores it on the heap and `Rc` counts its owners; both implement `Deref` and `Drop`. `RefCell` is not a pointer, but it is used with `Rc` for borrows that are checked at runtime.",
    see: ["box", "rc", "refcell", "deref", "drop-trait"],
    rust: `fn main() {
    let b = Box::new(String::from("heap"));
    println!("{}", b.len());
}`,
    stdout: "4" },
  { id: "interior-mutability", term: "Interior mutability", kind: "concept", ch: 17,
    def: "Changing a value through a shared reference. `RefCell` does it with the borrow rules checked at runtime, and a conflict panics. `Mutex` does the same job across threads and waits instead of panicking.",
    aka: "The Night Guard checks borrows at runtime",
    see: ["refcell", "mutex", "panic"],
    rust: `fn main() {
    let c = std::cell::RefCell::new(1);
    *c.borrow_mut() += 1;
    println!("{}", *c.borrow());
}`,
    stdout: "2" },
  { id: "thread", term: "Thread", kind: "concept", ch: 18,
    def: "An independent path of execution. `thread::spawn` starts one and returns a handle. Calling `join` on the handle waits for the thread and gives back its result.",
    see: ["channel", "send", "sync", "arc", "mutex"],
    rust: `use std::thread;

fn main() {
    let h = thread::spawn(|| 6 * 7);
    println!("{}", h.join().unwrap());
}`,
    stdout: "42" },
  { id: "channel", term: "Channel", kind: "concept", ch: 18,
    def: "A queue that moves values from senders to one receiver. `mpsc::channel` returns a sender and a receiver. The receiver stops when every sender is dropped.",
    see: ["bounded-channel", "thread", "send"],
    rust: `use std::sync::mpsc;

fn main() {
    let (tx, rx) = mpsc::channel();
    tx.send(String::from("job")).unwrap();
    println!("{}", rx.recv().unwrap());
}`,
    stdout: "job" },
  { id: "bounded-channel", term: "Bounded channel", kind: "concept", ch: 18,
    def: "A channel with room for a fixed number of messages. When it is full, `send` waits, so a fast producer cannot fill memory without limit. `sync_channel(n)` makes one.",
    see: ["channel", "backpressure", "semaphore"],
    rust: `use std::sync::mpsc;

fn main() {
    let (tx, rx) = mpsc::sync_channel::<u8>(1);
    tx.try_send(1).unwrap();
    println!("{}", tx.try_send(2).is_err());
    println!("{}", rx.recv().unwrap());
}`,
    stdout: "true\n1" },
  { id: "executor", term: "Executor", kind: "concept", ch: 19,
    def: "The loop that polls futures. It runs each task when it is ready and waits when none is. The tokio runtime is an executor.",
    aka: "The Waiter, who returns to an order when its bell rings",
    see: ["future", "waker", "poll", "tokio"] },
  { id: "waker", term: "Waker", kind: "concept", ch: 19,
    def: "A handle that a pending future leaves with whatever it is waiting for. When that event happens, the waker tells the executor to poll the future again.",
    aka: "The bell",
    see: ["future", "executor", "poll"] },
  { id: "cancellation-safety", term: "Cancellation safety", kind: "concept", ch: 19,
    def: "A future is cancelled when it is dropped, and it can be dropped at any `.await`. A cancel-safe future loses no data when that happens.",
    see: ["future", "await"] },
  { id: "backpressure", term: "Backpressure", kind: "concept", ch: 19,
    def: "A slow consumer slows its producer down. Bounded queues and semaphores make the sender wait, so work does not pile up in memory.",
    see: ["bounded-channel", "semaphore", "channel"] },
  { id: "server-sent-events", term: "Server-sent events (SSE)", kind: "concept", ch: 19,
    def: "A one-way stream over HTTP. The server sends `data:` lines, one event at a time, and the client reads each one as it arrives.",
    see: ["future", "backpressure"] },
  /* ---------------------------------------------------------------- concepts: web, macros, unsafe, errors */
  { id: "middleware", term: "Middleware", kind: "concept", ch: 20,
    def: "Code that runs around every request, before and after the handler, such as logging, tracing or authentication. In axum these are layers.",
    see: ["handler", "extractor", "axum"] },
  { id: "extractor", term: "Extractor", kind: "concept", ch: 20,
    def: "A type a handler takes as an argument, such as `Json<T>` or `State<T>`. The framework fills it from the request. If an extractor fails, the handler never runs.",
    see: ["handler", "middleware", "serde"] },
  { id: "handler", term: "Handler", kind: "concept", ch: 20,
    def: "An async function that takes extractors as arguments and returns something that implements `IntoResponse`. A route sends each matching request to one handler.",
    see: ["extractor", "intoresponse", "middleware"] },
  { id: "safety-comment", term: "SAFETY comment", kind: "concept", ch: 21,
    def: "A comment written just above an `unsafe` block. It explains why the code cannot break the rules it bypasses. Reviewers look for one on every block.",
    see: ["unsafe", "raw-pointer"],
    rust: `fn main() {
    let x = 5;
    let p = &x as *const i32;
    // SAFETY: p points at x, which is alive for this whole expression.
    let y = unsafe { *p };
    println!("{y}");
}`,
    stdout: "5" },
  /* ---------------------------------------------------------------- std types */
  { id: "vec", term: "Vec<T>", kind: "type", ch: 12,
    def: "A growable list. Its items sit in one heap buffer. `push` adds an item, `len` counts them, and `v[i]` panics when `i` is out of range. `v.get(i)` returns an `Option` instead.",
    see: ["heap", "generic", "option", "slice"],
    rust: `fn main() {
    let mut v = vec![1];
    v.push(2);
    println!("{:?} {}", v, v.len());
}`,
    stdout: "[1, 2] 2" },
  { id: "string", term: "String", kind: "type", ch: 8,
    def: "Owned, growable text in a heap buffer. Use a `String` when your code owns the text, and a `&str` when it only looks at it.",
    see: ["str-ref", "utf-8", "slice", "heap"],
    rust: `fn main() {
    let mut s = String::from("hi");
    s.push_str("!");
    println!("{s}");
}`,
    stdout: "hi!" },
  { id: "str-ref", term: "&str", kind: "type", ch: 8,
    def: "A borrowed view of UTF-8 text: a pointer and a length, with no ownership. A string literal such as \"hi\" has the type `&'static str`.",
    see: ["string", "slice", "utf-8"],
    rust: `fn main() {
    let name: &str = "Oxi";
    println!("{}", name.len());
}`,
    stdout: "3" },
  { id: "option", term: "Option<T>", kind: "type", ch: 10,
    def: "Either `Some(value)` or `None`. It is how Rust says a value may be missing. You must handle both cases before you can use the value.",
    aka: "A box that may be empty",
    see: ["result", "if-let", "e0308"],
    rust: `fn main() {
    let v = [4, 9];
    println!("{:?}", v.first());
    let none: Option<i32> = None;
    println!("{}", none.unwrap_or(0));
}`,
    stdout: "Some(4)\n0" },
  { id: "result", term: "Result<T, E>", kind: "type", ch: 11,
    def: "Either `Ok(value)` on success or `Err(error)` on failure. A function that can fail returns a `Result`, so its signature says so.",
    aka: "The Switchman sends Err cars off the line",
    see: ["question-mark", "option", "error", "panic"],
    rust: `fn half(n: i32) -> Result<i32, String> {
    if n % 2 == 0 {
        Ok(n / 2)
    } else {
        Err(format!("{n} is odd"))
    }
}

fn main() {
    println!("{:?}", half(3));
}`,
    stdout: "Err(\"3 is odd\")" },
  { id: "box", term: "Box<T>", kind: "type", ch: 5,
    def: "One owned value stored on the heap, behind a pointer whose size is fixed. Use a `Box` for recursive types and for trait objects.",
    see: ["heap", "smart-pointer", "trait-object", "e0072"], codes: ["E0072"],
    rust: `fn main() {
    let b = Box::new(5);
    println!("{}", *b + 1);
}`,
    stdout: "6" },
  { id: "rc", term: "Rc<T>", kind: "type", ch: 17,
    def: "Shared ownership inside one thread. Many owners may hold the value, but only read it. `Rc::clone` adds one to the count, and the value is dropped when the count reaches zero.",
    see: ["weak", "arc", "refcell", "smart-pointer"],
    rust: `fn main() {
    let a = std::rc::Rc::new(String::from("x"));
    let _b = std::rc::Rc::clone(&a);
    println!("{}", std::rc::Rc::strong_count(&a));
}`,
    stdout: "2" },
  { id: "weak", term: "Weak<T>", kind: "type", ch: 17,
    def: "A handle that does not keep the value alive. `upgrade` returns `Some(Rc)` while the value exists and `None` after it is gone. Use it to break reference cycles.",
    see: ["rc", "smart-pointer"],
    rust: `fn main() {
    let strong = std::rc::Rc::new(1);
    let weak: std::rc::Weak<i32> = std::rc::Rc::downgrade(&strong);
    drop(strong);
    println!("{:?}", weak.upgrade());
}`,
    stdout: "None" },
  { id: "refcell", term: "RefCell<T>", kind: "type", ch: 17,
    def: "Holds a value and checks the borrow rules at runtime. `borrow` gives shared access and `borrow_mut` gives exclusive access. A conflict panics, and `try_borrow_mut` returns an error instead.",
    aka: "The Night Guard, with a flashlight",
    see: ["interior-mutability", "rc", "panic"],
    rust: `fn main() {
    let c = std::cell::RefCell::new(5);
    let _r = c.borrow();
    println!("{}", c.try_borrow_mut().is_err());
}`,
    stdout: "true" },
  { id: "arc", term: "Arc<T>", kind: "type", ch: 18,
    def: "`Rc` with atomic counting, so it can be shared between threads. `Arc::clone` adds one owner, and the value is freed when the last one is dropped.",
    see: ["rc", "mutex", "thread", "send"],
    rust: `use std::sync::Arc;
use std::thread;

fn main() {
    let n = Arc::new(10);
    let m = Arc::clone(&n);
    let h = thread::spawn(move || *m + 1);
    println!("{}", h.join().unwrap());
}`,
    stdout: "11" },
  { id: "mutex", term: "Mutex<T>", kind: "type", ch: 18,
    def: "A lock around a value. `lock` waits until the lock is free and returns a guard. The lock is released when the guard is dropped, so keep the time it is held short.",
    aka: "The Keeper, who holds the only key",
    see: ["arc", "rwlock", "interior-mutability"],
    rust: `use std::sync::Mutex;

fn main() {
    let m = Mutex::new(0);
    *m.lock().unwrap() += 5;
    println!("{}", *m.lock().unwrap());
}`,
    stdout: "5" },
  { id: "rwlock", term: "RwLock<T>", kind: "type", ch: 18,
    def: "A lock that allows many readers, or one writer, at a time. It suits data that is read far more often than it is written.",
    see: ["mutex", "arc"],
    rust: `use std::sync::RwLock;

fn main() {
    let lock = RwLock::new(String::from("v1"));
    {
        let a = lock.read().unwrap();
        let b = lock.read().unwrap();
        println!("{} {}", *a, *b);
    }
    lock.write().unwrap().push_str("-2");
    println!("{}", *lock.read().unwrap());
}`,
    stdout: "v1 v1\nv1-2" },
  { id: "atomic", term: "AtomicUsize", kind: "type", ch: 18,
    def: "An integer that threads can change without a lock. Each operation is indivisible. `fetch_add` adds to the value and returns the old one.",
    see: ["mutex", "arc", "send"],
    rust: `use std::sync::atomic::{AtomicUsize, Ordering};

fn main() {
    let hits = AtomicUsize::new(0);
    hits.fetch_add(2, Ordering::SeqCst);
    println!("{}", hits.load(Ordering::SeqCst));
}`,
    stdout: "2" },
  { id: "hashmap", term: "HashMap<K, V>", kind: "type", ch: 12,
    def: "A map from keys to values, with fast lookup. The order of its items is not promised, so sort them before you print them.",
    see: ["hashset", "btreemap", "option"],
    rust: `fn main() {
    let mut m = std::collections::HashMap::new();
    m.insert("a", 1);
    *m.entry("a").or_insert(0) += 5;
    println!("{}", m["a"]);
}`,
    stdout: "6" },
  { id: "hashset", term: "HashSet<T>", kind: "type", ch: 12,
    def: "A set that holds each value once. `insert` returns `false` when the value was already there.",
    aka: "The Bouncer, who lets each value in once",
    see: ["hashmap", "btreemap"],
    rust: `fn main() {
    let mut s = std::collections::HashSet::new();
    println!("{} {}", s.insert(1), s.insert(1));
}`,
    stdout: "true false" },
  { id: "btreemap", term: "BTreeMap<K, V>", kind: "type", ch: 12,
    def: "A map that keeps its keys in sorted order. Use it when you need the keys in order, or a range of them.",
    see: ["hashmap", "hashset"],
    rust: `fn main() {
    let mut m = std::collections::BTreeMap::new();
    m.insert("b", 2);
    m.insert("a", 1);
    println!("{:?}", m);
}`,
    stdout: "{\"a\": 1, \"b\": 2}" },
  { id: "vecdeque", term: "VecDeque<T>", kind: "type", ch: 12,
    def: "A double-ended queue. Pushing and popping at either end are both fast.",
    see: ["vec"],
    rust: `fn main() {
    let mut q = std::collections::VecDeque::new();
    q.push_back(1);
    q.push_front(0);
    println!("{:?}", q);
}`,
    stdout: "[0, 1]" },
  { id: "unit-type", term: "Unit type ()", kind: "type", ch: 4,
    def: "The type with exactly one value, also written `()`. A block that ends in a semicolon, and a function with no return type, produce it.",
    see: ["statement", "semicolon", "expression"],
    rust: `fn main() {
    let u: () = ();
    println!("{:?}", u);
}`,
    stdout: "()" },
  { id: "raw-pointer", term: "Raw pointer", kind: "type", ch: 21,
    def: "A pointer written `*const T` or `*mut T`. It is not checked by the borrow checker. It can be null or dangling, and dereferencing it needs `unsafe`.",
    see: ["unsafe", "reference", "safety-comment"],
    rust: `fn main() {
    let x = 5;
    let p = &x as *const i32;
    println!("{}", unsafe { *p });
}`,
    stdout: "5" },
  { id: "semaphore", term: "Semaphore", kind: "type", ch: 19,
    def: "A counter of permits. A task takes a permit before it works and returns it afterwards, so only a fixed number of tasks run at once. `tokio::sync::Semaphore` is the async version.",
    see: ["backpressure", "bounded-channel", "tokio"] },
  /* ---------------------------------------------------------------- traits */
  { id: "copy", term: "Copy", kind: "trait", ch: 6,
    def: "Types whose values are duplicated on assignment instead of moved. Numbers, `bool`, `char` and shared references are `Copy`. A type can derive `Copy` only when every field is `Copy`.",
    see: ["move", "clone", "e0204"], codes: ["E0204"],
    rust: `fn main() {
    let a = 5;
    let b = a;
    println!("{a} {b}");
}`,
    stdout: "5 5" },
  { id: "clone", term: "Clone", kind: "trait", ch: 6,
    def: "Makes an explicit copy of a value with `.clone()`. The copy can be expensive: cloning a `String` allocates a new buffer.",
    see: ["copy", "move", "ownership"],
    rust: `fn main() {
    let a = String::from("hi");
    let b = a.clone();
    println!("{a} {b}");
}`,
    stdout: "hi hi" },
  { id: "drop-trait", term: "Drop", kind: "trait", ch: 17,
    def: "A trait with one method, `drop`, that runs when a value goes out of scope. You cannot call that method yourself. To end a value early, call the function `drop(value)`.",
    see: ["drop", "smart-pointer"],
    rust: `struct Note(&'static str);

impl Drop for Note {
    fn drop(&mut self) {
        println!("drop {}", self.0);
    }
}

fn main() {
    let _a = Note("a");
    let b = Note("b");
    drop(b);
    println!("end");
}`,
    stdout: "drop b\nend\ndrop a" },
  { id: "deref", term: "Deref", kind: "trait", ch: 17,
    def: "The trait that lets a smart pointer act like the value it holds. The `*` operator and method calls go through it.",
    see: ["smart-pointer", "box", "reference"],
    rust: `fn main() {
    let b = Box::new(7);
    let n: i32 = *b;
    println!("{n}");
}`,
    stdout: "7" },
  { id: "iterator", term: "Iterator", kind: "trait", ch: 13,
    def: "A trait with one required method, `next`, which returns the next item as an `Option`. Adapters such as `map` and `filter` are built on it, and every loop over a collection uses it.",
    see: ["adapter", "lazy", "collect", "type"],
    rust: `fn main() {
    let v: Vec<i32> = (1..=3).map(|n| n * 10).collect();
    println!("{v:?}");
}`,
    stdout: "[10, 20, 30]" },
  { id: "fn-trait", term: "Fn", kind: "trait", ch: 13,
    def: "The trait of a closure that only reads its captures. Every `Fn` closure is also an `FnMut`, and every `FnMut` is also an `FnOnce`. It can be called again and again.",
    see: ["fnmut", "fnonce", "capture", "closure"],
    rust: `fn call<F: Fn() -> i32>(f: F) -> i32 {
    f()
}

fn main() {
    let x = 4;
    println!("{}", call(|| x * 2));
}`,
    stdout: "8" },
  { id: "fnmut", term: "FnMut", kind: "trait", ch: 13,
    def: "The trait of a closure that changes a capture. It can be called many times, but calling it needs a `mut` binding. Every `Fn` closure also implements it.",
    see: ["fn-trait", "fnonce", "capture"],
    rust: `fn twice<F: FnMut()>(mut f: F) {
    f();
    f();
}

fn main() {
    let mut n = 0;
    twice(|| n += 1);
    println!("{n}");
}`,
    stdout: "2" },
  { id: "fnonce", term: "FnOnce", kind: "trait", ch: 13,
    def: "The trait of a closure that moves a capture out of its body. A bound `F: FnOnce()` promises only one call. Every `FnMut` and `Fn` closure also implements `FnOnce`, so the bound accepts closures that can be called many times.",
    see: ["fn-trait", "fnmut", "move-closure"],
    rust: `fn once<F: FnOnce() -> String>(f: F) -> String {
    f()
}

fn main() {
    let s = String::from("moved");
    println!("{}", once(move || s));
}`,
    stdout: "moved" },
  { id: "display", term: "Display", kind: "trait", ch: 14,
    def: "The trait behind `{}` in a format string. There is no default way to print a struct, so you write the `fmt` method yourself.",
    see: ["debug", "println", "trait"],
    rust: `struct Crab(u8);

impl std::fmt::Display for Crab {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        write!(f, "crab with {} claws", self.0)
    }
}

fn main() {
    println!("{}", Crab(2));
}`,
    stdout: "crab with 2 claws" },
  { id: "debug", term: "Debug", kind: "trait", ch: 9,
    def: "The trait behind `{:?}` in a format string. It is for programmers, not for end users. `#[derive(Debug)]` writes it for you.",
    see: ["display", "derive-attr", "println"],
    rust: `#[derive(Debug)]
struct P {
    x: i32,
}

fn main() {
    println!("{:?}", P { x: 1 });
}`,
    stdout: "P { x: 1 }" },
  { id: "from", term: "From", kind: "trait", ch: 3,
    def: "Converts a value into your type when the conversion cannot lose data. Writing `impl From<A> for B` gives `A` an `Into<B>` for free, so `let b: B = a.into();` works.",
    see: ["into", "tryfrom", "as", "newtype"],
    rust: `fn main() {
    let n = u32::from(7u8);
    println!("{n}");
}`,
    stdout: "7" },
  { id: "into", term: "Into", kind: "trait", ch: 14,
    def: "The other side of `From`. `x.into()` converts when the target type is known. You usually implement `From`, and `Into` comes with it.",
    see: ["from", "tryfrom"],
    rust: `fn main() {
    let n: u32 = 7u8.into();
    println!("{n}");
}`,
    stdout: "7" },
  { id: "tryfrom", term: "TryFrom", kind: "trait", ch: 3,
    def: "Converts a value that might not fit. It returns a `Result`, so `u8::try_from(300)` gives an error instead of cutting the bits off.",
    see: ["from", "as", "result"],
    rust: `fn main() {
    let r = u8::try_from(300i32);
    println!("{}", r.is_err());
}`,
    stdout: "true" },
  { id: "default", term: "Default", kind: "trait", ch: 9,
    def: "A trait with `default()`, which builds a value with starting values for every field. `#[derive(Default)]` writes it when every field has a default.",
    see: ["derive-attr", "struct"],
    rust: `#[derive(Default, Debug)]
struct Settings {
    retries: u32,
    verbose: bool,
}

fn main() {
    println!("{:?}", Settings::default());
}`,
    stdout: "Settings { retries: 0, verbose: false }" },
  { id: "partialeq", term: "PartialEq", kind: "trait", ch: 9,
    def: "The trait behind `==` and `!=`. `#[derive(PartialEq)]` compares every field in turn.",
    see: ["derive-attr", "clone"],
    rust: `#[derive(PartialEq)]
struct P(i32);

fn main() {
    println!("{}", P(1) == P(1));
}`,
    stdout: "true" },
  { id: "error", term: "Error", kind: "trait", ch: 11,
    def: "The standard trait for error values. It requires `Debug` and `Display`. Your error types implement it so they can be wrapped, boxed or printed.",
    see: ["result", "question-mark", "thiserror", "anyhow"],
    rust: `use std::fmt;

#[derive(Debug)]
struct Empty;

impl fmt::Display for Empty {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "empty input")
    }
}

impl std::error::Error for Empty {}

fn main() {
    println!("{}", Empty);
}`,
    stdout: "empty input" },
  { id: "send", term: "Send", kind: "trait", ch: 18,
    def: "A type whose values can be moved to another thread. `Rc` is not `Send`, because its count is not atomic.",
    see: ["sync", "thread", "rc"], codes: ["E0277"],
    rust: `use std::rc::Rc;
use std::thread;

fn main() {
    let r = Rc::new(5);
    thread::spawn(move || println!("{r}"));
}`,
    check: "E0277" },
  { id: "sync", term: "Sync", kind: "trait", ch: 18,
    def: "A type is `Sync` when `&T` can be shared between threads. `Cell` and `RefCell` are not `Sync`.",
    see: ["send", "mutex", "refcell"], codes: ["E0277"],
    rust: `use std::cell::Cell;

fn needs_sync<T: Sync>(_: &T) {}

fn main() {
    let c = Cell::new(1);
    needs_sync(&c);
}`,
    check: "E0277" },
  { id: "future", term: "Future", kind: "trait", ch: 19,
    def: "A value that will finish later. An `async fn` returns one. A future makes progress only when it is polled, and `.await` polls it for you.",
    see: ["async", "await", "poll", "executor"] },
  { id: "poll", term: "Poll", kind: "type", ch: 19,
    def: "The result of one step of a future: `Ready(value)` when it is done, or `Pending` when it has to wait. A pending future gives its waker to whatever it waits on.",
    see: ["future", "waker", "executor"] },
  { id: "intoresponse", term: "IntoResponse", kind: "trait", ch: 20,
    def: "A trait for types that can become an HTTP response. Once an error type implements it, a handler can return that error with `?`.",
    see: ["handler", "error", "question-mark"] },
  { id: "collect", term: "collect", kind: "concept", ch: 13,
    def: "An iterator method that consumes the iterator and builds a collection. It needs a target type, such as `Vec<i32>`, `HashMap` or `Result<Vec<T>, E>`, which stops at the first error.",
    see: ["lazy", "adapter", "iterator", "result"],
    rust: `fn main() {
    let words = ["a", "bb"];
    let lengths: Vec<usize> = words.iter().map(|w| w.len()).collect();
    println!("{lengths:?}");
}`,
    stdout: "[1, 2]" },
  /* ---------------------------------------------------------------- tools */
  { id: "rustup", term: "rustup", kind: "tool", ch: 1,
    def: "Installs Rust and switches between toolchains, such as stable and nightly. `rustup update` gets the newest stable release." },
  { id: "rustc", term: "rustc", kind: "tool", ch: 1,
    def: "The Rust compiler. Cargo runs it for you. `rustc --explain E0382` prints a longer explanation of an error code, offline.",
    aka: "The Forge, the compiler character",
    see: ["cargo", "e0382"],
    rust: `fn main() {
    println!("compiled by rustc");
}`,
    stdout: "compiled by rustc" },
  { id: "cargo", term: "cargo", kind: "tool", ch: 1,
    def: "The build tool and package manager. It builds, runs, tests and formats your code, and it downloads the crates your project depends on.",
    see: ["cargo-toml", "cargo-build", "rustc", "crate"] },
  { id: "cargo-build", term: "cargo build", kind: "tool", ch: 1,
    def: "Compiles the project into `target/`. Add `--release` for an optimized build, which is slower to compile and faster to run.",
    see: ["cargo", "target", "cargo-check"] },
  { id: "cargo-run", term: "cargo run", kind: "tool", ch: 1,
    def: "Builds the project if it changed, then runs the binary.",
    see: ["cargo-build", "fn"],
    rust: `fn main() {
    println!("it runs");
}`,
    stdout: "it runs" },
  { id: "cargo-check", term: "cargo check", kind: "tool", ch: 1,
    def: "Type-checks and borrow-checks the project without making a binary. It is the fastest feedback the compiler gives.",
    see: ["cargo-build", "borrow-checker"] },
  { id: "cargo-test", term: "cargo test", kind: "tool", ch: 16,
    def: "Runs the unit tests, integration tests and doc tests. A test passes unless it panics.",
    see: ["test-attr", "panic", "cargo"],
    rust: `fn double(n: i32) -> i32 {
    n * 2
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn doubles_a_number() {
        assert_eq!(double(2), 4);
    }
}` },
  { id: "cargo-fmt", term: "cargo fmt", kind: "tool", ch: 16,
    def: "Formats the code to the standard style. `cargo fmt --check` reports differences and changes nothing, which is what a CI check wants." },
  { id: "cargo-clippy", term: "cargo clippy", kind: "tool", ch: 16,
    def: "Lints the code for common mistakes and for patterns that are not idiomatic. `-- -D warnings` makes any warning fail the build." },
  { id: "cargo-forge", term: "cargo forge", kind: "tool", ch: 1,
    def: "This course's practice tool. From the repo root it compiles each quest with the real compiler, runs its tests, and offers the next quest when they pass (press Enter). `cargo forge hint` gives a hint." },
  { id: "cargo-toml", term: "Cargo.toml", kind: "tool", ch: 1,
    def: "The manifest of a package. It names the package, its edition and its dependencies. Each entry under `[dependencies]` is a crate Cargo should fetch.",
    see: ["cargo-lock", "cargo"] },
  { id: "cargo-lock", term: "Cargo.lock", kind: "tool", ch: 16,
    def: "Records the exact version of every dependency that was resolved. Commit it for applications, so every build uses the same versions.",
    see: ["cargo-toml", "cargo"] },
  { id: "target", term: "target/", kind: "tool", ch: 1,
    def: "The folder where Cargo puts build output. You never edit it, and you never commit it.",
    see: ["cargo-build"] },
  { id: "anyhow", term: "anyhow", kind: "tool", ch: 11,
    def: "A crate with one flexible error type for applications. Its `Result` lets `main` use `?` on many kinds of error, and it can add context to each one.",
    see: ["error", "thiserror", "question-mark"] },
  { id: "thiserror", term: "thiserror", kind: "tool", ch: 11,
    def: "A crate with a derive macro that writes `Display` and `Error` for your error enum. Libraries use it to give their callers typed errors.",
    see: ["error", "anyhow"] },
  { id: "serde", term: "serde", kind: "tool", ch: 20,
    def: "The crate that turns Rust values into other formats and back. It is not part of `std`. `#[derive(Serialize, Deserialize)]` writes the code for a struct or an enum. JSON comes from `serde_json`, a separate crate.",
    see: ["extractor", "derive-attr"] },
  { id: "tokio", term: "tokio", kind: "tool", ch: 19,
    def: "The async runtime most projects use. `#[tokio::main]` starts it, and `tokio::spawn` runs a task on it.",
    see: ["executor", "semaphore"] },
  { id: "axum", term: "axum", kind: "tool", ch: 20,
    def: "A web framework built on tokio and tower. Its core ideas are handlers, extractors, shared state and layers.",
    see: ["handler", "extractor", "middleware"] },
  /* ---------------------------------------------------------------- error codes */
  { id: "e0004", term: "E0004", kind: "error", ch: 10,
    def: "A `match` does not cover every value. Add the missing arm, or a `_` arm if the rest can share one result.",
    see: ["exhaustive", "match"], codes: ["E0004"],
    rust: `fn main() {
    let n: Option<i32> = Some(1);
    match n {
        Some(x) => println!("{x}"),
    }
}`,
    check: "E0004" },
  { id: "e0015", term: "E0015", kind: "error", ch: 2,
    def: "A `const` or `static` calls a function that is not a `const fn`. Compute the value at runtime, or use a value the compiler can evaluate.",
    see: ["const", "static"],
    rust: `fn compute() -> u32 {
    4
}

const X: u32 = compute();

fn main() {
    println!("{X}");
}`,
    check: "E0015" },
  { id: "e0038", term: "E0038", kind: "error", ch: 14,
    def: "A trait is used as `dyn Trait`, but the compiler cannot build a trait object for it. A method returns `Self`, takes a type parameter or takes `Self` in an argument, or the trait has an associated constant. Such a trait is not dyn compatible.",
    see: ["dyn-compatibility", "dyn"], codes: ["E0038"],
    rust: `trait Cloner {
    fn dup(&self) -> Self;
}

struct A;

impl Cloner for A {
    fn dup(&self) -> Self {
        A
    }
}

fn main() {
    let _x: Box<dyn Cloner> = Box::new(A);
}`,
    check: "E0038" },
  { id: "e0046", term: "E0046", kind: "error", ch: 14,
    def: "An `impl` leaves out a method the trait requires. Write the method, or give it a default body in the trait.",
    see: ["trait", "impl"],
    rust: `trait Area {
    fn area(&self) -> f64;
    fn name(&self) -> String;
}

struct Square;

impl Area for Square {
    fn area(&self) -> f64 {
        1.0
    }
}

fn main() {}`,
    check: "E0046" },
  { id: "e0061", term: "E0061", kind: "error", ch: null, lab: "errors",
    def: "A call passes the wrong number of arguments. Compare the call with the function's signature.",
    see: ["fn"],
    rust: `fn add(a: i32, b: i32) -> i32 {
    a + b
}

fn main() {
    println!("{}", add(1));
}`,
    check: "E0061" },
  { id: "e0063", term: "E0063", kind: "error", ch: 9,
    def: "A struct literal leaves out a field. Every field needs a value.",
    see: ["struct"],
    rust: `struct Pet {
    name: String,
    age: u8,
}

fn main() {
    let p = Pet { name: String::from("Rex") };
    println!("{}", p.name);
}`,
    check: "E0063" },
  { id: "e0072", term: "E0072", kind: "error", ch: 17,
    def: "A type contains itself directly, so its size would be infinite. Put the recursive part behind a `Box`.",
    see: ["box", "heap"],
    rust: `enum List {
    Cons(i32, List),
    Nil,
}

fn main() {}`,
    check: "E0072" },
  { id: "e0106", term: "E0106", kind: "error", ch: 7,
    def: "A reference in a signature needs a lifetime, and the compiler cannot work out which input it comes from. Name one with `'a`, or return an owned value.",
    see: ["lifetime-param", "lifetime", "e0515"], codes: ["E0106"],
    rust: `fn longest(a: &str, b: &str) -> &str {
    if a.len() > b.len() { a } else { b }
}

fn main() {
    println!("{}", longest("a", "bb"));
}`,
    check: "E0106" },
  { id: "e0117", term: "E0117", kind: "error", ch: 14,
    def: "An `impl` breaks the orphan rule. The trait and the type both come from other crates, so you may not write that impl.",
    see: ["orphan-rule", "newtype"], codes: ["E0117"],
    rust: `impl std::fmt::Display for Vec<u8> {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        write!(f, "bytes")
    }
}

fn main() {}`,
    check: "E0117" },
  { id: "e0133", term: "E0133", kind: "error", ch: 21,
    def: "An operation that needs `unsafe`, such as calling an unsafe function, is used outside an `unsafe` block or function.",
    see: ["unsafe", "raw-pointer"],
    rust: `unsafe fn danger() -> i32 {
    1
}

fn main() {
    println!("{}", danger());
}`,
    check: "E0133" },
  { id: "e0204", term: "E0204", kind: "error", ch: 9,
    def: "A type derives `Copy` but has a field that is not `Copy`, such as a `String`. Remove the `Copy` derive, or make every field `Copy`.",
    see: ["copy", "clone"],
    rust: `#[derive(Clone, Copy)]
struct Name {
    text: String,
}

fn main() {}`,
    check: "E0204" },
  { id: "e0277", term: "E0277", kind: "error", ch: 14,
    def: "A type does not implement a trait that the code needs, such as `Display` for a `{}` placeholder, or a trait bound is not met.",
    see: ["trait-bound", "display", "send"], codes: ["E0277"],
    rust: `struct Crab;

fn main() {
    println!("{}", Crab);
}`,
    check: "E0277" },
  { id: "e0282", term: "E0282", kind: "error", ch: null, lab: "errors",
    def: "The compiler cannot work out a type from what the code does. Name the type, for example `Vec<i32>`, or write it on the variable.",
    see: ["vec", "collect"], codes: ["E0283"],
    rust: `fn main() {
    let v = Vec::new();
    println!("{}", v.len());
}`,
    check: "E0282" },
  { id: "e0283", term: "E0283", kind: "error", ch: 13,
    def: "The compiler cannot pick one implementation for a call, such as `sum`, because several types would fit. Add the type with an annotation or a turbofish.",
    see: ["collect", "iterator", "e0282"], codes: ["E0282"],
    rust: `fn main() {
    let total = [1, 2].iter().sum();
    println!("{total}");
}`,
    check: "E0283" },
  { id: "e0308", term: "E0308", kind: "error", ch: 2,
    def: "A value has a different type from the one the code expects. Make the types agree, or convert one with `From`, `TryFrom` or `as`.",
    see: ["semicolon", "from", "option"], codes: ["E0308"],
    rust: `fn main() {
    let n: i32 = "five";
    println!("{n}");
}`,
    check: "E0308" },
  { id: "e0369", term: "E0369", kind: "error", ch: 3,
    def: "An operator is not defined for those types. For example, `+` does not add a number to a `&str`, and `==` needs `PartialEq`.",
    see: ["partialeq", "trait-bound"], codes: ["E0369"],
    rust: `fn main() {
    let x = "5" + 5;
    println!("{x}");
}`,
    check: "E0369" },
  { id: "e0373", term: "E0373", kind: "error", ch: 13,
    def: "A closure borrows a local value, but it may run after that value is gone, as with a spawned thread. Add `move` so the closure owns what it uses.",
    see: ["move-closure", "capture", "thread"], codes: ["E0373"],
    rust: `fn main() {
    let name = String::from("crab");
    let h = std::thread::spawn(|| println!("{name}"));
    h.join().unwrap();
}`,
    check: "E0373" },
  { id: "e0381", term: "E0381", kind: "error", ch: 2,
    def: "A binding is read, but at least one path to that read never gave it a value. Give it a value on every path first.",
    see: ["let", "binding"],
    rust: `fn main() {
    let x: i32;
    println!("{x}");
}`,
    check: "E0381" },
  { id: "e0382", term: "E0382", kind: "error", ch: 6,
    def: "A value is used after it was moved. The fix is to borrow it, clone it deliberately, or reorder the code so the old name is no longer needed.",
    see: ["move", "ownership", "clone", "borrow-checker"], codes: ["E0382"],
    rust: `fn main() {
    let s = String::from("hi");
    let t = s;
    println!("{s} {t}");
}`,
    check: "E0382" },
  { id: "e0384", term: "E0384", kind: "error", ch: 2,
    def: "A binding that was not declared with `mut` is assigned a second time. Add `mut` if the value must change.",
    see: ["mut", "let"],
    rust: `fn main() {
    let x = 1;
    x = 2;
    println!("{x}");
}`,
    check: "E0384" },
  { id: "e0407", term: "E0407", kind: "error", ch: 14,
    def: "An `impl` of a trait has a method that the trait does not declare. Check the trait's method names.",
    see: ["trait", "impl"],
    rust: `trait Speak {
    fn say(&self) -> String;
}

struct Dog;

impl Speak for Dog {
    fn say(&self) -> String {
        String::from("woof")
    }

    fn wag(&self) {}
}

fn main() {}`,
    check: "E0407" },
  { id: "e0423", term: "E0423", kind: "error", ch: 1,
    def: "A name is used as a value or called like a function, but it names something else: a macro, a module, or a struct with named fields. For example, `print` is not a function. The printing macro is `println!`.",
    see: ["println", "fn"],
    rust: `fn main() {
    print("hello");
}`,
    check: "E0423" },
  { id: "e0425", term: "E0425", kind: "error", ch: 1,
    def: "A name is not in scope. Check the spelling, or declare the variable before you use it.",
    see: ["scope", "let"],
    rust: `fn main() {
    let total = 1;
    println!("{}", totl);
}`,
    check: "E0425" },
  { id: "e0432", term: "E0432", kind: "error", ch: 16,
    def: "A `use` path does not name anything that exists. Check the spelling and the module path.",
    see: ["use", "mod"],
    rust: `use std::collections::HashMapp;

fn main() {}`,
    check: "E0432" },
  { id: "e0433", term: "E0433", kind: "error", ch: 16,
    def: "A path starts with a type or module that is not in scope. Add a `use` line, or write the full path.",
    see: ["use", "crate"], codes: ["E0433"],
    rust: `fn main() {
    let m = HashMap::new();
    let _: &HashMap<i32, i32> = &m;
}`,
    check: "E0433" },
  { id: "e0451", term: "E0451", kind: "error", ch: 16,
    def: "A struct literal sets a private field from outside its module. Add a constructor function in the module, and keep the field private.",
    see: ["pub", "e0616"],
    rust: `mod bank {
    pub struct Account {
        pub owner: String,
        balance: u32,
    }
}

fn main() {
    let a = bank::Account { owner: String::new(), balance: 0 };
    println!("{}", a.owner);
}`,
    check: "E0451" },
  { id: "e0499", term: "E0499", kind: "error", ch: 7,
    def: "Two mutable borrows of the same value are alive at the same time. End the first borrow before the second one starts.",
    see: ["ref-mut", "borrow", "nll"], codes: ["E0499"],
    rust: `fn main() {
    let mut s = String::new();
    let a = &mut s;
    let b = &mut s;
    a.push('x');
    b.push('y');
}`,
    check: "E0499" },
  { id: "e0502", term: "E0502", kind: "error", ch: 7,
    def: "A shared borrow and a mutable borrow of the same value are alive at once, and one of them is still used later. End the first borrow before the second one begins.",
    see: ["ref-shared", "ref-mut", "nll"], codes: ["E0502"],
    rust: `fn main() {
    let mut s = String::from("a");
    let r = &s;
    s.push('b');
    println!("{r}");
}`,
    check: "E0502" },
  { id: "e0505", term: "E0505", kind: "error", ch: 7,
    def: "A value is moved while a borrow of it is still used later. Use the borrow before the move, or clone the value.",
    see: ["move", "borrow"], codes: ["E0505"],
    rust: `fn take(s: String) {}

fn main() {
    let s = String::from("a");
    let r = &s;
    take(s);
    println!("{r}");
}`,
    check: "E0505" },
  { id: "e0506", term: "E0506", kind: "error", ch: 7,
    def: "A value is assigned while a borrow of it is still used later. Move the assignment after the last use of the borrow.",
    see: ["borrow", "nll"], codes: ["E0506"],
    rust: `fn main() {
    let mut n = 1;
    let r = &n;
    n = 2;
    println!("{r}");
}`,
    check: "E0506" },
  { id: "e0507", term: "E0507", kind: "error", ch: 7,
    def: "A value is moved out of a borrow, such as a field behind a reference. Borrow the field instead, or clone it.",
    see: ["borrow", "clone", "move"], codes: ["E0507"],
    rust: `struct Order {
    customer: String,
}

fn main() {
    let o = Order { customer: String::from("Ana") };
    let r = &o;
    let name = r.customer;
    println!("{name}");
}`,
    check: "E0507" },
  { id: "e0508", term: "E0508", kind: "error", ch: 14,
    def: "A value is moved out of an array by index, and the item is not `Copy`. Borrow the item, or clone it.",
    see: ["copy", "clone", "e0507"], codes: ["E0507"],
    rust: `fn main() {
    let arr = [String::from("a"), String::from("b")];
    let first = arr[0];
    println!("{first}");
}`,
    check: "E0508" },
  { id: "e0515", term: "E0515", kind: "error", ch: 7,
    def: "A function returns a reference to a value that it owns. The value is dropped when the function returns, so the reference would dangle. Return the owned value instead.",
    see: ["ownership", "e0106"], codes: ["E0515"],
    rust: `fn name() -> &'static str {
    let s = String::from("crab");
    &s
}

fn main() {
    println!("{}", name());
}`,
    check: "E0515" },
  { id: "e0533", term: "E0533", kind: "error", ch: 10,
    def: "A struct variant such as `Move { x, y }` is used as if it were a tuple variant, or as a plain value. Build it with braces and field names.",
    see: ["enum", "pattern"],
    rust: `enum Message {
    Move { x: i32, y: i32 },
}

fn main() {
    let m = Message::Move(3, -1);
}`,
    check: "E0533" },
  { id: "e0571", term: "E0571", kind: "error", ch: 4,
    def: "A `break` with a value is used inside a `for` or `while` loop. Only a `loop` can return a value.",
    see: ["break", "loop"],
    rust: `fn main() {
    let v = for i in 0..3 {
        break i;
    };
}`,
    check: "E0571" },
  { id: "e0594", term: "E0594", kind: "error", ch: 9,
    def: "A field is assigned through a binding that is not `mut`. Declare the binding with `mut` if the value must change.",
    see: ["mut", "struct"],
    rust: `struct P {
    x: i32,
}

fn main() {
    let p = P { x: 1 };
    p.x = 2;
    println!("{}", p.x);
}`,
    check: "E0594" },
  { id: "e0596", term: "E0596", kind: "error", ch: 7,
    def: "A `&mut` borrow is taken from a binding that is not `mut`. Declare the binding with `mut`.",
    see: ["ref-mut", "mut"], codes: ["E0596"],
    rust: `fn main() {
    let v = String::new();
    let r = &mut v;
    r.push('a');
}`,
    check: "E0596" },
  { id: "e0597", term: "E0597", kind: "error", ch: 7,
    def: "A borrow outlives the value it points to. The value is dropped while the reference is still used.",
    see: ["lifetime", "scope"], codes: ["E0597"],
    rust: `fn main() {
    let r;
    {
        let x = 5;
        r = &x;
    }
    println!("{r}");
}`,
    check: "E0597" },
  { id: "e0599", term: "E0599", kind: "error", ch: 14,
    def: "A method is called that the type does not have. In a generic function it often means a trait bound is missing.",
    see: ["trait-bound", "method"], codes: ["E0599"],
    rust: `fn main() {
    let n = 5i32;
    println!("{}", n.len());
}`,
    check: "E0599" },
  { id: "e0600", term: "E0600", kind: "error", ch: 3,
    def: "A unary operator is used on a type that does not support it, such as `-` on an unsigned integer.",
    see: ["as", "from"],
    rust: `fn main() {
    let n: u32 = 5;
    let m = -n;
    println!("{m}");
}`,
    check: "E0600" },
  { id: "e0603", term: "E0603", kind: "error", ch: 16,
    def: "An item is private to its module. Mark it `pub` if other modules should use it.",
    see: ["pub", "mod"], codes: ["E0603"],
    rust: `mod shop {
    fn secret() -> i32 {
        1
    }
}

fn main() {
    println!("{}", shop::secret());
}`,
    check: "E0603" },
  { id: "e0609", term: "E0609", kind: "error", ch: null, lab: "errors",
    def: "A field is read that the type does not have. Check the spelling of the field name.",
    see: ["struct", "e0616"],
    rust: `struct Cart {
    total_cents: u32,
}

fn main() {
    let c = Cart { total_cents: 5 };
    println!("{}", c.totl_cents);
}`,
    check: "E0609" },
  { id: "e0616", term: "E0616", kind: "error", ch: 9,
    def: "A private field is read from outside its module. Give the type a getter method that returns the field.",
    see: ["pub", "e0451", "method"],
    rust: `mod bank {
    pub struct Account {
        balance: u32,
    }

    impl Account {
        pub fn new() -> Self {
            Account { balance: 0 }
        }
    }
}

fn main() {
    let a = bank::Account::new();
    println!("{}", a.balance);
}`,
    check: "E0616" },
  { id: "e0700", term: "E0700", kind: "error", ch: 15,
    def: "An `impl Trait` in a return type captures a borrow that the signature does not name. Edition 2021 needs `+ '_` to fix it. Edition 2024 adds that link for you, so this example compiles.",
    see: ["lifetime", "lifetime-param"], codes: ["E0700"],
    rust: `struct Names {
    items: Vec<String>,
}

impl Names {
    fn iter(&self) -> impl Iterator<Item = String> {
        self.items.iter().cloned()
    }
}

fn main() {
    let n = Names { items: vec![String::from("Ana"), String::from("Bo")] };
    for s in n.iter() {
        println!("{s}");
    }
}`,
    stdout: "Ana\nBo",
    check: "ok" },
  { id: "e0716", term: "E0716", kind: "error", ch: 15,
    def: "A temporary value is dropped at the end of its statement, while a reference to it is still used. Bind the value to a name first.",
    see: ["lifetime", "e0597"], codes: ["E0716"],
    rust: `fn main() {
    let r: &String;
    r = &String::from("temp");
    println!("{r}");
}`,
    check: "E0716" },
  /* ------------------------------------------- keywords and terms added in fix 3 */
  { id: "in", term: "in", kind: "keyword", ch: 4,
    def: "Separates the name from the collection in a `for` loop. `for x in list` takes each item in turn.",
    see: ["for", "vec"],
    rust: `fn main() {
    let names = ["Ada", "Grace"];
    for name in names {
        println!("{name}");
    }
}`,
    stdout: "Ada\nGrace" },
  { id: "ref", term: "ref", kind: "keyword", ch: 7,
    def: "In a pattern, `ref` borrows the part it names instead of moving it out. The value stays where it was, and it can still be used afterwards.",
    see: ["borrow", "pattern"],
    rust: `fn main() {
    let greeting = Some(String::from("Ada"));
    if let Some(ref name) = greeting {
        println!("{name}");
    }
    println!("{greeting:?}");
}`,
    stdout: "Ada\nSome(\"Ada\")" },
  { id: "self-type", term: "Self", kind: "keyword", ch: 9,
    def: "Inside an `impl` block or a trait, `Self` is the type the block is for. `fn empty() -> Self` returns the same type as the impl, so the type name is not written twice.",
    see: ["self", "impl"],
    rust: `struct Tank {
    litres: u32,
}

impl Tank {
    fn empty() -> Self {
        Tank { litres: 0 }
    }
}

fn main() {
    println!("{}", Tank::empty().litres);
}`,
    stdout: "0" },
  { id: "extern", term: "extern", kind: "keyword", ch: 21,
    def: "An `extern` block declares functions that another language, such as C, provides. Calling them needs `unsafe`. Chapter 21 shows the one place the course uses it." },
  { id: "ordering", term: "Ordering", kind: "type", ch: 12,
    def: "The result of a comparison: `Less`, `Equal` or `Greater`. `a.cmp(&b)` gives one, and sorting and `max_by` read it.",
    see: ["trait", "reverse"],
    rust: `use std::cmp::Ordering;

fn main() {
    let order = 1.cmp(&2);
    match order {
        Ordering::Less => println!("less"),
        Ordering::Equal => println!("equal"),
        Ordering::Greater => println!("greater"),
    }
}`,
    stdout: "less" },
  { id: "reverse", term: "Reverse", kind: "type", ch: 12,
    def: "A wrapper that flips the order of what it holds, so `Reverse(a) < Reverse(b)` when `a > b`. Sorting by `Reverse(x)` runs from largest to smallest.",
    see: ["ordering", "binaryheap"],
    rust: `use std::cmp::Reverse;

fn main() {
    let mut v = vec![1, 3, 2];
    v.sort_by_key(|&x| Reverse(x));
    println!("{v:?}");
}`,
    stdout: "[3, 2, 1]" },
  { id: "binaryheap", term: "BinaryHeap", kind: "type", ch: 12,
    def: "A priority queue. `push` adds a value, and `pop` takes out the largest one still in the heap, as an `Option`.",
    see: ["reverse", "vec"],
    rust: `use std::collections::BinaryHeap;

fn main() {
    let mut heap = BinaryHeap::new();
    heap.push(3);
    heap.push(7);
    heap.push(5);
    println!("{:?}", heap.pop());
}`,
    stdout: "Some(7)" },
  { id: "exitcode", term: "ExitCode", kind: "type", ch: 11,
    def: "The status a program ends with. `main` can return `ExitCode::SUCCESS` or `ExitCode::FAILURE` instead of `()`.",
    see: ["result"],
    rust: `use std::process::ExitCode;

fn main() -> ExitCode {
    println!("checked");
    ExitCode::SUCCESS
}`,
    stdout: "checked" },
  { id: "command", term: "Command", kind: "type", ch: 21,
    def: "Starts another program. `Command::new` names it, `.arg` adds one argument, and `.output()` runs it and waits. The arguments are passed as they are: there is no shell.",
    see: ["stdio", "exitcode"],
    rust: `use std::process::Command;

fn main() {
    let out = Command::new("echo").arg("hello").output().unwrap();
    print!("{}", String::from_utf8_lossy(&out.stdout));
}`,
    stdout: "hello" },
  { id: "stdio", term: "Stdio", kind: "type", ch: 21,
    def: "Says where a child program's input or output goes. `Stdio::piped()` gives you a pipe, `Stdio::null()` throws the output away, and `Stdio::inherit()` shares your terminal. Set it before the program starts.",
    see: ["command"],
    rust: `use std::process::{Command, Stdio};

fn main() {
    let status = Command::new("true")
        .stdout(Stdio::null())
        .status()
        .unwrap();
    println!("{}", status.success());
}`,
    stdout: "true" },
  { id: "lazylock", term: "LazyLock", kind: "type", ch: 18,
    def: "A value that is built the first time it is used and kept for the rest of the program. Use it for a `static` that needs code to build it, such as a `String`.",
    see: ["static", "oncelock"],
    rust: `use std::sync::LazyLock;

static NAME: LazyLock<String> = LazyLock::new(|| String::from("Oxi"));

fn main() {
    println!("{}", *NAME);
}`,
    stdout: "Oxi" },
  { id: "oncelock", term: "OnceLock", kind: "type", ch: 18,
    def: "A cell that is filled once, the first time someone asks for it. `get_or_init` runs its closure only while the cell is still empty.",
    see: ["lazylock", "static"],
    rust: `use std::sync::OnceLock;

static LEVEL: OnceLock<u32> = OnceLock::new();

fn main() {
    println!("{}", LEVEL.get_or_init(|| 7));
    println!("{}", LEVEL.get_or_init(|| 9));
}`,
    stdout: "7\n7" },
  { id: "char", term: "char", kind: "type", ch: 3,
    def: "One Unicode character, written in single quotes, such as `'c'` or `'é'`. A `char` is four bytes wide. In a `String`, `'é'` takes two bytes.",
    see: ["string"],
    rust: `fn main() {
    let c = 'é';
    println!("{c} {}", c.len_utf8());
}`,
    stdout: "é 2" },
  { id: "integer", term: "Integer types", kind: "type", ch: 3,
    def: "Whole numbers in sizes such as `i8`, `u16`, `i32` and `usize`. Arithmetic past the range panics in a debug build. The `wrapping_` methods wrap around on purpose instead.",
    see: ["as", "char"],
    rust: `fn main() {
    let x: u8 = 255;
    println!("{}", x.wrapping_add(1));
}`,
    stdout: "0" },
  { id: "derive-attribute", term: "#[derive]", kind: "syntax", ch: 9,
    def: "An attribute that writes a trait's code for you. `#[derive(Debug, Clone)]` above a struct gives it `{:?}` output and `.clone()`. Each derive works only when every field supports that trait.",
    see: ["debug", "clone", "serialize"],
    rust: `#[derive(Debug, Clone)]
struct Point {
    x: i32,
}

fn main() {
    let p = Point { x: 1 };
    println!("{:?}", p.clone());
}`,
    stdout: "Point { x: 1 }" },
  { id: "anon-lifetime", term: "'_", kind: "syntax", ch: 15,
    def: "The anonymous lifetime. It means some lifetime here, and the compiler works out which one. `impl Parser<'_>` saves a name you would not use again.",
    see: ["lifetime"],
    rust: `struct Parser<'a> {
    text: &'a str,
}

impl Parser<'_> {
    fn len(&self) -> usize {
        self.text.len()
    }
}

fn main() {
    let p = Parser { text: "hello" };
    println!("{}", p.len());
}`,
    stdout: "5" },
  { id: "data-race", term: "Data race", kind: "concept", ch: 18,
    def: "Two threads use the same memory at once, at least one of them writes, and nothing orders the two accesses. Safe Rust does not compile a data race: `Send`, `Sync` and the borrow rules rule it out." },
  { id: "deadlock", term: "Deadlock", kind: "concept", ch: 18,
    def: "Two or more threads each wait for a lock that another one holds, so none of them can go on. Taking locks in one fixed order avoids it." },
  { id: "workspace", term: "Workspace", kind: "concept", ch: 16,
    def: "A set of packages that share one `Cargo.lock` and one target folder. The root `Cargo.toml` declares it with `[workspace]`, and each member keeps its own `Cargo.toml`." },
  { id: "pin", term: "Pin", kind: "type", ch: 19,
    def: "A wrapper that promises the value inside it will not move in memory. Async code needs it for a future that refers to itself. You rarely write `Pin` by hand; `.await` and the runtime handle it." },
  { id: "select-macro", term: "select!", kind: "syntax", ch: 19,
    def: "From tokio. It waits for several futures at once and runs the branch of the first one that finishes. The other futures are dropped." },
  { id: "joinset", term: "JoinSet", kind: "type", ch: 19,
    def: "From tokio. A set of spawned tasks that you wait for one at a time with `join_next`. Dropping the set aborts the tasks still running." },
  { id: "cancellation-token", term: "CancellationToken", kind: "type", ch: 19,
    def: "From tokio-util. A flag that one task sets with `cancel()`. Other tasks wait on it with `cancelled()` and stop their work when it is set." },
  { id: "serialize", term: "Serialize", kind: "trait", ch: 20,
    def: "One of the serde traits. `#[derive(Serialize, Deserialize)]` writes the code that turns a struct into a data format and back. The format itself comes from a crate such as `serde_json`." },
  { id: "router", term: "Router", kind: "type", ch: 20,
    def: "The axum type that matches a request's method and path, such as `POST /notes`, to a handler. `with_state` gives every handler the same shared state." },
  { id: "json-extractor", term: "Json", kind: "type", ch: 20,
    def: "In axum, `Json` reads a request body into a type, as in the argument `Json(body): Json<NewNote>`. As a response, it writes a value out as JSON." },
  { id: "reqwest", term: "reqwest", kind: "tool", ch: 20,
    def: "The HTTP client crate. `Client` sends requests, and `error_for_status` turns 4xx and 5xx answers into errors." },
  { id: "clap", term: "clap", kind: "tool", ch: 16,
    def: "A crate that reads command-line arguments into a struct. `#[derive(Parser)]` writes the parsing, the help text and the error messages from the types." },
  { id: "typestate", term: "Typestate", kind: "concept", ch: 21,
    def: "A design where the state of a value is part of its type, so a call that is not allowed in that state does not compile. A builder can use it to make required fields come first." },

  /* ----------------------------------------- keywords the course uses */
  { id: "true", term: "true", kind: "keyword", ch: 3,
    def: "The boolean value true. Its type is `bool`, which holds either `true` or `false`.",
    see: ["integer"],
    rust: `fn main() {
    let ok = true;
    println!("{}", ok);
}`,
    stdout: "true" },
  { id: "false", term: "false", kind: "keyword", ch: 3,
    def: "The boolean value false. `!` flips a bool, so `!false` is true.",
    see: ["true"],
    rust: `fn main() {
    let done = false;
    println!("{}", !done);
}`,
    stdout: "true" },
];
