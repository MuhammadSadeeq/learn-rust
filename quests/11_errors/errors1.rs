// ============================================================================
//  QUEST errors1 · Return a Result            Chapter 11 · Errors Are Values
// ----------------------------------------------------------------------------
//  parse_age panics on bad input, and a panic stops the whole program. Return
//  an Err instead, so the caller decides what to do. Use these messages:
//    "not a number"  when the text is not an unsigned whole number. This
//                    includes "", "abc" and "-5".
//    "too old"       when the number is above 150
//  Anything from 0 to 150 gives Ok(age).
//
//  The starter uses panic! and expect(). Don't use either in the solution.
//  Don't edit the tests.
//
//  cargo forge          check your work (re-runs every time you save)
//  cargo forge hint     a nudge in the right direction
// ============================================================================

fn parse_age(s: &str) -> Result<u8, String> {
    let n: u32 = s.parse().expect("not a number");
    if n > 150 {
        panic!("too old");
    }
    Ok(n as u8)
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
        // Edge case: empty input is not a number.
        assert_eq!(parse_age(""), Err(String::from("not a number")));
    }

    #[test]
    fn numbers_too_big_for_a_u8_are_too_old() {
        // 300 is a number, so it gets "too old", not "not a number".
        assert_eq!(parse_age("300"), Err(String::from("too old")));
    }
}
