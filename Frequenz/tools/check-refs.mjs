// Findet --fq-*-Verweise ohne Definition (Tippfehler, umbenannte Tokens) in src/.
// Verweise mit Rückfallwert (var(--fq-x, …)) gelten als gewollt optional.
//   node Frequenz/tools/check-refs.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const src = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src');
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const files = walk(src).filter((f) => f.endsWith('.css'));
const defined = new Set();
const uses = [];
for (const f of files) {
  // Kommentare entfernen, Zeilenumbrüche erhalten (Zeilennummern bleiben stimmig)
  const s = fs.readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
  for (const m of s.matchAll(/(--fq-[\w-]+)\s*:/g)) defined.add(m[1]);
  s.split('\n').forEach((l, i) => {
    for (const m of l.matchAll(/var\((--fq-[\w-]+)\s*\)/g)) uses.push([m[1], `${path.relative(src, f)}:${i + 1}`]);
  });
}
const by = {};
for (const [t, at] of uses) if (!defined.has(t)) (by[t] ||= []).push(at);
for (const [t, ats] of Object.entries(by)) console.log(`${t}  (${ats.length}×)  ${ats.slice(0, 6).join(', ')}${ats.length > 6 ? ' …' : ''}`);
const n = Object.values(by).reduce((a, b) => a + b.length, 0);
console.log(n ? `\n${Object.keys(by).length} undefinierte Tokens, ${n} Verweise` : 'OK – alle --fq-*-Verweise definiert');
process.exit(n ? 1 : 0);
