// ============================================================================
//  SOLUTION hashmap1 · Word counter                   Chapter 12 · Collections
// ----------------------------------------------------------------------------
//  entry(key) finds the slot for a key and creates it if it is missing.
//  or_insert(0) hands back the count as &mut usize, so `+= 1` updates the map
//  in place. top_word uses max_by with a tie-breaker: a higher count wins, and
//  on equal counts the alphabetically smaller word wins.
// ============================================================================

use std::collections::HashMap;

fn word_counts(text: &str) -> HashMap<String, usize> {
    let mut counts = HashMap::new();
    for word in text.split_whitespace() {
        // Map keys are owned Strings, so to_lowercase() makes a new one. That
        // also folds "The" and "the" into the same key.
        *counts.entry(word.to_lowercase()).or_insert(0) += 1;
    }
    counts
}

fn top_word(counts: &HashMap<String, usize>) -> Option<(String, usize)> {
    counts
        .iter()
        // max_by returns the largest item. Equal counts compare the words in
        // reverse, so the alphabetically first word counts as the larger one.
        .max_by(|(wa, na), (wb, nb)| na.cmp(nb).then_with(|| wb.cmp(wa)))
        // The map gives references. Copy the count, and clone the word so the
        // caller owns it.
        .map(|(word, &n)| (word.clone(), n))
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
