/* Agent Code Review Dojo: the cases.
   Each case is a program an AI agent wrote for the task. `rust` is that
   program as written; `smells` name the 1-based lines of `rust` a senior
   reviewer would flag (lines shared by a smell are one finding). `idiomatic`
   is the reviewed version. It prints the same as `rust` except in the two
   cases where the fix changes behavior on purpose: audit-log and
   webhook-handler (the agent version hid a failure). Both must compile
   (tools/check-snippets.mjs). */
window.OX_DOJO = [
  {
    id: "invoice-total",
    title: "Invoice total",
    task: "Add a function that totals an invoice's line items for the PDF footer, and a helper that lists the item descriptions.",
    chapter: 7,
    check: "ok",
    rust: String.raw`#[derive(Debug, Clone)]
struct LineItem {
    description: String,
    unit_cents: u64,
    quantity: u64,
}

#[derive(Debug, Clone)]
struct Invoice {
    number: String,
    items: Vec<LineItem>,
}

fn amount_due(items: &Vec<LineItem>) -> u64 {
    let mut total = 0;
    for item in items.clone() {
        total += item.unit_cents * item.quantity;
    }
    total
}

fn describe(invoice: &Invoice) -> String {
    let mut out = String::new();
    for item in invoice.items.clone() {
        out.push_str(&item.description.clone());
        out.push('\n');
    }
    out
}

fn main() {
    let invoice = Invoice {
        number: "INV-1042".into(),
        items: vec![
            LineItem { description: "Hosting, monthly".into(), unit_cents: 2900, quantity: 1 },
            LineItem { description: "Extra seats".into(), unit_cents: 450, quantity: 3 },
        ],
    };
    println!("{}", invoice.number);
    print!("{}", describe(&invoice));
    println!("due: {}", amount_due(&invoice.items));
}`,
    smells: [
      { lines: [14], kind: "&Vec<T> parameter", severity: "idiom",
        explain: "<p><code>&amp;Vec&lt;LineItem&gt;</code> accepts one container type, so a caller that holds an array or a slice has to build a <code>Vec</code> first. Take <code>&amp;[LineItem]</code> instead. A <code>&amp;Vec</code> coerces to it, and so does an array or a slice.</p>" },
      { lines: [16], kind: "needless clone", severity: "perf",
        explain: "<p><code>items.clone()</code> copies every line item, including each description <code>String</code>, so the loop can take them by value. The loop only reads them. Iterate the borrowed slice and nothing is copied.</p>" },
      { lines: [24, 25], kind: "needless clone", severity: "perf",
        explain: "<p>The loop clones the whole <code>Vec</code>, and the body then clones each description only to borrow it again. <code>&amp;item.description</code> is already a reference. Each clone here is an allocation the function never needed.</p>" },
    ],
    idiomatic: String.raw`#[derive(Debug, Clone)]
struct LineItem {
    description: String,
    unit_cents: u64,
    quantity: u64,
}

#[derive(Debug, Clone)]
struct Invoice {
    number: String,
    items: Vec<LineItem>,
}

fn amount_due(items: &[LineItem]) -> u64 {
    items.iter().map(|item| item.unit_cents * item.quantity).sum()
}

fn describe(invoice: &Invoice) -> String {
    let mut out = String::new();
    for item in &invoice.items {
        out.push_str(&item.description);
        out.push('\n');
    }
    out
}

fn main() {
    let invoice = Invoice {
        number: "INV-1042".into(),
        items: vec![
            LineItem { description: "Hosting, monthly".into(), unit_cents: 2900, quantity: 1 },
            LineItem { description: "Extra seats".into(), unit_cents: 450, quantity: 3 },
        ],
    };
    println!("{}", invoice.number);
    print!("{}", describe(&invoice));
    println!("due: {}", amount_due(&invoice.items));
}`,
    takeaway: "A clone in a review is a question: does this code need its own copy, or does it only need a look? Here it only needs a look.",
  },
  {
    id: "port-from-config",
    title: "Port from config",
    task: "Write the function in the shared crate that reads the HTTP port and the worker count from the config text.",
    chapter: 11,
    check: "ok",
    rust: String.raw`use std::collections::HashMap;

// Shared config parser used by the API and the worker.
fn parse_config(text: &str) -> HashMap<String, String> {
    let mut map = HashMap::new();
    for line in text.lines() {
        if let Some((key, value)) = line.split_once('=') {
            map.insert(key.trim().to_string(), value.trim().to_string());
        }
    }
    map
}

fn http_port(config: &HashMap<String, String>) -> u16 {
    match config.get("PORT") {
        Some(raw) => raw.parse().unwrap(),
        None => 8080,
    }
}

fn worker_threads(config: &HashMap<String, String>) -> usize {
    config
        .get("WORKERS")
        .map(|w| w.parse().expect("WORKERS must be a number"))
        .unwrap_or(4)
}

fn main() {
    let config = parse_config("PORT = 9000\nWORKERS=2");
    println!("port {}", http_port(&config));
    println!("workers {}", worker_threads(&config));
}`,
    smells: [
      { lines: [16, 24], kind: "unwrap or expect on input", severity: "bug",
        explain: "<p>Config values are typed by people. <code>PORT=eighty</code> makes <code>unwrap()</code> panic inside a library, and the caller crashes with a message it cannot handle. Return a <code>Result</code> that names the bad key, and let the binary decide whether to stop.</p>" },
      { lines: [17, 25], kind: "magic numbers", severity: "idiom",
        explain: "<p><code>8080</code> and <code>4</code> sit in the logic with no name, so the next reader cannot tell a default from an accident. Name them as constants, so each default is written once and is easy to find.</p>" },
    ],
    idiomatic: String.raw`use std::collections::HashMap;
use std::fmt;
use std::num::ParseIntError;

const DEFAULT_PORT: u16 = 8080;
const DEFAULT_WORKERS: usize = 4;

#[derive(Debug)]
enum ConfigError {
    BadNumber { key: &'static str, source: ParseIntError },
}

impl fmt::Display for ConfigError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ConfigError::BadNumber { key, source } => {
                write!(f, "{key} must be a number: {source}")
            }
        }
    }
}

impl std::error::Error for ConfigError {}

// Shared config parser used by the API and the worker.
fn parse_config(text: &str) -> HashMap<String, String> {
    let mut map = HashMap::new();
    for line in text.lines() {
        if let Some((key, value)) = line.split_once('=') {
            map.insert(key.trim().to_string(), value.trim().to_string());
        }
    }
    map
}

fn http_port(config: &HashMap<String, String>) -> Result<u16, ConfigError> {
    match config.get("PORT") {
        Some(raw) => raw
            .parse()
            .map_err(|source| ConfigError::BadNumber { key: "PORT", source }),
        None => Ok(DEFAULT_PORT),
    }
}

fn worker_threads(config: &HashMap<String, String>) -> Result<usize, ConfigError> {
    match config.get("WORKERS") {
        Some(raw) => raw
            .parse()
            .map_err(|source| ConfigError::BadNumber { key: "WORKERS", source }),
        None => Ok(DEFAULT_WORKERS),
    }
}

fn main() -> Result<(), ConfigError> {
    let config = parse_config("PORT = 9000\nWORKERS=2");
    println!("port {}", http_port(&config)?);
    println!("workers {}", worker_threads(&config)?);
    Ok(())
}`,
    takeaway: "Library code returns errors and leaves the decision to panic to <code>main</code>.",
  },
  {
    id: "normalize-username",
    title: "Normalize a username",
    task: "Add a helper that normalizes a username before it is compared with the database, and a lookup that uses it.",
    chapter: 8,
    check: "ok",
    rust: String.raw`fn normalize(name: String) -> String {
    name.trim().to_lowercase()
}

fn is_reserved(name: &str) -> bool {
    let reserved = ["admin", "root", "support"];
    reserved.contains(&name)
}

struct Account {
    username: String,
}

fn find<'a>(accounts: &'a [Account], wanted: &str) -> Option<&'a Account> {
    let key = normalize(wanted.to_string());
    accounts.iter().find(|a| a.username == key.clone())
}

fn main() {
    let accounts = vec![
        Account { username: "ana".to_string() },
        Account { username: "bo".to_string() },
    ];
    let typed = String::from("  Ana ");
    let name = normalize(typed.clone());
    println!("normalized: {name}");
    println!("reserved: {}", is_reserved(&name));
    match find(&accounts, &typed) {
        Some(acc) => println!("found: {}", acc.username),
        None => println!("not found"),
    }
}`,
    smells: [
      { lines: [1, 15, 25], kind: "String where &str suffices", severity: "idiom",
        explain: "<p><code>normalize</code> only reads its input, but it asks for a <code>String</code>. Every caller must hand over an owned value, so the code allocates just to satisfy the signature. Take <code>&amp;str</code>, which accepts a literal, a <code>&amp;String</code>, or a part of a longer string.</p>" },
      { lines: [16], kind: "needless clone", severity: "perf",
        explain: "<p><code>key.clone()</code> copies the key for every account it compares. <code>==</code> compares the two strings without taking ownership, so the clone buys nothing.</p>" },
    ],
    idiomatic: String.raw`fn normalize(name: &str) -> String {
    name.trim().to_lowercase()
}

fn is_reserved(name: &str) -> bool {
    ["admin", "root", "support"].contains(&name)
}

struct Account {
    username: String,
}

fn find<'a>(accounts: &'a [Account], wanted: &str) -> Option<&'a Account> {
    let key = normalize(wanted);
    accounts.iter().find(|a| a.username == key)
}

fn main() {
    let accounts = vec![
        Account { username: "ana".to_string() },
        Account { username: "bo".to_string() },
    ];
    let typed = String::from("  Ana ");
    let name = normalize(&typed);
    println!("normalized: {name}");
    println!("reserved: {}", is_reserved(&name));
    match find(&accounts, &typed) {
        Some(acc) => println!("found: {}", acc.username),
        None => println!("not found"),
    }
}`,
    takeaway: "Ask for the view a function needs: borrow to read, and take ownership only when the value will be stored.",
  },
  {
    id: "settings-loader",
    title: "Settings loader",
    task: "Write the settings loader that the shared crate exports, so the CLI and the web app can both call it.",
    chapter: 11,
    check: "ok",
    rust: String.raw`use std::collections::BTreeMap;
use std::error::Error;

pub struct Settings {
    values: BTreeMap<String, String>,
}

impl Settings {
    pub fn load(
        source: &String,
    ) -> Result<Settings, Box<dyn Error>> {
        let mut values = BTreeMap::new();
        for (number, line) in source.lines().enumerate() {
            let line = line.trim();
            if line.is_empty() || line.starts_with('#') {
                continue;
            }
            let (key, value) = line
                .split_once('=')
                .ok_or_else(|| format!("line {}: expected KEY=VALUE", number + 1))?;
            values.insert(key.trim().to_string(), value.trim().to_string());
        }
        Ok(Settings { values })
    }

    pub fn get(&self, key: &str) -> Option<&str> {
        self.values.get(key).map(String::as_str)
    }
}

fn main() -> Result<(), Box<dyn Error>> {
    let text = String::from("# demo\nname = shop\nretries=3\n");
    let settings = Settings::load(&text)?;
    println!("name={}", settings.get("name").unwrap_or("?"));
    println!("retries={}", settings.get("retries").unwrap_or("?"));
    Ok(())
}`,
    smells: [
      { lines: [11], kind: "Box<dyn Error> in a library API", severity: "design",
        explain: "<p>Callers of this function can only print the error. They cannot match on the cases (a line with no <code>=</code>, for example) to give a useful message. A library should export a small error enum that implements <code>Error</code>. Keep <code>Box&lt;dyn Error&gt;</code> for <code>main</code>, where printing is all that is left to do.</p>" },
      { lines: [10], kind: "&String parameter", severity: "idiom",
        explain: "<p><code>source: &amp;String</code> accepts only a <code>String</code> reference, so a string literal or a slice cannot be passed without first allocating. Take <code>&amp;str</code>.</p>" },
    ],
    idiomatic: String.raw`use std::collections::BTreeMap;
use std::fmt;

#[derive(Debug, PartialEq)]
pub enum SettingsError {
    MissingEquals { line: usize },
}

impl fmt::Display for SettingsError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            SettingsError::MissingEquals { line } => {
                write!(f, "line {line}: expected KEY=VALUE")
            }
        }
    }
}

impl std::error::Error for SettingsError {}

pub struct Settings {
    values: BTreeMap<String, String>,
}

impl Settings {
    pub fn load(source: &str) -> Result<Settings, SettingsError> {
        let mut values = BTreeMap::new();
        for (number, line) in source.lines().enumerate() {
            let line = line.trim();
            if line.is_empty() || line.starts_with('#') {
                continue;
            }
            let (key, value) = line
                .split_once('=')
                .ok_or(SettingsError::MissingEquals { line: number + 1 })?;
            values.insert(key.trim().to_string(), value.trim().to_string());
        }
        Ok(Settings { values })
    }

    pub fn get(&self, key: &str) -> Option<&str> {
        self.values.get(key).map(String::as_str)
    }
}

fn main() -> Result<(), SettingsError> {
    let text = String::from("# demo\nname = shop\nretries=3\n");
    let settings = Settings::load(&text)?;
    println!("name={}", settings.get("name").unwrap_or("?"));
    println!("retries={}", settings.get("retries").unwrap_or("?"));
    Ok(())
}`,
    takeaway: "The error type is part of a library's API, so give it a real type.",
  },
  {
    id: "word-count-threads",
    title: "Word count in threads",
    task: "Count the words in each chapter on separate threads, and return the totals in chapter order.",
    chapter: 18,
    check: "ok",
    rust: String.raw`use std::sync::{Arc, Mutex};
use std::thread;

fn count_words(chapters: Vec<String>) -> Vec<usize> {
    let results = Arc::new(Mutex::new(Vec::new()));
    let mut handles = Vec::new();
    for (index, text) in chapters.into_iter().enumerate() {
        let results = Arc::clone(&results);
        handles.push(thread::spawn(move || {
            let words = text.split_whitespace().count();
            results.lock().unwrap().push((index, words));
        }));
    }
    for handle in handles {
        handle.join().unwrap();
    }
    let mut pairs = results.lock().unwrap().clone();
    pairs.sort();
    pairs.into_iter().map(|(_, words)| words).collect()
}

fn main() {
    let chapters = vec![
        String::from("ownership is one owner"),
        String::from("borrowing is many readers or one writer"),
    ];
    println!("{:?}", count_words(chapters));
}`,
    smells: [
      { lines: [5, 8, 11], kind: "Arc<Mutex<_>> where ownership works", severity: "design",
        explain: "<p>Every thread writes into one shared, locked <code>Vec</code>, so the locking and the sort are now part of the design. Each thread owns its input and can simply return its count. <code>thread::spawn</code> hands that value to <code>join</code>, and no shared state is needed at all.</p>" },
      { lines: [17], kind: "needless clone", severity: "perf",
        explain: "<p><code>.clone()</code> copies the whole locked <code>Vec</code> only so it can be sorted. Once the threads return their values, nothing is shared, so the results can be collected in order without a copy.</p>" },
    ],
    idiomatic: String.raw`use std::thread;

fn count_words(chapters: Vec<String>) -> Vec<usize> {
    // Collect first: every thread must start before we wait on any of them.
    let handles: Vec<_> = chapters
        .into_iter()
        .map(|text| thread::spawn(move || text.split_whitespace().count()))
        .collect();
    handles
        .into_iter()
        .map(|handle| handle.join().expect("word count thread panicked"))
        .collect()
}

fn main() {
    let chapters = vec![
        String::from("ownership is one owner"),
        String::from("borrowing is many readers or one writer"),
    ];
    println!("{:?}", count_words(chapters));
}`,
    takeaway: "Move the data into the thread and return the result from <code>join</code>; reach for <code>Arc</code> and <code>Mutex</code> only when several owners must change the same thing.",
  },
  {
    id: "job-status",
    title: "Job status",
    task: "Add a status to jobs, a function that picks the label the dashboard shows, and a retry check.",
    chapter: 10,
    check: "ok",
    rust: String.raw`#[derive(Debug)]
struct Job {
    id: u32,
    status: String,
    attempts: u32,
}

fn set_status(job: &mut Job, next: &str) {
    job.status = next.to_string();
}

fn label(job: &Job) -> &'static str {
    match job.status.as_str() {
        "queued" => "Waiting",
        "running" => "In progress",
        "done" => "Finished",
        "failed" => "Needs attention",
        _ => "Unknown",
    }
}

fn mark_failed(job: &mut Job) {
    set_status(job, "failed");
    job.attempts += 1;
}

fn can_retry(job: &Job) -> bool {
    job.status == "failed" && job.attempts < 3
}

fn main() {
    let mut job = Job { id: 7, status: "queued".to_string(), attempts: 0 };
    println!("job {}: {}", job.id, label(&job));
    set_status(&mut job, "running");
    println!("job {}: {}", job.id, label(&job));
    mark_failed(&mut job);
    println!("retry: {}", can_retry(&job));
}`,
    smells: [
      { lines: [4, 8, 13, 28], kind: "stringly-typed status", severity: "design",
        explain: "<p>The status is a <code>String</code>, so <code>\"runnning\"</code> compiles and gets stored. Nothing lists the valid states, and every comparison repeats the spelling. An enum makes the states a closed list that <code>match</code> can check.</p>" },
      { lines: [18], kind: "catch-all arm hides new states", severity: "bug",
        explain: "<p>The <code>_ =&gt; \"Unknown\"</code> arm turns every unexpected string into a label, so a typo shows up as \"Unknown\" and nothing reports it. With an enum and no catch-all arm, a new state makes the <code>match</code> fail to compile until someone handles it.</p>" },
    ],
    idiomatic: String.raw`#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum Status {
    Queued,
    Running,
    Done,
    Failed,
}

impl Status {
    fn label(self) -> &'static str {
        match self {
            Status::Queued => "Waiting",
            Status::Running => "In progress",
            Status::Done => "Finished",
            Status::Failed => "Needs attention",
        }
    }
}

#[derive(Debug)]
struct Job {
    id: u32,
    status: Status,
    attempts: u32,
}

fn mark_failed(job: &mut Job) {
    job.status = Status::Failed;
    job.attempts += 1;
}

fn can_retry(job: &Job) -> bool {
    job.status == Status::Failed && job.attempts < 3
}

fn main() {
    let mut job = Job { id: 7, status: Status::Queued, attempts: 0 };
    println!("job {}: {}", job.id, job.status.label());
    job.status = Status::Running;
    println!("job {}: {}", job.id, job.status.label());
    mark_failed(&mut job);
    println!("retry: {}", can_retry(&job));
}`,
    takeaway: "Model a closed set of states as an enum, so the compiler finds every place that has to change.",
  },
  {
    id: "audit-log",
    title: "Audit log",
    task: "Write an audit line for every charge, and make sure a failed audit write cannot go unnoticed.",
    chapter: 11,
    check: "ok",
    rust: String.raw`use std::io::{self, Write};

struct Payment {
    id: u32,
    amount_cents: u64,
}

fn audit<W: Write>(out: &mut W, payment: &Payment) {
    let _ = writeln!(out, "payment {} {}", payment.id, payment.amount_cents);
    let _ = out.flush();
}

fn charge<W: Write>(out: &mut W, payment: &Payment) -> bool {
    audit(out, payment);
    payment.amount_cents > 0
}

struct Full;

impl Write for Full {
    fn write(&mut self, _buf: &[u8]) -> io::Result<usize> {
        Err(io::Error::new(io::ErrorKind::StorageFull, "disk full"))
    }

    fn flush(&mut self) -> io::Result<()> {
        Ok(())
    }
}

fn main() {
    let payment = Payment { id: 42, amount_cents: 1999 };
    let mut sink = Vec::new();
    println!("charged: {}", charge(&mut sink, &payment));
    println!("audit bytes: {}", sink.len());
    let mut full = Full;
    println!("charged: {}", charge(&mut full, &payment));
}`,
    smells: [
      { lines: [9, 10], kind: "ignored Result (let _ =)", severity: "bug",
        explain: "<p><code>let _ =</code> throws the error away. On a full disk the audit line is lost, and <code>charge</code> still reports success. Nothing in the program knows a record is missing. Use <code>?</code> to pass the error up.</p>" },
      { lines: [8], kind: "no way to report failure", severity: "design",
        explain: "<p><code>audit</code> returns nothing, so its caller cannot react when the write fails. Return <code>io::Result&lt;()&gt;</code>, and let the caller decide whether a missing audit line should stop the charge.</p>" },
    ],
    idiomatic: String.raw`use std::io::{self, Write};

struct Payment {
    id: u32,
    amount_cents: u64,
}

fn audit<W: Write>(out: &mut W, payment: &Payment) -> io::Result<()> {
    writeln!(out, "payment {} {}", payment.id, payment.amount_cents)?;
    out.flush()
}

fn charge<W: Write>(out: &mut W, payment: &Payment) -> io::Result<bool> {
    audit(out, payment)?;
    Ok(payment.amount_cents > 0)
}

struct Full;

impl Write for Full {
    fn write(&mut self, _buf: &[u8]) -> io::Result<usize> {
        Err(io::Error::new(io::ErrorKind::StorageFull, "disk full"))
    }

    fn flush(&mut self) -> io::Result<()> {
        Ok(())
    }
}

fn main() {
    let payment = Payment { id: 42, amount_cents: 1999 };
    let mut sink = Vec::new();
    match charge(&mut sink, &payment) {
        Ok(ok) => println!("charged: {ok}"),
        Err(e) => println!("charge failed: {e}"),
    }
    println!("audit bytes: {}", sink.len());
    let mut full = Full;
    match charge(&mut full, &payment) {
        Ok(ok) => println!("charged: {ok}"),
        Err(e) => println!("charge failed: {e}"),
    }
}`,
    takeaway: "A <code>Result</code> you throw away is a decision made without telling anyone.",
  },
  {
    id: "even-squares",
    title: "Even squares",
    task: "Write a function that returns the sum of the squares of the even readings.",
    chapter: 13,
    check: "ok",
    rust: String.raw`fn even_squares_total(readings: &[i64]) -> i64 {
    let mut evens = Vec::new();
    for i in 0..readings.len() {
        if readings[i] % 2 == 0 {
            evens.push(readings[i]);
        }
    }
    let squares: Vec<i64> = evens.iter().map(|x| x * x).collect();
    let mut total = 0;
    for i in 0..squares.len() {
        total += squares[i];
    }
    total
}

fn main() {
    let readings = vec![3, 4, 7, 10, -2];
    println!("total: {}", even_squares_total(&readings));
}`,
    smells: [
      { lines: [3, 4, 5, 10, 11], kind: "index loops", severity: "idiom",
        explain: "<p>Both loops walk a slice by position and do the bookkeeping by hand, and each index gets a bounds check. A <code>for</code> over the slice, or an iterator chain, says what the loop does and cannot go out of range.</p>" },
      { lines: [8], kind: "collect then iterate again", severity: "perf",
        explain: "<p><code>squares</code> is collected into a new <code>Vec</code> only so the loop below can walk it once. An iterator chain can feed <code>sum</code> directly, with no intermediate allocation.</p>" },
    ],
    idiomatic: String.raw`fn even_squares_total(readings: &[i64]) -> i64 {
    readings
        .iter()
        .filter(|&&x| x % 2 == 0)
        .map(|&x| x * x)
        .sum()
}

fn main() {
    let readings = vec![3, 4, 7, 10, -2];
    println!("total: {}", even_squares_total(&readings));
}`,
    takeaway: "Iterator chains are lazy: nothing is computed or allocated until a consumer such as <code>sum</code> or <code>collect</code> asks for it.",
  },
  {
    id: "frame-lengths",
    title: "Frame lengths",
    task: "Write a reader for the binary frame format: a 4-byte little-endian length, then that many bytes. Return each frame's length.",
    chapter: 21,
    check: "ok",
    rust: String.raw`fn read_u32_le(bytes: &[u8], offset: usize) -> u32 {
    unsafe {
        let ptr = bytes.as_ptr().add(offset) as *const u32;
        u32::from_le(ptr.read_unaligned())
    }
}

fn frame_lengths(bytes: &[u8]) -> Vec<u32> {
    let mut lengths = Vec::new();
    let mut offset = 0;
    while offset + 4 <= bytes.len() {
        let len = read_u32_le(bytes, offset);
        lengths.push(len);
        offset += 4 + len as usize;
    }
    lengths
}

fn main() {
    let bytes = [3, 0, 0, 0, b'a', b'b', b'c', 1, 0, 0, 0, b'z'];
    println!("{:?}", frame_lengths(&bytes));
}`,
    smells: [
      { lines: [2], kind: "unsafe without SAFETY", severity: "bug",
        explain: "<p>The <code>unsafe</code> block has no <code>// SAFETY:</code> comment. A reviewer cannot check the reasoning, and the next edit can break the invariant without anyone noticing. Write down which condition makes the read sound.</p>" },
      { lines: [1, 3, 4], kind: "unchecked read in a safe function", severity: "bug",
        explain: "<p><code>read_u32_le</code> is a safe function that reads four bytes at any <code>offset</code>. An offset near the end of the slice reads past the buffer, which is undefined behavior. A safe function must never be able to cause that. Check the range and return an <code>Option</code>.</p>" },
    ],
    idiomatic: String.raw`fn read_u32_le(bytes: &[u8], offset: usize) -> Option<u32> {
    let window = bytes.get(offset..offset.checked_add(4)?)?;
    let array: [u8; 4] = window.try_into().ok()?;
    Some(u32::from_le_bytes(array))
}

fn frame_lengths(bytes: &[u8]) -> Vec<u32> {
    let mut lengths = Vec::new();
    let mut offset = 0;
    while let Some(len) = read_u32_le(bytes, offset) {
        lengths.push(len);
        offset = offset.saturating_add(4).saturating_add(len as usize);
    }
    lengths
}

fn main() {
    let bytes = [3, 0, 0, 0, b'a', b'b', b'c', 1, 0, 0, 0, b'z'];
    println!("{:?}", frame_lengths(&bytes));
}`,
    takeaway: "Use <code>unsafe</code> only with a stated invariant, and never let a safe function break one.",
  },
  {
    id: "display-names",
    title: "Display names",
    task: "Add helpers that pick the name to show for a user, and the first tag of a post.",
    chapter: 15,
    check: "ok",
    rust: String.raw`struct User {
    first: String,
    nickname: Option<String>,
}

fn display_name<'a>(user: &'a User) -> &'a str {
    return match &user.nickname {
        Some(name) => name.as_str(),
        None => user.first.as_str(),
    };
}

fn first_tag<'a>(tags: &'a [String]) -> &'a str {
    return tags.first().map(String::as_str).unwrap_or("untagged");
}

fn main() {
    let user = User { first: "Ana".to_string(), nickname: None };
    println!("{}", display_name(&user));
    let tags = vec!["rust".to_string(), "php".to_string()];
    println!("{}", first_tag(&tags));
}`,
    smells: [
      { lines: [6, 13], kind: "explicit lifetimes", severity: "idiom",
        explain: "<p>Each function takes exactly one reference, so lifetime elision already ties the result to it. Writing <code>&lt;'a&gt;</code> adds noise: the compiler would infer the same lifetime. Write <code>fn display_name(user: &amp;User) -&gt; &amp;str</code>.</p>" },
      { lines: [7, 14], kind: "needless return", severity: "idiom",
        explain: "<p>A <code>return</code> at the end of a function does nothing extra: the last expression is already the value. Remove the keyword, and the semicolon after the expression.</p>" },
    ],
    idiomatic: String.raw`struct User {
    first: String,
    nickname: Option<String>,
}

fn display_name(user: &User) -> &str {
    match &user.nickname {
        Some(name) => name,
        None => &user.first,
    }
}

fn first_tag(tags: &[String]) -> &str {
    tags.first().map(String::as_str).unwrap_or("untagged")
}

fn main() {
    let user = User { first: "Ana".to_string(), nickname: None };
    println!("{}", display_name(&user));
    let tags = vec!["rust".to_string(), "php".to_string()];
    println!("{}", first_tag(&tags));
}`,
    takeaway: "Let elision and the final expression do the work, and write lifetimes only where the compiler asks for them.",
  },
  {
    id: "point-derive",
    title: "Point type",
    task: "Add a Point type for the geometry module, with copying, equality, debug output and a default value.",
    chapter: 9,
    check: "ok",
    rust: String.raw`use std::fmt;

struct Point {
    x: i32,
    y: i32,
}

impl Clone for Point {
    fn clone(&self) -> Self {
        Point { x: self.x, y: self.y }
    }
}

impl PartialEq for Point {
    fn eq(&self, other: &Point) -> bool {
        self.x == other.x && self.y == other.y
    }
}

impl fmt::Debug for Point {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        f.debug_struct("Point").field("x", &self.x).field("y", &self.y).finish()
    }
}

impl Default for Point {
    fn default() -> Self {
        Point { x: 0, y: 0 }
    }
}

fn main() {
    let origin = Point::default();
    let copy = origin.clone();
    println!("{:?} equal={}", copy, origin == copy);
}`,
    smells: [
      { lines: [8, 9, 10, 11, 12], kind: "manual Clone", severity: "idiom",
        explain: "<p>This <code>Clone</code> copies each field, which is exactly what <code>#[derive(Clone)]</code> writes. Add <code>Copy</code> as well. Two integers are cheap to copy, and <code>Copy</code> lets callers pass a point around without <code>.clone()</code>.</p>" },
      { lines: [14, 15, 16, 17, 18], kind: "manual PartialEq", severity: "idiom",
        explain: "<p>Field-by-field equality is what <code>#[derive(PartialEq)]</code> generates. A hand-written version has to be updated by hand when a field is added, and the compiler will not remind you. Derive it, and derive <code>Eq</code> with it.</p>" },
      { lines: [20, 21, 22, 23, 24], kind: "manual Debug", severity: "idiom",
        explain: "<p>The <code>debug_struct</code> chain prints the same text that <code>#[derive(Debug)]</code> prints. Writing it by hand adds code that must be kept in step with the fields, and gives you nothing in return.</p>" },
      { lines: [26, 27, 28, 29, 30], kind: "manual Default", severity: "idiom",
        explain: "<p>A default of zero for every field is what <code>#[derive(Default)]</code> produces. Derive it, so the default follows the struct when a field is added.</p>" },
    ],
    idiomatic: String.raw`#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
struct Point {
    x: i32,
    y: i32,
}

fn main() {
    let origin = Point::default();
    let copy = origin;
    println!("{:?} equal={}", copy, origin == copy);
}`,
    takeaway: "Derive what the compiler can write exactly; hand-write a trait impl only when the behavior has to differ.",
  },
  {
    id: "retry-backoff",
    title: "Retry with backoff",
    task: "Add a retry helper for the payment gateway client, with exponential backoff, and report each failed attempt.",
    chapter: 4,
    check: "ok",
    rust: String.raw`use std::time::Duration;

#[derive(Debug)]
struct GatewayError(&'static str);

fn retry<T>(mut call: impl FnMut(u32) -> Result<T, GatewayError>) -> Result<T, GatewayError> {
    let mut last_error = GatewayError("never called");
    for attempt in 0..5 {
        match call(attempt) {
            Ok(value) => return Ok(value),
            Err(error) => {
                let wait = Duration::from_millis(250 * 2u64.pow(attempt));
                println!("attempt {} failed, waiting {:?}", attempt + 1, wait);
                last_error = error;
            }
        }
    }
    Err(last_error)
}

fn main() {
    let result = retry(|attempt| {
        if attempt < 2 {
            Err(GatewayError("timeout"))
        } else {
            Ok(format!("paid on try {}", attempt + 1))
        }
    });
    println!("{result:?}");
}`,
    smells: [
      { lines: [8, 12], kind: "magic numbers", severity: "idiom",
        explain: "<p>The attempt limit <code>5</code>, the base delay <code>250</code> and the doubling <code>2</code> are unnamed. Changing the policy means finding every copy, and a reader cannot tell a limit from a delay. Name the limits as constants at the top of the module.</p>" },
      { lines: [11], kind: "wait after the last attempt", severity: "perf",
        explain: "<p>The <code>Err</code> arm waits even after the final attempt, so the caller pays for a delay that leads nowhere before it receives the error. Return the error on the last attempt, before any wait.</p>" },
      { lines: [7], kind: "sentinel error value", severity: "design",
        explain: "<p><code>GatewayError(\"never called\")</code> is a placeholder. Every failed attempt replaces it, so it is never returned, but it still has to be built and read. Let the last attempt return its own error, and drop the placeholder.</p>" },
    ],
    idiomatic: String.raw`use std::time::Duration;

const MAX_ATTEMPTS: u32 = 5;
const BASE_BACKOFF: Duration = Duration::from_millis(250);

#[derive(Debug)]
struct GatewayError(&'static str);

fn retry<T>(mut call: impl FnMut(u32) -> Result<T, GatewayError>) -> Result<T, GatewayError> {
    let mut attempt = 0;
    loop {
        match call(attempt) {
            Ok(value) => return Ok(value),
            Err(error) if attempt + 1 == MAX_ATTEMPTS => return Err(error),
            Err(_) => {
                let wait = BASE_BACKOFF * 2u32.pow(attempt);
                println!("attempt {} failed, waiting {:?}", attempt + 1, wait);
                attempt += 1;
            }
        }
    }
}

fn main() {
    let result = retry(|attempt| {
        if attempt < 2 {
            Err(GatewayError("timeout"))
        } else {
            Ok(format!("paid on try {}", attempt + 1))
        }
    });
    println!("{result:?}");
}`,
    takeaway: "Keep the retry policy in named constants, and return on the last attempt before any wait.",
  },
  {
    id: "webhook-handler",
    title: "Webhook handler",
    task: "Write the handler for billing webhooks: check the signature, read the event, and return an HTTP status and a message.",
    chapter: 10,
    check: "ok",
    rust: String.raw`use std::collections::HashMap;

fn handle_webhook(headers: &HashMap<String, String>, body: &str, secret: &str) -> (u16, String) {
    let signature = match headers.get("x-signature") {
        Some(s) => s.clone(),
        None => return (401, "missing signature".to_string()),
    };
    if signature != secret {
        return (401, "bad signature".to_string());
    }
    let mut parts = body.splitn(2, ' ');
    let kind = parts.next().unwrap_or("");
    let payload = parts.next().unwrap_or("");
    let response;
    if kind == "order.paid" {
        let amount: u64 = payload.parse().unwrap_or(0);
        if amount == 0 {
            return (422, "empty order".to_string());
        }
        response = (200, format!("recorded {amount} cents"));
    } else if kind == "order.refunded" {
        response = (200, format!("refund queued for {payload}"));
    } else if kind == "ping" {
        response = (200, "pong".to_string());
    } else {
        response = (400, format!("unknown event {kind}"));
    }
    println!("webhook {kind} handled");
    response
}

fn main() {
    let mut headers = HashMap::new();
    headers.insert("x-signature".to_string(), "whsec_demo".to_string());
    println!("{:?}", handle_webhook(&headers, "order.paid 1999", "whsec_demo"));
    println!("{:?}", handle_webhook(&headers, "order.paid lots", "whsec_demo"));
    println!("{:?}", handle_webhook(&headers, "ping", "whsec_demo"));
}`,
    smells: [
      { lines: [3], kind: "giant function", severity: "design",
        explain: "<p>One function checks the signature, parses the event, decides the response and logs. Each step depends on the others, so none can be tested alone, and a change to one can break another. Split it into a parser that returns an enum, a function that handles each event, and a thin handler that turns results into responses.</p>" },
      { lines: [15, 21, 23], kind: "stringly-typed event", severity: "design",
        explain: "<p>Event names are compared as strings in an <code>if</code> chain. A misspelled name falls through to the final <code>else</code> and gets a generic 400, and nothing checks the list of names. Parse the name once into an enum, and let <code>match</code> show the missing cases.</p>" },
      { lines: [16], kind: "parse error swallowed", severity: "bug",
        explain: "<p><code>unwrap_or(0)</code> turns <code>\"lots\"</code> into zero, so a bad amount is reported as an empty order. The customer gets a misleading message, and the bad input is never logged. Return an error that says which field is wrong.</p>" },
      { lines: [5], kind: "needless clone", severity: "perf",
        explain: "<p><code>s.clone()</code> copies the signature header only to compare it. A <code>&amp;str</code> view of the header is enough, because <code>!=</code> works on borrowed strings.</p>" },
    ],
    idiomatic: String.raw`use std::collections::HashMap;

enum Event {
    OrderPaid { cents: u64 },
    OrderRefunded { order: String },
    Ping,
    Unknown(String),
}

fn parse_event(body: &str) -> Result<Event, String> {
    let (kind, payload) = body.split_once(' ').unwrap_or((body, ""));
    match kind {
        "order.paid" => payload
            .parse()
            .map(|cents| Event::OrderPaid { cents })
            .map_err(|_| format!("amount must be whole cents, got {payload:?}")),
        "order.refunded" => Ok(Event::OrderRefunded { order: payload.to_string() }),
        "ping" => Ok(Event::Ping),
        other => Ok(Event::Unknown(other.to_string())),
    }
}

fn respond(event: Event) -> (u16, String) {
    match event {
        Event::OrderPaid { cents: 0 } => (422, "empty order".to_string()),
        Event::OrderPaid { cents } => (200, format!("recorded {cents} cents")),
        Event::OrderRefunded { order } => (200, format!("refund queued for {order}")),
        Event::Ping => (200, "pong".to_string()),
        Event::Unknown(kind) => (400, format!("unknown event {kind}")),
    }
}

fn handle_webhook(headers: &HashMap<String, String>, body: &str, secret: &str) -> (u16, String) {
    match headers.get("x-signature").map(String::as_str) {
        None => return (401, "missing signature".to_string()),
        Some(sig) if sig != secret => return (401, "bad signature".to_string()),
        Some(_) => {}
    }
    match parse_event(body) {
        Ok(event) => respond(event),
        Err(message) => (400, message),
    }
}

fn main() {
    let mut headers = HashMap::new();
    headers.insert("x-signature".to_string(), "whsec_demo".to_string());
    println!("{:?}", handle_webhook(&headers, "order.paid 1999", "whsec_demo"));
    println!("{:?}", handle_webhook(&headers, "order.paid lots", "whsec_demo"));
    println!("{:?}", handle_webhook(&headers, "ping", "whsec_demo"));
}`,
    takeaway: "A handler that does everything is hard to test: parse the input into types first, then decide what to do with it.",
  },
  {
    id: "active-names",
    title: "Active users",
    task: "Return the uppercase names of the active users, and the number of orders placed by active users, for the admin dashboard.",
    chapter: 13,
    check: "ok",
    rust: String.raw`struct User {
    name: String,
    active: bool,
    orders: u32,
}

fn active_names(users: &[User]) -> Vec<String> {
    let active: Vec<&User> = users.iter().filter(|u| u.active).collect();
    let names: Vec<&str> = active.iter().map(|u| u.name.as_str()).collect();
    let mut out = Vec::new();
    for name in names.iter() {
        out.push(name.to_uppercase());
    }
    out
}

fn total_orders(users: &[User]) -> u32 {
    let active: Vec<&User> = users.iter().filter(|u| u.active).collect();
    let mut total = 0;
    for user in active.iter() {
        total += user.orders;
    }
    total
}

fn main() {
    let users = vec![
        User { name: "ana".into(), active: true, orders: 3 },
        User { name: "bo".into(), active: false, orders: 9 },
        User { name: "cy".into(), active: true, orders: 5 },
    ];
    println!("{:?}", active_names(&users));
    println!("orders: {}", total_orders(&users));
}`,
    smells: [
      { lines: [8, 9], kind: "collect then iterate again", severity: "perf",
        explain: "<p><code>active</code> and <code>names</code> are collected into Vecs only so they can be looped over again. Each <code>collect</code> allocates a whole Vec. One iterator chain can filter and map in a single pass.</p>" },
      { lines: [18, 20, 21], kind: "collect then iterate again", severity: "perf",
        explain: "<p>The Vec of active users exists only so <code>total_orders</code> can walk it once. <code>filter</code> and <code>sum</code> do the same work without storing anything.</p>" },
      { lines: [10, 11, 12], kind: "manual loop that builds a Vec", severity: "idiom",
        explain: "<p>A loop that pushes into a new Vec is a <code>map</code> and a <code>collect</code> written out by hand. The iterator version states what the result is, and it is the shape most Rust readers expect at a glance.</p>" },
    ],
    idiomatic: String.raw`struct User {
    name: String,
    active: bool,
    orders: u32,
}

fn active_names(users: &[User]) -> Vec<String> {
    users
        .iter()
        .filter(|u| u.active)
        .map(|u| u.name.to_uppercase())
        .collect()
}

fn total_orders(users: &[User]) -> u32 {
    users.iter().filter(|u| u.active).map(|u| u.orders).sum()
}

fn main() {
    let users = vec![
        User { name: "ana".into(), active: true, orders: 3 },
        User { name: "bo".into(), active: false, orders: 9 },
        User { name: "cy".into(), active: true, orders: 5 },
    ];
    println!("{:?}", active_names(&users));
    println!("orders: {}", total_orders(&users));
}`,
    takeaway: "Collect at the end of a chain, when you need an owned result, and not in the middle of one.",
  },
  {
    id: "quota-await",
    title: "Quota and await",
    task: "Add a quota check to the request handler: reserve units, call the billing service, and report the result.",
    chapter: 19,
    check: "ok",
    rust: String.raw`use std::sync::Mutex;

struct Quota {
    remaining: Mutex<u32>,
}

async fn charge_upstream(cost: u32) -> bool {
    cost <= 100
}

async fn handle_request(quota: &Quota, cost: u32) -> Result<(), String> {
    let mut remaining = quota.remaining.lock().unwrap();
    if *remaining < cost {
        return Err("quota exhausted".to_string());
    }
    let accepted = charge_upstream(cost).await;
    if accepted {
        *remaining -= cost;
    }
    Ok(())
}

fn main() {
    // This file only defines the handler. An async runtime calls it.
    let quota = Quota { remaining: Mutex::new(500) };
    println!("quota starts at {}", quota.remaining.lock().unwrap());
}`,
    smells: [
      { lines: [12, 16, 18], kind: "MutexGuard held across .await", severity: "bug",
        explain: "<p>The guard from <code>lock()</code> lives until the end of the function, so it is still held while the handler waits for the billing service. Other requests that need the quota block on the lock, and a std <code>Mutex</code> held across an <code>.await</code> can deadlock the executor thread. Take what you need, drop the guard, and only then wait.</p>" },
      { lines: [20], kind: "refusal ignored", severity: "bug",
        explain: "<p><code>charge_upstream</code> returns <code>false</code> when the charge is refused, but the function returns <code>Ok(())</code> anyway. The caller believes the request was paid for. Check the result, and return an error when the charge is refused.</p>" },
    ],
    idiomatic: String.raw`use std::sync::Mutex;

struct Quota {
    remaining: Mutex<u32>,
}

async fn charge_upstream(cost: u32) -> bool {
    cost <= 100
}

async fn handle_request(quota: &Quota, cost: u32) -> Result<(), String> {
    // Reserve the units, then drop the lock before we wait on the network.
    {
        let mut remaining = quota.remaining.lock().unwrap();
        *remaining = remaining
            .checked_sub(cost)
            .ok_or_else(|| "quota exhausted".to_string())?;
    }
    if charge_upstream(cost).await {
        Ok(())
    } else {
        // Give the reserved units back when the upstream refuses.
        *quota.remaining.lock().unwrap() += cost;
        Err("upstream refused the charge".to_string())
    }
}

fn main() {
    // This file only defines the handler. An async runtime calls it.
    let quota = Quota { remaining: Mutex::new(500) };
    println!("quota starts at {}", quota.remaining.lock().unwrap());
}`,
    takeaway: "Never hold a lock across an <code>.await</code>: take what you need, drop the guard, then wait.",
  },
  {
    id: "upload-async",
    title: "Upload handler",
    task: "Write the upload handler: read the file, compute a checksum and reply, and add a status handler.",
    chapter: 19,
    check: "ok",
    idiomaticCheck: "skip", // needs tokio: checked with cargo, not by the snippet checker
    rust: String.raw`use std::fs;
use std::thread;
use std::time::Duration;

async fn handle_upload(path: &str) -> Result<usize, std::io::Error> {
    thread::sleep(Duration::from_millis(200));
    let bytes = fs::read(path)?;
    let sum: usize = bytes.iter().map(|b| *b as usize).sum();
    Ok(sum)
}

async fn handle_status() -> &'static str {
    thread::sleep(Duration::from_millis(50));
    "ok"
}

fn main() {
    // The async runtime (tokio, async-std, ...) polls these futures.
    // This file only defines them.
    let _upload = handle_upload("report.csv");
    let _status = handle_status();
    println!("handlers defined");
}`,
    smells: [
      { lines: [6, 13], kind: "blocking call in async", severity: "bug",
        explain: "<p><code>thread::sleep</code> blocks the whole thread the runtime uses, so every other task on that thread stops too. Inside an async function, wait with <code>tokio::time::sleep(...).await</code>, which lets other tasks run in the meantime.</p>" },
      { lines: [7], kind: "blocking call in async", severity: "bug",
        explain: "<p><code>fs::read</code> waits for the disk while the executor thread sits idle. Use the async filesystem API instead, such as <code>tokio::fs::read(path).await</code>, which runs the read on a blocking pool.</p>" },
    ],
    idiomatic: String.raw`use std::io;
use std::time::Duration;

async fn handle_upload(path: &str) -> Result<usize, io::Error> {
    tokio::time::sleep(Duration::from_millis(200)).await;
    let bytes = tokio::fs::read(path).await?;
    Ok(bytes.iter().map(|b| *b as usize).sum())
}

async fn handle_status() -> &'static str {
    tokio::time::sleep(Duration::from_millis(50)).await;
    "ok"
}

#[tokio::main]
async fn main() {
    match handle_upload("report.csv").await {
        Ok(sum) => println!("checksum {sum}"),
        Err(e) => println!("upload failed: {e}"),
    }
    println!("{}", handle_status().await);
}`,
    takeaway: "Inside an async function, use the async version of every wait and every I/O call, or move blocking work to <code>spawn_blocking</code>.",
  },
  {
    id: "product-import",
    title: "Product import",
    task: "Write the parser for one product row in the CSV import, shared by the importer and the admin API.",
    chapter: 11,
    check: "ok",
    rust: String.raw`#[derive(Debug)]
struct Product {
    sku: String,
    price_cents: u32,
    stock: u16,
}

pub fn parse_product(line: &str) -> Product {
    let fields: Vec<&str> = line.split(',').collect();
    Product {
        sku: fields[0].trim().to_string(),
        price_cents: fields[1].trim().parse().unwrap(),
        stock: fields[2].trim().parse().expect("stock must be a number"),
    }
}

fn main() {
    let product = parse_product("SKU-9, 1299, 14");
    println!("{product:?}");
}`,
    smells: [
      { lines: [12, 13], kind: "unwrap or expect on input", severity: "bug",
        explain: "<p>Import files come from spreadsheets and people. A price such as <code>12.99</code> makes <code>unwrap()</code> panic, and <code>expect()</code> does the same to a bad stock number. Either panic stops the whole import. A library should return an error for this row, so the importer can skip it and report it.</p>" },
      { lines: [9, 11, 12, 13], kind: "index panics on a short row", severity: "bug",
        explain: "<p>Indexing <code>fields[1]</code> panics when a row has fewer columns than expected, and the import stops. Take the fields with <code>next()</code> instead. It returns <code>None</code> for a missing column, which you can turn into an error that names the column.</p>" },
    ],
    idiomatic: String.raw`use std::fmt;
use std::num::ParseIntError;

#[derive(Debug)]
struct Product {
    sku: String,
    price_cents: u32,
    stock: u16,
}

#[derive(Debug)]
enum ImportError {
    MissingField(&'static str),
    BadNumber { field: &'static str, source: ParseIntError },
}

impl fmt::Display for ImportError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ImportError::MissingField(field) => write!(f, "missing {field}"),
            ImportError::BadNumber { field, source } => write!(f, "{field}: {source}"),
        }
    }
}

impl std::error::Error for ImportError {}

pub fn parse_product(line: &str) -> Result<Product, ImportError> {
    let mut fields = line.split(',').map(str::trim);
    let sku = fields.next().ok_or(ImportError::MissingField("sku"))?;
    let price = fields.next().ok_or(ImportError::MissingField("price_cents"))?;
    let stock = fields.next().ok_or(ImportError::MissingField("stock"))?;
    Ok(Product {
        sku: sku.to_string(),
        price_cents: price.parse().map_err(|source| ImportError::BadNumber {
            field: "price_cents",
            source,
        })?,
        stock: stock.parse().map_err(|source| ImportError::BadNumber {
            field: "stock",
            source,
        })?,
    })
}

fn main() {
    match parse_product("SKU-9, 1299, 14") {
        Ok(product) => println!("{product:?}"),
        Err(e) => println!("import failed: {e}"),
    }
}`,
    takeaway: "Input from outside the program can be wrong in any way, so return a <code>Result</code> that names the bad field, and never index or unwrap it.",
  },
  {
    id: "thumb-cache",
    title: "Thumbnail cache",
    task: "Add a thumbnail cache lookup that returns the stored bytes, and a helper that reports how big an entry is.",
    chapter: 8,
    check: "ok",
    rust: String.raw`use std::collections::HashMap;

struct ThumbCache {
    entries: HashMap<String, Vec<u8>>,
}

impl ThumbCache {
    fn get(&self, key: String) -> Option<Vec<u8>> {
        self.entries.get(&key).cloned()
    }

    fn size_of(&self, key: &str) -> usize {
        self.get(key.to_string()).map(|bytes| bytes.len()).unwrap_or(0)
    }
}

fn main() {
    let mut entries = HashMap::new();
    entries.insert("cat.png".to_string(), vec![1u8, 2, 3]);
    let cache = ThumbCache { entries };
    println!("cat.png is {} bytes", cache.size_of("cat.png"));
    println!("{:?}", cache.get("dog.png".to_string()));
}`,
    smells: [
      { lines: [8, 13], kind: "String where &str suffices", severity: "idiom",
        explain: "<p><code>get</code> only reads the key, but it takes a <code>String</code>, so every call allocates one. <code>size_of</code> shows the cost: it allocates a <code>String</code> just to pass it in. Take <code>&amp;str</code>, which accepts a literal, a <code>&amp;String</code>, or a part of a longer string.</p>" },
      { lines: [9], kind: "needless clone", severity: "perf",
        explain: "<p><code>.cloned()</code> copies the whole image buffer on every lookup. <code>size_of</code> needs only the length, and most callers only read the bytes. Return <code>Option&lt;&amp;[u8]&gt;</code> and let the caller decide whether to copy.</p>" },
    ],
    idiomatic: String.raw`use std::collections::HashMap;

struct ThumbCache {
    entries: HashMap<String, Vec<u8>>,
}

impl ThumbCache {
    fn get(&self, key: &str) -> Option<&[u8]> {
        self.entries.get(key).map(Vec::as_slice)
    }

    fn size_of(&self, key: &str) -> usize {
        self.get(key).map_or(0, <[u8]>::len)
    }
}

fn main() {
    let mut entries = HashMap::new();
    entries.insert("cat.png".to_string(), vec![1u8, 2, 3]);
    let cache = ThumbCache { entries };
    println!("cat.png is {} bytes", cache.size_of("cat.png"));
    println!("{:?}", cache.get("dog.png"));
}`,
    takeaway: "A cache can lend out a borrow: copy at the edge, and only when the caller needs an owned value.",
  },
];
