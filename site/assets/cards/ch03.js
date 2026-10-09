/* Recall cards: Chapter 03, Types Are Shapes */
(window.OX_CARDS = window.OX_CARDS || []).push(
  { id: "c03-default", ch: 3, q: "What type does `let n = 42;` get when nothing else in the program decides it?", a: "`i32`: a signed 32-bit integer, from -2,147,483,648 to 2,147,483,647. Integer literals default to it." },
  { id: "c03-usize", ch: 3, q: "What is `usize` for, and how big is it?", a: "Sizes and positions. `len()` returns a `usize`, and indexes must be `usize`. Its size is the pointer size: 64 bits on a 64-bit machine." },
  { id: "c03-overflow", ch: 3, q: "A `u8` holds 255 and you add 1. What happens in a debug build, and what happens in a release build?", a: "**Debug:** the program panics with `attempt to add with overflow`.\n\n**Release:** the overflow check is off, and the result wraps around to 0." },
  { id: "c03-checked", ch: 3, q: "What does `checked_add` return, and what is `250u8.checked_add(10)`?", a: "An `Option`: `Some(sum)` when the sum fits and `None` when it doesn't. `250u8.checked_add(10)` is `None`, because 260 doesn't fit in a `u8`. It never panics." },
  { id: "c03-char", ch: 3, q: "How big is a `char`, and what does it hold?", a: "4 bytes. One Unicode scalar value, a code point such as `'a'`, `'é'` or `'🦀'`. In a string, the same character takes 1 to 4 UTF-8 bytes." },
  { id: "c03-tuple", ch: 3, q: "How do you read the second field of a tuple `t`, and how do you name every field at once?", a: "`t.1`, because field numbers start at 0. `let (a, b, c) = t;` destructures the whole tuple." },
  { id: "c03-array", ch: 3, q: "Is `[i32; 3]` the same type as `[i32; 4]`?", a: "No. The length is part of an array's type, so a function that takes `[i32; 3]` rejects a four-slot array (E0308)." },
  { id: "c03-as", ch: 3, q: "What does `300i32 as u8` produce, and why?", a: "44. `as` keeps only the low 8 bits, and 300 - 256 = 44. It never panics and never reports that information was lost." },
  { id: "c03-tryfrom", ch: 3, q: "When do you use `try_from` instead of `as`?", a: "When the value comes from outside the program (input, a file, a database) and might not fit. `try_from` returns a `Result`, so the failure gets handled instead of silently truncated." },
  { id: "c03-truthy", ch: 3, q: "Why doesn't `if count { }` compile when `count` is an `i32`?", a: "`if` needs a `bool`, and Rust has no truthiness. Write the comparison: `if count != 0 { }`." }
);
