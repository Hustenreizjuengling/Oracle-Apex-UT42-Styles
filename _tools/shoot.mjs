// Screenshots und DOM-Inspektion der Testbett-Seiten.
//
// Beispiele:
//   node _tools/shoot.mjs --theme Nimbus --style light,dark --pages 1201,1500
//   node _tools/shoot.mjs --theme none --pages core            (Vorher-Bild, ohne Theme)
//   node _tools/shoot.mjs --theme Nimbus --app 9242 --pages all --full
//   node _tools/shoot.mjs --theme Nimbus --pages 1500 --html ".t-Button--hot"
//   node _tools/shoot.mjs --theme Nimbus --pages 1201 --computed ".t-Region:background-color,border-radius"
//   node _tools/shoot.mjs --theme Nimbus --pages 1910 --click "#OPEN_DIALOG" --wait 1500
//   node _tools/shoot.mjs --theme Nimbus --pages components,lists,1201 --out _tmp/nimbus/shots
//
// Optionen:
//   --theme <ordner|none>   Theme-Ordner (Standard: none)
//   --style a,b             Style-IDs aus theme.json (Standard: light)
//   --app 9042,9242         Testbett(e) (Standard: 9042)
//   --pages <liste>         Kommaliste aus Seiten-IDs/Aliasen, Set-Namen aus testbed-pages.json und "all",
//                           auch gemischt (z. B. "components,lists,1201"); doppelte Seiten nur einmal
//                           (Standard: 1201)
//   --width/--height        Viewport (Standard 1440x900); --mobile = 390x844 Touch
//   --full                  ganze Seite statt Viewport
//   --selector <css>        nur dieses Element fotografieren
//   --click <css>           vor dem Foto klicken (mehrfach mit ;; trennen)
//   --hover <css>           vor dem Foto überfahren – nach allen Klicks (z. B. Menüpunkt im geöffneten Menü)
//   --wait <ms>             nach Klick/Hover warten (Standard 800)
//   --html <css>            outerHTML des ersten Treffers ausgeben
//   --computed <css:props>  berechnete Styles ausgeben
//   --out <ordner>          Zielordner (Standard: _tmp/shots)
//   --tag <text>            Suffix für Dateinamen
//   --mask-images           Fotos (<img>, <video>, Raster-Hintergrundbilder) vor dem Foto durch eine graue Fläche
//                           ersetzen – für pixelgenaue Vergleiche (verify-auto.sh nutzt es standardmäßig), weil
//                           Chrome JPEGs gelegentlich minimal anders dekodiert (siehe lib/lab.mjs → maskImages)
//
// Vor jedem Foto wartet der Harness auf document.fonts.ready und das Dekodieren aller sichtbaren <img>.
import fs from 'node:fs';
import path from 'node:path';
import { launchLab } from './lib/lab.mjs';
import { resolvePages } from './lib/pages.mjs';
import { ROOT } from './config.mjs';

const args = process.argv.slice(2);
const opt = {};
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (!a.startsWith('--')) continue;
  const key = a.slice(2);
  const next = args[i + 1];
  if (next === undefined || next.startsWith('--')) opt[key] = true;
  else {
    opt[key] = next;
    i++;
  }
}

const theme = !opt.theme || opt.theme === 'none' ? null : opt.theme;
const styles = String(opt.style || 'light').split(',');
const apps = String(opt.app || '9042').split(',').map(Number);
const outDir = path.resolve(ROOT, opt.out || '_tmp/shots');
fs.mkdirSync(outDir, { recursive: true });
const mobile = !!opt.mobile;
const width = Number(opt.width || (mobile ? 390 : 1440));
const height = Number(opt.height || (mobile ? 844 : 900));
const wait = Number(opt.wait || 800);
const tag = opt.tag ? `-${opt.tag}` : '';

const results = [];
for (const app of apps) {
  for (const style of styles) {
    const lab = await launchLab({ theme, style: theme ? style : 'light', app, width, height, mobile, scheme: opt.scheme || null });
    try {
      for (const p of resolvePages(opt.pages, app, '1201')) {
        const name = `${app}-${p}-${theme ? style : 'base'}${opt.scheme ? '-' + opt.scheme : ''}${mobile ? '-mobile' : ''}${tag}`;
        try {
          const page = await lab.open(p);
          if (opt.click) {
            for (const sel of String(opt.click).split(';;')) {
              await page.click(sel.trim());
              await new Promise((r) => setTimeout(r, wait));
            }
            await lab.settle();
          }
          if (opt.hover) {
            await page.hover(String(opt.hover));
            await new Promise((r) => setTimeout(r, wait));
          }
          if (opt.html) {
            const html = await page.$eval(opt.html, (el) => el.outerHTML).catch((e) => `!! ${e.message}`);
            console.log(`--- ${name} html(${opt.html}) ---\n${html}`);
          }
          if (opt.computed) {
            const [sel, props] = String(opt.computed).split(':');
            const vals = await page
              .$$eval(
                sel,
                (els, props) =>
                  els.slice(0, 5).map((el) => {
                    const cs = getComputedStyle(el);
                    return Object.fromEntries(props.split(',').map((p) => [p, cs.getPropertyValue(p)]));
                  }),
                props,
              )
              .catch((e) => `!! ${e.message}`);
            console.log(`--- ${name} computed(${sel}) ---\n${JSON.stringify(vals, null, 1)}`);
          }
          if (!opt['no-shot']) {
            await lab.media();
            if (opt['mask-images']) await lab.maskImages();
            const file = path.join(outDir, `${name}.png`);
            if (opt.selector) {
              const el = await page.$(opt.selector);
              if (el) await el.screenshot({ path: file });
              else console.log(`!! Selektor nicht gefunden: ${opt.selector}`);
            } else {
              await page.screenshot({ path: file, fullPage: !!opt.full });
            }
            results.push(file);
            console.log(`OK ${path.relative(ROOT, file)}`);
          }
        } catch (e) {
          console.log(`FEHLER ${name}: ${e.message}`);
        }
      }
      if (lab.consoleErrors.length) {
        console.log(`JS-Konsolenfehler (${app}/${style}):\n  ${[...new Set(lab.consoleErrors)].slice(0, 10).join('\n  ')}`);
      }
    } finally {
      await lab.close();
    }
  }
}
