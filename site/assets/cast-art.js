/* Oxidize cast: the characters of Rustopia, drawn as inline SVG.
   One face system for everyone (eyes that blink, blush, and the same set of
   expressions), so poses are CSS classes on the wrapper and work on any
   character: is-happy, is-oops, is-think, is-wow, is-talk, is-sleep, is-ouch.
   Colors come from CSS variables in cast-art.css, so every character follows
   light and dark themes.

   OxCast.el(name, opts)   -> '<span class="ca ca-NAME">…svg…</span>'
   OxCast.svg(name, opts)  -> the bare <svg>
   OxCast.prop(name, opts) -> a prop (scroll, ingot, pebble, badge, …)
   OxCast.list             -> the registry: who they are, what they mean in
                              Rust, and the chapter that introduces them.  */
(function () {
  "use strict";
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const f = (n) => Number(n.toFixed(1));

  /* ------------------------------------------------------------ face */
  // Eyes at (x1,y) and (x2,y); mouth centered at (mx,my). style "white"
  // (white eyes with pupils) or "dot" (black bead eyes, for soft creatures).
  function face({ x1, x2, y, r = 7, mx = (x1 + x2) / 2, my = y + 18, w = 7, style = "white", cheeks = true, mouth = true }) {
    const eye = (x) => style === "dot"
      ? `<g class="ca-eye"><ellipse class="ca-dot" cx="${x}" cy="${y}" rx="${f(r * 0.5)}" ry="${f(r * 0.64)}"/><circle class="ca-glint" cx="${f(x + r * 0.2)}" cy="${f(y - r * 0.26)}" r="${f(r * 0.2)}"/></g>`
      : `<g class="ca-eye"><circle class="ca-white" cx="${x}" cy="${y}" r="${r}"/><circle class="ca-pupil" cx="${f(x + r * 0.14)}" cy="${f(y + r * 0.14)}" r="${f(r * 0.45)}"/><circle class="ca-glint" cx="${f(x + r * 0.32)}" cy="${f(y - r * 0.1)}" r="${f(r * 0.16)}"/></g>`;
    const arc = (x, up) => `M${f(x - r * 0.8)} ${f(y + (up ? 2 : 0))} Q${x} ${f(y + (up ? -r : r * 0.6))} ${f(x + r * 0.8)} ${f(y + (up ? 2 : 0))}`;
    const cross = (x) => `M${f(x - r * 0.5)} ${f(y - r * 0.5)} L${f(x + r * 0.5)} ${f(y + r * 0.5)} M${f(x + r * 0.5)} ${f(y - r * 0.5)} L${f(x - r * 0.5)} ${f(y + r * 0.5)}`;
    let s = eye(x1) + eye(x2);
    s += `<path class="ca-line ca-shut" d="${arc(x1, false)} ${arc(x2, false)}"/>`;
    s += `<path class="ca-line ca-joy" d="${arc(x1, true)} ${arc(x2, true)}"/>`;
    s += `<path class="ca-line ca-xeye" d="${cross(x1)} ${cross(x2)}"/>`;
    if (cheeks) s += `<circle class="ca-cheek" cx="${f(x1 - r * 0.4)}" cy="${f(my - 1)}" r="${f(r * 0.6)}"/><circle class="ca-cheek" cx="${f(x2 + r * 0.4)}" cy="${f(my - 1)}" r="${f(r * 0.6)}"/>`;
    if (mouth) {
      s += `<path class="ca-line ca-smile" d="M${f(mx - w)} ${my} Q${mx} ${f(my + w * 0.85)} ${f(mx + w)} ${my}"/>`;
      s += `<path class="ca-line ca-sad" d="M${f(mx - w * 0.85)} ${f(my + 4)} Q${mx} ${f(my - 2)} ${f(mx + w * 0.85)} ${f(my + 4)}"/>`;
      s += `<ellipse class="ca-line ca-o" cx="${mx}" cy="${f(my + 2)}" rx="${f(w * 0.45)}" ry="${f(w * 0.58)}"/>`;
    }
    const sx = x2 + r + 5, sy = y - r - 3;
    s += `<path class="ca-sweat" d="M${sx} ${sy} Q${sx + 4} ${sy + 7} ${sx} ${sy + 10} Q${sx - 4} ${sy + 7} ${sx} ${sy} Z"/>`;
    s += `<text class="ca-q" x="${x2 + r + 6}" y="${y - r - 4}">?</text>`;
    return s;
  }

  function claw(cx, cy, r, dir, open) {
    const half = open ? 34 : 8, rad = (d) => (d * Math.PI) / 180;
    const x1 = cx + r * Math.cos(rad(dir - half)), y1 = cy + r * Math.sin(rad(dir - half));
    const x2 = cx + r * Math.cos(rad(dir + half)), y2 = cy + r * Math.sin(rad(dir + half));
    return `M${cx},${cy} L${f(x2)},${f(y2)} A${r},${r} 0 1 1 ${f(x1)},${f(y1)} Z`;
  }

  /* ------------------------------------------------------------ crabs */
  // Every crab shares one body; hats and tools give each one a job.
  const LEGS = "M32 64 Q18 66 13 78 M36 70 Q24 76 22 88 M44 75 Q38 82 38 92 M88 64 Q102 66 107 78 M84 70 Q96 76 98 88 M76 75 Q82 82 82 92";
  const GEAR = {
    hard: `<path class="ca-hat" d="M49 37 Q49 22 60 22 Q71 22 71 37 Z"/><path class="ca-hat-line" d="M60 23 V36"/><path class="ca-brim" d="M45 37.5 H75"/>`,
    cap: `<path class="ca-cap" d="M37 11 Q60 -7 83 11 L88 14 L32 14 Z"/><circle class="ca-badge-dot" cx="60" cy="6" r="3"/>`,
    stamp: `<rect class="ca-wood" x="104" y="0" width="6" height="12" rx="2"/><rect class="ca-stamp" x="97" y="11" width="20" height="7" rx="2"/>`,
    rail: `<path class="ca-cap" d="M38 12 Q60 -6 82 12 Z"/><rect class="ca-band" x="38" y="9" width="44" height="5" rx="1"/><path class="ca-cap" d="M78 13 L92 15 L80 17 Z"/>`,
    whistle: `<rect class="ca-metal" x="100" y="20" width="12" height="6" rx="3"/><circle class="ca-metal" cx="113" cy="23" r="4"/>`,
    shades: `<path class="ca-shades" d="M37 15 H57 Q57 26 47 26 Q37 26 37 15 Z M63 15 H83 Q83 26 73 26 Q63 26 63 15 Z"/><path class="ca-shades-bar" d="M37 15 H83"/>`,
    pack: `<rect class="ca-pack" x="66" y="34" width="34" height="28" rx="8"/><rect class="ca-pack-flap" x="66" y="34" width="34" height="11" rx="6"/><circle class="ca-metal" cx="83" cy="46" r="2.2"/>`,
    guard: `<path class="ca-cap" d="M38 12 Q60 -5 82 12 L86 15 L34 15 Z"/><path class="ca-badge-dot" d="M60 2 L63 7 L60 10 L57 7 Z"/>`,
    torch: `<path class="ca-beam" d="M110 22 L150 6 L150 40 Z"/><rect class="ca-metal" x="96" y="18" width="16" height="8" rx="2"/>`,
    keys: `<circle class="ca-gold-line" cx="108" cy="22" r="7"/><path class="ca-gold-line" d="M108 29 V40 M108 34 H113 M108 38 H112 M103 26 L96 34 M98 31 H94"/>`,
    bow: `<path class="ca-bow" d="M50 50 L60 55 L50 60 Z M70 50 L60 55 L70 60 Z"/><circle class="ca-bow" cx="60" cy="55" r="2.6"/>`,
    tray: `<rect class="ca-metal" x="90" y="14" width="30" height="4" rx="2"/><rect class="ca-paper" x="96" y="2" width="9" height="12" rx="1"/><rect class="ca-paper" x="107" y="4" width="9" height="10" rx="1"/>`,
    mail: `<path class="ca-cap" d="M40 13 Q60 -4 80 13 Z"/><rect class="ca-band" x="40" y="10" width="40" height="4" rx="1"/><rect class="ca-parcel" x="96" y="6" width="22" height="18" rx="2"/><path class="ca-tape" d="M107 6 V24"/>`,
    grad: `<path class="ca-grad" d="M36 12 L60 2 L84 12 L60 22 Z"/><path class="ca-grad" d="M48 16 V24 Q60 30 72 24 V16 L60 22 Z"/><path class="ca-tassel" d="M80 13 V26"/><circle class="ca-tassel-end" cx="80" cy="27" r="2.4"/>`,
    glasses: `<g class="ca-specs"><circle cx="47" cy="20" r="10"/><circle cx="73" cy="20" r="10"/><path d="M57 20 L63 20"/></g>`,
    pebble: `<ellipse class="ca-pebble" cx="111" cy="15" rx="9" ry="7"/>`,
  };
  function crab(o = {}) {
    const gear = (o.gear || []).map((g) => GEAR[g] || "").join("");
    const holding = o.holding !== false && (o.gear || []).some((g) => ["stamp", "whistle", "torch", "keys", "tray", "mail", "pebble"].includes(g));
    return `<svg class="ca-svg ca-stalked" viewBox="${o.wide ? "0 -6 156 102" : "0 -6 120 102"}" aria-hidden="true">
      <path class="ca-limb" d="${LEGS}"/>
      <path class="ca-limb" d="M36 52 Q22 50 19 37 M84 52 Q98 50 101 37"/>
      <path class="ca-body ca-claw-l" d="${claw(17, 28, 11, -125, true)}"/>
      <path class="ca-body ca-claw-r" d="${claw(103, 28, 11, -55, !holding)}"/>
      <path class="ca-limb" d="M51 40 L47 25 M69 40 L73 25"/>
      ${(o.gear || []).includes("pack") ? GEAR.pack : ""}
      <ellipse class="ca-body" cx="60" cy="58" rx="35" ry="23"/>
      <ellipse class="ca-light" cx="49" cy="48" rx="13" ry="5"/>
      ${face({ x1: 47, x2: 73, y: 20, r: 7.5, mx: 60, my: 62 })}
      ${gear.replace(GEAR.pack, "")}
    </svg>`;
  }

  /* ------------------------------------------------------------ others */
  function forge() {
    return `<svg class="ca-svg" viewBox="0 -18 120 136" aria-hidden="true">
      <circle class="ca-smoke" cx="88" cy="-4" r="5"/><circle class="ca-smoke ca-smoke-2" cx="94" cy="-12" r="4"/>
      <rect class="ca-shade" x="80" y="4" width="14" height="28" rx="3"/><rect class="ca-shade" x="77" y="1" width="20" height="6" rx="2"/>
      <path class="ca-body" d="M16 46 Q16 32 30 32 H90 Q104 32 104 46 V96 Q104 104 96 104 H24 Q16 104 16 96 Z"/>
      <path class="ca-light" d="M24 40 Q26 36 34 36 H58 Q52 40 30 41 Z"/>
      <circle class="ca-shade" cx="24" cy="40" r="2"/><circle class="ca-shade" cx="96" cy="40" r="2"/><circle class="ca-shade" cx="24" cy="97" r="2"/><circle class="ca-shade" cx="96" cy="97" r="2"/>
      <rect class="ca-shade" x="22" y="104" width="20" height="8" rx="2"/><rect class="ca-shade" x="78" y="104" width="20" height="8" rx="2"/>
      <g class="ca-door"><rect class="ca-firebox" x="34" y="64" width="52" height="32" rx="12"/>
      <path class="ca-fire" d="M40 96 Q42 78 50 86 Q52 70 60 82 Q68 66 70 86 Q78 76 80 96 Z"/>
      <path class="ca-fire-2" d="M48 96 Q52 84 56 90 Q60 80 64 90 Q68 84 72 96 Z"/></g>
      <path class="ca-line ca-brow" d="M38 36 L52 41 M82 36 L68 41"/>
      ${face({ x1: 46, x2: 74, y: 48, r: 7, mx: 60, my: 58, mouth: false })}
    </svg>`;
  }
  function semi() {
    return `<svg class="ca-svg" viewBox="0 0 80 116" aria-hidden="true">
      <circle class="ca-body" cx="40" cy="30" r="19"/><ellipse class="ca-light" cx="33" cy="20" rx="7" ry="3.5"/>
      <circle class="ca-body" cx="40" cy="76" r="19"/><path class="ca-body" d="M54 86 Q57 104 30 114 Q44 100 39 92 Z"/>
      <ellipse class="ca-maw" cx="40" cy="77" rx="11" ry="9"/>
      ${face({ x1: 33, x2: 47, y: 28, r: 5.4, mx: 40, my: 76, w: 6 })}
    </svg>`;
  }
  function alloc() {
    return `<svg class="ca-svg" viewBox="0 0 134 104" aria-hidden="true">
      <path class="ca-limb" d="M36 82 L30 96 M46 86 L44 100 M56 84 L60 98"/>
      <circle class="ca-shell" cx="82" cy="50" r="35"/>
      <path class="ca-shell-line" d="M82 50 m-4 0 a4 4 0 1 1 8 0 a9 9 0 1 1 -18 0 a15 15 0 1 1 30 0 a22 22 0 1 1 -44 0"/>
      <path class="ca-shell" d="M106 24 L122 8 L116 32 Z"/>
      <path class="ca-limb" d="M28 70 Q16 66 16 54"/>
      <rect class="ca-paper" x="2" y="32" width="24" height="30" rx="2"/><rect class="ca-metal" x="9" y="29" width="10" height="5" rx="1.5"/>
      <path class="ca-paper-line" d="M7 42 H21 M7 48 H21 M7 54 H16"/>
      <path class="ca-limb" d="M40 62 L34 40 M52 62 L58 40"/>
      <ellipse class="ca-body" cx="46" cy="72" rx="24" ry="16"/>
      ${face({ x1: 34, x2: 58, y: 36, r: 6.5, mx: 46, my: 75, w: 6 })}
    </svg>`;
  }
  function fluffPath(cx, cy, r, n, bump) {
    let d = "";
    for (let k = 0; k <= n; k++) {
      const a = (k / n) * Math.PI * 2 - Math.PI / 2, x = cx + r * Math.cos(a), y = cy + r * Math.sin(a);
      if (k === 0) { d += `M${f(x)},${f(y)}`; continue; }
      const m = ((k - 0.5) / n) * Math.PI * 2 - Math.PI / 2;
      d += ` Q${f(cx + (r + bump) * Math.cos(m))},${f(cy + (r + bump) * Math.sin(m))} ${f(x)},${f(y)}`;
    }
    return d + " Z";
  }
  const FLUFF = fluffPath(50, 54, 33, 13, 8);
  function fluffy() {
    return `<svg class="ca-svg" viewBox="0 0 100 100" aria-hidden="true">
      <ellipse class="ca-shade" cx="39" cy="91" rx="8" ry="4"/><ellipse class="ca-shade" cx="61" cy="91" rx="8" ry="4"/>
      <path class="ca-body ca-fluff" d="${FLUFF}"/>
      ${face({ x1: 40, x2: 60, y: 50, r: 7, mx: 50, my: 61, w: 5, style: "dot" })}
    </svg>`;
  }
  // Glyph: a UTF-8 string as a caterpillar. One segment per byte; the
  // segments of one character share a color.
  function glyph(o = {}) {
    const chars = o.chars || ["h", "é", "!"];
    const bytes = o.bytes || chars.map((c) => new TextEncoder().encode(c).length);
    const n = bytes.reduce((a, b) => a + b, 0), W = 40 + n * 22 + 46;
    let s = "", x = 30, k = 0;
    bytes.forEach((b, ci) => {
      const x0 = x;
      for (let j = 0; j < b; j++, k++) {
        s += `<circle class="ca-seg ${ci % 2 ? "is-b" : "is-a"}" cx="${x}" cy="56" r="13" data-byte="${k}"/><path class="ca-limb ca-leg" d="M${x - 4} 68 L${x - 6} 78 M${x + 4} 68 L${x + 6} 78"/>`;
        x += 22;
      }
      s += `<text class="ca-label is-glyph" x="${f((x0 + x - 22) / 2)}" y="98">${esc(chars[ci] === " " ? "␠" : chars[ci])}</text>`;
      if (b > 1) s += `<path class="ca-tie" d="M${x0} 40 H${x - 22}"/>`;
    });
    if (o.cut !== undefined) { const cx = 30 + o.cut * 22 - 11; s += `<path class="ca-cut" d="M${cx - 6} 34 L${cx + 6} 80"/>`; }
    return `<svg class="ca-svg" viewBox="0 0 ${W} 104" aria-hidden="true">${s}
      <circle class="ca-body" cx="${x + 6}" cy="50" r="19"/><path class="ca-limb" d="M${x} 33 Q${x - 4} 20 ${x - 10} 18 M${x + 12} 33 Q${x + 16} 20 ${x + 22} 18"/>
      ${face({ x1: x - 1, x2: x + 13, y: 48, r: 5.6, mx: x + 6, my: 59, w: 5 })}
    </svg>`;
  }
  // Mold: a struct definition. Each cavity is a field; an instance is
  // what comes out of it.
  function mold(o = {}) {
    const fields = o.fields || ["name: String", "age: u8"], name = o.name || "User";
    const H = 44 + fields.length * 24;
    let s = "";
    fields.forEach((fl, i) => { s += `<rect class="ca-cavity" x="16" y="${40 + i * 24}" width="148" height="18" rx="5"/><text class="ca-label ca-left" x="24" y="${53 + i * 24}">${esc(fl)}</text>`; });
    return `<svg class="ca-svg" viewBox="0 0 180 ${H}" aria-hidden="true">
      <rect class="ca-body" x="4" y="4" width="172" height="${H - 8}" rx="12"/><rect class="ca-light" x="10" y="8" width="70" height="4" rx="2"/>
      <text class="ca-title" x="168" y="27" text-anchor="end">struct ${esc(name)}</text>
      ${face({ x1: 24, x2: 40, y: 20, r: 5.2, mx: 32, my: 29, w: 4, cheeks: false })}
      ${s}
    </svg>`;
  }
  // Octo: a match expression. One arm per pattern; a value with no arm
  // has nowhere to go.
  function octo(o = {}) {
    const arms = o.arms || ["Some(x)", "None"], n = arms.length, W = Math.max(170, n * 58 + 20), cx = W / 2;
    let s = "";
    arms.forEach((a, i) => {
      const sx = 10 + (i + 0.5) * ((W - 20) / n), hx = cx + (i - (n - 1) / 2) * 11;
      s += `<path class="ca-tentacle" d="M${f(hx)} 70 Q${f((hx + sx) / 2)} ${i % 2 ? 98 : 84} ${f(sx)} 104"/>`;
      s += `<g class="ca-arm" data-arm="${i}"><rect class="ca-sign" x="${f(sx - 26)}" y="104" width="52" height="20" rx="5"/><text class="ca-label" x="${f(sx)}" y="118">${esc(a)}</text></g>`;
    });
    return `<svg class="ca-svg" viewBox="0 0 ${W} 130" aria-hidden="true">${s}
      <path class="ca-body" d="M${cx - 34} 72 Q${cx - 36} 8 ${cx} 8 Q${cx + 36} 8 ${cx + 34} 72 Q${cx} 80 ${cx - 34} 72 Z"/>
      <ellipse class="ca-light" cx="${cx - 12}" cy="22" rx="10" ry="5"/>
      <circle class="ca-spot" cx="${cx + 20}" cy="26" r="3"/><circle class="ca-spot" cx="${cx - 22}" cy="44" r="2.4"/>
      ${face({ x1: cx - 13, x2: cx + 13, y: 42, r: 8, mx: cx, my: 60, w: 7 })}
    </svg>`;
  }
  // The Press: generics. One template, a stamped copy per concrete type.
  function press(o = {}) {
    return `<svg class="ca-svg" viewBox="0 0 130 128" aria-hidden="true">
      <rect class="ca-shade" x="10" y="8" width="12" height="104" rx="3"/><rect class="ca-shade" x="108" y="8" width="12" height="104" rx="3"/>
      <rect class="ca-shade" x="6" y="4" width="118" height="14" rx="4"/><rect class="ca-metal" x="58" y="16" width="14" height="14"/>
      <g class="ca-ram"><rect class="ca-body" x="26" y="28" width="78" height="44" rx="8"/><rect class="ca-light" x="32" y="32" width="30" height="4" rx="2"/>
      <text class="ca-title" x="65" y="69" text-anchor="middle">${esc(o.label || "<T>")}</text>
      ${face({ x1: 52, x2: 78, y: 46, r: 6.5, mx: 65, my: 55, w: 5, cheeks: false, mouth: false })}</g>
      <rect class="ca-shade" x="16" y="112" width="98" height="10" rx="3"/><rect class="ca-plate" x="34" y="100" width="62" height="12" rx="3"/>
    </svg>`;
  }
  // Tick: a lifetime. The sand is how long the value lives; a reference
  // tied to Tick must be gone before the sand runs out.
  function tick(o = {}) {
    const lv = Math.max(0, Math.min(1, o.level === undefined ? 0.8 : o.level));
    const top = 64 - 26 * lv, half = 3 + 15 * lv;
    return `<svg class="ca-svg" viewBox="0 0 86 128" aria-hidden="true">
      <path class="ca-glass" d="M20 16 H66 Q66 46 46 64 Q66 82 66 112 H20 Q20 82 40 64 Q20 46 20 16 Z"/>
      ${lv > 0 ? `<path class="ca-sand" d="M${43 - half} ${f(top)} H${43 + half} L45 62 H41 Z"/>` : ""}
      <path class="ca-sand" d="M24 110 Q43 ${f(110 - 30 * (1 - lv) - 4)} 62 110 Z"/>
      ${lv > 0 ? `<path class="ca-stream" d="M43 64 V108"/>` : ""}
      <rect class="ca-wood" x="8" y="4" width="70" height="12" rx="4"/><rect class="ca-wood" x="8" y="112" width="70" height="12" rx="4"/>
      <rect class="ca-wood" x="11" y="16" width="5" height="96" rx="2"/><rect class="ca-wood" x="70" y="16" width="5" height="96" rx="2"/>
      ${face({ x1: 35, x2: 51, y: 27, r: 5.4, mx: 43, my: 36, w: 4, cheeks: false })}
    </svg>`;
  }
  // Cargo: the package manager, a tugboat that brings crates from the
  // harbor at crates.io.
  function cargo(o = {}) {
    const crates = o.crates === undefined ? 2 : o.crates;
    let c = "";
    for (let i = 0; i < crates; i++) c += `<rect class="ca-wood" x="${22 + i * 22}" y="${50 - (i % 2) * 2}" width="19" height="20" rx="2"/><path class="ca-wood-line" d="M${22 + i * 22} ${57 - (i % 2) * 2} H${41 + i * 22}"/>`;
    return `<svg class="ca-svg" viewBox="0 0 170 116" aria-hidden="true">
      <circle class="ca-smoke" cx="128" cy="6" r="5"/><circle class="ca-smoke ca-smoke-2" cx="136" cy="-2" r="4"/>
      <rect class="ca-accent" x="118" y="12" width="13" height="24" rx="2"/><rect class="ca-shade" x="118" y="18" width="13" height="4"/>
      ${c}
      <rect class="ca-cabin" x="84" y="32" width="50" height="38" rx="7"/>
      <path class="ca-body" d="M10 70 H156 L140 98 Q136 104 128 104 H36 Q28 104 24 98 Z"/>
      <path class="ca-light" d="M16 74 H150" stroke-width="3"/>
      <path class="ca-water" d="M0 106 Q10 100 20 106 T40 106 T60 106 T80 106 T100 106 T120 106 T140 106 T160 106 T180 106"/>
      ${face({ x1: 100, x2: 120, y: 50, r: 7.5, mx: 112, my: 86, w: 8 })}
    </svg>`;
  }

  /* ------------------------------------------------------------ props */
  const PEBBLE = {
    i32: (v) => `<ellipse class="pr-stone" cx="30" cy="22" rx="24" ry="17"/><ellipse class="pr-shine" cx="22" cy="14" rx="8" ry="3"/><text class="ca-label" x="30" y="26">${esc(v)}</text>`,
    i64: (v) => `<ellipse class="pr-stone is-big" cx="30" cy="22" rx="28" ry="19"/><ellipse class="pr-shine" cx="20" cy="12" rx="9" ry="3"/><text class="ca-label" x="30" y="26">${esc(v)}</text>`,
    u8: (v) => `<circle class="pr-stone is-small" cx="30" cy="24" r="14"/><text class="ca-label" x="30" y="28">${esc(v)}</text>`,
    f64: (v) => `<ellipse class="pr-stone is-float" cx="30" cy="22" rx="27" ry="13"/><ellipse class="pr-shine" cx="20" cy="15" rx="9" ry="2.5"/><text class="ca-label" x="30" y="26">${esc(v)}</text>`,
    bool: (v) => `<circle class="pr-coin" cx="30" cy="22" r="18"/><circle class="pr-coin-rim" cx="30" cy="22" r="13"/><text class="ca-label" x="30" y="26">${esc(v)}</text>`,
    char: (v) => `<rect class="pr-tile" x="12" y="4" width="36" height="36" rx="6"/><text class="ca-label is-big" x="30" y="29">${esc(v)}</text>`,
  };
  const PROPS = {
    scroll: (o) => `<svg class="ca-svg" viewBox="0 0 96 64"><rect class="pr-paper" x="12" y="8" width="72" height="48" rx="3"/><rect class="pr-roll" x="4" y="4" width="14" height="56" rx="7"/><rect class="pr-roll" x="78" y="4" width="14" height="56" rx="7"/><path class="pr-ink" d="M26 22 H70 M26 30 H62 M26 38 H66"/><text class="ca-label" x="48" y="52">${esc(o.label || "main.rs")}</text></svg>`,
    errscroll: (o) => `<svg class="ca-svg" viewBox="0 0 96 64"><rect class="pr-paper is-err" x="12" y="8" width="72" height="48" rx="3"/><rect class="pr-roll is-err" x="4" y="4" width="14" height="56" rx="7"/><rect class="pr-roll is-err" x="78" y="4" width="14" height="56" rx="7"/><text class="ca-label is-err" x="48" y="30">error</text><text class="ca-label is-err" x="48" y="46">${esc(o.label || "E0382")}</text></svg>`,
    ingot: (o) => `<svg class="ca-svg" viewBox="0 0 100 64"><path class="pr-gold" d="M10 44 L24 18 H76 L90 44 Z"/><path class="pr-gold-top" d="M24 18 H76 L70 26 H30 Z"/><path class="pr-shine" d="M30 22 H52"/><text class="ca-label" x="50" y="60">${esc(o.label || "binary")}</text></svg>`,
    pebble: (o) => `<svg class="ca-svg" viewBox="0 0 60 48">${(PEBBLE[o.type] || PEBBLE.i32)(o.value === undefined ? "" : o.value)}</svg>`,
    unit: () => `<svg class="ca-svg" viewBox="0 0 64 52"><path class="pr-box-in" d="M8 18 L32 10 L56 18 L32 26 Z"/><path class="pr-box" d="M8 18 L32 26 V48 L8 40 Z"/><path class="pr-box-2" d="M56 18 L32 26 V48 L56 40 Z"/><text class="ca-label" x="32" y="9">()</text></svg>`,
    badge: (o) => `<svg class="ca-svg" viewBox="0 0 72 72"><circle class="pr-badge" cx="36" cy="36" r="32"/><circle class="pr-stitch" cx="36" cy="36" r="27"/><text class="ca-label" x="36" y="40">${esc(o.label || "Display")}</text></svg>`,
    crate: (o) => `<svg class="ca-svg" viewBox="0 0 72 64"><rect class="ca-wood" x="6" y="6" width="60" height="52" rx="4"/><path class="ca-wood-line" d="M6 22 H66 M6 42 H66 M10 10 L62 54"/><rect class="pr-paper" x="16" y="26" width="40" height="14" rx="2"/><text class="ca-label" x="36" y="37">${esc(o.label || "serde")}</text></svg>`,
    key: () => `<svg class="ca-svg" viewBox="0 0 64 32"><circle class="pr-gold" cx="14" cy="16" r="10"/><circle class="pr-hole" cx="14" cy="16" r="4"/><path class="pr-gold" d="M22 13 H58 V19 H52 V25 H46 V19 H22 Z"/></svg>`,
    ticket: (o) => `<svg class="ca-svg" viewBox="0 0 80 44"><path class="pr-ticket" d="M4 6 H76 V16 Q70 22 76 28 V38 H4 V28 Q10 22 4 16 Z"/><path class="pr-perf" d="M22 8 V36"/><text class="ca-label" x="49" y="27">${esc(o.label || "fetch")}</text></svg>`,
    parcel: (o) => `<svg class="ca-svg" viewBox="0 0 80 60"><rect class="pr-parcel" x="6" y="8" width="68" height="46" rx="4"/><path class="pr-tape" d="M40 8 V54 M6 24 H74"/><text class="ca-label" x="40" y="44">${esc(o.label || "GET /notes")}</text></svg>`,
    bell: () => `<svg class="ca-svg" viewBox="0 0 64 52"><circle class="pr-gold" cx="32" cy="10" r="4"/><path class="pr-gold" d="M10 40 Q10 14 32 14 Q54 14 54 40 Z"/><rect class="ca-shade" x="4" y="40" width="56" height="7" rx="3"/></svg>`,
    door: (o) => `<svg class="ca-svg" viewBox="0 0 64 92"><rect class="pr-frame" x="4" y="14" width="56" height="76" rx="4"/>${o.open ? `<rect class="pr-gap" x="10" y="20" width="44" height="70"/><path class="pr-door" d="M10 20 L26 26 V96 L10 90 Z"/>` : `<rect class="pr-door" x="10" y="20" width="44" height="70" rx="2"/><circle class="pr-gold" cx="46" cy="58" r="3"/>`}<text class="ca-label" x="32" y="10">${esc(o.label || (o.open ? "pub" : "private"))}</text></svg>`,
    car: (o) => `<svg class="ca-svg" viewBox="0 0 96 60"><rect class="pr-car ${o.kind === "err" ? "is-err" : "is-ok"}" x="6" y="10" width="84" height="34" rx="6"/><circle class="pr-wheel" cx="26" cy="48" r="8"/><circle class="pr-wheel" cx="70" cy="48" r="8"/><text class="ca-label is-light" x="48" y="25">${o.kind === "err" ? "Err" : "Ok"}</text><text class="ca-label is-light" x="48" y="38">${esc(o.label || "")}</text></svg>`,
    lever: (o) => `<svg class="ca-svg" viewBox="0 0 64 70"><rect class="ca-shade" x="12" y="56" width="40" height="10" rx="3"/><g class="pr-lever ${o.on ? "is-on" : ""}"><path class="pr-stick" d="M32 58 L32 16"/><circle class="pr-knob" cx="32" cy="14" r="8"/></g><text class="ca-label is-q" x="32" y="52">?</text></svg>`,
    leash: () => `<svg class="ca-svg" viewBox="0 0 120 48"><path class="pr-rope" d="M10 14 C40 46 80 46 110 14"/><path class="pr-rope-twist" d="M10 14 C40 46 80 46 110 14"/><circle class="pr-ring" cx="10" cy="14" r="6"/><circle class="pr-ring" cx="110" cy="14" r="6"/></svg>`,
    pebbles: () => `<svg class="ca-svg" viewBox="0 0 120 60"><ellipse class="pr-stone" cx="26" cy="38" rx="20" ry="14"/><circle class="pr-coin" cx="62" cy="34" r="14"/><rect class="pr-tile" x="82" y="18" width="28" height="28" rx="5"/><text class="ca-label" x="26" y="42">42</text><text class="ca-label" x="62" y="38">T</text><text class="ca-label is-big" x="96" y="40">a</text></svg>`,
    borrows: () => `<svg class="ca-svg" viewBox="0 0 120 60"><g class="pr-specs"><circle cx="22" cy="30" r="13"/><circle cx="54" cy="30" r="13"/><path d="M35 30 H41 M9 28 L2 22 M67 28 L72 24"/></g><path class="pr-shackle" d="M88 30 V20 a10 10 0 0 1 20 0 V30"/><rect class="pr-lock" x="82" y="28" width="32" height="26" rx="5"/><circle class="pr-hole" cx="98" cy="40" r="3.5"/></svg>`,
    shell: () => `<svg class="ca-svg" viewBox="0 0 120 70"><path class="pr-shell" d="M25 50 A35 23 0 0 1 95 50 Z"/><path class="pr-crack" d="M45 30 L52 40 L48 46 L58 50 M80 34 L72 42 L76 48"/></svg>`,
  };

  /* ------------------------------------------------------------ registry */
  const ART = {
    oxi: () => crab({ gear: ["hard"] }),
    crab: (o) => crab(o),
    inspector: () => crab({ gear: ["cap", "stamp"] }),
    forge, semi, alloc, fluffy, glyph, mold, octo, press, tick, cargo,
    switchman: () => crab({ gear: ["rail", "whistle"] }),
    bouncer: () => crab({ gear: ["shades"] }),
    clo: () => crab({ gear: ["pack"] }),
    guard: () => crab({ gear: ["guard", "torch"], wide: true }),
    keeper: () => crab({ gear: ["keys"] }),
    waiter: () => crab({ gear: ["bow", "tray"] }),
    postie: () => crab({ gear: ["mail"] }),
    graduate: () => crab({ gear: ["grad"] }),
  };
  // Who they are. `rust` is what the character stands for; `ch` is the
  // chapter that introduces them.
  const LIST = [
    { id: "oxi", name: "Oxi", ch: 1, rust: "Your guide", role: "A young crab in a hard hat who walks the route with you, asks you to predict, and cheers when you do." },
    { id: "forge", name: "The Forge", ch: 1, rust: "The compiler, rustc", role: "Eats source code and turns it into a machine-code ingot, or hands back an error scroll before anything runs." },
    { id: "crab", name: "Crabs", ch: 2, rust: "Variables (bindings)", role: "Each crab holds one value in its claw and wears its name on a tag. A plain crab holds tight; a mut crab may swap what it holds." },
    { id: "pebbles", name: "Pebbles", ch: 3, prop: true, rust: "Scalar values and their types", role: "Small values that live right in a crab's claw: integers, floats, bools and chars. Each type is its own shape, and a value only fits a slot of its shape." },
    { id: "semi", name: "Semi", ch: 4, rust: "The semicolon", role: "Turns an expression into a statement by eating its value. What is left is the empty box, ()." },
    { id: "fluffy", name: "Fluffies", ch: 5, rust: "Data on the heap", role: "Soft values that live on the sandbank: the bytes of a String, the items of a Vec. They live exactly as long as their owner." },
    { id: "alloc", name: "Alloc", ch: 5, rust: "The allocator", role: "A hermit crab who hands out plots on the heap, moves a growing Vec to a bigger plot, and takes the plot back at drop." },
    { id: "leash", name: "The Leash", ch: 6, prop: true, rust: "Ownership", role: "The rope from an owner to its heap value. Exactly one crab holds it. A move hands it over; when its crab leaves, the value goes too." },
    { id: "inspector", name: "The Inspector", ch: 6, rust: "The borrow checker", role: "Checks every leash, and later every borrow, before the program runs, and stamps an error code on whatever breaks the rules." },
    { id: "borrows", name: "Glasses and the Lock", ch: 7, prop: true, rust: "& and &mut borrows", role: "Glasses let any number of crabs look at a value without taking it. The lock lets exactly one crab change it, and while it's locked nobody else may even look." },
    { id: "glyph", name: "Glyph", ch: 8, rust: "A UTF-8 string", role: "A caterpillar with one segment per byte. Some letters take two, three or four segments, and you may only cut between letters." },
    { id: "mold", name: "The Mold", ch: 9, rust: "A struct definition", role: "A casting mold with one cavity per field. Every value poured from it has exactly those fields, with exactly those types." },
    { id: "octo", name: "Octo", ch: 10, rust: "match", role: "An octopus with one arm per pattern. Every variant needs an arm, or Octo refuses to start." },
    { id: "switchman", name: "The Switchman", ch: 11, rust: "Result and the ? operator", role: "Runs the railway: Ok cars roll on, Err cars are switched off the line and sent back to the caller." },
    { id: "bouncer", name: "The Bouncer", ch: 12, rust: "HashSet", role: "Stands at the door of the set and lets each value in exactly once." },
    { id: "clo", name: "Clo", ch: 13, rust: "Closures", role: "A crab with a backpack. It packs what it captures: a look, a borrowed handle, or the value itself with move." },
    { id: "press", name: "The Press", ch: 14, rust: "Generics", role: "Stamps one specialized copy of a generic function for every concrete type you use, at compile time." },
    { id: "tick", name: "Tick", ch: 15, rust: "Lifetimes", role: "An hourglass for each scope. A reference tied to Tick must be finished before the sand runs out." },
    { id: "cargo", name: "Cargo", ch: 16, rust: "Cargo and crates", role: "A tugboat that fetches crates from the harbor at crates.io and builds your project." },
    { id: "guard", name: "The Night Guard", ch: 17, rust: "RefCell", role: "Checks borrows while the program runs, with a flashlight. Break a rule and the alarm sounds: a panic." },
    { id: "keeper", name: "The Keeper", ch: 18, rust: "Mutex", role: "Holds the only key to a shared room. One thread inside at a time; the others wait at the door." },
    { id: "waiter", name: "The Waiter", ch: 19, rust: "The async executor", role: "Juggles many orders at once and only returns to one when its bell rings." },
    { id: "postie", name: "Postie", ch: 20, rust: "A request through middleware", role: "Carries each request parcel through every layer of the service and brings the response back." },
    { id: "graduate", name: "Rustacean Oxi", ch: 21, rust: "You", role: "Oxi after the last molt: a full Rustacean. So are you." },
  ];

  function svg(name, o = {}) { return (ART[name] || PROPS[name] || ART.crab)(o); }
  // Art for a registry entry (a character or, for props like pebbles, the prop).
  function art(id, o = {}) { const e = LIST.find((x) => x.id === id); return e && e.prop ? prop(id, o) : el(id, o); }
  function el(name, o = {}) {
    const cls = ["ca", "ca-" + name, o.kind ? "is-" + o.kind : "", o.pose ? "is-" + o.pose : "", o.cls || ""].filter(Boolean).join(" ");
    return `<span class="${cls}" data-cast="${esc(name)}"${o.label ? ` aria-label="${esc(o.label)}" role="img"` : ""}>${svg(name, o)}</span>`;
  }
  function prop(name, o = {}) { return `<span class="ca ca-prop ca-prop-${name}${o.cls ? " " + o.cls : ""}" data-prop="${esc(name)}">${(PROPS[name] || PROPS.scroll)(o)}</span>`; }
  // Set a pose for a while, then return to idle.
  function pose(node, p, ms) {
    if (!node) return;
    clearTimeout(node._caPose);
    node.className = node.className.replace(/\bis-(happy|oops|think|wow|talk|sleep|ouch|chomp|stamp|catch)\b/g, "").replace(/\s+/g, " ").trim();
    if (p) node.classList.add("is-" + p);
    if (p && ms) node._caPose = setTimeout(() => node.classList.remove("is-" + p), ms);
  }

  window.OxCast = { el, svg, prop, pose, entry: art, list: LIST, art: ART, props: PROPS, face, claw };
})();
