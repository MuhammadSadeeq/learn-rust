// ============================================================================
//  QUEST boss4_template · Mini Blade           Chapter 17 · Smart Pointers
// ----------------------------------------------------------------------------
//  Act IV boss. Laravel's Blade turns `Hi {{ $name }}` into text. Mini Blade
//  does that in Rust, plus filters: `{{ name | trim | upper }}` runs trim, then
//  upper. Implement the three Filter impls, tokens, Engine::new,
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
// can hold many different filters behind one trait object.
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
    Tag {
        name: &'a str,
        filters: Vec<&'a str>,
    },
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

    // Adds a filter under `name`. An existing filter with that name is replaced.
    fn register(&mut self, name: &str, filter: Box<dyn Filter>) {
        todo!()
    }

    fn render(&self, template: &str, ctx: &HashMap<&str, &str>) -> Result<String, RenderError> {
        todo!()
    }
}

fn main() {
    let engine = Engine::new();
    let mut ctx = HashMap::new();
    ctx.insert("name", "  ana  ");
    ctx.insert("city", "Lisbon");

    let page = "Hi {{ name | trim | upper }}, welcome to {{city}}!";
    match engine.render(page, &ctx) {
        Ok(text) => println!("{text}"),
        Err(err) => println!("render failed: {err:?}"),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn vars<'a>(pairs: &[(&'a str, &'a str)]) -> HashMap<&'a str, &'a str> {
        pairs.iter().copied().collect()
    }

    #[test]
    fn renders_variables_with_or_without_spaces() {
        let engine = Engine::new();
        let ctx = vars(&[("first", "Ana"), ("last", "Silva")]);
        assert_eq!(
            engine.render("Hi {{ first }} {{last}}!", &ctx),
            Ok("Hi Ana Silva!".to_string())
        );
    }

    #[test]
    fn filters_run_left_to_right() {
        let engine = Engine::new();
        let ctx = vars(&[("name", "  ana  ")]);
        assert_eq!(
            engine.render("{{ name | trim | upper }}", &ctx),
            Ok("ANA".to_string())
        );
        // upper then lower ends lowercase. The reverse order would end uppercase.
        assert_eq!(
            engine.render("{{ name | upper | lower }}", &ctx),
            Ok("  ana  ".to_string())
        );
    }

    #[test]
    fn text_without_tags_passes_through() {
        let engine = Engine::new();
        let text = "Single {braces} and a stray }} are plain text.";
        assert_eq!(engine.render(text, &vars(&[])), Ok(text.to_string()));
    }

    #[test]
    fn registered_filters_are_used_and_can_replace_builtins() {
        struct Shout;
        impl Filter for Shout {
            fn apply(&self, input: &str) -> String {
                format!("{}!", input.to_uppercase())
            }
        }

        let mut engine = Engine::new();
        engine.register("shout", Box::new(Shout));
        let ctx = vars(&[("name", "ana")]);
        assert_eq!(
            engine.render("{{ name | shout }}", &ctx),
            Ok("ANA!".to_string())
        );

        engine.register("upper", Box::new(Shout));
        assert_eq!(
            engine.render("{{ name | upper }}", &ctx),
            Ok("ANA!".to_string())
        );
    }

    #[test]
    fn unknown_variables_and_filters_are_errors() {
        let engine = Engine::new();
        let ctx = vars(&[("name", "ana")]);
        assert_eq!(
            engine.render("Hi {{ nobody }}", &ctx),
            Err(RenderError::UnknownVar("nobody".to_string()))
        );
        assert_eq!(
            engine.render("{{ name | reverse }}", &ctx),
            Err(RenderError::UnknownFilter("reverse".to_string()))
        );
    }

    #[test]
    fn unclosed_tag_is_an_error() {
        let engine = Engine::new();
        let ctx = vars(&[("name", "ana")]);
        assert_eq!(
            engine.render("Hi {{ name", &ctx),
            Err(RenderError::Unclosed)
        );
        assert_eq!(
            engine.render("Hi {{ name }", &ctx),
            Err(RenderError::Unclosed)
        );
    }

    #[test]
    fn tokens_borrow_slices_of_the_template() {
        assert_eq!(
            tokens("a {{ b | upper }}{{c}}d"),
            Ok(vec![
                Token::Text("a "),
                Token::Tag {
                    name: "b",
                    filters: vec!["upper"]
                },
                Token::Tag {
                    name: "c",
                    filters: vec![]
                },
                Token::Text("d"),
            ])
        );
    }
}
