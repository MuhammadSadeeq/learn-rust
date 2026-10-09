// ============================================================================
//  SOLUTION lifetimes2 · Structs that borrow        Chapter 15 · Lifetimes
// ----------------------------------------------------------------------------
//  The returned slices carry 'a, the lifetime of the input text, not the
//  lifetime of &mut self. That is why a token can outlive the tokenizer.
// ============================================================================

struct Tokenizer<'a> {
    input: &'a str,
    pos: usize,
}

impl<'a> Tokenizer<'a> {
    fn new(input: &'a str) -> Self {
        Tokenizer { input, pos: 0 }
    }

    // Returns the next word, or None when the input is used up. The slice
    // borrows the input for 'a, not the tokenizer.
    fn next_token(&mut self) -> Option<&'a str> {
        // self.input is a &'a str, so a slice of it keeps 'a and does not
        // borrow `self`.
        let rest = self.input[self.pos..].trim_start();
        if rest.is_empty() {
            return None;
        }
        // `rest` is a suffix of the input, so the difference in length is the
        // byte offset where the word starts.
        let start = self.input.len() - rest.len();
        let len = rest.find(char::is_whitespace).unwrap_or(rest.len());
        self.pos = start + len;
        Some(&self.input[start..self.pos])
    }
}

fn main() {
    let mut tokens = Tokenizer::new("let x = 5");
    while let Some(token) = tokens.next_token() {
        println!("{token}");
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn splits_on_whitespace() {
        let mut tokens = Tokenizer::new("let x = 5");
        assert_eq!(tokens.next_token(), Some("let"));
        assert_eq!(tokens.next_token(), Some("x"));
        assert_eq!(tokens.next_token(), Some("="));
        assert_eq!(tokens.next_token(), Some("5"));
        assert_eq!(tokens.next_token(), None);
    }

    #[test]
    fn empty_input_has_no_tokens() {
        let mut tokens = Tokenizer::new("");
        assert_eq!(tokens.next_token(), None);
    }

    #[test]
    fn runs_of_whitespace_count_as_one_separator() {
        let mut tokens = Tokenizer::new("  a   bb\tccc  ");
        let mut words = Vec::new();
        while let Some(word) = tokens.next_token() {
            words.push(word);
        }
        assert_eq!(words, vec!["a", "bb", "ccc"]);
    }

    #[test]
    fn tokens_borrow_the_input_not_the_tokenizer() {
        let text = String::from("hello world");
        let first;
        {
            let mut tokens = Tokenizer::new(&text);
            first = tokens.next_token().unwrap();
        }
        // The tokenizer is gone, but `first` still points into `text`.
        assert_eq!(first, "hello");
    }
}
