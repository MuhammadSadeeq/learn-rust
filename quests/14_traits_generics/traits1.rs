// ============================================================================
//  QUEST traits1 · Implement a trait        Chapter 14 · Traits & Generics
// ----------------------------------------------------------------------------
//  A trait is a list of methods a type promises to have. Book and Movie are
//  two unrelated structs. Implement `Describe` for both so each one can
//  describe itself.
//
//  Replace the todo!() bodies so the tests pass. Don't edit the tests.
//
//  cargo forge          check your work (re-runs every time you save)
//  cargo forge hint     a nudge in the right direction
// ============================================================================

trait Describe {
    fn describe(&self) -> String;
}

struct Book {
    title: String,
    author: String,
}

struct Movie {
    title: String,
    year: u32,
}

impl Describe for Book {
    fn describe(&self) -> String {
        todo!()
    }
}

impl Describe for Movie {
    fn describe(&self) -> String {
        todo!()
    }
}

fn main() {
    let book = Book {
        title: String::from("Dune"),
        author: String::from("Frank Herbert"),
    };
    let movie = Movie {
        title: String::from("Alien"),
        year: 1979,
    };
    println!("{}", book.describe());
    println!("{}", movie.describe());
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn book_describes_title_and_author() {
        let book = Book {
            title: String::from("Dune"),
            author: String::from("Frank Herbert"),
        };
        assert_eq!(book.describe(), "Dune by Frank Herbert");
    }

    #[test]
    fn movie_describes_title_and_year() {
        let movie = Movie {
            title: String::from("Alien"),
            year: 1979,
        };
        assert_eq!(movie.describe(), "Alien (1979)");
    }

    #[test]
    fn describe_borrows_so_it_can_run_twice() {
        let book = Book {
            title: String::from("Emma"),
            author: String::from("Jane Austen"),
        };
        assert_eq!(book.describe(), "Emma by Jane Austen");
        assert_eq!(book.describe(), "Emma by Jane Austen");
    }
}
