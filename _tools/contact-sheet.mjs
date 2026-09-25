// Fasst mehrere Screenshots zu einem Kontaktbogen zusammen (z. B. hell/dunkel nebeneinander).
//
//   node _tools/contact-sheet.mjs --out _tmp/sheet.png --cols 2 --width 1800 a.png b.png c.png ...
//   node _tools/contact-sheet.mjs --out _tmp/sheet.png --cols 2 --dir _tmp/shots/x --match "1201"
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';
import { config, ROOT } from './config.mjs';

const args = process.argv.slice(2);
const opt = { files: [] };
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith('--')) opt[args[i].slice(2)] = args[++i];
  else opt.files.push(args[i]);
}
let files = opt.files.map((f) => path.resolve(ROOT, f));
if (opt.dir) {
  const d = path.resolve(ROOT, opt.dir);
  files.push(
    ...fs
      .readdirSync(d)
      .filter((f) => f.endsWith('.png') && (!opt.match || f.includes(opt.match)))
      .sort()
      .map((f) => path.join(d, f)),
  );
}
if (!files.length || !opt.out) {
  console.error('Aufruf: node _tools/contact-sheet.mjs --out <png> [--cols 2] [--width 1800] [--dir <ordner> --match <text>] bilder...');
  process.exit(1);
}
const cols = Number(opt.cols || 2);
const width = Number(opt.width || 1800);
const cells = files
  .map((f) => {
    const b64 = fs.readFileSync(f).toString('base64');
    return `<figure><img src="data:image/png;base64,${b64}"><figcaption>${path.basename(f)}</figcaption></figure>`;
  })
  .join('');
const html = `<!doctype html><html><head><style>
body{margin:0;background:#888;font:12px/1.2 system-ui,sans-serif}
.grid{display:grid;grid-template-columns:repeat(${cols},1fr);gap:6px;padding:6px;width:${width}px;box-sizing:border-box}
figure{margin:0;background:#fff}img{display:block;width:100%}figcaption{padding:3px 6px;background:#222;color:#fff}
</style></head><body><div class="grid">${cells}</div></body></html>`;

const browser = await puppeteer.launch({ executablePath: config.chrome, headless: true });
const page = await browser.newPage();
await page.setViewport({ width, height: 800 });
await page.setContent(html, { waitUntil: 'load' });
const el = await page.$('.grid');
fs.mkdirSync(path.dirname(path.resolve(ROOT, opt.out)), { recursive: true });
await el.screenshot({ path: path.resolve(ROOT, opt.out) });
await browser.close();
console.log(`OK ${opt.out} (${files.length} Bilder)`);
