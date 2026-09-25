// Erzeugt das Delta "Vita -> Vita-Dark" aus den UT-Referenzdateien (_reference/ut-<ver>/css/).
// Es enthält alle Variablen und Regeln, in denen sich Vita-Dark von Vita unterscheidet
// (26.1: 178 Variablen, 38 Regeln). Eingebettet in @media (prefers-color-scheme: dark)
// macht es aus der Vita-Basis ein vollwertiges Vita-Dark – Grundlage der "Auto"-Styles.
//
//   node _tools/gen-dark-delta.mjs [26.1]     -> schreibt _shared/ut-dark-delta.css
//
// Das 26.1-Delta ist eine Obermenge des 24.2-Deltas und wurde auf beiden UT-Versionen
// gegen echtes Vita-Dark verglichen (0 Abweichungen, siehe _docs/ut-style-anatomy.md).
import fs from 'node:fs';
import path from 'node:path';
import { parseCss, isRootVarRule, varMap, keyed } from './lib/css-parse.mjs';
import { ROOT } from './config.mjs';

export function darkDelta(ver, { from = 'Vita', to = 'Vita-Dark' } = {}) {
  const dir = path.join(ROOT, '_reference', `ut-${ver}`, 'css');
  const L = parseCss(fs.readFileSync(path.join(dir, `${from}.css`), 'utf8'));
  const D = parseCss(fs.readFileSync(path.join(dir, `${to}.css`), 'utf8'));
  const lv = varMap(L);
  const dv = varMap(D);
  const vars = [...dv.entries()].filter(([k, v]) => lv.get(k) !== v);
  const lk = keyed(L.filter((r) => !isRootVarRule(r) && !r.atStatement));
  const dk = keyed(D.filter((r) => !isRootVarRule(r) && !r.atStatement));
  const rules = [];
  for (const [k, b] of dk) {
    const a = lk.get(k);
    const am = new Map(a ? a.decls : []);
    const changed = b.decls.filter(([p, v]) => am.get(p) !== v);
    if (changed.length) rules.push({ ctx: b.ctx, sel: b.sel, decls: changed });
  }
  // Ohne umschließende Media Query: der Aufrufer bettet die Datei per
  // @import "…" (prefers-color-scheme: dark) ein.
  let css = `/* Generiert von _tools/gen-dark-delta.mjs aus UT ${ver}: Delta ${from} -> ${to}\n   ${vars.length} Variablen, ${rules.length} Regeln. Nicht von Hand bearbeiten. */\n`;
  css += `:root {\n${vars.map(([k, v]) => `  ${k}: ${v};`).join('\n')}\n}\n`;
  for (const r of rules) {
    let open = '';
    let close = '';
    for (const c of r.ctx) {
      open += `${c} {\n`;
      close = `}\n${close}`;
    }
    css += `${open}${r.sel} {\n${r.decls.map(([p, v]) => `  ${p}: ${v};`).join('\n')}\n}\n${close}`;
  }
  return { css, vars, rules };
}

if (process.argv[1] && process.argv[1].endsWith('gen-dark-delta.mjs')) {
  const ver = process.argv[2] || '26.1';
  const { css, vars, rules } = darkDelta(ver);
  const out = path.join(ROOT, '_shared', 'ut-dark-delta.css');
  fs.writeFileSync(out, css);
  console.log(`OK ${path.relative(ROOT, out)}: ${vars.length} Variablen, ${rules.length} Regeln`);
}
