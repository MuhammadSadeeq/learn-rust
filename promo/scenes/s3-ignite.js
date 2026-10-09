/* S3 · IGNITION (16 - 24 s), DIRECTION.md section 3. The signature moment.
   16.0: an anvil strike. A molten-then-white flash, the word OXIDIZE is forged
   letter by letter from the center out (white -> molten -> hot -> oxide), 120
   seeded sparks arc up under gravity, a 14 px shake, and an oxide underline grows.
   18.0: Oxi pops onto the logo and hops. The subtitle and tagline arrive.
   22.0 - 24.0: the camera dives into the counter of the O and cuts to S4. */
(function () {
  "use strict";

  const P = V.p;
  const E = V.ease;
  const lerp = V.lerp;
  const clamp = V.clamp;

  const IMPACT = 16.0;
  const OXI_POP = 18.0;
  const SUB_AT = 18.0;
  const TAG_AT = 20.0;
  const ZOOM_A = 22.0;
  const ZOOM_B = 24.0;
  const WORD = "OXIDIZE";
  const CENTER_I = 3; // the D
  const GRAV = 1900; // px/s^2
  const SPARKS = 120;
  const HOT_WHITE = "#ffffff";

  // Heat: white -> molten -> hot -> oxide, dt seconds after the letter is struck.
  function heat(dt) {
    const m = V.pal;
    if (dt < 0.12) return V.mixColor(HOT_WHITE, m.molten, dt / 0.12);
    if (dt < 0.45) return V.mixColor(m.molten, m.hot, (dt - 0.12) / 0.33);
    if (dt < 0.9) return V.mixColor(m.hot, m.oxide, (dt - 0.45) / 0.45);
    return m.oxide;
  }

  const CSS = `
.s3-bg, .s3-flash { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; }
.s3-bg { background: var(--ink); }
.s3-cam { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; }
.s3-logo, .s3-glow { position: absolute; left: 0; top: 300px; width: 1920px; height: 270px; text-align: center; font: 900 300px/270px var(--font-display); letter-spacing: 0.06em; text-transform: uppercase; white-space: pre; }
.s3-logo .ch { display: inline-block; }
.s3-glow { color: var(--oxide); filter: blur(34px); opacity: 0; }
.s3-uline { position: absolute; left: 410px; top: 604px; width: 1100px; height: 6px; background: var(--oxide); box-shadow: 0 0 18px 2px rgba(255,138,61,0.55); }
.s3-oxi { position: absolute; left: 1392px; top: 172px; width: 200px; height: 170px; display: none; }
.s3-oxi .ca { display: block; width: 200px; height: 170px; }
.s3-wrap { position: absolute; left: 0; width: 1920px; display: flex; justify-content: center; }
.s3-sub { font: 800 72px/1.1 var(--font-display); letter-spacing: 0.12em; text-transform: uppercase; color: var(--cream); white-space: pre; }
.s3-tag { font: 400 40px/1.2 var(--font-body); color: var(--muted); white-space: pre; }
.s3-sparks { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; overflow: visible; }
`;

  let st = null;

  function build(layer) {
    const style = document.createElement("style");
    style.id = "s3-css";
    style.textContent = CSS;
    document.head.appendChild(style);

    layer.innerHTML = `
      <div class="s3-bg"></div>
      <div class="s3-cam">
        <div class="s3-glow">${WORD}</div>
        <div class="s3-logo"></div>
        <div class="s3-uline"></div>
        <div class="s3-oxi"></div>
        <div class="s3-wrap" style="top:660px"><div class="s3-sub">THE RUST COURSE YOU CAN SEE.</div></div>
        <div class="s3-wrap" style="top:772px"><div class="s3-tag">Made for PHP &amp; Laravel developers.</div></div>
        <svg class="s3-sparks" viewBox="0 0 1920 1080"></svg>
      </div>
      <div class="s3-flash"></div>`;
    const q = (s) => layer.querySelector(s);
    const logo = q(".s3-logo");
    const letters = V.chars(logo, WORD);
    q(".s3-glow").textContent = WORD;

    // Measure the O's box (layout needs the layer displayed).
    const prev = layer.style.display;
    layer.style.display = "block";
    const o = letters[0];
    const oCx = o.offsetLeft + o.offsetWidth / 2;
    const oCy = 300 + o.offsetTop + o.offsetHeight / 2;
    layer.style.display = prev;

    // Oxi, the course's own character.
    const oxi = q(".s3-oxi");
    oxi.innerHTML = V.cast("oxi", {});

    // Sparks: 120 seeded arcs. Each one is a bright core and a soft halo.
    const svg = q(".s3-sparks");
    const NS = "http://www.w3.org/2000/svg";
    svg.innerHTML = `<defs><radialGradient id="s3-halo"><stop offset="0" stop-color="#ffd38a" stop-opacity="0.9"/><stop offset="0.35" stop-color="#ff8a3d" stop-opacity="0.45"/><stop offset="1" stop-color="#e8590c" stop-opacity="0"/></radialGradient></defs>`;
    const rnd = V.rand(1616);
    const sparks = [];
    for (let i = 0; i < SPARKS; i++) {
      const halo = document.createElementNS(NS, "circle");
      const core = document.createElementNS(NS, "circle");
      halo.setAttribute("fill", "url(#s3-halo)");
      core.setAttribute("fill", V.mixColor(V.pal.molten, V.pal.hot, rnd()));
      svg.appendChild(halo);
      svg.appendChild(core);
      sparks.push({
        halo,
        core,
        fill: core.getAttribute("fill"),
        x0: 960 + (rnd() - 0.5) * 260,
        y0: 600 + rnd() * 40,
        vx: (rnd() - 0.5) * 1300,
        vy: -(600 + rnd() * 1000),
        L: 0.5 + rnd() * 0.7,
        r0: 3.5 + rnd() * 4.5,
        d: rnd() * 0.03,
      });
    }

    st = {
      q, letters, sparks, oxi, oCx, oCy,
      cam: q(".s3-cam"),
      glow: q(".s3-glow"),
      uline: q(".s3-uline"),
      sub: q(".s3-sub"),
      tag: q(".s3-tag"),
      subWrap: layer.querySelectorAll(".s3-wrap")[0],
      tagWrap: layer.querySelectorAll(".s3-wrap")[1],
      flash: q(".s3-flash"),
    };
  }

  // Oxi hops: 40 px up and back in 0.4 s, with a squash on landing.
  function hop(T, t0) {
    const dt = T - t0;
    if (dt < 0) return { y: 0, sq: 0 };
    if (dt < 0.4) return { y: -40 * Math.sin((Math.PI * dt) / 0.4), sq: 0 };
    if (dt < 0.52) return { y: 0, sq: 0.12 * (1 - (dt - 0.4) / 0.12) };
    return { y: 0, sq: 0 };
  }

  function render(t, layer, T) {
    if (!st) return;
    const { letters, sparks, oxi, oCx, oCy, cam, glow, uline, sub, tag, subWrap, tagWrap, flash } = st;

    // Camera: shake on the impact, then the dive into the O from 22 to 24 s.
    const sh = V.shake(T, [IMPACT], 14, 0.4);
    let z = 1;
    if (T >= ZOOM_A) z = 1 + 39 * E.inExpo(P(T, ZOOM_A, ZOOM_B, E.linear));
    const blur = T >= ZOOM_A ? 5 * P(T, ZOOM_A, 23.5, E.linear) : 0;
    V.set(cam, { x: sh.x, y: sh.y, s: z, origin: `${oCx.toFixed(1)}px ${oCy.toFixed(1)}px` });

    // The full-screen flash: molten, then white, 1 -> 0 over 300 ms.
    if (T < IMPACT || T >= IMPACT + 0.3) {
      flash.style.opacity = "0";
    } else {
      const u = P(T, IMPACT, IMPACT + 0.3, E.linear);
      flash.style.background = V.mixColor(V.pal.molten, HOT_WHITE, u);
      flash.style.opacity = String(1 - u);
    }

    // The glow behind the word decays over 1.5 s.
    const glowOn = T >= IMPACT;
    glow.style.opacity = glowOn ? String(0.95 * (1 - P(T, IMPACT, IMPACT + 1.5, E.linear))) : "0";

    // The letters: struck 40 ms apart from the D outward; each drops in, then heats and cools.
    letters.forEach((el, i) => {
      const strike = IMPACT + Math.abs(i - CENTER_I) * 0.04;
      const dt = T - strike;
      if (dt < 0) {
        el.style.visibility = "hidden";
        return;
      }
      el.style.visibility = "visible";
      el.style.color = heat(dt);
      const drop = lerp(-70, 0, E.outBack(clamp(dt / 0.35, 0, 1)));
      const sc = lerp(1.25, 1, E.outExpo(clamp(dt / 0.4, 0, 1)));
      const bl = i === 0 ? 0 : blur;
      V.set(el, { y: drop, s: sc, blur: bl });
    });

    // The underline grows from the center, 0 -> 1100 px.
    uline.style.display = T >= IMPACT ? "block" : "none";
    V.set(uline, { sx: E.outExpo(P(T, IMPACT, IMPACT + 0.6)), sy: 1, origin: "50% 50%", blur });

    // Sparks: ballistic arcs under gravity, shrinking and fading over 0.4 - 1.1 s.
    for (const s of sparks) {
      const tau = T - IMPACT - s.d;
      if (tau < 0 || tau >= s.L) {
        s.core.setAttribute("opacity", "0");
        s.halo.setAttribute("opacity", "0");
        continue;
      }
      const k = 1 - tau / s.L;
      const x = s.x0 + s.vx * tau;
      const y = s.y0 + s.vy * tau + 0.5 * GRAV * tau * tau;
      const r = s.r0 * Math.pow(k, 0.7);
      s.core.setAttribute("cx", x.toFixed(1));
      s.core.setAttribute("cy", y.toFixed(1));
      s.core.setAttribute("r", r.toFixed(2));
      s.core.setAttribute("opacity", Math.pow(k, 0.5).toFixed(3));
      s.halo.setAttribute("cx", x.toFixed(1));
      s.halo.setAttribute("cy", y.toFixed(1));
      s.halo.setAttribute("r", (r * 3.2).toFixed(2));
      s.halo.setAttribute("opacity", (0.22 * Math.pow(k, 0.6)).toFixed(3));
    }

    // Oxi pops on the logo's right side (scale 0 -> 1, outBack), then hops twice.
    const pop = P(T, OXI_POP, OXI_POP + 0.45, E.outBack);
    if (T < OXI_POP) {
      oxi.style.display = "none";
    } else {
      oxi.style.display = "block";
      const h1 = hop(T, 18.5);
      const h2 = hop(T, 19.5);
      const bob = 2 * Math.sin((T - OXI_POP) * Math.PI * 1.2);
      const y = h1.y + h2.y + bob;
      const sq = h1.sq + h2.sq;
      V.set(oxi, { x: 0, y, sx: pop * (1 + sq), sy: pop * (1 - 0.9 * sq), origin: "50% 100%", blur });
    }

    // The subtitle: a left-to-right mask over 500 ms, sliding in 40 px.
    const su = P(T, SUB_AT, SUB_AT + 0.5, E.outCubic);
    subWrap.style.display = T >= SUB_AT ? "flex" : "none";
    sub.style.clipPath = `inset(-30px ${((1 - su) * 100).toFixed(3)}% -30px 0)`;
    V.set(sub, { x: lerp(-40, 0, su), blur });

    // The tagline: fades up 12 px.
    const tu = P(T, TAG_AT, TAG_AT + 0.5, E.outCubic);
    tagWrap.style.display = T >= TAG_AT ? "flex" : "none";
    tag.style.opacity = String(tu);
    V.set(tag, { y: lerp(12, 0, tu), blur });
  }

  V.scene({
    id: "s3",
    start: 16,
    end: 24,
    setup: build,
    render: render,
  });
})();
