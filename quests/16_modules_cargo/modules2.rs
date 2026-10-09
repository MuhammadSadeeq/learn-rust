// ============================================================================
//  QUEST modules2 · Paths and use     Chapter 16 · Modules, Crates & Tests
// ----------------------------------------------------------------------------
//  A path is resolved from the module where it is written. Three paths here
//  are wrong: `models` is a sibling of `services`, so it isn't in scope there
//  (E0433). `User` isn't in scope in `services` either (E0425). And main
//  writes `app::User`, but nothing re-exports User at the top of `app`.
//
//  Fix the paths with super::, crate:: or use, and add a `pub use`.
//  Don't edit the tests.
//
//  cargo forge          check your work (re-runs every time you save)
//  cargo forge hint     a nudge in the right direction
// ============================================================================

mod app {
    pub mod models {
        pub struct User {
            pub name: String,
            pub email: String,
        }

        impl User {
            pub fn new(name: &str, email: &str) -> User {
                User {
                    name: name.to_string(),
                    email: email.to_string(),
                }
            }
        }
    }

    pub mod services {
        pub fn welcome(user: &models::User) -> String {
            format!("Welcome, {}! We wrote to {}.", user.name, user.email)
        }

        pub fn is_gmail(user: &User) -> bool {
            user.email.ends_with("@gmail.com")
        }
    }
}

fn main() {
    let ana = app::User::new("Ana", "ana@gmail.com");
    println!("{}", app::services::welcome(&ana));
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn user_is_reachable_from_the_app_root() {
        let user = app::User::new("Ana", "ana@gmail.com");
        assert_eq!(user.name, "Ana");
    }

    #[test]
    fn welcome_mentions_name_and_email() {
        let user = app::User::new("Bo", "bo@example.com");
        assert_eq!(
            app::services::welcome(&user),
            "Welcome, Bo! We wrote to bo@example.com."
        );
    }

    #[test]
    fn detects_gmail_addresses_only() {
        let gmail = app::User::new("Cy", "cy@gmail.com");
        let other = app::User::new("Di", "di@example.org");
        let lookalike = app::User::new("Ed", "ed@notgmail.com");
        assert!(app::services::is_gmail(&gmail));
        assert!(!app::services::is_gmail(&other));
        assert!(
            !app::services::is_gmail(&lookalike),
            "only an exact @gmail.com domain counts"
        );
    }
}
