// ============================================================================
//  SOLUTION types3 · Arrays                      Chapter 03 · Types Are Shapes
// ----------------------------------------------------------------------------
//  `for day in days` visits all seven values. The length is fixed by the
//  type, so nothing can run past the end of the array.
//
//  The best day starts at day 0, with that day's hours taken from days[0].
//  Only a strictly larger value replaces them, so on a tie the earlier day
//  stays.
// ============================================================================

fn sum_week(days: [u32; 7]) -> u32 {
    let mut total: u32 = 0;
    for day in days {
        total += day;
    }
    total
}

fn busiest_day(days: [u32; 7]) -> usize {
    let mut best_day: usize = 0;
    let mut best_hours: u32 = days[0];

    let mut day = 0;
    for hours in days {
        // Strictly greater: a tie keeps the earlier day.
        if hours > best_hours {
            best_day = day;
            best_hours = hours;
        }
        day += 1;
    }
    best_day
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
