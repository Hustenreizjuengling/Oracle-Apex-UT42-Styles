// Baut ein Theme: CSS-Bundles (lesbar + minifiziert), Assets und die SQL-Installer.
//
//   node _tools/build.mjs <ThemeOrdner>           ein Theme
//   node _tools/build.mjs <ThemeOrdner> --pack    ein Theme, danach das Style-Pack
//   node _tools/build.mjs --pack                  nur das Style-Pack (aus den gebauten Installern)
//   node _tools/build.mjs --all                   alle Themes, danach das Style-Pack
//
// Style-Pack (_tools/lib/style-pack.mjs): style-pack/style-pack-install.sql, -uninstall.sql und
// README.md in der Projektwurzel – alle Styles aller Themes mit einem Aufruf installieren.
//
// Ergebnis:
//   <Theme>/dist/<prefix>-<style>.css / .min.css     gebündeltes CSS je Style
//   <Theme>/dist/<assets…>                            z. B. fonts/*.woff2
//   <Theme>/install/<prefix>-install.sql              Installer (SQLcl / SQL*Plus / SQL Developer)
//   <Theme>/install/<prefix>-uninstall.sql            Deinstallation
//
// Nur wenn theme.json einen Block "themeVariant" hat – eigenständiges Theme
// mit eigener Nummer (Auswahl per Switch Theme im App Builder, APEX 26.1+):
//   <Theme>/install/<prefix>-theme-install.sql        Installer der Theme-Variante
//   <Theme>/install/<prefix>-theme-uninstall.sql      Deinstallation der Theme-Variante
import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { bundleStyle, readThemeJson } from './lib/bundle.mjs';
import { buildStylePack, listThemes } from './lib/style-pack.mjs';
import { ROOT } from './config.mjs';

const MIME = {
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.json': 'application/json',
  '.txt': 'text/plain',
};
const TEXT_EXT = new Set(['.css', '.js', '.svg', '.json', '.txt']);

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith('--')));
const themeArgs = args.filter((a) => !a.startsWith('--'));
const badFlags = [...flags].filter((f) => f !== '--pack' && f !== '--all');
if (badFlags.length || themeArgs.length > 1 || (!themeArgs.length && !flags.size) || (flags.has('--all') && themeArgs.length)) {
  console.error('Aufruf: node _tools/build.mjs <ThemeOrdner> [--pack]  |  node _tools/build.mjs --pack  |  node _tools/build.mjs --all');
  process.exit(1);
}
if (flags.has('--all')) {
  // jedes Theme in einem eigenen Prozess (der Build eines Themes arbeitet auf Modulebene)
  for (const t of listThemes()) {
    const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url), t.folder], { stdio: 'inherit' });
    if (r.status !== 0) process.exit(r.status ?? 1);
  }
}
if (!themeArgs.length) {
  buildStylePack();
  process.exit(0);
}
const themeArg = themeArgs[0];
const { dir, meta } = readThemeJson(themeArg);
const prefix = meta.prefix;
const distDir = path.join(dir, 'dist');
const installDir = path.join(dir, 'install');
fs.rmSync(distDir, { recursive: true, force: true });
fs.mkdirSync(distDir, { recursive: true });
fs.mkdirSync(installDir, { recursive: true });

// Kopfkommentar je Bundle: Lizenz des Themes plus Drittanbieter-Hinweise (siehe THIRD-PARTY-NOTICES.md)
const bannerFor = (styleId) =>
  `/*! ${meta.name} ${meta.version} – Theme Style für das Oracle APEX Universal Theme (UT 24.2+). ${meta.license || ''}` +
  ' Kartensymbole mit Pfaddaten aus MapLibre GL JS (BSD-3-Clause, © MapLibre contributors, © Mapbox;' +
  ' https://github.com/maplibre/maplibre-gl-js/blob/main/LICENSE.txt).' +
  (styleId === 'auto' ? ' Enthält aus dem Universal Theme (Oracle APEX) abgeleitete Variablenwerte (Vita → Vita-Dark), nur zur Verwendung mit Oracle APEX.' : '') +
  ' */\n';

// 1) CSS-Bundles
const files = []; // { rel: Pfad unterhalb von <prefix>/, abs: Datei in dist }
for (const style of meta.styles) {
  for (const minify of [false, true]) {
    const { code } = bundleStyle(dir, style.id, { minify });
    const name = `${prefix}-${style.id}${minify ? '.min' : ''}.css`;
    const abs = path.join(distDir, name);
    fs.writeFileSync(abs, bannerFor(style.id) + code);
    files.push({ rel: name, abs });
    console.log(`CSS  ${path.relative(ROOT, abs)}  ${(fs.statSync(abs).size / 1024).toFixed(1)} KB`);
  }
}

// 2) Assets (alles unter <Theme>/assets wird 1:1 übernommen)
const assetsDir = path.join(dir, 'assets');
function walk(d) {
  if (!fs.existsSync(d)) return [];
  return fs.readdirSync(d, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)],
  );
}
for (const src of walk(assetsDir)) {
  const rel = path.relative(assetsDir, src).split(path.sep).join('/');
  const abs = path.join(distDir, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.copyFileSync(src, abs);
  files.push({ rel, abs });
  console.log(`FILE ${path.relative(ROOT, abs)}  ${(fs.statSync(abs).size / 1024).toFixed(1)} KB`);
}

// 3) Installer
const q = (s) => `'${String(s).replace(/'/g, "''")}'`;

// Kurzer Inhalts-Hash je Style (lesbares + minifiziertes Bundle) für den Cache-Parameter der Style-URL
const cssHash = Object.fromEntries(meta.styles.map((st) => {
  const h = crypto.createHash('sha1');
  for (const n of [`${prefix}-${st.id}.css`, `${prefix}-${st.id}.min.css`]) h.update(fs.readFileSync(path.join(distDir, n)));
  return [st.id, h.digest('hex').slice(0, 10)];
}));

function styleCssUrls(style) {
  const urls = [];
  if (style.base) urls.push(`#THEME_FILES#css/${style.base}#MIN#.css?v=#APEX_VERSION#`);
  for (const u of style.extraCss || []) urls.push(u);
  // ?v=<Inhalts-Hash>: APEX liefert App-Dateien als "immutable" unter .../files/static/v<files_version>/ aus, und
  // die Import-API erhöht files_version nicht. Ohne den Parameter behielten Browser nach einem Update das alte CSS.
  urls.push(`#APP_FILES#${prefix}/${prefix}-${style.id}#MIN#.css?v=${cssHash[style.id]}`);
  return urls.join('\n');
}

// Dateiinhalt als Zuweisungen an wwv_flow_imp.g_varchar2_table (200 Byte je Zeile, wie im APEX-Export)
function hexTable(abs) {
  const hex = fs.readFileSync(abs).toString('hex').toUpperCase();
  const lines = [];
  for (let i = 0, n = 1; i < hex.length; i += 400, n++) {
    lines.push(`wwv_flow_imp.g_varchar2_table(${n}) := '${hex.slice(i, i + 400)}';`);
  }
  return lines.join('\n');
}
const mimeOf = (rel) => MIME[path.extname(rel).toLowerCase()] || 'application/octet-stream';
const charsetOf = (rel) => (TEXT_EXT.has(path.extname(rel).toLowerCase()) ? "'utf-8'" : 'null');

function fileBlock(f) {
  const fileName = `${prefix}/${f.rel}`;
  return `prompt ... ${fileName}
declare
  l_id number;
begin
wwv_flow_imp.g_varchar2_table := wwv_flow_imp.empty_varchar2_table;
${hexTable(f.abs)}
select max(application_file_id) into l_id
  from apex_application_static_files
 where application_id = wwv_flow_application_install.get_application_id
   and file_name = ${q(fileName)};
wwv_flow_imp_shared.create_app_static_file(
  p_id           => l_id,
  p_file_name    => ${q(fileName)},
  p_mime_type    => ${q(mimeOf(f.rel))},
  p_file_charset => ${charsetOf(f.rel)},
  p_file_content => wwv_flow_imp.varchar2_to_blob(wwv_flow_imp.g_varchar2_table));
end;
/
`;
}

const activateCases = meta.styles
  .map((s) => `      when ${q(s.id.toUpperCase())} then ${q(s.name)}`)
  .join('\n');

const header = (title) => `--------------------------------------------------------------------------------
-- ${meta.name} ${meta.version} – ${title}
-- ${meta.description || ''}
--
-- Erzeugt von _tools/build.mjs – nicht von Hand bearbeiten.
-- Ausführen als Parsing-Schema der Ziel-App (oder mit APEX_ADMINISTRATOR_ROLE)
-- in SQLcl, SQL*Plus oder SQL Developer (Skript ausführen, F5).
--------------------------------------------------------------------------------
`;

const paramBlock = `set define on verify off feedback off serveroutput on
whenever sqlerror exit sql.sqlcode rollback

-- optionale Parameter vorbelegen, damit nicht nachgefragt wird
set termout off
column 1 new_value 1 noprint
column 2 new_value 2 noprint
select '' "1", '' "2" from dual where rownum = 0;
set termout on
define APP_ID   = "&1"
define ACTIVATE = "&2"
`;

const contextBlock = `declare
  l_app_id number;
  l_ws     number;
  l_owner  varchar2(128);
  l_cnt    pls_integer;
begin
  if '&APP_ID.' is null then
    raise_application_error(-20000, 'Bitte die Application ID als ersten Parameter angeben, z. B.: @${prefix}-install.sql 100 ${meta.styles[0].id}');
  end if;
  l_app_id := to_number('&APP_ID.');
  begin
    select workspace_id, owner into l_ws, l_owner
      from apex_applications
     where application_id = l_app_id;
  exception
    when no_data_found then
      raise_application_error(-20000, 'Application ' || l_app_id || ' nicht gefunden (oder das Schema gehört nicht zu ihrem Workspace).');
  end;
  select count(*) into l_cnt
    from apex_application_themes
   where application_id = l_app_id and theme_number = 42;
  if l_cnt = 0 then
    raise_application_error(-20001, 'Application ' || l_app_id || ' verwendet kein Universal Theme (Theme 42).');
  end if;
  apex_application_install.set_workspace_id(l_ws);
  apex_application_install.set_application_id(l_app_id);
  apex_application_install.set_offset(0);
  apex_application_install.set_schema(l_owner);
  wwv_flow_imp.component_begin(
    p_version_yyyy_mm_dd     => '2024.11.30',
    p_release                => '24.2.0',
    p_default_workspace_id   => l_ws,
    p_default_application_id => l_app_id,
    p_default_id_offset      => 0,
    p_default_owner          => l_owner);
end;
/
`;

const styleProc = `-- legt einen Theme Style an oder ersetzt ihn (Suche über den Namen).
-- p_static_id gibt es erst ab APEX 26.1, daher dynamisches PL/SQL.
procedure upsert_style(p_name varchar2, p_static_id varchar2, p_css varchar2, p_public boolean default true) is
  l_id    number;
  l_major number;
  l_pub   varchar2(5) := case when p_public then 'true' else 'false' end;
begin
  select max(theme_style_id) into l_id
    from apex_application_theme_styles
   where application_id = wwv_flow_application_install.get_application_id
     and theme_number = 42
     and name = p_name;
  select to_number(regexp_substr(version_no, '^\\d+')) into l_major from apex_release;
  if l_major >= 26 then
    execute immediate 'begin wwv_flow_imp_shared.create_theme_style(p_id => :1, p_theme_id => 42, p_name => :2, p_static_id => :3, p_css_file_urls => :4, p_is_current => false, p_is_public => ' || l_pub || ', p_is_accessible => false, p_theme_roller_read_only => true); end;'
      using l_id, p_name, p_static_id, p_css;
  else
    execute immediate 'begin wwv_flow_imp_shared.create_theme_style(p_id => :1, p_theme_id => 42, p_name => :2, p_css_file_urls => :3, p_is_current => false, p_is_public => ' || l_pub || ', p_is_accessible => false, p_theme_roller_read_only => true); end;'
      using l_id, p_name, p_css;
  end if;
end upsert_style;
`;

const install = `${header('Installation als Theme Styles')}--
-- Aufruf:
--   @${prefix}-install.sql <APP_ID> [<STYLE>]
--
--   <APP_ID>  Application ID der Ziel-App (Universal Theme 42, UT-Version 24.2 oder 26.1)
--   <STYLE>   optional: ${meta.styles.map((s) => s.id).join(' | ')} – diesen Style sofort aktivieren.
--             Ohne Angabe werden die Styles nur angelegt (Auswahl dann in
--             Shared Components > Themes > Universal Theme > Theme Styles).
--
-- Mehrfaches Ausführen ist erlaubt (Update): Dateien und Styles werden ersetzt.
--------------------------------------------------------------------------------
prompt === ${meta.name} ${meta.version}: Installation ===
${paramBlock}
prompt ... Style-Parameter prüfen (vor jeder Änderung)
begin
  if '&ACTIVATE.' is not null and upper('&ACTIVATE.') not in ('N', 'NO', 'NEIN', ${meta.styles.map((s) => q(s.id.toUpperCase())).join(', ')}) then
    raise_application_error(-20002, 'Unbekannter Style "&ACTIVATE." – erlaubt: ${meta.styles.map((s) => s.id).join(', ')}');
  end if;
end;
/
prompt ... Ziel-App prüfen
${contextBlock}
prompt ... statische Dateien (${files.length}) nach #APP_FILES#${prefix}/
${files.map(fileBlock).join('')}
prompt ... Theme Styles
declare
${styleProc}
begin
${meta.styles
  .map(
    (s) => `  upsert_style(
    p_name      => ${q(s.name)},
    p_static_id => ${q(s.staticId || `${prefix}-${s.id}`)},
    p_css       => ${styleCssUrls(s)
      .split('\n')
      .map(q)
      .join(' || chr(10) || ')});`,
  )
  .join('\n')}
end;
/
begin
  wwv_flow_imp.component_end(p_auto_install_sup_obj => false, p_is_component_import => true);
  commit;
end;
/

prompt ... Style aktivieren (optional)
declare
  l_app_id   number := wwv_flow_application_install.get_application_id;
  l_name     varchar2(255);
  l_style_id number;
  l_page_id  number;
  l_owner    varchar2(128);
begin
  if '&ACTIVATE.' is not null and upper('&ACTIVATE.') not in ('N', 'NO', 'NEIN') then
    l_name := case upper('&ACTIVATE.')
${activateCases}
    end;
    if l_name is null then
      raise_application_error(-20002, 'Unbekannter Style "&ACTIVATE." – erlaubt: ${meta.styles.map((s) => s.id).join(', ')}');
    end if;
    select theme_style_id into l_style_id
      from apex_application_theme_styles
     where application_id = l_app_id and theme_number = 42 and name = l_name;
    select min(page_id) into l_page_id
      from apex_application_pages
     where application_id = l_app_id and page_id > 0;
    select owner into l_owner from apex_applications where application_id = l_app_id;
    apex_session.create_session(p_app_id => l_app_id, p_page_id => l_page_id, p_username => l_owner);
    apex_theme.set_current_style(p_application_id => l_app_id, p_theme_number => 42, p_id => to_char(l_style_id));
    apex_session.delete_session;
    commit;
    dbms_output.put_line('Aktiver Theme Style: ' || l_name);
  end if;
end;
/

set heading on pagesize 50 linesize 200
column name format a30
column is_current format a10
prompt
prompt Installierte Theme Styles:
select name, is_current
  from apex_application_theme_styles
 where application_id = wwv_flow_application_install.get_application_id
   and theme_number = 42  -- nicht die gleichnamigen Styles der Theme-Variante
   and name in (${meta.styles.map((s) => q(s.name)).join(', ')})
 order by name;
prompt === fertig ===
-- Positionsparameter aufräumen: sonst sähe ein folgendes Skript derselben Sitzung (z. B. das Style-Pack) noch &1/&2
undefine 1 2
set define on verify on feedback on
`;
fs.writeFileSync(path.join(installDir, `${prefix}-install.sql`), install);
console.log(`SQL  ${path.relative(ROOT, path.join(installDir, `${prefix}-install.sql`))}  ${(install.length / 1024).toFixed(0)} KB`);

const uninstall = `${header('Deinstallation')}--
-- Aufruf:
--   @${prefix}-uninstall.sql <APP_ID>
--
-- Was passiert:
--   1. Ist ein ${meta.name}-Style aktiv, wird auf "Vita" zurückgeschaltet.
--   2. Die ${meta.name}-Styles werden deaktiviert (nicht mehr öffentlich, nur noch Vita-CSS).
--   3. Alle statischen Dateien unter #APP_FILES#${prefix}/ werden gelöscht.
--
-- APEX bietet keine API zum Löschen von Theme Styles. Die deaktivierten Einträge
-- bitte bei Bedarf in Shared Components > Themes > Universal Theme > Theme Styles
-- löschen. Eine erneute Installation reaktiviert sie.
--------------------------------------------------------------------------------
prompt === ${meta.name} ${meta.version}: Deinstallation ===
${paramBlock}
prompt ... Ziel-App prüfen
${contextBlock}
prompt ... auf Vita zurückschalten (falls nötig)
declare
  l_app_id  number := wwv_flow_application_install.get_application_id;
  l_current varchar2(255);
  l_vita    number;
  l_page_id number;
  l_owner   varchar2(128);
  l_ws      number;
begin
  select max(current_theme_style) into l_current
    from apex_application_themes
   where application_id = l_app_id and theme_number = 42;
  if l_current in (${meta.styles.map((s) => q(s.name)).join(', ')}) then
    select theme_style_id into l_vita
      from apex_application_theme_styles
     where application_id = l_app_id and theme_number = 42 and name = 'Vita';
    select min(page_id) into l_page_id
      from apex_application_pages
     where application_id = l_app_id and page_id > 0;
    select owner, workspace_id into l_owner, l_ws from apex_applications where application_id = l_app_id;
    apex_session.create_session(p_app_id => l_app_id, p_page_id => l_page_id, p_username => l_owner);
    apex_theme.set_current_style(p_application_id => l_app_id, p_theme_number => 42, p_id => to_char(l_vita));
    apex_session.delete_session;
    dbms_output.put_line('Aktiver Theme Style zurückgesetzt auf: Vita');
    -- create_session/delete_session leeren den Import-Kontext von component_begin. Ohne
    -- neuen Kontext scheitert create_theme_style unten mit ORA-01400 (FLOW_ID NULL).
    apex_application_install.set_workspace_id(l_ws);
    apex_application_install.set_application_id(l_app_id);
    apex_application_install.set_offset(0);
    apex_application_install.set_schema(l_owner);
    wwv_flow_imp.component_begin(
      p_version_yyyy_mm_dd     => '2024.11.30',
      p_release                => '24.2.0',
      p_default_workspace_id   => l_ws,
      p_default_application_id => l_app_id,
      p_default_id_offset      => 0,
      p_default_owner          => l_owner);
  end if;
end;
/
prompt ... Styles deaktivieren
declare
  l_cnt pls_integer;
${styleProc}
begin
${meta.styles
  .map(
    (s) => `  select count(*) into l_cnt from apex_application_theme_styles
   where application_id = wwv_flow_application_install.get_application_id and theme_number = 42 and name = ${q(s.name)};
  if l_cnt > 0 then
    upsert_style(p_name => ${q(s.name)}, p_static_id => ${q(s.staticId || `${prefix}-${s.id}`)},
                 p_css => '#THEME_FILES#css/Vita#MIN#.css?v=#APEX_VERSION#', p_public => false);
  end if;`,
  )
  .join('\n')}
end;
/
prompt ... statische Dateien entfernen
begin
  for f in (select application_file_id, file_name
              from apex_application_static_files
             where application_id = wwv_flow_application_install.get_application_id
               and file_name like '${prefix}/%')
  loop
    wwv_flow_imp_shared.remove_app_static_file(p_id => f.application_file_id, p_flow_id => wwv_flow_application_install.get_application_id);
    dbms_output.put_line('entfernt: ' || f.file_name);
  end loop;
end;
/
begin
  wwv_flow_imp.component_end(p_auto_install_sup_obj => false, p_is_component_import => true);
  commit;
end;
/
prompt === fertig ===
-- Positionsparameter aufräumen: sonst sähe ein folgendes Skript derselben Sitzung (z. B. das Style-Pack) noch &1/&2
undefine 1 2
set define on verify on feedback on
`;
fs.writeFileSync(path.join(installDir, `${prefix}-uninstall.sql`), uninstall);
console.log(`SQL  ${path.relative(ROOT, path.join(installDir, `${prefix}-uninstall.sql`))}`);

// 4) Theme-Variante (optional, theme.json → "themeVariant")
//
// Dasselbe Design als eigenständiges Theme mit eigener Nummer. Es abonniert denselben
// Universal-Theme-Master wie das Theme 42 der Ziel-App (APEX 26.1: zentrale Templates),
// hat also dieselben Templates, Template-IDs und Template-Optionen. Eigen sind Name,
// Nummer, die Theme-Dateien (CSS, Schriften, per #THEME_DB_FILES#) und die Styles.
// Einstellungen und Standard-Templates werden aus dem Theme 42 der App übernommen.
// Die App auf das Theme umschalten kann nur der App Builder (Switch Theme).
//
// Befund APEX 26.1 (getestet, siehe Passepartout/docs/THEME-VARIANTE.md): Switch Theme
// auf ein abonniertes Theme scheitert an der Prüfung der Template Components. Vorher muss
// das Theme im App Builder entkoppelt werden (Theme Subscription > Unsubscribe); es wird
// dann eine eigene Kopie der Templates und Template Components, und APEX hängt dabei alle
// Template-Bezüge der App auf diese Kopien um (auch solange Theme 42 aktuell ist). Für eine solche Kopie
// (reference_id leer, auch nach einem Theme-Import) aktualisiert der Installer nur noch
// Theme-Dateien und Styles – create_theme würde das Theme wieder an den Master hängen
// und die Templates doppelt anlegen.
const UT = 42; // Universal Theme: Quelle der Einstellungen; unter dieser Nummer listen die Template-Views den Master

// Standard-Templates: [create_theme-Parameter, Typ in apex_application_templates,
// Spalte in apex_application_themes (liefert den Template-NAMEN)]
const THEME_DEFAULTS = [
  ['p_default_page_template', 'Page', 'default_page_template'],
  ['p_default_dialog_template', 'Page', 'default_dialog_template'],
  ['p_default_button_template', 'Button', 'default_button_template'],
  ['p_default_region_template', 'Region', 'default_region_template'],
  ['p_default_chart_template', 'Region', 'default_chart_rg_template'],
  ['p_default_form_template', 'Region', 'default_form_rg_template'],
  ['p_default_reportr_template', 'Region', 'default_report_region_template'],
  ['p_default_tabform_template', 'Region', 'default_tabular_form_template'],
  ['p_default_wizard_template', 'Region', 'default_wizard_template'],
  ['p_default_menur_template', 'Region', 'default_breadcrumb_rg_template'],
  ['p_default_listr_template', 'Region', 'default_list_region_template'],
  ['p_default_irr_template', 'Region', 'default_irr_template'],
  ['p_default_dialogr_template', 'Region', 'default_dialogr_template'],
  ['p_default_dialogbtnr_template', 'Region', 'default_dialogbtnr_template'],
  ['p_default_report_template', 'Report', 'default_report_row_template'],
  ['p_default_label_template', 'Item Label', 'default_item_label_template'],
  ['p_default_option_label', 'Item Label', 'default_option_label'],
  ['p_default_required_label', 'Item Label', 'default_required_label'],
  ['p_default_menu_template', 'Breadcrumb', 'default_breadcrumb_template'],
  ['p_default_calendar_template', 'Calendar', 'default_calendar_template'],
  ['p_default_list_template', 'List', 'default_list_template'],
  ['p_default_nav_list_template', 'List', 'default_nav_list_template'],
  ['p_default_top_nav_list_temp', 'List', 'default_top_nav_list_template'],
  ['p_default_side_nav_list_temp', 'List', 'default_side_nav_list_template'],
  ['p_default_navbar_list_template', 'List', 'default_nav_bar_list_template'],
];

// SQL-Literal, das unabhängig vom Zeichensatz des Clients und von SET DEFINE ankommt:
// Nicht-ASCII-Zeichen und "&" werden per UNISTR kodiert.
function sqlText(s) {
  s = String(s);
  if (/^[\x20-\x7e]*$/.test(s) && !s.includes('&')) return q(s);
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    const ch = s[i];
    if (ch === '\\') out += '\\005C';
    else if (ch === "'") out += "''";
    else if (c >= 0x20 && c <= 0x7e && ch !== '&') out += ch;
    else out += '\\' + c.toString(16).toUpperCase().padStart(4, '0');
  }
  return `unistr('${out}')`;
}

function buildThemeVariant(tv) {
  const n = Number(tv.number);
  if (!Number.isInteger(n) || n < 1 || n === UT) {
    throw new Error(`theme.json: themeVariant.number muss eine ganze Zahl ungleich ${UT} sein (ist: ${tv.number})`);
  }
  const styleIds = meta.styles.map((s) => s.id);
  const defaultStyle = tv.defaultStyle || styleIds[0];
  if (!styleIds.includes(defaultStyle)) {
    throw new Error(`theme.json: themeVariant.defaultStyle "${defaultStyle}" ist kein Style (vorhanden: ${styleIds.join(', ')})`);
  }
  const name = tv.name || meta.name;
  const staticId = (tv.staticId || prefix).toLowerCase();
  const internalName = (tv.internalName || name.toUpperCase().replace(/[^A-Z0-9]+/g, '_')).toUpperCase();
  const ourStyles = meta.styles.map((s) => q(s.name)).join(', ');
  const isOurs = (t) => `(upper(${t}.theme_internal_name) = ${q(internalName)} or lower(${t}.static_id) = ${q(staticId)})`;
  const switchHint = 'Shared Components > Themes > Switch Theme';

  function themeStyleCssUrls(style) {
    const urls = [];
    if (style.base) urls.push(`#THEME_FILES#css/${style.base}#MIN#.css?v=#APEX_VERSION#`);
    for (const u of style.extraCss || []) urls.push(u);
    urls.push(`#THEME_DB_FILES#${prefix}-${style.id}#MIN#.css?v=${meta.version}`);
    return urls.join('\n');
  }

  function themeFileBlock(f) {
    return `prompt ... ${f.rel}
declare
  l_id number;
begin
wwv_flow_imp.g_varchar2_table := wwv_flow_imp.empty_varchar2_table;
${hexTable(f.abs)}
select max(theme_file_id) into l_id
  from apex_application_theme_files
 where application_id = wwv_flow_application_install.get_application_id
   and theme_number = ${n}
   and file_name = ${q(f.rel)};
wwv_flow_imp_shared.create_theme_file(
  p_id           => l_id,
  p_theme_id     => ${n},
  p_file_name    => ${q(f.rel)},
  p_mime_type    => ${q(mimeOf(f.rel))},
  p_file_charset => ${charsetOf(f.rel)},
  p_file_content => wwv_flow_imp.varchar2_to_blob(wwv_flow_imp.g_varchar2_table));
end;
/
`;
  }

  // Parameter- und App-Prüfung (gemeinsam für Installer und Deinstaller)
  const appCheck = (usage) => `  if '&APP_ID.' is null then
    raise_application_error(-20000, 'Bitte die Application ID als ersten Parameter angeben, z. B.: ${usage}');
  end if;
  l_app_id := to_number('&APP_ID.');
  begin
    select workspace_id, owner into l_ws, l_owner
      from apex_applications
     where application_id = l_app_id;
  exception
    when no_data_found then
      raise_application_error(-20000, 'Application ' || l_app_id || ' nicht gefunden (oder das Schema gehört nicht zu ihrem Workspace).');
  end;`;

  const importBegin = `  apex_application_install.set_workspace_id(l_ws);
  apex_application_install.set_application_id(l_app_id);
  apex_application_install.set_offset(0);
  apex_application_install.set_schema(l_owner);
  wwv_flow_imp.component_begin(
    p_version_yyyy_mm_dd     => '2024.11.30',
    p_release                => '24.2.0',
    p_default_workspace_id   => l_ws,
    p_default_application_id => l_app_id,
    p_default_id_offset      => 0,
    p_default_owner          => l_owner);`;

  const install = `${header('Installation als eigenständiges Theme')}--
-- Aufruf:
--   @${prefix}-theme-install.sql <APP_ID> [<STYLE>]
--
--   <APP_ID>  Application ID der Ziel-App (mit Universal Theme 42, UT 24.2 oder 26.1)
--   <STYLE>   optional: ${styleIds.join(' | ')} – aktueller Style des Themes ${name}.
--             Ohne Angabe bleibt ein bereits gewählter ${name}-Style erhalten,
--             sonst wird ${defaultStyle} gesetzt.
--
-- Was passiert:
--   1. Theme ${n} "${name}" wird angelegt bzw. aktualisiert. Es abonniert denselben
--      Universal-Theme-Master wie das Theme 42 der App (gleiche Templates und
--      Template-IDs) und übernimmt dessen Einstellungen und Standard-Templates.
--   2. CSS und Schriften werden als Theme-Dateien abgelegt (#THEME_DB_FILES#).
--   3. Die Styles ${meta.styles.map((s) => s.name).join(', ')} werden am Theme ${n} angelegt.
--   Die App selbst bleibt unverändert. Umschalten nur im App Builder, in drei Schritten:
--   a) App exportieren (Backup)
--   b) Shared Components > Themes > ${name} > Theme Subscription > Unsubscribe
--      (APEX hängt dabei alle Template-Bezüge der App auf die Kopien in Theme ${n} um)
--   c) ${switchHint} (Universal Theme -> ${name})
--   Achtung (APEX 26.1): Switch Theme setzt die Grid-Einstellungen (Column Span,
--   Start New Column) aller Regionen und Items zurück, und der Rückweg zum Universal
--   Theme per Switch Theme scheitert. Zurück geht es nur über das Backup aus a).
--   Details und Screenshots: docs/THEME-VARIANTE.md
--
-- Voraussetzung: APEX 26.1 oder neuer. Mehrfaches Ausführen ist erlaubt (Update);
-- IDs bleiben erhalten, auch wenn ${name} bereits das aktuelle Theme der App ist.
-- Ist das Theme bereits entkoppelt (Unsubscribe oder Theme-Import), werden nur
-- Theme-Dateien und Styles aktualisiert; Templates und Einstellungen bleiben unberührt.
--------------------------------------------------------------------------------
prompt === ${name} ${meta.version}: Installation als Theme ${n} ===
${paramBlock}
prompt ... Ziel-App prüfen, Theme ${n} anlegen bzw. aktualisieren
declare
  c_theme   constant number := ${n};
  c_ut      constant number := ${UT};
  l_app_id  number;
  l_ws      number;
  l_owner   varchar2(128);
  l_release varchar2(30);
  l_src     apex_application_themes%rowtype;  -- Quelle der Einstellungen (Theme 42)
  l_own     apex_application_themes%rowtype;  -- vorhandenes ${name}-Theme (Update)
  l_style   number;
  l_error   number;
  l_login   number;
  l_printer number;

  -- Template-Name (aus apex_application_themes) -> ID. Die Views listen die Templates
  -- des abonnierten Masters unter dessen Nummer (42), einmal je abonnierendem Theme.
  function tpl(p_type varchar2, p_name varchar2) return number is
    l_id number;
  begin
    if p_name is null then
      return null;
    end if;
    select max(template_id) into l_id
      from apex_application_templates
     where application_id = l_app_id
       and theme_number = c_ut
       and template_type = p_type
       and template_name = p_name;
    if l_id is null then
      dbms_output.put_line('Hinweis: Standard-Template "' || p_name || '" (' || p_type || ') nicht gefunden, bleibt leer.');
    end if;
    return l_id;
  end tpl;

  -- Fehler-, Login- und Druckseiten-Template zeigt keine View. Quelle ist der
  -- create_theme-Aufruf im Export der App. Übernommen werden nur Seiten-Templates
  -- des Masters (Roh-IDs; app-eigene Templates stehen dort als wwv_flow_imp.id(...)).
  procedure page_defaults_from_export(p_theme_number number) is
    l_files apex_t_export_files;
    l_found boolean := false;
    procedure scan(p_text clob) is
      l_pos  integer := 1;
      l_end  integer;
      l_call varchar2(32767);
      function page_tpl(p_param varchar2) return number is
        l_id number;
      begin
        l_id := to_number(regexp_substr(l_call, ',' || p_param || '=>(\\d+)\\s', 1, 1, null, 1));
        select max(template_id) into l_id
          from apex_application_templates
         where application_id = l_app_id and template_type = 'Page' and template_id = l_id;
        return l_id;
      end page_tpl;
    begin
      loop
        l_pos := dbms_lob.instr(p_text, 'wwv_flow_imp_shared.create_theme(', l_pos);
        exit when nvl(l_pos, 0) = 0;
        l_end := dbms_lob.instr(p_text, chr(10) || ');', l_pos);
        exit when nvl(l_end, 0) = 0;
        l_call := dbms_lob.substr(p_text, least(l_end - l_pos, 16000), l_pos);
        if regexp_like(l_call, ',p_theme_id=>' || p_theme_number || '\\s') then
          l_error   := page_tpl('p_error_template');
          l_login   := page_tpl('p_login_template');
          l_printer := page_tpl('p_printer_friendly_template');
          l_found   := true;
          return;
        end if;
        l_pos := l_end;
      end loop;
    end scan;
  begin
    apex_util.set_security_group_id(l_ws);
    l_files := apex_export.get_application(p_application_id => l_app_id, p_split => true, p_with_supporting_objects => 'N');
    -- ein Theme: .../user_interface/themes.sql, mehrere: .../user_interface/themes/theme_<Nr>.sql
    for i in 1 .. l_files.count loop
      if l_files(i).name like '%/user_interface/theme%' then
        scan(l_files(i).contents);
      end if;
      exit when l_found;
    end loop;
  exception
    when others then
      dbms_output.put_line('Hinweis: App-Export nicht lesbar (' || sqlerrm || ').');
  end page_defaults_from_export;
begin
${appCheck(`@${prefix}-theme-install.sql 100 ${defaultStyle}`)}
  if '&ACTIVATE.' is not null and upper('&ACTIVATE.') not in (${styleIds.map((id) => q(id.toUpperCase())).join(', ')}) then
    raise_application_error(-20002, 'Unbekannter Style "&ACTIVATE." – erlaubt: ${styleIds.join(', ')}');
  end if;

  -- zentrale UT-Templates (Abonnement des Masters) gibt es erst ab APEX 26.1
  select version_no into l_release from apex_release;
  if to_number(regexp_substr(l_release, '^\\d+')) * 100
     + to_number(regexp_substr(l_release, '^\\d+\\.(\\d+)', 1, 1, null, 1)) < 2601 then
    raise_application_error(-20005, 'Die Theme-Variante erfordert APEX 26.1 oder neuer (installiert: ' || l_release || '). Alternative: ${prefix}-install.sql (Theme Styles).');
  end if;

  -- Theme-Nummer und Static ID dürfen nicht von einem fremden Theme belegt sein
  for t in (select theme_number, theme_name, theme_internal_name, static_id
              from apex_application_themes
             where application_id = l_app_id
               and (theme_number = c_theme or lower(static_id) = ${q(staticId)}))
  loop
    if t.theme_number = c_theme and not ${isOurs('t')} then
      raise_application_error(-20003, 'Theme-Nummer ' || c_theme || ' ist in Application ' || l_app_id || ' bereits vom Theme "' || t.theme_name || '" belegt. Bitte in theme.json unter themeVariant.number eine freie Nummer eintragen und neu bauen.');
    elsif t.theme_number <> c_theme then
      raise_application_error(-20004, 'Die Static ID "${staticId}" hat in Application ' || l_app_id || ' bereits Theme ' || t.theme_number || ' ("' || t.theme_name || '").');
    end if;
  end loop;
  begin
    select * into l_own
      from apex_application_themes
     where application_id = l_app_id and theme_number = c_theme;
  exception
    when no_data_found then null;
  end;

  -- Entkoppelte Kopie (App Builder: Unsubscribe oder Theme-Import): Templates, Template
  -- Components und Einstellungen gehören dem Theme selbst. create_theme würde es wieder
  -- an den UT-Master hängen (Templates doppelt) – deshalb nur Dateien und Styles.
  if l_own.theme_id is not null and l_own.reference_id is null then
    dbms_output.put_line('Theme ' || c_theme || ' ist eine entkoppelte Kopie (Unsubscribe/Import): '
      || 'nur Theme-Dateien und Styles werden aktualisiert, Templates und Einstellungen bleiben.');
${importBegin.replace(/^ {2}/gm, '    ')}
    return;
  end if;

  -- Quelle: das Universal Theme der App. Wurde es nach dem Umschalten schon entfernt,
  -- bleiben die Einstellungen des vorhandenen ${name}-Themes stehen.
  begin
    select * into l_src
      from apex_application_themes
     where application_id = l_app_id and theme_number = c_ut;
  exception
    when no_data_found then
      if l_own.theme_id is null then
        raise_application_error(-20001, 'Application ' || l_app_id || ' verwendet kein Universal Theme (Theme 42).');
      end if;
      l_src := l_own;
      dbms_output.put_line('Hinweis: kein Theme 42 in der App – Einstellungen des vorhandenen Themes ${name} bleiben.');
  end;
  if l_src.reference_id is null then
    raise_application_error(-20001, 'Theme ' || l_src.theme_number || ' der Application ' || l_app_id || ' abonniert keinen Universal-Theme-Master (reference_id leer).');
  end if;

  -- create_theme setzt den aktuellen Style zurück – beim Update den bisherigen mitgeben
  if l_own.theme_id is not null then
    select max(theme_style_id) into l_style
      from apex_application_theme_styles
     where application_id = l_app_id and theme_number = c_theme and is_current = 'Yes';
  end if;

  page_defaults_from_export(l_src.theme_number);
  if l_login is null then
    -- Rückfall: Seiten-Template der Klasse "Login" (im UT zugleich die Fehlerseite)
    select max(template_id) into l_login
      from apex_application_temp_page
     where application_id = l_app_id and theme_number = c_ut and theme_class = 'Login';
    dbms_output.put_line('Hinweis: Login-/Fehlerseiten-Template über die Template-Klasse "Login" bestimmt.');
  end if;
  l_error   := nvl(l_error, l_login);
  l_printer := nvl(l_printer, tpl('Page', l_src.default_page_template));

${importBegin}
  wwv_flow_imp_shared.create_theme(
    p_id                        => l_own.theme_id,  -- leer: neu anlegen
    p_theme_id                  => c_theme,
    p_theme_name                => ${sqlText(name)},
    p_static_id                 => ${q(staticId)},
    p_theme_internal_name       => ${q(internalName)},
    p_theme_description         => ${sqlText(`${meta.name} ${meta.version}: ${meta.description || ''}`.trim())},
    p_version_identifier        => l_src.version,
    p_reference_id              => l_src.reference_id,  -- derselbe UT-Master wie die App
    p_navigation_type           => l_src.navigation_type_code,
    p_nav_bar_type              => l_src.nav_bar_type_code,
    p_default_nav_list_position => l_src.default_nav_list_position,
    p_is_locked                 => false,
    p_current_theme_style_id    => l_style,
${THEME_DEFAULTS.map(([param, type, col]) => `    ${param.padEnd(27)} => tpl(${q(type)}, l_src.${col}),`).join('\n')}
    p_error_template            => l_error,
    p_login_template            => l_login,
    p_printer_friendly_template => l_printer,
    p_icon_library              => l_src.icon_library,
    p_custom_icon_classes       => l_src.custom_icon_classes,
    p_custom_icon_prefix_class  => l_src.custom_icon_prefix_class,
    p_custom_library_file_urls  => l_src.custom_library_file_urls,
    p_javascript_file_urls      => l_src.javascript_file_urls,
    p_css_file_urls             => l_src.css_file_urls,
    p_file_prefix               => l_src.file_prefix,  -- #THEME_FILES# = Dateien des UT
    -- Theme-Dateien werden mit Cache-Control "immutable" ausgeliefert; files_version
    -- steht im Pfad (#THEME_DB_FILES# = .../files/theme/<Nr>/v<files_version>/) und
    -- wird bei jedem Update erhöht, damit Browser die neuen Dateien laden.
    p_files_version             => case when l_own.theme_id is null then nvl(l_src.files_version, 1)
                                        else nvl(l_own.files_version, 0) + 1 end);
  dbms_output.put_line(case when l_own.theme_id is null then 'Theme angelegt: ' else 'Theme aktualisiert: ' end
    || ${sqlText(name)} || ' (' || c_theme || '), UT-Master ' || l_src.reference_id || ' (UT ' || l_src.version || ')');
end;
/
prompt ... Theme-Dateien (${files.length}) nach #THEME_DB_FILES#
${files.map(themeFileBlock).join('')}
prompt ... Theme Styles
declare
  procedure upsert_style(p_name varchar2, p_static_id varchar2, p_css varchar2) is
    l_id number;
  begin
    select max(theme_style_id) into l_id
      from apex_application_theme_styles
     where application_id = wwv_flow_application_install.get_application_id
       and theme_number = ${n}
       and name = p_name;
    -- p_is_current => false lässt einen bereits aktuellen Style aktuell
    wwv_flow_imp_shared.create_theme_style(
      p_id                     => l_id,
      p_theme_id               => ${n},
      p_name                   => p_name,
      p_static_id              => p_static_id,
      p_css_file_urls          => p_css,
      p_is_current             => false,
      p_is_public              => true,
      p_is_accessible          => false,
      p_theme_roller_read_only => true);
  end upsert_style;
begin
${meta.styles
  .map(
    (s) => `  upsert_style(
    p_name      => ${q(s.name)},
    p_static_id => ${q(s.staticId || `${prefix}-${s.id}`)},
    p_css       => ${themeStyleCssUrls(s)
      .split('\n')
      .map(q)
      .join(' || chr(10) || ')});`,
  )
  .join('\n')}
end;
/
begin
  wwv_flow_imp.component_end(p_auto_install_sup_obj => false, p_is_component_import => true);
  commit;
end;
/

prompt ... aktuellen Style des Themes setzen
declare
  l_app_id   number := wwv_flow_application_install.get_application_id;
  l_current  varchar2(255);
  l_name     varchar2(255);
  l_style_id number;
  l_page_id  number;
  l_owner    varchar2(128);
begin
  select current_theme_style into l_current
    from apex_application_themes
   where application_id = l_app_id and theme_number = ${n};
  if '&ACTIVATE.' is null and l_current in (${ourStyles}) then
    dbms_output.put_line('Aktueller Style bleibt: ' || l_current);
    return;
  end if;
  l_name := case upper(nvl('&ACTIVATE.', ${q(defaultStyle)}))
${meta.styles.map((s) => `      when ${q(s.id.toUpperCase())} then ${q(s.name)}`).join('\n')}
    end;
  select theme_style_id into l_style_id
    from apex_application_theme_styles
   where application_id = l_app_id and theme_number = ${n} and name = l_name;
  select min(page_id) into l_page_id
    from apex_application_pages
   where application_id = l_app_id and page_id > 0;
  select owner into l_owner from apex_applications where application_id = l_app_id;
  apex_session.create_session(p_app_id => l_app_id, p_page_id => l_page_id, p_username => l_owner);
  apex_theme.set_current_style(p_application_id => l_app_id, p_theme_number => ${n}, p_id => to_char(l_style_id));
  apex_session.delete_session;
  commit;
  dbms_output.put_line('Aktueller Style des Themes: ' || l_name);
end;
/

set heading on pagesize 50 linesize 200
column theme_name format a20
column current_theme_style format a24
column version format a8
column is_current format a10
column reference_id format 99999999999999999999
column name format a24
column file_name format a60
prompt
prompt Themes der App:
select theme_number, theme_name, is_current, current_theme_style, version, reference_id
  from apex_application_themes
 where application_id = wwv_flow_application_install.get_application_id
 order by theme_number;
prompt Styles und Dateien des Themes ${name}:
select name, is_current
  from apex_application_theme_styles
 where application_id = wwv_flow_application_install.get_application_id
   and theme_number = ${n}
   and name in (${ourStyles})
 order by name;
select file_name, dbms_lob.getlength(file_content) bytes
  from apex_application_theme_files
 where application_id = wwv_flow_application_install.get_application_id
   and theme_number = ${n}
 order by file_name;

prompt ... Abgleich mit dem Universal Theme
declare
  l_app_id number := wwv_flow_application_install.get_application_id;
  l_ut     apex_application_themes%rowtype;
  l_pp     apex_application_themes%rowtype;
  l_diff   pls_integer := 0;
  procedure cmp(p_what varchar2, p_ut varchar2, p_pp varchar2) is
  begin
    if nvl(p_ut, '-') <> nvl(p_pp, '-') then
      l_diff := l_diff + 1;
      dbms_output.put_line('  abweichend: ' || p_what || ' – UT: ' || nvl(p_ut, '-') || ', ${name}: ' || nvl(p_pp, '-'));
    end if;
  end cmp;
begin
  select * into l_pp from apex_application_themes where application_id = l_app_id and theme_number = ${n};
  if l_pp.reference_id is null then
    dbms_output.put_line('(entkoppelte Kopie mit eigenen Templates – Abgleich mit dem Universal Theme entfällt)');
    return;
  end if;
  select * into l_ut from apex_application_themes where application_id = l_app_id and theme_number = ${UT};
  cmp('reference_id', l_ut.reference_id, l_pp.reference_id);
  cmp('file_prefix', l_ut.file_prefix, l_pp.file_prefix);
${THEME_DEFAULTS.map(([, , col]) => `  cmp(${q(col)}, l_ut.${col}, l_pp.${col});`).join('\n')}
  dbms_output.put_line(case when l_diff = 0
    then 'Master, Dateipfad und Standard-Templates wie im Universal Theme.'
    else l_diff || ' Abweichung(en) zum Universal Theme (siehe oben).' end);
exception
  when no_data_found then
    dbms_output.put_line('(kein Theme 42 in der App – Abgleich entfällt)');
end;
/
declare
  l_current varchar2(3);
  l_ref     number;
begin
  select is_current, reference_id into l_current, l_ref
    from apex_application_themes
   where application_id = wwv_flow_application_install.get_application_id and theme_number = ${n};
  if l_current = 'Yes' then
    dbms_output.put_line('${name} ist das aktuelle Theme der App – Änderungen sind sofort sichtbar.');
  else
    dbms_output.put_line('Nächste Schritte (nur im App Builder möglich, Anleitung: docs/THEME-VARIANTE.md):');
    if l_ref is not null then
      dbms_output.put_line('  1. App exportieren (Backup) – der Rückweg zum Universal Theme geht nur über dieses Backup.');
      dbms_output.put_line('  2. Shared Components > Themes > ${name} > Theme Subscription > Unsubscribe');
      dbms_output.put_line('  3. ${switchHint}: Universal Theme (${UT}) -> ${name} (${n})');
    else
      dbms_output.put_line('  ${switchHint}: Universal Theme (${UT}) -> ${name} (${n})');
      dbms_output.put_line('  (Theme ${n} ist bereits entkoppelt; der Rückweg geht nur über ein Backup von vor dem Unsubscribe.)');
    end if;
    dbms_output.put_line('Achtung (APEX 26.1): Switch Theme setzt Column Span und Start New Column aller Regionen und Items zurück.');
  end if;
end;
/
prompt === fertig ===
-- Positionsparameter aufräumen: sonst sähe ein folgendes Skript derselben Sitzung (z. B. das Style-Pack) noch &1/&2
undefine 1 2
set define on verify on feedback on
`;
  const installFile = path.join(installDir, `${prefix}-theme-install.sql`);
  fs.writeFileSync(installFile, install);
  console.log(`SQL  ${path.relative(ROOT, installFile)}  ${(install.length / 1024).toFixed(0)} KB`);

  const uninstall = `${header('Deinstallation der Theme-Variante')}--
-- Aufruf:
--   @${prefix}-theme-uninstall.sql <APP_ID>
--
-- Entfernt das Theme ${n} "${name}" samt Theme-Dateien und Styles
-- (wwv_flow_imp_shared.delete_theme). Das Universal Theme der App bleibt unberührt.
-- Ist ${name} das aktuelle Theme der App (-20006) oder wurde es entkoppelt und die App
-- verwendet seine Template-Kopien (-20007, nach "Unsubscribe"), bricht das Skript ab:
-- vorher die App aus dem Backup (Export vor dem Unsubscribe) wiederherstellen. Der
-- Rückweg per Switch Theme (${name} -> Universal Theme) scheitert in APEX 26.1 an den
-- Template Components.
-- Auch eigene Styles am Theme ${n} (z. B. aus dem Theme Roller) werden entfernt.
--------------------------------------------------------------------------------
prompt === ${name} ${meta.version}: Deinstallation des Themes ${n} ===
${paramBlock}
prompt ... Theme ${n} entfernen
declare
  c_theme  constant number := ${n};
  l_app_id number;
  l_ws     number;
  l_owner  varchar2(128);
  l_theme  apex_application_themes%rowtype;
  l_refs   number;
begin
${appCheck(`@${prefix}-theme-uninstall.sql 100`)}
  begin
    select * into l_theme
      from apex_application_themes
     where application_id = l_app_id and theme_number = c_theme;
  exception
    when no_data_found then
      dbms_output.put_line('Theme ' || c_theme || ' ist in Application ' || l_app_id || ' nicht vorhanden – nichts zu tun.');
      return;
  end;
  if not ${isOurs('l_theme')} then
    raise_application_error(-20003, 'Theme ' || c_theme || ' ("' || l_theme.theme_name || '") in Application ' || l_app_id || ' ist nicht ${name} – es wird nicht entfernt.');
  end if;
  if l_theme.is_current = 'Yes' then
    raise_application_error(-20006, '${name} ist das aktuelle Theme von Application ' || l_app_id || '. Bitte zuerst die App aus dem Backup (Export vor dem Unsubscribe) wiederherstellen, dann erneut ausführen.');
  end if;
  -- Nach "Unsubscribe" zeigen die Komponenten der App auf die Template-Kopien dieses
  -- Themes (auch solange das Universal Theme aktuell ist) – delete_theme scheitert dann.
  if l_theme.reference_id is null then
    select count(*) into l_refs
      from (select to_char(template_id) id from apex_application_page_regions where application_id = l_app_id
            union all select to_char(report_template_id) from apex_application_page_regions where application_id = l_app_id
            union all select to_char(list_template_override_id) from apex_application_page_regions where application_id = l_app_id
            union all select to_char(breadcrumb_template_id) from apex_application_page_regions where application_id = l_app_id
            union all select to_char(button_template_id) from apex_application_page_buttons where application_id = l_app_id
            union all select to_char(item_label_template_id) from apex_application_page_items where application_id = l_app_id
            union all select to_char(navigation_list_template_id) from apex_application_pages where application_id = l_app_id
            union all select to_char(navigation_list_template_id) from apex_applications where application_id = l_app_id
            union all select to_char(nav_bar_list_template_id) from apex_applications where application_id = l_app_id) r
     where r.id in (select to_char(template_id) from apex_application_templates
                     where application_id = l_app_id and theme_number = c_theme);
    if l_refs > 0 then
      raise_application_error(-20007, 'Theme ' || c_theme || ' ist entkoppelt (Unsubscribe/Import) und wird von ' || l_refs
        || ' Komponenten der App verwendet. Entfernen erst nach Wiederherstellung des Backups (Export vor dem Unsubscribe).');
    end if;
  end if;
  for s in (select name
              from apex_application_theme_styles
             where application_id = l_app_id and theme_number = c_theme
               and is_subscribed = 'No' and name not in (${ourStyles}))
  loop
    dbms_output.put_line('Hinweis: auch der eigene Style "' || s.name || '" wird entfernt.');
  end loop;
${importBegin}
  wwv_flow_imp_shared.delete_theme(p_flow_id => l_app_id, p_theme_id => c_theme);
  wwv_flow_imp.component_end(p_auto_install_sup_obj => false, p_is_component_import => true);
  commit;
  dbms_output.put_line('Theme ' || c_theme || ' "' || l_theme.theme_name || '" entfernt (mit Theme-Dateien und Styles).');
end;
/
set heading on pagesize 50 linesize 200
column theme_name format a20
column is_current format a10
prompt
prompt Themes der App:
select theme_number, theme_name, is_current
  from apex_application_themes
 where application_id = to_number('&APP_ID.')
 order by theme_number;
prompt === fertig ===
-- Positionsparameter aufräumen: sonst sähe ein folgendes Skript derselben Sitzung (z. B. das Style-Pack) noch &1/&2
undefine 1 2
set define on verify on feedback on
`;
  const uninstallFile = path.join(installDir, `${prefix}-theme-uninstall.sql`);
  fs.writeFileSync(uninstallFile, uninstall);
  console.log(`SQL  ${path.relative(ROOT, uninstallFile)}`);
}

if (meta.themeVariant) buildThemeVariant(meta.themeVariant);

if (flags.has('--pack')) buildStylePack();
