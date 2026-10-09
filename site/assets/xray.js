/* ==========================================================================
   OXIDIZE — Memory X-Ray and Lifetime Timeline widgets.

   <div class="ox-xray" data-scenario="move-string"></div>
   <div class="ox-xray" data-scenario="a,b,c"></div>      (picker)
   <div class="ox-timeline" data-scenario="dangling"></div>

   Scenarios are registered in assets/scenarios/*.js:
     (window.OX_XRAY = window.OX_XRAY || []).push({ id, title, code, steps })
     (window.OX_TIMELINES = window.OX_TIMELINES || []).push({ ... })
   See docs/AUTHORING.md for the op reference.
   Every Memory X-Ray has a Story / Diagram switch. Story is drawn by story.js
   (OxStory.mount); the choice is one preference, Ox.state().view, shared by
   every X-Ray on the page (they follow on the "ox:view" document event).
   ========================================================================== */
(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const reduceMotion = () => window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------ state model */
  // data: read-only blocks in the binary (string literals, statics). They are
  // never freed and never Alloc'd, and they have their own zone.
  function emptyState() { return { frames: [], heap: [], data: [], out: [] }; }
  function findVar(st, id) {
    for (const f of st.frames) for (const v of f.vars) if (v.id === id) return v;
    return null;
  }
  function top(st) { return st.frames[st.frames.length - 1]; }
  function findBlock(st, id) { return st.heap.find((b) => b.id === id); }

  function toVal(v) {
    if (v === null || v === undefined) return { v: "" };
    if (typeof v === "object") return clone(v);
    return { v: String(v) };
  }
  function kindOf(val) {
    if (val.mut !== undefined) return "mutref";
    if (val.ref !== undefined) return "ref";
    if (val.ptr !== undefined) return "owner";
    return "plain";
  }

  function apply(st, op, scen) {
    const [name, ...a] = op;
    const fail = (msg) => console.warn(`[xray:${scen.id}] ${msg}`, op);
    switch (name) {
      case "frame": st.frames.push({ id: a[1] || a[0] + ":" + st.frames.length, name: a[0], vars: [] }); break;
      case "pop": {
        const f = st.frames.pop();
        if (!f) fail("pop on empty stack");
        break;
      }
      case "let": {
        const [vname, type, value, opts = {}] = a;
        const f = opts.frame ? st.frames.find((x) => x.name === opts.frame) : top(st);
        if (!f) { fail("let without frame"); break; }
        const id = opts.id || vname;
        const existing = findVar(st, id);
        const val = toVal(value);
        if (existing) { existing.type = type; existing.val = val; existing.status = ""; }
        else f.vars.push({ id, name: vname, type, val, status: "", mut: !!opts.mut });
        break;
      }
      case "set": {
        const v = findVar(st, a[0]);
        if (!v) { fail("set unknown var"); break; }
        v.val = toVal(a[1]);
        v.status = "";
        v.flash = true;
        break;
      }
      case "move":
      case "copy": {
        const [from, to, opts = {}] = a;
        const src = findVar(st, from);
        if (!src) { fail(name + " unknown source"); break; }
        const f = opts.frame ? st.frames.find((x) => x.name === opts.frame) : top(st);
        const id = opts.id || to;
        const dst = findVar(st, id);
        const val = clone(src.val);
        if (dst) { dst.val = val; dst.status = ""; dst.flash = true; if (opts.type) dst.type = opts.type; }
        else f.vars.push({ id, name: to, type: opts.type || src.type, val, status: "", mut: !!opts.mut, flash: true });
        if (name === "move") src.status = "moved";
        break;
      }
      case "clone": {
        const [from, to, newHeap, opts = {}] = a;
        const src = findVar(st, from);
        if (!src) { fail("clone unknown source"); break; }
        const val = clone(src.val);
        if (src.val.ptr && newHeap) {
          const b = findBlock(st, src.val.ptr);
          if (b) st.heap.push(Object.assign(clone(b), { id: newHeap, status: "" }));
          val.ptr = newHeap;
        }
        const f = top(st);
        f.vars.push({ id: opts.id || to, name: to, type: opts.type || src.type, val, status: "", flash: true });
        break;
      }
      case "drop": {
        for (const f of st.frames) {
          const i = f.vars.findIndex((v) => v.id === a[0]);
          if (i >= 0) {
            const v = f.vars[i];
            if (v.status !== "moved" && v.val.ptr !== undefined && !a[1]) {
              const b = findBlock(st, v.val.ptr);
              if (b) {
                if (b.rc !== undefined && b.rc > 1) b.rc -= 1;
                else st.heap = st.heap.filter((x) => x.id !== b.id);
              }
            }
            f.vars.splice(i, 1);
            return;
          }
        }
        fail("drop unknown var");
        break;
      }
      case "forget": {
        for (const f of st.frames) f.vars = f.vars.filter((v) => v.id !== a[0]);
        break;
      }
      case "end": {
        const v = findVar(st, a[0]);
        if (v) v.status = "ended";
        break;
      }
      // A name reused by a newer `let`: the old variable still exists, nothing can name it.
      case "shadow": {
        const v = findVar(st, a[0]);
        if (v) v.status = "shadowed";
        break;
      }
      case "ghost": {
        const v = findVar(st, a[0]);
        if (v) v.status = "moved";
        break;
      }
      case "err": {
        const v = findVar(st, a[0]);
        if (v) v.status = (v.status ? v.status + " " : "") + "err";
        break;
      }
      case "alloc": {
        const [id, content, cap, opts = {}] = a;
        const cells = Array.isArray(content) ? content.map(String) : Array.from(String(content));
        st.heap.push({ id, cells, cap: cap || cells.length, label: opts.label || "", rc: opts.rc, status: "" });
        break;
      }
      case "heap": {
        const [id, content, cap] = a;
        const b = findBlock(st, id);
        if (!b) { fail("heap unknown block"); break; }
        b.cells = Array.isArray(content) ? content.map(String) : Array.from(String(content));
        if (cap) b.cap = cap;
        b.flash = true;
        break;
      }
      case "realloc": {
        const [oldId, newId, content, cap] = a;
        const old = findBlock(st, oldId);
        const cells = Array.isArray(content) ? content.map(String) : Array.from(String(content));
        st.heap.push({ id: newId, cells, cap: cap || cells.length, label: old ? old.label : "", status: "", flash: true });
        for (const f of st.frames) for (const v of f.vars) {
          if (v.val.ptr === oldId) v.val.ptr = newId;
        }
        // Owners follow the data to the new block. References don't: if any
        // still point at the old block, keep it on screen as freed memory so
        // the dangling arrow is visible.
        const dangling = st.frames.some((f) => f.vars.some((v) => v.val.ref === oldId || v.val.mut === oldId));
        if (old && dangling) { old.status = "freed"; old.label = "freed"; delete old.flash; }
        else st.heap = st.heap.filter((x) => x.id !== oldId);
        break;
      }
      case "free": st.heap = st.heap.filter((x) => x.id !== a[0]); break;
      case "rc": { const b = findBlock(st, a[0]); if (b) { b.rc = a[1]; b.flash = true; } break; }
      case "label": { const b = findBlock(st, a[0]); if (b) b.label = a[1]; break; }
      // ["static", id, content, len, {label, show}]: bytes in read-only data.
      case "static": {
        const [id, content, len, opts = {}] = a;
        const cells = Array.isArray(content) ? content.map(String) : Array.from(String(content));
        st.data.push({ id, cells, cap: len || cells.length, label: opts.label || "", show: opts.show, status: "", static: true });
        break;
      }
      case "out": st.out.push(String(a[0])); break;
      default: fail("unknown op");
    }
  }

  function buildStates(scen) {
    const states = [];
    let st = emptyState();
    scen.steps.forEach((step) => {
      st = clone(st);
      for (const f of st.frames) for (const v of f.vars) delete v.flash;
      for (const b of st.heap) delete b.flash;
      for (const b of st.data) delete b.flash;
      st.heap = st.heap.filter((b) => b.status !== "freed" || st.frames.some((f) => f.vars.some((v) => v.val.ref === b.id || v.val.mut === b.id)));
      (step.ops || []).forEach((op) => apply(st, op, scen));
      st.line = step.line || 0;
      states.push(st);
    });
    return states;
  }

  /* ------------------------------------------------------------ rendering */
  function valHtml(v) {
    const val = v.val;
    const parts = [];
    if ((v.status || "").includes("moved")) return `<span>moved: unusable</span>`;
    if (val.v !== undefined && val.v !== "") parts.push(`<span>${esc(val.v)}</span>`);
    const target = val.ptr !== undefined ? val.ptr : val.mut !== undefined ? val.mut : val.ref;
    if (target !== undefined) parts.push(`<span class="xr-cell is-ptr" data-ptr="1"><small>ptr</small>●</span>`);
    if (val.meta) for (const [k, x] of Object.entries(val.meta)) parts.push(`<span class="xr-cell"><small>${esc(k)}</small>${esc(x)}</span>`);
    return parts.join("") || `<span style="opacity:.5">—</span>`;
  }

  // The Diagram view: the classic Memory X-Ray. start = { id, step } picks the
  // scenario and the step it opens at (both default to the first).
  function mountDiagram(el, start = {}) {
    enter(el, "diagram");
    const lib = window.OX_XRAY || [];
    const ids = (el.dataset.scenario || "").split(",").map((s) => s.trim()).filter(Boolean);
    const scens = ids.map((id) => lib.find((s) => s.id === id)).filter(Boolean);
    if (!scens.length) { el.innerHTML = `<p style="padding:14px">Memory X-Ray scenario <code>${esc(ids.join(", "))}</code> not found.</p>`; return; }

    el.innerHTML = `
      <div class="xr-head">
        <span class="ox-label">Memory X-Ray</span>
        <span class="xr-title"></span>
        <span class="xr-legend">
          <span class="ox-chip is-own">owner</span><span class="ox-chip is-ref">&amp; borrow</span><span class="ox-chip is-mut">&amp;mut</span>
        </span>
        ${viewControl("diagram")}
      </div>
      ${scens.length > 1 ? `<div class="xr-head xr-picker" role="group" aria-label="Programs"></div>` : ""}
      <div class="xr-body">
        <div class="xr-code"><pre></pre></div>
        <div class="xr-stage">
          <div class="xr-lane is-stack"><div class="xr-lane-title">Stack <small>fixed size, per call</small></div><div class="xr-frames"></div></div>
          <div class="xr-lane is-heap"><div class="xr-lane-title">Heap <small>growable, via pointer</small></div><div class="xr-heap"></div></div>
          <div class="xr-lane is-data" hidden><div class="xr-lane-title">Binary <small>(read-only data)</small></div><div class="xr-data"></div></div>
          <div class="xr-out" hidden></div>
          <svg class="xr-arrows" aria-hidden="true"></svg>
        </div>
      </div>
      <div class="xr-foot">
        <div class="xr-narr"><div class="xr-narr-who"></div><div class="xr-narr-text"></div></div>
      </div>
      <div class="xr-controls">
        <button type="button" class="ox-btn is-small" data-act="restart" title="Restart">⟲</button>
        <button type="button" class="ox-btn is-small" data-act="prev" title="Previous step (←)">◀ Back</button>
        <button type="button" class="ox-btn is-small is-primary" data-act="next" title="Next step (→)">Step ▶</button>
        <button type="button" class="ox-btn is-small" data-act="auto" title="Play automatically">Autoplay</button>
        <span class="xr-progress"><i></i></span>
        <span class="xr-count"></span>
      </div>`;
    el.tabIndex = 0;
    const who = $(".xr-narr-who", el);
    who.innerHTML = (window.Ox && Ox.icon && Ox.icon.crab) || "";
    const codePre = $(".xr-code pre", el);
    const framesEl = $(".xr-frames", el);
    const heapEl = $(".xr-heap", el);
    const dataLane = $(".xr-lane.is-data", el);
    const dataEl = $(".xr-data", el);
    const outEl = $(".xr-out", el);
    const svg = $(".xr-arrows", el);
    const stage = $(".xr-stage", el);
    const narr = $(".xr-narr", el);
    const narrText = $(".xr-narr-text", el);
    const titleEl = $(".xr-title", el);
    const prog = $(".xr-progress i", el);
    const count = $(".xr-count", el);
    const nextBtn = $('[data-act="next"]', el);
    const autoBtn = $('[data-act="auto"]', el);

    // pending: the step whose prediction is on screen (-1 for none). A pending
    // question blocks Step, ArrowRight and autoplay until it is answered.
    // answering: an answer is being shown, so nothing may move yet.
    let scen, states, i, asked, autoTimer = null, pending = -1, answering = false;
    const varEls = new Map(), blockEls = new Map(), frameEls = new Map();

    // start.answered: the view that handed over had already answered step `step`.
    function load(s, step = 0, start = {}) {
      scen = s;
      states = buildStates(s);
      i = Math.max(0, Math.min(states.length - 1, step));
      // Steps before this one were passed, so their questions are answered.
      asked = {};
      for (let j = 0; j < i; j++) asked[j] = true;
      asked[i] = !!start.answered || !s.steps[i].ask;
      pending = -1; answering = false;
      varEls.clear(); blockEls.clear(); frameEls.clear();
      framesEl.innerHTML = ""; heapEl.innerHTML = ""; dataEl.innerHTML = ""; svg.innerHTML = "";
      dataLane.hidden = !states.some((st) => st.data.length);
      titleEl.textContent = s.title || "";
      const hl = window.Ox && Ox.highlight ? Ox.highlight(s.code.replace(/^\n/, ""), "rust") : esc(s.code);
      const lines = window.Ox && Ox.splitLines ? Ox.splitLines(hl) : hl.split("\n");
      codePre.innerHTML = lines.map((l, k) => `<span class="ln" data-line="${k + 1}"><span class="lnno">${k + 1}</span>${l || " "}</span>`).join("");
      if (picker) $$("button", picker).forEach((b) => b.classList.toggle("is-primary", b.dataset.id === s.id));
      show(i);
    }

    function renderState(st, step) {
      // frames
      const liveFrames = new Set();
      st.frames.forEach((f) => {
        liveFrames.add(f.id);
        let fe = frameEls.get(f.id);
        if (!fe) {
          fe = document.createElement("div");
          fe.className = "xr-frame";
          fe.innerHTML = `<div class="xr-frame-name">fn ${esc(f.name)}()</div>`;
          framesEl.appendChild(fe);
          frameEls.set(f.id, fe);
        }
        const liveVars = new Set(f.vars.map((v) => v.id));
        $$(":scope > .xr-var", fe).forEach((ve) => {
          if (!liveVars.has(ve.dataset.id) && !ve.classList.contains("is-leaving")) {
            ve.classList.add("is-leaving");
            varEls.delete(ve.dataset.id);
            setTimeout(() => ve.remove(), reduceMotion() ? 0 : 430);
          }
        });
        f.vars.forEach((v) => {
          let ve = varEls.get(v.id);
          if (!ve || ve.parentElement !== fe) {
            if (ve) ve.remove();
            ve = document.createElement("div");
            ve.dataset.id = v.id;
            fe.appendChild(ve);
            varEls.set(v.id, ve);
          }
          const kind = kindOf(v.val);
          const st2 = v.status || "";
          const shadowed = st2.includes("shadowed");
          ve.className = ["xr-var", "is-" + kind, st2.includes("moved") && "is-moved", st2.includes("err") && "is-err", st2.includes("ended") && "is-moved", shadowed && "is-shadowed", v.flash && "is-flash"].filter(Boolean).join(" ");
          const shown = shadowed ? "<span>shadowed (name reused)</span>" : st2.includes("ended") ? "<span>last use passed</span>" : valHtml(v);
          ve.innerHTML = `<div class="xr-var-name"><b>${v.mut ? '<span style="font-weight:500;color:var(--muted)">mut </span>' : ""}${esc(v.name)}</b><small>${esc(v.type || "")}</small></div><div class="xr-var-val">${shown}</div>`;
        });
        let empty = $(":scope > .xr-frame-empty", fe);
        if (!f.vars.length && !empty) fe.appendChild(Object.assign(document.createElement("div"), { className: "xr-frame-empty", textContent: "no variables yet" }));
        if (f.vars.length && empty) empty.remove();
      });
      frameEls.forEach((fe, id) => {
        if (!liveFrames.has(id)) {
          frameEls.delete(id);
          $$(".xr-var", fe).forEach((ve) => varEls.delete(ve.dataset.id));
          fe.classList.add("is-leaving");
          setTimeout(() => fe.remove(), reduceMotion() ? 0 : 430);
        }
      });
      // heap and binary data (read-only, never freed)
      const allBlocks = st.heap.concat(st.data || []);
      const liveBlocks = new Set(allBlocks.map((b) => b.id));
      blockEls.forEach((be, id) => {
        if (!liveBlocks.has(id)) {
          blockEls.delete(id);
          be.classList.add("is-leaving");
          setTimeout(() => be.remove(), reduceMotion() ? 0 : 430);
        }
      });
      allBlocks.forEach((b) => {
        let be = blockEls.get(b.id);
        if (!be) { be = document.createElement("div"); be.dataset.id = b.id; (b.static ? dataEl : heapEl).appendChild(be); blockEls.set(b.id, be); }
        be.className = "xr-block" + (b.static ? " is-static" : "") + (b.flash ? " is-flash" : "") + (b.rc !== undefined ? " is-shared" : "") + (b.status === "freed" ? " is-freed" : "");
        const spare = b.static ? 0 : Math.max(0, (b.cap || 0) - b.cells.length);
        // `show` is the value as the program reads it (an i32 read as 5); it replaces the byte count.
        const right = b.rc !== undefined ? `<span class="xr-rc">count ${b.rc}</span>` : b.show !== undefined ? `<span class="xr-show">${esc(b.show)}</span>` : `<span>${b.cells.length}/${b.cap}</span>`;
        be.innerHTML = `<div class="xr-block-label"><span>${esc(b.label || "heap " + b.id)}</span>${right}</div>
          <div class="xr-bytes">${b.cells.map((c, k) => `<span class="xr-byte" data-i="${k}">${esc(c === " " ? "␠" : c)}</span>`).join("")}${"<span class=\"xr-byte is-spare\">·</span>".repeat(spare)}</div>`;
      });
      if (!st.heap.length && !$(".xr-heap-empty", heapEl)) heapEl.insertAdjacentHTML("beforeend", `<span class="xr-frame-empty xr-heap-empty">empty</span>`);
      if (st.heap.length) { const e = $(".xr-heap-empty", heapEl); if (e) e.remove(); }
      // stdout
      outEl.hidden = !st.out.length;
      outEl.textContent = st.out.join("\n");
      // code line
      $$(".ln", codePre).forEach((ln) => {
        const n = +ln.dataset.line;
        ln.classList.toggle("is-now", n === st.line && !step.error);
        ln.classList.toggle("is-err", n === st.line && !!step.error);
      });
      const nowLn = $(`.ln[data-line="${st.line}"]`, codePre);
      if (nowLn) {
        const c = $(".xr-code", el);
        const top = nowLn.offsetTop, bottom = top + nowLn.offsetHeight;
        if (top < c.scrollTop || bottom > c.scrollTop + c.clientHeight) c.scrollTop = Math.max(0, top - 40);
      }
      animateArrows(st);
    }

    function center(r, base) { return { x: r.left - base.left + r.width / 2, y: r.top - base.top + r.height / 2, l: r.left - base.left, r: r.right - base.left, t: r.top - base.top, b: r.bottom - base.top }; }

    function drawArrows(st, fresh) {
      const base = stage.getBoundingClientRect();
      svg.setAttribute("viewBox", `0 0 ${base.width} ${base.height}`);
      let html = "";
      st.frames.forEach((f) => f.vars.forEach((v) => {
        const target = v.val.ptr !== undefined ? v.val.ptr : v.val.mut !== undefined ? v.val.mut : v.val.ref;
        if (target === undefined) return;
        const ve = varEls.get(v.id);
        if (!ve || ve.classList.contains("is-leaving")) return;
        const cell = $("[data-ptr]", ve);
        const S = center((cell || ve).getBoundingClientRect(), base);
        const V = center(ve.getBoundingClientRect(), base);
        let kind = v.val.ptr !== undefined ? "own" : v.val.mut !== undefined ? "mut" : "ref";
        if ((v.status || "").includes("moved") || (v.status || "").includes("ended")) kind = "ghost";
        const tb = st.heap.find((b) => b.id === target);
        if (tb && tb.status === "freed") kind = "bad";
        const be = blockEls.get(target);
        const tv = varEls.get(target);
        let d, ex, ey, ang;
        if (be) {
          let tEl = be;
          if (v.val.at !== undefined) tEl = $(`.xr-byte[data-i="${v.val.at}"]`, be) || be;
          const T = center(tEl.getBoundingClientRect(), base);
          // An owner's line leaves the top of its ptr cell, runs along the gap
          // above the variable box and down the gutter beside it, so it never
          // crosses the len and cap cells (cap wraps under ptr). A line to a byte
          // keeps a curve.
          const sx = cell ? S.x : S.r, top = cell ? S.t : S.y, bot = cell ? S.b : S.y;
          // Borrows run in a second gutter, so an owner's line and a borrow's line never overlap.
          const run = V.t - 8, gx = V.r + (kind === "ref" || kind === "mut" ? 22 : 12);
          if (T.l > S.r + 8) {
            ex = T.l - 2; ey = v.val.at !== undefined ? T.t - 1 : T.y;
            if (v.val.at !== undefined) {
              ex = T.x; ey = T.t - 2;
              const dx = Math.max(30, (ex - sx) * 0.5);
              d = `M${sx},${bot} C${sx + dx * 0.4},${bot + 24} ${ex},${ey - 40} ${ex},${ey}`;
              ang = Math.PI / 2;
            } else {
              d = cell ? `M${sx},${top} V${run} H${gx} V${ey} H${ex}` : `M${S.r},${S.y} H${ex}`;
              ang = 0;
            }
          } else {
            // heap is below (narrow layout): up and over, then down the gutter into the block
            ex = T.x; ey = T.t - 2;
            d = cell ? `M${sx},${top} V${run} H${gx} V${ey - 14} H${ex} V${ey}` : `M${S.r},${S.y} C${S.r + 60},${S.y} ${ex},${ey - 60} ${ex},${ey}`;
            ang = Math.PI / 2;
          }
        } else if (tv) {
          const T = center(tv.getBoundingClientRect(), base);
          const sx = S.r, sy = S.y;
          ex = T.r + 2; ey = T.y;
          const bulge = 26 + Math.abs(sy - ey) * 0.25;
          const right = Math.max(sx, ex) + bulge;
          d = `M${sx},${sy} C${right},${sy} ${right},${ey} ${ex},${ey}`;
          ang = Math.PI;
        } else return;
        const hx = ex, hy = ey, sz = 7;
        const p1 = [hx - sz * Math.cos(ang - 0.45), hy - sz * Math.sin(ang - 0.45)];
        const p2 = [hx - sz * Math.cos(ang + 0.45), hy - sz * Math.sin(ang + 0.45)];
        html += `<path class="a-${kind}${fresh ? " is-drawing" : ""}" d="${d}"/><polygon class="a-head-${kind}" points="${hx},${hy} ${p1[0]},${p1[1]} ${p2[0]},${p2[1]}"/>`;
      }));
      svg.innerHTML = html;
    }
    let raf = 0;
    function animateArrows(st) {
      cancelAnimationFrame(raf);
      const t0 = performance.now();
      let first = true;
      const tick = (t) => {
        drawArrows(st, first && !reduceMotion());
        first = false;
        if (t - t0 < 520) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }

    function narrate(step) {
      narr.classList.toggle("is-error", !!step.error);
      narrText.innerHTML = step.say || "";
    }

    // Shows step k. A step with an unanswered prediction shows the question
    // instead of its narration, so the answer never appears before the reader
    // has made a call.
    function show(k) {
      i = Math.max(0, Math.min(states.length - 1, k));
      const step = scen.steps[i];
      if (step.ask && !asked[i]) { askQuestion(step); return; }
      pending = -1;
      renderState(states[i], step);
      narrate(step);
      updateControls();
    }

    function askQuestion(step) {
      stopAuto();
      pending = i;
      const prevState = states[Math.max(0, i - 1)];
      renderState(Object.assign(clone(prevState), { line: states[i].line }), {});
      narr.classList.remove("is-error");
      const a = step.ask;
      narrText.innerHTML = `<p><strong>Predict:</strong> ${a.q}</p><div class="xr-ask"></div>`;
      const box = $(".xr-ask", narrText);
      a.choices.forEach((c, k) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "ox-choice";
        b.innerHTML = `<span class="ox-key">${"ABCDEF"[k]}</span><span>${c}</span>`;
        b.addEventListener("click", () => {
          if (answering || asked[i]) return;
          const at = i;
          asked[at] = true;
          answering = true;
          const right = k === a.answer;
          $$("button", box).forEach((x, j) => { x.disabled = true; x.classList.add(j === a.answer ? "is-correct" : j === k ? "is-wrong" : "is-faded"); });
          if (right && window.Ox && Ox.award) Ox.award(5, "prediction", `xray:${scen.id}:${at}`);
          updateControls();
          setTimeout(() => {
            answering = false;
            if (i !== at) return;
            pending = -1;
            renderState(states[at], step);
            narrText.innerHTML = `<p><strong style="color:var(${right ? "--ok" : "--bad"})">${right ? "You called it." : "Not this time."}</strong> ${a.explain || ""}</p>${step.say || ""}`;
            narr.classList.toggle("is-error", !!step.error);
            updateControls();
          }, 650);
        });
        box.appendChild(b);
      });
      updateControls();
    }

    function updateCount() {
      prog.style.width = ((i + 1) / states.length) * 100 + "%";
      count.textContent = `${i + 1} / ${states.length}`;
    }
    // Step is off while a question is open or an answer is being shown.
    function updateControls() {
      updateCount();
      const blocked = pending >= 0 || answering;
      nextBtn.disabled = blocked || i >= states.length - 1;
      $('[data-act="prev"]', el).disabled = answering || i <= 0;
      if (i >= states.length - 1 && !blocked) {
        stopAuto();
        if (window.Ox && Ox.award) Ox.award(5, "x-ray complete", "xray-done:" + scen.id);
      }
    }
    function stopAuto() { clearInterval(autoTimer); autoTimer = null; autoBtn.textContent = "Autoplay"; }
    function goNext() {
      if (pending >= 0 || answering || i >= states.length - 1) return;
      show(i + 1);
    }
    // Back is allowed during a question. The question stays unanswered, so it
    // comes back when the reader steps forward again.
    function goBack() {
      if (answering || i <= 0) return;
      stopAuto();
      pending = -1;
      show(i - 1);
    }

    $('[data-act="next"]', el).addEventListener("click", goNext);
    $('[data-act="prev"]', el).addEventListener("click", goBack);
    $('[data-act="restart"]', el).addEventListener("click", () => { stopAuto(); load(scen, 0); });
    autoBtn.addEventListener("click", () => {
      if (autoTimer) return stopAuto();
      autoBtn.textContent = "Pause";
      autoTimer = setInterval(() => {
        if (pending >= 0 || answering || i >= states.length - 1) return stopAuto();
        goNext();
        if (pending >= 0) stopAuto();
      }, 2600);
    });
    el._oxKey = (e) => {
      if (e.target.closest("button") && (e.key === " " || e.key === "Enter")) return;
      if (e.key === "ArrowRight") { e.preventDefault(); goNext(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); goBack(); }
    };
    let picker = $(".xr-picker", el);
    if (picker) {
      scens.forEach((s) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "ox-btn is-small";
        b.dataset.id = s.id;
        b.textContent = s.title;
        b.addEventListener("click", () => { stopAuto(); load(s, 0); });
        picker.appendChild(b);
      });
    }
    if ("ResizeObserver" in window) { el._oxRO = new ResizeObserver(() => states && drawArrows(states[i], false)); el._oxRO.observe(stage); }
    el.oxLoad = (id) => { const s = lib.find((x) => x.id === id); if (s) { stopAuto(); load(s, 0); } };
    // A switch to the other view resumes here; an open question stays open.
    el._oxStart = () => ({ id: scen.id, step: i, answered: !!asked[i] || !scen.steps[i].ask });
    el._oxStop = () => { stopAuto(); cancelAnimationFrame(raf); };
    load(scens.find((s) => s.id === start.id) || scens[0], start.step || 0, start);
  }

  /* ============================================================ views
     Story / Diagram. One preference (Ox.state().view) for every X-Ray. A view
     clears the element with enter(), then sets el._oxStart (where it is),
     el._oxKey (keys) and el._oxStop (timers). The host listeners are wired
     once per element and survive every switch. */
  function prefView() {
    let v;
    try { v = window.Ox.state().view; } catch (e) { v = undefined; }
    return v === "diagram" || !window.OxStory ? "diagram" : "story";
  }
  function setPref(view) {
    try { if (window.Ox && Ox.state) { Ox.state().view = view; Ox.save(); } } catch (e) { /* storage unavailable */ }
  }
  // The Story / Diagram segmented control, for the header of either view.
  function viewControl(view) {
    if (!window.OxStory) return "";
    const b = (v, label) => `<button type="button" class="ox-btn is-small${view === v ? " is-primary" : ""}" data-view="${v}" aria-pressed="${view === v}">${label}</button>`;
    return `<span class="ox-btn-group xr-view" role="group" aria-label="View">${b("story", "Story")}${b("diagram", "Diagram")}</span>`;
  }
  function wire(el) {
    if (el._oxWired) return;
    el._oxWired = true;
    el.addEventListener("click", (e) => {
      const b = e.target.closest ? e.target.closest("[data-view]") : null;
      if (b && el.contains(b)) setView(el, b.dataset.view);
    });
    el.addEventListener("keydown", (e) => { if (el._oxKey) el._oxKey(e); });
  }
  // Clear an element for a new view and reset its mount flags so it can be
  // remounted. Stops whatever the previous view left running.
  function enter(el, view) {
    wire(el);
    if (el._oxStop) el._oxStop();
    if (el._oxRO) el._oxRO.disconnect();
    el._oxRO = el._oxStop = el._oxKey = el._oxStart = null;
    el.innerHTML = "";
    delete el.dataset.xrDone;
    delete el.dataset.stDone;
    el.dataset.xrView = view;
    el.dataset.xrDone = "1";
    el.tabIndex = 0;
  }
  function render(el, view, start) {
    if (view === "story" && window.OxStory) window.OxStory.mount(el, start);
    else mountDiagram(el, start);
  }
  // Public mount: the element opens in the view the preference names.
  function mountXray(el) {
    if (el.dataset.xrDone) return;
    render(el, prefView(), {});
  }
  // The switch: save the preference, re-render this X-Ray at the same
  // scenario and step, then let the other X-Rays on the page follow.
  function setView(el, view) {
    if (el.dataset.xrView === view) return;
    const start = el._oxStart ? el._oxStart() : {};
    const hadFocus = el.contains(document.activeElement);
    setPref(view);
    render(el, view, start);
    if (hadFocus) { const b = el.querySelector(`[data-view="${view}"]`); if (b) b.focus({ preventScroll: true }); }
    document.dispatchEvent(new CustomEvent("ox:view", { detail: { view } }));
  }
  document.addEventListener("ox:view", () => {
    const view = prefView();
    $$(".ox-xray[data-scenario]").forEach((el) => {
      if (el.dataset.xrDone && el.dataset.xrView !== view && el._oxStart) render(el, view, el._oxStart());
    });
  });

  /* ============================================================ timeline */
  function mountTimeline(el) {
    if (el.dataset.tlDone) return;
    el.dataset.tlDone = "1";
    const lib = window.OX_TIMELINES || [];
    const scen = lib.find((s) => s.id === el.dataset.scenario);
    if (!scen) { el.innerHTML = `<p style="padding:14px">Timeline <code>${esc(el.dataset.scenario)}</code> not found.</p>`; return; }
    const code = scen.code.replace(/^\n/, "").replace(/\s+$/, "");
    const hl = window.Ox && Ox.highlight ? Ox.highlight(code, "rust") : esc(code);
    const lines = window.Ox && Ox.splitLines ? Ox.splitLines(hl) : hl.split("\n");
    const vars = scen.vars;
    const rowH = 30;
    el.innerHTML = `
      <div class="xr-head"><span class="ox-label">Lifetime Timeline</span><span class="xr-title">${esc(scen.title || "")}</span>
        <span class="xr-legend"><span class="ox-chip is-own">owner lives</span><span class="ox-chip is-ref">&amp; borrow alive</span><span class="ox-chip is-mut">&amp;mut alive</span><span class="ox-chip is-bad">conflict</span></span></div>
      <div class="tl-scroll"><div class="tl-grid"></div></div>
      <div class="tl-foot"><div class="tl-note"></div>
        <div class="tl-controls">
          <button type="button" class="ox-btn is-small" data-act="prev">◀ Back</button>
          <button type="button" class="ox-btn is-small is-primary" data-act="next">Step ▶</button>
          <span class="xr-progress"><i></i></span><span class="xr-count"></span>
        </div></div>`;
    const grid = $(".tl-grid", el);
    grid.style.gridTemplateColumns = `minmax(max-content, 1fr) repeat(${vars.length}, minmax(76px, 100px))`;
    grid.style.gridTemplateRows = `auto repeat(${lines.length}, ${rowH}px)`;
    let html = `<div class="tl-head" style="text-align:left;background:var(--code-bg);color:var(--code-dim);border-bottom-color:var(--code-line)">code</div>`;
    vars.forEach((v) => { html += `<div class="tl-head is-${v.kind}">${esc(v.name)}<small>${esc(v.label || (v.kind === "own" ? "owner" : v.kind === "mut" ? "&mut borrow" : "& borrow"))}</small></div>`; });
    lines.forEach((l, k) => {
      const n = k + 1;
      html += `<div class="tl-code" data-line="${n}"><span class="lnno">${n}</span><span class="tl-src">${l || " "}</span></div>`;
      vars.forEach((v) => {
        let inner = "";
        const alive = n >= v.from && n <= v.to;
        if (alive) {
          const bad = (v.bad || []).includes(n);
          const cls = ["tl-bar", "is-" + v.kind, bad && "is-bad", n === v.from && "is-start", n === v.to && "is-end"].filter(Boolean).join(" ");
          inner += `<span class="${cls}" data-line="${n}"></span>`;
        }
        (scen.marks || []).filter((m) => m.var === v.name && m.line === n).forEach((m) => {
          inner += `<span class="tl-dot"></span><span class="tl-mark${m.bad ? " is-bad" : ""}">${esc(m.text)}</span>`;
        });
        html += `<div class="tl-cell">${inner}</div>`;
      });
    });
    grid.innerHTML = html + `<div class="tl-row-line"></div>`;
    const lineEl = $(".tl-row-line", grid);
    const note = $(".tl-note", el);
    const steps = scen.steps && scen.steps.length ? scen.steps : lines.map((_, k) => ({ line: k + 1 }));
    let i = 0;
    const prog = $(".xr-progress i", el), count = $(".xr-count", el);
    function show(k) {
      i = Math.max(0, Math.min(steps.length - 1, k));
      const s = steps[i];
      $$(".tl-code", grid).forEach((c) => {
        const n = +c.dataset.line;
        c.classList.toggle("is-now", n === s.line && !s.error);
        c.classList.toggle("is-err", n === s.line && !!s.error);
      });
      $$(".tl-bar", grid).forEach((b) => b.classList.toggle("is-dim", +b.dataset.line > s.line));
      const row = $(`.tl-code[data-line="${s.line}"]`, grid);
      if (row) lineEl.style.top = row.offsetTop + row.offsetHeight - 1 + "px";
      note.className = "tl-note" + (s.error ? " is-error" : "");
      note.innerHTML = s.say || "";
      prog.style.width = ((i + 1) / steps.length) * 100 + "%";
      count.textContent = `${i + 1} / ${steps.length}`;
      $('[data-act="prev"]', el).disabled = i === 0;
      $('[data-act="next"]', el).disabled = i === steps.length - 1;
      if (i === steps.length - 1 && window.Ox && Ox.award) Ox.award(5, "timeline complete", "tl-done:" + scen.id);
    }
    $('[data-act="next"]', el).addEventListener("click", () => show(i + 1));
    $('[data-act="prev"]', el).addEventListener("click", () => show(i - 1));
    el.tabIndex = 0;
    el.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") { e.preventDefault(); show(i + 1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); show(i - 1); }
    });
    requestAnimationFrame(() => show(0));
  }

  function mountAll() {
    $$(".ox-xray[data-scenario]").forEach(mountXray);
    $$(".ox-timeline[data-scenario]").forEach(mountTimeline);
  }
  window.OxXray = { mount: mountXray, mountDiagram, build: buildStates, enter, viewControl };
  window.OxTimeline = { mount: mountTimeline };
  // oxidize.js announces ox:ready while the deferred scripts are still
  // running, so story.js (OxStory) is not in yet. DOMContentLoaded comes after
  // every deferred script, so mount then. Mounting is idempotent (xrDone).
  if (document.readyState === "loading" || document.readyState === "interactive") document.addEventListener("DOMContentLoaded", mountAll);
  else mountAll();
})();
