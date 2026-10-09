#!/usr/bin/env node
// Renders film frames as JPEG (quality 92) with parallel Playwright pages.
//   node promo/render.mjs [--from 0] [--to 64] [--fps 60] [--workers 4]
//                         [--out promo/out/frames] [--resume]
// Frame k is the global time T = k / fps, named f%06d.jpg by its index k.
// --from and --to are seconds; the range is [from, to).
import fs from "node:fs";
import path from "node:path";
import { startServer } from "./serve.mjs";
import { launchBrowser, openFilm, FPS, DURATION, ROOT, frameName } from "./lib.mjs";

const args = process.argv.slice(2);
const opt = (name, dflt) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : dflt;
};
const flag = (name) => args.includes(`--${name}`);

const from = Number(opt("from", 0));
const to = Number(opt("to", DURATION));
const fps = Number(opt("fps", FPS));
const workers = Math.max(1, Number(opt("workers", 4)));
const outDir = path.resolve(opt("out", path.join(ROOT, "promo/out/frames")));
const resume = flag("resume");

const first = Math.round(from * fps);
const last = Math.round(to * fps); // exclusive
const total = Math.max(0, last - first);
fs.mkdirSync(outDir, { recursive: true });

console.log(`frames ${first}..${last - 1} (${total}) at ${fps} fps, ${workers} workers -> ${outDir}`);

const { base, close } = await startServer();
const browser = await launchBrowser();
const t0 = Date.now();
let next = 0;
let done = 0;
let skipped = 0;
const errors = [];

async function worker(id) {
  const { context, page, errors: pageErrors } = await openFilm(browser, base, "render");
  try {
    for (;;) {
      const i = next++;
      if (i >= total) break;
      const k = first + i;
      const file = path.join(outDir, frameName(k));
      if (resume && fs.existsSync(file) && fs.statSync(file).size > 0) {
        skipped++;
        done++;
        continue;
      }
      const T = k / fps;
      await page.evaluate((t) => window.renderAt(t), T);
      const buf = await page.screenshot({ type: "jpeg", quality: 92, animations: "disabled" });
      fs.writeFileSync(file, buf);
      done++;
      if (done % 120 === 0 || done === total) {
        const el = (Date.now() - t0) / 1000;
        console.log(`  ${done}/${total}  ${(done / el).toFixed(1)} fps  (${el.toFixed(1)} s)  T=${T.toFixed(3)}`);
      }
    }
    const st = await page.evaluate(() => (window.V && window.V.errors) || []);
    for (const e of st) errors.push(`w${id}: ${e}`);
  } finally {
    errors.push(...pageErrors.map((e) => `w${id}: ${e}`));
    await context.close();
  }
}

try {
  await Promise.all(Array.from({ length: Math.min(workers, Math.max(1, total)) }, (_, i) => worker(i)));
  const el = (Date.now() - t0) / 1000;
  const rendered = total - skipped;
  console.log(
    `done: ${rendered} rendered${skipped ? `, ${skipped} skipped` : ""} in ${el.toFixed(1)} s` +
      `  =  ${(rendered / el).toFixed(1)} frames/s  (${(rendered / el / fps).toFixed(2)}x realtime at ${fps} fps)`
  );
  const uniq = [...new Set(errors)];
  if (uniq.length) {
    console.error(`${uniq.length} engine/page errors:`);
    for (const e of uniq.slice(0, 30)) console.error("  " + e.split("\n")[0]);
    process.exitCode = 1;
  }
} finally {
  await browser.close();
  await close();
}
