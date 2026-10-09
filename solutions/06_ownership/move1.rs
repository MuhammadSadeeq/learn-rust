// ============================================================================
//  SOLUTION move1 · Use after move                  Chapter 06 · One Owner
// ----------------------------------------------------------------------------
//  Read `names.len()` while `names` still owns the vector, then move it.
//  (Or skip the extra binding entirely and use `names` for both.)
// ============================================================================

fn report(names: Vec<String>) -> String {
    let count = names.len();
    let all = names;
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
