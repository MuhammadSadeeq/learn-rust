#!/usr/bin/env node
// Folds hint files (docs/_hints/*.toml, each a list of [[quest]] name + hint)
// into quests/quests.toml, then rewrites quests.toml in canonical form.
//
//   node tools/merge-hints.mjs            # merge, keep the hint files
//   node tools/merge-hints.mjs --clean    # merge, then delete docs/_hints/

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseQuests } from "./sync-quests-lib.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const questsPath = path.join(ROOT, "quests/quests.toml");
const hintsDir = path.join(ROOT, "docs/_hints");

const text = fs.readFileSync(questsPath, "utf8");
const header = text.split("\n").filter((l, i, all) => all.slice(0, i + 1).every((x) => x.startsWith("#") || !x.trim())).join("\n").trimEnd();
const quests = parseQuests(text);

const hints = new Map();
if (fs.existsSync(hintsDir)) {
  for (const f of fs.readdirSync(hintsDir).filter((f) => f.endsWith(".toml")).sort()) {
    for (const h of parseQuests(fs.readFileSync(path.join(hintsDir, f), "utf8").replace(/^(\[\[quest\]\][^\n]*\n)/gm, "$1path = \"-\"\n"))) {
      if (h.hint) hints.set(h.name, h.hint.trim());
    }
  }
}

let merged = 0;
const unknown = [...hints.keys()].filter((n) => !quests.some((q) => q.name === n));
for (const q of quests) {
  if (hints.has(q.name)) { q.hint = hints.get(q.name); merged++; }
}

const str = (s) => JSON.stringify(s);
let out = header + "\n";
for (const q of quests) {
  out += `\n[[quest]]\nname = ${str(q.name)}\nchapter = ${q.chapter}\npath = ${str(q.path)}\ntitle = ${str(q.title)}\n`;
  if (q.summary) out += `summary = ${str(q.summary)}\n`;
  if (q.boss) out += `boss = true\n`;
  if (q.hint) {
    if (q.hint.includes('"""')) throw new Error(`hint for ${q.name} contains """`);
    out += `hint = """\n${q.hint.trim()}\n"""\n`;
  }
}
fs.writeFileSync(questsPath, out);

const missing = quests.filter((q) => !q.hint).map((q) => q.name);
console.log(`${merged} hints merged into quests.toml.`);
if (unknown.length) console.log(`Ignored hints for unknown quests: ${unknown.join(", ")}`);
if (missing.length) console.log(`Quests still without a hint: ${missing.join(", ")}`);
if (process.argv.includes("--clean")) fs.rmSync(hintsDir, { recursive: true, force: true });
