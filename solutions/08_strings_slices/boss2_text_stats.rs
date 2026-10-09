// ============================================================================
//  SOLUTION boss2_text_stats · Text statistics  Chapter 08 · Strings & Slices
// ----------------------------------------------------------------------------
//  Every function walks the text with a loop and returns slices of it. Only
//  the counters are new values. Two byte facts do the work. A character can
//  take up to four bytes, so `len()` is not the character count. And every
//  byte of a non-ASCII character is above 127.
// ============================================================================

/// The number of words in `text`.
fn word_count(text: &str) -> usize {
    let mut count = 0;
    for _ in text.split_whitespace() {
        count += 1;
    }
    count
}

/// The number of characters in `text`.
fn char_count(text: &str) -> usize {
    let mut count = 0;
    for _ in text.chars() {
        count += 1;
    }
    count
}

/// The longest word, measured in characters. On a tie the first word wins.
fn longest_word(text: &str) -> &str {
    let mut best = "";
    let mut best_len = 0;
    for word in text.split_whitespace() {
        // Only a strictly longer word replaces the best one, so a tie keeps the first.
        let len = char_count(word);
        if len > best_len {
            best = word;
            best_len = len;
        }
    }
    best
}

/// Average number of characters per word. Zero when there are no words.
fn average_word_len(text: &str) -> f64 {
    let mut total_chars = 0;
    let mut words = 0;
    for word in text.split_whitespace() {
        total_chars += char_count(word);
        words += 1;
    }
    if words == 0 {
        0.0
    } else {
        total_chars as f64 / words as f64
    }
}

/// How many words contain at least one character outside ASCII.
fn non_ascii_words(text: &str) -> usize {
    let mut count = 0;
    for word in text.split_whitespace() {
        let mut has_non_ascii = false;
        // Every byte of a non-ASCII character is above 127.
        for byte in word.bytes() {
            if byte > 127 {
                has_non_ascii = true;
            }
        }
        if has_non_ascii {
            count += 1;
        }
    }
    count
}

/// The first sentence, including its end mark, as a slice of `text`.
fn first_sentence(text: &str) -> &str {
    for (i, c) in text.char_indices() {
        if c == '.' || c == '!' || c == '?' {
            // These marks are one byte each, so i + 1 is just past the mark.
            return &text[..i + 1];
        }
    }
    text
}

fn main() {
    let post = "Rust is fast. Rust is safe! Café au lait.";
    println!("words: {}", word_count(post));
    println!("chars: {}, bytes: {}", char_count(post), post.len());
    println!("longest: {}", longest_word(post));
    println!("average: {:.2}", average_word_len(post));
    println!("non-ASCII words: {}", non_ascii_words(post));
    println!("first sentence: {}", first_sentence(post));
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn counts_words_across_spaces_and_lines() {
        assert_eq!(word_count("one two\nthree"), 3);
        assert_eq!(word_count("  spaced   out  "), 2);
        assert_eq!(word_count(""), 0);
    }

    #[test]
    fn counts_characters_not_bytes() {
        assert_eq!("héllo".len(), 6);
        assert_eq!(char_count("héllo"), 5);
        assert_eq!(char_count("🦀🦀🦀"), 3);
        assert_eq!(char_count(""), 0);
    }

    #[test]
    fn longest_word_keeps_the_first_of_a_tie() {
        assert_eq!(longest_word("cat dog bird fish"), "bird");
    }

    #[test]
    fn longest_word_counts_characters() {
        // "ééé" is 6 bytes but only 3 characters. "abcd" is 4 characters.
        assert_eq!(longest_word("ééé abcd"), "abcd");
        assert_eq!(longest_word(""), "");
    }

    #[test]
    fn average_is_in_characters() {
        assert_eq!(average_word_len("ab cde"), 2.5);
        assert_eq!(average_word_len("ééé"), 3.0);
        assert_eq!(average_word_len(""), 0.0);
    }

    #[test]
    fn counts_words_with_non_ascii_letters() {
        assert_eq!(non_ascii_words("café au lait"), 1);
        assert_eq!(non_ascii_words("naïve façade"), 2);
        assert_eq!(non_ascii_words("plain text"), 0);
    }

    #[test]
    fn first_sentence_ends_at_the_first_mark() {
        assert_eq!(first_sentence("Rust is fast. Rust is safe!"), "Rust is fast.");
        assert_eq!(first_sentence("Wait! Really?"), "Wait!");
        assert_eq!(first_sentence("no stop here"), "no stop here");
        assert_eq!(first_sentence(""), "");
    }
}
