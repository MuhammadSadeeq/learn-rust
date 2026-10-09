// ============================================================================
//  QUEST memory2 · Length vs capacity        Chapter 05 · The Stack & The Heap
// ----------------------------------------------------------------------------
//  A String keeps two numbers: len (bytes in use) and capacity (room it has
//  before it must grow). Build a CSV line into a String that is sized once,
//  then watch a Vec's capacity change as it grows.
//
//  Implement the three functions. Don't edit the tests.
//
//  cargo forge          check your work (re-runs every time you save)
//  cargo forge hint     a nudge in the right direction
// ============================================================================

/// The bytes needed to join `fields` with commas: the text of every field,
/// plus one comma between each pair of neighbors.
fn needed_capacity(fields: &[&str]) -> usize {
    todo!()
}

/// Joins `fields` with commas, e.g. ["ana", "bo"] -> "ana,bo".
/// Reserve the room with String::with_capacity first, then push.
fn build_csv(fields: &[&str]) -> String {
    todo!()
}

/// Pushes 0, 1, ..., n-1 into an empty Vec. Returns the capacity every time
/// a push made the Vec grow, in order.
fn grow_report(n: usize) -> Vec<usize> {
    todo!()
}

fn main() {
    let csv = build_csv(&["ana", "bo", "cy"]);
    println!("{csv}");
    println!("capacity steps for 10 pushes: {:?}", grow_report(10));
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn builds_the_csv_line() {
        assert_eq!(build_csv(&["ana", "bo", "cy"]), "ana,bo,cy");
        assert_eq!(build_csv(&["solo"]), "solo");
        assert_eq!(build_csv(&[]), "");
    }

    #[test]
    fn reserves_the_room_it_needs() {
        // Text: 1 + 2 + 1 bytes. Commas: 2.
        assert_eq!(needed_capacity(&["a", "bb", "c"]), 6);
        assert_eq!(needed_capacity(&[]), 0);
        let csv = build_csv(&["a", "bb", "c"]);
        assert!(csv.capacity() >= csv.len());
    }

    #[test]
    fn capacity_grows_in_steps() {
        let steps = grow_report(100);
        assert!(!steps.is_empty());
        assert!(steps.windows(2).all(|w| w[0] < w[1]), "capacity only grows: {steps:?}");
        assert!(*steps.last().unwrap() >= 100);
        assert!(grow_report(0).is_empty());
    }
}
