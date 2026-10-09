// ============================================================================
//  SOLUTION async2 · Hand-written future            Chapter 19 · Async Rust
// ----------------------------------------------------------------------------
//  poll runs once per round of the executor. A Pending answer must come with a
//  wake, because a real executor only polls again after one. Countdown counts
//  its own polls and wakes the task each time it is not ready yet.
// ============================================================================

use std::cell::Cell;
use std::future::Future;
use std::pin::{Pin, pin};
use std::rc::Rc;
use std::task::{Context, Poll, Waker};

// Ready after `remaining` pending polls. `polls` counts every call to poll,
// and it is shared with the caller so the count can be read after block_on.
struct Countdown {
    remaining: u32,
    polls: Rc<Cell<u32>>,
}

impl Future for Countdown {
    type Output = &'static str;

    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {
        // Every field is Unpin, so Pin::get_mut gives back a plain &mut. A
        // future that points into itself could not do this.
        let this = self.get_mut();
        this.polls.set(this.polls.get() + 1);

        if this.remaining == 0 {
            return Poll::Ready("liftoff");
        }
        this.remaining -= 1;
        // Wake before returning Pending. Without this call, a real executor
        // would never poll this future again and it would sleep forever.
        cx.waker().wake_by_ref();
        Poll::Pending
    }
}

fn block_on<F: Future>(fut: F) -> F::Output {
    let mut fut = pin!(fut);
    let mut cx = Context::from_waker(Waker::noop());
    loop {
        if let Poll::Ready(output) = fut.as_mut().poll(&mut cx) {
            return output;
        }
    }
}

fn main() {
    let polls = Rc::new(Cell::new(0));
    let out = block_on(Countdown { remaining: 3, polls: Rc::clone(&polls) });
    println!("{out} after {} polls", polls.get());
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::Arc;
    use std::sync::atomic::{AtomicUsize, Ordering};
    use std::task::Wake;

    // Counts how many times the executor was asked to wake the task.
    struct CountWakes(AtomicUsize);

    impl Wake for CountWakes {
        fn wake(self: Arc<Self>) {
            self.0.fetch_add(1, Ordering::SeqCst);
        }
    }

    #[test]
    fn block_on_polls_until_liftoff() {
        let polls = Rc::new(Cell::new(0));
        let out = block_on(Countdown { remaining: 3, polls: Rc::clone(&polls) });
        assert_eq!(out, "liftoff");
        // Three pending polls, then the ready one.
        assert_eq!(polls.get(), 4);
    }

    #[test]
    fn pending_poll_wakes_the_task() {
        let wakes = Arc::new(CountWakes(AtomicUsize::new(0)));
        let waker = Waker::from(Arc::clone(&wakes));
        let mut cx = Context::from_waker(&waker);
        let mut countdown = Countdown { remaining: 1, polls: Rc::new(Cell::new(0)) };

        assert_eq!(Pin::new(&mut countdown).poll(&mut cx), Poll::Pending);
        assert_eq!(wakes.0.load(Ordering::SeqCst), 1);
    }

    #[test]
    fn zero_remaining_is_ready_on_the_first_poll() {
        let polls = Rc::new(Cell::new(0));
        let mut countdown = Countdown { remaining: 0, polls: Rc::clone(&polls) };
        let mut cx = Context::from_waker(Waker::noop());

        assert_eq!(Pin::new(&mut countdown).poll(&mut cx), Poll::Ready("liftoff"));
        assert_eq!(polls.get(), 1);
    }
}
