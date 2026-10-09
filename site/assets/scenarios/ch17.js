/* Memory X-Ray scenarios for Chapter 17 — Smart Pointers */
(window.OX_XRAY = window.OX_XRAY || []).push(
  {
    id: "box-own",
    title: "Box puts one value on the heap",
    code: `
fn main() {
    let b = Box::new(5);
    println!("{}", *b + 1);
}`,
    steps: [
      { line: 1, say: "<p>Calling <code>main</code> pushes a stack frame for its local variables.</p>", ops: [["frame", "main"]] },
      {
        line: 2,
        ask: { q: "<code>Box::new(5)</code> makes a box. Where does the 5 live?", choices: ["On the stack, inside <code>b</code>.", "On the heap, and <code>b</code> holds a pointer to it.", "In a separate stack frame that belongs to the box."], answer: 1, explain: "A Box is an owning pointer. The value sits on the heap, and the stack holds only the pointer." },
        say: "<p><code>Box::new</code> asks the allocator for space for one <code>i32</code> and writes the 5 into it. <code>b</code> is a pointer to that space: eight bytes on a 64-bit machine. The 5 itself never lives in the frame.</p>",
        ops: [["alloc", "h1", "5", 1, { label: "5 in a Box" }], ["let", "b", "Box<i32>", { ptr: "h1" }]]
      },
      { line: 3, say: "<p><code>*b</code> follows the pointer to the heap and reads the 5. Adding 1 gives 6. The <code>*</code> is the dereference operator.</p>", ops: [["out", "6"]] },
      { line: 4, say: "<p>End of <code>main</code>. <code>b</code> is the only owner of the box, so dropping it frees the heap space. Then the frame is popped.</p>", ops: [["drop", "b"], ["pop"]] }
    ]
  },
  {
    id: "rc-count",
    title: "Rc: three owners, one value",
    code: `
use std::rc::Rc;

fn main() {
    let a = Rc::new(String::from("shared"));
    let b = Rc::clone(&a);
    {
        let c = Rc::clone(&a);
        println!("{}", Rc::strong_count(&c));
    }
    println!("{}", Rc::strong_count(&a));
    drop(b);
    println!("{}", Rc::strong_count(&a));
}`,
    steps: [
      { line: 3, say: "<p>Calling <code>main</code> pushes its frame. Nothing is shared yet.</p>", ops: [["frame", "main"]] },
      { line: 4, say: "<p><code>Rc::new</code> moves the String into one heap box. The box holds the value and a <strong>counter</strong>. The counter is 1, because <code>a</code> is the only owner. To keep the counter in view, the picture draws the text inside the box. In memory the text is one more allocation behind the String.</p>", ops: [["alloc", "h1", "shared", 6, { label: "Rc box", rc: 1 }], ["let", "a", "Rc<String>", { ptr: "h1" }]] },
      { line: 5, say: "<p><code>Rc::clone(&amp;a)</code> copies a pointer, adds one to the counter, and gives <code>b</code> the same box. The text is not copied.</p>", ops: [["let", "b", "Rc<String>", { ptr: "h1" }], ["rc", "h1", 2]] },
      { line: 7, say: "<p>Inside the block, <code>c</code> becomes a third owner. The counter goes to 3.</p>", ops: [["let", "c", "Rc<String>", { ptr: "h1" }], ["rc", "h1", 3]] },
      { line: 8, say: "<p><code>Rc::strong_count(&amp;c)</code> reads the counter: three owners, <code>a</code>, <code>b</code> and <code>c</code>.</p>", ops: [["out", "3"]] },
      {
        line: 9,
        ask: { q: "<code>c</code> is dropped at this closing brace. Is the String freed?", choices: ["Yes. The String is freed here.", "No. The counter goes from 3 to 2, and <code>a</code> and <code>b</code> still own the value."], answer: 1, explain: "Only the drop that brings the count to zero frees the value. Every other drop subtracts one." },
        say: "<p>Dropping <code>c</code> subtracts one from the counter. The box still has owners, so nothing is freed.</p>",
        ops: [["drop", "c"]]
      },
      { line: 10, say: "<p>Two owners remain, so this line prints 2.</p>", ops: [["out", "2"]] },
      { line: 11, say: "<p><code>drop(b)</code> ends <code>b</code>'s ownership early. The counter goes from 2 to 1. <code>a</code> still owns the value.</p>", ops: [["drop", "b"]] },
      { line: 12, say: "<p>One owner left, so this line prints 1.</p>", ops: [["out", "1"]] },
      { line: 13, say: "<p>End of <code>main</code>. <code>a</code> is the last owner and its counter is 1. Dropping it frees the box and the String. That happens once, at the last owner.</p>", ops: [["drop", "a"], ["pop"]] }
    ]
  }
);
