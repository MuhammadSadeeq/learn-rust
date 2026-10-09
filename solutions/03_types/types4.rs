// ============================================================================
//  SOLUTION types4 · Casting with as             Chapter 03 · Types Are Shapes
// ----------------------------------------------------------------------------
//  `clamp` makes the range explicit, so the `as` that follows only sees
//  values that fit. Without the clamp, `as` would wrap the value instead.
//
//  `as` on an integer keeps only the low bits, so 300 (binary 1_0010_1100)
//  becomes 44. For floats, `as` drops the fraction and rounds toward zero, so
//  -2.5 becomes -2. Floats outside the target range saturate to the nearest
//  limit.
// ============================================================================

fn to_u8_saturating(x: i32) -> u8 {
    // Clamp first, so the cast only ever sees a value that fits in a u8.
    x.clamp(0, 255) as u8
}

fn low_byte(x: i32) -> u8 {
    // No check: the cast keeps the low eight bits and drops the rest.
    x as u8
}

fn truncate(x: f64) -> i64 {
    // The fraction is dropped toward zero, not toward negative infinity.
    x as i64
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
