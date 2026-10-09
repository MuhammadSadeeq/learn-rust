// ============================================================================
//  QUEST types2 · Tuples                         Chapter 03 · Types Are Shapes
// ----------------------------------------------------------------------------
//  A tuple groups values of different types, and a function can return one to
//  hand back several results at once. The type says what sits in each
//  position: (i32, i32) is two i32 values, in that order.
//
//  `min_max` returns (lowest, highest) for a slice with at least one value.
//  `swap` takes a pair and returns it reversed. Your part is the starting
//  values in `min_max` and the tuple work in `swap`. Don't edit the tests.
//
//  cargo forge          check your work (re-runs every time you save)
//  cargo forge hint     a nudge in the right direction
// ============================================================================

fn min_max(v: &[i32]) -> (i32, i32) {
    // Your part: start both from the first value, v[0].
    let mut low = todo!();
    let mut high = todo!();

    // `&x` copies each number out of the slice; Chapter 7 explains the &.
    // Chapter 4 explains `for` and `if`.
    for &x in v {
        if x < low {
            low = x;
        }
        if x > high {
            high = x;
        }
    }
    (low, high)
}

fn swap(p: (i32, char)) -> (char, i32) {
    todo!()
}

fn main() {
    let readings = [3, 9, -2, 7];
    let (low, high) = min_max(&readings);
    println!("low {low}, high {high}");

    let (letter, number) = swap((7, 'k'));
    println!("{letter}{number}");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn finds_lowest_and_highest() {
        assert_eq!(min_max(&[3, 9, -2, 7]), (-2, 9));
    }

    #[test]
    fn one_value_is_both() {
        assert_eq!(min_max(&[4]), (4, 4));
    }

    #[test]
    fn swap_reverses_the_pair() {
        assert_eq!(swap((1, 'a')), ('a', 1));
    }

    #[test]
    fn swap_keeps_each_value() {
        let (letter, number) = swap((-8, 'z'));
        assert_eq!(letter, 'z');
        assert_eq!(number, -8);
    }
}
