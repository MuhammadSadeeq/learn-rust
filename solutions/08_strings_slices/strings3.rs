// ============================================================================
//  SOLUTION strings3 · Characters, not bytes   Chapter 08 · Strings & Slices
// ----------------------------------------------------------------------------
//  chars() walks whole characters, so counting and reversing never see a
//  partial one. char_indices() gives each character with the byte where it
//  starts. The character at index `max` starts exactly where the prefix must
//  end, so slicing there is always on a character boundary.
// ============================================================================

fn char_count(s: &str) -> usize {
    s.chars().count()
}

fn reverse_chars(s: &str) -> String {
    let mut reversed = String::new();
    for c in s.chars() {
        // Each new character goes in front of the ones already collected.
        reversed.insert(0, c);
    }
    reversed
}

fn truncate_chars(s: &str, max: usize) -> &str {
    // enumerate (Chapter 13) numbers the characters as char_indices yields them.
    for (count, (byte_index, _)) in s.char_indices().enumerate() {
        if count == max {
            // This is the first character we drop. Cut just before it.
            return &s[..byte_index];
        }
    }
    // Fewer than max + 1 characters: the whole string already fits.
    s
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
