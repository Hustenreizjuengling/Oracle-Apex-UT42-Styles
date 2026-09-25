// Baut Veedel/docs/ARCHITECTURE.md aus der Vorlage und den aus den Quellen erzeugten Tabellen.
//   node Veedel/tools/build-architecture.mjs   (Vorlage: Veedel/docs/ARCHITECTURE.tpl.md)
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { ROOT } from '../../_tools/config.mjs';

const here = path.join(ROOT, 'Veedel', 'tools');
const tpl = path.join(ROOT, 'Veedel', 'docs', 'ARCHITECTURE.tpl.md');
const node = process.execPath;
const tables = execFileSync(node, [path.join(here, 'gen-token-tables.mjs')], { encoding: 'utf8' });
const part = (tag) => tables.split(`<!-- ${tag} -->`)[1].split('<!--')[0].trim();
let contrast;
try {
  contrast = execFileSync(node, [path.join(here, 'check-tokens.mjs'), '--table'], { encoding: 'utf8' });
} catch (e) {
  console.error('check-tokens.mjs meldet Fehler – Doku wird trotzdem gebaut:\n' + e.stdout);
  contrast = e.stdout;
}
const kontrast = contrast.slice(contrast.indexOf('| Paar')).split('\n').filter((l) => l.startsWith('|')).join('\n');
const date = new Date().toISOString().slice(0, 10);
const out = fs.readFileSync(tpl, 'utf8')
  .replace('{{DATE}}', date)
  .replace('{{FARB}}', part('FARB-TOKENS'))
  .replace('{{KAT}}', part('KATEGORIE'))
  .replace('{{SKALA}}', part('SKALA'))
  .replace('{{KONTRAST}}', kontrast);
const target = path.join(ROOT, 'Veedel', 'docs', 'ARCHITECTURE.md');
fs.writeFileSync(target, out);
console.log(`geschrieben: ${path.relative(ROOT, target)} (${out.split('\n').length} Zeilen)`);
