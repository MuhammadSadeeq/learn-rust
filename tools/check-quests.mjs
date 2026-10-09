#!/usr/bin/env node
// Verifies every Forge quest:
//   * the starter file in quests/ must NOT pass yet (compile error or failing test)
//   * the reference solution in solutions/ must compile and pass all its tests
//   * the tests module in the starter must be identical to the solution's
//
//   node tools/check-quests.mjs              # all quests
//   node tools/check-quests.mjs move1 move2  # some quests
//   node tools/check-quests.mjs --chapter 6

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import { parseQuests } from "./sync-quests-lib.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const chIdx = args.indexOf("--chapter");
const chapter = chIdx >= 0 ? Number(args[chIdx + 1]) : null;
const names = args.filter((a, i) => !a.startsWith("--") && !(chIdx >= 0 && i === chIdx + 1));
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "oxquest-"));
const JOBS = Math.max(2, os.cpus().length);

let quests = parseQuests(fs.readFileSync(path.join(ROOT, "quests/quests.toml"), "utf8"));
if (names.length) quests = quests.filter((q) => names.includes(q.name));
if (chapter !== null) quests = quests.filter((q) => q.chapter === chapter);

const run = (cmd, argv, opts = {}) => new Promise((res) => {
  execFile(cmd, argv, { timeout: 120000, maxBuffer: 16 << 20, ...opts }, (err, stdout, stderr) => res({ code: err ? (typeof err.code === "number" ? err.code : 1) : 0, stdout: String(stdout), stderr: String(stderr) }));
});

async function test(file, tag) {
  const bin = path.join(TMP, tag + (process.platform === "win32" ? ".exe" : ""));
  const c = await run("rustc", ["--edition", "2024", "--test", "--color", "never", "-o", bin, file]);
  if (c.code !== 0) return { compiled: false, passed: false, out: c.stderr };
  const r = await run(bin, ["--test-threads", "1"], { cwd: TMP });
  return { compiled: true, passed: r.code === 0, out: r.stdout + r.stderr };
}

const testsBlock = (src) => {
  const i = src.indexOf("#[cfg(test)]");
  return i < 0 ? null : src.slice(i).replace(/\s+$/, "");
};

const results = [];
let next = 0;
async function worker() {
  while (next < quests.length) {
    const q = quests[next++];
    const starter = path.join(ROOT, "quests", q.path);
    const solution = path.join(ROOT, "solutions", q.path);
    const problems = [];
    if (!fs.existsSync(starter)) problems.push("starter missing");
    if (!fs.existsSync(solution)) problems.push("solution missing");
    if (!problems.length) {
      const a = fs.readFileSync(starter, "utf8"), b = fs.readFileSync(solution, "utf8");
      const ta = testsBlock(a), tb = testsBlock(b);
      if (!ta) problems.push("starter has no #[cfg(test)] module");
      else if (ta !== tb) problems.push("tests module differs between starter and solution");
      const s = await test(starter, q.name + "_start");
      if (s.passed) problems.push("starter already passes (it should fail until the learner fixes it)");
      const r = await test(solution, q.name + "_sol");
      if (!r.compiled) problems.push("solution does not compile:\n" + r.out.split("\n").slice(0, 20).join("\n"));
      else if (!r.passed) problems.push("solution fails its tests:\n" + r.out.split("\n").slice(-25).join("\n"));
      const tcount = (a.match(/#\[test\]/g) || []).length;
      if (tcount < 1) problems.push("no #[test] functions");
    }
    results.push({ q, problems });
  }
}
await Promise.all(Array.from({ length: JOBS }, worker));
fs.rmSync(TMP, { recursive: true, force: true });

results.sort((x, y) => quests.indexOf(x.q) - quests.indexOf(y.q));
let bad = 0;
for (const { q, problems } of results) {
  if (problems.length) { bad++; console.log(`FAIL  ${q.name} (${q.path})\n  - ${problems.join("\n  - ")}`); }
  else console.log(`ok    ${q.name}`);
}
console.log(`\n${results.length - bad} ok, ${bad} failing (${results.length} quests)`);
process.exit(bad ? 1 : 0);
