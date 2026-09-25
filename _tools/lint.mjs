// Prüft ein Theme gegen den Vertrag in Passepartout/docs/ARCHITECTURE.md.
//   node _tools/lint.mjs [ThemeOrdner]          (Standard: Passepartout)
// Token-Präfix (unten --xx-) je Theme: "tokenPrefix" aus <Theme>/theme.json; fehlt es, das häufigste --xx-
//   in src/tokens/light.css ohne ut, a, u, oj, jui (gleiche Regel wie _tools/new-theme.mjs).
// FEHLER (Exit 1): Lightning-CSS-Warnungen (verschluckte Regeln, kaputte Kommentare), @layer,
//   gesetzte --js-mq-*, prefers-color-scheme außerhalb der Einstiegsdateien, Nicht-:root in Token-Dateien,
//   Farbwerte in bridge.css/base.css, Text außerhalb von Kommentaren, globale --xx-Tokens (aus src/tokens/)
//   in Komponenten neu gesetzt.
// HINWEIS (Exit 0): Farbliterale in Komponenten, lokale Tokens ohne --xx-c-Präfix, !important-Zähler.
import fs from 'node:fs';
import path from 'node:path';
import { bundle } from 'lightningcss';
import { ROOT } from './config.mjs';
import { TARGETS, readThemeJson, tokenPrefixOf } from './lib/bundle.mjs';

const theme = process.argv[2] || 'Passepartout';
const { dir, meta } = readThemeJson(theme);
const tp = tokenPrefixOf(dir, meta);
const TOKEN_DECL = new RegExp(`(--${tp.replace(/[^\w-]/g, '')}-[\\w-]+)\\s*:`, 'g');
console.log(`Lint ${meta.name}: Token-Präfix --${tp}-${meta.tokenPrefix ? '' : ' (ermittelt – "tokenPrefix" fehlt in theme.json)'}`);
let errors = 0, hints = 0;
const err = (m) => { errors++; console.log('FEHLER  ' + m); };
const hint = (m) => { hints++; console.log('Hinweis ' + m); };

for (const s of meta.styles) {
  const res = bundle({ filename: path.join(dir, s.entry), targets: TARGETS, errorRecovery: true, drafts: { customMedia: true } });
  for (const w of res.warnings) {
    const loc = w.loc ? `${path.relative(ROOT, w.loc.filename)}:${w.loc.line}:${w.loc.column}` : '';
    err(`[${s.id}] ${w.type}: ${w.message} ${loc}`);
  }
}

function walk(d) { return fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)])); }
// globale Token-Namen (aus den Token-Dateien)
const tokenDir = path.join(dir, 'src', 'tokens');
const globalTokens = new Set();
for (const f of fs.readdirSync(tokenDir)) for (const m of fs.readFileSync(path.join(tokenDir, f), 'utf8').matchAll(TOKEN_DECL)) globalTokens.add(m[1]);
const GRANDFATHERED = new Set();   // früher geduldete Bestandsnamen ohne --xx-c- (inzwischen umbenannt)
const COLOR = /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(|\boklch\(|\blab\(/;

for (const f of walk(path.join(dir, 'src')).filter((f) => f.endsWith('.css'))) {
  const src = fs.readFileSync(f, 'utf8');
  const rel = path.relative(ROOT, f);
  const isToken = /[\\/]tokens[\\/]/.test(f);
  const isComp = /[\\/]components[\\/]/.test(f);
  const isEntry = meta.styles.some((s) => path.resolve(dir, s.entry) === path.resolve(f));
  const noComments = src.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
  const lines = noComments.split('\n');
  lines.forEach((l, i) => {
    const at = `${rel}:${i + 1}`;
    if (/@layer\b/.test(l)) err(`${at} @layer ist verboten`);
    if (/--js-mq-[\w-]+\s*:/.test(l)) err(`${at} --js-mq-* darf nicht gesetzt werden`);
    if (/prefers-color-scheme/.test(l) && !isEntry) err(`${at} prefers-color-scheme nur in den Einstiegsdateien (${meta.prefix}-*.css)`);
    if (/^\s*={6,}/.test(l) || /^\s*\d+\.\s+[A-ZÄÖÜ]/.test(l)) err(`${at} Text außerhalb eines Kommentars: "${l.trim().slice(0, 60)}"`);
    if (/(bridge|base)\.css$/.test(f) && COLOR.test(l.replace(/color-mix\(in srgb, var\([^)]+\) \d+%, #(fff|000)\)/g, ''))) err(`${at} Farbwert in modusneutraler Datei: ${l.trim().slice(0, 80)}`);
    if (isComp) {
      if (COLOR.test(l)) hint(`${at} Farbliteral in Komponenten-Datei: ${l.trim().slice(0, 80)}`);
      for (const m of l.matchAll(TOKEN_DECL)) {
        if (globalTokens.has(m[1])) err(`${at} globaler Token ${m[1]} in Komponenten-Datei neu gesetzt (nur im Fundament)`);
        else if (!m[1].startsWith(`--${tp}-c-`) && !GRANDFATHERED.has(m[1])) hint(`${at} lokaler Token ${m[1]} ohne Präfix --${tp}-c-`);
      }
      if (/:root\b/.test(l)) err(`${at} :root in Komponenten-Datei (globale Tokens gehören ins Fundament)`);
    }
  });
  if (isComp) {
    const imp = (noComments.match(/!important/g) || []).length;
    if (imp) hint(`${rel}: ${imp}× !important (nur gegen fremdes !important erlaubt: Vita, UT Core, app_ui – siehe ARCHITECTURE §5.3)`);
  }
  if (isToken) {
    const sels = [...noComments.matchAll(/([^{};]+)\{/g)].map((m) => m[1].trim()).filter((s) => !s.startsWith('@'));
    for (const sel of sels) if (sel !== ':root') err(`${rel}: Selektor "${sel}" in Token-Datei (nur :root erlaubt)`);
    for (const m of noComments.matchAll(/([\w-]+)\s*:\s*[^;{}]+;/g)) if (!m[1].startsWith('--')) err(`${rel}: Eigenschaft "${m[1]}" in Token-Datei (nur Custom Properties)`);
  }
}
console.log(errors ? `\n${errors} Fehler, ${hints} Hinweise` : `\nOK – keine Fehler (${hints} Hinweise)`);
process.exit(errors ? 1 : 0);
