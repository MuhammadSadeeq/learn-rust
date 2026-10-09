#!/usr/bin/env node
// Renders one full-size frame (1920x1080 PNG) at global time T.
//   node promo/frame.mjs 16.0 /tmp/impact.png
import { startServer } from "./serve.mjs";
import { launchBrowser, openFilm } from "./lib.mjs";
import path from "node:path";
import fs from "node:fs";

const [, , tArg, outArg] = process.argv;
if (tArg === undefined || !outArg) {
  console.error("usage: node promo/frame.mjs <T seconds> <out.png>");
  process.exit(2);
}
const T = Number(tArg);
if (!Number.isFinite(T) || T < 0) {
  console.error(`bad time: ${tArg}`);
  process.exit(2);
}
const out = path.resolve(outArg);
fs.mkdirSync(path.dirname(out), { recursive: true });

const { base, close } = await startServer();
const browser = await launchBrowser();
try {
  const { context, page, errors } = await openFilm(browser, base, `t=${T}`);
  await page.evaluate((t) => window.renderAt(t), T);
  await page.screenshot({ path: out, type: "png", animations: "disabled" });
  await context.close();
  if (errors.length) console.error(errors.join("\n"));
  console.log(out);
} finally {
  await browser.close();
  await close();
}
