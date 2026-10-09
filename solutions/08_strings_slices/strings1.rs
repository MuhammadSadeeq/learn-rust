// ============================================================================
//  SOLUTION strings1 · String or &str          Chapter 08 · Strings & Slices
// ----------------------------------------------------------------------------
//  Parameters borrow (&str), so both &String and literals work. New text is
//  returned as an owned String. A check returns a bool and allocates nothing.
// ============================================================================

fn to_owned_upper(s: &str) -> String {
    // to_uppercase builds a new String and leaves `s` alone.
    s.to_uppercase()
}

fn join_words(words: &[&str]) -> String {
    words.join(" ")
}

fn starts_with_hello(s: &str) -> bool {
    s.starts_with("Hello")
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
