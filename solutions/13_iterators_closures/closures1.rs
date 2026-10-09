// ============================================================================
//  SOLUTION closures1 · Closures capture     Chapter 13 · Iterators & Closures
// ----------------------------------------------------------------------------
//  A closure that outlives the function that made it must own what it uses, so
//  each one here uses `move`. The return type says what a closure may do. Fn
//  can be called any number of times. FnMut can change its captured state.
//  FnOnce gives away something it owns, so it can run only once.
// ============================================================================

fn make_multiplier(k: i32) -> impl Fn(i32) -> i32 {
    // The closure outlives this call, so it must own k. `move` copies k in.
    // Without it, the closure would borrow k, and k is gone when this returns.
    move |x| x * k
}

fn apply_n(f: impl Fn(i32) -> i32, x: i32, n: u32) -> i32 {
    // Each call feeds the previous result back in. f is only called, never
    // consumed, so Fn is enough.
    let mut value = x;
    for _ in 0..n {
        value = f(value);
    }
    value
}

fn counter() -> impl FnMut() -> u32 {
    // count lives inside the closure. Each call changes it, so the closure is
    // FnMut. `move` gives the closure its own count.
    let mut count = 0;
    move || {
        count += 1;
        count
    }
}

fn consume(msg: String) -> impl FnOnce() -> String {
    // The closure owns msg and gives it away when called. It can therefore run
    // only once: FnOnce.
    move || msg
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
