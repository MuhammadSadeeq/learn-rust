// ============================================================================
//  QUEST structs2 · Methods and new()         Chapter 09 · Structs & Methods
// ----------------------------------------------------------------------------
//  Give Rect these five functions. Their bodies are todo!() for now, so the
//  tests fail until you write them.
//    new(w, h)               a constructor. No self: call it as Rect::new.
//    area(&self)             w * h. It only reads the rect.
//    scale(&mut self, k)     multiplies width and height by k, in place.
//    can_hold(&self, other)  true when self is at least as wide and as tall
//                            as other. Equal sizes fit.
//    square(size)            a rect with equal sides. No self.
//
//  Don't edit the tests.
//
//  cargo forge          check your work (re-runs every time you save)
//  cargo forge hint     a nudge in the right direction
// ============================================================================

struct Rect {
    w: u32,
    h: u32,
}

impl Rect {
    fn new(w: u32, h: u32) -> Self {
        todo!()
    }

    fn area(&self) -> u32 {
        todo!()
    }

    fn scale(&mut self, k: u32) {
        todo!()
    }

    fn can_hold(&self, other: &Rect) -> bool {
        todo!()
    }

    fn square(size: u32) -> Self {
        todo!()
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
        // Too wide, even though it is short.
        assert!(!big.can_hold(&Rect::new(11, 2)));
    }

    #[test]
    fn square_has_equal_sides() {
        let s = Rect::square(7);
        assert_eq!((s.w, s.h), (7, 7));
    }
}
