// ============================================================================
//  QUEST strings1 · String or &str             Chapter 08 · Strings & Slices
// ----------------------------------------------------------------------------
//  Three small functions. Take &str parameters, so a caller can pass a
//  &String or a literal. Return String when the function makes new text, and
//  bool when it only checks something. Write the bodies.
//
//  Don't edit the tests.
//
//  cargo forge          check your work (re-runs every time you save)
//  cargo forge hint     a nudge in the right direction
// ============================================================================

/// An uppercase copy of `s`. The input is left as it was.
fn to_owned_upper(s: &str) -> String {
    todo!()
}

/// Joins the words with a single space: ["Hello", "Rust"] -> "Hello Rust".
fn join_words(words: &[&str]) -> String {
    todo!()
}

/// True when `s` starts with "Hello". Case matters.
fn starts_with_hello(s: &str) -> bool {
    todo!()
}

fn main() {
    let name = String::from("ana");
    println!("{}", to_owned_upper(&name));
    println!("{}", join_words(&["Hello", "Rust"]));
    println!("{}", starts_with_hello("Hello there"));
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn uppercases_into_a_new_string() {
        let name = String::from("ana");
        assert_eq!(to_owned_upper(&name), "ANA");
        assert_eq!(name, "ana");
        assert_eq!(to_owned_upper(""), "");
    }

    #[test]
    fn joins_with_single_spaces() {
        assert_eq!(join_words(&["Hello", "Rust", "world"]), "Hello Rust world");
        assert_eq!(join_words(&["solo"]), "solo");
        assert_eq!(join_words(&[]), "");
    }

    #[test]
    fn checks_the_prefix_case_sensitively() {
        assert!(starts_with_hello("Hello, Ana"));
        assert!(!starts_with_hello("hello, ana"));
        assert!(!starts_with_hello("Hi"));
        assert!(!starts_with_hello(""));
    }
}
