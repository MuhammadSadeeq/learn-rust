/* S1 · INVISIBLE (0 - 8 s), DIRECTION.md section 3.
   Raw code on black. The code types itself, the compiler says no (E0382),
   then the words arrive: RUST ISN'T HARD. / IT'S INVISIBLE. They dissolve.
   Every value is a pure function of T. */
(function () {
  "use strict";

  const P = V.p;
  const E = V.ease;
  const lerp = V.lerp;

  // Monospace cell: JetBrains Mono at 46 px, advance 0.6em = 27.6 px.
  const CW = 27.6;
  const LH = 65; // code line height
  const CX = 220; // code left
  const CY = 530; // code top
  const ERR_Y = 760;

  // Syntax: keywords oxide, strings molten, macros borrow.
  const LINES = [
    [["let", "kw"], [" name = String::from(", "tx"], ['"Ana"', "str"], [");", "tx"]],
    [["let", "kw"], [" other = name;", "tx"]],
    [["println!", "mac"], ["(", "tx"], ['"{name}"', "str"], [");", "tx"]],
  ];
  const TYPE_START = 0.6;
  const TYPE_END = 3.2;
  const ERR_AT = 3.5;
  const HARD_AT = 4.0;
  const INVIS_AT = 6.0;
  const DISS_AT = 7.0;
  const DISS_END = 8.0;

  const CSS = `
.s1-shake, .s1-cam, .s1-dim { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; }
.s1-bg { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; background: var(--ink); }
.s1-code { position: absolute; left: ${CX}px; top: ${CY}px; width: 1100px; height: ${LH * 3}px; font: 500 46px/${LH}px var(--font-mono); white-space: pre; }
.s1-line { height: ${LH}px; white-space: pre; }
.s1-ch { display: inline-block; width: ${CW}px; text-align: left; }
.s1-ch.k-kw { color: var(--oxide); }
.s1-ch.k-str { color: var(--molten); }
.s1-ch.k-mac { color: var(--borrow); }
.s1-ch.k-tx { color: var(--cream); }
.s1-caret { position: absolute; left: 0; top: 0; width: 25.8px; height: 44px; background: var(--oxide); }
.s1-wave { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; overflow: visible; }
.s1-err { position: absolute; left: ${CX}px; top: ${ERR_Y}px; padding: 16px 28px 16px 30px; background: var(--ink-2); border-left: 6px solid var(--error); font: 500 30px/1.3 var(--font-mono); white-space: pre; color: var(--cream); }
.s1-err .id { color: var(--error); font-weight: 700; }
.s1-h { position: absolute; left: 0; width: 1920px; text-align: center; font: 900 180px/162px var(--font-display); text-transform: uppercase; letter-spacing: 0.02em; white-space: pre; }
.s1-h1 { top: 118px; color: var(--cream); }
.s1-h2 { top: 292px; color: var(--oxide); }
.s1-h .ch { display: inline-block; }
.s1-red { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; background: var(--error); opacity: 0; }
`;

  let st = { built: false };

  function build(layer) {
    const style = document.createElement("style");
    style.id = "s1-css";
    style.textContent = CSS;
    document.head.appendChild(style);

    layer.innerHTML = `
      <div class="s1-bg"></div>
      <div class="s1-shake"><div class="s1-cam">
        <div class="s1-dim">
          <div class="s1-code"></div>
          <svg class="s1-wave" viewBox="0 0 1920 1080"><path class="w" fill="none" stroke="#ff4d4d" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="1"/></svg>
          <div class="s1-caret"></div>
          <div class="s1-err"><span class="id">error[E0382]</span>: borrow of moved value: \`name\`</div>
        </div>
        <div class="s1-h s1-h1"></div>
        <div class="s1-h s1-h2"></div>
      </div></div>
      <div class="s1-red"></div>`;

    const q = (s) => layer.querySelector(s);
    const code = q(".s1-code");
    const chars = [];
    LINES.forEach((line, li) => {
      const d = document.createElement("div");
      d.className = "s1-line";
      code.appendChild(d);
      let col = 0;
      for (const [text, cls] of line) {
        for (const c of text) {
          const s = document.createElement("span");
          s.className = "s1-ch k-" + cls;
          s.textContent = c === " " ? " " : c;
          d.appendChild(s);
          chars.push({ el: s, li, col, vis: null });
          col++;
        }
      }
    });

    // The underline sits under {name} on line 3: cols 10..15.
    const x0 = CX + 10 * CW;
    const x1 = CX + 16 * CW;
    const y = CY + 2 * LH + 55;
    let d = "";
    for (let x = x0, k = 0; x <= x1; x += 3.5, k++) d += (k === 0 ? "M" : "L") + x.toFixed(1) + " " + (y + (k % 2 ? -4 : 4)).toFixed(1) + " ";
    q(".s1-wave .w").setAttribute("d", d);

    // The two display lines, one span per letter.
    const h1 = V.chars(q(".s1-h1"), "RUST ISN'T HARD.");
    const h2 = V.chars(q(".s1-h2"), "IT'S INVISIBLE.");

    // Seeded dissolve order over every visible letter of both lines.
    const letters = [];
    h1.forEach((el, i) => { if (el.textContent !== " ") letters.push({ el, i, line: 1 }); });
    h2.forEach((el, i) => { if (el.textContent !== " ") letters.push({ el, i, line: 2 }); });
    const order = letters.map((_, k) => k);
    const rnd = V.rand(1942);
    for (let k = order.length - 1; k > 0; k--) {
      const j = Math.floor(rnd() * (k + 1));
      [order[k], order[j]] = [order[j], order[k]];
    }
    const N = letters.length;
    letters.forEach((L, k) => {
      L.dissolveAt = DISS_AT + (order[k] / N) * (DISS_END - DISS_AT - 0.4);
    });

    st = { built: true, layer, q, chars, letters, caretEl: q(".s1-caret"), wave: q(".s1-wave .w"), err: q(".s1-err"), dim: q(".s1-dim"), cam: q(".s1-cam"), shake: q(".s1-shake"), red: q(".s1-red"), total: chars.length };
  }

  // Caret cell for n typed characters.
  function caretCell(n) {
    const { chars } = st;
    if (n < chars.length) return { col: chars[n].col, li: chars[n].li };
    const last = chars[chars.length - 1];
    return { col: last.col + 1, li: last.li };
  }

  function render(t, layer, T) {
    if (!st.built) return;
    const { chars, letters, caretEl, wave, err, dim, cam, shake, red, total } = st;

    // Camera: a slow push, scale 1.00 -> 1.06 over the scene.
    V.set(cam, { s: lerp(1, 1.06, T / 8), origin: "50% 50%" });

    // Screen shake and red flash at the error.
    const sh = V.shake(T, [ERR_AT], 6, 0.35);
    const TF = 1 / V.FPS; // a cue's frame shows the first step of its entrance
    V.set(shake, { x: sh.x, y: sh.y });
    red.style.opacity = String(V.flash(T, [ERR_AT], 0.3, 0.1));

    // Typewriter, with the block caret following it.
    const typed = P(T, TYPE_START, TYPE_END, E.linear);
    const n = Math.round(typed * total);
    for (let i = 0; i < chars.length; i++) {
      const c = chars[i];
      const v = i < n ? "visible" : "hidden";
      if (c.vis !== v) {
        c.el.style.visibility = v;
        c.vis = v;
      }
    }
    const cell = caretCell(n);
    const typing = T >= TYPE_START && T < TYPE_END;
    const blinkOn = typing ? true : Math.floor(T / 0.25) % 2 === 0;
    caretEl.style.display = blinkOn ? "block" : "none";
    V.set(caretEl, { x: CX + cell.col * CW, y: CY + cell.li * LH + 10 });

    // The red wave draws under {name}, in 0.3 s from the error.
    wave.style.strokeDashoffset = String(1 - P(T + TF, ERR_AT, ERR_AT + 0.25, E.outCubic));

    // The compiler block slides up 24 px and fades in.
    const ein = P(T + TF, ERR_AT, ERR_AT + 0.4, E.outExpo);
    err.style.opacity = String(P(T + TF, ERR_AT, ERR_AT + 0.12, E.linear));
    V.set(err, { y: 24 * (1 - ein) });

    // The code dims to 35 %, then to 8 % during the dissolve.
    let d = T < HARD_AT ? 1 : lerp(1, 0.35, P(T, HARD_AT, HARD_AT + 0.3, E.inOutSine));
    if (T >= DISS_AT) d = lerp(0.35, 0.08, P(T, DISS_AT, DISS_END, E.linear));
    dim.style.opacity = String(d);

    // Display letters: rise 40 px with outExpo, 22 ms apart; then dissolve one by one.
    for (const L of letters) {
      const start = L.line === 1 ? HARD_AT + L.i * 0.022 : INVIS_AT + L.i * 0.022;
      const e = P(T, start, start + 0.55, E.outExpo);
      const dd = P(T, L.dissolveAt, L.dissolveAt + 0.4, E.inQuad);
      V.set(L.el, { y: 40 * (1 - e), o: e * (1 - dd), blur: 8 * dd });
    }
  }

  V.scene({
    id: "s1",
    start: 0,
    end: 8,
    setup: build,
    render: render,
  });
})();
