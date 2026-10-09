// ============================================================================
//  SOLUTION mutex1 · Shared counter      Chapter 18 · Fearless Concurrency
// ----------------------------------------------------------------------------
//  Arc is Rc with atomic reference counts, so it can cross threads. Mutex lets
//  only one thread touch the number at a time. lock() returns a guard that
//  unlocks when it is dropped, at the end of the statement.
// ============================================================================

use std::sync::{Arc, Mutex};
use std::thread;

// `threads` threads each add one to the counter, `per_thread` times.
fn count_to(threads: usize, per_thread: u32) -> u32 {
    let counter = Arc::new(Mutex::new(0u32));
    let mut handles = Vec::new();
    for _ in 0..threads {
        let counter = Arc::clone(&counter);
        handles.push(thread::spawn(move || {
            for _ in 0..per_thread {
                *counter.lock().unwrap() += 1;
            }
        }));
    }
    for handle in handles {
        handle.join().unwrap();
    }
    *counter.lock().unwrap()
}

fn main() {
    println!("counted {}", count_to(8, 1000));
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn eight_threads_of_a_thousand() {
        assert_eq!(count_to(8, 1000), 8000);
    }

    #[test]
    fn no_threads_counts_nothing() {
        assert_eq!(count_to(0, 1000), 0);
    }

    #[test]
    fn zero_increments_per_thread() {
        assert_eq!(count_to(4, 0), 0);
    }

    #[test]
    fn single_thread() {
        assert_eq!(count_to(1, 5), 5);
    }
}
