// Erzeugt die Vorschaubilder für die README (Passer/screenshots/).
//   node Passer/tools/screenshots.mjs
// Voraussetzung: Testbett mit aktivem Labor-Style (siehe README im Projektordner).
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { launchLab } from '../../_tools/lib/lab.mjs';
import { ROOT } from '../../_tools/config.mjs';

const OUT = path.join(ROOT, 'Passer', 'screenshots');
const TMP = path.join(ROOT, '_tmp', 'passer', 'readme-shots');
fs.rmSync(TMP, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(TMP, { recursive: true });

// Seite so scrollen, dass die Demo-Komponente oben unter der klebenden Title Bar steht
const scrollTo = (sel, offset = 150) => async (page) => {
  await page.evaluate((sel, offset) => {
    const el = document.querySelector(sel);
    if (el) window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - offset);
  }, sel, offset);
};

// [Datei, Seite, Vorbereitung im Browser]
const SHOTS = [
  ['navigation', 1101, async (page) => page.click('#t_Button_navControl')],
  ['interactive-report', 1402, scrollTo('.a-IRR-container, .a-IRR', 190)],
  ['interactive-grid', 1410, scrollTo('.a-IG', 190)],
  ['formulare', 1601],
  ['regionen', 1202, scrollTo('.t-Alert--colorBG', 205)],   // „Use Cases“: Status-Alerts mit Hot-Button
  ['karten', 3110, scrollTo('.a-CardView-items', 200)],
  ['diagramme', 1902, scrollTo('.oj-chart, .a-JET-chart', 220)],
  ['kalender', 1800, scrollTo('.fc', 200)],
  ['komponenten', 3002, scrollTo('.a-IRR, .t-Report', 200)],
  ['login', 1114],
  ['login-geteilt', 9999],
];

async function run(style, { mobile = false } = {}) {
  const lab = await launchLab({ theme: 'Passer', style, app: 9042, mobile, width: mobile ? 390 : 1440, height: mobile ? 844 : 900 });
  try {
    for (const [name, pageId, prep] of mobile ? [['mobil', 1101], ['mobil-navigation', 1101, async (p) => p.click('#t_Button_navControl')]] : SHOTS) {
      const page = await lab.open(pageId);
      if (prep) {
        await prep(page);
        await new Promise((r) => setTimeout(r, 900));
        await lab.settle();
      }
      const file = path.join(TMP, `${name}-${style}.png`);
      await page.screenshot({ path: file });
      console.log('OK', path.relative(ROOT, file));
    }
  } finally {
    await lab.close();
  }
}

for (const style of ['light', 'dark']) {
  await run(style);
  await run(style, { mobile: true });
}

// Paarbilder hell | dunkel
const sheet = (out, files, cols, width) =>
  execFileSync(process.execPath, [path.join(ROOT, '_tools', 'contact-sheet.mjs'), '--out', out, '--cols', String(cols), '--width', String(width), ...files], { stdio: 'inherit' });
for (const [name] of SHOTS) {
  sheet(path.join(OUT, `${name}.png`), [path.join(TMP, `${name}-light.png`), path.join(TMP, `${name}-dark.png`)], 2, 2400);
}
sheet(
  path.join(OUT, 'mobil.png'),
  ['mobil-light', 'mobil-navigation-light', 'mobil-dark', 'mobil-navigation-dark'].map((n) => path.join(TMP, `${n}.png`)),
  4,
  1600,
);
// Das Papierkorn macht PNGs schwer (≈ 2 MB je Bild): als WebP (Qualität 90) speichern, PNG löschen.
{
  const puppeteer = (await import('puppeteer-core')).default;
  const { config } = await import('../../_tools/config.mjs');
  const browser = await puppeteer.launch({ executablePath: config.chrome, headless: true });
  const page = await browser.newPage();
  for (const f of fs.readdirSync(OUT).filter((n) => n.endsWith('.png'))) {
    const png = path.join(OUT, f);
    const b64 = fs.readFileSync(png).toString('base64');
    await page.setContent(`<style>html,body{margin:0}img{display:block}</style><img src="data:image/png;base64,${b64}">`);
    const { w, h } = await page.evaluate(async () => { const i = document.querySelector('img'); await i.decode(); return { w: i.naturalWidth, h: i.naturalHeight }; });
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
    await page.screenshot({ path: png.replace(/\.png$/, '.webp'), type: 'webp', quality: 90, clip: { x: 0, y: 0, width: w, height: h } });
    fs.rmSync(png);
    console.log('WebP', f.replace(/\.png$/, '.webp'));
  }
  await browser.close();
}
console.log(`\nFertig: ${path.relative(ROOT, OUT)}`);
