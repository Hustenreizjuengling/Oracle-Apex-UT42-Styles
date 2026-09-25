// Prüft die Farb-Tokens von Passepartout direkt aus den Quellen (src/tokens/light.css, dark.css):
//  - gleiche Token-Namen in beiden Dateien
//  - Kontraste (Text >= 4.5, UI/Fokus >= 3, Leinwand/Rahmen >= 1.3)
//  - Danger vs. Kartenmagenta (Farbton UND Helligkeit, normal + Protan/Deutan/Tritan)
//  - Kategorie-Palette (Kontrast, CVD-Unterscheidbarkeit in Chart-Reihenfolge, abgeleitete 16–45,
//    Abstand zum Akzent ΔE00 >= 20, gleicher Farbton hell/dunkel)
//  - Code-Farben (--pp-code-*, Prism-Kommentar) auf allen Flächen, auf denen Code steht
//  - Abstand aller Farben zu Oracle-Blau (ΔE00 >= 12)
//   node Passepartout/tools/check-tokens.mjs [--table]   (--table: Markdown-Tabelle der Kontrastpaare)
// Nebenprodukt: _tmp/<prefix>/contrast-table.json (prefix aus theme.json – eigener Ordner je Theme,
// damit parallel geprüfte Themes sich nicht überschreiben).
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../../_tools/config.mjs';
import { parseColor, contrast, deltaE2000, simulate, luminance, hex, mix, over, toLch } from '../../_tools/lib/color.mjs';

const meta = JSON.parse(fs.readFileSync(new URL('../theme.json', import.meta.url), 'utf8'));
const outDir = path.join(ROOT, '_tmp', meta.prefix);

const dir = path.join(ROOT, 'Passepartout', 'src', 'tokens');
function readTokens(file) {
  const src = fs.readFileSync(path.join(dir, file), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const map = {};
  for (const m of src.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) map[m[1]] = m[2].trim();
  return map;
}
const T = { light: readTokens('light.css'), dark: readTokens('dark.css') };
let fails = 0;
const fail = (msg) => { fails++; console.log('  FEHLER ' + msg); };

// 1) Namensgleichheit
const a = Object.keys(T.light), b = Object.keys(T.dark);
const onlyL = a.filter((k) => !b.includes(k)), onlyD = b.filter((k) => !a.includes(k));
console.log(`Tokens: hell ${a.length}, dunkel ${b.length}`);
if (onlyL.length) fail('nur hell: ' + onlyL.join(', '));
if (onlyD.length) fail('nur dunkel: ' + onlyD.join(', '));

function resolve(mode, name, depth = 0) {
  let v = T[mode][name];
  if (v === undefined) throw new Error(`${mode}: ${name} fehlt`);
  const ref = v.match(/^var\((--[\w-]+)\)$/);
  if (ref && depth < 5) return resolve(mode, ref[1], depth + 1);
  const c = parseColor(v.replace(/rgb\((\d+) (\d+) (\d+) \/ ([\d.]+)\)/, 'rgba($1,$2,$3,$4)'));
  return c;
}
const col = (mode, name) => {
  const c = resolve(mode, name);
  if (!c) throw new Error(`${mode}: ${name} ist keine Farbe (${T[mode][name]})`);
  return c;
};
// halbtransparente Flächen auf ihren Untergrund legen
const on = (mode, fg, bgName) => {
  const bg = col(mode, bgName);
  const base = (bg.a ?? 1) < 1 ? over(bg, col(mode, 'pp-surface'.startsWith('--') ? 'pp-surface' : '--pp-surface')) : bg;
  const f = col(mode, fg);
  return { f: (f.a ?? 1) < 1 ? over(f, base) : f, bg: base };
};

const TEXT = 4.5, UI = 3;
const PAIRS = [
  // [Vordergrund, Hintergrund, Minimum, Rolle]
  ['--pp-ink', '--pp-surface', TEXT, 'Text auf Leinwand'],
  ['--pp-ink', '--pp-frame', TEXT, 'Text auf Rahmen (Kopf, Nav)'],
  ['--pp-ink', '--pp-surface-sunken', TEXT, 'Text abgesenkt'],
  ['--pp-ink', '--pp-surface-raised', TEXT, 'Text in Menü/Dialog'],
  ['--pp-ink', '--pp-soft', TEXT, 'Sekundär-Button'],
  ['--pp-ink', '--pp-soft-hover', TEXT, 'Sekundär-Button Hover'],
  ['--pp-ink', '--pp-accent-tint', TEXT, 'Auswahl-Zeile'],
  ['--pp-ink', '--pp-accent-tint-2', TEXT, 'Auswahl kräftig'],
  ['--pp-ink-2', '--pp-surface', TEXT, 'Label'],
  ['--pp-ink-2', '--pp-frame', TEXT, 'Nav-Text auf Rahmen'],
  ['--pp-muted', '--pp-surface', TEXT, 'Sekundärtext'],
  ['--pp-muted', '--pp-surface-sunken', TEXT, 'Sekundärtext abgesenkt'],
  ['--pp-muted', '--pp-surface-raised', TEXT, 'Sekundärtext Menü'],
  ['--pp-muted', '--pp-frame', TEXT, 'Sekundärtext Rahmen'],
  ['--pp-muted', '--pp-hover', TEXT, 'Sekundärtext Zeilen-Hover'],
  ['--pp-ink', '--pp-raised-hover', TEXT, 'Menüeintrag Hover/Fokus'],
  ['--pp-muted', '--pp-raised-hover', TEXT, 'Tastenkürzel im Menü-Hover'],
  ['--pp-placeholder', '--pp-field', TEXT, 'Platzhalter'],
  ['--pp-ink', '--pp-field', TEXT, 'Feldtext'],
  ['--pp-ink', '--pp-field-readonly', TEXT, 'Feldtext readonly'],
  ['--pp-link-text', '--pp-surface', TEXT, 'Link'],
  ['--pp-accent-text', '--pp-surface', TEXT, 'Akzent-Text Leinwand'],
  ['--pp-accent-text', '--pp-surface-raised', TEXT, 'Akzent-Text Menü'],
  ['--pp-accent-text', '--pp-frame', TEXT, 'Akzent-Text Rahmen'],
  ['--pp-accent-text', '--pp-accent-tint', TEXT, 'Akzent-Text auf Tönung'],
  ['--pp-accent-on', '--pp-accent', TEXT, 'Primär-Button'],
  ['--pp-accent-on', '--pp-accent-hover', TEXT, 'Primär-Button Hover'],
  ['--pp-accent-on', '--pp-accent-press', TEXT, 'Primär-Button gedrückt'],
  ['--pp-selection-text', '--pp-selection', TEXT, '::selection'],
  ['--pp-required-color', '--pp-surface', TEXT, 'Pflicht-Markierung'],
  ['--pp-required-color', '--pp-surface-sunken', TEXT, 'Pflicht-Markierung abgesenkt'],
  ['--pp-tooltip-text', '--pp-tooltip-bg', TEXT, 'Tooltip'],
  ['--pp-edge', '--pp-surface', UI, 'Feldkante/Leinwand (1.4.11)'],
  ['--pp-edge', '--pp-surface-sunken', UI, 'Feldkante/abgesenkt'],
  ['--pp-edge', '--pp-field', UI, 'Feldkante/Feld'],
  ['--pp-edge', '--pp-surface-raised', UI, 'Feldkante/Dialog'],
  ['--pp-focus-ring-color', '--pp-surface', UI, 'Fokus auf Leinwand'],
  ['--pp-focus-ring-color', '--pp-frame', UI, 'Fokus auf Rahmen'],
  ['--pp-focus-ring-color', '--pp-surface-sunken', UI, 'Fokus abgesenkt'],
  ['--pp-focus-ring-color', '--pp-surface-raised', UI, 'Fokus in Menü/Dialog'],
  ['--pp-focus-ring-color', '--pp-soft', UI, 'Fokus neben Sekundär-Button'],
  ['--pp-focus-ring-color', '--pp-field', UI, 'Fokus-Feldkante/Feld'],
  ['--pp-focus-ring-color', '--pp-focus-gap', UI, 'Doppelring innen/außen'],
  ['--pp-focus-ring-color', '--pp-raised-hover', UI, 'Fokus-Innenring auf Menü-Hover'],
  ['--pp-accent-text', '--pp-raised-hover', UI, 'Häkchen/Radio im Menü-Hover (Marke)'],
  ['--pp-link-underline', '--pp-surface', UI, 'Link-Unterstrich'],
  ['--pp-link-underline', '--pp-surface-sunken', UI, 'Link-Unterstrich abgesenkt'],
  ['--pp-link-underline-hover', '--pp-surface', UI, 'Link-Unterstrich Hover'],
];
// Code (bridge.css §17): Code-Blöcke liegen auf Leinwand/abgesenkt (pre, Markdown), in Dialogen
// auf der schwebenden Fläche, im Markdown-Editor auf der Feldfläche.
for (const fg of ['--pp-code-keyword', '--pp-code-string', '--pp-code-number', '--pp-muted', '--pp-danger-text']) {
  const role = fg === '--pp-muted' ? 'Code-Kommentar' : fg === '--pp-danger-text' ? 'Code gelöscht (diff)' : `Code ${fg.slice(10)}`;
  for (const [bg, where] of [['--pp-surface', 'Leinwand'], ['--pp-surface-sunken', 'abgesenkt'], ['--pp-surface-raised', 'Dialog'], ['--pp-field', 'Markdown-Editor']]) {
    if (fg === '--pp-muted' && bg !== '--pp-field') continue;            // Leinwand/abgesenkt/Menü stehen schon oben
    if (fg === '--pp-danger-text' && bg !== '--pp-surface-raised' && bg !== '--pp-field') continue;
    PAIRS.push([fg, bg, TEXT, `${role} (${where})`]);
  }
}
for (const s of ['success', 'warning', 'danger', 'info']) {
  PAIRS.push([`--pp-${s}-on`, `--pp-${s}`, TEXT, `${s}-Fläche`]);
  PAIRS.push([`--pp-${s}-on`, `--pp-${s}-hover`, TEXT, `${s}-Fläche Hover`]);
  PAIRS.push([`--pp-${s}-text`, '--pp-surface', TEXT, `${s}-Text Leinwand`]);
  PAIRS.push([`--pp-${s}-text`, '--pp-surface-sunken', TEXT, `${s}-Text abgesenkt`]);
  PAIRS.push([`--pp-${s}-text`, `--pp-${s}-tint`, TEXT, `${s}-Text auf Tönung`]);
  PAIRS.push(['--pp-ink', `--pp-${s}-tint`, TEXT, `Text auf ${s}-Tönung`]);
}

const table = [];
for (const mode of ['light', 'dark']) {
  console.log(`\n== ${mode} ==`);
  for (const [fg, bg, min, role] of PAIRS) {
    const { f, bg: B } = on(mode, fg, bg);
    const r = contrast(f, B);
    table.push({ mode, fg, bg, r, min, role });
    if (r < min) fail(`${mode}: ${fg} auf ${bg} = ${r.toFixed(2)} < ${min} (${role})`);
  }
  // Leinwand/Rahmen
  const cf = contrast(col(mode, '--pp-surface'), col(mode, '--pp-frame'));
  console.log(`  Leinwand/Rahmen ${cf.toFixed(2)}:1`);
  if (mode === 'dark' && cf < 1.3) fail(`dark: Leinwand/Rahmen ${cf.toFixed(2)} < 1.3`);
  table.push({ mode, fg: '--pp-surface', bg: '--pp-frame', r: cf, min: mode === 'dark' ? 1.3 : 0, role: 'Leinwand gegen Rahmen' });
  // Flächenstufen (keine WCAG-Pflicht; nur der Hover auf schwebenden Ebenen hat ein Minimum:
  // sichtbar wie die Sekundär-Fläche hell auf Weiß – --pp-soft hätte dunkel nur 1.13, --pp-hover 1.02)
  const HOVER_RAISED = 1.15;
  for (const [x, y, role, min = 0] of [['--pp-line', '--pp-surface', 'Haarlinie'], ['--pp-line-strong', '--pp-surface', 'kräftige Linie'], ['--pp-head-rule', '--pp-surface', 'Tabellenkopf-Grundlinie'], ['--pp-soft', '--pp-surface', 'Sekundär-Button-Fläche'], ['--pp-accent', '--pp-surface', 'Primär-Fläche'], ['--pp-raised-hover', '--pp-surface-raised', 'Hover auf schwebender Fläche', HOVER_RAISED]]) {
    const r = contrast(col(mode, x), col(mode, y));
    table.push({ mode, fg: x, bg: y, r, min, role });
    console.log(`  ${role}: ${r.toFixed(2)}:1`);
    if (r < min) fail(`${mode}: ${x} auf ${y} = ${r.toFixed(2)} < ${min} (${role})`);
  }
  // Grundfläche: an der Wurzel = Leinwand, die Fokus-Lücke folgt ihr
  if (hex(col(mode, '--pp-ground')) !== hex(col(mode, '--pp-surface'))) fail(`${mode}: --pp-ground ≠ --pp-surface an der Wurzel`);
  if (T[mode]['--pp-focus-gap'] !== 'var(--pp-ground)') fail(`${mode}: --pp-focus-gap muss var(--pp-ground) sein (bridge §18 setzt den Grund in schwebenden Ebenen)`);
  // Danger vs Akzent
  const d = col(mode, '--pp-danger'), acc = col(mode, '--pp-accent');
  const ld = luminance(d), la = luminance(acc);
  const dE = ['normal', 'protan', 'deutan', 'tritan'].map((t) => deltaE2000(t === 'normal' ? d : simulate(d, t), t === 'normal' ? acc : simulate(acc, t)));
  const lr = (Math.max(ld, la) + 0.05) / (Math.min(ld, la) + 0.05);
  console.log(`  Danger ${hex(d)} vs Akzent ${hex(acc)}: ΔE00 normal/protan/deutan/tritan ${dE.map((x) => x.toFixed(1)).join(' / ')}, Helligkeit L ${ld.toFixed(3)} vs ${la.toFixed(3)} (${lr.toFixed(2)}:1)`);
  if (Math.min(dE[0], dE[1], dE[2]) < 20) fail(`${mode}: Danger/Akzent zu ähnlich (ΔE < 20)`);
  if (lr < 1.2) fail(`${mode}: Danger/Akzent Helligkeit zu gleich (${lr.toFixed(2)})`);
  const dt = col(mode, '--pp-danger-text'), at = col(mode, '--pp-accent-text');
  const dEt = ['normal', 'protan', 'deutan'].map((t) => deltaE2000(t === 'normal' ? dt : simulate(dt, t), t === 'normal' ? at : simulate(at, t)));
  console.log(`  Danger-Text vs Akzent-Text: ΔE00 ${dEt.map((x) => x.toFixed(1)).join(' / ')}`);

  // Kategorie-Palette
  const ORDER = [1, 4, 7, 9, 12, 3, 8, 10, 2, 5, 11, 6];
  const surf = col(mode, '--pp-surface');
  const catMin = mode === 'light' ? 2.4 : 3.3;
  for (let n = 1; n <= 15; n++) {
    const c = col(mode, `--pp-cat-${n}`), o = col(mode, `--pp-cat-${n}-on`);
    const rb = contrast(c, surf), ro = contrast(o, c);
    if (rb < catMin) fail(`${mode}: --pp-cat-${n} gegen Leinwand ${rb.toFixed(2)} < ${catMin}`);
    if (ro < TEXT) fail(`${mode}: --pp-cat-${n}-on ${ro.toFixed(2)} < 4.5`);
  }
  // Magenta-Disziplin: keine Kategorie darf sich als Akzent (Primäraktion/Auswahl) lesen
  {
    const acc = col(mode, '--pp-accent'), accT = col(mode, '--pp-accent-text');
    let min = 1e9, which;
    for (let n = 1; n <= 15; n++) {
      const x = col(mode, `--pp-cat-${n}`);
      const d = Math.min(deltaE2000(x, acc), deltaE2000(x, accT));
      if (d < min) { min = d; which = n; }
      if (d < 20) fail(`${mode}: --pp-cat-${n} ${hex(x)} liegt ΔE00 ${d.toFixed(1)} am Akzent (< 20)`);
    }
    console.log(`  Kategorie ↔ Akzent/Akzent-Text min ΔE00 ${min.toFixed(1)} (cat-${which})`);
  }
  for (const k of [6, 8]) {
    const res = [];
    for (const t of ['normal', 'protan', 'deutan', 'tritan']) {
      let min = 1e9, p;
      const set = ORDER.slice(0, k);
      for (let i = 0; i < set.length; i++) for (let j = i + 1; j < set.length; j++) {
        const x = col(mode, `--pp-cat-${set[i]}`), y = col(mode, `--pp-cat-${set[j]}`);
        const dd = deltaE2000(t === 'normal' ? x : simulate(x, t), t === 'normal' ? y : simulate(y, t));
        if (dd < min) { min = dd; p = `${set[i]}/${set[j]}`; }
      }
      res.push(`${t} ${min.toFixed(1)} (u${p.replace('/', '/u')})`);
      if (k === 6 && t !== 'tritan' && min < 6) fail(`${mode}: erste 6 Serien ${t} min ΔE ${min.toFixed(1)} < 6`);
    }
    console.log(`  Palette erste ${k} Serien min ΔE00: ${res.join(', ')}`);
  }
  // abgeleitete 16–45 (Formel wie in bridge.css)
  let w16 = 99, w31 = 99;
  for (let n = 1; n <= 15; n++) {
    const c = col(mode, `--pp-cat-${n}`);
    w16 = Math.min(w16, contrast(mix(c, '#FFFFFF', 0.6), col(mode, '--pp-on-light')));
    w31 = Math.min(w31, contrast(mix(c, '#000000', 0.55), col(mode, '--pp-on-dark')));
  }
  console.log(`  --u-color-16…30 (60 % + Weiß) mit Tusche min ${w16.toFixed(2)}; 31…45 (55 % + Schwarz) mit Weiß min ${w31.toFixed(2)}`);
  if (w16 < TEXT) fail(`${mode}: u-color-16…30 Kontrast ${w16.toFixed(2)}`);
  if (w31 < TEXT) fail(`${mode}: u-color-31…45 Kontrast ${w31.toFixed(2)}`);

  // Oracle-Blau-Abstand aller Farb-Tokens
  const BLUES = ['#056AC8', '#0572CE', '#0677E1', '#0784F9', '#4696FC', '#045DAF', '#349BFA', '#006BD8', '#0076DF', '#056DCD', '#309FDB'].map(parseColor);
  for (const name of Object.keys(T[mode])) {
    let c; try { c = resolve(mode, name); } catch { c = null; }
    if (!c || (c.a ?? 1) === 0) continue;
    const dmin = Math.min(...BLUES.map((x) => deltaE2000(c, x)));
    if (dmin < 12) fail(`${mode}: ${name} ${hex(c)} liegt nahe Oracle-Blau (ΔE00 ${dmin.toFixed(1)})`);
  }
  // abgeleitete --u-color-16…45 ebenfalls
  for (let n = 1; n <= 15; n++) {
    const c = col(mode, `--pp-cat-${n}`);
    for (const [k, d] of [[n + 15, mix(c, '#FFFFFF', 0.6)], [n + 30, mix(c, '#000000', 0.55)]]) {
      const dmin = Math.min(...BLUES.map((x) => deltaE2000(d, x)));
      if (dmin < 12) fail(`${mode}: --u-color-${k} ${hex(d)} liegt nahe Oracle-Blau (ΔE00 ${dmin.toFixed(1)})`);
    }
  }
}

// Schwebende Ebenen (bridge.css §18): die dort neu aufgelösten Fokus-Schatten müssen dieselben
// Formeln tragen wie tokens/scale.css – sonst sähe der Ring in Menüs/Dialogen anders aus als auf der Leinwand.
{
  const strip = (f) => fs.readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const decl = (src, name) => [...src.matchAll(new RegExp(`${name}\\s*:\\s*([^;]+);`, 'g'))].map((m) => m[1].replace(/\s+/g, ' ').trim());
  const scale = strip(path.join(dir, 'scale.css'));
  const bridge = strip(path.join(ROOT, 'Passepartout', 'src', 'bridge.css'));
  const block = (bridge.match(/([^{}]+)\{[^{}]*--pp-ground\s*:\s*var\(--pp-surface-raised\)[^{}]*\}/) || [])[0];
  if (!block) fail('bridge.css §18: Regel mit --pp-ground: var(--pp-surface-raised) fehlt');
  else {
    for (const n of ['--pp-focus-shadow', '--pp-focus-shadow-inset']) {
      const [s] = decl(scale, n), [b] = decl(block, n);
      if (!b) fail(`bridge.css §18: ${n} fehlt (Lücke würde in schwebenden Ebenen nicht neu aufgelöst)`);
      else if (s !== b) fail(`bridge.css §18: ${n} weicht von tokens/scale.css ab`);
    }
    if (decl(block, '--pp-focus-gap')[0] !== 'var(--pp-ground)') fail('bridge.css §18: --pp-focus-gap muss var(--pp-ground) sein');
    console.log(`\nSchwebende Ebenen (bridge §18): ${block.split('{')[0].replace(/\s+/g, ' ').trim()} – Fokus-Schatten = scale.css`);
  }
}

// Gleiche Identität in beiden Modi: HSL-Farbton einer Kategorie hell ↔ dunkel ≤ 25°
// (Grautöne mit CIELAB-Buntheit C < 10 ausgenommen). Avatare, Badges und Diagrammserien behalten
// beim Moduswechsel ihre Farbfamilie (Anlass: cat-9 war hell Orchidee 312°, dunkel Violett 261°).
{
  const HUE_MAX = 25;
  const hslHue = ({ r, g, b }) => {
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    if (!d) return 0;
    let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60;
    return h < 0 ? h + 360 : h;
  };
  let worst = 0, wn;
  for (let n = 1; n <= 15; n++) {
    const l = col('light', `--pp-cat-${n}`), d = col('dark', `--pp-cat-${n}`);
    if (toLch(l).C < 10 || toLch(d).C < 10) continue;
    const hl = hslHue(l), hd = hslHue(d);
    const dh = Math.abs(((hd - hl + 540) % 360) - 180);
    if (dh > worst) { worst = dh; wn = n; }
    if (dh > HUE_MAX) fail(`--pp-cat-${n}: Farbton hell ${hl.toFixed(0)}° ↔ dunkel ${hd.toFixed(0)}° (Δ ${dh.toFixed(0)}° > ${HUE_MAX}°)`);
  }
  console.log(`\nKategorie-Farbton (HSL) hell ↔ dunkel: max Δ ${worst.toFixed(0)}° (cat-${wn}), Grenze ${HUE_MAX}°`);
}

if (process.argv.includes('--table')) {
  console.log('\n| Paar | Rolle | hell | dunkel | Minimum |\n|---|---|---:|---:|---:|');
  const keys = [...new Set(table.map((t) => `${t.fg}|${t.bg}|${t.role}`))];
  for (const k of keys) {
    const [fg, bg, role] = k.split('|');
    const l = table.find((t) => t.mode === 'light' && `${t.fg}|${t.bg}|${t.role}` === k);
    const d = table.find((t) => t.mode === 'dark' && `${t.fg}|${t.bg}|${t.role}` === k);
    console.log(`| \`${fg}\` / \`${bg}\` | ${role} | ${l.r.toFixed(2)} | ${d.r.toFixed(2)} | ${l.min || '–'} |`);
  }
}
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'contrast-table.json'), JSON.stringify(table.map((t) => ({ ...t, r: +t.r.toFixed(2) })), null, 1));
console.log(fails ? `\n${fails} Fehler` : '\nOK – alle Prüfungen bestanden');
process.exit(fails ? 1 : 0);
