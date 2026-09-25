// Lädt die Universal-Theme-Quelldateien der Entwicklungsinstanz nach _reference/
// (nur zum Nachschlagen – diese Dateien werden nie ausgeliefert).
//   node _tools/fetch-reference.mjs
import fs from 'node:fs/promises';
import path from 'node:path';
import { ROOT, config } from './config.mjs';

const VERSIONS = ['26.1', '24.2'];
const FILES = [
  'css/Core.css',
  'css/Vita.css',
  'css/Vita-Dark.css',
  'css/Vita-Red.css',
  'css/Vita-Slate.css',
  'css/Redwood.css',
  'css/Redwood-Theme.css',
  'css/Iris.css',
  'less/theme/Vita.less',
  'less/theme/Vita-Dark.less',
  'less/theme/Redwood-Theme.less',
  'less/theme/Iris.less',
  'js/theme42.js',
];
const EXTRA = [
  'app_ui/css/Core.css',
  'app_ui/css/Theme-Standard.css',
];

async function get(url, target) {
  const res = await fetch(url);
  if (!res.ok) return `${res.status}`;
  const buf = Buffer.from(await res.arrayBuffer());
  if (!buf.length) return 'leer';
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, buf);
  return `${(buf.length / 1024).toFixed(0)} KB`;
}

for (const v of VERSIONS) {
  for (const f of FILES) {
    const r = await get(`${config.imagesBase}/themes/theme_42/${v}/${f}`, path.join(ROOT, '_reference', `ut-${v}`, f));
    console.log(`ut-${v}/${f}: ${r}`);
  }
}
for (const f of EXTRA) {
  const r = await get(`${config.imagesBase}/${f}`, path.join(ROOT, '_reference', f));
  console.log(`${f}: ${r}`);
}
