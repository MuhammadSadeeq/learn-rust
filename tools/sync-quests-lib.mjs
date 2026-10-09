// Minimal parser for the TOML subset used by quests/quests.toml:
// [[quest]] tables with string, number, boolean and """multi-line""" values.
export function parseQuests(text) {
  const quests = [];
  let cur = null;
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    if (t === "[[quest]]") { cur = {}; quests.push(cur); continue; }
    const m = /^([A-Za-z_]+)\s*=\s*(.*)$/.exec(t);
    if (!m || !cur) throw new Error(`quests.toml:${i + 1}: can't parse: ${line}`);
    const [, key, rest] = m;
    if (rest.startsWith('"""')) {
      let body = rest.slice(3);
      const buf = [];
      if (body.endsWith('"""')) { cur[key] = body.slice(0, -3); continue; }
      if (body) buf.push(body);
      while (++i < lines.length && !lines[i].trimEnd().endsWith('"""')) buf.push(lines[i]);
      const last = lines[i].trimEnd().slice(0, -3);
      if (last.trim()) buf.push(last);
      cur[key] = buf.join("\n").replace(/^\n/, "");
    } else if (rest.startsWith('"')) cur[key] = JSON.parse(rest);
    else if (rest === "true" || rest === "false") cur[key] = rest === "true";
    else cur[key] = Number(rest);
  }
  return quests;
}
