// ============================================================================
//  SOLUTION borrow2 · Mutable borrow           Chapter 07 · Borrowing
// ----------------------------------------------------------------------------
//  &mut [u32] lets add_tax change each price where it lives. Taking a slice
//  instead of &mut Vec<u32> says that the length is not changed. The
//  multiplication runs in u64 because a 1-billion-cent price times 110 is
//  larger than u32::MAX.
// ============================================================================

fn add_tax(prices: &mut [u32], rate_pct: u32) {
    for price in prices {
        // Integer division rounds the tax down to a whole cent.
        let with_tax = u64::from(*price) * (100 + u64::from(rate_pct)) / 100;
        *price = u32::try_from(with_tax).expect("price with tax fits in u32");
    }
}

fn capitalize_first(s: &mut String) {
    if let Some(first) = s.chars().next() {
        // The first character can take several bytes, so replace exactly the
        // bytes it occupies. The uppercase form may be longer than one char.
        let upper: String = first.to_uppercase().collect();
        s.replace_range(..first.len_utf8(), &upper);
    }
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
