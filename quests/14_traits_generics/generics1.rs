// ============================================================================
//  QUEST generics1 · Generic largest                    Chapter 14 · Traits & Generics
// ----------------------------------------------------------------------------
//  `largest` should work for any element type, but the generic body does not
//  compile yet. The compiler can't compare a bare T (E0369), and it can't
//  copy an element out of the slice either. Add the trait bounds it asks for.
//  Don't edit the bodies or the tests.
//
//  cargo forge          check your work (re-runs every time you save)
//  cargo forge hint     a nudge in the right direction
// ============================================================================

fn largest<T>(list: &[T]) -> T {
    let mut largest = list[0];
    for &item in list {
        if item > largest {
            largest = item;
        }
    }
    largest
}

struct Pair<T> {
    a: T,
    b: T,
}

impl<T> Pair<T> {
    fn larger(&self) -> &T {
        if self.a > self.b {
            &self.a
        } else {
            &self.b
        }
    }
}

fn main() {
    println!("{}", largest(&[34, 50, 25, 100, 65]));
    println!("{}", largest(&[1.5, -2.0, 0.25]));
    println!("{}", largest(&['y', 'm', 'a']));
    let pair = Pair { a: 3, b: 9 };
    println!("{}", pair.larger());
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn largest_of_integers() {
        assert_eq!(largest(&[34, 50, 25, 100, 65]), 100);
        assert_eq!(largest(&[7]), 7, "one element is its own largest");
    }

    #[test]
    fn largest_of_floats() {
        assert_eq!(largest(&[1.5, -2.0, 0.25]), 1.5);
    }

    #[test]
    fn largest_of_chars() {
        assert_eq!(largest(&['y', 'm', 'a']), 'y');
    }

    #[test]
    fn pair_returns_the_larger_field() {
        let high_a = Pair { a: 9, b: 3 };
        let high_b = Pair { a: 3, b: 9 };
        assert_eq!(high_a.larger(), &9);
        assert_eq!(high_b.larger(), &9);
    }
}
