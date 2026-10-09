// ============================================================================
//  SOLUTION channels1 · Message passing  Chapter 18 · Fearless Concurrency
// ----------------------------------------------------------------------------
//  Every worker gets a clone of the Sender. The receiver's iterator ends only
//  when every Sender is dropped, so the Sender this function made must be
//  dropped too. Otherwise collecting would wait forever.
// ============================================================================

use std::sync::mpsc;
use std::thread;

fn collect_reports(workers: usize) -> Vec<String> {
    let (tx, rx) = mpsc::channel();

    for id in 1..=workers {
        // Each worker owns a clone. The thread drops its clone when it finishes.
        let tx = tx.clone();
        thread::spawn(move || {
            tx.send(format!("worker {id} done")).unwrap();
        });
    }
    // Drop the original Sender. This function still holds it, so rx would
    // otherwise never end.
    drop(tx);

    // The iterator ends once every Sender is gone.
    let mut reports: Vec<String> = rx.into_iter().collect();
    reports.sort();
    reports
}

fn main() {
    for line in collect_reports(3) {
        println!("{line}");
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn three_workers_report_sorted() {
        assert_eq!(
            collect_reports(3),
            vec!["worker 1 done", "worker 2 done", "worker 3 done"]
        );
    }

    #[test]
    fn no_workers_returns_at_once() {
        assert!(collect_reports(0).is_empty());
    }

    #[test]
    fn fifty_workers_each_report_once() {
        let reports = collect_reports(50);
        assert_eq!(reports.len(), 50);
        assert!(reports.iter().any(|r| r == "worker 37 done"));
        // Sorted as strings, so a strictly increasing list has no duplicates.
        assert!(reports.windows(2).all(|pair| pair[0] < pair[1]));
    }
}
