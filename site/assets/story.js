/* Ownership Story: the Memory X-Ray scenarios acted out by characters.
   Crabs are variables, fluffies are heap values, leashes are pointers, and
   the Inspector is the borrow checker. The states come from the X-Ray's own
   model (OxXray.build), so every scenario works in both views.
   Markup: <div class="ox-story" data-scenario="move-error,clone-string"></div>
   Needs xray.js and the scenario files loaded first. */
(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const reduce = () => window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const wait = (ms) => new Promise((r) => setTimeout(r, reduce() ? 0 : ms));

  /* ------------------------------------------------------------ art */
  function claw(cx, cy, r, dir, open) {
    const half = open ? 34 : 8, rad = (d) => (d * Math.PI) / 180;
    const x1 = cx + r * Math.cos(rad(dir - half)), y1 = cy + r * Math.sin(rad(dir - half));
    const x2 = cx + r * Math.cos(rad(dir + half)), y2 = cy + r * Math.sin(rad(dir + half));
    return `M${cx},${cy} L${x2.toFixed(1)},${y2.toFixed(1)} A${r},${r} 0 1 1 ${x1.toFixed(1)},${y1.toFixed(1)} Z`;
  }
  const LEGS = "M32 64 Q18 66 13 78 M36 70 Q24 76 22 88 M44 75 Q38 82 38 92 M88 64 Q102 66 107 78 M84 70 Q96 76 98 88 M76 75 Q82 82 82 92";
  function crabSvg(extra = "") {
    return `<svg viewBox="0 0 120 96" aria-hidden="true">
      <path class="cr-leg" d="${LEGS}"/>
      <path class="cr-arm" d="M36 52 Q22 50 19 37"/><path class="cr-arm" d="M84 52 Q98 50 101 37"/>
      <path class="cr-claw cr-claw-l" d="${claw(17, 28, 11, -125, true)}"/>
      <path class="cr-claw cr-claw-r" d="${claw(103, 28, 11, -55, true)}"/>
      <ellipse class="cr-pebble" cx="111" cy="15" rx="9" ry="7"/>
      <path class="cr-stalk" d="M51 40 L47 25 M69 40 L73 25"/>
      <ellipse class="cr-body" cx="60" cy="58" rx="35" ry="23"/>
      <ellipse class="cr-shine" cx="49" cy="48" rx="13" ry="5"/>
      <g class="cr-eye"><circle class="cr-eye-white" cx="47" cy="20" r="7.5"/><circle class="cr-pupil" cx="48" cy="21" r="3.3"/></g>
      <g class="cr-eye"><circle class="cr-eye-white" cx="73" cy="20" r="7.5"/><circle class="cr-pupil" cx="74" cy="21" r="3.3"/></g>
      <path class="cr-mouth cr-shut" d="M41 21 Q47 25 53 21 M67 21 Q73 25 79 21"/>
      <g class="cr-glasses"><circle cx="47" cy="20" r="10"/><circle cx="73" cy="20" r="10"/><path d="M57 20 L63 20"/></g>
      <circle class="cr-cheek" cx="43" cy="62" r="4.5"/><circle class="cr-cheek" cx="77" cy="62" r="4.5"/>
      <path class="cr-mouth cr-mouth-smile" d="M53 62 Q60 68 67 62"/>
      <path class="cr-mouth cr-mouth-sad" d="M54 67 Q60 62 66 67"/>
      <ellipse class="cr-mouth cr-mouth-o" cx="60" cy="65" rx="3.2" ry="4"/>
      ${extra}
    </svg>`;
  }
  const OXI_EXTRA = `<path class="oxi-hat" d="M49 37 Q49 22 60 22 Q71 22 71 37 Z"/><path class="oxi-hat-ridge" d="M60 23 V36"/><path class="oxi-brim" d="M45 37.5 H75"/>
      <path class="cr-mouth oxi-happy-eye" d="M41 22 Q47 14 53 22 M67 22 Q73 14 79 22"/>
      <path class="oxi-sweat" d="M92 8 Q96 15 92 18 Q88 15 92 8 Z" fill="#7cc7f5"/>
      <text class="oxi-q" x="96" y="6" fill="var(--oxide)" style="font:900 22px var(--font-display)">?</text>`;
  const INSPECTOR_EXTRA = `<path class="in-cap" d="M37 11 Q60 -7 83 11 L88 14 L32 14 Z"/><circle class="in-badge" cx="60" cy="6" r="3"/>
      <rect class="in-handle" x="104" y="0" width="6" height="12" rx="2"/><rect class="in-stamp" x="97" y="11" width="20" height="7" rx="2"/>`;

  function fluffPath(cx, cy, r, n, bump) {
    let d = "";
    for (let k = 0; k <= n; k++) {
      const a = (k / n) * Math.PI * 2 - Math.PI / 2;
      const x = cx + r * Math.cos(a), y = cy + r * Math.sin(a);
      if (k === 0) { d += `M${x.toFixed(1)},${y.toFixed(1)}`; continue; }
      const m = ((k - 0.5) / n) * Math.PI * 2 - Math.PI / 2;
      d += ` Q${(cx + (r + bump) * Math.cos(m)).toFixed(1)},${(cy + (r + bump) * Math.sin(m)).toFixed(1)} ${x.toFixed(1)},${y.toFixed(1)}`;
    }
    return d + " Z";
  }
  const FLUFF_BODY = fluffPath(50, 54, 33, 13, 8);
  function fluffySvg() {
    return `<svg viewBox="0 0 100 100" aria-hidden="true">
      <ellipse class="fl-foot" cx="39" cy="91" rx="8" ry="4"/><ellipse class="fl-foot" cx="61" cy="91" rx="8" ry="4"/>
      <path class="fl-body" d="${FLUFF_BODY}"/>
      <ellipse class="fl-eye" cx="40" cy="50" rx="3.4" ry="4.4"/><ellipse class="fl-eye" cx="60" cy="50" rx="3.4" ry="4.4"/>
      <circle class="fl-shine" cx="41.3" cy="48.3" r="1.3"/><circle class="fl-shine" cx="61.3" cy="48.3" r="1.3"/>
      <path class="fl-x" d="M37 47 L43 53 M43 47 L37 53 M57 47 L63 53 M63 47 L57 53"/>
      <circle class="fl-cheek" cx="31" cy="59" r="5"/><circle class="fl-cheek" cx="69" cy="59" r="5"/>
      <path class="fl-mouth" d="M45 60 Q47.5 63.5 50 60 Q52.5 63.5 55 60"/>
    </svg>`;
  }

  /* ------------------------------------------------------------ helpers */
  function kindOf(val) {
    if (val.mut !== undefined) return "mutref";
    if (val.ref !== undefined) return "ref";
    if (val.ptr !== undefined) return "owner";
    return "plain";
  }
  const targetOf = (val) => (val.ptr !== undefined ? val.ptr : val.mut !== undefined ? val.mut : val.ref);
  // Whether a block reads as a list is fixed when it first appears, so a
  // freed Vec buffer (relabeled "freed") still shows as a list.
  function contentOf(b, listyBlocks) {
    if (!listyBlocks.has(b.id)) listyBlocks.set(b.id, /vec|buffer|array|\[/i.test(b.label || "") || b.cells.some((c) => c.length > 1));
    const listy = listyBlocks.get(b.id);
    const spare = Math.max(0, (b.cap || 0) - b.cells.length);
    const pad = spare ? `<i>${listy ? ", " : ""}${"·".repeat(Math.min(spare, 6))}</i>` : "";
    return listy ? `[${b.cells.map(esc).join(", ")}${pad}]` : `"${esc(b.cells.join(""))}"${pad}`;
  }
  // Position of an element's box relative to the stage, ignoring CSS
  // transforms, so leashes land where characters settle, not mid-hop.
  function boxIn(el, stage) {
    let x = 0, y = 0, n = el;
    while (n && n !== stage) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
    return { x, y, w: el.offsetWidth, h: el.offsetHeight };
  }

  /* ------------------------------------------------------------ widget */
  function mountStory(el) {
    if (el.dataset.stDone) return;
    el.dataset.stDone = "1";
    if (!window.OxXray) { el.textContent = "Ownership Story needs xray.js."; return; }
    const lib = window.OX_XRAY || [];
    const ids = (el.dataset.scenario || "").split(",").map((s) => s.trim()).filter(Boolean);
    const scens = ids.map((id) => lib.find((s) => s.id === id)).filter(Boolean);
    if (!scens.length) { el.innerHTML = `<p style="padding:14px">Story scenario <code>${esc(ids.join(", "))}</code> not found.</p>`; return; }

    el.innerHTML = `
      <div class="st-head">
        <span class="ox-label">Ownership Story</span>
        <span class="st-title"></span>
        <span class="ox-btn-group" role="group" aria-label="View">
          <button type="button" class="ox-btn is-small is-primary" data-view="story" aria-pressed="true">Story</button>
          <button type="button" class="ox-btn is-small" data-view="diagram" aria-pressed="false">Diagram</button>
        </span>
      </div>
      ${scens.length > 1 ? `<div class="st-picker"></div>` : ""}
      <div class="st-main">
        <div class="st-body">
          <div class="st-code"><pre></pre></div>
          <div class="st-stage">
            <div class="st-zone is-stack"><span class="st-zone-title">Stack<small>one tide pool per call</small></span><div class="st-pools"></div></div>
            <div class="st-zone is-heap"><span class="st-zone-title">Heap<small>where owned data lives</small></span><div class="st-bank"></div></div>
            <pre class="st-term" hidden></pre>
            <svg class="st-leashes" aria-hidden="true"></svg>
            <div class="st-inspector" hidden><div class="st-bubble"></div><div class="st-crab-art">${crabSvg(INSPECTOR_EXTRA)}</div></div>
          </div>
        </div>
        <div class="st-foot">
          <div class="st-oxi" aria-hidden="true">${crabSvg(OXI_EXTRA)}</div>
          <div class="st-say"></div>
        </div>
        <div class="st-controls">
          <button type="button" class="ox-btn is-small" data-act="restart" title="Restart">⟲</button>
          <button type="button" class="ox-btn is-small" data-act="prev" title="Previous step (←)">◀ Back</button>
          <button type="button" class="ox-btn is-small is-primary" data-act="next" title="Next step (→)">Step ▶</button>
          <button type="button" class="ox-btn is-small" data-act="auto">Autoplay</button>
          <span class="st-progress"><i></i></span>
          <span class="st-count"></span>
        </div>
      </div>
      <div class="st-diagram" hidden></div>
      <div class="st-sr" aria-live="polite"></div>`;
    el.tabIndex = 0;

    const stage = $(".st-stage", el), pools = $(".st-pools", el), bank = $(".st-bank", el);
    const svg = $(".st-leashes", el), term = $(".st-term", el), inspector = $(".st-inspector", el);
    const say = $(".st-say", el), oxi = $(".st-oxi", el), live = $(".st-sr", el);
    const codePre = $(".st-code pre", el), nextBtn = $('[data-act="next"]', el), autoBtn = $('[data-act="auto"]', el);
    const crabEls = new Map(), fluffEls = new Map(), poolEls = new Map(), leashEls = new Map(), listyBlocks = new Map();
    let scen, states, i = 0, asked = {}, autoTimer = null, prevState = null;

    /* ---------- Oxi */
    let moodTimer = 0;
    function mood(m, ms) {
      clearTimeout(moodTimer);
      oxi.className = "st-oxi" + (m ? " is-" + m : "");
      if (ms) moodTimer = setTimeout(() => (oxi.className = "st-oxi"), ms);
    }
    function confetti() {
      if (reduce()) return;
      const o = boxIn(oxi, el);
      const colors = ["var(--oxide)", "var(--borrow)", "var(--mut)", "var(--ok)", "#f0c674"];
      for (let k = 0; k < 14; k++) {
        const c = document.createElement("i");
        c.className = "st-confetti";
        c.style.left = o.x + o.w / 2 + "px";
        c.style.top = o.y + 10 + "px";
        c.style.background = colors[k % colors.length];
        el.appendChild(c);
        const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2, v = 60 + Math.random() * 70;
        c.animate([{ transform: "translate(0,0) rotate(0)", opacity: 1 }, { transform: `translate(${Math.cos(a) * v}px, ${Math.sin(a) * v + 60}px) rotate(${Math.random() * 540}deg)`, opacity: 0 }], { duration: 900 + Math.random() * 300, easing: "cubic-bezier(.2,.7,.4,1)" }).onfinish = () => c.remove();
      }
    }

    /* ---------- load */
    function load(s) {
      scen = s;
      states = window.OxXray.build(s);
      asked = {};
      prevState = null;
      [crabEls, fluffEls, poolEls, listyBlocks].forEach((m) => m.clear());
      leashEls.clear();
      pools.innerHTML = ""; bank.innerHTML = ""; svg.innerHTML = "";
      $(".st-title", el).textContent = s.title || "";
      const hl = window.Ox && Ox.highlight ? Ox.highlight(s.code.replace(/^\n/, ""), "rust") : esc(s.code);
      const lines = window.Ox && Ox.splitLines ? Ox.splitLines(hl) : hl.split("\n");
      codePre.innerHTML = lines.map((l, k) => `<span class="ln" data-line="${k + 1}"><span class="lnno">${k + 1}</span>${l || " "}</span>`).join("");
      $$(".st-picker button", el).forEach((b) => b.classList.toggle("is-primary", b.dataset.id === s.id));
      if (!$(".st-diagram", el).hidden) showDiagram();
      show(0, { instant: true });
    }

    /* ---------- render one state */
    function render(st, step, { instant = false } = {}) {
      const before = prevState;
      const fresh = (set, id) => !instant && !set.has(id);
      const prevVars = new Set(), prevBlocks = new Map();
      if (before) { before.frames.forEach((f) => f.vars.forEach((v) => prevVars.add(v.id))); before.heap.forEach((b) => prevBlocks.set(b.id, b)); }

      // tide pools (frames) and crabs (variables)
      const liveFrames = new Set();
      st.frames.forEach((f) => {
        liveFrames.add(f.id);
        let pe = poolEls.get(f.id);
        if (!pe) {
          pe = document.createElement("div");
          pe.className = "st-pool";
          pe.innerHTML = `<span class="st-pool-name">fn ${esc(f.name)}()</span><div class="st-crabs"></div>`;
          pools.appendChild(pe);
          poolEls.set(f.id, pe);
        }
        const row = $(".st-crabs", pe);
        const liveVars = new Set(f.vars.map((v) => v.id));
        $$(":scope > .st-crab", row).forEach((ce) => {
          if (!liveVars.has(ce.dataset.id) && !ce.classList.contains("is-leaving")) leave(ce, crabEls, instant);
        });
        f.vars.forEach((v) => {
          let ce = crabEls.get(v.id);
          if (!ce || ce.parentElement !== row) {
            if (ce) ce.remove();
            ce = document.createElement("div");
            ce.dataset.id = v.id;
            ce.style.setProperty("--phase", (-Math.random() * 3).toFixed(2) + "s");
            ce.innerHTML = `<div class="st-crab-art">${crabSvg()}<i class="st-anchor"></i></div><div class="st-tag"></div>`;
            row.appendChild(ce);
            crabEls.set(v.id, ce);
            if (fresh(prevVars, v.id)) { ce.classList.add("is-entering"); setTimeout(() => ce.classList.remove("is-entering"), 600); }
          }
          paintCrab(ce, v);
        });
      });
      poolEls.forEach((pe, id) => {
        if (liveFrames.has(id)) return;
        poolEls.delete(id);
        $$(".st-crab", pe).forEach((ce) => crabEls.delete(ce.dataset.id));
        pe.classList.add("is-leaving");
        setTimeout(() => pe.remove(), instant || reduce() ? 0 : 400);
      });
      if (!st.frames.length && !$(".st-empty", pools)) pools.innerHTML = `<span class="st-empty">No calls yet.</span>`;
      if (st.frames.length) { const e = $(".st-empty", pools); if (e) e.remove(); }

      // fluffies (heap values)
      const liveBlocks = new Set(st.heap.map((b) => b.id));
      fluffEls.forEach((fe, id) => { if (!liveBlocks.has(id)) poof(fe, instant); });
      st.heap.forEach((b) => {
        let fe = fluffEls.get(b.id);
        if (!fe) {
          fe = document.createElement("div");
          fe.dataset.id = b.id;
          fe.style.setProperty("--phase", (-Math.random() * 3).toFixed(2) + "s");
          fe.innerHTML = `<div class="st-fluffy-art">${fluffySvg()}</div><div class="st-tag"></div>`;
          bank.appendChild(fe);
          fluffEls.set(b.id, fe);
          if (!instant && !prevBlocks.has(b.id)) {
            fe.classList.add("is-entering");
            setTimeout(() => fe.classList.remove("is-entering"), 600);
            // A clone pops out of the value it copies.
            const twin = [...prevBlocks.values()].find((x) => x.cells.join("\u0000") === b.cells.join("\u0000") && fluffEls.get(x.id));
            if (twin && !reduce()) {
              const a = boxIn(fluffEls.get(twin.id), stage), z = boxIn(fe, stage);
              $(".st-fluffy-art", fe).animate([{ transform: `translate(${a.x - z.x}px, ${a.y - z.y}px) scale(0.5)` }, { transform: "none" }], { duration: 600, easing: "cubic-bezier(.3,1.4,.5,1)" });
            }
          }
        }
        fe.className = ["st-fluffy", b.status === "freed" && "is-freed", b.flash && prevBlocks.has(b.id) && !instant && "is-flash", fe.classList.contains("is-entering") && "is-entering"].filter(Boolean).join(" ");
        $(".st-tag", fe).innerHTML = `<b class="st-cells">${contentOf(b, listyBlocks)}</b><small>${esc(b.status === "freed" ? "freed memory" : b.label || "heap value")}</small>`;
        let rc = $(".st-rc", fe);
        if (b.rc !== undefined) {
          if (!rc) { rc = document.createElement("span"); rc.className = "st-rc"; fe.appendChild(rc); }
          if (rc.textContent !== "rc " + b.rc) { rc.textContent = "rc " + b.rc; if (!instant) { rc.classList.remove("is-flash"); void rc.offsetWidth; rc.classList.add("is-flash"); } }
        } else if (rc) rc.remove();
      });
      if (!st.heap.length && !$(".st-empty", bank)) bank.innerHTML = `<span class="st-empty">Nothing on the heap.</span>`;
      if (st.heap.length) { const e = $(".st-empty", bank); if (e) e.remove(); }

      // stdout, current line, inspector, screen-reader summary
      term.hidden = !st.out.length;
      term.textContent = st.out.join("\n");
      $$(".ln", codePre).forEach((ln) => {
        const n = +ln.dataset.line;
        ln.classList.toggle("is-now", n === st.line && !step.error);
        ln.classList.toggle("is-err", n === st.line && !!step.error);
      });
      const now = $(`.ln[data-line="${st.line}"]`, codePre);
      if (now) { const c = $(".st-code", el); if (now.offsetTop < c.scrollTop || now.offsetTop + now.offsetHeight > c.scrollTop + c.clientHeight) c.scrollTop = Math.max(0, now.offsetTop - 40); }
      inspect(st, step);
      live.textContent = describe(st, step);
      leashes(st, before, instant);
      prevState = st;
    }

    function paintCrab(ce, v) {
      const s = v.status || "";
      const kind = kindOf(v.val);
      const ghost = s.includes("moved"), ended = s.includes("ended");
      const holding = !ghost && !ended && (kind === "owner" || kind === "plain");
      ce.className = ["st-crab", "is-" + kind, kind === "plain" && !ghost && "has-pebble", ghost && "is-ghost", ended && "is-ended", s.includes("err") && "is-err", v.flash && "is-flash", ce.classList.contains("is-entering") && "is-entering"].filter(Boolean).join(" ");
      $(".cr-claw-r", ce).setAttribute("d", claw(103, 28, 11, -55, !holding));
      const state = ghost ? "moved: can't be used" : ended ? "done borrowing" : kind === "plain" ? `= ${esc(v.val.v)}` : "";
      $(".st-tag", ce).innerHTML = `${v.mut ? '<span style="font-weight:400;color:var(--muted)">mut </span>' : ""}${esc(v.name)}<small>${esc(v.type || "")}</small>${state ? `<em>${state}</em>` : ""}`;
      const stamp = $(".st-stamp", ce);
      if (s.includes("err") && !stamp) ce.insertAdjacentHTML("beforeend", `<span class="st-stamp">${esc(errCode() || "error")}</span>`);
      if (!s.includes("err") && stamp) stamp.remove();
    }

    function leave(ce, map, instant) {
      map.delete(ce.dataset.id);
      if (instant || reduce()) { ce.remove(); return; }
      ce.classList.add("is-leaving");
      setTimeout(() => ce.remove(), 520);
    }

    function poof(fe, instant) {
      fluffEls.delete(fe.dataset.id);
      if (instant || reduce()) { fe.remove(); return; }
      const b = boxIn($(".st-fluffy-art", fe), stage);
      for (let k = 0; k < 8; k++) {
        const p = document.createElement("i");
        p.className = "st-puff";
        p.style.left = b.x + b.w / 2 + "px";
        p.style.top = b.y + b.h / 2 + "px";
        stage.appendChild(p);
        const a = (k / 8) * Math.PI * 2;
        p.animate([{ transform: "translate(0,0) scale(1)", opacity: 0.9 }, { transform: `translate(${Math.cos(a) * 46}px, ${Math.sin(a) * 40}px) scale(0.2)`, opacity: 0 }], { duration: 520, easing: "ease-out" }).onfinish = () => p.remove();
      }
      fe.classList.add("is-leaving");
      setTimeout(() => fe.remove(), 460);
    }

    /* ---------- the Inspector (borrow checker) */
    function errCode() {
      const step = scen.steps[i] || {};
      const m = /error\[(E\d{4})\]/.exec(step.say || "");
      return m ? m[1] : scen.check && /^E\d{4}$/.test(scen.check) ? scen.check : "";
    }
    function inspect(st, step) {
      const bad = step.error || st.frames.some((f) => f.vars.some((v) => (v.status || "").includes("err")));
      if (!bad) { inspector.hidden = true; return; }
      const text = (step.say || "").replace(/<\/p>/g, "\n").replace(/<[^>]+>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
      const m = /error\[(E\d{4})\]:\s*([^\n]*)/.exec(text);
      $(".st-bubble", inspector).innerHTML = `<b>${esc(m ? m[1] : errCode() || "rejected")}</b>${m ? esc(m[2].trim()) : "The compiler refuses this program."}`;
      if (inspector.hidden) { inspector.hidden = false; inspector.style.animation = "none"; void inspector.offsetWidth; inspector.style.animation = ""; }
    }

    /* ---------- leashes (pointers) */
    function anchors(v, st) {
      const ce = crabEls.get(v.id);
      if (!ce || ce.classList.contains("is-leaving")) return null;
      const a = boxIn($(".st-anchor", ce), stage);
      const t = targetOf(v.val);
      const fe = fluffEls.get(t), te = crabEls.get(t);
      let e;
      if (fe) {
        const art = boxIn($(".st-fluffy-art", fe), stage);
        e = art.x > a.x + 20 ? { x: art.x + 6, y: art.y + art.h * 0.5 } : { x: art.x + art.w * 0.5, y: art.y + 4 };
      } else if (te) {
        const art = boxIn($(".st-crab-art", te), stage);
        e = { x: art.x + art.w * 0.5, y: art.y + 4 };
      } else return null;
      return { x1: a.x, y1: a.y, x2: e.x, y2: e.y };
    }
    function rope({ x1, y1, x2, y2 }) {
      const dx = x2 - x1, dy = y2 - y1, sag = Math.min(64, 16 + Math.hypot(dx, dy) * 0.16);
      return `M${x1},${y1} C${x1 + dx * 0.3},${y1 + sag} ${x2 - dx * 0.3},${y2 + sag + dy * 0.1} ${x2},${y2}`;
    }
    function wanted(st) {
      const out = [];
      st.frames.forEach((f) => f.vars.forEach((v) => {
        const s = v.status || "";
        const t = targetOf(v.val);
        if (t === undefined || s.includes("moved") || s.includes("ended")) return;
        const block = st.heap.find((b) => b.id === t);
        const kind = block && block.status === "freed" ? "bad" : v.val.ptr !== undefined ? "own" : v.val.mut !== undefined ? "mut" : "ref";
        out.push({ key: `${v.id}>${t}>${kind}`, v, t, kind });
      }));
      return out;
    }
    function drawLeash(g, L) {
      const pos = anchors(L.v, prevState || {});
      if (!pos) return false;
      const d = rope(pos);
      const cls = { own: "lz-own", ref: "lz-ref", mut: "lz-mut", bad: "lz-bad" }[L.kind];
      g.innerHTML = `<path class="${cls}" d="${d}"/>${L.kind === "own" ? `<path class="lz-twist" d="${d}"/>` : ""}<circle class="lz-end is-${L.kind}" cx="${pos.x2}" cy="${pos.y2}" r="4"/>`;
      const path = g.firstChild, mid = path.getPointAtLength(path.getTotalLength() / 2);
      if (L.kind === "mut") g.insertAdjacentHTML("beforeend", `<g class="lz-lock" transform="translate(${mid.x - 6},${mid.y - 7})"><path d="M3 6 V3.5 a3 3 0 0 1 6 0 V6"/><rect x="0.5" y="6" width="11" height="8" rx="2"/></g>`);
      if (L.kind === "bad") g.insertAdjacentHTML("beforeend", `<g class="lz-warn" transform="translate(${mid.x},${mid.y})"><circle r="8"/><text x="-2.5" y="4">!</text></g>`);
      return true;
    }
    function tie(g, L, delay) {
      setTimeout(() => {
        if (!g.isConnected || !drawLeash(g, L)) return;
        g.style.opacity = 1;
        if (reduce()) return;
        const p = g.firstChild, len = p.getTotalLength();
        if (L.kind === "own" || L.kind === "mut" || L.kind === "bad") {
          p.style.strokeDasharray = L.kind === "bad" ? "" : `${len}`;
          p.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], { duration: 420, easing: "ease-out" }).onfinish = () => { p.style.strokeDasharray = ""; };
        }
        g.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300 });
      }, reduce() ? 0 : delay);
    }
    function travel(fromV, toV, delay) {
      if (reduce()) return;
      const a = crabEls.get(fromV), b = crabEls.get(toV);
      if (!a || !b) return;
      setTimeout(() => {
        const p = boxIn($(".st-anchor", a), stage), q = boxIn($(".st-anchor", b), stage);
        const h = document.createElement("i");
        h.className = "st-handle";
        h.style.left = p.x + "px"; h.style.top = p.y + "px";
        stage.appendChild(h);
        const dx = q.x - p.x, dy = q.y - p.y;
        h.animate([{ transform: "translate(0,0)" }, { transform: `translate(${dx / 2}px, ${dy / 2 - 46}px)` }, { transform: `translate(${dx}px, ${dy}px)` }], { duration: 520, easing: "ease-in-out" }).onfinish = () => h.remove();
      }, delay);
    }
    function leashes(st, before, instant) {
      const want = wanted(st), keys = new Set(want.map((L) => L.key));
      const removed = [];
      leashEls.forEach((g, key) => {
        if (keys.has(key)) return;
        leashEls.delete(key);
        removed.push(key);
        if (instant || reduce()) { g.remove(); return; }
        g.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 240, fill: "forwards" }).onfinish = () => g.remove();
      });
      want.forEach((L) => {
        let g = leashEls.get(L.key);
        if (g) { drawLeash(g, L); return; }
        g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        g.style.opacity = 0;
        svg.appendChild(g);
        leashEls.set(L.key, g);
        if (instant) { tie(g, L, 0); return; }
        // A move: the leash that left a now-moved owner travels to the new one.
        const handoff = L.kind === "own" && removed.map((k) => k.split(">")).find(([from, t]) => t === L.t && from !== L.v.id);
        const entering = before && !before.frames.some((f) => f.vars.some((v) => v.id === L.v.id));
        if (handoff) { travel(handoff[0], L.v.id, 380); tie(g, L, 900); }
        else tie(g, L, entering ? 480 : 160);
      });
      svg.setAttribute("viewBox", `0 0 ${stage.offsetWidth} ${stage.offsetHeight}`);
    }
    function redraw() {
      if (!states) return;
      svg.setAttribute("viewBox", `0 0 ${stage.offsetWidth} ${stage.offsetHeight}`);
      const want = wanted(states[i]);
      want.forEach((L) => { const g = leashEls.get(L.key); if (g && g.style.opacity !== "0") drawLeash(g, L); });
    }

    function describe(st, step) {
      const parts = [];
      st.frames.forEach((f) => f.vars.forEach((v) => {
        const s = v.status || "", t = targetOf(v.val), b = st.heap.find((x) => x.id === t);
        const what = b ? `${b.cells.join(b.cells.some((c) => c.length > 1) ? ", " : "")} on the heap` : t !== undefined ? t : "";
        if (s.includes("moved")) parts.push(`${v.name} is moved and can't be used`);
        else if (s.includes("ended")) parts.push(`${v.name} is done borrowing`);
        else if (v.val.ptr !== undefined) parts.push(`${v.name} owns ${what}`);
        else if (v.val.mut !== undefined) parts.push(`${v.name} borrows ${what} mutably`);
        else if (v.val.ref !== undefined) parts.push(`${v.name} borrows ${what}`);
        else parts.push(`${v.name} is ${v.val.v}`);
      }));
      if (step.error) parts.push(`The compiler rejects this line${errCode() ? " with " + errCode() : ""}`);
      return parts.join(". ") + (parts.length ? "." : "");
    }

    /* ---------- stepping */
    function narrate(step) {
      say.classList.toggle("is-error", !!step.error);
      say.innerHTML = step.say || "";
    }
    function show(k, opts = {}) {
      i = Math.max(0, Math.min(states.length - 1, k));
      const step = scen.steps[i];
      render(states[i], step, opts);
      narrate(step);
      if (!opts.keepMood) mood(step.error ? "wow" : opts.instant ? "" : "talk", step.error ? 0 : 900);
      controls();
    }
    function ask(step) {
      stopAuto();
      const a = step.ask;
      mood("think");
      say.classList.remove("is-error");
      say.innerHTML = `<p><strong>Predict:</strong> ${a.q}</p><div class="st-ask"></div>`;
      const box = $(".st-ask", say);
      a.choices.forEach((c, k) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "ox-choice";
        b.innerHTML = `<span class="ox-key">${"ABCDEF"[k]}</span><span>${c}</span>`;
        b.addEventListener("click", async () => {
          asked[i] = true;
          const right = k === a.answer;
          $$("button", box).forEach((x, j) => { x.disabled = true; x.classList.add(j === a.answer ? "is-correct" : j === k ? "is-wrong" : "is-faded"); });
          mood(right ? "happy" : "oops", 1600);
          if (right) { confetti(); if (window.Ox && Ox.award) Ox.award(5, "prediction", `xray:${scen.id}:${i}`); }
          await wait(700);
          show(i, { keepMood: true });
          say.insertAdjacentHTML("afterbegin", `<p><strong style="color:var(${right ? "--ok" : "--bad"})">${right ? "You called it." : "Not this time."}</strong> ${a.explain || ""}</p>`);
        });
        box.appendChild(b);
      });
      nextBtn.disabled = true;
      count();
    }
    function count() {
      $(".st-progress i", el).style.width = ((i + 1) / states.length) * 100 + "%";
      $(".st-count", el).textContent = `${i + 1} / ${states.length}`;
    }
    function controls() {
      count();
      nextBtn.disabled = i >= states.length - 1;
      $('[data-act="prev"]', el).disabled = i <= 0;
      if (i >= states.length - 1) { stopAuto(); if (window.Ox && Ox.award) Ox.award(5, "x-ray complete", "xray-done:" + scen.id); }
    }
    function stopAuto() { clearInterval(autoTimer); autoTimer = null; autoBtn.textContent = "Autoplay"; }
    function next() {
      if (i >= states.length - 1) return;
      const step = scen.steps[i + 1];
      if (step.ask && !asked[i + 1]) { i += 1; ask(step); return; }
      show(i + 1);
    }

    /* ---------- diagram view: the same scenario in the classic X-Ray */
    function showDiagram() {
      const host = $(".st-diagram", el);
      host.innerHTML = `<div class="ox-xray" data-scenario="${esc(scen.id)}" style="margin:0;border:0;border-radius:0;box-shadow:none"></div>`;
      window.OxXray.mount(host.firstChild);
    }
    $$("[data-view]", el).forEach((b) => b.addEventListener("click", () => {
      const diagram = b.dataset.view === "diagram";
      stopAuto();
      $$("[data-view]", el).forEach((x) => { const on = x === b; x.classList.toggle("is-primary", on); x.setAttribute("aria-pressed", String(on)); });
      $(".st-main", el).hidden = diagram;
      $(".st-diagram", el).hidden = !diagram;
      if (diagram) showDiagram(); else { $(".st-diagram", el).innerHTML = ""; show(i, { instant: true }); }
    }));

    nextBtn.addEventListener("click", next);
    $('[data-act="prev"]', el).addEventListener("click", () => { stopAuto(); show(i - 1, { instant: true }); });
    $('[data-act="restart"]', el).addEventListener("click", () => { stopAuto(); load(scen); });
    autoBtn.addEventListener("click", () => {
      if (autoTimer) return stopAuto();
      autoBtn.textContent = "Pause";
      next();
      autoTimer = setInterval(() => { const ask = i < states.length - 1 && scen.steps[i + 1].ask && !asked[i + 1]; next(); if (ask || i >= states.length - 1) stopAuto(); }, 2800);
    });
    el.addEventListener("keydown", (e) => {
      if (e.target.closest("button") && (e.key === " " || e.key === "Enter")) return;
      if (e.key === "ArrowRight") { e.preventDefault(); next(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); stopAuto(); show(i - 1, { instant: true }); }
    });
    const picker = $(".st-picker", el);
    if (picker) scens.forEach((s) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "ox-btn is-small";
      b.dataset.id = s.id;
      b.textContent = s.title;
      b.addEventListener("click", () => { stopAuto(); load(s); });
      picker.appendChild(b);
    });
    if ("ResizeObserver" in window) new ResizeObserver(() => redraw()).observe(stage);
    load(scens[0]);
  }

  function mountAll() { $$(".ox-story[data-scenario]").forEach(mountStory); }
  window.OxStory = { mount: mountStory, art: { crab: crabSvg, fluffy: fluffySvg, oxi: () => crabSvg(OXI_EXTRA), inspector: () => crabSvg(INSPECTOR_EXTRA) } };
  if (window.Ox && window.Ox.ready) mountAll();
  else document.addEventListener("ox:ready", mountAll);
})();
