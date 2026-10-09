// ============================================================================
//  SOLUTION iter1 · Collection pipeline      Chapter 13 · Iterators & Closures
// ----------------------------------------------------------------------------
//  A chain is lazy: nothing runs until sum() or collect() pulls the items.
//  paid_total keeps the paid orders and adds up their totals.
//  customers collects into a BTreeSet, which drops repeats and sorts in one
//  step. PHP needs unique(), sort() and values() for the same result.
// ============================================================================

use std::collections::BTreeSet;

struct Order {
    customer: String,
    total_cents: u32,
    paid: bool,
}

fn make_order(customer: &str, total_cents: u32, paid: bool) -> Order {
    Order {
        customer: customer.to_string(),
        total_cents,
        paid,
    }
}

fn paid_total(orders: &[Order]) -> u32 {
    orders
        .iter()
        .filter(|order| order.paid)
        .map(|order| order.total_cents)
        .sum()
}

fn customers(orders: &[Order]) -> Vec<String> {
    orders
        .iter()
        .map(|order| order.customer.as_str())
        // The set removes repeats and keeps the names sorted.
        .collect::<BTreeSet<_>>()
        .into_iter()
        // The set borrows from orders, so make owned Strings for the caller.
        .map(String::from)
        .collect()
}

fn main() {
    let orders = vec![
        make_order("Cy", 4200, true),
        make_order("Ana", 1500, true),
        make_order("Bo", 900, false),
        make_order("Ana", 250, true),
    ];
    println!("paid: {} cents", paid_total(&orders));
    println!("customers: {:?}", customers(&orders));
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn paid_total_adds_only_paid_orders() {
        let orders = vec![
            make_order("Ana", 1500, true),
            make_order("Bo", 900, false),
            make_order("Ana", 250, true),
        ];
        assert_eq!(paid_total(&orders), 1750);
    }

    #[test]
    fn nothing_paid_means_zero() {
        assert_eq!(paid_total(&[]), 0);
        assert_eq!(paid_total(&[make_order("Cy", 700, false)]), 0);
    }

    #[test]
    fn customers_are_unique_and_sorted_including_unpaid() {
        let orders = vec![
            make_order("Cy", 100, true),
            make_order("Ana", 200, false),
            make_order("Cy", 300, false),
            make_order("Bo", 400, true),
        ];
        assert_eq!(customers(&orders), vec!["Ana", "Bo", "Cy"]);
    }

    #[test]
    fn no_orders_means_no_customers() {
        assert!(customers(&[]).is_empty());
    }
}
