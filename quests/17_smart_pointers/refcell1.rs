// ============================================================================
//  QUEST refcell1 · Interior mutability        Chapter 17 · Smart Pointers
// ----------------------------------------------------------------------------
//  `welcome` sends one message per user through a Mailer. FakeMailer records
//  the messages instead of sending them, like Laravel's Mail::fake(). Its
//  `send` takes &self, so the record has to change through a shared
//  reference. The RefCell field is the tool for that.
//
//  Don't edit the tests or the trait.
//
//  cargo forge          check your work (re-runs every time you save)
//  cargo forge hint     a nudge in the right direction
// ============================================================================

use std::cell::RefCell;

trait Mailer {
    fn send(&self, to: &str, body: &str);
}

struct FakeMailer {
    sent: RefCell<Vec<(String, String)>>,
}

impl FakeMailer {
    fn new() -> Self {
        FakeMailer {
            sent: RefCell::new(Vec::new()),
        }
    }
}

impl Mailer for FakeMailer {
    fn send(&self, to: &str, body: &str) {
        todo!()
    }
}

// Send each user a welcome message.
fn welcome(mailer: &impl Mailer, users: &[&str]) {
    todo!()
}

fn main() {
    let mailer = FakeMailer::new();
    welcome(&mailer, &["Ana", "Bo"]);
    for (to, body) in mailer.sent.borrow().iter() {
        println!("to {to}: {body}");
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn sends_one_message_per_user() {
        let mailer = FakeMailer::new();
        welcome(&mailer, &["Ana", "Bo"]);
        let sent = mailer.sent.borrow();
        assert_eq!(sent.len(), 2);
        assert_eq!(sent[0].0, "Ana");
        assert_eq!(sent[1].0, "Bo");
    }

    #[test]
    fn message_names_the_user() {
        let mailer = FakeMailer::new();
        welcome(&mailer, &["Cy"]);
        assert_eq!(mailer.sent.borrow()[0].1, "Welcome, Cy!");
    }

    #[test]
    fn no_users_no_mail() {
        let mailer = FakeMailer::new();
        welcome(&mailer, &[]);
        assert!(mailer.sent.borrow().is_empty());
    }

    #[test]
    fn send_works_through_shared_references() {
        let mailer = FakeMailer::new();
        let first: &dyn Mailer = &mailer;
        let second = &mailer;
        first.send("ana@example.com", "hi");
        second.send("bo@example.com", "hello");
        assert_eq!(mailer.sent.borrow().len(), 2);
    }
}
