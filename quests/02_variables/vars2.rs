// ============================================================================
//  QUEST vars2 · Shadowing                 Chapter 02 · Variables Are Promises
// ----------------------------------------------------------------------------
//  `parse_and_double` reads a number from text and doubles it. The compiler
//  rejects it with E0308, "mismatched types". The variable starts as a &str,
//  and the code then tries to store an i32 in it.
//
//  Your job: make it compile and make the tests pass. Use shadowing, a new
//  `let` with the same name, instead of assigning a new type to the old
//  variable. Don't edit the tests.
//
//  cargo forge          check your work (re-runs every time you save)
//  cargo forge hint     a nudge in the right direction
// ============================================================================

fn parse_and_double(input: &str) -> i32 {
    let mut number = input;
    number = number.parse::<i32>().unwrap();
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
