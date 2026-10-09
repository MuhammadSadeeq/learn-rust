// ============================================================================
//  QUEST move4 · Loops consume                 Chapter 06 · One Owner
// ----------------------------------------------------------------------------
//  count_long reports how many words are at least `min` bytes long, and how
//  many words there are in all. It doesn't compile: the for loop takes the
//  Vec by value, so the Vec is gone by the time the function asks for its len.
//
//  Change the loop so it borrows the Vec instead of consuming it. Don't use
//  .clone(). Don't edit the tests.
//
//  cargo forge          check your work (re-runs every time you save)
//  cargo forge hint     a nudge in the right direction
// ============================================================================

fn count_long(words: Vec<String>, min: usize) -> (usize, usize) {
    let mut long = 0;
    for w in words {
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
