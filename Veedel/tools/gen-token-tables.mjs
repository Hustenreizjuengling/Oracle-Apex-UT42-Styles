// Erzeugt die Token-Tabellen für Veedel/docs/ARCHITECTURE.md direkt aus den Quellen.
//   node Veedel/tools/gen-token-tables.mjs
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../../_tools/config.mjs';

const dir = path.join(ROOT, 'Veedel', 'src', 'tokens');
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
  '--ve-accent-hover': 'Blau-Fläche Hover (Nav-Block, Auswahl)', '--ve-accent-press': 'Blau-Fläche gedrückt', '--ve-accent-on': 'Text/Icon auf der Blau-Fläche',
  '--ve-soft-hover': 'neutrale Fläche Hover', '--ve-soft-press': 'neutrale Fläche gedrückt',
  '--ve-link-text': 'Linkfarbe im Fließtext (Markenblau)', '--ve-link-underline': 'Unterstrich im Ruhezustand', '--ve-link-underline-hover': 'Unterstrich bei Hover (Leuchtblau, doppelt so stark)',
  '--ve-action-hover': 'Signalrot Hover (Hot/Primary)', '--ve-action-press': 'Signalrot gedrückt', '--ve-action-on': 'Schrift auf Signalrot',
  '--ve-header-hover': 'Hover auf dem Kopfband (Header-Buttons)', '--ve-header-press': 'gedrückt/aktiv auf dem Kopfband',
  '--ve-band-text': 'Schrift auf dem Verlaufsband (Titel, Breadcrumb aktiv)',
  '--ve-selection': '::selection-Hintergrund', '--ve-selection-text': '::selection-Text',
  '--ve-focus-gap': 'Innenring/Lücke des Doppelrings (= `--ve-ground`: Fläche, in schwebenden Ebenen die schwebende Fläche)',
  '--ve-ground': 'aktuelle Grundfläche: an der Wurzel die Fläche (`--ve-surface`), in Menüs, Dialogen, Popups und Seiten-Dialogen `--ve-surface-raised` (bridge §18). Für alles, was „in der Farbe des Grundes“ gezeichnet wird (Mitte des aktiven Wizard-Schritts, Aussparungen)',
  '--ve-raised-hover': 'Hover/Fokus auf schwebender Fläche (Menüeintrag, Tag im Date Picker, Icon-Liste, Kartensteuerung) – statt `--ve-soft`/`--ve-hover`, die dort dunkel kaum sichtbar sind',
  '--ve-tooltip-bg': 'Tooltip-Fläche (invertiert)', '--ve-tooltip-text': 'Tooltip-Text',
  '--ve-scrollbar-thumb': 'Scrollbar-Daumen', '--ve-scrollbar-thumb-hover': 'Scrollbar-Daumen Hover', '--ve-scrollbar-track': 'Scrollbar-Spur',
  '--ve-select-arrow': 'Pfeil der Select-Listen (Grau, als Data-URI)',
  '--ve-ink-2': 'Unterebenen der Navigation, Icons; im Code Eigenschaften, Variablen, Attribute',
  '--ve-surface-sunken': 'abgesenkt in weißen Flächen: Toolbars, Code-Blöcke, Hinweisblöcke in Regionen, Readonly',
  '--ve-float-shadow': 'Schatten schwebender Ebenen (Menüs, Dialoge, Popups, Login-Fläche) – nie auf Regionen',
};
for (const s of ['success', 'warning', 'danger', 'info']) {
  const de = { success: 'Erfolg', warning: 'Warnung', danger: 'Fehler/Gefahr', info: 'Information' }[s];
  MEAN[`--ve-${s}`] ??= `${de}: Fläche (Buttons, Badges)`;
  MEAN[`--ve-${s}-hover`] = `${de}: Fläche Hover`;
  MEAN[`--ve-${s}-on`] = `${de}: Text/Icon auf der Fläche`;
  MEAN[`--ve-${s}-text`] ??= `${de}: Textfarbe auf Fläche/Tönung`;
  MEAN[`--ve-${s}-tint`] = `${de}: Tönung (Alert-/Meldungs-Hintergrund)`;
}
const ORDER = [1, 4, 7, 9, 12, 3, 8, 10, 2, 5, 11, 6];
for (let n = 1; n <= 15; n++) {
  const pos = ORDER.indexOf(n);
  MEAN[`--ve-cat-${n}`] = `→ \`--u-color-${n}\`${pos >= 0 ? `, Chart-Serie ${pos + 1}` : ' (keine Chart-Serie)'}`;
  MEAN[`--ve-cat-${n}-on`] = `→ \`--u-color-${n}-contrast\``;
}

function colorTable() {
  const rows = ['| Token | hell | dunkel | Bedeutung / Verwendung |', '|---|---|---|---|'];
  let group = '';
  for (const t of light) {
    if (t.name.match(/^--ve-cat-\d+(-on)?$/)) continue;
    if (t.group !== group) { group = t.group; rows.push(`| **${esc(group || 'Schema')}** | | | |`); }
    rows.push(`| \`${t.name}\` | ${short(t.value)} | ${short(dv[t.name] ?? '—')} | ${esc(MEAN[t.name] || t.comment.replace(/\(.*?\)/g, '').replace(/\s{2,}/g, ' ').trim() || '')} |`);
  }
  return rows.join('\n');
}
function catTable() {
  const rows = ['| n | Token | hell | on (hell) | dunkel | on (dunkel) | Chart-Serie | Name |', '|---:|---|---|---|---|---|---:|---|'];
  for (let n = 1; n <= 15; n++) {
    const L = light.find((t) => t.name === `--ve-cat-${n}`), Lo = light.find((t) => t.name === `--ve-cat-${n}-on`);
    const pos = ORDER.indexOf(n);
    const name = (Lo.comment || L.comment || '').replace(/^Serie\s+\d+\s*/, '');
    rows.push(`| ${n} | \`--ve-cat-${n}\` | \`${L.value}\` | \`${Lo.value}\` | \`${dv[`--ve-cat-${n}`]}\` | \`${dv[`--ve-cat-${n}-on`]}\` | ${pos >= 0 ? pos + 1 : '–'} | ${esc(name)} |`);
  }
  return rows.join('\n');
}
const SMEAN = {
  '--ve-font': 'Schriftfamilie der gesamten Oberfläche (Figtree als „Veedel Sans“, dann System)',
  '--ve-font-mono': 'Monospace (Code, Markdown, Prism) – nie für UI-Beschriftungen',
  '--ve-fw-regular': 'normal: Fließtext, Zellen, Felder',
  '--ve-tracking-ui': 'Buttons',
  '--ve-duration': 'Dauer kurzer Zustandswechsel (Hover, Fokus); 0 s bei prefers-reduced-motion',
  '--ve-ease': 'Kurve für Zustandswechsel',
  '--ve-focus-ring-width': 'Breite des Fokusrings',
  '--ve-focus-ring-offset': 'Abstand Ring ↔ Element (zeigt den Grund als Innenring)',
  '--ve-focus-outline': 'fertiger outline-Wert; über --ut-focus-outline global aktiv',
  '--ve-focus-shadow': 'Doppelring als box-shadow (Grundfläche `--ve-focus-gap` innen, Ringfarbe außen) – wo outline verdeckt würde; in schwebenden Ebenen neu aufgelöst (bridge §18)',
  '--ve-focus-shadow-inset': 'Ring nach innen (1 px Lücke in der Grundfläche) – Zeilen, Zellen, Nav-Einträge in overflow-Containern; in schwebenden Ebenen neu aufgelöst (bridge §18)',
  '--ve-focus-field-shadow': 'Felder: zusammen mit border-color = Ringfarbe ein 2-px-Ring ohne Layoutsprung',
  '--ve-link-underline-width': 'Unterstrich-Stärke im Fließtext',
  '--ve-link-underline-width-hover': 'Unterstrich-Stärke bei Hover',
  '--ve-link-underline-offset': 'Abstand Unterstrich ↔ Grundlinie',
  '--ve-region-gap': 'Abstand zwischen Regionen (→ --ut-region-margin)',
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
