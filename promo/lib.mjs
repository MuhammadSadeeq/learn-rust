// Shared helpers for the film tools (frame, sheet, render). Not a CLI.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(HERE, "..");
export const TIMING = JSON.parse(fs.readFileSync(path.join(HERE, "timing.json"), "utf8"));
export const FPS = TIMING.fps;
export const W = TIMING.width;
export const H = TIMING.height;
export const DURATION = TIMING.duration;

const PW_DEFAULT = "/opt/node22/lib/node_modules/playwright/index.mjs";

// Playwright from the preinstalled location (never runs `playwright install`).
export async function loadChromium() {
  const p = process.env.PLAYWRIGHT_INDEX || PW_DEFAULT;
  const mod = await import(pathToFileURL(p).href);
  return mod.chromium;
}

export async function launchBrowser() {
  const chromium = await loadChromium();
  return chromium.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-gpu-compositing",
      "--font-render-hinting=none",
      "--disable-background-timer-throttling",
      "--disable-renderer-backgrounding",
      "--disable-backgrounding-occluded-windows",
      "--autoplay-policy=no-user-gesture-required",
    ],
  });
}

// A 1920x1080 context and page on the film, with __ready awaited.
export async function openFilm(browser, base, query = "render") {
  const context = await browser.newContext({
    viewport: { width: W, height: H },
    deviceScaleFactor: 1,
    colorScheme: "dark",
  });
  const page = await context.newPage();
  page.setDefaultTimeout(120000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(`console: ${m.text()}`);
  });
  await page.goto(`${base}promo/index.html?${query}`, { waitUntil: "load" });
  await page.evaluate(() => window.__ready);
  return { context, page, errors };
}

// The frame index for a global time T (frame k is T = k / FPS).
export const frameIndex = (T, fps = FPS) => Math.round(T * fps);
export const frameName = (k) => `f${String(k).padStart(6, "0")}.jpg`;

export const fmt = (n) => (Math.round(n * 100) / 100).toFixed(2);
