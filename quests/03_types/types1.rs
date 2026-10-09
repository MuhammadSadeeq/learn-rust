// ============================================================================
//  QUEST types1 · Pick the right integer         Chapter 03 · Types Are Shapes
// ----------------------------------------------------------------------------
//  `average_age` should return the average of a list of ages. It compiles,
//  but the tests panic. The sum goes into a u8, which holds at most 255, so
//  two ages of 200 and 100 overflow it. An empty list also divides by zero.
//
//  Your job: make the tests pass. Total the ages in a wider integer, handle
//  the empty list, and convert the result back to u8. Don't edit the tests.
//
//  cargo forge          check your work (re-runs every time you save)
//  cargo forge hint     a nudge in the right direction
// ============================================================================

fn average_age(ages: &[u8]) -> u8 {
    let mut total: u8 = 0;
    for age in ages {
        total += age;
    }
    total / ages.len() as u8
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
