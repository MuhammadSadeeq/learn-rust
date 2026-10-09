// ============================================================================
//  SOLUTION borrow4 · No dangling              Chapter 07 · Borrowing
// ----------------------------------------------------------------------------
//  Return the String itself. format! creates it, and the caller receives
//  ownership, so the greeting lives as long as the caller needs it. longest_word
//  already returns a borrow of its input, and the elision rule ties that borrow
//  to `text`, so no change is needed there.
// ============================================================================

/// Builds a greeting for `name`. The caller owns the result.
fn make_greeting(name: &str) -> String {
    format!("Hello, {name}!")
}

/// The longest whitespace-separated word. On a tie, the first one wins.
fn longest_word(text: &str) -> &str {
    text.split_whitespace()
        .fold("", |best, w| if w.len() > best.len() { w } else { best })
}

fn main() {
    let greeting = make_greeting("Rustacean");
    println!("{greeting}");
    println!("longest word: {}", longest_word("borrowing is not cloning"));
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn greets_by_name() {
        assert_eq!(make_greeting("Ana"), "Hello, Ana!");
        assert_eq!(make_greeting(""), "Hello, !");
    }

    #[test]
    fn greeting_outlives_its_input() {
        let greeting = {
            let name = String::from("Bo");
            make_greeting(&name)
        };
        assert_eq!(greeting, "Hello, Bo!");
    }

    #[test]
    fn longest_word_borrows_from_the_input() {
        assert_eq!(longest_word("the quick brown fox"), "quick");
        assert_eq!(longest_word(""), "");
    }
}
