// ============================================================================
//  QUEST boss2_text_stats · Text statistics    Chapter 08 · Strings & Slices
// ----------------------------------------------------------------------------
//  Act II boss. A CMS admin page shows statistics for every post. Write the
//  six functions below with the Act II tools: loops, &str slices, chars(),
//  bytes(), split_whitespace(), len(), and borrows with & and &mut.
//
//    word_count        words, split on whitespace
//    char_count        characters (Unicode scalar values). Not the same as len().
//    longest_word      the longest word, counted in characters. "" when there are none
//    average_word_len  average characters per word, as an f64. 0.0 when there are none
//    non_ascii_words   how many words contain a character outside ASCII
//    first_sentence    the text up to and including the first . ! or ?
//                      The whole text when there is none.
//
//  Return slices of `text`, not new Strings. No .clone(), no .to_string() and
//  no String::from in these functions. Don't edit the tests.
//
//  cargo forge          check your work (re-runs every time you save)
//  cargo forge hint     a nudge in the right direction
// ============================================================================

/// The number of words in `text`.
fn word_count(text: &str) -> usize {
    todo!()
}

/// The number of characters in `text`.
fn char_count(text: &str) -> usize {
    todo!()
}

/// The longest word, measured in characters. On a tie the first word wins.
fn longest_word(text: &str) -> &str {
    todo!()
}

/// Average number of characters per word. Zero when there are no words.
fn average_word_len(text: &str) -> f64 {
    todo!()
}

/// How many words contain at least one character outside ASCII.
fn non_ascii_words(text: &str) -> usize {
    todo!()
}

/// The first sentence, including its end mark, as a slice of `text`.
fn first_sentence(text: &str) -> &str {
    todo!()
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
