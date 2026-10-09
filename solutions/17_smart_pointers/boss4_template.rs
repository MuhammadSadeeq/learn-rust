// ============================================================================
//  SOLUTION boss4_template · Mini Blade        Chapter 17 · Smart Pointers
// ----------------------------------------------------------------------------
//  Each filter is a type behind Box<dyn Filter>, so one HashMap can hold any
//  mix of them. tokens() returns Token values that borrow slices of the
//  template, so parsing copies nothing. render() walks the tokens, and `?`
//  sends errors out of render.
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
    Tag(&'a str, Vec<&'a str>),
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
        out.push(Token::Tag(name, filters));

        rest = &after_open[close + 2..];
    }
    if !rest.is_empty() {
        out.push(Token::Text(rest));
    }
    Ok(out)
}

#[derive(Default)]
struct Engine {
    filters: HashMap<String, Box<dyn Filter>>,
}

impl Engine {
    fn new() -> Self {
        let mut engine = Engine::default();
        engine.register("upper", Box::new(Upper));
        engine.register("lower", Box::new(Lower));
        engine.register("trim", Box::new(Trim));
        engine
    }

    // A filter registered under an existing name replaces the old one.
    fn register(&mut self, name: &str, filter: Box<dyn Filter>) {
        self.filters.insert(name.to_string(), filter);
    }

    fn render(&self, template: &str, ctx: &HashMap<&str, &str>) -> Result<String, RenderError> {
        let mut output = String::new();
        // Parse the whole template first, so a broken tag fails before any output.
        for token in tokens(template)? {
            match token {
                Token::Text(text) => output.push_str(text),
                Token::Tag(name, filters) => {
                    let Some(&raw) = ctx.get(name) else {
                        return Err(RenderError::UnknownVar(name.to_string()));
                    };
                    // Each filter returns a new String, so the value is owned from here on.
                    let mut value = raw.to_string();
                    for filter_name in filters {
                        let Some(filter) = self.filters.get(filter_name) else {
                            return Err(RenderError::UnknownFilter(filter_name.to_string()));
                        };
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
    let page = "Hi {{ name | trim | upper }}, welcome to {{city}}!";
    let ctx = HashMap::from([("name", "  ana  "), ("city", "Lisbon")]);
    println!("{:?}", Engine::new().render(page, &ctx));
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
