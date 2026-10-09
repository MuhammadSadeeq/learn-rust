// ============================================================================
//  SOLUTION structs2 · Methods and new()      Chapter 09 · Structs & Methods
// ----------------------------------------------------------------------------
//  Associated functions take no self and are called as Rect::new. Methods take
//  &self to read and &mut self to change the value in place.
// ============================================================================

struct Rect {
    w: u32,
    h: u32,
}

impl Rect {
    // No self: this is an associated function, called as Rect::new(..).
    fn new(w: u32, h: u32) -> Self {
        Self { w, h }
    }

    // &self borrows the rect only to read it. Nothing is changed or moved.
    fn area(&self) -> u32 {
        self.w * self.h
    }

    // &mut self lets us change the fields in place.
    fn scale(&mut self, k: u32) {
        self.w *= k;
        self.h *= k;
    }

    // other is only read, so it is a shared borrow, not a move.
    fn can_hold(&self, other: &Rect) -> bool {
        self.w >= other.w && self.h >= other.h
    }

    // Reuse new() so the two constructors cannot disagree.
    fn square(size: u32) -> Self {
        Self::new(size, size)
    }
}

fn main() {
    let mut poster = Rect::new(40, 30);
    println!("area: {}", poster.area());
    poster.scale(2);
    println!("scaled: {}x{}", poster.w, poster.h);
    let tile = Rect::square(10);
    println!("holds a 10x10 tile: {}", poster.can_hold(&tile));
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn area_multiplies_width_and_height() {
        assert_eq!(Rect::new(4, 5).area(), 20);
    }

    #[test]
    fn scale_grows_both_sides() {
        let mut r = Rect::new(2, 3);
        r.scale(3);
        assert_eq!((r.w, r.h), (6, 9));
        assert_eq!(r.area(), 54);
    }

    #[test]
    fn can_hold_needs_both_sides_to_fit() {
        let big = Rect::new(10, 8);
        assert!(big.can_hold(&Rect::new(4, 8))); // equal height still fits
        assert!(big.can_hold(&Rect::new(10, 8))); // an equal rect fits too
        assert!(!big.can_hold(&Rect::new(11, 2))); // too wide, even though it is short
    }

    #[test]
    fn square_has_equal_sides() {
        let s = Rect::square(7);
        assert_eq!((s.w, s.h), (7, 7));
    }
}
