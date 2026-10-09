// ============================================================================
//  QUEST mutex1 · Shared counter         Chapter 18 · Fearless Concurrency
// ----------------------------------------------------------------------------
//  count_to starts `threads` threads, and each one adds 1 to a shared counter
//  `per_thread` times. The starter shares an Rc<RefCell<u32>>, and rustc refuses
//  to send that to another thread (E0277). Make it thread-safe and keep the
//  signature.
//
//  Don't edit the tests.
//
//  cargo forge          check your work (re-runs every time you save)
//  cargo forge hint     a nudge in the right direction
// ============================================================================

use std::cell::RefCell;
use std::rc::Rc;
use std::thread;

// `threads` threads each add one to the counter, `per_thread` times.
fn count_to(threads: usize, per_thread: u32) -> u32 {
    let counter = Rc::new(RefCell::new(0u32));
    let mut handles = Vec::new();
    for _ in 0..threads {
        let counter = Rc::clone(&counter);
        handles.push(thread::spawn(move || {
            for _ in 0..per_thread {
                *counter.borrow_mut() += 1;
            }
        }));
    }
    for handle in handles {
        handle.join().unwrap();
    }
    *counter.borrow()
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
