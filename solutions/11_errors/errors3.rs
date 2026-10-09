// ============================================================================
//  SOLUTION errors3 · Your own error type     Chapter 11 · Errors Are Values
// ----------------------------------------------------------------------------
//  An error enum says exactly which failure happened, so the caller can match
//  on it. Display turns each variant into the message people read.
// ============================================================================

use std::error::Error;
use std::fmt;

#[derive(Debug)]
enum ConfigError {
    Missing(String),
    Invalid { key: String, value: String },
}

impl fmt::Display for ConfigError {
    // Chapter 15 explains '_, the lifetime the compiler fills in here.
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ConfigError::Missing(key) => write!(f, "missing key: {key}"),
            ConfigError::Invalid { key, value } => {
                write!(f, "invalid value '{value}' for key '{key}'")
            }
        }
    }
}

// An empty impl is enough. Error requires Debug and Display, and both exist.
impl Error for ConfigError {}

fn get_port(pairs: &[(&str, &str)]) -> Result<u16, ConfigError> {
    // Walk the pairs until the "port" key. The key's value must parse as a u16.
    for (key, raw) in pairs {
        if *key == "port" {
            return match raw.parse::<u16>() {
                Ok(port) => Ok(port),
                Err(_) => Err(ConfigError::Invalid {
                    key: String::from("port"),
                    value: raw.to_string(),
                }),
            };
        }
    }
    // No "port" pair at all: the config is missing a key.
    Err(ConfigError::Missing(String::from("port")))
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
