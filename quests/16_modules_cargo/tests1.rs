// ============================================================================
//  QUEST tests1 · Testing toolkit     Chapter 16 · Modules, Crates & Tests
// ----------------------------------------------------------------------------
//  Three small functions, and the tests that check them. The tests are the
//  spec: they say exactly what each function returns or panics with.
//  divide panics on zero, parse_percent returns a Result, and is_palindrome
//  ignores case and punctuation.
//
//  Replace the three todo!() bodies. Don't edit the tests.
//
//  cargo forge          check your work (re-runs every time you save)
//  cargo forge hint     a nudge in the right direction
// ============================================================================

fn divide(a: i32, b: i32) -> i32 {
    todo!()
}

// "50%" gives Ok(50). A missing %, a non-number and a value over 100 are Err.
fn parse_percent(s: &str) -> Result<u8, String> {
    todo!()
}

// Ignores case and anything that isn't a letter or digit. The empty string
// is a palindrome.
fn is_palindrome(s: &str) -> bool {
    todo!()
}

fn main() {
    println!("{}", divide(10, 2));
    println!("{:?}", parse_percent("50%"));
    println!("{}", is_palindrome("Racecar"));
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn divide_splits_evenly_and_truncates() {
        assert_eq!(divide(10, 2), 5, "10 / 2 should be 5");
        assert_eq!(divide(7, 2), 3, "integer division drops the remainder");
    }

    #[test]
    #[should_panic(expected = "division by zero")]
    fn divide_by_zero_panics_with_a_clear_message() {
        divide(1, 0);
    }

    #[test]
    fn palindromes_ignore_case_and_punctuation() {
        assert!(
            is_palindrome("A man, a plan, a canal: Panama"),
            "classic palindrome"
        );
        assert!(!is_palindrome("Rust"), "Rust is not a palindrome");
        assert!(
            is_palindrome(""),
            "the empty string reads the same both ways"
        );
    }

    #[test]
    fn percent_parsing_returns_result() -> Result<(), String> {
        assert_eq!(parse_percent("50%")?, 50);
        assert_eq!(parse_percent("100%")?, 100);
        assert!(parse_percent("101%").is_err(), "over 100 is rejected");
        assert!(parse_percent("50").is_err(), "a missing % sign is rejected");
        Ok(())
    }
}
