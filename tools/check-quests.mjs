#!/usr/bin/env node
// Verifies every Forge quest:
//   * the starter must NOT pass yet (compile error or failing test)
//   * the reference solution must compile and pass all its tests
//   * the tests in the starter must be identical to the solution's
//
// Single-file quests are compiled with rustc. Cargo quests (kind = "cargo")
// are packages: quests/pkgs/<name> and solutions/pkgs/<name>. Their starter and
// solution are built with `cargo test --no-run` into the shared target dir,
// target/forge-pkgs, then each test program is run on its own, as the Forge does.
//
// The time limits are the Forge's (forge/src/runner.rs): 20 seconds for a test
// program, 15 minutes for a cargo build. A program that runs past its limit,
// or a child it started, is killed. Cargo quests run one at a time, because
// cargo locks that directory while it builds.
//
//   node tools/check-quests.mjs              # all quests
//   node tools/check-quests.mjs move1 move2  # some quests
//   node tools/check-quests.mjs --chapter 6

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFile, spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { parseQuests } from "./sync-quests-lib.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const chIdx = args.indexOf("--chapter");
const chapter = chIdx >= 0 ? Number(args[chIdx + 1]) : null;
const names = args.filter((a, i) => !a.startsWith("--") && !(chIdx >= 0 && i === chIdx + 1));
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "oxquest-"));
const JOBS = Math.max(2, os.cpus().length);
const PKG_TARGET = path.join(ROOT, "target", "forge-pkgs");
// The Forge's limits (forge/src/runner.rs), in milliseconds.
const TEST_TIMEOUT = 20 * 1000;
const CARGO_BUILD_TIMEOUT = 15 * 60 * 1000;
// Compiling one file takes seconds; this only stops a stuck compiler.
const COMPILE_TIMEOUT = 120 * 1000;

let quests = parseQuests(fs.readFileSync(path.join(ROOT, "quests/quests.toml"), "utf8"));
if (names.length) quests = quests.filter((q) => names.includes(q.name));
if (chapter !== null) quests = quests.filter((q) => q.chapter === chapter);

// Runs a short command to the end and returns its output. Used for `cargo clean`.
const capture = (cmd, argv, opts = {}) => new Promise((res) => {
  execFile(cmd, argv, { maxBuffer: 16 << 20, ...opts }, (err, stdout, stderr) => res({ code: err ? (typeof err.code === "number" ? err.code : 1) : 0, stdout: String(stdout), stderr: String(stderr) }));
});

// Runs a program with a time limit, in a process group of its own. When the
// limit passes, or when the program exits, the group is killed, so no program
// it started keeps running or holds the output open. Resolves once it stops.
function runLimited(cmd, argv, { cwd = ROOT, env = process.env, timeout }) {
  return new Promise((resolve) => {
    const posix = process.platform !== "win32";
    const child = spawn(cmd, argv, { cwd, env, detached: posix, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "", stderr = "", timedOut = false;
    const killGroup = () => {
      try {
        if (posix) process.kill(-child.pid, "SIGKILL");
        else child.kill("SIGKILL");
      } catch {
        // Already gone.
      }
    };
    const timer = setTimeout(() => { timedOut = true; killGroup(); }, timeout);
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", (err) => {
      clearTimeout(timer);
      resolve({ code: 1, stdout, stderr: stderr + String(err), timedOut: false });
    });
    child.on("exit", () => { clearTimeout(timer); killGroup(); });
    child.on("close", (code) => resolve({ code: timedOut ? null : code, stdout, stderr, timedOut }));
  });
}

async function test(file, tag) {
  const bin = path.join(TMP, tag + (process.platform === "win32" ? ".exe" : ""));
  const c = await runLimited("rustc", ["--edition", "2024", "--test", "--color", "never", "-o", bin, file], { timeout: COMPILE_TIMEOUT });
  if (c.code !== 0) return { compiled: false, passed: false, out: c.timedOut ? `rustc ran for more than ${COMPILE_TIMEOUT / 1000} seconds` : c.stderr };
  const r = await runLimited(bin, ["--test-threads", "1"], { cwd: TMP, timeout: TEST_TIMEOUT });
  // Each test binary is large, and a run checks ~180 of them: delete each one once it has run.
  fs.rmSync(bin, { force: true });
  if (r.timedOut) return { compiled: true, passed: false, out: `The tests ran for ${TEST_TIMEOUT / 1000} seconds without finishing.` };
  return { compiled: true, passed: r.code === 0, out: r.stdout + r.stderr };
}

// Cargo's progress lines are noise in a failure report.
const PROGRESS = /^\s+(Compiling|Checking|Downloading|Downloaded|Locking|Updating|Blocking|Finished|Running|Doc-tests)\b/;

// The starter and the solution have the same package name, so cargo gives them
// one artifact in the shared target dir, and a run could test the other one.
// `cargo clean -p` forgets this package's own build (not its dependencies), so
// each run tests the directory it was given. The package rebuilds in seconds.
async function testCargo(dir, name) {
  const manifest = path.join(dir, "Cargo.toml");
  const env = { ...process.env, CARGO_TARGET_DIR: PKG_TARGET };
  await capture("cargo", ["clean", "--manifest-path", manifest, "-p", name], { cwd: ROOT, env });

  // Build only, with the build limit. The JSON on stdout names the test
  // programs; the diagnostics come on stderr, as in the Forge.
  const build = await runLimited(
    "cargo",
    ["test", "--no-run", "--manifest-path", manifest, "--message-format=json-render-diagnostics", "--color", "never"],
    { env, timeout: CARGO_BUILD_TIMEOUT }
  );
  if (build.timedOut) {
    return { passed: false, compileError: true, out: [`Building the package took more than ${CARGO_BUILD_TIMEOUT / 60000} minutes.`] };
  }
  if (build.code !== 0) {
    const lines = build.stderr.split("\n").filter((line) => !PROGRESS.test(line));
    return { passed: false, compileError: true, out: lines };
  }

  // A test program is an artifact whose profile has `test` set. A dependency's
  // `target.test` is true too, so the profile is the field to check.
  const programs = build.stdout.split("\n").flatMap((line) => {
    let message;
    try { message = JSON.parse(line); } catch { return []; }
    return message.reason === "compiler-artifact" && message.profile?.test === true && message.executable
      ? [message.executable]
      : [];
  });
  if (programs.length === 0) {
    return { passed: false, compileError: true, out: ["cargo built no test programs for this package."] };
  }

  for (const program of programs) {
    // Cargo runs each test program from the package directory, with this variable set.
    const r = await runLimited(program, ["--color", "never"], {
      cwd: dir,
      env: { ...process.env, CARGO_MANIFEST_DIR: dir, RUST_BACKTRACE: "0" },
      timeout: TEST_TIMEOUT,
    });
    if (r.timedOut) {
      return { passed: false, compileError: false, out: [`The tests ran for ${TEST_TIMEOUT / 1000} seconds without finishing.`] };
    }
    if (r.code !== 0) return { passed: false, compileError: false, out: (r.stdout + r.stderr).split("\n") };
  }
  return { passed: true, compileError: false, out: [] };
}

const testsBlock = (src) => {
  const i = src.indexOf("#[cfg(test)]");
  return i < 0 ? null : src.slice(i).replace(/\s+$/, "");
};

// Every .rs file under dir, sorted, recursively.
const rsFiles = (dir) => {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) return rsFiles(p);
    return entry.name.endsWith(".rs") ? [p] : [];
  }).sort();
};
// The integration tests of a package, as [relative path, text] pairs.
const testFilesOf = (dir) => rsFiles(path.join(dir, "tests")).map((f) => [path.relative(dir, f), fs.readFileSync(f, "utf8")]);
const TEST_ATTR = /#\[(?:tokio::)?test\b/g;
const countTestAttrs = (text) => (text.match(TEST_ATTR) || []).length;

async function checkSingle(q) {
  const starter = path.join(ROOT, "quests", q.path);
  const solution = path.join(ROOT, "solutions", q.path);
  const problems = [];
  if (!fs.existsSync(starter)) problems.push("starter missing");
  if (!fs.existsSync(solution)) problems.push("solution missing");
  if (problems.length) return problems;

  const a = fs.readFileSync(starter, "utf8"), b = fs.readFileSync(solution, "utf8");
  const ta = testsBlock(a), tb = testsBlock(b);
  if (!ta) problems.push("starter has no #[cfg(test)] module");
  else if (ta !== tb) problems.push("tests module differs between starter and solution");
  const s = await test(starter, q.name + "_start");
  if (s.passed) problems.push("starter already passes (it should fail until the learner fixes it)");
  const r = await test(solution, q.name + "_sol");
  if (!r.compiled) problems.push("solution does not compile:\n" + r.out.split("\n").slice(0, 20).join("\n"));
  else if (!r.passed) problems.push("solution fails its tests:\n" + r.out.split("\n").slice(-25).join("\n"));
  if (countTestAttrs(a) < 1) problems.push("no #[test] functions");
  return problems;
}

async function checkCargo(q) {
  const starter = path.join(ROOT, "quests", q.path);
  const solution = path.join(ROOT, "solutions", q.path);
  const problems = [];
  if (!fs.existsSync(starter)) problems.push("starter package missing");
  if (!fs.existsSync(solution)) problems.push("solution package missing");
  if (problems.length) return problems;

  // The starter and the solution must use the same manifest and lock file, and
  // the package must be named after its quest.
  if (!fs.readFileSync(path.join(starter, "Cargo.toml"), "utf8").includes(`name = "${q.name}"`)) {
    problems.push(`Cargo.toml must name the package "${q.name}"`);
  }
  for (const file of ["Cargo.toml", "Cargo.lock"]) {
    const s = path.join(starter, file), t = path.join(solution, file);
    if (!fs.existsSync(s) || !fs.existsSync(t)) problems.push(`${file} missing`);
    else if (fs.readFileSync(s, "utf8") !== fs.readFileSync(t, "utf8")) problems.push(`${file} differs between starter and solution`);
  }
  const starterLib = path.join(starter, "src", "lib.rs"), solutionLib = path.join(solution, "src", "lib.rs");
  if (!fs.existsSync(starterLib)) problems.push("starter has no src/lib.rs");
  if (!fs.existsSync(solutionLib)) problems.push("solution has no src/lib.rs");
  if (problems.length) return problems;

  const a = fs.readFileSync(starterLib, "utf8"), b = fs.readFileSync(solutionLib, "utf8");
  const ta = testsBlock(a), tb = testsBlock(b);
  if (!ta) problems.push("starter src/lib.rs has no #[cfg(test)] module");
  else if (ta !== tb) problems.push("tests module differs between starter and solution");
  if (JSON.stringify(testFilesOf(starter)) !== JSON.stringify(testFilesOf(solution))) {
    problems.push("files in tests/ differ between starter and solution");
  }
  const attrs = countTestAttrs(a) + testFilesOf(starter).reduce((n, [, text]) => n + countTestAttrs(text), 0);
  if (attrs < 1) problems.push("no #[test] or #[tokio::test] functions");

  const s = await testCargo(starter, q.name);
  if (s.passed) problems.push("starter already passes (it should fail until the learner fixes it)");
  const r = await testCargo(solution, q.name);
  if (!r.passed) {
    const shown = r.compileError ? r.out.slice(0, 20) : r.out.slice(-25);
    problems.push((r.compileError ? "solution does not compile:\n" : "solution fails its tests:\n") + shown.join("\n"));
  }
  return problems;
}

const results = new Map();
let next = 0;
async function singleWorker() {
  const singles = quests.filter((q) => q.kind !== "cargo");
  while (next < singles.length) {
    const q = singles[next++];
    results.set(q, await checkSingle(q));
  }
}
// Cargo quests share one build directory, so they run one after another.
async function cargoQueue() {
  for (const q of quests.filter((q) => q.kind === "cargo")) results.set(q, await checkCargo(q));
}
await Promise.all([...Array.from({ length: JOBS }, singleWorker), cargoQueue()]);
fs.rmSync(TMP, { recursive: true, force: true });

let bad = 0;
for (const q of quests) {
  const problems = results.get(q);
  if (problems.length) { bad++; console.log(`FAIL  ${q.name} (${q.path})\n  - ${problems.join("\n  - ")}`); }
  else console.log(`ok    ${q.name}`);
}
console.log(`\n${quests.length - bad} ok, ${bad} failing (${quests.length} quests)`);
process.exit(bad ? 1 : 0);
