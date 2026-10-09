/* Recall cards — Chapter 06: One Owner */
(window.OX_CARDS = window.OX_CARDS || []).push(
  { id: "c06-rules", ch: 6, q: "State the three ownership rules.", a: "1. Every value has an owner.\n\n2. There is exactly one owner at a time.\n\n3. When the owner goes out of scope, the value is dropped." },
  { id: "c06-move", ch: 6, q: "`a` is a `String`. What exactly does `let b = a;` do?", a: "It **moves**: the pointer, length and capacity (24 bytes on the stack) are copied into `b`, and `a` becomes unusable. The heap bytes are not copied." },
  { id: "c06-double", ch: 6, q: "Why can't `a` and `b` both own the same heap buffer?", a: "Both would free it when their scope ends: a **double free**. One owner means exactly one free." },
  { id: "c06-copy", ch: 6, q: "Name five kinds of types that are `Copy`.", a: "Integers, floats, `bool`, `char`, shared references `&T`, and tuples or arrays made only of `Copy` types.\n\n`String`, `Vec` and `Box` are **not** `Copy`." },
  { id: "c06-copyclone", ch: 6, q: "Copy vs Clone: what is the difference?", a: "**Copy** is implicit and only duplicates stack bits; it is always cheap.\n\n**Clone** is explicit (`.clone()`) and may allocate and copy heap data. The cost is visible in the code." },
  { id: "c06-order", ch: 6, q: "In what order are local variables dropped at the end of a scope?", a: "In **reverse** order of declaration: the last one declared is dropped first." },
  { id: "c06-fnparam", ch: 6, q: "What happens to `s` after calling `fn f(x: String)` as `f(s)`?", a: "`s` is moved into `x`. Unless `f` returns it, the String is dropped when `f` ends, and `s` can't be used again in the caller." },
  { id: "c06-fixes", ch: 6, q: "Three ways to fix E0382 \"use of moved value\"?", a: "1. **Reorder**: use the value before you move it.\n\n2. **Clone**: if you really need two independent copies.\n\n3. **Borrow** with `&` if the other code only needs to look." },
  { id: "c06-php", ch: 6, q: "PHP frees memory with ___ ; Rust frees memory with ___.", a: "PHP: reference counting plus a cycle collector at **runtime** (and the end of each request).\n\nRust: the **compiler** inserts a `drop` call at the end of each owner's scope." },
  { id: "c06-for", ch: 6, q: "Why does `for n in names { }` make `names` unusable afterwards?", a: "`for` over a `Vec` by value calls `into_iter()`, which **moves** the vector into the loop. Use `for n in &names` to borrow instead." }
);
