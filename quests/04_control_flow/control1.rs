// ============================================================================
//  QUEST control1 · if is an expression              Chapter 04 · Control Flow
// ----------------------------------------------------------------------------
//  In Rust, `if` is an expression. It produces a value, so a whole if / else
//  chain can be the value of a function. It works like PHP's ternary, but
//  with blocks and as many branches as you need.
//
//  `grade` maps a score to a letter: 90 and up is A, 80 and up is B, 70 and
//  up is C, 60 and up is D, and anything lower is F. Write it as one if /
//  else if chain that is the function's last expression: no `let`, no `mut`,
//  no `return`.
//
//  `abs_diff` returns the distance between two numbers, which is never
//  negative. Both bodies are todo!() for now. Don't edit the tests.
//
//  cargo forge          check your work (re-runs every time you save)
//  cargo forge hint     a nudge in the right direction
// ============================================================================

fn grade(score: u32) -> char {
    todo!()
}

fn abs_diff(a: i32, b: i32) -> i32 {
    todo!()
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
