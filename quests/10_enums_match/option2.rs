// ============================================================================
//  QUEST option2 · if let and let else             Chapter 10 · Enums & Pattern Matching
// ----------------------------------------------------------------------------
//  Every Option in this file is opened with unwrap(). That works until a None
//  arrives, and then the program panics. Rewrite each function so that the
//  missing case is handled:
//    display_name(nick, full)  the nickname when there is one, else the full name
//    parse_port(s)             the port number, or 8080 when s is not a valid u16
//    initials(name)            "ada lovelace" -> "AL": the first letter of each
//                              word, uppercase. None, or no words, gives ""
//
//  Use if let, let ... else, unwrap_or or map where each one fits.
//  Don't edit the tests.
//
//  cargo forge          check your work (re-runs every time you save)
//  cargo forge hint     a nudge in the right direction
// ============================================================================

fn display_name(nick: Option<&str>, full: &str) -> String {
    nick.unwrap().to_string()
}

fn parse_port(s: &str) -> u16 {
    s.parse::<u16>().unwrap()
}

fn initials(name: Option<&str>) -> String {
    name.unwrap()
        .split_whitespace()
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
    fn parse_port_reads_a_valid_port() {
        assert_eq!(parse_port("8000"), 8000);
        assert_eq!(parse_port("443"), 443);
    }

    #[test]
    fn parse_port_falls_back_to_8080() {
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
