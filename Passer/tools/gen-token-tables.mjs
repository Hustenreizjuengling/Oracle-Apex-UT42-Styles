// Erzeugt die Token-Tabellen für Passer/docs/ARCHITECTURE.md direkt aus den Quellen.
//   node Passer/tools/gen-token-tables.mjs
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../../_tools/config.mjs';

const dir = path.join(ROOT, 'Passer', 'src', 'tokens');
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
  '--pa-accent-hover': 'Primär-Fläche Hover', '--pa-accent-press': 'Primär-Fläche gedrückt', '--pa-accent-on': 'Text/Icon auf Primär-Fläche',
  '--pa-soft-hover': 'Sekundär-Button Hover', '--pa-soft-press': 'Sekundär-Button gedrückt',
  '--pa-link-text': 'Linkfarbe im Fließtext (= Tusche)', '--pa-link-underline': 'Unterstrich im Ruhezustand', '--pa-link-underline-hover': 'Unterstrich bei Hover (Teal)',
  '--pa-selection': '::selection-Hintergrund', '--pa-selection-text': '::selection-Text',
  '--pa-focus-gap': 'Innenring/Lücke des Doppelrings (= `--pa-ground`: Papier, in schwebenden Ebenen die schwebende Fläche)',
  '--pa-ground': 'aktuelle Grundfläche: an der Wurzel das Papier, in Menüs, Dialogen, Popups und Seiten-Dialogen `--pa-surface-raised` (bridge §18). Für alles, was „in der Farbe des Grundes“ gezeichnet wird (Mitte des aktiven Wizard-Schritts, Aussparungen)',
  '--pa-raised-hover': 'Hover/Fokus auf schwebender Fläche (Menüeintrag, Tag im Date Picker, Icon-Liste, Kartensteuerung) – statt `--pa-soft`/`--pa-hover`, die dort dunkel kaum sichtbar sind',
  '--pa-tooltip-bg': 'Tooltip-Fläche (invertiert)', '--pa-tooltip-text': 'Tooltip-Text',
  '--pa-scrollbar-thumb': 'Scrollbar-Daumen', '--pa-scrollbar-track': 'Scrollbar-Spur',
  '--pa-select-arrow': 'Pfeil der Select-Listen (Nebenschrift, als Data-URI)',
  '--pa-grain': 'Papierkorn: feTurbulence-Kachel als Data-URI (einmal gerastert, kein CSS-Filter)',
  '--pa-ink-2': 'Labels, Nav-Text; im Code Eigenschaften, Variablen, Attribute',
  '--pa-surface-sunken': 'Rastertönung: Hinweisblöcke, Alerts ohne Hervorhebung, Code-Blöcke, Segment-Spur',
  '--pa-float-shadow': 'gestapelter Bogen: Kante, harter Versatz in Tusche, weicher Schatten – nur schwebende Ebenen (Menüs, Dialoge, Popups)',
};
for (const s of ['success', 'warning', 'danger', 'info']) {
  const de = { success: 'Erfolg', warning: 'Warnung', danger: 'Fehler/Gefahr', info: 'Information' }[s];
  MEAN[`--pa-${s}`] ??= `${de}: Fläche (Buttons, Badges)`;
  MEAN[`--pa-${s}-hover`] = `${de}: Fläche Hover`;
  MEAN[`--pa-${s}-on`] = `${de}: Text/Icon auf der Fläche`;
  MEAN[`--pa-${s}-text`] ??= `${de}: Textfarbe auf Papier, Bogen und Tönung`;
  MEAN[`--pa-${s}-tint`] = `${de}: Tönung (Alert-/Meldungs-Hintergrund)`;
}
const ORDER = [1, 4, 7, 9, 12, 3, 8, 10, 2, 5, 11, 6];
for (let n = 1; n <= 15; n++) {
  const pos = ORDER.indexOf(n);
  MEAN[`--pa-cat-${n}`] = `→ \`--u-color-${n}\`${pos >= 0 ? `, Chart-Serie ${pos + 1}` : ' (keine Chart-Serie)'}`;
  MEAN[`--pa-cat-${n}-on`] = `→ \`--u-color-${n}-contrast\``;
}

function colorTable() {
  const rows = ['| Token | hell | dunkel | Bedeutung / Verwendung |', '|---|---|---|---|'];
  let group = '';
  for (const t of light) {
    if (t.name.match(/^--pa-cat-\d+(-on)?$/)) continue;
    if (t.group !== group) { group = t.group; rows.push(`| **${esc(group || 'Schema')}** | | | |`); }
    rows.push(`| \`${t.name}\` | ${short(t.value)} | ${short(dv[t.name] ?? '—')} | ${esc(MEAN[t.name] || t.comment.replace(/\(.*?\)/g, '').replace(/\s{2,}/g, ' ').trim() || '')} |`);
  }
  return rows.join('\n');
}
function catTable() {
  const rows = ['| n | Token | hell | on (hell) | dunkel | on (dunkel) | Chart-Serie | Name |', '|---:|---|---|---|---|---|---:|---|'];
  for (let n = 1; n <= 15; n++) {
    const L = light.find((t) => t.name === `--pa-cat-${n}`), Lo = light.find((t) => t.name === `--pa-cat-${n}-on`);
    const pos = ORDER.indexOf(n);
    const name = (Lo.comment || L.comment || '').replace(/^Serie\s+\d+\s*/, '');
    rows.push(`| ${n} | \`--pa-cat-${n}\` | \`${L.value}\` | \`${Lo.value}\` | \`${dv[`--pa-cat-${n}`]}\` | \`${dv[`--pa-cat-${n}-on`]}\` | ${pos >= 0 ? pos + 1 : '–'} | ${esc(name)} |`);
  }
  return rows.join('\n');
}
const SMEAN = {
  '--pa-font': 'Schriftfamilie der gesamten Oberfläche (Bricolage Grotesque als „Passer Grotesk“, dann System)',
  '--pa-font-mono': 'Monospace (Code, Markdown, Prism) – nie für UI-Beschriftungen',
  '--pa-fw-regular': 'normal: Fließtext, Zellen, Felder',
  '--pa-tracking-ui': 'Buttons',
  '--pa-page-pad-y': 'Innenabstand des Inhalts, senkrecht (Title Bar, Inhalt)',
  '--pa-duration': 'Dauer kurzer Zustandswechsel (Hover, Fokus); 0 s bei prefers-reduced-motion',
  '--pa-ease': 'Kurve für Zustandswechsel',
  '--pa-focus-ring-width': 'Breite des Fokusrings',
  '--pa-focus-ring-offset': 'Abstand Ring ↔ Element (zeigt den Grund als Innenring)',
  '--pa-focus-outline': 'fertiger outline-Wert; über --ut-focus-outline global aktiv',
  '--pa-focus-shadow': 'Doppelring als box-shadow (Grundfläche `--pa-focus-gap` innen, Teal außen) – wo outline verdeckt würde; in schwebenden Ebenen neu aufgelöst (bridge §18)',
  '--pa-focus-shadow-inset': 'Ring nach innen (1 px Lücke in der Grundfläche) – Zeilen, Zellen, Nav-Einträge in overflow-Containern; in schwebenden Ebenen neu aufgelöst (bridge §18)',
  '--pa-focus-field-shadow': 'Felder: zusammen mit border-color = Ringfarbe ein 2-px-Ring ohne Layoutsprung',
  '--pa-link-underline-width': 'Unterstrich-Stärke im Fließtext',
  '--pa-link-underline-width-hover': 'Unterstrich-Stärke bei Hover',
  '--pa-link-underline-offset': 'Abstand Unterstrich ↔ Grundlinie',
  '--pa-region-gap': 'Abstand zwischen Regionen (→ --ut-region-margin)',
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
