// Rechnet für .u-color-N-text den kleinsten Anthrazit-Anteil (color-mix in srgb), mit dem jede
// Palettenstufe 1–45 in hell UND dunkel ≥ 4,5 : 1 auf Seite (--fq-surface) und Tafel (--fq-panel)
// erreicht (+ 6 % Reserve, auf 5er-Schritte aufgerundet), und gibt die CSS-Zeilen für
// components/utilities.css §2 aus. Nach jeder Palettenänderung neu laufen lassen:
//   node Frequenz/tools/gen-color-text.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseColor, contrast } from '../../_tools/lib/color.mjs';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'tokens');
const read = (f) => {
  const s = fs.readFileSync(path.join(dir, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const m = {};
  for (const x of s.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) m[x[1]] = x[2].trim();
  return m;
};
const T = { light: read('light.css'), dark: read('dark.css') };
const mixSrgb = (a, b, p) => ({ r: a.r * (1 - p) + b.r * p, g: a.g * (1 - p) + b.g * p, b: a.b * (1 - p) + b.b * p, a: 1 });
const stage = (mode, n) => {
  const t = T[mode];
  if (n <= 15) return parseColor(t[`--fq-cat-${n}`]);
  if (n <= 30) return mixSrgb(parseColor(t[`--fq-cat-${n - 15}`]), parseColor('#FFFFFF'), 0.4);
  return mixSrgb(parseColor(t[`--fq-cat-${n - 30}`]), parseColor('#000000'), 0.45);
};
const lines = [];
for (let n = 1; n <= 45; n++) {
  let need = 0;
  for (const mode of ['light', 'dark']) {
    const ink = parseColor(T[mode]['--fq-ink']);
    const bgs = ['--fq-surface', '--fq-panel'].map((k) => parseColor(T[mode][k]));
    let p = 0;
    while (p <= 1 && bgs.some((bg) => contrast(mixSrgb(stage(mode, n), ink, p), bg) < 4.5)) p += 0.01;
    need = Math.max(need, p);
  }
  if (need === 0) continue;
  const pct = Math.min(100, Math.ceil((need * 100 + 6) / 5) * 5);
  const sel = `.u-color-${n}-txt, .u-color-${n}-text`;
  lines.push(`${sel.padEnd(33)} { color: color-mix(in srgb, var(--u-color-${n}), var(--fq-ink) ${pct}%); }`);
}
console.log(lines.join('\n'));
