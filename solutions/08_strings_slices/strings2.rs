// ============================================================================
//  SOLUTION strings2 · First word              Chapter 08 · Strings & Slices
// ----------------------------------------------------------------------------
//  Both functions return slices of `s`, so the result points into the same
//  bytes and no copy is made. The signature's elision rule ties the output
//  lifetime to `s`, so the compiler stops any use after the text changes.
// ============================================================================

fn first_word(s: &str) -> &str {
    // Trim spaces at both ends first, so " hi" gives "hi".
    let s = s.trim_matches(' ');
    let end = s.find(' ').unwrap_or(s.len());
    &s[..end]
}

fn last_word(s: &str) -> &str {
    let s = s.trim_matches(' ');
    // The last word starts one byte after the last space. A space is one
    // byte, so that position is always a character boundary.
    let start = s.rfind(' ').map_or(0, |i| i + 1);
    &s[start..]
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
