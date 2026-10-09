/* Oxidize — course map. The single source of truth for chapter order, acts,
   levels and labs. Every page loads this before oxidize.js. */
window.OX_COURSE = {
  acts: [
    { id: 1, name: "Ore", subtitle: "Foundations", blurb: "Raw material: syntax, types and the shape of a Rust program." },
    { id: 2, name: "Smelt", subtitle: "The Ownership Trilogy", blurb: "The heat that makes Rust Rust: memory, ownership, borrowing." },
    { id: 3, name: "Cast", subtitle: "Shape Your Data", blurb: "Structs, enums, errors and collections: model the world precisely." },
    { id: 4, name: "Temper", subtitle: "Abstraction Without Cost", blurb: "Traits, generics, lifetimes and smart pointers: power without a runtime tax." },
    { id: 5, name: "Alloy", subtitle: "Fearless & Fast", blurb: "Threads, async, the web, and the habits of an expert." }
  ],
  chapters: [
    { n: 1,  act: 1, slug: "01-hello-crab",       title: "Hello, Crab",               idea: "Rust compiles to machine code ahead of time. Cargo is your Composer and Artisan in one.", mins: 25 },
    { n: 2,  act: 1, slug: "02-variables",        title: "Variables Are Promises",    idea: "A binding is immutable unless you say mut. Shadowing lets a name take a new shape.", mins: 25 },
    { n: 3,  act: 1, slug: "03-types",            title: "Types Are Shapes",          idea: "Every value has one exact type, known before the program runs.", mins: 35 },
    { n: 4,  act: 1, slug: "04-control-flow",     title: "Everything Is an Expression", idea: "Blocks, if, match and loop produce values. The semicolon decides.", mins: 35 },
    { n: 5,  act: 2, slug: "05-memory",           title: "The Stack & The Heap",      idea: "Fixed-size values live on the stack; growable data lives on the heap behind a pointer.", mins: 35 },
    { n: 6,  act: 2, slug: "06-ownership",        title: "One Owner",                 idea: "Every heap value has exactly one owner. When the owner goes away, the value is freed.", mins: 45 },
    { n: 7,  act: 2, slug: "07-borrowing",        title: "Borrowing",                 idea: "Many readers or one writer, never both at the same time.", mins: 45 },
    { n: 8,  act: 2, slug: "08-strings-slices",   title: "Strings & Slices",          idea: "String owns text; &str views text. A slice is a pointer plus a length.", mins: 40 },
    { n: 9,  act: 3, slug: "09-structs",          title: "Structs & Methods",         idea: "Data and behavior, without inheritance.", mins: 35 },
    { n: 10, act: 3, slug: "10-enums-match",      title: "Enums & Pattern Matching",  idea: "A value that is exactly one of several shapes, and a match that must handle them all.", mins: 45 },
    { n: 11, act: 3, slug: "11-errors",           title: "Errors Are Values",         idea: "No exceptions. Failure is a Result you must look at.", mins: 40 },
    { n: 12, act: 3, slug: "12-collections",      title: "Collections",               idea: "PHP's array is five data structures in a trench coat. Rust gives each one its own name.", mins: 40 },
    { n: 13, act: 3, slug: "13-iterators-closures", title: "Iterators & Closures",    idea: "Laravel Collections, compiled down to a plain loop.", mins: 45 },
    { n: 14, act: 4, slug: "14-traits-generics",  title: "Traits & Generics",         idea: "Interfaces you can attach to any type, and generics that cost nothing at runtime.", mins: 50 },
    { n: 15, act: 4, slug: "15-lifetimes",        title: "Lifetimes",                 idea: "Lifetimes don't change how long anything lives. They describe which borrow came from where.", mins: 45 },
    { n: 16, act: 4, slug: "16-modules-cargo",    title: "Modules, Crates & Tests",   idea: "Namespaces, packages and tests, built into the toolchain.", mins: 35 },
    { n: 17, act: 4, slug: "17-smart-pointers",   title: "Smart Pointers",            idea: "Box, Rc, RefCell: ownership patterns for when one owner is not enough.", mins: 45 },
    { n: 18, act: 5, slug: "18-concurrency",      title: "Fearless Concurrency",      idea: "The rules that prevent dangling pointers also prevent data races.", mins: 45 },
    { n: 19, act: 5, slug: "19-async",            title: "Async Rust",                idea: "A future is a paused computation. Nothing happens until something polls it.", mins: 45 },
    { n: 20, act: 5, slug: "20-web",              title: "Rust on the Web",           idea: "Routes, handlers, middleware and JSON. Laravel's ideas with Rust's guarantees.", mins: 50 },
    { n: 21, act: 5, slug: "21-mastery",          title: "Mastery",                   idea: "Macros, unsafe, performance, idioms, and reviewing Rust that an AI wrote.", mins: 50 }
  ],
  labs: [
    { slug: "xray",           title: "Memory X-Ray",            blurb: "Step through programs and watch the stack, the heap and every owner move." },
    { slug: "borrow-checker", title: "Be the Borrow Checker",   blurb: "Read code, decide if rustc accepts it, and name the rule it breaks." },
    { slug: "errors",         title: "Error Museum",            blurb: "The 25 compiler errors you will meet most, decoded with fixes." },
    { slug: "rosetta",        title: "PHP → Rust Rosetta",      blurb: "A searchable phrasebook from the PHP and Laravel you know to the Rust you need." },
    { slug: "ai-dojo",        title: "Agent Code Review Dojo",  blurb: "Spot the smells in AI-written Rust before they reach production." },
    { slug: "review",         title: "Recall Deck",             blurb: "Spaced-repetition flashcards from every chapter you have read." },
    { slug: "cast",           title: "Field Guide",             blurb: "Every character of Rustopia you have met, and the Rust idea each one stands for." },
    { slug: "glossary",       title: "Glossary & keyword index", blurb: "Every keyword, core term, std type, cargo tool and error code, with a checked example and a keyword drill." }
  ],
  levels: [
    { xp: 0,    name: "Hatchling" },
    { xp: 150,  name: "Shell Polisher" },
    { xp: 400,  name: "Move Tracker" },
    { xp: 800,  name: "Borrow Whisperer" },
    { xp: 1300, name: "Pattern Matcher" },
    { xp: 1900, name: "Trait Smith" },
    { xp: 2600, name: "Lifetime Bender" },
    { xp: 3400, name: "Fearless Concurrent" },
    { xp: 4300, name: "Async Navigator" },
    { xp: 5400, name: "Rustacean" }
  ]
};
