// ============================================================================
//  SOLUTION macros1 · Your first macro                    Chapter 21 · Mastery
// ----------------------------------------------------------------------------
//  The matcher captures each key and value as an expr. The body wraps every
//  pair in a tuple and passes the array to HashMap::from. The $( ... )*
//  repetition expands once per pair, and to nothing for an empty map. The full
//  path ::std::collections::HashMap works wherever the macro is called.
// ============================================================================

use std::collections::HashMap;

macro_rules! hashmap {
    ($($key:expr => $value:expr),* $(,)?) => {
        ::std::collections::HashMap::from([$(($key, $value)),*])
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
