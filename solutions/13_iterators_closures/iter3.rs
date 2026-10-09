// ============================================================================
//  SOLUTION iter3 · Your own iterator          Chapter 13 · Iterators & Closures
// ----------------------------------------------------------------------------
//  The struct holds the last two terms. Each call to next() yields the current
//  term and moves the pair one step: (a, b) becomes (b, a + b). An Iterator is
//  a type with one required method, next(). Everything else (take, filter, sum)
//  comes from the trait for free.
// ============================================================================

struct Fibonacci {
    a: u64,
    b: u64,
}

fn fib() -> Fibonacci {
    // The first two terms. Everything after them comes from next().
    Fibonacci { a: 0, b: 1 }
}

impl Iterator for Fibonacci {
    type Item = u64;

    fn next(&mut self) -> Option<u64> {
        // The sequence never ends, so this never returns None. Bound it with
        // take or take_while. The 93rd call overflows u64 while it works out the
        // next pair. Debug builds panic there, and release builds wrap silently.
        // A bounded take never gets that far.
        let current = self.a;
        let next = self.a + self.b;
        self.a = self.b;
        self.b = next;
        Some(current)
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
