// ============================================================================
//  SOLUTION structs3 · Derive and compare     Chapter 09 · Structs & Methods
// ----------------------------------------------------------------------------
//  derive gives Debug, Clone and PartialEq for free. Default is written by
//  hand, because the app's font size is 14. Derive would give 0 instead.
// ============================================================================

#[derive(Debug, Clone, PartialEq)]
struct Settings {
    theme: String,
    font_size: u8,
    autosave: bool,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            theme: String::from("light"),
            font_size: 14,
            autosave: true,
        }
    }
}

fn with_theme(base: &Settings, theme: &str) -> Settings {
    // Only theme is written out. font_size and autosave are copied from *base.
    // Both are Copy types, so nothing is cloned and base is not moved from.
    Settings {
        theme: theme.to_string(),
        ..*base
    }
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
