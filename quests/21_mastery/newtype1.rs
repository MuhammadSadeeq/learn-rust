// ============================================================================
//  QUEST newtype1 · Newtypes guard invariants             Chapter 21 · Mastery
// ----------------------------------------------------------------------------
//  A String accepts anything. In PHP you usually validate an email once, in a
//  Form Request, and then pass a plain string to every function. A newtype
//  moves the check into the type. Email wraps a String, and the one way in is
//  TryFrom, which runs the check first. A PHP value object can do the same
//  job with a typed parameter, but PHP checks that type when the call runs.
//  Rust checks it when the program is built.
//
//  Implement TryFrom<&str> for Email, as_str and Display. A valid address has
//  exactly one '@', a non-empty part on each side of it, and a '.' in the
//  domain. Anything else is an Err. send_welcome returns "Welcome aboard,
//  <address>!". Don't edit the tests.
//
//  cargo forge          check your work (re-runs every time you save)
//  cargo forge hint     a nudge in the right direction
// ============================================================================

use std::fmt;

#[derive(Debug, Clone, PartialEq, Eq)]
struct Email(String);

impl TryFrom<&str> for Email {
    type Error = String;

    fn try_from(raw: &str) -> Result<Self, Self::Error> {
        todo!()
    }
}

impl Email {
    fn as_str(&self) -> &str {
        todo!()
    }
}

impl fmt::Display for Email {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        todo!()
    }
}

// Takes &Email, not &str, so an unchecked string cannot get here.
fn send_welcome(to: &Email) -> String {
    todo!()
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
