// ============================================================================
//  SOLUTION boss4_template · Mini Blade        Chapter 17 · Smart Pointers
// ----------------------------------------------------------------------------
//  Four parts work together. Each filter is a type behind Box<dyn Filter>, so
//  one HashMap can hold any mix of them. tokens() returns Token values that
//  borrow slices of the template, so parsing copies nothing. render() walks
//  the tokens and looks up variables and filters in maps. Errors are plain
//  values, so `?` sends them straight out of render.
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
        input.to_uppercase()
    }
}

impl Filter for Lower {
    fn apply(&self, input: &str) -> String {
        input.to_lowercase()
    }
}

impl Filter for Trim {
    fn apply(&self, input: &str) -> String {
        input.trim().to_string()
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
    let mut out = Vec::new();
    let mut rest = template;

    while let Some(open) = rest.find("{{") {
        if open > 0 {
            out.push(Token::Text(&rest[..open]));
        }
        // "{{" and "}}" are ASCII, so these byte offsets always fall on char boundaries.
        let after_open = &rest[open + 2..];
        let close = after_open.find("}}").ok_or(RenderError::Unclosed)?;

        // split() always yields at least one piece, so the first one is the name.
        let mut parts = after_open[..close].split('|').map(str::trim);
        let name = parts.next().unwrap_or_default();
        let filters: Vec<&str> = parts.collect();
        out.push(Token::Tag { name, filters });

        rest = &after_open[close + 2..];
    }
    if !rest.is_empty() {
        out.push(Token::Text(rest));
    }
    Ok(out)
}

struct Engine {
    filters: HashMap<String, Box<dyn Filter>>,
}

impl Engine {
    fn new() -> Self {
        let mut engine = Engine {
            filters: HashMap::new(),
        };
        engine.register("upper", Box::new(Upper));
        engine.register("lower", Box::new(Lower));
        engine.register("trim", Box::new(Trim));
        engine
    }

    // Adds a filter under `name`. An existing filter with that name is replaced.
    fn register(&mut self, name: &str, filter: Box<dyn Filter>) {
        self.filters.insert(name.to_string(), filter);
    }

    fn render(&self, template: &str, ctx: &HashMap<&str, &str>) -> Result<String, RenderError> {
        let mut output = String::new();
        // tokens() runs over the whole template first, so a broken tag fails
        // before any output is produced.
        for token in tokens(template)? {
            match token {
                Token::Text(text) => output.push_str(text),
                Token::Tag { name, filters } => {
                    let raw = *ctx
                        .get(name)
                        .ok_or_else(|| RenderError::UnknownVar(name.to_string()))?;
                    // Each filter returns a new String, so the value is owned from here on.
                    let mut value = raw.to_string();
                    for filter_name in filters {
                        let filter = self
                            .filters
                            .get(filter_name)
                            .ok_or_else(|| RenderError::UnknownFilter(filter_name.to_string()))?;
                        value = filter.apply(&value);
                    }
                    output.push_str(&value);
                }
            }
        }
        Ok(output)
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
