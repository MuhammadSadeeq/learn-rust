// ============================================================================
//  QUEST lifetimes1 · Longest                       Chapter 15 · Lifetimes
// ----------------------------------------------------------------------------
//  `longest` returns one of its two inputs. rustc can't tell which input the
//  result borrows from, so it refuses to compile (E0106). Name a lifetime so
//  the signature says the result lives no longer than both inputs.
//
//  `pick_first` is already correct. It shows that a lifetime can tie the
//  output to one input only. Don't edit the tests.
//
//  cargo forge          check your work (re-runs every time you save)
//  cargo forge hint     a nudge in the right direction
// ============================================================================

fn longest(x: &str, y: &str) -> &str {
    if x.len() >= y.len() { x } else { y }
}

// Returns x. The output borrows only from x, so y can be dropped early.
fn pick_first<'a>(x: &'a str, _y: &str) -> &'a str {
    x
}

fn main() {
    let a = String::from("a long string is long");
    let b = "xyz";
    println!("The longest is {}", longest(&a, b));
    println!("The first is {}", pick_first(&a, b));
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn returns_the_longer_input() {
        assert_eq!(longest("hello", "hi"), "hello");
        assert_eq!(longest("hi", "hello"), "hello");
    }

    #[test]
    fn a_tie_returns_the_first_input() {
        assert_eq!(longest("abc", "xyz"), "abc");
    }

    #[test]
    fn pick_first_only_borrows_x() {
        let kept;
        {
            let temporary = String::from("temporary");
            kept = pick_first("kept", &temporary);
        }
        assert_eq!(kept, "kept");
    }
}
