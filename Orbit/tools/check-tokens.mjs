// Prüft die Farb-Tokens von Orbit direkt aus den Quellen (src/tokens/light.css, dark.css):
//  - gleiche Token-Namen in beiden Dateien
//  - Kontraste (Text >= 4.5, UI/Fokus >= 3) auf Panel, Grund, abgesenkt, schwebend, Feld und im Kopf (Bedienfeld)
//  - Stufen Panel/Grund und Haarlinien (Bericht, Mindestwerte für die Panel-Kante)
//  - Danger vs. Hauptaktion (Farbton UND Helligkeit, normal + Protan/Deutan/Tritan)
//  - Kategorie-Palette (Kontrast, CVD-Unterscheidbarkeit in Chart-Reihenfolge, abgeleitete 16–45,
//    Abstand zur Fokus-/Auswahlmarke, gleicher Farbton hell/dunkel)
//  - Code-Farben (--ob-code-*, Prism-Kommentar) auf allen Flächen, auf denen Code steht
//  - Abstand aller Farben zu Oracle-Blau (ΔE00 >= 12)
//   node Orbit/tools/check-tokens.mjs [--table]   (--table: Markdown-Tabelle der Kontrastpaare)
// Nebenprodukt: _tmp/<prefix>/contrast-table.json (prefix aus theme.json).
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../../_tools/config.mjs';
import { parseColor, contrast, deltaE2000, simulate, luminance, hex, mix, over, toLch } from '../../_tools/lib/color.mjs';

const meta = JSON.parse(fs.readFileSync(new URL('../theme.json', import.meta.url), 'utf8'));
const outDir = path.join(ROOT, '_tmp', meta.prefix);

const dir = path.join(ROOT, 'Orbit', 'src', 'tokens');
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
  // halbtransparente Tönungen liegen auf dem Panel, die des Kopfs auf dem Bedienfeld
  const under = bgName.startsWith('--ob-console') ? '--ob-console' : '--ob-surface';
  const base = (bg.a ?? 1) < 1 ? over(bg, col(mode, under)) : bg;
  const f = col(mode, fg);
  return { f: (f.a ?? 1) < 1 ? over(f, base) : f, bg: base };
};

const TEXT = 4.5, UI = 3;
const PAIRS = [
  // [Vordergrund, Hintergrund, Minimum, Rolle]
  ['--ob-ink', '--ob-surface', TEXT, 'Text auf Panel'],
  ['--ob-ink', '--ob-frame', TEXT, 'Text auf Grund (Nav, Title Bar)'],
  ['--ob-ink', '--ob-surface-sunken', TEXT, 'Text abgesenkt'],
  ['--ob-ink', '--ob-surface-raised', TEXT, 'Text in Menü/Dialog'],
  ['--ob-ink', '--ob-soft', TEXT, 'Sekundär-Button'],
  ['--ob-ink', '--ob-soft-hover', TEXT, 'Sekundär-Button Hover'],
  ['--ob-ink', '--ob-accent-tint', TEXT, 'Auswahl-Zeile'],
  ['--ob-ink', '--ob-accent-tint-2', TEXT, 'Auswahl kräftig'],
  ['--ob-ink-2', '--ob-surface', TEXT, 'Label'],
  ['--ob-ink-2', '--ob-frame', TEXT, 'Nav-Text auf Grund'],
  ['--ob-muted', '--ob-surface', TEXT, 'Sekundärtext'],
  ['--ob-muted', '--ob-surface-sunken', TEXT, 'Sekundärtext abgesenkt'],
  ['--ob-muted', '--ob-surface-raised', TEXT, 'Sekundärtext Menü'],
  ['--ob-muted', '--ob-frame', TEXT, 'Sekundärtext Grund'],
  ['--ob-muted', '--ob-hover', TEXT, 'Sekundärtext Zeilen-Hover'],
  ['--ob-ink', '--ob-raised-hover', TEXT, 'Menüeintrag Hover/Fokus'],
  ['--ob-muted', '--ob-raised-hover', TEXT, 'Tastenkürzel im Menü-Hover'],
  ['--ob-placeholder', '--ob-field', TEXT, 'Platzhalter'],
  ['--ob-ink', '--ob-field', TEXT, 'Feldtext'],
  ['--ob-ink', '--ob-field-readonly', TEXT, 'Feldtext readonly'],
  ['--ob-link-text', '--ob-surface', TEXT, 'Link'],
  ['--ob-accent-text', '--ob-surface', TEXT, 'Akzent-Text Panel'],
  ['--ob-accent-text', '--ob-surface-raised', TEXT, 'Akzent-Text Menü'],
  ['--ob-accent-text', '--ob-frame', TEXT, 'Abschnitts-Label auf Grund'],
  ['--ob-accent-text', '--ob-accent-tint', TEXT, 'Akzent-Text auf Tönung'],
  ['--ob-accent-on', '--ob-accent', TEXT, 'Primär-Button'],
  ['--ob-accent-on', '--ob-accent-hover', TEXT, 'Primär-Button Hover'],
  ['--ob-accent-on', '--ob-accent-press', TEXT, 'Primär-Button gedrückt'],
  ['--ob-selection-text', '--ob-selection', TEXT, '::selection'],
  ['--ob-required-color', '--ob-surface', TEXT, 'Pflicht-Markierung'],
  ['--ob-required-color', '--ob-surface-sunken', TEXT, 'Pflicht-Markierung abgesenkt'],
  ['--ob-tooltip-text', '--ob-tooltip-bg', TEXT, 'Tooltip'],
  ['--ob-edge', '--ob-surface', UI, 'Kante Feld/Button auf Panel (1.4.11)'],
  ['--ob-edge', '--ob-frame', UI, 'Kante Button auf Grund (Title Bar)'],
  ['--ob-edge', '--ob-surface-sunken', UI, 'Feldkante/abgesenkt'],
  ['--ob-edge', '--ob-field', UI, 'Feldkante/Feld'],
  ['--ob-edge', '--ob-surface-raised', UI, 'Feldkante/Dialog'],
  ['--ob-focus-ring-color', '--ob-surface', UI, 'Fokus auf Panel'],
  ['--ob-focus-ring-color', '--ob-frame', UI, 'Fokus auf Grund'],
  ['--ob-focus-ring-color', '--ob-surface-sunken', UI, 'Fokus abgesenkt'],
  ['--ob-focus-ring-color', '--ob-surface-raised', UI, 'Fokus in Menü/Dialog'],
  ['--ob-focus-ring-color', '--ob-soft', UI, 'Fokus neben Sekundär-Button'],
  ['--ob-focus-ring-color', '--ob-field', UI, 'Fokus-Feldkante/Feld'],
  ['--ob-focus-ring-color', '--ob-focus-gap', UI, 'Doppelring innen/außen'],
  ['--ob-focus-ring-color', '--ob-raised-hover', UI, 'Fokus-Innenring auf Menü-Hover'],
  ['--ob-accent-text', '--ob-raised-hover', UI, 'Häkchen/Radio im Menü-Hover (Marke)'],
  ['--ob-link-underline', '--ob-surface', UI, 'Link-Unterstrich'],
  ['--ob-link-underline', '--ob-surface-sunken', UI, 'Link-Unterstrich abgesenkt'],
  ['--ob-link-underline-hover', '--ob-surface', UI, 'Link-Unterstrich Hover'],
  // Kopf = Bedienfeld (in beiden Modi dunkel)
  ['--ob-console-ink', '--ob-console', TEXT, 'App-Name/Kopf-Buttons'],
  ['--ob-console-muted', '--ob-console', TEXT, 'Nebentext im Kopf'],
  ['--ob-console-ink', '--ob-console-hover', TEXT, 'Kopf-Button Hover'],
  ['--ob-console-ink', '--ob-console-press', TEXT, 'Kopf-Button aktiv'],
  ['--ob-console-accent', '--ob-console', UI, 'Fokus/Marke im Kopf'],
  ['--ob-console-accent', '--ob-console-press', UI, 'Marke auf aktivem Kopf-Eintrag'],
  // Hauptaktion und Marken
  ['--ob-accent', '--ob-surface', UI, 'Hauptaktion: Fläche gegen Panel'],
  ['--ob-accent', '--ob-frame', UI, 'Hauptaktion: Fläche gegen Grund'],
  ['--ob-accent-text', '--ob-soft', UI, 'Marke auf neutraler Fläche (aktiver Tab)'],
  ['--ob-accent-text', '--ob-hover', UI, 'Marke auf Zeilen-Hover (aktiver Nav-Eintrag)'],
];
// Code (bridge.css §17): Code-Blöcke liegen im Panel/abgesenkt (pre, Markdown), in Dialogen
// auf der schwebenden Fläche, im Markdown-Editor auf der Feldfläche.
for (const fg of ['--ob-code-keyword', '--ob-code-string', '--ob-code-number', '--ob-muted', '--ob-danger-text']) {
  const role = fg === '--ob-muted' ? 'Code-Kommentar' : fg === '--ob-danger-text' ? 'Code gelöscht (diff)' : `Code ${fg.slice(10)}`;
  for (const [bg, where] of [['--ob-surface', 'Panel'], ['--ob-surface-sunken', 'abgesenkt'], ['--ob-surface-raised', 'Dialog'], ['--ob-field', 'Markdown-Editor']]) {
    if (fg === '--ob-muted' && bg !== '--ob-field') continue;            // Panel/abgesenkt/Menü stehen schon oben
    if (fg === '--ob-danger-text' && bg !== '--ob-surface-raised' && bg !== '--ob-field') continue;
    PAIRS.push([fg, bg, TEXT, `${role} (${where})`]);
  }
}
for (const s of ['success', 'warning', 'danger', 'info']) {
  PAIRS.push([`--ob-${s}-on`, `--ob-${s}`, TEXT, `${s}-Fläche`]);
  PAIRS.push([`--ob-${s}-on`, `--ob-${s}-hover`, TEXT, `${s}-Fläche Hover`]);
  PAIRS.push([`--ob-${s}-text`, '--ob-surface', TEXT, `${s}-Text Panel`]);
  PAIRS.push([`--ob-${s}-text`, '--ob-surface-sunken', TEXT, `${s}-Text abgesenkt`]);
  PAIRS.push([`--ob-${s}-text`, `--ob-${s}-tint`, TEXT, `${s}-Text auf Tönung`]);
  PAIRS.push(['--ob-ink', `--ob-${s}-tint`, TEXT, `Text auf ${s}-Tönung`]);
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
  // Panel/Grund: das Panel ist eine Stufe heller (dunkel) bzw. weiß auf Kabinengrau (hell).
  // Es wird von seiner Haarlinie getragen – die Kante muss sich vom Grund UND vom Panel lösen.
  const cf = contrast(col(mode, '--ob-surface'), col(mode, '--ob-frame'));
  console.log(`  Panel/Grund ${cf.toFixed(2)}:1`);
  if (cf < 1.08) fail(`${mode}: Panel/Grund ${cf.toFixed(2)} < 1.08`);
  table.push({ mode, fg: '--ob-surface', bg: '--ob-frame', r: cf, min: 1.08, role: 'Panel gegen Grund' });
  for (const [bgn, role] of [['--ob-frame', 'Panel-Kante gegen Grund'], ['--ob-surface', 'Panel-Kante gegen Panel']]) {
    const r = contrast(col(mode, '--ob-line'), col(mode, bgn));
    table.push({ mode, fg: '--ob-line', bg: bgn, r, min: 1.2, role });
    if (r < 1.2) fail(`${mode}: --ob-line auf ${bgn} = ${r.toFixed(2)} < 1.2 (${role})`);
  }
  // Flächenstufen (keine WCAG-Pflicht; nur der Hover auf schwebenden Ebenen hat ein Minimum:
  // sichtbar wie die Sekundär-Fläche hell auf Weiß – --ob-soft hätte dunkel nur 1.13, --ob-hover 1.02)
  const HOVER_RAISED = 1.15;
  for (const [x, y, role, min = 0] of [['--ob-line', '--ob-surface', 'Haarlinie'], ['--ob-line-strong', '--ob-surface', 'kräftige Linie'], ['--ob-head-rule', '--ob-surface', 'Tabellenkopf-Grundlinie'], ['--ob-soft', '--ob-surface', 'neutrale Fläche (Chips, aktiver Tab)'], ['--ob-raised-hover', '--ob-surface-raised', 'Hover auf schwebender Fläche', HOVER_RAISED]]) {
    const r = contrast(col(mode, x), col(mode, y));
    table.push({ mode, fg: x, bg: y, r, min, role });
    console.log(`  ${role}: ${r.toFixed(2)}:1`);
    if (r < min) fail(`${mode}: ${x} auf ${y} = ${r.toFixed(2)} < ${min} (${role})`);
  }
  // Grundfläche: an der Wurzel = Panel, die Fokus-Lücke folgt ihr
  if (hex(col(mode, '--ob-ground')) !== hex(col(mode, '--ob-surface'))) fail(`${mode}: --ob-ground ≠ --ob-surface an der Wurzel`);
  if (T[mode]['--ob-focus-gap'] !== 'var(--ob-ground)') fail(`${mode}: --ob-focus-gap muss var(--ob-ground) sein (bridge §18 setzt den Grund in schwebenden Ebenen)`);
  // Danger vs Hauptaktion (Akzent-Fläche): Löschen darf nie wie Speichern aussehen
  const d = col(mode, '--ob-danger'), acc = col(mode, '--ob-accent');
  const ld = luminance(d), la = luminance(acc);
  const dE = ['normal', 'protan', 'deutan', 'tritan'].map((t) => deltaE2000(t === 'normal' ? d : simulate(d, t), t === 'normal' ? acc : simulate(acc, t)));
  const lr = (Math.max(ld, la) + 0.05) / (Math.min(ld, la) + 0.05);
  console.log(`  Danger ${hex(d)} vs Akzent ${hex(acc)}: ΔE00 normal/protan/deutan/tritan ${dE.map((x) => x.toFixed(1)).join(' / ')}, Helligkeit L ${ld.toFixed(3)} vs ${la.toFixed(3)} (${lr.toFixed(2)}:1)`);
  if (Math.min(dE[0], dE[1], dE[2]) < 20) fail(`${mode}: Danger/Akzent zu ähnlich (ΔE < 20)`);
  if (lr < 1.2) fail(`${mode}: Danger/Akzent Helligkeit zu gleich (${lr.toFixed(2)})`);
  const dt = col(mode, '--ob-danger-text'), at = col(mode, '--ob-accent-text');
  const dEt = ['normal', 'protan', 'deutan'].map((t) => deltaE2000(t === 'normal' ? dt : simulate(dt, t), t === 'normal' ? at : simulate(at, t)));
  console.log(`  Danger-Text vs Akzent-Text: ΔE00 ${dEt.map((x) => x.toFixed(1)).join(' / ')}`);

  // Kategorie-Palette
  const ORDER = [1, 4, 7, 9, 12, 3, 8, 10, 2, 5, 11, 6];
  const surf = col(mode, '--ob-surface');
  const catMin = mode === 'light' ? 2.4 : 3.3;
  for (let n = 1; n <= 15; n++) {
    const c = col(mode, `--ob-cat-${n}`), o = col(mode, `--ob-cat-${n}-on`);
    const rb = contrast(c, surf), ro = contrast(o, c);
    if (rb < catMin) fail(`${mode}: --ob-cat-${n} gegen Panel ${rb.toFixed(2)} < ${catMin}`);
    if (ro < TEXT) fail(`${mode}: --ob-cat-${n}-on ${ro.toFixed(2)} < 4.5`);
  }
  // Marken-Disziplin: keine Kategorie darf sich als Fokus-/Auswahlmarke (Eisblau/Stahlpetrol)
  // oder als Hauptaktion lesen. Die Palette ist bewusst kühl, Serie 1 ist ein Cyan derselben
  // Instrumentenfamilie – sie muss sich aber klar von der Marke lösen (ΔE00 ≥ 10).
  {
    const acc = col(mode, '--ob-accent'), accT = col(mode, '--ob-accent-text');
    let min = 1e9, which;
    for (let n = 1; n <= 15; n++) {
      const x = col(mode, `--ob-cat-${n}`);
      const d = Math.min(deltaE2000(x, acc), deltaE2000(x, accT));
      if (d < min) { min = d; which = n; }
      if (d < 10) fail(`${mode}: --ob-cat-${n} ${hex(x)} liegt ΔE00 ${d.toFixed(1)} an der Marke (< 10)`);
    }
    console.log(`  Kategorie ↔ Hauptaktion/Marke min ΔE00 ${min.toFixed(1)} (cat-${which})`);
  }
  for (const k of [6, 8]) {
    const res = [];
    for (const t of ['normal', 'protan', 'deutan', 'tritan']) {
      let min = 1e9, p;
      const set = ORDER.slice(0, k);
      for (let i = 0; i < set.length; i++) for (let j = i + 1; j < set.length; j++) {
        const x = col(mode, `--ob-cat-${set[i]}`), y = col(mode, `--ob-cat-${set[j]}`);
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
    const c = col(mode, `--ob-cat-${n}`);
    w16 = Math.min(w16, contrast(mix(c, '#FFFFFF', 0.6), col(mode, '--ob-on-light')));
    w31 = Math.min(w31, contrast(mix(c, '#000000', 0.55), col(mode, '--ob-on-dark')));
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
  // abgeleitete --u-color-16…45 ebenfalls
  for (let n = 1; n <= 15; n++) {
    const c = col(mode, `--ob-cat-${n}`);
    for (const [k, d] of [[n + 15, mix(c, '#FFFFFF', 0.6)], [n + 30, mix(c, '#000000', 0.55)]]) {
      const dmin = Math.min(...BLUES.map((x) => deltaE2000(d, x)));
      if (dmin < 12) fail(`${mode}: --u-color-${k} ${hex(d)} liegt nahe Oracle-Blau (ΔE00 ${dmin.toFixed(1)})`);
    }
  }
}

// Schwebende Ebenen (bridge.css §18): die dort neu aufgelösten Fokus-Schatten müssen dieselben
// Formeln tragen wie tokens/scale.css – sonst sähe der Ring in Menüs/Dialogen anders aus als im Panel.
{
  const strip = (f) => fs.readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const decl = (src, name) => [...src.matchAll(new RegExp(`${name}\\s*:\\s*([^;]+);`, 'g'))].map((m) => m[1].replace(/\s+/g, ' ').trim());
  const scale = strip(path.join(dir, 'scale.css'));
  const bridge = strip(path.join(ROOT, 'Orbit', 'src', 'bridge.css'));
  const block = (bridge.match(/([^{}]+)\{[^{}]*--ob-ground\s*:\s*var\(--ob-surface-raised\)[^{}]*\}/) || [])[0];
  if (!block) fail('bridge.css §18: Regel mit --ob-ground: var(--ob-surface-raised) fehlt');
  else {
    for (const n of ['--ob-focus-shadow', '--ob-focus-shadow-inset']) {
      const [s] = decl(scale, n), [b] = decl(block, n);
      if (!b) fail(`bridge.css §18: ${n} fehlt (Lücke würde in schwebenden Ebenen nicht neu aufgelöst)`);
      else if (s !== b) fail(`bridge.css §18: ${n} weicht von tokens/scale.css ab`);
    }
    if (decl(block, '--ob-focus-gap')[0] !== 'var(--ob-ground)') fail('bridge.css §18: --ob-focus-gap muss var(--ob-ground) sein');
    console.log(`\nSchwebende Ebenen (bridge §18): ${block.split('{')[0].replace(/\s+/g, ' ').trim()} – Fokus-Schatten = scale.css`);
  }
}

// Gleiche Identität in beiden Modi: HSL-Farbton einer Kategorie hell ↔ dunkel ≤ 25°
// (Grautöne mit CIELAB-Buntheit C < 10 ausgenommen). Avatare, Badges und Diagrammserien behalten
// beim Moduswechsel ihre Farbfamilie .
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
    const l = col('light', `--ob-cat-${n}`), d = col('dark', `--ob-cat-${n}`);
    if (toLch(l).C < 10 || toLch(d).C < 10) continue;
    const hl = hslHue(l), hd = hslHue(d);
    const dh = Math.abs(((hd - hl + 540) % 360) - 180);
    if (dh > worst) { worst = dh; wn = n; }
    if (dh > HUE_MAX) fail(`--ob-cat-${n}: Farbton hell ${hl.toFixed(0)}° ↔ dunkel ${hd.toFixed(0)}° (Δ ${dh.toFixed(0)}° > ${HUE_MAX}°)`);
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
