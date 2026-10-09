// ============================================================================
//  QUEST enums1 · Enums with data      Chapter 10 · Enums & Pattern Matching
// ----------------------------------------------------------------------------
//  Each Notification variant carries different data. Write two functions:
//    channel(&n)  the channel name: "email", "sms", "push" or "none"
//    preview(&n)  a one-line summary built from the variant's data:
//                   Email   "Email to ana@example.test: Invoice 42"
//                   Sms     "SMS to +15550100: Your code is 4821"
//                   Push    "Push: New follower"
//                   Silent  "" (an empty string)
//
//  Both bodies are todo!() for now. Use match and read the fields you need.
//  Don't edit the tests.
//
//  cargo forge          check your work (re-runs every time you save)
//  cargo forge hint     a nudge in the right direction
// ============================================================================

enum Notification {
    Email { to: String, subject: String },
    Sms { number: String, text: String },
    Push(String),
    Silent,
}

fn channel(n: &Notification) -> &'static str {
    todo!()
}

fn preview(n: &Notification) -> String {
    todo!()
}

fn main() {
    let inbox = [
        Notification::Email {
            to: String::from("ana@example.test"),
            subject: String::from("Invoice 42"),
        },
        Notification::Sms {
            number: String::from("+15550100"),
            text: String::from("Your code is 4821"),
        },
        Notification::Push(String::from("New follower")),
        Notification::Silent,
    ];
    for n in &inbox {
        println!("{}: {}", channel(n), preview(n));
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn channel_names_each_variant() {
        let email = Notification::Email {
            to: String::from("a@b.test"),
            subject: String::from("Hi"),
        };
        let sms = Notification::Sms {
            number: String::from("+1"),
            text: String::from("x"),
        };
        assert_eq!(channel(&email), "email");
        assert_eq!(channel(&sms), "sms");
        assert_eq!(channel(&Notification::Push(String::from("x"))), "push");
        assert_eq!(channel(&Notification::Silent), "none");
    }

    #[test]
    fn preview_email_shows_recipient_and_subject() {
        let n = Notification::Email {
            to: String::from("ana@example.test"),
            subject: String::from("Invoice 42"),
        };
        assert_eq!(preview(&n), "Email to ana@example.test: Invoice 42");
    }

    #[test]
    fn preview_sms_and_push() {
        let sms = Notification::Sms {
            number: String::from("+15550100"),
            text: String::from("Your code is 4821"),
        };
        assert_eq!(preview(&sms), "SMS to +15550100: Your code is 4821");
        assert_eq!(
            preview(&Notification::Push(String::from("New follower"))),
            "Push: New follower"
        );
    }

    #[test]
    fn silent_has_an_empty_preview() {
        // Edge case: there is nothing to show, so the preview is empty, not a panic.
        assert_eq!(preview(&Notification::Silent), "");
    }
}
