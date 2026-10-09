// ============================================================================
//  QUEST clap1 · A CLI with subcommands                  Chapter 16 · Modules, Crates & Tests
// ----------------------------------------------------------------------------
//  A command-line tool describes its arguments once, as types. clap reads
//  those types and does the parsing, the help text and the error messages.
//
//  Write the types so these tests pass:
//    - `Cli` is the whole command line. It has a `--verbose` flag (short -v),
//      and one subcommand.
//    - `Command` is an enum with three subcommands:
//        add TEXT   stores a note (TEXT is one argument, even with spaces)
//        list       lists the notes
//        done ID    marks note ID as done (ID is a whole number)
//    - `Cli::try_parse_from(words)` parses a list of words, the way the real
//      command line would, and returns an error instead of exiting.
//
//  The derive macros do the work. Chapter 16 explains #[derive(Parser)],
//  #[command(subcommand)] and #[derive(Subcommand)]. Don't edit the tests.
//
//  cargo forge          check your work (re-runs every time you save)
//  cargo forge hint     a nudge in the right direction
// ============================================================================

use clap::{Parser, Subcommand};

/// A small notes tool.
#[derive(Debug, PartialEq)]
pub struct Cli {
    /// Print more detail.
    pub verbose: bool,

    pub command: Command,
}

#[derive(Debug, PartialEq)]
pub enum Command {
    /// Add a note.
    Add { text: String },
    /// List every note.
    List,
    /// Mark a note as done.
    Done { id: u32 },
}

#[cfg(test)]
mod tests {
    use super::*;
    use clap::error::ErrorKind;

    #[test]
    fn parses_add_with_one_text_argument() {
        let cli = Cli::try_parse_from(["notes", "add", "buy milk"]).expect("valid input");
        assert_eq!(
            cli,
            Cli {
                verbose: false,
                command: Command::Add {
                    text: "buy milk".to_string()
                },
            }
        );
    }

    #[test]
    fn parses_done_with_a_number() {
        let cli = Cli::try_parse_from(["notes", "done", "3"]).expect("valid input");
        assert_eq!(cli.command, Command::Done { id: 3 });
    }

    #[test]
    fn verbose_flag_comes_before_the_subcommand() {
        let cli = Cli::try_parse_from(["notes", "--verbose", "list"]).expect("valid input");
        assert!(cli.verbose);
        assert_eq!(cli.command, Command::List);
    }

    #[test]
    fn a_non_number_id_is_a_value_error() {
        let err = Cli::try_parse_from(["notes", "done", "abc"]).unwrap_err();
        assert_eq!(err.kind(), ErrorKind::ValueValidation);
        // Usage errors exit with status 2, as the Unix convention expects.
        assert_eq!(err.exit_code(), 2);
    }

    #[test]
    fn an_unknown_subcommand_is_rejected() {
        let err = Cli::try_parse_from(["notes", "fly"]).unwrap_err();
        assert_eq!(err.kind(), ErrorKind::InvalidSubcommand);
    }

    #[test]
    fn a_missing_subcommand_prints_help_and_exits_2() {
        // clap prints the help text when no subcommand is given. That is an
        // error for the command line, so the exit status is 2.
        let err = Cli::try_parse_from(["notes"]).unwrap_err();
        assert_eq!(err.kind(), ErrorKind::DisplayHelpOnMissingArgumentOrSubcommand);
        assert_eq!(err.exit_code(), 2);
    }

    #[test]
    fn help_is_not_an_error_exit() {
        let err = Cli::try_parse_from(["notes", "--help"]).unwrap_err();
        assert_eq!(err.kind(), ErrorKind::DisplayHelp);
        assert_eq!(err.exit_code(), 0);
    }

    #[test]
    fn the_short_flag_v_works() {
        let cli = Cli::try_parse_from(["notes", "-v", "list"]).expect("valid input");
        assert!(cli.verbose);
        assert_eq!(cli.command, Command::List);
    }
}
