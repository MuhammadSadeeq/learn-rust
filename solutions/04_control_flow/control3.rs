// ============================================================================
//  SOLUTION control3 · FizzBuzz, the Rust way        Chapter 04 · Control Flow
// ----------------------------------------------------------------------------
//  Each arm of a match is a pattern, `_` matches anything, and the arms are
//  tried from the top. The case for both remainders comes first, because 15
//  is also a multiple of 3. If the Fizz arm came first, 15 would print as
//  Fizz.
//
//  `1..=n` includes n, which is why the range uses `=`. `Vec::new()` starts
//  an empty list, and `push` adds to its end.
// ============================================================================

fn fizzbuzz(n: u32) -> String {
    match (n % 3, n % 5) {
        (0, 0) => "FizzBuzz".to_string(),
        (0, _) => "Fizz".to_string(),
        (_, 0) => "Buzz".to_string(),
        _ => n.to_string(),
    }
}

fn fizzbuzz_upto(n: u32) -> Vec<String> {
    let mut lines = Vec::new();
    for i in 1..=n {
        lines.push(fizzbuzz(i));
    }
    lines
}

fn main() {
    // Print one line per number. `for line in list` takes each String in turn.
    for line in fizzbuzz_upto(15) {
        println!("{line}");
    }
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
