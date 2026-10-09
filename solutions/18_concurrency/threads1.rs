// ============================================================================
//  SOLUTION threads1 · Spawn and join          Chapter 18 · Fearless Concurrency
// ----------------------------------------------------------------------------
//  A spawned thread can outlive the function that started it, so it must own
//  the numbers it adds. `by_ref().take(n)` moves the next n values out of the
//  Vec's iterator, so each chunk is owned by its thread and nothing is copied.
// ============================================================================

use std::thread;

// Add up `data` with `threads` threads, one chunk per thread.
fn parallel_sum(data: Vec<u64>, threads: usize) -> u64 {
    // ceil(len / threads), but at least 1, because chunks() panics on 0.
    let chunk_size = data.len().div_ceil(threads).max(1);

    let mut numbers = data.into_iter();
    let mut handles = Vec::new();
    loop {
        // The iterator keeps its place, so each round takes the next chunk.
        let chunk: Vec<u64> = numbers.by_ref().take(chunk_size).collect();
        if chunk.is_empty() {
            break;
        }
        // `move` hands the owned chunk to the thread.
        handles.push(thread::spawn(move || chunk.iter().sum::<u64>()));
    }

    handles.into_iter().map(|handle| handle.join().unwrap()).sum()
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
