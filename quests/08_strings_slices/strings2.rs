// ============================================================================
//  QUEST strings2 · First word                 Chapter 08 · Strings & Slices
// ----------------------------------------------------------------------------
//  Return the first and the last word of a sentence. Each result is a slice
//  of the input, so nothing is copied. Words are separated by spaces, and
//  spaces at either end of the text don't count. Text with no words gives "".
//
//  Implement both functions. Don't edit the tests.
//
//  cargo forge          check your work (re-runs every time you save)
//  cargo forge hint     a nudge in the right direction
// ============================================================================

/// The first word: the text before the first space.
fn first_word(s: &str) -> &str {
    todo!()
}

/// The last word: the text after the last space.
fn last_word(s: &str) -> &str {
    todo!()
}

fn main() {
    let sentence = String::from("  The quick brown fox  ");
    println!("first: {}", first_word(&sentence));
    println!("last: {}", last_word(&sentence));
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn first_and_last_word() {
        assert_eq!(first_word("hello big world"), "hello");
        assert_eq!(last_word("hello big world"), "world");
    }

    #[test]
    fn one_word_empty_and_spaces() {
        assert_eq!(first_word("single"), "single");
        assert_eq!(last_word("single"), "single");
        assert_eq!(first_word(""), "");
        assert_eq!(last_word("   "), "");
        assert_eq!(first_word("  padded  "), "padded");
        assert_eq!(last_word("  padded  "), "padded");
    }

    #[test]
    fn returns_a_view_not_a_copy() {
        let text = String::from("alpha beta");
        let word = first_word(&text);
        assert!(std::ptr::eq(word.as_ptr(), text.as_ptr()));
    }
}
