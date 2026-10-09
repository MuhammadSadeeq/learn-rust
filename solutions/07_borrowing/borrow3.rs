// ============================================================================
//  SOLUTION borrow3 · Readers or a writer      Chapter 07 · Borrowing
// ----------------------------------------------------------------------------
//  A push can reallocate the Vec's buffer, so no reference into the Vec may
//  survive it. Copying the first value out ends any borrow before the push.
//  Swapping goes through indexing, one place at a time, so no two mutable
//  borrows of the slice are ever alive together.
// ============================================================================

/// Pushes `x` onto `v`, then reports the first value and the new length.
fn push_and_report(v: &mut Vec<i32>, x: i32) -> String {
    // An empty Vec has no first value. Push, then report that.
    if v.is_empty() {
        v.push(x);
        return format!("empty, len {}", v.len());
    }
    // i32 is Copy, so v[0] gives a copy and no borrow of v is left alive.
    let first = v[0];
    v.push(x);
    format!("first {first}, len {}", v.len())
}

/// Swaps the first two values in place. Shorter slices are left alone.
fn swap_first_two(v: &mut [i32]) {
    if v.len() >= 2 {
        // One &mut borrow of the whole slice. The swap method exchanges two places in it.
        v.swap(0, 1);
    }
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
