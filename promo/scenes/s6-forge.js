/* S6 · REAL COMPILER (40 - 48 s), DIRECTION.md section 3.
   A real terminal runs the Forge, and every line on it is real output:
   - the header, quest lines and footers: forge/src/main.rs (header, report, footer);
   - the Oxi frames and the Ledger Dragon panel: forge/src/art.rs, copied byte for byte;
   - the borrow2 error: rustc 1.97 on a learner's borrow2.rs (E0596), captured
     from `cargo forge` in watch mode (21/88 passed, then the fixed file: 22/88);
   - the boss panel: boss_panel() in main.rs, with the numbers of boss3_ledger
     (8 tests, so 2 cells per test: 16 cells at full HP).
   Beside the terminal, the real SVG Ledger Dragon (OxCast.boss) fights: each of the
   8 hits knocks it back and makes it "ouch", and the K.O. puts it in the "defeated" pose.
   The window re-frames with its content, as a camera move (no scrolling): 1560x880 for the
   failing screen, 1560x620 for the pass, 1240x640 for the boss. Everything is a pure
   function of T. */
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
  const BOSS_WIDTH = 26;
  const MOOD_WIDTH = 50;
  const OXI_RIGHT = 69; // the pass window is 93 cols wide: the Oxi column is 24, so 69 are left for its text

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

  // The window's rectangle at T: centred on (960, 540) for the fail and pass screens, then
  // it moves to the boss's place (96, 220) while the dragon enters.
  function winRect(T) {
    const fail = { x: 180, y: 100, w: 1560, h: 880 };
    if (T < 42.0) return fail;
    if (T < 44.0) {
      const h = V.lerp(880, 620, P(T, 42.0, 42.3, E.outExpo));
      return { x: 180, y: 540 - h / 2, w: 1560, h };
    }
    const e = P(T, 44.0, 44.35, E.outExpo);
    const h = V.lerp(620, 640, e);
    return { x: V.lerp(180, 96, e), y: 540 - h / 2, w: V.lerp(1560, 1240, e), h };
  }

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

  // ------------------------------------------------------------ CSS
  const CSS = `
.s6-bg { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px;
  background: radial-gradient(ellipse 58% 60% at 50% 46%, #161b22 0%, #0b0d10 72%); }
.s6-cam { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; }
.s6-term { position: absolute; left: 180px; top: 100px; width: 1560px; height: 880px;
  background: #0d1117; border: 1px solid var(--steel); border-radius: 18px; overflow: hidden;
  box-shadow: 0 40px 120px rgba(0,0,0,0.6), 0 0 90px rgba(232,89,12,0.07); transform-origin: 50% 50%; }
.s6-bar { position: absolute; left: 0; top: 0; width: 100%; height: 58px; border-bottom: 1px solid #1c232c; }
.s6-bar i { position: absolute; top: 21px; width: 16px; height: 16px; border-radius: 50%; background: #39414b; }
.s6-bar span { position: absolute; left: 0; right: 0; top: 14px; text-align: center; font: 500 28px/30px var(--font-mono); color: #7d8792; }
.s6-body { position: absolute; left: 26px; top: 84px; right: 26px; bottom: 20px; overflow: hidden;
  font: 500 27px/30px var(--font-mono); color: #e9e4da; white-space: pre; font-variant-ligatures: none; font-feature-settings: "liga" 0, "calt" 0; }
.s6-rows { position: absolute; left: 0; top: 0; width: 100%; }
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
.s6-dragon { position: absolute; left: 1410px; top: 300px; width: 380px; height: 340px; transform-origin: 50% 50%; }
.s6-shadow { position: absolute; left: 50px; top: 318px; width: 280px; height: 36px; border-radius: 50%;
  background: radial-gradient(ellipse at center, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0) 70%); }
.s6-dart { position: absolute; left: 0; top: 0; width: 380px; height: 340px; }
.s6-dart .ca { display: block; width: 380px; height: 340px; }
.s6-dart .ca-svg { width: 380px; height: 340px; }
.s6-hit { position: absolute; left: 0; top: 0; width: 380px; height: 340px; pointer-events: none;
  background: radial-gradient(circle at 50% 45%, rgba(255,50,50,0.9) 0%, rgba(255,50,50,0.25) 55%, rgba(255,50,50,0) 75%); }
.s6-ko { position: absolute; left: 0; top: 96px; width: 380px; text-align: center; white-space: nowrap;
  font: 900 180px/1 var(--font-display); text-transform: uppercase; letter-spacing: 0.02em; color: var(--ok);
  text-shadow: 0 0 30px rgba(58,208,122,0.45); }
.s6-float { position: absolute; left: 90px; top: -20px; width: 200px; text-align: center; white-space: nowrap;
  font: 900 48px/1 var(--font-display); text-transform: uppercase; letter-spacing: 0.02em; color: var(--error); }
`;

  // ------------------------------------------------------------ rows
  // Every row is { html, cls }. Rows are built from T alone.
  function headerRows(done) {
    return [
      { html: `<span class="c-ox">⚒  OXIDIZE FORGE</span>  ${bar(done, 88, 24)}  <span class="c-dim">${done}/88 passed</span>` },
      { html: `<span class="c-dim">${DASH}</span>` },
    ];
  }

  function questRows(done, meta) {
    const boss = meta.boss ? `<span class="c-ox">BOSS · </span>` : "";
    return [
      { html: `${boss}<span class="c-b">${esc(meta.quest)}</span> <span class="c-dim">(${esc(meta.name)})</span>` },
      { html: `<span class="c-dim">${esc(meta.chapter)}</span>` },
      { html: esc(meta.summary) },
      { html: `Edit <span class="c-cy">${esc(meta.edit)}</span>` },
      { html: "", cls: "b" },
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

  // The rustc lines, coloured the way rustc colours them on a terminal.
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
    // The prompt: typed at 40.0 - 40.4 (@forgeCmd); the caret is solid while typing, then blinks until 40.5.
    const cmd = "cargo forge";
    const forgeCmd = cue("forgeCmd", 40.0);
    const u = P(T, forgeCmd, forgeCmd + 0.4);
    const n = Math.round(u * cmd.length);
    const blinkOn = Math.floor(T / 0.25) % 2 === 0;
    const showCaret = n < cmd.length || (T < 40.5 && blinkOn);
    add(0, `<span class="c-ok">$</span> ${esc(cmd.slice(0, n))}${showCaret ? `<span class="s6-caret"></span>` : ""}`);
    headerRows(21).forEach((r) => add(forgeCmd + 0.45, r.html, r.cls));
    const qAt = cue("forgeFail", 40.8);
    questRows(21, BORROW2).forEach((r) => add(qAt, r.html, r.cls));
    add(qAt + 0.1, `<span class="c-err">✗</span> <span class="c-err">Doesn't compile yet.</span> <span class="c-dim">Read the first error carefully; it's usually the only one that matters.</span>`, "w");
    add(qAt + 0.1, "", "b");
    const errAt = [qAt + 0.2, qAt + 0.2, qAt + 0.25, qAt + 0.28, qAt + 0.32, qAt + 0.34, qAt + 0.38, qAt + 0.4, qAt + 0.42, qAt + 0.44];
    RUSTC_ERROR.forEach((_, i) => add(errAt[i], rustcHtml(i, T, cue("forgeFix", 41.4)), i === 0 ? "w" : ""));
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
    // Oxi's right column: the status line, then the flavour line wrapped to the column.
    const flavour = wrap("Tidy. Tests are green; leaks are still yours to check.", OXI_RIGHT);
    const right = [null, null, `<span class="c-ok">✓ Quest passed. 3 tests green.</span>`];
    flavour.forEach((l, k) => (right[3 + k] = `<span class="c-dim">${esc(l)}</span>`));
    const frame = oxiFrame(T);
    for (let i = 0; i < 6; i++) {
      const line = frame[i] || "";
      const left = `<span class="oxl ${line.includes("*") ? "c-mol" : "c-ox"}">${esc(line)}</span>`;
      add(`${left}${right[i] || ""}`);
    }
    add(`<span class="c-dim">  Compare with the reference: cargo forge solution borrow2</span>`, "w");
    add("", "b");
    add(`<span class="c-dim">${DASH}</span>`);
    add(`<span class="c-ok">Press Enter for the next quest.</span>  <span class="c-dim">h hint · l list · q quit</span>`, "w");
    return rows.join("");
  }

  // The boss panel: boss_panel() in main.rs, the forge's own text (its ASCII dragon too).
  function bossPanel(hp, mood, ko, eye, dimmed) {
    const out = [];
    out.push(`<div class="r"><span class="c-ox">${BOSS.name}</span><span class="c-dim"> · Act ${BOSS.act} boss</span></div>`);
    const right = [];
    right.push(hpLine(hp, TESTS, ko));
    right.push(`<span class="c-dim">Weak to: ${esc(BOSS.weak)}</span>`);
    right.push("");
    wrap(mood, MOOD_WIDTH).forEach((l) => right.push(`<span class="${ko ? "c-dim" : ""}">${esc(l)}</span>`));
    const rows = sideBySide(DRAGON.map((l) => l.replace(/@/g, eye)), right, BOSS_WIDTH, 1);
    rows.forEach((row) => {
      const art = `<span class="pl ${dimmed ? "dragon-dim" : ""}">${esc(row.l)}</span>`;
      out.push(`<div class="r">${art}${row.r || ""}</div>`);
    });
    return out.join("");
  }

  // The boss screen (44.0 - 48.0): the boss3_ledger run, from the compile error to the K.O.
  function screenBoss(T) {
    const hits = cue("bossHits", [44.5, 44.75, 45.0, 45.25, 45.5, 45.75, 46.0, 46.25]);
    const ko = T >= cue("ko", 46.5);
    const hp = TESTS - hits.filter((h) => T >= h).length;
    const knocked = hp === 0 && T >= hits[hits.length - 1];
    const done = knocked ? 23 : 22;
    const rows = [];
    const add = (html, cls) => rows.push(`<div class="r ${cls || ""}">${html || "&nbsp;"}</div>`);
    headerRows(done).forEach((r) => add(r.html, r.cls));
    questRows(done, BOSS3).forEach((r) => add(r.html, r.cls));
    // taunt = nothing compiles (8/8); hurt = some tests fail; defeat = every test passes
    const mood = hp === TESTS ? BOSS.taunt : knocked ? BOSS.defeat : BOSS.hurt;
    rows.push(bossPanel(hp, mood, knocked, ko ? "x" : "o", ko));
    return rows.join("");
  }

  // The dragon's pose, from T alone: "defeated" from the K.O., "ouch" for 150 ms after each hit.
  function dragonPose(T, hits) {
    const ko = cue("ko", 46.5);
    if (T >= ko) return "defeated";
    if (hits.some((h) => T >= h && T < h + 0.15)) return "ouch";
    return "";
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
      const hits = cue("bossHits", [44.5, 44.75, 45.0, 45.25, 45.5, 45.75, 46.0, 46.25]);
      // the floaters alternate sides, so two live ones never sit on top of each other
      const floaters = hits.map((h, i) => `<div class="s6-float" data-float="${i}" style="left:${90 + (i % 2 ? 44 : -44)}px">−1 HP</div>`).join("");
      layer.innerHTML = `
        <div class="s6-bg"></div>
        <div class="s6-cam" data-k="cam">
          <div class="s6-term" data-k="term">
            <div class="s6-bar"><i style="left:22px"></i><i style="left:50px"></i><i style="left:78px"></i><span>~/learn-rust</span></div>
            <div class="s6-body" data-k="body"><div class="s6-rows" data-k="rows"></div></div>
          </div>
        </div>
        <div class="s6-dragon" data-k="dragon" style="opacity:0">
          <div class="s6-shadow" data-k="shadow"></div>
          <div class="s6-dart" data-k="dart"></div>
          <div class="s6-hit" data-k="hit" style="opacity:0"></div>
          <div class="s6-ko" data-k="ko" style="opacity:0">K.O.</div>
          ${floaters}
        </div>
        <div class="s6-cap" data-k="qcap"><div class="s6-cap-main">88 QUESTS.</div><div class="s6-cap-sub">checked by the real compiler</div></div>
        <div class="s6-cap" data-k="bcap"><div class="s6-cap-main">5 BOSSES.</div></div>`;
    },
    render(t, layer, T) {
      const q = (k) => layer.querySelector(`[data-k="${k}"]`);
      const term = q("term");
      const body = q("body");
      const rows = q("rows");
      const hits = cue("bossHits", [44.5, 44.75, 45.0, 45.25, 45.5, 45.75, 46.0, 46.25]);
      const koAt = cue("ko", 46.5);

      // The window re-frames with its content (winRect), then tilts in at 40.0 (rotateX 8 -> 0).
      // The push is 1.00 -> 1.03 over 40.0 - 44.0 (inOutSine), reset by the clear at 44.0.
      // At 47.5 - 48.0 the window shrinks into one point at the centre (inExpo).
      const w = winRect(T);
      term.style.left = `${round(w.x)}px`;
      term.style.top = `${round(w.y)}px`;
      term.style.width = `${round(w.w)}px`;
      term.style.height = `${round(w.h)}px`;
      const push = T < 44.0 ? 1 + 0.03 * P(T, 40.0, 44.0, E.inOutSine) : 1;
      // The whip-in: S5 ends with a whip-pan, so the window slides in from the right as its
      // continuation (40.0 - 40.35, outExpo), blurred while it moves and sharp once it lands.
      // The 3D tilt-in starts after the slide (40.15 - 40.6).
      const whipU = P(T, 40.0, 40.35, E.outExpo);
      const whipX = 1500 * (1 - whipU);
      const blurPx = 24 * (1 - whipU);
      const tilt = 8 * (1 - P(T, 40.15, 40.6, E.outExpo));
      const forgeOut = P(T, cue("forgeOut", 47.5), 48.0, E.inExpo);
      const shk = V.shake(T, hits, 6, 0.3);
      const koShk = V.shake(T, [cue("ko", 46.5)], 8, 0.35);
      const cx = w.x + w.w / 2;
      const cy = w.y + w.h / 2;
      const sx = shk.x + koShk.x + (960 - cx) * forgeOut;
      const sy = shk.y + koShk.y + (540 - cy) * forgeOut;
      term.style.transform = `perspective(2400px) translate(${round(sx + whipX)}px, ${round(sy)}px) rotateX(${round(tilt)}deg) scale(${round(push * (1 - forgeOut))})`;
      term.style.filter = blurPx > 0.05 ? `blur(${round(blurPx)}px)` : "none";
      term.style.opacity = T >= 47.99 ? 0 : 1;

      // The screens: fail (40.0 - 42.0), pass (42.0 - 44.0), boss (44.0 - 48.0).
      let html;
      if (T < cue("forgePass", 42.0)) html = screenFail(T);
      else if (T < cue("boss", 44.0)) html = screenPass(T);
      else html = screenBoss(T);
      if (body.dataset.last !== html) {
        body.dataset.last = html;
        rows.innerHTML = html;
      }

      // The dragon: enters at 44.0 (outBack, 450 ms), is knocked back at each hit, drops at the K.O.
      const dragon = q("dragon");
      const enter = P(T, 44.0, 44.45, E.outBack);
      let knock = 0;
      for (const h of hits) {
        const d = T - h;
        if (d >= 0 && d < 0.16) knock = 16 * (1 - E.outQuad(d / 0.16));
      }
      const drop = 24 * P(T, koAt, koAt + 0.3, E.outQuad);
      V.set(dragon, { x: knock, y: drop, s: Math.max(0, enter), origin: "50% 50%", o: P(T, 44.0, 44.2) * (1 - P(T, 47.5, 47.75, E.inQuad)) });

      // The pose changes only when it changes: the HTML is rebuilt from T, never accumulated.
      const dart = q("dart");
      const pose = dragonPose(T, hits);
      if (dart.dataset.pose !== pose) {
        dart.dataset.pose = pose;
        dart.innerHTML = V.boss("dragon", pose ? { pose } : {});
      }
      // After the K.O. the dragon is 55 % saturated and 55 % bright.
      const kd = P(T, koAt, koAt + 0.35, E.outQuad);
      dart.style.filter = kd > 0 ? `saturate(${(1 - 0.45 * kd).toFixed(3)}) brightness(${(1 - 0.45 * kd).toFixed(3)})` : "none";

      // The hit flash (120 ms, red) and the shadow.
      q("hit").style.opacity = String(V.flash(T, hits, 0.12, 0.75));
      const shadow = q("shadow");
      V.set(shadow, { s: Math.max(0, enter), origin: "50% 50%", o: 1 - P(T, 47.5, 47.75, E.inQuad) });

      // "-1 HP" floaters: each rises 60 px over 500 ms and fades.
      hits.forEach((h, i) => {
        const el = layer.querySelector(`[data-float="${i}"]`);
        const d = T - h;
        const p = clamp(d / 0.5, 0, 1);
        const live = d >= 0 && d < 0.5;
        el.style.opacity = live ? String((1 - E.inQuad(p)).toFixed(3)) : "0";
        el.style.transform = live ? `translateY(${(-60 * E.outQuad(p)).toFixed(2)}px)` : "none";
      });

      // The K.O. stamp: scale 1.6 -> 1 (outBack), 12 degree tilt, 8 px shake.
      const ko = q("ko");
      const koIn = P(T, koAt, koAt + 0.35, E.outBack);
      const koOp = P(T, koAt, koAt + 0.08) * (1 - P(T, 47.5, 47.75, E.inQuad));
      V.set(ko, { x: koShk.x, y: koShk.y, r: -12, s: V.lerp(1.6, 1, koIn), origin: "50% 50%", o: koOp });

      // The captions: 88 QUESTS. (42.0 - 44.0), 5 BOSSES. (46.5 - 47.5).
      const qc = q("qcap");
      const qIn = P(T, 42.3, 42.75, E.outExpo);
      const qOut = P(T, 43.7, 44.0, E.inQuad);
      V.set(qc, { x: 0, y: 36 * (1 - qIn), o: Math.max(0, qIn - qOut) });
      const bc = q("bcap");
      const bIn = P(T, koAt, koAt + 0.45, E.outExpo);
      const bOut = P(T, 47.5, 47.75, E.inQuad);
      V.set(bc, { x: 0, y: 36 * (1 - bIn), o: Math.max(0, bIn - bOut) });
    },
  });

  function round(v) {
    return Math.round(v * 100) / 100;
  }
})();
