// Prüft die Farb-Tokens von Frequenz direkt aus den Quellen (src/tokens/light.css, dark.css):
//  - gleiche Token-Namen in beiden Dateien
//  - Kontraste (Text >= 4.5, UI/Fokus >= 3) auf Seite, Tafel, schwebender Fläche, Feld
//  - Magenta-Block (Marke) und Magenta als Marke/Fläche (Checkbox, Schalter, Primär-Button)
//  - Danger vs. Magenta (Farbton UND Helligkeit, normal + Protan/Deutan/Tritan)
//  - Kategorie-Palette (Kontrast, CVD-Unterscheidbarkeit in Chart-Reihenfolge, abgeleitete 16–45,
//    Abstand zum Akzent ΔE00 >= 20, gleicher Farbton hell/dunkel)
//  - Code-Farben (--fq-code-*, Prism-Kommentar) auf allen Flächen, auf denen Code steht
//  - Abstand aller Farben zu Oracle-Blau (ΔE00 >= 12)
//   node Frequenz/tools/check-tokens.mjs [--table]   (--table: Markdown-Tabelle der Kontrastpaare)
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../../_tools/config.mjs';
import { parseColor, contrast, deltaE2000, simulate, luminance, hex, mix, over, toLch } from '../../_tools/lib/color.mjs';

const dir = path.join(ROOT, 'Frequenz', 'src', 'tokens');
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
  const v = T[mode][name];
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
// halbtransparente Flächen/Vordergründe auf ihren Untergrund (Seite) legen
const on = (mode, fg, bgName) => {
  const bg = col(mode, bgName);
  const base = (bg.a ?? 1) < 1 ? over(bg, col(mode, '--fq-surface')) : bg;
  const f = col(mode, fg);
  return { f: (f.a ?? 1) < 1 ? over(f, base) : f, bg: base };
};

const TEXT = 4.5, UI = 3;
const PAIRS = [
  // [Vordergrund, Hintergrund, Minimum, Rolle]
  ['--fq-ink', '--fq-surface', TEXT, 'Text auf der Seite'],
  ['--fq-ink', '--fq-panel', TEXT, 'Text in der Tafel'],
  ['--fq-ink', '--fq-surface-raised', TEXT, 'Text in Menü/Dialog'],
  ['--fq-ink', '--fq-soft', TEXT, 'Text auf weicher Füllung (Chip, Kopfband)'],
  ['--fq-ink', '--fq-soft-hover', TEXT, 'Text auf weicher Füllung Hover'],
  ['--fq-ink', '--fq-accent-tint', TEXT, 'Auswahl-Zeile'],
  ['--fq-ink', '--fq-accent-tint-2', TEXT, 'Auswahl kräftig'],
  ['--fq-ink-2', '--fq-surface', TEXT, 'Label'],
  ['--fq-ink-2', '--fq-panel', TEXT, 'Label in der Tafel'],
  ['--fq-muted', '--fq-surface', TEXT, 'Sekundärtext'],
  ['--fq-muted', '--fq-panel', TEXT, 'Sekundärtext in der Tafel'],
  ['--fq-muted', '--fq-surface-raised', TEXT, 'Sekundärtext Menü'],
  ['--fq-muted', '--fq-hover', TEXT, 'Sekundärtext Zeilen-Hover'],
  ['--fq-muted', '--fq-soft', TEXT, 'Sekundärtext auf weicher Füllung'],
  ['--fq-ink', '--fq-raised-hover', TEXT, 'Menüeintrag Hover/Fokus'],
  ['--fq-ink', '--fq-button-fill', TEXT, 'Standard-Button'],
  ['--fq-ink', '--fq-button-fill-hover', TEXT, 'Standard-Button Hover'],
  ['--fq-ink', '--fq-button-fill-press', TEXT, 'Standard-Button gedrückt'],
  ['--fq-muted', '--fq-raised-hover', TEXT, 'Tastenkürzel im Menü-Hover'],
  ['--fq-placeholder', '--fq-field', TEXT, 'Platzhalter'],
  ['--fq-ink', '--fq-field', TEXT, 'Feldtext'],
  ['--fq-ink', '--fq-field-readonly', TEXT, 'Feldtext readonly'],
  ['--fq-link-text', '--fq-surface', TEXT, 'Link'],
  ['--fq-link-text', '--fq-panel', TEXT, 'Link in der Tafel'],
  ['--fq-accent-text', '--fq-surface', TEXT, 'Magenta-Text (aktive Navigation)'],
  ['--fq-accent-text', '--fq-panel', TEXT, 'Magenta-Text in der Tafel'],
  ['--fq-accent-text', '--fq-hover', TEXT, 'Magenta-Text auf aktiver Nav-Zeile'],
  ['--fq-accent-text', '--fq-surface-raised', TEXT, 'Magenta-Text Menü'],
  ['--fq-accent-text', '--fq-raised-hover', TEXT, 'Magenta-Text im Menü-Hover'],
  ['--fq-brand-on', '--fq-brand', TEXT, 'App-Name im Magenta-Block'],
  ['--fq-brand-on', '--fq-brand-hover', TEXT, 'App-Name im Block (Hover)'],
  ['--fq-accent-on', '--fq-accent', TEXT, 'Primär-Button'],
  ['--fq-accent-on', '--fq-accent-hover', TEXT, 'Primär-Button Hover'],
  ['--fq-accent-on', '--fq-accent-press', TEXT, 'Primär-Button gedrückt'],
  ['--fq-strong-on', '--fq-strong', TEXT, 'aktive Pille / aktive Seite'],
  ['--fq-strong-on', '--fq-strong-hover', TEXT, 'aktive Pille Hover'],
  ['--fq-accent-text', '--fq-button-fill', TEXT, 'Primary-Typ (Magenta-Kontur)'],
  ['--fq-accent-text', '--fq-accent-tint', TEXT, 'Primary-Typ Hover/Druck'],
  ['--fq-selection-text', '--fq-selection', TEXT, '::selection'],
  ['--fq-required-color', '--fq-surface', TEXT, 'Pflicht-Markierung'],
  ['--fq-required-color', '--fq-panel', TEXT, 'Pflicht-Markierung in der Tafel'],
  ['--fq-tooltip-text', '--fq-tooltip-bg', TEXT, 'Tooltip'],
  ['--fq-edge', '--fq-surface', UI, 'Feldkante/Seite (1.4.11)'],
  ['--fq-edge', '--fq-panel', UI, 'Feldkante/Tafel'],
  ['--fq-edge', '--fq-field', UI, 'Feldkante/Feld'],
  ['--fq-edge', '--fq-surface-raised', UI, 'Feldkante/Dialog'],
  ['--fq-button-edge', '--fq-surface', UI, 'Button-Kontur/Seite'],
  ['--fq-button-edge', '--fq-panel', UI, 'Button-Kontur/Tafel'],
  ['--fq-button-edge', '--fq-surface-raised', UI, 'Button-Kontur/Dialog'],
  ['--fq-button-edge', '--fq-field', UI, 'Trenner der Radio-Segmentleiste (Segmente in Feldfläche)'],
  ['--fq-accent', '--fq-surface', UI, 'Magenta-Marke (Checkbox, Schalter, Kante)/Seite'],
  ['--fq-accent', '--fq-panel', UI, 'Magenta-Marke/Tafel'],
  ['--fq-accent', '--fq-surface-raised', UI, 'Magenta-Marke/Dialog'],
  ['--fq-accent', '--fq-hover', UI, 'Magenta-Kante auf aktiver Nav-Zeile'],
  ['--fq-strong', '--fq-panel', UI, 'aktive Pille in der Tafel'],
  ['--fq-focus-ring-color', '--fq-surface', UI, 'Fokus auf der Seite'],
  ['--fq-focus-ring-color', '--fq-panel', UI, 'Fokus in der Tafel'],
  ['--fq-focus-ring-color', '--fq-surface-raised', UI, 'Fokus in Menü/Dialog'],
  ['--fq-focus-ring-color', '--fq-soft', UI, 'Fokus auf weicher Füllung'],
  ['--fq-focus-ring-color', '--fq-field', UI, 'Fokus-Feldkante/Feld'],
  ['--fq-focus-ring-color', '--fq-focus-gap', UI, 'Doppelring innen/außen'],
  ['--fq-focus-ring-color', '--fq-raised-hover', UI, 'Fokus-Innenring auf Menü-Hover'],
  ['--fq-focus-ring-color', '--fq-accent', UI, 'Fokus-Ring neben Primär-Button (Lücke dazwischen)'],
  ['--fq-link-underline', '--fq-surface', UI, 'Link-Unterstrich'],
  ['--fq-link-underline', '--fq-panel', UI, 'Link-Unterstrich in der Tafel'],
  ['--fq-link-underline-hover', '--fq-surface', UI, 'Link-Unterstrich Hover'],
];
// Code (bridge.css §17): Code-Blöcke liegen auf Seite/Tafel (pre, Markdown), in Dialogen
// auf der schwebenden Fläche, im Markdown-Editor auf der Feldfläche.
for (const fg of ['--fq-code-keyword', '--fq-code-string', '--fq-code-number', '--fq-muted', '--fq-danger-text']) {
  const role = fg === '--fq-muted' ? 'Code-Kommentar' : fg === '--fq-danger-text' ? 'Code gelöscht (diff)' : `Code ${fg.slice(10)}`;
  for (const [bg, where] of [['--fq-surface', 'Seite'], ['--fq-surface-sunken', 'abgesenkt'], ['--fq-surface-raised', 'Dialog'], ['--fq-field', 'Markdown-Editor']]) {
    if (fg === '--fq-muted' && bg !== '--fq-field' && bg !== '--fq-surface-sunken') continue;
    if (fg === '--fq-danger-text' && bg !== '--fq-surface-raised' && bg !== '--fq-field') continue;
    PAIRS.push([fg, bg, TEXT, `${role} (${where})`]);
  }
}
for (const s of ['success', 'warning', 'danger', 'info']) {
  PAIRS.push([`--fq-${s}-on`, `--fq-${s}`, TEXT, `${s}-Fläche`]);
  PAIRS.push([`--fq-${s}-on`, `--fq-${s}-hover`, TEXT, `${s}-Fläche Hover`]);
  PAIRS.push([`--fq-${s}-text`, '--fq-surface', TEXT, `${s}-Text Seite`]);
  PAIRS.push([`--fq-${s}-text`, '--fq-panel', TEXT, `${s}-Text Tafel`]);
  PAIRS.push([`--fq-${s}-text`, `--fq-${s}-tint`, TEXT, `${s}-Text auf Tönung`]);
  PAIRS.push(['--fq-ink', `--fq-${s}-tint`, TEXT, `Text auf ${s}-Tönung`]);
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
  // Flächenstufen (keine WCAG-Pflicht): Tafel und Hover müssen sich sichtbar abheben
  for (const [x, y, role, min = 0] of [
    ['--fq-panel', '--fq-surface', 'Tafel gegen Seite', 1.07],
    ['--fq-raised-hover', '--fq-surface-raised', 'Hover auf schwebender Fläche', 1.15],
    ['--fq-soft', '--fq-panel', 'weiche Füllung in der Tafel', 1.03],
    ['--fq-line', '--fq-surface', 'Haarlinie'],
    ['--fq-line-strong', '--fq-surface', 'kräftige Linie'],
    ['--fq-accent', '--fq-surface', 'Primär-Fläche'],
  ]) {
    const r = contrast(col(mode, x), col(mode, y));
    table.push({ mode, fg: x, bg: y, r, min, role });
    console.log(`  ${role}: ${r.toFixed(2)}:1`);
    if (r < min) fail(`${mode}: ${x} auf ${y} = ${r.toFixed(2)} < ${min} (${role})`);
  }
  // Grundfläche: an der Wurzel = Seite, die Fokus-Lücke folgt ihr
  if (hex(col(mode, '--fq-ground')) !== hex(col(mode, '--fq-surface'))) fail(`${mode}: --fq-ground ≠ --fq-surface an der Wurzel`);
  if (T[mode]['--fq-focus-gap'] !== 'var(--fq-ground)') fail(`${mode}: --fq-focus-gap muss var(--fq-ground) sein (bridge §18 setzt den Grund in schwebenden Ebenen)`);
  // Danger vs Akzent
  const d = col(mode, '--fq-danger'), acc = col(mode, '--fq-accent');
  const ld = luminance(d), la = luminance(acc);
  const dE = ['normal', 'protan', 'deutan', 'tritan'].map((t) => deltaE2000(t === 'normal' ? d : simulate(d, t), t === 'normal' ? acc : simulate(acc, t)));
  const lr = (Math.max(ld, la) + 0.05) / (Math.min(ld, la) + 0.05);
  console.log(`  Danger ${hex(d)} vs Akzent ${hex(acc)}: ΔE00 normal/protan/deutan/tritan ${dE.map((x) => x.toFixed(1)).join(' / ')}, Helligkeit L ${ld.toFixed(3)} vs ${la.toFixed(3)} (${lr.toFixed(2)}:1)`);
  if (Math.min(dE[0], dE[1], dE[2]) < 20) fail(`${mode}: Danger/Akzent zu ähnlich (ΔE < 20)`);
  if (lr < 1.2) fail(`${mode}: Danger/Akzent Helligkeit zu gleich (${lr.toFixed(2)})`);
  const dt = col(mode, '--fq-danger-text'), at = col(mode, '--fq-accent-text');
  const dEt = ['normal', 'protan', 'deutan'].map((t) => deltaE2000(t === 'normal' ? dt : simulate(dt, t), t === 'normal' ? at : simulate(at, t)));
  console.log(`  Danger-Text vs Akzent-Text: ΔE00 ${dEt.map((x) => x.toFixed(1)).join(' / ')}`);

  // Kategorie-Palette
  const ORDER = [1, 4, 7, 9, 12, 3, 8, 10, 2, 5, 11, 6];
  const surf = col(mode, '--fq-surface');
  const catMin = mode === 'light' ? 2.4 : 3.3;
  for (let n = 1; n <= 15; n++) {
    const c = col(mode, `--fq-cat-${n}`), o = col(mode, `--fq-cat-${n}-on`);
    const rb = contrast(c, surf), ro = contrast(o, c);
    if (rb < catMin) fail(`${mode}: --fq-cat-${n} gegen Seite ${rb.toFixed(2)} < ${catMin}`);
    if (ro < TEXT) fail(`${mode}: --fq-cat-${n}-on ${ro.toFixed(2)} < 4.5`);
  }
  // Magenta-Disziplin: keine Kategorie darf sich als Akzent (Primäraktion/Auswahl) lesen
  {
    const accs = ['--fq-accent', '--fq-accent-text', '--fq-brand'].map((k) => col(mode, k));
    let min = 1e9, which;
    for (let n = 1; n <= 15; n++) {
      const x = col(mode, `--fq-cat-${n}`);
      const dd = Math.min(...accs.map((y) => deltaE2000(x, y)));
      if (dd < min) { min = dd; which = n; }
      if (dd < 20) fail(`${mode}: --fq-cat-${n} ${hex(x)} liegt ΔE00 ${dd.toFixed(1)} am Magenta (< 20)`);
    }
    console.log(`  Kategorie ↔ Magenta min ΔE00 ${min.toFixed(1)} (cat-${which})`);
  }
  for (const k of [6, 8]) {
    const res = [];
    for (const t of ['normal', 'protan', 'deutan', 'tritan']) {
      let min = 1e9, p;
      const set = ORDER.slice(0, k);
      for (let i = 0; i < set.length; i++) for (let j = i + 1; j < set.length; j++) {
        const x = col(mode, `--fq-cat-${set[i]}`), y = col(mode, `--fq-cat-${set[j]}`);
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
    const c = col(mode, `--fq-cat-${n}`);
    w16 = Math.min(w16, contrast(mix(c, '#FFFFFF', 0.6), col(mode, '--fq-on-light')));
    w31 = Math.min(w31, contrast(mix(c, '#000000', 0.55), col(mode, '--fq-on-dark')));
  }
  console.log(`  --u-color-16…30 (60 % + Weiß) mit Anthrazit min ${w16.toFixed(2)}; 31…45 (55 % + Schwarz) mit Weiß min ${w31.toFixed(2)}`);
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
    const c = col(mode, `--fq-cat-${n}`);
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
  const bridge = strip(path.join(ROOT, 'Frequenz', 'src', 'bridge.css'));
  const block = (bridge.match(/([^{}]+)\{[^{}]*--fq-ground\s*:\s*var\(--fq-surface-raised\)[^{}]*\}/) || [])[0];
  if (!block) fail('bridge.css §18: Regel mit --fq-ground: var(--fq-surface-raised) fehlt');
  else {
    for (const n of ['--fq-focus-shadow', '--fq-focus-shadow-inset']) {
      const [s] = decl(scale, n), [bb] = decl(block, n);
      if (!bb) fail(`bridge.css §18: ${n} fehlt (Lücke würde in schwebenden Ebenen nicht neu aufgelöst)`);
      else if (s !== bb) fail(`bridge.css §18: ${n} weicht von tokens/scale.css ab`);
    }
    if (decl(block, '--fq-focus-gap')[0] !== 'var(--fq-ground)') fail('bridge.css §18: --fq-focus-gap muss var(--fq-ground) sein');
    console.log(`\nSchwebende Ebenen (bridge §18): ${block.split('{')[0].replace(/\s+/g, ' ').trim()} – Fokus-Schatten = scale.css`);
  }
}

// Gleiche Identität in beiden Modi: HSL-Farbton einer Kategorie hell ↔ dunkel ≤ 25°
// (Grautöne mit CIELAB-Buntheit C < 10 ausgenommen).
{
  const HUE_MAX = 25;
  const hslHue = ({ r, g, b: bl }) => {
    const mx = Math.max(r, g, bl), mn = Math.min(r, g, bl), d = mx - mn;
    if (!d) return 0;
    let h = mx === r ? ((g - bl) / d) % 6 : mx === g ? (bl - r) / d + 2 : (r - g) / d + 4;
    h *= 60;
    return h < 0 ? h + 360 : h;
  };
  let worst = 0, wn;
  for (let n = 1; n <= 15; n++) {
    const l = col('light', `--fq-cat-${n}`), d = col('dark', `--fq-cat-${n}`);
    if (toLch(l).C < 10 || toLch(d).C < 10) continue;
    const hl = hslHue(l), hd = hslHue(d);
    const dh = Math.abs(((hd - hl + 540) % 360) - 180);
    if (dh > worst) { worst = dh; wn = n; }
    if (dh > HUE_MAX) fail(`--fq-cat-${n}: Farbton hell ${hl.toFixed(0)}° ↔ dunkel ${hd.toFixed(0)}° (Δ ${dh.toFixed(0)}° > ${HUE_MAX}°)`);
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
const outDir = path.join(ROOT, '_tmp', 'frequenz');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'contrast-table.json'), JSON.stringify(table.map((t) => ({ ...t, r: +t.r.toFixed(2) })), null, 1));
console.log(fails ? `\n${fails} Fehler` : '\nOK – alle Prüfungen bestanden');
process.exit(fails ? 1 : 0);
