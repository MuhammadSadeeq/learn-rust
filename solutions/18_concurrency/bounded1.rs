// ============================================================================
//  QUEST bounded1 · A worker pool with a bounded queue   Chapter 18 · Fearless Concurrency
// ----------------------------------------------------------------------------
//  An unbounded channel accepts jobs without limit. If the workers are slow,
//  the queue grows until the memory runs out. A sync_channel(n) holds at most
//  n jobs waiting. When the queue is full, send() waits for room. That wait is
//  backpressure: the producer slows down to the speed of the workers.
//
//  Write run_pool so that it:
//    - starts `workers` threads. They share one job receiver, behind an
//      Arc<Mutex<...>>, so each job goes to exactly one worker;
//    - sends the jobs through a sync_channel(queue);
//    - runs work(job) for every job, and collects every result;
//    - reports max_waiting: the most jobs that were ever waiting in the queue.
//
//  How to measure max_waiting: the producer keeps `sent`, a count it owns. A
//  shared AtomicUsize called `taken` goes up by one as each worker receives a
//  job. After each send, the number waiting is sent - taken. Keep the largest.
//  A worker may receive a job before it has counted it, so the count can be at
//  most `queue + workers`. The tests check that bound.
//
//  Results come back in the order the jobs finished, so the tests sort them.
//  Drop your copy of the results sender before you collect, or the loop never
//  ends. Chapter 18 covers sync_channel, Arc, Mutex and atomics. Don't edit the
//  tests.
//
//  cargo forge          check your work (re-runs every time you save)
//  cargo forge hint     a nudge in the right direction
// ============================================================================

use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::mpsc;
use std::sync::{Arc, Mutex};
use std::thread;

#[derive(Debug, PartialEq)]
pub struct PoolRun {
    pub results: Vec<u64>,
    pub max_waiting: usize,
}

fn double(x: u64) -> u64 {
    x * 2
}

pub fn run_pool(jobs: Vec<u64>, workers: usize, queue: usize, work: fn(u64) -> u64) -> PoolRun {
    let (job_tx, job_rx) = mpsc::sync_channel::<u64>(queue);
    let job_rx = Arc::new(Mutex::new(job_rx));
    let (result_tx, result_rx) = mpsc::channel::<u64>();
    let taken = Arc::new(AtomicUsize::new(0));

    let mut handles = Vec::new();
    for _ in 0..workers {
        let job_rx = Arc::clone(&job_rx);
        let result_tx = result_tx.clone();
        let taken = Arc::clone(&taken);
        handles.push(thread::spawn(move || {
            loop {
                // The lock is held only while waiting for a job, not while working.
                let received = job_rx.lock().expect("the job lock is not poisoned").recv();
                let job = match received {
                    Ok(job) => job,
                    Err(_) => break, // the producer closed the queue
                };
                taken.fetch_add(1, Ordering::SeqCst);
                if result_tx.send(work(job)).is_err() {
                    break;
                }
            }
        }));
    }
    // Our own copy of the result sender must go, or the collecting loop never ends.
    drop(result_tx);

    let mut sent: usize = 0;
    let mut max_waiting: usize = 0;
    for job in jobs {
        job_tx.send(job).expect("a worker is still listening");
        sent += 1;
        max_waiting = max_waiting.max(sent - taken.load(Ordering::SeqCst));
    }
    // Closing the job channel lets every worker stop once the queue is empty.
    drop(job_tx);

    let results: Vec<u64> = result_rx.iter().collect();
    for handle in handles {
        handle.join().expect("a worker panicked");
    }
    PoolRun {
        results,
        max_waiting,
    }
}

fn main() {
    let jobs = vec![1, 2, 3, 4, 5, 6];
    let run = run_pool(jobs, 2, 2, double);
    println!("{} jobs done", run.results.len());
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::Duration;

    fn slow_square(x: u64) -> u64 {
        thread::sleep(Duration::from_millis(5));
        x * x
    }

    fn sorted(mut values: Vec<u64>) -> Vec<u64> {
        values.sort();
        values
    }

    #[test]
    fn every_job_gets_a_result() {
        let run = run_pool(vec![1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 3, 2, double);
        assert_eq!(
            sorted(run.results),
            vec![2, 4, 6, 8, 10, 12, 14, 16, 18, 20]
        );
    }

    #[test]
    fn waiting_jobs_stay_within_the_bound() {
        // A queue of 3 with 2 workers: at most 3 waiting, plus at most one
        // received-but-not-yet-counted job per worker.
        let jobs: Vec<u64> = (1..=40).collect();
        let run = run_pool(jobs, 2, 3, slow_square);
        assert_eq!(run.results.len(), 40);
        assert!(
            run.max_waiting <= 3 + 2,
            "max_waiting was {}",
            run.max_waiting
        );
    }

    #[test]
    fn a_queue_of_zero_still_finishes() {
        let run = run_pool(vec![1, 2, 3], 1, 0, double);
        assert_eq!(sorted(run.results), vec![2, 4, 6]);
    }

    #[test]
    fn no_jobs_means_no_results() {
        let run = run_pool(vec![], 4, 2, double);
        assert_eq!(
            run,
            PoolRun {
                results: vec![],
                max_waiting: 0,
            }
        );
    }
}
