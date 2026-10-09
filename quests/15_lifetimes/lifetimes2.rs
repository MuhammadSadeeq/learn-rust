// ============================================================================
//  QUEST lifetimes2 · Structs that borrow           Chapter 15 · Lifetimes
// ----------------------------------------------------------------------------
//  A Tokenizer reads a &str and hands out its words one at a time. It doesn't
//  own the text. It borrows it, so the struct itself needs a lifetime 'a: the
//  text must outlive the tokenizer.
//
//  Implement `new` and `next_token`. Return slices of the input, not new
//  Strings. Words are separated by whitespace. Don't edit the tests.
//
//  cargo forge          check your work (re-runs every time you save)
//  cargo forge hint     a nudge in the right direction
// ============================================================================

struct Tokenizer<'a> {
    input: &'a str,
    pos: usize,
}

impl<'a> Tokenizer<'a> {
    fn new(input: &'a str) -> Self {
        todo!()
    }

    // Returns the next word, or None when the input is used up. The slice
    // borrows the input for 'a, not the tokenizer.
    fn next_token(&mut self) -> Option<&'a str> {
        todo!()
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
