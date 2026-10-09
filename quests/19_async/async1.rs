// ============================================================================
//  QUEST async1 · Drive a future                       Chapter 19 · Async Rust
// ----------------------------------------------------------------------------
//  An async fn does not run when you call it. It returns a future, a value
//  that makes progress only when something polls it. Rust has no built-in
//  executor, so write the smallest one: block_on.
//
//  Implement block_on without any crate. Pin the future, build a Context from
//  Waker::noop(), and poll in a loop until the result is Ready. Don't edit the
//  tests.
//
//  cargo forge          check your work (re-runs every time you save)
//  cargo forge hint     a nudge in the right direction
// ============================================================================

use std::future::Future;
use std::pin::pin;
use std::task::{Context, Poll, Waker};

async fn double(x: u32) -> u32 {
    x * 2
}

async fn pipeline(x: u32) -> u32 {
    double(x).await + 1
}

// Poll `fut` until it is ready, then return its output.
fn block_on<F: Future>(fut: F) -> F::Output {
    todo!()
}

fn main() {
    println!("pipeline(20) = {}", block_on(pipeline(20)));
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn runs_an_async_fn() {
        assert_eq!(block_on(double(21)), 42);
    }

    #[test]
    fn runs_a_chain_of_awaits() {
        assert_eq!(block_on(pipeline(20)), 41);
    }

    #[test]
    fn runs_an_async_block() {
        assert_eq!(block_on(async { double(double(3).await).await }), 12);
    }

    #[test]
    fn output_can_be_any_type() {
        assert_eq!(block_on(async { "done" }), "done");
    }
}
