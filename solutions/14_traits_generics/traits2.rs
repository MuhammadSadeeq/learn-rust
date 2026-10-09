// ============================================================================
//  SOLUTION traits2 · Default methods and impl Trait    Chapter 14 · Traits & Generics
// ----------------------------------------------------------------------------
//  `recipient` is the one method every type must write. `message` comes from
//  the trait, and Overdue overrides it. `loud` takes any Notify, so it works
//  for both types without knowing which one it got.
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
        &self.name
    }
}

impl Notify for Overdue {
    fn recipient(&self) -> &str {
        &self.name
    }

    // Override the default. The body can still call the required method.
    fn message(&self) -> String {
        let (dollars, cents) = (self.cents / 100, self.cents % 100);
        format!(
            "{}, your balance of ${dollars}.{cents:02} is overdue.",
            self.recipient()
        )
    }
}

// Accepts any type that implements Notify. The compiler makes a separate
// copy of this function for each concrete type it is called with.
fn loud(item: &impl Notify) -> String {
    item.message().to_uppercase()
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
