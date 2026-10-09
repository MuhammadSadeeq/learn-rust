// ============================================================================
//  QUEST iter3 · Your own iterator           Chapter 13 · Iterators & Closures
// ----------------------------------------------------------------------------
//  The Fibonacci sequence as an iterator: 0, 1, 1, 2, 3, 5, 8, 13, ...
//  A PHP generator does the same job. A function with yield hands out one
//  value at a time, and it computes nothing until the caller asks for the next.
//
//  Fill in two bodies:
//    fib()    the starting state: the pair (a, b) = (0, 1)
//    next()   return the current term, then move the pair forward
//
//  The sequence never ends, so bound it with take or take_while.
//  Don't edit the tests.
//
//  cargo forge          check your work (re-runs every time you save)
//  cargo forge hint     a nudge in the right direction
// ============================================================================

struct Fibonacci {
    a: u64,
    b: u64,
}

fn fib() -> Fibonacci {
    todo!()
}

impl Iterator for Fibonacci {
    type Item = u64;

    fn next(&mut self) -> Option<u64> {
        todo!()
    }
}

fn main() {
    let first_ten: Vec<u64> = fib().take(10).collect();
    println!("{first_ten:?}");
    let even_sum: u64 = fib().take_while(|&n| n < 100).filter(|n| n % 2 == 0).sum();
    println!("even terms below 100 add up to {even_sum}");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn first_ten_terms() {
        let terms: Vec<u64> = fib().take(10).collect();
        assert_eq!(terms, vec![0, 1, 1, 2, 3, 5, 8, 13, 21, 34]);
    }

    #[test]
    fn even_terms_below_100_add_up_to_44() {
        // The even terms below 100 are 0, 2, 8 and 34.
        let total: u64 = fib().take_while(|&n| n < 100).filter(|n| n % 2 == 0).sum();
        assert_eq!(total, 44);
    }

    #[test]
    fn stays_correct_far_into_the_sequence() {
        assert_eq!(fib().nth(50), Some(12_586_269_025));
    }

    #[test]
    fn each_iterator_keeps_its_own_place() {
        let mut first = fib();
        assert_eq!(first.next(), Some(0));
        assert_eq!(first.next(), Some(1));
        let mut second = fib();
        assert_eq!(second.next(), Some(0));
        assert_eq!(first.next(), Some(1));
    }
}
