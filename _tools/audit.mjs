// Automatisches Laufzeit-Audit eines Themes über viele Testbett-Seiten.
//
//   node _tools/audit.mjs --theme Passepartout --style light,dark --pages core [--app 9042,9242] [--mobile] [--out <ordner>]
//
// --pages: Kommaliste aus Seiten-IDs/Aliasen, Set-Namen aus testbed-pages.json und "all", auch gemischt
//          (z. B. "forms,6303,6304"); Standard: core. --out: Ordner relativ zum Projekt (Standard: _tmp/audit).
//
// Prüft je Seite im gerenderten DOM:
//   blue      Reste von Oracle-Blau (ΔE < 12 zu #056AC8, #0572CE, #0677E1, #0784F9, #4696FC)
//   contrast  sichtbarer Text unter WCAG AA (4,5:1 bzw. 3:1 für großen Text)
//   unrated   Text über Bild/Verlauf – "nicht bewertbar (Bild/Verlauf)", zählt nicht als Kontrastfehler
//   overflow  horizontaler Überlauf der Seite bzw. Elemente, die über den Viewport ragen
//   js        JavaScript-Fehler (Achtung: das Testbett wirft "[object pt]" auch ohne Theme)
//
// Regeln der Kontrastprüfung:
//   - Bewertet wird nur Text, der selbst sichtbar ist: nicht bei visibility hidden/collapse und nicht, wenn
//     die Deckkraft von Element und allen Vorfahren zusammen < 0,01 ist (z. B. ausgeblendete Carousel-Folien, 1205).
//   - Hintergrund = Hintergrundfarben vom Element aufwärts bis zur ersten deckenden Fläche ("malender Hintergrund").
//     Liegt auf diesem Weg ein background-image (url() oder Verlauf) oder unter der Textmitte ein <img>, <video>,
//     <canvas> bzw. eine url()-Fläche innerhalb dieses Hintergrunds (z. B. Karten mit Foto, 3110), ist der Kontrast
//     nicht bewertbar: Eintrag unter "unrated" mit Grund Bild/Verlauf, kein Fehler. Weiter bewertet werden
//     Hintergrund-Linien (Ebene nicht wiederholt, eine Kante <= 4 px, z. B. Haarlinien), einfarbige, flächige
//     Verläufe (linear-gradient(x, x)) – die zählen als Farbe – und gekachelte Texturen (in beide Richtungen
//     wiederholt, Kachel <= 512 px, z. B. Papierkorn): gemessen gegen die Farbe darunter, Befund mit texture: true.
//   - Grenze 4,5:1 (großer Text 3:1): verglichen wird das auf zwei Nachkommastellen gerundete Verhältnis, wie es
//     Prüfwerkzeuge anzeigen – 4,495:1 wird als 4,50 angezeigt und besteht, 4,494:1 (-> 4,49) nicht.
// Ergebnis: Konsolen-Zusammenfassung + <out>/report.json (bzw. report-mobile.json)
import fs from 'node:fs';
import path from 'node:path';
import { launchLab } from './lib/lab.mjs';
import { resolvePages } from './lib/pages.mjs';
import { ROOT } from './config.mjs';

const args = process.argv.slice(2);
const opt = {};
for (let i = 0; i < args.length; i++) {
  if (!args[i].startsWith('--')) continue;
  const next = args[i + 1];
  if (next === undefined || next.startsWith('--')) opt[args[i].slice(2)] = true;
  else opt[args[i].slice(2)] = args[++i];
}
const theme = !opt.theme || opt.theme === 'none' ? null : opt.theme;
const styles = String(opt.style || 'light').split(',');
const apps = String(opt.app || '9042').split(',').map(Number);
const mobile = !!opt.mobile;
const outDir = path.resolve(ROOT, opt.out || '_tmp/audit');
fs.mkdirSync(outDir, { recursive: true });

// Wird im Browser ausgeführt.
function pageAudit() {
  const BLUES = ['#056AC8', '#0572CE', '#0677E1', '#0784F9', '#4696FC'];
  const parse = (c) => {
    // Chrome liefert color-mix()-Ergebnisse als color(srgb r g b / a)
    const cs = c && c.match(/color\(srgb ([^)]+)\)/);
    if (cs) {
      const q = cs[1].split(/[ /]+/).filter(Boolean).map(Number);
      return { r: q[0] * 255, g: q[1] * 255, b: q[2] * 255, a: q.length > 3 ? q[3] : 1 };
    }
    const m = c && c.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };
  const hex = (h) => ({ r: parseInt(h.slice(1, 3), 16), g: parseInt(h.slice(3, 5), 16), b: parseInt(h.slice(5, 7), 16), a: 1 });
  const lin = (v) => ((v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  const lum = (c) => 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
  const ratio = (a, b) => {
    const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
    return (x + 0.05) / (y + 0.05);
  };
  const lab = (c) => {
    let [x, y, z] = [lin(c.r), lin(c.g), lin(c.b)];
    [x, y, z] = [
      (x * 0.4124 + y * 0.3576 + z * 0.1805) / 0.95047,
      x * 0.2126 + y * 0.7152 + z * 0.0722,
      (x * 0.0193 + y * 0.1192 + z * 0.9505) / 1.08883,
    ];
    const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
    return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
  };
  const blueLabs = BLUES.map((h) => lab(hex(h)));
  const isBlue = (c) => {
    if (!c || c.a < 0.2) return false;
    const L = lab(c);
    return blueLabs.some((b) => Math.hypot(L[0] - b[0], L[1] - b[1], L[2] - b[2]) < 12);
  };
  const blend = (top, bottom) => {
    const a = top.a + bottom.a * (1 - top.a);
    if (!a) return { r: 0, g: 0, b: 0, a: 0 };
    return {
      r: (top.r * top.a + bottom.r * bottom.a * (1 - top.a)) / a,
      g: (top.g * top.a + bottom.g * bottom.a * (1 - top.a)) / a,
      b: (top.b * top.a + bottom.b * bottom.a * (1 - top.a)) / a,
      a,
    };
  };
  const pathOf = (el) => {
    const parts = [];
    for (let e = el; e && e.nodeType === 1 && parts.length < 4; e = e.parentElement) {
      let s = e.tagName.toLowerCase();
      if (e.id) s += '#' + e.id;
      else if (e.classList.length) s += '.' + [...e.classList].slice(0, 2).join('.');
      parts.unshift(s);
    }
    return parts.join(' > ');
  };
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return false;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.visibility === 'collapse' || cs.display === 'none' || Number(cs.opacity) === 0) return false;
    if (cs.clip === 'rect(0px, 0px, 0px, 0px)' || cs.clipPath === 'inset(50%)') return false;
    return true;
  };
  // Deckkraft von Element und allen Vorfahren zusammen
  const opacityOf = (el) => {
    let op = 1;
    for (let e = el; e; e = e.parentElement) op *= Number(getComputedStyle(e).opacity);
    return op;
  };
  // Komma- bzw. Leerzeichen-Listen berechneter Werte auf oberster Klammerebene zerlegen
  const splitTop = (str, sep) => {
    const out = [];
    let depth = 0;
    let cur = '';
    for (const ch of str) {
      if (ch === '(') depth++;
      else if (ch === ')') depth--;
      const isSep = sep === ' ' ? ch === ' ' || ch === '\t' || ch === '\n' : ch === sep;
      if (!depth && isSep) {
        if (cur.trim()) out.push(cur.trim());
        cur = '';
      } else cur += ch;
    }
    if (cur.trim()) out.push(cur.trim());
    return out;
  };
  const COLOR_RE = /rgba?\([^)]*\)|color\(srgb[^)]*\)/g;
  // Hintergrund-Ebenen (background-image) eines Elements: einfarbige flächige Verläufe als Farben (oben zuerst),
  // Linien (nicht wiederholt, eine Kante <= 4 px) übergehen, gekachelte Texturen nur vermerken (texture),
  // sonst Art "Bild" (url) bzw. "Verlauf".
  const imageLayers = (cs) => {
    const res = { colors: [], kind: null, texture: false };
    if (!cs.backgroundImage || cs.backgroundImage === 'none') return res;
    const imgs = splitTop(cs.backgroundImage, ',');
    const sizes = splitTop(cs.backgroundSize || 'auto', ',');
    const reps = splitTop(cs.backgroundRepeat || 'repeat', ',');
    imgs.forEach((img, i) => {
      if (img === 'none') return;
      const size = sizes[i % sizes.length] || 'auto';
      const rep = reps[i % reps.length] || 'repeat';
      const dims = splitTop(size, ' ');
      const line = !/^repeat( repeat)?$/.test(rep) && dims.some((t) => /^[\d.]+px$/.test(t) && parseFloat(t) <= 4);
      if (line) return;
      // Textur/Muster: in beide Richtungen gekachelt, Kachel <= 512 px (Verlauf: Breite und Höhe in px,
      // Bild: mindestens die Breite in px, Höhe folgt dem Seitenverhältnis) – z. B. Papierkorn
      const px = dims.map((t) => (/^[\d.]+px$/.test(t) ? parseFloat(t) : null));
      const tiled = /^(repeat|round|space)( (repeat|round|space))?$/.test(rep);
      const small = (v) => v !== null && v <= 512;
      const texture = tiled && (/gradient\(/.test(img)
        ? px.length === 2 && px.every(small)
        : small(px[0]) && (px.length === 1 || px[1] === null || small(px[1])));
      if (texture) {
        res.texture = true;
        return;
      }
      if (/gradient\(/.test(img)) {
        const cols = img.match(COLOR_RE) || [];
        if (cols.length && cols.every((c) => c === cols[0]) && /^(auto( auto)?|100% 100%|cover)$/.test(size)) {
          const c = parse(cols[0]);
          if (c) res.colors.push(c);
          return;
        }
        if (res.kind !== 'Bild') res.kind = 'Verlauf';
      } else res.kind = 'Bild';
    });
    return res;
  };
  // Farben vom Element aufwärts bis zur ersten deckenden Fläche; painter = Element mit dieser Fläche
  const bgBehind = (el) => {
    const stack = [];
    let unknown = null;
    let painter = null;
    let texture = false;
    for (let e = el; e; e = e.parentElement) {
      const cs = getComputedStyle(e);
      const L = imageLayers(cs);
      if (L.kind && !unknown) unknown = { kind: L.kind, src: e };
      texture ||= L.texture;
      const own = [...L.colors, parse(cs.backgroundColor)].filter((c) => c && c.a > 0);
      stack.push(...own);
      if (own.some((c) => c.a >= 1)) {
        painter = e;
        break;
      }
    }
    let bg = { r: 255, g: 255, b: 255, a: 1 };
    for (let i = stack.length - 1; i >= 0; i--) bg = blend(stack[i], bg);
    return { bg, unknown, painter, texture };
  };
  // Rechteck der eigenen Textknoten eines Elements
  const textRect = (el) => {
    let u = null;
    for (const n of el.childNodes) {
      if (n.nodeType !== 3 || !n.textContent.trim()) continue;
      const rg = document.createRange();
      rg.selectNodeContents(n);
      const r = rg.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      u = u
        ? { l: Math.min(u.l, r.left), t: Math.min(u.t, r.top), r: Math.max(u.r, r.right), b: Math.max(u.b, r.bottom) }
        : { l: r.left, t: r.top, r: r.right, b: r.bottom };
    }
    return u;
  };

  const res = { blue: [], contrast: [], unrated: [], overflow: [] };
  const all = [...document.querySelectorAll('body *')].filter((e) => !['SCRIPT', 'STYLE', 'LINK', 'META', 'NOSCRIPT', 'TEMPLATE'].includes(e.tagName));
  // Bildflächen, die unter Text liegen können: <img>, <video>, <canvas> und Elemente mit url()-Hintergrund
  // (gekachelte Texturen ausgenommen)
  const media = [];
  for (const m of all) {
    if (!['IMG', 'VIDEO', 'CANVAS'].includes(m.tagName)) {
      const mcs = getComputedStyle(m);
      if (!/url\(/.test(mcs.backgroundImage) || imageLayers(mcs).kind !== 'Bild') continue;
    }
    if (!visible(m) || opacityOf(m) < 0.01) continue;
    media.push({ el: m, r: m.getBoundingClientRect() });
  }
  const seenBlue = new Set();
  for (const el of all) {
    if (!visible(el)) continue;
    const cs = getComputedStyle(el);
    for (const prop of ['color', 'background-color', 'border-top-color', 'border-bottom-color', 'border-left-color', 'outline-color', 'fill', 'stroke']) {
      if (prop.startsWith('border') && parseFloat(cs.getPropertyValue(prop.replace('-color', '-width'))) === 0) continue;
      if (prop === 'outline-color' && cs.outlineStyle === 'none') continue;
      if ((prop === 'fill' || prop === 'stroke') && !(el instanceof SVGElement)) continue;
      const c = parse(cs.getPropertyValue(prop));
      if (isBlue(c)) {
        const key = pathOf(el) + prop;
        if (!seenBlue.has(key)) {
          seenBlue.add(key);
          res.blue.push({ el: pathOf(el), prop, value: cs.getPropertyValue(prop) });
        }
      }
    }
    const shadow = cs.boxShadow;
    if (shadow && shadow !== 'none') {
      for (const m of shadow.matchAll(/rgba?\([^)]+\)/g)) {
        if (isBlue(parse(m[0]))) res.blue.push({ el: pathOf(el), prop: 'box-shadow', value: m[0] });
      }
    }
    // Kontrast: nur Elemente mit eigenem Text
    const ownText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1);
    if (!ownText) continue;
    if (el.closest('[disabled], .is-disabled, .apex_disabled, [aria-disabled="true"]')) continue;
    const fg = parse(cs.color);
    if (!fg || fg.a === 0) continue;
    const op = opacityOf(el);
    if (op < 0.01) continue; // über einen Vorfahren unsichtbar (z. B. ausgeblendete Carousel-Folie)
    const { bg, unknown, painter, texture } = bgBehind(el);
    const eff = blend({ ...fg, a: fg.a * op }, bg);
    const r = Math.round(ratio(eff, bg) * 100) / 100; // auf 2 Stellen gerundet: 4,495 -> 4,50 besteht
    const size = parseFloat(cs.fontSize);
    const bold = Number(cs.fontWeight) >= 700;
    const need = size >= 24 || (size >= 18.66 && bold) ? 3 : 4.5;
    const entry = () => ({
      el: pathOf(el),
      text: el.textContent.trim().slice(0, 40),
      ratio: r,
      need,
      fg: cs.color,
      bg: `rgb(${Math.round(bg.r)}, ${Math.round(bg.g)}, ${Math.round(bg.b)})`,
      ...(texture ? { texture: true } : {}), // gegen die Farbe unter einer gekachelten Textur gemessen
    });
    // Bild/Verlauf hinter dem Text: auf dem Weg zum malenden Hintergrund oder als Fläche unter der Textmitte
    let behind = unknown;
    if (!behind && media.length) {
      const tr = textRect(el);
      if (tr) {
        const cx = (tr.l + tr.r) / 2;
        const cy = (tr.t + tr.b) / 2;
        const m = media.find(
          (x) =>
            x.el !== el && !x.el.contains(el) && !el.contains(x.el) && (!painter || painter.contains(x.el)) &&
            cx >= x.r.left && cx <= x.r.right && cy >= x.r.top && cy <= x.r.bottom,
        );
        if (m) behind = { kind: 'Bild', src: m.el };
      }
    }
    if (behind) {
      // Schätzwert gegen die Hintergrundfarbe – nur als Hinweis, kein Befund
      res.unrated.push({ ...entry(), reason: behind.kind, behind: pathOf(behind.src), estimate: r >= need ? 'ok' : 'unter Grenze' });
      continue;
    }
    if (r < need) res.contrast.push(entry());
  }
  const vw = document.documentElement.clientWidth;
  if (document.documentElement.scrollWidth > vw + 1) {
    res.overflow.push({ el: 'document', width: document.documentElement.scrollWidth, viewport: vw });
  }
  for (const el of all) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.right > vw + 2 && visible(el)) {
      // nur äußerste Übeltäter melden, nicht jedes Kind
      if (el.parentElement && el.parentElement.getBoundingClientRect().right > vw + 2) continue;
      let clipped = false;
      for (let e = el.parentElement; e; e = e.parentElement) {
        const o = getComputedStyle(e).overflowX;
        if (o === 'hidden' || o === 'auto' || o === 'scroll' || o === 'clip') {
          clipped = true;
          break;
        }
      }
      res.overflow.push({ el: pathOf(el), right: Math.round(r.right), viewport: vw, insideScroller: clipped });
    }
  }
  res.contrast = res.contrast.slice(0, 60);
  res.unrated = res.unrated.slice(0, 60);
  res.blue = res.blue.slice(0, 60);
  res.overflow = res.overflow.slice(0, 30);
  return res;
}

const report = [];
for (const app of apps) {
  for (const style of styles) {
    const lab = await launchLab({ theme, style: theme ? style : 'light', app, mobile, scheme: opt.scheme || null });
    try {
      for (const p of resolvePages(opt.pages, app, 'core')) {
        lab.consoleErrors.length = 0;
        try {
          const page = await lab.open(p);
          const r = await page.evaluate(pageAudit);
          const js = [...new Set(lab.consoleErrors)].filter((e) => !/\[object (pt|Error)\]/.test(e));
          report.push({ app, style, page: p, mobile, ...r, js });
          const flag = (n, s) => (n ? `${s}:${n}` : '');
          const flags = [flag(r.blue.length, 'blau'), flag(r.contrast.length, 'kontrast'), flag(r.overflow.filter((o) => !o.insideScroller).length, 'überlauf'), flag(js.length, 'js')]
            .filter(Boolean)
            .join(' ');
          const unrated = r.unrated.length ? `  (nicht bewertbar, Bild/Verlauf: ${r.unrated.length})` : '';
          console.log(`${app} ${String(p).padEnd(5)} ${style.padEnd(6)} ${flags || 'ok'}${unrated}`);
        } catch (e) {
          console.log(`FEHLER ${app}/${p}/${style}: ${e.message}`);
        }
      }
    } finally {
      await lab.close();
    }
  }
}
const file = path.join(outDir, `report${mobile ? '-mobile' : ''}.json`);
fs.writeFileSync(file, JSON.stringify(report, null, 1));
const sum = (k) => report.reduce((n, r) => n + (k === 'overflow' ? r[k].filter((o) => !o.insideScroller).length : r[k].length), 0);
console.log(`\nSumme: blau ${sum('blue')}, kontrast ${sum('contrast')}, überlauf ${sum('overflow')}, js ${sum('js')}  (nicht bewertbar, Bild/Verlauf: ${sum('unrated')})  →  ${path.relative(ROOT, file)}`);
