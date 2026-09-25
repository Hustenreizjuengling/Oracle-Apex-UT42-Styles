// Erzeugt die Token-Tabellen für Frequenz/docs/ARCHITECTURE.md direkt aus den Quellen.
//   node Frequenz/tools/gen-token-tables.mjs
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../../_tools/config.mjs';

const dir = path.join(ROOT, 'Frequenz', 'src', 'tokens');
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
  '--fq-accent-hover': 'Primär-Fläche Hover', '--fq-accent-press': 'Primär-Fläche gedrückt', '--fq-accent-on': 'Text/Icon auf Primär-Fläche',
  '--fq-soft-hover': 'weiche Füllung Hover', '--fq-soft-press': 'weiche Füllung gedrückt',
  '--fq-link-text': 'Linkfarbe im Fließtext (Petrol)', '--fq-link-underline': 'Unterstrich im Ruhezustand', '--fq-link-underline-hover': 'Unterstrich bei Hover (Anthrazit)',
  '--fq-selection': '::selection-Hintergrund', '--fq-selection-text': '::selection-Text',
  '--fq-strong': 'kräftige Neutralfläche: Button-Typ Primary, aktive Pille, aktive Seite der Pagination (dunkel invertiert)',
  '--fq-strong-hover': 'kräftige Neutralfläche Hover', '--fq-strong-on': 'Text auf der kräftigen Neutralfläche',
  '--fq-wash-press': 'gedrückt auf beliebigem Grund (transparent)', '--fq-field-readonly': 'schreibgeschützte Felder',
  '--fq-button-fill': 'Fläche der Standard-Buttons: hell ohne Fläche (Kontur), dunkel Tafelgrau – in der Tafel unsichtbar, auf fest weißen Flächen aus App-CSS bleibt die Schrift lesbar',
  '--fq-button-fill-hover': 'Standard-Button Hover/Fokus (hell Schleier, dunkel deckend)', '--fq-button-fill-press': 'Standard-Button gedrückt (hell Schleier, dunkel deckend)',
  '--fq-focus-ring-color': 'Fokusring (Anthrazit, dunkel fast Weiß) – unabhängig vom Magenta',
  '--fq-focus-gap': 'Innenring/Lücke des Doppelrings (= `--fq-ground`: die Seite, in schwebenden Ebenen die schwebende Fläche)',
  '--fq-ground': 'aktuelle Grundfläche: an der Wurzel die Seite, in Menüs, Dialogen, Popups und Seiten-Dialogen `--fq-surface-raised` (bridge §18). Für alles, was „in der Farbe des Grundes“ gezeichnet wird (Mitte des aktiven Wizard-Schritts, Aussparungen)',
  '--fq-raised-hover': 'Hover/Fokus auf schwebender Fläche (Menüeintrag, Tag im Date Picker, Icon-Liste, Kartensteuerung)',
  '--fq-tooltip-bg': 'Tooltip-Fläche (invertiert)', '--fq-tooltip-text': 'Tooltip-Text',
  '--fq-scrollbar-thumb': 'Scrollbar-Daumen', '--fq-scrollbar-thumb-hover': 'Scrollbar-Daumen Hover', '--fq-scrollbar-track': 'Scrollbar-Spur',
  '--fq-select-arrow': 'Pfeil der Select-Listen (dünn, in --fq-muted wie die Feldsymbole; als Data-URI)',
  '--fq-ink-2': 'Labels, Unterebenen der Navigation; im Code Eigenschaften, Variablen, Attribute',
  '--fq-surface-sunken': 'abgesenkte Fläche: Toolbars, Code-Blöcke, Readonly, Kalender-Köpfe',
  '--fq-float-shadow': 'Schatten schwebender Ebenen (Menüs, Dialoge, Popups) – nie auf Tafeln',
};
for (const s of ['success', 'warning', 'danger', 'info']) {
  const de = { success: 'Erfolg', warning: 'Warnung', danger: 'Fehler/Gefahr', info: 'Information' }[s];
  MEAN[`--fq-${s}`] ??= `${de}: Fläche (Buttons, Badges)`;
  MEAN[`--fq-${s}-hover`] = `${de}: Fläche Hover`;
  MEAN[`--fq-${s}-on`] = `${de}: Text/Icon auf der Fläche`;
  MEAN[`--fq-${s}-text`] ??= `${de}: Textfarbe auf Seite, Tafel und Tönung`;
  MEAN[`--fq-${s}-tint`] = `${de}: Tönung (Alert-/Meldungs-Hintergrund)`;
}
const ORDER = [1, 4, 7, 9, 12, 3, 8, 10, 2, 5, 11, 6];
for (let n = 1; n <= 15; n++) {
  const pos = ORDER.indexOf(n);
  MEAN[`--fq-cat-${n}`] = `→ \`--u-color-${n}\`${pos >= 0 ? `, Chart-Serie ${pos + 1}` : ' (keine Chart-Serie)'}`;
  MEAN[`--fq-cat-${n}-on`] = `→ \`--u-color-${n}-contrast\``;
}

function colorTable() {
  const rows = ['| Token | hell | dunkel | Bedeutung / Verwendung |', '|---|---|---|---|'];
  let group = '';
  for (const t of light) {
    if (t.name.match(/^--fq-cat-\d+(-on)?$/)) continue;
    if (t.group !== group) { group = t.group; rows.push(`| **${esc(group || 'Schema')}** | | | |`); }
    rows.push(`| \`${t.name}\` | ${short(t.value)} | ${short(dv[t.name] ?? '—')} | ${esc(MEAN[t.name] || t.comment.replace(/\(.*?\)/g, '').replace(/\s{2,}/g, ' ').trim() || '')} |`);
  }
  return rows.join('\n');
}
function catTable() {
  const rows = ['| n | Token | hell | on (hell) | dunkel | on (dunkel) | Chart-Serie | Name |', '|---:|---|---|---|---|---|---:|---|'];
  for (let n = 1; n <= 15; n++) {
    const L = light.find((t) => t.name === `--fq-cat-${n}`), Lo = light.find((t) => t.name === `--fq-cat-${n}-on`);
    const pos = ORDER.indexOf(n);
    const name = (Lo.comment || L.comment || '').replace(/^Serie\s+\d+\s*/, '');
    rows.push(`| ${n} | \`--fq-cat-${n}\` | \`${L.value}\` | \`${Lo.value}\` | \`${dv[`--fq-cat-${n}`]}\` | \`${dv[`--fq-cat-${n}-on`]}\` | ${pos >= 0 ? pos + 1 : '–'} | ${esc(name)} |`);
  }
  return rows.join('\n');
}
const SMEAN = {
  '--fq-font': 'Schriftfamilie der gesamten Oberfläche (Onest als „Frequenz Sans“, dann System)',
  '--fq-font-mono': 'Monospace (Code, Markdown, Prism) – nie für UI-Beschriftungen',
  '--fq-fw-regular': 'normal: Fließtext, Zellen, Felder',
  '--fq-tracking-ui': 'Buttons',
  '--fq-page-pad-y': 'Seiten-Innenabstand senkrecht (Title Bar, Inhalt)',
  '--fq-duration': 'Dauer kurzer Zustandswechsel (Hover, Fokus); 0 s bei prefers-reduced-motion',
  '--fq-ease': 'Kurve für Zustandswechsel',
  '--fq-focus-ring-width': 'Breite des Fokusrings',
  '--fq-focus-ring-offset': 'Abstand Ring ↔ Element (zeigt den Grund als Lücke)',
  '--fq-focus-outline': 'fertiger outline-Wert; über --ut-focus-outline global aktiv',
  '--fq-focus-shadow': 'Doppelring als box-shadow (Grundfläche `--fq-focus-gap` innen, Ring außen) – wo outline verdeckt würde; in schwebenden Ebenen neu aufgelöst (bridge §18)',
  '--fq-focus-shadow-inset': 'Ring nach innen (1 px Lücke in der Grundfläche) – Zeilen, Zellen, Nav-Einträge in overflow-Containern; in schwebenden Ebenen neu aufgelöst (bridge §18)',
  '--fq-focus-field-shadow': 'Felder: zusammen mit border-color = Ringfarbe ein 2-px-Ring ohne Layoutsprung',
  '--fq-link-underline-width': 'Unterstrich-Stärke im Fließtext',
  '--fq-link-underline-width-hover': 'Unterstrich-Stärke bei Hover',
  '--fq-link-underline-offset': 'Abstand Unterstrich ↔ Grundlinie',
  '--fq-region-gap': 'Abstand zwischen Regionen/Tafeln (→ --ut-region-margin)',
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
