/* OXIDIZE launch film: the engine.

   Every frame is a pure function of global time T. renderAt(T) sets every
   animated property from T alone; nothing accumulates between frames, so any
   frame can be rendered in any order, in any worker, and come out the same.

   Contract: promo/DIRECTION.md section 4. Scenes call V.scene() at load time;
   V.boot() (called at the end of index.html) builds the DOM and resolves
   window.__ready once fonts, timing.json and every setup() are done.

   Preview modes (index.html):
     ?t=12.5           one frame at T = 12.5
     ?play&from=24     real-time playback (click once; uses out/music.wav if present)
     (nothing)         T = 0 */
(function () {
  "use strict";

  const V = (window.V = {});

  // Defaults; timing.json overwrites these when it loads.
  V.W = 1920;
  V.H = 1080;
  V.FPS = 60;
  V.DURATION = 64;
  V.cue = {};
  V.sections = {};
  V.T = 0;
  V.errors = [];
  V.scenes = [];

  // The palette (DIRECTION.md section 2). Scenes use these hex values in JS
  // (mixColor, SVG attributes); CSS uses the matching variables.
  V.pal = {
    ink: "#0b0d10",
    ink2: "#151920",
    steel: "#2a313b",
    oxide: "#e8590c",
    hot: "#ff8a3d",
    molten: "#ffd38a",
    cream: "#fff4e3",
    muted: "#9aa3ad",
    borrow: "#4c8dff",
    lock: "#c084fc",
    error: "#ff4d4d",
    ok: "#3ad07a",
    ghost: "#6b737d",
  };

  const CSS = `
:root, :root[data-theme="dark"] {
  --ink: #0b0d10; --ink-2: #151920; --steel: #2a313b; --oxide: #e8590c; --oxide-ink: #9c3b05;
  --hot: #ff8a3d; --molten: #ffd38a; --cream: #fff4e3; --muted: #9aa3ad; --borrow: #4c8dff;
  --lock: #c084fc; --mut: #c084fc; --error: #ff4d4d; --ok: #3ad07a; --ghost: #6b737d;
  --font-display: "Sofia Sans Extra Condensed", "Arial Narrow", sans-serif;
  --font-body: "Atkinson Hyperlegible Next", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, Menlo, Consolas, monospace;
  color-scheme: dark;
}
*, *::before, *::after { animation: none !important; transition: none !important; }
html, body { margin: 0; padding: 0; width: 100%; height: 100%; background: #000; overflow: hidden; }
#stage {
  position: absolute; left: 50%; top: 50%; width: 1920px; height: 1080px; overflow: hidden;
  background: var(--ink); color: var(--cream); font-family: var(--font-body);
  transform: translate(-50%, -50%) scale(var(--fit, 1)); transform-origin: 50% 50%;
  -webkit-font-smoothing: antialiased; text-rendering: geometricPrecision;
}
#world { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; overflow: hidden; }
.scene { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; overflow: hidden; }
.scene * { box-sizing: border-box; }
.ox-display { font-family: var(--font-display); font-weight: 900; text-transform: uppercase; letter-spacing: 0.02em; line-height: 0.9; white-space: nowrap; }
/* .ox-logo (the forged brand logo, any scene): <div class="ox-display ox-logo">OXIDIZE</div>.
   Molten-to-dark-oxide metal fill (background-clip text), a 1 px top highlight and one 18 px glow.
   V.glint(el, T, t0, dur) sweeps a cream band across it; --ox-blur (px) softens it for camera moves. */
.ox-logo {
  display: inline-block; color: transparent; -webkit-text-fill-color: transparent;
  background-image: linear-gradient(105deg, rgba(255,244,227,0) 46%, rgba(255,244,227,0.9) 50%, rgba(255,244,227,0) 54%),
    linear-gradient(180deg, var(--molten) 0%, var(--hot) 22%, var(--oxide) 55%, #9c3b05 100%);
  background-size: 300% 100%, 100% 100%; background-repeat: no-repeat, no-repeat;
  background-position: calc((1 - var(--glint, 0)) * 100%) 0, 0 0;
  -webkit-background-clip: text; background-clip: text;
  filter: blur(var(--ox-blur, 0px)) drop-shadow(0 -1px 0 rgba(255,244,227,0.35)) drop-shadow(0 0 18px rgba(232,89,12,0.45));
}
.ox-mono { font-family: var(--font-mono); font-weight: 500; white-space: pre; }
.ox-body { font-family: var(--font-body); font-weight: 400; }
.ch { display: inline-block; }
.ox-caret { display: inline-block; width: 0.56em; height: 0.92em; background: var(--oxide); vertical-align: -0.1em; margin-left: 2px; }
#grain { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; pointer-events: none; opacity: 0.07; background-size: 256px 256px; z-index: 900; }
#vignette {
  position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; pointer-events: none; z-index: 901;
  background: radial-gradient(ellipse 78% 72% at 50% 50%, rgba(0,0,0,0) 56%, rgba(0,0,0,0.58) 100%);
}
#ox-play { position: fixed; left: 0; right: 0; top: 0; bottom: 0; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.6); color: #fff4e3; font: 500 22px/1.2 ui-monospace, Menlo, monospace; cursor: pointer; z-index: 999; }
`;

  // ------------------------------------------------------------ easing
  const EASE = {
    linear: (t) => t,
    inQuad: (t) => t * t,
    outQuad: (t) => 1 - (1 - t) * (1 - t),
    inOutQuad: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
    inCubic: (t) => t * t * t,
    outCubic: (t) => 1 - Math.pow(1 - t, 3),
    inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    inExpo: (t) => (t === 0 ? 0 : Math.pow(2, 10 * t - 10)),
    outExpo: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
    inOutExpo: (t) =>
      t === 0 ? 0 : t === 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2,
    inOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
    outBack: (t) => {
      const c1 = 1.70158, c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    },
    outElastic: (t) => {
      const c4 = (2 * Math.PI) / 3;
      return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    },
  };
  V.ease = EASE;

  // ------------------------------------------------------------ math
  const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
  const lerp = (a, b, u) => a + (b - a) * u;
  const round3 = (v) => Math.round(v * 1000) / 1000;
  V.clamp = clamp;
  V.lerp = lerp;

  // Eased progress of T across [a, b], clamped to 0..1.
  V.p = function (T, a, b, ease = EASE.linear) {
    const u = b === a ? (T >= a ? 1 : 0) : clamp((T - a) / (b - a), 0, 1);
    return ease(u);
  };

  // "#rrggbb" (or "#rgb") to "rgb(r, g, b)", blended by u.
  function hexRGB(h) {
    h = h.replace("#", "");
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  V.mixColor = function (a, b, u) {
    const A = hexRGB(a), B = hexRGB(b);
    const k = clamp(u, 0, 1);
    return `rgb(${Math.round(lerp(A[0], B[0], k))}, ${Math.round(lerp(A[1], B[1], k))}, ${Math.round(lerp(A[2], B[2], k))})`;
  };

  // Seeded PRNG (mulberry32): returns fn () -> [0, 1).
  V.rand = function (seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  // A stable pseudo-random value in [0, 1) for an integer key.
  V.hash = (i) => {
    const s = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
    return s - Math.floor(s);
  };

  // ------------------------------------------------------------ DOM helpers
  // V.set(el, { x, y, s, sx, sy, r, o, blur, origin })
  V.set = function (el, o) {
    if (!el) return;
    const s = o.s ?? 1;
    const sx = o.sx ?? s;
    const sy = o.sy ?? s;
    const x = o.x ?? 0;
    const y = o.y ?? 0;
    const r = o.r ?? 0;
    el.style.transform = `translate(${round3(x)}px, ${round3(y)}px) rotate(${round3(r)}deg) scale(${round3(sx)}, ${round3(sy)})`;
    if (o.origin !== undefined) el.style.transformOrigin = o.origin;
    if (o.o !== undefined) el.style.opacity = String(round3(o.o));
    if (o.blur !== undefined) el.style.filter = o.blur > 0 ? `blur(${round3(o.blur)}px)` : "none";
  };

  // Splits text into <span class="ch"> per character. Returns the spans.
  V.chars = function (el, text) {
    el.textContent = "";
    const out = [];
    for (const c of text) {
      const s = document.createElement("span");
      s.className = "ch";
      s.textContent = c === " " ? " " : c;
      el.appendChild(s);
      out.push(s);
    }
    return out;
  };

  // Typewriter: shows the first round(u * length) characters. Returns the count.
  V.type = function (el, text, u, opts = {}) {
    const n = Math.round(clamp(u, 0, 1) * text.length);
    let tn = el._oxText;
    if (!tn) {
      el.textContent = "";
      tn = document.createTextNode("");
      el.appendChild(tn);
      el._oxText = tn;
    }
    const want = text.slice(0, n);
    if (tn.data !== want) tn.data = want;
    if (opts.caret) {
      let c = el._oxCaret;
      if (!c) {
        c = document.createElement("span");
        c.className = "ox-caret";
        el._oxCaret = c;
      }
      if (c.parentNode !== el) el.appendChild(c);
    } else if (el._oxCaret && el._oxCaret.parentNode === el) {
      el._oxCaret.remove();
    }
    return n;
  };

  // Shake offset in px, from impact times. Decays over `decay` seconds.
  V.shake = function (T, hits, amp = 8, decay = 0.35) {
    let x = 0, y = 0;
    (hits || []).forEach((h, i) => {
      const dt = T - h;
      if (dt < 0 || dt >= decay) return;
      const env = Math.pow(1 - dt / decay, 2);
      const ph = V.hash(i + 1) * Math.PI * 2;
      x += amp * env * Math.sin(dt * 2 * Math.PI * 26 + ph);
      y += amp * env * Math.cos(dt * 2 * Math.PI * 23 + ph * 1.3);
    });
    return { x: round3(x), y: round3(y) };
  };

  // Flash opacity: peak at each time, falling linearly to 0 over dur seconds.
  V.flash = function (T, times, dur = 0.15, peak = 1) {
    let o = 0;
    for (const h of [].concat(times)) {
      const dt = T - h;
      if (dt >= 0 && dt < dur) o = Math.max(o, peak * (1 - dt / dur));
    }
    return round3(o);
  };

  // Light sweep for .ox-logo: --glint goes 0 -> 1 over dur seconds from t0, moving a cream band left to right.
  V.glint = function (el, T, t0, dur = 0.5) {
    const g = clamp((T - t0) / dur, 0, 1);
    if (el) el.style.setProperty("--glint", String(round3(g)));
    return g;
  };

  // Calls on the course's characters (site/assets/cast-art.js, rustopia.js).
  V.cast = (id, opts = {}) => (window.OxCast ? window.OxCast.el(id, opts) : "");
  V.boss = (id, opts = {}) => (window.OxCast ? window.OxCast.boss(id, opts) : "");

  // SVG path "d" through points (Catmull-Rom converted to cubic Beziers).
  V.path = function (points) {
    const P = points.map((p) => (Array.isArray(p) ? p : [p.x, p.y]));
    if (!P.length) return "";
    const f = (v) => Math.round(v * 100) / 100;
    let d = `M${f(P[0][0])} ${f(P[0][1])}`;
    for (let i = 0; i < P.length - 1; i++) {
      const p0 = P[i - 1] || P[i], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2] || P[i + 1];
      const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
      const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += ` C${f(c1x)} ${f(c1y)} ${f(c2x)} ${f(c2y)} ${f(p2[0])} ${f(p2[1])}`;
    }
    return d;
  };

  // ------------------------------------------------------------ scenes
  // V.scene({ id, start, end, setup(layer), render(t, layer, T) })
  V.scene = function (def) {
    V.scenes.push(def);
  };

  function renderScenes(T) {
    for (const def of V.scenes) {
      const on = T >= def.start && T < def.end;
      const layer = def._layer;
      if (!layer) continue;
      const want = on ? "block" : "none";
      if (layer.style.display !== want) layer.style.display = want;
      if (on && def.render) {
        try {
          def.render(T - def.start, layer, T);
        } catch (e) {
          V.errors.push(`render ${def.id} @${T}: ${e && e.stack ? e.stack : e}`);
          console.error(`render ${def.id} @${T}`, e);
        }
      }
    }
  }

  // Renders global time T synchronously. Safe to call in any order.
  window.renderAt = function (T) {
    V.T = T;
    renderScenes(T);
    const frame = Math.round(T * V.FPS);
    const grain = document.getElementById("grain");
    if (grain) grain.style.backgroundPosition = `${(frame * 73) % 256}px ${(frame * 151) % 256}px`;
    return T;
  };

  // ------------------------------------------------------------ boot
  function loadFonts() {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    const specs = [
      '400 100px "Sofia Sans Extra Condensed"',
      '700 100px "Sofia Sans Extra Condensed"',
      '800 100px "Sofia Sans Extra Condensed"',
      '900 100px "Sofia Sans Extra Condensed"',
      '500 100px "JetBrains Mono"',
      '700 100px "JetBrains Mono"',
      '400 100px "Atkinson Hyperlegible Next"',
      '700 100px "Atkinson Hyperlegible Next"',
    ];
    return Promise.all(specs.map((s) => document.fonts.load(s).catch(() => []))).then(() => document.fonts.ready);
  }

  function loadTiming() {
    return fetch("timing.json", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        V.FPS = j.fps;
        V.W = j.width;
        V.H = j.height;
        V.DURATION = j.duration;
        V.cue = j.cues || {};
        V.sections = j.sections || {};
      })
      .catch((e) => V.errors.push("timing.json: " + e));
  }

  // The film grain: a seeded 256px noise tile, shifted per frame index.
  function makeGrain() {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 256;
    const g = c.getContext("2d");
    const img = g.createImageData(256, 256);
    const r = V.rand(20260701);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = r() < 0.5 ? 0 : 255;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = r() < 0.5 ? 0 : Math.floor(r() * 255);
    }
    g.putImageData(img, 0, 0);
    const url = c.toDataURL("image/png");
    const el = document.getElementById("grain");
    if (el) el.style.backgroundImage = `url(${url})`;
    const probe = new Image();
    probe.src = url;
    return (probe.decode ? probe.decode() : Promise.resolve()).catch(() => {});
  }

  function fit() {
    const s = Math.min(window.innerWidth / V.W, window.innerHeight / V.H);
    document.documentElement.style.setProperty("--fit", String(s > 0 ? s : 1));
  }

  // Real-time playback for ?play. Uses out/music.wav when it plays, else the clock.
  function startPlay(from) {
    const hint = document.createElement("div");
    hint.id = "ox-play";
    hint.textContent = "click to play (from " + from + " s)";
    document.body.appendChild(hint);
    hint.addEventListener("click", () => {
      hint.remove();
      const audio = new Audio("out/music.wav");
      let t0 = performance.now() - from * 1000;
      let useAudio = false;
      audio.currentTime = from;
      audio
        .play()
        .then(() => {
          useAudio = true;
        })
        .catch(() => {
          useAudio = false;
        });
      const step = (now) => {
        let T = useAudio ? audio.currentTime : (now - t0) / 1000;
        if (T >= V.DURATION) T = V.DURATION - 1 / V.FPS;
        T = Math.floor(T * V.FPS + 1e-6) / V.FPS;
        renderAt(T);
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }

  V.boot = function () {
    const world = document.getElementById("world");
    V.scenes.forEach((def) => {
      const layer = document.createElement("div");
      layer.className = "scene s-" + def.id;
      layer.style.display = "none";
      world.appendChild(layer);
      def._layer = layer;
    });

    const style = document.createElement("style");
    style.id = "ox-engine-css";
    style.textContent = CSS;
    document.head.appendChild(style);

    fit();
    window.addEventListener("resize", fit);

    const q = new URLSearchParams(window.location.search);
    window.__ready = Promise.all([loadFonts(), loadTiming(), makeGrain()])
      .then(() => {
        V.scenes.forEach((def) => {
          try {
            if (def.setup) def.setup(def._layer);
          } catch (e) {
            V.errors.push(`setup ${def.id}: ${e && e.stack ? e.stack : e}`);
            console.error(`setup ${def.id}`, e);
          }
        });
      })
      .then(() => {
        if (q.has("play")) {
          startPlay(parseFloat(q.get("from") || "0") || 0);
          renderAt(parseFloat(q.get("from") || "0") || 0);
        } else {
          const T = parseFloat(q.get("t") || "0") || 0;
          renderAt(T);
          document.documentElement.setAttribute("data-t", String(T));
        }
      });
  };

  // Hook for the tools: current page state (render errors included).
  V.status = () => ({ T: V.T, errors: V.errors.slice(0, 20) });
})();
