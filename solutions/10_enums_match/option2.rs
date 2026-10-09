// ============================================================================
//  SOLUTION option2 · if let and let else  Chapter 10 · Enums & Pattern Matching
// ----------------------------------------------------------------------------
//  Each function handles None on purpose. if let runs a block only for Some,
//  let else leaves the function early for None, and unwrap_or supplies a
//  default. None never reaches a panic.
// ============================================================================

const DEFAULT_PORT: u16 = 8080;

fn display_name(nick: Option<&str>, full: &str) -> String {
    // if let runs its block only for Some. Otherwise we fall through.
    if let Some(nick) = nick {
        return nick.to_string();
    }
    full.to_string()
}

fn parse_port(s: &str) -> u16 {
    // parse returns a Result. .ok() turns it into an Option, and unwrap_or
    // supplies the default when the text is not a valid u16.
    s.parse::<u16>().ok().unwrap_or(DEFAULT_PORT)
}

fn initials(name: Option<&str>) -> String {
    // let else: when the pattern does not match, the else block must leave the
    // function. Here the name is used after the check, so it is not nested.
    let Some(name) = name else {
        return String::new();
    };
    name.split_whitespace()
        .filter_map(|word| word.chars().next())
        .map(|c| c.to_ascii_uppercase())
        .collect()
}

fn main() {
    println!("{}", display_name(Some("Ana"), "Ana Silva"));
    println!("{}", display_name(None, "Ana Silva"));
    println!("{}", parse_port("8443"));
    println!("{}", initials(Some("ada lovelace")));
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn display_name_prefers_the_nickname() {
        assert_eq!(display_name(Some("Ana"), "Ana Silva"), "Ana");
    }

    #[test]
    fn display_name_falls_back_to_the_full_name() {
        assert_eq!(display_name(None, "Ana Silva"), "Ana Silva");
    }

    #[test]
    fn parse_port_reads_a_valid_port_and_falls_back() {
        assert_eq!(parse_port("8000"), 8000);
        assert_eq!(parse_port("http"), 8080);
        assert_eq!(parse_port("70000"), 8080); // edge case: too big for a u16
    }

    #[test]
    fn initials_of_a_full_name() {
        assert_eq!(initials(Some("ada lovelace")), "AL");
        assert_eq!(initials(Some("  grace   brewster hopper ")), "GBH");
        assert_eq!(initials(Some("")), "");
        assert_eq!(initials(None), "");
    }
}
