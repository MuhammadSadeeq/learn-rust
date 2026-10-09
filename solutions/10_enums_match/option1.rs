// ============================================================================
//  SOLUTION option1 · Option instead of null  Chapter 10 · Enums & Pattern Matching
// ----------------------------------------------------------------------------
//  A missing answer is None, not a panic. The caller has to open the Option
//  before using the value, so a missing user cannot slip through unnoticed.
// ============================================================================

fn find_user(users: &[(u32, String)], id: u32) -> Option<&str> {
    // The first match returns early. The name is borrowed from `users`, not copied.
    for (user_id, name) in users {
        if *user_id == id {
            return Some(name.as_str());
        }
    }
    None
}

fn safe_divide(a: i32, b: i32) -> Option<i32> {
    // checked_div returns None for a zero divisor and for i32::MIN / -1,
    // which would overflow. Neither case panics.
    a.checked_div(b)
}

fn first_even(v: &[i32]) -> Option<i32> {
    // Each x is a reference, so `x % 2` works and `*x` is the number itself.
    // The loop returns at the first even value and never looks further.
    for x in v {
        if x % 2 == 0 {
            return Some(*x);
        }
    }
    None
}

fn main() {
    let users = vec![(1, String::from("Ana")), (2, String::from("Bo"))];
    match find_user(&users, 2) {
        Some(name) => println!("found {name}"),
        None => println!("no such user"),
    }
    println!("{:?}", safe_divide(7, 2));
    println!("{:?}", first_even(&[1, 3, 4]));
}

#[cfg(test)]
mod tests {
    use super::*;

    fn sample() -> Vec<(u32, String)> {
        vec![(1, String::from("Ana")), (2, String::from("Bo"))]
    }

    #[test]
    fn find_user_returns_the_name_or_none() {
        let users = sample();
        assert_eq!(find_user(&users, 2), Some("Bo"));
        assert_eq!(find_user(&users, 9), None);
        assert_eq!(find_user(&[], 1), None); // edge case: no users at all
    }

    #[test]
    fn safe_divide_divides_when_it_can() {
        assert_eq!(safe_divide(7, 2), Some(3));
        // Integer division rounds toward zero.
        assert_eq!(safe_divide(-7, 2), Some(-3));
    }

    #[test]
    fn safe_divide_returns_none_instead_of_panicking() {
        assert_eq!(safe_divide(1, 0), None);
        // i32::MIN / -1 is the one other case that overflows.
        assert_eq!(safe_divide(i32::MIN, -1), None);
    }

    #[test]
    fn first_even_finds_the_first_match() {
        assert_eq!(first_even(&[1, 3, 4, 6]), Some(4));
        assert_eq!(first_even(&[3, -4]), Some(-4));
        assert_eq!(first_even(&[1, 3]), None);
        assert_eq!(first_even(&[]), None);
    }
}
