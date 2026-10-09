// ============================================================================
//  SOLUTION hashmap2 · Group by                       Chapter 12 · Collections
// ----------------------------------------------------------------------------
//  entry(role).or_default() returns the Vec for that role, creating an empty
//  one when the role is new. group_by_role owns the users, so each name and
//  role moves out of its User. Nothing is cloned.
//  count_by_role borrows the users. A map needs owned keys, so it clones each
//  role string. The users themselves are never copied.
// ============================================================================

use std::collections::{BTreeMap, HashMap};

struct User {
    name: String,
    role: String,
}

// Laravel: $users->groupBy('role')->map(fn ($g) => $g->pluck('name'))
fn group_by_role(users: Vec<User>) -> HashMap<String, Vec<String>> {
    let mut groups: HashMap<String, Vec<String>> = HashMap::new();
    for user in users {
        // We own `user`, so both fields can be moved out of it.
        groups.entry(user.role).or_default().push(user.name);
    }
    groups
}

// Laravel: $users->countBy('role')
fn count_by_role(users: &[User]) -> BTreeMap<String, usize> {
    let mut counts = BTreeMap::new();
    for user in users {
        // entry() needs an owned key, so the role is cloned here. A BTreeMap
        // keeps its keys sorted, which gives a stable order for printing.
        *counts.entry(user.role.clone()).or_insert(0) += 1;
    }
    counts
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
