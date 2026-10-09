// ============================================================================
//  QUEST traits4 · Display and From         Chapter 14 · Traits & Generics
// ----------------------------------------------------------------------------
//  Money stores whole cents in an i64. Make it print like money ("$12.34",
//  "-$0.50"), build from an integer, and add with +. Display, From and Add
//  are standard traits. Once they exist, `{}`, .into() and + all work.
//
//  Replace the todo!() bodies. Don't edit the tests.
//
//  cargo forge          check your work (re-runs every time you save)
//  cargo forge hint     a nudge in the right direction
// ============================================================================

use std::fmt;
use std::ops::Add;

#[derive(Debug, Clone, Copy, PartialEq)]
struct Money {
    cents: i64,
}

impl fmt::Display for Money {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        todo!()
    }
}

impl From<i64> for Money {
    fn from(cents: i64) -> Self {
        todo!()
    }
}

impl Add for Money {
    type Output = Money;

    fn add(self, other: Money) -> Money {
        todo!()
    }
}

fn main() {
    let price = Money::from(1234);
    let tax = Money::from(99);
    println!("{}", price + tax);
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn displays_dollars_and_cents() {
        assert_eq!(Money::from(1234).to_string(), "$12.34");
        assert_eq!(Money::from(0).to_string(), "$0.00");
    }

    #[test]
    fn displays_negative_amounts_with_the_sign_first() {
        assert_eq!(Money::from(-50).to_string(), "-$0.50");
        assert_eq!(Money::from(-5).to_string(), "-$0.05");
    }

    #[test]
    fn from_i64_stores_the_cents() {
        let m: Money = 500.into();
        assert_eq!(m, Money { cents: 500 });
    }

    #[test]
    fn add_sums_the_cents() {
        let total = Money::from(150) + Money::from(275);
        assert_eq!(total, Money::from(425));
        assert_eq!(total.to_string(), "$4.25");
    }
}
