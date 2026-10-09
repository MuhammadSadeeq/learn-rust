// ============================================================================
//  QUEST types3 · Arrays                         Chapter 03 · Types Are Shapes
// ----------------------------------------------------------------------------
//  An array has a fixed length, and that length is part of its type. Index
//  from 0, so `days[0]` is the first value. A `[u32; 7]` always holds seven
//  u32 values.
//
//  `sum_week` adds up the hours in the week. `busiest_day` returns the index
//  of the largest value. On a tie, the earlier day wins. Both bodies are
//  todo!() for now. Don't edit the tests.
//
//  cargo forge          check your work (re-runs every time you save)
//  cargo forge hint     a nudge in the right direction
// ============================================================================

fn sum_week(days: [u32; 7]) -> u32 {
    todo!()
}

fn busiest_day(days: [u32; 7]) -> usize {
    todo!()
}

fn main() {
    let hours = [8, 9, 7, 10, 6, 0, 0];
    println!("total hours: {}", sum_week(hours));
    println!("busiest day: index {}", busiest_day(hours));
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn sums_the_week() {
        assert_eq!(sum_week([8, 9, 7, 10, 6, 0, 0]), 40);
    }

    #[test]
    fn empty_week_is_zero() {
        assert_eq!(sum_week([0; 7]), 0);
    }

    #[test]
    fn busiest_day_is_the_largest_index() {
        assert_eq!(busiest_day([8, 9, 7, 10, 6, 0, 0]), 3);
    }

    #[test]
    fn ties_go_to_the_earlier_day() {
        assert_eq!(busiest_day([3, 9, 1, 9, 0, 2, 4]), 1);
    }
}
