/* Chapter 13 (Iterators and closures): the Clo backpack scene, and the programs
   behind the "Pack Clo's backpack" widget. Every rust field is compiled by
   tools/check-snippets.mjs, and every caption was checked with rustc 1.97. */
(window.OX_MOTION = window.OX_MOTION || []).push({
  id: "ch13-backpack",
  title: "What Clo packs, closure by closure",
  w: 640,
  h: 300,
  rust: `fn main() {
    let n = 5;
    let add = |x: i32| x + n;
    println!("{}", add(1));

    let mut log = vec![0];
    let mut record = |x: i32| log.push(x);
    record(2);
    println!("{}", log.len());
    record(3);

    let plus = move |x: i32| x + n;
    println!("{}", plus(1));
    println!("n is still {n}");
}`,
  check: "E0502",
  actors: [
    { id: "clo", cast: "clo", x: 120, y: 200, size: 120, label: "Clo" },
    { id: "n", prop: "pebble", opts: { type: "i32", value: "5" }, x: 300, y: 90, size: 70, label: "n", hidden: true },
    { id: "copy", prop: "pebble", opts: { type: "i32", value: "5" }, x: 300, y: 165, size: 60, label: "copy of n", hidden: true },
    { id: "log", cast: "fluffy", x: 520, y: 110, size: 96, label: "log", hidden: true },
    { id: "err", prop: "errscroll", opts: { label: "E0502" }, x: 440, y: 205, size: 110, z: 5, hidden: true },
    { id: "ins", cast: "inspector", x: 580, y: 225, size: 100, label: "Inspector", hidden: true },
  ],
  beats: [
    {
      say: "<p><code>let n = 5;</code> makes a value outside every closure. Clo is a closure, and it packs whatever its body uses from outside.</p>",
      line: 2,
      do: [["pop", "n", 0], ["pose", "clo", "think", 1200]],
    },
    {
      say: "<p><code>|x| x + n</code> only reads <code>n</code>, so Clo packs glasses for it: a look. <code>n</code> stays where it is.</p>",
      line: 3,
      do: [["link", "look", "clo", "n", "ref", 300], ["pose", "clo", "talk", 1200, 400]],
    },
    {
      say: "<p>The glasses come off after <code>add(1)</code>, its last call. Then <code>|x| log.push(x)</code> changes <code>log</code>, so Clo packs the lock.</p>",
      line: 7,
      do: [
        ["unlink", "look", 0],
        ["pop", "log", 300],
        ["link", "lock", "clo", "log", "mut", 700],
      ],
    },
    {
      say: "<p>Line 9 reads <code>log</code> while <code>record</code> is still alive, and Clo still holds the lock.</p>",
      line: 9,
      ask: {
        q: "Clo holds the lock on <code>log</code>. Can line 9 call <code>log.len()</code>?",
        choices: ["Yes, log is only a Vec", "No, record is called again on line 10"],
        answer: 1,
        explain: "record is used again on line 10, so the lock is still needed. The Inspector stamps E0502 on line 9.",
      },
      do: [
        ["pop", "ins", 0],
        ["pop", "err", 300],
        ["shake", "log", 500],
      ],
    },
    {
      say: "<p><code>record(3)</code> on line 10 is the last call. After it, the lock comes off.</p>",
      line: 10,
      do: [["unlink", "lock", 0]],
    },
    {
      say: "<p><code>move |x| x + n</code> packs <code>n</code> itself. An <code>i32</code> is <code>Copy</code>, so Clo gets its own copy, and <code>n</code> stays with main.</p>",
      line: 12,
      do: [
        ["pop", "copy", 0],
        ["arc", "copy", { x: 120, y: 92 }, 650, 250, 60],
        ["link", "own", "clo", "copy", "own", 700],
      ],
    },
    {
      say: "<p>Only line 9 is rejected. Move that read below line 10, and the whole program is accepted.</p>",
      line: 9,
      do: [["pose", "clo", "think", 1200]],
    },
  ],
});

/* The widget "Pack Clo's backpack" (site/chapters/13-iterators-closures.html).
   Each entry is one program that rustc checks. For a captured variable the
   reader picks look, change or take; the entry with truth: true is the
   capture the compiler really makes, and the others show what that answer
   would mean. */
window.OX_CH13_PACK = [
  {
    id: "greet-look", closure: "greet", mode: "look", truth: true,
    rust: `fn main() {
    let name = String::from("Ana");
    let greet = || println!("hello {name}");
    println!("main sees {name}");
    greet();
}`,
    check: "ok",
    stdout: "main sees Ana\nhello Ana",
    say: "A look is a shared borrow. greet only reads name, so main may read it too, and both lines run.",
  },
  {
    id: "greet-change", closure: "greet", mode: "change",
    rust: `fn main() {
    let mut name = String::from("Ana");
    let mut greet = || name.push('!');
    println!("main sees {name}");
    greet();
}`,
    check: "E0502",
    say: "A change needs the lock. greet would hold name for writing, so main may not read name while greet is still needed.",
  },
  {
    id: "greet-take", closure: "greet", mode: "take",
    rust: `fn main() {
    let name = String::from("Ana");
    let greet = move || println!("hello {name}");
    println!("main sees {name}");
    greet();
}`,
    check: "E0382",
    say: "A take is a move. The closure gets the String itself, so main has no name left to read.",
  },
  {
    id: "record-look", closure: "record", mode: "look",
    rust: `fn main() {
    let log = vec![1, 2];
    let record = || println!("record sees {}", log.len());
    println!("main sees {:?}", log);
    record();
}`,
    check: "ok",
    stdout: "main sees [1, 2]\nrecord sees 2",
    say: "A look only reads log. record and main can both read the Vec, so both lines run.",
  },
  {
    id: "record-change", closure: "record", mode: "change", truth: true,
    rust: `fn main() {
    let mut log = vec![1, 2];
    let mut record = || log.push(4);
    println!("main sees {:?}", log);
    record();
}`,
    check: "E0502",
    say: "A change holds the lock. record pushes to log, so main may not read log until record's last call is over.",
  },
  {
    id: "record-take", closure: "record", mode: "take",
    rust: `fn main() {
    let mut log = vec![1, 2];
    let mut record = move || log.push(4);
    println!("main sees {:?}", log);
    record();
}`,
    check: "E0382",
    say: "A take gives record the Vec itself, so main has no log left to read.",
  },
  {
    id: "finish-look", closure: "finish", mode: "look",
    rust: `fn main() {
    let ticket = String::from("A-17");
    let finish = || println!("ticket {ticket}");
    println!("main sees {ticket}");
    finish();
}`,
    check: "ok",
    stdout: "main sees A-17\nticket A-17",
    say: "A look only reads ticket, so main may read it too. finish has to own ticket, because it gives the String away.",
  },
  {
    id: "finish-change", closure: "finish", mode: "change",
    rust: `fn main() {
    let mut ticket = String::from("A-17");
    let mut finish = || ticket.push_str("-done");
    println!("main sees {ticket}");
    finish();
}`,
    check: "E0502",
    say: "A change holds the lock on ticket, so main can't read it while finish is still needed.",
  },
  {
    id: "finish-take", closure: "finish", mode: "take", truth: true,
    rust: `fn main() {
    let ticket = String::from("A-17");
    let finish = || drop(ticket);
    println!("main sees {ticket}");
    finish();
}`,
    check: "E0382",
    say: "drop(ticket) moves the String into finish, so the closure takes it. main can't read ticket after that.",
  },
  {
    id: "ship-look", closure: "ship", mode: "look",
    rust: `fn main() {
    let order = String::from("A-17");
    let ship = || println!("shipping {order}");
    println!("main sees {order}");
    ship();
}`,
    check: "ok",
    stdout: "main sees A-17\nshipping A-17",
    say: "A look: ship only reads order, so main may read it too.",
  },
  {
    id: "ship-change", closure: "ship", mode: "change",
    rust: `fn main() {
    let mut order = String::from("A-17");
    let mut ship = || order.push_str("-rush");
    println!("main sees {order}");
    ship();
}`,
    check: "E0502",
    say: "A change holds the lock on order. main can't read order while ship is still needed.",
  },
  {
    id: "ship-take", closure: "ship", mode: "take", truth: true,
    rust: `fn main() {
    let order = String::from("A-17");
    let ship = move || println!("shipping {order}");
    println!("main sees {order}");
    ship();
}`,
    check: "E0382",
    say: "The move keyword gives ship the String, even though its body only reads it. main can't read order afterwards.",
  },
];
