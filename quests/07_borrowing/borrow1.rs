// ============================================================================
//  QUEST borrow1 · Look, don't take            Chapter 07 · Borrowing
// ----------------------------------------------------------------------------
//  word_count and sum only read their argument, but they take ownership of
//  it, so main can't use `text` or `scores` after the calls. The compiler
//  reports E0382 in main. It reports E0308 in the tests, which pass borrowed
//  values to the same functions.
//
//  Make both functions borrow what they read. Don't use .clone(), and don't
//  edit the tests.
//
//  cargo forge          check your work (re-runs every time you save)
//  cargo forge hint     a nudge in the right direction
// ============================================================================

fn word_count(text: String) -> usize {
    text.split_whitespace().count()
}

fn sum(v: Vec<i32>) -> i32 {
    v.iter().sum()
}

fn main() {
    let text = String::from("the quick brown fox");
    let words = word_count(text);
    println!("{words} words in {text:?}");

    let scores = vec![3, 4, 5];
    let total = sum(scores);
    println!("total {total} from {scores:?}");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn counts_words() {
        assert_eq!(word_count("one two three"), 3);
        assert_eq!(word_count("  spaced   out  "), 2);
        assert_eq!(word_count(""), 0);
    }

    #[test]
    fn sums_numbers() {
        assert_eq!(sum(&[1, 2, 3]), 6);
        assert_eq!(sum(&[]), 0);
    }

    #[test]
    fn the_caller_keeps_its_values() {
        let text = String::from("a b");
        let numbers = vec![4, 5];
        assert_eq!(word_count(&text), 2);
        assert_eq!(sum(&numbers), 9);
        assert_eq!(text, "a b");
        assert_eq!(numbers.len(), 2);
    }
}
