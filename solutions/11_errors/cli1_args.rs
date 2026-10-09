// ============================================================================
//  QUEST cli1_args · Read the command line            Chapter 11 · Errors Are Values
// ----------------------------------------------------------------------------
//  A command-line tool gets its arguments as a list of text, one entry per
//  word. The program name is not in that list: main has already removed it.
//  Turn the list into a Config, or return a usage error that says what went
//  wrong. Errors are values here, so parse_args returns Err and never panics.
//
//  The rules:
//    -v or --verbose    sets verbose to true (the default is false)
//    --limit N          sets limit (the default is 10). N must be a whole number.
//    one other word     is the file. There must be exactly one.
//
//  Use these messages, exactly:
//    "--limit needs a value"           when --limit is the last word
//    "--limit must be a whole number"  when its value is not a number
//    "unknown flag -x"                 for any other word that starts with -
//    USAGE                             when there is no file, or there are two
//
//  Don't use unwrap() or expect() in your solution. Don't edit the tests.
//  main shows how a program reports a usage error: the message goes to stderr,
//  and the exit code is 2. Chapter 11 covers ExitCode and eprintln!.
//
//  cargo forge          check your work (re-runs every time you save)
//  cargo forge hint     a nudge in the right direction
// ============================================================================

use std::env;
use std::process::ExitCode;

const USAGE: &str = "usage: tool [-v] [--limit N] FILE";

#[derive(Debug, PartialEq)]
struct Config {
    verbose: bool,
    limit: usize,
    file: String,
}

fn parse_args(args: &[String]) -> Result<Config, String> {
    let mut verbose = false;
    let mut limit: usize = 10;
    let mut file: Option<String> = None;

    let mut i = 0;
    while i < args.len() {
        let word = args[i].as_str();
        match word {
            "-v" | "--verbose" => verbose = true,
            "--limit" => {
                // The value is the word after --limit.
                let value = match args.get(i + 1) {
                    Some(value) => value,
                    None => return Err("--limit needs a value".to_string()),
                };
                limit = match value.parse() {
                    Ok(n) => n,
                    Err(_) => return Err("--limit must be a whole number".to_string()),
                };
                i += 1; // the value is used up
            }
            _ if word.starts_with('-') => return Err(format!("unknown flag {word}")),
            _ => {
                if file.is_some() {
                    return Err(USAGE.to_string());
                }
                file = Some(word.to_string());
            }
        }
        i += 1;
    }

    match file {
        Some(file) => Ok(Config {
            verbose,
            limit,
            file,
        }),
        None => Err(USAGE.to_string()),
    }
}

fn main() -> ExitCode {
    let args: Vec<String> = env::args().skip(1).collect();
    match parse_args(&args) {
        Ok(config) => {
            println!("{config:?}");
            ExitCode::SUCCESS
        }
        Err(message) => {
            eprintln!("{message}");
            ExitCode::from(2)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Turns string slices into the owned list that main gives parse_args.
    fn words(list: &[&str]) -> Vec<String> {
        let mut out = Vec::new();
        for word in list {
            out.push(word.to_string());
        }
        out
    }

    #[test]
    fn a_file_alone_uses_the_defaults() {
        let config = parse_args(&words(&["notes.txt"])).expect("valid");
        assert_eq!(
            config,
            Config {
                verbose: false,
                limit: 10,
                file: "notes.txt".to_string(),
            }
        );
    }

    #[test]
    fn flags_work_before_or_after_the_file() {
        let before = parse_args(&words(&["-v", "--limit", "3", "a.txt"])).expect("valid");
        let after = parse_args(&words(&["a.txt", "--verbose", "--limit", "3"])).expect("valid");
        assert_eq!(before, after);
        assert!(before.verbose);
        assert_eq!(before.limit, 3);
    }

    #[test]
    fn limit_must_be_a_whole_number() {
        assert_eq!(
            parse_args(&words(&["--limit", "abc", "a.txt"])),
            Err("--limit must be a whole number".to_string())
        );
        // -1 is a value here, not a flag, and it is not a whole number.
        assert_eq!(
            parse_args(&words(&["--limit", "-1", "a.txt"])),
            Err("--limit must be a whole number".to_string())
        );
    }

    #[test]
    fn limit_at_the_end_needs_a_value() {
        assert_eq!(
            parse_args(&words(&["a.txt", "--limit"])),
            Err("--limit needs a value".to_string())
        );
    }

    #[test]
    fn unknown_flags_are_named_in_the_error() {
        assert_eq!(
            parse_args(&words(&["--color", "a.txt"])),
            Err("unknown flag --color".to_string())
        );
    }

    #[test]
    fn one_file_is_required_and_only_one_is_allowed() {
        assert_eq!(parse_args(&words(&["-v"])), Err(USAGE.to_string()));
        assert_eq!(
            parse_args(&words(&["a.txt", "b.txt"])),
            Err(USAGE.to_string())
        );
    }

    #[test]
    fn no_arguments_is_a_usage_error() {
        assert_eq!(parse_args(&[]), Err(USAGE.to_string()));
    }
}
