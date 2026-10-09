// ============================================================================
//  QUEST control2 · loop returns a value             Chapter 04 · Control Flow
// ----------------------------------------------------------------------------
//  `loop` repeats until a `break`, and `break` can carry a value out of the
//  loop. `while` repeats while its condition holds, and it has no value of
//  its own.
//
//  `first_divisible` returns the first number at or after `start` that `by`
//  divides evenly. `by` is never zero. `collatz_steps` counts the steps the
//  Collatz rule takes to reach 1: halve an even number, and turn an odd one
//  into 3n + 1. Use `loop` with a value for the first and `while` for the
//  second. Both bodies are todo!() for now. Don't edit the tests.
//
//  cargo forge          check your work (re-runs every time you save)
//  cargo forge hint     a nudge in the right direction
// ============================================================================

fn first_divisible(start: u32, by: u32) -> u32 {
    todo!()
}

fn collatz_steps(n: u64) -> u32 {
    todo!()
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
