#!/usr/bin/env node
// Oxidize snippet checker.
//
// Compiles every Rust code sample in the course with the real rustc, so the
// site never teaches something the compiler disagrees with.
//
//   node tools/check-snippets.mjs                 # everything that needs no crates
//   node tools/check-snippets.mjs --crates        # also the snippets that need crates
//   node tools/check-snippets.mjs site/chapters/06-ownership.html
//   node tools/check-snippets.mjs --verbose
//
// When the CI variable is set (GitHub Actions sets it), --crates is implied.
//
// Sources checked:
//   * <pre class="rs ..."> blocks in site/**/*.html (data-check / data-stdout / data-crates)
//   * fill-in-the-blank blocks (.ox-fill) with their first answers filled in
//   * Memory X-Ray scenarios (window.OX_XRAY) and timelines (OX_TIMELINES):
//     `check` field on the scenario, default "ok"
//   * every other window.OX_* array in site/assets/**.js whose items have a
//     `rust` field (lab data). Optional `fix`, `idiomatic`, `rust2` and
//     `fixes[]` code on the same item must compile.
//   * motion scenes (OX_MOTION): the scene's `rust` and `check`, and every
//     beat's own `rust` with the beat's `check` (default "ok").
//
// Crate snippets. A snippet that uses crates names them:
//   * HTML:    <pre data-crates="tokio,serde">
//   * JS data: `crates: ["tokio"]` on an item applies to every code field of
//              that item. `<field>Crates: [...]`, such as `idiomaticCrates`,
//              applies to that field only. Beats and `fixes[]` entries may
//              carry their own `crates`.
//   Every name must be a dependency in tools/snippet-crates/Cargo.toml. Those
//   snippets are written as one bin each in target/snippet-crates, and all the
//   bins are built with one cargo build, so the crates compile once and stay
//   cached between runs. Their check and stdout work as described below.
//   Without --crates they are counted as skipped.
//
// data-check values:
//   (absent) / "ok"   must compile (a snippet with #[test] also has its tests run)
//   "E0382"           must fail with that error code (comma-separate for several)
//   "error"           must fail to compile (any reason)
//   "panic"           must compile and panic at runtime
//   "skip"            not checked: a deliberate fragment that does not stand alone
// data-stdout="..."   must compile, run, and print exactly this (trimmed)

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import vm from "node:vm";
import crypto from "node:crypto";
import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = path.join(ROOT, "site");
const CRATE_SRC = path.join(ROOT, "tools", "snippet-crates"); // manifest and lockfile
const CRATE_DIR = path.join(ROOT, "target", "snippet-crates"); // working project, reused
const args = process.argv.slice(2);
const verbose = args.includes("--verbose");
const crateMode = args.includes("--crates") || Boolean(process.env.CI);
const only = args.filter((a) => !a.startsWith("--")).map((a) => path.resolve(a));
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "oxsnip-"));
const JOBS = Math.max(2, os.cpus().length);
// #[test], #[tokio::test], #[tokio::test(start_paused = true)] and the like.
const HAS_TEST = /#\[(?:\w+::)*test\b/;

const decode = (s) =>
  s.replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");

function dedent(s) {
  s = s.replace(/^\n+/, "").replace(/\s+$/, "");
  const lines = s.split("\n");
  const ind = Math.min(...lines.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length));
  return lines.map((l) => l.slice(ind)).join("\n");
}

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

function lineOf(text, idx) { return text.slice(0, idx).split("\n").length; }

// "tokio,serde" (an HTML attribute) or ["tokio", "serde"] (site data) -> names.
const crateNames = (v) =>
  (Array.isArray(v) ? v : typeof v === "string" ? v.split(",") : []).map((c) => String(c).trim()).filter(Boolean);
const normCrate = (c) => c.replace(/_/g, "-").toLowerCase();
const htmlCrates = (attrs) => crateNames((/data-crates="([^"]*)"/.exec(attrs) || [])[1]);

// The dependency names in tools/snippet-crates/Cargo.toml.
const DECLARED = new Set();
{
  let inDeps = false;
  for (const line of fs.readFileSync(path.join(CRATE_SRC, "Cargo.toml"), "utf8").split("\n")) {
    if (/^\s*\[/.test(line)) inDeps = /^\s*\[dependencies\]\s*$/.test(line);
    const m = inDeps && /^([A-Za-z0-9_-]+)\s*=/.exec(line);
    if (m) DECLARED.add(normCrate(m[1]));
  }
}

const snippets = [];

// ---- HTML pages
const htmlFiles = walk(SITE).filter((f) => f.endsWith(".html"));
for (const file of htmlFiles) {
  if (only.length && !only.includes(file)) continue;
  const text = fs.readFileSync(file, "utf8");
  // fill-in blocks: substitute first answers
  const fillRanges = [];
  const fillRe = /<div[^>]*class="[^"]*\box-fill\b[^"]*"[^>]*>([\s\S]*?)<\/div>/g;
  let m;
  while ((m = fillRe.exec(text))) {
    const inner = m[1];
    const pm = /<pre([^>]*)>([\s\S]*?)<\/pre>/.exec(inner);
    if (!pm) continue;
    fillRanges.push([m.index, m.index + m[0].length]);
    const attrs = pm[1];
    if (!/class="[^"]*\b(rs|rust)\b/.test(attrs)) continue;
    const check = (/data-check="([^"]*)"/.exec(attrs) || [])[1] || "ok";
    const so = /data-stdout="([^"]*)"/.exec(attrs);
    const code = dedent(decode(pm[2])).replace(/\[\[((?:[^\[\]]|\[[^\[\]]*\])+)\]\]/g, (_, a) => a.split("|")[0]);
    snippets.push({ where: `${path.relative(ROOT, file)}:${lineOf(text, m.index)} (fill)`, code, check, stdout: so ? decode(so[1]).replace(/\\n/g, "\n") : null, crates: htmlCrates(attrs) });
  }
  const preRe = /<pre([^>]*)>([\s\S]*?)<\/pre>/g;
  while ((m = preRe.exec(text))) {
    if (fillRanges.some(([a, b]) => m.index >= a && m.index < b)) continue;
    const attrs = m[1];
    if (!/class="[^"]*\b(rs|rust)\b/.test(attrs)) continue;
    const check = (/data-check="([^"]*)"/.exec(attrs) || [])[1] || "ok";
    const so = /data-stdout="([^"]*)"/.exec(attrs);
    const code = dedent(decode(m[2]));
    snippets.push({ where: `${path.relative(ROOT, file)}:${lineOf(text, m.index)}`, code, check, stdout: so ? decode(so[1]).replace(/\\n/g, "\n") : null, crates: htmlCrates(attrs) });
  }
}

// ---- JS data files
const dataFiles = walk(path.join(SITE, "assets")).filter((f) => f.endsWith(".js") && !/[\\/]assets[\\/](oxidize|xray|story|cast-art|cast|motion)\.js$/.test(f));
for (const file of dataFiles) {
  if (only.length && !only.includes(file)) continue;
  const ctx = { window: {} };
  vm.createContext(ctx);
  try {
    vm.runInContext(fs.readFileSync(file, "utf8"), ctx, { filename: file });
  } catch (e) {
    snippets.push({ where: path.relative(ROOT, file), code: null, error: "data file failed to load: " + e.message });
    continue;
  }
  const w = ctx.window;
  for (const s of w.OX_XRAY || []) {
    snippets.push({ where: `${path.relative(ROOT, file)} xray:${s.id}`, code: dedent(s.code), check: s.check || "ok", stdout: null, crates: crateNames(s.crates) });
  }
  for (const s of w.OX_TIMELINES || []) {
    snippets.push({ where: `${path.relative(ROOT, file)} timeline:${s.id}`, code: dedent(s.code), check: s.check || "ok", stdout: null, crates: crateNames(s.crates) });
  }
  // Any other OX_* array whose items carry a `rust` string (labs data):
  // each item is checked with its own `check` / `stdout` fields. Items may
  // also carry `fix` / `idiomatic` / `rust2` code, which must always compile.
  for (const [key, arr] of Object.entries(w)) {
    if (!/^OX_/.test(key) || !Array.isArray(arr) || key === "OX_XRAY" || key === "OX_TIMELINES") continue;
    arr.forEach((s, k) => {
      if (!s || typeof s !== "object") return;
      const tag = `${path.relative(ROOT, file)} ${key}[${s.id || k}]`;
      // A field needs the crates named by `<field>Crates`, else the item's `crates`.
      const fieldCrates = (field) => crateNames(s[field + "Crates"] ?? s.crates);
      if (typeof s.rust === "string") snippets.push({ where: tag, code: dedent(s.rust), check: s.check || "ok", stdout: s.stdout || null, crates: fieldCrates("rust") });
      // Motion scenes: a beat may carry its own rust (the code from that beat on),
      // checked with its own check, default "ok", just like the scene's rust.
      if (Array.isArray(s.beats)) s.beats.forEach((b, j) => {
        if (b && typeof b.rust === "string") snippets.push({ where: `${tag}.beats[${j}]`, code: dedent(b.rust), check: b.check || "ok", stdout: null, crates: crateNames(b.crates ?? s.crates) });
      });
      for (const extra of ["fix", "idiomatic", "rust2"]) {
        if (typeof s[extra] === "string") snippets.push({ where: `${tag}.${extra}`, code: dedent(s[extra]), check: s[extra + "Check"] || "ok", stdout: null, crates: fieldCrates(extra) });
      }
      if (Array.isArray(s.fixes)) s.fixes.forEach((f, j) => {
        const code = typeof f === "string" ? f : f && f.rust;
        if (typeof code === "string") snippets.push({ where: `${tag}.fixes[${j}]`, code: dedent(code), check: (f && f.check) || "ok", stdout: null, crates: crateNames(f?.crates ?? s.crates) });
      });
    });
  }
}
for (const s of snippets) s.crates ??= [];

function wrap(code) {
  // Snippets with tests are whole files of items, so they get an empty main.
  const body = /\bfn\s+main\s*\(/.test(code) ? code : HAS_TEST.test(code) ? `${code}\nfn main() {}` : `fn main() {\n${code}\n}`;
  return `#![allow(unused, dead_code, unused_variables, unused_mut, unused_assignments, unreachable_code, path_statements, unused_must_use)]\n${body}\n`;
}

function run(cmd, argv, opts = {}) {
  return new Promise((resolve) => {
    execFile(cmd, argv, { timeout: 60000, maxBuffer: 8 * 1024 * 1024, ...opts }, (err, stdout, stderr) => {
      resolve({ code: err ? (typeof err.code === "number" ? err.code : 1) : 0, stdout: String(stdout), stderr: String(stderr), killed: err && err.killed });
    });
  });
}

const head = (text, n) => text.split("\n").slice(0, n).join("\n");
const checkOf = (s) => (s.check || "ok").trim();
const mismatch = (s, r) => `stdout mismatch\n--- expected\n${s.stdout.trim()}\n--- actual\n${r.stdout.trim()}`;

// ---- crate snippets: one bin each, all built by one cargo build

const CRATE_BIN = /^s_[0-9a-f]{12}\.rs$/;

function writeIfChanged(file, text) {
  let old = null;
  try { old = fs.readFileSync(file, "utf8"); } catch { /* not written yet */ }
  if (old !== text) fs.writeFileSync(file, text);
}

// Reads `cargo --message-format json` output: errors and built executables by bin name.
function parseCargo(stdout) {
  const bins = {};
  const global = [];
  const entry = (name) => (bins[name] ??= { errors: [], exe: null });
  for (const line of stdout.split("\n")) {
    if (!line.startsWith("{")) continue;
    let m;
    try { m = JSON.parse(line); } catch { continue; }
    const name = m.target?.name ?? "";
    if (m.reason === "compiler-message" && m.message.level === "error") {
      const error = { code: m.message.code?.code ?? null, text: m.message.rendered || m.message.message };
      if (name.startsWith("s_")) entry(name).errors.push(error);
      else global.push(error.text);
    } else if (m.reason === "compiler-artifact" && m.executable && name.startsWith("s_")) {
      entry(name).exe = m.executable;
    }
  }
  return { bins, global };
}

// Writes the crate snippets into the working project and builds them.
// Returns { bins, tests, fatal, seconds }: `bins` for the programs, `tests` for
// the test harnesses of snippets that have #[test].
async function buildCrates(list) {
  const started = Date.now();
  const binDir = path.join(CRATE_DIR, "src", "bin");
  fs.mkdirSync(binDir, { recursive: true });
  for (const f of ["Cargo.toml", "Cargo.lock", path.join("src", "lib.rs")]) {
    writeIfChanged(path.join(CRATE_DIR, f), fs.readFileSync(path.join(CRATE_SRC, f), "utf8"));
  }
  const wanted = new Set();
  for (const s of list) {
    s.wrapped = wrap(s.code);
    s.bin = "s_" + crypto.createHash("sha1").update(s.wrapped).digest("hex").slice(0, 12);
    wanted.add(`${s.bin}.rs`);
    writeIfChanged(path.join(binDir, `${s.bin}.rs`), s.wrapped);
  }
  for (const f of fs.readdirSync(binDir)) if (CRATE_BIN.test(f) && !wanted.has(f)) fs.rmSync(path.join(binDir, f));

  const cargo = (argv) =>
    run("cargo", [...argv, "--locked", "--color", "never", "--message-format", "json"], { cwd: CRATE_DIR, timeout: 3600000, maxBuffer: 512 * 1024 * 1024 });
  // --keep-going: a bin that fails does not stop the others from building.
  const build = await cargo(["build", "--bins", "--keep-going"]);
  const built = parseCargo(build.stdout);
  const fatal = built.global.length ? built.global.join("\n") : head(build.stderr, 30);

  // Snippets with #[test] also get a test harness. `cargo test` has no
  // --keep-going, so --no-fail-fast builds the others past a failing one.
  const tests = {};
  const testBins = [...new Set(list.filter((s) => checkOf(s) === "ok" && HAS_TEST.test(s.code)).map((s) => s.bin))];
  if (testBins.length) {
    const t = await cargo(["test", "--no-run", "--no-fail-fast", ...testBins.flatMap((b) => ["--bin", b])]);
    const tp = parseCargo(t.stdout);
    for (const b of testBins) {
      const e = tp.bins[b] || { errors: [], exe: null };
      tests[b] = {
        failed: e.errors.length > 0 || !e.exe,
        text: e.errors.map((x) => x.text).join("\n") || `no test binary was built\n${fatal}`,
        exe: e.exe,
      };
    }
  }
  return { bins: built.bins, tests, fatal, seconds: (Date.now() - started) / 1000 };
}

// The compile result of a crate snippet, in the shape verdict() reads.
function compFor(s, cr) {
  const b = cr.bins[s.bin];
  const errors = b ? b.errors : [];
  const exe = b ? b.exe : null;
  if (!exe && errors.length === 0) {
    return { infra: true, failed: true, codes: [], text: `the snippet was not built (see the cargo output)\n${cr.fatal}`, exe: null };
  }
  return { failed: errors.length > 0, codes: errors.map((e) => e.code).filter(Boolean), text: errors.map((e) => e.text).join("\n"), exe };
}

// Runs a crate snippet's tests, from the test harness built in buildCrates.
function testsFor(s, cr) {
  return async () => {
    const t = cr.tests[s.bin];
    if (!t) return { ok: false, msg: `its tests were not built\n${cr.fatal}` };
    if (t.failed) return { ok: false, msg: `its tests do not compile:\n${head(t.text, 25)}` };
    const tr = await run(t.exe, ["--quiet"], { cwd: TMP });
    if (tr.code !== 0) return { ok: false, msg: `its tests fail:\n${(tr.stdout + tr.stderr).slice(0, 800)}` };
    return { ok: true };
  };
}

// ---- judging

// Judges one snippet from its compile result. `comp` is { failed, codes, text,
// exe } (exe: the built program, when there is one). `tests()` runs the tests.
async function verdict(s, comp, tests) {
  if (comp.infra) return { ok: false, msg: comp.text };
  const check = checkOf(s);
  if (check === "ok" || check === "panic") {
    if (comp.failed) return { ok: false, msg: `expected to compile, but rustc failed:\n${head(comp.text, 25)}` };
    // A normal build drops #[cfg(test)] and #[test] code, so tests run separately.
    if (check === "ok" && HAS_TEST.test(s.code)) {
      const t = await tests();
      if (!t.ok) return t;
    }
    if (check === "ok" && s.stdout === null) return { ok: true };
    const r = await run(comp.exe, [], { cwd: TMP });
    if (check === "panic") {
      if (r.code === 0) return { ok: false, msg: "expected a panic, but it exited cleanly" };
      if (s.stdout !== null && r.stdout.trim() !== s.stdout.trim()) return { ok: false, msg: mismatch(s, r) };
      return { ok: true };
    }
    if (r.code !== 0) return { ok: false, msg: `compiled but exited with ${r.code}:\n${r.stderr.slice(0, 800)}` };
    if (s.stdout !== null && r.stdout.trim() !== s.stdout.trim()) return { ok: false, msg: mismatch(s, r) };
    return { ok: true };
  }
  if (!comp.failed) return { ok: false, msg: `expected a compile error (${check}), but it compiled` };
  if (check === "error") return { ok: true };
  const want = check.split(",").map((x) => x.trim());
  const missing = want.filter((w) => !comp.codes.includes(w));
  if (missing.length) return { ok: false, msg: `expected ${want.join(", ")}, rustc reported ${comp.codes.join(", ") || "no error code"}:\n${head(comp.text, 20)}` };
  return { ok: true };
}

// ---- plain snippets: one rustc call each

let n = 0;
async function checkPlain(s) {
  if (s.error) return { ok: false, msg: s.error };
  if (checkOf(s) === "skip") return { ok: true, skipped: true };
  const id = n++;
  const src = path.join(TMP, `s${id}.rs`);
  const bin = path.join(TMP, `s${id}${process.platform === "win32" ? ".exe" : ""}`);
  fs.writeFileSync(src, wrap(s.code));
  const needRun = checkOf(s) === "panic" || s.stdout !== null;
  const argv = ["--edition", "2024", "--crate-name", "snippet", "--color", "never", "-o", bin, src];
  // --emit=mir (not metadata) so deny-by-default MIR lints such as
  // arithmetic_overflow and unconditional_panic are reported too.
  if (!needRun) argv.splice(0, 0, "--emit=mir");
  const c = await run("rustc", argv, { cwd: TMP });
  const comp = {
    failed: c.code !== 0,
    codes: [...c.stderr.matchAll(/error\[(E\d{4})\]/g)].map((x) => x[1]),
    text: c.stderr,
    exe: bin,
  };
  const tests = async () => {
    const t = await run("rustc", ["--test", "--edition", "2024", "--crate-name", "snippet", "--color", "never", "-o", bin + "_t", src], { cwd: TMP });
    if (t.code !== 0) return { ok: false, msg: `its tests do not compile:\n${head(t.stderr, 25)}` };
    const tr = await run(bin + "_t", ["--quiet"], { cwd: TMP });
    if (tr.code !== 0) return { ok: false, msg: `its tests fail:\n${(tr.stdout + tr.stderr).slice(0, 800)}` };
    return { ok: true };
  };
  return verdict(s, comp, tests);
}

// ---- run everything

const results = new Array(snippets.length);
const plain = [];
const crate = [];
snippets.forEach((s, k) => {
  if (s.crates.length === 0 || s.error || checkOf(s) === "skip") { plain.push(k); return; }
  const unknown = s.crates.filter((c) => !DECLARED.has(normCrate(c)));
  if (unknown.length) results[k] = { ok: false, msg: `unknown crate: ${unknown.join(", ")}. Add it to tools/snippet-crates/Cargo.toml.` };
  else if (crateMode) crate.push(k);
  else results[k] = { ok: true, crateSkipped: true };
});

// Start the crate build now; it runs while the plain snippets are checked.
const crateJob = crate.length
  ? buildCrates(crate.map((k) => snippets[k])).catch((e) => ({ bins: {}, tests: {}, fatal: String(e), seconds: 0 }))
  : null;

let p = 0;
async function plainWorker() {
  while (p < plain.length) {
    const k = plain[p++];
    results[k] = await checkPlain(snippets[k]);
  }
}
await Promise.all(Array.from({ length: JOBS }, plainWorker));

let crateSeconds = 0;
if (crateJob) {
  const cr = await crateJob;
  crateSeconds = cr.seconds;
  let q = 0;
  async function crateWorker() {
    while (q < crate.length) {
      const k = crate[q++];
      const s = snippets[k];
      results[k] = await verdict(s, compFor(s, cr), testsFor(s, cr));
    }
  }
  await Promise.all(Array.from({ length: JOBS }, crateWorker));
}

let fails = 0, skipped = 0, passed = 0, crateSkipped = 0;
results.forEach((r, k) => {
  const s = snippets[k];
  if (r.skipped) { skipped++; return; }
  if (r.crateSkipped) { skipped++; crateSkipped++; return; }
  if (r.ok) { passed++; if (verbose) console.log(`ok    ${s.where}`); return; }
  fails++;
  console.log(`\nFAIL  ${s.where}\n${r.msg}\n----- code -----\n${s.code}\n`);
});
fs.rmSync(TMP, { recursive: true, force: true });
if (crate.length) console.log(`\ncrates: ${crate.length} snippets built in target/snippet-crates in ${crateSeconds.toFixed(1)}s`);
if (crateSkipped) console.log(`\n${crateSkipped} skipped (crates; run with --crates)`);
console.log(`\n${passed} passed, ${fails} failed, ${skipped} skipped (${snippets.length} snippets)`);
process.exit(fails ? 1 : 0);
