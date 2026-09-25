// Erzeugt die Token-Tabellen für Kracherl/docs/ARCHITECTURE.md direkt aus den Quellen.
//   node Kracherl/tools/gen-token-tables.mjs
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../../_tools/config.mjs';

const dir = path.join(ROOT, 'Kracherl', 'src', 'tokens');
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
  '--kr-band': 'das Band: Kopf, Login-Himmel, Wellenkante (hell Sonnengelb, dunkel Nachthimmel-Violett)',
  '--kr-band-ink': 'Text und Icons auf dem Band (Weiß wäre auf Gelb zu schwach)',
  '--kr-band-brand': 'Logo-Schriftzug auf dem Band',
  '--kr-band-hover': 'Hover auf dem Band (Header-Buttons, Menüleiste)', '--kr-band-press': 'gedrückt/aktiv auf dem Band',
  '--kr-bubble': 'Sprudelblase gefüllt (Band, Login)', '--kr-bubble-ring': 'Sprudelblase als Ring (Band, Login)',
  '--kr-sun': 'Etikett: aktueller Nav-Eintrag, aktive Seite der Pagination, Hero-Icon',
  '--kr-sun-ink': 'Schrift auf dem Etikett',
  '--kr-page': 'Seitengrund: Navigation, Title Bar, zwischen den Karten',
  '--kr-page-hover': 'Hover auf dem Seitengrund (Nav, Tabs)', '--kr-page-press': 'gedrückt auf dem Seitengrund',
  '--kr-heading': 'Überschriften: Seitentitel, Region-, Dialog-, Karten-Titel, Tabellenköpfe, Sekundär-Buttons',
  '--kr-brand-ink': 'Markentinte: Sekundär-Buttons, Tabellenköpfe, aktive Tabs, Nav- und Kachel-Icons (hell gleich den Überschriften, dunkel Flieder statt Gelb)',
  '--kr-mark': 'Brause-Orange: „hier bin ich“ – aktiver Tab, aktueller Link/Wizard-Schritt, Sterne',
  '--kr-accent-hover': 'Primär-Fläche Hover', '--kr-accent-press': 'Primär-Fläche gedrückt', '--kr-accent-on': 'Text/Icon auf der Primär-Fläche',
  '--kr-soft-hover': 'Sekundär-Button Hover', '--kr-soft-press': 'Sekundär-Button gedrückt',
  '--kr-link-text': 'Linkfarbe im Fließtext (Violett)', '--kr-link-underline': 'Unterstrich im Ruhezustand', '--kr-link-underline-hover': 'Unterstrich bei Hover (Orange)',
  '--kr-selection': '::selection-Hintergrund', '--kr-selection-text': '::selection-Text',
  '--kr-focus-gap': 'Innenring/Lücke des Doppelrings (= `--kr-ground`: Region, in schwebenden Ebenen die schwebende Fläche)',
  '--kr-ground': 'aktuelle Grundfläche: an der Wurzel die Region, in Menüs, Dialogen, Popups und Seiten-Dialogen `--kr-surface-raised` (bridge §18). Für alles, was „in der Farbe des Grundes“ gezeichnet wird (Mitte des aktiven Wizard-Schritts, Aussparungen)',
  '--kr-raised-hover': 'Hover/Fokus auf schwebender Fläche (Menüeintrag, Tag im Date Picker, Icon-Liste, Kartensteuerung) – statt `--kr-soft`/`--kr-hover`, die dort dunkel kaum sichtbar sind',
  '--kr-tooltip-bg': 'Tooltip-Fläche (invertiert)', '--kr-tooltip-text': 'Tooltip-Text',
  '--kr-scrollbar-thumb': 'Scrollbar-Daumen', '--kr-scrollbar-thumb-hover': 'Scrollbar-Daumen Hover', '--kr-scrollbar-track': 'Scrollbar-Spur',
  '--kr-select-arrow': 'Pfeil der Select-Listen (als Data-URI)',
  '--kr-ink-2': 'Labels, Nav-Text; im Code Eigenschaften, Variablen, Attribute',
  '--kr-surface-sunken': 'abgesenkte Fläche: Tabellenkopf-Band, Hinweisblöcke, Code-Blöcke, Readonly',
  '--kr-card-shadow': 'Region/Karte: nur ein Hauch unter der Kante (dunkel keiner)',
  '--kr-float-shadow': 'Schatten schwebender Ebenen (Menüs, Dialoge, Popups, Login-Karte)',
};
for (const s of ['success', 'warning', 'danger', 'info']) {
  const de = { success: 'Erfolg', warning: 'Warnung', danger: 'Fehler/Gefahr', info: 'Information' }[s];
  MEAN[`--kr-${s}`] ??= `${de}: Fläche (Buttons, Badges)`;
  MEAN[`--kr-${s}-hover`] = `${de}: Fläche Hover`;
  MEAN[`--kr-${s}-on`] = `${de}: Text/Icon auf der Fläche`;
  MEAN[`--kr-${s}-text`] ??= `${de}: Textfarbe auf Region/Tönung`;
  MEAN[`--kr-${s}-tint`] = `${de}: Tönung (Alert-/Meldungs-Hintergrund)`;
}
const ORDER = [1, 4, 7, 9, 12, 3, 8, 10, 2, 5, 11, 6];
for (let n = 1; n <= 15; n++) {
  const pos = ORDER.indexOf(n);
  MEAN[`--kr-cat-${n}`] = `→ \`--u-color-${n}\`${pos >= 0 ? `, Chart-Serie ${pos + 1}` : ' (keine Chart-Serie)'}`;
  MEAN[`--kr-cat-${n}-on`] = `→ \`--u-color-${n}-contrast\``;
}

function colorTable() {
  const rows = ['| Token | hell | dunkel | Bedeutung / Verwendung |', '|---|---|---|---|'];
  let group = '';
  for (const t of light) {
    if (t.name.match(/^--kr-cat-\d+(-on)?$/)) continue;
    if (t.group !== group) { group = t.group; rows.push(`| **${esc(group || 'Schema')}** | | | |`); }
    rows.push(`| \`${t.name}\` | ${short(t.value)} | ${short(dv[t.name] ?? '—')} | ${esc(MEAN[t.name] || t.comment.replace(/\(.*?\)/g, '').replace(/\s{2,}/g, ' ').trim() || '')} |`);
  }
  return rows.join('\n');
}
function catTable() {
  const rows = ['| n | Token | hell | on (hell) | dunkel | on (dunkel) | Chart-Serie | Name |', '|---:|---|---|---|---|---|---:|---|'];
  for (let n = 1; n <= 15; n++) {
    const L = light.find((t) => t.name === `--kr-cat-${n}`), Lo = light.find((t) => t.name === `--kr-cat-${n}-on`);
    const pos = ORDER.indexOf(n);
    const name = (Lo.comment || L.comment || '').replace(/^Serie\s+\d+\s*/, '');
    rows.push(`| ${n} | \`--kr-cat-${n}\` | \`${L.value}\` | \`${Lo.value}\` | \`${dv[`--kr-cat-${n}`]}\` | \`${dv[`--kr-cat-${n}-on`]}\` | ${pos >= 0 ? pos + 1 : '–'} | ${esc(name)} |`);
  }
  return rows.join('\n');
}
const SMEAN = {
  '--kr-font': 'Textschrift der Oberfläche: PT Sans (400/700), dann System',
  '--kr-font-slab': 'Überschriften, Logo, Login, Kennzahlen: Bitter (variabel, 700/800)',
  '--kr-font-mono': 'Monospace (Code, Markdown, Prism) – nie für UI-Beschriftungen',
  '--kr-fw-regular': 'normal: Fließtext, Zellen, Felder',
  '--kr-tracking-ui': 'Buttons',
  '--kr-wave': 'die Welle als Maske (einzelne, einfarbige Kante; Farbe = `--kr-band`)',
  '--kr-wave-rise': 'dieselbe Welle gespiegelt: Fläche mit Wellen-Oberkante (Login)',
  '--kr-duration': 'Dauer kurzer Zustandswechsel (Hover, Fokus); 0 s bei prefers-reduced-motion',
  '--kr-ease': 'Kurve für Zustandswechsel',
  '--kr-rise': 'Dauer eines Blasen-Durchlaufs auf der Login-Seite; 0 s bei prefers-reduced-motion',
  '--kr-focus-ring-width': 'Breite des Fokusrings',
  '--kr-focus-ring-offset': 'Abstand Ring ↔ Element (zeigt den Grund als Innenring)',
  '--kr-focus-outline': 'fertiger outline-Wert; über --ut-focus-outline global aktiv',
  '--kr-focus-shadow': 'Doppelring als box-shadow (Grundfläche `--kr-focus-gap` innen, Orange außen) – wo outline verdeckt würde; in schwebenden Ebenen neu aufgelöst (bridge §18)',
  '--kr-focus-shadow-inset': 'Ring nach innen (1 px Lücke in der Grundfläche) – Zeilen, Zellen, Nav-Einträge in overflow-Containern; in schwebenden Ebenen neu aufgelöst (bridge §18)',
  '--kr-focus-field-shadow': 'Felder: zusammen mit border-color = Ringfarbe ein 2-px-Ring ohne Layoutsprung',
  '--kr-link-underline-width': 'Unterstrich-Stärke im Fließtext',
  '--kr-link-underline-width-hover': 'Unterstrich-Stärke bei Hover',
  '--kr-link-underline-offset': 'Abstand Unterstrich ↔ Grundlinie',
  '--kr-region-gap': 'Abstand zwischen Regionen (→ --ut-region-margin)',
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
