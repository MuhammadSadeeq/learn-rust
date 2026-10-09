#!/usr/bin/env node
// Tiny static server for the repo root, so index.html can load ../site/assets/*.
//   node promo/serve.mjs            serve until Ctrl-C (PORT=8123 to pick a port)
//   import { startServer } from "./serve.mjs"  (used by frame, sheet and render)
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(HERE, "..");

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".wav": "audio/wav",
  ".mp4": "video/mp4",
};

// Resolves with { base, server, close() }. base ends with "/" and is the repo root URL.
export function startServer(port = Number(process.env.PORT) || 0) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      try {
        const u = new URL(req.url, "http://localhost");
        let p = decodeURIComponent(u.pathname);
        if (p.endsWith("/")) p += "index.html";
        const file = path.normalize(path.join(ROOT, p));
        if (file !== ROOT && !file.startsWith(ROOT + path.sep)) {
          res.writeHead(403);
          return res.end("forbidden");
        }
        fs.stat(file, (err, st) => {
          if (err || !st.isFile()) {
            res.writeHead(404, { "content-type": "text/plain" });
            return res.end("not found: " + p);
          }
          res.writeHead(200, {
            "content-type": TYPES[path.extname(file).toLowerCase()] || "application/octet-stream",
            "content-length": st.size,
            "cache-control": "no-store",
          });
          fs.createReadStream(file).pipe(res);
        });
      } catch (e) {
        res.writeHead(500);
        res.end(String(e));
      }
    });
    server.on("error", reject);
    server.listen(port, "127.0.0.1", () => {
      const base = `http://127.0.0.1:${server.address().port}/`;
      resolve({
        base,
        server,
        close: () => new Promise((r) => server.close(() => r())),
      });
    });
  });
}

// CLI: run the server until interrupted.
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const { base } = await startServer();
  console.log(`serving ${ROOT}`);
  console.log(`film: ${base}promo/index.html`);
  console.log(`preview: ${base}promo/index.html?t=12.5   or   ${base}promo/index.html?play&from=24`);
}
