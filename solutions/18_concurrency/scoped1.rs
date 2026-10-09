// ============================================================================
//  SOLUTION scoped1 · Scoped threads     Chapter 18 · Fearless Concurrency
// ----------------------------------------------------------------------------
//  thread::scope ends every thread before it returns, so the threads may borrow
//  `data` safely. Handles are joined in spawn order, which keeps the results in
//  the same order as the chunks.
// ============================================================================

use std::thread;

// The largest value in each chunk of `chunk` numbers, in input order.
fn max_per_chunk(data: &[i32], chunk: usize) -> Vec<i32> {
    thread::scope(|s| {
        // Each thread borrows its own slice of `data`. No copies are needed.
        let handles: Vec<_> = data
            .chunks(chunk)
            .map(|part| s.spawn(move || *part.iter().max().unwrap()))
            .collect();

        // Join in spawn order, so the results line up with the chunks.
        handles.into_iter().map(|h| h.join().unwrap()).collect()
    })
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
