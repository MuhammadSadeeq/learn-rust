// ============================================================================
//  QUEST closures1 · Closures capture          Chapter 13 · Iterators & Closures
// ----------------------------------------------------------------------------
//  Four functions that build or take closures. Each body is todo!().
//
//    make_multiplier  returns a closure that multiplies by k
//    apply_n          calls f on x, n times in a row: f(f(f(x)))
//    counter          returns a closure that gives 1, 2, 3, ... on each call
//    consume          returns a closure that hands back its String, once
//
//  A returned closure outlives the function that made it, so think about what
//  it captures. Don't edit the tests.
//
//  cargo forge          check your work (re-runs every time you save)
//  cargo forge hint     a nudge in the right direction
// ============================================================================

// A todo!() body can't satisfy `impl Fn`, so these stubs return a closure
// whose body is todo!(). The shape is already right. Fill in the body.
fn make_multiplier(k: i32) -> impl Fn(i32) -> i32 {
    move |x| todo!()
}

fn apply_n(f: impl Fn(i32) -> i32, x: i32, n: u32) -> i32 {
    todo!()
}

fn counter() -> impl FnMut() -> u32 {
    || todo!()
}

fn consume(msg: String) -> impl FnOnce() -> String {
    move || todo!()
}

fn main() {
    let double = make_multiplier(2);
    println!("double 21 = {}", double(21));
    println!(
        "1 doubled five times = {}",
        apply_n(make_multiplier(2), 1, 5)
    );
    let mut next_id = counter();
    println!("ids: {}, {}, {}", next_id(), next_id(), next_id());
    let greet = consume(String::from("hello"));
    println!("{}", greet());
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn each_multiplier_remembers_its_own_k() {
        let double = make_multiplier(2);
        let triple = make_multiplier(3);
        assert_eq!(double(5), 10);
        assert_eq!(triple(5), 15);
    }

    #[test]
    fn apply_n_calls_f_n_times() {
        assert_eq!(apply_n(|x| x * 2, 1, 5), 32);
        assert_eq!(apply_n(make_multiplier(3), 1, 3), 27);
        // Zero calls hands back the starting value.
        assert_eq!(apply_n(|x| x + 100, 7, 0), 7);
    }

    #[test]
    fn counters_count_independently() {
        let mut a = counter();
        let mut b = counter();
        assert_eq!(a(), 1);
        assert_eq!(a(), 2);
        assert_eq!(b(), 1);
        assert_eq!(a(), 3);
    }

    #[test]
    fn consume_hands_back_the_string() {
        let greet = consume(String::from("moved in"));
        assert_eq!(greet(), "moved in");
    }
}
