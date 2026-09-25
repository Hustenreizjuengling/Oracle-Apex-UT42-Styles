// Legt ein neues Theme als Kopie eines bestehenden an und benennt alles um.
//
//   node _tools/new-theme.mjs <Name> [--from Passepartout] [--prefix meintheme] [--token mt]
//
//   <Name>      Anzeigename und Ordnername, z. B. "Kompass"
//   --from      Vorlage (Standard: Passepartout)
//   --prefix    Datei-/Ordner-Präfix für die statischen Dateien (Standard: Name in Kleinbuchstaben)
//   --token     Präfix der eigenen CSS-Variablen, z. B. "ko" → --ko-accent (Standard: erste 2 Buchstaben);
//               wird als "tokenPrefix" in die neue theme.json geschrieben (lint.mjs liest es von dort)
//
// Kopiert werden src/, assets/, tools/ und docs/ – nicht dist/, install/ und screenshots/, und aus docs/
// weder img/ noch THEME-VARIANTE.md (Bilder und Testbericht gehören zur Vorlage). Hat die Vorlage eine
// Theme-Variante, entsteht stattdessen ein kurzer Platzhalter docs/THEME-VARIANTE.md mit der neuen Nummer.
// Token-Präfix der Vorlage: "tokenPrefix" aus ihrer theme.json, sonst das häufigste --xx- in src/tokens/light.css.
// Danach: Tokens in src/tokens/*.css anpassen, mit dem Harness prüfen, bauen.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './config.mjs';
import { tokenPrefixOf } from './lib/bundle.mjs';

const args = process.argv.slice(2);
const name = args.find((a) => !a.startsWith('--'));
const opt = {};
for (let i = 0; i < args.length; i++) if (args[i].startsWith('--')) opt[args[i].slice(2)] = args[++i];
if (!name || !/^[A-Za-zÄÖÜäöü][\wÄÖÜäöü-]*$/.test(name)) {
  console.error('Aufruf: node _tools/new-theme.mjs <Name> [--from Passepartout] [--prefix x] [--token xy]');
  process.exit(1);
}
const from = opt.from || 'Passepartout';
const srcDir = path.join(ROOT, from);
const srcMeta = JSON.parse(fs.readFileSync(path.join(srcDir, 'theme.json'), 'utf8'));
const prefix = (opt.prefix || name.toLowerCase().normalize('NFD').replace(/[^\w-]/g, '')).replace(/[^a-z0-9-]/g, '');
const token = (opt.token || prefix.slice(0, 2)).toLowerCase();
if (!/^[a-z][a-z0-9]{1,3}$/.test(token) || ['ut', 'oj', 'jui'].includes(token)) {
  console.error(`Ungültiges Token-Präfix "${token}": 2–4 Kleinbuchstaben/Ziffern, nicht ut, oj, jui (--token xy)`);
  process.exit(1);
}
const dstDir = path.join(ROOT, name);
if (fs.existsSync(dstDir)) {
  console.error(`Ordner existiert bereits: ${dstDir}`);
  process.exit(1);
}

// Token-Präfix der Vorlage: theme.json → tokenPrefix, sonst häufigstes --xx- in tokens/light.css
const srcToken = tokenPrefixOf(srcDir, srcMeta);
// nicht mitkopieren (Pfade relativ zum Vorlagen-Ordner)
const SKIP = new Set(['dist', 'install', 'screenshots', 'theme.json', path.join('docs', 'img'), path.join('docs', 'THEME-VARIANTE.md')]);

const TEXT = new Set(['.css', '.md', '.mjs', '.js', '.json', '.txt', '.sql']);
const rename = (s) =>
  s
    .replaceAll(`--${srcToken}-`, `--${token}-`)
    .replaceAll(`.${srcToken}-`, `.${token}-`)
    .replaceAll(`${srcMeta.prefix}-`, `${prefix}-`)
    .replaceAll(`${srcMeta.name} Sans`, `${name} Sans`)
    .replaceAll(srcMeta.name, name);

function copy(dir, rel = '') {
  for (const e of fs.readdirSync(path.join(dir, rel), { withFileTypes: true })) {
    const r = path.join(rel, e.name);
    if (SKIP.has(r)) continue;
    const target = path.join(dstDir, rename(r));
    if (e.isDirectory()) {
      fs.mkdirSync(target, { recursive: true });
      copy(dir, r);
    } else if (TEXT.has(path.extname(e.name))) {
      fs.writeFileSync(target, rename(fs.readFileSync(path.join(dir, r), 'utf8')));
    } else {
      fs.copyFileSync(path.join(dir, r), target);
    }
  }
}
fs.mkdirSync(dstDir, { recursive: true });
copy(srcDir);

// README der Vorlage verweist auf docs/img/, das nicht mitkopiert wird
const readme = path.join(dstDir, 'README.md');
if (fs.existsSync(readme)) fs.writeFileSync(readme, fs.readFileSync(readme, 'utf8').replace(/ \(Bilder in docs\/img\/\)/g, ''));

const meta = {
  ...srcMeta,
  name,
  prefix,
  tokenPrefix: token,
  version: '0.1.0',
  description: `${name} – neues Theme (Kopie von ${from}). Beschreibung anpassen.`,
  styles: srcMeta.styles.map((s) => ({
    ...s,
    name: s.name.replace(srcMeta.name, name),
    staticId: `${prefix}-${s.id}`,
    entry: s.entry.replace(`${srcMeta.prefix}-`, `${prefix}-`),
  })),
};
// Theme-Variante: eigener Name und eigene Kennungen, sonst hielte der Installer das
// Theme der Vorlage für das eigene und würde es überschreiben. Nummer = Vorlage + 1, übersprungen
// werden Nummern, die ein anderes Theme im Projekt schon trägt.
if (srcMeta.themeVariant) {
  const taken = new Set();
  for (const e of fs.readdirSync(ROOT, { withFileTypes: true })) {
    const f = path.join(ROOT, e.name, 'theme.json');
    if (!e.isDirectory() || !fs.existsSync(f)) continue;
    try {
      const n = Number(JSON.parse(fs.readFileSync(f, 'utf8')).themeVariant?.number);
      if (n) taken.add(n);
    } catch { /* fremde/kaputte theme.json ignorieren */ }
  }
  let number = Number(srcMeta.themeVariant.number) + 1;
  while (taken.has(number)) number++;
  meta.themeVariant = {
    ...srcMeta.themeVariant,
    number,
    name,
    internalName: prefix.toUpperCase().replace(/[^A-Z0-9]+/g, '_'),
    staticId: prefix,
  };
  // Platzhalter statt der (bebilderten, getesteten) Anleitung der Vorlage
  fs.mkdirSync(path.join(dstDir, 'docs'), { recursive: true });
  fs.writeFileSync(
    path.join(dstDir, 'docs', 'THEME-VARIANTE.md'),
    `# ${name} als eigenes Theme (Theme-Variante)

> **Platzhalter** – angelegt von \`_tools/new-theme.mjs\` am ${new Date().toISOString().slice(0, 10)}. Ersetzen, sobald die
> Theme-Variante von ${name} in einer Wegwerf-App getestet ist.

Die Theme-Variante legt ${name} zusätzlich als eigenes Theme an: Nummer **${number}**, Name *${name}*,
Static ID \`${prefix}\` (\`theme.json\` → \`themeVariant\`). \`node _tools/build.mjs ${name}\` erzeugt dazu
\`install/${prefix}-theme-install.sql\` und \`install/${prefix}-theme-uninstall.sql\`.

Ablauf (Backup, Unsubscribe, Switch Theme), Nebenwirkungen und Grenzen sind für alle Themes dieses Projekts gleich
und in der getesteten, bebilderten Anleitung beschrieben:
[${from}/docs/THEME-VARIANTE.md](../../${from}/docs/THEME-VARIANTE.md).
`,
  );
}
fs.writeFileSync(path.join(dstDir, 'theme.json'), JSON.stringify(meta, null, 2) + '\n');

console.log(`Neues Theme angelegt: ${path.relative(ROOT, dstDir)}
  Präfix Dateien: ${prefix}   CSS-Variablen: --${token}-* (Vorlage: --${srcToken}-*)
  Styles: ${meta.styles.map((s) => s.name).join(', ')}${
    meta.themeVariant
      ? `\n  Theme-Variante: Theme ${meta.themeVariant.number} "${name}" (Nummer in theme.json → themeVariant.number anpassbar; docs/THEME-VARIANTE.md ist ein Platzhalter)`
      : ''
  }

Nächste Schritte:
  1. Farben/Schrift in ${name}/src/tokens/light.css, dark.css, scale.css anpassen
  2. Live ansehen:  node _tools/shoot.mjs --theme ${name} --style light,dark --pages core --out _tmp/${prefix}/shots
  3. Prüfen:        node _tools/lint.mjs ${name}  und  node _tools/audit.mjs --theme ${name} --style light,dark --pages core --out _tmp/${prefix}/audit
  4. Bauen:         node _tools/build.mjs ${name}   → ${name}/install/${prefix}-install.sql`);
