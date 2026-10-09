// ============================================================================
//  QUEST iter2 · fold, zip and sum             Chapter 13 · Iterators & Closures
// ----------------------------------------------------------------------------
//  Three functions over slices. Each one is a single iterator chain, so write
//  no for loops.
//
//    dot               pair up a and b with zip, multiply, then sum
//    running_max       the biggest value seen so far, at every position (scan)
//    increasing_pairs  how many neighbors rise: v[i] < v[i + 1] (windows)
//
//  Don't edit the tests.
//
//  cargo forge          check your work (re-runs every time you save)
//  cargo forge hint     a nudge in the right direction
// ============================================================================

fn dot(a: &[i32], b: &[i32]) -> i32 {
    todo!()
}

fn running_max(v: &[i32]) -> Vec<i32> {
    todo!()
}

fn increasing_pairs(v: &[i32]) -> usize {
    todo!()
}

fn main() {
    let a = [1, 2, 3];
    let b = [4, 5, 6];
    println!("dot = {}", dot(&a, &b));
    println!("running max = {:?}", running_max(&[3, 1, 4, 1, 5]));
    println!("rising steps = {}", increasing_pairs(&[1, 3, 2, 4]));
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn dot_multiplies_pairs_and_sums_them() {
        assert_eq!(dot(&[1, 2, 3], &[4, 5, 6]), 32);
        assert_eq!(dot(&[], &[]), 0);
    }

    #[test]
    fn running_max_tracks_the_peak_so_far() {
        assert_eq!(
            running_max(&[3, 1, 4, 1, 5, 9, 2, 6]),
            vec![3, 3, 4, 4, 5, 9, 9, 9]
        );
        assert!(running_max(&[]).is_empty());
    }

    #[test]
    fn increasing_pairs_counts_each_rise() {
        assert_eq!(increasing_pairs(&[1, 3, 2, 4, 4, 5]), 3);
        assert_eq!(increasing_pairs(&[7]), 0);
        assert_eq!(increasing_pairs(&[]), 0);
    }
}
