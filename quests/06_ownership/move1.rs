// ============================================================================
//  QUEST move1 · Use after move                     Chapter 06 · One Owner
// ----------------------------------------------------------------------------
//  `report` builds a short report about a list of names, but the compiler
//  rejects it with E0382 "borrow of moved value".
//
//  Your job: make it compile and make the tests pass WITHOUT calling
//  `.clone()` anywhere. Reordering lines is allowed. Changing the tests is not.
//
//  cargo forge          check your work (re-runs every time you save)
//  cargo forge hint     a nudge in the right direction
// ============================================================================

fn report(names: Vec<String>) -> String {
    let all = names;
    let count = names.len();
    format!("{count} names: {}", all.join(", "))
}

fn main() {
    let names = vec![String::from("Ana"), String::from("Bo"), String::from("Cy")];
    println!("{}", report(names));
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn counts_and_joins() {
        let names = vec![String::from("Ana"), String::from("Bo")];
        assert_eq!(report(names), "2 names: Ana, Bo");
    }

    #[test]
    fn empty_list() {
        assert_eq!(report(Vec::new()), "0 names: ");
    }
}
