/* Oxidize cast components: meet cards, the Field Guide, Oxi's reaction to
   every answer, the level-up molt, the act boss cards and the WANTED wall.
   Needs cast-art.js (OxCast) and oxidize.js (Ox). Mounts on ox:ready, or at
   once when Ox is already ready.
   Exports window.OxCastUI = { mountMeet, mountGuide, mountBosses, mountBossGuide, met }. */
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

  /* ------------------------------------------------------------ act bosses */
  // An act boss sits in front of its boss quest. Ticking that quest in the
  // Forge (oxidize.js dispatches ox:quest) plays the defeat right there.
  const BOSSES = () => (window.OxCast && OxCast.bosses) || [];
  const questOf = (name) => (window.OX_QUESTS || []).find((q) => q.name === name) || {};
  const hitsOf = (name) => (questOf(name).tests > 0 ? questOf(name).tests : 5);
  const defeatedIn = (name) => !!(store() && store().quests && store().quests[name]);
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const cells = (hp, hits) => Array.from({ length: hits }, (_, i) => `<i${i < hp ? ' class="is-hp"' : ""}></i>`).join("");
  let bossListening = false;

  // Before each boss quest: <section class="ox-boss" data-boss="dragon">.
  function mountBosses(root = document) {
    $$(".ox-quest.is-boss[data-quest]", root).forEach((card) => {
      if (card.dataset.bossDone) return;
      const b = BOSSES().find((x) => x.quest === card.dataset.quest);
      if (!b) return;
      card.dataset.bossDone = "1";
      const sec = bossCard(b);
      card.parentNode.insertBefore(sec, card);
      if (!sec.classList.contains("is-defeated")) loomOnView(sec);
    });
    if (!bossListening) {
      bossListening = true;
      document.addEventListener("ox:quest", (ev) => {
        const d = ev.detail || {};
        $$(".ox-boss").forEach((sec) => { if (sec.dataset.quest === d.name) setDefeated(sec, !!d.done); });
      });
    }
  }

  function bossCard(b) {
    const name = b.quest, q = questOf(name), hits = hitsOf(name), down = defeatedIn(name);
    const sec = document.createElement("section");
    sec.className = "ox-boss" + (down ? " is-defeated is-stamped is-oxi" : "");
    sec.dataset.boss = b.id;
    sec.dataset.quest = name;
    sec.dataset.hits = String(hits);
    sec.setAttribute("aria-label", "Boss: " + b.name);
    sec.innerHTML = `
      <div class="ox-boss-art">${OxCast.boss(b.id, down ? { pose: "defeated" } : {})}<span class="ox-boss-stamp">Defeated</span></div>
      <div class="ox-boss-body">
        <p class="ox-boss-kicker">Act ${ROMAN[b.act]} boss</p>
        <h3 class="ox-boss-name">${esc(b.name)}</h3>
        <p class="ox-boss-guard">Guards the quest <b>${esc(q.title || name)}</b></p>
        <div class="ox-boss-hp">
          <div class="ox-boss-meter" role="meter" aria-label="Hit points" aria-valuemin="0" aria-valuemax="${hits}" aria-valuenow="${down ? 0 : hits}">${cells(down ? 0 : hits, hits)}</div>
          <span class="ox-boss-hpn">HP ${down ? 0 : hits}/${hits}</span>
        </div>
        <p class="ox-boss-weak">Weak to: ${esc(b.weak)}</p>
        <p class="ox-boss-role">${esc(b.role)}</p>
        <p class="ox-boss-tip">Each test you pass in <code>cargo forge</code> lands a hit. Tick the quest below when the Forge says Boss defeated.</p>
        <div class="ox-boss-oxi">
          <span class="ox-boss-say">Act ${ROMAN[b.act]} complete!</span>${OxCast.el("oxi")}
        </div>
        <p class="ox-boss-live" aria-live="polite"></p>
      </div>`;
    return sec;
  }

  // Alive bosses rise into view once, the first time 40% of the card shows.
  function loomOnView(sec) {
    if (reduced() || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((en) => en.isIntersecting && en.intersectionRatio >= 0.4)) {
        io.disconnect();
        sec.classList.add("is-looming");
      }
    }, { threshold: 0.4 });
    io.observe(sec);
  }

  function setHp(sec, hp) {
    $$(".ox-boss-meter > i", sec).forEach((c, i) => c.classList.toggle("is-hp", i < hp));
    $(".ox-boss-meter", sec).setAttribute("aria-valuenow", String(hp));
    $(".ox-boss-hpn", sec).textContent = `HP ${hp}/${sec.dataset.hits}`;
  }

  // The boss quest was ticked (down) or unticked. Every change takes a new
  // token, so a defeat still playing is cancelled by a later untick.
  function setDefeated(sec, down) {
    const b = BOSSES().find((x) => x.id === sec.dataset.boss);
    if (!b) return;
    const token = (sec._seq = (sec._seq || 0) + 1);
    if (down) {
      if (!sec.classList.contains("is-defeated")) defeat(sec, b, token);
    } else revive(sec);
  }

  // The defeat: drain, shake, pose, stamp, confetti, Oxi. Reduced motion
  // skips straight to the final state.
  async function defeat(sec, b, token) {
    const alive = () => sec._seq === token;
    const art = $(".ox-boss-art", sec), ca = $(".ox-boss-art > .ca", sec), oxi = $(".ox-boss-oxi > .ca", sec);
    const hits = +sec.dataset.hits, motion = !reduced();
    if (motion) {
      // 1. The HP cells drain right to left, one every 70 ms.
      for (let hp = hits - 1; hp >= 0; hp--) {
        await wait(70);
        if (!alive()) return;
        setHp(sec, hp);
      }
      // 2. The art shakes for 300 ms.
      art.classList.add("is-hit");
      await wait(300);
      if (!alive()) return;
      art.classList.remove("is-hit");
    } else setHp(sec, 0);
    // 3. The defeated pose. No timeout: it stays knocked over.
    OxCast.pose(ca, "defeated");
    sec.classList.add("is-defeated");
    $(".ox-boss-live", sec).textContent = `${b.name} is defeated.`;
    if (!motion) { sec.classList.add("is-stamped", "is-oxi"); return; }
    // 4. The stamp slams in over the art.
    sec.classList.add("is-stamped", "is-slam");
    await wait(220);
    if (!alive()) return;
    // 5. Confetti from the art.
    confetti(art, 26, 1.5);
    // 6. Oxi pops in beside the text.
    sec.classList.add("is-oxi");
    $(".ox-boss-oxi", sec).classList.add("is-pop");
    OxCast.pose(oxi, "happy", 1600);
  }

  // The boss quest was unticked: refill the HP, stand the boss up, and fade
  // the stamp and Oxi out.
  function revive(sec) {
    setHp(sec, +sec.dataset.hits);
    OxCast.pose($(".ox-boss-art > .ca", sec), null);
    OxCast.pose($(".ox-boss-oxi > .ca", sec), null);
    $(".ox-boss-art", sec).classList.remove("is-hit");
    $(".ox-boss-oxi", sec).classList.remove("is-pop");
    $(".ox-boss-live", sec).textContent = "";
    sec.classList.remove("is-defeated", "is-stamped", "is-slam", "is-oxi");
  }

  /* ------------------------------------------------------------ the WANTED wall */
  // labs/cast.html: <div class="ox-boss-wall"></div>. One poster per act boss,
  // lit "Defeated" once its quest is ticked. The reward is the boss-quest XP
  // that oxidize.js awards.
  const TILT = [-1.4, 1.1, -0.6, 1.5, -1];
  const BOSS_XP = 60;
  function mountBossGuide(root = document) {
    const wall = $(".ox-boss-wall", root);
    if (!wall || wall.dataset.wallDone || !window.OxCast) return;
    wall.dataset.wallDone = "1";
    const list = BOSSES();
    wall.innerHTML = `<p class="ox-wall-count" aria-live="polite"></p>` +
      `<div class="ox-wall-grid">${list.map((b, i) => posterHtml(b, i)).join("")}</div>`;
    paintWall(wall);
    // Pressing an alive boss's art makes it do a short wow.
    wall.addEventListener("click", (ev) => {
      const art = ev.target.closest && ev.target.closest(".ox-wanted-art");
      if (!art || !wall.contains(art) || art.closest(".ox-wanted").classList.contains("is-defeated")) return;
      OxCast.pose(art.querySelector(".ca"), "wow", 1200);
    });
  }

  function posterHtml(b, i) {
    const q = questOf(b.quest), ch = chapterOf(b.ch);
    const href = (ch ? chapterHref(ch) : rel("index.html")) + "#quests";
    return `<article class="ox-wanted" data-boss="${b.id}" style="--tilt:${TILT[i % TILT.length]}deg">
      <div class="ox-wanted-paper">
        <p class="ox-wanted-head">Wanted</p>
        <button type="button" class="ox-wanted-art" aria-label="${esc(b.name)}">${OxCast.boss(b.id)}<span class="ox-boss-stamp">Defeated</span></button>
        <h3 class="ox-wanted-name">${esc(b.name)}</h3>
        <p class="ox-wanted-seen">Last seen: <a href="${href}">Chapter ${String(b.ch).padStart(2, "0")} · ${esc(q.title || b.quest)}</a></p>
        <p class="ox-wanted-weak">Weak to: ${esc(b.weak)}</p>
        <p class="ox-wanted-foot"></p>
      </div>
    </article>`;
  }

  function paintWall(wall) {
    const list = BOSSES();
    let have = 0;
    list.forEach((b) => {
      const poster = $(`.ox-wanted[data-boss="${b.id}"]`, wall);
      const down = defeatedIn(b.quest);
      if (down) have++;
      if (!poster) return;
      poster.classList.toggle("is-defeated", down);
      OxCast.pose($(".ox-wanted-art > .ca", poster), down ? "defeated" : null);
      $(".ox-wanted-foot", poster).textContent = down ? "Defeated" : `Reward: ${BOSS_XP} XP`;
    });
    $(".ox-wall-count", wall).textContent = `${have} of ${list.length} defeated`;
  }

  /* ------------------------------------------------------------ boot */
  function mountAll(root) {
    if (!window.OxCast) { console.warn("cast.js needs cast-art.js"); return; }
    mountMeet(root);
    mountGuide(root);
    mountBosses(root);
    mountBossGuide(root);
  }

  window.OxCastUI = { mountMeet, mountGuide, mountBosses, mountBossGuide, met };
  if (window.Ox && window.Ox.ready) mountAll();
  else document.addEventListener("ox:ready", () => mountAll(), { once: true });
})();
