#!/usr/bin/env node
// Keeps every PHP sample in the course modern: PHP 8.5 and Laravel 13.
//
// 1. Parse: every snippet goes through PHP's own parser (token_get_all with
//    TOKEN_PARSE) on PHP 8.5 or newer, so 8.4/8.5 syntax is accepted and
//    broken code is not. Nothing is executed.
// 2. Idioms: rules reject patterns that modern PHP or Laravel replaced
//    (array(), strpos() !== false, @test docblocks, protected $casts …).
// 3. Prose: sentences naming an old PHP or Laravel version are reported as
//    warnings to read, since "since PHP 8.1" is history, not old code.
//
// Snippets: <pre class="php"> blocks in site/**/*.html, and every `php`
// string field in the window.OX_* data under site/assets. A <pre> with
// data-check="skip" is not parsed (use it only for non-PHP text).
//
// usage: node tools/check-php.mjs [files...]
// PHP:   `php` on PATH, or PHP_BIN. Without PHP 8.5 installed, the WASM
//        build works:  PHP_BIN="npx -y @php-wasm/cli@3.1.57" PHP=8.5 node tools/check-php.mjs
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import vm from "node:vm";
import { execFileSync } from "node:child_process";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const SITE = path.join(ROOT, "site");
const only = process.argv.slice(2).map((f) => path.resolve(f));
const want = (f) => !only.length || only.includes(f);

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}
const lineOf = (text, idx) => text.slice(0, idx).split("\n").length;
const decode = (s) => s.replace(/<[^>]+>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");
function dedent(s) {
  const lines = s.replace(/^\n+|\s+$/g, "").split("\n");
  const pad = Math.min(...lines.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length));
  return lines.map((l) => l.slice(pad)).join("\n");
}

const snippets = [];
const prose = [];
const files = walk(SITE);

for (const file of files.filter((f) => f.endsWith(".html") && want(f))) {
  const text = fs.readFileSync(file, "utf8");
  for (const m of text.matchAll(/<pre([^>]*\bclass="[^"]*\bphp\b[^"]*"[^>]*)>([\s\S]*?)<\/pre>/g)) {
    if (/data-check="skip"/.test(m[1])) continue;
    snippets.push({ where: `${path.relative(ROOT, file)}:${lineOf(text, m.index)}`, code: dedent(decode(m[2])) });
  }
  const body = text.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<pre[\s\S]*?<\/pre>/g, (s) => s.replace(/[^\n]/g, " "));
  prose.push({ file, text: body });
}

for (const file of files.filter((f) => f.endsWith(".js") && f.includes(`${path.sep}assets${path.sep}`) && want(f))) {
  const src = fs.readFileSync(file, "utf8");
  if (!/window\.OX_/.test(src)) continue;
  const ctx = { window: {}, console };
  vm.createContext(ctx);
  try { vm.runInContext(src, ctx); } catch { continue; }
  const rel = path.relative(ROOT, file);
  const visit = (v, at) => {
    if (Array.isArray(v)) v.forEach((x, i) => visit(x, `${at}[${x && x.id ? x.id : i}]`));
    else if (v && typeof v === "object") {
      for (const [k, x] of Object.entries(v)) {
        if (k === "php" && typeof x === "string" && v.phpCheck !== "skip") snippets.push({ where: `${rel} ${at}.php`, code: dedent(x) });
        else visit(x, `${at}.${k}`);
      }
    }
  };
  for (const [k, v] of Object.entries(ctx.window)) if (k.startsWith("OX_")) visit(v, k);
  prose.push({ file, text: src.replace(/php:\s*`[\s\S]*?`/g, (s) => s.replace(/[^\n]/g, " ")) });
}

// ---- 1. parse with PHP 8.5
const isTemplate = (c) => /\{\{|@(foreach|if|extends|section|csrf)\b/.test(c) && !/<\?php/.test(c);
const asFile = (c) => (isTemplate(c) || c.startsWith("<?php") ? c : `<?php\n${c}`);
const asMembers = (c) => `<?php\nclass __Snippet {\n${c.replace(/^<\?php\s*/, "")}\n}`;

const [bin, ...binArgs] = (process.env.PHP_BIN || "php").split(" ");
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "oxphp-"));
const runPhp = (script, ...args) => {
  const f = path.join(TMP, "run.php");
  fs.writeFileSync(f, script);
  return execFileSync(bin, [...binArgs, f, ...args], { encoding: "utf8", maxBuffer: 32 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] });
};

let version;
try { version = runPhp("<?php echo PHP_VERSION;").trim().split("\n").pop(); }
catch (e) { console.error(`Could not run PHP (${bin}). Install PHP 8.5+ or set PHP_BIN; see the header of this file.`); process.exit(2); }
const [maj, min] = version.split(".").map(Number);
if (maj < 8 || (maj === 8 && min < 5)) { console.error(`PHP ${version} found; the course targets PHP 8.5, so the check needs PHP 8.5 or newer.`); process.exit(2); }

const input = path.join(TMP, "in.json");
fs.writeFileSync(input, JSON.stringify(snippets.map((s, i) => ({ i, file: asFile(s.code), members: asMembers(s.code) }))));
const parsed = runPhp(`<?php
foreach (json_decode(file_get_contents($argv[1]), true) as $s) {
    $err = null;
    foreach (['file', 'members'] as $form) {
        try { token_get_all($s[$form], TOKEN_PARSE); $err = null; break; }
        catch (\\ParseError $e) { $err ??= 'line ' . ($e->getLine() - 1) . ': ' . $e->getMessage(); }
    }
    echo $s['i'], "\\t", $err ?? 'ok', "\\n";
}`, input);
const parseErr = new Map();
for (const line of parsed.split("\n")) {
  const m = /^(\d+)\t(.*)$/.exec(line);
  if (m && m[2] !== "ok") parseErr.set(+m[1], m[2]);
}

// ---- 2. idioms that modern PHP and Laravel replaced
const MODEL_PROPS = "fillable|guarded|hidden|visible|table|primaryKey|keyType|incrementing|timestamps|connection|dateFormat";
const RULES = [
  [/(?<![\w$>:\\])array\s*\(/, "array() literal: write [] instead"],
  [/(?<![\w$>:\\])list\s*\(/, "list(): destructure with [$a, $b] = … instead"],
  [/strpos\s*\([^;]*?\)\s*[!=]==?\s*false/, "strpos() !== false: use str_contains() (PHP 8.0)"],
  [/substr\s*\([^;]*,\s*0\s*,\s*strlen/, "substr(…, 0, strlen(…)): use str_starts_with() (PHP 8.0)"],
  [/@test\b/, "@test docblock: PHPUnit 12 removed annotations; use #[Test] or a Pest test()"],
  [/['"][\w\\]*Controller@\w+['"]/, "'Controller@method' routes: use [Controller::class, 'method']"],
  [/protected\s+\$casts\s*=/, "protected $casts: Laravel 11+ uses a casts(): array method"],
  [/protected\s+\$dates\s*=/, "protected $dates was removed from Laravel; use casts()"],
  [new RegExp(`protected\\s+\\$(${MODEL_PROPS})\\s*=`), "Eloquent config property: Laravel 13 uses attributes (#[Table], #[Fillable], #[Hidden] …)"],
  [/Http\\Kernel|Http\/Kernel\.php|Console\\Kernel/, "HTTP/console Kernel: Laravel 11+ configures middleware in bootstrap/app.php"],
  [/RouteServiceProvider/, "RouteServiceProvider was removed in Laravel 11; routes load from bootstrap/app.php"],
  [/(?<![\w$>:\\])(array_get|array_set|array_has|array_pluck|str_random|str_slug|str_limit|camel_case|snake_case|studly_case|starts_with|ends_with)\s*\(/, "removed Laravel string/array helper: use Str:: or Arr::"],
  [/(?<![\w$>:\\])(create_function|each|mysql_\w+|ereg\w*|utf8_encode|utf8_decode)\s*\(/, "removed or deprecated PHP function"],
  [/(?<![\w$>:\\])call_user_func(_array)?\s*\(/, "call_user_func(): call it directly or use first-class callable syntax f(...)"],
  [/^\s*var\s+\$/m, "var $x: declare a typed property"],
  [/isset\(\s*(\$[^)]+)\)\s*\?\s*\1\s*:/, "isset($x) ? $x : …: use ??"],
  [/\(\s*new\s+[\w\\]+\s*\([^()]*\)\s*\)\s*->/, "(new Foo())->bar(): PHP 8.4 allows new Foo()->bar()"],
];
function idiomErrors(code) {
  const out = [];
  const bare = code.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*|#(?!\[)[^\n]*/g, (s) => s.replace(/[^\n]/g, " "));
  for (const [re, msg] of RULES) {
    const m = re.exec(msg.startsWith("@test") ? code : bare);
    if (m) out.push(`line ${lineOf(code, m.index)}: ${msg}`);
  }
  // Named functions and methods carry parameter and return types.
  for (const m of bare.matchAll(/function\s+(&\s*)?(\w+)\s*\(([^)]*)\)\s*(:\s*[^{;]+)?[{;]/g)) {
    const [, , name, params, ret] = m;
    const untyped = params.split(",").map((p) => p.trim()).filter((p) => p && /^(\.\.\.)?&?\$/.test(p.replace(/^(public|protected|private|readonly)\s+/g, "")));
    if (untyped.length) out.push(`line ${lineOf(bare, m.index)}: ${name}(): give ${untyped.map((p) => p.match(/\$\w+/)[0]).join(", ")} a type`);
    if (!ret && name !== "__construct" && name !== "__destruct") out.push(`line ${lineOf(bare, m.index)}: ${name}(): add a return type`);
  }
  // Properties are typed (Eloquent/Artisan overrides of untyped parent properties excepted).
  for (const m of bare.matchAll(/^\s*(?:(?:public|protected|private)(?:\(set\))?\s+)+(?:(?:static|readonly)\s+)*\$(\w+)/gm)) {
    if (!new RegExp(`^(${MODEL_PROPS}|casts|with|appends|signature|description|tries|timeout|perPage)$`).test(m[1])) out.push(`line ${lineOf(bare, m.index)}: $${m[1]}: declare the property's type`);
  }
  return out;
}

// ---- 3. prose naming old versions (warnings)
const warnings = [];
for (const { file, text } of prose) {
  for (const m of text.matchAll(/\bPHP\s*(?:[4-7](?:\.\d+)?|8\.[0-3])\b|\bLaravel\s*(?:[4-9]|1[0-2])\b/g)) {
    const at = lineOf(text, m.index);
    const ctx = text.slice(Math.max(0, m.index - 60), m.index + 60).replace(/\s+/g, " ").trim();
    warnings.push(`${path.relative(ROOT, file)}:${at}  "${m[0]}"  …${ctx}…`);
  }
}

let failed = 0;
snippets.forEach((s, i) => {
  const errs = [];
  if (parseErr.has(i)) errs.push(`does not parse on PHP ${version}: ${parseErr.get(i)}`);
  errs.push(...idiomErrors(s.code));
  if (!errs.length) return;
  failed++;
  console.log(`FAIL  ${s.where}\n      ${errs.join("\n      ")}`);
});
if (warnings.length) console.log(`\nOld version names in prose (read each; history is fine, old advice is not):\n  ${warnings.join("\n  ")}`);
console.log(`\n${snippets.length - failed} passed, ${failed} failed (${snippets.length} PHP snippets, parsed with PHP ${version})`);
fs.rmSync(TMP, { recursive: true, force: true });
process.exit(failed ? 1 : 0);
