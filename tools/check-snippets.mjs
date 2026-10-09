#!/usr/bin/env node
// Oxidize snippet checker.
//
// Compiles every Rust code sample in the course with the real rustc, so the
// site never teaches something the compiler disagrees with.
//
//   node tools/check-snippets.mjs                 # everything
//   node tools/check-snippets.mjs site/chapters/06-ownership.html
//   node tools/check-snippets.mjs --verbose
//
// Sources checked:
//   * <pre class="rs ..."> blocks in site/**/*.html (data-check / data-stdout)
//   * fill-in-the-blank blocks (.ox-fill) with their first answers filled in
//   * Memory X-Ray scenarios (window.OX_XRAY) and timelines (OX_TIMELINES):
//     `check` field on the scenario, default "ok"
//   * every other window.OX_* array in site/assets/**.js whose items have a
//     `rust` field (lab data). Optional `fix`, `idiomatic`, `rust2` and
//     `fixes[]` code on the same item must compile.
//   * motion scenes (OX_MOTION): the scene's `rust` and `check`, and every
//     beat's own `rust` with the beat's `check` (default "ok").
//
// data-check values:
//   (absent) / "ok"   must compile
//   "E0382"           must fail with that error code (comma-separate for several)
//   "error"           must fail to compile (any reason)
//   "panic"           must compile and panic at runtime
//   "skip"            not checked (needs crates, or a deliberate fragment)
// data-stdout="..."   must compile, run, and print exactly this (trimmed)

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import vm from "node:vm";
import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = path.join(ROOT, "site");
const args = process.argv.slice(2);
const verbose = args.includes("--verbose");
const only = args.filter((a) => !a.startsWith("--")).map((a) => path.resolve(a));
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "oxsnip-"));
const JOBS = Math.max(2, os.cpus().length);

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
    snippets.push({ where: `${path.relative(ROOT, file)}:${lineOf(text, m.index)} (fill)`, code, check, stdout: so ? decode(so[1]).replace(/\\n/g, "\n") : null });
  }
  const preRe = /<pre([^>]*)>([\s\S]*?)<\/pre>/g;
  while ((m = preRe.exec(text))) {
    if (fillRanges.some(([a, b]) => m.index >= a && m.index < b)) continue;
    const attrs = m[1];
    if (!/class="[^"]*\b(rs|rust)\b/.test(attrs)) continue;
    const check = (/data-check="([^"]*)"/.exec(attrs) || [])[1] || "ok";
    const so = /data-stdout="([^"]*)"/.exec(attrs);
    const code = dedent(decode(m[2]));
    snippets.push({ where: `${path.relative(ROOT, file)}:${lineOf(text, m.index)}`, code, check, stdout: so ? decode(so[1]).replace(/\\n/g, "\n") : null });
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
    snippets.push({ where: `${path.relative(ROOT, file)} xray:${s.id}`, code: dedent(s.code), check: s.check || "ok", stdout: null });
  }
  for (const s of w.OX_TIMELINES || []) {
    snippets.push({ where: `${path.relative(ROOT, file)} timeline:${s.id}`, code: dedent(s.code), check: s.check || "ok", stdout: null });
  }
  // Any other OX_* array whose items carry a `rust` string (labs data):
  // each item is checked with its own `check` / `stdout` fields. Items may
  // also carry `fix` / `idiomatic` / `rust2` code, which must always compile.
  for (const [key, arr] of Object.entries(w)) {
    if (!/^OX_/.test(key) || !Array.isArray(arr) || key === "OX_XRAY" || key === "OX_TIMELINES") continue;
    arr.forEach((s, k) => {
      if (!s || typeof s !== "object") return;
      const tag = `${path.relative(ROOT, file)} ${key}[${s.id || k}]`;
      if (typeof s.rust === "string") snippets.push({ where: tag, code: dedent(s.rust), check: s.check || "ok", stdout: s.stdout || null });
      // Motion scenes: a beat may carry its own rust (the code from that beat on),
      // checked with its own check, default "ok", just like the scene's rust.
      if (Array.isArray(s.beats)) s.beats.forEach((b, j) => {
        if (b && typeof b.rust === "string") snippets.push({ where: `${tag}.beats[${j}]`, code: dedent(b.rust), check: b.check || "ok", stdout: null });
      });
      for (const extra of ["fix", "idiomatic", "rust2"]) {
        if (typeof s[extra] === "string") snippets.push({ where: `${tag}.${extra}`, code: dedent(s[extra]), check: s[extra + "Check"] || "ok", stdout: null });
      }
      if (Array.isArray(s.fixes)) s.fixes.forEach((f, j) => {
        const code = typeof f === "string" ? f : f && f.rust;
        if (typeof code === "string") snippets.push({ where: `${tag}.fixes[${j}]`, code: dedent(code), check: (f && f.check) || "ok", stdout: null });
      });
    });
  }
}

function wrap(code) {
  // Snippets with tests are whole files of items, so they get an empty main.
  const body = /\bfn\s+main\s*\(/.test(code) ? code : /#\[test\]/.test(code) ? `${code}\nfn main() {}` : `fn main() {\n${code}\n}`;
  return `#![allow(unused, dead_code, unused_variables, unused_mut, unused_assignments, unreachable_code, path_statements, unused_must_use)]\n${body}\n`;
}

function run(cmd, argv, opts = {}) {
  return new Promise((resolve) => {
    execFile(cmd, argv, { timeout: 60000, maxBuffer: 8 * 1024 * 1024, ...opts }, (err, stdout, stderr) => {
      resolve({ code: err ? (typeof err.code === "number" ? err.code : 1) : 0, stdout: String(stdout), stderr: String(stderr), killed: err && err.killed });
    });
  });
}

let n = 0;
async function checkOne(s) {
  if (s.error) return { ok: false, msg: s.error };
  const check = (s.check || "ok").trim();
  if (check === "skip") return { ok: true, skipped: true };
  const id = n++;
  const src = path.join(TMP, `s${id}.rs`);
  const bin = path.join(TMP, `s${id}${process.platform === "win32" ? ".exe" : ""}`);
  fs.writeFileSync(src, wrap(s.code));
  const needRun = check === "panic" || s.stdout !== null;
  const argv = ["--edition", "2024", "--crate-name", "snippet", "--color", "never", "-o", bin, src];
  // --emit=mir (not metadata) so deny-by-default MIR lints such as
  // arithmetic_overflow and unconditional_panic are reported too.
  if (!needRun) argv.splice(0, 0, "--emit=mir");
  const c = await run("rustc", argv, { cwd: TMP });
  const errs = [...c.stderr.matchAll(/error\[(E\d{4})\]/g)].map((x) => x[1]);
  const failed = c.code !== 0;
  if (check === "ok" || check === "panic") {
    if (failed) return { ok: false, msg: `expected to compile, but rustc failed:\n${c.stderr.split("\n").slice(0, 25).join("\n")}` };
    // A normal build drops #[cfg(test)] code, so snippets with tests are
    // also built with --test and their tests must pass.
    if (check === "ok" && /#\[test\]/.test(s.code)) {
      const t = await run("rustc", ["--test", "--edition", "2024", "--crate-name", "snippet", "--color", "never", "-o", bin + "_t", src], { cwd: TMP });
      if (t.code !== 0) return { ok: false, msg: `its tests do not compile:\n${t.stderr.split("\n").slice(0, 25).join("\n")}` };
      const tr = await run(bin + "_t", ["--quiet"], { cwd: TMP });
      if (tr.code !== 0) return { ok: false, msg: `its tests fail:\n${(tr.stdout + tr.stderr).slice(0, 800)}` };
    }
    if (!needRun) return { ok: true };
    const r = await run(bin, [], { cwd: TMP });
    if (check === "panic") {
      if (r.code === 0) return { ok: false, msg: "expected a panic, but it exited cleanly" };
      if (s.stdout !== null && r.stdout.trim() !== s.stdout.trim()) return { ok: false, msg: `stdout mismatch\n--- expected\n${s.stdout.trim()}\n--- actual\n${r.stdout.trim()}` };
      return { ok: true };
    }
    if (r.code !== 0) return { ok: false, msg: `compiled but exited with ${r.code}:\n${r.stderr.slice(0, 800)}` };
    if (s.stdout !== null && r.stdout.trim() !== s.stdout.trim()) return { ok: false, msg: `stdout mismatch\n--- expected\n${s.stdout.trim()}\n--- actual\n${r.stdout.trim()}` };
    return { ok: true };
  }
  if (!failed) return { ok: false, msg: `expected a compile error (${check}), but it compiled` };
  if (check === "error") return { ok: true };
  const want = check.split(",").map((x) => x.trim());
  const missing = want.filter((w) => !errs.includes(w));
  if (missing.length) return { ok: false, msg: `expected ${want.join(", ")}, rustc reported ${errs.join(", ") || "no error code"}:\n${c.stderr.split("\n").slice(0, 20).join("\n")}` };
  return { ok: true };
}

const results = new Array(snippets.length);
let next = 0;
async function worker() {
  while (next < snippets.length) {
    const k = next++;
    results[k] = await checkOne(snippets[k]);
  }
}
await Promise.all(Array.from({ length: JOBS }, worker));

let fails = 0, skipped = 0, passed = 0;
results.forEach((r, k) => {
  const s = snippets[k];
  if (r.skipped) { skipped++; return; }
  if (r.ok) { passed++; if (verbose) console.log(`ok    ${s.where}`); return; }
  fails++;
  console.log(`\nFAIL  ${s.where}\n${r.msg}\n----- code -----\n${s.code}\n`);
});
fs.rmSync(TMP, { recursive: true, force: true });
console.log(`\n${passed} passed, ${fails} failed, ${skipped} skipped (${snippets.length} snippets)`);
process.exit(fails ? 1 : 0);
