// ============================================================================
//  QUEST control3 · FizzBuzz, the Rust way           Chapter 04 · Control Flow
// ----------------------------------------------------------------------------
//  FizzBuzz is a classic check on control flow. A `match` can look at a tuple
//  of values at once, so `(n % 3, n % 5)` describes both remainders in one
//  place.
//
//  `fizzbuzz` returns "Fizz" for multiples of 3, "Buzz" for multiples of 5,
//  "FizzBuzz" for multiples of both, and the number as text otherwise.
//  `fizzbuzz_upto` returns the lines from 1 through n, built with a `for`
//  loop over `1..=n`. Both bodies are todo!() for now. Don't edit the tests.
//
//  cargo forge          check your work (re-runs every time you save)
//  cargo forge hint     a nudge in the right direction
// ============================================================================

fn fizzbuzz(n: u32) -> String {
    todo!()
}

fn fizzbuzz_upto(n: u32) -> Vec<String> {
    todo!()
}

fn main() {
    println!("{}", fizzbuzz_upto(15).join(" "));
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn multiples_of_three_and_five() {
        assert_eq!(fizzbuzz(3), "Fizz");
        assert_eq!(fizzbuzz(5), "Buzz");
        assert_eq!(fizzbuzz(15), "FizzBuzz");
    }

    #[test]
    fn other_numbers_print_themselves() {
        assert_eq!(fizzbuzz(7), "7");
        assert_eq!(fizzbuzz(98), "98");
    }

    #[test]
    fn upto_builds_lines_in_order() {
        assert_eq!(fizzbuzz_upto(5), vec!["1", "2", "Fizz", "4", "Buzz"]);
    }

    #[test]
    fn upto_includes_the_last_number() {
        assert_eq!(fizzbuzz_upto(15).len(), 15);
        assert_eq!(fizzbuzz_upto(15)[14], "FizzBuzz");
    }
}
