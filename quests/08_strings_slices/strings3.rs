// ============================================================================
//  QUEST strings3 · Characters, not bytes      Chapter 08 · Strings & Slices
// ----------------------------------------------------------------------------
//  A &str is UTF-8. len() counts bytes, and one character can take up to four
//  of them. Count characters, reverse them, and cut a string after a number of
//  characters without splitting one in half. Write the three functions.
//
//  Don't edit the tests.
//
//  cargo forge          check your work (re-runs every time you save)
//  cargo forge hint     a nudge in the right direction
// ============================================================================

/// How many characters (Unicode scalar values) are in `s`.
fn char_count(s: &str) -> usize {
    todo!()
}

/// `s` with its characters in reverse order.
fn reverse_chars(s: &str) -> String {
    todo!()
}

/// The longest prefix of `s` with at most `max` characters. It never splits
/// a character.
fn truncate_chars(s: &str, max: usize) -> &str {
    todo!()
}

fn main() {
    let word = "héllo 🦀";
    println!("bytes: {}, chars: {}", word.len(), char_count(word));
    println!("reversed: {}", reverse_chars(word));
    println!("first 3 chars: {}", truncate_chars(word, 3));
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn counts_characters_not_bytes() {
        assert_eq!("héllo".len(), 6);
        assert_eq!(char_count("héllo"), 5);
        assert_eq!(char_count("🦀🦀🦀"), 3);
        assert_eq!(char_count(""), 0);
    }

    #[test]
    fn reverses_whole_characters() {
        assert_eq!(reverse_chars("héllo"), "olléh");
        assert_eq!(reverse_chars("a🦀b"), "b🦀a");
    }

    #[test]
    fn truncates_on_a_character_boundary() {
        assert_eq!(truncate_chars("héllo", 2), "hé");
        assert_eq!(truncate_chars("🦀🦀🦀", 1), "🦀");
        assert_eq!(truncate_chars("abc", 10), "abc");
        assert_eq!(truncate_chars("🦀🦀", 0), "");
    }
}
