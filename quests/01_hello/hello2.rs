// ============================================================================
//  QUEST hello2 · Formatting                          Chapter 01 · Hello, Crab
// ----------------------------------------------------------------------------
//  `format!` works like `println!`, but it returns a String instead of
//  printing. Inline arguments such as `{name}` put a variable's value into
//  the text.
//
//  `greet` builds one greeting line. `price_tag` turns cents into dollars, so
//  1250 becomes "$12.50". Both bodies are todo!() for now, so the tests fail
//  until you write them. Don't edit the tests.
//
//  cargo forge          check your work (re-runs every time you save)
//  cargo forge hint     a nudge in the right direction
// ============================================================================

fn greet(name: &str, language: &str) -> String {
    todo!()
}

fn price_tag(cents: u32) -> String {
    todo!()
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
