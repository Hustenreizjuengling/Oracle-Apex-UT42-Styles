// Style-Pack: alle Theme Styles aller Themes mit einem Aufruf installieren.
//
//   node _tools/build.mjs --pack      (nur das Pack; die Theme-Installer müssen gebaut sein)
//   node _tools/build.mjs --all       (alle Themes bauen, danach das Pack)
//
// Ergebnis im Ordner style-pack/ (Projektwurzel):
//   style-pack-install.sql     ruft die Style-Installer aller Themes per @@../<Theme>/install/… auf
//   style-pack-uninstall.sql   ruft alle Deinstaller auf
//   README.md                  Übersicht der Styles, Aufruf, Voraussetzungen (Texte: _tools/style-pack.json)
//
// Themes = Ordner der Projektwurzel mit theme.json (ohne _concepts, _tmp … – alles mit "_" am Anfang).
// Reihenfolge: Nummer der Theme-Variante (theme.json → themeVariant.number), dann Ordnername.
// Die Ausgabe hängt nur von theme.json, den gebauten Installern und _tools/style-pack.json ab
// (keine Zeitstempel) – wiederholte Builds sind byte-gleich.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../config.mjs';

export const PACK_DIR = path.join(ROOT, 'style-pack');
const TEXTS_FILE = path.join(ROOT, '_tools', 'style-pack.json');

const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
const byName = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

// Alle Themes des Projekts in Pack-Reihenfolge
export function listThemes() {
  const themes = [];
  for (const e of fs.readdirSync(ROOT, { withFileTypes: true })) {
    if (!e.isDirectory() || /^[_.]/.test(e.name) || e.name === 'node_modules') continue;
    const file = path.join(ROOT, e.name, 'theme.json');
    if (!fs.existsSync(file)) continue;
    const meta = JSON.parse(fs.readFileSync(file, 'utf8'));
    themes.push({ folder: e.name, dir: path.join(ROOT, e.name), meta });
  }
  const nr = (t) => Number(t.meta.themeVariant?.number) || Number.MAX_SAFE_INTEGER;
  return themes.sort((a, b) => nr(a) - nr(b) || byName(a.folder, b.folder));
}

export function buildStylePack({ log = console.log } = {}) {
  const texts = JSON.parse(fs.readFileSync(TEXTS_FILE, 'utf8'));
  const themes = listThemes();
  if (!themes.length) throw new Error('Style-Pack: keine Themes (Ordner mit theme.json) gefunden.');

  // Themes, Styles und Installer einsammeln und prüfen
  const seenPrefix = new Map();
  const seenName = new Map();
  for (const t of themes) {
    const { meta } = t;
    t.prefix = String(meta.prefix || '').toLowerCase();
    if (!/^[a-z][a-z0-9_]*$/.test(t.prefix)) throw new Error(`${t.folder}/theme.json: Präfix "${meta.prefix}" ungeeignet (erlaubt: a–z, 0–9, _).`);
    if (seenPrefix.has(t.prefix)) throw new Error(`Präfix "${t.prefix}" doppelt: ${seenPrefix.get(t.prefix)} und ${t.folder}.`);
    seenPrefix.set(t.prefix, t.folder);
    t.installRel = `../${t.folder}/install/${t.prefix}-install.sql`;
    t.uninstallRel = `../${t.folder}/install/${t.prefix}-uninstall.sql`;
    for (const rel of [t.installRel, t.uninstallRel]) {
      if (!fs.existsSync(path.join(PACK_DIR, rel))) {
        throw new Error(`${path.join(t.folder, 'install', path.basename(rel))} fehlt – zuerst: node _tools/build.mjs ${t.folder}`);
      }
    }
    const installer = fs.readFileSync(path.join(PACK_DIR, t.installRel), 'utf8');
    t.fileCount = Number((installer.match(/statische Dateien \((\d+)\)/) || [])[1] || 0);
    t.installBytes = Buffer.byteLength(installer);
    t.styles = meta.styles.map((s) => {
      const code = `${t.prefix}-${String(s.id).toLowerCase()}`;
      if (seenName.has(s.name)) throw new Error(`Style-Name "${s.name}" doppelt: ${seenName.get(s.name)} und ${t.folder}.`);
      seenName.set(s.name, t.folder);
      return { id: String(s.id).toLowerCase(), name: s.name, code, base: s.base };
    });
  }
  const styles = themes.flatMap((t) => t.styles.map((s) => ({ ...s, theme: t })));
  const codes = styles.map((s) => s.code);
  const example = styles.find((s) => s.id === 'dark')?.code || codes[0];
  const NO_STYLE = ['-', 'n', 'no', 'nein'];
  const nThemes = themes.length;
  const nStyles = styles.length;

  // Liste der Styles am Ende beider Skripte (alle Styles des Theme 42, unsere zuerst)
  const summary = `set heading on pagesize 100 linesize 200
column theme format a14
column name format a26
column aktiv format a5
column oeffentlich format a11
prompt
prompt Theme Styles der App (Universal Theme 42):
select case
${themes.map((t) => `         when name in (${t.styles.map((s) => q(s.name)).join(', ')}) then ${q(t.meta.name)}`).join('\n')}
         else '(andere)' end theme,
       name,
       case when is_current = 'Yes' then 'ja' end aktiv,
       case when is_public = 'Yes' then 'ja' else 'nein' end oeffentlich
  from apex_application_theme_styles
 where application_id = to_number('&PACK_APP_ID.')
   and theme_number = 42
 order by case name
${styles.map((s, i) => `            when ${q(s.name)} then ${i + 1}`).join('\n')}
            else ${nStyles + 1} end, name;
declare
  l_current varchar2(255);
  l_user    varchar2(30);
begin
  select t.current_theme_style, a.theme_style_by_user_pref into l_current, l_user
    from apex_applications a
    join apex_application_themes t on t.application_id = a.application_id and t.theme_number = 42
   where a.application_id = to_number('&PACK_APP_ID.');
  dbms_output.put_line('Aktiver Style: ' || l_current);
  dbms_output.put_line('Nutzer dürfen den Style wählen (Allow End Users to choose Theme Style): '
    || case when l_user = 'Yes' then 'ja' else 'nein' end);
end;
/
`;

  const settings = 'set define on verify off feedback off serveroutput on';

  // Prüfung der Ziel-App (gemeinsam für Installation und Deinstallation)
  const appCheck = (usage) => `  if not regexp_like(nvl(trim('&PACK_APP_ID.'), '-'), '^[0-9]+$') then
    raise_application_error(-20000, 'Bitte die Application ID als ersten Parameter angeben, z. B.: ${usage}');
  end if;
  l_app_id := to_number(trim('&PACK_APP_ID.'));
  begin
    select 1 into l_cnt
      from apex_applications
     where application_id = l_app_id;
  exception
    when no_data_found then
      raise_application_error(-20000, 'Application ' || l_app_id || ' nicht gefunden (oder das Schema gehört nicht zu ihrem Workspace).');
  end;
  begin
    select version into l_ut
      from apex_application_themes
     where application_id = l_app_id and theme_number = 42;
  exception
    when no_data_found then
      raise_application_error(-20001, 'Application ' || l_app_id || ' verwendet kein Universal Theme (Theme 42).');
  end;`;

  const header = (title, body) => `--------------------------------------------------------------------------------
-- Style-Pack – ${title}
-- ${themes.map((t) => `${t.meta.name} ${t.meta.version}`).join(', ')}
-- (${nThemes} Themes, ${nStyles} Theme Styles für das Universal Theme 42)
--
-- Erzeugt von _tools/build.mjs --pack – nicht von Hand bearbeiten.
-- Ausführen als Parsing-Schema der Ziel-App (oder mit APEX_ADMINISTRATOR_ROLE)
-- in SQLcl oder SQL*Plus. Der Ordner style-pack/ muss neben den Theme-Ordnern
-- liegen: Die Skripte der Themes werden über relative Pfade (@@../) aufgerufen.
--
${body}--------------------------------------------------------------------------------
`;

  // SQL*Plus/SQLcl: &1, &2, &3 gelten auch in per @@ aufgerufenen Skripten weiter. Ein Installer,
  // der nur die App-ID bekommt, sähe sonst das &2 des Packs (z. B. "passer-dark") und bräche mit
  // ORA-20002 ab. Deshalb: vor jedem Aufruf "undefine 1 2 3" und beide Parameter ausdrücklich
  // übergeben (N = keinen Style aktivieren); die Installer ergänzen Fehlendes selbst.
  const installCalls = themes
    .map(
      (t, i) => `prompt
prompt ##### ${i + 1}/${nThemes} ${t.meta.name} ${t.meta.version} #####
set termout off
column pack_act new_value PACK_ACT noprint
select case lower(trim('&PACK_STYLE.'))
${t.styles.map((s) => `         when ${q(s.code)} then ${q(s.id)}`).join('\n')}
         else 'N' end pack_act
  from dual;
set termout on
undefine 1 2 3
@@${t.installRel} &PACK_APP_ID. &PACK_ACT.
${settings}
`,
    )
    .join('');

  const install = `${header(
    'Installation aller Theme Styles',
    `-- Aufruf:
--   @style-pack/style-pack-install.sql <APP_ID> [<STYLE>] [user]
--
--   <APP_ID>  Application ID der Ziel-App (Universal Theme 42, UT 24.2 oder 26.1)
--   <STYLE>   optional: diesen Style aktivieren, Schreibweise <Präfix>-<Style>:
${themes.map((t) => `--               ${t.styles.map((s) => s.code).join(' | ')}`).join('\n')}
--             Ohne Angabe oder "-": nichts umschalten (ein aktiver Style bleibt aktiv).
--   user      optional: zusätzlich "Allow End Users to choose Theme Style" einschalten,
--             z. B. @style-pack/style-pack-install.sql 100 ${example} user
--             oder ohne Umschalten: @style-pack/style-pack-install.sql 100 - user
--
-- Ruft nacheinander die Style-Installer aller Themes auf. Nur das Theme des gewählten
-- Styles aktiviert ihn, alle anderen legen ihre Styles nur an. Ein unbekannter Wert
-- bricht vor jeder Änderung ab. Mehrfaches Ausführen ist erlaubt (Update).
`,
  )}prompt === Style-Pack: Installation (${nThemes} Themes, ${nStyles} Styles) ===
${settings}
whenever sqlerror exit sql.sqlcode rollback

-- optionale Parameter vorbelegen, damit nicht nachgefragt wird
set termout off
column 1 new_value 1 noprint
column 2 new_value 2 noprint
column 3 new_value 3 noprint
select '' "1", '' "2", '' "3" from dual where rownum = 0;
set termout on
define PACK_APP_ID = "&1"
define PACK_STYLE  = "&2"
define PACK_USER   = "&3"
undefine 1 2 3

prompt ... Parameter und Ziel-App prüfen (vor jeder Änderung)
declare
  l_app_id  number;
  l_cnt     pls_integer;
  l_ut      varchar2(30);
  l_release varchar2(30);
  l_style   varchar2(4000) := lower(trim('&PACK_STYLE.'));
  l_user    varchar2(4000) := lower(trim('&PACK_USER.'));
  function num(p_version varchar2) return number is
  begin
    return to_number(regexp_substr(p_version, '^\\d+')) * 100
         + nvl(to_number(regexp_substr(p_version, '^\\d+\\.(\\d+)', 1, 1, null, 1)), 0);
  end num;
begin
  if l_style is not null and l_style not in (${[...NO_STYLE, ...codes].map(q).join(', ')}) then
    raise_application_error(-20002, 'Unbekannter Style "' || l_style || '" – erlaubt: '
      || ${q(codes.join(', '))} || ' oder "-" (keinen aktivieren). Es wurde nichts geändert.'
      || ' Hinweis: SQL*Plus/SQLcl behalten Parameter früherer Skriptaufrufe – ggf. "undefine 2 3" oder neue Sitzung.');
  end if;
  if l_user is not null and l_user <> 'user' then
    raise_application_error(-20002, 'Unbekannter dritter Parameter "' || l_user || '" – erlaubt: user. Es wurde nichts geändert.');
  end if;
  select version_no into l_release from apex_release;
  if num(l_release) < 2402 then
    raise_application_error(-20005, 'Das Style-Pack erfordert APEX 24.2 oder neuer (installiert: ' || l_release || ').');
  end if;
${appCheck(`@style-pack/style-pack-install.sql 100 ${example}`)}
  dbms_output.put_line('Ziel: Application ' || l_app_id || ', Universal Theme ' || l_ut || ', APEX ' || l_release);
  if num(l_ut) < 2402 then
    dbms_output.put_line('Hinweis: Die Styles sind für die UT-Dateiversionen 24.2 und 26.1 gebaut und getestet (App: ' || l_ut || ').');
  end if;
end;
/
${installCalls}
prompt
prompt ... Nutzerwahl (optional)
declare
  l_app_id  number := to_number('&PACK_APP_ID.');
  l_page_id number;
  l_owner   varchar2(128);
begin
  if lower(trim('&PACK_USER.')) = 'user' then
    select min(page_id) into l_page_id
      from apex_application_pages
     where application_id = l_app_id and page_id > 0;
    select owner into l_owner from apex_applications where application_id = l_app_id;
    apex_session.create_session(p_app_id => l_app_id, p_page_id => l_page_id, p_username => l_owner);
    apex_theme.enable_user_style(p_application_id => l_app_id, p_theme_number => 42);
    apex_session.delete_session;
    commit;
    dbms_output.put_line('Allow End Users to choose Theme Style: eingeschaltet');
  end if;
end;
/
${summary}prompt === Style-Pack: fertig ===
undefine 1 2 3
whenever sqlerror continue none
set define on verify on feedback on
`;

  const uninstallCalls = themes
    .map(
      (t, i) => `prompt
prompt ##### ${i + 1}/${nThemes} ${t.meta.name} #####
undefine 1 2 3
@@${t.uninstallRel} &PACK_APP_ID.
${settings}
`,
    )
    .join('');

  const uninstall = `${header(
    'Deinstallation aller Theme Styles',
    `-- Aufruf:
--   @style-pack/style-pack-uninstall.sql <APP_ID>
--
-- Ruft nacheinander die Deinstaller aller Themes auf. Jeder schaltet auf "Vita" zurück,
-- falls einer seiner Styles aktiv ist, deaktiviert seine Styles (nicht mehr öffentlich,
-- nur noch Vita-CSS) und löscht seine Dateien unter #APP_FILES#<Präfix>/.
-- APEX bietet keine API zum Löschen von Theme Styles; die deaktivierten Einträge bei Bedarf
-- in Shared Components > Themes > Universal Theme > Theme Styles löschen.
-- "Allow End Users to choose Theme Style" bleibt, wie es ist.
`,
  )}prompt === Style-Pack: Deinstallation (${nThemes} Themes) ===
${settings}
whenever sqlerror exit sql.sqlcode rollback

set termout off
column 1 new_value 1 noprint
select '' "1" from dual where rownum = 0;
set termout on
define PACK_APP_ID = "&1"
undefine 1 2 3

prompt ... Ziel-App prüfen
declare
  l_app_id number;
  l_cnt    pls_integer;
  l_ut     varchar2(30);
begin
${appCheck('@style-pack/style-pack-uninstall.sql 100')}
end;
/
${uninstallCalls}${summary}prompt === Style-Pack: fertig ===
undefine 1 2 3
whenever sqlerror continue none
set define on verify on feedback on
`;

  // README
  const mood = (s) => {
    const m = texts.anmutung?.[s.code] || (s.id === 'auto' ? texts.anmutung?.auto : null);
    if (m) return m;
    log(`WARN _tools/style-pack.json: keine Anmutung für "${s.code}" – erster Satz aus theme.json`);
    return String(s.theme.meta.description || '').split(/(?<=\.)\s/)[0];
  };
  const mb = (n) => `${(n / 1048576).toFixed(1).replace(".", ",")} MB`;
  const totalBytes = themes.reduce((a, t) => a + t.installBytes, 0);
  const totalFiles = themes.reduce((a, t) => a + t.fileCount, 0);
  const cell = (s) => String(s).replace(/\|/g, '\\|');
  const rows = styles.map((s, i) => {
    const first = i === 0 || styles[i - 1].theme !== s.theme;
    const themeCell = first ? `[${s.theme.meta.name}](../${s.theme.folder}/README.md)` : '';
    return `| ${themeCell} | **${s.name}** | \`${s.code}\` | ${s.base || '–'}${s.id === 'auto' ? ' + UT-Delta' : ''} | ${cell(mood(s))} |`;
  });
  const notes = themes.filter((t) => texts.hinweise?.[t.prefix]);
  const readme = `# Style-Pack

Alle Theme Styles dieses Projekts mit einem Aufruf in eine APEX-App einspielen: **${nThemes} Themes mit je
${[...new Set(themes.map((t) => t.styles.length))].join('/')} Styles, zusammen ${nStyles}** für das Universal Theme 42.
Die App wird nicht umgebaut: Die Styles erscheinen unter *Shared Components › Themes › Universal Theme › Theme Styles*
und lassen sich per Klick umschalten.

> Erzeugt von \`node _tools/build.mjs --pack\` – nicht von Hand bearbeiten (Texte: \`_tools/style-pack.json\`).

## Enthalten

| Theme | Style | Parameter | Basis | Anmutung |
|---|---|---|---|---|
${rows.join('\n')}

## Installieren

\`\`\`sql
-- alle ${nStyles} Styles anlegen, nichts umschalten
@style-pack/style-pack-install.sql 100

-- anlegen und ${styles.find((s) => s.code === example).name} aktivieren
@style-pack/style-pack-install.sql 100 ${example}

-- zusätzlich dürfen die Nutzer ihren Style selbst wählen
@style-pack/style-pack-install.sql 100 ${example} user

-- Nutzerwahl einschalten, ohne umzuschalten
@style-pack/style-pack-install.sql 100 - user
\`\`\`

| Parameter | Bedeutung |
|---|---|
| 1 \`APP_ID\` | Application ID der Ziel-App (Pflicht) |
| 2 \`STYLE\` | optional: Style aktivieren, Schreibweise \`<präfix>-<style>\` wie in der Tabelle. Ohne Angabe oder \`-\` wird nichts umgeschaltet, ein aktiver Style bleibt aktiv. |
| 3 \`user\` | optional: *Allow End Users to choose Theme Style* einschalten – in der Fußzeile der App erscheint dann *Customize*, dort wählt jeder Nutzer einen der öffentlichen Styles für sich. |

Das Pack ruft nacheinander die Installer der Themes auf (${themes.map((t) => t.meta.name).join(', ')}). Jeder legt seine
Dateien unter \`#APP_FILES#<präfix>/\` ab und registriert seine Styles; nur das Theme des gewählten Styles schaltet um.
Ein unbekannter Wert bricht ab, bevor etwas geändert wird. Mehrfaches Ausführen ist erlaubt (Update, der aktive Style
bleibt). Am Ende stehen alle Styles der App, der aktive Style und die Einstellung der Nutzerwahl.

Am besten in einer eigenen SQLcl-Sitzung starten: SQL*Plus und SQLcl behalten Parameter früherer Skriptaufrufe. Die
Installer dieses Projekts räumen ihre Parameter am Ende selbst auf; hat aber ein anderes Skript vorher einen zweiten
Parameter hinterlassen, bricht das Pack ohne eigenen zweiten Parameter ab (nichts geändert) – dann \`undefine 2 3\` und
erneut aufrufen.

Jede Style-URL trägt einen Inhalts-Hash (\`?v=…\`). Nach einem Update laden die Browser deshalb sofort das neue CSS, obwohl
APEX App-Dateien als *immutable* ausliefert.

## Deinstallieren

\`\`\`sql
@style-pack/style-pack-uninstall.sql 100
\`\`\`

Ruft alle Deinstaller auf: Ist einer der Styles aktiv, wird auf *Vita* zurückgeschaltet. Die Styles werden deaktiviert
(nicht mehr öffentlich, nur noch Vita-CSS) und alle Dateien unter \`#APP_FILES#<präfix>/\` gelöscht. APEX hat keine API
zum Löschen von Theme Styles – die deaktivierten Einträge bei Bedarf im App Builder löschen; eine erneute Installation
aktiviert sie wieder. Die Nutzerwahl bleibt, wie sie ist (ausschalten: \`apex_theme.disable_user_style\`).

## Voraussetzungen

- Oracle APEX **24.2 oder neuer** (getestet auf 26.1); die App verwendet das **Universal Theme 42** mit der
  UT-Dateiversion **24.2 oder 26.1**.
- SQLcl oder SQL*Plus, verbunden als Parsing-Schema der App (oder mit \`APEX_ADMINISTRATOR_ROLE\`).
- Der Ordner \`style-pack/\` liegt neben den Theme-Ordnern – die Installer der Themes werden über relative Pfade aufgerufen.
  Der Aufruf selbst geht aus jedem Verzeichnis (Pfad zum Pack anpassen).

## Laufzeit

${themes.length} Installer mit zusammen ${mb(totalBytes)} SQL laden ${totalFiles} Dateien (CSS, Schriften, Lizenz- und Hinweisdateien) in die App.
${texts.laufzeit || ''}

## Einzelne Themes

Jedes Theme lässt sich auch allein installieren, Details, Bilder und Grenzen stehen in seiner README:

| Theme | Installer | Dateien | README |
|---|---|---|---|
${themes.map((t) => `| ${t.meta.name} ${t.meta.version} | \`${t.folder}/install/${t.prefix}-install.sql\` (${mb(t.installBytes)}) | ${t.fileCount} | [${t.folder}/README.md](../${t.folder}/README.md) |`).join('\n')}

Nicht im Pack enthalten sind die Theme-Varianten (eigene Theme-Nummern, \`<präfix>-theme-install.sql\`, ab APEX 26.1).
${notes.length ? `\nHerkunft (Einzelheiten in den READMEs der Themes):\n\n${notes.map((t) => `- **${t.meta.name}** – ${texts.hinweise[t.prefix]}.`).join('\n')}\n` : ''}`;

  fs.mkdirSync(PACK_DIR, { recursive: true });
  const out = [
    ['style-pack-install.sql', install],
    ['style-pack-uninstall.sql', uninstall],
    ['README.md', readme],
  ];
  for (const [name, text] of out) {
    fs.writeFileSync(path.join(PACK_DIR, name), text);
    log(`PACK ${path.relative(ROOT, path.join(PACK_DIR, name))}  ${(Buffer.byteLength(text) / 1024).toFixed(1)} KB`);
  }
  log(`PACK ${nThemes} Themes, ${nStyles} Styles: ${themes.map((t) => t.meta.name).join(', ')}`);
}
