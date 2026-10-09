// ============================================================================
//  SOLUTION boss1_receipt · Print a receipt         Chapter 04 · Control Flow
// ----------------------------------------------------------------------------
//  Each function is one step of the invoice, and the later steps build on the
//  earlier ones.
//
//  `tax` widens its inputs to u64 before multiplying. A large order at a high
//  rate can push subtotal * rate past u32::MAX, and the wider math cannot
//  overflow. Adding half of the divisor before dividing rounds half up, so an
//  exact .5 goes up.
//
//  `for (name, qty, unit_cents) in items` works on a borrowed slice. Each
//  field is a reference, so the numbers are read with `*`.
//
//  `render` pads each piece to its column width. Item rows use widths 16, 3
//  and 10. The summary labels use 19 (16 plus 3), so their prices end in the
//  same column. Each row ends with a newline.
// ============================================================================

fn line_total(qty: u32, unit_cents: u32) -> u32 {
    qty * unit_cents
}

fn subtotal(items: &[(&str, u32, u32)]) -> u32 {
    let mut sum = 0;
    for (_, qty, unit_cents) in items {
        sum += line_total(*qty, *unit_cents);
    }
    sum
}

fn tax(subtotal: u32, rate_bp: u32) -> u32 {
    // Widen first: a big order at a high rate can overflow a u32 product.
    let product = u64::from(subtotal) * u64::from(rate_bp);
    // Adding half of the divisor before dividing rounds half up.
    ((product + 5000) / 10000) as u32
}

fn format_money(cents: u32) -> String {
    let dollars = (cents / 100).to_string();
    let digits = dollars.len();
    let mut grouped = String::new();
    for (i, ch) in dollars.char_indices() {
        // Count from the right: a comma goes before every third digit,
        // except at the very start. is_multiple_of(3) means the remainder is zero.
        if i > 0 && (digits - i).is_multiple_of(3) {
            grouped.push(',');
        }
        grouped.push(ch);
    }
    let rest = cents % 100;
    format!("${grouped}.{rest:02}")
}

fn render(items: &[(&str, u32, u32)], rate_bp: u32) -> String {
    let mut text = String::new();
    for (name, qty, unit_cents) in items {
        let price = format_money(line_total(*qty, *unit_cents));
        text.push_str(&format!("{name:<16}{qty:>3}{price:>10}\n"));
    }

    let sub = subtotal(items);
    let tax_cents = tax(sub, rate_bp);
    let total = sub + tax_cents;
    text.push_str(&format!("{:<19}{:>10}\n", "Subtotal", format_money(sub)));
    text.push_str(&format!("{:<19}{:>10}\n", "Tax", format_money(tax_cents)));
    text.push_str(&format!("{:<19}{:>10}\n", "Total", format_money(total)));
    text
}

fn main() {
    let order = [
        ("Espresso", 2, 325),
        ("Croissant", 3, 410),
        ("Orange juice", 1, 480),
    ];
    println!("{}", render(&order, 825));
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn line_total_multiplies() {
        assert_eq!(line_total(3, 250), 750);
        assert_eq!(line_total(0, 999), 0);
    }

    #[test]
    fn subtotal_adds_every_line() {
        assert_eq!(subtotal(&[("Tea", 2, 300), ("Cake", 1, 450)]), 1050);
        assert_eq!(subtotal(&[]), 0);
    }

    #[test]
    fn tax_rounds_half_up() {
        assert_eq!(tax(1000, 1000), 100);
        assert_eq!(tax(5, 5000), 3);
        assert_eq!(tax(1950, 825), 161);
    }

    #[test]
    fn money_has_separators() {
        assert_eq!(format_money(0), "$0.00");
        assert_eq!(format_money(5), "$0.05");
        assert_eq!(format_money(1250), "$12.50");
        assert_eq!(format_money(123456), "$1,234.56");
        assert_eq!(format_money(100_000_000), "$1,000,000.00");
    }

    #[test]
    fn renders_a_two_item_receipt() {
        let items = [("Coffee", 2, 350), ("Bagel", 1, 1250)];
        let expected = concat!(
            "Coffee            2     $7.00\n",
            "Bagel             1    $12.50\n",
            "Subtotal               $19.50\n",
            "Tax                     $1.61\n",
            "Total                  $21.11\n",
        );
        assert_eq!(render(&items, 825), expected);
    }

    #[test]
    fn renders_an_empty_receipt() {
        let expected = concat!(
            "Subtotal                $0.00\n",
            "Tax                     $0.00\n",
            "Total                   $0.00\n",
        );
        assert_eq!(render(&[], 825), expected);
    }
}
