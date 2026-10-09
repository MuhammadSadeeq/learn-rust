// ============================================================================
//  SOLUTION types1 · Pick the right integer      Chapter 03 · Types Are Shapes
// ----------------------------------------------------------------------------
//  A u8 holds 0 to 255, so the running total needs a wider type. A u32 holds
//  the sum of any realistic list of u8 values. An average of u8 values can
//  never be bigger than 255, so casting it back to u8 is safe. Check for the
//  empty list before dividing, because dividing by zero panics.
//
//  `u32::from(age)` widens a u8 without losing anything. `from` only exists
//  for conversions that cannot lose data, so the compiler checks that for
//  you. `as` would compile for a narrowing conversion too, and it drops bits
//  silently.
// ============================================================================

fn average_age(ages: &[u8]) -> u8 {
    if ages.is_empty() {
        return 0;
    }

    let mut total: u32 = 0;
    for &age in ages {
        total += u32::from(age);
    }
    (total / ages.len() as u32) as u8
}

fn main() {
    let ages = [34, 29, 41];
    println!("average age: {}", average_age(&ages));
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn sums_past_255_without_overflow() {
        assert_eq!(average_age(&[200, 100]), 150);
    }

    #[test]
    fn empty_list_gives_zero() {
        assert_eq!(average_age(&[]), 0);
    }

    #[test]
    fn largest_values_stay_in_range() {
        assert_eq!(average_age(&[255, 255, 255]), 255);
    }

    #[test]
    fn average_rounds_down() {
        assert_eq!(average_age(&[1, 2]), 1);
    }
}
