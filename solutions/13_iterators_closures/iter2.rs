// ============================================================================
//  SOLUTION iter2 · fold, zip and sum          Chapter 13 · Iterators & Closures
// ----------------------------------------------------------------------------
//  zip walks two iterators side by side, so map and sum finish the dot product.
//  scan carries state from one item to the next. Here the state is the biggest
//  value so far, and each step outputs it. windows(2) yields every neighboring
//  pair as a slice, so counting the rising pairs is a filter and a count.
// ============================================================================

fn dot(a: &[i32], b: &[i32]) -> i32 {
    a.iter().zip(b).map(|(x, y)| x * y).sum()
}

fn running_max(v: &[i32]) -> Vec<i32> {
    v.iter()
        .scan(None, |best: &mut Option<i32>, &x| {
            let max = best.map_or(x, |b| b.max(x));
            *best = Some(max);
            Some(max)
        })
        .collect()
}

fn increasing_pairs(v: &[i32]) -> usize {
    v.windows(2).filter(|pair| pair[0] < pair[1]).count()
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
