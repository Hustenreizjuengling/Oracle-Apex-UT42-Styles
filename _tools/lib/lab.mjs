// Test-Harness: öffnet Seiten der Testbett-App in Chrome und fängt die
// CSS-Anfragen des Labor-Styles ab. So wird das Theme live aus src/ gerendert,
// ohne nach jeder Änderung Dateien in APEX hochzuladen.
//
//   const lab = await launchLab({ theme: 'MeinTheme', style: 'dark', app: 9042 });
//   const page = await lab.open(1201);          // Seiten-ID oder Alias (wartet auf Laden, Schriften, Bilder)
//   await lab.media();                          // nach Klicks: Schriften + sichtbare <img> dekodiert
//   await lab.maskImages();                     // optional: Fotos einfarbig (pixelgenaue Vergleiche)
//   await page.screenshot({ path: 'x.png' });
//   await lab.close();
//
// Im Testbett ist ein Theme Style "Theme Lab" aktiv, dessen CSS-URLs lauten:
//   #THEME_FILES#css/Vita#MIN#.css           -> wird je nach Style gegen die
//                                               in theme.json definierte Basis
//                                               (z. B. Vita-Dark) getauscht
//   #APP_FILES#themelab/theme#MIN#.css       -> wird durch das gebündelte
//                                               Theme-CSS ersetzt
//   #APP_FILES#themelab/<pfad>               -> wird aus <theme>/assets/<pfad>
//                                               geliefert (z. B. Schriften)
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';
import { config, ROOT } from '../config.mjs';
import { bundleStyle, readThemeJson, styleOf } from './bundle.mjs';

const MIME = {
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.json': 'application/json',
};

const baseCache = new Map();
async function fetchText(url) {
  if (!baseCache.has(url)) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${res.status} beim Laden von ${url}`);
    baseCache.set(url, await res.text());
  }
  return baseCache.get(url);
}

// CSS, das Animationen und Übergänge für stabile Screenshots abschaltet.
const FREEZE_CSS = `*,*::before,*::after{transition:none!important;animation-duration:0s!important;animation-delay:0s!important;caret-color:transparent!important}`;

export async function launchLab({
  theme = null, // Ordnername des Themes; null = ohne Theme (Basis-Vita)
  style = 'light', // Style-ID aus theme.json
  app = config.defaultApp,
  width = 1440,
  height = 900,
  mobile = false,
  scheme = null, // 'dark' | 'light': emuliert prefers-color-scheme (für Auto-Styles)
  freeze = true,
  headless = true,
  log = false,
} = {}) {
  if (!config.apps[app]) throw new Error(`Unbekannte Testbett-App ${app}`);
  let meta = null;
  let dir = null;
  let styleDef = null;
  if (theme) {
    ({ dir, meta } = readThemeJson(theme));
    styleDef = styleOf(meta, style);
  }

  const browser = await puppeteer.launch({
    executablePath: config.chrome,
    headless,
    args: ['--no-first-run', '--disable-extensions', '--hide-scrollbars', '--font-render-hinting=none'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
  await page.setCacheEnabled(false);
  if (scheme) await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: scheme }]);
  const consoleErrors = [];
  page.on('pageerror', (e) => consoleErrors.push(String(e)));
  // beforeunload-/alert-Dialoge (z. B. Faceted Search) nicht hängen lassen
  page.on('dialog', (d) => d.accept().catch(() => {}));
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text());
  });

  const bundleWarnings = [];
  await page.setRequestInterception(true);
  page.on('request', async (req) => {
    const url = req.url();
    try {
      const lab = url.match(new RegExp(`/files/static/v\\d+/${config.labFolder}/([^?#]+)`));
      if (lab) {
        const rel = decodeURIComponent(lab[1]);
        if (/^theme(\.min)?\.css$/.test(rel)) {
          if (!theme) return req.respond({ status: 200, contentType: 'text/css', body: '/* kein Theme */' });
          const { code, warnings } = bundleStyle(dir, style);
          bundleWarnings.push(...warnings);
          return req.respond({ status: 200, contentType: 'text/css; charset=utf-8', headers: { 'cache-control': 'no-store' }, body: code });
        }
        if (theme) {
          const file = path.join(dir, 'assets', rel);
          if (fs.existsSync(file)) {
            return req.respond({
              status: 200,
              contentType: MIME[path.extname(file)] || 'application/octet-stream',
              headers: { 'cache-control': 'no-store', 'access-control-allow-origin': '*' },
              body: fs.readFileSync(file),
            });
          }
        }
        return req.respond({ status: 404, body: 'not found' });
      }
      const base = url.match(/\/themes\/theme_42\/([\d.]+)\/css\/Vita(\.min)?\.css/);
      if (base && styleDef && styleDef.base && styleDef.base !== 'Vita') {
        const swapped = url.replace(/\/css\/Vita(\.min)?\.css/, `/css/${styleDef.base}$1.css`);
        const body = await fetchText(swapped);
        return req.respond({ status: 200, contentType: 'text/css; charset=utf-8', body });
      }
      return req.continue();
    } catch (e) {
      if (log) console.error('Interception-Fehler', url, e);
      try {
        return req.continue();
      } catch {
        return undefined;
      }
    }
  });

  // Wartet auf document.fonts.ready und auf das Dekodieren aller sichtbaren <img> (img.decode(),
  // Fehler werden ignoriert), danach auf zwei Frames – so sind Fotos (z. B. Karten auf 3110) beim
  // Screenshot vollständig gemalt. Lazy-Bilder außerhalb des Viewports, die noch nicht geladen sind,
  // lädt der Browser nicht; auf sie wird nicht gewartet. Höchstens `timeout` ms.
  async function media({ timeout = 10000 } = {}) {
    await page
      .evaluate(async (timeout) => {
        const vw = innerWidth, vh = innerHeight;
        const imgs = [...document.images].filter((img) => {
          const r = img.getBoundingClientRect();
          if (!r.width || !r.height) return false;
          const outside = r.bottom < 0 || r.top > vh || r.right < 0 || r.left > vw;
          return !(outside && img.loading === 'lazy' && !img.complete);
        });
        const all = Promise.all([document.fonts ? document.fonts.ready : null, ...imgs.map((img) => img.decode().catch(() => {}))]);
        await Promise.race([all, new Promise((r) => setTimeout(r, timeout))]);
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      }, timeout)
      .catch(() => {});
  }

  // Ersetzt Fotos durch eine einfarbige Fläche (für pixelgenaue Vergleiche, shoot --mask-images):
  //   <img>/<video>: Bildinhalt aus dem Rahmen geschoben (object-position), Fläche = color. Größe, Radius,
  //                  Rahmen, Deckkraft und Filter des Elements wirken weiter – nur das Foto fehlt.
  //   background-image: jede url()-Ebene mit Rasterbild (jpg, png, webp, avif, gif, bmp, auch data:) wird
  //                  durch linear-gradient(color, color) ersetzt; SVG-Grafiken und Verläufe bleiben.
  // Grund: Chrome dekodiert JPEGs gelegentlich (etwa jeder 6. frische Browser-Lauf) mit um ±1–11 abweichenden
  // Farbwerten, auch nach img.decode() – die Fotos auf 3110 wären sonst nicht deterministisch.
  // Nicht erfasst: Hintergrundbilder auf ::before/::after und <canvas>. Das Layout bleibt unverändert.
  async function maskImages({ color = '#7f7f7f' } = {}) {
    const n = await page
      .evaluate((color) => {
        if (!document.getElementById('lab-mask-images')) {
          const st = document.createElement('style');
          st.id = 'lab-mask-images';
          st.textContent = `img, video { object-position: -100000px -100000px !important; background: ${color} !important; }`;
          document.head.appendChild(st);
        }
        const RASTER = /url\("?(?:data:image\/(?:png|jpe?g|webp|avif|gif)[^")]*|[^")]*\.(?:jpe?g|png|webp|avif|gif|bmp)(?:[?#][^")]*)?)"?\)/gi;
        let k = document.querySelectorAll('img, video').length;
        for (const el of document.querySelectorAll('body, body *')) {
          const bi = getComputedStyle(el).backgroundImage;
          if (!bi || bi === 'none') continue;
          RASTER.lastIndex = 0;
          if (!RASTER.test(bi)) continue;
          el.style.setProperty('background-image', bi.replace(RASTER, `linear-gradient(${color}, ${color})`), 'important');
          k++;
        }
        return k;
      }, color)
      .catch(() => 0);
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))).catch(() => {});
    return n;
  }

  async function settle() {
    await page.waitForFunction(() => document.readyState === 'complete', { timeout: 60000 });
    if (freeze) await page.addStyleTag({ content: FREEZE_CSS }).catch(() => {});
    await media();
    await new Promise((r) => setTimeout(r, 600));
  }

  const lab = {
    browser,
    page,
    theme,
    style,
    app,
    meta,
    consoleErrors,
    bundleWarnings,
    session: null,
    url(target) {
      if (/^https?:/.test(String(target))) return String(target);
      const s = lab.session ? `:${lab.session}` : '';
      if (/^\d+$/.test(String(target))) return `${config.ordsBase}/f?p=${app}:${target}${s}`;
      const q = lab.session ? `?session=${lab.session}` : '';
      return `${config.ordsBase}/r/${config.workspacePath}/${config.apps[app].alias}/${String(target).toLowerCase()}${q}`;
    },
    async open(target, { waitUntil = 'networkidle2' } = {}) {
      await page.goto(lab.url(target), { waitUntil, timeout: 90000 });
      await settle();
      if (NEUTRAL) await neutralizeDemoText(page);
      const s = await page.evaluate(() => window.apex && apex.env && apex.env.APP_SESSION).catch(() => null);
      if (s) lab.session = s;
      return page;
    },
    settle,
    media,
    maskImages,
    async close() {
      await browser.close();
    },
  };
  return lab;
}

// Die Demo-Daten der Reference App nennen echte Firmen und Produkte (Metric Cards: Börsenkürzel mit
// Firmenname; Card Regions: Karte 4 wirbt für ein Chat-Produkt). Für Screenshots werden sie ohne
// Namensliste ersetzt: Kürzel und Firmenname nach Reihenfolge durch Fantasienamen, in Karte 4 das erste
// Wort des Titels durch „Chat“. LAB_NEUTRAL=0 schaltet das ab.
const NEUTRAL = process.env.LAB_NEUTRAL !== '0';
async function neutralizeDemoText(page) {
  await page
    .evaluate(() => {
      const TICKER = ['NRDW', 'SLTN', 'OSTH', 'BRTL', 'LNDQ', 'HVLD', 'KRMT', 'WSTF'];
      const FIRMA = ['Nordwerk', 'Silbertann', 'Ostholm', 'Brandtal', 'Lindquist', 'Havelund', 'Karmat', 'Westfeld'];
      const seen = new Map();
      for (const card of document.querySelectorAll('.t-MetricCard')) {
        const title = card.querySelector('.t-MetricCard-title');
        const key = title && title.textContent.trim();
        if (!key || !/^[A-Z]{2,5}$/.test(key)) continue;
        if (!seen.has(key)) seen.set(key, seen.size % TICKER.length);
        const i = seen.get(key);
        title.textContent = TICKER[i];
        const meta = card.querySelector('.t-MetricCard-meta');
        if (meta) meta.textContent = FIRMA[i];
      }
      for (const label of document.querySelectorAll('.a-CardView [id$="_4_card_label"]')) {
        const card = label.closest('.a-CardView');
        const title = card.querySelector('.a-CardView-title');
        const word = title && title.textContent.trim().split(/\s+/)[0];
        if (!word || word.length < 3) continue;
        const rx = new RegExp('\\b' + word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'g');
        const w = document.createTreeWalker(card, NodeFilter.SHOW_TEXT);
        while (w.nextNode()) w.currentNode.nodeValue = w.currentNode.nodeValue.replace(rx, 'Chat');
        for (const el of [card, ...card.querySelectorAll('[title],[alt],[aria-label]')])
          for (const a of ['title', 'alt', 'aria-label']) {
            const v = el.getAttribute(a);
            if (v) el.setAttribute(a, v.replace(rx, 'Chat'));
          }
      }
    })
    .catch(() => {});
}

export { ROOT };
