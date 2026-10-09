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
    todo!()
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

    /// Each job records the thread that ran it. A fn pointer cannot capture
    /// anything, so the record is a static. Only the test below uses it.
    static WHO: Mutex<Vec<thread::ThreadId>> = Mutex::new(Vec::new());

    fn remember_thread(x: u64) -> u64 {
        // Slow enough that the jobs spread across the workers.
        thread::sleep(Duration::from_millis(5));
        WHO.lock().unwrap().push(thread::current().id());
        x
    }

    #[test]
    fn jobs_run_on_several_worker_threads_not_on_the_callers() {
        WHO.lock().unwrap().clear();
        let run = run_pool((1..=12).collect(), 3, 2, remember_thread);
        assert_eq!(run.results.len(), 12);
        let ids: std::collections::HashSet<thread::ThreadId> =
            WHO.lock().unwrap().iter().copied().collect();
        assert!(ids.len() >= 2, "only {} thread ran the jobs", ids.len());
        assert!(
            !ids.contains(&thread::current().id()),
            "a job ran on the test's own thread"
        );
    }

    fn sleepy_square(x: u64) -> u64 {
        thread::sleep(Duration::from_millis(50));
        x * x
    }

    #[test]
    fn a_slow_worker_fills_the_queue_but_never_passes_the_bound() {
        // One worker that takes 50 ms a job, and a queue of 2. The producer is
        // far faster, so the queue fills and the count reaches 2. It can never
        // pass queue + workers, which is 3 here.
        let run = run_pool((1..=6).collect(), 1, 2, sleepy_square);
        assert_eq!(run.results.len(), 6);
        assert!(
            run.max_waiting >= 2,
            "the queue never filled: max_waiting was {}",
            run.max_waiting
        );
        assert!(run.max_waiting <= 3, "max_waiting was {}", run.max_waiting);
    }
}
