// ============================================================================
//  SOLUTION types2 · Tuples                      Chapter 03 · Types Are Shapes
// ----------------------------------------------------------------------------
//  Start `low` and `high` from the first value, then compare every value
//  against them. `v[0]` indexes a slice the same way it indexes an array. The
//  slice must not be empty, because `v[0]` panics otherwise.
//
//  `swap` destructures its parameter with `let (number, letter) = p;`, then
//  builds the reversed tuple as its last expression. There is no `return`,
//  because the last expression is the value.
// ============================================================================

fn min_max(v: &[i32]) -> (i32, i32) {
    let mut low = v[0];
    let mut high = v[0];
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
    let (number, letter) = p;
    (letter, number)
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
