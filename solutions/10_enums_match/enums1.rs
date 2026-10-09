// ============================================================================
//  SOLUTION enums1 · Enums with data   Chapter 10 · Enums & Pattern Matching
// ----------------------------------------------------------------------------
//  Each variant carries its own data. A match arm names the variant and binds
//  the fields it needs. Matching on &Notification borrows the fields, so
//  nothing is moved out of the enum.
// ============================================================================

enum Notification {
    Email { to: String, subject: String },
    Sms { number: String, text: String },
    Push(String),
    Silent,
}

fn channel(n: &Notification) -> &'static str {
    // { .. } skips fields we do not need. String literals are 'static.
    match n {
        Notification::Email { .. } => "email",
        Notification::Sms { .. } => "sms",
        Notification::Push(_) => "push",
        Notification::Silent => "none",
    }
}

fn preview(n: &Notification) -> String {
    match n {
        Notification::Email { to, subject } => format!("Email to {to}: {subject}"),
        Notification::Sms { number, text } => format!("SMS to {number}: {text}"),
        Notification::Push(title) => format!("Push: {title}"),
        // Nothing to show, so the preview is empty.
        Notification::Silent => String::new(),
    }
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
        // Edge case: nothing to show, so the preview is just empty.
        assert_eq!(preview(&Notification::Silent), "");
    }
}
