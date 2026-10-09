/* S2 · THE WALL (8 - 16 s), DIRECTION.md section 3.
   Twelve real rustc 1.97 errors slam in on the beat and pile into a wall.
   Three giant words hard-cut in: OWNERSHIP. BORROWING. LIFETIMES.
   Then a hard cut to black and one molten spark breathing before the forge. */
(function () {
  "use strict";

  const P = V.p;
  const E = V.ease;
  const lerp = V.lerp;

  // The 12 cards, in order. Each message is the first line rustc 1.97 printed
  // for a tiny program that triggers it (compiled in the scratch folder).
  const ERRORS = [
    ["E0382", "borrow of moved value: `name`"],
    ["E0499", "cannot borrow `v` as mutable more than once at a time"],
    ["E0502", "cannot borrow `v` as mutable because it is also borrowed as immutable"],
    ["E0597", "`x` does not live long enough"],
    ["E0106", "missing lifetime specifier"],
    ["E0505", "cannot move out of `s` because it is borrowed"],
    ["E0507", "cannot move out of `*r` which is behind a shared reference"],
    ["E0384", "cannot assign twice to immutable variable `x`"],
    ["E0373", "closure may outlive the current function, but it borrows `v`, which is owned by the current function"],
    ["E0716", "temporary value dropped while borrowed"],
    ["E0277", "`Rc<i32>` cannot be sent between threads safely"],
    ["E0308", "mismatched types"],
  ];
  const CARD_TIMES = [8.0, 8.5, 9.0, 9.5, 10.5, 11.0, 11.5, 12.5, 13.0, 13.5, 14.5, 15.0];
  const WORDS = [
    { text: "OWNERSHIP.", a: 10.0, b: 12.0 },
    { text: "BORROWING.", a: 12.0, b: 14.0 },
    { text: "LIFETIMES.", a: 14.0, b: 15.5 },
  ];
  const WORD_TIMES = [10.0, 12.0, 14.0];
  const WALL_END = 15.5; // @breath: hard cut to black
  const CARD_W = 460;

  // The center 900 x 260 box (x 510..1410, y 410..670) stays clear of cards.
  // Cards live in two bands: above it (y 84..380) and below it (y 700..1008).
  const CSS = `
.s2-bg, .s2-cam, .s2-flash, .s2-breath-bg { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; }
.s2-card { position: absolute; left: 0; top: 0; width: ${CARD_W}px; padding: 18px 26px 18px 30px; background: var(--ink-2); border-left: 6px solid var(--error); border-radius: 4px; box-shadow: 0 16px 40px rgba(0,0,0,0.5); font: 500 30px/1.36 var(--font-mono); color: var(--cream); opacity: 0; }
.s2-card .id { color: var(--error); font-weight: 700; }
.s2-plate { position: absolute; left: 0; top: 360px; width: 1920px; height: 360px; background: rgba(11,13,16,0.85); }
.s2-word { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; display: flex; align-items: center; justify-content: center; }
.s2-word .t { font: 900 200px/1 var(--font-display); letter-spacing: 0.02em; text-transform: uppercase; color: var(--cream); white-space: pre; }
.s2-spark { position: absolute; border-radius: 50%; background: radial-gradient(circle, #fff4e3 0%, #ffd38a 30%, #ff8a3d 58%, rgba(255,138,61,0) 74%); }
`;

  let st = null;

  function build(layer) {
    const style = document.createElement("style");
    style.id = "s2-css";
    style.textContent = CSS;
    document.head.appendChild(style);

    layer.innerHTML = `
      <div class="s2-bg"></div>
      <div class="s2-cam"><div class="s2-cards"></div><div class="s2-plate"></div><div class="s2-words"></div></div>
      <div class="s2-flash"></div>
      <div class="s2-breath-bg"></div>
      <div class="s2-spark"></div>`;
    const q = (s) => layer.querySelector(s);
    const cardsEl = q(".s2-cards");
    const wordsEl = q(".s2-words");

    // Measure cards while the layer is shown (layout needs a displayed box),
    // then place each by seeded rejection sampling: anywhere on the screen,
    // outside the center box, and clear of the cards already placed.
    const prev = layer.style.display;
    layer.style.display = "block";
    const rnd = V.rand(20261009);
    const placed = [];
    const CENTER = { x0: 510 - 30, y0: 410 - 30, x1: 1410 + 30, y1: 670 + 30 };
    const hit = (a, b) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
    const area = (a, b) => Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0)) * Math.max(0, Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0));
    const cards = ERRORS.map(([code, msg], i) => {
      const el = document.createElement("div");
      el.className = "s2-card";
      const id = document.createElement("span");
      id.className = "id";
      id.textContent = `error[${code}]:`;
      el.appendChild(id);
      el.appendChild(document.createTextNode(" " + msg));
      cardsEl.appendChild(el);
      const h = el.offsetHeight;
      const r = (rnd() * 2 - 1) * 4;
      const m = 26; // rotation margin
      let best = null, bestOv = Infinity;
      for (let k = 0; k < 500 && !best; k++) {
        const x = 84 + rnd() * (1920 - 168 - CARD_W);
        const y = 72 + rnd() * (1008 - 72 - h);
        const box = { x0: x - m, y0: y - m, x1: x + CARD_W + m, y1: y + h + m };
        if (hit(box, CENTER)) continue;
        let ov = 0;
        for (const q of placed) ov += area(box, q);
        if (ov === 0) best = { x, y, box };
        else if (ov < bestOv) { bestOv = ov; best = { x, y, box }; }
      }
      if (!best) best = { x: 96, y: 84, box: { x0: 0, y0: 0, x1: 0, y1: 0 } };
      placed.push({ x0: best.box.x0 - 10, y0: best.box.y0 - 10, x1: best.box.x1 + 10, y1: best.box.y1 + 10 });
      return { el, x: best.x, y: best.y, r, t: CARD_TIMES[i] };
    });
    layer.style.display = prev;

    const words = WORDS.map((w) => {
      const el = document.createElement("div");
      el.className = "s2-word";
      el.innerHTML = `<div class="t"></div>`;
      el.querySelector(".t").textContent = w.text;
      wordsEl.appendChild(el);
      return { el, inner: el.querySelector(".t"), ...w };
    });

    // Sparks: one breathing spark in the center during the breath.
    st = {
      q, cards, words,
      bg: q(".s2-bg"), cam: q(".s2-cam"), plate: q(".s2-plate"), flash: q(".s2-flash"),
      breathBg: q(".s2-breath-bg"), spark: q(".s2-spark"), cardsEl, wordsEl,
    };
    st.bgEl = st.bg;
  }

  function render(t, layer, T) {
    if (!st) return;
    const { cards, words, bg, cam, plate, flash, breathBg, spark } = st;

    // Breath: 15.5 - 16.0. Pure black, with one spark growing from 4 to 10 px.
    if (T >= WALL_END) {
      cam.style.display = "none";
      flash.style.opacity = "0";
      breathBg.style.background = "#000000";
      breathBg.style.display = "block";
      const r = lerp(4, 10, P(T, WALL_END, 16.0, E.inOutSine));
      spark.style.display = "block";
      spark.style.left = 960 - r + "px";
      spark.style.top = 540 - r + "px";
      spark.style.width = 2 * r + "px";
      spark.style.height = 2 * r + "px";
      spark.style.boxShadow = `0 0 ${(r * 3).toFixed(2)}px ${(r * 0.9).toFixed(2)}px rgba(255,138,61,0.55)`;
      bg.style.background = "#000000";
      return;
    }

    cam.style.display = "block";
    breathBg.style.display = "none";
    spark.style.display = "none";
    bg.style.background = V.mixColor(V.pal.ink, "#2a0b0b", P(T, 8.0, 15.0));

    // Camera: level, then a slow roll from 0 to -1 deg (12-14 s), then -1 to +1 (14-15.5 s).
    let rot = 0;
    if (T >= 12.0 && T < 14.0) rot = lerp(0, -1, P(T, 12.0, 14.0, E.inOutSine));
    else if (T >= 14.0) rot = lerp(-1, 1, P(T, 14.0, WALL_END, E.linear));

    // Shake: 6 px on each card, 10 px on each word, and a jitter that builds 2 -> 8 px over 14 - 15.5 s.
    const sc = V.shake(T, CARD_TIMES, 6, 0.35);
    const sw = V.shake(T, WORD_TIMES, 10, 0.35);
    let bx = 0, by = 0;
    if (T >= 14.0) {
      const A = lerp(2, 8, P(T, 14.0, WALL_END, E.linear));
      bx = A * Math.sin(2 * Math.PI * 41 * T);
      by = A * 0.8 * Math.cos(2 * Math.PI * 37 * T + 1.0);
    }
    V.set(cam, { x: sc.x + sw.x + bx, y: sc.y + sw.y + by, r: rot, origin: "50% 50%" });

    // Cards: scale 1.18 -> 1 and fade in over 120 ms (outQuad). Older cards dim to 60 %.
    cards.forEach((c, i) => {
      const TF = 1 / V.FPS; // the cue frame already shows the first step of the slam
      const e = P(T + TF, c.t, c.t + 0.12, E.outQuad);
      const a = P(T + TF, c.t, c.t + 0.12, E.linear);
      // Older cards dim by brightness (they stay opaque, so they still cover what is below).
      const dim = i < cards.length - 1 ? lerp(1, 0.6, P(T, cards[i + 1].t, cards[i + 1].t + 0.15, E.linear)) : 1;
      V.set(c.el, { x: c.x, y: c.y, r: c.r, s: lerp(1.18, 1, e), o: a, origin: "50% 50%" });
      c.el.style.filter = (dim < 1 ? `brightness(${dim.toFixed(3)})` : "none");
    });

    // The plate and the giant words: each word is a hard cut, drifting 1.00 -> 1.04.
    plate.style.display = T >= WORDS[0].a ? "block" : "none";
    words.forEach((w) => {
      const on = T >= w.a && T < w.b;
      w.el.style.display = on ? "flex" : "none";
      if (on) V.set(w.inner, { s: lerp(1, 1.04, (T - w.a) / (w.b - w.a)) });
    });

    // White flash on each word hit, opacity 0.35 -> 0 over 150 ms.
    flash.style.background = "#ffffff";
    flash.style.opacity = String(V.flash(T, WORD_TIMES, 0.15, 0.35));
  }

  V.scene({
    id: "s2",
    start: 8,
    end: 16,
    setup: build,
    render: render,
  });
})();
