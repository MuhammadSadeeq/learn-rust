/* Oxidize cast components: meet cards, the Field Guide, Oxi's reaction to
   every answer, and the level-up molt. Needs cast-art.js (OxCast) and
   oxidize.js (Ox). Mounts on ox:ready, or at once when Ox is already ready.
   Exports window.OxCastUI = { mountMeet, mountGuide, met }. */
(function () {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const reduced = () => !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const ROMAN = ["", "I", "II", "III", "IV", "V"];
  const CONFETTI = ["#f2b632", "#ff8fa3", "#7cc7f5", "#ffd166"];
  const POSES = ["happy", "wow", "think", "talk"];

  // Thin wrappers over oxidize.js, so nothing here breaks on a page without it.
  const OX = () => window.Ox;
  const store = () => (OX() && OX().state ? OX().state() : null);
  const chapterOf = (n) => (OX() && OX().chapterByNum ? OX().chapterByNum(n) : null);
  const rel = (p) => (OX() && OX().rel ? OX().rel(p) : p);
  const chapterHref = (ch) => (OX() && OX().chapterUrl ? OX().chapterUrl(ch) : rel("chapters/" + ch.slug + ".html"));
  const find = (id) => (window.OxCast ? OxCast.list : []).find((e) => e.id === id);

  /* ------------------------------------------------------------ met */
  // Met when this character was greeted, or when the chapter that introduces
  // it is complete (so returning readers keep the characters they earned).
  function met(id) {
    const s = store();
    if (!s) return false;
    if (s.cast && s.cast[id]) return true;
    const e = find(id), ch = e && chapterOf(e.ch);
    return !!(ch && s.chapters && s.chapters[ch.n]);
  }

  /* ------------------------------------------------------------ confetti */
  // Small paper bits thrown up from a point. The caller picks the count.
  function confetti(host, n, spread = 1) {
    for (let i = 0; i < n; i++) {
      const p = document.createElement("i");
      p.className = "cast-confetti";
      p.setAttribute("aria-hidden", "true");
      const a = rnd(-Math.PI * 0.92, -Math.PI * 0.08), d = rnd(30, 56) * spread;
      p.style.setProperty("--dx", Math.round(Math.cos(a) * d) + "px");
      p.style.setProperty("--dy", Math.round(Math.sin(a) * d) + "px");
      p.style.setProperty("--r", Math.round(rnd(-320, 320)) + "deg");
      p.style.setProperty("--c", CONFETTI[i % CONFETTI.length]);
      p.style.animationDelay = rnd(0, 0.08).toFixed(2) + "s";
      host.appendChild(p);
      setTimeout(() => p.remove(), 1000);
    }
  }

  // Four-point sparkles that burst out from behind a meet card's art.
  function sparkle(host, n) {
    for (let i = 0; i < n; i++) {
      const s = document.createElement("i");
      s.className = "cast-spark";
      s.setAttribute("aria-hidden", "true");
      const a = (i / n) * Math.PI * 2 + rnd(-0.3, 0.3);
      s.style.setProperty("--dx", Math.round(Math.cos(a) * 84) + "px");
      s.style.setProperty("--dy", Math.round(Math.sin(a) * 74) + "px");
      s.style.setProperty("--c", CONFETTI[i % CONFETTI.length]);
      s.style.animationDelay = rnd(0, 0.12).toFixed(2) + "s";
      host.appendChild(s);
      setTimeout(() => s.remove(), 1100);
    }
  }

  /* ------------------------------------------------------------ meet cards */
  // <div class="ox-meet" data-cast="forge" data-say="..."></div>
  function mountMeet(root = document) {
    $$(".ox-meet", root).forEach(meetCard);
  }

  function meetCard(node) {
    if (node.dataset.castDone) return;
    node.dataset.castDone = "1";
    const id = node.dataset.cast, e = find(id);
    if (!e) { console.warn(`cast.js: no character called "${id}"`); return; }
    const known = met(id), say = node.dataset.say;
    node.innerHTML = `
      <div class="ox-meet-art">${OxCast.entry(id)}</div>
      <div class="ox-meet-body">
        <div class="ox-meet-top">${known ? `<span class="ox-meet-chip">In your Field Guide</span>` : `<span class="ox-label">New in Rustopia</span>`}</div>
        <h3 class="ox-meet-name">${esc(e.name)}</h3>
        <p class="ox-meet-rust">In Rust: <b>${esc(e.rust)}</b></p>
        <p class="ox-meet-role">${esc(e.role)}</p>
        ${say ? `<p class="ox-meet-say">“${esc(say)}”</p>` : ""}
        <a class="ox-meet-link" href="${rel("labs/cast.html")}">Field Guide →</a>
      </div>`;
    if (known) return;
    const greet = () => meetFirst(node, id, e);
    if (!("IntersectionObserver" in window)) return greet();
    const io = new IntersectionObserver((entries) => {
      if (entries.some((en) => en.isIntersecting && en.intersectionRatio >= 0.4)) {
        io.disconnect();
        greet();
      }
    }, { threshold: 0.4 });
    io.observe(node);
  }

  // The first time a reader sees a character: it pops in, plays happy once,
  // and joins the Field Guide.
  function meetFirst(node, id, e) {
    const s = store();
    if (s) {
      s.cast = s.cast || {};
      s.cast[id] = Date.now();
      if (OX()) OX().save();
    }
    const art = $(".ox-meet-art", node), ca = $(".ox-meet-art > .ca", node);
    if (reduced()) {
      OxCast.pose(ca, "happy", 1400);
    } else {
      art.classList.add("is-pop");
      sparkle(art, 6);
      setTimeout(() => OxCast.pose(ca, "happy", 1400), 520);
    }
    if (OX()) {
      OX().toast(`New in your Field Guide: <b>${esc(e.name)}</b>`);
      OX().award(2, "new friend", "meet:" + id);
    }
  }

  /* ------------------------------------------------------------ Oxi reacts */
  // Every fresh answer dispatches ox:answer on its component. Oxi pops up at
  // the top-right corner, poses, and leaves after about 1.8 s.
  function react(host, right) {
    host.classList.add("ox-has-oxi");
    let wrap = Array.from(host.children).find((c) => c.classList.contains("ox-oxi-react"));
    if (!wrap) {
      wrap = document.createElement("span");
      wrap.className = "ox-oxi-react";
      wrap.setAttribute("aria-hidden", "true");
      wrap.innerHTML = OxCast.el("oxi");
      host.appendChild(wrap);
    }
    clearTimeout(wrap._fade);
    clearTimeout(wrap._gone);
    wrap.querySelectorAll(".cast-confetti").forEach((c) => c.remove());
    wrap.classList.remove("is-out", "is-pop");
    const motion = !reduced();
    if (motion) { void wrap.offsetWidth; wrap.classList.add("is-pop"); }
    OxCast.pose(wrap.querySelector(".ca"), right ? "happy" : "oops");
    if (right && motion) confetti(wrap, 12);
    if (motion) wrap._fade = setTimeout(() => wrap.classList.add("is-out"), 1550);
    wrap._gone = setTimeout(() => {
      wrap.remove();
      if (!host.querySelector(":scope > .ox-oxi-react")) host.classList.remove("ox-has-oxi");
    }, 1800);
  }

  document.addEventListener("ox:answer", (ev) => {
    const host = ev.target;
    if (!(host instanceof Element)) return;
    react(host, !!(ev.detail && ev.detail.right));
  });

  /* ------------------------------------------------------------ the molt */
  // The level-up dialog. Only one is open at a time; later level-ups queue.
  const molt = { open: null, queue: [] };

  document.addEventListener("ox:levelup", (ev) => {
    ev.preventDefault(); // the molt stands in for the old "Level up" toast
    molt.queue.push(ev.detail || {});
    if (!molt.open) openMolt();
  });

  function openMolt() {
    const d = molt.queue.shift();
    if (!d) return;
    const motion = !reduced();
    const lastFocus = document.activeElement;
    const back = document.createElement("div");
    back.className = "ox-molt" + (motion ? " is-seq" : "");
    back.innerHTML = `
      <div class="ox-molt-card" role="dialog" aria-modal="true" aria-labelledby="ox-molt-title">
        <div class="ox-molt-stage" aria-hidden="true">
          ${motion ? `<div class="ox-molt-shell is-in">${OxCast.prop("shell")}</div>
          <div class="ox-molt-half is-left">${OxCast.prop("shell")}</div>
          <div class="ox-molt-half is-right">${OxCast.prop("shell")}</div>` : ""}
          <div class="ox-molt-oxi">${OxCast.el("oxi", motion ? {} : { pose: "happy" })}</div>
        </div>
        <h2 class="ox-molt-title" id="ox-molt-title">Molt!</h2>
        <p class="ox-molt-line">You're now a <b>${esc(d.name || "")}</b></p>
        <p class="ox-label ox-molt-level">Level ${(Number(d.index) || 0) + 1}</p>
        <button type="button" class="ox-btn is-primary ox-molt-keep">Keep going</button>
      </div>`;
    document.body.appendChild(back);
    molt.open = back;

    const keep = $(".ox-molt-keep", back);
    const stage = $(".ox-molt-stage", back);
    const oxi = $(".ox-molt-oxi", back);
    const timers = [];
    const at = (ms, fn) => timers.push(setTimeout(fn, ms));

    if (motion) {
      // The shell appears, shakes, cracks, and splits; then Oxi steps out.
      at(520, () => $(".ox-molt-shell", back).classList.add("is-shake"));
      at(980, () => $(".ox-molt-shell", back).classList.add("is-crack"));
      at(1480, () => {
        $(".ox-molt-shell", back).classList.add("is-gone");
        $$(".ox-molt-half", back).forEach((h) => h.classList.add("is-split"));
      });
      at(1560, () => {
        oxi.classList.add("is-out");
        OxCast.pose($(".ox-molt-oxi .ca", back), "happy");
        confetti(stage, 26, 1.7);
      });
    }

    const onKey = (e) => {
      if (e.key === "Escape") { e.preventDefault(); close(); }
      else if (e.key === "Tab") { e.preventDefault(); keep.focus(); }
    };
    const close = () => {
      if (back.classList.contains("is-closing")) return;
      back.classList.add("is-closing");
      timers.forEach(clearTimeout);
      document.removeEventListener("keydown", onKey, true);
      const done = () => {
        back.remove();
        molt.open = null;
        if (lastFocus && lastFocus.isConnected && lastFocus.focus) lastFocus.focus({ preventScroll: true });
        if (molt.queue.length) setTimeout(openMolt, 400);
      };
      if (motion) setTimeout(done, 220); else done();
    };
    keep.addEventListener("click", close);
    back.addEventListener("click", (e) => { if (e.target === back) close(); });
    document.addEventListener("keydown", onKey, true);
    keep.focus({ preventScroll: true });
  }

  /* ------------------------------------------------------------ Field Guide */
  // <div class="ox-field-guide"></div> on labs/cast.html, with a
  // <div data-fg-progress></div> above it for the "N of M met" line.
  function mountGuide(root = document) {
    const grid = $(".ox-field-guide", root);
    if (!grid || grid.dataset.fgDone) return;
    grid.dataset.fgDone = "1";
    const course = window.OX_COURSE || { acts: [], chapters: [] };
    const list = (window.OxCast ? OxCast.list : []).slice().sort((a, b) => a.ch - b.ch);
    let html = "", act = 0, have = 0;
    list.forEach((e) => {
      const ch = chapterOf(e.ch);
      const a = ch && course.acts.find((x) => x.id === ch.act);
      if (a && a.id !== act) {
        act = a.id;
        const chs = course.chapters.filter((c) => c.act === a.id);
        html += `<h2 class="fg-act">Act ${ROMAN[a.id]} · ${esc(a.name)} <small>${esc(a.subtitle)} · Chapters ${chs[0].n}–${chs[chs.length - 1].n}</small></h2>`;
      }
      const known = met(e.id);
      if (known) have++;
      html += guideCard(e, ch, known);
    });
    grid.innerHTML = html;
    const total = list.length;
    const prog = $("[data-fg-progress]", root);
    if (prog) {
      prog.innerHTML = `<p class="fg-count"><b>${have}</b> of ${total} met</p>` +
        `<div class="fg-bar" role="progressbar" aria-label="Characters met" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${have}"><i style="width:${total ? Math.round((have / total) * 100) : 0}%"></i></div>`;
    }
    // Click the art of a met character to make it pose.
    grid.addEventListener("click", (ev) => {
      const btn = ev.target.closest && ev.target.closest(".fg-art");
      if (!btn || !grid.contains(btn)) return;
      const ca = btn.querySelector(".ca");
      if (!ca) return;
      OxCast.pose(ca, pick(POSES), 1400);
      if (btn.closest(".fg-card").classList.contains("is-prop")) {
        btn.classList.remove("is-poke");
        void btn.offsetWidth;
        btn.classList.add("is-poke");
        setTimeout(() => btn.classList.remove("is-poke"), 1400);
      }
    });
  }

  function guideCard(e, ch, known) {
    const where = ch ? `Chapter ${String(ch.n).padStart(2, "0")} · ${esc(ch.title)}` : "";
    const href = ch ? chapterHref(ch) : rel("index.html");
    const cls = (known ? "is-met" : "is-unmet") + (e.prop ? " is-prop" : "");
    if (known) {
      return `<article class="fg-card ${cls}" data-id="${esc(e.id)}">
        <button type="button" class="fg-art" aria-label="${esc(e.name)}. Press to play a pose.">${OxCast.entry(e.id)}</button>
        <h3 class="fg-name">${esc(e.name)}</h3>
        <p class="fg-rust">In Rust: <b>${esc(e.rust)}</b></p>
        <p class="fg-role">${esc(e.role)}</p>
        <a class="fg-where" href="${href}">${where}</a>
      </article>`;
    }
    return `<article class="fg-card ${cls}" data-id="${esc(e.id)}">
        <div class="fg-art" aria-hidden="true">${OxCast.entry(e.id)}</div>
        <h3 class="fg-name" aria-label="Not met yet">???</h3>
        <a class="fg-where" href="${href}">Meet in ${where}</a>
      </article>`;
  }

  /* ------------------------------------------------------------ boot */
  function mountAll(root) {
    if (!window.OxCast) { console.warn("cast.js needs cast-art.js"); return; }
    mountMeet(root);
    mountGuide(root);
  }

  window.OxCastUI = { mountMeet, mountGuide, met };
  if (window.Ox && window.Ox.ready) mountAll();
  else document.addEventListener("ox:ready", () => mountAll(), { once: true });
})();
