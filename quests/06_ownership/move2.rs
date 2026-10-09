// ============================================================================
//  QUEST move2 · Ownership in, ownership out  Chapter 06 · One Owner
// ----------------------------------------------------------------------------
//  add_signature takes a String, adds a signature line to the end, and hands
//  the String back. The signature is "\n-- Sent from Rust". Write the body.
//
//  The function takes ownership, so it may change the String it receives.
//  Don't build a new String from scratch. Don't edit the tests.
//
//  cargo forge          check your work (re-runs every time you save)
//  cargo forge hint     a nudge in the right direction
// ============================================================================

fn add_signature(mut text: String) -> String {
    todo!()
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
