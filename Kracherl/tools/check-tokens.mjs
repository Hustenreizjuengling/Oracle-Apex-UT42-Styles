// Prüft die Farb-Tokens von Kracherl direkt aus den Quellen (src/tokens/light.css, dark.css):
//  - gleiche Token-Namen in beiden Dateien
//  - Kontraste (Text >= 4.5, UI/Fokus >= 3) – auch auf dem Band (Kopf) und dem Etikett
//  - Stufen: Region gegen Seitengrund (dunkel >= 1.25), Hover auf schwebender Fläche >= 1.15
//  - Danger vs. Akzent (Farbton UND Helligkeit, normal + Protan/Deutan/Tritan)
//  - Fokus-Orange vs. Danger-Rot (ΔE unter Farbfehlsichtigkeit, zur Dokumentation) und die Regel, die
//    den Fokus fehlerhafter Felder über die Form unterscheidet (forms.css §3: abgesetzter Ring)
//  - Kategorie-Palette (Kontrast, CVD-Unterscheidbarkeit in Chart-Reihenfolge, abgeleitete 16–45,
//    Abstand zum Akzent ΔE00 >= 20, gleicher Farbton hell/dunkel, KEINE Wellen-Farbfolge
//    Gelb–Orange–Rot–Pink–Lila in den ersten fünf Serien)
//  - Code-Farben (--kr-code-*, Prism-Kommentar) auf allen Flächen, auf denen Code steht
//  - Abstand aller Farben zu Oracle-Blau (ΔE00 >= 12)
//   node Kracherl/tools/check-tokens.mjs [--table]   (--table: Markdown-Tabelle der Kontrastpaare)
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../../_tools/config.mjs';
import { parseColor, contrast, deltaE2000, simulate, luminance, hex, mix, over, toLch } from '../../_tools/lib/color.mjs';

const dir = path.join(ROOT, 'Kracherl', 'src', 'tokens');
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
// halbtransparente Flächen auf ihren Untergrund legen (Band-Hover auf dem Band, sonst auf der Region)
const BASE_OF = { '--kr-band-hover': '--kr-band', '--kr-band-press': '--kr-band', '--kr-page-hover': '--kr-page', '--kr-page-press': '--kr-page' };
const on = (mode, fg, bgName) => {
  const bg = col(mode, bgName);
  const base = (bg.a ?? 1) < 1 ? over(bg, col(mode, BASE_OF[bgName] || '--kr-surface')) : bg;
  const f = col(mode, fg);
  return { f: (f.a ?? 1) < 1 ? over(f, base) : f, bg: base };
};

const TEXT = 4.5, UI = 3;
const PAIRS = [
  // [Vordergrund, Hintergrund, Minimum, Rolle]
  ['--kr-ink', '--kr-surface', TEXT, 'Text auf Region'],
  ['--kr-ink', '--kr-page', TEXT, 'Text auf Seitengrund'],
  ['--kr-ink', '--kr-surface-sunken', TEXT, 'Text abgesenkt'],
  ['--kr-ink', '--kr-surface-raised', TEXT, 'Text in Menü/Dialog'],
  ['--kr-ink', '--kr-soft', TEXT, 'Text auf Lavendel-Pille'],
  ['--kr-ink', '--kr-soft-hover', TEXT, 'Text auf Lavendel-Pille Hover'],
  ['--kr-ink', '--kr-accent-tint', TEXT, 'Auswahl-Zeile'],
  ['--kr-ink', '--kr-accent-tint-2', TEXT, 'Auswahl kräftig'],
  ['--kr-ink-2', '--kr-surface', TEXT, 'Label'],
  ['--kr-ink-2', '--kr-page', TEXT, 'Nav-Text auf Seitengrund'],
  ['--kr-ink-2', '--kr-page-hover', TEXT, 'Nav-Text Hover'],
  ['--kr-heading', '--kr-surface', TEXT, 'Titel auf Region'],
  ['--kr-heading', '--kr-page', TEXT, 'Seitentitel auf Seitengrund'],
  ['--kr-heading', '--kr-surface-raised', TEXT, 'Dialog-Titel'],
  ['--kr-brand-ink', '--kr-surface', TEXT, 'Markentinte auf Region (aktiver Tab, Icons)'],
  ['--kr-brand-ink', '--kr-page', TEXT, 'Markentinte auf Seitengrund (Tabs, Nav-Icons)'],
  ['--kr-brand-ink', '--kr-surface-sunken', TEXT, 'Tabellenkopf (Lavendel-Band)'],
  ['--kr-brand-ink', '--kr-surface-raised', TEXT, 'Markentinte in Menü/Dialog'],
  ['--kr-brand-ink', '--kr-soft', TEXT, 'Sekundär-Button (Markentinte auf Lavendel)'],
  ['--kr-brand-ink', '--kr-soft-hover', TEXT, 'Sekundär-Button Hover'],
  ['--kr-brand-ink', '--kr-soft-press', TEXT, 'Sekundär-Button gedrückt'],
  ['--kr-page', '--kr-brand-ink', TEXT, 'Zähler in der Navigation (Seitengrund auf Markentinte)'],
  ['--kr-muted', '--kr-surface', TEXT, 'Sekundärtext'],
  ['--kr-muted', '--kr-surface-sunken', TEXT, 'Sekundärtext abgesenkt'],
  ['--kr-muted', '--kr-surface-raised', TEXT, 'Sekundärtext Menü'],
  ['--kr-muted', '--kr-page', TEXT, 'Sekundärtext Seitengrund (Breadcrumb, Footer)'],
  ['--kr-muted', '--kr-hover', TEXT, 'Sekundärtext Zeilen-Hover'],
  ['--kr-muted', '--kr-soft', TEXT, 'Sekundärtext auf Lavendel (IR-Ansichten)'],
  ['--kr-ink', '--kr-raised-hover', TEXT, 'Menüeintrag Hover/Fokus'],
  ['--kr-muted', '--kr-raised-hover', TEXT, 'Tastenkürzel im Menü-Hover'],
  ['--kr-placeholder', '--kr-field', TEXT, 'Platzhalter'],
  ['--kr-ink', '--kr-field', TEXT, 'Feldtext'],
  ['--kr-ink', '--kr-field-readonly', TEXT, 'Feldtext readonly'],
  ['--kr-link-text', '--kr-surface', TEXT, 'Link'],
  ['--kr-link-text', '--kr-page', TEXT, 'Link auf Seitengrund'],
  ['--kr-accent-text', '--kr-surface', TEXT, 'Akzent-Text Region'],
  ['--kr-accent-text', '--kr-surface-raised', TEXT, 'Akzent-Text Menü'],
  ['--kr-accent-text', '--kr-page', TEXT, 'Akzent-Text Seitengrund'],
  ['--kr-accent-on', '--kr-accent', TEXT, 'Primär-Button (Etikett)'],
  ['--kr-accent-on', '--kr-accent-hover', TEXT, 'Primär-Button Hover'],
  ['--kr-accent-on', '--kr-accent-press', TEXT, 'Primär-Button gedrückt'],
  ['--kr-selection-text', '--kr-selection', TEXT, '::selection'],
  ['--kr-required-color', '--kr-surface', TEXT, 'Pflicht-Markierung'],
  ['--kr-required-color', '--kr-surface-sunken', TEXT, 'Pflicht-Markierung abgesenkt'],
  ['--kr-tooltip-text', '--kr-tooltip-bg', TEXT, 'Tooltip'],
  // Band (Kopf) und Etikett
  ['--kr-band-ink', '--kr-band', TEXT, 'Text/Icons auf dem Band'],
  ['--kr-band-ink', '--kr-band-hover', TEXT, 'Header-Button Hover'],
  ['--kr-band-ink', '--kr-band-press', TEXT, 'Header-Button gedrückt'],
  ['--kr-band-brand', '--kr-band', TEXT, 'Logo auf dem Band'],
  ['--kr-band', '--kr-band-ink', TEXT, 'aktueller Menüeintrag (Band-Farbe auf Tinte)'],
  ['--kr-sun-ink', '--kr-sun', TEXT, 'Etikett: aktueller Nav-Eintrag, aktive Seite'],
  ['--kr-focus-ring-color', '--kr-band', UI, 'Fokus auf dem Band'],
  // Felder, Fokus, Marken
  ['--kr-edge', '--kr-surface', UI, 'Feldkante/Region (1.4.11)'],
  ['--kr-edge', '--kr-surface-sunken', UI, 'Feldkante/abgesenkt'],
  ['--kr-edge', '--kr-field', UI, 'Feldkante/Feld'],
  ['--kr-edge', '--kr-surface-raised', UI, 'Feldkante/Dialog'],
  ['--kr-edge', '--kr-page', UI, 'Feldkante/Seitengrund'],
  ['--kr-edge', '--kr-soft', UI, 'Kontur der Radio-Leiste (Radio Group As Buttons) innen'],
  ['--kr-focus-ring-color', '--kr-surface', UI, 'Fokus auf Region'],
  ['--kr-focus-ring-color', '--kr-page', UI, 'Fokus auf Seitengrund'],
  ['--kr-focus-ring-color', '--kr-surface-sunken', UI, 'Fokus abgesenkt'],
  ['--kr-focus-ring-color', '--kr-surface-raised', UI, 'Fokus in Menü/Dialog'],
  ['--kr-focus-ring-color', '--kr-soft', UI, 'Fokus neben Sekundär-Button'],
  ['--kr-focus-ring-color', '--kr-field', UI, 'Fokus-Feldkante/Feld'],
  ['--kr-focus-ring-color', '--kr-focus-gap', UI, 'Doppelring innen/außen'],
  ['--kr-focus-ring-color', '--kr-raised-hover', UI, 'Fokus-Innenring auf Menü-Hover'],
  ['--kr-mark', '--kr-surface', UI, 'Orange-Marke auf Region (aktiver Tab, heute)'],
  ['--kr-mark', '--kr-page', UI, 'Orange-Marke auf Seitengrund'],
  ['--kr-mark', '--kr-surface-raised', UI, 'Orange-Marke in Menü/Dialog'],
  ['--kr-accent-text', '--kr-raised-hover', UI, 'Häkchen/Radio im Menü-Hover (Marke)'],
  ['--kr-link-underline', '--kr-surface', UI, 'Link-Unterstrich'],
  ['--kr-link-underline', '--kr-surface-sunken', UI, 'Link-Unterstrich abgesenkt'],
  ['--kr-link-underline-hover', '--kr-surface', UI, 'Link-Unterstrich Hover'],
];
// Code (bridge.css §17): Code-Blöcke liegen auf Region/abgesenkt (pre, Markdown), in Dialogen
// auf der schwebenden Fläche, im Markdown-Editor auf der Feldfläche.
for (const fg of ['--kr-code-keyword', '--kr-code-string', '--kr-code-number', '--kr-muted', '--kr-danger-text']) {
  const role = fg === '--kr-muted' ? 'Code-Kommentar' : fg === '--kr-danger-text' ? 'Code gelöscht (diff)' : `Code ${fg.slice(10)}`;
  for (const [bg, where] of [['--kr-surface', 'Region'], ['--kr-surface-sunken', 'abgesenkt'], ['--kr-surface-raised', 'Dialog'], ['--kr-field', 'Markdown-Editor']]) {
    if (fg === '--kr-muted' && bg !== '--kr-field') continue;
    if (fg === '--kr-danger-text' && bg !== '--kr-surface-raised' && bg !== '--kr-field') continue;
    PAIRS.push([fg, bg, TEXT, `${role} (${where})`]);
  }
}
for (const s of ['success', 'warning', 'danger', 'info']) {
  PAIRS.push([`--kr-${s}-on`, `--kr-${s}`, TEXT, `${s}-Fläche`]);
  PAIRS.push([`--kr-${s}-on`, `--kr-${s}-hover`, TEXT, `${s}-Fläche Hover`]);
  PAIRS.push([`--kr-${s}-text`, '--kr-surface', TEXT, `${s}-Text Region`]);
  PAIRS.push([`--kr-${s}-text`, '--kr-surface-sunken', TEXT, `${s}-Text abgesenkt`]);
  PAIRS.push([`--kr-${s}-text`, `--kr-${s}-tint`, TEXT, `${s}-Text auf Tönung`]);
  PAIRS.push(['--kr-ink', `--kr-${s}-tint`, TEXT, `Text auf ${s}-Tönung`]);
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
  // Flächenstufen (keine WCAG-Pflicht): Region gegen Seitengrund muss dunkel als Karte lesbar sein,
  // der Hover auf schwebenden Ebenen sichtbar wie die Lavendel-Pille hell auf Weiß.
  const STEP = { '--kr-surface|--kr-page': mode === 'dark' ? 1.25 : 0 };
  const HOVER_RAISED = 1.15;
  for (const [x, y, role, min = 0] of [
    ['--kr-surface', '--kr-page', 'Region gegen Seitengrund', STEP['--kr-surface|--kr-page']],
    ['--kr-band', '--kr-page', 'Band gegen Seitengrund (Wellenkante)', 1.2],
    ['--kr-sun', '--kr-page', 'Etikett gegen Seitengrund'],
    ['--kr-line', '--kr-surface', 'Haarlinie'],
    ['--kr-line', '--kr-page', 'Region-Kante gegen Seitengrund'],
    ['--kr-line-strong', '--kr-surface', 'kräftige Linie'],
    ['--kr-surface-sunken', '--kr-surface', 'Lavendel-Band (Tabellenkopf)'],
    ['--kr-soft', '--kr-surface', 'Lavendel-Pille'],
    ['--kr-accent', '--kr-surface', 'Primär-Fläche'],
    ['--kr-raised-hover', '--kr-surface-raised', 'Hover auf schwebender Fläche', HOVER_RAISED],
  ]) {
    const r = contrast(col(mode, x), col(mode, y));
    table.push({ mode, fg: x, bg: y, r, min, role });
    console.log(`  ${role}: ${r.toFixed(2)}:1`);
    if (r < min) fail(`${mode}: ${x} auf ${y} = ${r.toFixed(2)} < ${min} (${role})`);
  }
  // Grundfläche: an der Wurzel = Region, die Fokus-Lücke folgt ihr
  if (hex(col(mode, '--kr-ground')) !== hex(col(mode, '--kr-surface'))) fail(`${mode}: --kr-ground ≠ --kr-surface an der Wurzel`);
  if (T[mode]['--kr-focus-gap'] !== 'var(--kr-ground)') fail(`${mode}: --kr-focus-gap muss var(--kr-ground) sein (bridge §18 setzt den Grund in schwebenden Ebenen)`);
  // Danger vs Akzent (Primäraktion) und vs Marke (Orange)
  const d = col(mode, '--kr-danger');
  for (const other of ['--kr-accent', '--kr-mark']) {
    const acc = col(mode, other);
    const ld = luminance(d), la = luminance(acc);
    const dE = ['normal', 'protan', 'deutan', 'tritan'].map((t) => deltaE2000(t === 'normal' ? d : simulate(d, t), t === 'normal' ? acc : simulate(acc, t)));
    const lr = (Math.max(ld, la) + 0.05) / (Math.min(ld, la) + 0.05);
    console.log(`  Danger ${hex(d)} vs ${other} ${hex(acc)}: ΔE00 normal/protan/deutan/tritan ${dE.map((x) => x.toFixed(1)).join(' / ')}, Helligkeit ${lr.toFixed(2)}:1`);
    if (other === '--kr-accent' && Math.min(dE[0], dE[1], dE[2]) < 20) fail(`${mode}: Danger/Akzent zu ähnlich (ΔE < 20)`);
    if (other === '--kr-accent' && lr < 1.2) fail(`${mode}: Danger/Akzent Helligkeit zu gleich (${lr.toFixed(2)})`);
    if (other === '--kr-mark' && dE[0] < 10) fail(`${mode}: Danger/Orange-Marke zu ähnlich (ΔE ${dE[0].toFixed(1)} < 10)`);
  }
  // Fokus vs Danger: bei Deutan/Tritan nah beieinander – nur dokumentiert; die Unterscheidung trägt die
  // Form (fehlerhaftes Feld mit Fokus: rote Kante + abgesetzter Ring, geprüft unten)
  {
    const fr = col(mode, '--kr-focus-ring-color');
    const dE = ['normal', 'protan', 'deutan', 'tritan'].map((t) => deltaE2000(t === 'normal' ? d : simulate(d, t), t === 'normal' ? fr : simulate(fr, t)));
    console.log(`  Fokus ${hex(fr)} vs Danger ${hex(d)}: ΔE00 normal/protan/deutan/tritan ${dE.map((x) => x.toFixed(1)).join(' / ')} → Unterscheidung über die Form (forms.css §3)`);
  }
  // Warnung vs Band: Warn-Flächen dürfen nicht wie der Kopf aussehen
  {
    const w = col(mode, '--kr-warning'), band = col(mode, '--kr-band');
    const dw = deltaE2000(w, band);
    console.log(`  Warnung ${hex(w)} vs Band ${hex(band)}: ΔE00 ${dw.toFixed(1)}`);
    if (mode === 'light' && dw < 8) fail(`${mode}: Warnung liegt zu nah am Band (ΔE ${dw.toFixed(1)} < 8)`);
  }

  // Kategorie-Palette
  const ORDER = [1, 4, 7, 9, 12, 3, 8, 10, 2, 5, 11, 6];
  const surf = col(mode, '--kr-surface');
  const catMin = mode === 'light' ? 2.4 : 3.3;
  for (let n = 1; n <= 15; n++) {
    const c = col(mode, `--kr-cat-${n}`), o = col(mode, `--kr-cat-${n}-on`);
    const rb = contrast(c, surf), ro = contrast(o, c);
    if (rb < catMin) fail(`${mode}: --kr-cat-${n} gegen Region ${rb.toFixed(2)} < ${catMin}`);
    if (ro < TEXT) fail(`${mode}: --kr-cat-${n}-on ${ro.toFixed(2)} < 4.5`);
  }
  // Akzent-Abstand: keine Kategorie darf sich als Primäraktion/Auswahl-Marke lesen
  {
    const acc = col(mode, '--kr-accent'), accT = col(mode, '--kr-accent-text');
    let min = 1e9, which;
    for (let n = 1; n <= 15; n++) {
      const x = col(mode, `--kr-cat-${n}`);
      const dd = Math.min(deltaE2000(x, acc), deltaE2000(x, accT));
      if (dd < min) { min = dd; which = n; }
      if (dd < 20) fail(`${mode}: --kr-cat-${n} ${hex(x)} liegt ΔE00 ${dd.toFixed(1)} am Akzent (< 20)`);
    }
    console.log(`  Kategorie ↔ Akzent/Akzent-Text min ΔE00 ${min.toFixed(1)} (cat-${which})`);
  }
  // Wellen-Farbfolge: die ersten fünf Chart-Serien dürfen nicht die Folge Gelb–Orange–Rot–Pink–Lila bilden
  {
    const hueName = (c) => {
      const { h, C } = toLch(c);
      if (C < 15) return 'grau';
      if (h >= 70 && h < 105) return 'gelb';
      if (h >= 45 && h < 70) return 'orange';
      if (h >= 20 && h < 45) return 'rot';
      if (h >= 345 || h < 20) return 'pink';
      if (h >= 290 && h < 345) return 'lila';
      return 'andere';
    };
    const seq = ORDER.slice(0, 5).map((n) => hueName(col(mode, `--kr-cat-${n}`)));
    const MARK = ['gelb', 'orange', 'rot', 'pink', 'lila'];
    // längste zusammenhängende Teilfolge, deren Glieder in der Reihenfolge Gelb–Orange–Rot–Pink–Lila aufeinander folgen
    const run = (arr) => {
      let best = 0, cur = 0;
      for (let i = 0; i < arr.length; i++) {
        const idx = MARK.indexOf(arr[i]);
        cur = idx < 0 ? 0 : (i > 0 && MARK.indexOf(arr[i - 1]) === idx - 1 && cur > 0 ? cur + 1 : 1);
        best = Math.max(best, cur);
      }
      return best;
    };
    const longest = run(seq);
    console.log(`  Serien 1–5 Farbfamilien: ${seq.join(' · ')} (längste Teilfolge Gelb–Orange–Rot–Pink–Lila: ${longest})`);
    if (longest >= 3) fail(`${mode}: Chart-Serien bilden eine Teilfolge der geschützten Welle (${longest} Glieder)`);
  }
  for (const k of [6, 8]) {
    const res = [];
    for (const t of ['normal', 'protan', 'deutan', 'tritan']) {
      let min = 1e9, p;
      const set = ORDER.slice(0, k);
      for (let i = 0; i < set.length; i++) for (let j = i + 1; j < set.length; j++) {
        const x = col(mode, `--kr-cat-${set[i]}`), y = col(mode, `--kr-cat-${set[j]}`);
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
    const c = col(mode, `--kr-cat-${n}`);
    w16 = Math.min(w16, contrast(mix(c, '#FFFFFF', 0.6), col(mode, '--kr-on-light')));
    w31 = Math.min(w31, contrast(mix(c, '#000000', 0.55), col(mode, '--kr-on-dark')));
  }
  console.log(`  --u-color-16…30 (60 % + Weiß) mit Tinte min ${w16.toFixed(2)}; 31…45 (55 % + Schwarz) mit Weiß min ${w31.toFixed(2)}`);
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
  for (let n = 1; n <= 15; n++) {
    const c = col(mode, `--kr-cat-${n}`);
    for (const [k, dd] of [[n + 15, mix(c, '#FFFFFF', 0.6)], [n + 30, mix(c, '#000000', 0.55)]]) {
      const dmin = Math.min(...BLUES.map((x) => deltaE2000(dd, x)));
      if (dmin < 12) fail(`${mode}: --u-color-${k} ${hex(dd)} liegt nahe Oracle-Blau (ΔE00 ${dmin.toFixed(1)})`);
    }
  }
}

// Schwebende Ebenen (bridge.css §18): die dort neu aufgelösten Fokus-Schatten müssen dieselben
// Formeln tragen wie tokens/scale.css – sonst sähe der Ring in Menüs/Dialogen anders aus.
{
  const strip = (f) => fs.readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const decl = (src, name) => [...src.matchAll(new RegExp(`${name}\\s*:\\s*([^;]+);`, 'g'))].map((m) => m[1].replace(/\s+/g, ' ').trim());
  const scale = strip(path.join(dir, 'scale.css'));
  const bridge = strip(path.join(ROOT, 'Kracherl', 'src', 'bridge.css'));
  const block = (bridge.match(/([^{}]+)\{[^{}]*--kr-ground\s*:\s*var\(--kr-surface-raised\)[^{}]*\}/) || [])[0];
  if (!block) fail('bridge.css §18: Regel mit --kr-ground: var(--kr-surface-raised) fehlt');
  else {
    for (const n of ['--kr-focus-shadow', '--kr-focus-shadow-inset']) {
      const [s] = decl(scale, n), [bb] = decl(block, n);
      if (!bb) fail(`bridge.css §18: ${n} fehlt (Lücke würde in schwebenden Ebenen nicht neu aufgelöst)`);
      else if (s !== bb) fail(`bridge.css §18: ${n} weicht von tokens/scale.css ab`);
    }
    if (decl(block, '--kr-focus-gap')[0] !== 'var(--kr-ground)') fail('bridge.css §18: --kr-focus-gap muss var(--kr-ground) sein');
    console.log(`\nSchwebende Ebenen (bridge §18): ${block.split('{')[0].replace(/\s+/g, ' ').trim()} – Fokus-Schatten = scale.css`);
  }
}

// Fokus auf fehlerhaften Feldern: über die FORM unterscheidbar (Orange/Rot reichen bei Deutan/Tritan nicht).
// forms.css muss für .apex-page-item-error:focus die rote Kante behalten und den abgesetzten Ring zeichnen.
{
  const forms = fs.readFileSync(path.join(ROOT, 'Kracherl', 'src', 'components', 'forms.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const rule = [...forms.matchAll(/([^{}]+)\{([^{}]*)\}/g)].find((m) => /\.apex-item-text\.apex-page-item-error:focus/.test(m[1]));
  const ok = rule && /--a-field-input-state-border-color\s*:\s*var\(--ut-palette-danger\)/.test(rule[2])
    && /outline\s*:\s*var\(--kr-focus-outline\)/.test(rule[2]) && /outline-offset\s*:\s*var\(--kr-focus-ring-offset\)/.test(rule[2]);
  if (!ok) fail('forms.css §3: Fokus auf fehlerhaften Feldern muss die rote Kante behalten und den abgesetzten Ring zeichnen');
  else console.log('\nFokus auf fehlerhaften Feldern (forms.css §3): rote Kante bleibt + abgesetzter Ring – Form statt nur Farbe');
}

// Gleiche Identität in beiden Modi: HSL-Farbton einer Kategorie hell ↔ dunkel ≤ 25°
{
  const HUE_MAX = 25;
  const hslHue = ({ r, g, b: bb }) => {
    const mx = Math.max(r, g, bb), mn = Math.min(r, g, bb), d = mx - mn;
    if (!d) return 0;
    let h = mx === r ? ((g - bb) / d) % 6 : mx === g ? (bb - r) / d + 2 : (r - g) / d + 4;
    h *= 60;
    return h < 0 ? h + 360 : h;
  };
  let worst = 0, wn;
  for (let n = 1; n <= 15; n++) {
    const l = col('light', `--kr-cat-${n}`), d = col('dark', `--kr-cat-${n}`);
    if (toLch(l).C < 10 || toLch(d).C < 10) continue;
    const hl = hslHue(l), hd = hslHue(d);
    const dh = Math.abs(((hd - hl + 540) % 360) - 180);
    if (dh > worst) { worst = dh; wn = n; }
    if (dh > HUE_MAX) fail(`--kr-cat-${n}: Farbton hell ${hl.toFixed(0)}° ↔ dunkel ${hd.toFixed(0)}° (Δ ${dh.toFixed(0)}° > ${HUE_MAX}°)`);
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
    console.log(`| \`${fg}\` / \`${bg}\` | ${role} | ${l.r.toFixed(2)} | ${d.r.toFixed(2)} | ${l.min || d.min || '–'} |`);
  }
}
const outDir = path.join(ROOT, '_tmp', 'kracherl');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'contrast-table.json'), JSON.stringify(table.map((t) => ({ ...t, r: +t.r.toFixed(2) })), null, 1));
console.log(fails ? `\n${fails} Fehler` : '\nOK – alle Prüfungen bestanden');
process.exit(fails ? 1 : 0);
