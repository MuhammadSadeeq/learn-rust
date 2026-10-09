// ============================================================================
//  SOLUTION traits4 · Display and From      Chapter 14 · Traits & Generics
// ----------------------------------------------------------------------------
//  Display writes into a Formatter, so `{}` and to_string() both use it. From
//  builds a Money from cents, and .into() comes free with it. Add consumes
//  both operands, which is fine here because Money is Copy.
// ============================================================================

use std::fmt;
use std::ops::Add;

#[derive(Debug, Clone, Copy, PartialEq)]
struct Money {
    cents: i64,
}

impl fmt::Display for Money {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        // Format the absolute value, then put the sign in front. unsigned_abs
        // avoids overflow for the most negative i64.
        let sign = if self.cents < 0 { "-" } else { "" };
        let abs = self.cents.unsigned_abs();
        write!(f, "{sign}${}.{:02}", abs / 100, abs % 100)
    }
}

impl From<i64> for Money {
    fn from(cents: i64) -> Self {
        Money { cents }
    }
}

impl Add for Money {
    type Output = Money;

    fn add(self, other: Money) -> Money {
        Money {
            cents: self.cents + other.cents,
        }
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
