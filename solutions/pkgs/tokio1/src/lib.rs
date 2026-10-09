// ============================================================================
//  QUEST tokio1 · Jobs with a timeout                    Chapter 19 · Async Rust
// ----------------------------------------------------------------------------
//  A job that never finishes must not hold up the others. Run every job at
//  the same time, give each one a time limit, and collect the results.
//
//  run_jobs gets a list of jobs. Each job sleeps for its delay_ms, then gives
//  back id * 10. Use these rules:
//    - Start every job with a JoinSet, so they all run at once.
//    - Wrap each job in tokio::time::timeout(per_job, ...). A job that runs
//      past the limit is cancelled: the timeout drops its future.
//    - done holds (id, value) for every job that finished in time.
//    - timed_out holds the id of every job that hit the limit.
//    - Sort both lists by id before you return them.
//
//  Use #[tokio::test(start_paused = true)] in the tests: the clock only moves
//  when every task is waiting, so the timings are exact. Don't edit the tests.
//
//  cargo forge          check your work (re-runs every time you save)
//  cargo forge hint     a nudge in the right direction
// ============================================================================

use std::time::Duration;
use tokio::task::JoinSet;
use tokio::time::timeout;

pub struct Job {
    pub id: u32,
    pub delay_ms: u64,
}

#[derive(Debug, PartialEq)]
pub struct Report {
    pub done: Vec<(u32, u32)>,
    pub timed_out: Vec<u32>,
}

pub async fn run_jobs(jobs: Vec<Job>, per_job: Duration) -> Report {
    let mut set = JoinSet::new();
    for job in jobs {
        let (id, delay_ms) = (job.id, job.delay_ms);
        set.spawn(async move {
            let work = async {
                tokio::time::sleep(Duration::from_millis(delay_ms)).await;
                id * 10
            };
            (id, timeout(per_job, work).await)
        });
    }

    let mut done = Vec::new();
    let mut timed_out = Vec::new();
    while let Some(joined) = set.join_next().await {
        // A JoinError means the job panicked. Let that stop the run loudly.
        let (id, result) = joined.expect("a job panicked");
        match result {
            Ok(value) => done.push((id, value)),
            Err(_elapsed) => timed_out.push(id),
        }
    }
    done.sort();
    timed_out.sort();
    Report { done, timed_out }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn job(id: u32, delay_ms: u64) -> Job {
        Job { id, delay_ms }
    }

    #[tokio::test(start_paused = true)]
    async fn collects_the_jobs_that_finish_in_time() {
        let report = run_jobs(vec![job(1, 10), job(2, 30)], Duration::from_millis(100)).await;
        assert_eq!(
            report,
            Report {
                done: vec![(1, 10), (2, 20)],
                timed_out: vec![],
            }
        );
    }

    #[tokio::test(start_paused = true)]
    async fn reports_the_ids_that_timed_out() {
        let jobs = vec![job(1, 10), job(2, 500), job(3, 20), job(4, 900)];
        let report = run_jobs(jobs, Duration::from_millis(100)).await;
        assert_eq!(report.done, vec![(1, 10), (3, 30)]);
        assert_eq!(report.timed_out, vec![2, 4]);
    }

    #[tokio::test(start_paused = true)]
    async fn jobs_run_at_the_same_time() {
        // Ten jobs of 100 ms each take about 100 ms in total, not one second.
        let jobs: Vec<Job> = (0..10).map(|id| job(id, 100)).collect();
        let start = tokio::time::Instant::now();
        let report = run_jobs(jobs, Duration::from_millis(150)).await;
        assert_eq!(report.done.len(), 10);
        assert!(start.elapsed() < Duration::from_millis(200));
    }

    #[tokio::test(start_paused = true)]
    async fn no_jobs_gives_an_empty_report() {
        let report = run_jobs(vec![], Duration::from_millis(100)).await;
        assert_eq!(
            report,
            Report {
                done: vec![],
                timed_out: vec![],
            }
        );
    }
}
