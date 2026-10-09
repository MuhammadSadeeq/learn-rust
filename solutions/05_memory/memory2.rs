// ============================================================================
//  SOLUTION memory2 · Length vs capacity     Chapter 05 · The Stack & The Heap
// ----------------------------------------------------------------------------
//  Capacity is the room a String or Vec has. with_capacity reserves it up
//  front, so pushes inside that room never allocate. Growth past the room
//  reallocates, and the exact steps belong to the allocator, so the last
//  function only records the steps it sees and the tests check the shape.
// ============================================================================

fn needed_capacity(fields: &[&str]) -> usize {
    let mut text = 0;
    for field in fields {
        text += field.len();
    }
    // n fields have n - 1 commas between them. saturating_sub keeps an empty
    // list at 0 instead of underflowing.
    text + fields.len().saturating_sub(1)
}

fn build_csv(fields: &[&str]) -> String {
    // Size the buffer once. The pushes below then fill room we already have.
    let mut out = String::with_capacity(needed_capacity(fields));
    let mut first = true;
    for field in fields {
        if !first {
            out.push(',');
        }
        first = false;
        out.push_str(field);
    }
    out
}

fn grow_report(n: usize) -> Vec<usize> {
    let mut items: Vec<usize> = Vec::new();
    let mut changes = Vec::new();
    let mut last_capacity = items.capacity();
    for i in 0..n {
        items.push(i);
        // Only a push that runs out of room changes the capacity. Record it then.
        if items.capacity() != last_capacity {
            last_capacity = items.capacity();
            changes.push(last_capacity);
        }
    }
    changes
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
        // The room was reserved up front, so the 6 bytes fit without growing.
        assert_eq!(csv.capacity(), 6);
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
