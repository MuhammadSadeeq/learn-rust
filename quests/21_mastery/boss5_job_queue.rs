// ============================================================================
//  QUEST boss5_job_queue · Job queue                      Chapter 21 · Mastery
// ----------------------------------------------------------------------------
//  Final boss. A Laravel queue works like this: you dispatch a job, a worker
//  picks it up, and a failing job is retried up to a limit. Build the same
//  thing with threads and channels.
//
//    Queue::new     start `workers` threads. They share one Receiver, behind
//                   an Arc<Mutex<..>>, and each runs worker_loop.
//    dispatch       send an Envelope with attempt 1 down the channel.
//    worker_loop    take one envelope and run it. On Err, retry in place until
//                   attempt == max_attempts. Then record one JobResult.
//    shutdown       close the channel, wait for every worker, and return the
//                   results sorted by job name.
//    Drop           the same close-and-wait, for a queue that was never shut
//                   down. Put the shared part in a private method.
//    job_name       the name inside a JobResult, for sorting.
//
//  max_attempts counts total runs, so 1 means no retries. Hold the lock only
//  while receiving a job, not while running it. Don't edit the tests.
//
//  cargo forge          check your work (re-runs every time you save)
//  cargo forge hint     a nudge in the right direction
// ============================================================================

use std::sync::mpsc::{self, Receiver};
use std::sync::{Arc, Mutex};
use std::thread::{self, JoinHandle};

// Anything the queue can run. `Send` lets a job move onto a worker thread.
trait Job: Send {
    fn name(&self) -> String;
    // Err means "failed, try again". Ok carries the output.
    fn handle(&self) -> Result<String, String>;
}

// A job on its way to a worker, plus how many runs it has had so far.
struct Envelope {
    job: Box<dyn Job>,
    attempt: u32,
}

#[derive(Debug, Clone, PartialEq, Eq)]
enum JobResult {
    Done { job: String, output: String, attempts: u32 },
    Failed { job: String, error: String, attempts: u32 },
}

impl JobResult {
    fn job_name(&self) -> &str {
        todo!()
    }
}

struct Queue {
    // Taking the sender out of the Option closes the channel. That is how the
    // workers learn that no more jobs are coming.
    sender: Option<mpsc::Sender<Envelope>>,
    workers: Vec<JoinHandle<()>>,
    results: Arc<Mutex<Vec<JobResult>>>,
}

impl Queue {
    fn new(workers: usize, max_attempts: u32) -> Queue {
        todo!()
    }

    fn dispatch(&self, job: Box<dyn Job>) {
        todo!()
    }

    fn shutdown(mut self) -> Vec<JobResult> {
        todo!()
    }
}

impl Drop for Queue {
    fn drop(&mut self) {
        todo!()
    }
}

fn worker_loop(
    receiver: Arc<Mutex<Receiver<Envelope>>>,
    results: Arc<Mutex<Vec<JobResult>>>,
    max_attempts: u32,
) {
    todo!()
}

// A stand-in for a Laravel job such as SendWelcomeEmail.
struct SendEmail {
    to: String,
}

impl Job for SendEmail {
    fn name(&self) -> String {
        format!("email:{}", self.to)
    }

    fn handle(&self) -> Result<String, String> {
        Ok(format!("sent to {}", self.to))
    }
}

fn main() {
    let queue = Queue::new(3, 2);
    for user in ["ana", "bo", "cy"] {
        queue.dispatch(Box::new(SendEmail { to: user.to_string() }));
    }
    for result in queue.shutdown() {
        println!("{result:?}");
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::atomic::{AtomicU32, Ordering};

    // Fails the first `failures` runs, then succeeds. The counter lives in the
    // job, so it survives across retries.
    struct Flaky {
        name: String,
        failures: u32,
        runs: AtomicU32,
    }

    impl Job for Flaky {
        fn name(&self) -> String {
            self.name.clone()
        }

        fn handle(&self) -> Result<String, String> {
            let run = self.runs.fetch_add(1, Ordering::SeqCst) + 1;
            if run <= self.failures {
                Err(format!("run {run} failed"))
            } else {
                Ok(format!("run {run} ok"))
            }
        }
    }

    struct AlwaysFails;

    impl Job for AlwaysFails {
        fn name(&self) -> String {
            "always-fails".to_string()
        }

        fn handle(&self) -> Result<String, String> {
            Err("boom".to_string())
        }
    }

    // Bumps a shared counter on every run, so a test can count the runs after
    // the queue is gone.
    struct Counting(Arc<AtomicU32>);

    impl Job for Counting {
        fn name(&self) -> String {
            "counting".to_string()
        }

        fn handle(&self) -> Result<String, String> {
            self.0.fetch_add(1, Ordering::SeqCst);
            Ok("counted".to_string())
        }
    }

    #[test]
    fn runs_every_job_when_all_succeed() {
        let queue = Queue::new(2, 3);
        queue.dispatch(Box::new(SendEmail { to: "bo".to_string() }));
        queue.dispatch(Box::new(SendEmail { to: "ana".to_string() }));

        assert_eq!(
            queue.shutdown(),
            vec![
                JobResult::Done {
                    job: "email:ana".to_string(),
                    output: "sent to ana".to_string(),
                    attempts: 1,
                },
                JobResult::Done {
                    job: "email:bo".to_string(),
                    output: "sent to bo".to_string(),
                    attempts: 1,
                },
            ]
        );
    }

    #[test]
    fn retries_a_failing_job_until_it_succeeds() {
        let queue = Queue::new(1, 3);
        queue.dispatch(Box::new(Flaky {
            name: "flaky".to_string(),
            failures: 2,
            runs: AtomicU32::new(0),
        }));

        assert_eq!(
            queue.shutdown(),
            vec![JobResult::Done {
                job: "flaky".to_string(),
                output: "run 3 ok".to_string(),
                attempts: 3,
            }]
        );
    }

    #[test]
    fn gives_up_after_max_attempts_without_stopping_other_jobs() {
        let queue = Queue::new(2, 3);
        queue.dispatch(Box::new(AlwaysFails));
        queue.dispatch(Box::new(SendEmail { to: "ana".to_string() }));

        assert_eq!(
            queue.shutdown(),
            vec![
                JobResult::Failed {
                    job: "always-fails".to_string(),
                    error: "boom".to_string(),
                    attempts: 3,
                },
                JobResult::Done {
                    job: "email:ana".to_string(),
                    output: "sent to ana".to_string(),
                    attempts: 1,
                },
            ]
        );
    }

    #[test]
    fn an_empty_queue_shuts_down_cleanly() {
        let queue = Queue::new(4, 3);
        assert!(queue.shutdown().is_empty());
    }

    #[test]
    fn many_jobs_on_four_workers_all_finish() {
        let queue = Queue::new(4, 1);
        for i in 0..100 {
            queue.dispatch(Box::new(SendEmail { to: format!("user{i:03}") }));
        }

        let results = queue.shutdown();
        // Four workers finish in no fixed order, so compare the sorted names.
        let names: Vec<&str> = results.iter().map(JobResult::job_name).collect();
        let expected: Vec<String> = (0..100).map(|i| format!("email:user{i:03}")).collect();
        assert_eq!(names, expected);
        assert!(results
            .iter()
            .all(|r| matches!(r, JobResult::Done { attempts: 1, .. })));
    }

    #[test]
    fn dropping_the_queue_still_runs_what_was_queued() {
        let runs = Arc::new(AtomicU32::new(0));
        {
            let queue = Queue::new(2, 1);
            for _ in 0..5 {
                queue.dispatch(Box::new(Counting(Arc::clone(&runs))));
            }
        } // No shutdown here. Drop has to wait for the workers.
        assert_eq!(runs.load(Ordering::SeqCst), 5);
    }
}
