/* S6 · REAL COMPILER (40 - 48 s), DIRECTION.md section 3.
   A real terminal runs the Forge, and every line on it is real output:
   - the header, quest lines and footers: forge/src/main.rs (header, report, footer);
   - the Oxi frames and the Ledger Dragon: forge/src/art.rs, copied byte for byte;
   - the borrow2 error: rustc 1.97 on a learner's borrow2.rs (E0596), captured
     from `cargo forge` in watch mode (21/88 passed, then the fixed file: 22/88);
   - the boss panel: boss_panel() in main.rs, with the numbers of boss3_ledger
     (8 tests, so 2 cells per test: 16 cells at full HP).
   The terminal is a pure function of T: its body is rebuilt from T alone. */
(function () {
  "use strict";

  const clamp = V.clamp;
  const P = V.p;
  const E = V.ease;
  const cue = (k, d) => (V.cue && V.cue[k] !== undefined ? V.cue[k] : d);

  // ------------------------------------------------------------ art (forge/src/art.rs)
  const OXI_GROUND = ["", " (\\/)         (\\/)", "   \\\\  .---.  //", "    \\\\( ^ ^ )//", "      (  w  )", "      /'---'\\"];
  const OXI_JUMP = [" (\\/)         (\\/)", "   \\\\  .---.  //", "    \\\\( ^ ^ )//", "      (  o  )", "      /'---'\\", ""];
  const OXI_SPARKLE = [" *    .    +    .   *", " (\\/)         (\\/)", "   \\\\  .---.  //", "    \\\\( ^ ^ )//", "      (  w  )", "      /'---'\\"];
  const DRAGON = ["      /\\       /\\", "     /  '-----'  \\", " /\\  |  \\@   @/  |  /\\", "/  '-|   vvvvv   |-'  \\", "\\     '.       .'     /", " '-.   |  $$$  |   .-'", "    (o)(o)(o)(o)(o)"];

  // The Ledger Dragon (art.rs BOSSES[2]); its numbers come from boss3_ledger.rs.
  const BOSS = {
    name: "The Ledger Dragon",
    act: "III",
    weak: "enums, Result, HashMap and iterators",
    taunt: "The Dragon curls around its ledger. Nothing compiles, nothing balances.",
    hurt: "Some accounts still don't balance.",
    defeat: "The Dragon lets go of the ledger. Every account balances.",
  };
  const TESTS = 8; // #[test] functions in quests/13_iterators_closures/boss3_ledger.rs
  const OXI_WIDTH = 24;
  const BOSS_WIDTH = 26;
  const MOOD_WIDTH = 50;

  // The real rustc output for borrow2 (E0596), from the watch-mode run.
  const RUSTC_ERROR = [
    "error[E0596]: cannot borrow `*s` as mutable, as it is behind a `&` reference",
    "  --> quests/07_borrowing/borrow2.rs:22:5",
    "   |",
    "22 |     s.insert(0, '*');",
    "   |     ^ `s` is a `&` reference, so it cannot be borrowed as mutable",
    "   |",
    "help: consider changing this to be a mutable reference",
    "   |",
    "21 | fn wrap_in_stars(s: &mut String) {",
    "   |                      +++",
  ];
  const FIX_LINE = 8; // the help line that shows the fix: `s: &mut String`

  const DASH = "─".repeat(64);
  const CAR = "▰";
  const EMP = "▱";

  // ------------------------------------------------------------ forge helpers
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  // ui::progress_bar(done, total, width)
  const bar = (done, total, width) => {
    const filled = Math.min(width, Math.floor((done * width) / total));
    return CAR.repeat(filled) + EMP.repeat(width - filled);
  };
  // ui::wrap(text, width): break on spaces, never split a word.
  const wrap = (text, width) => {
    const lines = [];
    let line = "";
    for (const word of text.split(/\s+/).filter(Boolean)) {
      if (line && line.length + 1 + word.length > width) {
        lines.push(line);
        line = "";
      }
      line = line ? line + " " + word : word;
    }
    if (line) lines.push(line);
    return lines;
  };
  // art::hp_cells(hp, total) -> (filled, empty)
  const hpCells = (hp, total) => {
    const width = Math.min(total * 2, 24);
    const filled = hp === 0 || total === 0 ? 0 : clamp(Math.floor((hp * width) / total), 1, width);
    return [filled, width - filled];
  };
  const hpLine = (hp, total, ko) => {
    const [f, e] = hpCells(hp, total);
    let s = `HP <span class="c-err">${"█".repeat(f)}</span><span class="c-dim">${"░".repeat(e)}</span>  ${hp}/${total}`;
    if (ko) s += `<span class="c-ok">   K.O.</span>`;
    return s;
  };
  // art::side_by_side: the left column is padded to leftWidth, right lines start at rightFromRow.
  const sideBySide = (left, right, leftWidth, rightFromRow) => {
    const rows = Math.max(left.length, rightFromRow + right.length);
    const out = [];
    for (let r = 0; r < rows; r++) {
      const l = left[r] !== undefined ? left[r] : "";
      const k = r - rightFromRow;
      const rt = k >= 0 && k < right.length ? right[k] : "";
      out.push({ l, width: leftWidth, r: rt });
    }
    return out;
  };

  // ------------------------------------------------------------ time-based content
  // Oxi's frames at the hops (the film's @forgeHops): ground, jump, ground, jump, ground, jump, sparkle.
  const oxiFrame = (T) => {
    const hops = [
      [42.5, 42.75, OXI_JUMP],
      [42.75, 43.0, OXI_GROUND],
      [43.0, 43.25, OXI_JUMP],
      [43.25, 43.5, OXI_GROUND],
      [43.5, 43.75, OXI_JUMP],
    ];
    for (const [a, b, f] of hops) if (T >= a && T < b) return f;
    if (T >= 43.75) return OXI_SPARKLE;
    return OXI_GROUND;
  };

  // The fail screen (borrow2, 21/88) and the pass screen (22/88) are real runs.
  // The boss screen is the boss3_ledger run: compile error at 8/8, then tests
  // failing (7/8 down to 0/8), then the pass (23/88).

  // ------------------------------------------------------------ CSS
  const CSS = `
.s6-bg { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px;
  background: radial-gradient(ellipse 58% 60% at 50% 46%, #161b22 0%, #0b0d10 72%); }
.s6-cam { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; }
.s6-term { position: absolute; left: 210px; top: 110px; width: 1500px; height: 860px;
  background: #0d1117; border: 1px solid var(--steel); border-radius: 18px; overflow: hidden;
  box-shadow: 0 40px 120px rgba(0,0,0,0.6), 0 0 90px rgba(232,89,12,0.07); transform-origin: 50% 50%; }
.s6-bar { position: absolute; left: 0; top: 0; width: 100%; height: 58px; border-bottom: 1px solid #1c232c; }
.s6-bar i { position: absolute; top: 21px; width: 16px; height: 16px; border-radius: 50%; background: #39414b; }
.s6-bar span { position: absolute; left: 0; right: 0; top: 14px; text-align: center; font: 500 28px/30px var(--font-mono); color: #7d8792; }
.s6-body { position: absolute; left: 40px; top: 84px; width: 1420px; height: 760px; overflow: hidden;
  font: 500 27px/30px var(--font-mono); color: #e9e4da; white-space: pre; font-variant-ligatures: none; font-feature-settings: "liga" 0, "calt" 0; }
.s6-body .r { position: relative; height: 30px; overflow: hidden; }
.s6-body .w { height: auto; white-space: pre-wrap; overflow: visible; }
.s6-body .b { height: 15px; }
.s6-body .c-ox { color: var(--oxide); }
.s6-body .c-ok { color: var(--ok); }
.s6-body .c-err { color: var(--error); }
.s6-body .c-dim { color: var(--muted); }
.s6-body .c-b { font-weight: 700; color: #fff4e3; }
.s6-body .c-blue { color: var(--borrow); }
.s6-body .c-cy { color: #5fd0e6; }
.s6-body .c-mol { color: var(--molten); }
.s6-body .pl { display: inline-block; width: 26ch; }
.s6-body .oxl { display: inline-block; width: 24ch; }
.s6-body .dragon-dim { opacity: 0.42; }
.s6-body .sweep { position: absolute; top: 0; height: 30px; width: 300px; pointer-events: none;
  background: linear-gradient(90deg, rgba(255,138,61,0), rgba(255,138,61,0.55) 50%, rgba(255,138,61,0)); }
.s6-body .fx { border-radius: 3px; }
.s6-caret { display: inline-block; width: 0.56em; height: 1em; background: var(--oxide); vertical-align: -0.14em; }
.s6-cap { position: absolute; right: 96px; bottom: 72px; height: 88px; display: flex; align-items: flex-end; gap: 30px; white-space: nowrap; }
.s6-cap-main { font: 900 96px/0.9 var(--font-display); text-transform: uppercase; letter-spacing: 0.02em; color: var(--cream); }
.s6-cap-sub { font: 400 40px/1 var(--font-body); color: var(--muted); padding-bottom: 4px; }
.s6-dragon { position: absolute; left: 1722px; top: 250px; width: 190px; height: 172px; }
.s6-dragon .ca { width: 190px; height: 172px; }
`;

  // ------------------------------------------------------------ rows
  // Every row is { at, html, cls }. A row is shown once T >= at.
  function headerRows(done) {
    return [
      { at: 0, html: `<span class="c-ox">⚒  OXIDIZE FORGE</span>  ${bar(done, 88, 24)}  <span class="c-dim">${done}/88 passed</span>` },
      { at: 0, html: `<span class="c-dim">${DASH}</span>` },
    ];
  }

  function questRows(done, meta) {
    const boss = meta.boss ? `<span class="c-ox">BOSS · </span>` : "";
    return [
      { at: 0, html: `${boss}<span class="c-b">${esc(meta.quest)}</span> <span class="c-dim">(${esc(meta.name)})</span>` },
      { at: 0, html: `<span class="c-dim">${esc(meta.chapter)}</span>` },
      { at: 0, html: esc(meta.summary) },
      { at: 0, html: `Edit <span class="c-cy">${esc(meta.edit)}</span>` },
      { at: 0, html: "", cls: "b" },
    ];
  }

  const BORROW2 = {
    quest: "Quest 22 · Mutable borrow",
    name: "borrow2",
    chapter: "Chapter 07 · Borrowing",
    summary: "Modify a value through &mut.",
    edit: "quests/07_borrowing/borrow2.rs",
  };
  const BOSS3 = {
    quest: "Quest 51 · Bank ledger",
    name: "boss3_ledger",
    chapter: "Chapter 13 · Iterators & Closures",
    summary: "Act III boss: enums, Results, maps and iterators together.",
    edit: "quests/13_iterators_closures/boss3_ledger.rs",
    boss: true,
  };

  // The rustc lines, colored the way rustc colors them on a terminal.
  function rustcHtml(i, T, fixAt) {
    const l = RUSTC_ERROR[i];
    if (i === 0) {
      const m = l.match(/^error\[E0596\]: (.*)$/);
      return `<span class="c-err">error[E0596]</span><span class="c-b">: ${esc(m[1])}</span>`;
    }
    if (l.startsWith("  -->")) return `<span class="c-blue">  --&gt;</span> ${esc(l.slice(6))}`;
    if (l.startsWith("help:")) return `<span class="c-cy">help</span><span class="c-b">: consider changing this to be a mutable reference</span>`;
    if (/^\d+ \|/.test(l)) {
      const num = l.match(/^(\d+) \|/)[1];
      const code = l.slice(num.length + 3);
      if (i === FIX_LINE) {
        const at = code.indexOf("&mut");
        const u = P(T, fixAt, fixAt + 0.4, E.inOutCubic);
        const pre = esc(code.slice(0, at));
        const post = esc(code.slice(at + 4));
        const sweepX = -300 + u * 1000;
        const sweep = T >= fixAt && T < fixAt + 0.4 ? `<span class="sweep" style="left:${sweepX}px"></span>` : "";
        const glow = T >= fixAt + 0.4 ? "c-mol" : "c-b";
        return `<span class="c-blue">${num} |</span> ${pre}<span class="${glow} fx">&amp;mut</span>${post}${sweep}`;
      }
      return `<span class="c-blue">${num} |</span> ${esc(code)}`;
    }
    if (l.startsWith("   |") && l.includes("^")) {
      const idx = l.indexOf("^");
      return `<span class="c-blue">   |</span>${esc(l.slice(4, idx))}<span class="c-err">^</span><span class="c-err">${esc(l.slice(idx + 1))}</span>`;
    }
    if (l.trim() === "+++") return `<span class="c-blue">   |</span>${esc(l.slice(4, l.indexOf("+++")))}<span class="c-ok">+++</span>`;
    if (l === "   |") return `<span class="c-blue">   |</span>`;
    return esc(l);
  }

  // The fail screen (40.0 - 42.0): `cargo forge`, borrow2 at 21/88, the real rustc error.
  function screenFail(T) {
    const rows = [];
    const add = (at, html, cls) => {
      if (T >= at) rows.push(`<div class="r ${cls || ""}">${html || "&nbsp;"}</div>`);
    };
    // The prompt: typed at 40.0 - 40.4 (@forgeCmd), the caret blinks until the output starts.
    const cmd = "cargo forge";
    const u = P(T, cue("forgeCmd", 40.0), cue("forgeCmd", 40.0) + 0.4);
    const n = Math.round(u * cmd.length);
    // the caret is solid while typing, then blinks (250 ms) until the output starts at 40.5
    const blinkOn = Math.floor(T / 0.25) % 2 === 0;
    const showCaret = n < cmd.length || (T < 40.5 && blinkOn);
    add(0, `<span class="c-ok">$</span> ${esc(cmd.slice(0, n))}${showCaret ? `<span class="s6-caret"></span>` : ""}`);
    const forgeCmd = cue("forgeCmd", 40.0);
    const hdr = headerRows(21);
    hdr.forEach((r, i) => add(forgeCmd + 0.45, r.html, r.cls));
    const q = questRows(21, BORROW2);
    const qAt = cue("forgeFail", 40.8);
    q.forEach((r) => add(qAt, r.html, r.cls));
    add(qAt + 0.1, `<span class="c-err">✗</span> <span class="c-err">Doesn't compile yet.</span> <span class="c-dim">Read the first error carefully; it's usually the only one that matters.</span>`, "w");
    add(qAt + 0.1, "", "b");
    const errAt = [qAt + 0.2, qAt + 0.2, qAt + 0.25, qAt + 0.28, qAt + 0.32, qAt + 0.34, qAt + 0.38, qAt + 0.4, qAt + 0.42, qAt + 0.44];
    RUSTC_ERROR.forEach((_, i) => add(errAt[i], rustcHtml(i, T, cue("forgeFix", 41.4)), ""));
    add(qAt + 0.5, "…", "c-dim");
    add(qAt + 0.6, "", "b");
    add(qAt + 0.6, `<span class="c-dim">${DASH}</span>`);
    add(qAt + 0.65, `<span class="c-dim">Save the file to re-check · h hint · l list · s skip for now · q quit  (letter + Enter)</span>`, "w");
    return rows.join("");
  }

  // The pass screen (42.0 - 44.0): the screen clears, the real pass output, 22/88.
  function screenPass(T) {
    const rows = [];
    const add = (html, cls) => rows.push(`<div class="r ${cls || ""}">${html || "&nbsp;"}</div>`);
    headerRows(22).forEach((r) => add(r.html, r.cls));
    questRows(22, BORROW2).slice(0, 4).forEach((r) => add(r.html, r.cls));
    add("", "b");
    const frame = oxiFrame(T);
    const right = [null, null, `<span class="c-ok">✓ Quest passed. 3 tests green.</span>`, `<span class="c-dim">Tidy. Tests are green; leaks are still yours to check.</span>`];
    for (let i = 0; i < 6; i++) {
      const line = frame[i] || "";
      const left = `<span class="oxl ${line.includes("*") ? "c-mol" : "c-ox"}">${esc(line)}</span>`;
      add(`${left}${right[i] || ""}`);
    }
    add(`<span class="c-dim">  Compare with the reference: cargo forge solution borrow2</span>`);
    add("", "b");
    add(`<span class="c-dim">${DASH}</span>`);
    add(`<span class="c-ok">Press Enter for the next quest.</span>  <span class="c-dim">h hint · l list · q quit</span>`);
    return rows.join("");
  }

  // The boss panel: boss_panel() in main.rs, drawn beside art.rs's dragon.
  function bossPanel(hp, mood, ko, eye, dimmed) {
    const out = [];
    out.push(`<div class="r"><span class="c-ox">${BOSS.name}</span><span class="c-dim"> · Act ${BOSS.act} boss</span></div>`);
    const right = [];
    if (TESTS > 0) right.push(hpLine(hp, TESTS, ko));
    right.push(`<span class="c-dim">Weak to: ${esc(BOSS.weak)}</span>`);
    right.push("");
    wrap(mood, MOOD_WIDTH).forEach((l) => right.push(`<span class="${ko ? "c-dim" : ""}">${esc(l)}</span>`));
    const rows = sideBySide(DRAGON.map((l) => l.replace(/@/g, eye)), right.map((h) => h), BOSS_WIDTH, 1);
    rows.forEach((row) => {
      const art = `<span class="pl ${dimmed ? "dragon-dim" : ""}">${esc(row.l)}</span>`;
      out.push(`<div class="r">${art}${row.r || ""}</div>`);
    });
    return out.join("");
  }

  // The boss screen (44.0 - 48.0): the boss3_ledger run.
  function screenBoss(T) {
    const hits = cue("bossHits", [44.5, 44.75, 45.0, 45.25, 45.5, 45.75, 46.0, 46.25]);
    const ko = T >= cue("ko", 46.5);
    const hitsDone = hits.filter((h) => T >= h).length;
    const hp = TESTS - hitsDone;
    const knocked = hp === 0 && T >= hits[hits.length - 1];
    const done = knocked ? 23 : 22;
    const rows = [];
    const add = (html, cls) => rows.push(`<div class="r ${cls || ""}">${html || "&nbsp;"}</div>`);
    headerRows(done).forEach((r) => add(r.html, r.cls));
    questRows(done, BOSS3).forEach((r) => add(r.html, r.cls));
    // the panel: mood follows the state. taunt = nothing compiles; hurt = some tests fail; defeat = all pass
    const mood = hp === TESTS ? BOSS.taunt : knocked ? BOSS.defeat : BOSS.hurt;
    const eye = ko ? "x" : "o";
    rows.push(bossPanel(hp, mood, knocked, eye, ko));
    return rows.join("");
  }

  // ------------------------------------------------------------ scene
  V.scene({
    id: "s6",
    start: 40,
    end: 48,
    setup(layer) {
      if (!document.getElementById("s6-css")) {
        const st = document.createElement("style");
        st.id = "s6-css";
        st.textContent = CSS;
        document.head.appendChild(st);
      }
      layer.innerHTML = `
        <div class="s6-bg"></div>
        <div class="s6-cam">
          <div class="s6-term" data-k="term">
            <div class="s6-bar"><i style="left:22px"></i><i style="left:50px"></i><i style="left:78px"></i><span>~/learn-rust</span></div>
            <div class="s6-body" data-k="body"></div>
          </div>
          <div class="s6-dragon" data-k="dragon" style="opacity:0">${V.boss("dragon", { pose: "defeated" })}</div>
        </div>
        <div class="s6-cap" data-k="qcap"><div class="s6-cap-main">88 QUESTS.</div><div class="s6-cap-sub">checked by the real compiler</div></div>
        <div class="s6-cap" data-k="bcap"><div class="s6-cap-main">5 BOSSES.</div></div>`;
    },
    render(t, layer, T) {
      const q = (k) => layer.querySelector(`[data-k="${k}"]`);
      const term = q("term");
      const body = q("body");
      const cam = layer.querySelector(".s6-cam");
      V.set(cam, { s: 1 + 0.02 * (t / 8), origin: "50% 50%" });

      // The terminal: tilt in at 40.0 (rotateX 8 -> 0), glide up at 41.6 - 42.2,
      // shake on boss hits, then shrink into one point (inExpo) at 47.5 - 48.0.
      const tilt = 8 * (1 - P(T, 40.0, 40.6, E.outExpo));
      const glide = P(T, 41.6, 42.2, E.inOutCubic);
      const forgeOut = P(T, cue("forgeOut", 47.5), 48.0, E.inExpo);
      const hits = cue("bossHits", [44.5, 44.75, 45.0, 45.25, 45.5, 45.75, 46.0, 46.25]);
      const shk = V.shake(T, hits, 6, 0.3);
      const koShk = V.shake(T, [cue("ko", 46.5)], 8, 0.35);
      const sx = shk.x + koShk.x;
      const sy = shk.y + koShk.y;
      const scale = 1 - forgeOut;
      const ty = -62 * glide + 62 * forgeOut + sy;
      term.style.transform = `perspective(2400px) translate(${round(sx)}px, ${round(ty)}px) rotateX(${round(tilt)}deg) scale(${round(scale)})`;
      term.style.opacity = T >= 47.99 ? 0 : 1;

      // The screens: fail (40.0 - 42.0), pass (42.0 - 44.0), boss (44.0 - 48.0).
      let html;
      if (T < cue("forgePass", 42.0)) html = screenFail(T);
      else if (T < cue("boss", 44.0)) html = screenPass(T);
      else html = screenBoss(T);
      if (body.dataset.last !== html) {
        body.dataset.last = html;
        body.innerHTML = html;
      }

      // The captions: 88 QUESTS. (42.0 - 44.0), 5 BOSSES. (46.5 - 47.5).
      const qc = q("qcap");
      const qIn = P(T, 42.0, 42.45, E.outExpo);
      const qOut = P(T, 43.7, 44.0, E.inQuad);
      V.set(qc, { x: 0, y: 36 * (1 - qIn), o: Math.max(0, qIn - qOut) });
      const bc = q("bcap");
      const bIn = P(T, cue("ko", 46.5), cue("ko", 46.5) + 0.45, E.outExpo);
      const bOut = P(T, 47.5, 47.75, E.inQuad);
      V.set(bc, { x: 0, y: 36 * (1 - bIn), o: Math.max(0, bIn - bOut) });

      // The Ledger Dragon pops beside the terminal at the K.O. (outBack).
      const dr = q("dragon");
      const dIn = P(T, cue("ko", 46.5), cue("ko", 46.5) + 0.5, E.outBack);
      const dOut = P(T, 47.5, 47.75, E.inQuad);
      const dOp = clamp(Math.min(1, dIn * 1.6) - dOut, 0, 1);
      V.set(dr, { x: 0, y: 0, s: 0.2 + 0.8 * dIn, origin: "50% 50%", o: dOp });
    },
  });

  function round(v) {
    return Math.round(v * 100) / 100;
  }
})();
