// ============================================================================
//  QUEST enums2 · Exhaustive match     Chapter 10 · Enums & Pattern Matching
// ----------------------------------------------------------------------------
//  An order moves Pending -> Paid -> Shipped -> Delivered. It can be cancelled
//  until it ships. Write two functions:
//    next(s)    the following status, or None when there is no next step
//    cancel(s)  Ok(Cancelled) for Pending, Paid and Cancelled. For Shipped or
//               Delivered, Err("already shipped") or Err("already delivered").
//
//  Write a match that lists every variant. Don't use a `_` arm. When a status
//  is added later, the compiler should point at each match that needs an arm.
//
//  Both bodies are todo!() for now. Don't edit the tests.
//
//  cargo forge          check your work (re-runs every time you save)
//  cargo forge hint     a nudge in the right direction
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
    todo!()
}

fn cancel(s: OrderStatus) -> Result<OrderStatus, String> {
    todo!()
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
