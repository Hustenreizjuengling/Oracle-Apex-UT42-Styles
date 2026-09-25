// Einfacher CSS-Parser für formatierte Theme-Dateien: liefert flache Regelliste
// { ctx: [at-rule preludes], sel, decls: [[prop, value]], section, line }
export function parseCss(text) {
  const rules = [];
  let i = 0, line = 1, section = '(Anfang)';
  const n = text.length;
  function headingFrom(comment) {
    if (!/={5,}/.test(comment)) return null;
    const body = comment.replace(/^\/\*!?/, '').replace(/\*\/$/, '');
    const lines = body.split('\n').map((s) => s.replace(/[=*]/g, '').trim()).filter(Boolean);
    return lines.length ? lines[0].slice(0, 60) : null;
  }
  function skipWsAndComments(allowSection) {
    while (i < n) {
      const c = text[i];
      if (c === '\n') { line++; i++; continue; }
      if (c === ' ' || c === '\t' || c === '\r') { i++; continue; }
      if (c === '/' && text[i + 1] === '*') {
        const end = text.indexOf('*/', i + 2);
        const com = text.slice(i, end + 2);
        line += (com.match(/\n/g) || []).length;
        if (allowSection) { const h = headingFrom(com); if (h) section = h; }
        i = end + 2;
        continue;
      }
      break;
    }
  }
  // liest bis zum nächsten top-level Stopzeichen (Strings/Klammern/Kommentare beachten)
  function readUntil(stops) {
    let s = '', depth = 0;
    while (i < n) {
      const c = text[i];
      if (c === '/' && text[i + 1] === '*') {
        const e = text.indexOf('*/', i + 2);
        const com = text.slice(i, e + 2);
        line += (com.match(/\n/g) || []).length;
        i = e + 2; s += ' ';
        continue;
      }
      if (c === '"' || c === "'") {
        let j = i + 1;
        while (j < n && text[j] !== c) { if (text[j] === '\\') j++; j++; }
        s += text.slice(i, j + 1); i = j + 1;
        continue;
      }
      if (c === '(') depth++;
      if (c === ')') depth--;
      if (depth <= 0 && stops.includes(c)) break;
      if (c === '\n') line++;
      s += c; i++;
    }
    return s;
  }
  function parseBlock(ctx) {
    while (i < n) {
      skipWsAndComments(true);
      if (i >= n) return;
      if (text[i] === '}') { i++; return; }
      const startLine = line;
      const prelude = readUntil(['{', ';', '}']).trim().replace(/\s+/g, ' ');
      if (text[i] === ';') { i++; rules.push({ ctx: [...ctx], sel: prelude, decls: [], section, line: startLine, atStatement: true }); continue; }
      if (text[i] === '}') { i++; return; }
      i++; // '{'
      if (prelude.startsWith('@') && !/^@(font-face|page)/.test(prelude)) {
        parseBlock([...ctx, prelude]);
        continue;
      }
      const decls = [];
      while (i < n) {
        skipWsAndComments(false);
        if (text[i] === '}') { i++; break; }
        const d = readUntil([';', '}', '{']);
        if (text[i] === '{') {
          i++;
          let depth = 1;
          while (i < n && depth) { if (text[i] === '{') depth++; else if (text[i] === '}') depth--; if (text[i] === '\n') line++; i++; }
          decls.push(['__nested__', d.trim()]);
          continue;
        }
        if (text[i] === ';') i++;
        const t = d.trim();
        if (!t) continue;
        const k = t.indexOf(':');
        if (k < 0) { decls.push(['__raw__', t]); continue; }
        decls.push([t.slice(0, k).trim(), t.slice(k + 1).trim().replace(/\s+/g, ' ')]);
      }
      rules.push({ ctx: [...ctx], sel: prelude.split(',').map((s) => s.trim()).join(', '), decls, section, line: startLine });
    }
  }
  parseBlock([]);
  return rules;
}
// Farbwerte, die NICHT über var() kommen (hart codiert)
export const HARD_COLOR_RE = /#[0-9a-fA-F]{3,8}\b|\brgba?\((?!\s*var)|\bhsla?\(|\b(white|black)\b/;
export const isRootVarRule = (r) => /^(:root|html|body)$/.test(r.sel) && r.decls.length > 0 && r.decls.every(([p]) => p.startsWith('--'));
export function varMap(rs, sel = ':root') {
  const m = new Map();
  for (const r of rs) if (!r.ctx.length && r.sel === sel) for (const [p, v] of r.decls) if (p.startsWith('--')) m.set(p, v);
  return m;
}
export function keyed(rs) {
  const m = new Map();
  const cnt = {};
  for (const r of rs) {
    const k0 = r.ctx.join(' > ') + ' | ' + r.sel;
    cnt[k0] = (cnt[k0] || 0) + 1;
    m.set(k0 + ' #' + cnt[k0], r);
  }
  return m;
}
