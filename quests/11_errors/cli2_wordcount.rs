// ============================================================================
//  QUEST cli2_wordcount · Count lines, words and bytes   Chapter 11 · Errors Are Values
// ----------------------------------------------------------------------------
//  wc counts three things in some text: lines, words and bytes. This version
//  reads from any BufRead, a source of lines, so the same code works for
//  stdin, a file, or the text in a test. It reads one line at a time, so a
//  huge input never has to fit in memory.
//
//  BufRead::read_line(&mut String) reads one line into the String, keeps the
//  newline at the end, and returns how many bytes it read. It returns 0 when
//  the input is over. Clear the String before each call. (The lines() method
//  drops the newline, so it cannot tell you how many bytes a line had.)
//
//  Count the way wc does:
//    lines   the number of newline characters ('\n')
//    words   the runs of non-space text in each line (split_whitespace)
//    bytes   every byte, newlines included. "é" is two bytes.
//
//  Reading can fail, so count returns io::Result, and each read_line gets a ?.
//  io::Result<T> is Result<T, io::Error>. The method needs `mut` on the input,
//  because it changes the reader. Chapter 14 explains the R: BufRead bound.
//  Don't edit the tests.
//
//  cargo forge          check your work (re-runs every time you save)
//  cargo forge hint     a nudge in the right direction
// ============================================================================

use std::io::{self, BufRead};

#[derive(Debug, Default, PartialEq)]
struct Counts {
    lines: usize,
    words: usize,
    bytes: usize,
}

fn count<R: BufRead>(input: R) -> io::Result<Counts> {
    todo!()
}

fn main() -> io::Result<()> {
    let counts = count(io::stdin().lock())?;
    println!("{} {} {}", counts.lines, counts.words, counts.bytes);
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Cursor;

    #[test]
    fn counts_lines_words_and_bytes() {
        let counts = count(Cursor::new("one two\nthree\n")).expect("reads");
        assert_eq!(
            counts,
            Counts {
                lines: 2,
                words: 3,
                bytes: 14,
            }
        );
    }

    #[test]
    fn empty_input_counts_nothing() {
        let counts = count(Cursor::new("")).expect("reads");
        assert_eq!(
            counts,
            Counts {
                lines: 0,
                words: 0,
                bytes: 0,
            }
        );
    }

    #[test]
    fn a_last_line_without_a_newline_is_not_a_line() {
        // Like wc: "a b\nc" has one newline, so one line, but three words.
        let counts = count(Cursor::new("a b\nc")).expect("reads");
        assert_eq!(
            counts,
            Counts {
                lines: 1,
                words: 3,
                bytes: 5,
            }
        );
    }

    #[test]
    fn bytes_are_not_characters() {
        // "héllo" is five characters but six bytes. The newline makes seven.
        let counts = count(Cursor::new("héllo\n")).expect("reads");
        assert_eq!(
            counts,
            Counts {
                lines: 1,
                words: 1,
                bytes: 7,
            }
        );
    }

    #[test]
    fn blank_lines_and_tabs_have_no_words() {
        let counts = count(Cursor::new("  \n\t\n")).expect("reads");
        assert_eq!(
            counts,
            Counts {
                lines: 2,
                words: 0,
                bytes: 5,
            }
        );
    }
}
