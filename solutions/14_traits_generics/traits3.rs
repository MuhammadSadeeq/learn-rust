// ============================================================================
//  SOLUTION traits3 · Trait objects                     Chapter 14 · Traits & Generics
// ----------------------------------------------------------------------------
//  Box<dyn Shape> lets one Vec hold different types. Each call to area()
//  goes through the shape's own impl at runtime. largest_name uses a strict
//  `>`, so on a tie the shape we already kept stays.
// ============================================================================

trait Shape {
    fn area(&self) -> f64;
    fn name(&self) -> &str;
}

struct Circle {
    radius: f64,
}

struct Square {
    side: f64,
}

struct Triangle {
    base: f64,
    height: f64,
}

impl Shape for Circle {
    fn area(&self) -> f64 {
        std::f64::consts::PI * self.radius * self.radius
    }

    fn name(&self) -> &str {
        "circle"
    }
}

impl Shape for Square {
    fn area(&self) -> f64 {
        self.side * self.side
    }

    fn name(&self) -> &str {
        "square"
    }
}

impl Shape for Triangle {
    fn area(&self) -> f64 {
        self.base * self.height / 2.0
    }

    fn name(&self) -> &str {
        "triangle"
    }
}

// Sum of every shape's area. An empty slice has a total of 0.0.
fn total_area(shapes: &[Box<dyn Shape>]) -> f64 {
    shapes.iter().map(|shape| shape.area()).sum()
}

// Name of the shape with the largest area, or None if there are no shapes.
// On a tie, the shape that comes first in the slice wins.
fn largest_name(shapes: &[Box<dyn Shape>]) -> Option<&str> {
    let mut best: Option<&dyn Shape> = None;
    for shape in shapes {
        // `is_none_or` is true for the first shape, then only a strictly
        // bigger area replaces the current best.
        if best.is_none_or(|b| shape.area() > b.area()) {
            best = Some(shape.as_ref());
        }
    }
    best.map(|shape| shape.name())
}

fn main() {
    let shapes: Vec<Box<dyn Shape>> = vec![
        Box::new(Circle { radius: 1.0 }),
        Box::new(Square { side: 2.0 }),
        Box::new(Triangle {
            base: 3.0,
            height: 4.0,
        }),
    ];
    println!("total area: {:.2}", total_area(&shapes));
    println!("largest: {:?}", largest_name(&shapes));
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn total_area_adds_every_shape() {
        let shapes: Vec<Box<dyn Shape>> = vec![
            Box::new(Circle { radius: 1.0 }),
            Box::new(Square { side: 2.0 }),
            Box::new(Triangle {
                base: 3.0,
                height: 4.0,
            }),
        ];
        let expected = std::f64::consts::PI + 4.0 + 6.0;
        let total = total_area(&shapes);
        assert!(
            (total - expected).abs() < 1e-9,
            "expected {expected}, got {total}"
        );
    }

    #[test]
    fn empty_input_has_zero_area_and_no_name() {
        assert_eq!(total_area(&[]), 0.0);
        assert_eq!(largest_name(&[]), None);
    }

    #[test]
    fn largest_name_picks_the_biggest_area() {
        let shapes: Vec<Box<dyn Shape>> = vec![
            Box::new(Circle { radius: 1.0 }),
            Box::new(Square { side: 2.0 }),
            Box::new(Triangle {
                base: 3.0,
                height: 4.0,
            }),
        ];
        assert_eq!(largest_name(&shapes), Some("triangle"));
    }

    #[test]
    fn largest_name_keeps_the_first_shape_on_a_tie() {
        // A 2 x 2 square and a triangle with base 4 and height 2 both have area 4.
        let shapes: Vec<Box<dyn Shape>> = vec![
            Box::new(Square { side: 2.0 }),
            Box::new(Triangle {
                base: 4.0,
                height: 2.0,
            }),
        ];
        assert_eq!(largest_name(&shapes), Some("square"));
    }
}
