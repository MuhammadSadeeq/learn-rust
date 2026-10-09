// ============================================================================
//  QUEST traits2 · Default methods and impl Trait       Chapter 14 · Traits & Generics
// ----------------------------------------------------------------------------
//  A trait can have a default method. Every type that implements the required
//  methods gets the default for free, and can override it. `impl Trait` in an
//  argument accepts any type that has the trait.
//
//  Replace the todo!() bodies. Don't edit the tests.
//
//  cargo forge          check your work (re-runs every time you save)
//  cargo forge hint     a nudge in the right direction
// ============================================================================

trait Notify {
    // Required: every type says who the message goes to.
    fn recipient(&self) -> &str;

    // Default: any type with a recipient gets this message for free.
    fn message(&self) -> String {
        format!("Hello, {}!", self.recipient())
    }
}

struct Customer {
    name: String,
}

struct Overdue {
    name: String,
    cents: u32,
}

impl Notify for Customer {
    fn recipient(&self) -> &str {
        todo!()
    }
}

impl Notify for Overdue {
    fn recipient(&self) -> &str {
        &self.name
    }

    // Override the default with a message for overdue balances.
    fn message(&self) -> String {
        todo!()
    }
}

// Accepts any type that implements Notify.
fn loud(item: &impl Notify) -> String {
    todo!()
}

fn main() {
    let customer = Customer {
        name: String::from("Ana"),
    };
    let overdue = Overdue {
        name: String::from("Bo"),
        cents: 1250,
    };
    println!("{}", customer.message());
    println!("{}", overdue.message());
    println!("{}", loud(&customer));
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn default_message_comes_from_the_trait() {
        let customer = Customer {
            name: String::from("Ana"),
        };
        assert_eq!(customer.message(), "Hello, Ana!");
    }

    #[test]
    fn overridden_message_replaces_the_default() {
        let overdue = Overdue {
            name: String::from("Bo"),
            cents: 1250,
        };
        assert_eq!(overdue.message(), "Bo, your balance of $12.50 is overdue.");
    }

    #[test]
    fn loud_accepts_any_notify_type() {
        let customer = Customer {
            name: String::from("Ana"),
        };
        let overdue = Overdue {
            name: String::from("Bo"),
            cents: 5,
        };
        assert_eq!(loud(&customer), "HELLO, ANA!");
        assert_eq!(loud(&overdue), "BO, YOUR BALANCE OF $0.05 IS OVERDUE.");
    }
}
