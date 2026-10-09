// ============================================================================
//  SOLUTION move2 · Ownership in, ownership out  Chapter 06 · One Owner
// ----------------------------------------------------------------------------
//  The caller moved the String in, so this function owns it and may change it.
//  Append to the existing buffer and return it. The caller gets the same
//  String back, now owned by whoever receives the return value.
// ============================================================================

fn add_signature(mut text: String) -> String {
    text.push_str("\n-- Sent from Rust");
    text
}

fn main() {
    let body = String::from("Your order has shipped.");
    let email = add_signature(body);
    // `body` was moved into add_signature. Only `email` can be used now.
    println!("{email}");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn adds_the_signature() {
        assert_eq!(add_signature(String::from("Hi")), "Hi\n-- Sent from Rust");
    }

    #[test]
    fn chains_two_calls() {
        let once = add_signature(String::from("Hi"));
        let twice = add_signature(once);
        assert_eq!(twice, "Hi\n-- Sent from Rust\n-- Sent from Rust");
    }

    #[test]
    fn empty_text_still_gets_a_signature() {
        assert_eq!(add_signature(String::new()), "\n-- Sent from Rust");
    }
}
