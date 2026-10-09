// ============================================================================
//  QUEST boss4_template · Mini Blade           Chapter 17 · Smart Pointers
// ----------------------------------------------------------------------------
//  Act IV boss. Laravel's Blade turns `Hi {{ $name }}` into text. Mini Blade
//  does that in Rust, and adds filters: `{{ name | trim | upper }}` runs trim,
//  then upper. Implement the three Filter impls, tokens, Engine::new,
//  Engine::register and Engine::render. Rules:
//    - spaces inside {{ }} are optional, and a lone { or } is plain text
//    - filters run left to right. register replaces a filter with the same name
//    - errors: UnknownVar, UnknownFilter, Unclosed (found before any output)
//
//  Don't edit the tests. Don't rename types or change signatures.
//
//  cargo forge          check your work (re-runs every time you save)
//  cargo forge hint     a nudge in the right direction
// ============================================================================

use std::collections::HashMap;

// A filter turns text into new text. Each filter is its own type, so the engine
// can hold different filters behind one trait object.
trait Filter {
    fn apply(&self, input: &str) -> String;
}

struct Upper;
struct Lower;
struct Trim;

impl Filter for Upper {
    fn apply(&self, input: &str) -> String {
        todo!()
    }
}

impl Filter for Lower {
    fn apply(&self, input: &str) -> String {
        todo!()
    }
}

impl Filter for Trim {
    fn apply(&self, input: &str) -> String {
        todo!()
    }
}

#[derive(Debug, PartialEq)]
enum RenderError {
    UnknownVar(String),
    UnknownFilter(String),
    Unclosed,
}

// Both variants borrow slices of the template. Nothing is copied yet.
#[derive(Debug, PartialEq)]
enum Token<'a> {
    Text(&'a str),
    Tag(&'a str, Vec<&'a str>),
}

// Split the template into text and tags. Empty text runs are skipped.
fn tokens<'a>(template: &'a str) -> Result<Vec<Token<'a>>, RenderError> {
    todo!()
}

struct Engine {
    filters: HashMap<String, Box<dyn Filter>>,
}

impl Engine {
    fn new() -> Self {
        todo!()
    }

    fn register(&mut self, name: &str, filter: Box<dyn Filter>) {
        todo!()
    }

    fn render(&self, template: &str, ctx: &HashMap<&str, &str>) -> Result<String, RenderError> {
        todo!()
    }
}

fn main() {
    let engine = Engine::new();
    let ctx = HashMap::from([("name", "  ana  "), ("city", "Lisbon")]);
    match engine.render("Hi {{ name | trim | upper }}, welcome to {{city}}!", &ctx) {
        Ok(text) => println!("{text}"),
        Err(err) => println!("render failed: {err:?}"),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use RenderError::*;

    // Renders with the built-in filters and the given variables.
    fn render(template: &str, vars: &[(&str, &str)]) -> Result<String, RenderError> {
        let ctx: HashMap<&str, &str> = vars.iter().copied().collect();
        Engine::new().render(template, &ctx)
    }

    fn ok(text: &str) -> Result<String, RenderError> {
        Ok(text.to_string())
    }

    #[test]
    fn renders_variables_with_or_without_spaces() {
        let vars = [("first", "Ana"), ("last", "Silva")];
        assert_eq!(
            render("Hi {{ first }} {{last}}!", &vars),
            ok("Hi Ana Silva!")
        );
    }

    #[test]
    fn filters_run_left_to_right() {
        let vars = [("name", "  ana  ")];
        assert_eq!(render("{{ name | trim | upper }}", &vars), ok("ANA"));
        // upper then lower ends lowercase. The reverse order would end uppercase.
        assert_eq!(render("{{ name | upper | lower }}", &vars), ok("  ana  "));
    }

    #[test]
    fn text_without_tags_passes_through() {
        let text = "Single {braces} and a stray }} are plain text.";
        assert_eq!(render(text, &[]), ok(text));
    }

    #[test]
    fn registered_filters_are_used_and_can_replace_builtins() {
        struct Shout;
        impl Filter for Shout {
            fn apply(&self, input: &str) -> String {
                format!("{}!", input.to_uppercase())
            }
        }

        let ctx = HashMap::from([("name", "ana")]);
        let mut engine = Engine::new();
        engine.register("shout", Box::new(Shout));
        assert_eq!(engine.render("{{ name | shout }}", &ctx), ok("ANA!"));

        // A new filter under an existing name replaces the built-in.
        engine.register("upper", Box::new(Shout));
        assert_eq!(engine.render("{{ name | upper }}", &ctx), ok("ANA!"));
    }

    #[test]
    fn broken_templates_are_errors() {
        let vars = [("name", "ana")];
        assert_eq!(
            render("Hi {{ nobody }}", &vars),
            Err(UnknownVar("nobody".into()))
        );
        assert_eq!(
            render("{{ name | reverse }}", &vars),
            Err(UnknownFilter("reverse".into()))
        );
        assert_eq!(render("Hi {{ name", &vars), Err(Unclosed));
        assert_eq!(render("Hi {{ name }", &vars), Err(Unclosed));
    }

    #[test]
    fn tokens_borrow_slices_of_the_template() {
        let expected = vec![
            Token::Text("a "),
            Token::Tag("b", vec!["upper"]),
            Token::Tag("c", vec![]),
            Token::Text("d"),
        ];
        assert_eq!(tokens("a {{ b | upper }}{{c}}d"), Ok(expected));
    }
}
