// Richtet die Testbetten ein: lädt die offizielle "Universal Theme Reference" App
// (oracle/apex auf GitHub) für UT 26.1 und UT 24.2 und installiert sie per SQLcl.
//
//   node _tools/setup-testbed.mjs            → nur herunterladen und Befehle anzeigen
//   node _tools/setup-testbed.mjs --run      → zusätzlich installieren (SQLcl-Verbindung aus _tools/config.mjs)
//
// Danach den Labor-Style registrieren:  sql -name <verbindung> @_tools/sql/setup-testbed-lab-style.sql
//
// Supporting Objects (Tabellen EBA_UT_* samt Beispieldaten) legt nur die UT-26.1-App an, und zwar mit "AUTO":
// _tools/sql/install-testbed-app.sql prüft vor der Installation per SQL, ob die Tabellen im Schema schon existieren
// (z. B. von der Showcase-App 9000) – dann wird ohne Supporting Objects installiert und die App nutzt die vorhandenen.
// App-IDs, Aliase und Workspace-Pfad stehen in _tools/config.mjs.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { ROOT, config } from './config.mjs';

const WORKSPACE = process.env.APEX_WORKSPACE || 'HR_DEV';
const SCHEMA = process.env.APEX_SCHEMA || 'HR';
const SOURCES = [
  { ver: '26.1', url: 'https://raw.githubusercontent.com/oracle/apex/26.1/sample-apps/universal-theme-reference/sql/universal-theme-reference.sql', app: 9042, supObj: 'AUTO' },
  { ver: '24.2', url: 'https://raw.githubusercontent.com/oracle/apex/24.2/sample-apps/universal-theme-reference/universal-theme-reference.sql', app: 9242, supObj: 'N' },
];

const dir = path.join(ROOT, '_tmp', 'testbed');
fs.mkdirSync(dir, { recursive: true });
for (const s of SOURCES) {
  const file = path.join(dir, `ut-${s.ver}.sql`);
  if (!fs.existsSync(file)) {
    const res = await fetch(s.url);
    if (!res.ok) throw new Error(`${res.status} ${s.url}`);
    fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  }
  const alias = config.apps[s.app].alias.toUpperCase();
  const args = [path.relative(ROOT, file).split(path.sep).join('/'), s.app, alias, WORKSPACE, SCHEMA, s.supObj];
  console.log(`UT ${s.ver}: ${path.relative(ROOT, file)}  (${(fs.statSync(file).size / 1e6).toFixed(1)} MB)`);
  console.log(`  sql -name ${config.sqlclConnection} @_tools/sql/install-testbed-app.sql ${args.join(' ')}`);
  if (process.argv.includes('--run')) {
    execFileSync('sql', ['-S', '-noupdates', '-name', config.sqlclConnection, '@_tools/sql/install-testbed-app.sql', ...args.map(String)], {
      cwd: ROOT,
      input: 'exit\n',
      stdio: ['pipe', 'inherit', 'inherit'],
    });
  }
}
console.log('\nAnschließend:  sql -name ' + config.sqlclConnection + ' @_tools/sql/setup-testbed-lab-style.sql');
