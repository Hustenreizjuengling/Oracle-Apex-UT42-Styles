// Erzeugt die Token-Tabellen für Passepartout/docs/ARCHITECTURE.md direkt aus den Quellen.
//   node Passepartout/tools/gen-token-tables.mjs
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../../_tools/config.mjs';

const dir = path.join(ROOT, 'Passepartout', 'src', 'tokens');
// Liest :root-Deklarationen samt Zeilenkommentar und Gruppenüberschrift („/* Name ---“)
function read(file) {
  const lines = fs.readFileSync(path.join(dir, file), 'utf8').split(/\r?\n/);
  const out = [];
  let group = '', media = '';
  for (const l of lines) {
    const g = l.match(/^\s*\/\*\s*([^*]+?)\s*-{3,}/);
    if (g) group = g[1].trim();
    const m = l.match(/^@media\s+([^{]+)\{/);
    if (m) media = m[1].trim();
    for (const d of l.matchAll(/(--[\w-]+)\s*:\s*([^;]+);(?:\s*\/\*\s*(.*?)\s*\*\/)?/g)) {
      out.push({ name: d[1], value: d[2].trim(), comment: (d[3] || '').trim(), group, media: /^\s{2,}/.test(l) && media ? media : '' });
    }
    if (/^}/.test(l)) media = '';
  }
  return out;
}
const light = read('light.css'), dark = read('dark.css'), scale = read('scale.css');
const dv = Object.fromEntries(dark.map((t) => [t.name, t.value]));
const esc = (s) => String(s).replace(/\|/g, '\\|');
const short = (v) => (v.startsWith('url(') ? '*SVG (Data-URI)*' : `\`${esc(v)}\``);

// Bedeutungen, wo der Quellkommentar fehlt oder zu knapp ist
const MEAN = {
  '--ut-color-scheme': 'UT-Farbschema (native Controls, Scrollbars): `light`/`dark`',
  '--pp-accent-hover': 'Primär-Fläche Hover', '--pp-accent-press': 'Primär-Fläche gedrückt', '--pp-accent-on': 'Text/Icon auf Primär-Fläche',
  '--pp-soft-hover': 'Sekundär-Button Hover', '--pp-soft-press': 'Sekundär-Button gedrückt',
  '--pp-link-text': 'Linkfarbe im Fließtext (= Tusche)', '--pp-link-underline': 'Unterstrich im Ruhezustand', '--pp-link-underline-hover': 'Unterstrich bei Hover (Akzent)',
  '--pp-selection': '::selection-Hintergrund', '--pp-selection-text': '::selection-Text',
  '--pp-focus-gap': 'Innenring/Lücke des Doppelrings (= `--pp-ground`: Leinwand, in schwebenden Ebenen die schwebende Fläche)',
  '--pp-ground': 'aktuelle Grundfläche: an der Wurzel die Leinwand, in Menüs, Dialogen, Popups und Seiten-Dialogen `--pp-surface-raised` (bridge §18). Für alles, was „in der Farbe des Grundes“ gezeichnet wird (Mitte des aktiven Wizard-Schritts, Aussparungen)',
  '--pp-raised-hover': 'Hover/Fokus auf schwebender Fläche (Menüeintrag, Tag im Date Picker, Icon-Liste, Kartensteuerung) – statt `--pp-soft`/`--pp-hover`, die dort dunkel kaum sichtbar sind',
  '--pp-tooltip-bg': 'Tooltip-Fläche (invertiert)', '--pp-tooltip-text': 'Tooltip-Text',
  '--pp-scrollbar-thumb': 'Scrollbar-Daumen', '--pp-scrollbar-thumb-hover': 'Scrollbar-Daumen Hover', '--pp-scrollbar-track': 'Scrollbar-Spur',
  '--pp-select-arrow': 'Pfeil der Select-Listen (Graphit, als Data-URI)',
  '--pp-ink-2': 'Labels, Nav-Text; im Code Eigenschaften, Variablen, Attribute',
  '--pp-surface-sunken': 'abgesenkte Fläche: Hinweisblöcke, Alerts ohne Hervorhebung, Code-Blöcke, Readonly',
  '--pp-float-shadow': 'Schatten schwebender Ebenen (Menüs, Dialoge, Popups) – nie auf der Leinwand',
};
for (const s of ['success', 'warning', 'danger', 'info']) {
  const de = { success: 'Erfolg', warning: 'Warnung', danger: 'Fehler/Gefahr', info: 'Information' }[s];
  MEAN[`--pp-${s}`] ??= `${de}: Fläche (Buttons, Badges)`;
  MEAN[`--pp-${s}-hover`] = `${de}: Fläche Hover`;
  MEAN[`--pp-${s}-on`] = `${de}: Text/Icon auf der Fläche`;
  MEAN[`--pp-${s}-text`] ??= `${de}: Textfarbe auf Leinwand/Tönung`;
  MEAN[`--pp-${s}-tint`] = `${de}: Tönung (Alert-/Meldungs-Hintergrund)`;
}
const ORDER = [1, 4, 7, 9, 12, 3, 8, 10, 2, 5, 11, 6];
for (let n = 1; n <= 15; n++) {
  const pos = ORDER.indexOf(n);
  MEAN[`--pp-cat-${n}`] = `→ \`--u-color-${n}\`${pos >= 0 ? `, Chart-Serie ${pos + 1}` : ' (keine Chart-Serie)'}`;
  MEAN[`--pp-cat-${n}-on`] = `→ \`--u-color-${n}-contrast\``;
}

function colorTable() {
  const rows = ['| Token | hell | dunkel | Bedeutung / Verwendung |', '|---|---|---|---|'];
  let group = '';
  for (const t of light) {
    if (t.name.match(/^--pp-cat-\d+(-on)?$/)) continue;
    if (t.group !== group) { group = t.group; rows.push(`| **${esc(group || 'Schema')}** | | | |`); }
    rows.push(`| \`${t.name}\` | ${short(t.value)} | ${short(dv[t.name] ?? '—')} | ${esc(MEAN[t.name] || t.comment.replace(/\(.*?\)/g, '').replace(/\s{2,}/g, ' ').trim() || '')} |`);
  }
  return rows.join('\n');
}
function catTable() {
  const rows = ['| n | Token | hell | on (hell) | dunkel | on (dunkel) | Chart-Serie | Name |', '|---:|---|---|---|---|---|---:|---|'];
  for (let n = 1; n <= 15; n++) {
    const L = light.find((t) => t.name === `--pp-cat-${n}`), Lo = light.find((t) => t.name === `--pp-cat-${n}-on`);
    const pos = ORDER.indexOf(n);
    const name = (Lo.comment || L.comment || '').replace(/^Serie\s+\d+\s*/, '');
    rows.push(`| ${n} | \`--pp-cat-${n}\` | \`${L.value}\` | \`${Lo.value}\` | \`${dv[`--pp-cat-${n}`]}\` | \`${dv[`--pp-cat-${n}-on`]}\` | ${pos >= 0 ? pos + 1 : '–'} | ${esc(name)} |`);
  }
  return rows.join('\n');
}
const SMEAN = {
  '--pp-font': 'Schriftfamilie der gesamten Oberfläche (Instrument Sans, dann System)',
  '--pp-font-mono': 'Monospace (Code, Markdown, Prism) – nie für UI-Beschriftungen',
  '--pp-fw-regular': 'normal: Fließtext, Zellen, Felder',
  '--pp-tracking-ui': 'Buttons',
  '--pp-canvas-pad-y': 'Innenabstand der Leinwand, senkrecht (Title Bar, Inhalt)',
  '--pp-duration': 'Dauer kurzer Zustandswechsel (Hover, Fokus); 0 s bei prefers-reduced-motion',
  '--pp-ease': 'Kurve für Zustandswechsel',
  '--pp-focus-ring-width': 'Breite des Fokusrings',
  '--pp-focus-ring-offset': 'Abstand Ring ↔ Element (zeigt den Grund als Innenring)',
  '--pp-focus-outline': 'fertiger outline-Wert; über --ut-focus-outline global aktiv',
  '--pp-focus-shadow': 'Doppelring als box-shadow (Grundfläche `--pp-focus-gap` innen, Magenta außen) – wo outline verdeckt würde; in schwebenden Ebenen neu aufgelöst (bridge §18)',
  '--pp-focus-shadow-inset': 'Ring nach innen (1 px Lücke in der Grundfläche) – Zeilen, Zellen, Nav-Einträge in overflow-Containern; in schwebenden Ebenen neu aufgelöst (bridge §18)',
  '--pp-focus-field-shadow': 'Felder: zusammen mit border-color = Ringfarbe ein 2-px-Ring ohne Layoutsprung',
  '--pp-link-underline-width': 'Unterstrich-Stärke im Fließtext',
  '--pp-link-underline-width-hover': 'Unterstrich-Stärke bei Hover',
  '--pp-link-underline-offset': 'Abstand Unterstrich ↔ Grundlinie',
  '--pp-region-gap': 'Abstand zwischen Regionen (→ --ut-region-margin)',
};
function scaleTable() {
  const rows = ['| Token | Wert | Bedeutung / Verwendung |', '|---|---|---|'];
  let group = '';
  for (const t of scale) {
    const g = t.media ? `${t.group} – Überschreibung \`@media ${t.media}\`` : t.group;
    if (g !== group) { group = g; rows.push(`| **${esc(group)}** | | |`); }
    rows.push(`| \`${t.name}\` | \`${esc(t.value)}\` | ${esc((!t.media && SMEAN[t.name]) || t.comment)} |`);
  }
  return rows.join('\n');
}
console.log('<!-- FARB-TOKENS -->\n' + colorTable() + '\n\n<!-- KATEGORIE -->\n' + catTable() + '\n\n<!-- SKALA -->\n' + scaleTable());
