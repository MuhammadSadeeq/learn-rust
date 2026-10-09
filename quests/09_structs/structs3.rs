// ============================================================================
//  QUEST structs3 · Derive and compare        Chapter 09 · Structs & Methods
// ----------------------------------------------------------------------------
//  Settings already derives Debug, Clone and PartialEq. Those give you {:?},
//  .clone() and ==. Don't derive Default: it would set font_size to 0, and the
//  app wants 14. Write the Default impl by hand with these values:
//    theme "light", font_size 14, autosave true
//
//  Then write with_theme(base, theme). It returns a copy of base with only the
//  theme changed. Use struct update syntax (..) so that only the theme is
//  written out in the literal.
//
//  Both bodies are todo!() for now. Don't edit the tests.
//
//  cargo forge          check your work (re-runs every time you save)
//  cargo forge hint     a nudge in the right direction
// ============================================================================

#[derive(Debug, Clone, PartialEq)]
struct Settings {
    theme: String,
    font_size: u8,
    autosave: bool,
}

impl Default for Settings {
    fn default() -> Self {
        todo!()
    }
}

fn with_theme(base: &Settings, theme: &str) -> Settings {
    todo!()
}

fn main() {
    let base = Settings::default();
    println!("{base:?}");
    let dark = with_theme(&base, "dark");
    println!("{dark:?}");
    println!("same? {}", dark == base);
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn default_uses_the_app_defaults() {
        let d = Settings::default();
        assert_eq!(d.theme, "light");
        assert_eq!(d.font_size, 14);
        assert!(d.autosave);
    }

    #[test]
    fn with_theme_changes_only_the_theme() {
        let base = Settings {
            theme: String::from("light"),
            font_size: 18,
            autosave: false,
        };
        let dark = with_theme(&base, "dark");
        assert_eq!(
            dark,
            Settings {
                theme: String::from("dark"),
                font_size: 18,
                autosave: false
            }
        );
        assert_eq!(base.theme, "light"); // the original is untouched
    }

    #[test]
    fn clone_is_equal_but_separate() {
        let a = Settings::default();
        let mut b = a.clone();
        assert_eq!(a, b);
        b.font_size = 20;
        assert_ne!(a, b);
        assert_eq!(a.font_size, 14);
    }
}
