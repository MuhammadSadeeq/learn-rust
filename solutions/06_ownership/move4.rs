// ============================================================================
//  SOLUTION move4 · Loops consume              Chapter 06 · One Owner
// ----------------------------------------------------------------------------
//  `for w in &words` borrows the Vec. Each w is a &String, and w.len() works
//  the same on it. The Vec is still ours when the final line asks for its
//  length, so nothing was given away.
// ============================================================================

fn count_long(words: Vec<String>, min: usize) -> (usize, usize) {
    let mut long = 0;
    for w in &words {
        if w.len() >= min {
            long += 1;
        }
    }
    (long, words.len())
}

fn main() {
    let words = vec![
        String::from("cat"),
        String::from("elephant"),
        String::from("ox"),
    ];
    let (long, total) = count_long(words, 4);
    println!("{long} of {total} words are at least 4 bytes");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn counts_the_long_words() {
        let words = vec![String::from("cat"), String::from("elephant"), String::from("ox")];
        assert_eq!(count_long(words, 4), (1, 3));
    }

    #[test]
    fn min_zero_counts_everything() {
        let words = vec![String::from("a"), String::new()];
        assert_eq!(count_long(words, 0), (2, 2));
    }

    #[test]
    fn empty_list() {
        assert_eq!(count_long(Vec::new(), 4), (0, 0));
    }
}
