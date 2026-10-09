// ============================================================================
//  SOLUTION vars2 · Shadowing              Chapter 02 · Variables Are Promises
// ----------------------------------------------------------------------------
//  A `let` with a name that already exists creates a new variable, and that
//  new variable shadows the old one. It can have a different type. Assignment
//  cannot do that, because a variable keeps the type it was created with.
//
//  `unwrap()` panics on text that is not a number. Chapter 11 replaces it
//  with proper error handling.
// ============================================================================

fn parse_and_double(input: &str) -> i32 {
    let number = input;
    // This `let` shadows the &str above with an i32 under the same name.
    let number = number.parse::<i32>().unwrap();
    number * 2
}

fn main() {
    println!("{}", parse_and_double("21"));
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn doubles_a_positive_number() {
        assert_eq!(parse_and_double("21"), 42);
    }

    #[test]
    fn doubles_a_negative_number() {
        assert_eq!(parse_and_double("-5"), -10);
    }

    #[test]
    fn zero_stays_zero() {
        assert_eq!(parse_and_double("0"), 0);
    }
}
