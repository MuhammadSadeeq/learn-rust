// ============================================================================
//  QUEST errors3 · Your own error type        Chapter 11 · Errors Are Values
// ----------------------------------------------------------------------------
//  ConfigError describes what went wrong with a config value. Finish the two
//  pieces the file needs:
//    Display     Missing("port")                    -> "missing key: port"
//                Invalid { key: "port", value: "abc" }
//                                                   -> "invalid value 'abc' for key 'port'"
//    get_port    finds the "port" pair and parses its value as a u16.
//                No "port" pair gives Missing. A value that is not a u16 gives
//                Invalid. 70000 is not a valid u16.
//
//  The Error impl is already written. It needs Debug and Display, which the
//  file provides. Don't edit the tests.
//
//  Both bodies are todo!() for now.
//
//  cargo forge          check your work (re-runs every time you save)
//  cargo forge hint     a nudge in the right direction
// ============================================================================

use std::error::Error;
use std::fmt;

#[derive(Debug)]
enum ConfigError {
    Missing(String),
    Invalid { key: String, value: String },
}

impl fmt::Display for ConfigError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        todo!()
    }
}

impl Error for ConfigError {}

fn get_port(pairs: &[(&str, &str)]) -> Result<u16, ConfigError> {
    todo!()
}

fn main() {
    let config = [("host", "localhost"), ("port", "8080")];
    match get_port(&config) {
        Ok(port) => println!("listening on port {port}"),
        Err(e) => println!("config error: {e}"),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn finds_the_port_among_other_keys() {
        let config = [("host", "localhost"), ("port", "8080")];
        assert_eq!(get_port(&config).unwrap(), 8080);
    }

    #[test]
    fn missing_port_has_a_message() {
        let err = get_port(&[("host", "localhost")]).unwrap_err();
        assert_eq!(err.to_string(), "missing key: port");
    }

    #[test]
    fn invalid_port_has_a_message() {
        let err = get_port(&[("port", "abc")]).unwrap_err();
        assert_eq!(err.to_string(), "invalid value 'abc' for key 'port'");
    }

    #[test]
    fn port_above_u16_is_invalid() {
        // Edge case: the text is a number, but it does not fit in a u16.
        let err = get_port(&[("port", "70000")]).unwrap_err();
        assert_eq!(err.to_string(), "invalid value '70000' for key 'port'");
    }

    #[test]
    fn config_error_works_as_a_std_error() {
        // Edge case: the type can be used as a general error trait object.
        let boxed: Box<dyn std::error::Error> =
            Box::new(ConfigError::Missing(String::from("port")));
        assert_eq!(boxed.to_string(), "missing key: port");
    }
}
