/* Oxidize motion explainers: a short animated scene, told in beats, that
   explains one idea with the cast. Scenes are data (site/assets/motion/chNN.js);
   this file plays them. Back, the beat dots and Restart rebuild the exact state
   of a beat, because every beat is a list of ops on a model that can be
   replayed instantly.

   Markup:  <div class="ox-motion" data-scene="demo-compile"></div>
   Load, in this order, before this file:
            cast-art.js (OxCast), then the scene files, e.g.
            <script src="../assets/motion/ch01.js" defer></script>
   Scenes:  (window.OX_MOTION = window.OX_MOTION || []).push({ ... })

   SCENE
     id       "ch01-compile"                unique; the data-scene value
     title    "What cargo build does"
     w, h     640, 300                      stage units; the stage keeps this aspect ratio
     rust     "fn main() {}"                optional code panel (beside the stage when wide);
                                            the code shown before any beat sets its own
     check    "ok"                          optional with rust: "ok" or an error code
                                            (checked by tools/check-snippets.mjs)
     actors   [ ... ]                       draw order: later is in front, unless z says otherwise
     beats    [ ... ]

   ACTORS. x, y are the centre in stage units; size is the width in stage units.
     { id, cast: "oxi", x, y, size, pose?, kind?, label?, hidden?, opts? }   a character (OxCast.el)
     { id, prop: "scroll", x, y, size, opts?, label?, hidden? }            a prop (OxCast.prop)
     { id, text: "source code", x, y }                                      a text label
     { id, box: true, x, y, w, h, label?, cls? }                           a labeled area behind actors
                                                                           (cls: "is-stack" or "is-heap")
     Any actor may also set scale, rotate, opacity, hidden, z (CSS stacking).
     label is the caption under an actor (a name tag). opts.label is a prop's own text.

   BEAT
     { say: "<p>...</p>", line: 1, do: [[op, id, ...args]], ask: {...}, hold: 0 }
     say     caption; it changes when the beat starts (after the answer, for an ask)
     line    code line to mark; sticky until a later beat sets another
     rust    optional: the code the panel shows from this beat on, until a later beat
             sets another rust. The panel's badge follows it too. It is the way to show
             a failing edit and then its fix. Back, the dots and Restart rebuild the
             code of the beat they land on.
     check   with rust: "ok" (the default), an error code such as "E0384", "panic" or
             "skip". The snippet checker compiles every beat's rust with its own check.
     hold    extra ms to stay on the beat in autoplay
     ask     { q, choices, answer, explain }: a prediction. It is shown before the
             beat's ops run, and autoplay waits for it. A right answer earns
             Ox.award(5, "prediction", "motion:<scene>:<beat>"), and the verdict
             and explain text follow the beat.

   OPS. Every dur and delay is in ms; delay defaults to 0.
     move     {x, y, scale, rotate}, dur=600, delay=0     glide to the target (any subset)
     arc      {x, y, scale}, dur=700, delay=0, lift=60    glide along an arc that rises lift
     fade     opacity, dur=300, delay=0
     show     delay=0                                     instant visible
     hide     delay=0                                     instant hidden
     pop      delay=0                                     show with an overshoot scale-in
     poof     delay=0                                     puffs, then hidden
     pose     pose, hold=0, delay=0                       hold>0: back to the starting pose after hold
     kind     kind, delay=0                              ref | mutref | ghost | ended | ""
     say      html, hold=1600, delay=0                    speech bubble above the actor (not replayed)
     label    text, delay=0                               change the caption under the actor
     art      {cast|prop, opts}, delay=0                  replace the actor's art
     link     linkId, fromId, toId, kind="own", delay=0   own | ref | mut | bad | weak | arrow
                                                         (weak: a thin grey thread that does not count, as Weak<T>;
                                                         two links one each way between the same actors bend apart)
     unlink   linkId, delay=0                             fade the link out
     shake    delay=0
     pulse    delay=0                                     an attention ring
     confetti delay=0                                     a burst of 14 pieces, under 1.2 s
     cls      className, on=true, delay=0                 toggle a class on the actor
     The first id of link and unlink is the link's own id (use the owner's id).
     kind, label, art and cls also take a trailing delay after their arguments.

   BEHAVIOR
     Autoplay: each beat runs its ops, waits for them to finish, then waits a
     reading time (45 ms per character of say, at least 1.6 s, plus hold).
     Autoplay pauses at an ask and resumes once it is answered; it stops at the end.
     Pause shows the current beat at once.
     Restart and Back rebuild the exact state. Oxi talks on each new beat.
     Reduced motion: ops apply at once, with no delays, tweens, puffs or
     confetti. Poses, bubbles and visibility still change, so beats still read.
     Keys (when the widget has focus): Left and Right step, Space plays or pauses.
     No libraries. Timers and animations are cleared on every rebuild.

   Exports: window.OxMotion = { mount(element) }. */
(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const NS = "http://www.w3.org/2000/svg";
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const reduce = () => !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  const plain = (html) => String(html || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const award = (amount, reason, key) => { try { if (window.Ox && Ox.award) Ox.award(amount, reason, key); } catch (e) { /* XP is optional */ } };
  const CONFETTI = ["var(--oxide)", "var(--borrow)", "var(--mut)", "var(--ok)", "#f0c674"];
  const DUR = { move: 600, arc: 700, fade: 300, pop: 420, poof: 300, shake: 380, pulse: 700, confetti: 1000 };
  const REVEAL = 420, FADE = 300;
  const INTRO = "<p>Press <b>▶ Play</b> to watch, or <b>Next ▶</b> to step through the beats.</p>";
  const KIND_CLASSES = ["is-ref", "is-mutref", "is-ghost", "is-ended"];
  // A transform for a character at a given scale and rotation. Position is
  // left/top in percent, so only scale and rotate live here.
  const tf = (s, r) => `translate(-50%,-50%) scale(${s}) rotate(${r}deg)`;

  function createPlayer(root, scene) {
    const W = scene.w || 640, H = scene.h || 300;
    const beats = scene.beats || [];
    const N = beats.length;
    const defs = scene.actors || [];
    const px = (x) => (x / W) * 100 + "%";
    const py = (y) => (y / H) * 100 + "%";

    const model = new Map();     // actor id -> state (what the stage should show)
    const els = new Map();       // actor id -> element
    const links = new Map();     // link id -> { from, to, kind }
    const linkEls = new Map();   // link id -> <g>
    const answered = new Map();  // beat index -> { right }
    const timers = new Set();
    const anims = new Set();
    let rafId = 0, shown = -1, asking = -1, playing = false, resumeAfterAsk = false;
    let stage, linksSvg, sayBody, oxiNode, codePre = null, shownCode = null, dots = [];
    const ctl = {};

    /* ------------------------------------------------------ timers, animations */
    function later(ms, fn) {
      const t = setTimeout(() => { timers.delete(t); fn(); }, ms);
      timers.add(t);
      return t;
    }
    function anim(target, frames, opts) {
      if (!target || !target.animate) return null;
      const a = target.animate(frames, Object.assign({ fill: "none" }, opts));
      anims.add(a);
      const done = () => anims.delete(a);
      a.addEventListener("finish", done);
      a.addEventListener("cancel", done);
      kick();
      return a;
    }
    // While anything animates, the links are redrawn each frame, so they follow the actors.
    function kick() {
      if (!rafId && window.requestAnimationFrame) rafId = requestAnimationFrame(frame);
    }
    function frame() {
      rafId = 0;
      drawLinks();
      if (anims.size) rafId = requestAnimationFrame(frame);
    }
    function clearAll() {
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
      Array.from(anims).forEach((a) => { try { a.cancel(); } catch (e) { /* already finished */ } });
      anims.clear();
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
    }

    /* ------------------------------------------------------ model and DOM */
    function initialState() {
      model.clear();
      defs.forEach((d) => {
        const type = d.box ? "box" : d.text !== undefined ? "text" : d.prop ? "prop" : "char";
        model.set(d.id, {
          id: d.id, type, def: d, size: d.size || 80,
          x: d.x, y: d.y,
          scale: d.scale ?? 1, rotate: d.rotate ?? 0,
          // null: the scene never set an opacity, so the page's CSS (classes) decides it.
          opacity: d.opacity ?? null,
          hidden: !!d.hidden, base: d.pose || "", pose: d.pose || "", poseTok: 0,
          kind: d.kind || "", label: d.label || "",
          art: type === "char" ? { cast: d.cast, opts: d.opts || {} } : type === "prop" ? { prop: d.prop, opts: d.opts || {} } : null,
          // The actor's own classes are part of the model, so a cls op can take them away.
          cls: new Set(String(d.cls || "").split(/\s+/).filter(Boolean)), applied: new Set(), poofing: false,
        });
      });
    }
    function buildStage() {
      stage.innerHTML = "";
      els.clear();
      linkEls.clear();
      const make = (m) => {
        const d = m.def, el = document.createElement("div");
        el.dataset.id = m.id;
        if (m.type === "box") {
          el.className = "mo-actor mo-box";
          el.innerHTML = '<span class="mo-tag"></span>';
        } else if (m.type === "text") {
          el.className = "mo-actor mo-text";
          el.innerHTML = `<span class="mo-text-body">${esc(d.text)}</span>`;
        } else {
          el.className = "mo-actor " + (m.type === "prop" ? "mo-prop" : "mo-char");
          el.innerHTML = '<div class="mo-art"></div><span class="mo-tag"></span>';
        }
        els.set(m.id, el);
        return el;
      };
      const all = Array.from(model.values());
      all.filter((m) => m.type === "box").forEach((m) => stage.appendChild(make(m)));
      linksSvg = document.createElementNS(NS, "svg");
      linksSvg.setAttribute("class", "mo-links");
      linksSvg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      linksSvg.setAttribute("aria-hidden", "true");
      stage.appendChild(linksSvg);
      all.filter((m) => m.type !== "box").forEach((m) => stage.appendChild(make(m)));
      all.forEach((m) => { renderArt(m); paint(m); });
    }
    // Writes every lasting property of an actor to its element.
    function paint(m) {
      const el = els.get(m.id), d = m.def;
      if (!el) return;
      el.style.left = px(m.x);
      el.style.top = py(m.y);
      if (m.type === "box") {
        el.style.zIndex = d.z ?? 1;
        el.style.width = (d.w / W) * 100 + "%";
        el.style.height = (d.h / H) * 100 + "%";
        el.style.transform = "translate(-50%,-50%)";
        el.style.opacity = m.opacity ?? "";
        if (!m.poofing) el.style.visibility = m.hidden ? "hidden" : "";
      } else {
        el.style.zIndex = d.z ?? 3;
        if (m.type !== "text") el.style.width = (m.size / W) * 100 + "%";
        el.style.transform = tf(m.scale, m.rotate);
        el.style.opacity = m.opacity ?? "";
        el.style.setProperty("--mo-s", m.scale);
        if (!m.poofing) el.style.visibility = m.hidden ? "hidden" : "";
      }
      m.applied.forEach((c) => { if (!m.cls.has(c)) el.classList.remove(c); });
      m.cls.forEach((c) => el.classList.add(c));
      m.applied = new Set(m.cls);
      const tag = $(".mo-tag", el);
      if (tag) tag.textContent = m.label;
    }
    function node(m) {
      const el = els.get(m.id);
      return el ? $(".ca", el) : null;
    }
    function renderArt(m) {
      const host = m.art && els.get(m.id) ? $(".mo-art", els.get(m.id)) : null;
      if (!host) return;
      host.innerHTML = m.art.cast ? OxCast.el(m.art.cast, m.art.opts) : OxCast.prop(m.art.prop, m.art.opts);
      paintPose(m);
      paintKind(m);
    }
    function paintPose(m) {
      const n = node(m);
      if (n) OxCast.pose(n, m.pose);
    }
    function paintKind(m) {
      const n = node(m);
      if (!n) return;
      n.classList.remove(...KIND_CLASSES);
      if (m.kind) n.classList.add("is-" + m.kind);
    }

    /* ------------------------------------------------------ ops */
    // Runs one op. play = a beat is being played (autoplay, Next, dots that
    // animate); otherwise the op is applied at once, for a replay.
    // Returns the time the op takes (delay + duration), for the beat's wait.
    function runOp(op, play) {
      const tween = play && !reduce();
      const when = (ms, fn) => (tween && ms > 0 ? later(ms, fn) : fn());
      const [name, id, ...a] = op;
      if (name === "link") return doLink(id, a, tween);
      if (name === "unlink") return doUnlink(id, a, tween);
      const m = model.get(id);
      if (!m) { console.warn("motion: no actor '" + id + "' in " + scene.id); return 0; }
      switch (name) {
        case "move":
        case "arc": {
          const isArc = name === "arc";
          const to = a[0] || {};
          const dur = a[1] ?? (isArc ? DUR.arc : DUR.move);
          const delay = a[2] ?? 0;
          const lift = isArc ? a[3] ?? 60 : 0;
          when(delay, () => glide(m, to, tween ? dur : 0, lift, tween));
          return tween ? delay + dur : 0;
        }
        case "fade": {
          const to = a[0] ?? 1, dur = a[1] ?? DUR.fade, delay = a[2] ?? 0;
          when(delay, () => {
            const from = m.opacity ?? 1;
            m.opacity = to;
            paint(m);
            if (tween && dur) anim(els.get(m.id), [{ opacity: from }, { opacity: to }], { duration: dur, easing: "ease-in-out" });
          });
          return tween ? delay + dur : 0;
        }
        case "show":
        case "hide": {
          const delay = a[0] ?? 0;
          when(delay, () => { m.hidden = name === "hide"; paint(m); });
          return tween ? delay : 0;
        }
        case "pop": {
          const delay = a[0] ?? 0;
          when(delay, () => {
            m.hidden = false; m.scale = 1; m.opacity = 1; m.poofing = false;
            paint(m);
            if (tween) anim(els.get(m.id), [
              { transform: tf(0, m.rotate), opacity: 0 },
              { transform: tf(1.12, m.rotate), opacity: 1, offset: 0.6 },
              { transform: tf(1, m.rotate), opacity: 1 },
            ], { duration: DUR.pop, easing: "ease-out" });
          });
          return tween ? delay + DUR.pop : 0;
        }
        case "poof": {
          const delay = a[0] ?? 0;
          when(delay, () => {
            m.hidden = true;
            m.poofing = true;   // keep it visible until the puff has run
            paint(m);
            if (!tween) { m.poofing = false; paint(m); return; }
            const fade = anim(els.get(m.id), [
              { transform: tf(m.scale, m.rotate), opacity: m.opacity ?? 1 },
              { transform: tf(m.scale * 0.6, m.rotate), opacity: 0 },
            ], { duration: DUR.poof, easing: "ease-in" });
            if (fade) fade.addEventListener("finish", () => { m.poofing = false; paint(m); });
            burst(m, "puff", 480);
          });
          return tween ? delay + DUR.poof : 0;
        }
        case "pose": {
          const p = a[0] || "", hold = a[1] ?? 0, delay = a[2] ?? 0;
          when(delay, () => {
            const tok = ++m.poseTok;
            m.pose = p;
            paintPose(m);
            if (hold > 0) {
              const back = () => { if (m.poseTok === tok) { m.pose = m.base; paintPose(m); } };
              if (play) later(hold, back); else back();
            }
          });
          return tween ? delay : 0;
        }
        case "kind": {
          const k = a[0] || "", delay = a[1] ?? 0;
          when(delay, () => { m.kind = k; paintKind(m); });
          return tween ? delay : 0;
        }
        case "label": {
          const text = a[0] ?? "", delay = a[1] ?? 0;
          when(delay, () => { m.label = String(text); paint(m); });
          return tween ? delay : 0;
        }
        case "art": {
          const spec = a[0] || {}, delay = a[1] ?? 0;
          when(delay, () => {
            m.art = spec.cast ? { cast: spec.cast, opts: spec.opts || {} } : { prop: spec.prop, opts: spec.opts || {} };
            renderArt(m);
          });
          return tween ? delay : 0;
        }
        case "cls": {
          const c = a[0] || "", on = a[1] ?? true, delay = a[2] ?? 0;
          when(delay, () => { if (on) m.cls.add(c); else m.cls.delete(c); paint(m); });
          return tween ? delay : 0;
        }
        case "say": {
          const html = a[0] ?? "", hold = a[1] ?? 1600, delay = a[2] ?? 0;
          if (play) when(delay, () => bubble(m, html, hold));   // a bubble is not replayed
          return tween ? delay : 0;
        }
        case "shake": {
          const delay = a[0] ?? 0;
          when(delay, () => {
            if (!tween) return;
            const base = tf(m.scale, m.rotate);
            anim(els.get(m.id), [
              { transform: base }, { transform: base + " translateX(-7%)" },
              { transform: base + " translateX(7%)" }, { transform: base + " translateX(-4%)" },
              { transform: base },
            ], { duration: DUR.shake, easing: "ease-in-out" });
          });
          return tween ? delay + DUR.shake : 0;
        }
        case "pulse": {
          const delay = a[0] ?? 0;
          when(delay, () => { if (tween) ring(m); });
          return tween ? delay + DUR.pulse : 0;
        }
        case "confetti": {
          const delay = a[0] ?? 0;
          when(delay, () => { if (tween) burst(m, "confetti", 1000); });
          return tween ? delay + DUR.confetti : 0;
        }
        default:
          console.warn("motion: unknown op '" + name + "' in " + scene.id);
          return 0;
      }
    }

    // Glides an actor to a target. The model takes the target at once and the
    // element animates from where it was, so the end state is the same either way.
    function glide(m, to, dur, lift, tween) {
      const from = { x: m.x, y: m.y, scale: m.scale, rotate: m.rotate };
      ["x", "y", "scale", "rotate"].forEach((k) => { if (to[k] !== undefined) m[k] = to[k]; });
      paint(m);
      if (!tween || !dur) return;
      const end = { x: m.x, y: m.y, scale: m.scale, rotate: m.rotate };
      const kf = (s) => ({ left: px(s.x), top: py(s.y), transform: tf(s.scale, s.rotate) });
      const frames = [kf(from)];
      if (lift) {
        frames.push({
          left: px((from.x + end.x) / 2), top: py((from.y + end.y) / 2 - lift),
          transform: tf((from.scale + end.scale) / 2, (from.rotate + end.rotate) / 2), offset: 0.5,
        });
      }
      frames.push(kf(end));
      anim(els.get(m.id), frames, { duration: dur, easing: "cubic-bezier(.45,.05,.25,1)" });
    }
    function bubble(m, html, hold) {
      const el = els.get(m.id);
      if (!el) return;
      let b = $(":scope > .mo-bubble", el);
      if (!b) { b = document.createElement("div"); b.className = "mo-bubble"; el.appendChild(b); }
      // near a stage edge the bubble hangs off that side, so it never leaves the stage
      b.dataset.align = m.x < W * 0.3 ? "left" : m.x > W * 0.7 ? "right" : "center";
      b.innerHTML = `<div class="mo-bubble-in">${html}</div>`;
      const tok = (b._tok = (b._tok || 0) + 1);
      if (!reduce()) anim($(".mo-bubble-in", b), [{ opacity: 0, transform: "translateY(4px)" }, { opacity: 1, transform: "none" }], { duration: 220, easing: "ease-out" });
      if (hold > 0) later(hold, () => { if (b._tok === tok) b.remove(); });
    }
    function ring(m) {
      const r = document.createElement("i");
      r.className = "mo-ring";
      r.style.width = ((m.type === "box" ? m.def.w : m.size) / W) * 100 + "%";
      r.style.left = px(m.x);
      r.style.top = py(m.y);
      r.style.transform = tf(0.8, 0);
      stage.appendChild(r);
      const a = anim(r, [
        { transform: tf(0.8, 0), opacity: 0.9 },
        { transform: tf(1.5, 0), opacity: 0 },
      ], { duration: DUR.pulse, easing: "ease-out" });
      if (a) a.addEventListener("finish", () => r.remove());
      else r.remove();
    }
    // Puffs (poof) or confetti (confetti) burst out of an actor.
    function burst(m, kind, dur) {
      const n = kind === "puff" ? 8 : 14;
      for (let k = 0; k < n; k++) {
        const p = document.createElement("i");
        p.className = "mo-piece is-" + kind;
        const ang = kind === "puff" ? (k / n) * Math.PI * 2 : -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
        const v = kind === "puff" ? 42 : 60 + Math.random() * 70;
        const dx = Math.cos(ang) * v;
        const dy = kind === "puff" ? Math.sin(ang) * v * 0.8 : Math.sin(ang) * v + 60;
        const rot = Math.round(Math.random() * 540);
        if (kind === "confetti") p.style.background = CONFETTI[k % CONFETTI.length];
        p.style.left = px(m.x);
        p.style.top = py(m.y);
        p.style.transform = "translate(-50%,-50%)";
        stage.appendChild(p);
        const a = anim(p, [
          { left: px(m.x), top: py(m.y), transform: "translate(-50%,-50%) rotate(0deg)", opacity: 1 },
          { left: px(m.x + dx), top: py(m.y + dy), transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${kind === "puff" ? 0.3 : 1})`, opacity: 0 },
        ], { duration: dur + Math.round(Math.random() * 150), easing: "cubic-bezier(.2,.7,.4,1)" });
        if (a) a.addEventListener("finish", () => p.remove());
      }
    }

    /* ------------------------------------------------------ links */
    function doLink(id, a, tween) {
      const from = a[0], to = a[1], kind = a[2] || "own", delay = a[3] ?? 0;
      const run = () => setLink(id, from, to, kind, tween);
      if (tween && delay > 0) later(delay, run); else run();
      return tween ? delay + REVEAL : 0;
    }
    function doUnlink(id, a, tween) {
      const delay = a[0] ?? 0;
      const run = () => dropLink(id, tween);
      if (tween && delay > 0) later(delay, run); else run();
      return tween ? delay + FADE : 0;
    }
    function setLink(id, from, to, kind, tween) {
      dropLink(id, false);
      if (!model.has(from) || !model.has(to)) { console.warn("motion: link " + id + " needs two actors"); return; }
      links.set(id, { from, to, kind });
      const g = document.createElementNS(NS, "g");
      g.setAttribute("class", "mo-link is-" + kind);
      const part = (cls) => {
        const p = document.createElementNS(NS, "path");
        p.setAttribute("class", cls);
        g.appendChild(p);
        return p;
      };
      part("mo-line");
      if (kind === "own") part("mo-twist");
      if (kind === "arrow") part("mo-head");
      linksSvg.appendChild(g);
      linkEls.set(id, g);
      drawLink(id);
      if (tween) reveal(g);
    }
    function dropLink(id, fade) {
      links.delete(id);
      const g = linkEls.get(id);
      linkEls.delete(id);
      if (!g) return;
      const a = fade ? anim(g, [{ opacity: 1 }, { opacity: 0 }], { duration: FADE, easing: "ease-in" }) : null;
      if (a) a.addEventListener("finish", () => g.remove());
      else g.remove();
    }
    // The stroke draws itself in: the dash covers the whole path, then the offset runs out.
    function reveal(g) {
      $$("path.mo-line, path.mo-twist", g).forEach((p) => {
        const len = p.getTotalLength();
        p.dataset.rev = "1";
        p.style.strokeDasharray = `${len} ${len}`;
        p.style.strokeDashoffset = `${len}`;
        const a = anim(p, [{ strokeDashoffset: len }, { strokeDashoffset: 0 }], { duration: REVEAL, easing: "ease-out" });
        if (a) a.addEventListener("finish", () => {
          p.dataset.rev = "";
          p.style.strokeDasharray = "";
          p.style.strokeDashoffset = "";
        });
      });
    }
    // An actor's centre and radius in stage units, read from where it is drawn now
    // (so a link follows an actor mid-animation). Falls back to the model.
    function center(id) {
      const m = model.get(id), el = els.get(id);
      if (!m) return null;
      const sr = stage.getBoundingClientRect();
      const r = el ? el.getBoundingClientRect() : null;
      const sw = stage.clientWidth;
      if (!sr.width || !sw || !r || !r.width) return { x: m.x, y: m.y, r: m.size * 0.4 };
      const k = W / sw;
      const ox = sr.left + stage.clientLeft, oy = sr.top + stage.clientTop;
      return { x: (r.left + r.width / 2 - ox) * k, y: (r.top + r.height / 2 - oy) * k, r: r.width * k * 0.4 };
    }
    function drawLink(id) {
      const L = links.get(id), g = linkEls.get(id);
      if (!L || !g) return;
      const A = center(L.from), B = center(L.to);
      if (!A || !B) return;
      const f = (v) => v.toFixed(1);
      const dx = B.x - A.x, dy = B.y - A.y, len = Math.hypot(dx, dy) || 1;
      const ux = dx / len, uy = dy / len;
      const x1 = A.x + ux * A.r, y1 = A.y + uy * A.r, x2 = B.x - ux * B.r, y2 = B.y - uy * B.r;
      let d;
      if (L.kind === "arrow") {
        d = `M${f(x1)} ${f(y1)} L${f(x2)} ${f(y2)}`;
      } else {
        // Two links between the same actors, one each way (a cycle), would share one
        // curve. The one whose from-id sorts later bends to the other side.
        const back = [...links].some(([oid, o]) => oid !== id && o.from === L.to && o.to === L.from);
        const side = back && L.from > L.to ? -1 : 1;
        const sag = Math.min(64, 16 + len * 0.16) * (L.kind === "own" ? 1 : 0.35) * side;
        d = `M${f(x1)} ${f(y1)} C${f(x1 + (x2 - x1) * 0.3)} ${f(y1 + sag)} ${f(x2 - (x2 - x1) * 0.3)} ${f(y2 + sag + (y2 - y1) * 0.1)} ${f(x2)} ${f(y2)}`;
      }
      const head = (() => {
        const back = 11, half = 6, bx = x2 - ux * back, by = y2 - uy * back, nx = -uy, ny = ux;
        return `M${f(x2)} ${f(y2)} L${f(bx + nx * half)} ${f(by + ny * half)} L${f(bx - nx * half)} ${f(by - ny * half)} Z`;
      })();
      g.querySelectorAll("path").forEach((p) => {
        if (p.classList.contains("mo-head")) { p.setAttribute("d", head); return; }
        p.setAttribute("d", d);
        if (p.dataset.rev === "1") { const t = p.getTotalLength(); p.style.strokeDasharray = `${t} ${t}`; }
      });
    }
    function drawLinks() {
      Array.from(links.keys()).forEach(drawLink);
      nudgeLabels();
    }
    // A label centred under an actor can run past the stage edge on a narrow
    // phone. Shift it back inside by the overflow, and leave every other label
    // where it is. Reads all rectangles first, then writes, to avoid repeated
    // layout work.
    function nudgeLabels() {
      if (!stage || !stage.isConnected) return;
      const sr = stage.getBoundingClientRect();
      if (!sr.width) return;
      const els = Array.from(stage.querySelectorAll(".mo-tag, .mo-text-body"));
      els.forEach((el) => { el.style.translate = ""; });
      const shifts = els.map((el) => {
        const r = el.getBoundingClientRect();
        if (!r.width) return 0;
        if (r.left < sr.left + 2) return sr.left + 2 - r.left;
        if (r.right > sr.right - 2) return sr.right - 2 - r.right;
        return 0;
      });
      els.forEach((el, i) => { if (shifts[i]) el.style.translate = shifts[i].toFixed(1) + "px 0"; });
    }

    /* ------------------------------------------------------ beats and caption */
    function beatHtml(k) {
      const b = beats[k], v = answered.get(k);
      const verdict = b.ask && v
        ? `<p class="mo-verdict ${v.right ? "is-right" : "is-wrong"}"><strong>${v.right ? "You called it." : "Not this time."}</strong> ${b.ask.explain || ""}</p>`
        : "";
      return (b.say || "") + verdict;
    }
    function showCaption(k) {
      sayBody.innerHTML = k < 0 ? INTRO : beatHtml(k);
    }
    function setOxi(pose, hold) {
      if (oxiNode) OxCast.pose(oxiNode, pose, hold);
    }
    // The code in force at beat k: the scene's rust, or the last beat's rust up to k.
    function codeAt(k) {
      let src = { rust: scene.rust, check: scene.check };
      for (let j = 0; j <= k && j < N; j++) {
        if (beats[j].rust !== undefined) src = { rust: beats[j].rust, check: beats[j].check };
      }
      return src;
    }
    // Writes the code panel's text and its badge for the code in force.
    function renderCode() {
      if (!codePre) return;
      const cur = asking >= 0 ? asking : shown;
      const src = codeAt(cur);
      if (src.rust !== shownCode) {
        shownCode = src.rust;
        const text = String(src.rust || "").replace(/^\n/, "");
        const hl = window.Ox && Ox.highlight ? Ox.highlight(text, "rust") : esc(text);
        const lines = window.Ox && Ox.splitLines ? Ox.splitLines(hl) : hl.split("\n");
        codePre.innerHTML = lines.map((l, k) => `<span class="mo-ln" data-line="${k + 1}"><span class="mo-lno">${k + 1}</span>${l || " "}</span>`).join("");
      }
      paintCheck(src.check);
      let line = 0;
      for (let i = 0; i <= cur && i < N; i++) if (beats[i].line) line = beats[i].line;
      $$(".mo-ln", codePre).forEach((ln) => ln.classList.toggle("is-now", +ln.dataset.line === line));
    }
    // The badge: "compiles", "does not compile", "error E0384", "compiles, panics at runtime" or "needs crates".
    function paintCheck(check) {
      if (!ctl.check) return;
      const needsCrates = check === "skip", panics = check === "panic";
      const broken = !!check && check !== "ok" && !needsCrates && !panics;
      ctl.check.textContent = needsCrates ? "needs crates" : panics ? "compiles, panics at runtime" : broken ? (check === "error" ? "does not compile" : "error " + check) : "compiles";
      ctl.check.className = "mo-check " + (broken ? "is-err" : needsCrates ? "is-skip" : panics ? "is-panic" : "is-ok");
    }
    function updateControls() {
      const cur = asking >= 0 ? asking : shown;
      ctl.count.textContent = `${cur + 1} / ${N}`;
      ctl.back.disabled = cur < 0;
      ctl.next.disabled = asking >= 0 || shown >= N - 1;
      ctl.play.disabled = asking >= 0;
      ctl.play.textContent = playing ? "❚❚ Pause" : "▶ Play";
      ctl.play.setAttribute("aria-label", playing ? "Pause" : "Play");
      dots.forEach((d, i) => {
        d.classList.toggle("is-current", i === cur);
        d.classList.toggle("is-done", i < cur);
        if (i === cur) d.setAttribute("aria-current", "step");
        else d.removeAttribute("aria-current");
      });
    }

    // Instant state after beats 0..k, with the caption of beat k.
    function rebuild(k) {
      clearAll();
      initialState();
      buildStage();
      for (let i = 0; i <= k && i < N; i++) (beats[i].do || []).forEach((op) => runOp(op, false));
      shown = k;
      asking = -1;
      setOxi("", 0);
      showCaption(k);
      renderCode();
      drawLinks();
      updateControls();
      if (k === N - 1 && k >= 0) award(3, "motion", "motion-done:" + scene.id);
    }
    // Plays beat j from the state before it. Autoplay continues after it.
    function playBeat(j) {
      const b = beats[j];
      shown = j;
      asking = -1;
      $$(".mo-bubble", stage).forEach((x) => x.remove());
      sayBody.innerHTML = beatHtml(j);
      setOxi("talk", 1400);
      renderCode();
      let end = 0;
      (b.do || []).forEach((op) => { end = Math.max(end, runOp(op, true) || 0); });
      drawLinks();
      updateControls();
      const read = Math.max(1600, Math.round(45 * plain(b.say).length)) + (b.hold || 0);
      later(end, () => {
        if (j === N - 1) {
          award(3, "motion", "motion-done:" + scene.id);
          playing = false;
          updateControls();
          return;
        }
        if (playing) later(read, () => { if (playing) go(j + 1, true); });
      });
    }
    // The first beat in 0..j that still waits for an answer, or -1.
    function gateOf(j) {
      for (let i = 0; i <= j && i < N; i++) if (beats[i].ask && !answered.has(i)) return i;
      return -1;
    }
    function showAsk(j) {
      const a = beats[j].ask;
      asking = j;
      resumeAfterAsk = playing;   // autoplay stops here and resumes when answered
      playing = false;
      setOxi("think", 0);
      renderCode();
      sayBody.innerHTML = `<p><strong>Predict:</strong> ${a.q}</p><div class="mo-choices"></div>`;
      const box = $(".mo-choices", sayBody);
      (a.choices || []).forEach((c, k) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "ox-choice";
        btn.innerHTML = `<span class="ox-key">${"ABCDEF"[k] || k + 1}</span><span>${c}</span>`;
        btn.addEventListener("click", () => answer(j, k));
        box.appendChild(btn);
      });
      updateControls();
    }
    function answer(j, k) {
      if (asking !== j || answered.has(j)) return;
      const a = beats[j].ask, right = k === a.answer;
      answered.set(j, { right });
      $$(".mo-choices button", sayBody).forEach((x, i) => {
        x.disabled = true;
        x.classList.add(i === a.answer ? "is-correct" : i === k ? "is-wrong" : "is-faded");
      });
      setOxi(right ? "happy" : "oops", 1600);
      if (right) {
        burstOxi();
        award(5, "prediction", "motion:" + scene.id + ":" + j);
      }
      playing = resumeAfterAsk;
      resumeAfterAsk = false;
      updateControls();
      later(700, () => playBeat(j));
    }
    function burstOxi() {
      if (reduce() || !oxiNode) return;
      const foot = $(".mo-foot", root), ox = $(".mo-oxi", root);
      for (let k = 0; k < 14; k++) {
        const c = document.createElement("i");
        c.className = "mo-confetti";
        c.style.left = ox.offsetLeft + ox.offsetWidth / 2 + "px";
        c.style.top = ox.offsetTop + 12 + "px";
        c.style.background = CONFETTI[k % CONFETTI.length];
        foot.appendChild(c);
        const ang = -Math.PI / 2 + (Math.random() - 0.5) * 2.2, v = 50 + Math.random() * 60;
        c.animate([
          { transform: "translate(0,0) rotate(0deg)", opacity: 1 },
          { transform: `translate(${Math.cos(ang) * v}px, ${Math.sin(ang) * v + 50}px) rotate(${Math.round(Math.random() * 540)}deg)`, opacity: 0 },
        ], { duration: 900 + Math.random() * 250, easing: "cubic-bezier(.2,.7,.4,1)" }).onfinish = () => c.remove();
      }
    }

    /* ------------------------------------------------------ navigation */
    // Shows beat j: animated (the beat plays) or instant (the state at once).
    function go(j, animate) {
      clearAll();
      resumeAfterAsk = false;
      if (j < 0) return rebuild(-1);
      const g = gateOf(j);
      if (g >= 0) {
        rebuild(g - 1);
        showAsk(g);
        return;
      }
      if (!animate) return rebuild(j);
      rebuild(j - 1);
      playBeat(j);
    }
    const next = () => { if (asking < 0 && shown < N - 1) go(shown + 1, true); };
    const back = () => { if (asking < 0 && shown < 0) return; playing = false; go((asking >= 0 ? asking : shown) - 1, false); };
    const jump = (j) => { playing = false; go(j, false); };
    const restart = () => { playing = false; answered.clear(); go(-1, false); };
    function togglePlay() {
      if (asking >= 0) return;
      if (playing) { playing = false; go(shown, false); return; }
      if (shown >= N - 1) { answered.clear(); rebuild(-1); }
      playing = true;
      go(shown + 1, true);
    }

    /* ------------------------------------------------------ the widget */
    function build() {
      // A panel shows when the scene or any of its beats has rust.
      const hasCode = scene.rust !== undefined || beats.some((b) => b.rust !== undefined);
      root.tabIndex = 0;
      root.setAttribute("role", "group");
      root.setAttribute("aria-label", "Motion explainer: " + (scene.title || scene.id));
      root.innerHTML = `
        <div class="mo-head">
          <span class="ox-label">Motion</span>
          <span class="mo-title"></span>
        </div>
        <div class="mo-main${hasCode ? " has-code" : ""}">
          ${hasCode ? `<div class="mo-code"><div class="mo-code-head"><span>Rust</span><span class="mo-check"></span></div><pre></pre></div>` : ""}
          <div class="mo-stage" aria-hidden="true" style="aspect-ratio:${W} / ${H};--mo-w:${W};--mo-h:${H}"></div>
        </div>
        <div class="mo-foot">
          <div class="mo-oxi" aria-hidden="true">${OxCast.el("oxi")}</div>
          <div class="mo-say" aria-live="polite"></div>
        </div>
        <div class="mo-controls">
          <button type="button" class="ox-btn is-small" data-act="restart" aria-label="Restart">⟲</button>
          <button type="button" class="ox-btn is-small" data-act="back" title="Back one beat (←)">◀ Back</button>
          <button type="button" class="ox-btn is-small is-primary mo-play" data-act="play" title="Play or pause (Space)">▶ Play</button>
          <button type="button" class="ox-btn is-small" data-act="next" title="Next beat (→)">Next ▶</button>
          <span class="mo-dots"></span>
          <span class="mo-count"></span>
        </div>`;
      $(".mo-title", root).textContent = scene.title || scene.id;
      stage = $(".mo-stage", root);
      window.addEventListener("resize", () => { if (stage && stage.isConnected) nudgeLabels(); });
      sayBody = $(".mo-say", root);
      oxiNode = $(".mo-oxi .ca", root);
      ctl.count = $(".mo-count", root);
      ctl.back = $('[data-act="back"]', root);
      ctl.next = $('[data-act="next"]', root);
      ctl.play = $('[data-act="play"]', root);
      if (hasCode) {
        codePre = $(".mo-code pre", root);
        ctl.check = $(".mo-check", root);
      }
      const host = $(".mo-dots", root);
      dots = beats.map((b, k) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "mo-dot";
        btn.title = "Beat " + (k + 1);
        btn.setAttribute("aria-label", `Beat ${k + 1} of ${N}: ${plain(b.say).slice(0, 70)}`);
        btn.addEventListener("click", () => jump(k));
        host.appendChild(btn);
        return btn;
      });

      ctl.next.addEventListener("click", next);
      ctl.back.addEventListener("click", back);
      ctl.play.addEventListener("click", togglePlay);
      $('[data-act="restart"]', root).addEventListener("click", restart);
      root.addEventListener("keydown", (e) => {
        if (e.altKey || e.ctrlKey || e.metaKey) return;
        if (e.key === "ArrowRight") { e.preventDefault(); next(); }
        else if (e.key === "ArrowLeft") { e.preventDefault(); back(); }
        else if (e.key === " " && !(e.target.closest && e.target.closest("button"))) { e.preventDefault(); togglePlay(); }
      });
      if ("IntersectionObserver" in window && !reduce()) {
        const io = new IntersectionObserver((entries) => {
          if (!entries.some((e) => e.isIntersecting)) return;
          io.disconnect();
          ctl.play.classList.add("is-pulse");
          setTimeout(() => ctl.play.classList.remove("is-pulse"), 1400);
        }, { threshold: 0.6 });
        io.observe(root);
      }

      initialState();
      buildStage();
      shown = -1;
      showCaption(-1);
      renderCode();
      updateControls();
    }
    build();
  }

  function mount(el) {
    if (!el || el.dataset.moDone) return;
    el.dataset.moDone = "1";
    const id = el.dataset.scene || "";
    const scene = (window.OX_MOTION || []).find((s) => s && s.id === id);
    if (!scene) {
      el.innerHTML = `<p class="mo-missing">Motion scene <code>${esc(id)}</code> not found.</p>`;
      return;
    }
    if (!window.OxCast) {
      el.innerHTML = '<p class="mo-missing">Motion explainers need cast-art.js.</p>';
      return;
    }
    createPlayer(el, scene);
  }
  function mountAll() { $$(".ox-motion[data-scene]").forEach(mount); }

  window.OxMotion = { mount };
  if (window.Ox && window.Ox.ready) mountAll();
  else document.addEventListener("ox:ready", mountAll);
})();
