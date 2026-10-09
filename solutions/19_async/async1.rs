// ============================================================================
//  SOLUTION async1 · Drive a future                  Chapter 19 · Async Rust
// ----------------------------------------------------------------------------
//  Rust ships no executor. An async fn returns a future, and something has to
//  poll it until it reports Ready. block_on is that something: pin the future,
//  build a Context from a no-op waker, and poll in a loop.
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

// The whole job of an executor: poll until Ready, then hand back the output.
fn block_on<F: Future>(fut: F) -> F::Output {
    // poll takes Pin<&mut Self>, so the future has to be pinned first. pin!
    // pins it to this stack frame, where it stays until we return.
    let mut fut = pin!(fut);

    // A Context carries a Waker, the handle a pending future uses to ask to be
    // polled again. We never wait for anything, so a no-op waker is enough.
    let mut cx = Context::from_waker(Waker::noop());

    loop {
        if let Poll::Ready(output) = fut.as_mut().poll(&mut cx) {
            return output;
        }
        // Pending. A real executor would park the thread until the waker
        // fires. This one polls again right away.
    }
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
