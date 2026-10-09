// ============================================================================
//  QUEST scoped1 · Scoped threads              Chapter 18 · Fearless Concurrency
// ----------------------------------------------------------------------------
//  max_per_chunk finds the largest value in each chunk of `data`, with one
//  thread per chunk. Use std::thread::scope so the threads can borrow `data`
//  directly. No Arc, no clone, no to_vec. Return the maxima in input order.
//
//  Don't edit the tests.
//
//  cargo forge          check your work (re-runs every time you save)
//  cargo forge hint     a nudge in the right direction
// ============================================================================

use std::thread;

// The largest value in each chunk of `chunk` numbers, in input order.
fn max_per_chunk(data: &[i32], chunk: usize) -> Vec<i32> {
    todo!()
}

fn main() {
    let readings = [12, 7, 33, 4, 18, 21, 9];
    println!("{:?}", max_per_chunk(&readings, 3));
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn largest_of_each_chunk() {
        let data = [3, 1, 4, 1, 5, 9, 2, 6];
        assert_eq!(max_per_chunk(&data, 3), vec![4, 9, 6]);
    }

    #[test]
    fn chunk_bigger_than_data() {
        assert_eq!(max_per_chunk(&[-5, -1, -3], 10), vec![-1]);
    }

    #[test]
    fn empty_data_gives_no_results() {
        assert!(max_per_chunk(&[], 4).is_empty());
    }

    #[test]
    fn results_keep_chunk_order() {
        let data: Vec<i32> = (0..1000).collect();
        let expected: Vec<i32> = (0..100).map(|i| i * 10 + 9).collect();
        assert_eq!(max_per_chunk(&data, 10), expected);
    }
}
