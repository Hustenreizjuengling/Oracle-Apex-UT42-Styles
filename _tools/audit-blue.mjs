// Laufzeit-Audit: findet Oracle-Blautöne im berechneten DOM der Testbett-Seiten.
//
//   node _tools/audit-blue.mjs                       (Sets core,regions,forms,reports,dialogs; light+dark)
//   node _tools/audit-blue.mjs --sets core --styles dark --tol 14 --states
//   node _tools/audit-blue.mjs --pages 1201,1500 --app 9242
//   node _tools/audit-blue.mjs --theme Veedel --pages core,6100 --states --overlays --out _tmp/veedel/final/audit-blue.json
//
// Optionen:
//   --theme <ordner|none>  Theme-Ordner (Standard: Passepartout)
//   --styles a,b           Style-IDs aus theme.json (Standard: light,dark; --style gilt ebenso)
//   --app <id>             Testbett (Standard: 9042)
//   --pages <liste>        Kommaliste aus Seiten-IDs/Aliasen, Set-Namen aus testbed-pages.json und "all",
//                          auch gemischt (z. B. "core,6100" oder "forms,dialogs"); hat Vorrang vor --sets
//   --sets <liste>         nur Set-Namen (Standard: core,regions,forms,reports,dialogs)
//   --tol <ΔE00>           Trefferschwelle (Standard 12)
//   --overlays             öffnet je Seite Menüs, Date Picker, Popup-LOV, Dialoge (Liste OVERLAYS) und prüft sie
//   --states               erzwingt zusätzlich :hover und :focus/:focus-visible (CDP) auf bis zu 150 Bedienelementen je Seite
//   --scheme dark|light    prefers-color-scheme emulieren (für Auto-Styles)
//   --verbose              Zusatzausgaben
//   --dry-run              nur aufgelöste Seiten und Zieldatei ausgeben, kein Browser
//   --out <datei|pfad>     JSON-Ergebnis (Standard: _tmp/audit/audit-blue.json):
//                            reiner Dateiname  → _tmp/audit/<name>  (wie bisher)
//                            mit / bzw. \ oder absolut → relativ zum Projekt (ROOT) bzw. absolut;
//                              ohne Dateiendung, mit Schrägstrich am Ende oder als vorhandener Ordner → <ordner>/audit-blue.json
//                            relativer Pfad, der aus dem Projekt hinausführe (z. B. ../veedel/x.json aus älteren
//                              Aufrufen) → wie bisher relativ zu _tmp/audit/ (→ _tmp/veedel/x.json)
//
// Geprüft werden je Element (auch ::before/::after mit content): color, background-color,
// border-*-color, outline-color, box-shadow, text-decoration-color, fill, stroke, background-image.
// Treffer = CIEDE2000-Abstand <= --tol (Standard 12) zu einer Referenzfarbe der Oracle-Blau-Familie.
// Ergebnis: Konsole (gruppiert) + JSON (siehe --out)
import fs from 'node:fs';
import path from 'node:path';
import { launchLab } from './lib/lab.mjs';
import { pagesFile, resolvePages } from './lib/pages.mjs';
import { ROOT } from './config.mjs';
import { parseColor, colorsIn, deltaE2000, toLab, hex } from './lib/color.mjs';

const args = process.argv.slice(2);
const opt = {};
for (let i = 0; i < args.length; i++) {
  if (!args[i].startsWith('--')) continue;
  const k = args[i].slice(2), n = args[i + 1];
  if (n === undefined || n.startsWith('--')) opt[k] = true; else { opt[k] = n; i++; }
}
const theme = opt.theme === 'none' ? null : (opt.theme || 'Passepartout');
const styles = String(opt.styles || opt.style || 'light,dark').split(',').map((s) => s.trim()).filter(Boolean);
const app = Number(opt.app || 9042);
const tol = Number(opt.tol || 12);
const setSpec = String(opt.sets && opt.sets !== true ? opt.sets : 'core,regions,forms,reports,dialogs');
if (!opt.pages) {
  const unknown = setSpec.split(',').map((s) => s.trim()).filter((s) => s && s !== 'all' && !pagesFile.sets[s]);
  if (unknown.length) {
    console.error(`Unbekannte Sets: ${unknown.join(', ')} (vorhanden: ${Object.keys(pagesFile.sets).join(', ')}, all) – einzelne Seiten mit --pages`);
    process.exit(1);
  }
}
const pages = resolvePages(opt.pages ? opt.pages : setSpec, app);

// --out: reiner Dateiname → _tmp/audit/<name>; mit Pfadtrenner/absolut → relativ zu ROOT (siehe Kopf)
function outPath(spec) {
  const legacyBase = path.join(ROOT, '_tmp', 'audit');
  if (!spec || spec === true) return path.join(legacyBase, 'audit-blue.json');
  const s = String(spec);
  if (!path.isAbsolute(s) && !/[\\/]/.test(s)) return path.join(legacyBase, s);
  let p = path.resolve(ROOT, s);
  const rel = path.relative(ROOT, p);
  if (!path.isAbsolute(s) && (rel.startsWith('..') || path.isAbsolute(rel))) p = path.resolve(legacyBase, s);
  const isDir = /[\\/]$/.test(s) || !path.extname(p) || (fs.existsSync(p) && fs.statSync(p).isDirectory());
  return isDir ? path.join(p, 'audit-blue.json') : p;
}
const outFile = outPath(opt.out);
if (opt['dry-run']) {
  console.log(`Seiten (${pages.length}): ${pages.join(',')}\nStyles: ${styles.join(',')}  App: ${app}\nJSON: ${path.relative(ROOT, outFile) || outFile}`);
  process.exit(0);
}

// Oracle-Blau-Familie (Vita, Vita-Dark, app_ui-Fallbacks)
const REFS = ['#056AC8', '#0572CE', '#0677E1', '#0784F9', '#4696FC', '#045DAF', '#349BFA', '#006BD8', '#0076DF', '#056DCD', '#309FDB']
  .map((h) => ({ hex: h, lab: toLab(h) }));
function blueMatch(c) {
  if (!c || c.a === 0) return null;
  const lab = toLab(c);
  let best = null;
  for (const r of REFS) {
    const d = deltaE2000(lab, r.lab);
    if (!best || d < best.d) best = { ref: r.hex, d };
  }
  return best.d <= tol ? best : null;
}

// --overlays: Klick-Ziele je Seite (Ebene öffnen, prüfen, mit Escape schließen)
const OVERLAYS = {
  1101: ['#L1798907782847626067', '#t_Button_navControl'],   // Navbar-Menü "Theme Style", Navigationsschalter
  1201: ['#L1798907782847626061', '.t-NavigationBar .t-Button--navBar'],   // Navbar-Menü "Theme Version" (ID aus 26.1, Fallback per Klasse)
  1402: ['.a-IRR-button--actions', '.a-IRR-button--colSearch'],
  1410: ['button[id$=_ig_toolbar_actions_button]', '.a-Toolbar-group--search .a-Button'],
  1601: ['.a-Button--calendar', '.a-Button--popupLOV', '.apex-item-comboselect .a-Button--comboSelect'],
  1910: ['.t-Body-content .t-Button'],
  1911: ['.t-Body-content .t-Button'],
  1915: ['.t-Body-content .t-Button'],
  1916: ['.t-Body-content .t-Button'],
};
const PROPS = ['color', 'background-color', 'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color',
  'outline-color', 'box-shadow', 'text-decoration-color', 'fill', 'stroke', 'background-image', 'caret-color'];

// läuft im Browser: sammelt Farbwerte je Element
function collect(PROPS, stateOnly) {
  const els = stateOnly ? [...document.querySelectorAll('[data-pp-audit]')] : [...document.querySelectorAll('body, body *')];
  window.__ppEls = els;
  const out = [];
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && Number(cs.opacity) > 0;
  };
  els.forEach((el, i) => {
    const vis = visible(el);
    for (const pseudo of [null, '::before', '::after']) {
      const cs = getComputedStyle(el, pseudo);
      if (pseudo && (cs.content === 'none' || cs.content === 'normal')) continue;
      for (const p of PROPS) {
        const v = cs.getPropertyValue(p);
        if (!v || v === 'none' || !/rgb|#|color\(/.test(v)) continue;
        // Rahmenfarben nur, wenn der Rahmen sichtbar ist; outline nur bei outline-style != none
        if (p.startsWith('border-') && (cs.getPropertyValue(p.replace('-color', '-width')) === '0px' || cs.getPropertyValue(p.replace('-color', '-style')) === 'none')) continue;
        if (p === 'outline-color' && (cs.outlineStyle === 'none' || cs.outlineWidth === '0px')) continue;
        if (p === 'text-decoration-color' && !/underline|overline|line-through/.test(cs.textDecorationLine)) continue;
        if (p === 'caret-color' && !el.matches('input, textarea, [contenteditable]')) continue;
        out.push([i, pseudo || '', p, v, vis ? 1 : 0]);
      }
    }
  });
  return out;
}
function pathOf(i) {
  const el = window.__ppEls[i];
  const segs = [];
  for (let e = el; e && e.nodeType === 1 && e !== document.documentElement; e = e.parentElement) {
    let s = e.tagName.toLowerCase();
    if (e.id && !/^[A-Z0-9_]*\d{5,}/.test(e.id) && e.id.length < 40) s += '#' + e.id;
    const cls = [...e.classList].filter((c) => !/^js-|^is-(?!current|active|selected|focused)|^u-(?!color)/.test(c)).slice(0, 3);
    if (cls.length) s += '.' + cls.join('.');
    segs.unshift(s);
    if (e.tagName === 'BODY') break;
  }
  return segs.length > 6 ? ['…', ...segs.slice(-6)].join(' > ') : segs.join(' > ');
}

const hits = []; // { style, page, state, prop, pseudo, color, ref, d, visible, path }
for (const style of styles) {
  const lab = await launchLab({ theme, style, app, scheme: opt.scheme || null });
  const cdp = await lab.page.target().createCDPSession();
  await cdp.send('DOM.enable');
  await cdp.send('CSS.enable');
  try {
    for (const p of pages) {
      let page;
      try { page = await lab.open(p); } catch (e) { console.log(`FEHLER ${style}/${p}: ${e.message}`); continue; }
      const scan = async (state) => {
        // nur Hover/Fokus prüfen die markierten Bedienelemente; statisch und geöffnete Ebenen die ganze Seite
        const rows = await page.evaluate(collect, PROPS, state === 'hover' || state === 'focus');
        const bad = [];
        for (const [i, pseudo, prop, v, vis] of rows) {
          const cols = prop === 'box-shadow' || prop === 'background-image' ? colorsIn(v) : [parseColor(v)];
          for (const c of cols) {
            const m = blueMatch(c);
            if (m) bad.push({ i, pseudo, prop, color: hex(c) + (c.a < 1 ? `@${+c.a.toFixed(2)}` : ''), ref: m.ref, d: +m.d.toFixed(1), visible: !!vis });
          }
        }
        const uniq = [...new Set(bad.map((b) => b.i))];
        const paths = await page.evaluate((ids, fn) => { const f = new Function('return ' + fn)(); return ids.map((i) => [i, f(i)]); }, uniq, pathOf.toString());
        const pm = new Map(paths);
        for (const b of bad) hits.push({ style, page: p, state, prop: b.pseudo + b.prop, pseudo: b.pseudo, color: b.color, ref: b.ref, d: b.d, visible: b.visible, path: pm.get(b.i) });
      };
      await scan('static');
      // geöffnete Ebenen: Menüs, Date Picker, Popup-LOV, Dialoge (je Seite eine Liste von Klick-Zielen)
      if (opt.overlays) {
        for (const sel of OVERLAYS[p] || []) {
          const ok = await page.$(sel).then(async (el) => { if (!el) return false; await el.click().catch(() => {}); return true; });
          if (!ok) { if (opt.verbose) console.log(`  ${p}: ${sel} nicht gefunden`); continue; }
          await new Promise((r) => setTimeout(r, 900));
          await scan('open:' + sel);
          await page.keyboard.press('Escape').catch(() => {});
          await new Promise((r) => setTimeout(r, 300));
        }
      }
      if (opt.states) {
        // Bedienelemente markieren
        const n = await page.evaluate(() => {
          const sel = 'a[href], button, input:not([type=hidden]), select, textarea, [tabindex="0"], .a-TreeView-content, [role=tab], [role=menuitem], [role=option], .a-GV-cell, .a-IRR-header, .a-CardView-item';
          let k = 0;
          for (const el of document.querySelectorAll(sel)) {
            const r = el.getBoundingClientRect();
            if (r.width && r.height && k < 150) el.setAttribute('data-pp-audit', String(k++));
          }
          return k;
        });
        const { root } = await cdp.send('DOM.getDocument', { depth: -1 });
        const { nodeIds } = await cdp.send('DOM.querySelectorAll', { nodeId: root.nodeId, selector: '[data-pp-audit]' });
        for (const [state, forced] of [['hover', ['hover']], ['focus', ['focus', 'focus-visible']]]) {
          for (const id of nodeIds) await cdp.send('CSS.forcePseudoState', { nodeId: id, forcedPseudoClasses: forced }).catch(() => {});
          await scan(state);
          for (const id of nodeIds) await cdp.send('CSS.forcePseudoState', { nodeId: id, forcedPseudoClasses: [] }).catch(() => {});
        }
        if (opt.verbose) console.log(`  ${style}/${p}: ${n} Bedienelemente mit Zuständen geprüft`);
      }
      process.stdout.write(`.`);
    }
  } finally {
    await lab.close();
  }
}
console.log('');

// gruppieren: gleiche Eigenschaft + Farbe + letztes Pfadsegment
const groups = new Map();
for (const h of hits) {
  const last = (h.path || '').split(' > ').slice(-2).join(' > ');
  const key = `${h.state}|${h.prop}|${h.color}|${last}`;
  if (!groups.has(key)) groups.set(key, { ...h, last, pages: new Set(), styles: new Set(), count: 0, anyVisible: false });
  const g = groups.get(key);
  g.pages.add(h.page); g.styles.add(h.style); g.count++; g.anyVisible ||= h.visible;
}
const list = [...groups.values()].sort((a, b) => (b.anyVisible - a.anyVisible) || (b.count - a.count));
console.log(`Blau-Audit ${theme} (${styles.join('+')}, App ${app}, ${pages.length} Seiten, ΔE00 <= ${tol}): ${hits.length} Treffer in ${list.length} Gruppen`);
for (const g of list) {
  console.log(`${g.anyVisible ? 'SICHTBAR ' : 'verdeckt '} [${g.state}] ${g.prop} ${g.color} (≈${g.ref}, ΔE ${g.d}) ×${g.count}  Seiten ${[...g.pages].slice(0, 6).join(',')}${g.pages.size > 6 ? '…' : ''}  Styles ${[...g.styles].join('/')}\n    ${g.path}`);
}
fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, JSON.stringify({ theme, styles, app, tol, pages, hits: hits.length, groups: list.map((g) => ({ ...g, pages: [...g.pages], styles: [...g.styles] })) }, null, 1));
console.log(`JSON: ${path.relative(ROOT, outFile)}`);
