// ============================================================================
//  QUEST types4 · Casting with as                Chapter 03 · Types Are Shapes
// ----------------------------------------------------------------------------
//  `as` converts between numeric types, and it never fails. Integer to
//  integer wraps, so 300 as u8 is 44. Float to integer saturates. Decide what
//  an out-of-range value should mean before you cast.
//
//  Implement the three functions. `to_u8_clamped` limits the value to 0 to
//  255 first. `try_to_u8` returns None when the value does not fit.
//  `truncate` drops the fraction of a float. Their bodies are todo!() for
//  now. Don't edit the tests.
//
//  cargo forge          check your work (re-runs every time you save)
//  cargo forge hint     a nudge in the right direction
// ============================================================================

fn to_u8_clamped(x: i32) -> u8 {
    todo!()
}

fn try_to_u8(x: i32) -> Option<u8> {
    todo!()
}

fn truncate(x: f64) -> i64 {
    todo!()
}

fn main() {
    println!("{}", to_u8_clamped(300));
    println!("{:?}", try_to_u8(300));
    println!("{}", truncate(3.99));
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn clamps_into_the_u8_range() {
        assert_eq!(to_u8_clamped(-5), 0);
        assert_eq!(to_u8_clamped(300), 255);
        assert_eq!(to_u8_clamped(255), 255);
        assert_eq!(to_u8_clamped(42), 42);
    }

    #[test]
    fn checked_conversion_returns_none_when_out_of_range() {
        assert_eq!(try_to_u8(255), Some(255));
        assert_eq!(try_to_u8(256), None);
        assert_eq!(try_to_u8(-1), None);
    }

    #[test]
    fn float_truncates_toward_zero() {
        assert_eq!(truncate(3.99), 3);
        assert_eq!(truncate(-2.5), -2);
    }

    #[test]
    fn float_out_of_range_saturates() {
        assert_eq!(truncate(1e30), i64::MAX);
    }
}
