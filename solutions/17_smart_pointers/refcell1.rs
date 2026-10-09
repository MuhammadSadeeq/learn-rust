// ============================================================================
//  SOLUTION refcell1 · Interior mutability     Chapter 17 · Smart Pointers
// ----------------------------------------------------------------------------
//  `send` only gets &self, so it cannot push to a plain Vec. RefCell moves the
//  borrow check from compile time to run time: borrow_mut() hands out a
//  mutable borrow through the shared reference. If two borrows ever overlapped,
//  RefCell would panic instead of failing to compile.
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
        // Store owned Strings, because the record must outlive these borrowed inputs.
        self.sent
            .borrow_mut()
            .push((to.to_string(), body.to_string()));
    }
}

// Send each user a welcome message.
fn welcome(mailer: &impl Mailer, users: &[&str]) {
    for &user in users {
        mailer.send(user, &format!("Welcome, {user}!"));
    }
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
