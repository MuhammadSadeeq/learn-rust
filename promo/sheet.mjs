#!/usr/bin/env node
// Contact sheet: `count` evenly spaced frames over [from, to), each labelled with its time.
//   node promo/sheet.mjs <from> <to> <count> <out.png> [--w 384] [--cols 8]
// Frame i is at T = from + i * (to - from) / count, so 0 24 48 gives 0.0, 0.5, ... 23.5.
import fs from "node:fs";
import path from "node:path";
import { startServer } from "./serve.mjs";
import { launchBrowser, openFilm, FPS } from "./lib.mjs";

const args = process.argv.slice(2);
const pos = [];
const opts = {};
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith("--")) {
    opts[args[i].slice(2)] = args[i + 1];
    i++;
  } else pos.push(args[i]);
}
const [fromS, toS, countS, outS] = pos;
if (outS === undefined) {
  console.error("usage: node promo/sheet.mjs <from> <to> <count> <out.png> [--w 384] [--cols 8]");
  process.exit(2);
}
const from = Number(fromS);
const to = Number(toS);
const count = Math.max(1, Number(countS));
const cellW = Number(opts.w || 384);
const cols = Number(opts.cols || Math.min(8, count));
const out = path.resolve(outS);
fs.mkdirSync(path.dirname(out), { recursive: true });

const times = Array.from({ length: count }, (_, i) => from + (i * (to - from)) / count);

const { base, close } = await startServer();
const browser = await launchBrowser();
try {
  const { context, page, errors } = await openFilm(browser, base, "render");
  const cells = [];
  for (const T of times) {
    await page.evaluate((t) => window.renderAt(t), T);
    const buf = await page.screenshot({ type: "jpeg", quality: 88, animations: "disabled" });
    const frame = Math.round(T * FPS);
    cells.push({ T, frame, src: "data:image/jpeg;base64," + buf.toString("base64") });
  }
  await context.close();

  const cellH = Math.round((cellW * 1080) / 1920);
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    body { margin: 0; background: #111; font: 600 15px/1.2 ui-monospace, Menlo, monospace; color: #ddd; }
    .grid { display: grid; grid-template-columns: repeat(${cols}, ${cellW}px); gap: 10px; padding: 12px; width: max-content; }
    figure { margin: 0; position: relative; }
    img { display: block; width: ${cellW}px; height: ${cellH}px; background: #000; }
    figcaption { position: absolute; left: 6px; top: 6px; background: rgba(0,0,0,0.75); color: #ffd38a; padding: 2px 6px; border-radius: 3px; }
    .title { padding: 10px 12px 0; color: #9aa3ad; }
  </style></head><body>
  <div class="title">${times.length} frames, T ${from}..${to} s, ${FPS} fps</div>
  <div class="grid">${cells
    .map((c) => `<figure><img src="${c.src}" alt=""><figcaption>${c.T.toFixed(2)} s · f${c.frame}</figcaption></figure>`)
    .join("")}</div></body></html>`;

  const sheetPage = await browser.newPage({ viewport: { width: 600, height: 400 }, deviceScaleFactor: 1 });
  await sheetPage.setContent(html, { waitUntil: "load" });
  const full = await sheetPage.evaluate(() => {
    const g = document.querySelector(".grid");
    const r = document.body.getBoundingClientRect();
    return { w: Math.ceil(Math.max(g.getBoundingClientRect().width + 24, r.width)), h: Math.ceil(document.body.scrollHeight) };
  });
  await sheetPage.setViewportSize({ width: full.w, height: full.h });
  await sheetPage.screenshot({ path: out, fullPage: true, type: "png" });
  await sheetPage.close();
  if (errors.length) console.error(errors.join("\n"));
  console.log(out);
} finally {
  await browser.close();
  await close();
}
