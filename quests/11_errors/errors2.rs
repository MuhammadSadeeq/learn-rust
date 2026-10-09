// ============================================================================
//  QUEST errors2 · The ? operator             Chapter 11 · Errors Are Values
// ----------------------------------------------------------------------------
//  Both functions already return a Result, but they call unwrap() on each
//  parse. Bad input panics instead of being reported to the caller. Use ?
//  so that a parse error goes back up to whoever called the function:
//    sum_csv(line)   adds up comma-separated integers: "1,2,3" -> 6
//    parse_point(s)  reads "3,4" as (3, 4)
//
//  Don't edit the tests.
//
//  cargo forge          check your work (re-runs every time you save)
//  cargo forge hint     a nudge in the right direction
// ============================================================================

use std::num::ParseIntError;

fn sum_csv(line: &str) -> Result<i64, ParseIntError> {
    let mut total = 0;
    for field in line.split(',') {
        total += field.parse::<i64>().unwrap();
    }
    Ok(total)
}

fn parse_point(s: &str) -> Result<(i32, i32), ParseIntError> {
    // split_once cuts at the first comma. With no comma, y is "", which fails to parse.
    let (x, y) = s.split_once(',').unwrap_or((s, ""));
    Ok((x.parse().unwrap(), y.parse().unwrap()))
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
