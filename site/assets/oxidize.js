/* ==========================================================================
   OXIDIZE — page engine.
   Turns plain semantic HTML into the interactive course: highlighting,
   runnable code, quizzes, fill-ins, matching, flashcards, progress, XP.
   No dependencies. Every page works without JavaScript too (it just loses
   the interactivity).
   ========================================================================== */
(function () {
  "use strict";

  const COURSE = window.OX_COURSE || { acts: [], chapters: [], labs: [], levels: [{ xp: 0, name: "Hatchling" }] };
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const h = (tag, attrs = {}, html = "") => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v === null || v === undefined || v === false) continue;
      if (k === "class") el.className = v;
      else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? "" : v);
    }
    if (html) el.innerHTML = html;
    return el;
  };

  /* ---------------------------------------------------------------- paths */
  const scriptEl = document.currentScript || $$("script").find((s) => /oxidize\.js/.test(s.src));
  const ROOT = scriptEl ? scriptEl.src.replace(/assets\/oxidize\.js.*$/, "") : "./";
  const rel = (p) => ROOT + p;

  /* ---------------------------------------------------------------- store */
  const KEY = "oxidize:v1";
  const blank = () => ({ xp: 0, quiz: {}, chapters: {}, quests: {}, cards: {}, sections: {}, badges: {}, game: {}, log: [] });
  let state = blank();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = Object.assign(blank(), JSON.parse(raw));
  } catch (e) { /* storage unavailable: run stateless */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} };

  const Ox = (window.Ox = window.Ox || {});
  Ox.state = () => state;
  Ox.save = save;
  Ox.esc = esc;
  Ox.h = h;
  Ox.rel = rel;
  Ox.reset = () => { state = blank(); save(); location.reload(); };

  /* ---------------------------------------------------------------- levels & xp */
  function levelFor(xp) {
    const lv = COURSE.levels;
    let i = 0;
    while (i + 1 < lv.length && xp >= lv[i + 1].xp) i++;
    const cur = lv[i], next = lv[i + 1];
    const pct = next ? (xp - cur.xp) / (next.xp - cur.xp) : 1;
    return { index: i, name: cur.name, next, pct: Math.max(0, Math.min(1, pct)) };
  }
  Ox.levelFor = levelFor;

  function award(amount, reason, key) {
    if (key) {
      if (state.log.includes(key)) return false;
      state.log.push(key);
    }
    const before = levelFor(state.xp).index;
    state.xp += amount;
    save();
    toast(`<b>+${amount} XP</b> ${esc(reason)}`);
    const after = levelFor(state.xp);
    if (after.index > before) setTimeout(() => toast(`Level up: <b>${esc(after.name)}</b>`), 700);
    renderXp();
    return true;
  }
  Ox.award = award;

  /* ---------------------------------------------------------------- toasts */
  let toastBox;
  function toast(html) {
    if (!toastBox) { toastBox = h("div", { class: "ox-toasts", "aria-live": "polite" }); document.body.appendChild(toastBox); }
    const t = h("div", { class: "ox-toast" }, html);
    toastBox.appendChild(t);
    setTimeout(() => t.remove(), 3300);
  }
  Ox.toast = toast;

  /* ---------------------------------------------------------------- theme */
  function applyTheme() {
    const t = state.theme;
    if (t === "light" || t === "dark") document.documentElement.setAttribute("data-theme", t);
    else document.documentElement.removeAttribute("data-theme");
  }
  applyTheme();
  function cycleTheme() {
    const order = [undefined, "dark", "light"];
    state.theme = order[(order.indexOf(state.theme) + 1) % order.length];
    save();
    applyTheme();
    toast(`Theme: <b>${state.theme || "system"}</b>`);
  }

  /* ---------------------------------------------------------------- icons */
  const ICON = {
    crab: `<svg viewBox="0 0 64 64" aria-hidden="true"><g fill="var(--oxide)"><ellipse cx="32" cy="38" rx="18" ry="12"/><path d="M14 30c-6-2-9-8-7-13 3 1 5 4 5 7 1-4 4-6 7-6-1 5-2 9-5 12zM50 30c6-2 9-8 7-13-3 1-5 4-5 7-1-4-4-6-7-6 1 5 2 9 5 12z"/><path d="M16 44l-7 6M18 48l-5 8M48 44l7 6M46 48l5 8" stroke="var(--oxide)" stroke-width="3" stroke-linecap="round"/></g><circle cx="26" cy="31" r="3.2" fill="var(--surface)"/><circle cx="38" cy="31" r="3.2" fill="var(--surface)"/><circle cx="26.6" cy="31.4" r="1.6" fill="var(--ink)"/><circle cx="38.6" cy="31.4" r="1.6" fill="var(--ink)"/><path d="M27 41q5 4 10 0" stroke="var(--surface)" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`,
    theme: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 0 0 16z" fill="currentColor"/></svg>`,
    map: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14"/></svg>`,
    lab: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3"/><path d="M7 15h10"/></svg>`,
    anvil: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 6h13c0 2 2 3 5 3v2c-3 0-5 1-6 3l1 3h2v3H6v-3h2l1-3c-3-1-6-3-6-8z"/></svg>`,
    insight: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z"/></svg>`,
    php: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><ellipse cx="12" cy="12" rx="10" ry="6"/><path d="M7 14l1-4h2a1 1 0 0 1 0 2H8M12 9l-1 5M11.5 11.5h2.5l-.6 2.5M16 14l1-4h2a1 1 0 0 1 0 2h-2"/></svg>`,
    trap: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M12 3 2 20h20L12 3zM12 10v4M12 17v.5"/></svg>`,
    compiler: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M4 5h16v14H4zM7 10l3 2-3 2M12 15h5"/></svg>`,
    ai: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="5" y="7" width="14" height="12" rx="3"/><path d="M12 3v4M9 12v1M15 12v1M9 16h6M2 12h3M19 12h3"/></svg>`,
    deep: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><circle cx="11" cy="11" r="6"/><path d="m20 20-4.5-4.5M11 8v6M8 11h6"/></svg>`,
    win: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="m5 12 4 4 10-10"/></svg>`
  };
  Ox.icon = ICON;
  const KIND_LABEL = { insight: "Mental model", php: "Your PHP brain says", trap: "Trap", compiler: "The compiler says", ai: "Agent-era note", deep: "Under the hood", win: "Why this is good" };

  /* ================================================================ highlighter */
  const RUST_KW = new Set("as async await break const continue crate dyn else enum extern false fn for if impl in let loop match mod move mut pub ref return static struct super trait true type unsafe use where while yield".split(" "));
  const RUST_TY = new Set("i8 i16 i32 i64 i128 isize u8 u16 u32 u64 u128 usize f32 f64 bool char str String Vec Option Some None Result Ok Err Box Rc Arc RefCell Cell Mutex RwLock HashMap HashSet BTreeMap BTreeSet VecDeque Self Fn FnMut FnOnce Iterator IntoIterator Display Debug Clone Copy Default PartialEq Eq PartialOrd Ord Hash From Into Send Sync Sized Drop Future Pin Path PathBuf Weak Cow".split(" "));
  const PHP_KW = new Set("abstract and array as break callable case catch class clone const continue declare default do echo else elseif empty enddeclare endfor endforeach endif endswitch endwhile enum extends final finally fn for foreach function global goto if implements include include_once instanceof insteadof interface isset list match namespace new or print private protected public readonly require require_once return static switch throw trait try unset use var while xor yield null true false self parent int string float bool void mixed never iterable object".split(" "));
  const SH_KW = new Set("cargo rustup rustc cd ls mkdir echo git curl export composer php artisan npm sudo brew winget source cat".split(" "));

  function tokenizeRust(src) {
    const out = [];
    const re = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|(b?r#*"(?:[^"\\]|\\[\s\S])*?"#*|b?"(?:[^"\\]|\\[\s\S])*")|('(?:[^'\\\n]|\\[^\n]{1,10})')|('[a-zA-Z_][a-zA-Z0-9_]*)|(#!?\[[^\]\n]*\])|(\b\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][+-]?\d+)?(?:_?[iuf](?:8|16|32|64|128|size))?\b|\b0[xob][0-9a-fA-F_]+\b)|([A-Za-z_][A-Za-z0-9_]*!)|([A-Za-z_][A-Za-z0-9_]*)|(\s+)|([\s\S])/g;
    let m;
    while ((m = re.exec(src))) {
      const [t, cm, st, ch, lt, at, nu, ma, id] = m;
      if (cm) out.push(["cm", t]);
      else if (st) out.push(["st", t]);
      else if (ch) out.push(["st", t]);
      else if (lt) out.push(["lt", t]);
      else if (at) out.push(["at", t]);
      else if (nu) out.push(["nu", t]);
      else if (ma) out.push(["ma", t]);
      else if (id) {
        if (id === "self") out.push(["self", t]);
        else if (RUST_KW.has(id)) out.push(["kw", t]);
        else if (RUST_TY.has(id) || /^[A-Z][A-Za-z0-9]*$/.test(id)) out.push(["ty", t]);
        else {
          const rest = src.slice(re.lastIndex);
          if (/^\s*(::\s*<[^>]*>\s*)?\(/.test(rest)) out.push(["fn", t]);
          else out.push(["", t]);
        }
      } else out.push(["", t]);
    }
    return out;
  }
  function tokenizePhp(src) {
    const out = [];
    const re = /(\/\/[^\n]*|#(?!\[)[^\n]*|\/\*[\s\S]*?\*\/)|('(?:[^'\\]|\\[\s\S])*'|"(?:[^"\\]|\\[\s\S])*")|(\$[A-Za-z_][A-Za-z0-9_]*)|(<\?php|\?>)|(\b\d[\d_]*(?:\.\d+)?\b)|(#\[[^\]\n]*\])|([A-Za-z_\\][A-Za-z0-9_\\]*)|(\s+)|([\s\S])/g;
    let m;
    while ((m = re.exec(src))) {
      const [t, cm, st, va, tag, nu, at, id] = m;
      if (cm) out.push(["cm", t]);
      else if (st) out.push(["st", t]);
      else if (va) out.push(["va", t]);
      else if (tag) out.push(["at", t]);
      else if (nu) out.push(["nu", t]);
      else if (at) out.push(["at", t]);
      else if (id) {
        if (PHP_KW.has(id.toLowerCase())) out.push(["kw", t]);
        else if (/^[A-Z\\]/.test(id)) out.push(["ty", t]);
        else if (/^\s*\(/.test(src.slice(re.lastIndex))) out.push(["fn", t]);
        else out.push(["", t]);
      } else out.push(["", t]);
    }
    return out;
  }
  function tokenizeSh(src) {
    const out = [];
    const re = /(#[^\n]*)|("(?:[^"\\]|\\.)*"|'[^']*')|(^\s*\$ |\n\s*\$ )|(--?[A-Za-z][\w-]*)|([A-Za-z_][\w.-]*)|(\s+)|([\s\S])/g;
    let m;
    while ((m = re.exec(src))) {
      const [t, cm, st, prompt, flag, id] = m;
      if (cm) out.push(["cm", t]);
      else if (st) out.push(["st", t]);
      else if (prompt) out.push(["at", t]);
      else if (flag) out.push(["ty", t]);
      else if (id) out.push([SH_KW.has(id) ? "kw" : "", t]);
      else out.push(["", t]);
    }
    return out;
  }
  function tokenizeToml(src) {
    const out = [];
    const re = /(#[^\n]*)|(\[\[?[^\]\n]+\]\]?)|("(?:[^"\\]|\\.)*")|(\b\d[\d.]*\b|\btrue\b|\bfalse\b)|(^[A-Za-z0-9_.-]+(?=\s*=)|\n[A-Za-z0-9_.-]+(?=\s*=))|(\s+)|([\s\S])/g;
    let m;
    while ((m = re.exec(src))) {
      const [t, cm, sec, st, nu, key] = m;
      if (cm) out.push(["cm", t]);
      else if (sec) out.push(["kw", t]);
      else if (st) out.push(["st", t]);
      else if (nu) out.push(["nu", t]);
      else if (key) out.push(["ty", t]);
      else out.push(["", t]);
    }
    return out;
  }
  function renderTokens(tokens) {
    return tokens.map(([k, t]) => (k ? `<span class="t-${k}">${esc(t)}</span>` : esc(t))).join("");
  }
  function highlightRustc(src) {
    return src.split("\n").map((line) => {
      let s = esc(line);
      s = s.replace(/^(error(\[E\d+\])?)(:)/, '<span class="r-err">$1</span>$3')
        .replace(/^(warning(\[[\w-]+\])?)(:)/, '<span class="r-warn">$1</span>$3')
        .replace(/^(\s*=?\s*)(note)(:)/, '$1<span class="r-note">$2</span>$3')
        .replace(/^(\s*=?\s*)(help)(:)/, '$1<span class="r-help">$2</span>$3')
        .replace(/^(\s*)(--&gt;)/, '$1<span class="r-gut">$2</span>')
        .replace(/^(\s*\d*\s*\|)/, '<span class="r-gut">$1</span>')
        .replace(/(\^+[^\n]*)$/, '<span class="r-car">$1</span>')
        .replace(/(-{2,}[^\n]*)$/, (m0) => (/--&gt;/.test(m0) ? m0 : `<span class="r-car2">${m0}</span>`))
        .replace(/^(\s*)(Compiling|Finished|Running)\b/, '$1<span class="r-ok">$2</span>')
        .replace(/^(For more information.*)$/, '<span class="r-gut">$1</span>');
      return s;
    }).join("\n");
  }
  function highlight(src, lang) {
    if (lang === "rust" || lang === "rs") return renderTokens(tokenizeRust(src));
    if (lang === "php") return renderTokens(tokenizePhp(src));
    if (lang === "sh" || lang === "shell" || lang === "bash") return renderTokens(tokenizeSh(src));
    if (lang === "toml") return renderTokens(tokenizeToml(src));
    if (lang === "rustc") return highlightRustc(src);
    return esc(src);
  }
  Ox.highlight = highlight;

  /* Wrap highlighted HTML into per-line spans without breaking tags. */
  function splitLines(html) {
    const lines = [];
    let open = [];
    let cur = "";
    const re = /(<span[^>]*>)|(<\/span>)|(\n)|([^<\n]+)/g;
    let m;
    while ((m = re.exec(html))) {
      if (m[1]) { open.push(m[1]); cur += m[1]; }
      else if (m[2]) { open.pop(); cur += m[2]; }
      else if (m[3]) { cur += "</span>".repeat(open.length); lines.push(cur); cur = open.join(""); }
      else cur += m[4];
    }
    lines.push(cur);
    return lines;
  }
  Ox.splitLines = splitLines;

  function parseRanges(spec) {
    const set = new Set();
    if (!spec) return set;
    spec.split(",").forEach((p) => {
      const [a, b] = p.split("-").map((x) => parseInt(x, 10));
      if (!isNaN(a)) for (let i = a; i <= (isNaN(b) ? a : b); i++) set.add(i);
    });
    return set;
  }

  /* ================================================================ code plates */
  const LANG_OF = (pre) => {
    const c = pre.classList;
    if (c.contains("rs") || c.contains("rust")) return "rust";
    if (c.contains("php")) return "php";
    if (c.contains("sh") || c.contains("shell")) return "sh";
    if (c.contains("toml")) return "toml";
    if (c.contains("rustc")) return "rustc";
    return "text";
  };
  const LANG_NAME = { rust: "Rust", php: "PHP", sh: "Terminal", toml: "TOML", rustc: "rustc output", text: "Text" };

  function dedent(s) {
    s = s.replace(/^\n+/, "").replace(/\s+$/, "");
    const lines = s.split("\n");
    const ind = Math.min(...lines.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length));
    return lines.map((l) => l.slice(ind)).join("\n");
  }

  function playgroundUrl(code) {
    return "https://play.rust-lang.org/?version=stable&mode=debug&edition=2024&code=" + encodeURIComponent(code);
  }
  Ox.playgroundUrl = playgroundUrl;

  function runnable(code) {
    return /\bfn\s+main\s*\(/.test(code) ? code : `fn main() {\n${code.split("\n").map((l) => "    " + l).join("\n")}\n}`;
  }

  async function runOnPlayground(code) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 20000);
    try {
      const res = await fetch("https://play.rust-lang.org/evaluate.json", {
        method: "POST",
        mode: "cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version: "stable", optimize: "0", code, edition: "2024" }),
        signal: ctl.signal
      });
      const data = await res.json();
      return { ok: !data.error, text: data.result || data.error || "" };
    } finally {
      clearTimeout(timer);
    }
  }

  function enhancePre(pre) {
    if (pre.dataset.oxDone) return;
    pre.dataset.oxDone = "1";
    const lang = LANG_OF(pre);
    let src = dedent(pre.textContent);
    const hl = parseRanges(pre.dataset.hl);
    const err = parseRanges(pre.dataset.err);
    const dim = parseRanges(pre.dataset.dim);
    const editable = pre.hasAttribute("data-edit");
    const fig = h("figure", { class: "ox-code", "data-lang": lang });
    const bar = h("div", { class: "ox-code-bar" });
    bar.appendChild(h("span", { class: "ox-code-lang" }, LANG_NAME[lang] || lang));
    if (pre.dataset.title) bar.appendChild(h("span", { class: "ox-code-title" }, esc(pre.dataset.title)));
    const tools = h("div", { class: "ox-code-tools" });
    bar.appendChild(tools);
    if (pre.dataset.badge === "error") tools.appendChild(h("span", { class: "ox-code-badge is-bad" }, "won't compile"));
    if (pre.dataset.badge === "ok") tools.appendChild(h("span", { class: "ox-code-badge is-ok" }, "compiles"));
    fig.appendChild(bar);

    const codeHost = h("div", { class: editable ? "ox-code-edit" : "ox-code-scroll" });
    const newPre = h("pre");
    const codeEl = h("code");
    newPre.appendChild(codeEl);
    codeHost.appendChild(newPre);
    fig.appendChild(codeHost);

    const paint = (text) => {
      const lines = splitLines(highlight(text, lang));
      codeEl.innerHTML = lines.map((l, i) => {
        const n = i + 1;
        const cls = ["ln", hl.has(n) && "is-hl", err.has(n) && "is-err", dim.has(n) && "is-dim"].filter(Boolean).join(" ");
        return `<span class="${cls}">${l || " "}</span>`;
      }).join("");
    };
    paint(src);

    let ta;
    if (editable) {
      ta = h("textarea", { spellcheck: "false", "aria-label": "Editable Rust code", autocapitalize: "off", autocomplete: "off" });
      ta.value = src;
      codeHost.appendChild(ta);
      const fit = () => { codeHost.style.minHeight = ""; ta.style.height = "auto"; codeHost.style.minHeight = newPre.scrollHeight + "px"; };
      ta.addEventListener("input", () => { src = ta.value; paint(src); fit(); });
      ta.addEventListener("keydown", (e) => {
        if (e.key === "Tab") {
          e.preventDefault();
          const s = ta.selectionStart, en = ta.selectionEnd;
          ta.value = ta.value.slice(0, s) + "    " + ta.value.slice(en);
          ta.selectionStart = ta.selectionEnd = s + 4;
          ta.dispatchEvent(new Event("input"));
        }
      });
      ta.addEventListener("scroll", () => { newPre.scrollLeft = ta.scrollLeft; });
      requestAnimationFrame(fit);
      codeHost.style.overflowX = "auto";
    }

    const getCode = () => (ta ? ta.value : src);
    const copyBtn = h("button", { type: "button", title: "Copy code" }, "copy");
    copyBtn.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(getCode()); copyBtn.textContent = "copied"; }
      catch (e) { copyBtn.textContent = "select + ⌘C"; }
      setTimeout(() => (copyBtn.textContent = "copy"), 1500);
    });

    if (lang === "rust" && pre.dataset.run !== undefined) {
      const run = h("button", { type: "button", class: "is-run", title: "Compile and run on the Rust Playground" }, "▶ run");
      const play = h("a", { href: "#", target: "_blank", rel: "noopener", title: "Open in the official Rust Playground" }, "playground ↗");
      play.addEventListener("click", () => { play.href = playgroundUrl(runnable(getCode())); });
      play.addEventListener("mouseenter", () => { play.href = playgroundUrl(runnable(getCode())); });
      let out;
      run.addEventListener("click", async () => {
        if (!out) { out = h("div", { class: "ox-code-out", "aria-live": "polite" }); fig.appendChild(out); }
        out.className = "ox-code-out";
        out.innerHTML = `<span class="ox-label">compiling on play.rust-lang.org…</span>`;
        run.disabled = true;
        try {
          const r = await runOnPlayground(runnable(getCode()));
          const text = r.text.trim() || "(no output)";
          out.className = "ox-code-out" + (r.ok && !/error(\[E\d+\])?:/.test(text) ? "" : " is-error");
          out.innerHTML = `<span class="ox-label">${r.ok && !/error(\[E\d+\])?:/.test(text) ? "output" : "compiler says"}</span>` + highlightRustc(text);
          award(2, "ran code", "run:" + location.pathname);
        } catch (e) {
          out.className = "ox-code-out is-error";
          out.innerHTML = `<span class="ox-label">couldn't reach the playground</span>The Rust Playground didn't answer from this page. Use <a href="${esc(playgroundUrl(runnable(getCode())))}" target="_blank" rel="noopener">playground ↗</a>, or paste the code into <code>src/main.rs</code> and run <code>cargo run</code>.`;
        } finally {
          run.disabled = false;
        }
      });
      tools.appendChild(run);
      tools.appendChild(play);
    }
    tools.appendChild(copyBtn);
    pre.replaceWith(fig);
    return fig;
  }
  Ox.enhancePre = enhancePre;

  /* ================================================================ callouts */
  function enhanceCallout(el) {
    const kind = el.dataset.kind || "insight";
    const label = el.dataset.label || KIND_LABEL[kind] || kind;
    const head = h("div", { class: "ox-callout-head" }, (ICON[kind] || ICON.insight) + `<span>${esc(label)}</span>`);
    if (el.tagName === "DETAILS") {
      let sum = $("summary", el);
      if (!sum) { sum = h("summary"); el.prepend(sum); }
      const extra = sum.textContent.trim();
      sum.innerHTML = "";
      sum.appendChild(head);
      if (extra) head.querySelector("span").textContent = label + " · " + extra;
    } else el.prepend(head);
  }

  /* ================================================================ bridge */
  function enhanceBridge(el) {
    const codes = $$(":scope > .ox-code", el);
    if (codes[0]) $(".ox-code-lang", codes[0]).textContent = codes[0].dataset.lang === "php" ? "You know · PHP" : $(".ox-code-lang", codes[0]).textContent;
    if (codes[1]) $(".ox-code-lang", codes[1]).textContent = codes[1].dataset.lang === "rust" ? "Now · Rust" : $(".ox-code-lang", codes[1]).textContent;
  }

  /* ================================================================ quizzes */
  const KEYS = "ABCDEFGH";
  function quizId(el, kind) {
    if (el.dataset.id) return el.dataset.id;
    const all = $$(".ox-quiz, .ox-fill, .ox-match, .ox-order");
    return (document.body.dataset.chapter || location.pathname.split("/").pop()) + ":" + kind + ":" + all.indexOf(el);
  }

  function enhanceQuiz(el) {
    const id = quizId(el, "q");
    const xp = parseInt(el.dataset.xp || "10", 10);
    const head = h("div", { class: "ox-quiz-head" }, `<span>${esc(el.dataset.label || "Check yourself")}</span><span class="ox-quiz-xp">+${xp} XP</span>`);
    el.prepend(head);
    const list = $(".ox-choices", el);
    if (!list) return;
    const items = $$(":scope > li", list);
    const correct = items.map((li, i) => (li.hasAttribute("data-correct") ? i : -1)).filter((i) => i >= 0);
    const buttons = items.map((li, i) => {
      const b = h("button", { type: "button", class: "ox-choice" }, `<span class="ox-key">${KEYS[i]}</span><span>${li.innerHTML}</span>`);
      li.innerHTML = "";
      li.appendChild(b);
      b.addEventListener("click", () => answer(i, true));
      return b;
    });
    const why = $(".ox-why", el);
    if (why && !$(".ox-verdict", why)) why.prepend(h("div", { class: "ox-verdict" }));
    function answer(i, fresh) {
      if (el.classList.contains("is-answered")) return;
      el.classList.add("is-answered");
      const right = correct.includes(i);
      buttons.forEach((b, j) => {
        b.disabled = true;
        if (correct.includes(j)) b.classList.add("is-correct");
        else if (j === i) b.classList.add("is-wrong");
        else b.classList.add("is-faded");
        const fb = items[j].dataset.feedback;
        if (j === i && fb && why) why.insertAdjacentHTML("afterbegin", `<p><em>${fb}</em></p>`);
      });
      const v = why && $(".ox-verdict", why);
      if (v) {
        v.className = "ox-verdict " + (right ? "is-ok" : "is-bad");
        v.textContent = right ? "Correct." : "Not quite. The highlighted answer is right.";
      }
      if (fresh) {
        state.quiz[id] = { pick: i, right };
        save();
        if (right) { award(xp, "quiz", "quiz:" + id); $(".ox-quiz-xp", head).classList.add("is-earned"); }
        else { award(2, "for trying", "quiz:" + id); }
      }
      if (right) $(".ox-quiz-xp", head).classList.add("is-earned");
      const retry = h("button", { type: "button", class: "ox-btn is-small", style: "margin-top:10px" }, "Try again");
      retry.addEventListener("click", () => {
        el.classList.remove("is-answered");
        buttons.forEach((b) => { b.disabled = false; b.classList.remove("is-correct", "is-wrong", "is-faded"); });
        $$("p > em", why || el).forEach((e) => e.parentElement.remove());
        retry.remove();
      });
      (why || el).appendChild(retry);
    }
    const prev = state.quiz[id];
    if (prev && typeof prev.pick === "number") answer(prev.pick, false);
  }

  function norm(s) { return s.replace(/\s+/g, "").replace(/;$/, ""); }
  function enhanceFill(el) {
    const id = quizId(el, "f");
    const xp = parseInt(el.dataset.xp || "15", 10);
    el.prepend(h("div", { class: "ox-quiz-head" }, `<span>${esc(el.dataset.label || "Fill in the blanks")}</span><span class="ox-quiz-xp">+${xp} XP</span>`));
    // Blanks are written as [[answer|alt answer]] inside the <pre>.
    const pre = $("pre", el);
    if (!pre) return;
    const raw = dedent(pre.textContent);
    const answers = [];
    const marked = raw.replace(/\[\[([^\]]+)\]\]/g, (_, a) => { answers.push(a.split("|")); return `\u0000${answers.length - 1}\u0000`; });
    const fig = enhancePre(Object.assign(pre, { textContent: marked }));
    const codeEl = $("code", fig);
    codeEl.innerHTML = codeEl.innerHTML.replace(/\u0000(\d+)\u0000/g, (_, n) => {
      const w = Math.max(3, ...answers[n].map((a) => a.length)) + 1;
      return `<input class="ox-blank" data-n="${n}" style="width:${w}ch" spellcheck="false" autocomplete="off" autocapitalize="off" aria-label="blank ${+n + 1}">`;
    });
    const inputs = $$("input.ox-blank", fig);
    const actions = h("div", { class: "ox-fill-actions" });
    const check = h("button", { type: "button", class: "ox-btn is-primary is-small" }, "Check");
    const show = h("button", { type: "button", class: "ox-btn is-small" }, "Show answer");
    const msg = h("span", { class: "ox-fill-msg" });
    actions.append(check, show, msg);
    fig.after(actions);
    const why = $(".ox-why", el);
    const grade = (fresh) => {
      let all = true;
      inputs.forEach((inp) => {
        const ok = answers[inp.dataset.n].some((a) => norm(a) === norm(inp.value));
        inp.classList.toggle("is-correct", ok);
        inp.classList.toggle("is-wrong", !ok);
        if (!ok) all = false;
      });
      if (all) {
        msg.textContent = "All correct.";
        el.classList.add("is-answered");
        if (fresh) { state.quiz[id] = { done: true }; save(); award(xp, "fill-in", "fill:" + id); }
      } else msg.textContent = "Some blanks aren't right yet. Red ones need another look.";
    };
    check.addEventListener("click", () => grade(true));
    inputs.forEach((i) => i.addEventListener("keydown", (e) => { if (e.key === "Enter") grade(true); }));
    show.addEventListener("click", () => {
      inputs.forEach((inp) => { inp.value = answers[inp.dataset.n][0]; inp.classList.remove("is-wrong"); });
      msg.textContent = "Answers filled in. Read them once, then move on.";
      el.classList.add("is-answered");
    });
    if (state.quiz[id] && state.quiz[id].done) {
      inputs.forEach((inp) => { inp.value = answers[inp.dataset.n][0]; inp.classList.add("is-correct"); });
      el.classList.add("is-answered");
      msg.textContent = "Solved earlier.";
    }
    if (why && !$(".ox-verdict", why)) why.prepend(h("div", { class: "ox-verdict is-ok" }, "Why it works"));
  }

  function shuffle(a, seed) {
    const r = a.slice();
    let s = seed || 7;
    for (let i = r.length - 1; i > 0; i--) {
      s = (s * 9301 + 49297) % 233280;
      const j = Math.floor((s / 233280) * (i + 1));
      [r[i], r[j]] = [r[j], r[i]];
    }
    return r;
  }

  function enhanceMatch(el) {
    const id = quizId(el, "m");
    const xp = parseInt(el.dataset.xp || "15", 10);
    // Pairs are <li data-left="...">right side</li> inside a <ul>.
    const pairs = $$("li", el).map((li) => ({ l: li.dataset.left, r: li.innerHTML }));
    const list = $("ul", el);
    if (list) list.remove();
    el.prepend(h("div", { class: "ox-quiz-head" }, `<span>${esc(el.dataset.label || "Match them up")}</span><span class="ox-quiz-xp">+${xp} XP</span>`));
    const grid = h("div", { class: "ox-match-grid" });
    const L = h("div", { class: "ox-match-col" }, `<span class="ox-label">${esc(el.dataset.leftLabel || "PHP")}</span>`);
    const R = h("div", { class: "ox-match-col" }, `<span class="ox-label">${esc(el.dataset.rightLabel || "Rust")}</span>`);
    grid.append(L, R);
    el.appendChild(grid);
    const msg = h("p", { class: "ox-fill-msg", style: "margin:10px 0 0" }, "Pick one tile on each side.");
    el.appendChild(msg);
    let pickL = null, pickR = null, done = 0;
    const lt = pairs.map((p, i) => { const b = h("button", { type: "button", class: "ox-tile", "data-i": i }, p.l); L.appendChild(b); return b; });
    const order = shuffle(pairs.map((_, i) => i), pairs.length * 31 + 3);
    const rt = order.map((i) => { const b = h("button", { type: "button", class: "ox-tile", "data-i": i }, pairs[i].r); R.appendChild(b); return b; });
    const finish = (fresh) => {
      msg.textContent = "All matched.";
      el.classList.add("is-answered");
      if (fresh) { state.quiz[id] = { done: true }; save(); award(xp, "matching", "match:" + id); }
    };
    const tryPair = () => {
      if (!pickL || !pickR) return;
      if (pickL.dataset.i === pickR.dataset.i) {
        [pickL, pickR].forEach((b) => { b.classList.remove("is-picked"); b.classList.add("is-done"); b.disabled = true; });
        done++;
        if (done === pairs.length) finish(true);
        else msg.textContent = `${done} of ${pairs.length} matched.`;
      } else {
        [pickL, pickR].forEach((b) => { b.classList.remove("is-picked"); b.classList.add("is-miss"); setTimeout(() => b.classList.remove("is-miss"), 400); });
        msg.textContent = "Those two don't belong together. Try another pair.";
      }
      pickL = pickR = null;
    };
    lt.forEach((b) => b.addEventListener("click", () => { lt.forEach((x) => x.classList.remove("is-picked")); pickL = b; b.classList.add("is-picked"); tryPair(); }));
    rt.forEach((b) => b.addEventListener("click", () => { rt.forEach((x) => x.classList.remove("is-picked")); pickR = b; b.classList.add("is-picked"); tryPair(); }));
    if (state.quiz[id] && state.quiz[id].done) {
      [...lt, ...rt].forEach((b) => { b.classList.add("is-done"); b.disabled = true; });
      done = pairs.length;
      finish(false);
      msg.textContent = "Matched earlier.";
    }
  }

  function enhanceOrder(el) {
    const id = quizId(el, "o");
    const xp = parseInt(el.dataset.xp || "15", 10);
    const src = $("ol", el);
    if (!src) return;
    const items = $$("li", src).map((li, i) => ({ i, html: li.innerHTML }));
    src.remove();
    el.prepend(h("div", { class: "ox-quiz-head" }, `<span>${esc(el.dataset.label || "Put these in order")}</span><span class="ox-quiz-xp">+${xp} XP</span>`));
    let cur = shuffle(items, items.length * 17 + 5);
    if (cur.every((x, k) => x.i === k)) cur.reverse();
    const ol = h("ol", { class: "ox-order-list" });
    const why = $(".ox-why", el);
    el.insertBefore(ol, why || null);
    const actions = h("div", { class: "ox-fill-actions" });
    const check = h("button", { type: "button", class: "ox-btn is-primary is-small" }, "Check order");
    const msg = h("span", { class: "ox-fill-msg" });
    actions.append(check, msg);
    el.insertBefore(actions, why || null);
    const draw = (mark) => {
      ol.innerHTML = "";
      cur.forEach((it, k) => {
        const li = h("li", {}, `<span>${it.html}</span>`);
        if (mark) li.classList.add(it.i === k ? "is-correct" : "is-wrong");
        const btns = h("span", { class: "ox-order-btns" });
        const up = h("button", { type: "button", "aria-label": "Move up" }, "↑");
        const dn = h("button", { type: "button", "aria-label": "Move down" }, "↓");
        up.disabled = k === 0;
        dn.disabled = k === cur.length - 1;
        up.addEventListener("click", () => { [cur[k - 1], cur[k]] = [cur[k], cur[k - 1]]; draw(); });
        dn.addEventListener("click", () => { [cur[k + 1], cur[k]] = [cur[k], cur[k + 1]]; draw(); });
        btns.append(up, dn);
        li.appendChild(btns);
        ol.appendChild(li);
      });
    };
    draw();
    check.addEventListener("click", () => {
      draw(true);
      const ok = cur.every((x, k) => x.i === k);
      if (ok) {
        msg.textContent = "Exactly right.";
        el.classList.add("is-answered");
        if (!(state.quiz[id] && state.quiz[id].done)) { state.quiz[id] = { done: true }; save(); award(xp, "ordering", "order:" + id); }
      } else msg.textContent = "Green rows are in the right place. Move the red ones.";
    });
    if (why && !$(".ox-verdict", why)) why.prepend(h("div", { class: "ox-verdict is-ok" }, "Why this order"));
    if (state.quiz[id] && state.quiz[id].done) { cur = items.slice(); draw(true); el.classList.add("is-answered"); msg.textContent = "Solved earlier."; }
  }

  /* ================================================================ tabs */
  function enhanceTabs(el) {
    const panels = $$(":scope > [data-tab]", el);
    const list = h("div", { class: "ox-tablist", role: "tablist" });
    const btns = panels.map((p, i) => {
      p.classList.add("ox-tabpanel");
      p.setAttribute("role", "tabpanel");
      const b = h("button", { type: "button", role: "tab", "aria-selected": i === 0 ? "true" : "false" }, esc(p.dataset.tab));
      b.addEventListener("click", () => select(i));
      list.appendChild(b);
      return b;
    });
    el.prepend(list);
    function select(i) {
      panels.forEach((p, j) => (p.hidden = i !== j));
      btns.forEach((b, j) => b.setAttribute("aria-selected", i === j ? "true" : "false"));
    }
    select(0);
  }

  /* ================================================================ flashcards */
  function cardFaceHtml(s) {
    // Cards use a tiny markup: `code`, **bold**, and ```blocks```.
    return esc(s)
      .replace(/```([\s\S]*?)```/g, (_, c) => `<pre>${c.replace(/^\n/, "")}</pre>`)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .split(/\n{2,}/).map((p) => (p.startsWith("<pre>") ? p : `<p>${p}</p>`)).join("");
  }
  Ox.cardFaceHtml = cardFaceHtml;
  function flashEl(card) {
    const b = h("button", { type: "button", class: "ox-flash", "aria-label": "Flashcard, press to flip" });
    b.innerHTML = `<div class="ox-flash-inner"><div class="ox-flash-face"><span class="ox-label">Question</span>${cardFaceHtml(card.q)}<span class="ox-flash-hint">tap to flip</span></div><div class="ox-flash-face ox-flash-back"><span class="ox-label">Answer</span>${cardFaceHtml(card.a)}</div></div>`;
    b.addEventListener("click", () => {
      b.classList.toggle("is-flipped");
      if (b.classList.contains("is-flipped")) award(1, "recall", "flip:" + card.id);
    });
    return b;
  }
  function enhanceDeck(el) {
    const ch = parseInt(el.dataset.chapter || document.body.dataset.chapter || "0", 10);
    const cards = (window.OX_CARDS || []).filter((c) => c.ch === ch);
    if (!cards.length) return;
    const grid = h("div", { class: "ox-deck-grid" });
    cards.forEach((c) => grid.appendChild(flashEl(c)));
    el.appendChild(grid);
    el.appendChild(h("p", { class: "ox-caption" }, `Answer each card out loud before you flip it. These cards come back in the <a href="${rel("labs/review.html")}">Recall Deck</a> on a spaced schedule.`));
  }

  /* ================================================================ forge quests */
  function enhanceQuests(el) {
    const ch = parseInt(el.dataset.chapter || document.body.dataset.chapter || "0", 10);
    const quests = (window.OX_QUESTS || []).filter((q) => q.chapter === ch);
    if (!quests.length) { el.innerHTML = `<p class="ox-forge-howto">Quests for this chapter are on the way.</p>`; return; }
    quests.forEach((q) => {
      const done = !!state.quests[q.name];
      const card = h("div", { class: "ox-quest" + (q.boss ? " is-boss" : "") + (done ? " is-done" : "") });
      card.innerHTML = `<div class="ox-quest-icon">${ICON.anvil}</div><div><h4>${q.boss ? "Boss · " : ""}${esc(q.title)}</h4><p>${esc(q.summary || "")} <code>quests/${esc(q.path)}</code></p></div>`;
      const lab = h("label", { class: "ox-quest-check" });
      const cb = h("input", { type: "checkbox" });
      cb.checked = done;
      cb.addEventListener("change", () => {
        state.quests[q.name] = cb.checked;
        save();
        card.classList.toggle("is-done", cb.checked);
        if (cb.checked) award(q.boss ? 60 : 20, "quest: " + q.title, "quest:" + q.name);
      });
      lab.append(cb, document.createTextNode("passed in forge"));
      card.appendChild(lab);
      el.appendChild(card);
    });
    el.insertAdjacentHTML("beforeend", `<p class="ox-forge-howto">In a terminal at the repo root run <code>cargo forge</code>. It watches your files, recompiles on every save, and moves you to the next quest when the tests pass. Stuck? <code>cargo forge hint</code>.</p>`);
  }

  /* ================================================================ chapter chrome */
  function chapterByNum(n) { return COURSE.chapters.find((c) => c.n === n); }
  Ox.chapterByNum = chapterByNum;
  function chapterUrl(c) { return rel("chapters/" + c.slug + ".html"); }
  Ox.chapterUrl = chapterUrl;

  let xpChip;
  function renderXp() {
    if (!xpChip) return;
    const lv = levelFor(state.xp);
    $("b", xpChip).textContent = state.xp + " XP";
    $(".ox-xp-name", xpChip).textContent = lv.name;
    $(".ox-xpbar i", xpChip).style.width = Math.round(lv.pct * 100) + "%";
    xpChip.title = lv.next ? `${lv.next.xp - state.xp} XP to ${lv.next.name}` : "Max level";
  }

  function buildTopbar() {
    let top = $(".ox-top");
    const ch = chapterByNum(parseInt(document.body.dataset.chapter || "0", 10));
    const act = ch && COURSE.acts.find((a) => a.id === ch.act);
    if (!top) {
      top = h("header", { class: "ox-top" });
      document.body.prepend(top);
    }
    const crumb = ch ? `Act ${["", "I", "II", "III", "IV", "V"][act.id]} · ${esc(act.name)} — Chapter ${String(ch.n).padStart(2, "0")}` : esc(document.body.dataset.crumb || "");
    top.innerHTML = `
      <a class="ox-brand" href="${rel("index.html")}" aria-label="Oxidize home">${ICON.crab}<span>OXIDIZE</span></a>
      <span class="ox-crumb">${crumb}</span>
      <span class="ox-top-spacer"></span>
      <nav class="ox-top-nav" aria-label="Site">
        <a href="${rel("index.html#map")}" class="ox-hide-sm">${ICON.map}<span>Map</span></a>
        <a href="${rel("index.html#labs")}" class="ox-hide-sm">${ICON.lab}<span>Labs</span></a>
        <a class="ox-xpchip" href="${rel("index.html#progress")}"><b>0 XP</b><span class="ox-xp-name">Hatchling</span><span class="ox-xpbar"><i></i></span></a>
        <button type="button" class="ox-iconbtn" aria-label="Change theme" title="Theme: system / dark / light">${ICON.theme}</button>
      </nav>
      <span class="ox-readbar"></span>`;
    xpChip = $(".ox-xpchip", top);
    $(".ox-iconbtn", top).addEventListener("click", cycleTheme);
    renderXp();
    const bar = $(".ox-readbar", top);
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      bar.style.width = (max > 0 ? Math.min(100, (scrollY / max) * 100) : 0) + "%";
    };
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  function buildToc() {
    const main = $(".ox-main");
    const rail = $(".ox-rail");
    if (!main || !rail) return;
    const heads = $$("h2[id]", main);
    if (!heads.length) return;
    const n = parseInt(document.body.dataset.chapter || "0", 10);
    const ch = chapterByNum(n);
    rail.innerHTML = `<span class="ox-label">In this chapter</span>`;
    const ul = h("ul", { class: "ox-toc" });
    const links = heads.map((hd) => {
      const a = h("a", { href: "#" + hd.id }, esc(hd.dataset.toc || hd.textContent));
      const li = h("li");
      li.appendChild(a);
      ul.appendChild(li);
      return a;
    });
    rail.appendChild(ul);
    if (ch) rail.appendChild(h("div", { class: "ox-rail-meta" }, `<span>≈ ${ch.mins} min</span><span>${(window.OX_CARDS || []).filter((c) => c.ch === n).length} recall cards</span>`));
    const key = "sec:" + n;
    state.sections[key] = state.sections[key] || {};
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          const i = heads.indexOf(e.target);
          links.forEach((l, j) => l.classList.toggle("is-active", j === i));
          state.sections[key][e.target.id] = 1;
          links[i].classList.add("is-read");
          save();
        }
      });
    }, { rootMargin: "0px 0px -70% 0px" });
    heads.forEach((hd) => io.observe(hd));
    links.forEach((l, i) => { if (state.sections[key][heads[i].id]) l.classList.add("is-read"); });
  }

  function buildComplete() {
    const host = $(".ox-complete-host");
    const n = parseInt(document.body.dataset.chapter || "0", 10);
    const ch = chapterByNum(n);
    if (!host || !ch) return;
    const prev = chapterByNum(n - 1), next = chapterByNum(n + 1);
    const done = !!state.chapters[n];
    const box = h("div", { class: "ox-complete" + (done ? " is-done" : "") });
    box.innerHTML = `<div><span class="ox-label">Chapter ${String(n).padStart(2, "0")} · ${esc(ch.title)}</span><h3 style="margin:.3rem 0 0">${done ? "Chapter complete." : "Finished reading?"}</h3><p style="margin:.3rem 0 0;color:var(--muted)">${done ? "You can come back any time. Your quiz answers are saved in this browser." : "Mark it complete to light it up on the map. Quests and recall cards are what make it stick."}</p></div>`;
    const row = h("div", { class: "ox-complete-row" });
    const btn = h("button", { type: "button", class: "ox-btn" + (done ? "" : " is-primary") }, done ? "Completed ✓" : "Mark chapter complete (+50 XP)");
    btn.addEventListener("click", () => {
      if (state.chapters[n]) return;
      state.chapters[n] = Date.now();
      save();
      award(50, "chapter " + n + " complete", "chapter:" + n);
      box.classList.add("is-done");
      btn.textContent = "Completed ✓";
      btn.classList.remove("is-primary");
      $("h3", box).textContent = "Chapter complete.";
    });
    row.appendChild(btn);
    if (next) row.appendChild(h("a", { class: "ox-btn" + (done ? " is-primary" : ""), href: chapterUrl(next) }, `Next: ${esc(next.title)} →`));
    box.appendChild(row);
    host.appendChild(box);
    const pager = h("nav", { class: "ox-pager", "aria-label": "Chapters" });
    if (prev) pager.appendChild(h("a", { href: chapterUrl(prev) }, `<span class="ox-label">← Chapter ${String(prev.n).padStart(2, "0")}</span><b>${esc(prev.title)}</b>`));
    if (next) pager.appendChild(h("a", { class: "is-next", href: chapterUrl(next) }, `<span class="ox-label">Chapter ${String(next.n).padStart(2, "0")} →</span><b>${esc(next.title)}</b>`));
    host.appendChild(pager);
  }

  function buildHero() {
    const hero = $(".ox-hero[data-auto]");
    const n = parseInt(document.body.dataset.chapter || "0", 10);
    const ch = chapterByNum(n);
    if (!hero || !ch) return;
    const act = COURSE.acts.find((a) => a.id === ch.act);
    const outcomes = $("ul", hero);
    const kicker = h("div", { class: "ox-hero-kicker" }, `<span class="ox-num">${String(n).padStart(2, "0")}</span><span>Act ${["", "I", "II", "III", "IV", "V"][act.id]} · ${esc(act.name)}: ${esc(act.subtitle)}</span><span>≈ ${ch.mins} min</span>`);
    const title = h("h1", { class: "ox-title" }, esc(ch.title));
    const idea = h("p", { class: "ox-idea" }, esc(hero.dataset.idea || ch.idea));
    hero.prepend(kicker, title, idea);
    if (outcomes) { outcomes.classList.add("ox-outcomes"); outcomes.before(h("span", { class: "ox-label", style: "display:block;margin-bottom:8px" }, "By the end you can")); }
    if (!document.title || document.title === "Oxidize") document.title = `${ch.title} · Oxidize`;
  }

  /* ================================================================ boot */
  function boot() {
    buildTopbar();
    buildHero();
    $$("pre.rs, pre.rust, pre.php, pre.sh, pre.shell, pre.toml, pre.rustc, pre.text").forEach((pre) => {
      if (pre.closest(".ox-fill")) return;
      enhancePre(pre);
    });
    // A <summary> is a flex row; wrap its content so inline <code> doesn't
    // become separate flex items that refuse to wrap.
    $$("details.ox-think > summary").forEach((sum) => {
      if (sum.querySelector(":scope > .ox-think-q")) return;
      const span = h("span", { class: "ox-think-q" });
      while (sum.firstChild) span.appendChild(sum.firstChild);
      sum.appendChild(span);
    });
    $$(".ox-callout").forEach(enhanceCallout);
    $$(".ox-bridge").forEach(enhanceBridge);
    $$(".ox-quiz").forEach(enhanceQuiz);
    $$(".ox-fill").forEach(enhanceFill);
    $$(".ox-match").forEach(enhanceMatch);
    $$(".ox-order").forEach(enhanceOrder);
    $$(".ox-tabs").forEach(enhanceTabs);
    $$(".ox-deck").forEach(enhanceDeck);
    $$(".ox-quests").forEach(enhanceQuests);
    buildToc();
    buildComplete();
    Ox.ready = true;
    document.dispatchEvent(new CustomEvent("ox:ready"));
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
