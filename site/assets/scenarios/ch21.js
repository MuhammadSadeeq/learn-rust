/* Macro expansion data for Chapter 21 — Mastery.
   One item per invocation in the Macro Expansion Viewer.

   `src`    the source the author wrote.
   `marked` a simplified expansion. The characters ⟦ and ⟧ bracket the tokens
            that came from the macro's arguments; the viewer highlights them.
   `rust`   the expansion with the brackets removed. The snippet checker
            compiles this field. `check: "skip"` means it needs a crate.
   `note`   plain text shown under the viewer. */
(function () {
  function item(o) {
    return Object.assign(o, { rust: o.marked.replace(/[⟦⟧]/g, "") });
  }

  window.OX_CH21_EXPAND = [
    item({
      id: "vec",
      label: "vec!",
      src: `let v = vec![⟦1, 2, 3⟧];`,
      marked: `let v = <[_]>::into_vec(Box::new([⟦1, 2, 3⟧]));`,
      check: "ok",
      note: "Simplified. The real vec! calls compiler-internal helpers, such as box_assume_init_into_vec_unsafe, to use less stack space in debug builds. The public form shown here builds the same Vec."
    }),
    item({
      id: "hashmap",
      label: "hashmap!",
      src: `let m = hashmap! { ⟦"a" => 1, "b" => 2⟧ };`,
      marked: `let m = {
    let mut map = std::collections::HashMap::new();
    map.insert(⟦"a"⟧, ⟦1⟧);
    map.insert(⟦"b"⟧, ⟦2⟧);
    map
};`,
      check: "ok",
      note: "This is the real expansion of the hashmap! macro from the section above. The map, the inserts and the variable map come from the macro body. Only the keys and values come from your arguments."
    }),
    item({
      id: "derive",
      label: "#[derive(Debug)]",
      src: `#[derive(⟦Debug⟧)]
struct Point {
    x: i32,
    y: i32,
}`,
      marked: `struct Point {
    x: i32,
    y: i32,
}

impl std::fmt::⟦Debug⟧ for ⟦Point⟧ {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("⟦Point⟧")
            .field("⟦x⟧", &self.⟦x⟧)
            .field("⟦y⟧", &self.⟦y⟧)
            .finish()
    }
}`,
      check: "ok",
      note: "Simplified. The real derive calls a helper built for two fields, Formatter::debug_struct_field2_finish, and it prints the same text. Both versions print Point { x: 1, y: -2 }."
    }),
    item({
      id: "tokio",
      label: "#[tokio::main]",
      src: `#[tokio::main]
async fn main() {
    ⟦println!("hello");⟧
}`,
      marked: `fn main() {
    let body = async {
        ⟦println!("hello");⟧
    };
    tokio::runtime::Builder::new_multi_thread()
        .enable_all()
        .build()
        .expect("Failed building the Runtime")
        .block_on(body)
}`,
      check: "skip",
      note: "Simplified from tokio-macros 2.7. The real expansion also adds lint allowances and a check on the body's type. Building the runtime and calling block_on are the same. To run the original, add tokio = { version = \"1\", features = [\"full\"] } to Cargo.toml."
    })
  ];
})();
