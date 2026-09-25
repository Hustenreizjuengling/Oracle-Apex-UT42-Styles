// Prüft die Farb-Tokens von Passer direkt aus den Quellen (src/tokens/light.css, dark.css):
//  - gleiche Token-Namen in beiden Dateien
//  - Kontraste (Text >= 4.5, UI/Fokus >= 3) auf Papier, Bogen, Rastertönung, Kopf (Teal-Vollton)
//  - Danger vs. Arbeitsfarbe Teal UND vs. Passer-Platte Pink (ein Hot-Button mit Pink-Platte
//    darf sich nicht wie eine Gefahr lesen) – normal + Protan/Deutan/Tritan
//  - Kategorie-Palette (Kontrast, CVD-Unterscheidbarkeit in Chart-Reihenfolge, abgeleitete 16–45,
//    gleicher Farbton hell/dunkel). Die Druckfarben SIND die Datenfarben: Teal ist Serie 1.
//  - Code-Farben (--pa-code-*, Prism-Kommentar) auf allen Flächen, auf denen Code steht
//  - Kopf-Raster: Kopfschrift über einem vollen Halbtonpunkt (Überdruck wie in shell.css §1), auch Hover/gedrückt
//  - Abstand aller Farben zu Oracle-Blau (ΔE00 >= 12)
//   node Passer/tools/check-tokens.mjs [--table]   (--table: Markdown-Tabelle der Kontrastpaare)
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../../_tools/config.mjs';
import { parseColor, contrast, deltaE2000, simulate, luminance, hex, mix, over, toLch } from '../../_tools/lib/color.mjs';

const dir = path.join(ROOT, 'Passer', 'src', 'tokens');
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
  const base = (bg.a ?? 1) < 1 ? over(bg, col(mode, '--pa-surface')) : bg;
  const f = col(mode, fg);
  return { f: (f.a ?? 1) < 1 ? over(f, base) : f, bg: base };
};

const TEXT = 4.5, UI = 3;
// höchste Deckung der Raster-Maske im Kopf (shell.css §1, .t-Header-branding::after) – aus der Quelle gelesen
const HEADER_DOTS_PEAK = (() => {
  const shell = fs.readFileSync(path.join(ROOT, 'Passer', 'src', 'components', 'shell.css'), 'utf8');
  const m = shell.match(/\.t-Header-branding::after\s*\{[^}]*?mask-image:\s*linear-gradient\([^,]+,\s*color-mix\(in srgb, var\(--pa-ink\) (\d+)%/);
  if (!m) throw new Error('shell.css: Raster-Maske des Kopfs nicht gefunden');
  return Number(m[1]) / 100;
})();
const PAIRS = [
  // [Vordergrund, Hintergrund, Minimum, Rolle]
  ['--pa-ink', '--pa-surface', TEXT, 'Text auf Papier'],
  ['--pa-ink', '--pa-sheet', TEXT, 'Text auf Bogen (Tabellen, Karten)'],
  ['--pa-ink', '--pa-surface-sunken', TEXT, 'Text auf Rastertönung'],
  ['--pa-ink', '--pa-surface-raised', TEXT, 'Text in Menü/Dialog'],
  ['--pa-ink', '--pa-soft', TEXT, 'Sekundär-Button'],
  ['--pa-ink', '--pa-soft-hover', TEXT, 'Sekundär-Button Hover'],
  ['--pa-ink', '--pa-accent-tint', TEXT, 'Auswahl-Zeile'],
  ['--pa-ink', '--pa-accent-tint-2', TEXT, 'Auswahl kräftig'],
  ['--pa-ink-2', '--pa-surface', TEXT, 'Label, Nav-Text'],
  ['--pa-muted', '--pa-surface', TEXT, 'Sekundärtext'],
  ['--pa-muted', '--pa-sheet', TEXT, 'Sekundärtext auf Bogen'],
  ['--pa-muted', '--pa-surface-sunken', TEXT, 'Sekundärtext Rastertönung'],
  ['--pa-muted', '--pa-surface-raised', TEXT, 'Sekundärtext Menü'],
  ['--pa-muted', '--pa-hover', TEXT, 'Sekundärtext Zeilen-Hover'],
  ['--pa-header-text', '--pa-header-bg', TEXT, 'Schrift auf dem Kopf (Teal-Vollton)'],
  ['--pa-marker-text', '--pa-marker', TEXT, 'Schrift auf Marker-Gelb'],
  ['--pa-ink', '--pa-marker-soft', TEXT, 'Tusche auf Marker hell (Treffer)'],
  ['--pa-ink', '--pa-raised-hover', TEXT, 'Menüeintrag Hover/Fokus'],
  ['--pa-muted', '--pa-raised-hover', TEXT, 'Tastenkürzel im Menü-Hover'],
  ['--pa-placeholder', '--pa-field', TEXT, 'Platzhalter'],
  ['--pa-ink', '--pa-field', TEXT, 'Feldtext'],
  ['--pa-ink', '--pa-field-readonly', TEXT, 'Feldtext readonly'],
  ['--pa-link-text', '--pa-surface', TEXT, 'Link'],
  ['--pa-accent-text', '--pa-surface', TEXT, 'Teal-Text Papier'],
  ['--pa-accent-text', '--pa-sheet', TEXT, 'Teal-Text Bogen'],
  ['--pa-accent-text', '--pa-surface-raised', TEXT, 'Teal-Text Menü'],
  ['--pa-accent-text', '--pa-accent-tint', TEXT, 'Akzent-Text auf Tönung'],
  ['--pa-accent-on', '--pa-accent', TEXT, 'Primär-Button'],
  ['--pa-accent-on', '--pa-accent-hover', TEXT, 'Primär-Button Hover'],
  ['--pa-accent-on', '--pa-accent-press', TEXT, 'Primär-Button gedrückt'],
  ['--pa-selection-text', '--pa-selection', TEXT, '::selection'],
  ['--pa-required-color', '--pa-surface', TEXT, 'Pflicht-Markierung'],
  ['--pa-required-color', '--pa-surface-sunken', TEXT, 'Pflicht-Markierung abgesenkt'],
  ['--pa-tooltip-text', '--pa-tooltip-bg', TEXT, 'Tooltip'],
  ['--pa-edge', '--pa-surface', UI, 'Feldkante/Papier (1.4.11)'],
  ['--pa-edge', '--pa-surface-sunken', UI, 'Feldkante/Rastertönung'],
  ['--pa-edge', '--pa-field', UI, 'Feldkante/Feld'],
  ['--pa-edge', '--pa-surface-raised', UI, 'Feldkante/Dialog'],
  ['--pa-focus-ring-color', '--pa-surface', UI, 'Fokus auf Papier'],
  ['--pa-focus-ring-color', '--pa-sheet', UI, 'Fokus auf Bogen'],
  ['--pa-header-text', '--pa-header-bg', UI, 'Fokus auf dem Kopf (Ring in Papierfarbe)'],
  ['--pa-focus-ring-color', '--pa-surface-sunken', UI, 'Fokus Rastertönung'],
  ['--pa-focus-ring-color', '--pa-surface-raised', UI, 'Fokus in Menü/Dialog'],
  ['--pa-focus-ring-color', '--pa-soft', UI, 'Fokus neben Sekundär-Button'],
  ['--pa-focus-ring-color', '--pa-field', UI, 'Fokus-Feldkante/Feld'],
  ['--pa-focus-ring-color', '--pa-focus-gap', UI, 'Doppelring innen/außen'],
  ['--pa-focus-ring-color', '--pa-raised-hover', UI, 'Fokus-Innenring auf Menü-Hover'],
  ['--pa-accent-text', '--pa-raised-hover', UI, 'Häkchen/Radio im Menü-Hover (Marke)'],
  ['--pa-link-underline', '--pa-surface', UI, 'Link-Unterstrich'],
  ['--pa-link-underline', '--pa-surface-sunken', UI, 'Link-Unterstrich Rastertönung'],
  ['--pa-link-underline-hover', '--pa-surface', UI, 'Link-Unterstrich Hover'],
  ['--pa-accent', '--pa-surface', UI, 'Teal-Vollton gegen Papier (Druckmarke, Hot-Button)'],
  ['--pa-accent', '--pa-sheet', UI, 'Teal-Vollton gegen Bogen'],
];
// Code (bridge.css §17): Code-Blöcke liegen auf Papier/Rastertönung (pre, Markdown), in Dialogen
// auf der schwebenden Fläche, im Markdown-Editor auf der Feldfläche.
for (const fg of ['--pa-code-keyword', '--pa-code-string', '--pa-code-number', '--pa-muted', '--pa-danger-text']) {
  const role = fg === '--pa-muted' ? 'Code-Kommentar' : fg === '--pa-danger-text' ? 'Code gelöscht (diff)' : `Code ${fg.slice(10)}`;
  for (const [bg, where] of [['--pa-surface', 'Papier'], ['--pa-surface-sunken', 'Rastertönung'], ['--pa-surface-raised', 'Dialog'], ['--pa-field', 'Markdown-Editor']]) {
    if (fg === '--pa-muted' && bg !== '--pa-field') continue;            // Papier/Raster/Menü stehen schon oben
    if (fg === '--pa-danger-text' && bg !== '--pa-surface-raised' && bg !== '--pa-field') continue;
    PAIRS.push([fg, bg, TEXT, `${role} (${where})`]);
  }
}
for (const s of ['success', 'warning', 'danger', 'info']) {
  PAIRS.push([`--pa-${s}-on`, `--pa-${s}`, TEXT, `${s}-Fläche`]);
  if (s !== 'info') PAIRS.push([`--pa-${s}-on`, `--pa-${s}-hover`, TEXT, `${s}-Fläche Hover`]);   // Info-Buttons gibt es im UT nicht
  PAIRS.push([`--pa-${s}-text`, '--pa-surface', TEXT, `${s}-Text Papier`]);
  PAIRS.push([`--pa-${s}-text`, '--pa-sheet', TEXT, `${s}-Text Bogen`]);
  PAIRS.push([`--pa-${s}-text`, '--pa-surface-sunken', TEXT, `${s}-Text Rastertönung`]);
  PAIRS.push([`--pa-${s}-text`, `--pa-${s}-tint`, TEXT, `${s}-Text auf Tönung`]);
  PAIRS.push(['--pa-ink', `--pa-${s}-tint`, TEXT, `Text auf ${s}-Tönung`]);
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
  // Papier/Bogen: der Bogen (Tabellen, Karten, Felder) muss sich vom Papier abheben
  const ps = contrast(col(mode, '--pa-surface'), col(mode, '--pa-sheet'));
  console.log(`  Papier/Bogen ${ps.toFixed(2)}:1`);
  if (ps < 1.08) fail(`${mode}: Papier/Bogen ${ps.toFixed(2)} < 1.08`);
  table.push({ mode, fg: '--pa-sheet', bg: '--pa-surface', r: ps, min: 1.08, role: 'Bogen gegen Papier' });
  // Kopf-Raster (shell.css §1): Pink-Punkte im Überdruck (--pa-overprint: multiply hell, screen nachts) mit dem
  // Kopf, Maske bis HEADER_DOTS_PEAK Deckung. Die Navbar steht genau dort – ihre Schrift muss auch über einem vollen
  // Punktkern >= 4,5:1 halten, ebenso auf den Tasten-Flächen (--pa-header-hover/-press) darüber.
  {
    const bg = col(mode, '--pa-header-bg'), dots = col(mode, '--pa-header-dots'), txt = col(mode, '--pa-header-text');
    const blend = T[mode]['--pa-overprint'];
    const ch = (b, d) => blend === 'screen' ? b + HEADER_DOTS_PEAK * d * (255 - b) / 255 : b * (1 - HEADER_DOTS_PEAK + HEADER_DOTS_PEAK * d / 255);
    const core = { r: ch(bg.r, dots.r), g: ch(bg.g, dots.g), b: ch(bg.b, dots.b), a: 1 };
    const key = (name, base) => { const c = col(mode, name); return (c.a ?? 1) < 1 ? over(c, base) : c; };
    for (const [b, role] of [[core, 'Kopfschrift über Raster-Punktkern'], [key('--pa-header-hover', core), 'Kopfschrift Hover über Raster'], [key('--pa-header-press', core), 'Kopfschrift gedrückt über Raster'],
      [key('--pa-header-hover', bg), 'Kopfschrift Hover'], [key('--pa-header-press', bg), 'Kopfschrift gedrückt']]) {
      const r = contrast(txt, b);
      table.push({ mode, fg: '--pa-header-text', bg: role.includes('Raster') ? '--pa-header-dots' : role.includes('Hover') ? '--pa-header-hover' : '--pa-header-press', r, min: TEXT, role });
      if (r < TEXT) fail(`${mode}: ${role} = ${r.toFixed(2)} < ${TEXT} (Punktkern ${hex(core)}, ${blend}, ${HEADER_DOTS_PEAK * 100} %)`);
    }
    console.log(`  Kopf-Raster: Punktkern ${hex(core)} (${blend}, ${Math.round(HEADER_DOTS_PEAK * 100)} %), Kopfschrift darauf ${contrast(txt, core).toFixed(2)}:1, Punkt gegen Kopf ${contrast(core, bg).toFixed(2)}:1`);
  }
  // Flächenstufen (keine WCAG-Pflicht; nur der Hover auf schwebenden Ebenen hat ein Minimum:
  // sichtbar wie die Sekundär-Fläche hell auf Weiß – --pa-soft hätte dunkel nur 1.13, --pa-hover 1.02)
  const HOVER_RAISED = 1.15;
  for (const [x, y, role, min = 0] of [['--pa-line', '--pa-surface', 'Haarlinie'], ['--pa-line-strong', '--pa-surface', 'kräftige Linie'], ['--pa-head-rule', '--pa-sheet', 'Tabellenkopf-Grundlinie'], ['--pa-soft', '--pa-surface', 'Rastertönung (Sekundär-Fläche)'], ['--pa-surface-sunken', '--pa-surface', 'abgesenkte Rastertönung', 1.08], ['--pa-plate', '--pa-surface', 'Pink-Platte gegen Papier'], ['--pa-header-bg', '--pa-surface', 'Kopf gegen Papier'], ['--pa-raised-hover', '--pa-surface-raised', 'Hover auf schwebender Fläche', HOVER_RAISED]]) {
    const r = contrast(col(mode, x), col(mode, y));
    table.push({ mode, fg: x, bg: y, r, min, role });
    console.log(`  ${role}: ${r.toFixed(2)}:1`);
    if (r < min) fail(`${mode}: ${x} auf ${y} = ${r.toFixed(2)} < ${min} (${role})`);
  }
  // Grundfläche: an der Wurzel = Papier, die Fokus-Lücke folgt ihr
  if (hex(col(mode, '--pa-ground')) !== hex(col(mode, '--pa-surface'))) fail(`${mode}: --pa-ground ≠ --pa-surface an der Wurzel`);
  if (T[mode]['--pa-focus-gap'] !== 'var(--pa-ground)') fail(`${mode}: --pa-focus-gap muss var(--pa-ground) sein (bridge §18 setzt den Grund in schwebenden Ebenen)`);
  // Danger vs Pink-Platte: die Platte liegt unter jedem Hot-Button – sie darf nicht nach Gefahr aussehen
  {
    const d = col(mode, '--pa-danger'), pl = col(mode, '--pa-plate');
    const dP = ['normal', 'protan', 'deutan', 'tritan'].map((t) => deltaE2000(t === 'normal' ? d : simulate(d, t), t === 'normal' ? pl : simulate(pl, t)));
    console.log(`  Danger ${hex(d)} vs Pink-Platte ${hex(pl)}: ΔE00 normal/protan/deutan/tritan ${dP.map((x) => x.toFixed(1)).join(' / ')}`);
    if (dP[0] < 15) fail(`${mode}: Danger/Platte zu ähnlich (ΔE normal ${dP[0].toFixed(1)} < 15)`);
  }
  // Danger vs Akzent
  const d = col(mode, '--pa-danger'), acc = col(mode, '--pa-accent');
  const ld = luminance(d), la = luminance(acc);
  const dE = ['normal', 'protan', 'deutan', 'tritan'].map((t) => deltaE2000(t === 'normal' ? d : simulate(d, t), t === 'normal' ? acc : simulate(acc, t)));
  const lr = (Math.max(ld, la) + 0.05) / (Math.min(ld, la) + 0.05);
  console.log(`  Danger ${hex(d)} vs Akzent ${hex(acc)}: ΔE00 normal/protan/deutan/tritan ${dE.map((x) => x.toFixed(1)).join(' / ')}, Helligkeit L ${ld.toFixed(3)} vs ${la.toFixed(3)} (${lr.toFixed(2)}:1)`);
  if (Math.min(dE[0], dE[1], dE[2]) < 20) fail(`${mode}: Danger/Akzent zu ähnlich (ΔE < 20)`);
  if (lr < 1.2) fail(`${mode}: Danger/Akzent Helligkeit zu gleich (${lr.toFixed(2)})`);
  const dt = col(mode, '--pa-danger-text'), at = col(mode, '--pa-accent-text');
  const dEt = ['normal', 'protan', 'deutan'].map((t) => deltaE2000(t === 'normal' ? dt : simulate(dt, t), t === 'normal' ? at : simulate(at, t)));
  console.log(`  Danger-Text vs Akzent-Text: ΔE00 ${dEt.map((x) => x.toFixed(1)).join(' / ')}`);

  // Kategorie-Palette
  const ORDER = [1, 4, 7, 9, 12, 3, 8, 10, 2, 5, 11, 6];
  const surf = col(mode, '--pa-surface');
  const catMin = mode === 'light' ? 2.4 : 3.3;
  for (let n = 1; n <= 15; n++) {
    const c = col(mode, `--pa-cat-${n}`), o = col(mode, `--pa-cat-${n}-on`);
    const rb = contrast(c, surf), ro = contrast(o, c);
    if (rb < catMin) fail(`${mode}: --pa-cat-${n} gegen Papier ${rb.toFixed(2)} < ${catMin}`);
    if (ro < TEXT) fail(`${mode}: --pa-cat-${n}-on ${ro.toFixed(2)} < 4.5`);
  }
  for (const k of [6, 8]) {
    const res = [];
    for (const t of ['normal', 'protan', 'deutan', 'tritan']) {
      let min = 1e9, p;
      const set = ORDER.slice(0, k);
      for (let i = 0; i < set.length; i++) for (let j = i + 1; j < set.length; j++) {
        const x = col(mode, `--pa-cat-${set[i]}`), y = col(mode, `--pa-cat-${set[j]}`);
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
    const c = col(mode, `--pa-cat-${n}`);
    w16 = Math.min(w16, contrast(mix(c, '#FFFFFF', 0.6), col(mode, '--pa-on-light')));
    w31 = Math.min(w31, contrast(mix(c, '#000000', 0.55), col(mode, '--pa-on-dark')));
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
    const c = col(mode, `--pa-cat-${n}`);
    for (const [k, d] of [[n + 15, mix(c, '#FFFFFF', 0.6)], [n + 30, mix(c, '#000000', 0.55)]]) {
      const dmin = Math.min(...BLUES.map((x) => deltaE2000(d, x)));
      if (dmin < 12) fail(`${mode}: --u-color-${k} ${hex(d)} liegt nahe Oracle-Blau (ΔE00 ${dmin.toFixed(1)})`);
    }
  }
}

// Schwebende Ebenen (bridge.css §18): die dort neu aufgelösten Fokus-Schatten müssen dieselben
// Formeln tragen wie tokens/scale.css – sonst sähe der Ring in Menüs/Dialogen anders aus als auf dem Papier.
{
  const strip = (f) => fs.readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const decl = (src, name) => [...src.matchAll(new RegExp(`${name}\\s*:\\s*([^;]+);`, 'g'))].map((m) => m[1].replace(/\s+/g, ' ').trim());
  const scale = strip(path.join(dir, 'scale.css'));
  const bridge = strip(path.join(ROOT, 'Passer', 'src', 'bridge.css'));
  const block = (bridge.match(/([^{}]+)\{[^{}]*--pa-ground\s*:\s*var\(--pa-surface-raised\)[^{}]*\}/) || [])[0];
  if (!block) fail('bridge.css §18: Regel mit --pa-ground: var(--pa-surface-raised) fehlt');
  else {
    for (const n of ['--pa-focus-shadow', '--pa-focus-shadow-inset']) {
      const [s] = decl(scale, n), [b] = decl(block, n);
      if (!b) fail(`bridge.css §18: ${n} fehlt (Lücke würde in schwebenden Ebenen nicht neu aufgelöst)`);
      else if (s !== b) fail(`bridge.css §18: ${n} weicht von tokens/scale.css ab`);
    }
    if (decl(block, '--pa-focus-gap')[0] !== 'var(--pa-ground)') fail('bridge.css §18: --pa-focus-gap muss var(--pa-ground) sein');
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
    const l = col('light', `--pa-cat-${n}`), d = col('dark', `--pa-cat-${n}`);
    if (toLch(l).C < 10 || toLch(d).C < 10) continue;
    const hl = hslHue(l), hd = hslHue(d);
    const dh = Math.abs(((hd - hl + 540) % 360) - 180);
    if (dh > worst) { worst = dh; wn = n; }
    if (dh > HUE_MAX) fail(`--pa-cat-${n}: Farbton hell ${hl.toFixed(0)}° ↔ dunkel ${hd.toFixed(0)}° (Δ ${dh.toFixed(0)}° > ${HUE_MAX}°)`);
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
fs.mkdirSync(path.join(ROOT, '_tmp', 'passer'), { recursive: true });
fs.writeFileSync(path.join(ROOT, '_tmp', 'passer', 'contrast-table.json'), JSON.stringify(table.map((t) => ({ ...t, r: +t.r.toFixed(2) })), null, 1));
console.log(fails ? `\n${fails} Fehler` : '\nOK – alle Prüfungen bestanden');
process.exit(fails ? 1 : 0);
