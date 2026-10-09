// ============================================================================
//  SOLUTION newtype1 · Newtypes guard invariants          Chapter 21 · Mastery
// ----------------------------------------------------------------------------
//  The check lives in try_from, and the field is private, so every Email in
//  the program has passed it. send_welcome takes &Email, so an unchecked
//  string cannot reach it. The compiler enforces that, not a comment.
// ============================================================================

use std::fmt;

#[derive(Debug, Clone, PartialEq, Eq)]
struct Email(String);

impl TryFrom<&str> for Email {
    type Error = String;

    fn try_from(raw: &str) -> Result<Self, Self::Error> {
        // The only way to build an Email, so every rule is checked here, once.
        let mut parts = raw.split('@');
        match (parts.next(), parts.next(), parts.next()) {
            (Some(local), Some(domain), None)
                if !local.is_empty() && !domain.is_empty() && domain.contains('.') =>
            {
                Ok(Email(raw.to_string()))
            }
            // Zero '@' signs, several '@' signs, an empty side, or no '.' in the domain.
            _ => Err(format!("not a valid email address: {raw:?}")),
        }
    }
}

impl Email {
    fn as_str(&self) -> &str {
        &self.0
    }
}

impl fmt::Display for Email {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(&self.0)
    }
}

// Takes &Email, not &str. A caller cannot pass an unchecked string.
fn send_welcome(to: &Email) -> String {
    format!("Welcome aboard, {}!", to.as_str())
}

fn main() {
    for raw in ["ana@example.com", "not-an-email"] {
        match Email::try_from(raw) {
            Ok(email) => println!("{}", send_welcome(&email)),
            Err(err) => println!("rejected: {err}"),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn accepts_a_well_formed_address() {
        let email = Email::try_from("ana@example.com").expect("should be valid");
        assert_eq!(email.as_str(), "ana@example.com");
    }

    #[test]
    fn rejects_malformed_addresses() {
        for bad in ["", "ana", "ana@@example.com", "@example.com", "ana@", "ana@localhost"] {
            assert!(Email::try_from(bad).is_err(), "{bad:?} should be rejected");
        }
    }

    #[test]
    fn displays_the_address() {
        let email = Email::try_from("bo@example.org").unwrap();
        assert_eq!(email.to_string(), "bo@example.org");
    }

    #[test]
    fn welcome_uses_the_checked_address() {
        let email = Email::try_from("cy@example.net").unwrap();
        assert_eq!(send_welcome(&email), "Welcome aboard, cy@example.net!");
    }
}
