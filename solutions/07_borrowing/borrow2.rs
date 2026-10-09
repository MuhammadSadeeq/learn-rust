// ============================================================================
//  SOLUTION borrow2 · Mutable borrow           Chapter 07 · Borrowing
// ----------------------------------------------------------------------------
//  &mut [u32] lets add_tax change each price where it lives. Taking a slice
//  instead of &mut Vec<u32> says that the length is not changed. The
//  multiplication runs in u64 because a 1-billion-cent price times 110 is
//  larger than u32::MAX.
//
//  wrap_in_stars changes the String through the &mut borrow. insert and push
//  add characters at the front and the back, and the caller sees both.
// ============================================================================

fn add_tax(prices: &mut [u32], rate_pct: u32) {
    for price in prices {
        // Integer division rounds the tax down to a whole cent.
        let with_tax = u64::from(*price) * (100 + u64::from(rate_pct)) / 100;
        *price = with_tax as u32;
    }
}

fn wrap_in_stars(s: &mut String) {
    s.insert(0, '*');
    s.push('*');
}

fn main() {
    let mut prices = vec![1000, 250, 4999];
    add_tax(&mut prices, 20);
    println!("{prices:?}");

    let mut word = String::from("rust");
    wrap_in_stars(&mut word);
    println!("{word}");
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
    fn wraps_the_text_in_stars() {
        let mut word = String::from("rust");
        wrap_in_stars(&mut word);
        assert_eq!(word, "*rust*");

        let mut empty = String::new();
        wrap_in_stars(&mut empty);
        assert_eq!(empty, "**");
    }
}
