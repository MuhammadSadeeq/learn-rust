/* Error Museum exhibits (window.OX_ERRORS).
   Each `error` is the real output of rustc 1.97, edition 2024, for the
   `rust` program next to it. The temporary path is shown as src/main.rs, and
   notes that point into the standard library source are left out.
   Every `fixes[].rust` compiles. Checked by tools/check-snippets.mjs. */
window.OX_ERRORS = [
  {
    id: "E0382",
    title: "borrow of moved value",
    check: "E0382",
    chapter: 6,
    tags: ["ownership"],
    rust: `fn main() {
    let name = String::from("Ada");
    let greeting = name;
    println!("{name} says hello as {greeting}");
}`,
    error: `error[E0382]: borrow of moved value: \`name\`
 --> src/main.rs:4:16
  |
2 |     let name = String::from("Ada");
  |         ---- move occurs because \`name\` has type \`String\`, which does not implement the \`Copy\` trait
3 |     let greeting = name;
  |                    ---- value moved here
4 |     println!("{name} says hello as {greeting}");
  |                ^^^^ value borrowed here after move
  |
help: consider cloning the value if the performance cost is acceptable
  |
3 |     let greeting = name.clone();
  |                        ++++++++

error: aborting due to 1 previous error

For more information about this error, try \`rustc --explain E0382\`.`,
    plain: `Assigning a String to a new name moves it. The old name is no longer valid, so any later use of it is an error.`,
    phpNote: `In PHP, \`$greeting = $name;\` leaves both variables usable. PHP strings and arrays are values, and objects are shared handles, so there is no moved-from state. Rust has neither, and after a move the old name cannot be used.`,
    fixes: [
      {
        title: "Clone it",
        rust: `fn main() {
    let name = String::from("Ada");
    let greeting = name.clone();
    println!("{name} says hello as {greeting}");
}`,
        note: `\`clone()\` makes a second, independent String on the heap. Both names are valid afterwards. Use it when you really need two owners, since it copies the bytes.`
      },
      {
        title: "Borrow it",
        rust: `fn main() {
    let name = String::from("Ada");
    let greeting = &name;
    println!("{name} says hello as {greeting}");
}`,
        note: `\`&name\` lends the value and keeps the owner in \`name\`. Most functions only need to read a value, which is why \`&\` shows up so often.`
      },
      {
        title: "Use only the new name",
        rust: `fn main() {
    let name = String::from("Ada");
    let greeting = name;
    println!("{greeting} says hello");
}`,
        note: `After the move, \`greeting\` is the only name for the value. Stop using the old name once you have moved from it.`
      }
    ]
  },
  {
    id: "E0499",
    title: "cannot borrow `scores` as mutable more than once at a time",
    check: "E0499",
    chapter: 7,
    tags: ["borrowing"],
    rust: `fn main() {
    let mut scores = vec![10, 20, 30];
    let first = &mut scores;
    let second = &mut scores;
    first.push(40);
    second.push(50);
}`,
    error: `error[E0499]: cannot borrow \`scores\` as mutable more than once at a time
 --> src/main.rs:4:18
  |
3 |     let first = &mut scores;
  |                 ----------- first mutable borrow occurs here
4 |     let second = &mut scores;
  |                  ^^^^^^^^^^^ second mutable borrow occurs here
5 |     first.push(40);
  |     ----- first borrow later used here

error: aborting due to 1 previous error

For more information about this error, try \`rustc --explain E0499\`.`,
    plain: `Only one \`&mut\` may be alive at a time, and while it is alive nothing else may touch the value. Here \`first\` is still used after \`second\` asks for its own \`&mut\`.`,
    phpNote: `PHP has no such rule. \`$first = &$scores; $second = &$scores;\` gives two names for one array, and both can write whenever they like. Rust allows one writer at a time, so this bug cannot compile.`,
    fixes: [
      {
        title: "Finish the first borrow",
        rust: `fn main() {
    let mut scores = vec![10, 20, 30];
    let first = &mut scores;
    first.push(40);
    let second = &mut scores;
    second.push(50);
}`,
        note: `A borrow lasts until its last use, not until the end of the block. Here \`first\` is finished before \`second\` starts, so the two never overlap.`
      },
      {
        title: "Use the owner",
        rust: `fn main() {
    let mut scores = vec![10, 20, 30];
    scores.push(40);
    scores.push(50);
}`,
        note: `If you do not need a second name, use the owner directly. The owner may change the value whenever no other borrow exists.`
      }
    ]
  },
  {
    id: "E0502",
    title: "cannot borrow `names` as mutable because it is also borrowed as immutable",
    check: "E0502",
    chapter: 7,
    tags: ["borrowing"],
    rust: `fn main() {
    let mut names = vec![String::from("Ada"), String::from("Grace")];
    let first = &names[0];
    names.push(String::from("Linus"));
    println!("first is {first}");
}`,
    error: `error[E0502]: cannot borrow \`names\` as mutable because it is also borrowed as immutable
 --> src/main.rs:4:5
  |
3 |     let first = &names[0];
  |                  ----- immutable borrow occurs here
4 |     names.push(String::from("Linus"));
  |     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ mutable borrow occurs here
5 |     println!("first is {first}");
  |                         ----- immutable borrow later used here

error: aborting due to 1 previous error

For more information about this error, try \`rustc --explain E0502\`.`,
    plain: `A shared borrow promises that the value will not change while the borrow is alive. \`push\` may move the vector's buffer to a new place, which would leave \`first\` pointing at freed memory, so the change is refused while \`first\` is still needed.`,
    phpNote: `\`$first = $names[0];\` copies the value, so later pushes cannot affect it. Rust's \`&names[0]\` points into the vector's buffer, and \`push\` may move that buffer, so the borrow checker stops the push while \`first\` is still in use.`,
    fixes: [
      {
        title: "Copy the value out",
        rust: `fn main() {
    let mut names = vec![String::from("Ada"), String::from("Grace")];
    let first = names[0].clone();
    names.push(String::from("Linus"));
    println!("first is {first}");
}`,
        note: `The clone is a separate String. \`first\` no longer points into the vector, so the push is allowed.`
      },
      {
        title: "Use the borrow before the change",
        rust: `fn main() {
    let mut names = vec![String::from("Ada"), String::from("Grace")];
    let first = &names[0];
    println!("first is {first}");
    names.push(String::from("Linus"));
}`,
        note: `A shared borrow ends at its last use. Read through it first, then change the vector.`
      }
    ]
  },
  {
    id: "E0505",
    title: "cannot move out of `title` because it is borrowed",
    check: "E0505",
    chapter: 7,
    tags: ["ownership", "borrowing"],
    rust: `fn consume(s: String) -> usize {
    s.len()
}

fn main() {
    let title = String::from("Oxidize");
    let view = &title;
    let n = consume(title);
    println!("{view} has {n} bytes");
}`,
    error: `error[E0505]: cannot move out of \`title\` because it is borrowed
 --> src/main.rs:8:21
  |
6 |     let title = String::from("Oxidize");
  |         ----- binding \`title\` declared here
7 |     let view = &title;
  |                ------ borrow of \`title\` occurs here
8 |     let n = consume(title);
  |                     ^^^^^ move out of \`title\` occurs here
9 |     println!("{view} has {n} bytes");
  |                ---- borrow later used here
  |
help: consider cloning the value if the performance cost is acceptable
  |
7 |     let view = &title.clone();
  |                      ++++++++

error: aborting due to 1 previous error

For more information about this error, try \`rustc --explain E0505\`.`,
    plain: `You cannot move a value while something is still borrowing it. \`view\` would point at a String that \`consume\` now owns, and that String is freed when \`consume\` returns.`,
    phpNote: `PHP never moves a value out from under another name. \`consume($title)\` passes a copy-on-write string, and \`$view\` keeps working. In Rust the move transfers the one owner, so no borrow may still point at the old owner.`,
    fixes: [
      {
        title: "Borrow instead of moving",
        rust: `fn consume(s: &str) -> usize {
    s.len()
}

fn main() {
    let title = String::from("Oxidize");
    let view = &title;
    let n = consume(view);
    println!("{view} has {n} bytes");
}`,
        note: `The function only reads the text, so it takes \`&str\`. Passing a borrow leaves the owner where it is. A \`String\` parameter means the function takes ownership.`
      },
      {
        title: "Clone before the move",
        rust: `fn consume(s: String) -> usize {
    s.len()
}

fn main() {
    let title = String::from("Oxidize");
    let view = &title;
    let n = consume(title.clone());
    println!("{view} has {n} bytes");
}`,
        note: `The clone is moved into the function and the original stays with its owner. The cost is one copy of the bytes.`
      },
      {
        title: "End the borrow first",
        rust: `fn consume(s: String) -> usize {
    s.len()
}

fn main() {
    let title = String::from("Oxidize");
    let view = &title;
    println!("{view} is the title");
    let n = consume(title);
    println!("{n} bytes");
}`,
        note: `Once the last use of \`view\` has passed, the borrow is over and the move is allowed.`
      }
    ]
  },
  {
    id: "E0506",
    title: "cannot assign to `level` because it is borrowed",
    check: "E0506",
    chapter: 7,
    tags: ["borrowing"],
    rust: `fn main() {
    let mut level = 3;
    let snapshot = &level;
    level = 4;
    println!("snapshot {snapshot}, level {level}");
}`,
    error: `error[E0506]: cannot assign to \`level\` because it is borrowed
 --> src/main.rs:4:5
  |
3 |     let snapshot = &level;
  |                    ------ \`level\` is borrowed here
4 |     level = 4;
  |     ^^^^^^^^^ \`level\` is assigned to here but it was already borrowed
5 |     println!("snapshot {snapshot}, level {level}");
  |                         -------- borrow later used here

error: aborting due to 1 previous error

For more information about this error, try \`rustc --explain E0506\`.`,
    plain: `Assigning to a value while it is borrowed would change what the borrow sees. Rust makes you finish with the borrow before you assign.`,
    phpNote: `In PHP, \`$snapshot = &$level; $level = 4;\` changes what \`$snapshot\` reads, because both names refer to one variable. Rust refuses the write while the borrow is needed, so the reader always sees a stable value.`,
    fixes: [
      {
        title: "Copy it into its own name",
        rust: `fn main() {
    let mut level = 3;
    let snapshot = level;
    level = 4;
    println!("snapshot {snapshot}, level {level}");
}`,
        note: `\`i32\` is \`Copy\`, so \`snapshot\` is a separate number. It records the old value and nothing else.`
      },
      {
        title: "Read before writing",
        rust: `fn main() {
    let mut level = 3;
    let snapshot = &level;
    println!("snapshot {snapshot}");
    level = 4;
    println!("level {level}");
}`,
        note: `The borrow ends at its last use. After that the assignment is allowed.`
      }
    ]
  },
  {
    id: "E0507",
    title: "cannot move out of `order.customer` which is behind a shared reference",
    check: "E0507",
    chapter: 7,
    tags: ["ownership", "borrowing"],
    rust: `struct Order {
    customer: String,
}

fn customer_name(order: &Order) -> String {
    order.customer
}

fn main() {
    let order = Order { customer: String::from("Ada") };
    println!("{}", customer_name(&order));
}`,
    error: `error[E0507]: cannot move out of \`order.customer\` which is behind a shared reference
 --> src/main.rs:6:5
  |
6 |     order.customer
  |     ^^^^^^^^^^^^^^ move occurs because \`order.customer\` has type \`String\`, which does not implement the \`Copy\` trait
  |
help: consider cloning the value if the performance cost is acceptable
  |
6 |     order.customer.clone()
  |                   ++++++++

error: aborting due to 1 previous error

For more information about this error, try \`rustc --explain E0507\`.`,
    plain: `You cannot take a value out of something you only borrowed. The owner would be left with a missing field, and it could no longer be used or dropped safely.`,
    phpNote: `In PHP, \`return $order->customer;\` hands back the string, and the order keeps its own value. Rust cannot move a field out of a borrowed struct, because the owner would be left with a hole in it.`,
    fixes: [
      {
        title: "Clone the field",
        rust: `struct Order {
    customer: String,
}

fn customer_name(order: &Order) -> String {
    order.customer.clone()
}

fn main() {
    let order = Order { customer: String::from("Ada") };
    println!("{}", customer_name(&order));
}`,
        note: `The function returns its own copy, and the order keeps its field. This is the simplest fix and usually the right one for a getter.`
      },
      {
        title: "Return a borrow",
        rust: `struct Order {
    customer: String,
}

fn customer_name(order: &Order) -> &str {
    &order.customer
}

fn main() {
    let order = Order { customer: String::from("Ada") };
    println!("{}", customer_name(&order));
}`,
        note: `The result borrows from the order, so no copy is made. The caller must keep the order alive while it uses the name.`
      },
      {
        title: "Take ownership",
        rust: `struct Order {
    customer: String,
}

fn customer_name(order: Order) -> String {
    order.customer
}

fn main() {
    let order = Order { customer: String::from("Ada") };
    println!("{}", customer_name(order));
}`,
        note: `The caller gives the order away and the function returns the field. This fits a step that consumes the value, not a getter.`
      }
    ]
  },
  {
    id: "E0596",
    title: "cannot borrow `names` as mutable, as it is not declared as mutable",
    check: "E0596",
    chapter: 7,
    tags: ["borrowing"],
    rust: `fn main() {
    let names = Vec::new();
    names.push("Ada");
    println!("{names:?}");
}`,
    error: `error[E0596]: cannot borrow \`names\` as mutable, as it is not declared as mutable
 --> src/main.rs:3:5
  |
3 |     names.push("Ada");
  |     ^^^^^ cannot borrow as mutable
  |
help: consider changing this to be mutable
  |
2 |     let mut names = Vec::new();
  |         +++

error: aborting due to 1 previous error

For more information about this error, try \`rustc --explain E0596\`.`,
    plain: `A binding is immutable unless it says \`mut\`. Taking a \`&mut\` borrow, or calling a method that needs one, requires that permission on the binding itself.`,
    phpNote: `PHP arrays are mutable by default, so \`$names[] = 'Ada';\` just works. In Rust, mutability belongs to the binding, and you must write \`mut\` when you create it.`,
    fixes: [
      {
        title: "Declare it mut",
        rust: `fn main() {
    let mut names = Vec::new();
    names.push("Ada");
    println!("{names:?}");
}`,
        note: `\`mut\` says this binding will change. Add it only to the bindings that really need to change.`
      },
      {
        title: "Alternative: build it in one step",
        rust: `fn main() {
    let names = vec!["Ada"];
    println!("{names:?}");
}`,
        note: `This changes the program: the push is gone. If nothing changes after creation, leave the binding immutable and build the value in one expression with \`vec!\`.`
      }
    ]
  },
  {
    id: "E0597",
    title: "`word` does not live long enough",
    check: "E0597",
    chapter: 15,
    tags: ["lifetimes"],
    rust: `fn main() {
    let longest: &String;
    {
        let word = String::from("ownership");
        longest = &word;
    }
    println!("{longest}");
}`,
    error: `error[E0597]: \`word\` does not live long enough
 --> src/main.rs:5:19
  |
4 |         let word = String::from("ownership");
  |             ---- binding \`word\` declared here
5 |         longest = &word;
  |                   ^^^^^ borrowed value does not live long enough
6 |     }
  |     - \`word\` dropped here while still borrowed
7 |     println!("{longest}");
  |                ------- borrow later used here

error: aborting due to 1 previous error

For more information about this error, try \`rustc --explain E0597\`.`,
    plain: `\`word\` is dropped at the closing brace of the inner block. \`longest\` is used after that brace, so it would point at memory that has already been freed.`,
    phpNote: `PHP has no block scope. A variable created inside an \`if\` still exists after the closing brace. Rust ends \`word\` at its brace and refuses any reference that would outlive it.`,
    fixes: [
      {
        title: "Keep the owner outside",
        rust: `fn main() {
    let word = String::from("ownership");
    let longest: &String = &word;
    println!("{longest}");
}`,
        note: `The owner lives in the outer scope, and the borrow ends before it does.`
      },
      {
        title: "Move the value out",
        rust: `fn main() {
    let longest: String;
    {
        let word = String::from("ownership");
        longest = word;
    }
    println!("{longest}");
}`,
        note: `The String is moved out of the block, so the new owner outlives the block. Nothing is borrowed from the inner scope.`
      },
      {
        title: "Use a string literal",
        rust: `fn main() {
    let longest: &str = "ownership";
    println!("{longest}");
}`,
        note: `String literals live for the whole program, so a \`&str\` to one never dangles. Use this only when the text is known at compile time.`
      }
    ]
  },
  {
    id: "E0716",
    title: "temporary value dropped while borrowed",
    check: "E0716",
    chapter: 8,
    tags: ["borrowing", "lifetimes"],
    rust: `fn main() {
    let shout: &str = String::from("hello").as_str();
    println!("{shout}");
}`,
    error: `error[E0716]: temporary value dropped while borrowed
 --> src/main.rs:2:23
  |
2 |     let shout: &str = String::from("hello").as_str();
  |                       ^^^^^^^^^^^^^^^^^^^^^         - temporary value is freed at the end of this statement
  |                       |
  |                       creates a temporary value which is freed while still in use
3 |     println!("{shout}");
  |                ----- borrow later used here
  |
help: consider using a \`let\` binding to create a longer lived value
  |
2 ~     let binding = String::from("hello");
3 ~     let shout: &str = binding.as_str();
  |

error: aborting due to 1 previous error

For more information about this error, try \`rustc --explain E0716\`.`,
    plain: `\`String::from("hello")\` is a temporary value. It is dropped at the end of the \`let\` statement, but \`shout\` still borrows from it and uses it afterwards.`,
    phpNote: `A PHP string stays alive while any name holds it, so no view of a temporary can dangle. \`$shout = strtoupper('hello');\` just keeps the result. In Rust the temporary is freed at the end of the statement, and \`as_str()\` must not outlive it.`,
    fixes: [
      {
        title: "Name the owner",
        rust: `fn main() {
    let text = String::from("hello");
    let shout = text.as_str();
    println!("{shout}");
}`,
        note: `The String now has a name, so it lives until the end of \`main\`. \`as_str()\` borrows from it safely.`
      },
      {
        title: "Keep the String",
        rust: `fn main() {
    let shout = String::from("hello");
    println!("{shout}");
}`,
        note: `If you only need the text, keep the owned String and skip the \`&str\` entirely.`
      },
      {
        title: "Use a literal",
        rust: `fn main() {
    let shout: &str = "hello";
    println!("{shout}");
}`,
        note: `A literal is a \`&'static str\`. It is never a temporary, so it can be borrowed for as long as you like.`
      }
    ]
  },
  {
    id: "E0106",
    title: "missing lifetime specifier",
    check: "E0106",
    chapter: 15,
    tags: ["lifetimes"],
    rust: `fn longer(a: &str, b: &str) -> &str {
    if a.len() > b.len() { a } else { b }
}

fn main() {
    println!("{}", longer("pear", "banana"));
}`,
    error: `error[E0106]: missing lifetime specifier
 --> src/main.rs:1:32
  |
1 | fn longer(a: &str, b: &str) -> &str {
  |              ----     ----     ^ expected named lifetime parameter
  |
  = help: this function's return type contains a borrowed value, but the signature does not say whether it is borrowed from \`a\` or \`b\`
help: consider introducing a named lifetime parameter
  |
1 | fn longer<'a>(a: &'a str, b: &'a str) -> &'a str {
  |          ++++     ++          ++          ++

error: aborting due to 1 previous error

For more information about this error, try \`rustc --explain E0106\`.`,
    plain: `A function that returns a reference must say which input it came from. With one reference input rustc can guess, but with two it cannot.`,
    phpNote: `PHP has no lifetimes to name. A function can return a reference, and PHP keeps the value alive while any name holds it, so the reference cannot dangle. In Rust a returned reference is valid only as long as its source, and the signature must say which source.`,
    fixes: [
      {
        title: "Name the lifetime",
        rust: `fn longer<'a>(a: &'a str, b: &'a str) -> &'a str {
    if a.len() > b.len() { a } else { b }
}

fn main() {
    println!("{}", longer("pear", "banana"));
}`,
        note: `\`'a\` says the result lives no longer than both inputs. It describes how the borrows relate. It does not make anything live longer.`
      },
      {
        title: "Return an owned String",
        rust: `fn longer(a: &str, b: &str) -> String {
    if a.len() > b.len() { a.to_string() } else { b.to_string() }
}

fn main() {
    println!("{}", longer("pear", "banana"));
}`,
        note: `The caller gets its own copy, so no lifetime is needed. The cost is one allocation per call.`
      },
      {
        title: "Tie the output to one input",
        rust: `fn longer<'a>(a: &'a str, _b: &str) -> &'a str {
    a
}

fn main() {
    println!("{}", longer("pear", "banana"));
}`,
        note: `When the answer can only come from \`a\`, say so. The output then borrows \`a\` alone, and \`_b\` can be any length. Use this shape only when one input really is the answer. Otherwise name the lifetime, as in the first fix.`
      }
    ]
  },
  {
    id: "E0373",
    title: "closure may outlive the current function, but it borrows `orders`, which is owned by the current function",
    check: "E0373",
    chapter: 18,
    tags: ["threads", "closures"],
    rust: `use std::thread;

fn main() {
    let orders = vec![3, 1, 2];
    let handle = thread::spawn(|| {
        println!("{} orders", orders.len());
    });
    handle.join().unwrap();
}`,
    error: `error[E0373]: closure may outlive the current function, but it borrows \`orders\`, which is owned by the current function
 --> src/main.rs:5:32
  |
5 |     let handle = thread::spawn(|| {
  |                                ^^ may outlive borrowed value \`orders\`
6 |         println!("{} orders", orders.len());
  |                               ------ \`orders\` is borrowed here
  |
note: function requires argument type to outlive \`'static\`
 --> src/main.rs:5:18
  |
5 |       let handle = thread::spawn(|| {
  |  __________________^
6 | |         println!("{} orders", orders.len());
7 | |     });
  | |______^
help: to force the closure to take ownership of \`orders\` (and any other referenced variables), use the \`move\` keyword
  |
5 |     let handle = thread::spawn(move || {
  |                                ++++

error: aborting due to 1 previous error

For more information about this error, try \`rustc --explain E0373\`.`,
    plain: `The thread may still run after \`main\` has finished using its local \`orders\`. \`move\` gives the thread ownership of the data, so it never points into a frame that is gone.`,
    phpNote: `Ordinary PHP has no threads, so this never came up. In Rust a spawned thread can outlive the function that started it, so the compiler asks whether the thread owns its data or borrows it safely.`,
    fixes: [
      {
        title: "Move the data in",
        rust: `use std::thread;

fn main() {
    let orders = vec![3, 1, 2];
    let handle = thread::spawn(move || {
        println!("{} orders", orders.len());
    });
    handle.join().unwrap();
}`,
        note: `\`move\` transfers ownership of \`orders\` into the closure. The thread owns its data, so it may outlive \`main\`'s locals.`
      },
      {
        title: "Use a scoped thread",
        rust: `use std::thread;

fn main() {
    let orders = vec![3, 1, 2];
    thread::scope(|s| {
        s.spawn(|| {
            println!("{} orders", orders.len());
        });
    });
}`,
        note: `\`thread::scope\` waits for every thread it started before it returns, so borrowing \`orders\` is safe. Use it when the threads only need data from this function.`
      }
    ]
  },
  {
    id: "E0384",
    title: "cannot assign twice to immutable variable `total`",
    check: "E0384",
    chapter: 2,
    tags: ["ownership"],
    rust: `fn main() {
    let total = 0;
    for price in [5, 7, 9] {
        total += price;
    }
    println!("{total}");
}`,
    error: `error[E0384]: cannot assign twice to immutable variable \`total\`
 --> src/main.rs:4:9
  |
2 |     let total = 0;
  |         ----- first assignment to \`total\`
3 |     for price in [5, 7, 9] {
4 |         total += price;
  |         ^^^^^^^^^^^^^^ cannot assign twice to immutable variable
  |
help: consider making this binding mutable
  |
2 |     let mut total = 0;
  |         +++

error: aborting due to 1 previous error

For more information about this error, try \`rustc --explain E0384\`.`,
    plain: `A binding is immutable by default. \`total += price\` assigns to it again, and Rust refuses to assign to an immutable binding.`,
    phpNote: `PHP variables are always mutable, so \`$total += $price;\` is normal. In Rust a binding is immutable unless you write \`mut\`. This is one of the most common first errors, and the fix is one word.`,
    fixes: [
      {
        title: "Make it mut",
        rust: `fn main() {
    let mut total = 0;
    for price in [5, 7, 9] {
        total += price;
    }
    println!("{total}");
}`,
        note: `\`mut\` lets the binding change. Use it when a value is accumulated step by step.`
      },
      {
        title: "Alternative: compute it in one expression",
        rust: `fn main() {
    let total: i32 = [5, 7, 9].iter().sum();
    println!("{total}");
}`,
        note: `This changes the program. Nothing is reassigned, and \`sum\` builds the total from an iterator, which Chapter 13 explains. It is often clearer than a loop that updates a variable.`
      }
    ]
  },
  {
    id: "E0381",
    title: "used binding `grade` is possibly-uninitialized",
    check: "E0381",
    chapter: 2,
    tags: ["ownership"],
    rust: `fn main() {
    let grade: char;
    let score = 72;
    if score >= 90 {
        grade = 'A';
    } else if score >= 70 {
        grade = 'C';
    }
    println!("{grade}");
}`,
    error: `error[E0381]: used binding \`grade\` is possibly-uninitialized
 --> src/main.rs:9:16
  |
2 |     let grade: char;
  |         ----- binding declared here but left uninitialized
...
6 |     } else if score >= 70 {
  |               ----------- if this \`if\` condition is \`false\`, \`grade\` is not initialized
7 |         grade = 'C';
8 |     }
  |      - an \`else\` arm might be missing here, initializing \`grade\`
9 |     println!("{grade}");
  |                ^^^^^ \`grade\` used here but it is possibly-uninitialized

error: aborting due to 1 previous error

For more information about this error, try \`rustc --explain E0381\`.`,
    plain: `A variable declared without a value must be assigned on every path before it is read. The path where the score is below 70 never sets \`grade\`.`,
    phpNote: `In PHP, reading \`$grade\` when no branch set it gives \`Warning: Undefined variable $grade\` at runtime, and only on that path. Rust refuses to build the program at all.`,
    fixes: [
      {
        title: "Cover the last path",
        rust: `fn main() {
    let grade: char;
    let score = 72;
    if score >= 90 {
        grade = 'A';
    } else if score >= 70 {
        grade = 'C';
    } else {
        grade = 'F';
    }
    println!("{grade}");
}`,
        note: `Every branch now assigns \`grade\`, so the compiler can see it is always set before it is read.`
      },
      {
        title: "Use if as an expression",
        rust: `fn main() {
    let score = 72;
    let grade = if score >= 90 {
        'A'
    } else if score >= 70 {
        'C'
    } else {
        'F'
    };
    println!("{grade}");
}`,
        note: `An \`if\` produces a value. Every branch must produce one, so there is nothing to forget. Prefer this shape when the variable is computed from a condition.`
      }
    ]
  },
  {
    id: "E0308",
    title: "mismatched types",
    check: "E0308",
    chapter: 3,
    tags: ["types"],
    rust: `fn label(count: u32) -> String {
    count
}

fn main() {
    println!("{}", label(3));
}`,
    error: `error[E0308]: mismatched types
 --> src/main.rs:2:5
  |
1 | fn label(count: u32) -> String {
  |                         ------ expected \`String\` because of return type
2 |     count
  |     ^^^^^ expected \`String\`, found \`u32\`
  |
help: try using a conversion method
  |
2 |     count.to_string()
  |          ++++++++++++

error: aborting due to 1 previous error

For more information about this error, try \`rustc --explain E0308\`.`,
    plain: `Every value has one exact type. \`count\` is a number, but the function promised to return a \`String\`. Rust does not convert between them for you.`,
    phpNote: `PHP coerces scalar types silently. With a \`: string\` return type in its default mode, \`return $count;\` turns the integer into a string. Rust never converts for you, so a \`u32\` is not a \`String\`.`,
    fixes: [
      {
        title: "Convert it",
        rust: `fn label(count: u32) -> String {
    count.to_string()
}

fn main() {
    println!("{}", label(3));
}`,
        note: `\`to_string()\` builds a new String from any value that implements \`Display\`. The conversion is visible in the code.`
      },
      {
        title: "Format a sentence",
        rust: `fn label(count: u32) -> String {
    format!("{count} items")
}

fn main() {
    println!("{}", label(3));
}`,
        note: `Most of the time you want text with some context around the number, and \`format!\` builds it in one step.`
      },
      {
        title: "Return the number",
        rust: `fn label(count: u32) -> u32 {
    count
}

fn main() {
    println!("{}", label(3));
}`,
        note: `If the caller needs a number, the function should return one. Let the signature say what the function really gives back.`
      }
    ]
  },
  {
    id: "E0277",
    title: "`Point` doesn't implement `std::fmt::Display`",
    check: "E0277",
    chapter: 14,
    tags: ["traits", "types"],
    rust: `struct Point {
    x: i32,
    y: i32,
}

fn main() {
    let p = Point { x: 3, y: 4 };
    println!("{p}");
}`,
    error: `error[E0277]: \`Point\` doesn't implement \`std::fmt::Display\`
 --> src/main.rs:8:15
  |
8 |     println!("{p}");
  |               ^^^ \`Point\` cannot be formatted with the default formatter
  |
help: the trait \`std::fmt::Display\` is not implemented for \`Point\`
 --> src/main.rs:1:1
  |
1 | struct Point {
  | ^^^^^^^^^^^^
  = note: in format strings you may be able to use \`{:?}\` (or {:#?} for pretty-print) instead

error: aborting due to 1 previous error

For more information about this error, try \`rustc --explain E0277\`.`,
    plain: `The \`{}\` placeholder needs the \`Display\` trait. \`Point\` does not implement it, so \`println!\` cannot format it.`,
    phpNote: `PHP's nearest equivalent is \`__toString()\`, and string interpolation calls it when it exists. Without it PHP fails at runtime. Rust needs the \`Display\` impl written out, and it fails at compile time.`,
    fixes: [
      {
        title: "Print the Debug form",
        rust: `#[derive(Debug)]
struct Point {
    x: i32,
    y: i32,
}

fn main() {
    let p = Point { x: 3, y: 4 };
    println!("{p:?}, x + y = {}", p.x + p.y);
}`,
        note: `\`{:?}\` uses the Debug trait, which \`#[derive(Debug)]\` writes for you. It is meant for developers reading logs, not for users. The \`x + y\` part only reads both fields, so rustc does not warn that they are unused.`
      },
      {
        title: "Implement Display",
        rust: `use std::fmt;

struct Point {
    x: i32,
    y: i32,
}

impl fmt::Display for Point {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "({}, {})", self.x, self.y)
    }
}

fn main() {
    let p = Point { x: 3, y: 4 };
    println!("{p}");
}`,
        note: `Display is the user-facing format. Writing the impl is the Rust version of \`__toString()\`, and you write it once for the type.`
      },
      {
        title: "Print the fields",
        rust: `struct Point {
    x: i32,
    y: i32,
}

fn main() {
    let p = Point { x: 3, y: 4 };
    println!("({}, {})", p.x, p.y);
}`,
        note: `If you only need the output once, format the fields yourself. This needs no trait at all.`
      }
    ]
  },
  {
    id: "E0599",
    title: "no method named `to_uppercase` found for enum `Option<T>` in the current scope",
    check: "E0599",
    chapter: 10,
    tags: ["patterns", "types"],
    rust: `fn main() {
    let name: Option<&str> = Some("Ada");
    println!("{}", name.to_uppercase());
}`,
    error: `error[E0599]: no method named \`to_uppercase\` found for enum \`Option<T>\` in the current scope
   --> src/main.rs:3:25
    |
  3 |     println!("{}", name.to_uppercase());
    |                         ^^^^^^^^^^^^ method not found in \`Option<&str>\`
    |
help: consider using \`Option::expect\` to unwrap the \`&str\` value, panicking if the value is an \`Option::None\`
    |
  3 |     println!("{}", name.expect("REASON").to_uppercase());
    |                        +++++++++++++++++

error: aborting due to 1 previous error

For more information about this error, try \`rustc --explain E0599\`.`,
    plain: `\`name\` is an \`Option<&str>\`, a box that may be empty. \`to_uppercase\` exists on the \`&str\` inside the box, not on the box itself.`,
    phpNote: `In PHP, calling a method on null, as in \`$name->upper()\`, fails at runtime with \`Call to a member function upper() on null\`. The nullsafe \`?->\` returns null instead, so a null can travel on unnoticed. In Rust, \`Option<&str>\` is a different type from \`&str\`, so the call fails to compile until you open the box.`,
    fixes: [
      {
        title: "Map over it",
        rust: `fn main() {
    let name: Option<&str> = Some("Ada");
    let shout = name.map(|n| n.to_uppercase());
    println!("{shout:?}");
}`,
        note: `\`map\` runs the closure only when there is a value, and keeps the \`None\` case as \`None\`. The result is still an Option.`
      },
      {
        title: "Open it with if let",
        rust: `fn main() {
    let name: Option<&str> = Some("Ada");
    if let Some(n) = name {
        println!("{}", n.to_uppercase());
    }
}`,
        note: `The code inside the \`if let\` runs only when the box has a value, and \`n\` is the \`&str\` inside.`
      },
      {
        title: "Give a default",
        rust: `fn main() {
    let name: Option<&str> = None;
    println!("{}", name.unwrap_or("guest").to_uppercase());
}`,
        note: `\`unwrap_or\` gives a fallback when the box is empty. The result is a \`&str\`, so the method call works.`
      }
    ]
  },
  {
    id: "E0425",
    title: "cannot find function `with_vat` in this scope",
    check: "E0425",
    chapter: 16,
    tags: ["modules"],
    rust: `mod pricing {
    pub fn with_vat(net: u32) -> u32 {
        net + net / 5
    }
}

fn main() {
    println!("{}", with_vat(100));
}`,
    error: `error[E0425]: cannot find function \`with_vat\` in this scope
 --> src/main.rs:8:20
  |
8 |     println!("{}", with_vat(100));
  |                    ^^^^^^^^ not found in this scope
  |
help: consider importing this function
  |
1 + use crate::pricing::with_vat;
  |

error: aborting due to 1 previous error

For more information about this error, try \`rustc --explain E0425\`.`,
    plain: `rustc cannot find a name: a function, variable or constant that is not visible where it is used. \`with_vat\` lives in the \`pricing\` module, and nothing in \`main\` brings it into scope.`,
    phpNote: `In PHP, calling a function that was never loaded fails at runtime with \`Call to undefined function\`. Rust reports the same mistake at compile time, and it also suggests the import.`,
    fixes: [
      {
        title: "Import it",
        rust: `mod pricing {
    pub fn with_vat(net: u32) -> u32 {
        net + net / 5
    }
}

use pricing::with_vat;

fn main() {
    println!("{}", with_vat(100));
}`,
        note: `\`use\` brings the name into scope for the whole module or block it sits in, the way a PHP \`use\` statement imports a class.`
      },
      {
        title: "Use the full path",
        rust: `mod pricing {
    pub fn with_vat(net: u32) -> u32 {
        net + net / 5
    }
}

fn main() {
    println!("{}", pricing::with_vat(100));
}`,
        note: `The path names the function where it lives. Good for a one-off call, while \`use\` is better when you call it often.`
      }
    ]
  },
  {
    id: "E0433",
    title: "cannot find type `HashMap` in this scope",
    check: "E0433",
    chapter: 12,
    tags: ["modules"],
    rust: `fn main() {
    let mut stock = HashMap::new();
    stock.insert("apples", 3);
    println!("{:?}", stock.get("apples"));
}`,
    error: `error[E0433]: cannot find type \`HashMap\` in this scope
 --> src/main.rs:2:21
  |
2 |     let mut stock = HashMap::new();
  |                     ^^^^^^^ use of undeclared type \`HashMap\`
  |
help: consider importing this struct
  |
1 + use std::collections::HashMap;
  |

error: aborting due to 1 previous error

For more information about this error, try \`rustc --explain E0433\`.`,
    plain: `\`HashMap\` is a type in the standard library's \`collections\` module. Until you import it or write its full path, rustc cannot resolve the name.`,
    phpNote: `PHP arrays are maps, so \`$stock = []\` needs no import. Rust's map is an ordinary library type, so it needs the same kind of \`use\` you would write for a class from another namespace.`,
    fixes: [
      {
        title: "Import HashMap",
        rust: `use std::collections::HashMap;

fn main() {
    let mut stock = HashMap::new();
    stock.insert("apples", 3);
    println!("{:?}", stock.get("apples"));
}`,
        note: `One \`use\` line at the top of the file. After that the name works everywhere in the file.`
      },
      {
        title: "Write the full path",
        rust: `fn main() {
    let mut stock = std::collections::HashMap::new();
    stock.insert("apples", 3);
    println!("{:?}", stock.get("apples"));
}`,
        note: `The full path needs no import. Most code imports once at the top, because the long path gets repetitive.`
      }
    ]
  },
  {
    id: "E0609",
    title: "no field `totl_cents` on type `Cart`",
    check: "E0609",
    chapter: 9,
    tags: ["types"],
    rust: `struct Cart {
    total_cents: u32,
    items: u32,
}

fn main() {
    let cart = Cart { total_cents: 1250, items: 3 };
    println!("{} cents in {} items", cart.totl_cents, cart.items);
}`,
    error: `error[E0609]: no field \`totl_cents\` on type \`Cart\`
 --> src/main.rs:8:43
  |
8 |     println!("{} cents in {} items", cart.totl_cents, cart.items);
  |                                           ^^^^^^^^^^ unknown field
  |
help: a field with a similar name exists
  |
8 |     println!("{} cents in {} items", cart.total_cents, cart.items);
  |                                              +

error: aborting due to 1 previous error

For more information about this error, try \`rustc --explain E0609\`.`,
    plain: `\`totl_cents\` is not a field of \`Cart\`. rustc suggests \`total_cents\`, the field you almost certainly meant.`,
    phpNote: `PHP finds a misspelled property only at runtime. \`$cart->totl_cents\` gives a warning about an undefined property and quietly yields null. Rust checks the field name when the program compiles, so the typo never reaches a request.`,
    fixes: [
      {
        title: "Fix the spelling",
        rust: `struct Cart {
    total_cents: u32,
    items: u32,
}

fn main() {
    let cart = Cart { total_cents: 1250, items: 3 };
    println!("{} cents in {} items", cart.total_cents, cart.items);
}`,
        note: `The field name must match the struct exactly. Take the suggestion rustc prints when it is the right one.`
      },
      {
        title: "Destructure the struct",
        rust: `struct Cart {
    total_cents: u32,
    items: u32,
}

fn main() {
    let cart = Cart { total_cents: 1250, items: 3 };
    let Cart { total_cents, items } = cart;
    println!("{total_cents} cents in {items} items");
}`,
        note: `A destructuring pattern names every field once, at the top of the function. A misspelled name there fails to compile, so the mistake is caught in one place.`
      }
    ]
  },
  {
    id: "E0061",
    title: "this method takes 1 argument but 0 arguments were supplied",
    check: "E0061",
    chapter: 9,
    tags: ["types"],
    rust: `struct Account {
    balance: u32,
}

impl Account {
    fn deposit(&mut self, amount: u32) {
        self.balance += amount;
    }
}

fn main() {
    let mut account = Account { balance: 0 };
    account.deposit();
    println!("{}", account.balance);
}`,
    error: `error[E0061]: this method takes 1 argument but 0 arguments were supplied
  --> src/main.rs:13:13
   |
13 |     account.deposit();
   |             ^^^^^^^-- argument #1 of type \`u32\` is missing
   |
note: method defined here
  --> src/main.rs:6:8
   |
 6 |     fn deposit(&mut self, amount: u32) {
   |        ^^^^^^^            -----------
help: provide the argument
   |
13 |     account.deposit(/* u32 */);
   |                     +++++++++

error: aborting due to 1 previous error

For more information about this error, try \`rustc --explain E0061\`.`,
    plain: `\`deposit\` needs an amount and the call passes none. Rust checks the number of arguments against the signature when the program is compiled.`,
    phpNote: `PHP throws an \`ArgumentCountError\` when you omit a required argument, but only when that line runs. Rust checks the count at compile time and never fills in a missing value.`,
    fixes: [
      {
        title: "Pass the amount",
        rust: `struct Account {
    balance: u32,
}

impl Account {
    fn deposit(&mut self, amount: u32) {
        self.balance += amount;
    }
}

fn main() {
    let mut account = Account { balance: 0 };
    account.deposit(50);
    println!("{}", account.balance);
}`,
        note: `The argument count now matches the signature. Check the signature first when a call looks right but still fails.`
      },
      {
        title: "Accept None",
        rust: `struct Account {
    balance: u32,
}

impl Account {
    fn deposit(&mut self, amount: Option<u32>) {
        self.balance += amount.unwrap_or(0);
    }
}

fn main() {
    let mut account = Account { balance: 0 };
    account.deposit(None);
    println!("{}", account.balance);
}`,
        note: `Rust has no default arguments. \`Option\` makes the missing amount an explicit value, \`None\`, that the caller must write down.`
      }
    ]
  },
  {
    id: "E0004",
    title: "non-exhaustive patterns: `Status::Refunded` not covered",
    check: "E0004",
    chapter: 10,
    tags: ["patterns"],
    rust: `enum Status {
    Pending,
    Paid,
    Refunded,
}

fn label(status: Status) -> &'static str {
    match status {
        Status::Pending => "waiting",
        Status::Paid => "done",
    }
}

fn main() {
    println!("{}", label(Status::Refunded));
}`,
    error: `error[E0004]: non-exhaustive patterns: \`Status::Refunded\` not covered
  --> src/main.rs:8:11
   |
 8 |     match status {
   |           ^^^^^^ pattern \`Status::Refunded\` not covered
   |
note: \`Status\` defined here
  --> src/main.rs:1:6
   |
 1 | enum Status {
   |      ^^^^^^
...
 4 |     Refunded,
   |     -------- not covered
   = note: the matched value is of type \`Status\`
help: ensure that all possible cases are being handled by adding a match arm with a wildcard pattern or an explicit pattern as shown
   |
10 ~         Status::Paid => "done",
11 ~         Status::Refunded => todo!(),
   |

error: aborting due to 1 previous error

For more information about this error, try \`rustc --explain E0004\`.`,
    plain: `A \`match\` must handle every possible value. \`Status::Refunded\` has no arm, so the match does not cover all the cases.`,
    phpNote: `PHP's \`match\` throws \`UnhandledMatchError\` at runtime when no arm applies. Rust moves that failure to compile time, so a new variant breaks the build everywhere a match forgot it.`,
    fixes: [
      {
        title: "Add the missing arm",
        rust: `enum Status {
    Pending,
    Paid,
    Refunded,
}

fn label(status: Status) -> &'static str {
    match status {
        Status::Pending => "waiting",
        Status::Paid => "done",
        Status::Refunded => "money back",
    }
}

fn main() {
    for status in [Status::Pending, Status::Paid, Status::Refunded] {
        println!("{}", label(status));
    }
}`,
        note: `Write an arm for every variant. When someone adds a fourth variant later, the compiler will point at each match that needs it.`
      },
      {
        title: "Add a catch-all",
        rust: `enum Status {
    Pending,
    Paid,
    Refunded,
}

fn label(status: Status) -> &'static str {
    match status {
        Status::Pending => "waiting",
        Status::Paid => "done",
        _ => "other",
    }
}

fn main() {
    for status in [Status::Pending, Status::Paid, Status::Refunded] {
        println!("{}", label(status));
    }
}`,
        note: `\`_\` compiles, but a new variant then falls into it silently. Prefer listing the variants unless the catch-all is really the intent.`
      }
    ]
  },
  {
    id: "E0282",
    title: "type annotations needed for `Vec<_>`",
    check: "E0282",
    chapter: 13,
    tags: ["types"],
    rust: `fn main() {
    let scores = Vec::new();
    println!("{}", scores.len());
}`,
    error: `error[E0282]: type annotations needed for \`Vec<_>\`
 --> src/main.rs:2:9
  |
2 |     let scores = Vec::new();
  |         ^^^^^^   ---------- type must be known at this point
  |
help: consider giving \`scores\` an explicit type, where the type for type parameter \`T\` is specified
  |
2 |     let scores: Vec<T> = Vec::new();
  |               ++++++++

error: aborting due to 1 previous error

For more information about this error, try \`rustc --explain E0282\`.`,
    plain: `rustc must know the type of every value at compile time. \`Vec::new()\` creates an empty vector that could hold any element type, and nothing in this program says which one.`,
    phpNote: `PHP arrays hold any values, so \`$scores = [];\` never needs a type. A Rust \`Vec<T>\` has one element type, and an empty vector has no elements to infer it from.`,
    fixes: [
      {
        title: "Annotate the type",
        rust: `fn main() {
    let scores: Vec<u32> = Vec::new();
    println!("{}", scores.len());
}`,
        note: `The annotation names the element type. Add it when nothing later in the code would reveal it.`
      },
      {
        title: "Let the first push decide",
        rust: `fn main() {
    let mut scores = Vec::new();
    scores.push(7);
    println!("{}", scores.len());
}`,
        note: `The first \`push\` gives the vector its element type, and that is enough for rustc.`
      },
      {
        title: "Turbofish the constructor",
        rust: `fn main() {
    let scores = Vec::<u32>::new();
    println!("{}", scores.len());
}`,
        note: `The \`::<u32>\` after the name is the turbofish. It supplies the type right where the value is created.`
      }
    ]
  },
  {
    id: "E0369",
    title: "binary operation `==` cannot be applied to type `Money`",
    check: "E0369",
    chapter: 14,
    tags: ["traits"],
    rust: `#[derive(Debug)]
struct Money {
    cents: u32,
}

fn main() {
    let a = Money { cents: 500 };
    let b = Money { cents: 500 };
    if a == b {
        println!("same price: {}", a.cents);
    }
}`,
    error: `error[E0369]: binary operation \`==\` cannot be applied to type \`Money\`
 --> src/main.rs:9:10
  |
9 |     if a == b {
  |        - ^^ - Money
  |        |
  |        Money
  |
note: an implementation of \`PartialEq\` might be missing for \`Money\`
 --> src/main.rs:2:1
  |
2 | struct Money {
  | ^^^^^^^^^^^^ must implement \`PartialEq\`
help: consider annotating \`Money\` with \`#[derive(PartialEq)]\`
  |
2 + #[derive(PartialEq)]
3 | struct Money {
  |

error: aborting due to 1 previous error

For more information about this error, try \`rustc --explain E0369\`.`,
    plain: `\`==\` is not defined for \`Money\`, because the struct does not implement the \`PartialEq\` trait. Rust never compares two structs field by field unless you ask for it.`,
    phpNote: `PHP's \`==\` on two objects of the same class compares their properties by default. Rust's \`==\` is the \`PartialEq\` trait, and a type must opt in with a derive or a manual impl.`,
    fixes: [
      {
        title: "Derive PartialEq",
        rust: `#[derive(Debug, PartialEq)]
struct Money {
    cents: u32,
}

fn main() {
    let a = Money { cents: 500 };
    let b = Money { cents: 500 };
    if a == b {
        println!("same price: {}", a.cents);
    }
}`,
        note: `\`derive(PartialEq)\` compares every field in order. That is the right default for a plain data struct.`
      },
      {
        title: "Compare the field",
        rust: `#[derive(Debug)]
struct Money {
    cents: u32,
}

fn main() {
    let a = Money { cents: 500 };
    let b = Money { cents: 500 };
    if a.cents == b.cents {
        println!("same price: {}", a.cents);
    }
}`,
        note: `If only one field matters for equality, compare that field. The struct itself is not compared.`
      }
    ]
  },
  {
    id: "E0603",
    title: "function `secret_code` is private",
    check: "E0603",
    chapter: 16,
    tags: ["modules"],
    rust: `mod vault {
    fn secret_code() -> u32 {
        4242
    }
}

fn main() {
    println!("{}", vault::secret_code());
}`,
    error: `error[E0603]: function \`secret_code\` is private
 --> src/main.rs:8:27
  |
8 |     println!("{}", vault::secret_code());
  |                           ^^^^^^^^^^^ private function
  |
note: the function \`secret_code\` is defined here
 --> src/main.rs:2:5
  |
2 |     fn secret_code() -> u32 {
  |     ^^^^^^^^^^^^^^^^^^^^^^^

error: aborting due to 1 previous error

For more information about this error, try \`rustc --explain E0603\`.`,
    plain: `\`secret_code\` belongs to the \`vault\` module and is private to it. Only items marked \`pub\` can be used from outside the module.`,
    phpNote: `PHP's \`private\` is a keyword on class members. In Rust every item is private to its module by default, including plain functions, and only \`pub\` makes it visible outside.`,
    fixes: [
      {
        title: "Mark it pub",
        rust: `mod vault {
    pub fn secret_code() -> u32 {
        4242
    }
}

fn main() {
    println!("{}", vault::secret_code());
}`,
        note: `\`pub\` makes the function part of the module's public surface. Make an item public only when callers really need it.`
      },
      {
        title: "Expose a result, not the secret",
        rust: `mod vault {
    fn secret_code() -> u32 {
        4242
    }

    pub fn check(code: u32) -> bool {
        code == secret_code()
    }
}

fn main() {
    println!("{}", vault::check(4242));
}`,
        note: `The module keeps the value private and offers a function that answers the question callers have. Keeping internals hidden is the point of private-by-default.`
      }
    ]
  },
  {
    id: "E0515",
    title: "cannot return reference to local variable `loud`",
    check: "E0515",
    chapter: 8,
    tags: ["borrowing", "lifetimes"],
    rust: `fn shout(text: &str) -> &str {
    let loud = text.to_uppercase();
    &loud
}

fn main() {
    println!("{}", shout("hello"));
}`,
    error: `error[E0515]: cannot return reference to local variable \`loud\`
 --> src/main.rs:3:5
  |
3 |     &loud
  |     ^^^^^ returns a reference to data owned by the current function

error: aborting due to 1 previous error

For more information about this error, try \`rustc --explain E0515\`.`,
    plain: `\`loud\` is a local String, and it is freed when \`shout\` returns. A reference to it would outlive its owner, so rustc refuses to return it.`,
    phpNote: `In PHP, \`return $loud;\` returns a copy of the string, and the local is simply discarded. In Rust, \`&loud\` would point at memory that is freed when the function returns, so the compiler refuses to build it.`,
    fixes: [
      {
        title: "Return an owned String",
        rust: `fn shout(text: &str) -> String {
    text.to_uppercase()
}

fn main() {
    println!("{}", shout("hello"));
}`,
        note: `When the function creates new text, it must return an owned String. The caller becomes the owner.`
      },
      {
        title: "Return a slice of the input",
        rust: `fn trimmed(text: &str) -> &str {
    text.trim()
}

fn main() {
    println!("{}", trimmed("  hello  "));
}`,
        note: `When the result is a part of the input, return a borrow of the input. The lifetime then comes from the argument, which is valid for the whole call.`
      }
    ]
  }
];
