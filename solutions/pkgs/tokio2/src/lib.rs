// ============================================================================
//  QUEST tokio2 · At most N at a time                    Chapter 19 · Async Rust
// ----------------------------------------------------------------------------
//  A server that starts too many jobs at once runs out of memory, sockets or
//  patience. A Semaphore is a set of permits. A job takes one permit before it
//  starts and gives it back when it ends, so no more than `limit` jobs run at
//  the same time.
//
//  run_limited starts one job per item, and each job calls work(...). Use
//  these rules:
//    - Make one Semaphore with `limit` permits, in an Arc so tasks can share it.
//    - Before you spawn a job, take a permit with acquire_owned(). Waiting here
//      is the backpressure: the loop does not start more work than it has room for.
//    - Move the permit into the task. Dropping it at the end gives it back.
//    - Return the results in the same order as the items.
//
//  The Gauge counts jobs in flight and remembers the most at one time (the
//  peak). It is given, and the tests read its peak. Don't edit the tests.
//
//  cargo forge          check your work (re-runs every time you save)
//  cargo forge hint     a nudge in the right direction
// ============================================================================

use std::sync::Arc;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::time::Duration;
use tokio::sync::Semaphore;

/// Counts jobs in flight. Given: do not change it.
#[derive(Debug, Default)]
pub struct Gauge {
    now: AtomicUsize,
    peak: AtomicUsize,
}

impl Gauge {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn enter(&self) {
        let now = self.now.fetch_add(1, Ordering::SeqCst) + 1;
        self.peak.fetch_max(now, Ordering::SeqCst);
    }

    pub fn leave(&self) {
        self.now.fetch_sub(1, Ordering::SeqCst);
    }

    pub fn peak(&self) -> usize {
        self.peak.load(Ordering::SeqCst)
    }
}

/// One job. Given: it counts itself in and out of the gauge.
async fn work(item: u32, gauge: &Gauge) -> u32 {
    gauge.enter();
    tokio::time::sleep(Duration::from_millis(10)).await;
    gauge.leave();
    item * 2
}

pub async fn run_limited(items: Vec<u32>, limit: usize, gauge: Arc<Gauge>) -> Vec<u32> {
    let semaphore = Arc::new(Semaphore::new(limit));
    let mut handles = Vec::new();
    for item in items {
        // Wait here until a permit is free. The permit travels with the job.
        let permit = semaphore
            .clone()
            .acquire_owned()
            .await
            .expect("the semaphore is never closed");
        let gauge = Arc::clone(&gauge);
        handles.push(tokio::spawn(async move {
            let result = work(item, &gauge).await;
            drop(permit);
            result
        }));
    }

    let mut out = Vec::new();
    for handle in handles {
        out.push(handle.await.expect("a job panicked"));
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn returns_results_in_input_order() {
        let gauge = Arc::new(Gauge::new());
        let out = run_limited(vec![1, 2, 3, 4], 2, gauge).await;
        assert_eq!(out, vec![2, 4, 6, 8]);
    }

    #[tokio::test]
    async fn never_runs_more_than_the_limit() {
        let gauge = Arc::new(Gauge::new());
        let items: Vec<u32> = (0..12).collect();
        let out = run_limited(items, 3, Arc::clone(&gauge)).await;
        assert_eq!(out.len(), 12);
        assert!(gauge.peak() <= 3, "peak was {}", gauge.peak());
    }

    #[tokio::test]
    async fn uses_the_whole_limit_when_there_is_work() {
        let gauge = Arc::new(Gauge::new());
        let items: Vec<u32> = (0..12).collect();
        run_limited(items, 3, Arc::clone(&gauge)).await;
        assert_eq!(gauge.peak(), 3);
    }

    #[tokio::test]
    async fn a_limit_of_one_runs_one_at_a_time() {
        let gauge = Arc::new(Gauge::new());
        run_limited(vec![5, 6, 7], 1, Arc::clone(&gauge)).await;
        assert_eq!(gauge.peak(), 1);
    }

    /// A job that waits for a permit is not a task yet. A solution that spawns
    /// every job first, and makes each one wait inside its task, has all 12
    /// tasks alive at once.
    #[tokio::test]
    async fn no_more_tasks_exist_than_the_limit() {
        let gauge = Arc::new(Gauge::new());
        let run = tokio::spawn(run_limited((0..12).collect(), 3, Arc::clone(&gauge)));
        let metrics = tokio::runtime::Handle::current().metrics();
        let mut most_alive = 0;
        while !run.is_finished() {
            most_alive = most_alive.max(metrics.num_alive_tasks());
            tokio::time::sleep(Duration::from_millis(1)).await;
        }
        assert_eq!(run.await.expect("the run finishes").len(), 12);
        // The run is one task, and the limit allows 3 jobs at once.
        assert!(most_alive <= 4, "{most_alive} tasks were alive at once");
    }
}
