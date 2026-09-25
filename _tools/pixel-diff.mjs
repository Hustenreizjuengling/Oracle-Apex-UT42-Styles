// Vergleicht zwei Screenshots pixelgenau (z. B. Dark-Style gegen Auto-Style im dunklen Modus).
//
//   node _tools/pixel-diff.mjs a.png b.png [--out diff.png] [--threshold 0.1]
//   node _tools/pixel-diff.mjs --dir-a _tmp/x --dir-b _tmp/y     (gleichnamige Dateien paarweise)
//
// Exit-Code 0 = identisch (0 abweichende Pixel), 1 = Abweichungen.
import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import { ROOT } from './config.mjs';

const args = process.argv.slice(2);
const opt = { files: [] };
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith('--')) opt[args[i].slice(2)] = args[++i];
  else opt.files.push(args[i]);
}
const threshold = Number(opt.threshold ?? 0.1);

function compare(a, b, out) {
  const A = PNG.sync.read(fs.readFileSync(a));
  const B = PNG.sync.read(fs.readFileSync(b));
  if (A.width !== B.width || A.height !== B.height) {
    return { diff: -1, total: 0, note: `Größe verschieden: ${A.width}x${A.height} vs ${B.width}x${B.height}` };
  }
  const D = new PNG({ width: A.width, height: A.height });
  const diff = pixelmatch(A.data, B.data, D.data, A.width, A.height, { threshold });
  if (out && diff) fs.writeFileSync(out, PNG.sync.write(D));
  return { diff, total: A.width * A.height };
}

let pairs = [];
if (opt['dir-a'] && opt['dir-b']) {
  const da = path.resolve(ROOT, opt['dir-a']);
  const db = path.resolve(ROOT, opt['dir-b']);
  for (const f of fs.readdirSync(da).filter((f) => f.endsWith('.png'))) {
    if (fs.existsSync(path.join(db, f))) pairs.push([path.join(da, f), path.join(db, f)]);
  }
} else if (opt.files.length === 2) {
  pairs = [opt.files.map((f) => path.resolve(ROOT, f))];
} else {
  console.error('Aufruf: node _tools/pixel-diff.mjs a.png b.png [--out diff.png] | --dir-a A --dir-b B');
  process.exit(2);
}

let bad = 0;
for (const [a, b] of pairs) {
  const out = opt.out ? path.resolve(ROOT, opt.out) : null;
  const r = compare(a, b, out);
  if (r.diff !== 0) bad++;
  const pct = r.total ? ((r.diff / r.total) * 100).toFixed(3) : '-';
  console.log(`${r.diff === 0 ? 'GLEICH ' : 'ANDERS '} ${path.basename(a)}  ${r.diff} px (${pct} %) ${r.note || ''}`);
}
process.exit(bad ? 1 : 0);
