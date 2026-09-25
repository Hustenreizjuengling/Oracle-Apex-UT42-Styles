--------------------------------------------------------------------------------
-- Style-Pack – Deinstallation aller Theme Styles
-- Passepartout 1.0.0, Veedel 1.0.0, Frequenz 1.0.0, Kracherl 1.0.0, Passer 1.0.0, Orbit 1.0.0
-- (6 Themes, 18 Theme Styles für das Universal Theme 42)
--
-- Erzeugt von _tools/build.mjs --pack – nicht von Hand bearbeiten.
-- Ausführen als Parsing-Schema der Ziel-App (oder mit APEX_ADMINISTRATOR_ROLE)
-- in SQLcl oder SQL*Plus. Der Ordner style-pack/ muss neben den Theme-Ordnern
-- liegen: Die Skripte der Themes werden über relative Pfade (@@../) aufgerufen.
--
-- Aufruf:
--   @style-pack/style-pack-uninstall.sql <APP_ID>
--
-- Ruft nacheinander die Deinstaller aller Themes auf. Jeder schaltet auf "Vita" zurück,
-- falls einer seiner Styles aktiv ist, deaktiviert seine Styles (nicht mehr öffentlich,
-- nur noch Vita-CSS) und löscht seine Dateien unter #APP_FILES#<Präfix>/.
-- APEX bietet keine API zum Löschen von Theme Styles; die deaktivierten Einträge bei Bedarf
-- in Shared Components > Themes > Universal Theme > Theme Styles löschen.
-- "Allow End Users to choose Theme Style" bleibt, wie es ist.
--------------------------------------------------------------------------------
prompt === Style-Pack: Deinstallation (6 Themes) ===
set define on verify off feedback off serveroutput on
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
  if not regexp_like(nvl(trim('&PACK_APP_ID.'), '-'), '^[0-9]+$') then
    raise_application_error(-20000, 'Bitte die Application ID als ersten Parameter angeben, z. B.: @style-pack/style-pack-uninstall.sql 100');
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
  end;
end;
/
prompt
prompt ##### 1/6 Passepartout #####
undefine 1 2 3
@@../Passepartout/install/passepartout-uninstall.sql &PACK_APP_ID.
set define on verify off feedback off serveroutput on
prompt
prompt ##### 2/6 Veedel #####
undefine 1 2 3
@@../Veedel/install/veedel-uninstall.sql &PACK_APP_ID.
set define on verify off feedback off serveroutput on
prompt
prompt ##### 3/6 Frequenz #####
undefine 1 2 3
@@../Frequenz/install/frequenz-uninstall.sql &PACK_APP_ID.
set define on verify off feedback off serveroutput on
prompt
prompt ##### 4/6 Kracherl #####
undefine 1 2 3
@@../Kracherl/install/kracherl-uninstall.sql &PACK_APP_ID.
set define on verify off feedback off serveroutput on
prompt
prompt ##### 5/6 Passer #####
undefine 1 2 3
@@../Passer/install/passer-uninstall.sql &PACK_APP_ID.
set define on verify off feedback off serveroutput on
prompt
prompt ##### 6/6 Orbit #####
undefine 1 2 3
@@../Orbit/install/orbit-uninstall.sql &PACK_APP_ID.
set define on verify off feedback off serveroutput on
set heading on pagesize 100 linesize 200
column theme format a14
column name format a26
column aktiv format a5
column oeffentlich format a11
prompt
prompt Theme Styles der App (Universal Theme 42):
select case
         when name in ('Passepartout Light', 'Passepartout Dark', 'Passepartout Auto') then 'Passepartout'
         when name in ('Veedel Light', 'Veedel Dark', 'Veedel Auto') then 'Veedel'
         when name in ('Frequenz Light', 'Frequenz Dark', 'Frequenz Auto') then 'Frequenz'
         when name in ('Kracherl Light', 'Kracherl Dark', 'Kracherl Auto') then 'Kracherl'
         when name in ('Passer Light', 'Passer Dark', 'Passer Auto') then 'Passer'
         when name in ('Orbit Light', 'Orbit Dark', 'Orbit Auto') then 'Orbit'
         else '(andere)' end theme,
       name,
       case when is_current = 'Yes' then 'ja' end aktiv,
       case when is_public = 'Yes' then 'ja' else 'nein' end oeffentlich
  from apex_application_theme_styles
 where application_id = to_number('&PACK_APP_ID.')
   and theme_number = 42
 order by case name
            when 'Passepartout Light' then 1
            when 'Passepartout Dark' then 2
            when 'Passepartout Auto' then 3
            when 'Veedel Light' then 4
            when 'Veedel Dark' then 5
            when 'Veedel Auto' then 6
            when 'Frequenz Light' then 7
            when 'Frequenz Dark' then 8
            when 'Frequenz Auto' then 9
            when 'Kracherl Light' then 10
            when 'Kracherl Dark' then 11
            when 'Kracherl Auto' then 12
            when 'Passer Light' then 13
            when 'Passer Dark' then 14
            when 'Passer Auto' then 15
            when 'Orbit Light' then 16
            when 'Orbit Dark' then 17
            when 'Orbit Auto' then 18
            else 19 end, name;
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
prompt === Style-Pack: fertig ===
undefine 1 2 3
whenever sqlerror continue none
set define on verify on feedback on
