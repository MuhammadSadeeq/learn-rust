// ============================================================================
//  SOLUTION errors4 · From conversions        Chapter 11 · Errors Are Values
// ----------------------------------------------------------------------------
//  From tells ? how to convert one error type into another. Implement it once
//  and every ? on a ParseIntError in this file produces an AppError for free.
// ============================================================================

use std::fmt;
use std::num::ParseIntError;

#[derive(Debug)]
enum AppError {
    Parse(ParseIntError),
    Negative(i64),
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            AppError::Parse(e) => write!(f, "not a number: {e}"),
            AppError::Negative(n) => write!(f, "must not be negative: {n}"),
        }
    }
}

// This impl is what lets ? turn a ParseIntError into an AppError.
impl From<ParseIntError> for AppError {
    fn from(e: ParseIntError) -> Self {
        AppError::Parse(e)
    }
}

fn parse_non_negative(s: &str) -> Result<i64, AppError> {
    // On Err, ? calls AppError::from(parse_error) and returns early.
    let n = s.parse::<i64>()?;
    if n < 0 {
        return Err(AppError::Negative(n));
    }
    Ok(n)
}

fn main() {
    for input in ["42", "-3", "abc"] {
        match parse_non_negative(input) {
            Ok(n) => println!("ok: {n}"),
            Err(e) => println!("error: {e}"),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn accepts_zero_and_positive_numbers() {
        assert_eq!(parse_non_negative("42").unwrap(), 42);
        assert_eq!(parse_non_negative("0").unwrap(), 0); // edge case: zero is allowed
    }

    #[test]
    fn negative_numbers_are_rejected() {
        assert!(matches!(
            parse_non_negative("-3"),
            Err(AppError::Negative(-3))
        ));
    }

    #[test]
    fn text_becomes_a_parse_error() {
        // The ? operator converted the ParseIntError into AppError::Parse.
        assert!(matches!(parse_non_negative("abc"), Err(AppError::Parse(_))));
    }

    #[test]
    fn messages_come_from_display() {
        assert_eq!(
            parse_non_negative("-3").unwrap_err().to_string(),
            "must not be negative: -3"
        );
        assert_eq!(
            parse_non_negative("abc").unwrap_err().to_string(),
            "not a number: invalid digit found in string"
        );
    }
}
