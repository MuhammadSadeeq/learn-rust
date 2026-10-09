// ============================================================================
//  QUEST types4 · Casting with as                Chapter 03 · Types Are Shapes
// ----------------------------------------------------------------------------
//  `as` converts between numeric types, and it never fails at run time.
//  Integer to integer wraps: 300i32 as u8 is 44. Float to integer drops the
//  fraction and saturates at the limits. Decide what an out-of-range value
//  should mean before you cast.
//
//  Implement the three functions. `to_u8_saturating` limits the value to 0 to
//  255 first. `low_byte` keeps the low eight bits. `truncate` drops the
//  fraction of a float. Their bodies are todo!() for now. Don't edit the
//  tests.
//
//  cargo forge          check your work (re-runs every time you save)
//  cargo forge hint     a nudge in the right direction
// ============================================================================

fn to_u8_saturating(x: i32) -> u8 {
    todo!()
}

fn low_byte(x: i32) -> u8 {
    todo!()
}

fn truncate(x: f64) -> i64 {
    todo!()
}

fn main() {
    println!("{}", to_u8_saturating(300));
    println!("{}", low_byte(300));
    println!("{}", truncate(3.99));
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn saturating_stays_in_the_u8_range() {
        assert_eq!(to_u8_saturating(-5), 0);
        assert_eq!(to_u8_saturating(300), 255);
        assert_eq!(to_u8_saturating(255), 255);
        assert_eq!(to_u8_saturating(42), 42);
    }

    #[test]
    fn low_byte_keeps_the_last_eight_bits() {
        assert_eq!(low_byte(255), 255);
        assert_eq!(low_byte(256), 0);
        assert_eq!(low_byte(300), 44);
        assert_eq!(low_byte(-1), 255);
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
