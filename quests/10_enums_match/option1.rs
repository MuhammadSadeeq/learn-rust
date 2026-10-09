// ============================================================================
//  QUEST option1 · Option instead of null  Chapter 10 · Enums & Pattern Matching
// ----------------------------------------------------------------------------
//  Option<T> is Some(value) or None. Use it when a value may be missing.
//  Write three functions:
//    find_user(users, id)  the name for an id, or None when no user has it
//    safe_divide(a, b)     a / b, or None when it cannot be done: b == 0,
//                          or i32::MIN / -1, which overflows.
//    first_even(v)         the first even number in v, or None
//
//  Return None where a panic would otherwise happen. Don't edit the tests.
//
//  Both bodies are todo!() for now.
//
//  cargo forge          check your work (re-runs every time you save)
//  cargo forge hint     a nudge in the right direction
// ============================================================================

fn find_user(users: &[(u32, String)], id: u32) -> Option<&str> {
    todo!()
}

fn safe_divide(a: i32, b: i32) -> Option<i32> {
    todo!()
}

fn first_even(v: &[i32]) -> Option<i32> {
    todo!()
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
    fn find_user_returns_the_name_for_an_id() {
        let users = sample();
        assert_eq!(find_user(&users, 2), Some("Bo"));
        assert_eq!(find_user(&users, 1), Some("Ana"));
    }

    #[test]
    fn find_user_returns_none_when_missing() {
        let users = sample();
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
