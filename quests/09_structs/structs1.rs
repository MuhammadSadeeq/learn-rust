// ============================================================================
//  QUEST structs1 · Define a struct           Chapter 09 · Structs & Methods
// ----------------------------------------------------------------------------
//  The file does not compile. Read each error, fix it, and make every function
//  do what its name and the tests say.
//
//  User has named fields. Point is a tuple struct, so its fields are .0 and .1.
//  Admin is a unit struct: it has no fields and is written as its name alone.
//
//  Don't edit the tests.
//
//  cargo forge          check your work (re-runs every time you save)
//  cargo forge hint     a nudge in the right direction
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
    }
}

fn deactivate(mut u: User) -> User {
    u.active = 0;
    u
}

// Manhattan distance from the origin: the sum of the absolute values.
fn manhattan(p: Point) -> i32 {
    p.x.abs() + p.y.abs()
}

fn root_admin() -> Admin {
    Admin
}

fn main() {
    let ana = deactivate(new_user("Ana", "ana@example.test"));
    println!("{} active: {}", ana.name, ana.active);
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
