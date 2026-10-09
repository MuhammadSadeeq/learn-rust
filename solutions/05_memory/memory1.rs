// ============================================================================
//  SOLUTION memory1 · Size it up             Chapter 05 · The Stack & The Heap
// ----------------------------------------------------------------------------
//  Every number is the size on a 64-bit machine. A pointer or a length is 8
//  bytes, so String and Vec are three of them (24), and &str is a pointer and
//  a length (16). A reference or Box is one pointer. Alignment adds padding
//  to the (i32, u8) tuple, and a Box can't be null, which lets Option<Box>
//  reuse the null pointer for None.
// ============================================================================

const SIZE_I32: usize = 4;
const SIZE_U8: usize = 1;
const SIZE_BOOL: usize = 1; // one byte, holding only 0 or 1
const SIZE_CHAR: usize = 4; // a Unicode scalar value fits in 32 bits
const SIZE_I32_U8: usize = 8; // 4 + 1 bytes of data, padded to a multiple of 4
const SIZE_STRING: usize = 24; // pointer, length, capacity: three words
const SIZE_VEC_U64: usize = 24; // pointer, length, capacity: three words
const SIZE_STR_REF: usize = 16; // pointer and length: two words
const SIZE_STRING_REF: usize = 8; // one pointer; the String itself lives elsewhere
const SIZE_BOX_I32: usize = 8; // one pointer to the heap
const SIZE_OPTION_BOX_I32: usize = 8; // None is the null pointer, so no extra tag

fn main() {
    let table = [
        ("i32", SIZE_I32),
        ("u8", SIZE_U8),
        ("bool", SIZE_BOOL),
        ("char", SIZE_CHAR),
        ("(i32, u8)", SIZE_I32_U8),
        ("String", SIZE_STRING),
        ("Vec<u64>", SIZE_VEC_U64),
        ("&str", SIZE_STR_REF),
        ("&String", SIZE_STRING_REF),
        ("Box<i32>", SIZE_BOX_I32),
        ("Option<Box<i32>>", SIZE_OPTION_BOX_I32),
    ];
    for (name, bytes) in table {
        println!("{name:<18} {bytes} bytes");
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::mem::size_of;

    #[test]
    fn scalars() {
        assert_eq!(SIZE_I32, size_of::<i32>(), "i32");
        assert_eq!(SIZE_U8, size_of::<u8>(), "u8");
        assert_eq!(SIZE_BOOL, size_of::<bool>(), "bool");
        assert_eq!(SIZE_CHAR, size_of::<char>(), "char");
    }

    #[test]
    fn owned_containers() {
        assert_eq!(SIZE_I32_U8, size_of::<(i32, u8)>(), "(i32, u8)");
        assert_eq!(SIZE_STRING, size_of::<String>(), "String");
        assert_eq!(SIZE_VEC_U64, size_of::<Vec<u64>>(), "Vec<u64>");
    }

    #[test]
    fn references_and_boxes() {
        assert_eq!(SIZE_STR_REF, size_of::<&str>(), "&str");
        assert_eq!(SIZE_STRING_REF, size_of::<&String>(), "&String");
        assert_eq!(SIZE_BOX_I32, size_of::<Box<i32>>(), "Box<i32>");
        assert_eq!(SIZE_OPTION_BOX_I32, size_of::<Option<Box<i32>>>(), "Option<Box<i32>>");
    }
}
