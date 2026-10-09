// ============================================================================
//  SOLUTION lifetimes1 · Longest                    Chapter 15 · Lifetimes
// ----------------------------------------------------------------------------
//  One lifetime 'a on both inputs and the output says the result is valid only
//  while both inputs are. pick_first names a lifetime on x alone, so its
//  result is tied to x and not to y.
// ============================================================================

// The output may be either input, so it must live no longer than both.
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
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
