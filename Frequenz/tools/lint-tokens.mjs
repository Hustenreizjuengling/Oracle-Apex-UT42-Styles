// Token-Regeln für --fq-* als schnelle Einzelprüfung (globaler Token in Komponente neu gesetzt,
// lokaler Token ohne --fq-c-). Dieselben Regeln prüft auch _tools/lint.mjs über "tokenPrefix" aus theme.json.
//   node Frequenz/tools/lint-tokens.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const src = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src');
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
const tokenDir = path.join(src, 'tokens');
const globals = new Set();
for (const f of fs.readdirSync(tokenDir)) for (const m of strip(fs.readFileSync(path.join(tokenDir, f), 'utf8')).matchAll(/(--fq-[\w-]+)\s*:/g)) globals.add(m[1]);
// bridge.css §18 löst Fokus-Tokens auf schwebenden Ebenen neu auf (Fundament, erlaubt)
let errors = 0, hints = 0;
const compDir = path.join(src, 'components');
for (const f of fs.readdirSync(compDir).filter((x) => x.endsWith('.css'))) {
  const lines = strip(fs.readFileSync(path.join(compDir, f), 'utf8')).split('\n');
  lines.forEach((l, i) => {
    for (const m of l.matchAll(/(--fq-[\w-]+)\s*:/g)) {
      if (globals.has(m[1])) { errors++; console.log(`FEHLER  components/${f}:${i + 1} globaler Token ${m[1]} in Komponente neu gesetzt`); }
      else if (!m[1].startsWith('--fq-c-')) { hints++; console.log(`Hinweis components/${f}:${i + 1} lokaler Token ${m[1]} ohne Präfix --fq-c-`); }
    }
  });
}
console.log(errors ? `\n${errors} Fehler, ${hints} Hinweise` : `OK – Token-Regeln für --fq-* eingehalten (${hints} Hinweise)`);
process.exit(errors ? 1 : 0);
