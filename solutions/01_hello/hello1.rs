// ============================================================================
//  SOLUTION hello1 · First words                      Chapter 01 · Hello, Crab
// ----------------------------------------------------------------------------
//  `println!` is a macro, and macros are called with a trailing `!`. Without
//  the `!`, Rust looks for a function named `println`, finds a macro instead,
//  and refuses to compile. The `!` is how you tell a macro call from a
//  function call.
// ============================================================================

fn greeting() -> &'static str {
    "Hello, Rustacean!"
}

fn main() {
    println!("{}", greeting());
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
