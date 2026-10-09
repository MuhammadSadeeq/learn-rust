// ============================================================================
//  SOLUTION hello2 · Formatting                       Chapter 01 · Hello, Crab
// ----------------------------------------------------------------------------
//  `format!` returns a String, so the function can hand the text back to its
//  caller. Inline arguments read variables straight from the surrounding
//  scope.
//
//  For the price, integer division and remainder split the cents into whole
//  dollars and leftover cents. `{rest:02}` pads the cents to two digits, so 5
//  becomes 05. Integer math keeps money exact, with no floating-point
//  rounding.
// ============================================================================

fn greet(name: &str, language: &str) -> String {
    format!("Hello, {name}! You're learning {language}.")
}

fn price_tag(cents: u32) -> String {
    let dollars = cents / 100;
    let rest = cents % 100;
    format!("${dollars}.{rest:02}")
}

fn main() {
    println!("{}", greet("Ana", "Rust"));
    println!("{}", price_tag(1250));
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn greets_by_name_and_language() {
        assert_eq!(greet("Ana", "Rust"), "Hello, Ana! You're learning Rust.");
        assert_eq!(greet("Bo", "Go"), "Hello, Bo! You're learning Go.");
    }

    #[test]
    fn empty_name_still_formats() {
        assert_eq!(greet("", "Rust"), "Hello, ! You're learning Rust.");
    }

    #[test]
    fn price_tag_pads_the_cents() {
        assert_eq!(price_tag(1250), "$12.50");
        assert_eq!(price_tag(5), "$0.05");
        assert_eq!(price_tag(0), "$0.00");
    }
}
