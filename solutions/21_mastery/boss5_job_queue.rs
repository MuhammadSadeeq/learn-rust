// ============================================================================
//  SOLUTION boss5_job_queue · Job queue            Chapter 21 · Mastery
// ----------------------------------------------------------------------------
//  Workers share one Receiver behind Arc<Mutex<..>>. Each one takes a job with
//  the lock held only for recv(), so the others keep working while it runs. A
//  failing job retries in place. shutdown and Drop both close the channel, so
//  each worker drains its queue and exits before the join.
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
        // Both variants carry a name, so one or-pattern binds it for either.
        match self {
            JobResult::Done { job, .. } | JobResult::Failed { job, .. } => job,
        }
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
        assert!(workers > 0, "a queue needs at least one worker");

        let (sender, receiver) = mpsc::channel();
        // One receiver for all the workers. The Mutex lets one worker at a time
        // take the next envelope.
        let receiver = Arc::new(Mutex::new(receiver));
        let results = Arc::new(Mutex::new(Vec::new()));

        let workers: Vec<JoinHandle<()>> = (0..workers)
            .map(|_| {
                let receiver = Arc::clone(&receiver);
                let results = Arc::clone(&results);
                thread::spawn(move || worker_loop(receiver, results, max_attempts))
            })
            .collect();

        Queue {
            sender: Some(sender),
            workers,
            results,
        }
    }

    fn dispatch(&self, job: Box<dyn Job>) {
        let envelope = Envelope { job, attempt: 1 };
        self.sender
            .as_ref()
            .expect("the sender is only taken during shutdown or drop")
            .send(envelope)
            .expect("the workers stopped early");
    }

    fn shutdown(mut self) -> Vec<JobResult> {
        self.close();

        let mut results = std::mem::take(&mut *self.results.lock().expect("results lock poisoned"));
        // Workers finish in any order. Sorting by name makes the output stable.
        results.sort_by(|a, b| a.job_name().cmp(b.job_name()));
        results
    }

    // Closes the channel, then waits for every worker to exit.
    fn close(&mut self) {
        // Dropping the sender ends the channel. Workers still run the envelopes
        // already queued, then recv() fails and each worker returns.
        self.sender.take();
        for worker in self.workers.drain(..) {
            // A worker that panicked has already reported its panic. Ignoring
            // the Err here avoids a second panic inside Drop.
            let _ = worker.join();
        }
    }
}

impl Drop for Queue {
    // Runs only when shutdown was never called. Waiting here means no worker
    // outlives the queue that owns it.
    fn drop(&mut self) {
        self.close();
    }
}

fn worker_loop(
    receiver: Arc<Mutex<Receiver<Envelope>>>,
    results: Arc<Mutex<Vec<JobResult>>>,
    max_attempts: u32,
) {
    loop {
        // The lock is held only for this one recv(). A `while let` over
        // `lock().recv()` would keep the guard alive for the whole loop body,
        // and every other worker would wait behind the current job.
        let next = receiver.lock().expect("queue lock poisoned").recv();
        let Ok(mut envelope) = next else {
            // The channel is closed and empty, so no more work is coming.
            return;
        };

        // Run the job until it succeeds or the attempts run out.
        let result = loop {
            match envelope.job.handle() {
                Ok(output) => {
                    break JobResult::Done {
                        job: envelope.job.name(),
                        output,
                        attempts: envelope.attempt,
                    };
                }
                Err(error) if envelope.attempt >= max_attempts => {
                    break JobResult::Failed {
                        job: envelope.job.name(),
                        error,
                        attempts: envelope.attempt,
                    };
                }
                // Retry in place. The envelope still holds the job.
                Err(_) => envelope.attempt += 1,
            }
        };

        results.lock().expect("results lock poisoned").push(result);
    }
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
