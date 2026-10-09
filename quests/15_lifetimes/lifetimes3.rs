// ============================================================================
//  QUEST lifetimes3 · Outlive me                    Chapter 15 · Lifetimes
// ----------------------------------------------------------------------------
//  Two borrow errors, each one a reference that would outlive its value:
//    1. build_label returns a reference to a String that is dropped when the
//       function returns (E0515).
//    2. main borrows long_word from an inner block, then uses the result after
//       the block has ended and long_word is gone (E0597).
//
//  Fix both. Return an owned String, and make sure each owner lives at least
//  as long as its borrows. Don't use Box::leak to fake a 'static lifetime.
//  Don't edit the tests.
//
//  cargo forge          check your work (re-runs every time you save)
//  cargo forge hint     a nudge in the right direction
// ============================================================================

fn build_label(id: u32) -> &'static str {
    let label = format!("item-{id}");
    label.as_str()
}

// Returns whichever input is shorter. Both inputs and the output share 'a.
fn shortest<'a>(a: &'a str, b: &'a str) -> &'a str {
    if a.len() <= b.len() { a } else { b }
}

fn main() {
    let word;
    {
        let long_word = String::from("elephant");
        word = shortest(&long_word, "cat");
    }
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
