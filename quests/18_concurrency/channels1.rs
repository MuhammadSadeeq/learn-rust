// ============================================================================
//  QUEST channels1 · Message passing           Chapter 18 · Fearless Concurrency
// ----------------------------------------------------------------------------
//  collect_reports starts `workers` threads. Worker N sends "worker N done"
//  (N counts from 1) through an mpsc channel. Receive until every sender is
//  gone, then return the messages sorted. Keep the signature.
//
//  Don't edit the tests.
//
//  cargo forge          check your work (re-runs every time you save)
//  cargo forge hint     a nudge in the right direction
// ============================================================================

use std::sync::mpsc;
use std::thread;

// Start `workers` threads. Worker N sends "worker N done", N counting from 1.
// Return every message, sorted.
fn collect_reports(workers: usize) -> Vec<String> {
    todo!()
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
