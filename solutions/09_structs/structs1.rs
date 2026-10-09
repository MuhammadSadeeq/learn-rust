// ============================================================================
//  SOLUTION structs1 · Define a struct        Chapter 09 · Structs & Methods
// ----------------------------------------------------------------------------
//  A struct literal must give every named field a value. A tuple struct's
//  fields are read by position, .0 and .1. A unit struct holds no data.
// ============================================================================

struct User {
    name: String,
    email: String,
    active: bool,
}

struct Point(i32, i32);

struct Admin;

fn new_user(name: &str, email: &str) -> User {
    User {
        name: name.to_string(),
        email: email.to_string(),
        // Every field needs a value. A new account starts out active.
        active: true,
    }
}

fn deactivate(mut u: User) -> User {
    u.active = false;
    u
}

// Manhattan distance from the origin: the sum of the absolute values.
fn manhattan(p: Point) -> i32 {
    p.0.abs() + p.1.abs()
}

fn root_admin() -> Admin {
    Admin
}

fn main() {
    let ana = deactivate(new_user("Ana", "ana@example.test"));
    println!("{} <{}> active: {}", ana.name, ana.email, ana.active);
    println!("distance: {}", manhattan(Point(3, -4)));
    let _admin = root_admin();
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn new_user_starts_active() {
        let u = new_user("Ana", "ana@example.test");
        assert_eq!(u.name, "Ana");
        assert_eq!(u.email, "ana@example.test");
        assert!(u.active);
    }

    #[test]
    fn deactivate_turns_active_off_and_keeps_the_rest() {
        let u = deactivate(new_user("Bo", "bo@example.test"));
        assert!(!u.active);
        assert_eq!(u.name, "Bo");
        assert_eq!(u.email, "bo@example.test");
    }

    #[test]
    fn manhattan_adds_absolute_values() {
        assert_eq!(manhattan(Point(3, -4)), 7);
        assert_eq!(manhattan(Point(0, 0)), 0); // edge case: the origin
    }

    #[test]
    fn unit_struct_takes_no_space() {
        // Edge case: a unit struct has no fields, so its size is zero bytes.
        let admin = root_admin();
        assert_eq!(std::mem::size_of_val(&admin), 0);
    }
}
