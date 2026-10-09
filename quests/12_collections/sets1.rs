// ============================================================================
//  QUEST sets1 · Unique tags                         Chapter 12 · Collections
// ----------------------------------------------------------------------------
//  A set stores each value once. HashSet is fast and has no order. BTreeSet
//  keeps its values sorted. Each function body is todo!().
//
//    unique_tags      every tag across all posts, once each, sorted
//    common_tags      the tags that appear in both a and b, sorted, no repeats
//    has_duplicates   true if any number appears more than once
//
//  Don't edit the tests.
//
//  cargo forge          check your work (re-runs every time you save)
//  cargo forge hint     a nudge in the right direction
// ============================================================================

use std::collections::{BTreeSet, HashSet};

fn unique_tags(posts: &[Vec<&str>]) -> BTreeSet<String> {
    todo!()
}

fn common_tags(a: &[&str], b: &[&str]) -> Vec<String> {
    todo!()
}

fn has_duplicates(v: &[i32]) -> bool {
    todo!()
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
