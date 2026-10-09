// ============================================================================
//  SOLUTION errors1 · Return a Result              Chapter 11 · Errors Are Values
// ----------------------------------------------------------------------------
//  A bad input is an Err value, not a panic. The caller can show a message,
//  retry or log, and the program keeps running.
// ============================================================================

fn parse_age(s: &str) -> Result<u8, String> {
    // Read as u32, so a number like 300 can be reported as "too old".
    match s.parse::<u32>() {
        Err(_) => Err(String::from("not a number")),
        Ok(n) if n > 150 => Err(String::from("too old")),
        // The guard above keeps n in 0..=150, so the cast to u8 cannot truncate.
        Ok(n) => Ok(n as u8),
    }
}

fn main() {
    for input in ["34", "abc", "200"] {
        match parse_age(input) {
            Ok(age) => println!("{input} -> age {age}"),
            Err(message) => println!("{input} -> error: {message}"),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn valid_age_is_ok() {
        assert_eq!(parse_age("42"), Ok(42));
    }

    #[test]
    fn bounds_are_inclusive() {
        assert_eq!(parse_age("0"), Ok(0));
        assert_eq!(parse_age("150"), Ok(150));
        assert_eq!(parse_age("151"), Err(String::from("too old")));
    }

    #[test]
    fn text_is_not_a_number() {
        assert_eq!(parse_age("abc"), Err(String::from("not a number")));
        assert_eq!(parse_age(""), Err(String::from("not a number"))); // edge case: empty input
    }

    #[test]
    fn numbers_too_big_for_a_u8_are_too_old() {
        // Edge case: 300 is a number, so it gets "too old", not "not a number".
        assert_eq!(parse_age("300"), Err(String::from("too old")));
    }
}
