/* S7 · THE JOURNEY (48 - 56 s), DIRECTION.md section 3.
   Part 1 (48 - 50): the PHP you know, and the Rust you'll ship, side by side.
     The PHP parses on PHP 8.5 (token_get_all with TOKEN_PARSE, php-wasm 8.5.10).
     The Rust compiles with rustc 1.97 --edition 2024 inside a program with an
     Order struct (it prints 1500). Both checks were run before this scene was written.
   Part 2 (50 - 56): the island, OxMap.svg() from site/assets/rustopia.js. The camera
     flies the trail, one stone per 0.125 s, on a Catmull-Rom spline through the
     21 stones, so the flight is fluid. Characters come from OxCast.list (each has ch),
     bosses from OxCast.bosses (each has ch). All of it is a pure function of T. */
(function () {
  "use strict";

  const clamp = V.clamp;
  const P = V.p;
  const E = V.ease;
  const cue = (k, d) => (V.cue && V.cue[k] !== undefined ? V.cue[k] : d);
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  // ------------------------------------------------------------ code (checked, see header)
  // Segments: [text, class, token-id?]. Classes: v variable, k keyword, f function,
  // s string, p punctuation, t type, tok a matching token (glows in part 1).
  const PHP = [
    [
      [["$total", "v"], [" = ", "p"], ["collect", "f"], ["(", "p"], ["$orders", "v"], [")", "p"]],
      [["    ->", "p"], ["filter", "tok", "php-filter"], ["(", "p"], ["fn", "k"], [" (", "p"], ["$o", "v"], [") => ", "p"], ["$o", "v"], ["->", "p"], ["paid", "tok", "php-paid"], [")", "p"]],
      [["    ->", "p"], ["sum", "tok", "php-sum"], ["(", "p"], ["'", "s"], ["amount", "tok", "php-amount"], ["'", "s"], [");", "p"]],
    ],
  ];
  const RUST = [
    [["let", "k"], [" total", "v"], [":", "p"], [" u32", "t"], [" = ", "p"], ["orders", "v"], [".", "p"], ["iter", "f"], ["()", "p"]],
    [["    .", "p"], ["filter", "tok", "rs-filter"], ["(|", "p"], ["o", "v"], ["| ", "p"], ["o", "v"], [".", "p"], ["paid", "tok", "rs-paid"], [")", "p"]],
    [["    .", "p"], ["map", "f"], ["(|", "p"], ["o", "v"], ["| ", "p"], ["o", "v"], [".", "p"], ["amount", "tok", "rs-amount"], [")", "p"]],
    [["    .", "p"], ["sum", "tok", "rs-sum"], ["();", "p"]],
  ];

  // Monospace metrics: JetBrains Mono advances 0.6em.
  const CODE_FS = 36;
  const CW = 0.6 * CODE_FS; // 21.6 px per column
  const LH = 52; // line height
  const PANEL_W = 790;
  const PANEL_H = 420;
  const PANEL_Y = 250;
  const PAD = 36;
  const LABEL_H = 88; // space for the label above the code
  const PANELS = {
    php: { x: 96, lines: PHP[0], label: "PHP 8.5 · Laravel 13" },
    rust: { x: 1034, lines: RUST, label: "Rust" },
  };

  // Where each matching token sits on screen (monospace, so analytic).
  function tokenBoxes() {
    const boxes = {};
    for (const side of ["php", "rust"]) {
      const lines = PANELS[side].lines;
      lines.forEach((segs, li) => {
        let col = 0;
        for (const seg of segs) {
          const [text, cls, id] = seg;
          if (cls === "tok") {
            boxes[id] = {
              x0: PANELS[side].x + PAD + col * CW,
              x1: PANELS[side].x + PAD + (col + text.length) * CW,
              yc: PANEL_Y + LABEL_H + li * LH + LH / 2,
              cx: PANELS[side].x + PAD + (col + text.length / 2) * CW,
            };
          }
          col += text.length;
        }
      });
    }
    return boxes;
  }
  // The four matching pairs (storyboard: filter, sum, amount, paid).
  const PAIRS = [
    ["php-filter", "rs-filter"],
    ["php-paid", "rs-paid"],
    ["php-amount", "rs-amount"],
    ["php-sum", "rs-sum"],
  ];

  // Typed code: the characters of all lines, in order, with the caret after the last one shown.
  function codeHTML(lines, n) {
    let c = 0;
    let total = 0;
    lines.forEach((segs) => segs.forEach(([t]) => (total += t.length)));
    let caretLine = -1;
    const out = lines.map((segs, li) => {
      const lineStart = c;
      let html = "";
      for (const seg of segs) {
        const [text, cls, id] = seg;
        const visible = clamp(n - c, 0, text.length);
        if (visible > 0) {
          const part = esc(text.slice(0, visible));
          html += id ? `<span class="tk" data-tk="${id}">${part}</span>` : `<span class="c-${cls}">${part}</span>`;
        }
        c += text.length;
      }
      // the caret sits after the last typed character of the line being typed
      if (n >= lineStart && n <= c && n < total) caretLine = li;
      return `<div class="cl">${html || "&nbsp;"}</div>`;
    });
    if (caretLine >= 0) {
      out[caretLine] = out[caretLine].replace("</div>", `<span class="s7-caret"></span></div>`);
    }
    return out.join("");
  }

  // ------------------------------------------------------------ island
  // Catmull-Rom through the stones: a smooth flight that passes through every stone.
  let STONES = null;
  function camCenter(u) {
    const S = STONES;
    const n = S.length;
    const i = Math.floor(u);
    const f = u - i;
    const at = (k) => S[clamp(k, 0, n - 1)];
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
    const cr = (a, b, c, d) =>
      0.5 * (2 * b + (-a + c) * f + (2 * a - 5 * b + 4 * c - d) * f * f + (-a + 3 * b - 3 * c + d) * f * f * f);
    return { x: cr(p0.x, p1.x, p2.x, p3.x), y: cr(p0.y, p1.y, p2.y, p3.y) };
  }
  const ISLAND_C = { x: 560, y: 330 };
  const MAP_S0 = 2.6; // the stone camera
  const MAP_S1 = 1.15; // the pulled-out view of the whole island

  // Boss lairs (stones 4, 8, 13, 17, 21) and the list of characters: each sits by its chapter's stone.
  const CH_OFFSET = { 0: [18, -40], 1: [-50, -40] };

  const CSS = `
.s7-code { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; }
.s7-panel { position: absolute; top: ${PANEL_Y}px; width: ${PANEL_W}px; height: ${PANEL_H}px; background: #0f141b;
  border: 1px solid var(--steel); border-radius: 24px; box-shadow: 0 30px 80px rgba(0,0,0,0.5); }
.s7-label { position: absolute; left: ${PAD}px; top: 30px; font: 500 28px/30px var(--font-mono); color: var(--muted); white-space: nowrap; }
.s7-text { position: absolute; font: 500 ${CODE_FS}px/${LH}px var(--font-mono); white-space: pre; color: var(--cream); font-variant-ligatures: none; font-feature-settings: "liga" 0, "calt" 0; }
.s7-text .cl { height: ${LH}px; }
.s7-text .c-v { color: var(--cream); }
.s7-text .c-k { color: var(--oxide); }
.s7-text .c-f { color: var(--borrow); }
.s7-text .c-s { color: var(--molten); }
.s7-text .c-p { color: #b9c0c9; }
.s7-text .c-t { color: var(--lock); }
.s7-text .tk { border-radius: 6px; padding: 0 2px; margin: 0 -2px; }
.s7-caret { display: inline-block; width: 0.56em; height: 1em; background: var(--oxide); vertical-align: -0.14em; }
.s7-links { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; pointer-events: none; overflow: visible; }
.s7-links path { fill: none; stroke: var(--oxide); stroke-width: 4; stroke-linecap: round; opacity: 0.9; }
.s7-cap { position: absolute; left: 0; top: 806px; width: 1920px; height: 120px; text-align: center; white-space: nowrap; }
.s7-cap span { position: absolute; left: 0; right: 0; top: 0; font: 900 96px/1 var(--font-display); text-transform: uppercase; letter-spacing: 0.02em; color: var(--cream); }
.s7-world { position: absolute; left: 0; top: 0; width: 1000px; height: 660px; transform-origin: 0 0; }
.s7-world .mp-svg { position: absolute; left: 0; top: 0; width: 1000px; height: 660px; }
.s7-stone { position: absolute; width: 26px; height: 26px; margin: -13px 0 0 -13px; border-radius: 50%; background: #151920;
  box-shadow: 0 0 0 2.5px var(--cream), 0 6px 14px rgba(0,0,0,0.5); color: var(--cream);
  font: 800 10.5px/26px var(--font-display); text-align: center; }
.s7-stone.on { background: var(--oxide); box-shadow: 0 0 0 2.5px var(--molten), 0 0 18px rgba(232,89,12,0.6); }
.s7-stone .tk-badge { position: absolute; right: -0.55em; top: -0.55em; width: 1.3em; height: 1.3em; border-radius: 50%;
  background: var(--molten); color: #2a1204; font: 900 0.8em/1.3em var(--font-body); text-align: center; }
.s7-char { position: absolute; width: 30px; height: 30px; margin: -15px 0 0 -15px; }
.s7-char > .ca { width: 30px; height: 30px; display: block; }
.s7-char > .ca > .ca-svg { width: 30px; height: 30px; }
.s7-char > .prop-wrap { width: 30px; height: 30px; display: block; }
.s7-boss { position: absolute; width: 44px; height: 44px; margin: -22px 0 0 -22px; }
.s7-boss > .ca { width: 44px; height: 44px; display: block; }
.s7-boss > .ca > .ca-svg { width: 44px; height: 44px; }
.s7-count { position: absolute; right: 96px; width: 420px; height: 170px; padding: 18px 28px 22px; border-radius: 22px;
  background: rgba(11,13,16,0.78); border: 1px solid var(--steel); text-align: right; white-space: nowrap; }
.s7-count .num { font: 900 140px/0.9 var(--font-display); color: var(--cream); letter-spacing: 0.01em; }
.s7-count .lab { font: 900 56px/1 var(--font-display); text-transform: uppercase; color: var(--oxide); letter-spacing: 0.02em; }
.s7-grad { position: absolute; width: 74px; height: 74px; margin: -37px 0 0 -37px; }
.s7-grad > .ca { width: 74px; height: 74px; display: block; }
.s7-grad > .ca > .ca-svg { width: 74px; height: 74px; }
`;

  // ------------------------------------------------------------ scene
  V.scene({
    id: "s7",
    start: 48,
    end: 56,
    setup(layer) {
      if (!document.getElementById("s7-css")) {
        const st = document.createElement("style");
        st.id = "s7-css";
        st.textContent = CSS;
        document.head.appendChild(st);
      }
      STONES = window.OxMap.stones;
      const boxes = tokenBoxes();

      // Part 1: the code split screen.
      const panelHTML = (side) => {
        const p = PANELS[side];
        return `<div class="s7-panel" data-panel="${side}" style="left:${p.x}px">
          <div class="s7-label">${esc(p.label)}</div>
        </div>`;
      };
      const linkPaths = PAIRS.map(([a, b], i) => {
        const A = boxes[a], B = boxes[b];
        const x1 = A.x1 + 2, y1 = A.yc, x2 = B.x0 - 2, y2 = B.yc;
        const dx = (x2 - x1) * 0.5;
        return `<path data-link="${i}" d="M${x1} ${y1} C${x1 + dx} ${y1 - 90}, ${x2 - dx} ${y2 - 90}, ${x2} ${y2}"/>`;
      }).join("");

      // Part 2: the island, the stones, the characters and the bosses.
      const stones = window.OxMap.stones;
      const stoneHTML = stones
        .map((s) => `<div class="s7-stone" data-stone="${s.n}" style="left:${s.x}px;top:${s.y}px"><span class="n"></span>${s.n}</div>`)
        .join("");
      const list = (window.OxCast && window.OxCast.list) || [];
      const bosses = (window.OxCast && window.OxCast.bosses) || [];
      const charHTML = list
        .filter((e) => e.id !== "graduate")
        .map((e, i) => {
          const s = stones.find((x) => x.n === e.ch);
          return `<div class="s7-char" data-char="${e.id}" data-ch="${e.ch}" style="left:${s.x}px;top:${s.y}px">${
            window.OxCast.entry(e.id)}</div>`;
        })
        .join("");
      const bossHTML = bosses
        .map((b) => {
          const s = stones.find((x) => x.n === b.ch);
          return `<div class="s7-boss" data-boss="${b.id}" data-ch="${b.ch}" style="left:${s.x}px;top:${s.y}px">${V.boss(b.id)}</div>`;
        })
        .join("");
      const gradStone = stones.find((x) => x.n === 21);

      layer.innerHTML = `
        <div class="s7-code" data-k="code">
          ${panelHTML("php")}
          ${panelHTML("rust")}
          <svg class="s7-links" data-k="links">${linkPaths}</svg>
          <div class="s7-text" data-code="php" style="left:${PANELS.php.x + PAD}px;top:${PANEL_Y + LABEL_H}px"></div>
          <div class="s7-text" data-code="rust" style="left:${PANELS.rust.x + PAD}px;top:${PANEL_Y + LABEL_H}px"></div>
          <div class="s7-cap" data-k="cap1"><span>FROM THE PHP YOU KNOW…</span></div>
          <div class="s7-cap" data-k="cap2"><span>…TO THE RUST YOU'LL SHIP.</span></div>
        </div>
        <div class="s7-world" data-k="world">
          ${window.OxMap.svg()}
          ${stoneHTML}
          ${bossHTML}
          ${charHTML}
          <div class="s7-grad" data-k="grad" style="left:${gradStone.x + 18}px;top:${gradStone.y - 44}px">${window.OxCast.entry("graduate")}</div>
        </div>
        <div class="s7-count" data-k="c21" style="top:190px"><div class="num" data-n="21">0</div><div class="lab">chapters</div></div>
        <div class="s7-count" data-k="c88" style="top:420px"><div class="num" data-n="88">0</div><div class="lab">quests</div></div>
        <div class="s7-count" data-k="c231" style="top:650px"><div class="num" data-n="231">0</div><div class="lab">terms</div></div>`;

    },
    render(t, layer, T) {
      const q = (k) => layer.querySelector(`[data-k="${k}"]`);
      const code = q("code");
      const world = q("world");
      const counters = ["c21", "c88", "c231"].map((k) => q(k));
      code.style.display = T < cue("mapIn", 50.0) ? "block" : "none";
      world.style.display = T >= cue("mapIn", 50.0) ? "block" : "none";
      counters.forEach((c) => (c.style.display = T >= cue("mapIn", 50.0) ? "block" : "none"));
      if (T < cue("mapIn", 50.0)) renderCode(layer, T);
      else renderMap(layer, T, q);
    },
  });

  // ------------------------------------------------------------ part 1
  function renderCode(layer, T) {
    const lines = { php: PANELS.php.lines, rust: PANELS.rust.lines };
    // Each code block types in fast (48.0 - 48.8), fully visible by 48.8.
    const total = (segs) => segs.reduce((a, l) => a + l.reduce((b, s) => b + s[0].length, 0), 0);
    for (const side of ["php", "rust"]) {
      const el = layer.querySelector(`[data-code="${side}"]`);
      const panel = layer.querySelector(`[data-panel="${side}"]`);
      const textEl = layer.querySelector(`[data-code="${side}"]`);
      const n = Math.round(P(T, 48.0, 48.8, E.linear) * total(lines[side]));
      const html = codeHTML(lines[side], n);
      if (el.dataset.last !== html) {
        el.dataset.last = html;
        el.innerHTML = html;
      }
      // the panels settle in at 48.0 (outExpo) and the left one dims to 50% at 49.0
      const inP = P(T, 48.0, 48.4, E.outExpo);
      let op = inP;
      if (side === "php") op = inP * (1 - 0.5 * P(T, 49.0, 49.4, E.inOutCubic));
      V.set(panel, { x: 0, y: 24 * (1 - inP), s: 0.97 + 0.03 * inP, o: op, origin: "50% 50%" });
      textEl.style.opacity = String(V.clamp(op, 0, 1).toFixed(3));
    }
    // The matching tokens glow at 49.0 (morph), and the curved oxide links draw in.
    const m = P(T, 49.0, 49.4, E.outCubic);
    layer.querySelectorAll("[data-tk]").forEach((el) => {
      const id = el.dataset.tk;
      const on = PAIRS.some((p) => p.includes(id));
      el.style.background = on ? `rgba(232,89,12,${(0.34 * m).toFixed(3)})` : "transparent";
      el.style.color = on ? V.mixColor("#fff4e3", "#ffd38a", m) : "";
    });
    const links = layer.querySelectorAll("[data-link]");
    links.forEach((path, i) => {
      if (!path._len) path._len = path.getTotalLength();
      const u = P(T, 49.1 + i * 0.08, 49.6 + i * 0.08, E.inOutCubic);
      path.style.strokeDasharray = `${path._len} ${path._len}`;
      path.style.strokeDashoffset = String(path._len * (1 - u));
    });
    // The caption: FROM THE PHP YOU KNOW... (48.0 - 49.0), then ...TO THE RUST YOU'LL SHIP.
    const c1 = layer.querySelector('[data-k="cap1"]');
    const c2 = layer.querySelector('[data-k="cap2"]');
    const a1In = P(T, 48.0, 48.45, E.outExpo);
    const a1Out = P(T, 49.0, 49.25, E.inQuad);
    V.set(c1, { y: 30 * (1 - a1In), o: Math.max(0, a1In - a1Out) });
    const a2In = P(T, 49.0, 49.45, E.outExpo);
    V.set(c2, { y: 30 * (1 - a2In), o: a2In });
  }

  // ------------------------------------------------------------ part 2
  function renderMap(layer, T, q) {
    const world = q("world");
    const stones = window.OxMap.stones;
    const cutAt = cue("mapIn", 50.0);
    const stoneCues = cue("stones", stones.map((_, i) => 50.5 + i * 0.125));
    const step = stoneCues.length > 1 ? stoneCues[1] - stoneCues[0] : 0.125;

    // The camera: a continuous stone index u (stone k at cue k), through a Catmull-Rom spline.
    const u = clamp((T - stoneCues[0]) / step, 0, stones.length - 1);
    const flight = camCenter(u);
    const pull = P(T, cue("pullOut", 54.0), cue("pullOut", 54.0) + 0.9, E.inOutCubic);
    const cx = V.lerp(flight.x, ISLAND_C.x, pull);
    const cy = V.lerp(flight.y, ISLAND_C.y, pull);
    const sc = V.lerp(MAP_S0, MAP_S1, pull);
    const tx = 960 - cx * sc;
    const ty = 540 - cy * sc;
    world.style.transform = `translate(${round(tx)}px, ${round(ty)}px) scale(${round(sc)})`;

    // The map's own region labels read at 2.6x (their text is 26 px or more there). They fade
    // out as the view pulls back, so no label is ever smaller than 26 px on screen.
    const labelOp = clamp((sc - 1.5) / 0.7, 0, 1).toFixed(3);
    layer.querySelectorAll(".mp-label, .mp-note").forEach((el) => (el.style.opacity = labelOp));

    // Stones: passed at their cue, turn oxide with a check mark and a pop (outBack).
    stones.forEach((s, i) => {
      const el = layer.querySelector(`[data-stone="${s.n}"]`);
      const at = stoneCues[i];
      const passed = T >= at;
      el.classList.toggle("on", passed);
      const k = passed ? 1 + 0.35 * Math.sin(Math.PI * clamp((T - at) / 0.3, 0, 1)) : 1;
      V.set(el, { s: passed ? k : 1 });
      el.innerHTML = `${s.n}<span class="tk-badge" style="opacity:${passed ? 1 : 0}">✓</span>`;
      // keep the stone and its number at least 26 px on screen as the camera pulls out
      const d = Math.max(26, 44 / sc);
      el.style.width = `${d.toFixed(2)}px`;
      el.style.height = `${d.toFixed(2)}px`;
      el.style.margin = `${(-d / 2).toFixed(2)}px 0 0 ${(-d / 2).toFixed(2)}px`;
      el.style.fontSize = `${Math.max(10.5, 26 / sc).toFixed(2)}px`;
      el.style.lineHeight = `${d.toFixed(2)}px`;
    });

    // Characters pop in beside their chapter's stone (outBack), when that stone is passed.
    layer.querySelectorAll("[data-char]").forEach((el) => {
      const ch = Number(el.dataset.ch);
      const i = ch - 1;
      const at = stoneCues[i];
      const pop = P(T, at, at + 0.4, E.outBack);
      const off = charOffset(el);
      V.set(el, { x: off[0], y: off[1], s: pop, origin: "50% 50%" });
      el.style.opacity = T >= at ? "1" : "0";
    });
    // Bosses: present from the start, turn grey once passed.
    layer.querySelectorAll("[data-boss]").forEach((el) => {
      const ch = Number(el.dataset.ch);
      const at = stoneCues[ch - 1];
      const passed = T >= at;
      const enter = P(T, cutAt, cutAt + 0.35, E.outBack);
      V.set(el, { x: -58, y: 4, s: enter, origin: "50% 50%" });
      el.style.filter = passed ? "grayscale(1) opacity(0.5)" : "none";
    });

    // The graduate pops on stone 21 with a hop (@graduate 55.0).
    const grad = q("grad");
    const g0 = cue("graduate", 55.0);
    const gPop = P(T, g0, g0 + 0.45, E.outBack);
    const hop = T >= g0 + 0.45 ? -30 * Math.sin(Math.PI * clamp((T - g0 - 0.45) / 0.5, 0, 1)) : 0;
    V.set(grad, { x: 0, y: hop, s: gPop, origin: "50% 50%" });

    // Stacked counters: 21 CHAPTERS, 88 QUESTS, 231 TERMS. Each counts up from 0 quickly.
    const counts = [
      { k: "c21", n: 21, at: cue("counters", [53.0, 53.5, 54.0])[0] },
      { k: "c88", n: 88, at: cue("counters", [53.0, 53.5, 54.0])[1] },
      { k: "c231", n: 231, at: cue("counters", [53.0, 53.5, 54.0])[2] },
    ];
    for (const c of counts) {
      const el = q(c.k);
      const inn = P(T, c.at, c.at + 0.4, E.outBack);
      const outT = P(T, 55.6, 55.9, E.inQuad);
      const v = Math.round(c.n * P(T, c.at, c.at + 0.55, E.outCubic));
      el.querySelector(".num").textContent = String(v);
      V.set(el, { x: 0, y: 0, s: 0.6 + 0.4 * inn, origin: "100% 50%", o: Math.max(0, Math.min(1, inn * 1.5) - outT) });
    }
  }

  function charOffset(el) {
    // Each character sits above-right of its stone; a second one on the same stone sits left.
    const id = el.dataset.char;
    const second = id === "forge" || id === "alloc" || id === "inspector" || id === "leash" || id === "borrows";
    return second ? [-54, -40] : [20, -42];
  }

  function round(v) {
    return Math.round(v * 100) / 100;
  }

})();
