// ============================================================================
//  SOLUTION types4 · Casting with as             Chapter 03 · Types Are Shapes
// ----------------------------------------------------------------------------
//  `clamp` makes the range explicit, so the `as` that follows only sees
//  values that fit. `u8::try_from` is the checked version: it returns an
//  error for a value that does not fit, and `.ok()` turns that error into
//  None.
//
//  For floats, `as` drops the fraction and rounds toward zero, so -2.5
//  becomes -2. Floats outside the target range saturate to the nearest limit.
// ============================================================================

fn to_u8_clamped(x: i32) -> u8 {
    // Clamp first, so the cast only ever sees a value that fits in a u8.
    x.clamp(0, 255) as u8
}

fn try_to_u8(x: i32) -> Option<u8> {
    // try_from returns Err for a value that does not fit. .ok() turns Err into None.
    u8::try_from(x).ok()
}

fn truncate(x: f64) -> i64 {
    // The fraction is dropped toward zero, not toward negative infinity.
    x as i64
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
