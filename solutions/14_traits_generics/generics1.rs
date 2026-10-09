// ============================================================================
//  SOLUTION generics1 · Generic largest                 Chapter 14 · Traits & Generics
// ----------------------------------------------------------------------------
//  The bounds say what T can do. PartialOrd makes `>` legal. Copy lets us
//  return an element by value from a borrowed slice. Pair only needs
//  PartialOrd, because larger() hands back a reference and copies nothing.
// ============================================================================

// Copy is required because we return an element by value. We can't move an
// element out of a borrowed slice, but a Copy type is duplicated instead.
fn largest<T: PartialOrd + Copy>(list: &[T]) -> T {
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

impl<T: PartialOrd> Pair<T> {
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
