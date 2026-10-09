// ============================================================================
//  SOLUTION borrow1 · Look, don't take         Chapter 07 · Borrowing
// ----------------------------------------------------------------------------
//  A function that only reads should borrow. &str accepts a &String or a
//  literal. &[i32] accepts a &Vec<i32> or an array. The caller keeps the
//  value, and nothing is copied.
// ============================================================================

fn word_count(text: &str) -> usize {
    text.split_whitespace().count()
}

fn sum(v: &[i32]) -> i32 {
    v.iter().sum()
}

fn main() {
    let text = String::from("the quick brown fox");
    let words = word_count(&text);
    println!("{words} words in {text:?}");

    let scores = vec![3, 4, 5];
    let total = sum(&scores);
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
