// Prüft die Farb-Tokens von Veedel direkt aus den Quellen (src/tokens/light.css, dark.css):
//  - gleiche Token-Namen in beiden Dateien
//  - Kontraste (Text >= 4.5, großer Text/UI/Fokus >= 3) – inkl. Kopfband und Verlaufsband
//  - Gefahr (Karminrot) vs. Hauptaktion (Signalrot): Farbton UND Helligkeit, normal + Protan/Deutan/Tritan
//  - Kategorie-Palette (Kontrast, CVD-Unterscheidbarkeit in Chart-Reihenfolge, abgeleitete 16–45,
//    Abstand zum Signalrot ΔE00 >= 20, gleicher Farbton hell/dunkel)
//  - Code-Farben (--ve-code-*, Prism-Kommentar) auf allen Flächen, auf denen Code steht
//  - Oracle-Blau: jede Farbe mit ΔE00 < 12 zu einer Vita-/APEX-Blau-Referenz muss ein bewusst
//    gesetzter Marken-Token sein (Liste BRAND unten) – alles andere ist ein Fehler.
//   node Veedel/tools/check-tokens.mjs [--table]   (--table: Markdown-Tabelle der Kontrastpaare)
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../../_tools/config.mjs';
import { parseColor, contrast, deltaE2000, simulate, luminance, hex, mix, over, toLch } from '../../_tools/lib/color.mjs';

const dir = path.join(ROOT, 'Veedel', 'src', 'tokens');
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
  return parseColor(v.replace(/rgb\((\d+) (\d+) (\d+) \/ ([\d.]+)\)/, 'rgba($1,$2,$3,$4)'));
}
const col = (mode, name) => {
  const c = resolve(mode, name);
  if (!c) throw new Error(`${mode}: ${name} ist keine Farbe (${T[mode][name]})`);
  return c;
};
// halbtransparente Vordergründe auf ihren Hintergrund legen; halbtransparente Hintergründe auf die Fläche
const on = (mode, fg, bgName) => {
  const bg = col(mode, bgName);
  const base = (bg.a ?? 1) < 1 ? over(bg, col(mode, '--ve-surface')) : bg;
  const f = col(mode, fg);
  return { f: (f.a ?? 1) < 1 ? over(f, base) : f, bg: base };
};

const TEXT = 4.5, UI = 3, LARGE = 3;
const PAIRS = [
  // [Vordergrund, Hintergrund, Minimum, Rolle]
  ['--ve-ink', '--ve-surface', TEXT, 'Text auf Fläche (Region, Karte, Navigation)'],
  ['--ve-ink', '--ve-page', TEXT, 'Text auf Seitengrund'],
  ['--ve-ink', '--ve-surface-sunken', TEXT, 'Text abgesenkt'],
  ['--ve-ink', '--ve-surface-raised', TEXT, 'Text in Menü/Dialog'],
  ['--ve-ink', '--ve-soft', TEXT, 'Text auf neutraler Fläche (Chip, Zähler)'],
  ['--ve-ink', '--ve-hover', TEXT, 'Text in Zeilen-/Nav-Hover'],
  ['--ve-ink', '--ve-accent-tint', TEXT, 'Auswahl-Zeile'],
  ['--ve-ink', '--ve-accent-tint-2', TEXT, 'Auswahl kräftig'],
  ['--ve-ink-2', '--ve-surface', TEXT, 'Unterebene der Navigation'],
  ['--ve-muted', '--ve-surface', TEXT, 'Sekundärtext, Feld-Label'],
  ['--ve-muted', '--ve-page', TEXT, 'Label auf Seitengrund'],
  ['--ve-muted', '--ve-surface-sunken', TEXT, 'Sekundärtext abgesenkt'],
  ['--ve-muted', '--ve-surface-raised', TEXT, 'Sekundärtext Menü'],
  ['--ve-muted', '--ve-hover', TEXT, 'Sekundärtext Zeilen-Hover'],
  ['--ve-ink', '--ve-raised-hover', TEXT, 'Menüeintrag Hover/Fokus'],
  ['--ve-muted', '--ve-raised-hover', TEXT, 'Tastenkürzel im Menü-Hover'],
  ['--ve-placeholder', '--ve-field', TEXT, 'Platzhalter'],
  ['--ve-ink', '--ve-field', TEXT, 'Feldtext'],
  ['--ve-ink', '--ve-field-readonly', TEXT, 'Feldtext readonly'],
  ['--ve-link-text', '--ve-surface', TEXT, 'Link'],
  ['--ve-link-text', '--ve-page', TEXT, 'Link auf Seitengrund'],
  ['--ve-heading', '--ve-surface', LARGE, 'Überschrift ≥ 19 px/800 (großer Text)'],
  ['--ve-heading', '--ve-page', LARGE, 'Überschrift auf Seitengrund (großer Text)'],
  ['--ve-heading', '--ve-surface-raised', LARGE, 'Überschrift im Dialog (großer Text)'],
  // Markenband
  ['--ve-header-text', '--ve-header', TEXT, 'Kopfband: Schrift, Icons'],
  ['--ve-header-focus', '--ve-header', UI, 'Kopfband: Fokusring'],
  ['--ve-band-text', '--ve-band-from', TEXT, 'Verlaufsband links (kleine Schrift)'],
  ['--ve-band-text', '--ve-band-mid', TEXT, 'Verlaufsband Mitte (kleine Schrift)'],
  ['--ve-band-text', '--ve-band-to', LARGE, 'Verlaufsband rechts (nur Titel 40 px/900)'],
  ['--ve-band-muted', '--ve-band-from', TEXT, 'Breadcrumb auf dem Band'],
  ['--ve-band-muted', '--ve-band-mid', TEXT, 'Breadcrumb auf dem Band (Mitte)'],
  ['--ve-header-focus', '--ve-band-from', UI, 'Verlaufsband: Fokusring'],
  ['--ve-header-focus', '--ve-band-to', UI, 'Verlaufsband: Fokusring rechts'],
  // Akzent Blau
  ['--ve-accent-text', '--ve-surface', TEXT, 'Akzent-Text (Link, aktiver Tab, Button-Schrift)'],
  ['--ve-accent-text', '--ve-page', TEXT, 'Akzent-Text auf Seitengrund'],
  ['--ve-accent-text', '--ve-surface-raised', TEXT, 'Akzent-Text Menü'],
  ['--ve-accent-text', '--ve-accent-tint', TEXT, 'Button-Schrift auf Hover-Tönung'],
  ['--ve-accent-text', '--ve-accent-tint-2', TEXT, 'Button-Schrift gedrückt'],
  ['--ve-accent-on', '--ve-accent', TEXT, 'aktiver Nav-Block, gewählter Tag, Etikett'],
  ['--ve-accent-on', '--ve-accent-hover', TEXT, 'aktiver Nav-Block Hover'],
  ['--ve-accent-on', '--ve-accent-press', TEXT, 'Auswahl gedrückt'],
  ['--ve-accent-bright', '--ve-surface', UI, 'Balken-Marke (aktiver Tab, Menüleiste)'],
  // Aktion Rot
  ['--ve-action-on', '--ve-action', TEXT, 'Hot/Primary-Button'],
  ['--ve-action-on', '--ve-action-hover', TEXT, 'Hot/Primary Hover'],
  ['--ve-action-on', '--ve-action-press', TEXT, 'Hot/Primary gedrückt'],
  ['--ve-action-text', '--ve-surface', TEXT, 'Hot einfach/Link: rote Schrift'],
  ['--ve-action-text', '--ve-action-tint', TEXT, 'Hot einfach: Hover-Tönung'],
  ['--ve-selection-text', '--ve-selection', TEXT, '::selection'],
  ['--ve-required-color', '--ve-surface', TEXT, 'Pflicht-Markierung'],
  ['--ve-required-color', '--ve-page', TEXT, 'Pflicht-Markierung auf Seitengrund'],
  ['--ve-tooltip-text', '--ve-tooltip-bg', TEXT, 'Tooltip'],
  ['--ve-edge', '--ve-surface', UI, 'Feldkante/Fläche (1.4.11)'],
  ['--ve-edge', '--ve-page', UI, 'Feldkante/Seitengrund'],
  ['--ve-edge', '--ve-surface-sunken', UI, 'Feldkante/abgesenkt'],
  ['--ve-edge', '--ve-field', UI, 'Feldkante/Feld'],
  ['--ve-edge', '--ve-surface-raised', UI, 'Feldkante/Dialog'],
  ['--ve-focus-ring-color', '--ve-surface', UI, 'Fokus auf Fläche'],
  ['--ve-focus-ring-color', '--ve-page', UI, 'Fokus auf Seitengrund'],
  ['--ve-focus-ring-color', '--ve-surface-sunken', UI, 'Fokus abgesenkt'],
  ['--ve-focus-ring-color', '--ve-surface-raised', UI, 'Fokus in Menü/Dialog'],
  ['--ve-focus-ring-color', '--ve-soft', UI, 'Fokus neben neutraler Fläche'],
  ['--ve-focus-ring-color', '--ve-field', UI, 'Fokus-Feldkante/Feld'],
  ['--ve-focus-ring-color', '--ve-focus-gap', UI, 'Doppelring innen/außen'],
  ['--ve-focus-ring-color', '--ve-raised-hover', UI, 'Fokus-Innenring auf Menü-Hover'],
  ['--ve-accent-on', '--ve-accent', UI, 'Fokus-Innenring im Nav-Block (weiß auf Blau)'],
  ['--ve-accent-text', '--ve-raised-hover', UI, 'Häkchen/Radio im Menü-Hover (Marke)'],
  ['--ve-link-underline', '--ve-surface', UI, 'Link-Unterstrich'],
  ['--ve-link-underline-hover', '--ve-surface', UI, 'Link-Unterstrich Hover'],
];
// Code (bridge.css §17): Code-Blöcke liegen auf Fläche/abgesenkt (pre, Markdown), in Dialogen
// auf der schwebenden Fläche, im Markdown-Editor auf der Feldfläche.
for (const fg of ['--ve-code-keyword', '--ve-code-string', '--ve-code-number', '--ve-muted', '--ve-danger-text']) {
  const role = fg === '--ve-muted' ? 'Code-Kommentar' : fg === '--ve-danger-text' ? 'Code gelöscht (diff)' : `Code ${fg.slice(10)}`;
  for (const [bg, where] of [['--ve-surface', 'Fläche'], ['--ve-surface-sunken', 'abgesenkt'], ['--ve-surface-raised', 'Dialog'], ['--ve-field', 'Markdown-Editor']]) {
    if (fg === '--ve-muted' && bg !== '--ve-field') continue;            // Fläche/abgesenkt/Menü stehen schon oben
    if (fg === '--ve-danger-text' && bg !== '--ve-surface-raised' && bg !== '--ve-field') continue;
    PAIRS.push([fg, bg, TEXT, `${role} (${where})`]);
  }
}
for (const s of ['success', 'warning', 'danger', 'info']) {
  PAIRS.push([`--ve-${s}-on`, `--ve-${s}`, TEXT, `${s}-Fläche`]);
  PAIRS.push([`--ve-${s}-on`, `--ve-${s}-hover`, TEXT, `${s}-Fläche Hover`]);
  PAIRS.push([`--ve-${s}-text`, '--ve-surface', TEXT, `${s}-Text Fläche`]);
  PAIRS.push([`--ve-${s}-text`, '--ve-surface-sunken', TEXT, `${s}-Text abgesenkt`]);
  PAIRS.push([`--ve-${s}-text`, `--ve-${s}-tint`, TEXT, `${s}-Text auf Tönung`]);
  PAIRS.push(['--ve-ink', `--ve-${s}-tint`, TEXT, `Text auf ${s}-Tönung`]);
}
// Gefahr als Kontur: Karminrot-Schrift/Kante auf der Tönung (Fokus) und die gefüllte Hover-Fläche
PAIRS.push(['--ve-danger-text', '--ve-surface-raised', TEXT, 'danger-Text in Dialog']);

const table = [];
for (const mode of ['light', 'dark']) {
  console.log(`\n== ${mode} ==`);
  for (const [fg, bg, min, role] of PAIRS) {
    const { f, bg: B } = on(mode, fg, bg);
    const r = contrast(f, B);
    table.push({ mode, fg, bg, r, min, role });
    if (r < min) fail(`${mode}: ${fg} auf ${bg} = ${r.toFixed(2)} < ${min} (${role})`);
  }
  // Flächenstufen (keine WCAG-Pflicht; Minimum nur für den Hover auf schwebenden Ebenen und für den
  // aktiven Zustand: der blaue Nav-Block/die gewählte Seite ist die einzige Zustandsanzeige, 1.4.11 >= 3)
  const HOVER_RAISED = 1.12;
  for (const [x, y, role, min = 0] of [
    ['--ve-surface', '--ve-page', 'Fläche gegen Seitengrund'],
    ['--ve-line', '--ve-surface', 'Haarlinie'],
    ['--ve-line-strong', '--ve-surface', 'kräftige Linie'],
    ['--ve-head-rule', '--ve-surface', 'Tabellenkopf-Grundlinie'],
    ['--ve-soft', '--ve-surface', 'neutrale Fläche'],
    ['--ve-hover', '--ve-surface', 'Hover auf Fläche'],
    ['--ve-accent', '--ve-surface', 'Nav-Block/Auswahl-Fläche (aktiver Zustand, 1.4.11)', UI],
    ['--ve-accent', '--ve-page', 'Auswahl-Fläche auf Seitengrund (1.4.11)', UI],
    ['--ve-header', '--ve-band-from', 'Kopfband gegen Band-Anfang'],
    ['--ve-raised-hover', '--ve-surface-raised', 'Hover auf schwebender Fläche', HOVER_RAISED],
  ]) {
    const r = contrast(col(mode, x), col(mode, y));
    table.push({ mode, fg: x, bg: y, r, min, role });
    console.log(`  ${role}: ${r.toFixed(2)}:1`);
    if (r < min) fail(`${mode}: ${x} auf ${y} = ${r.toFixed(2)} < ${min} (${role})`);
  }
  // Grundfläche: an der Wurzel = Fläche, die Fokus-Lücke folgt ihr
  if (hex(col(mode, '--ve-ground')) !== hex(col(mode, '--ve-surface'))) fail(`${mode}: --ve-ground ≠ --ve-surface an der Wurzel`);
  if (T[mode]['--ve-focus-gap'] !== 'var(--ve-ground)') fail(`${mode}: --ve-focus-gap muss var(--ve-ground) sein (bridge §18 setzt den Grund in schwebenden Ebenen)`);

  // Gefahr vs. Hauptaktion: zwei Rottöne, die sich nie verwechseln dürfen
  const d = col(mode, '--ve-danger'), act = col(mode, '--ve-action');
  const ld = luminance(d), la = luminance(act);
  const dE = ['normal', 'protan', 'deutan', 'tritan'].map((t) => deltaE2000(t === 'normal' ? d : simulate(d, t), t === 'normal' ? act : simulate(act, t)));
  const lr = (Math.max(ld, la) + 0.05) / (Math.min(ld, la) + 0.05);
  console.log(`  Gefahr ${hex(d)} vs Aktion ${hex(act)}: ΔE00 normal/protan/deutan/tritan ${dE.map((x) => x.toFixed(1)).join(' / ')}, Helligkeit ${lr.toFixed(2)}:1`);
  if (Math.min(dE[0], dE[1], dE[2]) < 15) fail(`${mode}: Gefahr/Aktion zu ähnlich (ΔE00 < 15)`);
  if (lr < 1.5) fail(`${mode}: Gefahr/Aktion Helligkeit zu gleich (${lr.toFixed(2)} < 1.5)`);
  const dt = col(mode, '--ve-danger-text'), at = col(mode, '--ve-action-text');
  const dEt = ['normal', 'protan', 'deutan'].map((t) => deltaE2000(t === 'normal' ? dt : simulate(dt, t), t === 'normal' ? at : simulate(at, t)));
  console.log(`  Gefahr-Text vs Aktion-Text: ΔE00 ${dEt.map((x) => x.toFixed(1)).join(' / ')} (zusätzlich getrennt durch die Form: Kontur vs. Fläche)`);

  // Kategorie-Palette
  const ORDER = [1, 4, 7, 9, 12, 3, 8, 10, 2, 5, 11, 6];
  const surf = col(mode, '--ve-surface');
  const catMin = 3.0;                 // WCAG 1.4.11: Balken, Linien, Tortenstücke gegen die Fläche (hell wie dunkel)
  for (let n = 1; n <= 15; n++) {
    const c = col(mode, `--ve-cat-${n}`), o = col(mode, `--ve-cat-${n}-on`);
    const rb = contrast(c, surf), ro = contrast(o, c);
    if (rb < catMin) fail(`${mode}: --ve-cat-${n} gegen Fläche ${rb.toFixed(2)} < ${catMin}`);
    if (ro < TEXT) fail(`${mode}: --ve-cat-${n}-on ${ro.toFixed(2)} < 4.5`);
  }
  // Rot-Disziplin: keine Kategorie darf sich als Hauptaktion (Signalrot) lesen
  {
    const actT = col(mode, '--ve-action-text');
    let min = 1e9, which;
    for (let n = 1; n <= 15; n++) {
      const x = col(mode, `--ve-cat-${n}`);
      const dd = Math.min(deltaE2000(x, act), deltaE2000(x, actT));
      if (dd < min) { min = dd; which = n; }
      if (dd < 20) fail(`${mode}: --ve-cat-${n} ${hex(x)} liegt ΔE00 ${dd.toFixed(1)} am Signalrot (< 20)`);
    }
    console.log(`  Kategorie ↔ Signalrot min ΔE00 ${min.toFixed(1)} (cat-${which})`);
  }
  for (const k of [6, 8]) {
    const res = [];
    for (const t of ['normal', 'protan', 'deutan', 'tritan']) {
      let min = 1e9, p;
      const set = ORDER.slice(0, k);
      for (let i = 0; i < set.length; i++) for (let j = i + 1; j < set.length; j++) {
        const x = col(mode, `--ve-cat-${set[i]}`), y = col(mode, `--ve-cat-${set[j]}`);
        const dd = deltaE2000(t === 'normal' ? x : simulate(x, t), t === 'normal' ? y : simulate(y, t));
        if (dd < min) { min = dd; p = `${set[i]}/${set[j]}`; }
      }
      res.push(`${t} ${min.toFixed(1)} (u${p.replace('/', '/u')})`);
      if (k === 6 && t !== 'tritan' && min < 8) fail(`${mode}: erste 6 Serien ${t} min ΔE ${min.toFixed(1)} < 8`);
    }
    console.log(`  Palette erste ${k} Serien min ΔE00: ${res.join(', ')}`);
  }
  // abgeleitete 16–45 (Formel wie in bridge.css)
  let w16 = 99, w31 = 99;
  for (let n = 1; n <= 15; n++) {
    const c = col(mode, `--ve-cat-${n}`);
    w16 = Math.min(w16, contrast(mix(c, '#FFFFFF', 0.45), col(mode, '--ve-on-light')));
    w31 = Math.min(w31, contrast(mix(c, '#000000', 0.55), col(mode, '--ve-on-dark')));
  }
  console.log(`  --u-color-16…30 (45 % + Weiß) mit Nachtblau min ${w16.toFixed(2)}; 31…45 (55 % + Schwarz) mit Weiß min ${w31.toFixed(2)}`);
  if (w16 < TEXT) fail(`${mode}: u-color-16…30 Kontrast ${w16.toFixed(2)}`);
  if (w31 < TEXT) fail(`${mode}: u-color-31…45 Kontrast ${w31.toFixed(2)}`);

  // Oracle-Blau: nur bewusst gesetzte Marken-Tokens dürfen in die Nähe der Vita-/APEX-Blautöne
  const BLUES = ['#056AC8', '#0572CE', '#0677E1', '#0784F9', '#4696FC', '#045DAF', '#349BFA', '#006BD8', '#0076DF', '#056DCD', '#309FDB'].map(parseColor);
  const BRAND = new Set(['--ve-header', '--ve-band-from', '--ve-band-mid', '--ve-band-to', '--ve-heading',
    '--ve-accent', '--ve-accent-hover', '--ve-accent-press', '--ve-accent-text', '--ve-accent-bright',
    '--ve-focus-ring-color', '--ve-link-text', '--ve-link-underline', '--ve-link-underline-hover',
    '--ve-info', '--ve-info-hover', '--ve-info-text', '--ve-code-keyword', '--ve-cat-1',
    '--ve-accent-tint', '--ve-accent-tint-2', '--ve-accent-ring', '--ve-selection', '--ve-info-tint']);
  // Graublau (CIELAB-Buntheit C < 30) ist kein Oracle-Blau: die dunklen Flächen, Linien und
  // Kanten sind aus dem Nachtblau abgeleitet und liegen dem Farbton nach nahe, aber ohne Sättigung.
  const brandHits = [], greyBlue = [];
  for (const name of Object.keys(T[mode])) {
    let c; try { c = resolve(mode, name); } catch { c = null; }
    if (!c || (c.a ?? 1) === 0) continue;
    const dmin = Math.min(...BLUES.map((x) => deltaE2000(c, x)));
    if (dmin >= 12) continue;
    if (BRAND.has(name)) brandHits.push(`${name} ${hex(c)} (${dmin.toFixed(1)})`);
    else if (toLch(c).C < 30) greyBlue.push(`${name} ${hex(c)} (C ${toLch(c).C.toFixed(0)})`);
    else fail(`${mode}: ${name} ${hex(c)} liegt nahe Oracle-Blau (ΔE00 ${dmin.toFixed(1)}) und ist kein Marken-Token`);
  }
  console.log(`  Markenblau nahe Oracle-Blau (gewollt, ΔE00 < 12): ${brandHits.join(', ') || '–'}`);
  if (greyBlue.length) console.log(`  Graublau (ungesättigt, kein Oracle-Blau): ${greyBlue.join(', ')}`);
  for (let n = 1; n <= 15; n++) {
    const c = col(mode, `--ve-cat-${n}`);
    for (const [k, dd] of [[n + 15, mix(c, '#FFFFFF', 0.45)], [n + 30, mix(c, '#000000', 0.55)]]) {
      const dmin = Math.min(...BLUES.map((x) => deltaE2000(dd, x)));
      if (dmin < 12 && n !== 1) fail(`${mode}: --u-color-${k} ${hex(dd)} liegt nahe Oracle-Blau (ΔE00 ${dmin.toFixed(1)})`);
    }
  }
}

// Schwebende Ebenen (bridge.css §18): die dort neu aufgelösten Fokus-Schatten müssen dieselben
// Formeln tragen wie tokens/scale.css – sonst sähe der Ring in Menüs/Dialogen anders aus als auf der Fläche.
{
  const strip = (f) => fs.readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const decl = (src, name) => [...src.matchAll(new RegExp(`${name}\\s*:\\s*([^;]+);`, 'g'))].map((m) => m[1].replace(/\s+/g, ' ').trim());
  const scale = strip(path.join(dir, 'scale.css'));
  const bridge = strip(path.join(ROOT, 'Veedel', 'src', 'bridge.css'));
  const block = (bridge.match(/([^{}]+)\{[^{}]*--ve-ground\s*:\s*var\(--ve-surface-raised\)[^{}]*\}/) || [])[0];
  if (!block) fail('bridge.css §18: Regel mit --ve-ground: var(--ve-surface-raised) fehlt');
  else {
    for (const n of ['--ve-focus-shadow', '--ve-focus-shadow-inset']) {
      const [s] = decl(scale, n), [bb] = decl(block, n);
      if (!bb) fail(`bridge.css §18: ${n} fehlt (Lücke würde in schwebenden Ebenen nicht neu aufgelöst)`);
      else if (s !== bb) fail(`bridge.css §18: ${n} weicht von tokens/scale.css ab`);
    }
    if (decl(block, '--ve-focus-gap')[0] !== 'var(--ve-ground)') fail('bridge.css §18: --ve-focus-gap muss var(--ve-ground) sein');
    console.log(`\nSchwebende Ebenen (bridge §18): ${block.split('{')[0].replace(/\s+/g, ' ').trim()} – Fokus-Schatten = scale.css`);
  }
}

// Gleiche Identität in beiden Modi: HSL-Farbton einer Kategorie hell ↔ dunkel ≤ 25°
// (Grautöne mit CIELAB-Buntheit C < 10 ausgenommen).
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
    const l = col('light', `--ve-cat-${n}`), d = col('dark', `--ve-cat-${n}`);
    if (toLch(l).C < 10 || toLch(d).C < 10) continue;
    const hl = hslHue(l), hd = hslHue(d);
    const dh = Math.abs(((hd - hl + 540) % 360) - 180);
    if (dh > worst) { worst = dh; wn = n; }
    if (dh > HUE_MAX) fail(`--ve-cat-${n}: Farbton hell ${hl.toFixed(0)}° ↔ dunkel ${hd.toFixed(0)}° (Δ ${dh.toFixed(0)}° > ${HUE_MAX}°)`);
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
const outDir = path.join(ROOT, '_tmp', 'veedel');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'contrast-table.json'), JSON.stringify(table.map((t) => ({ ...t, r: +t.r.toFixed(2) })), null, 1));
console.log(fails ? `\n${fails} Fehler` : '\nOK – alle Prüfungen bestanden');
process.exit(fails ? 1 : 0);
