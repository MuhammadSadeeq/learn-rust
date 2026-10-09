// ============================================================================
//  SOLUTION traits1 · Implement a trait                 Chapter 14 · Traits & Generics
// ----------------------------------------------------------------------------
//  Each impl block gives one type its version of the trait. `&self` borrows
//  the value, so describe can run again and again and the book is never moved.
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
        format!("{} by {}", self.title, self.author)
    }
}

impl Describe for Movie {
    fn describe(&self) -> String {
        format!("{} ({})", self.title, self.year)
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
