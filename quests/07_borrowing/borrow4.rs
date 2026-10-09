// ============================================================================
//  QUEST borrow4 · No dangling                 Chapter 07 · Borrowing
// ----------------------------------------------------------------------------
//  make_greeting builds a greeting in a local variable and returns a reference
//  to it. The local is dropped when the function returns, so the reference
//  would point at freed memory. The compiler reports E0515 and won't compile.
//
//  Fix make_greeting so the caller can keep the greeting after the function
//  returns. longest_word is correct already: its result borrows from the
//  input, which the compiler can check. Don't edit the tests.
//
//  cargo forge          check your work (re-runs every time you save)
//  cargo forge hint     a nudge in the right direction
// ============================================================================

/// Builds a greeting for `name`.
fn make_greeting(name: &str) -> &String {
    let greeting = format!("Hello, {name}!");
    &greeting
}

/// The longest whitespace-separated word. On a tie, the first one wins.
fn longest_word(text: &str) -> &str {
    // Chapter 13 explains fold and closures. Read it as: keep the longer word.
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
