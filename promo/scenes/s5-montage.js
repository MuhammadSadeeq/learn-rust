/* S5 · SEE MEMORY & TIME (32–40 s).
   Builder H2. Follows promo/DIRECTION.md section 3 (S5) and the section 4 contract.
   Four vignettes, each a hard cut on a montageCuts time: REALLOC (ch05), LIFETIMES (ch15),
   MUTEX (ch18), ASYNC (ch19). Every cut has a 120 ms flash at 25 %.
   Every property is set from T in render(); nothing accumulates between frames.
   All positions are stage pixels (1920 x 1080) inside each vignette's full-stage picture.

   Local helpers (no engine feature was missing):
   - the Tick's falling sand is drawn by render() as grains inside the Tick SVG;
   - the whip is a horizontal translate with a filter blur, set from T. */
(function () {
  "use strict";
  const V = window.V;
  const E = V.ease;
  const clamp = V.clamp;
  const lerp = V.lerp;
  const f = (n) => Math.round(n * 100) / 100;
  const NS = "http://www.w3.org/2000/svg";

  function cues() {
    const Q = (k, d) => (V.cue && V.cue[k] !== undefined ? V.cue[k] : d);
    return {
      cuts: Q("montageCuts", [32.0, 34.0, 36.0, 38.0]),
      whip: Q("whip", 39.5),
      end: 40.0,
    };
  }

  /* ------------------------------------------------------------ styles */
  const CSS = `
  .s-s5 { --bad: var(--error); }
  .s-s5 .h2s5-whip { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; }
  .s-s5 .h2s5-vg { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; display: none; }
  .s-s5 .h2s5-bg { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; }
  .s-s5 .h2s5-term { position: absolute; left: 96px; top: 330px; font: 900 200px/180px var(--font-display); letter-spacing: 0.02em; text-transform: uppercase; color: var(--oxide); white-space: nowrap; }
  .s-s5 .h2s5-meaning { position: absolute; left: 96px; top: 548px; font: 400 44px/56px var(--font-body); color: var(--cream); white-space: nowrap; }
  .s-s5 .h2s5-chip { position: absolute; left: 96px; top: 630px; height: 44px; line-height: 44px; padding: 0 18px; border: 2px solid var(--steel); border-radius: 12px; background: var(--ink-2); color: var(--muted); font: 500 28px var(--font-mono); }
  .s-s5 .h2s5-pic { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; }
  .s-s5 .h2s5-act { position: absolute; }
  .s-s5 .h2s5-act > .ca { position: absolute; left: 0; top: 0; width: 100%; height: 100%; display: block; }
  .s-s5 .h2s5-slot { position: absolute; border: 3px dashed var(--steel); border-radius: 18px; background: var(--ink-2); }
  .s-s5 .h2s5-label { position: absolute; font: 500 36px/44px var(--font-mono); color: var(--cream); white-space: pre; }
  .s-s5 .h2s5-code { position: absolute; font: 500 44px/64px var(--font-mono); color: var(--cream); white-space: pre; }
  .s-s5 .h2s5-k { color: var(--oxide); }
  .s-s5 .h2s5-b { color: var(--borrow); }
  .s-s5 .h2s5-bar { position: absolute; border-radius: 4px; width: 8px; height: 0px; }
  .s-s5 .h2s5-err { position: absolute; height: 40px; line-height: 40px; padding: 0 16px; border-radius: 10px; background: var(--error); color: var(--ink); font: 700 30px var(--font-mono); white-space: pre; }
  .s-s5 .h2s5-msg { position: absolute; font: 500 30px/40px var(--font-mono); color: var(--cream); white-space: pre; }
  .s-s5 .h2s5-room { position: absolute; border: 3px solid var(--lock); border-radius: 28px; background: color-mix(in srgb, var(--lock) 12%, var(--ink-2)); }
  .s-s5 .h2s5-count { position: absolute; font: 900 200px/200px var(--font-display); color: var(--cream); white-space: pre; transform: translateX(-50%); }
  .s-s5 .h2s5-plate { position: absolute; border: 3px solid var(--ok); border-radius: 14px; background: color-mix(in srgb, var(--ok) 14%, var(--ink-2)); color: var(--ok); font: 700 28px/48px var(--font-mono); text-align: center; white-space: pre; }
  .s-s5 .h2s5-flash { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; background: var(--cream); pointer-events: none; }
  .s-s5 .h2s5-rings { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; overflow: visible; }
  .s-s5 .h2s5-ring { fill: none; stroke: var(--molten); stroke-width: 6; stroke-linecap: round; }
  .s-s5 .h2s5-grain { fill: var(--molten); }
  `;
  function injectCSS() {
    if (document.getElementById("h2-s5-css")) return;
    const st = document.createElement("style");
    st.id = "h2-s5-css";
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  /* ------------------------------------------------------------ helpers */
  function el(parent, cls, css, text) {
    const d = document.createElement("div");
    d.className = cls;
    if (css) d.style.cssText = css;
    if (text !== undefined) d.textContent = text;
    parent.appendChild(d);
    return d;
  }
  function svgEl(parent, tag, attrs) {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    parent.appendChild(n);
    return n;
  }
  // A course character (or prop) centred at stage (cx, cy) in a w x h box.
  function actor(parent, html, cx, cy, w, h) {
    const g = el(parent, "h2s5-act", `left:${f(cx - w / 2)}px; top:${f(cy - h / 2)}px; width:${f(w)}px; height:${f(h)}px;`);
    const wrap = document.createElement("div");
    wrap.innerHTML = html;
    const node = wrap.firstElementChild;
    if (node) g.appendChild(node);
    return { g, ca: g.querySelector(".ca"), cx, cy };
  }
  function pop(T, t0) {
    return { s: V.p(T, t0, t0 + 0.4, E.outBack), o: V.p(T, t0, t0 + 0.1) };
  }
  // Moves an actor by (dx, dy) from its base centre, scaled and faded.
  function put(a, dx, dy, s, o) {
    V.set(a.g, { x: f(dx), y: f(dy), s: s ?? 1, o: o ?? 1 });
  }
  function pose(a, name, on) {
    if (a.ca) a.ca.classList.toggle("is-" + name, !!on);
  }
  function oxi(name, o) {
    return window.OxCast ? window.OxCast.el(name, o || {}) : "";
  }
  function prop(name, o) {
    return window.OxCast ? window.OxCast.prop(name, o || {}) : "";
  }
  function arcUp(u, h) {
    return -h * 4 * u * (1 - u);
  }
  function tri(s) {
    const x = s - Math.floor(s);
    return 1 - Math.abs(2 * x - 1);
  }

  /* ------------------------------------------------------------ shared frame */
  // Each vignette: a full-stage backdrop, the left column (term, meaning, chip) and the picture.
  function frame(parent, o) {
    const vg = el(parent, "h2s5-vg", "");
    el(vg, "h2s5-bg", `background: radial-gradient(ellipse 55% 60% at 72% 50%, color-mix(in srgb, var(--${o.tint}) 10%, transparent), transparent 72%);`);
    const term = el(vg, "h2s5-term", "", o.term);
    const meaning = el(vg, "h2s5-meaning", "", o.meaning);
    const chip = el(vg, "h2s5-chip", "", o.chip);
    const pic = el(vg, "h2s5-pic", "");
    return { vg, term, meaning, chip, pic };
  }

  /* ------------------------------------------------------------ REALLOC */
  // A Vec of four fluffies: a fifth arrives, Alloc walks in with a bigger plot, and they hop across.
  const A_X = (i) => 1062 + i * 170; // plot A slot left edges (150 px slots)
  const B_X = (i) => 1000 + i * 84; // plot B slot left edges (72 px slots)
  function buildRealloc(parent) {
    const F = frame(parent, { tint: "oxide", term: "REALLOC", meaning: "watch a Vec move.", chip: "ch05" });
    const pic = F.pic;
    const slotsA = [0, 1, 2, 3].map((i) => el(pic, "h2s5-slot", `left:${A_X(i)}px; top:355px; width:150px; height:150px;`));
    const slotsB = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => el(pic, "h2s5-slot", `left:${B_X(i)}px; top:650px; width:72px; height:72px;`));
    const fluffA = [0, 1, 2, 3].map((i) => actor(pic, oxi("fluffy"), A_X(i) + 75, 430, 110, 110));
    const fifth = actor(pic, oxi("fluffy"), 1640, 270, 110, 110);
    const pushLabel = el(pic, "h2s5-label", "left:1400px; top:208px;", "v.push(5)");
    const alloc = actor(pic, oxi("alloc"), 1745, 600, 150, 150 * (104 / 134));
    const lenLabel = el(pic, "h2s5-label", "left:1135px; top:752px;", "len 5 · capacity 8");
    return { F, slotsA, fluffA, fifth, pushLabel, slotsB, alloc, lenLabel };
  }
  function renderRealloc(R, tv, T) {
    // Plot A pops in, four slots in 60 ms steps.
    R.slotsA.forEach((s, i) => {
      const e = V.p(T, 32.0 + i * 0.06, 32.4 + i * 0.06, E.outExpo);
      V.set(s, { s: lerp(0.6, 1, e), o: e * (1 - V.p(T, 33.7, 34.0)) });
    });
    // The four fluffies pop in, then hop to plot B in staggered arcs (80 ms apart).
    R.fluffA.forEach((a, i) => {
      const p = pop(T, 32.2 + i * 0.08);
      const u = V.p(T, 33.36 + i * 0.08, 33.36 + i * 0.08 + 0.26, E.inOutSine);
      const tx = B_X(i) + 36 - (A_X(i) + 75);
      const ty = 686 - 430;
      put(a, lerp(0, tx, u), lerp(0, ty, u) + arcUp(u, 170), p.s * lerp(1, 60 / 110, u), p.o);
    });
    // The fifth drops in at 33.0 and hops to slot 5 of plot B.
    const drop = V.p(T, 33.0, 33.3, E.outBack);
    const uF = V.p(T, 33.36 + 4 * 0.08, 33.36 + 4 * 0.08 + 0.26, E.inOutSine);
    const txF = B_X(4) + 36 - 1640;
    const tyF = 686 - 270;
    put(R.fifth, lerp(0, txF, uF), lerp(-120 * (1 - drop), tyF, uF) + arcUp(uF, 170), lerp(0.2, 1, drop) * lerp(1, 60 / 110, uF), V.p(T, 33.0, 33.1));
    V.set(R.pushLabel, { o: V.p(T, 33.1, 33.3) * (1 - V.p(T, 33.45, 33.6)) });
    // Plot B pops in at 33.3, outBack, slot by slot.
    R.slotsB.forEach((s, i) => {
      const e = V.p(T, 33.3 + i * 0.03, 33.6 + i * 0.03, E.outBack);
      V.set(s, { s: e, o: V.p(T, 33.3, 33.4) });
    });
    // Alloc walks in from the right (33.0 to 33.4) with a small step bob.
    const walk = V.p(T, 33.0, 33.4, E.outCubic);
    const bob = Math.abs(Math.sin(T * 14)) * 10 * (1 - walk);
    put(R.alloc, (1 - walk) * 380, -bob, 1, V.p(T, 33.0, 33.1));
    R.lenLabel.style.opacity = String(f(V.p(T, 33.5, 33.8)));
  }

  /* ------------------------------------------------------------ LIFETIMES */
  // Three lines, two lifetime bars: x's bar ends at its closing brace, r's bar runs on.
  const LT_LINES = [
    [["let", "k"], [" r;", ""]],
    [["{ ", ""], ["let", "k"], [" x = 5; r = ", ""], ["&", "b"], ["x; }", ""]],
    [["println!", "b"], ['("{r}");', ""]],
  ];
  const LT_X = 1100; // code column
  const LT_ROW = (i) => 380 + i * 80; // top of each code line
  function buildLifetimes(parent) {
    const F = frame(parent, { tint: "borrow", term: "LIFETIMES", meaning: "no reference outlives its data.", chip: "ch15" });
    const pic = F.pic;
    const rows = LT_LINES.map((segs, i) => {
      const d = el(pic, "h2s5-code", `left:${LT_X}px; top:${LT_ROW(i)}px;`);
      segs.forEach(([text, cls]) => {
        const s = document.createElement("span");
        if (cls === "k") s.className = "h2s5-k";
        if (cls === "b") s.className = "h2s5-b";
        s.textContent = text;
        d.appendChild(s);
      });
      return d;
    });
    const barR = el(pic, "h2s5-bar", `left:1040px; top:380px; background: var(--borrow);`);
    const barRed = el(pic, "h2s5-bar", `left:1040px; top:524px; background: var(--error); opacity: 0;`);
    const barX = el(pic, "h2s5-bar", `left:1058px; top:460px; background: var(--oxide);`);
    const capX = el(pic, "h2s5-bar", `left:1050px; top:520px; width:24px; height:8px; background: var(--oxide); opacity: 0;`);
    const labR = el(pic, "h2s5-label", "left:994px; top:372px; color: var(--borrow);", "r");
    const labX = el(pic, "h2s5-label", "left:994px; top:452px; color: var(--oxide);", "x");
    const err = el(pic, "h2s5-err", "left:1100px; top:650px;", "E0597");
    const msg = el(pic, "h2s5-msg", "left:1100px; top:698px;", "`x` does not live long enough");
    const tick = actor(pic, oxi("tick", { level: 0.8 }), 1758, 470, 116, 116 * (128 / 86));
    const tickSvg = tick.g.querySelector("svg");
    const grains = [0, 1, 2, 3, 4].map(() => (tickSvg ? svgEl(tickSvg, "circle", { class: "h2s5-grain", r: 2.6, cx: 43, cy: 66 }) : null));
    return { F, rows, barR, barRed, barX, capX, labR, labX, err, msg, tick, grains };
  }
  function renderLifetimes(R, tv, T) {
    R.rows.forEach((row, i) => {
      const e = V.p(T, 34.0 + i * 0.15, 34.0 + i * 0.15 + 0.4, E.outExpo);
      V.set(row, { y: 24 * (1 - e), o: e });
    });
    const rLen = 604 - 380; // r: line 1 to the bottom of line 3
    const xLen = 524 - 460; // x: line 2 only
    const splitLen = 524 - 380; // where x's lifetime ends
    const rOpen = V.p(T, 34.25, 34.9, E.outCubic);
    const xOpen = V.p(T, 34.5, 34.8, E.outCubic);
    const after = V.p(T, 35.0, 35.2);
    // Before 35.0 r's bar is one blue run; from 35.0 the part past x's end goes red.
    R.barR.style.height = f((T < 35.0 ? rLen : splitLen) * rOpen) + "px";
    R.barRed.style.height = f((rLen - splitLen) * rOpen) + "px";
    R.barRed.style.opacity = String(f(after));
    R.barX.style.height = f(xLen * xOpen) + "px";
    R.capX.style.opacity = String(f(V.p(T, 35.0, 35.1)));
    R.labX.style.opacity = "1";
    V.set(R.err, { s: lerp(0.4, 1, V.p(T, 35.0, 35.4, E.outBack)), o: V.p(T, 35.0, 35.1) });
    R.msg.style.opacity = String(f(V.p(T, 35.1, 35.4)));
    // Tick pops in at 34.0; its sand falls from the neck in render.
    const pt = pop(T, 34.0);
    put(R.tick, 0, 0, pt.s, pt.o);
    R.grains.forEach((g, k) => {
      if (!g) return;
      const ph = (T * 1.4 + k / 5) % 1;
      g.setAttribute("cy", String(f(66 + ph * 40)));
      g.setAttribute("opacity", String(f(Math.min(1, ph * 6) * (1 - ph * 0.6))));
    });
  }

  /* ------------------------------------------------------------ MUTEX */
  // A room with a counter. The key passes to the next worker, who steps in and bumps the count.
  const MX = { queue: [1000, 1120, 1240], roomIn: [1420, 470], out: [[1620, 760], [1740, 760]], handY: 740 };
  function buildMutex(parent) {
    const F = frame(parent, { tint: "lock", term: "MUTEX", meaning: "one thread at a time.", chip: "ch18" });
    const pic = F.pic;
    const room = el(pic, "h2s5-room", "left:1330px; top:300px; width:470px; height:320px;");
    const roomLabel = el(pic, "h2s5-label", "left:1356px; top:322px; color: var(--lock);", "Mutex<i32>");
    const count = el(pic, "h2s5-count", "left:1600px; top:372px;", "0");
    const keeper = actor(pic, oxi("keeper"), 1120, 380, 150, 150 * (102 / 120));
    const workers = [0, 1, 2].map((i) => actor(pic, oxi("crab"), MX.queue[i], MX.handY, 120, 120 * (102 / 120)));
    const key = actor(pic, prop("key"), 1210, 400, 96, 48);
    const label = el(pic, "h2s5-label", "left:1420px; top:646px; width:290px; text-align:center;", "Arc<Mutex<T>>");
    return { F, room, roomLabel, count, keeper, workers, key, label };
  }
  // A worker's position: it walks from the queue into the room at its entry time, then out.
  function workerPos(i, T) {
    const ins = [36.5, 37.0, 37.5][i];
    const outs = [37.0, 37.5, null][i];
    const q = [MX.queue[i], MX.handY];
    const e = V.p(T, ins, ins + 0.35, E.inOutSine);
    let x = lerp(q[0], MX.roomIn[0], e);
    let y = lerp(q[1], MX.roomIn[1], e) + arcUp(e, 60);
    if (outs !== null) {
      const o = V.p(T, outs, outs + 0.35, E.inOutSine);
      const dst = MX.out[i === 0 ? 0 : 1];
      x = lerp(x, dst[0], o);
      y = lerp(y, dst[1], o) + arcUp(o, 60);
    }
    return [x, y];
  }
  // The key's hand position for a worker or the keeper.
  const hand = (p) => [p[0] + 52, p[1] - 18];
  function keyPos(T) {
    const kHand = [1182, 360];
    // Each pass: [time, from(T), to(T)], then the key sticks to its new holder.
    const passes = [
      { t: 36.5, from: () => kHand, to: (T) => hand(workerPos(0, T)) },
      { t: 37.0, from: (T) => hand(workerPos(0, T)), to: (T) => hand(workerPos(1, T)) },
      { t: 37.5, from: (T) => hand(workerPos(1, T)), to: (T) => hand(workerPos(2, T)) },
      { t: 37.9, from: (T) => hand(workerPos(2, T)), to: () => kHand },
    ];
    let pos = kHand;
    for (const p of passes) {
      if (T < p.t) break;
      const u = V.p(T, p.t, p.t + 0.3, E.inOutCubic);
      const a = p.from(T);
      const b = p.to(T);
      pos = [lerp(a[0], b[0], u), lerp(a[1], b[1], u) + arcUp(u, 110)];
    }
    return pos;
  }
  function renderMutex(R, tv, T) {
    V.set(R.room, { s: lerp(0.94, 1, V.p(T, 36.0, 36.4, E.outExpo)), o: V.p(T, 36.0, 36.3) });
    R.roomLabel.style.opacity = String(f(V.p(T, 36.1, 36.4)));
    R.count.style.opacity = String(f(V.p(T, 36.0, 36.3)));
    const kp = pop(T, 36.0);
    put(R.keeper, 0, 0, kp.s, kp.o);
    const ins = [36.5, 37.0, 37.5];
    R.workers.forEach((w, i) => {
      const wp = pop(T, 36.0 + 0.04 * i);
      const [x, y] = workerPos(i, T);
      put(w, x - MX.queue[i], y - MX.handY, wp.s, wp.o);
      pose(w, "happy", T >= ins[i] + 0.3 && (i === 2 || T < [37.0, 37.5][i]));
    });
    const k = keyPos(T);
    put(R.key, k[0] - 1210, k[1] - 400, 1, V.p(T, 36.0, 36.2));
    // The counter: 1 at 36.85, 2 at 37.35, 3 at 37.85, with a bump on each change.
    const changes = [36.85, 37.35, 37.85];
    let n = 0;
    let last = null;
    changes.forEach((c, i) => {
      if (T >= c) {
        n = i + 1;
        last = c;
      }
    });
    R.count.textContent = String(n);
    const bump = last === null ? 1 : lerp(1.2, 1, V.p(T, last, last + 0.3, E.outBack));
    R.count.style.transform = `translateX(-50%) scale(${f(bump)})`;
    R.label.style.opacity = String(f(V.p(T, 36.4, 36.7)));
  }

  /* ------------------------------------------------------------ ASYNC */
  // The waiter juggles three order tickets; a bell serves each one in turn.
  const BELLS = [38.5, 39.0, 39.5];
  const SERVE = { x: 1690, y: 600 };
  function buildAsync(parent) {
    const F = frame(parent, { tint: "ok", term: "ASYNC", meaning: "paused until the waker rings.", chip: "ch19" });
    const pic = F.pic;
    const waiter = actor(pic, oxi("waiter"), 1392, 600, 210, 210 * (102 / 120));
    const tickets = [0, 1, 2].map((i) => actor(pic, prop("ticket", { label: "#" + (i + 1) }), 1392, 300, 120, 66));
    const bells = BELLS.map(() => actor(pic, prop("bell"), 1392, 300, 110, 90));
    const ringSvg = svgEl(pic, "svg", { class: "h2s5-rings", viewBox: "0 0 1920 1080" });
    const served = el(pic, "h2s5-plate", "left:1600px; top:640px; width:180px; height:54px;", "served");
    const label = el(pic, "h2s5-label", "left:1222px; top:776px; width:340px; text-align:center;", "Future · poll · waker");
    return { F, waiter, tickets, bells, ringSvg, served, label };
  }
  // Ticket i juggles on a ping-pong arc: hands at the ends, a peak in the middle.
  function ticketPos(i, T) {
    const s = (T - 38.0) * 0.9 + i / 3;
    const p = tri(s);
    return [1392 + (p * 2 - 1) * 170, 400 - 150 * 4 * p * (1 - p)];
  }
  function renderAsync(R, tv, T) {
    const wp = pop(T, 38.0);
    put(R.waiter, 0, 0, wp.s, wp.o);
    R.tickets.forEach((tk, i) => {
      const [x, y] = ticketPos(i, T);
      const rt = BELLS[i];
      const sv = V.p(T, rt, rt + 0.4, E.outCubic);
      const px = lerp(x, SERVE.x, sv);
      const py = lerp(y, SERVE.y, sv);
      put(tk, px - 1392, py - 300, 1, V.p(T, 38.0, 38.2));
      tk.g.style.filter = T >= rt && T < rt + 0.6 ? "drop-shadow(0 0 12px var(--molten))" : "none";
    });
    // Each bell rings above the ticket it serves; the ring arcs pulse for 0.5 s.
    R.ringSvg.innerHTML = "";
    BELLS.forEach((rt, i) => {
      const [x, y] = ticketPos(i, rt);
      const shown = T >= rt ? V.p(T, rt, rt + 0.1) * (1 - V.p(T, rt + 0.45, rt + 0.7)) : 0;
      const bx = x;
      const by = y - 110;
      const ringing = T >= rt && T < rt + 0.4;
      const tilt = ringing ? 9 * Math.sin((T - rt) * 60) * (1 - (T - rt) / 0.4) : 0;
      const bell = R.bells[i];
      put(bell, bx - 1392, by - 300, 1, shown);
      bell.g.style.transform = `translate(${f(bx - 1392)}px, ${f(by - 300)}px) rotate(${f(tilt)}deg)`;
      const grow = V.p(T, rt, rt + 0.5, E.outCubic);
      for (let j = 0; j < 2; j++) {
        const r0 = 84 + j * 22 + grow * 26;
        const dy = 26;
        const left = `M${f(bx - r0 * 0.7)} ${f(by - dy)} A${f(r0)} ${f(r0)} 0 0 0 ${f(bx - r0 * 0.7)} ${f(by + dy)}`;
        const right = `M${f(bx + r0 * 0.7)} ${f(by - dy)} A${f(r0)} ${f(r0)} 0 0 1 ${f(bx + r0 * 0.7)} ${f(by + dy)}`;
        const op = shown * (1 - j * 0.35);
        svgEl(R.ringSvg, "path", { class: "h2s5-ring", d: left, opacity: f(op) });
        svgEl(R.ringSvg, "path", { class: "h2s5-ring", d: right, opacity: f(op) });
      }
    });
    pose(R.waiter, "wow", BELLS.some((b) => T >= b && T < b + 0.3));
    R.label.style.opacity = String(f(V.p(T, 38.3, 38.6)));
    R.served.style.opacity = String(f(V.p(T, 38.5, 38.7)));
  }

  /* ------------------------------------------------------------ scene */
  const S = { R: null };

  V.scene({
    id: "s5",
    start: 32,
    end: 40,

    setup(layer) {
      injectCSS();
      layer.innerHTML = "";
      const whip = el(layer, "h2s5-whip", "");
      const vgs = {
        realloc: buildRealloc(whip),
        lifetimes: buildLifetimes(whip),
        mutex: buildMutex(whip),
        async: buildAsync(whip),
      };
      const flash = el(whip, "h2s5-flash", "");
      S.R = { whip, vgs, flash };
    },

    render(t, layer, T) {
      const R = S.R;
      if (!R) return;
      const C = cues();
      const keys = ["realloc", "lifetimes", "mutex", "async"];
      const shake = V.shake(T, [38.5, 39.0, 39.5], 8, 0.35);
      keys.forEach((k, i) => {
        // The hard cuts land exactly on montageCuts.
        const on = T >= C.cuts[i] && (i === 3 || T < C.cuts[i + 1]);
        const F = R.vgs[k].F;
        F.vg.style.display = on ? "block" : "none";
        if (!on) return;
        const tv = T - C.cuts[i];
        const te = V.p(T, C.cuts[i], C.cuts[i] + 0.5, E.outExpo);
        F.term.style.transform = `translate(0px, ${f(60 * (1 - te))}px) scale(${f(1 + 0.02 * clamp(tv / 2, 0, 1))})`;
        F.term.style.opacity = String(f(te));
        const me = V.p(T, C.cuts[i] + 0.25, C.cuts[i] + 0.7);
        F.meaning.style.opacity = String(f(me));
        F.meaning.style.transform = `translate(0px, ${f(14 * (1 - me))}px)`;
        const ce = pop(T, C.cuts[i] + 0.45);
        F.chip.style.transform = `scale(${f(ce.s)})`;
        F.chip.style.opacity = String(f(ce.o));
        // The picture: a slow push, a gentle float, and the bell shake in the async vignette.
        const sx = k === "async" ? shake.x : 0;
        const sy = k === "async" ? shake.y : 0;
        F.pic.style.transform = `translate(${f(sx)}px, ${f(sy + 4 * Math.sin(tv * 1.6))}px) scale(${f(1 + 0.02 * clamp(tv / 2, 0, 1))})`;
        if (k === "realloc") renderRealloc(R.vgs[k], tv, T);
        if (k === "lifetimes") renderLifetimes(R.vgs[k], tv, T);
        if (k === "mutex") renderMutex(R.vgs[k], tv, T);
        if (k === "async") renderAsync(R.vgs[k], tv, T);
      });
      // Cut flashes: 120 ms at 25 %.
      R.flash.style.opacity = String(V.flash(T, C.cuts, 0.12, 0.25));
      // The whip: the frame slides 2200 px left with motion blur, 39.5 to 40.0.
      const wu = V.p(T, C.whip, C.end, E.inCubic);
      V.set(R.whip, { x: f(-2200 * wu), blur: f(22 * wu) });
    },
  });
})();
