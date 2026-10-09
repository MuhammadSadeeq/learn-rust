/* ==========================================================================
   PHP -> Rust Rosetta: the phrasebook for the lab page (window.OX_ROSETTA).
   Each entry pairs a PHP or Laravel idiom with its Rust equivalent.
   The `rust` field of every entry is compiled by tools/check-snippets.mjs.
   check "ok" must compile; check "skip" marks code that needs a crate.
   `note` is HTML and says where the analogy stops holding.
   ========================================================================== */
window.OX_ROSETTA = [
  /* ---------------------------------------------------------------- basics */
  {
    id: "variables",
    cat: "basics",
    title: "Variables and reassignment",
    php: `
      $count = 0;
      $count += 1;
      echo "$count\\n";
      `,
    rust: `
      let mut count = 0;
      count += 1;
      println!("{count}");
      `,
    check: "ok",
    note: `A binding is immutable unless you write <code>mut</code>. Reassigning an immutable binding is compile error E0384, so the safe default is the reverse of PHP's. Write <code>mut</code> only where the value really changes.`,
    chapter: 2
  },
  {
    id: "constants",
    cat: "basics",
    title: "Constants",
    php: `
      final class Retry {
          public const int MAX_RETRIES = 3;
      }
      echo "retry up to " . Retry::MAX_RETRIES . " times";
      `,
    rust: `
      const MAX_RETRIES: u32 = 3;
      println!("retry up to {MAX_RETRIES} times");
      `,
    check: "ok",
    note: `A Rust constant always has a type and is inlined where it is used. PHP 8.3 added types to class constants, and PHP 8.1 added <code>final</code>, which stops a subclass from overriding one. Rust has no subclasses, so nothing can override a constant. Use <code>static</code> when you need one fixed place in memory.`,
    chapter: 2
  },
  {
    id: "print-line",
    cat: "basics",
    title: "Print a line",
    php: `
      $name = "Ada";
      echo "Hello, $name\\n";
      `,
    rust: `
      let name = "Ada";
      println!("Hello, {name}");
      `,
    check: "ok",
    note: `<code>println!</code> adds the newline for you. The <code>!</code> marks a macro, and the compiler checks the format string against the arguments. A missing argument is a build error, not a blank in the output.`,
    chapter: 1
  },
  {
    id: "integers",
    cat: "basics",
    title: "Integer types",
    php: `
      $n = 42;
      $big = 1 << 40;
      $over = PHP_INT_MAX + 1; // silently a float now
      `,
    rust: `
      let n: i32 = 42;
      let big: u64 = 1 << 40;
      println!("{n} {big}");
      `,
    check: "ok",
    note: `PHP has one integer type, 64-bit and signed, and it turns into a float on overflow. Rust has a fixed set of integer types (i8 through i128, u8 through u128, isize and usize). You pick the size and the sign. Overflow panics in debug builds and wraps in release builds.`,
    chapter: 3
  },
  {
    id: "truthiness",
    cat: "basics",
    title: "Truthiness",
    php: `
      $items = [];
      if ($items === []) {
          echo "nothing to do\\n";
      }
      `,
    rust: `
      let items: Vec<u32> = Vec::new();
      if items.is_empty() {
          println!("nothing to do");
      }
      `,
    check: "ok",
    note: `Rust never converts a value to a bool, so <code>if items</code> does not compile. Ask the exact question instead: <code>is_empty()</code>, <code>!= 0</code> or <code>is_some()</code>. The PHP side asks the same way, with <code>=== []</code>. Exact checks remove PHP surprises, such as <code>"0"</code> being falsy.`,
    chapter: 4
  },
  {
    id: "type-cast",
    cat: "basics",
    title: "Converting between types",
    php: `
      $n = 42;
      $f = (float) $n;
      $bad = (int) "abc"; // 0, and no error
      `,
    rust: `
      let n: i32 = 42;
      let f = f64::from(n);
      let parsed = "abc".parse::<i32>();
      println!("{f} {parsed:?}");
      `,
    check: "ok",
    note: `PHP's cast turns <code>"abc"</code> into 0 without telling you. Rust's <code>parse</code> returns a <code>Result</code> that you have to handle. <code>f64::from</code> cannot lose information for an i32. The <code>as</code> operator can silently truncate, so prefer <code>from</code> or <code>try_from</code>.`,
    chapter: 3
  },
  {
    id: "option-no-null",
    cat: "basics",
    title: "No null: use Option",
    php: `
      function findName(int $id): ?string {
          return match ($id) {
              1 => "Ada",
              default => null,
          };
      }
      echo findName(2) ?? "guest";
      `,
    rust: `
      fn find_name(id: u32) -> Option<&'static str> {
          match id {
              1 => Some("Ada"),
              _ => None,
          }
      }
      println!("{}", find_name(2).unwrap_or("guest"));
      `,
    check: "ok",
    note: `Rust has no null. A value that may be missing has type <code>Option&lt;T&gt;</code>, and you cannot use what is inside until you handle <code>None</code>. The type is the warning, so you do not have to remember to check.`,
    chapter: 10
  },
  {
    id: "tuples",
    cat: "basics",
    title: "Several values at once",
    php: `
      [$min, $max] = [1, 9];
      echo "$min..$max";
      `,
    rust: `
      let (min, max) = (1, 9);
      println!("{min}..{max}");
      `,
    check: "ok",
    note: `A tuple is a fixed group of values, each with its own type. Its length is part of the type, so reading a fourth item from a three-item tuple is a compile error, not a null.`,
    chapter: 3
  },
  {
    id: "shadowing",
    cat: "basics",
    title: "Shadowing",
    php: `
      $input = "42";
      $input = (int) $input; // same variable, new type
      `,
    rust: `
      let input = "42";
      let input: i32 = input.parse().unwrap_or_default();
      println!("{input}");
      `,
    check: "ok",
    note: `A new <code>let</code> creates a second binding that hides the first, and the type can change. PHP reuses one variable, so the old value is simply overwritten. In Rust the old binding still exists until its scope ends, but no code can name it any more.`,
    chapter: 2
  },

  /* ---------------------------------------------------------------- strings */
  {
    id: "string-concat",
    cat: "strings",
    title: "Concatenate strings",
    php: `
      $name = "Ada";
      $greeting = "Hello, " . $name . "!";
      `,
    rust: `
      let name = "Ada";
      let greeting = format!("Hello, {name}!");
      println!("{greeting}");
      `,
    check: "ok",
    note: `<code>+</code> on a <code>String</code> takes ownership of the left side, so <code>a + &amp;b</code> moves <code>a</code>. <code>format!</code> builds a new <code>String</code> and only borrows what it reads, which is closer to PHP's <code>.</code>.`,
    chapter: 8
  },
  {
    id: "string-interpolation",
    cat: "strings",
    title: "Interpolate values",
    php: `
      $name = "Ada";
      $count = 3;
      echo "Hi $name, you have {$count} items";
      `,
    rust: `
      let name = "Ada";
      let count = 3;
      println!("Hi {name}, you have {count} items");
      `,
    check: "ok",
    note: `Rust interpolates names, not expressions. There is no <code>{user.name}</code> in a format string, so bind the field to a name first. Anything inside the braces must implement <code>Display</code>, and you write that impl yourself for your own types.`,
    chapter: 8
  },
  {
    id: "string-length",
    cat: "strings",
    title: "Length in bytes and characters",
    php: `
      $s = "héllo";
      echo strlen($s);    // 6 bytes
      echo mb_strlen($s); // 5 characters
      `,
    rust: `
      let s = "héllo";
      println!("{} bytes", s.len());
      println!("{} chars", s.chars().count());
      `,
    check: "ok",
    note: `<code>len()</code> counts bytes, like <code>strlen()</code>. For characters, use <code>chars().count()</code>, which does the job of <code>mb_strlen()</code>. The method names say which one you get, and there is no mode that picks one by accident.`,
    chapter: 8
  },
  {
    id: "string-substring",
    cat: "strings",
    title: "Substring",
    php: `
      $s = "Hello, world";
      echo substr($s, 0, 5); // Hello
      `,
    rust: `
      let s = "Hello, world";
      let hello = &s[0..5];
      println!("{hello}");
      `,
    check: "ok",
    note: `A slice index counts bytes, and it panics if a cut lands inside a multi-byte character. For a cut by characters, use <code>s.chars().take(5).collect::&lt;String&gt;()</code>. The slice itself borrows from <code>s</code> and copies nothing.`,
    chapter: 8
  },
  {
    id: "string-contains",
    cat: "strings",
    title: "Contains and starts with",
    php: `
      $s = "Hello, world";
      var_dump(str_contains($s, "world"));
      var_dump(str_starts_with($s, "Hello"));
      `,
    rust: `
      let s = "Hello, world";
      println!("{}", s.contains("world"));
      println!("{}", s.starts_with("Hello"));
      `,
    check: "ok",
    note: `PHP's argument order is not consistent: <code>str_contains</code> takes the haystack first, and <code>in_array</code> takes the needle first. Rust methods always read left to right, from the value to the question.`,
    chapter: 8
  },
  {
    id: "string-trim-case",
    cat: "strings",
    title: "Trim and change case",
    php: `
      $raw = "  Ada Lovelace  ";
      echo mb_strtoupper(mb_trim($raw));
      `,
    rust: `
      let raw = "  Ada Lovelace  ";
      let shout = raw.trim().to_uppercase();
      println!("{shout}");
      `,
    check: "ok",
    note: `<code>to_uppercase</code> is Unicode-aware, and the result can be longer than the input: <code>"ß"</code> becomes <code>"SS"</code>. PHP's <code>trim</code> removes only ASCII whitespace, so the PHP side uses <code>mb_trim</code>, which arrived in PHP 8.4. PHP 8.2 and later change only ASCII letters in <code>strtoupper</code>, so use <code>mb_strtoupper</code> when you need Unicode.`,
    chapter: 8
  },
  {
    id: "string-split-join",
    cat: "strings",
    title: "Split and join",
    php: `
      $csv = "ada,grace,linus";
      $names = explode(",", $csv);
      echo implode(", ", $names);
      `,
    rust: `
      let csv = "ada,grace,linus";
      let names: Vec<&str> = csv.split(',').collect();
      println!("{}", names.join(", "));
      `,
    check: "ok",
    note: `<code>split</code> returns an iterator over pieces that point into <code>csv</code>. Nothing is copied until <code>collect</code>. The <code>Vec&lt;&amp;str&gt;</code> borrows from <code>csv</code>, so <code>csv</code> must live at least as long as <code>names</code>.`,
    chapter: 8
  },
  {
    id: "string-replace",
    cat: "strings",
    title: "Replace text",
    php: `
      $s = "the cat sat";
      echo str_replace("cat", "dog", $s);
      `,
    rust: `
      let s = "the cat sat";
      let t = s.replace("cat", "dog");
      println!("{t}");
      `,
    check: "ok",
    note: `<code>replace</code> returns a new <code>String</code> and leaves the original alone, the same as PHP. A <code>&amp;str</code> cannot be edited in place at all, so every change shows up as a new value.`,
    chapter: 8
  },
  {
    id: "string-format-number",
    cat: "strings",
    title: "Zero-padded numbers",
    php: `
      $price = 3.5;
      echo sprintf("%08.2f", $price); // 00003.50
      `,
    rust: `
      let price = 3.5;
      println!("{price:08.2}");
      `,
    check: "ok",
    note: `The format spec reads the same way in both languages. Rust checks the format string against the arguments when it compiles, so a missing or extra argument is a build error. Use <code>format!</code> instead of <code>println!</code> when you need the string itself.`,
    chapter: 8
  },
  /* ---------------------------------------------------------------- lists */
  {
    id: "list-literal",
    cat: "lists",
    title: "Create a list",
    php: `
      $nums = [1, 2, 3];
      `,
    rust: `
      let nums = vec![1, 2, 3];
      println!("{nums:?}");
      `,
    check: "ok",
    note: `<code>vec!</code> makes a growable list on the heap, which is a <code>Vec</code>. The fixed array <code>[1, 2, 3]</code> is a different type: its length is part of the type, and it lives on the stack. A PHP array does both jobs, so Rust gives each job its own name.`,
    chapter: 12
  },
  {
    id: "list-push",
    cat: "lists",
    title: "Append an item",
    php: `
      $nums = [1, 2, 3];
      $nums[] = 4;
      `,
    rust: `
      let mut nums = vec![1, 2, 3];
      nums.push(4);
      `,
    check: "ok",
    note: `<code>push</code> needs <code>mut</code>, because the list changes. A <code>Vec</code> has exactly one owner, so there is no hidden sharing. PHP arrays are copied on write behind your back, which Rust never does.`,
    chapter: 12
  },
  {
    id: "list-index",
    cat: "lists",
    title: "Read by index",
    php: `
      $nums = [10, 20, 30];
      echo $nums[5] ?? "none"; // no warning with ??
      `,
    rust: `
      let nums = [10, 20, 30];
      match nums.get(5) {
          Some(n) => println!("{n}"),
          None => println!("none"),
      }
      `,
    check: "ok",
    note: `<code>nums[5]</code> panics here. Indexing past the end is a crash, not a null. <code>get</code> returns an <code>Option</code>, so the missing case is part of the type. Without the <code>??</code>, PHP's <code>$nums[5]</code> warns and carries on with null.`,
    chapter: 12
  },
  {
    id: "list-count",
    cat: "lists",
    title: "Count and check for empty",
    php: `
      $nums = [10, 20, 30];
      echo count($nums);
      var_dump($nums === []);
      `,
    rust: `
      let nums = Vec::from([10, 20, 30]);
      println!("{}", nums.len());
      println!("{}", nums.is_empty());
      `,
    check: "ok",
    note: `<code>len</code> and <code>is_empty</code> are constant time for a <code>Vec</code>, an array or a slice. Be careful with iterators: <code>count()</code> on an iterator walks the whole sequence and uses it up.`,
    chapter: 12
  },
  {
    id: "list-map",
    cat: "lists",
    title: "Transform every item",
    php: `
      $nums = [1, 2, 3];
      $doubled = array_map(fn($n) => $n * 2, $nums);
      `,
    rust: `
      let nums = [1, 2, 3];
      let doubled: Vec<i32> = nums.iter().map(|n| n * 2).collect();
      println!("{doubled:?}");
      `,
    check: "ok",
    note: `<code>array_map</code> runs now and returns an array. The Rust version is lazy: <code>map</code> does nothing until <code>collect</code> pulls each item. The type you collect into is part of the decision, so the annotation matters.`,
    chapter: 13
  },
  {
    id: "list-filter",
    cat: "lists",
    title: "Keep matching items",
    php: `
      $nums = [1, 2, 3, 4];
      $evens = array_values(array_filter($nums, fn(int $n) => $n % 2 === 0));
      // array_filter alone keeps the keys: [1 => 2, 3 => 4]
      `,
    rust: `
      let nums = [1, 2, 3, 4];
      let evens: Vec<i32> = nums.iter().copied().filter(|n| n % 2 == 0).collect();
      println!("{evens:?}");
      `,
    check: "ok",
    note: `<code>array_filter</code> keeps the original keys, so you can end up with a sparse array. <code>array_values</code> renumbers them. Rust's <code>filter</code> yields only the matching items, and <code>collect</code> decides the container. The result is a plain list with no leftover keys.`,
    chapter: 13
  },
  {
    id: "list-contains",
    cat: "lists",
    title: "Membership test",
    php: `
      $nums = [1, 2, 3];
      var_dump(in_array(3, $nums, true));
      `,
    rust: `
      let nums = [1, 2, 3];
      println!("{}", nums.contains(&3));
      `,
    check: "ok",
    note: `PHP's <code>in_array</code> is loose unless you pass <code>true</code>, so <code>"3"</code> matches 3. Rust equality is typed, and comparing a string with a number does not compile. <code>contains</code> takes a reference because it only looks.`,
    chapter: 12
  },
  {
    id: "list-sort",
    cat: "lists",
    title: "Sort",
    php: `
      $nums = [3, 1, 2];
      sort($nums); // in place
      `,
    rust: `
      let nums = vec![3, 1, 2];
      let mut sorted = nums.clone();
      sorted.sort();
      println!("{sorted:?} from {nums:?}");
      `,
    check: "ok",
    note: `<code>sort</code> works in place, needs <code>mut</code>, and exists only for types that implement <code>Ord</code>. Floats do not implement <code>Ord</code> because of NaN, so use <code>sort_by(|a, b| a.total_cmp(b))</code> for them. <code>clone</code> is for when you really need two copies.`,
    chapter: 12
  },
  {
    id: "list-sum",
    cat: "lists",
    title: "Sum the items",
    php: `
      $nums = [1, 2, 3];
      echo array_sum($nums);
      `,
    rust: `
      let nums = [1, 2, 3];
      let total: i32 = nums.iter().sum();
      println!("{total}");
      `,
    check: "ok",
    note: `<code>sum</code> needs to know its result type, and the annotation supplies it. Overflow panics in a debug build, like any integer addition. <code>array_sum</code> quietly turns into a float when the total overflows an int.`,
    chapter: 13
  },
  {
    id: "list-slice",
    cat: "lists",
    title: "Take a slice",
    php: `
      $nums = [10, 20, 30, 40];
      $middle = array_slice($nums, 1, 2); // [20, 30]
      `,
    rust: `
      let nums = [10, 20, 30, 40];
      let middle = &nums[1..3]; // [20, 30]
      println!("{middle:?}");
      `,
    check: "ok",
    note: `<code>&amp;nums[1..3]</code> borrows the items, so nothing is copied. The end of a Rust range is exclusive, so <code>1..3</code> gives two items where <code>array_slice</code> takes a length. A slice that runs past the end panics.`,
    chapter: 12
  },
  {
    id: "pipe-chain",
    cat: "lists",
    title: "Pipe a value through steps",
    php: `
      $total = [1, 2, 3, 4]
          |> (fn(array $xs) => array_filter($xs, fn(int $n) => $n % 2 === 0))
          |> array_sum(...);
      echo $total;
      `,
    rust: `
      let nums = [1, 2, 3, 4];
      let total: i32 = nums.iter().copied().filter(|n| n % 2 == 0).sum();
      println!("{total}");
      `,
    check: "ok",
    note: `The pipe <code>|&gt;</code> passes the value on the left into the next step, so the code reads top to bottom. Each step must take one argument, which is why the filter is wrapped in an arrow function. PHP runs each step on the whole array and builds a new array, so every step is eager. Rust has no pipe operator, because method calls already read left to right. Its iterator chain is lazy: no item moves until <code>sum</code> asks for it.`,
    chapter: 13
  },
  {
    id: "find-any-all",
    cat: "lists",
    title: "Find, any and all",
    php: `
      $nums = [1, 2, 3];
      $firstBig = array_find($nums, fn(int $n) => $n > 1); // 2
      $anyBig = array_any($nums, fn(int $n) => $n > 2);    // true
      $allBig = array_all($nums, fn(int $n) => $n > 0);    // true
      `,
    rust: `
      let nums = [1, 2, 3];
      let first_big = nums.iter().copied().find(|n| *n > 1);
      let any_big = nums.iter().any(|n| *n > 2);
      let all_big = nums.iter().all(|n| *n > 0);
      println!("{first_big:?} {any_big} {all_big}");
      `,
    check: "ok",
    note: `These are the PHP 8.4 functions for a plain array. PHP's <code>array_find</code> returns <code>null</code> when nothing matches, the same value a stored <code>null</code> gives. Rust's <code>find</code> returns an <code>Option</code>, so a miss is <code>None</code> and a hit is <code>Some</code>. For an empty list, both languages answer <code>false</code> to any and <code>true</code> to all. Rust's three methods stop at the first item that settles the answer.`,
    chapter: 13
  },
  {
    id: "first-last",
    cat: "lists",
    title: "First and last item",
    php: `
      $nums = [10, 20, 30];
      echo array_first($nums), " ", array_last($nums), "\\n";
      $none = array_first([]); // null for an empty array
      `,
    rust: `
      let nums = vec![10, 20, 30];
      let empty: Vec<i32> = Vec::new();
      println!("{:?} {:?} {:?}", nums.first(), nums.last(), empty.first());
      `,
    check: "ok",
    note: `PHP 8.5's <code>array_first</code> and <code>array_last</code> return the item, or <code>null</code> for an empty array. But an array can also hold <code>null</code>, so a null result does not always mean empty. Rust's <code>first</code> and <code>last</code> return an <code>Option</code> of a reference: <code>None</code> means empty, and a list that holds 0 gives <code>Some(&amp;0)</code>. The reference points into the list, so nothing is copied.`,
    chapter: 12
  },

  /* ---------------------------------------------------------------- maps */
  {
    id: "map-literal",
    cat: "maps",
    title: "Create a map",
    php: `
      $ages = ["ada" => 36, "linus" => 54];
      `,
    rust: `
      use std::collections::HashMap;

      let ages = HashMap::from([("ada", 36), ("linus", 54)]);
      println!("{}", ages.len());
      `,
    check: "ok",
    note: `A PHP array with string keys is an ordered hash map. Rust's <code>HashMap</code> has no order, and <code>BTreeMap</code> keeps its keys sorted. Pick the one whose order you need, not the one that looks most like an array.`,
    chapter: 12
  },
  {
    id: "map-get",
    cat: "maps",
    title: "Read a key with a default",
    php: `
      $ages = ["ada" => 36];
      echo $ages["grace"] ?? 0;
      `,
    rust: `
      use std::collections::HashMap;

      let ages = HashMap::from([("ada", 36)]);
      let age = ages.get("grace").copied().unwrap_or(0);
      println!("{age}");
      `,
    check: "ok",
    note: `A missing key is a warning and null in PHP. In Rust, <code>get</code> returns an <code>Option</code>, and <code>unwrap_or</code> names the fallback where you can read it. <code>ages["grace"]</code> panics on a missing key instead.`,
    chapter: 12
  },
  {
    id: "map-set",
    cat: "maps",
    title: "Set a key",
    php: `
      $ages = [];
      $ages["grace"] = 85;
      `,
    rust: `
      use std::collections::HashMap;

      let mut ages: HashMap<&str, u32> = HashMap::new();
      ages.insert("grace", 85);
      println!("{:?}", ages.get("grace"));
      `,
    check: "ok",
    note: `<code>insert</code> returns the previous value as an <code>Option</code>, so you can see what it replaced. Writing to a map needs <code>mut</code>, and without it the compiler refuses.`,
    chapter: 12
  },
  {
    id: "map-count",
    cat: "maps",
    title: "Count occurrences",
    php: `
      $counts = [];
      foreach (explode(" ", "the cat and the hat") as $word) {
          $counts[$word] = ($counts[$word] ?? 0) + 1;
      }
      echo $counts["the"]; // 2
      `,
    rust: `
      use std::collections::HashMap;

      let mut counts: HashMap<&str, u32> = HashMap::new();
      for word in "the cat and the hat".split_whitespace() {
          *counts.entry(word).or_insert(0) += 1;
      }
      println!("{}", counts["the"]);
      `,
    check: "ok",
    note: `<code>entry</code> looks the key up once and hands back a slot you can update. Indexing with <code>[]</code> panics on a missing key, so use it only when you know the key is there.`,
    chapter: 12
  },
  {
    id: "map-iterate",
    cat: "maps",
    title: "Loop over key and value",
    php: `
      $ages = ["ada" => 36, "linus" => 54];
      foreach ($ages as $name => $age) {
          echo "$name: $age\\n";
      }
      `,
    rust: `
      use std::collections::HashMap;

      let ages = HashMap::from([("ada", 36), ("linus", 54)]);
      for (name, age) in &ages {
          println!("{name}: {age}");
      }
      `,
    check: "ok",
    note: `A <code>HashMap</code> visits its keys in an arbitrary order, and that order can change from one run to the next. PHP keeps insertion order. When the order matters, collect the pairs and sort them, or use a <code>BTreeMap</code>.`,
    chapter: 12
  },
  {
    id: "map-remove",
    cat: "maps",
    title: "Remove a key",
    php: `
      $ages = ["ada" => 36];
      unset($ages["ada"]);
      `,
    rust: `
      use std::collections::HashMap;

      let mut ages = HashMap::from([("ada", 36)]);
      let removed = ages.remove("ada");
      println!("{removed:?}");
      `,
    check: "ok",
    note: `<code>remove</code> hands back the value it removed, as an <code>Option</code>. <code>unset()</code> gives you nothing back, so you cannot use the value it took away.`,
    chapter: 12
  },
  {
    id: "map-contains",
    cat: "maps",
    title: "Check a key exists",
    php: `
      $ages = ["ada" => 36, "grace" => null];
      var_dump(isset($ages["grace"]));           // false: the value is null
      var_dump(array_key_exists("grace", $ages)); // true: the key exists
      `,
    rust: `
      use std::collections::HashMap;

      let ages: HashMap<&str, Option<u32>> =
          HashMap::from([("ada", Some(36)), ("grace", None)]);
      println!("{}", ages.contains_key("grace"));
      println!("{:?}", ages.get("grace").copied().flatten());
      `,
    check: "ok",
    note: `<code>isset</code> is false for a null value, while <code>array_key_exists</code> is true. Rust separates the two questions: <code>contains_key</code> checks the key, and the <code>Option</code> inside the map says whether there is a value.`,
    chapter: 10
  },
  {
    id: "map-sorted",
    cat: "maps",
    title: "Keys in sorted order",
    php: `
      $ages = ["linus" => 54, "ada" => 36];
      ksort($ages);
      foreach ($ages as $name => $age) {
          echo "$name: $age\\n";
      }
      `,
    rust: `
      use std::collections::BTreeMap;

      let ages = BTreeMap::from([("linus", 54), ("ada", 36)]);
      for (name, age) in &ages {
          println!("{name}: {age}");
      }
      `,
    check: "ok",
    note: `A <code>BTreeMap</code> keeps its keys sorted at all times, so there is no <code>ksort</code> to forget. Lookups take logarithmic time rather than average constant time, which is fine for most data sizes.`,
    chapter: 12
  },

  /* ---------------------------------------------------------------- control */
  {
    id: "if-else",
    cat: "control",
    title: "if, else if and else",
    php: `
      $n = -3;
      if ($n > 0) {
          echo "positive";
      } elseif ($n < 0) {
          echo "negative";
      } else {
          echo "zero";
      }
      `,
    rust: `
      let n = -3;
      if n > 0 {
          println!("positive");
      } else if n < 0 {
          println!("negative");
      } else {
          println!("zero");
      }
      `,
    check: "ok",
    note: `The condition needs no parentheses, and the braces are never optional. The condition must be a <code>bool</code>, which the Truthiness entry in Basics explains.`,
    chapter: 4
  },
  {
    id: "if-expression",
    cat: "control",
    title: "if that produces a value",
    php: `
      $n = -3;
      $label = $n > 0 ? "positive" : "negative";
      `,
    rust: `
      let n = -3;
      let label = if n > 0 { "positive" } else { "negative" };
      println!("{label}");
      `,
    check: "ok",
    note: `In Rust <code>if</code> is an expression, so it produces a value, and there is no ternary operator. Both branches must have the same type. A value-producing <code>if</code> needs its <code>else</code>, because without one the result is <code>()</code>.`,
    chapter: 4
  },
  {
    id: "switch-match",
    cat: "control",
    title: "Choose a value with match",
    php: `
      $code = 404;
      $label = match ($code) {
          200 => "ok",
          404 => "not found",
          default => "other",
      };
      `,
    rust: `
      let code = 404;
      let label = match code {
          200 => "ok",
          404 => "not found",
          _ => "other",
      };
      println!("{label}");
      `,
    check: "ok",
    note: `PHP's <code>match</code> has the same shape as Rust's, but it compares with <code>===</code>, so <code>"404"</code> does not match 404. With no matching arm and no <code>default</code>, it throws <code>UnhandledMatchError</code> at runtime. Rust's <code>match</code> must cover every possible value, so a missing case is a build error. The old <code>switch</code> fell through into the next case unless each case ended with <code>break</code>, and Rust has no fall-through.`,
    chapter: 10
  },
  {
    id: "match-patterns",
    cat: "control",
    title: "match on ranges",
    php: `
      $n = -3;
      $label = match (true) {
          $n < 0   => "negative",
          $n === 0 => "zero",
          default  => "positive",
      };
      `,
    rust: `
      let n = -3;
      let label = match n {
          ..=-1 => "negative",
          0 => "zero",
          1.. => "positive",
      };
      println!("{label}");
      `,
    check: "ok",
    note: `PHP has no range patterns, so <code>match (true)</code> tests each condition in turn and takes the first arm that is true. Rust matches on the value itself, with range patterns, and the compiler checks that every case is covered. A PHP <code>match</code> with no arm that fits throws at runtime, while Rust rejects a missing case at build time.`,
    chapter: 10
  },
  {
    id: "foreach",
    cat: "control",
    title: "foreach over a list",
    php: `
      $nums = [1, 2, 3];
      foreach ($nums as $n) {
          echo $n;
      }
      `,
    rust: `
      let nums = vec![1, 2, 3];
      for n in &nums {
          println!("{n}");
      }
      println!("still have {} items", nums.len());
      `,
    check: "ok",
    note: `<code>for n in &amp;nums</code> borrows the list, so <code>nums</code> is still usable after the loop. <code>for n in nums</code> would move the <code>Vec</code> into the loop, and <code>nums</code> would be gone.`,
    chapter: 7
  },
  {
    id: "range-loop",
    cat: "control",
    title: "Count with a range",
    php: `
      for ($i = 0; $i < 3; $i++) {
          echo $i;
      }
      `,
    rust: `
      for i in 0..3 {
          println!("{i}");
      }
      `,
    check: "ok",
    note: `<code>0..3</code> stops before 3, like <code>$i &lt; 3</code>. Use <code>0..=3</code> to include the end. The loop variable is a fresh, immutable binding on each pass.`,
    chapter: 4
  },
  {
    id: "while-let",
    cat: "control",
    title: "Loop while a value exists",
    php: `
      $queue = ["email", "invoice"];
      while (($job = array_pop($queue)) !== null) {
          echo "running $job\\n";
      }
      `,
    rust: `
      let mut queue = vec!["email", "invoice"];
      while let Some(job) = queue.pop() {
          println!("running {job}");
      }
      `,
    check: "ok",
    note: `<code>pop</code> returns an <code>Option</code>, so the loop ends on <code>None</code>. PHP's <code>array_pop</code> returns null, which can also be a stored value. In Rust, "no item" and "an item" can never look the same, because there is no null that both could share.`,
    chapter: 10
  },
  {
    id: "loop-break-value",
    cat: "control",
    title: "Loop that returns a value",
    php: `
      $attempts = 0;
      while (true) {
          $attempts++;
          if ($attempts === 3) {
              break;
          }
      }
      echo "ready after $attempts";
      `,
    rust: `
      let mut attempts = 0;
      let ready_after = loop {
          attempts += 1;
          if attempts == 3 {
              break attempts;
          }
      };
      println!("ready after {ready_after}");
      `,
    check: "ok",
    note: `<code>loop</code> can return a value with <code>break value</code>. PHP has no equivalent, so the usual workaround is a <code>while (true)</code> loop and a variable that lives outside it.`,
    chapter: 4
  },
  {
    id: "labeled-break",
    cat: "control",
    title: "Break out of nested loops",
    php: `
      for ($row = 0; $row < 3; $row++) {
          for ($col = 0; $col < 3; $col++) {
              if ($row * $col === 2) {
                  echo "found $row,$col";
                  break 2;
              }
          }
      }
      `,
    rust: `
      'rows: for row in 0..3 {
          for col in 0..3 {
              if row * col == 2 {
                  println!("found {row},{col}");
                  break 'rows;
              }
          }
      }
      `,
    check: "ok",
    note: `PHP's <code>break 2</code> counts loop levels, so adding a loop changes what it breaks. A Rust label such as <code>'rows</code> names the loop itself, and it keeps working when the code moves.`,
    chapter: 4
  },
  {
    id: "let-else",
    cat: "control",
    title: "Guard clause with let else",
    php: `
      function firstWord(string $s): string {
          $word = array_first(explode(" ", mb_trim($s))) ?? "";
          if ($word === "") {
              return "(empty)";
          }
          return $word;
      }
      echo firstWord("  hello world");
      `,
    rust: `
      fn first_word(s: &str) -> &str {
          let Some(word) = s.split_whitespace().next() else {
              return "(empty)";
          };
          word
      }
      println!("{}", first_word("  hello world"));
      `,
    check: "ok",
    note: `<code>let else</code> takes the failure branch when the pattern does not match, and that branch must leave: <code>return</code>, <code>break</code>, <code>continue</code> or a panic. It is the guard clause that replaces a nested <code>if</code>.`,
    chapter: 10
  },
  /* ---------------------------------------------------------------- functions */
  {
    id: "fn-typed",
    cat: "functions",
    title: "Typed parameters and return",
    php: `
      function add(int $a, int $b): int {
          return $a + $b;
      }
      echo add(2, 3);
      `,
    rust: `
      fn add(a: i32, b: i32) -> i32 {
          a + b
      }
      println!("{}", add(2, 3));
      `,
    check: "ok",
    note: `Parameter types and the return type are required. The last expression without a semicolon is the return value, and <code>return</code> is for leaving early. Add a semicolon after <code>a + b</code> and the function returns <code>()</code>, which does not match <code>i32</code>.`,
    chapter: 4
  },
  {
    id: "fn-default-args",
    cat: "functions",
    title: "Default values",
    php: `
      function greet(string $name = "guest"): string {
          return "Hello, $name";
      }
      echo greet();
      `,
    rust: `
      fn greet(name: Option<&str>) -> String {
          format!("Hello, {}", name.unwrap_or("guest"))
      }
      println!("{}", greet(None));
      println!("{}", greet(Some("Ada")));
      `,
    check: "ok",
    note: `Rust has no default parameters. Take an <code>Option</code> and say what <code>None</code> means, or pass a struct that derives <code>Default</code>, as in Named arguments as a struct.`,
    chapter: 4
  },
  {
    id: "fn-named-args",
    cat: "functions",
    title: "Named arguments as a struct",
    php: `
      class NewUser {
          public function __construct(
              public string $name,
              public bool $admin = false,
          ) {}
      }
      $user = new NewUser(admin: true, name: "Ada");
      echo "{$user->name} admin=" . var_export($user->admin, true);
      `,
    rust: `
      #[derive(Default)]
      struct NewUser {
          name: String,
          admin: bool,
      }

      let user = NewUser { name: "Ada".into(), admin: true };
      println!("{} admin={}", user.name, user.admin);
      `,
    check: "ok",
    note: `PHP's named arguments can skip a parameter that has a default, and an unknown name throws an <code>Error</code> when the call runs. Rust has no named arguments, so the closest thing is a struct with named fields. Field names are checked at build time, and a missing field is a build error. Add <code>..Default::default()</code> to the literal to fill in the rest with defaults.`,
    chapter: 9
  },
  {
    id: "fn-variadic",
    cat: "functions",
    title: "Any number of arguments",
    php: `
      function sum(int ...$nums): int {
          return array_sum($nums);
      }
      echo sum(1, 2, 3);
      `,
    rust: `
      fn sum(nums: &[i32]) -> i32 {
          nums.iter().sum()
      }
      println!("{}", sum(&[1, 2, 3]));
      `,
    check: "ok",
    note: `Ordinary Rust functions have no variadic parameters. Take a slice instead. An array, a <code>Vec</code> or a sub-range all become a <code>&amp;[T]</code> without copying. <code>println!</code> is a macro, which is why it can take any number of arguments.`,
    chapter: 8
  },
  {
    id: "fn-multi-return",
    cat: "functions",
    title: "Return two values",
    php: `
      function minMax(array $nums): ?array {
          if ($nums === []) {
              return null;
          }
          return [min($nums), max($nums)];
      }
      [$lo, $hi] = minMax([4, 9, 2]);
      `,
    rust: `
      fn min_max(nums: &[i32]) -> Option<(i32, i32)> {
          let min = *nums.iter().min()?;
          let max = *nums.iter().max()?;
          Some((min, max))
      }
      if let Some((lo, hi)) = min_max(&[4, 9, 2]) {
          println!("{lo}..{hi}");
      }
      `,
    check: "ok",
    note: `The tuple is the multi-value return. An empty input has no minimum, so the function returns an <code>Option</code>. PHP's <code>min()</code> throws a <code>ValueError</code> on an empty array, so the PHP side checks for an empty array first.`,
    chapter: 4
  },
  {
    id: "fn-closure",
    cat: "functions",
    title: "Closures",
    php: `
      $factor = 3;
      $times = fn(int $n): int => $n * $factor;
      echo $times(5);
      `,
    rust: `
      let factor = 3;
      let times = |n: i32| n * factor;
      println!("{}", times(5));
      `,
    check: "ok",
    note: `A closure captures the variables it uses. PHP's arrow function copies <code>$factor</code> in automatically, and a plain closure needs <code>use ()</code>. Rust decides for each captured variable whether to borrow it or move it, based on how the closure uses it.`,
    chapter: 13
  },
  {
    id: "fn-mut-ref",
    cat: "functions",
    title: "Change an argument in place",
    php: `
      function addTag(array &$tags, string $tag): void {
          $tags[] = $tag;
      }
      $tags = [];
      addTag($tags, "rust");
      `,
    rust: `
      fn add_tag(tags: &mut Vec<String>, tag: &str) {
          tags.push(tag.to_string());
      }
      let mut tags = Vec::new();
      add_tag(&mut tags, "rust");
      println!("{tags:?}");
      `,
    check: "ok",
    note: `<code>&amp;mut</code> is an exclusive borrow. While it exists, nothing else can read <code>tags</code>. PHP's <code>&amp;</code> is an alias that anything can reach. PHP objects are passed as handles without any marker, and Rust asks for <code>&amp;mut</code> at the call site.`,
    chapter: 7
  },
  {
    id: "fn-lend-value",
    cat: "functions",
    title: "Lend a value, do not hand it over",
    php: `
      function measure(string $name): int {
          return strlen($name);
      }
      $name = "Ada";
      $n = measure($name);
      echo "$n $name";
      `,
    rust: `
      fn measure(name: &str) -> usize {
          name.len()
      }
      let name = String::from("Ada");
      let n = measure(&name);
      println!("{n} {name}");
      `,
    check: "ok",
    note: `PHP copies strings and arrays on assignment and passes objects as handles. In Rust, a <code>String</code> passed by value moves into the function, and the caller can no longer use it. Pass <code>&amp;name</code> to lend it, and the function gets a borrow that ends when the call does.`,
    chapter: 6
  },

  /* ---------------------------------------------------------------- oop */
  {
    id: "class-struct",
    cat: "oop",
    title: "Class with properties",
    php: `
      class User {
          public function __construct(
              public string $name,
              private int $age,
          ) {}
      }
      $user = new User("Ada", 36);
      `,
    rust: `
      struct User {
          name: String,
          age: u8,
      }

      let user = User { name: String::from("Ada"), age: 36 };
      println!("{} {}", user.name, user.age);
      `,
    check: "ok",
    note: `A struct holds data only. Its fields are private to their module unless marked <code>pub</code>. There is no constructor promotion, so you write the literal yourself or add a constructor function (see Constructors).`,
    chapter: 9
  },
  {
    id: "methods",
    cat: "oop",
    title: "Methods on a type",
    php: `
      class User {
          public function __construct(public string $name) {}
          public function greet(): string {
              return "Hi {$this->name}";
          }
      }
      echo new User("Ada")->greet();
      `,
    rust: `
      struct User {
          name: String,
      }

      impl User {
          fn greet(&self) -> String {
              format!("Hi {}", self.name)
          }
      }

      let user = User { name: String::from("Ada") };
      println!("{}", user.greet());
      `,
    check: "ok",
    note: `<code>&amp;self</code> is <code>$this</code>, borrowed for reading. <code>&amp;mut self</code> can change fields, and <code>self</code> takes ownership and consumes the value. The signature says which one, so a method that changes state is visible from the outside.`,
    chapter: 9
  },
  {
    id: "constructor",
    cat: "oop",
    title: "Constructors",
    php: `
      class User {
          public function __construct(
              public string $name,
              public int $age,
          ) {}
      }
      $user = new User("Ada", 36);
      `,
    rust: `
      struct User {
          name: String,
          age: u8,
      }

      impl User {
          fn new(name: &str, age: u8) -> Self {
              Self { name: name.to_string(), age }
          }
      }

      let user = User::new("Ada", 36);
      println!("{} {}", user.name, user.age);
      `,
    check: "ok",
    note: `<code>new</code> is an ordinary function by convention, not a keyword. Because it is a normal function, it can return a <code>Result</code> when construction can fail. A PHP constructor cannot return a value, so a constructor that can fail has to throw.`,
    chapter: 9
  },
  {
    id: "interface-trait",
    cat: "oop",
    title: "Interface becomes trait",
    php: `
      interface Shape {
          public function area(): float;
      }
      class Circle implements Shape {
          public function __construct(private readonly float $r) {}
          #[\\Override]
          public function area(): float {
              return M_PI * $this->r ** 2;
          }
      }
      printf("%.2f\\n", new Circle(2.0)->area());
      `,
    rust: `
      use std::f64::consts::PI;

      trait Shape {
          fn area(&self) -> f64;
      }

      struct Circle {
          r: f64,
      }

      impl Shape for Circle {
          fn area(&self) -> f64 {
              PI * self.r * self.r
          }
      }

      println!("{:.2}", Circle { r: 2.0 }.area());
      `,
    check: "ok",
    note: `You can implement your own trait for types you did not write, such as <code>i32</code> or <code>String</code>. A PHP interface attaches only to classes you can edit. Rust's rule is that you must own either the trait or the type.`,
    chapter: 14
  },
  {
    id: "abstract-trait",
    cat: "oop",
    title: "Abstract class becomes trait",
    php: `
      abstract class Model {
          abstract protected function table(): string;
          public function describe(): string {
              return "table: " . $this->table();
          }
      }
      class User extends Model {
          #[\\Override]
          protected function table(): string { return "users"; }
      }
      echo new User()->describe();
      `,
    rust: `
      trait Model {
          fn table(&self) -> &str;

          fn describe(&self) -> String {
              format!("table: {}", self.table())
          }
      }

      struct User;

      impl Model for User {
          fn table(&self) -> &str {
              "users"
          }
      }

      println!("{}", User.describe());
      `,
    check: "ok",
    note: `A trait's default methods play the part of concrete methods on an abstract class. A trait cannot hold fields, though. If the shared behavior needs state, put the state in a struct and implement the trait on that struct.`,
    chapter: 14
  },
  {
    id: "inheritance-composition",
    cat: "oop",
    title: "Inheritance becomes composition",
    php: `
      class User {
          public function __construct(public string $name) {}
      }
      final class Admin extends User {
          public function __construct(string $name, public int $level) {
              parent::__construct($name);
          }
      }
      $admin = new Admin("Ada", 3);
      echo "{$admin->name} {$admin->level}";
      `,
    rust: `
      struct User {
          name: String,
      }

      struct Admin {
          user: User,
          level: u8,
      }

      let admin = Admin { user: User { name: String::from("Ada") }, level: 3 };
      println!("{} {}", admin.user.name, admin.level);
      `,
    check: "ok",
    note: `Rust has no inheritance. Reuse comes from putting one struct inside another, as here, and from traits for shared behavior. <code>Deref</code> can make a wrapper behave like the type it wraps, but use it sparingly.`,
    chapter: 9
  },
  {
    id: "visibility",
    cat: "oop",
    title: "Public and private",
    php: `
      class Invoice {
          public int $total;
          private bool $paid = false;
          public function isPaid(): bool {
              return $this->paid;
          }
      }
      `,
    rust: `
      mod billing {
          pub struct Invoice {
              pub total: u32,
              paid: bool,
          }

          impl Invoice {
              pub fn new(total: u32) -> Self {
                  Self { total, paid: false }
              }

              pub fn is_paid(&self) -> bool {
                  self.paid
              }
          }
      }

      let invoice = billing::Invoice::new(500);
      println!("{} {}", invoice.total, invoice.is_paid());
      `,
    check: "ok",
    note: `Rust privacy is per module, not per class. Code in the same module can read private fields. There is no <code>protected</code>, because there are no subclasses to grant access to. <code>pub(crate)</code> makes an item visible across the whole crate.`,
    chapter: 16
  },
  {
    id: "display-tostring",
    cat: "oop",
    title: "__toString becomes Display",
    php: `
      class User {
          public function __construct(private string $name) {}
          public function __toString(): string {
              return $this->name;
          }
      }
      echo new User("Ada");
      `,
    rust: `
      use std::fmt;

      struct User {
          name: String,
      }

      impl fmt::Display for User {
          fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
              write!(f, "{}", self.name)
          }
      }

      let user = User { name: String::from("Ada") };
      println!("{user}");
      `,
    check: "ok",
    note: `<code>Display</code> is the trait behind <code>{}</code>, and Rust never converts to a string for you. You write the impl once. <code>Debug</code>, from <code>#[derive(Debug)]</code>, is the developer view that <code>{:?}</code> uses.`,
    chapter: 9
  },
  {
    id: "enum-variants",
    cat: "oop",
    title: "Enum with data",
    php: `
      enum PaymentStatus: string {
          case Paid = 'paid';
          case Pending = 'pending';
      }
      `,
    rust: `
      enum Payment {
          Paid { amount: u32 },
          Pending,
          Refunded(u32),
      }

      let payment = Payment::Refunded(500);
      let label = match payment {
          Payment::Paid { amount } => format!("paid {amount}"),
          Payment::Pending => String::from("pending"),
          Payment::Refunded(amount) => format!("refunded {amount}"),
      };
      println!("{label}");
      `,
    check: "ok",
    note: `A PHP enum is a fixed set of named cases, optionally backed by one scalar. A Rust enum variant can carry its own data, so each variant can have different fields. A <code>match</code> on it must handle every variant.`,
    chapter: 10
  },
  {
    id: "clone-with",
    cat: "oop",
    title: "Copy an object with one field changed",
    php: `
      final class Point {
          public function __construct(
              public readonly int $x,
              public readonly int $y,
          ) {}

          public function withX(int $x): static {
              return clone($this, ['x' => $x]);
          }
      }
      $origin = new Point(0, 0);
      $moved = $origin->withX(5);
      echo "{$moved->x},{$moved->y}";
      `,
    rust: `
      #[derive(Debug)]
      struct Point {
          x: i32,
          y: i32,
      }

      let origin = Point { x: 0, y: 0 };
      let moved = Point { x: 5, ..origin };
      println!("{origin:?} {moved:?}");
      `,
    check: "ok",
    note: `PHP 8.5's clone-with copies the object, then sets the named properties on the copy. Outside the class, that fails for readonly properties and throws an <code>Error</code> at runtime. Rust's struct update syntax sits inside the struct literal, so the compiler checks every field name and type. Fields you leave out come from <code>origin</code>. If one of them is not <code>Copy</code>, it moves out of <code>origin</code>. These fields are all <code>Copy</code>, so <code>origin</code> still works.`,
    chapter: 9
  },
  {
    id: "property-hook",
    cat: "oop",
    title: "A computed property with a hook",
    php: `
      class Name {
          public function __construct(
              private string $first,
              private string $last,
          ) {}

          public string $full {
              get => "{$this->first} {$this->last}";
          }
      }
      $name = new Name("Ada", "Lovelace");
      echo $name->full;
      `,
    rust: `
      struct Name {
          first: String,
          last: String,
      }

      impl Name {
          fn full(&self) -> String {
              format!("{} {}", self.first, self.last)
          }
      }

      let name = Name { first: "Ada".into(), last: "Lovelace".into() };
      println!("{}", name.full());
      `,
    check: "ok",
    note: `A PHP <code>get</code> hook runs each time the property is read, and the caller writes <code>$name-&gt;full</code> with no parentheses. Rust has no property syntax, so the same value is a method, and the caller writes <code>name.full()</code>. A <code>set</code> hook runs on assignment and can check or change the value first. Rust does that in a setter method that the caller has to call by name.`,
    chapter: 9
  },
  {
    id: "asymmetric-visibility",
    cat: "oop",
    title: "Read from outside, write only inside",
    php: `
      class Invoice {
          public private(set) bool $paid = false;

          public function markPaid(): void {
              $this->paid = true;
          }
      }
      $invoice = new Invoice();
      $invoice->markPaid();
      echo $invoice->paid ? "paid" : "open";
      `,
    rust: `
      mod billing {
          pub struct Invoice {
              paid: bool,
          }

          impl Invoice {
              pub fn new() -> Self {
                  Self { paid: false }
              }

              pub fn mark_paid(&mut self) {
                  self.paid = true;
              }

              pub fn is_paid(&self) -> bool {
                  self.paid
              }
          }
      }

      let mut invoice = billing::Invoice::new();
      invoice.mark_paid();
      println!("{}", if invoice.is_paid() { "paid" } else { "open" });
      `,
    check: "ok",
    note: `<code>public private(set)</code> lets any code read <code>paid</code>, and only the class can write it. The rule is enforced at runtime: a write from outside throws an <code>Error</code> when that line runs. Rust gets the same shape from a private field and a <code>pub</code> getter. A write from outside the module is a build error, and the compiler reports it before the program runs.`,
    chapter: 9
  },
  {
    id: "readonly-class",
    cat: "oop",
    title: "A class that cannot change",
    php: `
      readonly class Money {
          public function __construct(
              public int $cents,
              public string $currency,
          ) {}
      }
      $price = new Money(500, "USD");
      echo "{$price->cents} {$price->currency}";
      `,
    rust: `
      struct Money {
          cents: u64,
          currency: &'static str,
      }

      let price = Money { cents: 500, currency: "USD" };
      println!("{} {}", price.cents, price.currency);
      `,
    check: "ok",
    note: `A <code>readonly class</code> lets each property be set once, from inside the class, and any later write throws an <code>Error</code> at runtime. Rust makes the same choice with no keyword: a binding without <code>mut</code> cannot change any field. Writing <code>price.cents = 1</code> is error E0594, and the program does not build. Add <code>mut</code> only where the value really changes.`,
    chapter: 9
  },

  /* ---------------------------------------------------------------- errors */
  {
    id: "try-catch",
    cat: "errors",
    title: "try and catch become Result",
    php: `
      function parsePort(string $raw): int {
          $port = filter_var($raw, FILTER_VALIDATE_INT);
          if ($port === false) {
              throw new InvalidArgumentException("not a number: $raw");
          }
          if ($port < 1) {
              throw new InvalidArgumentException("port must be at least 1");
          }
          return $port;
      }
      try {
          echo parsePort("0");
      } catch (InvalidArgumentException $e) {
          echo "error: {$e->getMessage()}";
      }
      `,
    rust: `
      fn parse_port(raw: &str) -> Result<u16, String> {
          let port: u16 = raw
              .parse()
              .map_err(|_| format!("not a number: {raw}"))?;
          if port == 0 {
              return Err(String::from("port must be at least 1"));
          }
          Ok(port)
      }

      match parse_port("0") {
          Ok(port) => println!("port {port}"),
          Err(e) => println!("error: {e}"),
      }
      `,
    check: "ok",
    note: `Nothing is thrown. The failure is part of the return type, so the caller has to handle it, and the match arms play the part of the catch blocks. Panics do unwind through calls, but they are for bugs, not for failures you expect. Crash on purpose with expect covers them.`,
    chapter: 11
  },
  {
    id: "custom-error-enum",
    cat: "errors",
    title: "Your own error type",
    php: `
      class PortError extends DomainException {}
      final class OutOfRange extends PortError {}
      try {
          throw new OutOfRange("port 0 is out of range");
      } catch (PortError $e) {
          echo $e->getMessage();
      }
      `,
    rust: `
      use std::fmt;

      #[derive(Debug)]
      enum PortError {
          NotANumber(String),
          OutOfRange(u16),
      }

      impl fmt::Display for PortError {
          fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
              match self {
                  PortError::NotANumber(raw) => write!(f, "not a number: {raw}"),
                  PortError::OutOfRange(port) => write!(f, "port {port} is out of range"),
              }
          }
      }

      impl std::error::Error for PortError {}

      let err = PortError::OutOfRange(0);
      println!("{err}");
      `,
    check: "ok",
    note: `The enum's variants are the error kinds. A caller can match on them, and the compiler makes it handle each one, which a catch block cannot promise. Add a variant and every match on the enum stops compiling until it handles the new case. Add a subclass in PHP and the existing catch blocks still compile. <code>Display</code> gives the message, and <code>Error</code> lets the error travel as a <code>Box&lt;dyn Error&gt;</code>.`,
    chapter: 11
  },
  {
    id: "thiserror-enum",
    cat: "errors",
    title: "The same error with thiserror",
    php: `
      final class NotANumber extends DomainException {
          public function __construct(string $raw) {
              parent::__construct("not a number: $raw");
          }
      }
      `,
    rust: `
      use thiserror::Error;

      #[derive(Debug, Error)]
      enum PortError {
          #[error("not a number: {0}")]
          NotANumber(String),
          #[error("port {0} is out of range")]
          OutOfRange(u16),
      }
      `,
    check: "skip",
    note: `<code>thiserror</code> writes the <code>Display</code> and <code>Error</code> impls from the <code>#[error]</code> attributes. Libraries use it so that callers can match on the variants. Applications usually reach for <code>anyhow</code> instead.`,
    chapter: 11
  },
  {
    id: "question-mark",
    cat: "errors",
    title: "The ? operator",
    php: `
      function readPort(string $raw): int {
          $port = filter_var($raw, FILTER_VALIDATE_INT);
          if ($port === false) {
              throw new InvalidArgumentException("not a number");
          }
          return $port;
      }
      `,
    rust: `
      use std::num::ParseIntError;

      fn read_port(raw: &str) -> Result<u16, ParseIntError> {
          let port = raw.trim().parse::<u16>()?;
          Ok(port)
      }

      println!("{:?}", read_port(" 8080 "));
      println!("{:?}", read_port("http"));
      `,
    check: "ok",
    note: `<code>?</code> returns early with the <code>Err</code> when the value is an error, and it converts the error with <code>From</code> when the types differ. It is the exit ramp from the happy path. The function's return type must be a <code>Result</code> or an <code>Option</code> for <code>?</code> to work.`,
    chapter: 11
  },
  {
    id: "option-chain",
    cat: "errors",
    title: "Nullsafe chain with defaults",
    php: `
      class User {
          public function __construct(public string $name) {}
      }
      function findUser(int $id): ?User {
          return match ($id) {
              1 => new User("Ada"),
              default => null,
          };
      }
      $name = findUser(2)?->name ?? "guest";
      echo $name;
      `,
    rust: `
      struct User {
          name: String,
      }

      fn find_user(id: u32) -> Option<User> {
          (id == 1).then(|| User { name: String::from("Ada") })
      }

      let name = find_user(2).map(|u| u.name).unwrap_or_else(|| "guest".to_string());
      println!("{name}");
      `,
    check: "ok",
    note: `<code>?-&gt;</code> stops at null and <code>??</code> supplies the default. In Rust, <code>map</code> runs its closure only for <code>Some</code>, and <code>unwrap_or_else</code> supplies the default. The return type says the user may be missing, so you cannot forget the check.`,
    chapter: 10
  },
  {
    id: "unwrap-expect",
    cat: "errors",
    title: "Crash on purpose with expect",
    php: `
      $key = getenv("APP_KEY") ?: throw new RuntimeException("APP_KEY must be set");
      `,
    rust: `
      let key = std::env::var("APP_KEY").expect("APP_KEY must be set");
      println!("key has {} chars", key.len());
      `,
    check: "ok",
    note: `<code>unwrap</code> and <code>expect</code> panic when the value is missing. That is right for setup that must succeed, and for tests. In library code, an unwrap is a crash waiting for a caller who did not expect it. Return the error instead, and let the caller decide.`,
    chapter: 11
  },
  {
    id: "finally-drop",
    cat: "errors",
    title: "finally becomes Drop",
    php: `
      $handle = fopen("notes.txt", "r");
      try {
          echo fgets($handle);
      } finally {
          fclose($handle);
      }
      `,
    rust: `
      struct Guard(&'static str);

      impl Drop for Guard {
          fn drop(&mut self) {
              println!("cleanup {}", self.0);
          }
      }

      {
          let _guard = Guard("file");
          println!("working");
      }
      println!("after the block");
      `,
    check: "ok",
    note: `There is no <code>finally</code>. <code>Drop</code> runs when the owner goes out of scope: on the normal path, on an early return and during a panic. Name the binding <code>_guard</code>, because a bare <code>_</code> drops the value at once. A <code>File</code> closes itself the same way.`,
    chapter: 6
  },
  {
    id: "error-source",
    cat: "errors",
    title: "Chain an error to its cause",
    php: `
      try {
          loadConfig();
      } catch (RuntimeException $e) {
          echo $e->getMessage();
          echo $e->getPrevious()?->getMessage();
      }
      `,
    rust: `
      use std::error::Error;
      use std::fmt;

      #[derive(Debug)]
      struct ConfigError {
          source: std::num::ParseIntError,
      }

      impl fmt::Display for ConfigError {
          fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
              write!(f, "could not load config")
          }
      }

      impl Error for ConfigError {
          fn source(&self) -> Option<&(dyn Error + 'static)> {
              Some(&self.source)
          }
      }

      let err = "http".parse::<u16>().map_err(|e| ConfigError { source: e }).unwrap_err();
      println!("{err}");
      if let Some(cause) = err.source() {
          println!("caused by: {cause}");
      }
      `,
    check: "ok",
    note: `PHP links errors with <code>getPrevious()</code>. Rust's <code>Error</code> trait has a <code>source()</code> method that walks the same chain. Each layer should say what it was doing, and the cause should come from <code>source</code>. The <code>anyhow</code> crate adds context for you.`,
    chapter: 11
  },
  {
    id: "assert-check",
    cat: "errors",
    title: "Assert an invariant",
    php: `
      $count = -1;
      assert($count >= 0, "count went negative");
      `,
    rust: `
      let count: i32 = -1;
      assert!(count >= 0, "count went negative");
      `,
    check: "ok",
    note: `<code>assert!</code> runs in release builds too, and <code>debug_assert!</code> runs only in debug builds. PHP's <code>assert()</code> is usually switched off in production with <code>zend.assertions = -1</code>, so do not rely on it for checks that matter.`,
    chapter: 11
  },
  /* ---------------------------------------------------------------- collections */
  {
    id: "collect-pluck",
    cat: "collections",
    title: "pluck a field",
    php: `
      $users = collect([
          ['name' => 'Ada', 'role' => 'admin'],
          ['name' => 'Linus', 'role' => 'dev'],
      ]);
      $names = $users->pluck('name')->all();
      `,
    rust: `
      struct User {
          name: String,
          role: String,
      }

      let users = [
          User { name: "Ada".into(), role: "admin".into() },
          User { name: "Linus".into(), role: "dev".into() },
      ];
      let names: Vec<&str> = users.iter().map(|u| u.name.as_str()).collect();
      println!("{names:?}");
      `,
    check: "ok",
    note: `<code>pluck</code> reads a key by name at runtime. In Rust, <code>u.name</code> is checked when the program compiles, so a typo is a build error and not a null in the output. The <code>Vec&lt;&amp;str&gt;</code> borrows from <code>users</code>.`,
    chapter: 13
  },
  {
    id: "collect-first-where",
    cat: "collections",
    title: "First item that matches",
    php: `
      $admin = $users->firstWhere('role', 'admin'); // null if none
      `,
    rust: `
      struct User {
          name: &'static str,
          role: &'static str,
      }

      let users = [
          User { name: "Ada", role: "admin" },
          User { name: "Linus", role: "dev" },
      ];
      if let Some(user) = users.iter().find(|u| u.role == "admin") {
          println!("{}", user.name);
      }
      `,
    check: "ok",
    note: `<code>firstWhere</code> returns null when nothing matches. <code>find</code> returns an <code>Option</code>, and the pattern makes the empty case explicit. Like <code>firstWhere</code>, it stops at the first match.`,
    chapter: 13
  },
  {
    id: "collect-group-by",
    cat: "collections",
    title: "Group by a field",
    php: `
      $byRole = collect($users)->groupBy('role');
      echo count($byRole['dev']);
      `,
    rust: `
      use std::collections::HashMap;

      let users = [("Ada", "admin"), ("Linus", "dev"), ("Grace", "dev")];
      let mut by_role: HashMap<&str, Vec<&str>> = HashMap::new();
      for (name, role) in users {
          by_role.entry(role).or_default().push(name);
      }
      println!("{}", by_role["dev"].len());
      `,
    check: "ok",
    note: `The standard library has no keyed <code>groupBy</code>. <code>chunk_by</code> groups only neighboring items that share a key. For a real group-by, write the loop with <code>entry().or_default()</code>, or use the <code>itertools</code> crate. Either way the grouping is visible in the code.`,
    chapter: 12
  },
  {
    id: "collect-sort-by",
    cat: "collections",
    title: "Sort by a field",
    php: `
      $sorted = $users->sortBy('age')->values()->all();
      `,
    rust: `
      struct User {
          name: &'static str,
          age: u8,
      }

      let mut users = [
          User { name: "Linus", age: 54 },
          User { name: "Ada", age: 36 },
      ];
      users.sort_by_key(|u| u.age);
      println!("{}", users[0].name);
      `,
    check: "ok",
    note: `<code>sortBy</code> returns a new collection and leaves the original alone. <code>sort_by_key</code> changes the list in place, which is why it needs <code>mut</code>. To keep the original order, collect <code>users.iter()</code> into a <code>Vec</code> of references and sort that.`,
    chapter: 13
  },
  {
    id: "collect-sum-avg",
    cat: "collections",
    title: "Sum and average",
    php: `
      $orders = collect([['total' => 1200], ['total' => 850]]);
      $sum = $orders->sum('total'); // 2050
      $avg = $orders->avg('total'); // 1025
      `,
    rust: `
      struct Order {
          total: u32,
      }

      let orders = [Order { total: 1200 }, Order { total: 850 }];
      let sum: u32 = orders.iter().map(|o| o.total).sum();
      let avg = f64::from(sum) / orders.len() as f64;
      println!("{sum} {avg:.1}");
      `,
    check: "ok",
    note: `Laravel's <code>avg()</code> on an empty collection returns null. In Rust, dividing a float by zero gives infinity or NaN rather than a panic, so check <code>is_empty()</code> before you divide. Integer division by zero, by contrast, does panic.`,
    chapter: 13
  },
  {
    id: "collect-chunk",
    cat: "collections",
    title: "Split into chunks",
    php: `
      $chunks = collect([1, 2, 3, 4, 5])->chunk(2)->all();
      `,
    rust: `
      let nums = [1, 2, 3, 4, 5];
      for chunk in nums.chunks(2) {
          println!("{chunk:?}");
      }
      `,
    check: "ok",
    note: `<code>chunks</code> gives slices that point into <code>nums</code>, so nothing is copied. As with Laravel's <code>chunk</code>, the last piece can be shorter. Laravel returns a collection of collections, and Rust returns an iterator over slices.`,
    chapter: 13
  },
  {
    id: "collect-reduce",
    cat: "collections",
    title: "Reduce to one value",
    php: `
      $longest = collect(["ada", "grace", "linus"])
          ->reduce(fn($carry, $n) => strlen($n) > strlen($carry) ? $n : $carry, "");
      `,
    rust: `
      let names = ["ada", "grace", "linus"];
      let longest = names
          .iter()
          .copied()
          .fold("", |acc, n| if n.len() > acc.len() { n } else { acc });
      println!("{longest}");
      `,
    check: "ok",
    note: `<code>fold</code> is <code>reduce</code>. It takes the starting value first, then a closure that gets the accumulator and the next item. <code>fold</code> always visits every item. <code>try_fold</code> stops early on the first error.`,
    chapter: 13
  },
  {
    id: "collect-unique",
    cat: "collections",
    title: "Remove duplicates",
    php: `
      $tags = collect(['rust', 'php', 'rust']);
      $unique = $tags->unique()->values()->all();
      `,
    rust: `
      use std::collections::HashSet;

      let tags = ["rust", "php", "rust"];
      let unique: HashSet<&str> = tags.iter().copied().collect();
      println!("{}", unique.len());
      `,
    check: "ok",
    note: `A <code>HashSet</code> drops duplicates and has no order. Laravel's <code>unique()</code> keeps the first occurrence in its original order. For first-seen order in Rust, use an <code>IndexSet</code> from the <code>indexmap</code> crate.`,
    chapter: 12
  },
  {
    id: "collect-key-by",
    cat: "collections",
    title: "Index items by a key",
    php: `
      $byId = collect([
          ['id' => 1, 'name' => 'Ada'],
          ['id' => 2, 'name' => 'Linus'],
      ])->keyBy('id');
      echo $byId[2]['name'];
      `,
    rust: `
      use std::collections::HashMap;

      struct User {
          id: u32,
          name: &'static str,
      }

      let users = [User { id: 1, name: "Ada" }, User { id: 2, name: "Linus" }];
      let by_id: HashMap<u32, &User> = users.iter().map(|u| (u.id, u)).collect();
      println!("{}", by_id[&2].name);
      `,
    check: "ok",
    note: `A duplicate key keeps the last item, and <code>keyBy</code> does the same. A <code>HashMap</code> has no order, so use a <code>BTreeMap</code> when you need the entries sorted by id.`,
    chapter: 12
  },
  {
    id: "collect-take",
    cat: "collections",
    title: "Take the first few",
    php: `
      $first = collect([1, 2, 3, 4])->take(2)->all(); // [1, 2]
      `,
    rust: `
      let nums = [1, 2, 3, 4];
      let first: Vec<i32> = nums.iter().take(2).copied().collect();
      println!("{first:?}");
      `,
    check: "ok",
    note: `Laravel's <code>take()</code> builds a new collection right away. Rust's <code>take</code> is lazy: it pulls only two items from the source, so the same code works on a long or endless sequence.`,
    chapter: 13
  },

  /* ---------------------------------------------------------------- io */
  {
    id: "io-read-file",
    cat: "io",
    title: "Read a file",
    php: `
      $text = file_get_contents("notes.txt");
      echo strlen($text), " bytes";
      `,
    rust: `
      use std::fs;

      fn main() -> std::io::Result<()> {
          let text = fs::read_to_string("notes.txt")?;
          println!("{} bytes", text.len());
          Ok(())
      }
      `,
    check: "ok",
    note: `A missing file is an <code>Err</code> value, and <code>?</code> passes it to the caller. PHP's <code>file_get_contents</code> returns <code>false</code> with a warning, which is easy to miss. <code>read_to_string</code> also fails on bytes that are not valid UTF-8.`,
    chapter: 11
  },
  {
    id: "io-write-file",
    cat: "io",
    title: "Append a line to a file",
    php: `
      file_put_contents("app.log", "booted\\n", FILE_APPEND);
      `,
    rust: `
      use std::fs::OpenOptions;
      use std::io::Write;

      fn log_line(line: &str) -> std::io::Result<()> {
          let mut file = OpenOptions::new().create(true).append(true).open("app.log")?;
          writeln!(file, "{line}")?;
          Ok(())
      }
      `,
    check: "ok",
    note: `The file closes itself when <code>file</code> is dropped, so there is no <code>fclose</code> to forget. Writes can fail too, so they return a <code>Result</code>. <code>writeln!</code> needs the <code>Write</code> trait in scope, which is why it is imported.`,
    chapter: 11
  },
  {
    id: "io-stdin",
    cat: "io",
    title: "Read a line from stdin",
    php: `
      $line = fgets(STDIN);
      echo "you said " . trim($line);
      `,
    rust: `
      use std::io;

      let mut line = String::new();
      io::stdin().read_line(&mut line).expect("could not read stdin");
      println!("you said {}", line.trim());
      `,
    check: "ok",
    note: `<code>read_line</code> keeps the trailing newline, the same as <code>fgets</code>. Trim it before you compare or store the text. The buffer is a <code>String</code> that you own, and you choose whether to clear it between reads.`,
    chapter: 11
  },
  {
    id: "io-args",
    cat: "io",
    title: "Command-line arguments",
    php: `
      $name = $argv[1] ?? "world";
      echo "hello $name";
      `,
    rust: `
      let args: Vec<String> = std::env::args().collect();
      let name = args.get(1).map(String::as_str).unwrap_or("world");
      println!("hello {name}");
      `,
    check: "ok",
    note: `<code>args()[0]</code> is the program name, like <code>$argv[0]</code>. <code>args()</code> panics if an argument is not valid Unicode, so use <code>args_os()</code> when a path or other raw bytes can arrive.`,
    chapter: 1
  },
  {
    id: "io-env",
    cat: "io",
    title: "Read an environment variable",
    php: `
      $debug = config('app.debug');
      `,
    rust: `
      let debug = std::env::var("APP_DEBUG")
          .map(|v| v == "true")
          .unwrap_or(false);
      println!("debug: {debug}");
      `,
    check: "ok",
    note: `A missing variable is an <code>Err</code>, not null. The PHP side reads <code>config('app.debug')</code>, which the default <code>config/app.php</code> fills from <code>APP_DEBUG</code>. Call <code>env()</code> only in config files, because after <code>config:cache</code> the <code>.env</code> file is no longer read. <code>unwrap_or(false)</code> puts the default where you can read it.`,
    chapter: 20
  },
  {
    id: "io-stderr",
    cat: "io",
    title: "Write to stderr",
    php: `
      fwrite(STDERR, "warning: cache is cold\\n");
      `,
    rust: `
      eprintln!("warning: cache is cold");
      `,
    check: "ok",
    note: `<code>eprintln!</code> is <code>println!</code> for stderr, so warnings do not mix into the output that a pipe or a log collector reads. It panics if writing to stderr fails, which is rare.`,
    chapter: 1
  },
  {
    id: "io-read-dir",
    cat: "io",
    title: "List a directory",
    php: `
      foreach (glob("*.php") as $file) {
          echo $file, "\\n";
      }
      `,
    rust: `
      use std::fs;

      fn main() -> std::io::Result<()> {
          for entry in fs::read_dir(".")? {
              let path = entry?.path();
              if path.extension().is_some_and(|ext| ext == "rs") {
                  println!("{}", path.display());
              }
          }
          Ok(())
      }
      `,
    check: "ok",
    note: `Each step can fail: opening the directory, and reading each entry. Both return a <code>Result</code>. <code>display()</code> prints a path, and it may show replacement characters for names that are not valid Unicode.`,
    chapter: 11
  },
  /* ---------------------------------------------------------------- web */
  {
    id: "web-route-match",
    cat: "web",
    title: "A route table as a match",
    php: `
      Route::get('/', fn () => 'home');
      Route::get('/users', fn () => 'list users');
      `,
    rust: `
      fn route(method: &str, path: &str) -> &'static str {
          match (method, path) {
              ("GET", "/") => "home",
              ("GET", "/users") => "list users",
              _ => "404 not found",
          }
      }
      println!("{}", route("GET", "/users"));
      `,
    check: "ok",
    note: `A route table is a <code>match</code>: each arm is a route, and the last arm says what happens when nothing matches. A real router also matches path segments and extracts parameters, which Routes and path parameters shows.`,
    chapter: 20
  },
  {
    id: "web-route-axum",
    cat: "web",
    title: "Routes and path parameters",
    php: `
      Route::get('/users/{id}', [UserController::class, 'show']);
      `,
    rust: `
      use axum::{extract::Path, routing::get, Router};

      async fn show_user(Path(id): Path<u32>) -> String {
          format!("user {id}")
      }

      fn app() -> Router {
          Router::new().route("/users/{id}", get(show_user))
      }
      `,
    check: "skip",
    note: `axum matches the path and parses <code>{id}</code> into a <code>u32</code> before your handler runs. If the segment is not a number, the request is rejected with a 400 and the handler never runs. The types are written once, in the handler's signature.`,
    chapter: 20
  },
  {
    id: "web-json-response",
    cat: "web",
    title: "JSON response",
    php: `
      return response()->json(['id' => $id, 'name' => 'Ada']);
      `,
    rust: `
      use serde_json::{json, Value};

      fn show(id: u32) -> Value {
          json!({ "id": id, "name": "Ada" })
      }
      `,
    check: "skip",
    note: `<code>json!</code> builds a value from a literal shaped like JSON. For your own types, derive <code>Serialize</code>, and serde writes the JSON from the struct, so the shape lives in one place.`,
    chapter: 20
  },
  {
    id: "web-validate",
    cat: "web",
    title: "Validate input",
    php: `
      $request->validate([
          'name' => ['required', 'max:50'],
      ]);
      `,
    rust: `
      fn validate_name(name: &str) -> Result<&str, &'static str> {
          let name = name.trim();
          if name.is_empty() {
              return Err("name is required");
          }
          if name.chars().count() > 50 {
              return Err("name may be at most 50 characters");
          }
          Ok(name)
      }

      println!("{:?}", validate_name("  Ada "));
      println!("{:?}", validate_name("   "));
      `,
    check: "ok",
    note: `Laravel looks rules up by name at runtime. In Rust each rule is an ordinary function, so the compiler checks its call sites, and the <code>Result</code> says what failed.`,
    chapter: 20
  },
  {
    id: "web-middleware",
    cat: "web",
    title: "Middleware",
    php: `
      final class AuthMiddleware {
          public function handle(Request $request, Closure $next): Response {
              return match ($request->header('X-Token')) {
                  'secret' => $next($request),
                  default => response('Unauthorized', 401),
              };
          }
      }
      `,
    rust: `
      fn with_auth(token: Option<&str>, next: impl FnOnce() -> String) -> String {
          match token {
              Some("secret") => next(),
              _ => String::from("401 Unauthorized"),
          }
      }

      let body = with_auth(Some("secret"), || String::from("200 dashboard"));
      println!("{body}");
      `,
    check: "ok",
    note: `Middleware is a function that decides whether to call the next handler. Here <code>next</code> is a closure, the same shape as <code>$next</code>. Real frameworks wrap services in layers with types, following the same idea.`,
    chapter: 20
  },
  {
    id: "web-request-input",
    cat: "web",
    title: "Read request input with a default",
    php: `
      $name = $request->input('name', 'guest');
      `,
    rust: `
      fn input<'a>(query: &'a str, key: &str) -> Option<&'a str> {
          query
              .split('&')
              .filter_map(|pair| pair.split_once('='))
              .find(|(k, _)| *k == key)
              .map(|(_, v)| v)
      }

      let name = input("name=Ada&lang=en", "name").unwrap_or("guest");
      println!("{name}");
      `,
    check: "ok",
    note: `Laravel merges query, form and JSON input into one bag, and the default is the second argument. This code parses a query string by hand, and it does not decode <code>%20</code> or <code>+</code>. Real code uses an extractor such as axum's <code>Query</code>, which gives typed fields.`,
    chapter: 20
  },
  {
    id: "web-dependency-injection",
    cat: "web",
    title: "Constructor injection",
    php: `
      final class SignupController {
          public function __construct(private readonly Mailer $mailer) {}
          public function register(string $email): string {
              return $this->mailer->send($email, 'welcome');
          }
      }
      `,
    rust: `
      trait Mailer {
          fn send(&self, to: &str, body: &str) -> String;
      }

      struct LogMailer;

      impl Mailer for LogMailer {
          fn send(&self, to: &str, body: &str) -> String {
              format!("to {to}: {body}")
          }
      }

      struct Signup<M: Mailer> {
          mailer: M,
      }

      impl<M: Mailer> Signup<M> {
          fn register(&self, email: &str) -> String {
              self.mailer.send(email, "welcome")
          }
      }

      let signup = Signup { mailer: LogMailer };
      println!("{}", signup.register("ada@example.com"));
      `,
    check: "ok",
    note: `Laravel's container reads the type hint at runtime and builds the object for you, once an interface is bound to a class. Rust has no container: the dependency is a type parameter, so the compiler makes a copy of <code>Signup</code> for each concrete mailer. When the choice must wait until runtime, use <code>Box&lt;dyn Mailer&gt;</code> instead.`,
    chapter: 14
  },
  {
    id: "web-http-client",
    cat: "web",
    title: "Call an HTTP API",
    php: `
      $status = Http::get('https://example.com/api/status')->throw()->json();
      `,
    rust: `
      fn fetch_status() -> Result<serde_json::Value, Box<dyn std::error::Error>> {
          let body = reqwest::blocking::get("https://example.com/api/status")?
              .json::<serde_json::Value>()?;
          Ok(body)
      }
      `,
    check: "skip",
    note: `The connection, the status check and the body parse can each fail, so every step returns a <code>Result</code>. <code>blocking</code> suits scripts. Inside an async server, use reqwest's async client, so a slow request does not hold a thread.`,
    chapter: 20
  },
  {
    id: "unknown-fields",
    cat: "web",
    title: "Reject fields you did not ask for",
    php: `
      use Illuminate\\Foundation\\Http\\Attributes\\FailOnUnknownFields;
      use Illuminate\\Foundation\\Http\\FormRequest;

      #[FailOnUnknownFields]
      class StoreNoteRequest extends FormRequest {
          public function rules(): array {
              return [
                  'title' => ['required', 'string', 'max:255'],
              ];
          }
      }
      `,
    rust: `
      use serde::Deserialize;

      #[derive(Deserialize)]
      #[serde(deny_unknown_fields)]
      struct StoreNote {
          title: String,
      }

      let ok = r#"{"title": "Hello"}"#;
      let extra = r#"{"title": "Hello", "color": "red"}"#;
      let accepted: StoreNote = serde_json::from_str(ok).expect("valid input");
      println!("accepted: {}", accepted.title);
      println!("{}", serde_json::from_str::<StoreNote>(extra).is_err());
      `,
    check: "skip",
    note: `Laravel's <code>FailOnUnknownFields</code> rejects any input key that no rule defines. Rust's serde reads the input while it deserializes, and <code>deny_unknown_fields</code> makes an extra key an error with no other code. The accepted fields are listed once, in the struct. serde is a crate, not part of the language, so this entry needs <code>serde</code> and <code>serde_json</code> in <code>Cargo.toml</code>.`,
    chapter: 20
  },

  /* ---------------------------------------------------------------- testing */
  {
    id: "test-assert-equal",
    cat: "testing",
    title: "assertEquals becomes assert_eq",
    php: `
      use PHPUnit\\Framework\\Attributes\\Test;
      use Tests\\TestCase;

      class AddTest extends TestCase {
          #[Test]
          public function adds_two_numbers(): void {
              $this->assertSame(4, add(2, 2));
          }
      }
      `,
    rust: `
      fn add(a: i32, b: i32) -> i32 {
          a + b
      }

      fn main() {
          println!("{}", add(2, 3));
      }

      #[cfg(test)]
      mod tests {
          use super::*;

          #[test]
          fn adds_two_numbers() {
              assert_eq!(add(2, 2), 4);
          }
      }
      `,
    check: "ok",
    note: `Tests sit next to the code, and <code>cargo test</code> compiles them. Watch the argument order: PHPUnit takes the expected value first, while <code>assert_eq!</code> takes two values and the convention is actual first. <code>assertSame</code> checks the type as well as the value, which is closer to <code>assert_eq!</code>, where mismatched types do not compile. When it fails, it prints both sides.`,
    chapter: 16
  },
  {
    id: "test-assert-true",
    cat: "testing",
    title: "assertTrue becomes assert",
    php: `
      use PHPUnit\\Framework\\Attributes\\Test;
      use Tests\\TestCase;

      class UserTest extends TestCase {
          #[Test]
          public function admin_flag_is_read(): void {
              $this->assertTrue(new User(admin: true)->isAdmin());
          }
      }
      `,
    rust: `
      struct User {
          admin: bool,
      }

      impl User {
          fn is_admin(&self) -> bool {
              self.admin
          }
      }

      fn main() {
          println!("{}", User { admin: true }.is_admin());
      }

      #[cfg(test)]
      mod tests {
          use super::*;

          #[test]
          fn admin_flag_is_read() {
              assert!(User { admin: true }.is_admin());
          }
      }
      `,
    check: "ok",
    note: `<code>assert!</code> takes any <code>bool</code> and an optional message. Use it for a condition. For a value, prefer <code>assert_eq!</code>, because a failure then shows what was actually there.`,
    chapter: 16
  },
  {
    id: "test-expect-error",
    cat: "testing",
    title: "Expect an error",
    php: `
      use PHPUnit\\Framework\\Attributes\\Test;
      use Tests\\TestCase;

      class PortTest extends TestCase {
          #[Test]
          public function rejects_port_zero(): void {
              $this->expectException(InvalidArgumentException::class);
              parsePort("0");
          }
      }
      `,
    rust: `
      fn parse_port(raw: &str) -> Result<u16, String> {
          let port: u16 = raw.parse().map_err(|_| format!("not a number: {raw}"))?;
          if port == 0 {
              return Err(String::from("port must be at least 1"));
          }
          Ok(port)
      }

      fn main() {
          println!("{:?}", parse_port("0"));
      }

      #[cfg(test)]
      mod tests {
          use super::*;

          #[test]
          fn rejects_port_zero() {
              assert!(parse_port("0").is_err());
          }
      }
      `,
    check: "ok",
    note: `<code>expectException</code> checks that code throws. A Rust test can check for an <code>Err</code> directly, which is the idiomatic way. <code>#[should_panic]</code> exists for code that panics, but a function that returns a <code>Result</code> is easier to test.`,
    chapter: 11
  },
  {
    id: "test-setup",
    cat: "testing",
    title: "setUp becomes a helper",
    php: `
      use PHPUnit\\Framework\\Attributes\\Test;
      use Tests\\TestCase;

      class UserTest extends TestCase {
          private User $user;

          protected function setUp(): void {
              $this->user = new User("Ada", admin: true);
          }

          #[Test]
          public function admin_can_delete(): void {
              $this->assertTrue($this->user->isAdmin());
          }
      }
      `,
    rust: `
      struct User {
          name: String,
          admin: bool,
      }

      fn sample_admin() -> User {
          User { name: String::from("Ada"), admin: true }
      }

      fn main() {
          println!("{}", sample_admin().name);
      }

      #[cfg(test)]
      mod tests {
          use super::*;

          #[test]
          fn admin_can_delete() {
              let user = sample_admin();
              assert!(user.admin);
          }
      }
      `,
    check: "ok",
    note: `Rust has no <code>setUp</code> hook. Each test builds the data it needs with a plain function, so no test depends on another and nothing is shared by accident. Cleanup belongs in a <code>Drop</code> impl, as in finally becomes Drop under Errors.`,
    chapter: 16
  },
  {
    id: "test-fake-trait",
    cat: "testing",
    title: "A fake that implements the trait",
    php: `
      use Mockery\\MockInterface;

      $mailer = $this->mock(Mailer::class, function (MockInterface $mock) {
          $mock->expects('send')->andReturn(true);
      });
      `,
    rust: `
      trait Mailer {
          fn send(&self, to: &str) -> bool;
      }

      struct FakeMailer;

      impl Mailer for FakeMailer {
          fn send(&self, _to: &str) -> bool {
              true
          }
      }

      fn welcome(mailer: &impl Mailer, to: &str) -> bool {
          mailer.send(to)
      }

      fn main() {
          println!("{}", welcome(&FakeMailer, "ada@example.com"));
      }
      `,
    check: "ok",
    note: `Most Rust tests use a small hand-written fake that implements the same trait. If the trait changes, the fake stops compiling, and the test build fails before any test runs. Mocking crates exist, but the trait is what makes the fake possible.`,
    chapter: 14
  },
  {
    id: "test-doc-example",
    cat: "testing",
    title: "Examples in doc comments run as tests",
    php: `
      /**
       * Doubles a number.
       * @example double(4) // 8
       */
      function double(int $n): int { return $n * 2; }
      `,
    rust: `
      /// Doubles a number.
      ///
      /// \`\`\`
      /// use mathkit::double;
      ///
      /// assert_eq!(double(4), 8);
      /// \`\`\`
      pub fn double(n: i32) -> i32 {
          n * 2
      }
      `,
    check: "ok",
    note: `A fenced block inside a <code>///</code> comment runs under <code>cargo test</code> as a separate program, so it imports your crate by name, as a user of the crate would. The example cannot drift from the code without a failing test. A PHPDoc <code>@example</code> is only text.`,
    chapter: 16
  },
  {
    id: "test-factory",
    cat: "testing",
    title: "Factories as builders",
    php: `
      $user = User::factory()->admin()->create();
      `,
    rust: `
      #[derive(Debug)]
      struct User {
          name: String,
          admin: bool,
      }

      struct UserBuilder {
          name: String,
          admin: bool,
      }

      impl User {
          fn builder() -> UserBuilder {
              UserBuilder { name: String::from("Test user"), admin: false }
          }
      }

      impl UserBuilder {
          fn admin(mut self) -> Self {
              self.admin = true;
              self
          }

          fn build(self) -> User {
              User { name: self.name, admin: self.admin }
          }
      }

      let user = User::builder().admin().build();
      println!("{user:?}");
      `,
    check: "ok",
    note: `A builder chains defaults the way a factory does. Each method takes <code>self</code> by value and returns it, so the half-built value is consumed as you go. Test helpers like this can sit under <code>#[cfg(test)]</code> when they should not ship.`,
    chapter: 16
  },

  /* ---------------------------------------------------------------- tooling */
  {
    id: "tool-dump",
    cat: "tooling",
    title: "dump and dd become dbg",
    php: `
      dump($user);
      dd($user);   // dump and die
      `,
    rust: `
      #[derive(Debug)]
      struct User {
          name: String,
          admin: bool,
      }

      let user = User { name: String::from("Ada"), admin: true };
      println!("{user:#?}");
      let len = dbg!(user.name.len()) + 1;
      println!("{len}");
      `,
    check: "ok",
    note: `<code>{:#?}</code> is <code>print_r</code> with line breaks. <code>dbg!</code> prints the file, the line and the value to stderr, then returns the value. It takes ownership of what you pass, so write <code>dbg!(&amp;user)</code> to keep the value. Clippy can flag leftovers with its <code>dbg_macro</code> lint.`,
    chapter: 16
  },
  {
    id: "tool-build-mode",
    cat: "tooling",
    title: "Debug or release build",
    php: `
      if (app()->isLocal()) {
          echo "debug build";
      }
      `,
    rust: `
      if cfg!(debug_assertions) {
          println!("debug build");
      } else {
          println!("release build");
      }
      `,
    check: "ok",
    note: `The choice is made when the code is compiled, not read from a config file at runtime. <code>cargo run</code> builds in debug mode. <code>cargo run --release</code> builds an optimized binary, which removes <code>debug_assert!</code> checks and integer overflow checks.`,
    chapter: 16
  },
  {
    id: "tool-version",
    cat: "tooling",
    title: "Application version",
    php: `
      echo config('app.version');
      `,
    rust: `
      let version = option_env!("CARGO_PKG_VERSION").unwrap_or("unknown");
      println!("version {version}");
      `,
    check: "ok",
    note: `Cargo sets <code>CARGO_PKG_VERSION</code> from <code>Cargo.toml</code> at build time, so the version is baked into the binary and cannot drift from the manifest. <code>option_env!</code> also compiles under plain <code>rustc</code>, where the variable is unset, while <code>env!</code> would fail there.`,
    chapter: 16
  },
  {
    id: "tool-deprecated",
    cat: "tooling",
    title: "Mark an old function deprecated",
    php: `
      #[\\Deprecated(message: "use totalCents() instead", since: "1.2.0")]
      function total(int $cents): int {
          return $cents;
      }
      echo total(5);
      `,
    rust: `
      #[deprecated(since = "1.2.0", note = "use \`total_cents\` instead")]
      fn total(cents: u32) -> u32 {
          cents
      }

      fn total_cents(cents: u32) -> u32 {
          cents
      }

      println!("{}", total_cents(5));
      `,
    check: "ok",
    note: `PHP 8.4 added the <code>#[\\Deprecated]</code> attribute. PHP prints its notice each time a call runs, and the message names the replacement. Rust's <code>#[deprecated]</code> warns at build time, so the warning comes before the program runs at all. Either way, the note text tells the reader the replacement at the point of use.`,
    chapter: 16
  },
  {
    id: "tool-lints",
    cat: "tooling",
    title: "Strictness settings as lints",
    php: `
      declare(strict_types=1);
      // PHP 8 reports every error level by default, so error_reporting() is not needed.
      `,
    rust: `
      #![forbid(unsafe_code)]
      #![warn(clippy::unwrap_used)]

      fn main() {
          let names = ["Ada", "Linus"];
          println!("{}", names.len());
      }
      `,
    check: "ok",
    note: `Lints are the strictness settings. <code>forbid</code> makes a rule an error that no later attribute can override. Clippy lints run under <code>cargo clippy</code>, and the <code>[lints]</code> table in <code>Cargo.toml</code> applies them to the whole crate.`,
    chapter: 21
  },
  {
    id: "tool-todo",
    cat: "tooling",
    title: "A stub that still type-checks",
    php: `
      class InvoiceService {
          public function sendInvoice(int $id): bool {
              throw new LogicException("wire up the billing API");
          }
      }
      `,
    rust: `
      fn send_invoice(id: u32) -> bool {
          todo!("wire up the billing API for invoice {id}")
      }
      `,
    check: "ok",
    note: `Unlike a PHP stub, the compiler checks the signature right away, so the stub must still return a <code>bool</code>. It panics only when it runs. Clippy's <code>todo</code> lint can flag leftovers.`,
    chapter: 16
  },
  {
    id: "tool-must-use",
    cat: "tooling",
    title: "Warn when a result is ignored",
    php: `
      #[\\NoDiscard("the total is the whole point of this call")]
      function calculateTotal(array $prices): int {
          return array_sum($prices);
      }
      $prices = [100, 250];
      $sum = calculateTotal($prices);
      (void) calculateTotal($prices); // a deliberate discard
      echo $sum;
      `,
    rust: `
      #[must_use = "the total is the whole point of this call"]
      fn total(prices: &[u32]) -> u32 {
          prices.iter().sum()
      }

      let prices = [100, 250];
      let sum = total(&prices);
      println!("{sum}");
      `,
    check: "ok",
    note: `<code>#[must_use]</code> makes the compiler warn when a call's result is dropped. PHP 8.5's <code>#[\\NoDiscard]</code> does the same job, but its warning appears only when that line runs, while Rust's appears at build time. Discard on purpose with <code>(void)</code> in PHP and <code>let _ =</code> in Rust. The standard library marks its lazy iterator adapters this way, so an iterator that nothing consumes gets flagged.`,
    chapter: 21
  },
];
