// ============================================================================
//  QUEST functions1 · Return values                  Chapter 04 · Control Flow
// ----------------------------------------------------------------------------
//  Three small functions do not compile. Each has a different mistake, and
//  the compiler reports each one at its own line. Read the errors from the
//  top down.
//
//  Your job: make the file compile and make the tests pass. Don't edit the
//  tests.
//
//  cargo forge          check your work (re-runs every time you save)
//  cargo forge hint     a nudge in the right direction
// ============================================================================

fn square(x: i32) -> i32 {
    x * x;
}

fn is_even(n: u32) {
    n % 2 == 0
}

fn celsius_to_f(c) -> f64 {
    c * 9.0 / 5.0 + 32.0
}

fn main() {
    println!("{}", square(7));
    println!("{}", is_even(7));
    println!("{:.1}", celsius_to_f(100.0));
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn square_multiplies_itself() {
        assert_eq!(square(7), 49);
        assert_eq!(square(-4), 16);
    }

    #[test]
    fn even_numbers_are_detected() {
        assert!(is_even(0));
        assert!(is_even(10));
        assert!(!is_even(7));
    }

    #[test]
    fn celsius_to_fahrenheit() {
        assert_eq!(celsius_to_f(0.0), 32.0);
        assert_eq!(celsius_to_f(100.0), 212.0);
        assert_eq!(celsius_to_f(-40.0), -40.0);
    }
}
