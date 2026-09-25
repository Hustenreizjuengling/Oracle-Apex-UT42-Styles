// Ergänzung zu _tools/lint.mjs für das Präfix --pa-: lint.mjs prüft die Token-Regeln inzwischen selbst
// (tokenPrefix "ri" aus theme.json), meldet lokale Tokens ohne --pa-c- aber nur als Hinweis und kennt keine
// Verweise auf nicht deklarierte Tokens. Dieses Werkzeug macht beides zum Fehler und findet tote Tokens.
//   node Passer/tools/lint-tokens.mjs
// FEHLER: globaler --pa-Token in einer Komponenten-Datei neu gesetzt (Regel 3), lokaler Token ohne --pa-c-,
//         verwendeter --pa-Token, den es nirgends gibt (Tippfehler → stiller Ausfall; auch var(--x, Rückfall)),
//         deklarierter --pa-Token, den keine Regel liest (toter Token).
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../../_tools/config.mjs';

const src = path.join(ROOT, 'Passer', 'src');
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
const global = new Set();
for (const f of fs.readdirSync(path.join(src, 'tokens'))) for (const m of strip(fs.readFileSync(path.join(src, 'tokens', f), 'utf8')).matchAll(/(--pa-[\w-]+)\s*:/g)) global.add(m[1]);
const local = new Set();
const files = ['bridge.css', 'base.css', ...fs.readdirSync(path.join(src, 'components')).map((f) => 'components/' + f)];
let errors = 0;
for (const rel of files) {
  const s = strip(fs.readFileSync(path.join(src, rel), 'utf8'));
  for (const m of s.matchAll(/(--pa-[\w-]+)\s*:/g)) local.add(m[1]);
  if (!rel.startsWith('components/')) continue;
  s.split('\n').forEach((l, i) => {
    for (const m of l.matchAll(/(--pa-[\w-]+)\s*:/g)) {
      if (global.has(m[1]) && m[1] !== '--pa-ground') { errors++; console.log(`FEHLER  ${rel}:${i + 1} globaler Token ${m[1]} in Komponente neu gesetzt`); }
      else if (!global.has(m[1]) && !m[1].startsWith('--pa-c-')) { errors++; console.log(`FEHLER  ${rel}:${i + 1} lokaler Token ${m[1]} ohne Präfix --pa-c-`); }
    }
  });
}
// verwendete, aber nirgends deklarierte Tokens – auch mit Rückfallwert: ein Haken für App-CSS wird mit seinem
// Standardwert auf dem Komponenten-Selektor deklariert (z. B. --pa-c-search-w), sonst ist er nicht auffindbar
const read = new Set();
for (const rel of files) {
  const s = strip(fs.readFileSync(path.join(src, rel), 'utf8'));
  s.split('\n').forEach((l, i) => {
    for (const m of l.matchAll(/var\((--pa-[\w-]+)\s*(,?)/g)) {
      read.add(m[1]);
      if (!global.has(m[1]) && !local.has(m[1])) { errors++; console.log(`FEHLER  ${rel}:${i + 1} ${m[1]} ist nirgends deklariert${m[2] ? ' (nur Rückfallwert)' : ''}`); }
    }
  });
}
// deklarierte, aber nie gelesene Tokens (tote Tokens) – auch in tokens/*.css (Druck-Tokens eingeschlossen)
for (const f of fs.readdirSync(path.join(src, 'tokens'))) for (const m of strip(fs.readFileSync(path.join(src, 'tokens', f), 'utf8')).matchAll(/var\((--pa-[\w-]+)/g)) read.add(m[1]);
for (const name of [...global, ...local]) if (!read.has(name)) { errors++; console.log(`FEHLER  ${name} ist deklariert, wird aber nirgends gelesen (toter Token)`); }
console.log(errors ? `\n${errors} Fehler` : `OK – ${global.size} globale Tokens, keine Verstöße`);
process.exit(errors ? 1 : 0);
