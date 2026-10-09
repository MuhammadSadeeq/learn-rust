// ============================================================================
//  SOLUTION lifetimes3 · Outlive me                 Chapter 15 · Lifetimes
// ----------------------------------------------------------------------------
//  Return an owned String, so there is no borrow left to outlive. In main,
//  declare the owner before the borrow, so it lives through every use.
// ============================================================================

// The String moves out to the caller, so nothing refers to a dropped local.
fn build_label(id: u32) -> String {
    format!("item-{id}")
}

// Returns whichever input is shorter. Both inputs and the output share 'a.
fn shortest<'a>(a: &'a str, b: &'a str) -> &'a str {
    if a.len() <= b.len() { a } else { b }
}

fn main() {
    // The owner is declared first, so it lives until the end of main. The
    // borrow can then be used anywhere after this point.
    let long_word = String::from("elephant");
    let word = shortest(&long_word, "cat");
    println!("shortest: {word}");
    println!("label: {}", build_label(3));
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn label_is_formatted_from_the_id() {
        assert_eq!(build_label(7), "item-7");
    }

    #[test]
    fn labels_are_owned_strings() {
        let labels: Vec<String> = (1..=3).map(build_label).collect();
        assert_eq!(labels, vec!["item-1", "item-2", "item-3"]);
    }

    #[test]
    fn shortest_returns_the_shorter_input() {
        assert_eq!(shortest("apple", "fig"), "fig");
        assert_eq!(shortest("fig", "apple"), "fig");
    }

    #[test]
    fn shortest_keeps_the_first_on_a_tie() {
        assert_eq!(shortest("abc", "xyz"), "abc");
    }
}
