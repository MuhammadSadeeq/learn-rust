// ============================================================================
//  QUEST rc1 · Shared ownership                Chapter 17 · Smart Pointers
// ----------------------------------------------------------------------------
//  Several viewers share one Document. `open_viewers` must give each viewer a
//  handle to the same Document, not a copy of it. Rc::strong_count reads the
//  owner count: the original handle and every viewer each count as one owner.
//
//  Don't edit the tests.
//
//  cargo forge          check your work (re-runs every time you save)
//  cargo forge hint     a nudge in the right direction
// ============================================================================

use std::rc::Rc;

struct Document {
    title: String,
}

struct Viewer {
    doc: Rc<Document>,
}

impl Viewer {
    fn title(&self) -> &str {
        &self.doc.title
    }
}

// Give each of the `n` viewers a handle to the same document.
fn open_viewers(doc: &Rc<Document>, n: usize) -> Vec<Viewer> {
    todo!()
}

fn main() {
    let doc = Rc::new(Document {
        title: String::from("Q3 plan"),
    });
    let viewers = open_viewers(&doc, 3);
    println!(
        "{} viewers, {} owners of the document",
        viewers.len(),
        Rc::strong_count(&doc)
    );
    println!("first viewer sees {}", viewers[0].title());
}

#[cfg(test)]
mod tests {
    use super::*;

    fn document() -> Rc<Document> {
        Rc::new(Document {
            title: String::from("Q3 plan"),
        })
    }

    #[test]
    fn viewers_share_one_document() {
        let doc = document();
        let viewers = open_viewers(&doc, 3);
        assert_eq!(Rc::strong_count(&doc), 4);
        assert!(viewers.iter().all(|v| Rc::ptr_eq(&v.doc, &doc)));
        assert_eq!(viewers[2].title(), "Q3 plan");
    }

    #[test]
    fn dropping_viewers_releases_their_owners() {
        let doc = document();
        let mut viewers = open_viewers(&doc, 3);
        viewers.pop();
        assert_eq!(Rc::strong_count(&doc), 3);
        drop(viewers);
        assert_eq!(Rc::strong_count(&doc), 1);
    }

    #[test]
    fn zero_viewers_adds_no_owners() {
        let doc = document();
        assert!(open_viewers(&doc, 0).is_empty());
        assert_eq!(Rc::strong_count(&doc), 1);
    }
}
