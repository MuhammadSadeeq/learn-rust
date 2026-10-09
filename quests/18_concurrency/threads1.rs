// ============================================================================
//  QUEST threads1 · Spawn and join       Chapter 18 · Fearless Concurrency
// ----------------------------------------------------------------------------
//  parallel_sum splits the numbers into chunks, runs one thread per chunk, and
//  adds up the partial sums. The starter does not compile (E0597). Make it
//  compile and pass WITHOUT .clone() or .to_vec() on the numbers. Keep the
//  signature.
//
//  Don't edit the tests.
//
//  cargo forge          check your work (re-runs every time you save)
//  cargo forge hint     a nudge in the right direction
// ============================================================================

use std::thread;

// Add up `data` with `threads` threads, one chunk per thread.
fn parallel_sum(data: Vec<u64>, threads: usize) -> u64 {
    // ceil(len / threads), but at least 1, because chunks() panics on 0.
    let chunk_size = data.len().div_ceil(threads).max(1);

    let mut handles = Vec::new();
    for chunk in data.chunks(chunk_size) {
        handles.push(thread::spawn(|| chunk.iter().sum::<u64>()));
    }

    handles
        .into_iter()
        .map(|handle| handle.join().unwrap())
        .sum()
}

fn main() {
    let data: Vec<u64> = (1..=1_000).collect();
    println!("sum = {}", parallel_sum(data, 4));
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn sums_across_threads() {
        let data: Vec<u64> = (1..=100).collect();
        assert_eq!(parallel_sum(data, 4), 5050);
    }

    #[test]
    fn more_threads_than_numbers() {
        assert_eq!(parallel_sum(vec![1, 2, 3], 10), 6);
    }

    #[test]
    fn empty_input_is_zero() {
        assert_eq!(parallel_sum(Vec::new(), 3), 0);
    }

    #[test]
    fn uneven_chunks_add_up() {
        let data: Vec<u64> = (1..=10).collect();
        assert_eq!(parallel_sum(data, 3), 55);
    }
}
