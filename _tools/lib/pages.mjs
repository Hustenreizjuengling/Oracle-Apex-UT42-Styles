// Seiten-Angaben der Werkzeuge (--pages, --sets) in Seiten-IDs/Aliase auflösen.
//
//   resolvePages('core', 9042)                   → Seiten des Sets "core" aus testbed-pages.json
//   resolvePages('components,lists,1201', 9042)  → Sets und einzelne Seiten gemischt, Kommaliste
//   resolvePages('all', 9042)                    → alle normalen Seiten (id > 0) der Testbett-App
//
// Jeder Eintrag der Kommaliste ist ein Set-Name, "all" oder eine Seiten-ID bzw. ein Alias. Die Reihenfolge
// bleibt erhalten, doppelte Seiten (z. B. 3110 in "regions,components") werden nur einmal geliefert.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../config.mjs';

export const pagesFile = JSON.parse(fs.readFileSync(path.join(ROOT, '_tools', 'testbed-pages.json'), 'utf8'));

export function resolvePages(spec, app, fallback = 'core') {
  const s = spec === undefined || spec === null || spec === true || spec === '' ? String(fallback) : String(spec);
  const out = [];
  for (const raw of s.split(',')) {
    const x = raw.trim();
    if (!x) continue;
    if (pagesFile.sets[x]) out.push(...pagesFile.sets[x].map(String));
    else if (x === 'all') {
      const list = pagesFile.apps[String(app)];
      if (!list) throw new Error(`Keine Seitenliste für App ${app} in testbed-pages.json ("all" nicht auflösbar)`);
      out.push(...list.filter((p) => p.mode === 'Normal' && p.id > 0).map((p) => String(p.id)));
    } else out.push(x);
  }
  return [...new Set(out)];
}
