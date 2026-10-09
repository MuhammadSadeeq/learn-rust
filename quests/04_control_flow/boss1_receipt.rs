// ============================================================================
//  QUEST boss1_receipt · Print a receipt             Chapter 04 · Control Flow
// ----------------------------------------------------------------------------
//  Act I boss. Build the receipt for an order, the way the invoice code in a
//  Laravel app would. Each item is a tuple: its name, its quantity and its
//  unit price in cents.
//
//    line_total    quantity times unit price
//    subtotal      the sum of the line totals
//    tax           a rate in basis points, rounded half up (825 is 8.25%)
//    format_money  123456 becomes "$1,234.56" (written for you)
//    render        aligned rows for every item, then Subtotal, Tax and Total
//
//  Use what Act I taught: functions, if, for, tuples, arrays and the String
//  and Vec basics from the toolbox. Every body except format_money is
//  todo!() for now, so the tests fail until you write them. Don't edit the
//  tests.
//
//  cargo forge          check your work (re-runs every time you save)
//  cargo forge hint     a nudge in the right direction
// ============================================================================

fn line_total(qty: u32, unit_cents: u32) -> u32 {
    todo!()
}

fn subtotal(items: &[(&str, u32, u32)]) -> u32 {
    todo!()
}

fn tax(subtotal: u32, rate_bp: u32) -> u32 {
    todo!()
}

fn format_money(cents: u32) -> String {
    // Given. It uses char_indices and String building, which Chapter 8 explains.
    let dollars = (cents / 100).to_string();
    let digits = dollars.len();
    let mut grouped = String::new();
    for (i, ch) in dollars.char_indices() {
        // Count from the right: a comma goes before every third digit,
        // except at the very start.
        if i > 0 && (digits - i) % 3 == 0 {
            grouped.push(',');
        }
        grouped.push(ch);
    }
    let rest = cents % 100;
    format!("${grouped}.{rest:02}")
}

fn render(items: &[(&str, u32, u32)], rate_bp: u32) -> String {
    todo!()
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
