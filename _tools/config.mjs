// Zentrale Konfiguration für Build, Test-Harness und Referenz-Download.
// Werte können per Umgebungsvariable überschrieben werden.
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const config = {
  // ORDS-Basis der Entwicklungsinstanz
  ordsBase: process.env.APEX_ORDS_BASE || 'http://192.168.178.216:8080/ords',
  imagesBase: process.env.APEX_IMAGES_BASE || 'http://192.168.178.216:8080/i',
  workspacePath: process.env.APEX_WORKSPACE_PATH || 'hr_dev',
  sqlclConnection: process.env.SQLCL_CONNECTION || 'hr_freepdb1',

  // Apps der Werkzeuge – alle sind Kopien der Universal Theme Reference App
  apps: {
    // Showcase: alle 15 Styles des Style-Packs, umschaltbar im Kopfmenü "Theme Style" (--theme none).
    // Einrichten: _tools/sql/install-showcase-app.sql, danach @style-pack/style-pack-install.sql 9000 passepartout-light
    9000: { alias: 'theme-showcase', ut: '26.1' },
    // Testbetten mit Labor-Style "Theme Lab" in zwei UT-Versionen (--theme <Theme>).
    // Derzeit entfernt (24.09.2026, Sicherungen in _tmp/backup/) – wiederherstellen mit
    //   node _tools/setup-testbed.mjs --run   und   sql -name hr_freepdb1 @_tools/sql/setup-testbed-lab-style.sql
    // Erst dann funktionieren shoot/audit/audit-blue/verify-auto mit --theme <Theme>.
    9042: { alias: 'ut-lab', ut: '26.1' },
    9242: { alias: 'ut-lab-242', ut: '24.2' },
  },
  defaultApp: 9042,   // Testbett; für die Showcase-App: --app 9000 --theme none

  // Browser für Screenshots (puppeteer-core nutzt einen installierten Browser)
  chrome:
    process.env.CHROME_PATH ||
    'C:/Program Files/Google/Chrome/Application/chrome.exe',

  // Name des Labor-Styles in den Testbetten. Seine CSS-Dateien werden vom
  // Harness abgefangen und live aus dem Quellordner des Themes ausgeliefert.
  labFolder: 'themelab',
};

export const pageUrl = (app, alias) =>
  `${config.ordsBase}/r/${config.workspacePath}/${config.apps[app].alias}/${String(alias).toLowerCase()}`;
