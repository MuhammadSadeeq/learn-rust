// ============================================================================
//  SOLUTION enums2 · Exhaustive match  Chapter 10 · Enums & Pattern Matching
// ----------------------------------------------------------------------------
//  Every variant is listed, with no `_` arm. That is what makes the state
//  machine safe: add a status later and each match that is not updated fails
//  to compile, so no transition is forgotten.
// ============================================================================

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum OrderStatus {
    Pending,
    Paid,
    Shipped,
    Delivered,
    Cancelled,
}

fn next(s: OrderStatus) -> Option<OrderStatus> {
    match s {
        OrderStatus::Pending => Some(OrderStatus::Paid),
        OrderStatus::Paid => Some(OrderStatus::Shipped),
        OrderStatus::Shipped => Some(OrderStatus::Delivered),
        // None means there is no next step. Callers must handle it.
        OrderStatus::Delivered | OrderStatus::Cancelled => None,
    }
}

fn cancel(s: OrderStatus) -> Result<OrderStatus, String> {
    match s {
        // Several variants share one arm with |. Cancelling twice is harmless.
        OrderStatus::Pending | OrderStatus::Paid | OrderStatus::Cancelled => {
            Ok(OrderStatus::Cancelled)
        }
        OrderStatus::Shipped => Err(String::from("already shipped")),
        OrderStatus::Delivered => Err(String::from("already delivered")),
    }
}

fn main() {
    let mut status = OrderStatus::Pending;
    while let Some(following) = next(status) {
        println!("{status:?} -> {following:?}");
        status = following;
    }
    println!("{status:?} has no next step");
    match cancel(OrderStatus::Shipped) {
        Ok(s) => println!("cancelled: {s:?}"),
        Err(reason) => println!("cannot cancel: {reason}"),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn next_walks_the_happy_path() {
        assert_eq!(next(OrderStatus::Pending), Some(OrderStatus::Paid));
        assert_eq!(next(OrderStatus::Paid), Some(OrderStatus::Shipped));
        assert_eq!(next(OrderStatus::Shipped), Some(OrderStatus::Delivered));
    }

    #[test]
    fn delivered_and_cancelled_have_no_next_step() {
        assert_eq!(next(OrderStatus::Delivered), None);
        assert_eq!(next(OrderStatus::Cancelled), None);
    }

    #[test]
    fn cancel_works_before_shipping() {
        assert_eq!(cancel(OrderStatus::Pending), Ok(OrderStatus::Cancelled));
        assert_eq!(cancel(OrderStatus::Paid), Ok(OrderStatus::Cancelled));
        // Edge case: cancelling a cancelled order is not an error.
        assert_eq!(cancel(OrderStatus::Cancelled), Ok(OrderStatus::Cancelled));
    }

    #[test]
    fn cancel_is_refused_after_shipping() {
        assert_eq!(
            cancel(OrderStatus::Shipped),
            Err(String::from("already shipped"))
        );
        assert_eq!(
            cancel(OrderStatus::Delivered),
            Err(String::from("already delivered"))
        );
    }
}
