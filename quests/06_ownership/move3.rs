// ============================================================================
//  QUEST move3 · Copy or move?                 Chapter 06 · One Owner
// ----------------------------------------------------------------------------
//  This program doesn't compile. Its Copy values (numbers, bool, tuples of
//  numbers) can be reused after assignment. A String and a Vec can't, because
//  they were moved. The compiler reports E0382 twice.
//
//  Fix both moves by reordering lines or by borrowing with &. Don't use
//  .clone(). Don't edit the tests.
//
//  cargo forge          check your work (re-runs every time you save)
//  cargo forge hint     a nudge in the right direction
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

    // Move types: assignment hands the value over. The old name is no longer valid.
    let name = String::from("Ana");
    let archived = name;
    println!("{}", describe(&name, age));
    println!("{archived}");

    let scores = vec![90, 85, 77];
    let graded = scores;
    let total: i32 = scores.iter().sum();
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
