// ============================================================================
//  QUEST iter1 · Collection pipeline         Chapter 13 · Iterators & Closures
// ----------------------------------------------------------------------------
//  Laravel collections, in PHP:
//    collect($orders)->filter(fn ($o) => $o['paid'])
//                    ->map(fn ($o) => $o['total_cents'])->sum();
//    collect($orders)->pluck('customer')->unique()->sort()->values();
//
//  Rust runs the same pipeline on iterators. Write both functions as iterator
//  chains (iter, filter, map, sum, collect). No for loops in this quest.
//
//    paid_total  the total of the paid orders, in cents
//    customers   each customer once, sorted. Unpaid orders count too.
//
//  Don't edit the tests.
//
//  cargo forge          check your work (re-runs every time you save)
//  cargo forge hint     a nudge in the right direction
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
    todo!()
}

fn customers(orders: &[Order]) -> Vec<String> {
    todo!()
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
