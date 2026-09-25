// Erzeugt die Vorschaubilder für die README (Frequenz/screenshots/).
//   node Frequenz/tools/screenshots.mjs
// Voraussetzung: Testbett mit aktivem Labor-Style (siehe README im Projektordner).
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { launchLab } from '../../_tools/lib/lab.mjs';
import { ROOT } from '../../_tools/config.mjs';

const OUT = path.join(ROOT, 'Frequenz', 'screenshots');
const TMP = path.join(ROOT, '_tmp', 'frequenz', 'readme-shots');
fs.rmSync(TMP, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(TMP, { recursive: true });

// [Datei, Seite, Vorbereitung im Browser]
const SHOTS = [
  ['navigation', 1101, async (page) => page.click('#t_Button_navControl')],
  ['interactive-report', 1402],
  ['interactive-grid', 1410],
  ['formulare', 1601],
  ['regionen', 1203, async (page) => page.evaluate(() => window.scrollTo(0, 380))],
  ['karten', 3110],
  ['diagramme', 1902],
  ['kalender', 1800],
  ['komponenten', 3004],
  ['login', 1114],
];

async function run(style, { mobile = false } = {}) {
  const lab = await launchLab({ theme: 'Frequenz', style, app: 9042, mobile, width: mobile ? 390 : 1440, height: mobile ? 844 : 900 });
  try {
    for (const [name, pageId, prep] of mobile ? [['mobil', 1101], ['mobil-navigation', 1101, async (p) => p.click('#t_Button_navControl')]] : SHOTS) {
      const page = await lab.open(pageId);
      if (prep) {
        await prep(page);
        await page.mouse.move(mobile ? 200 : 700, mobile ? 600 : 700); // kein Hover-Rest auf dem Schalter
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
