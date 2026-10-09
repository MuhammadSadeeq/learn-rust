// ============================================================================
//  SOLUTION control2 · loop returns a value          Chapter 04 · Control Flow
// ----------------------------------------------------------------------------
//  A `break` with a value makes the whole `loop` expression evaluate to that
//  value, so `first_divisible` can return the loop's result directly. A
//  `loop` has no condition of its own, so its body must reach a `break`.
//
//  `while` checks its condition before each pass. For `collatz_steps(1)` the
//  condition is already false, so the body never runs and the count is 0.
// ============================================================================

fn first_divisible(start: u32, by: u32) -> u32 {
    let mut candidate = start;
    loop {
        if candidate.is_multiple_of(by) {
            break candidate;
        }
        candidate += 1;
    }
}

fn collatz_steps(mut n: u64) -> u32 {
    let mut steps = 0;
    while n != 1 {
        n = if n.is_multiple_of(2) {
            n / 2
        } else {
            3 * n + 1
        };
        steps += 1;
    }
    steps
}

fn main() {
    println!("first multiple of 7 from 20: {}", first_divisible(20, 7));
    println!("collatz steps for 27: {}", collatz_steps(27));
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn first_divisible_searches_forward() {
        assert_eq!(first_divisible(7, 3), 9);
        assert_eq!(first_divisible(20, 7), 21);
    }

    #[test]
    fn start_can_be_the_answer() {
        assert_eq!(first_divisible(6, 3), 6);
    }

    #[test]
    fn collatz_counts_steps_to_one() {
        assert_eq!(collatz_steps(1), 0);
        assert_eq!(collatz_steps(6), 8);
    }

    #[test]
    fn collatz_of_27_takes_111_steps() {
        assert_eq!(collatz_steps(27), 111);
    }
}
