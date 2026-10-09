// ============================================================================
//  SOLUTION box1 · Recursive types             Chapter 17 · Smart Pointers
// ----------------------------------------------------------------------------
//  A Box is a pointer to a value on the heap, and a pointer has a fixed size.
//  Putting the tail behind a Box breaks the cycle that made List infinite.
//  `sum` walks the list recursively. `from_slice` folds from the back, so each
//  value is placed in front of the list built so far.
// ============================================================================

#[derive(Debug, PartialEq)]
enum List {
    // The tail is a Box, so Cons has a known size: an i32 plus one pointer.
    Cons(i32, Box<List>),
    Nil,
}

impl List {
    fn sum(&self) -> i32 {
        match self {
            List::Cons(value, rest) => value + rest.sum(),
            List::Nil => 0,
        }
    }

    fn from_slice(values: &[i32]) -> List {
        // Start from the end, so each new Cons becomes the head of the list.
        values
            .iter()
            .rev()
            .fold(List::Nil, |tail, &value| List::Cons(value, Box::new(tail)))
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
