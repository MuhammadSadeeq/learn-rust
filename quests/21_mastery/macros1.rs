// ============================================================================
//  QUEST macros1 · Your first macro                       Chapter 21 · Mastery
// ----------------------------------------------------------------------------
//  Laravel has collect([...]). Rust has no literal syntax for a HashMap, so
//  you write one as a macro. A macro_rules! macro matches its input against
//  patterns, and the arm that matches expands into code at compile time.
//
//  This macro only knows the empty case, so the code below does not compile,
//  with an error that starts "no rules expected". That error is where to
//  start. Add a rule that accepts `key => value` pairs separated by commas,
//  with an optional trailing comma. Two pieces of syntax you need:
//    $key:expr    captures one expression
//    $( ... ),*   repeats the part inside once per item, separated by commas
//  Put a `$(,)?` after the repetition to allow the trailing comma. Don't edit
//  the tests.
//
//  cargo forge          check your work (re-runs every time you save)
//  cargo forge hint     a nudge in the right direction
// ============================================================================

use std::collections::HashMap;

macro_rules! hashmap {
    () => {
        ::std::collections::HashMap::new()
    };
}

fn main() {
    let ages: HashMap<&str, u32> = hashmap! { "Ana" => 31, "Bo" => 27, };
    println!("Ana is {}", ages["Ana"]);
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn empty_map() {
        let m: HashMap<&str, i32> = hashmap! {};
        assert!(m.is_empty());
    }

    #[test]
    fn two_entries() {
        let m = hashmap! { "a" => 1, "b" => 2 };
        assert_eq!(m.len(), 2);
        assert_eq!(m["a"], 1);
        assert_eq!(m["b"], 2);
    }

    #[test]
    fn trailing_comma_is_allowed() {
        let m = hashmap! { "a" => 1, "b" => 2, };
        assert_eq!(m, HashMap::from([("a", 1), ("b", 2)]));
    }

    #[test]
    fn values_are_expressions() {
        let base = 10;
        let m = hashmap! { "sum" => 2 + 3, "scaled" => base * 4 };
        assert_eq!(m["sum"], 5);
        assert_eq!(m["scaled"], 40);
    }
}
