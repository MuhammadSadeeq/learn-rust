// ============================================================================
//  SOLUTION rc_refcell1 · Shared and mutable   Chapter 17 · Smart Pointers
// ----------------------------------------------------------------------------
//  Rc gives every view an owner handle to one cart. RefCell lets a view change
//  the cart through a shared &self, with the borrow rules checked at run time.
//  You need both: Rc alone cannot mutate, and RefCell alone has one owner.
// ============================================================================

use std::cell::RefCell;
use std::rc::Rc;

// One shared shopping cart: a list of (item, price in cents).
type Cart = Rc<RefCell<Vec<(String, u32)>>>;

fn new_cart() -> Cart {
    Rc::new(RefCell::new(Vec::new()))
}

// A view is a handle onto a cart. Several views can point at the same cart.
struct CartView {
    cart: Cart,
}

impl CartView {
    fn new(cart: &Cart) -> CartView {
        // Rc::clone adds an owner. The RefCell inside is shared, not copied.
        CartView {
            cart: Rc::clone(cart),
        }
    }

    fn add(&self, item: &str, cents: u32) {
        // borrow_mut() panics if another borrow of the list is still alive.
        self.cart.borrow_mut().push((item.to_string(), cents));
    }

    fn total(&self) -> u32 {
        self.cart.borrow().iter().map(|(_, cents)| cents).sum()
    }
}

fn main() {
    let cart = new_cart();
    let shop = CartView::new(&cart);
    let checkout = CartView::new(&cart);
    shop.add("Rust book", 4500);
    checkout.add("Coffee", 350);
    println!("total: {} cents", checkout.total());
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn two_views_share_one_cart() {
        let cart = new_cart();
        let shop = CartView::new(&cart);
        let checkout = CartView::new(&cart);
        shop.add("book", 1250);
        checkout.add("pen", 300);
        assert_eq!(shop.total(), 1550);
        assert_eq!(checkout.total(), 1550);
        assert_eq!(cart.borrow().len(), 2);
    }

    #[test]
    fn empty_cart_totals_zero() {
        let cart = new_cart();
        assert_eq!(CartView::new(&cart).total(), 0);
    }

    #[test]
    fn items_stay_when_a_view_goes_away() {
        let cart = new_cart();
        {
            let view = CartView::new(&cart);
            view.add("mug", 800);
            assert_eq!(Rc::strong_count(&cart), 2);
        }
        assert_eq!(Rc::strong_count(&cart), 1);
        assert_eq!(CartView::new(&cart).total(), 800);
    }
}
