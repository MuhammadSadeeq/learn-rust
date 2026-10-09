// ============================================================================
//  SOLUTION move3 · Copy or move?              Chapter 06 · One Owner
// ----------------------------------------------------------------------------
//  Copy types were never a problem. For the String, describe only borrows it,
//  so the call goes before the move. For the Vec, iter() only borrows it, so
//  the sum goes before the move. Reordering costs nothing.
// ============================================================================

fn describe(name: &str, age: u32) -> String {
    format!("{name} is {age} years old")
}

fn main() {
    // Copy types: assignment makes a copy, so both names stay usable.
    let age: u32 = 30;
    let next_age = age;
    println!("{age} and {next_age}");

    let active = true;
    let was_active = active;
    println!("{active} and {was_active}");

    let point = (3, 4.5);
    let saved_point = point;
    println!("{point:?} and {saved_point:?}");

    // Move types. Borrow the name for describe first, then hand it over.
    let name = String::from("Ana");
    println!("{}", describe(&name, age));
    let archived = name;
    println!("{archived}");

    // Read the Vec first (iter only borrows it), then move it.
    let scores = vec![90, 85, 77];
    let total: i32 = scores.iter().sum();
    let graded = scores;
    println!("total {total} from {} scores", graded.len());
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn describes_a_person() {
        assert_eq!(describe("Ana", 30), "Ana is 30 years old");
    }

    #[test]
    fn borrowing_keeps_the_name() {
        let name = String::from("Bo");
        let first = describe(&name, 1);
        let second = describe(&name, 2);
        assert_eq!(first, "Bo is 1 years old");
        assert_eq!(second, "Bo is 2 years old");
        assert_eq!(name, "Bo");
    }

    #[test]
    fn zero_age_and_empty_name() {
        assert_eq!(describe("", 0), " is 0 years old");
    }
}
