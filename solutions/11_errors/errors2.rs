// ============================================================================
//  SOLUTION errors2 · The ? operator          Chapter 11 · Errors Are Values
// ----------------------------------------------------------------------------
//  ? on a Result returns the Err to the caller at once, and gives the Ok value
//  otherwise. The function's own return type says what can go wrong.
// ============================================================================

use std::num::ParseIntError;

fn sum_csv(line: &str) -> Result<i64, ParseIntError> {
    let mut total = 0;
    for field in line.split(',') {
        // On a bad field, ? returns the ParseIntError from sum_csv immediately.
        total += field.parse::<i64>()?;
    }
    Ok(total)
}

fn parse_point(s: &str) -> Result<(i32, i32), ParseIntError> {
    // split_once cuts at the first comma. With no comma, y is "", which fails to parse.
    let (x, y) = s.split_once(',').unwrap_or((s, ""));
    Ok((x.parse()?, y.parse()?))
}

fn main() {
    println!("{:?}", sum_csv("10,20,12"));
    println!("{:?}", parse_point("3,4"));
    println!("{:?}", sum_csv("1,x"));
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn sum_csv_adds_the_fields() {
        assert_eq!(sum_csv("1,2,3"), Ok(6));
        assert_eq!(sum_csv("-5,10"), Ok(5)); // negative numbers work too
    }

    #[test]
    fn sum_csv_reports_a_bad_field_as_an_error() {
        assert!(sum_csv("1,two,3").is_err());
    }

    #[test]
    fn parse_point_reads_two_numbers() {
        assert_eq!(parse_point("3,4"), Ok((3, 4)));
        assert_eq!(parse_point("-1,0"), Ok((-1, 0)));
    }

    #[test]
    fn parse_point_rejects_malformed_input() {
        assert!(parse_point("3,x").is_err());
        assert!(parse_point("3").is_err()); // edge case: missing second number
        assert!(parse_point("3,4,5").is_err()); // edge case: too many numbers
    }
}
