// ============================================================================
//  QUEST macros1 · Your first macro                       Chapter 21 · Mastery
// ----------------------------------------------------------------------------
//  Laravel has collect([...]) and Rust has no literal syntax for a HashMap, so
//  you write one as a macro. A macro_rules! macro matches its input against
//  patterns, then expands into code at compile time.
//
//  The matcher is written for you: `$( $key:expr => $value:expr ),*` takes
//  zero or more `key => value` pairs separated by commas, and `$(,)?` allows a
//  trailing comma. Write the body after `=>`. A `$( ... )*` in the body repeats
//  once for each pair the caller wrote. Don't edit the tests.
//
//  cargo forge          check your work (re-runs every time you save)
//  cargo forge hint     a nudge in the right direction
// ============================================================================

use std::collections::HashMap;

macro_rules! hashmap {
    ($($key:expr => $value:expr),* $(,)?) => {
        todo!()
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
