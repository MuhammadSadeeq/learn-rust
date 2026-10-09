//! The art and text the Forge draws: Oxi, the five bosses and their lines.
//!
//! Everything here is plain data or a pure function, so the unit tests can
//! check it without a terminal. The callers in `main.rs` add the colors.

use crate::runner::strip_ansi;

/// One boss: the quest it guards, how it looks and what it says.
pub struct Boss {
    pub quest: &'static str,
    pub name: &'static str,
    pub act: &'static str, // roman numeral
    pub weak: &'static str,
    pub eye: char,
    pub art: &'static [&'static str],
    pub taunt: &'static str,  // doesn't compile (full HP)
    pub hurt: &'static str,   // compiles, some tests fail
    pub defeat: &'static str, // every test passes
}

/// Oxi's art column is this many chars wide.
pub const OXI_WIDTH: usize = 24;
/// A boss's art column is this many chars wide.
pub const BOSS_WIDTH: usize = 26;

/// The mood line when the tests never finish.
pub const TIMEOUT_TAUNT: &str = "The boss waits you out. Something never finishes.";

/// Oxi's lines after a passed quest. See `oxi_flavor`.
pub const OXI_LINES: [&str; 10] = [
    "Snip snap. On to the next one.",
    "Clean build. That's the nicest thing rustc ever says.",
    "Clean build and green tests. A good sign, not a proof.",
    "No errors, no panics, no worries.",
    "Another one forged. The metal's getting stronger.",
    "The Forge stamps it: approved.",
    "That's what it feels like when Rust clicks.",
    "Sideways victory dance, engaged.",
    "Every test green. Stretch those claws.",
    "Tidy. Tests are green; leaks are still yours to check.",
];

/// Oxi at rest on the ground. Each frame is six lines; "" is a blank row.
pub const OXI_GROUND: &[&str] = &[
    "",
    r" (\/)         (\/)",
    r"   \\  .---.  //",
    r"    \\( ^ ^ )//",
    r"      (  w  )",
    r"      /'---'\",
];

/// Oxi mid-hop: the whole crab is one row higher.
pub const OXI_JUMP: &[&str] = &[
    r" (\/)         (\/)",
    r"   \\  .---.  //",
    r"    \\( ^ ^ )//",
    r"      (  o  )",
    r"      /'---'\",
    "",
];

/// Oxi landed, with sparkles overhead. The last frame of a celebration.
pub const OXI_SPARKLE: &[&str] = &[
    r" *    .    +    .   *",
    r" (\/)         (\/)",
    r"   \\  .---.  //",
    r"    \\( ^ ^ )//",
    r"      (  w  )",
    r"      /'---'\",
];

/// The five bosses, in the order the acts reach them.
pub static BOSSES: [Boss; 5] = [
    Boss {
        quest: "boss1_receipt",
        name: "The Receipt Golem",
        act: "I",
        weak: "functions, loops, match and format strings",
        eye: 'o',
        art: &[
            r"    .-----------.",
            r" o==|  \@   @/  |==o",
            r"    |   .---.   |",
            r"    |===========|",
            r"     | ------- |",
            r"     | --- --- |",
            r"     '^v^v^v^v^'",
        ],
        taunt: "PAPER JAM. The Golem can't even read your code yet.",
        hurt: "Its totals still don't add up, and the columns wobble.",
        defeat: "The Golem prints one last receipt: PAID IN FULL.",
    },
    Boss {
        quest: "boss2_text_stats",
        name: "The Babel Beetle",
        act: "II",
        weak: "borrowing, &str slices and UTF-8",
        eye: 'o',
        art: &[
            r"      \     /",
            r"       (@ @)",
            r"    .-'-----'-.",
            r" --/  A  |  é  \--",
            r" --|  ß  |  ?  |--",
            r" --\  ü  |  #  /--",
            r"    '-.__|__.-'",
        ],
        taunt: "The Beetle clicks its shell. No compile, no count.",
        hurt: "Some words still slip through its shell uncounted.",
        defeat: "The shell cracks open. Every word counted, not one needless clone.",
    },
    Boss {
        quest: "boss3_ledger",
        name: "The Ledger Dragon",
        act: "III",
        weak: "enums, Result, HashMap and iterators",
        eye: 'o',
        art: &[
            r"      /\       /\",
            r"     /  '-----'  \",
            r" /\  |  \@   @/  |  /\",
            r"/  '-|   vvvvv   |-'  \",
            r"\     '.       .'     /",
            r" '-.   |  $$$  |   .-'",
            r"    (o)(o)(o)(o)(o)",
        ],
        taunt: "The Dragon curls around its ledger. Nothing compiles, nothing balances.",
        hurt: "Some accounts still don't balance.",
        defeat: "The Dragon lets go of the ledger. Every account balances.",
    },
    Boss {
        quest: "boss4_template",
        name: "The Template Mimic",
        act: "IV",
        weak: "traits, lifetimes and smart pointers",
        eye: 'O',
        art: &[
            r"    _______________",
            r"   /  \@       @/  \",
            r"  |=================|",
            r"  |V V V V V V V V V|",
            r"  |   {{  ~~~  }}   |",
            r"  |^ ^ ^ ^ ^ ^ ^ ^ ^|",
            r"  |=======[o]=======|",
            r"  '-----------------'",
        ],
        taunt: "The Mimic snaps shut on {{ }} and renders nothing.",
        hurt: "Some templates still come out with teeth marks.",
        defeat: "The chest creaks open. Every template renders clean.",
    },
    Boss {
        quest: "boss5_job_queue",
        name: "The Queue Hydra",
        act: "V",
        weak: "threads, channels, Arc and Mutex",
        eye: 'o',
        art: &[
            r"   [1]    [2]    [3]",
            r"  (@ @)  (@ @)  (@ @)",
            r"     \ \  | |  / /",
            r"      \ \ | | / /",
            r"    .-' '-' '-' '-.",
            r"   (  ~  ~  ~  ~   )__/",
            r"  ~~'~~~~~~~~~~~~~'~~~~~",
        ],
        taunt: "Three heads, zero workers. The queue doesn't even compile.",
        hurt: "Some jobs still get lost between the heads.",
        defeat: "All three heads nod off. Every job finished, none lost.",
    },
];

/// The boss guarding `quest`, if that quest has one.
pub fn boss_for(quest: &str) -> Option<&'static Boss> {
    BOSSES.iter().find(|b| b.quest == quest)
}

/// The art with every eye (`@`) replaced by `eye`.
pub fn eyes(art: &[&str], eye: char) -> Vec<String> {
    let eye = eye.to_string();
    art.iter().map(|line| line.replace('@', &eye)).collect()
}

/// A quest file's test count: its `#[test]` attributes.
pub fn count_tests(src: &str) -> usize {
    src.lines()
        .filter(|line| line.trim_start().starts_with("#[test]"))
        .count()
}

/// The HP bar as (filled, empty) cells. It is two cells per test, at most 24
/// wide. Any HP above zero shows at least one filled cell.
pub fn hp_cells(hp: usize, total: usize) -> (usize, usize) {
    let width = (total * 2).min(24);
    let filled = if hp == 0 || total == 0 {
        0
    } else {
        (hp * width / total).clamp(1, width)
    };
    (filled, width - filled)
}

/// Puts `right` beside `left`. The left column is padded to `left_width`
/// columns and the right lines start at row `right_from_row`. Rows past the
/// left column's height are indented under it. Trailing spaces are cut.
///
/// Left lines may carry ANSI colors: the width is measured without them, so a
/// colored line lines up with the same line uncolored.
pub fn side_by_side(
    left: &[String],
    right: &[String],
    left_width: usize,
    right_from_row: usize,
) -> Vec<String> {
    let rows = left.len().max(right_from_row + right.len());
    (0..rows)
        .map(|row| {
            let l = left.get(row).map_or("", String::as_str);
            let r = row
                .checked_sub(right_from_row)
                .and_then(|k| right.get(k))
                .map_or("", String::as_str);
            let pad = left_width.saturating_sub(visible_width(l));
            format!("{l}{}{r}", " ".repeat(pad)).trim_end().to_string()
        })
        .collect()
}

/// Columns a line takes up on screen: its chars, without ANSI color codes.
fn visible_width(line: &str) -> usize {
    strip_ansi(line).chars().count()
}

/// The line Oxi says after a passed quest. It depends only on the quest's name
/// and the number of passed quests, so the same state always gets the same line.
pub fn oxi_flavor(name: &str, solved: usize) -> &'static str {
    let sum: usize = name.bytes().map(usize::from).sum();
    OXI_LINES[(sum + solved) % OXI_LINES.len()]
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::quests;
    use std::fs;
    use std::path::Path;

    #[test]
    fn boss_art_fits_its_column() {
        for b in &BOSSES {
            for line in b.art {
                assert!(line.chars().count() <= 24, "{}: {line:?}", b.name);
            }
            assert!(
                b.art.iter().any(|l| l.contains('@')),
                "{} has no eyes",
                b.name
            );
            assert!(eyes(b.art, 'x').iter().all(|l| !l.contains('@')));
        }
    }

    /// The animation redraws by counting lines, so no line may wrap on an
    /// 80-column terminal.
    #[test]
    fn text_fits_80_columns() {
        for line in OXI_LINES {
            assert!(OXI_WIDTH + line.chars().count() <= 80, "{line}");
        }
        for b in &BOSSES {
            assert!(BOSS_WIDTH + "Weak to: ".len() + b.weak.chars().count() <= 80);
        }
    }

    #[test]
    fn oxi_frames_are_six_lines() {
        for frame in [OXI_GROUND, OXI_JUMP, OXI_SPARKLE] {
            assert_eq!(frame.len(), 6);
        }
    }

    #[test]
    fn boss_for_finds_bosses_by_quest() {
        assert_eq!(
            boss_for("boss3_ledger").map(|b| b.name),
            Some("The Ledger Dragon")
        );
        assert!(boss_for("move1").is_none());
    }

    #[test]
    fn bosses_and_quests_agree() {
        let path = Path::new(env!("CARGO_MANIFEST_DIR")).join("../quests/quests.toml");
        let text = fs::read_to_string(&path).expect("read quests.toml");
        let quests = quests::parse(&text).expect("parse quests.toml");
        for q in quests.iter().filter(|q| q.boss) {
            assert!(
                boss_for(&q.name).is_some(),
                "boss quest {} has no Boss",
                q.name
            );
        }
        for b in &BOSSES {
            assert!(
                quests.iter().any(|q| q.boss && q.name == b.quest),
                "{} is not a boss quest",
                b.quest
            );
        }
    }

    #[test]
    fn hp_bar_cells() {
        assert_eq!(hp_cells(8, 8), (16, 0));
        assert_eq!(hp_cells(0, 8), (0, 16));
        assert_eq!(hp_cells(3, 8), (6, 10));
        assert_eq!(hp_cells(1, 20), (1, 23));
        assert_eq!(hp_cells(20, 20), (24, 0));
    }

    #[test]
    fn counts_test_attributes() {
        let src = "#[test]\nfn a() {}\n    #[test]\nfn b() {}\n// #[test]\n#[test]\nfn c() {}";
        assert_eq!(count_tests(src), 3);
    }

    #[test]
    fn side_by_side_pads_by_chars() {
        let right = ["X".to_string()];
        let ascii = side_by_side(&["abc".to_string()], &right, 6, 0);
        let accented = side_by_side(&["aéc".to_string()], &right, 6, 0);
        let column = |line: &str| line.chars().position(|c| c == 'X');
        assert_eq!(column(&ascii[0]), Some(6));
        assert_eq!(column(&accented[0]), Some(6));
    }

    #[test]
    fn colored_left_lines_line_up() {
        let right = ["X".to_string()];
        let plain = side_by_side(&["abc".to_string()], &right, 6, 0);
        let colored = side_by_side(&["\u{1b}[1mabc\u{1b}[0m".to_string()], &right, 6, 0);
        assert_eq!(strip_ansi(&colored[0]), plain[0]);
    }

    #[test]
    fn oxi_flavor_is_stable() {
        let line = oxi_flavor("move1", 3);
        assert!(OXI_LINES.contains(&line));
        assert_eq!(oxi_flavor("move1", 3), line);
    }
}
