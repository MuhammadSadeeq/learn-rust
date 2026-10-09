/* S4 · SEE IT: OWNERSHIP & BORROWING (24–32 s).
   Builder H2. Follows promo/DIRECTION.md section 3 (S4) and the section 4 contract.
   Every property is set from T in render(); nothing accumulates between frames.

   Local helpers (no engine feature was missing):
   - colored typing: the engine's V.type() writes plain text, so typeLine()
     reveals syntax-colored segments with the same round(u * length) rule.
   - polyline partial reveal: ropes and links grow by arc length, so the stroke
     reveal works on dotted links too (dash offsets cannot do both). */
(function () {
  "use strict";
  const V = window.V;
  const E = V.ease;
  const clamp = V.clamp;
  const lerp = V.lerp;
  const f = (n) => Math.round(n * 100) / 100;
  const NS = "http://www.w3.org/2000/svg";
  const CRAB_H = 102 / 120; // a crab's viewBox is "0 -6 120 102"

  // Cue times come from timing.json (V.cue, set at boot). The literals are the sheet's values.
  const Q = (k, d) => (V.cue && V.cue[k] !== undefined ? V.cue[k] : d);
  function cues() {
    return {
      zonesIn: Q("zonesIn", 24.0),
      crabA: Q("crabA", 24.6),
      leash: Q("leash", 25.0),
      codeMove: Q("codeMove", 26.0),
      leashPass: Q("leashPass", 26.3),
      moveCaption: Q("moveCaption", 26.5),
      ghost: Q("ghost", 26.8),
      borrowStart: Q("borrowStart", 28.0),
      refs: Q("refs", [28.3, 28.5, 28.7]),
      mutTry: Q("mutTry", 29.0),
      inspectorIn: Q("inspectorIn", 29.4),
      stamp: Q("stamp", 30.0),
      wipe: Q("wipe", 31.5),
      end: 32.0,
    };
  }

  // Layout in stage pixels (1920 x 1080). Centres for actors, boxes for panels.
  const LAY = {
    code: { x: 96, y: 72, w: 900, h: 240 },
    stack: { x: 96, y: 332, w: 620, h: 508 },
    heap: { x: 1064, y: 332, w: 760, h: 508 },
    cap: { x: 96, y: 866 },
  };
  const ACT = {
    a: { x: 270, y: 463, w: 160, name: "crab", o: {} },
    ga: { x: 270, y: 463, w: 160, name: "crab", o: { kind: "ghost" } },
    b: { x: 270, y: 712, w: 160, name: "crab", o: {} },
    r1: { x: 455, y: 440, w: 120, name: "crab", o: { kind: "ref", gear: ["glasses"] } },
    r2: { x: 630, y: 440, w: 120, name: "crab", o: { kind: "ref", gear: ["glasses"] } },
    r3: { x: 455, y: 640, w: 120, name: "crab", o: { kind: "ref", gear: ["glasses"] } },
    mut: { x: 630, y: 640, w: 120, name: "crab", o: { kind: "mutref" } },
    fl: { x: 1444, y: 560, w: 240, name: "fluffy", o: {}, square: true },
    ins: { x: 1380, y: 190, w: 220, name: "inspector", o: {} },
  };

  // Code: segments of [text, class]. Classes: kw, s (string), t (type), m (macro), r (&), x (&mut).
  const CODE = [
    { segs: [["let", "kw"], [" a = ", ""], ["String::from(", "t"], ['"hi"', "s"], [");", ""]], row: 0 },
    { segs: [["let mut", "kw"], [" b = a;", ""]], row: 1 },
    {
      segs: [
        ["let", "kw"], [" r1 = ", ""], ["&", "r"], ["b; ", ""],
        ["let", "kw"], [" r2 = ", ""], ["&", "r"], ["b; ", ""],
        ["let", "kw"], [" r3 = ", ""], ["&", "r"], ["b;", ""],
      ],
      row: 2,
    },
    { segs: [["let", "kw"], [" w = ", ""], ["&mut", "x"], [" b;", ""]], row: 3 },
    { segs: [["println!", "m"], ['("{r1} {r2} {r3} {w}");', "s"]], row: 4 },
  ];
  const CODE_FS = 36; // px; JetBrains Mono advances 0.6 em per glyph
  const CODE_ROW = 42; // px line height
  const CODE_PAD_X = 30;
  const CODE_PAD_Y = 15;

  /* ------------------------------------------------------------ styles */
  const CSS = `
  .s-s4 { --bad: var(--error); }
  .s-s4 .h2-cam { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; }
  .s-s4 .h2-zone { position: absolute; border: 2px dashed var(--steel); border-radius: 24px; }
  .s-s4 .h2-stack { background: color-mix(in srgb, var(--borrow) 7%, var(--ink)); }
  .s-s4 .h2-heap { background: color-mix(in srgb, var(--cream) 5%, var(--ink)); }
  .s-s4 .h2-zlabel { position: absolute; left: 28px; top: 22px; font: 500 28px/1 var(--font-mono); color: var(--muted); white-space: pre; }
  .s-s4 .h2-code { position: absolute; border: 2px dashed var(--steel); border-radius: 24px; background: var(--ink-2); }
  .s-s4 .h2-line { position: absolute; left: ${CODE_PAD_X}px; height: ${CODE_ROW}px; font: 500 ${CODE_FS}px/${CODE_ROW}px var(--font-mono); white-space: pre; color: var(--cream); }
  .s-s4 .h2-k { color: var(--oxide); }
  .s-s4 .h2-s { color: var(--molten); }
  .s-s4 .h2-t { color: var(--cream); }
  .s-s4 .h2-m { color: var(--borrow); }
  .s-s4 .h2-r { color: var(--borrow); }
  .s-s4 .h2-x { color: var(--lock); }
  .s-s4 .h2-caret { display: none; }
  .s-s4 .h2-wavebox { position: absolute; overflow: hidden; height: 12px; }
  .s-s4 .h2-links { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; overflow: visible; }
  .s-s4 .h2-rope { stroke: var(--oxide); stroke-width: 6; fill: none; stroke-linecap: round; stroke-linejoin: round; }
  .s-s4 .h2-blue { stroke: var(--borrow); stroke-width: 4; fill: none; stroke-linecap: round; stroke-dasharray: 1 13; }
  .s-s4 .h2-red { stroke: var(--error); stroke-width: 5; fill: none; stroke-linecap: round; stroke-dasharray: 18 12; }
  .s-s4 .h2-actor { position: absolute; }
  .s-s4 .h2-actor > .ca { position: absolute; left: 0; top: 0; width: 100%; height: 100%; display: block; }
  .s-s4 .h2-sh { position: absolute; left: 15%; width: 70%; bottom: -8px; height: 16px; border-radius: 50%; background: radial-gradient(closest-side, rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0)); }
  .s-s4 .h2-lock { position: absolute; left: 74%; top: -6%; width: 36%; height: 44%; overflow: visible; }
  .s-s4 .h2-tagw { position: absolute; width: 0; height: 0; }
  .s-s4 .h2-tag { position: absolute; left: 0; top: -20px; transform: translateX(-50%); height: 40px; line-height: 40px; padding: 0 16px; white-space: pre; border: 2px solid var(--steel); border-radius: 12px; background: var(--ink-2); color: var(--cream); font: 500 28px var(--font-mono); }
  .s-s4 .h2-tag.is-two { top: -40px; height: 80px; line-height: 36px; text-align: center; }
  .s-s4 .h2-tag.is-oxide { border-color: var(--oxide); }
  .s-s4 .h2-tag.is-blue { border-color: var(--borrow); }
  .s-s4 .h2-tag.is-lock { border-color: var(--lock); }
  .s-s4 .h2-tag.is-ghost { color: var(--ghost); border-color: var(--ghost); }
  .s-s4 .h2-owns { position: absolute; left: 0; top: -20px; transform: translateX(-50%); height: 40px; line-height: 40px; padding: 0 16px; border: 2px solid var(--oxide); border-radius: 12px; background: var(--ink-2); color: var(--oxide); font: 700 28px var(--font-mono); white-space: pre; }
  .s-s4 .h2-capbox { position: absolute; }
  .s-s4 .h2-capword { position: absolute; left: 0; top: 0; font: 900 120px/108px var(--font-display); letter-spacing: 0.02em; text-transform: uppercase; color: var(--oxide); white-space: pre; }
  .s-s4 .h2-capline { position: absolute; top: 0; font: 400 44px/46px var(--font-body); color: var(--cream); white-space: pre; }
  .s-s4 .h2-capline.is-ok { color: var(--ok); }
  .s-s4 .h2-stamp { position: absolute; width: 400px; height: 170px; display: flex; align-items: center; justify-content: center; }
  .s-s4 .h2-stamp-in { border: 10px double var(--error); border-radius: 16px; padding: 0 28px; font: 900 120px/1 var(--font-display); letter-spacing: 0.04em; color: var(--error); background: color-mix(in srgb, var(--ink) 55%, transparent); white-space: nowrap; }
  .s-s4 .h2-content { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; }
  .s-s4 .h2-wipe { position: absolute; left: 0; top: -210px; width: 1100px; height: 1500px; background: linear-gradient(90deg, var(--oxide), var(--hot)); border-right: 2px solid var(--molten); }
  `;
  function injectCSS() {
    if (document.getElementById("h2-s4-css")) return;
    const st = document.createElement("style");
    st.id = "h2-s4-css";
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  /* ------------------------------------------------------------ geometry */
  function arc(p0, c, p1, u) {
    const k = 1 - u;
    return [
      k * k * p0[0] + 2 * k * u * c[0] + u * u * p1[0],
      k * k * p0[1] + 2 * k * u * c[1] + u * u * p1[1],
    ];
  }
  // A rope from p0 to p1 that sags by `sag` px (quadratic, control below the middle).
  function sagCtrl(p0, p1, sag) {
    return [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2 + sag];
  }
  function sagPts(p0, p1, sag, n) {
    const c = sagCtrl(p0, p1, sag);
    const out = [];
    for (let i = 0; i <= n; i++) out.push(arc(p0, c, p1, i / n));
    return out;
  }
  // SVG path through the first `p` (0..1) of a polyline, by arc length.
  function polyPath(pts, p) {
    if (p <= 0 || pts.length < 2) return "";
    const cum = [0];
    for (let i = 1; i < pts.length; i++) {
      cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    }
    const total = cum[cum.length - 1];
    const target = total * clamp(p, 0, 1);
    let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
    for (let i = 1; i < pts.length; i++) {
      if (cum[i] <= target) {
        d += ` L${f(pts[i][0])} ${f(pts[i][1])}`;
      } else {
        const span = cum[i] - cum[i - 1];
        const k = span > 0 ? (target - cum[i - 1]) / span : 0;
        d += ` L${f(lerp(pts[i - 1][0], pts[i][0], k))} ${f(lerp(pts[i - 1][1], pts[i][1], k))}`;
        break;
      }
    }
    return d;
  }
  // A crab's right claw, in stage pixels. Actors are centred at (x, y) with width w.
  function clawR(a) {
    const h = a.w * CRAB_H;
    return [a.x - a.w / 2 + (a.w * 103) / 120, a.y - h / 2 + (h * 34) / 102];
  }
  // Where a leash or link meets the fluffy (its left side).
  function fluffAt(k) {
    const a = ACT.fl;
    return [a.x - a.w / 2 + 0.19 * a.w, a.y - a.w / 2 + k * a.w];
  }

  /* ------------------------------------------------------------ DOM helpers */
  function el(parent, cls, css) {
    const d = document.createElement("div");
    d.className = cls;
    if (css) d.style.cssText = css;
    parent.appendChild(d);
    return d;
  }
  function svgEl(parent, tag, attrs) {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    parent.appendChild(n);
    return n;
  }
  function makeActor(parent, a) {
    const h = a.square ? a.w : a.w * CRAB_H;
    const g = el(
      parent,
      "h2-actor",
      `left:${f(a.x - a.w / 2)}px; top:${f(a.y - h / 2)}px; width:${a.w}px; height:${f(h)}px;`
    );
    const sh = el(g, "h2-sh");
    const html = window.OxCast ? window.OxCast.el(a.name, a.o) : "";
    const wrap = document.createElement("div");
    wrap.innerHTML = html;
    const ca = wrap.firstElementChild;
    if (ca) g.appendChild(ca);
    if (a.name === "crab" && a.o && a.o.kind === "mutref") {
      // The lock: a shackle and a body in the mutable-borrow purple.
      g.insertAdjacentHTML(
        "beforeend",
        `<svg class="h2-lock" viewBox="0 0 40 46"><path class="pr-shackle" d="M11 20 V12 a9 9 0 0 1 18 0 V20"/><rect class="pr-lock" x="4" y="19" width="32" height="25" rx="5"/></svg>`
      );
    }
    return { g, sh, ca: g.querySelector(".ca"), a };
  }
  function tag(parent, text, cx, cy, cls) {
    const w = el(parent, "h2-tagw", `left:${f(cx)}px; top:${f(cy)}px;`);
    const t = document.createElement("div");
    t.className = "h2-tag" + (cls ? " " + cls : "");
    t.textContent = text;
    w.appendChild(t);
    return w;
  }

  // Colored typing: reveal the first round(u * length) characters across segments.
  function setupLine(line) {
    line.textContent = "";
    line._segs = line._segSrc.map(([text, cls]) => {
      const s = document.createElement("span");
      if (cls) s.className = "h2-" + cls;
      line.appendChild(s);
      return { s, text, v: null };
    });
    const c = document.createElement("span");
    c.className = "ox-caret h2-caret";
    line._caret = c;
  }
  function drawLine(line, u) {
    const total = line._segs.reduce((n, x) => n + x.text.length, 0);
    let n = Math.round(clamp(u, 0, 1) * total);
    let placed = false;
    for (const x of line._segs) {
      const k = clamp(n, 0, x.text.length);
      const want = x.text.slice(0, k);
      if (x.v !== want) {
        x.s.textContent = want;
        x.v = want;
      }
      if (!placed && n <= x.text.length) {
        x.s.after(line._caret);
        placed = true;
      }
      n -= k;
    }
    line._caret.style.display = u > 0 && u < 1 ? "inline-block" : "none";
  }

  // The pop: outBack scale from 0 over 0.5 s, opacity in 0.1 s.
  function pop(T, t0) {
    return { s: V.p(T, t0, t0 + 0.5, E.outBack), o: V.p(T, t0, t0 + 0.1) };
  }
  // A small idle bob keeps every character alive during holds (no dead frames).
  function bob(t, phase) {
    return 3 * Math.sin((2 * Math.PI * t) / 2.6 + phase);
  }
  // Drive an actor: pop scale, opacity, a hop offset, and a bob from t.
  function driveActor(A, t, o) {
    const dy = (o.dy || 0) + bob(t, A.a.x * 0.01) * (o.bobOn === false ? 0 : 1);
    V.set(A.g, { x: o.dx || 0, y: dy, s: o.s ?? 1, o: o.o ?? 1 });
    if (A.sh) {
      const lift = clamp(-dy / 80, 0, 1);
      V.set(A.sh, { s: lerp(1, 0.6, lift) * (o.s ?? 1), o: (o.o ?? 1) * lerp(1, 0.55, lift) });
    }
  }
  function setPose(A, pose, on) {
    if (A.ca) A.ca.classList.toggle("is-" + pose, !!on);
  }

  /* ------------------------------------------------------------ scene */
  const S = { R: null };

  V.scene({
    id: "s4",
    start: 24,
    end: 32,

    setup(layer) {
      injectCSS();
      layer.innerHTML = "";
      const cam = el(layer, "h2-cam");
      const content = el(cam, "h2-content");
      const stack = el(content, "h2-zone h2-stack", `left:${LAY.stack.x}px; top:${LAY.stack.y}px; width:${LAY.stack.w}px; height:${LAY.stack.h}px;`);
      el(stack, "h2-zlabel").textContent = "STACK · one frame per call";
      const heap = el(content, "h2-zone h2-heap", `left:${LAY.heap.x}px; top:${LAY.heap.y}px; width:${LAY.heap.w}px; height:${LAY.heap.h}px;`);
      el(heap, "h2-zlabel").textContent = "HEAP · allocated at runtime";

      const code = el(content, "h2-code", `left:${LAY.code.x}px; top:${LAY.code.y}px; width:${LAY.code.w}px; height:${LAY.code.h}px;`);
      const lines = CODE.map((c) => {
        const d = el(code, "h2-line", `top:${CODE_PAD_Y + c.row * CODE_ROW}px;`);
        d._segSrc = c.segs;
        setupLine(d);
        return d;
      });
      // The red wavy underline under "&mut b" (row 3, columns 8 to 14).
      const wave = el(code, "h2-wavebox", `left:${CODE_PAD_X + 8 * 0.6 * CODE_FS}px; top:${CODE_PAD_Y + 3 * CODE_ROW + 36}px; width:${6 * 0.6 * CODE_FS}px;`);
      svgNode(wave, 6 * 0.6 * CODE_FS, 12);

      const links = document.createElementNS(NS, "svg");
      links.setAttribute("class", "h2-links");
      links.setAttribute("viewBox", "0 0 1920 1080");
      content.appendChild(links);
      const rope = svgEl(links, "path", { class: "h2-rope", d: "" });
      const blue = [0, 1, 2].map(() => svgEl(links, "path", { class: "h2-blue", d: "" }));
      const red = svgEl(links, "path", { class: "h2-red", d: "" });

      const actors = el(content, "h2-actors");
      const A = {};
      for (const k of Object.keys(ACT)) A[k] = makeActor(actors, ACT[k]);
      A.ga.g.style.opacity = "0";

      const tags = el(content, "h2-tags");
      const aTagY = ACT.a.y + (ACT.a.w * CRAB_H) / 2 + 52;
      const T_a = tag(tags, "a · String\n(owner)", ACT.a.x, aTagY, "is-oxide is-two");
      const T_moved = tag(tags, "a · moved", ACT.a.x, aTagY, "is-ghost");
      const T_b = tag(tags, "b · String (owner)", ACT.b.x, ACT.b.y + (ACT.b.w * CRAB_H) / 2 + 26, "is-oxide");
      const T_r = [0, 1, 2].map((i) => {
        const r = ACT["r" + (i + 1)];
        return tag(tags, "r" + (i + 1) + " · &b", r.x, r.y + (r.w * CRAB_H) / 2 + 26, "is-blue");
      });
      const T_mut = tag(tags, "w · &mut", ACT.mut.x, ACT.mut.y + (ACT.mut.w * CRAB_H) / 2 + 26, "is-lock");
      const T_fl = tag(tags, '"hi" · heap data', ACT.fl.x, ACT.fl.y + ACT.fl.w / 2 + 24, "");
      const T_ins = tag(tags, "the Inspector = the borrow checker", ACT.ins.x, 300, "is-blue");
      const owns = el(tags, "h2-tagw", "left:0; top:0;");
      owns.innerHTML = '<div class="h2-owns">owns</div>';

      const ins = A.ins;
      const stamp = el(content, "h2-stamp", `left:${1130 - 200}px; top:${500 - 85}px;`);
      el(stamp, "h2-stamp-in").textContent = "E0502";

      const capbox = el(content, "h2-capbox", `left:${LAY.cap.x}px; top:${LAY.cap.y}px; width:1400px; height:150px;`);
      const hMove = el(capbox, "h2-capword");
      hMove.textContent = "MOVE";
      const sMove = el(capbox, "h2-capline");
      sMove.textContent = "one owner, always.";
      const hBorrow = el(capbox, "h2-capword");
      hBorrow.textContent = "BORROW";
      const sBorrow = el(capbox, "h2-capline");
      sBorrow.textContent = "many readers, or one writer.";
      const sOk = el(capbox, "h2-capline is-ok");
      sOk.textContent = "Checked before it runs.";
      // Place each subline to the right of its heading, measured with the real font.
      const mw = measure("MOVE");
      const bw = measure("BORROW");
      sMove.style.left = mw + 44 + "px";
      sBorrow.style.left = bw + 44 + "px";
      sOk.style.left = bw + 44 + "px";
      // Sublines sit on the heading's optical centre (heading box 108 px, line 46 px).
      sMove.style.top = "31px";
      sBorrow.style.top = "31px";
      sOk.style.top = "77px";
      hMove.style.opacity = "0";
      hBorrow.style.opacity = "0";

      const wipe = el(cam, "h2-wipe");

      S.R = {
        cam, content, stack, heap, code, lines, wave, rope, blue, red, A, T_a, T_moved, T_b, T_r, T_mut, T_fl, T_ins,
        owns, ins, stamp, hMove, sMove, hBorrow, sBorrow, sOk, wipe,
      };
    },

    render(t, layer, T) {
      const R = S.R;
      if (!R) return;
      const C = cues();

      // Camera: slow push 1.00 to 1.04, plus the 12 px shake of the stamp.
      const sk = V.shake(T, [C.stamp], 12, 0.35);
      V.set(R.cam, { x: sk.x, y: sk.y, s: 1 + 0.04 * clamp(t / 8, 0, 1) });

      // Panels: scale 0.96 to 1 and fade in over 400 ms, staggered 120 ms.
      const zin = (node, t0, dur) => {
        const e = V.p(T, t0, t0 + dur, E.outExpo);
        V.set(node, { s: lerp(0.96, 1, e), o: e });
      };
      zin(R.code, C.zonesIn, 0.25);
      zin(R.stack, C.zonesIn + 0.06, 0.19);
      zin(R.heap, C.zonesIn + 0.12, 0.13);

      // Code: five lines typed in, with the red wave drawn left to right.
      const spans = [
        [C.zonesIn + 0.05, C.zonesIn + 0.6],
        [C.codeMove, C.codeMove + 0.45],
        [C.borrowStart, C.borrowStart + 0.8],
        [C.mutTry, C.mutTry + 0.3],
        [C.mutTry + 0.35, C.mutTry + 0.75],
      ];
      R.lines.forEach((line, i) => drawLine(line, V.p(T, spans[i][0], spans[i][1])));
      const wu = V.p(T, C.mutTry + 0.3, C.mutTry + 0.5);
      R.wave.style.width = f(6 * 0.6 * CODE_FS * wu) + "px";

      // Actors. Crab a and the fluffy pop at 24.6.
      const A = R.A;
      const pa = pop(T, C.crabA);
      const pf = pop(T, C.crabA);
      const ghostU = V.p(T, C.ghost, C.ghost + 0.3);
      const fadeGhostA = V.p(T, C.borrowStart, C.borrowStart + 0.4);
      driveActor(A.a, t, { s: pa.s, o: pa.o * (1 - ghostU), bobOn: true, dy: 0 });
      driveActor(A.ga, t, { s: 1, o: ghostU * (1 - fadeGhostA), bobOn: true, dy: 0 });
      setPose(A.a, "happy", T >= C.leash + 0.5 && T < C.ghost);
      const pb = pop(T, C.codeMove);
      driveActor(A.b, t, { s: pb.s, o: pb.o, bobOn: true, dy: 0 });
      setPose(A.b, "happy", T >= C.leashPass + 0.6);
      driveActor(A.fl, t, { s: pf.s, o: pf.o, bobOn: true, dy: 0 });
      C.refs.forEach((rt, i) => {
        const p = pop(T, rt);
        driveActor(A["r" + (i + 1)], t, { s: p.s, o: p.o, bobOn: true, dy: 0 });
      });
      const pm = pop(T, C.mutTry);
      driveActor(A.mut, t, { s: pm.s, o: pm.o, bobOn: true, dy: 0 });
      setPose(A.mut, "think", T >= C.mutTry && T < C.mutTry + 0.7);
      // The Inspector slides in from the right edge with outBack.
      const ie = V.p(T, C.inspectorIn, C.inspectorIn + 0.5, E.outBack);
      driveActor(A.ins, t, { dx: (1 - ie) * 820, o: V.p(T, C.inspectorIn, C.inspectorIn + 0.12), bobOn: true, dy: 0 });

      // The leash: the rope runs from the owner's claw to the fluffy.
      const clawA = clawR(ACT.a);
      const clawB = clawR(ACT.b);
      const pass = V.p(T, C.leashPass, C.leashPass + 0.5, E.inOutCubic);
      const ctrlArc = [Math.max(clawA[0], clawB[0]) + 90, (clawA[1] + clawB[1]) / 2];
      const owner = arc(clawA, ctrlArc, clawB, pass);
      const F = fluffAt(0.52);
      const ropeU = V.p(T, C.leash, C.leash + 0.4, E.inOutCubic);
      const ropePts = sagPts(owner, F, 60, 60);
      R.rope.setAttribute("d", polyPath(ropePts, ropeU));
      // The "owns" tag rides on the middle of the rope.
      const ctrl = sagCtrl(owner, F, 60);
      const mid = arc(owner, ctrl, F, 0.5);
      const ownsU = V.p(T, C.leash + 0.25, C.leash + 0.5);
      R.owns.style.left = f(mid[0]) + "px";
      R.owns.style.top = f(mid[1]) + "px";
      R.owns.style.opacity = String(f(ownsU));

      // Tags.
      const tagO = (node, o) => {
        node.style.opacity = String(f(clamp(o, 0, 1)));
      };
      // The owner tag leaves first, then "moved" arrives, so the two never show at once.
      const oldTagOut = V.p(T, C.ghost, C.ghost + 0.15);
      tagO(R.T_a, V.p(T, C.crabA + 0.1, C.crabA + 0.3) * (1 - oldTagOut));
      tagO(R.T_moved, V.p(T, C.ghost + 0.15, C.ghost + 0.35) * (1 - V.p(T, C.borrowStart, C.borrowStart + 0.3)));
      tagO(R.T_b, V.p(T, C.codeMove + 0.3, C.codeMove + 0.5));
      tagO(R.T_fl, V.p(T, C.crabA + 0.1, C.crabA + 0.3));
      C.refs.forEach((rt, i) => tagO(R.T_r[i], V.p(T, rt + 0.2, rt + 0.4)));
      tagO(R.T_mut, V.p(T, C.mutTry + 0.25, C.mutTry + 0.45));
      tagO(R.T_ins, V.p(T, C.inspectorIn + 0.5, C.inspectorIn + 0.8));

      // Reader links: dotted blue, drawn from each reader's claw to the fluffy.
      C.refs.forEach((rt, i) => {
        const src = clawR(ACT["r" + (i + 1)]);
        const dst = fluffAt(0.44 + i * 0.08);
        const p = V.p(T, rt + 0.15, rt + 0.55, E.outCubic);
        R.blue[i].setAttribute("d", polyPath(sagPts(src, dst, 30, 40), p));
      });

      // The mutable link: dashed red, stops halfway, snaps and fades at the stamp.
      const mutSrc = clawR(ACT.mut);
      const mutDst = fluffAt(0.5);
      const mp = V.p(T, C.mutTry + 0.5, C.mutTry + 0.95, E.outCubic);
      const snap = V.p(T, C.stamp, C.stamp + 0.12, E.inQuad);
      const mutFade = 1 - V.p(T, C.stamp, C.stamp + 0.25);
      R.red.setAttribute("d", polyPath(sagPts(mutSrc, mutDst, 40, 40), 0.5 * mp * (1 - 0.5 * snap)));
      R.red.style.opacity = String(f(mutFade));

      // Inspector tag and the caption.
      // The E0502 stamp: scale 2.2 to 1 in 140 ms, rotated -12 degrees.
      const se = V.p(T, C.stamp, C.stamp + 0.14, E.outExpo);
      const so = V.p(T, C.stamp, C.stamp + 0.03);
      const hold = 1 + 0.012 * clamp((T - C.stamp - 0.14) / 1, 0, 1);
      V.set(R.stamp, { s: lerp(2.2, 1, se) * hold, o: so, r: -12 });

      // Caption: MOVE, then BORROW (the cut at borrowStart), then the green line at the stamp.
      const rise = (node, t0, dur, on) => {
        const e = V.p(T, t0, t0 + dur, E.outExpo);
        V.set(node, { y: 40 * (1 - e), o: e * on });
      };
      const moveOn = V.p(T, C.moveCaption, C.moveCaption + 0.3) * (1 - V.p(T, C.borrowStart, C.borrowStart + 0.2, E.inQuad));
      const borrowOn = V.p(T, C.borrowStart + 0.2, C.borrowStart + 0.4);
      rise(R.hMove, C.moveCaption, 0.5, moveOn);
      rise(R.sMove, C.moveCaption + 0.12, 0.5, moveOn);
      rise(R.hBorrow, C.borrowStart + 0.2, 0.5, borrowOn);
      rise(R.sBorrow, C.borrowStart + 0.35, 0.5, borrowOn);
      rise(R.sOk, C.stamp, 0.4, V.p(T, C.stamp, C.stamp + 0.1) * borrowOn);

      // The wipe: a 1100 px oxide-to-hot band, skewed -18 degrees, with a 2 px molten leading edge.
      // Its leading edge is off-screen left at 31.55 and its trailing edge leaves off-screen right at 32.0
      // (inOutCubic). The band covers at most 1100 / 1920, about 57 % of the frame.
      // Everything behind the trailing edge is clipped out, so the stage shows empty --ink.
      const WIPE_W = 1100;
      const SKEW = Math.tan((18 * Math.PI) / 180); // skewX(-18deg): x = xl + SKEW * (540 - y)
      const xl = lerp(-(WIPE_W + 175), 1920 + 175, V.p(T, 31.55, C.end, E.inOutCubic));
      R.wipe.style.transform = `translate(${f(xl)}px, 0px) skewX(-18deg)`;
      const yT = -120;
      const yB = 1200;
      const xT = xl + SKEW * (540 - yT);
      const xB = xl + SKEW * (540 - yB);
      R.content.style.clipPath = `polygon(${f(xT)}px ${yT}px, 2000px ${yT}px, 2000px ${yB}px, ${f(xB)}px ${yB}px)`;
    },
  });

  // Measures the width of a display heading (120 px, 900 weight, tracking 0.02 em).
  function measure(text) {
    const c = measure.c || (measure.c = document.createElement("canvas"));
    const g = c.getContext("2d");
    g.font = '900 120px "Sofia Sans Extra Condensed", "Arial Narrow", sans-serif';
    return g.measureText(text).width + text.length * 120 * 0.02;
  }
  // A plain SVG strip for the wavy underline (zigzag, drawn in the error red).
  function svgNode(parent, w, h) {
    const s = svgEl(parent, "svg", { width: w, height: h, viewBox: `0 0 ${w} ${h}` });
    s.style.display = "block";
    s.style.overflow = "visible";
    let d = "M0 6";
    for (let x = 0; x < w; x += 8) d += ` L${x + 4} 1 L${x + 8} 6`;
    const p = svgEl(s, "path", { d, fill: "none", "stroke-width": 3 });
    p.style.stroke = "var(--error)";
    return s;
  }
})();
