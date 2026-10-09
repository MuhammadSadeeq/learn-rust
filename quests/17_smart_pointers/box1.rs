// ============================================================================
//  QUEST box1 · Recursive types                Chapter 17 · Smart Pointers
// ----------------------------------------------------------------------------
//  `List` contains itself directly, so its size would be infinite. rustc
//  rejects it with E0072. A Box stores its value on the heap behind a pointer,
//  and a pointer has a fixed size. Fix the type, then implement `sum` and
//  `from_slice`.
//
//  Don't edit the tests.
//
//  cargo forge          check your work (re-runs every time you save)
//  cargo forge hint     a nudge in the right direction
// ============================================================================

#[derive(Debug, PartialEq)]
enum List {
    Cons(i32, List),
    Nil,
}

impl List {
    fn sum(&self) -> i32 {
        todo!()
    }

    fn from_slice(values: &[i32]) -> List {
        todo!()
    }
}

fn main() {
    let list = List::from_slice(&[1, 2, 3]);
    println!("{list:?} sums to {}", list.sum());
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn sums_every_value() {
        let list = List::from_slice(&[1, 2, 3, 4]);
        assert_eq!(list.sum(), 10);
    }

    #[test]
    fn keeps_the_order() {
        let expected = List::Cons(1, Box::new(List::Cons(2, Box::new(List::Nil))));
        assert_eq!(List::from_slice(&[1, 2]), expected);
    }

    #[test]
    fn empty_slice_is_nil() {
        assert_eq!(List::from_slice(&[]), List::Nil);
        assert_eq!(List::Nil.sum(), 0);
    }
}
