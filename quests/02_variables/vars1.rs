// ============================================================================
//  QUEST vars1 · Mutable on purpose        Chapter 02 · Variables Are Promises
// ----------------------------------------------------------------------------
//  `count_up` adds up the numbers from 1 to n, but the compiler rejects it
//  with E0384, "cannot assign twice to immutable variable". `main` also has a
//  binding marked `mut` that never changes. That one only earns a warning,
//  and it is worth fixing too.
//
//  Your job: make it compile and make the tests pass. Mark only the bindings
//  that change as `mut`. Don't edit the tests.
//
//  cargo forge          check your work (re-runs every time you save)
//  cargo forge hint     a nudge in the right direction
// ============================================================================

fn count_up(n: u32) -> u32 {
    let total = 0;
    for i in 1..=n {
        total += i;
    }
    total
}

fn main() {
    let mut label = "sum of 1 to 4";
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
