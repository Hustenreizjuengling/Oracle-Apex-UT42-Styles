// CSS-Bundling eines Themes mit Lightning CSS: löst @import auf, senkt
// moderne Syntax (z. B. Nesting) auf die Ziel-Browser ab und minifiziert optional.
import fs from 'node:fs';
import path from 'node:path';
import browserslist from 'browserslist';
import { bundle, browserslistToTargets } from 'lightningcss';
import { ROOT } from '../config.mjs';

export const TARGETS = browserslistToTargets(
  browserslist('last 2 Chrome versions, last 2 Edge versions, last 2 Firefox versions, last 2 Safari versions, not dead'),
);

export function themeDir(theme) {
  const dir = path.isAbsolute(theme) ? theme : path.join(ROOT, theme);
  if (!fs.existsSync(path.join(dir, 'theme.json'))) {
    throw new Error(`Kein Theme gefunden: ${dir} (theme.json fehlt)`);
  }
  return dir;
}

export function readThemeJson(theme) {
  const dir = themeDir(theme);
  return { dir, meta: JSON.parse(fs.readFileSync(path.join(dir, 'theme.json'), 'utf8')) };
}

// Präfix der eigenen CSS-Variablen eines Themes ("pp" für --pp-*, "ve" für --ve-* …).
// Quelle: "tokenPrefix" in theme.json; fehlt es, das häufigste --xx- in src/tokens/light.css
// (ohne die UT-/APEX-Präfixe ut, a, u, oj, jui). Gleiche Regel wie in _tools/new-theme.mjs.
const FOREIGN_TOKEN_PREFIXES = ['ut', 'a', 'u', 'oj', 'jui'];
export function detectTokenPrefix(dir) {
  const file = path.join(dir, 'src', 'tokens', 'light.css');
  if (!fs.existsSync(file)) return null;
  const counts = {};
  for (const m of fs.readFileSync(file, 'utf8').matchAll(/--([a-z]{2,4})-[a-z]/g)) counts[m[1]] = (counts[m[1]] || 0) + 1;
  const best = Object.entries(counts).filter(([k]) => !FOREIGN_TOKEN_PREFIXES.includes(k)).sort((a, b) => b[1] - a[1])[0];
  return best ? best[0] : null;
}
export function tokenPrefixOf(dir, meta) {
  const p = meta && typeof meta.tokenPrefix === 'string' ? meta.tokenPrefix.replace(/^-+|-+$/g, '') : '';
  const prefix = p || detectTokenPrefix(dir);
  if (!prefix) throw new Error(`Token-Präfix nicht ermittelbar: ${dir} (theme.json → "tokenPrefix" eintragen)`);
  return prefix;
}

export function styleOf(meta, styleId) {
  const style = meta.styles.find((s) => s.id === styleId);
  if (!style) {
    throw new Error(`Style "${styleId}" nicht in theme.json (vorhanden: ${meta.styles.map((s) => s.id).join(', ')})`);
  }
  return style;
}

// Bündelt den Einstiegspunkt eines Styles. Liefert { code, warnings }.
export function bundleStyle(theme, styleId, { minify = false } = {}) {
  const { dir, meta } = readThemeJson(theme);
  const style = styleOf(meta, styleId);
  const filename = path.join(dir, style.entry);
  const warnings = [];
  const { code } = bundle({
    filename,
    minify,
    targets: TARGETS,
    errorRecovery: true,
    drafts: { customMedia: true },
  });
  return { code: code.toString(), warnings };
}
