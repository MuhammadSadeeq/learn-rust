// ============================================================================
//  QUEST vars3 · Constants                 Chapter 02 · Variables Are Promises
// ----------------------------------------------------------------------------
//  `hours_to_seconds` converts hours to seconds using three constants. The
//  compiler rejects the file: a `const` always needs an explicit type, and
//  the first constant has none. The other two show the form to copy.
//
//  Your job: make it compile and make the tests pass. Don't edit the tests.
//
//  cargo forge          check your work (re-runs every time you save)
//  cargo forge hint     a nudge in the right direction
// ============================================================================

const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR: u64 = 60;
const SECONDS_PER_HOUR: u64 = SECONDS_PER_MINUTE * MINUTES_PER_HOUR;

fn hours_to_seconds(h: u64) -> u64 {
    h * SECONDS_PER_HOUR
}

fn main() {
    println!("2 hours is {} seconds", hours_to_seconds(2));
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn constants_fit_together() {
        assert_eq!(SECONDS_PER_MINUTE, 60);
        assert_eq!(MINUTES_PER_HOUR, 60);
        assert_eq!(SECONDS_PER_HOUR, 3600);
    }

    #[test]
    fn converts_hours_to_seconds() {
        assert_eq!(hours_to_seconds(0), 0);
        assert_eq!(hours_to_seconds(2), 7200);
    }
}
