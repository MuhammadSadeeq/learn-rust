// ============================================================================
//  QUEST hello1 · First words                         Chapter 01 · Hello, Crab
// ----------------------------------------------------------------------------
//  This program should print a greeting, but it does not compile.
//
//  Your job: make it compile and make the tests pass. Keep the greeting text
//  exactly as written, and don't edit the tests.
//
//  cargo forge          check your work (re-runs every time you save)
//  cargo forge hint     a nudge in the right direction
// ============================================================================

fn greeting() -> &'static str {
    "Hello, Rustacean!"
}

fn main() {
    println(greeting());
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn greeting_text() {
        assert_eq!(greeting(), "Hello, Rustacean!");
    }

    #[test]
    fn main_runs_without_panicking() {
        main();
    }
}
