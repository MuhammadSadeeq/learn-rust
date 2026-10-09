// ============================================================================
//  QUEST hashmap2 · Group by                          Chapter 12 · Collections
// ----------------------------------------------------------------------------
//  Laravel: $users->groupBy('role') and $users->countBy('role'). Rust has no
//  one-call version of these, so you build the groups yourself.
//
//    group_by_role  takes the users by value and returns role -> names. Names
//                   keep their input order. They are not sorted.
//    count_by_role  borrows the users and returns role -> how many. Return a
//                   BTreeMap, so the roles come out in sorted order.
//
//  Don't edit the tests.
//
//  cargo forge          check your work (re-runs every time you save)
//  cargo forge hint     a nudge in the right direction
// ============================================================================

use std::collections::{BTreeMap, HashMap};

struct User {
    name: String,
    role: String,
}

fn group_by_role(users: Vec<User>) -> HashMap<String, Vec<String>> {
    todo!()
}

fn count_by_role(users: &[User]) -> BTreeMap<String, usize> {
    todo!()
}

fn main() {
    let team = vec![
        User {
            name: "Cy".into(),
            role: "admin".into(),
        },
        User {
            name: "Bo".into(),
            role: "editor".into(),
        },
        User {
            name: "Ana".into(),
            role: "admin".into(),
        },
        User {
            name: "Dee".into(),
            role: "viewer".into(),
        },
    ];
    println!("{:?}", count_by_role(&team));
    let groups = group_by_role(team);
    println!("admins: {:?}", groups["admin"]);
}

#[cfg(test)]
mod tests {
    use super::*;

    fn user(name: &str, role: &str) -> User {
        User {
            name: name.to_string(),
            role: role.to_string(),
        }
    }

    fn team() -> Vec<User> {
        vec![
            user("Cy", "admin"),
            user("Bo", "editor"),
            user("Ana", "admin"),
            user("Dee", "viewer"),
        ]
    }

    #[test]
    fn groups_names_in_input_order() {
        let groups = group_by_role(team());
        let expected = HashMap::from([
            (
                "admin".to_string(),
                vec!["Cy".to_string(), "Ana".to_string()],
            ),
            ("editor".to_string(), vec!["Bo".to_string()]),
            ("viewer".to_string(), vec!["Dee".to_string()]),
        ]);
        assert_eq!(groups, expected);
    }

    #[test]
    fn counts_each_role() {
        let counts = count_by_role(&team());
        let expected = BTreeMap::from([
            ("admin".to_string(), 2),
            ("editor".to_string(), 1),
            ("viewer".to_string(), 1),
        ]);
        assert_eq!(counts, expected);
    }

    #[test]
    fn counting_borrows_so_the_users_survive() {
        let users = team();
        let counts = count_by_role(&users);
        assert_eq!(counts.get("admin"), Some(&2));
        assert_eq!(users.len(), 4);
    }

    #[test]
    fn no_users_means_no_groups() {
        assert!(group_by_role(Vec::new()).is_empty());
        assert!(count_by_role(&[]).is_empty());
    }
}
