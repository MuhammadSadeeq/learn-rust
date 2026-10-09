// ============================================================================
//  SOLUTION sets1 · Unique tags                       Chapter 12 · Collections
// ----------------------------------------------------------------------------
//  Sets answer "have I seen this?" in one step. insert() returns false when
//  the value was already there, which is all has_duplicates needs.
//  Choose by the result you want. BTreeSet gives sorted output for free.
//  HashSet is the quick membership check when order does not matter.
// ============================================================================

use std::collections::{BTreeSet, HashSet};

fn unique_tags(posts: &[Vec<&str>]) -> BTreeSet<String> {
    let mut tags = BTreeSet::new();
    for post in posts {
        for tag in post {
            // A repeated insert is ignored, so each tag is stored once.
            tags.insert(tag.to_string());
        }
    }
    tags
}

fn common_tags(a: &[&str], b: &[&str]) -> Vec<String> {
    // The HashSet of b makes "is this tag in b?" a fast lookup. Collecting into
    // a HashSet also drops repeats from a.
    let in_b: HashSet<&str> = b.iter().copied().collect();
    let shared: HashSet<&str> = a.iter().copied().filter(|tag| in_b.contains(tag)).collect();
    // A HashSet has no order, so sort the owned Strings at the end.
    let mut common: Vec<String> = shared.into_iter().map(String::from).collect();
    common.sort();
    common
}

fn has_duplicates(v: &[i32]) -> bool {
    let mut seen = HashSet::new();
    // insert returns false when the value was already in the set.
    v.iter().any(|&x| !seen.insert(x))
}

fn main() {
    let posts = vec![vec!["rust", "php"], vec!["php", "laravel"], vec!["rust"]];
    println!("all tags: {:?}", unique_tags(&posts));
    println!(
        "common: {:?}",
        common_tags(&["rust", "php", "go"], &["go", "rust"])
    );
    println!(
        "duplicates in [1, 2, 3, 2]? {}",
        has_duplicates(&[1, 2, 3, 2])
    );
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn unique_tags_are_stored_once_and_sorted() {
        let posts = vec![vec!["rust", "php"], vec!["php", "laravel"], vec!["rust"]];
        let tags: Vec<String> = unique_tags(&posts).into_iter().collect();
        assert_eq!(tags, vec!["laravel", "php", "rust"]);
        assert!(unique_tags(&[]).is_empty());
    }

    #[test]
    fn common_tags_are_shared_sorted_and_unique() {
        let a = ["rust", "php", "rust", "go"];
        let b = ["go", "rust", "zig"];
        assert_eq!(common_tags(&a, &b), vec!["go", "rust"]);
        assert!(common_tags(&["php"], &["go"]).is_empty());
    }

    #[test]
    fn has_duplicates_spots_a_repeat() {
        assert!(!has_duplicates(&[]));
        assert!(!has_duplicates(&[1, 2, 3]));
        assert!(has_duplicates(&[1, 2, 3, 2]));
    }
}
