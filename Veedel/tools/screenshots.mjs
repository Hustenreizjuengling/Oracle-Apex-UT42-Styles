// Erzeugt die Vorschaubilder für die README (Veedel/screenshots/).
//   node Veedel/tools/screenshots.mjs
// Voraussetzung: Testbett mit aktivem Labor-Style (siehe README im Projektordner).
// Zwischenbilder liegen in _tmp/veedel/readme-shots (eigener Ordner, parallel laufende Themes
// überschreiben sich nicht gegenseitig).
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { launchLab } from '../../_tools/lib/lab.mjs';
import { ROOT } from '../../_tools/config.mjs';

const OUT = path.join(ROOT, 'Veedel', 'screenshots');
const TMP = path.join(ROOT, '_tmp', 'veedel', 'readme-shots');
fs.rmSync(TMP, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(TMP, { recursive: true });

// scrollt so, dass das Element unter dem (eingeklappten) Verlaufsband steht
const scrollTo = (sel, offset = 150) => async (page) => {
  await page.evaluate((s, o) => {
    const el = document.querySelector(s);
    if (el) window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - o);
  }, sel, offset);
};

// [Datei, Seite, Vorbereitung im Browser]
const SHOTS = [
  ['navigation', 1101, async (page) => page.click('#t_Button_navControl')],
  ['interactive-report', 1402, scrollTo('.a-IRR-container', 250)],
  ['interactive-grid', 1410, scrollTo('.a-IG', 250)],
  ['formulare', 1601, scrollTo('.t-Form-fieldContainer', 230)],
  ['regionen', 1203, scrollTo('.t-HeroRegion', 300)],
  ['karten', 3110, scrollTo('.a-CardView-items', 230)],
  ['diagramme', 1902, scrollTo('.oj-chart', 330)],
  ['kalender', 1800, scrollTo('.fc', 200)],
  ['komponenten', 3007, scrollTo('.t-MetricCards', 230)],
  ['login', 1114],
];

async function run(style, { mobile = false } = {}) {
  const lab = await launchLab({ theme: 'Veedel', style, app: 9042, mobile, width: mobile ? 390 : 1440, height: mobile ? 844 : 900 });
  try {
    // mobil: 1201 scrollt beim Laden zur ersten Region (UT-Verhalten der Region Display Selector) – zurück nach oben,
    // damit das Verlaufsband mit dem Seitentitel im Bild ist
    const MOBILE = [['mobil', 1201, async (p) => p.evaluate(() => window.scrollTo(0, 0))], ['mobil-navigation', 1101, async (p) => p.click('#t_Button_navControl')]];
    for (const [name, pageId, prep] of mobile ? MOBILE : SHOTS) {
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
console.log(`\nFertig: ${path.relative(ROOT, OUT)}`);
