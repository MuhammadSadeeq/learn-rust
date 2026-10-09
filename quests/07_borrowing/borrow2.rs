// ============================================================================
//  QUEST borrow2 · Mutable borrow              Chapter 07 · Borrowing
// ----------------------------------------------------------------------------
//  A &mut borrow lets a function change the caller's value in place, without
//  returning a copy. Write both functions.
//
//  add_tax raises every price by rate_pct percent. Prices are whole cents, so
//  the tax is integer math, rounded down. The tests include a very large
//  price, so think about overflow.
//
//  capitalize_first uppercases the first character of a String and leaves
//  the rest alone. An empty String stays empty.
//
//  Don't edit the tests.
//
//  cargo forge          check your work (re-runs every time you save)
//  cargo forge hint     a nudge in the right direction
// ============================================================================

fn add_tax(prices: &mut [u32], rate_pct: u32) {
    todo!()
}

fn capitalize_first(s: &mut String) {
    todo!()
}

fn main() {
    let mut prices = vec![1000, 250, 4999];
    add_tax(&mut prices, 20);
    println!("{prices:?}");

    let mut name = String::from("ferris");
    capitalize_first(&mut name);
    println!("{name}");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn adds_tax_to_each_price() {
        let mut prices = vec![1000, 250];
        add_tax(&mut prices, 20);
        assert_eq!(prices, vec![1200, 300]);

        let mut none: Vec<u32> = Vec::new();
        add_tax(&mut none, 20);
        assert!(none.is_empty());
    }

    #[test]
    fn tax_rounds_down_and_large_prices_fit() {
        let mut prices = vec![999];
        add_tax(&mut prices, 10);
        assert_eq!(prices, vec![1098]);

        let mut big = vec![1_000_000_000];
        add_tax(&mut big, 10);
        assert_eq!(big, vec![1_100_000_000]);
    }

    #[test]
    fn capitalizes_the_first_letter_only() {
        let mut word = String::from("rust is fun");
        capitalize_first(&mut word);
        assert_eq!(word, "Rust is fun");

        let mut empty = String::new();
        capitalize_first(&mut empty);
        assert_eq!(empty, "");

        let mut accented = String::from("élan");
        capitalize_first(&mut accented);
        assert_eq!(accented, "Élan");
    }
}
