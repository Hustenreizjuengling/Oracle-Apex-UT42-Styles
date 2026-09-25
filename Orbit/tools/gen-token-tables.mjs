// Erzeugt die Token-Tabellen für Orbit/docs/ARCHITECTURE.md direkt aus den Quellen.
//   node Orbit/tools/gen-token-tables.mjs
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../../_tools/config.mjs';

const dir = path.join(ROOT, 'Orbit', 'src', 'tokens');
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
  '--ob-accent-hover': 'Primär-Fläche Hover', '--ob-accent-press': 'Primär-Fläche gedrückt', '--ob-accent-on': 'Text/Icon auf Primär-Fläche',
  '--ob-soft-hover': 'neutrale Fläche Hover', '--ob-soft-press': 'neutrale Fläche gedrückt',
  '--ob-link-text': 'Linkfarbe im Fließtext (= Tinte)', '--ob-link-underline': 'Unterstrich im Ruhezustand', '--ob-link-underline-hover': 'Unterstrich bei Hover (Akzent)',
  '--ob-selection': '::selection-Hintergrund', '--ob-selection-text': '::selection-Text',
  '--ob-focus-gap': 'Innenring/Lücke des Doppelrings (= `--ob-ground`: Panel, in schwebenden Ebenen die schwebende Fläche)',
  '--ob-ground': 'aktuelle Grundfläche: an der Wurzel das Panel, in Menüs, Dialogen, Popups und Seiten-Dialogen `--ob-surface-raised` (bridge §18). Für alles, was „in der Farbe des Grundes“ gezeichnet wird (Mitte des aktiven Wizard-Schritts, Aussparungen)',
  '--ob-raised-hover': 'Hover/Fokus auf schwebender Fläche (Menüeintrag, Tag im Date Picker, Icon-Liste, Kartensteuerung) – statt `--ob-soft`/`--ob-hover`, die dort dunkel kaum sichtbar sind',
  '--ob-tooltip-bg': 'Tooltip-Fläche (invertiert)', '--ob-tooltip-text': 'Tooltip-Text',
  '--ob-scrollbar-thumb': 'Scrollbar-Daumen', '--ob-scrollbar-thumb-hover': 'Scrollbar-Daumen Hover', '--ob-scrollbar-track': 'Scrollbar-Spur',
  '--ob-select-arrow': 'Pfeil der Select-Listen (Stahlgrau, als Data-URI)',
  '--ob-ink-2': 'Labels, Nav-Text; im Code Eigenschaften, Variablen, Attribute',
  '--ob-surface-sunken': 'abgesenkte Fläche: Hinweisblöcke, Alerts ohne Hervorhebung, Code-Blöcke, Readonly',
  '--ob-float-shadow': 'Schatten schwebender Ebenen (Menüs, Dialoge, Popups) – Panels bleiben flach',
};
for (const s of ['success', 'warning', 'danger', 'info']) {
  const de = { success: 'Erfolg', warning: 'Warnung', danger: 'Fehler/Gefahr', info: 'Information' }[s];
  MEAN[`--ob-${s}`] ??= `${de}: Fläche (Buttons, Badges)`;
  MEAN[`--ob-${s}-hover`] = `${de}: Fläche Hover`;
  MEAN[`--ob-${s}-on`] = `${de}: Text/Icon auf der Fläche`;
  MEAN[`--ob-${s}-text`] ??= `${de}: Textfarbe auf Panel/Tönung`;
  MEAN[`--ob-${s}-tint`] = `${de}: Tönung (Alert-/Meldungs-Hintergrund)`;
}
const ORDER = [1, 4, 7, 9, 12, 3, 8, 10, 2, 5, 11, 6];
for (let n = 1; n <= 15; n++) {
  const pos = ORDER.indexOf(n);
  MEAN[`--ob-cat-${n}`] = `→ \`--u-color-${n}\`${pos >= 0 ? `, Chart-Serie ${pos + 1}` : ' (keine Chart-Serie)'}`;
  MEAN[`--ob-cat-${n}-on`] = `→ \`--u-color-${n}-contrast\``;
}

function colorTable() {
  const rows = ['| Token | hell | dunkel | Bedeutung / Verwendung |', '|---|---|---|---|'];
  let group = '';
  for (const t of light) {
    if (t.name.match(/^--ob-cat-\d+(-on)?$/)) continue;
    if (t.group !== group) { group = t.group; rows.push(`| **${esc(group || 'Schema')}** | | | |`); }
    rows.push(`| \`${t.name}\` | ${short(t.value)} | ${short(dv[t.name] ?? '—')} | ${esc(MEAN[t.name] || t.comment.replace(/\(.*?\)/g, '').replace(/\s{2,}/g, ' ').trim() || '')} |`);
  }
  return rows.join('\n');
}
function catTable() {
  const rows = ['| n | Token | hell | on (hell) | dunkel | on (dunkel) | Chart-Serie | Name |', '|---:|---|---|---|---|---|---:|---|'];
  for (let n = 1; n <= 15; n++) {
    const L = light.find((t) => t.name === `--ob-cat-${n}`), Lo = light.find((t) => t.name === `--ob-cat-${n}-on`);
    const pos = ORDER.indexOf(n);
    const name = (Lo.comment || L.comment || '').replace(/^Serie\s+\d+\s*/, '');
    rows.push(`| ${n} | \`--ob-cat-${n}\` | \`${L.value}\` | \`${Lo.value}\` | \`${dv[`--ob-cat-${n}`]}\` | \`${dv[`--ob-cat-${n}-on`]}\` | ${pos >= 0 ? pos + 1 : '–'} | ${esc(name)} |`);
  }
  return rows.join('\n');
}
const SMEAN = {
  '--ob-font': 'Schriftfamilie der gesamten Oberfläche (Barlow, dann System)',
  '--ob-font-label': 'Versal-Labels: Abschnitts-Label, Tabellenköpfe, App-Name, Metric-Card-Titel (Barlow Semi Condensed 600)',
  '--ob-font-mono': 'Monospace (Code, Markdown, Prism) – nie für UI-Beschriftungen',
  '--ob-fw-regular': 'normal: Fließtext, Zellen, Felder',
  '--ob-tracking-ui': 'Buttons',
  '--ob-page-pad-y': 'Seiteninnenabstand senkrecht (Title Bar, Inhalt)',
  '--ob-duration': 'Dauer kurzer Zustandswechsel (Hover, Fokus); 0 s bei prefers-reduced-motion',
  '--ob-ease': 'Kurve für Zustandswechsel',
  '--ob-focus-ring-width': 'Breite des Fokusrings',
  '--ob-focus-ring-offset': 'Abstand Ring ↔ Element (zeigt den Grund als Innenring)',
  '--ob-focus-outline': 'fertiger outline-Wert; über --ut-focus-outline global aktiv',
  '--ob-focus-shadow': 'Doppelring als box-shadow (Grundfläche `--ob-focus-gap` innen, Marke außen) – wo outline verdeckt würde; in schwebenden Ebenen neu aufgelöst (bridge §18)',
  '--ob-focus-shadow-inset': 'Ring nach innen (1 px Lücke in der Grundfläche) – Zeilen, Zellen, Nav-Einträge in overflow-Containern; in schwebenden Ebenen neu aufgelöst (bridge §18)',
  '--ob-focus-field-shadow': 'Felder: zusammen mit border-color = Ringfarbe ein 2-px-Ring ohne Layoutsprung',
  '--ob-link-underline-width': 'Unterstrich-Stärke im Fließtext',
  '--ob-link-underline-width-hover': 'Unterstrich-Stärke bei Hover',
  '--ob-link-underline-offset': 'Abstand Unterstrich ↔ Grundlinie',
  '--ob-region-gap': 'Abstand zwischen Regionen (→ --ut-region-margin)',
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
