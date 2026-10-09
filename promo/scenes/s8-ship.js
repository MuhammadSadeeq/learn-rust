/* S8 · SHIP IT, the end card (56 - 64 s), DIRECTION.md section 3.
   The harness runs in a terminal. The lines are the real protocol of projects/tool-runner:
   - the command is the README's (cargo run -- "What is 6 times 7?");
   - "tool_use" is the block the mock streams (src/protocol.rs, examples/mock_server.rs):
     name "calculator", input {"a":6,"b":7,"op":"mul"} (serde_json sorts the keys);
   - "tool_result 42" is the content of the tool_result block: Calculator::compute
     returns "42" for 6 * 7 (src/tools/calculator.rs);
   - the answer is what the demo prints on stdout: "6 times 7 is 42.", streamed as the
     mock's two text deltas, "6 times 7 " and "is 42.".
   The end card: OXIDIZE forged again, the graduate Oxi on the logo, and the counts
   from the course (21 chapters, 88 quests, 231 terms, 5 bosses). */
(function () {
  "use strict";

  const clamp = V.clamp;
  const P = V.p;
  const E = V.ease;
  const cue = (k, d) => (V.cue && V.cue[k] !== undefined ? V.cue[k] : d);
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const CMD = `cargo run -- "What is 6 times 7?"`;
  const TERM = { x: 310, y: 290, w: 1300, h: 600 };
  const DELTAS = ["6 times 7 ", "is 42."];

  // Sparks: a seeded burst from the logo's centre.
  const rnd = V.rand(20260709);
  const SPARKS = Array.from({ length: 64 }, () => {
    const a = -Math.PI / 2 + (rnd() - 0.5) * Math.PI * 1.6;
    const sp = 380 + rnd() * 760;
    return { vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.8 + rnd() * 0.6, size: 3 + rnd() * 6 };
  });

  // Streaks that converge on the centre during the collapse (58 - 60).
  const STREAKS = Array.from({ length: 46 }, (_, i) => {
    const a = (i / 46) * Math.PI * 2 + rnd() * 0.2;
    return { a, r0: 760 + rnd() * 420, len: 150 + rnd() * 160, w: 2 + rnd() * 3 };
  });

  const CSS = `
.s8-bg { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; background: var(--ink);
  background: radial-gradient(ellipse 60% 55% at 50% 50%, #161a21 0%, #0b0d10 70%); }
.s8-glow { position: absolute; left: 960px; top: 540px; width: 1400px; height: 1400px; margin: -700px 0 0 -700px; border-radius: 50%;
  background: radial-gradient(circle, rgba(255,138,61,0.55) 0%, rgba(232,89,12,0.25) 30%, rgba(232,89,12,0) 65%); }
.s8-streak { position: absolute; left: 0; top: 0; height: 3px; border-radius: 2px;
  background: linear-gradient(90deg, rgba(255,138,61,0), #ff8a3d 70%, #ffd38a); transform-origin: 0 50%; }
.s8-group { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; transform-origin: 50% 50%; }
.s8-cap1 { position: absolute; left: 0; top: 92px; width: 1920px; text-align: center; white-space: nowrap;
  font: 900 140px/1 var(--font-display); text-transform: uppercase; letter-spacing: 0.02em; color: var(--cream); }
.s8-cap2 { position: absolute; left: 0; top: 930px; width: 1920px; text-align: center; white-space: nowrap;
  font: 400 44px/1.2 var(--font-body); color: var(--cream); }
.s8-term { position: absolute; left: ${TERM.x}px; top: ${TERM.y}px; width: ${TERM.w}px; height: ${TERM.h}px;
  background: #0d1117; border: 1px solid var(--steel); border-radius: 18px; overflow: hidden;
  box-shadow: 0 40px 120px rgba(0,0,0,0.6), 0 0 90px rgba(232,89,12,0.08); }
.s8-bar { position: absolute; left: 0; top: 0; width: 100%; height: 58px; border-bottom: 1px solid #1c232c; }
.s8-bar i { position: absolute; top: 21px; width: 16px; height: 16px; border-radius: 50%; background: #39414b; }
.s8-bar span { position: absolute; left: 0; right: 0; top: 14px; text-align: center; font: 500 28px/30px var(--font-mono); color: #7d8792; }
.s8-body { position: absolute; left: 50px; top: 100px; width: 1200px; height: 460px; overflow: hidden;
  font: 500 32px/46px var(--font-mono); color: #e9e4da; white-space: pre; font-variant-ligatures: none; font-feature-settings: "liga" 0, "calt" 0; }
.s8-body .l { height: 46px; white-space: pre; }
.s8-body .c-ok { color: var(--ok); }
.s8-body .c-ox { color: var(--oxide); }
.s8-body .c-cy { color: #5fd0e6; }
.s8-body .c-mol { color: var(--molten); }
.s8-body .c-dim { color: var(--muted); }
.s8-body .c-b { font-weight: 700; color: #fff4e3; }
.s8-caret { display: inline-block; width: 0.56em; height: 1em; background: var(--oxide); vertical-align: -0.14em; }
.s8-end { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; }
.s8-logo { position: absolute; left: 0; top: 300px; width: 1920px; text-align: center; white-space: nowrap;
  font: 900 260px/1 var(--font-display); text-transform: uppercase; letter-spacing: 0.02em; color: var(--oxide);
  text-shadow: 0 0 36px rgba(255,138,61,0.65), 0 0 110px rgba(232,89,12,0.45); }
.s8-oxi { position: absolute; left: 0; top: 0; width: 230px; height: 230px; }
.s8-oxi > .ca { width: 230px; height: 230px; display: block; }
.s8-oxi > .ca > .ca-svg { width: 230px; height: 230px; }
.s8-tag { position: absolute; left: 0; top: 640px; width: 1920px; text-align: center; white-space: nowrap;
  font: 900 64px/1 var(--font-display); text-transform: uppercase; letter-spacing: 0.12em; color: var(--cream); }
.s8-sub { position: absolute; left: 0; top: 740px; width: 1920px; text-align: center; white-space: nowrap;
  font: 400 34px/1.2 var(--font-body); color: var(--muted); }
.s8-spark { position: absolute; left: 0; top: 0; border-radius: 50%; background: radial-gradient(circle, #fff4e3 0%, #ffd38a 35%, #ff8a3d 70%, rgba(232,89,12,0) 100%); }
.s8-flash { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; background: #ffd38a; pointer-events: none; }
.s8-fade { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; background: #000; pointer-events: none; }
`;

  // The terminal: the command types (56.0 - 56.6), then the stream (streamStart 56.6 - streamEnd 57.8).
  // tool_use at 56.6, tool_result 0.4 s later, and the two text deltas of the answer after that.
  function termHTML(T) {
    const rows = [];
    const row = (html, caret) => `<div class="l">${html}${caret ? `<span class="s8-caret"></span>` : ""}</div>`;
    const cmdAt = cue("harness", 56.0);
    const streamAt = cue("streamStart", 56.6);
    const streamEnd = cue("streamEnd", 57.8);
    const n = Math.round(P(T, cmdAt, cmdAt + 0.6) * CMD.length);
    const blinkOn = Math.floor(T / 0.25) % 2 === 0;
    const cmdCaret = n < CMD.length || (T < streamAt && blinkOn);
    rows.push(row(`<span class="c-ok">$</span> ${esc(CMD.slice(0, n))}`, cmdCaret));
    if (T >= streamAt) {
      rows.push(row(`<span class="c-cy">→</span> <span class="c-ox">tool_use</span>  <span class="c-b">calculator</span> <span class="c-dim">{"a":6,"b":7,"op":"mul"}</span>`, false));
    }
    const resultAt = streamAt + 0.4;
    if (T >= resultAt) {
      rows.push(row(`<span class="c-dim">←</span> <span class="c-mol">tool_result</span> <span class="c-b">42</span>`, false));
    }
    // the answer: each text delta from the mock is typed as it arrives (SSE feel)
    const d0 = resultAt + 0.3;
    const d1 = d0 + 0.3;
    if (T >= d0) {
      const a = Math.round(P(T, d0, d0 + 0.2) * DELTAS[0].length);
      const b = Math.round(P(T, d1, d1 + 0.22) * DELTAS[1].length);
      const answer = DELTAS[0].slice(0, a) + DELTAS[1].slice(0, b);
      const streaming = T < streamEnd + 0.2;
      rows.push(row(`<span class="c-b">${esc(answer)}</span>`, streaming && blinkOn));
    }
    return rows.join("");
  }

  V.scene({
    id: "s8",
    start: 56,
    end: 64,
    setup(layer) {
      if (!document.getElementById("s8-css")) {
        const st = document.createElement("style");
        st.id = "s8-css";
        st.textContent = CSS;
        document.head.appendChild(st);
      }
      const streaks = STREAKS.map((s, i) => `<div class="s8-streak" data-streak="${i}"></div>`).join("");
      const sparks = SPARKS.map((s, i) => `<div class="s8-spark" data-spark="${i}"></div>`).join("");
      layer.innerHTML = `
        <div class="s8-bg"></div>
        <div class="s8-glow" data-k="glow"></div>
        <div class="s8-streaks">${streaks}</div>
        <div class="s8-group" data-k="group">
          <div class="s8-cap1" data-k="cap1">BUILD WHAT'S NEXT.</div>
          <div class="s8-term" data-k="term">
            <div class="s8-bar"><i style="left:22px"></i><i style="left:50px"></i><i style="left:78px"></i><span>~/learn-rust/projects/tool-runner</span></div>
            <div class="s8-body" data-k="body"></div>
          </div>
          <div class="s8-cap2" data-k="cap2">Your capstone: an AI agent harness, in Rust.</div>
        </div>
        <div class="s8-end" data-k="end">
          <div class="s8-logo" data-k="logo">OXIDIZE</div>
          <div class="s8-oxi" data-k="oxi">${V.cast("graduate")}</div>
          <div class="s8-sparks">${sparks}</div>
          <div class="s8-tag" data-k="tag">THE RUST COURSE YOU CAN SEE.</div>
          <div class="s8-sub" data-k="sub">For PHP &amp; Laravel developers · 21 chapters · 88 quests · real compiler</div>
        </div>
        <div class="s8-flash" data-k="flash"></div>
        <div class="s8-fade" data-k="fade"></div>`;
    },
    render(t, layer, T) {
      const q = (k) => layer.querySelector(`[data-k="${k}"]`);
      const group = q("group");
      const end = q("end");
      const term = q("term");
      const body = q("body");

      // The harness: the terminal and its captions, then the collapse (58 - 60) into the centre.
      const collapse = P(T, cue("collapse", 58.0), cue("finalHit", 60.0), E.inExpo);
      const shrink = 1 - collapse;
      V.set(group, { s: Math.max(0.0001, shrink), origin: "50% 50%", o: T >= cue("finalHit", 60.0) ? 0 : 1 });
      const cap1 = q("cap1");
      const cap1In = P(T, 56.0, 56.5, E.outExpo);
      V.set(cap1, { y: 40 * (1 - cap1In), o: cap1In });
      const cap2 = q("cap2");
      const cap2In = P(T, cue("harnessCaption", 57.0), cue("harnessCaption", 57.0) + 0.5, E.outExpo);
      V.set(cap2, { y: 30 * (1 - cap2In), o: cap2In });
      // the terminal pops in at 56.0 (a short rise), then keeps a slow drift
      const termIn = P(T, 56.0, 56.45, E.outExpo);
      V.set(term, { y: 36 * (1 - termIn) + 4 * Math.sin(T * 0.9), o: termIn });
      const html = termHTML(T);
      if (body.dataset.last !== html) {
        body.dataset.last = html;
        body.innerHTML = html;
      }

      // The collapse: streaks converge on the centre (58 - 60), and the glow grows with the hum.
      const cp = P(T, cue("collapse", 58.0), cue("finalHit", 60.0), E.inCubic);
      const glow = q("glow");
      const gIn = P(T, cue("collapse", 58.0), cue("finalHit", 60.0), E.inQuad);
      V.set(glow, { s: 0.5 + 0.9 * gIn, o: 0.35 + 0.65 * gIn, origin: "50% 50%" });
      layer.querySelectorAll("[data-streak]").forEach((el, i) => {
        const s = STREAKS[i];
        const r = s.r0 * (1 - cp);
        const x = 960 + Math.cos(s.a) * r;
        const y = 540 + Math.sin(s.a) * r;
        const len = Math.min(s.len, r * 0.45);
        const life = P(T, cue("collapse", 58.0), cue("collapse", 58.0) + 0.3) * (1 - P(T, 59.7, 60.0));
        el.style.width = `${Math.max(0, len).toFixed(2)}px`;
        el.style.height = `${s.w.toFixed(2)}px`;
        el.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) rotate(${((s.a * 180) / Math.PI).toFixed(2)}deg)`;
        el.style.opacity = String(clamp(life, 0, 1).toFixed(3));
      });
      // The streak layer is hidden after the final hit, where the logo takes over.
      layer.querySelector(".s8-streaks").style.display = T >= cue("finalHit", 60.0) ? "none" : "block";

      // The end card: flash (60.0), the logo, the graduate Oxi on the logo, sparks, shake.
      const fT = cue("finalHit", 60.0);
      const flash = q("flash");
      flash.style.opacity = String(V.flash(T, [fT], 0.35, 0.9));
      const endOn = T >= fT;
      end.style.display = endOn ? "block" : "none";
      if (endOn) {
        const shk = V.shake(T, [fT], 10, 0.4);
        const drift = 1 + 0.03 * P(T, 61.0, 62.5, E.inOutSine);
        const logo = q("logo");
        logo.style.transform = `translate(${shk.x}px, ${shk.y}px) scale(${drift.toFixed(4)})`;
        logo.style.transformOrigin = "50% 50%";
        logo.style.opacity = "1";
        // Oxi lands on the logo's top right (outBack), and blinks once at 61.8.
        const oxi = q("oxi");
        const pop = P(T, fT + 0.05, fT + 0.5, E.outBack);
        const bob = P(T, fT + 0.5, fT + 0.9, E.outBack) - 1;
        V.set(oxi, { x: 1180 + shk.x * 0.5, y: 124 + shk.y * 0.5 - 14 * bob, s: pop, origin: "50% 100%" });
        const blink = Math.abs(T - 61.8) < 0.07 ? 0.12 : 1;
        oxi.querySelectorAll(".ca-eye").forEach((e) => {
          e.style.transformBox = "fill-box";
          e.style.transformOrigin = "center";
          e.style.transform = `scaleY(${blink})`;
        });
        // sparks burst from the logo centre, ballistic, shrinking and fading over 0.8 - 1.4 s
        layer.querySelectorAll("[data-spark]").forEach((el, i) => {
          const s = SPARKS[i];
          const dt = T - fT;
          const cx = 960 + shk.x * 0.3;
          const cy = 560 + shk.y * 0.3;
          if (dt < 0 || dt > s.life) {
            el.style.opacity = "0";
            return;
          }
          const x = cx + s.vx * dt;
          const y = cy + s.vy * dt + 0.5 * 1500 * dt * dt;
          const k = 1 - dt / s.life;
          el.style.width = `${(s.size * k + 1).toFixed(2)}px`;
          el.style.height = `${(s.size * k + 1).toFixed(2)}px`;
          el.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px)`;
          el.style.opacity = String(clamp(k * 1.4, 0, 1).toFixed(3));
        });
        const tag = q("tag");
        const tagIn = P(T, cue("endTagline", 60.5), cue("endTagline", 60.5) + 0.5, E.outExpo);
        V.set(tag, { y: 40 * (1 - tagIn), o: tagIn });
        const sub = q("sub");
        const subIn = P(T, cue("endSub", 61.0), cue("endSub", 61.0) + 0.5, E.outExpo);
        V.set(sub, { y: 24 * (1 - subIn), o: subIn });
      }

      // The master fade to black (62.5 - 64.0).
      const fade = q("fade");
      const fadeOp = P(T, cue("fadeOut", [62.5, 64.0])[0], cue("fadeOut", [62.5, 64.0])[1], E.linear);
      fade.style.opacity = String(fadeOp.toFixed(4));
    },
  });

})();
