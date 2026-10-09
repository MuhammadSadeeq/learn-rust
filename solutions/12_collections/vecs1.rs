// ============================================================================
//  SOLUTION vecs1 · Vec basics                        Chapter 12 · Collections
// ----------------------------------------------------------------------------
//  retain keeps the items its closure approves of, in place, so nothing is
//  copied. top_three borrows its slice, so it copies the numbers into a Vec it
//  owns and sorts that copy. get returns Option<&i32>, and copied turns it into
//  Option<i32>. An index past the end is just None.
// ============================================================================

use std::cmp::Reverse;

fn remove_negatives(v: &mut Vec<i32>) {
    // retain keeps the items where the closure returns true, in place.
    v.retain(|&x| x >= 0);
}

fn top_three(v: &[i32]) -> Vec<i32> {
    // Copy the numbers into a Vec we own. The input must not change.
    let mut sorted = Vec::new();
    for x in v {
        sorted.push(*x);
    }
    // Reverse flips the sort order, which puts the biggest number first.
    sorted.sort_by_key(|x| Reverse(*x));
    sorted.truncate(3);
    sorted
}

fn safe_get(v: &[i32], i: usize) -> Option<i32> {
    // Check the length before indexing, so a bad index never panics.
    if i < v.len() { Some(v[i]) } else { None }
}

fn main() {
    let mut readings = vec![4, -2, 9, -7];
    readings.push(6);

    remove_negatives(&mut readings);
    println!("kept: {readings:?}");
    println!("top three: {:?}", top_three(&readings));
    println!("index 1: {:?}", safe_get(&readings, 1));
    println!("index 10: {:?}", safe_get(&readings, 10));
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn removes_negatives_and_keeps_order() {
        let mut v = vec![3, -1, 4, -1, 5];
        remove_negatives(&mut v);
        assert_eq!(v, vec![3, 4, 5]);
    }

    #[test]
    fn top_three_is_biggest_first_and_leaves_input_alone() {
        let v = vec![10, 2, 33, 7, 21];
        assert_eq!(top_three(&v), vec![33, 21, 10]);
        assert_eq!(v, vec![10, 2, 33, 7, 21]);
    }

    #[test]
    fn top_three_handles_short_input() {
        assert_eq!(top_three(&[5, 1]), vec![5, 1]);
        assert!(top_three(&[]).is_empty());
    }

    #[test]
    fn safe_get_returns_none_past_the_end() {
        let v = [8, 9];
        assert_eq!(safe_get(&v, 1), Some(9));
        assert_eq!(safe_get(&v, 2), None);
    }
}
