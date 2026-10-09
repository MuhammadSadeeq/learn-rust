// ============================================================================
//  QUEST boss2_text_stats · Text statistics    Chapter 08 · Strings & Slices
// ----------------------------------------------------------------------------
//  Act II boss. A CMS admin page shows five numbers for every post: the word
//  count, the line count, the longest word, the most frequent word and the
//  average word length. Write the five functions.
//
//  Return slices of `text`, not new Strings. No .clone(), no .to_string() and
//  no String::from in these functions. words() is given. It defines what a
//  word is, so use it everywhere. Count the words with a HashMap.
//
//  Don't edit the tests.
//
//  cargo forge          check your work (re-runs every time you save)
//  cargo forge hint     a nudge in the right direction
// ============================================================================

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
    todo!()
}

/// Number of lines, counted the way `str::lines` counts them.
fn line_count(text: &str) -> usize {
    todo!()
}

/// The longest word, measured in characters. On a tie the first word wins.
/// None when there are no words.
fn longest_word(text: &str) -> Option<&str> {
    todo!()
}

/// The most common word and how often it appears. Case matters: "Rust" and
/// "rust" are different words. On a tie the alphabetically first word wins.
fn most_frequent(text: &str) -> Option<(&str, usize)> {
    todo!()
}

/// Average number of characters per word. Zero when there are no words.
fn average_word_len(text: &str) -> f64 {
    todo!()
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
