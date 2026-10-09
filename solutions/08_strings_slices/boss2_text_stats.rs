// ============================================================================
//  SOLUTION boss2_text_stats · Text statistics  Chapter 08 · Strings & Slices
// ----------------------------------------------------------------------------
//  Every function works through words(), which yields slices of the text. The
//  only allocation is the HashMap in most_frequent, and its keys are borrowed
//  &str values, not copies. The comments mark the two choices that decide
//  the tie rules.
// ============================================================================

use std::collections::HashMap;

/// Splits `text` into words: whitespace-separated pieces with leading and
/// trailing ASCII punctuation removed. Pieces that are only punctuation are
/// dropped.
fn words(text: &str) -> impl Iterator<Item = &str> {
    text.split_whitespace()
        .map(|w| w.trim_matches(|c: char| c.is_ascii_punctuation()))
        .filter(|w| !w.is_empty())
}

/// Number of words in `text`.
fn word_count(text: &str) -> usize {
    words(text).count()
}

/// Number of lines, counted the way `str::lines` counts them.
fn line_count(text: &str) -> usize {
    text.lines().count()
}

/// The longest word, measured in characters. On a tie the first word wins.
/// None when there are no words.
fn longest_word(text: &str) -> Option<&str> {
    // reduce replaces the best word only when the new one is strictly longer,
    // so a tie keeps the earlier word. max_by_key would keep the last one.
    words(text).reduce(|best, w| {
        if w.chars().count() > best.chars().count() {
            w
        } else {
            best
        }
    })
}

/// The most common word and how often it appears. Case matters: "Rust" and
/// "rust" are different words. On a tie the alphabetically first word wins.
fn most_frequent(text: &str) -> Option<(&str, usize)> {
    // The keys borrow from `text`, so counting copies no words.
    let mut counts: HashMap<&str, usize> = HashMap::new();
    for w in words(text) {
        *counts.entry(w).or_insert(0) += 1;
    }
    // Compare the counts first. On equal counts the reversed word comparison
    // makes the alphabetically smaller word the "larger" one, so max_by keeps it.
    counts
        .into_iter()
        .max_by(|(a, count_a), (b, count_b)| count_a.cmp(count_b).then_with(|| b.cmp(a)))
}

/// Average number of characters per word. Zero when there are no words.
fn average_word_len(text: &str) -> f64 {
    // One pass collects the total characters and the number of words.
    let (chars, count) = words(text).fold((0usize, 0usize), |(chars, count), w| {
        (chars + w.chars().count(), count + 1)
    });
    if count == 0 {
        0.0
    } else {
        chars as f64 / count as f64
    }
}

fn main() {
    let post = "Rust is fast. Rust is safe!\nLaravel is still great, though.\nRust, Rust, Rust.";
    println!("words: {}", word_count(post));
    println!("lines: {}", line_count(post));
    println!("longest: {:?}", longest_word(post));
    println!("most frequent: {:?}", most_frequent(post));
    println!("average length: {:.2}", average_word_len(post));
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn counts_words_and_lines() {
        let text = "one two\nthree";
        assert_eq!(word_count(text), 3);
        assert_eq!(line_count(text), 2);
    }

    #[test]
    fn empty_text_has_nothing() {
        assert_eq!(word_count(""), 0);
        assert_eq!(line_count(""), 0);
        assert_eq!(longest_word(""), None);
        assert_eq!(most_frequent(""), None);
        assert_eq!(average_word_len(""), 0.0);
    }

    #[test]
    fn punctuation_is_not_part_of_a_word() {
        assert_eq!(word_count("-- ... !!"), 0);
        assert_eq!(word_count("Hello, world!"), 2);
        assert_eq!(longest_word("wait... (really?)"), Some("really"));
    }

    #[test]
    fn longest_word_keeps_the_first_of_a_tie() {
        assert_eq!(longest_word("cat dog bird fish"), Some("bird"));
    }

    #[test]
    fn longest_counts_characters_not_bytes() {
        // "ééé" is 6 bytes but only 3 characters. "abcd" is 4 characters.
        assert_eq!(longest_word("ééé abcd"), Some("abcd"));
    }

    #[test]
    fn most_frequent_is_case_sensitive_and_breaks_ties_alphabetically() {
        assert_eq!(most_frequent("the cat and the hat and the bat"), Some(("the", 3)));
        assert_eq!(most_frequent("Rust rust"), Some(("Rust", 1)));
        assert_eq!(most_frequent("b a b a"), Some(("a", 2)));
    }

    #[test]
    fn average_is_in_characters() {
        assert_eq!(average_word_len("ab cde"), 2.5);
        assert_eq!(average_word_len("hi! there"), 3.5);
        assert_eq!(average_word_len("ééé"), 3.0);
    }
}
