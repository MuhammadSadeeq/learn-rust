// ============================================================================
//  QUEST strings4 · Building strings           Chapter 08 · Strings & Slices
// ----------------------------------------------------------------------------
//  Build new text from the words of a sentence. Both functions return a
//  String and split on whitespace, so runs of spaces count as one separator.
//
//  title_case uppercases the first letter of each word and keeps the rest of
//  the word as it was.
//  slugify is for URLs, like Laravel's Str::slug but without transliteration:
//  ASCII letters and digits are kept (lowercased), and any other run of
//  characters becomes a single '-'. Dashes at either end are removed.
//
//  Write both functions. Don't edit the tests.
//
//  cargo forge          check your work (re-runs every time you save)
//  cargo forge hint     a nudge in the right direction
// ============================================================================

/// "hello rust world" -> "Hello Rust World".
fn title_case(s: &str) -> String {
    todo!()
}

/// "Hello, Laravel & Rust!" -> "hello-laravel-rust".
fn slugify(s: &str) -> String {
    todo!()
}

fn main() {
    println!("{}", title_case("hello rust world"));
    println!("{}", slugify("Hello, Laravel & Rust!"));
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn title_case_capitalizes_each_word() {
        assert_eq!(title_case("hello rust world"), "Hello Rust World");
        assert_eq!(title_case("élan vital"), "Élan Vital");
        assert_eq!(title_case(""), "");
    }

    #[test]
    fn title_case_collapses_extra_spaces() {
        assert_eq!(title_case("  spaced   out  "), "Spaced Out");
    }

    #[test]
    fn slugify_keeps_letters_and_digits() {
        assert_eq!(slugify("Hello, World!"), "hello-world");
        assert_eq!(slugify("Rust & PHP -- 2026"), "rust-php-2026");
        assert_eq!(slugify("already-slugged"), "already-slugged");
    }

    #[test]
    fn slugify_edges() {
        assert_eq!(slugify(" -- Café Olé -- "), "caf-ol");
        assert_eq!(slugify("!!!"), "");
        assert_eq!(slugify(""), "");
    }
}
