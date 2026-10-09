// ============================================================================
//  SOLUTION vars1 · Mutable on purpose     Chapter 02 · Variables Are Promises
// ----------------------------------------------------------------------------
//  Bindings are immutable unless you write `mut`. The running total changes
//  on every pass through the loop, so it needs `mut`. The label never
//  changes, so its `mut` goes. Each `mut` in a program should say "this value
//  changes here".
// ============================================================================

fn count_up(n: u32) -> u32 {
    let mut total = 0;
    for i in 1..=n {
        total += i;
    }
    total
}

fn main() {
    let label = "sum of 1 to 4";
    println!("{label}: {}", count_up(4));
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn zero_gives_zero() {
        assert_eq!(count_up(0), 0);
    }

    #[test]
    fn one_gives_one() {
        assert_eq!(count_up(1), 1);
    }

    #[test]
    fn four_gives_ten() {
        assert_eq!(count_up(4), 10);
    }
}
