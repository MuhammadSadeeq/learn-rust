/* Be the Borrow Checker: puzzle data for labs/borrow-checker.html.
   Every `rust` and `fix` is compiled by tools/check-snippets.mjs. Every `error`
   is the real rustc 1.97 output for that exact `rust` (edition 2024, warnings
   removed). Rules: move, shared-mut, two-mut, assign-borrowed, dangling, not-mut,
   move-out-of-borrow, closure-outlives, missing-lifetime, type, not-send. */
window.OX_BORROW = [
  {
    id: "n01",
    tier: "novice",
    chapter: 6,
    title: "Copy an integer",
    check: "ok",
    rule: null,
    rust: `fn main() {
    let a = 5;
    let b = a;
    println!("{a} {b}");
}`,
    why: "Integers implement <code>Copy</code>, so <code>let b = a;</code> makes an independent copy and <code>a</code> stays valid. Types that are <code>Copy</code> are duplicated on assignment instead of moved.",
  },
  {
    id: "n02",
    tier: "novice",
    chapter: 6,
    title: "A Vec moved by let",
    check: "E0382",
    rule: "move",
    rust: `fn main() {
    let v = vec![1, 2, 3];
    let w = v;
    println!("{}", v.len());
}`,
    why: "<code>let w = v;</code> moves the vector. <code>w</code> now owns the heap buffer and <code>v</code> is no longer valid. A <code>Vec</code> is never <code>Copy</code>, even when its elements are, because it owns a buffer.",
    error: `error[E0382]: borrow of moved value: \`v\`
 --> src/main.rs:4:20
  |
2 |     let v = vec![1, 2, 3];
  |         - move occurs because \`v\` has type \`Vec<i32>\`, which does not implement the \`Copy\` trait
3 |     let w = v;
  |             - value moved here
4 |     println!("{}", v.len());
  |                    ^ value borrowed here after move
  |
help: consider cloning the value if the performance cost is acceptable
  |
3 |     let w = v.clone();
  |              ++++++++

error: aborting due to 1 previous error

For more information about this error, try \`rustc --explain E0382\`.`,
    fix: `fn main() {
    let v = vec![1, 2, 3];
    let w = v.clone();
    println!("{}", v.len());
}`,
  },
  {
    id: "n03",
    tier: "novice",
    chapter: 6,
    title: "A tuple of Copy values",
    check: "ok",
    rule: null,
    rust: `fn main() {
    let pair = (1, 'x');
    let copy = pair;
    println!("{:?} {:?}", pair, copy);
}`,
    why: "A tuple is <code>Copy</code> when every element is <code>Copy</code>. Both elements here are, so <code>let copy = pair;</code> duplicates the tuple. Replace the <code>char</code> with a <code>String</code> and the tuple stops being <code>Copy</code>.",
  },
  {
    id: "n04",
    tier: "novice",
    chapter: 6,
    title: "A for loop eats the Vec",
    check: "E0382",
    rule: "move",
    rust: `fn main() {
    let names = vec![String::from("Ana"), String::from("Bo")];
    for n in names {
        println!("{n}");
    }
    println!("{}", names.len());
}`,
    why: "<code>for n in names</code> calls <code>into_iter()</code>, which takes the vector by value. The loop owns the strings, and <code>names</code> is gone after it. Write <code>for n in &amp;names</code> to borrow the vector instead.",
    error: `error[E0382]: borrow of moved value: \`names\`
   --> src/main.rs:6:20
    |
  2 |     let names = vec![String::from("Ana"), String::from("Bo")];
    |         ----- move occurs because \`names\` has type \`Vec<String>\`, which does not implement the \`Copy\` trait
  3 |     for n in names {
    |              ----- \`names\` moved due to this implicit call to \`.into_iter()\`
...
  6 |     println!("{}", names.len());
    |                    ^^^^^ value borrowed here after move
    |
note: \`into_iter\` takes ownership of the receiver \`self\`, which moves \`names\`
   --> /rustc/library/core/src/iter/traits/collect.rs:312:18
    |
312 |     fn into_iter(self) -> Self::IntoIter;
    |                  ^^^^
help: consider iterating over a slice of the \`Vec<String>\`'s content to avoid moving into the \`for\` loop
    |
  3 |     for n in &names {
    |              +

error: aborting due to 1 previous error

For more information about this error, try \`rustc --explain E0382\`.`,
    fix: `fn main() {
    let names = vec![String::from("Ana"), String::from("Bo")];
    for n in &names {
        println!("{n}");
    }
    println!("{}", names.len());
}`,
  },
  {
    id: "n05",
    tier: "novice",
    chapter: 6,
    title: "Passing a String to a function",
    check: "E0382",
    rule: "move",
    rust: `fn shout(s: String) -> String {
    s.to_uppercase()
}

fn main() {
    let word = String::from("rust");
    let loud = shout(word);
    println!("{word} became {loud}");
}`,
    why: "Calling <code>shout(word)</code> moves <code>word</code> into the function. <code>shout</code> returns a new <code>String</code>, but the original name is gone. A parameter typed <code>&amp;str</code>, called as <code>shout(&amp;word)</code>, borrows instead.",
    error: `error[E0382]: borrow of moved value: \`word\`
 --> src/main.rs:8:16
  |
6 |     let word = String::from("rust");
  |         ---- move occurs because \`word\` has type \`String\`, which does not implement the \`Copy\` trait
7 |     let loud = shout(word);
  |                      ---- value moved here
8 |     println!("{word} became {loud}");
  |                ^^^^ value borrowed here after move
  |
note: consider changing this parameter type in function \`shout\` to borrow instead if owning the value isn't necessary
 --> src/main.rs:1:13
  |
1 | fn shout(s: String) -> String {
  |    -----    ^^^^^^ this parameter takes ownership of the value
  |    |
  |    in this function
help: consider cloning the value if the performance cost is acceptable
  |
7 |     let loud = shout(word.clone());
  |                          ++++++++

error: aborting due to 1 previous error

For more information about this error, try \`rustc --explain E0382\`.`,
    fix: `fn shout(s: &str) -> String {
    s.to_uppercase()
}

fn main() {
    let word = String::from("rust");
    let loud = shout(&word);
    println!("{word} became {loud}");
}`,
  },
  {
    id: "n06",
    tier: "novice",
    chapter: 9,
    title: "A struct takes the string",
    check: "E0382",
    rule: "move",
    rust: `struct User {
    name: String,
}

fn main() {
    let name = String::from("Ana");
    let user = User { name };
    println!("{} {}", user.name, name);
}`,
    why: "The shorthand <code>User { name }</code> moves <code>name</code> into the struct. The struct owns the string now, so the old binding can't be read.",
    error: `error[E0382]: borrow of moved value: \`name\`
 --> src/main.rs:8:34
  |
6 |     let name = String::from("Ana");
  |         ---- move occurs because \`name\` has type \`String\`, which does not implement the \`Copy\` trait
7 |     let user = User { name };
  |                       ---- value moved here
8 |     println!("{} {}", user.name, name);
  |                                  ^^^^ value borrowed here after move
  |
help: consider cloning the value if the performance cost is acceptable
  |
7 |     let user = User { name: name.clone() };
  |                           ++++++++++++++

error: aborting due to 1 previous error

For more information about this error, try \`rustc --explain E0382\`.`,
    fix: `struct User {
    name: String,
}

fn main() {
    let name = String::from("Ana");
    let user = User { name: name.clone() };
    println!("{} {}", user.name, name);
}`,
  },
  {
    id: "n07",
    tier: "novice",
    chapter: 6,
    title: "Ownership returned",
    check: "ok",
    rule: null,
    rust: `fn touch(v: Vec<i32>) -> Vec<i32> {
    v
}

fn main() {
    let v = vec![1, 2];
    let v = touch(v);
    println!("{}", v.len());
}`,
    why: "<code>touch</code> takes the vector and hands it back. The result is bound to a new <code>v</code> (shadowing), and the old name is never used again, so the program compiles.",
  },
  {
    id: "n08",
    tier: "novice",
    chapter: 9,
    title: "A method that takes self",
    check: "E0382",
    rule: "move",
    rust: `struct Order { id: u32 }

impl Order {
    fn finish(self) -> u32 { self.id }
}

fn main() {
    let order = Order { id: 7 };
    let id = order.finish();
    println!("{id} {}", order.id);
}`,
    why: "<code>finish(self)</code> takes the whole value, so calling it moves <code>order</code> into the method. <code>order.id</code> is a plain number, but it lives inside a struct that has already moved.",
    error: `error[E0382]: borrow of moved value: \`order\`
  --> src/main.rs:10:25
   |
 8 |     let order = Order { id: 7 };
   |         ----- move occurs because \`order\` has type \`Order\`, which does not implement the \`Copy\` trait
 9 |     let id = order.finish();
   |                    -------- \`order\` moved due to this method call
10 |     println!("{id} {}", order.id);
   |                         ^^^^^^^^ value borrowed here after move
   |
note: \`Order::finish\` takes ownership of the receiver \`self\`, which moves \`order\`
  --> src/main.rs:4:15
   |
 4 |     fn finish(self) -> u32 { self.id }
   |               ^^^^

error: aborting due to 1 previous error

For more information about this error, try \`rustc --explain E0382\`.`,
    fix: `struct Order { id: u32 }

impl Order {
    fn finish(&self) -> u32 { self.id }
}

fn main() {
    let order = Order { id: 7 };
    let id = order.finish();
    println!("{id} {}", order.id);
}`,
  },
  {
    id: "n09",
    tier: "novice",
    chapter: 9,
    title: "Deriving Copy on a struct",
    check: "ok",
    rule: null,
    rust: `#[derive(Clone, Copy)]
struct Point {
    x: i32,
    y: i32,
}

fn main() {
    let a = Point { x: 1, y: 2 };
    let b = a;
    println!("{} {}", a.x, b.y);
}`,
    why: "<code>derive(Clone, Copy)</code> makes the struct <code>Copy</code>. A struct can only be <code>Copy</code> when every field is <code>Copy</code>, and two <code>i32</code>s are. So <code>let b = a;</code> copies, and <code>a</code> stays valid.",
  },
  {
    id: "n10",
    tier: "novice",
    chapter: 9,
    title: "The same struct without Copy",
    check: "E0382",
    rule: "move",
    rust: `struct Point {
    x: i32,
    y: i32,
}

fn main() {
    let a = Point { x: 1, y: 2 };
    let b = a;
    println!("{} {}", a.x, b.y);
}`,
    why: "The fields are <code>Copy</code>, but the struct is not. Without <code>derive(Copy)</code>, <code>let b = a;</code> moves the whole struct, and <code>a.x</code> then reads a moved value.",
    error: `error[E0382]: borrow of moved value: \`a\`
 --> src/main.rs:9:23
  |
7 |     let a = Point { x: 1, y: 2 };
  |         - move occurs because \`a\` has type \`Point\`, which does not implement the \`Copy\` trait
8 |     let b = a;
  |             - value moved here
9 |     println!("{} {}", a.x, b.y);
  |                       ^^^ value borrowed here after move
  |
note: if \`Point\` implemented \`Clone\`, you could clone the value
 --> src/main.rs:1:1
  |
1 | struct Point {
  | ^^^^^^^^^^^^ consider implementing \`Clone\` for this type
...
8 |     let b = a;
  |             - you could clone this value

error: aborting due to 1 previous error

For more information about this error, try \`rustc --explain E0382\`.`,
    fix: `#[derive(Clone, Copy)]
struct Point {
    x: i32,
    y: i32,
}

fn main() {
    let a = Point { x: 1, y: 2 };
    let b = a;
    println!("{} {}", a.x, b.y);
}`,
  },
  {
    id: "n11",
    tier: "novice",
    chapter: 6,
    title: "Moved on one branch",
    check: "E0382",
    rule: "move",
    rust: `fn main() {
    let s = String::from("hi");
    if s.len() > 1 {
        drop(s);
    }
    println!("{s}");
}`,
    why: "The move happens only on one branch, but the compiler checks every path. On the path where the branch runs, <code>s</code> has already moved, so the later use is an error.",
    error: `error[E0382]: borrow of moved value: \`s\`
 --> src/main.rs:6:16
  |
2 |     let s = String::from("hi");
  |         - move occurs because \`s\` has type \`String\`, which does not implement the \`Copy\` trait
3 |     if s.len() > 1 {
4 |         drop(s);
  |              - value moved here
5 |     }
6 |     println!("{s}");
  |                ^ value borrowed here after move
  |
help: consider cloning the value if the performance cost is acceptable
  |
4 |         drop(s.clone());
  |               ++++++++

error: aborting due to 1 previous error

For more information about this error, try \`rustc --explain E0382\`.`,
    fix: `fn main() {
    let s = String::from("hi");
    if s.len() > 1 {
        drop(s.clone());
    }
    println!("{s}");
}`,
  },
  {
    id: "n12",
    tier: "novice",
    chapter: 6,
    title: "Moved inside a loop",
    check: "E0382",
    rule: "move",
    rust: `fn consume(s: String) -> usize {
    s.len()
}

fn main() {
    let s = String::from("hi");
    for _ in 0..2 {
        println!("{}", consume(s));
    }
}`,
    why: "The loop body runs twice, and <code>consume(s)</code> moves <code>s</code> on the first pass. On the second pass there is nothing left to move.",
    error: `error[E0382]: use of moved value: \`s\`
 --> src/main.rs:8:32
  |
6 |     let s = String::from("hi");
  |         - move occurs because \`s\` has type \`String\`, which does not implement the \`Copy\` trait
7 |     for _ in 0..2 {
  |     ------------- inside of this loop
8 |         println!("{}", consume(s));
  |                                ^ value moved here, in previous iteration of loop
  |
note: consider changing this parameter type in function \`consume\` to borrow instead if owning the value isn't necessary
 --> src/main.rs:1:15
  |
1 | fn consume(s: String) -> usize {
  |    -------    ^^^^^^ this parameter takes ownership of the value
  |    |
  |    in this function
help: consider cloning the value if the performance cost is acceptable
  |
8 |         println!("{}", consume(s.clone()));
  |                                 ++++++++

error: aborting due to 1 previous error

For more information about this error, try \`rustc --explain E0382\`.`,
    fix: `fn consume(s: String) -> usize {
    s.len()
}

fn main() {
    let s = String::from("hi");
    for _ in 0..2 {
        println!("{}", consume(s.clone()));
    }
}`,
  },
  {
    id: "n13",
    tier: "novice",
    chapter: 6,
    title: "Reassigning a moved mut",
    check: "ok",
    rule: null,
    rust: `fn main() {
    let mut s = String::from("a");
    let t = s;
    s = String::from("b");
    println!("{s} {t}");
}`,
    why: "Once <code>s</code> is moved it can't be read, but assigning a new value to a <code>mut</code> binding gives the name a fresh value. Here that makes <code>s</code> usable again.",
  },
  {
    id: "n14",
    tier: "novice",
    chapter: 2,
    title: "Assigning to an immutable binding",
    check: "E0384",
    rule: "not-mut",
    rust: `fn main() {
    let score = 10;
    score = 20;
    println!("{score}");
}`,
    why: "A binding is immutable unless you write <code>mut</code>. Assigning to <code>score</code> a second time is an error, even though the new value is a simple number.",
    error: `error[E0384]: cannot assign twice to immutable variable \`score\`
 --> src/main.rs:3:5
  |
2 |     let score = 10;
  |         ----- first assignment to \`score\`
3 |     score = 20;
  |     ^^^^^^^^^^ cannot assign twice to immutable variable
  |
help: consider making this binding mutable
  |
2 |     let mut score = 10;
  |         +++

error: aborting due to 1 previous error

For more information about this error, try \`rustc --explain E0384\`.`,
    fix: `fn main() {
    let mut score = 10;
    score = 20;
    println!("{score}");
}`,
  },
  {
    id: "n15",
    tier: "novice",
    chapter: 6,
    title: "Pushed into a Vec, then used",
    check: "E0382",
    rule: "move",
    rust: `fn main() {
    let mut names: Vec<String> = Vec::new();
    let name = String::from("Ana");
    names.push(name);
    println!("{name} is in the list");
}`,
    why: "<code>push</code> takes its argument by value, so <code>name</code> moves into the vector. The vector owns the string now. Push <code>name.clone()</code> to keep a copy in the variable as well.",
    error: `error[E0382]: borrow of moved value: \`name\`
 --> src/main.rs:5:16
  |
3 |     let name = String::from("Ana");
  |         ---- move occurs because \`name\` has type \`String\`, which does not implement the \`Copy\` trait
4 |     names.push(name);
  |                ---- value moved here
5 |     println!("{name} is in the list");
  |                ^^^^ value borrowed here after move
  |
help: consider cloning the value if the performance cost is acceptable
  |
4 |     names.push(name.clone());
  |                    ++++++++

error: aborting due to 1 previous error

For more information about this error, try \`rustc --explain E0382\`.`,
    fix: `fn main() {
    let mut names: Vec<String> = Vec::new();
    let name = String::from("Ana");
    names.push(name.clone());
    println!("{name} is in the list");
}`,
  },
  {
    id: "a01",
    tier: "adept",
    chapter: 7,
    title: "A reference, then a push",
    check: "E0502",
    rule: "shared-mut",
    rust: `fn main() {
    let mut v = vec![1, 2, 3];
    let first = &v[0];
    v.push(4);
    println!("{first}");
}`,
    why: "<code>first</code> is a shared borrow of an element, and it is used on the last line. <code>push</code> can reallocate the buffer, which would leave <code>first</code> pointing at freed memory, so the compiler refuses while the borrow is alive.",
    error: `error[E0502]: cannot borrow \`v\` as mutable because it is also borrowed as immutable
 --> src/main.rs:4:5
  |
3 |     let first = &v[0];
  |                  - immutable borrow occurs here
4 |     v.push(4);
  |     ^^^^^^^^^ mutable borrow occurs here
5 |     println!("{first}");
  |                ----- immutable borrow later used here

error: aborting due to 1 previous error

For more information about this error, try \`rustc --explain E0502\`.`,
    fix: `fn main() {
    let mut v = vec![1, 2, 3];
    let first = &v[0];
    println!("{first}");
    v.push(4);
}`,
  },
  {
    id: "a02",
    tier: "adept",
    chapter: 7,
    title: "The borrow ends early",
    check: "ok",
    rule: null,
    rust: `fn main() {
    let mut v = vec![1, 2, 3];
    let first = &v[0];
    println!("first: {first}");
    v.push(4);
}`,
    why: "Borrow checking follows where a reference is last used, not where its scope ends. <code>first</code> is last used on the line that prints it, so the borrow is over and the <code>push</code> is allowed. This is called non-lexical lifetimes.",
  },
  {
    id: "a03",
    tier: "adept",
    chapter: 7,
    title: "Pushing the length of itself",
    check: "ok",
    rule: null,
    rust: `fn main() {
    let mut v = vec![1, 2, 3];
    v.push(v.len());
    println!("{v:?}");
}`,
    why: "For <code>v.push(...)</code>, Rust reserves the <code>&amp;mut</code> borrow, evaluates the argument, and only then activates the mutable borrow. <code>v.len()</code> is a shared borrow during the reserved phase, so it is allowed. This is two-phase borrowing.",
  },
  {
    id: "a04",
    tier: "adept",
    chapter: 7,
    title: "Two mutable borrows of one String",
    check: "E0499",
    rule: "two-mut",
    rust: `fn main() {
    let mut s = String::new();
    let a = &mut s;
    let b = &mut s;
    a.push('x');
    b.push('y');
}`,
    why: "A mutable borrow is exclusive. While <code>a</code> is alive, creating <code>b</code> is a second mutable borrow of <code>s</code>, and the compiler refuses it. Finish with <code>a</code> before creating <code>b</code>.",
    error: `error[E0499]: cannot borrow \`s\` as mutable more than once at a time
 --> src/main.rs:4:13
  |
3 |     let a = &mut s;
  |             ------ first mutable borrow occurs here
4 |     let b = &mut s;
  |             ^^^^^^ second mutable borrow occurs here
5 |     a.push('x');
  |     - first borrow later used here

error: aborting due to 1 previous error

For more information about this error, try \`rustc --explain E0499\`.`,
    fix: `fn main() {
    let mut s = String::new();
    let a = &mut s;
    a.push('x');
    let b = &mut s;
    b.push('y');
}`,
  },
  {
    id: "a05",
    tier: "adept",
    chapter: 7,
    title: "Passing a &mut twice",
    check: "ok",
    rule: null,
    rust: `fn push_one(v: &mut Vec<i32>) {
    v.push(1);
}

fn main() {
    let mut v = Vec::new();
    let r = &mut v;
    push_one(r);
    push_one(r);
    println!("{}", r.len());
}`,
    why: "Passing <code>r</code> to a parameter of type <code>&amp;mut Vec&lt;i32&gt;</code> doesn't move it. Rust makes a short reborrow, <code>&amp;mut *r</code>, for each call, and that reborrow ends when the call returns. So <code>r</code> can be used again.",
  },
  {
    id: "a06",
    tier: "adept",
    chapter: 13,
    title: "A slice, then clear",
    check: "E0502",
    rule: "shared-mut",
    rust: `fn first_word(s: &String) -> &str {
    &s[..s.find(' ').unwrap_or(s.len())]
}

fn main() {
    let mut s = String::from("hello world");
    let word = first_word(&s);
    s.clear();
    println!("{word}");
}`,
    why: "<code>word</code> is a slice that points into <code>s</code>. <code>clear()</code> needs a mutable borrow of the whole string, and <code>word</code> is still used afterward. Clearing the string would leave <code>word</code> pointing at bytes that no longer exist.",
    error: `error[E0502]: cannot borrow \`s\` as mutable because it is also borrowed as immutable
 --> src/main.rs:8:5
  |
7 |     let word = first_word(&s);
  |                           -- immutable borrow occurs here
8 |     s.clear();
  |     ^^^^^^^^^ mutable borrow occurs here
9 |     println!("{word}");
  |                ---- immutable borrow later used here

error: aborting due to 1 previous error

For more information about this error, try \`rustc --explain E0502\`.`,
    fix: `fn first_word(s: &String) -> &str {
    &s[..s.find(' ').unwrap_or(s.len())]
}

fn main() {
    let mut s = String::from("hello world");
    let word = first_word(&s);
    println!("{word}");
    s.clear();
}`,
  },
  {
    id: "a07",
    tier: "adept",
    chapter: 8,
    title: "Two string slices",
    check: "ok",
    rule: null,
    rust: `fn main() {
    let s = String::from("hello world");
    let hello = &s[0..5];
    let world = &s[6..];
    println!("{hello} {world}");
}`,
    why: "Slices are shared borrows, and any number of shared borrows can exist at once. Both slices point into <code>s</code> and only read from it, so the program compiles.",
  },
  {
    id: "a08",
    tier: "adept",
    chapter: 8,
    title: "A literal given to a String parameter",
    check: "E0308",
    rule: "type",
    rust: `fn greet(name: String) {
    println!("hello, {name}");
}

fn main() {
    greet("Ana");
}`,
    why: "This is a type error, not a borrow error. <code>\"Ana\"</code> is a <code>&amp;str</code>, a borrowed view of text baked into the binary. <code>greet</code> wants an owned <code>String</code>, so the types don't match.",
    error: `error[E0308]: mismatched types
 --> src/main.rs:6:11
  |
6 |     greet("Ana");
  |     ----- ^^^^^ expected \`String\`, found \`&str\`
  |     |
  |     arguments to this function are incorrect
  |
note: function defined here
 --> src/main.rs:1:4
  |
1 | fn greet(name: String) {
  |    ^^^^^ ------------
help: try using a conversion method
  |
6 |     greet("Ana".to_string());
  |                ++++++++++++

error: aborting due to 1 previous error

For more information about this error, try \`rustc --explain E0308\`.`,
    fix: `fn greet(name: String) {
    println!("hello, {name}");
}

fn main() {
    greet("Ana".to_string());
}`,
  },
  {
    id: "a09",
    tier: "adept",
    chapter: 12,
    title: "Moving a String out of a Vec",
    check: "E0507",
    rule: "move-out-of-borrow",
    rust: `fn main() {
    let names = vec![String::from("Ana"), String::from("Bo")];
    let first = names[0];
    println!("{first} {}", names.len());
}`,
    why: "Indexing gives you a place inside the vector, and the vector still owns that element. Moving the string out would leave the vector holding a value that was already handed away. Clone it, or borrow it with <code>&amp;names[0]</code>.",
    error: `error[E0507]: cannot move out of index of \`Vec<String>\`
 --> src/main.rs:3:17
  |
3 |     let first = names[0];
  |                 ^^^^^^^^ move occurs because value has type \`String\`, which does not implement the \`Copy\` trait
  |
help: consider borrowing here
  |
3 |     let first = &names[0];
  |                 +
help: consider cloning the value if the performance cost is acceptable
  |
3 |     let first = names[0].clone();
  |                         ++++++++

error: aborting due to 1 previous error

For more information about this error, try \`rustc --explain E0507\`.`,
    fix: `fn main() {
    let names = vec![String::from("Ana"), String::from("Bo")];
    let first = names[0].clone();
    println!("{first} {}", names.len());
}`,
  },
  {
    id: "a10",
    tier: "adept",
    chapter: 12,
    title: "Moving every element with into_iter",
    check: "ok",
    rule: null,
    rust: `fn main() {
    let names = vec![String::from("ana"), String::from("bo")];
    let mut upper = Vec::new();
    for name in names {
        upper.push(name.to_uppercase());
    }
    println!("{upper:?}");
}`,
    why: "<code>for name in names</code> consumes the vector and hands each <code>String</code> to the loop by value. That is fine because nothing reads <code>names</code> afterward. <code>to_uppercase</code> builds a new string from each one.",
  },
  {
    id: "a11",
    tier: "adept",
    chapter: 13,
    title: "Pushing while looping over it",
    check: "E0502",
    rule: "shared-mut",
    rust: `fn main() {
    let mut v = vec![1, 2, 3];
    for x in &v {
        if *x > 1 {
            v.push(*x * 10);
        }
    }
    println!("{v:?}");
}`,
    why: "<code>for x in &amp;v</code> keeps a shared borrow of <code>v</code> for the whole loop. Pushing inside the loop needs a mutable borrow, and the two can't overlap. Collect the new values first, then extend the vector after the loop.",
    error: `error[E0502]: cannot borrow \`v\` as mutable because it is also borrowed as immutable
 --> src/main.rs:5:13
  |
3 |     for x in &v {
  |              --
  |              |
  |              immutable borrow occurs here
  |              immutable borrow later used here
4 |         if *x > 1 {
5 |             v.push(*x * 10);
  |             ^^^^^^^^^^^^^^^ mutable borrow occurs here

error: aborting due to 1 previous error

For more information about this error, try \`rustc --explain E0502\`.`,
    fix: `fn main() {
    let mut v = vec![1, 2, 3];
    let extra: Vec<i32> = v.iter().filter(|x| **x > 1).map(|x| x * 10).collect();
    v.extend(extra);
    println!("{v:?}");
}`,
  },
  {
    id: "a12",
    tier: "adept",
    chapter: 6,
    title: "Moving one tuple field, borrowing the other",
    check: "ok",
    rule: null,
    rust: `fn main() {
    let pair = (String::from("Ana"), 42);
    let age = pair.1;
    println!("{} is {age}", pair.0);
}`,
    why: "Reading <code>pair.1</code> copies an <code>i32</code>, so the tuple is not moved. <code>pair.0</code> is only borrowed by <code>println!</code>. Rust tracks each field on its own, so a partly used tuple stays usable.",
  },
  {
    id: "a13",
    tier: "adept",
    chapter: 7,
    title: "Assigning under a live borrow",
    check: "E0506",
    rule: "assign-borrowed",
    rust: `fn main() {
    let mut level = 3;
    let peek = &level;
    level = 4;
    println!("{peek} {level}");
}`,
    why: "<code>peek</code> is a shared borrow of <code>level</code>, and it is used again on the last line. Assigning to <code>level</code> in between changes the value under the borrow, so the compiler refuses.",
    error: `error[E0506]: cannot assign to \`level\` because it is borrowed
 --> src/main.rs:4:5
  |
3 |     let peek = &level;
  |                ------ \`level\` is borrowed here
4 |     level = 4;
  |     ^^^^^^^^^ \`level\` is assigned to here but it was already borrowed
5 |     println!("{peek} {level}");
  |                ---- borrow later used here

error: aborting due to 1 previous error

For more information about this error, try \`rustc --explain E0506\`.`,
    fix: `fn main() {
    let mut level = 3;
    let peek = &level;
    println!("{peek}");
    level = 4;
    println!("{level}");
}`,
  },
  {
    id: "a14",
    tier: "adept",
    chapter: 13,
    title: "A closure's borrow ends after its last call",
    check: "ok",
    rule: null,
    rust: `fn main() {
    let mut count = 0;
    let mut bump = || count += 1;
    bump();
    bump();
    println!("{count}");
}`,
    why: "A closure that changes a variable holds a mutable borrow of it. That borrow lasts until the closure's last call. After that, reading <code>count</code> is allowed.",
  },
  {
    id: "a15",
    tier: "adept",
    chapter: 7,
    title: "Mutating through a shared reference",
    check: "E0596",
    rule: "not-mut",
    rust: `fn add_one(items: &Vec<i32>) {
    items.push(1);
}

fn main() {
    let mut v = vec![0];
    add_one(&v);
    println!("{v:?}");
}`,
    why: "<code>&amp;Vec&lt;i32&gt;</code> is a shared reference. It can be read but never changed. To mutate, the parameter must be <code>&amp;mut Vec&lt;i32&gt;</code>, and the caller must pass <code>&amp;mut v</code>.",
    error: `error[E0596]: cannot borrow \`*items\` as mutable, as it is behind a \`&\` reference
 --> src/main.rs:2:5
  |
2 |     items.push(1);
  |     ^^^^^ \`items\` is a \`&\` reference, so it cannot be borrowed as mutable
  |
help: consider changing this to be a mutable reference
  |
1 | fn add_one(items: &mut Vec<i32>) {
  |                    +++

error: aborting due to 1 previous error

For more information about this error, try \`rustc --explain E0596\`.`,
    fix: `fn add_one(items: &mut Vec<i32>) {
    items.push(1);
}

fn main() {
    let mut v = vec![0];
    add_one(&mut v);
    println!("{v:?}");
}`,
  },
  {
    id: "m01",
    tier: "master",
    chapter: 15,
    title: "longest without lifetimes",
    check: "E0106",
    rule: "missing-lifetime",
    rust: `fn longest(a: &str, b: &str) -> &str {
    if a.len() > b.len() {
        a
    } else {
        b
    }
}

fn main() {
    println!("{}", longest("hello", "hi"));
}`,
    why: "With two reference inputs, elision can't tell which one the returned reference comes from, so the compiler asks you to say. A lifetime parameter states that the result lives no longer than both inputs.",
    error: `error[E0106]: missing lifetime specifier
 --> src/main.rs:1:33
  |
1 | fn longest(a: &str, b: &str) -> &str {
  |               ----     ----     ^ expected named lifetime parameter
  |
  = help: this function's return type contains a borrowed value, but the signature does not say whether it is borrowed from \`a\` or \`b\`
help: consider introducing a named lifetime parameter
  |
1 | fn longest<'a>(a: &'a str, b: &'a str) -> &'a str {
  |           ++++     ++          ++          ++

error: aborting due to 1 previous error

For more information about this error, try \`rustc --explain E0106\`.`,
    fix: `fn longest<'a>(a: &'a str, b: &'a str) -> &'a str {
    if a.len() > b.len() {
        a
    } else {
        b
    }
}

fn main() {
    println!("{}", longest("hello", "hi"));
}`,
  },
  {
    id: "m02",
    tier: "master",
    chapter: 15,
    title: "One reference in, one out",
    check: "ok",
    rule: null,
    rust: `fn first_word(s: &str) -> &str {
    s.split(' ').next().unwrap_or("")
}

fn main() {
    let line = String::from("hello world");
    let word = first_word(&line);
    println!("{word}");
}`,
    why: "With exactly one reference input, elision gives the output that same lifetime. The compiler knows <code>word</code> borrows from <code>line</code>, so nothing needs annotating.",
  },
  {
    id: "m03",
    tier: "master",
    chapter: 15,
    title: "A struct that outlives its String",
    check: "E0597",
    rule: "dangling",
    rust: `struct Holder<'a> {
    text: &'a str,
}

fn main() {
    let holder;
    {
        let s = String::from("short lived");
        holder = Holder { text: &s };
    }
    println!("{}", holder.text);
}`,
    why: "<code>holder</code> lives in the outer scope, but it borrows from <code>s</code>, which is dropped at the inner closing brace. Reading <code>holder.text</code> afterward would read freed memory, so the compiler stops it.",
    error: `error[E0597]: \`s\` does not live long enough
  --> src/main.rs:9:33
   |
 8 |         let s = String::from("short lived");
   |             - binding \`s\` declared here
 9 |         holder = Holder { text: &s };
   |                                 ^^ borrowed value does not live long enough
10 |     }
   |     - \`s\` dropped here while still borrowed
11 |     println!("{}", holder.text);
   |                    ----------- borrow later used here

error: aborting due to 1 previous error

For more information about this error, try \`rustc --explain E0597\`.`,
    fix: `struct Holder<'a> {
    text: &'a str,
}

fn main() {
    let s = String::from("short lived");
    let holder = Holder { text: &s };
    println!("{}", holder.text);
}`,
  },
  {
    id: "m04",
    tier: "master",
    chapter: 15,
    title: "A struct field holding a &str",
    check: "E0106",
    rule: "missing-lifetime",
    rust: `struct Parser {
    input: &str,
}

fn main() {
    let p = Parser { input: "let x = 1;" };
    println!("{}", p.input);
}`,
    why: "A struct that holds a reference has to say how long that reference lives. A <code>Parser</code> is only valid while the text it points to is valid, and that relationship is written as a lifetime parameter.",
    error: `error[E0106]: missing lifetime specifier
 --> src/main.rs:2:12
  |
2 |     input: &str,
  |            ^ expected named lifetime parameter
  |
help: consider introducing a named lifetime parameter
  |
1 ~ struct Parser<'a> {
2 ~     input: &'a str,
  |

error: aborting due to 1 previous error

For more information about this error, try \`rustc --explain E0106\`.`,
    fix: `struct Parser<'a> {
    input: &'a str,
}

fn main() {
    let p = Parser { input: "let x = 1;" };
    println!("{}", p.input);
}`,
  },
  {
    id: "m05",
    tier: "master",
    chapter: 18,
    title: "A thread borrows a local",
    check: "E0373",
    rule: "closure-outlives",
    rust: `use std::thread;

fn main() {
    let v = vec![1, 2, 3];
    let handle = thread::spawn(|| {
        println!("{v:?}");
    });
    handle.join().unwrap();
}`,
    why: "A spawned thread can outlive the function that started it, so its closure must own what it uses. This one borrows <code>v</code> instead. Adding <code>move</code> transfers ownership of <code>v</code> into the thread.",
    error: `error[E0373]: closure may outlive the current function, but it borrows \`v\`, which is owned by the current function
 --> src/main.rs:5:32
  |
5 |     let handle = thread::spawn(|| {
  |                                ^^ may outlive borrowed value \`v\`
6 |         println!("{v:?}");
  |                    - \`v\` is borrowed here
  |
note: function requires argument type to outlive \`'static\`
 --> src/main.rs:5:18
  |
5 |       let handle = thread::spawn(|| {
  |  __________________^
6 | |         println!("{v:?}");
7 | |     });
  | |______^
help: to force the closure to take ownership of \`v\` (and any other referenced variables), use the \`move\` keyword
  |
5 |     let handle = thread::spawn(move || {
  |                                ++++

error: aborting due to 1 previous error

For more information about this error, try \`rustc --explain E0373\`.`,
    fix: `use std::thread;

fn main() {
    let v = vec![1, 2, 3];
    let handle = thread::spawn(move || {
        println!("{v:?}");
    });
    handle.join().unwrap();
}`,
  },
  {
    id: "m06",
    tier: "master",
    chapter: 18,
    title: "An Rc sent to another thread",
    check: "E0277",
    rule: "not-send",
    rust: `use std::rc::Rc;
use std::thread;

fn main() {
    let shared = Rc::new(5);
    let handle = thread::spawn(move || {
        println!("{shared}");
    });
    handle.join().unwrap();
}`,
    why: "<code>Rc</code> updates its reference count with plain, non-atomic arithmetic. Two threads touching it could corrupt the count, so <code>Rc</code> is not <code>Send</code>. <code>Arc</code> uses atomic counts and can cross threads.",
    error: `error[E0277]: \`Rc<i32>\` cannot be sent between threads safely
   --> src/main.rs:6:32
    |
  6 |       let handle = thread::spawn(move || {
    |                    ------------- ^------
    |                    |             |
    |  __________________|_____________within this \`{closure@src/main.rs:6:32: 6:39}\`
    | |                  |
    | |                  required by a bound introduced by this call
  7 | |         println!("{shared}");
  8 | |     });
    | |_____^ \`Rc<i32>\` cannot be sent between threads safely
    |
    = help: within \`{closure@src/main.rs:6:32: 6:39}\`, the trait \`Send\` is not implemented for \`Rc<i32>\`
note: required because it's used within this closure
   --> src/main.rs:6:32
    |
  6 |     let handle = thread::spawn(move || {
    |                                ^^^^^^^
note: required by a bound in \`spawn\`
   --> /rustc/library/std/src/thread/functions.rs:128:8
    |
125 | pub fn spawn<F, T>(f: F) -> JoinHandle<T>
    |        ----- required by a bound in this function
...
128 |     F: Send + 'static,
    |        ^^^^ required by this bound in \`spawn\`

error: aborting due to 1 previous error

For more information about this error, try \`rustc --explain E0277\`.`,
    fix: `use std::sync::Arc;
use std::thread;

fn main() {
    let shared = Arc::new(5);
    let handle = thread::spawn(move || {
        println!("{shared}");
    });
    handle.join().unwrap();
}`,
  },
  {
    id: "m07",
    tier: "master",
    chapter: 18,
    title: "Scoped threads borrow the stack",
    check: "ok",
    rule: null,
    rust: `use std::thread;

fn main() {
    let names = vec!["Ana", "Bo"];
    thread::scope(|s| {
        s.spawn(|| println!("count: {}", names.len()));
    });
    println!("still have {:?}", names);
}`,
    why: "<code>thread::scope</code> joins every thread it starts before the scope returns. That lets the threads borrow <code>names</code> from this stack frame, and the borrows end before the final <code>println!</code>.",
  },
  {
    id: "m08",
    tier: "master",
    chapter: 17,
    title: "RefCell checks at runtime",
    check: "ok",
    rule: null,
    rust: `use std::cell::RefCell;

fn main() {
    let cell = RefCell::new(vec![1]);
    let first = cell.borrow_mut();
    let second = cell.borrow_mut();
    println!("{} {}", first.len(), second.len());
}`,
    why: "The compiler can't see that the two <code>borrow_mut</code> calls overlap, so it accepts the program. <code>RefCell</code> checks the rules at runtime instead, and this one panics on the second call. The verdict is that it compiles; the behavior is a panic.",
  },
  {
    id: "m09",
    tier: "master",
    chapter: 13,
    title: "A move closure takes the String",
    check: "E0382",
    rule: "move",
    rust: `fn main() {
    let name = String::from("Ana");
    let greet = move || println!("hi {name}");
    greet();
    println!("{name} is still here");
}`,
    why: "A <code>move</code> closure takes ownership of every value it captures, here <code>name</code>. The closure owns the string now, so the later <code>println!</code> reads a moved value.",
    error: `error[E0382]: borrow of moved value: \`name\`
 --> src/main.rs:5:16
  |
2 |     let name = String::from("Ana");
  |         ---- move occurs because \`name\` has type \`String\`, which does not implement the \`Copy\` trait
3 |     let greet = move || println!("hi {name}");
  |                 -------               ---- variable moved due to use in closure
  |                 |
  |                 value moved into closure here
4 |     greet();
5 |     println!("{name} is still here");
  |                ^^^^ value borrowed here after move
  |
help: consider cloning the value before moving it into the closure
  |
3 ~     let value = name.clone();
4 ~     let greet = move || println!("hi {value}");
  |

error: aborting due to 1 previous error

For more information about this error, try \`rustc --explain E0382\`.`,
    fix: `fn main() {
    let name = String::from("Ana");
    let greet = || println!("hi {name}");
    greet();
    println!("{name} is still here");
}`,
  },
  {
    id: "m10",
    tier: "master",
    chapter: 13,
    title: "A closure holds &mut while you read",
    check: "E0502",
    rule: "shared-mut",
    rust: `fn main() {
    let mut v = vec![1, 2];
    let mut add = || v.push(3);
    println!("{v:?}");
    add();
}`,
    why: "The closure holds a mutable borrow of <code>v</code> until its last call, and that call comes after the <code>println!</code>. Reading <code>v</code> in between needs a shared borrow that overlaps the mutable one.",
    error: `error[E0502]: cannot borrow \`v\` as immutable because it is also borrowed as mutable
 --> src/main.rs:4:16
  |
3 |     let mut add = || v.push(3);
  |                   -- - first borrow occurs due to use of \`v\` in closure
  |                   |
  |                   mutable borrow occurs here
4 |     println!("{v:?}");
  |                ^ immutable borrow occurs here
5 |     add();
  |     --- mutable borrow later used here

error: aborting due to 1 previous error

For more information about this error, try \`rustc --explain E0502\`.`,
    fix: `fn main() {
    let mut v = vec![1, 2];
    let mut add = || v.push(3);
    add();
    println!("{v:?}");
}`,
  },
  {
    id: "m11",
    tier: "master",
    chapter: 13,
    title: "Two closures, one counter",
    check: "E0499",
    rule: "two-mut",
    rust: `fn main() {
    let mut count = 0;
    let mut inc = || count += 1;
    let mut twice = || count += 2;
    inc();
    twice();
}`,
    why: "Each closure takes a mutable borrow of <code>count</code> when it is created, and both borrows last until the closures are called. Two live mutable borrows is the same conflict as two <code>&amp;mut</code> references.",
    error: `error[E0499]: cannot borrow \`count\` as mutable more than once at a time
 --> src/main.rs:4:21
  |
3 |     let mut inc = || count += 1;
  |                   -- ----- first borrow occurs due to use of \`count\` in closure
  |                   |
  |                   first mutable borrow occurs here
4 |     let mut twice = || count += 2;
  |                     ^^ ----- second borrow occurs due to use of \`count\` in closure
  |                     |
  |                     second mutable borrow occurs here
5 |     inc();
  |     --- first borrow later used here

error: aborting due to 1 previous error

For more information about this error, try \`rustc --explain E0499\`.`,
    fix: `fn main() {
    let mut count = 0;
    let mut inc = || count += 1;
    inc();
    let mut twice = || count += 2;
    twice();
}`,
  },
  {
    id: "m12",
    tier: "master",
    chapter: 13,
    title: "Calling an FnMut from a plain binding",
    check: "E0596",
    rule: "not-mut",
    rust: `fn main() {
    let mut count = 0;
    let inc = || count += 1;
    inc();
    inc();
    println!("{count}");
}`,
    why: "Calling this closure changes <code>count</code>, so the closure is <code>FnMut</code>. Calling an <code>FnMut</code> closure borrows it mutably, and that needs a <code>mut</code> binding.",
    error: `error[E0596]: cannot borrow \`inc\` as mutable, as it is not declared as mutable
 --> src/main.rs:3:9
  |
3 |     let inc = || count += 1;
  |         ^^^      ----- calling \`inc\` requires mutable binding due to mutable borrow of \`count\`
  |         |
  |         not mutable
4 |     inc();
  |     --- cannot borrow as mutable
5 |     inc();
  |     --- cannot borrow as mutable
  |
help: consider changing this to be mutable
  |
3 |     let mut inc = || count += 1;
  |         +++

error: aborting due to 1 previous error

For more information about this error, try \`rustc --explain E0596\`.`,
    fix: `fn main() {
    let mut count = 0;
    let mut inc = || count += 1;
    inc();
    inc();
    println!("{count}");
}`,
  },
  {
    id: "m13",
    tier: "master",
    chapter: 15,
    title: "Split a temporary String",
    check: "E0716",
    rule: "dangling",
    rust: `fn main() {
    let words: Vec<&str>;
    words = String::from("a b c").split(' ').collect();
    println!("{words:?}");
}`,
    why: "<code>String::from</code> creates a temporary that is dropped at the end of its statement. The <code>&amp;str</code> pieces from <code>split</code> borrow from that temporary, so <code>words</code> would point at freed memory.",
    error: `error[E0716]: temporary value dropped while borrowed
 --> src/main.rs:3:13
  |
3 |     words = String::from("a b c").split(' ').collect();
  |             ^^^^^^^^^^^^^^^^^^^^^                     - temporary value is freed at the end of this statement
  |             |
  |             creates a temporary value which is freed while still in use
4 |     println!("{words:?}");
  |                ----- borrow later used here
  |
help: consider using a \`let\` binding to create a longer lived value
  |
3 ~     let binding = String::from("a b c");
4 ~     words = binding.split(' ').collect();
  |

error: aborting due to 1 previous error

For more information about this error, try \`rustc --explain E0716\`.`,
    fix: `fn main() {
    let text = String::from("a b c");
    let words: Vec<&str> = text.split(' ').collect();
    println!("{words:?}");
}`,
  },
  {
    id: "m14",
    tier: "master",
    chapter: 8,
    title: "split_at_mut hands out two halves",
    check: "ok",
    rule: null,
    rust: `fn main() {
    let mut v = vec![1, 2, 3, 4];
    let (left, right) = v.split_at_mut(2);
    left[0] += right[0];
    println!("{v:?}");
}`,
    why: "<code>split_at_mut</code> turns one mutable borrow of <code>v</code> into two slices that cover different elements. The borrow checker sees a single borrow, and the standard library uses <code>unsafe</code> inside to hand out the two halves. It checks the split point first, so the halves cannot overlap.",
  },
  {
    id: "m15",
    tier: "master",
    chapter: 17,
    title: "Moving out of an Rc",
    check: "E0507",
    rule: "move-out-of-borrow",
    rust: `use std::rc::Rc;

fn main() {
    let name = Rc::new(String::from("Ana"));
    let owned: String = *name;
    println!("{owned} {}", Rc::strong_count(&name));
}`,
    why: "<code>*name</code> reaches the <code>String</code> inside the <code>Rc</code>. Other <code>Rc</code>s may share that string, so it can't be moved out. You can clone it, or borrow it.",
    error: `error[E0507]: cannot move out of an \`Rc\`
 --> src/main.rs:5:25
  |
5 |     let owned: String = *name;
  |                         ^^^^^ move occurs because value has type \`String\`, which does not implement the \`Copy\` trait
  |
help: consider removing the dereference here
  |
5 -     let owned: String = *name;
5 +     let owned: String = name;
  |
help: consider cloning the value if the performance cost is acceptable
  |
5 -     let owned: String = *name;
5 +     let owned: String = name.clone();
  |

error: aborting due to 1 previous error

For more information about this error, try \`rustc --explain E0507\`.`,
    fix: `use std::rc::Rc;

fn main() {
    let name = Rc::new(String::from("Ana"));
    let owned: String = (*name).clone();
    println!("{owned} {}", Rc::strong_count(&name));
}`,
  },
];
