// ============================================================================
//  SOLUTION functions1 · Return values               Chapter 04 · Control Flow
// ----------------------------------------------------------------------------
//  A block evaluates to its last expression, as long as that expression has
//  no semicolon. `x * x;` is a statement instead, so the block's value
//  becomes `()`.
//
//  A function that returns a value needs `-> Type` in its signature. Every
//  parameter needs its own type too. Rust does not guess either one.
// ============================================================================

fn square(x: i32) -> i32 {
    x * x
}

fn is_even(n: u32) -> bool {
    n.is_multiple_of(2)
}

fn celsius_to_f(c: f64) -> f64 {
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
