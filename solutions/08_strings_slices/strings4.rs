// ============================================================================
//  SOLUTION strings4 · Building strings        Chapter 08 · Strings & Slices
// ----------------------------------------------------------------------------
//  title_case walks the words and pushes each one into a String, with one
//  space between words.
//  slugify builds the output by pushing characters, and it adds a dash only
//  when the last character pushed was not already one. That is how a run of
//  separators becomes one dash.
// ============================================================================

/// Uppercases the first character of each word and keeps the rest.
fn title_case(s: &str) -> String {
    let mut out = String::new();
    for word in s.split_whitespace() {
        if !out.is_empty() {
            out.push(' ');
        }
        for (i, c) in word.char_indices() {
            if i == 0 {
                // One char can uppercase to several chars (ß becomes SS), so
                // to_uppercase gives a sequence. Push each char of it.
                for upper in c.to_uppercase() {
                    out.push(upper);
                }
            } else {
                out.push(c);
            }
        }
    }
    out
}

fn slugify(s: &str) -> String {
    let mut slug = String::new();
    for c in s.chars() {
        if c.is_ascii_alphanumeric() {
            slug.push(c.to_ascii_lowercase());
        } else if !slug.ends_with('-') {
            // A run of other characters becomes one dash.
            slug.push('-');
        }
    }
    // A run of separators at either end leaves a dash there. Remove it.
    slug.trim_matches('-').to_string()
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
