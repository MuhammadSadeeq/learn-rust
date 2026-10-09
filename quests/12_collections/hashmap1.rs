// ============================================================================
//  QUEST hashmap1 · Word counter                     Chapter 12 · Collections
// ----------------------------------------------------------------------------
//  Count words with a HashMap<String, usize>. Both functions are todo!().
//
//    word_counts  split the text on whitespace, lowercase each word, and count
//                 how often each one appears.
//    top_word     the most common word and its count. On a tie, the word that
//                 comes first alphabetically wins. An empty map gives None.
//
//  Don't edit the tests.
//
//  cargo forge          check your work (re-runs every time you save)
//  cargo forge hint     a nudge in the right direction
// ============================================================================

use std::collections::HashMap;

fn word_counts(text: &str) -> HashMap<String, usize> {
    todo!()
}

fn top_word(counts: &HashMap<String, usize>) -> Option<(String, usize)> {
    todo!()
}

fn main() {
    let text = "the quick brown fox jumps over the lazy dog the end";
    let counts = word_counts(text);
    println!("distinct words: {}", counts.len());
    if let Some((word, n)) = top_word(&counts) {
        println!("most common: {word} ({n})");
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn counts_each_word_ignoring_case() {
        let counts = word_counts("The cat and THE hat");
        let expected = HashMap::from([
            ("the".to_string(), 2),
            ("cat".to_string(), 1),
            ("and".to_string(), 1),
            ("hat".to_string(), 1),
        ]);
        assert_eq!(counts, expected);
    }

    #[test]
    fn blank_text_has_no_words() {
        assert!(word_counts("   ").is_empty());
        assert_eq!(top_word(&HashMap::new()), None);
    }

    #[test]
    fn top_word_is_the_most_frequent() {
        let counts = word_counts("php rust php go php rust");
        assert_eq!(top_word(&counts), Some(("php".to_string(), 3)));
    }

    #[test]
    fn ties_go_to_the_alphabetically_first_word() {
        let counts = word_counts("b a b a c");
        assert_eq!(top_word(&counts), Some(("a".to_string(), 2)));
    }
}
