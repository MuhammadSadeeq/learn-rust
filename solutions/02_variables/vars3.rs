// ============================================================================
//  SOLUTION vars3 · Constants              Chapter 02 · Variables Are Promises
// ----------------------------------------------------------------------------
//  Constants are evaluated at compile time, and their type must be written
//  out. Unlike `let`, a `const` never infers its type. Once the type is
//  there, one constant can be built from others, because the compiler works
//  out the product before the program runs.
// ============================================================================

const SECONDS_PER_MINUTE: u64 = 60;
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
