// ============================================================================
//  SOLUTION control1 · if is an expression           Chapter 04 · Control Flow
// ----------------------------------------------------------------------------
//  The chain is checked from the top, and the first condition that is true
//  decides the answer. `score >= 90` therefore covers 95 and 100 as well. A
//  score of 85 fails the first test and passes the second, so the chain needs
//  no upper bounds.
//
//  In `abs_diff`, subtract the smaller number from the larger one. The result
//  is never negative, and the `if` picks which subtraction to run.
// ============================================================================

fn grade(score: u32) -> char {
    if score >= 90 {
        'A'
    } else if score >= 80 {
        'B'
    } else if score >= 70 {
        'C'
    } else if score >= 60 {
        'D'
    } else {
        'F'
    }
}

fn abs_diff(a: i32, b: i32) -> i32 {
    if a > b { a - b } else { b - a }
}

fn main() {
    for score in [95, 85, 72, 61, 40] {
        println!("{score} -> {}", grade(score));
    }
    println!("distance: {}", abs_diff(3, 10));
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn grade_at_the_top_boundaries() {
        assert_eq!(grade(90), 'A');
        assert_eq!(grade(89), 'B');
        assert_eq!(grade(80), 'B');
        assert_eq!(grade(79), 'C');
    }

    #[test]
    fn grade_covers_every_band() {
        assert_eq!(grade(70), 'C');
        assert_eq!(grade(69), 'D');
        assert_eq!(grade(60), 'D');
        assert_eq!(grade(59), 'F');
        assert_eq!(grade(0), 'F');
    }

    #[test]
    fn distance_is_never_negative() {
        assert_eq!(abs_diff(3, 10), 7);
        assert_eq!(abs_diff(10, 3), 7);
    }

    #[test]
    fn distance_across_zero() {
        assert_eq!(abs_diff(-2, 2), 4);
        assert_eq!(abs_diff(5, 5), 0);
    }
}
