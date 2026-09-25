-- Installiert die Universal Theme Reference App als "Theme Showcase" – eine App, in der sich
-- alle Styles des Style-Packs über das Kopfmenü "Theme Style" durchprobieren lassen.
--
-- Aufruf (SQLcl, verbunden als Parsing-Schema, aus der Projektwurzel):
--   @_tools/sql/install-showcase-app.sql <exportdatei> <app_id> <alias> "<name>" <workspace> <schema> <Y|N|AUTO>
-- Beispiel:
--   @_tools/sql/install-showcase-app.sql _tmp/testbed/ut-26.1.sql 9000 THEME-SHOWCASE "Theme Showcase" HR_DEV HR AUTO
-- Danach das Style-Pack einspielen:
--   @style-pack/style-pack-install.sql 9000 passepartout-light
--
-- Parameter 7 (Supporting Objects = Tabellen EBA_UT_* samt Beispieldaten):
--   Y     anlegen – bricht ab, wenn schon eine der Tabellen im Schema existiert
--   N     nicht anlegen (die Tabellen müssen schon da sein, sonst fehlen Daten auf einigen Seiten)
--   AUTO  anlegen, wenn keine der Tabellen existiert; nicht anlegen, wenn alle existieren;
--         bricht ab, wenn nur ein Teil existiert
-- Die Exportdatei lädt  node _tools/setup-testbed.mjs  herunter (_tmp/testbed/ut-26.1.sql).
-- Eine schon vorhandene App mit dieser ID wird NICHT überschrieben – das Skript bricht vorher ab.
set define on verify off feedback off serveroutput on termout on
whenever sqlerror exit failure rollback

define SC_FILE   = "&1"
define SC_APP_ID = "&2"
define SC_ALIAS  = "&3"
define SC_NAME   = "&4"
define SC_WS     = "&5"
define SC_SCHEMA = "&6"
define SC_SUPOBJ = "&7"

column sc_supobj_eff new_value SC_SUPOBJ_EFF noprint
declare
  l_cnt    pls_integer;
  l_tables pls_integer;
  l_mode   varchar2(10) := upper(trim('&SC_SUPOBJ.'));
begin
  if not regexp_like(trim('&SC_APP_ID.'), '^[0-9]+$') then
    raise_application_error(-20000, 'App-ID "&SC_APP_ID." ist keine Zahl.');
  end if;
  select count(*) into l_cnt from apex_applications where application_id = to_number('&SC_APP_ID.');
  if l_cnt > 0 then
    raise_application_error(-20001, 'App &SC_APP_ID. existiert bereits – nichts geändert. '
      || 'Zum Neuinstallieren die App vorher entfernen (apex_application_install.remove_application).');
  end if;
  if l_mode not in ('Y', 'N', 'AUTO') then
    raise_application_error(-20002, 'Parameter 7 muss Y, N oder AUTO sein (ist: "&SC_SUPOBJ.").');
  end if;
  select count(*) into l_tables from all_tables
   where owner = upper('&SC_SCHEMA.')
     and table_name in ('EBA_UT_CHART_PROJECTS', 'EBA_UT_CHART_TASKS', 'EBA_UT_DEMO_CARDS', 'EBA_UT_MAP_AIRPORTS');
  if l_mode = 'Y' and l_tables > 0 then
    raise_application_error(-20003, l_tables || ' der 4 Tabellen EBA_UT_* existieren schon in &SC_SCHEMA. – '
      || 'mit Parameter N oder AUTO installieren (die App nutzt dann die vorhandenen Tabellen).');
  end if;
  if l_mode = 'AUTO' and l_tables not in (0, 4) then
    raise_application_error(-20004, 'Nur ' || l_tables || ' der 4 Tabellen EBA_UT_* existieren in &SC_SCHEMA. – '
      || 'bitte prüfen (fehlende anlegen oder alle löschen) und erneut aufrufen.');
  end if;
  dbms_output.put_line('Tabellen EBA_UT_* vorhanden: ' || l_tables || ' von 4');
end;
/
select case
         when upper(trim('&SC_SUPOBJ.')) = 'AUTO' then
           case when (select count(*) from all_tables
                       where owner = upper('&SC_SCHEMA.')
                         and table_name in ('EBA_UT_CHART_PROJECTS', 'EBA_UT_CHART_TASKS', 'EBA_UT_DEMO_CARDS', 'EBA_UT_MAP_AIRPORTS')) = 4
                then 'N' else 'Y' end
         else upper(trim('&SC_SUPOBJ.'))
       end sc_supobj_eff
  from dual;
prompt Supporting Objects installieren: &SC_SUPOBJ_EFF.

begin
  apex_application_install.set_workspace('&SC_WS.');
  apex_application_install.set_application_id(&SC_APP_ID.);
  apex_application_install.generate_offset;
  apex_application_install.set_schema(upper('&SC_SCHEMA.'));
  apex_application_install.set_application_alias('&SC_ALIAS.');
  apex_application_install.set_application_name('&SC_NAME.');
  apex_application_install.set_auto_install_sup_obj(p_auto_install_sup_obj => '&SC_SUPOBJ_EFF.' = 'Y');
end;
/
@&SC_FILE.

set feedback off verify off pagesize 100 linesize 200 heading on
column application_name format a30
column alias format a20
column owner format a12
select application_id, application_name, alias, owner, pages from apex_applications where application_id = &SC_APP_ID.;
select table_name from all_tables
 where owner = upper('&SC_SCHEMA.') and table_name like 'EBA\_UT%' escape '\' order by 1;
