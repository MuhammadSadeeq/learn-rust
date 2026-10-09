// ============================================================================
//  QUEST vecs1 · Vec basics                          Chapter 12 · Collections
// ----------------------------------------------------------------------------
//  Three small functions over a Vec<i32>. Each body is todo!(), so the tests
//  fail until you write them.
//
//    remove_negatives  drop every negative number from the Vec, in place
//    top_three         the three largest numbers, biggest first (fewer if the
//                      input is short). top_three borrows its input, so it
//                      must not change it.
//    safe_get          the value at index i, or None. It must never panic.
//
//  Don't edit the tests.
//
//  cargo forge          check your work (re-runs every time you save)
//  cargo forge hint     a nudge in the right direction
// ============================================================================

use std::cmp::Reverse;

fn remove_negatives(v: &mut Vec<i32>) {
    todo!()
}

fn top_three(v: &[i32]) -> Vec<i32> {
    todo!()
}

fn safe_get(v: &[i32], i: usize) -> Option<i32> {
    todo!()
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
