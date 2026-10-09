// ============================================================================
//  SOLUTION tests1 · Testing toolkit  Chapter 16 · Modules, Crates & Tests
// ----------------------------------------------------------------------------
//  divide checks for zero before dividing, so the panic message is ours.
//  parse_percent passes errors up with ?. is_palindrome compares the cleaned
//  characters with their reverse.
// ============================================================================

fn divide(a: i32, b: i32) -> i32 {
    // Rust would panic on b == 0 too, with its own wording. Checking first
    // gives a message we chose, and should_panic can match it.
    if b == 0 {
        panic!("division by zero");
    }
    a / b
}

// "50%" gives Ok(50). A missing %, a non-number and a value over 100 are Err.
fn parse_percent(s: &str) -> Result<u8, String> {
    // strip_suffix returns None when the % is missing. ok_or_else turns that
    // into an Err, and ? returns it early.
    let digits = s
        .strip_suffix('%')
        .ok_or_else(|| format!("{s:?} has no % sign"))?;
    // u8 parsing already rejects values above 255, so only 101..=255 needs a
    // separate check.
    let n = digits
        .parse::<u8>()
        .map_err(|e| format!("{digits:?}: {e}"))?;
    if n > 100 {
        return Err(format!("{n} is over 100"));
    }
    Ok(n)
}

// Ignores case and anything that isn't a letter or digit. The empty string
// is a palindrome.
fn is_palindrome(s: &str) -> bool {
    let cleaned: Vec<char> = s
        .chars()
        .filter(|c| c.is_alphanumeric())
        .flat_map(char::to_lowercase)
        .collect();
    cleaned.iter().eq(cleaned.iter().rev())
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
