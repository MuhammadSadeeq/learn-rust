// ============================================================================
//  QUEST borrow3 · Readers or a writer         Chapter 07 · Borrowing
// ----------------------------------------------------------------------------
//  Two functions don't compile. The compiler reports E0502 for one of them
//  and E0499 for the other. Both mistakes come from a borrow that is still
//  alive when another borrow of the same data starts.
//
//  Fix both functions without cloning the Vec. Don't edit the tests.
//
//  cargo forge          check your work (re-runs every time you save)
//  cargo forge hint     a nudge in the right direction
// ============================================================================

/// Pushes `x` onto `v`, then reports the first value and the new length.
fn push_and_report(v: &mut Vec<i32>, x: i32) -> String {
    let first = &v[0];
    v.push(x);
    format!("first {first}, len {}", v.len())
}

/// Swaps the first two values in place. Shorter slices are left alone.
fn swap_first_two(v: &mut [i32]) {
    if v.len() < 2 {
        return;
    }
    let a = &mut v[0];
    let b = &mut v[1];
    let tmp = *a;
    *a = *b;
    *b = tmp;
}

fn main() {
    let mut scores = vec![10, 20, 30];
    println!("{}", push_and_report(&mut scores, 40));
    swap_first_two(&mut scores);
    println!("{scores:?}");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn push_reports_the_first_value() {
        let mut v = vec![5, 6];
        assert_eq!(push_and_report(&mut v, 9), "first 5, len 3");
        assert_eq!(v, vec![5, 6, 9]);
    }

    #[test]
    fn an_empty_vector_has_no_first_value() {
        let mut v: Vec<i32> = Vec::new();
        assert_eq!(push_and_report(&mut v, 1), "empty, len 1");
    }

    #[test]
    fn swaps_the_first_two_values() {
        let mut v = vec![1, 2, 3];
        swap_first_two(&mut v);
        assert_eq!(v, vec![2, 1, 3]);
    }

    #[test]
    fn short_vectors_are_untouched() {
        let mut one = vec![7];
        swap_first_two(&mut one);
        assert_eq!(one, vec![7]);

        let mut none: Vec<i32> = Vec::new();
        swap_first_two(&mut none);
        assert!(none.is_empty());
    }
}
