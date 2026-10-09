// ============================================================================
//  QUEST memory1 · Size it up                Chapter 05 · The Stack & The Heap
// ----------------------------------------------------------------------------
//  Predict, then check. Each constant should hold the number of bytes that
//  size_of::<T>() reports for its type on a 64-bit machine. Replace every 0
//  with your prediction as a plain number. Don't call size_of inside the
//  constants: the point is to predict first.
//
//  The tests compare each constant with size_of, so a wrong guess fails.
//  Don't edit the tests.
//
//  cargo forge          check your work (re-runs every time you save)
//  cargo forge hint     a nudge in the right direction
// ============================================================================

const SIZE_I32: usize = 0;
const SIZE_U8: usize = 0;
const SIZE_BOOL: usize = 0;
const SIZE_CHAR: usize = 0;
const SIZE_I32_U8: usize = 0; // (i32, u8)
const SIZE_STRING: usize = 0;
const SIZE_VEC_U64: usize = 0; // Vec<u64>
const SIZE_STR_REF: usize = 0; // &str
const SIZE_STRING_REF: usize = 0; // &String
const SIZE_BOX_I32: usize = 0; // Box<i32>
const SIZE_OPTION_BOX_I32: usize = 0; // Option<Box<i32>>

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
