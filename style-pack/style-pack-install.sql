--------------------------------------------------------------------------------
-- Style-Pack – Installation aller Theme Styles
-- Passepartout 1.0.0, Veedel 1.0.0, Frequenz 1.0.0, Kracherl 1.0.0, Passer 1.0.0
-- (5 Themes, 15 Theme Styles für das Universal Theme 42)
--
-- Erzeugt von _tools/build.mjs --pack – nicht von Hand bearbeiten.
-- Ausführen als Parsing-Schema der Ziel-App (oder mit APEX_ADMINISTRATOR_ROLE)
-- in SQLcl oder SQL*Plus. Der Ordner style-pack/ muss neben den Theme-Ordnern
-- liegen: Die Skripte der Themes werden über relative Pfade (@@../) aufgerufen.
--
-- Aufruf:
--   @style-pack/style-pack-install.sql <APP_ID> [<STYLE>] [user]
--
--   <APP_ID>  Application ID der Ziel-App (Universal Theme 42, UT 24.2 oder 26.1)
--   <STYLE>   optional: diesen Style aktivieren, Schreibweise <Präfix>-<Style>:
--               passepartout-light | passepartout-dark | passepartout-auto
--               veedel-light | veedel-dark | veedel-auto
--               frequenz-light | frequenz-dark | frequenz-auto
--               kracherl-light | kracherl-dark | kracherl-auto
--               passer-light | passer-dark | passer-auto
--             Ohne Angabe oder "-": nichts umschalten (ein aktiver Style bleibt aktiv).
--   user      optional: zusätzlich "Allow End Users to choose Theme Style" einschalten,
--             z. B. @style-pack/style-pack-install.sql 100 passepartout-dark user
--             oder ohne Umschalten: @style-pack/style-pack-install.sql 100 - user
--
-- Ruft nacheinander die Style-Installer aller Themes auf. Nur das Theme des gewählten
-- Styles aktiviert ihn, alle anderen legen ihre Styles nur an. Ein unbekannter Wert
-- bricht vor jeder Änderung ab. Mehrfaches Ausführen ist erlaubt (Update).
--------------------------------------------------------------------------------
prompt === Style-Pack: Installation (5 Themes, 15 Styles) ===
set define on verify off feedback off serveroutput on
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
    return to_number(regexp_substr(p_version, '^\d+')) * 100
         + nvl(to_number(regexp_substr(p_version, '^\d+\.(\d+)', 1, 1, null, 1)), 0);
  end num;
begin
  if l_style is not null and l_style not in ('-', 'n', 'no', 'nein', 'passepartout-light', 'passepartout-dark', 'passepartout-auto', 'veedel-light', 'veedel-dark', 'veedel-auto', 'frequenz-light', 'frequenz-dark', 'frequenz-auto', 'kracherl-light', 'kracherl-dark', 'kracherl-auto', 'passer-light', 'passer-dark', 'passer-auto') then
    raise_application_error(-20002, 'Unbekannter Style "' || l_style || '" – erlaubt: '
      || 'passepartout-light, passepartout-dark, passepartout-auto, veedel-light, veedel-dark, veedel-auto, frequenz-light, frequenz-dark, frequenz-auto, kracherl-light, kracherl-dark, kracherl-auto, passer-light, passer-dark, passer-auto' || ' oder "-" (keinen aktivieren). Es wurde nichts geändert.'
      || ' Hinweis: SQL*Plus/SQLcl behalten Parameter früherer Skriptaufrufe – ggf. "undefine 2 3" oder neue Sitzung.');
  end if;
  if l_user is not null and l_user <> 'user' then
    raise_application_error(-20002, 'Unbekannter dritter Parameter "' || l_user || '" – erlaubt: user. Es wurde nichts geändert.');
  end if;
  select version_no into l_release from apex_release;
  if num(l_release) < 2402 then
    raise_application_error(-20005, 'Das Style-Pack erfordert APEX 24.2 oder neuer (installiert: ' || l_release || ').');
  end if;
  if not regexp_like(nvl(trim('&PACK_APP_ID.'), '-'), '^[0-9]+$') then
    raise_application_error(-20000, 'Bitte die Application ID als ersten Parameter angeben, z. B.: @style-pack/style-pack-install.sql 100 passepartout-dark');
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
  dbms_output.put_line('Ziel: Application ' || l_app_id || ', Universal Theme ' || l_ut || ', APEX ' || l_release);
  if num(l_ut) < 2402 then
    dbms_output.put_line('Hinweis: Die Styles sind für die UT-Dateiversionen 24.2 und 26.1 gebaut und getestet (App: ' || l_ut || ').');
  end if;
end;
/
prompt
prompt ##### 1/5 Passepartout 1.0.0 #####
set termout off
column pack_act new_value PACK_ACT noprint
select case lower(trim('&PACK_STYLE.'))
         when 'passepartout-light' then 'light'
         when 'passepartout-dark' then 'dark'
         when 'passepartout-auto' then 'auto'
         else 'N' end pack_act
  from dual;
set termout on
undefine 1 2 3
@@../Passepartout/install/passepartout-install.sql &PACK_APP_ID. &PACK_ACT.
set define on verify off feedback off serveroutput on
prompt
prompt ##### 2/5 Veedel 1.0.0 #####
set termout off
column pack_act new_value PACK_ACT noprint
select case lower(trim('&PACK_STYLE.'))
         when 'veedel-light' then 'light'
         when 'veedel-dark' then 'dark'
         when 'veedel-auto' then 'auto'
         else 'N' end pack_act
  from dual;
set termout on
undefine 1 2 3
@@../Veedel/install/veedel-install.sql &PACK_APP_ID. &PACK_ACT.
set define on verify off feedback off serveroutput on
prompt
prompt ##### 3/5 Frequenz 1.0.0 #####
set termout off
column pack_act new_value PACK_ACT noprint
select case lower(trim('&PACK_STYLE.'))
         when 'frequenz-light' then 'light'
         when 'frequenz-dark' then 'dark'
         when 'frequenz-auto' then 'auto'
         else 'N' end pack_act
  from dual;
set termout on
undefine 1 2 3
@@../Frequenz/install/frequenz-install.sql &PACK_APP_ID. &PACK_ACT.
set define on verify off feedback off serveroutput on
prompt
prompt ##### 4/5 Kracherl 1.0.0 #####
set termout off
column pack_act new_value PACK_ACT noprint
select case lower(trim('&PACK_STYLE.'))
         when 'kracherl-light' then 'light'
         when 'kracherl-dark' then 'dark'
         when 'kracherl-auto' then 'auto'
         else 'N' end pack_act
  from dual;
set termout on
undefine 1 2 3
@@../Kracherl/install/kracherl-install.sql &PACK_APP_ID. &PACK_ACT.
set define on verify off feedback off serveroutput on
prompt
prompt ##### 5/5 Passer 1.0.0 #####
set termout off
column pack_act new_value PACK_ACT noprint
select case lower(trim('&PACK_STYLE.'))
         when 'passer-light' then 'light'
         when 'passer-dark' then 'dark'
         when 'passer-auto' then 'auto'
         else 'N' end pack_act
  from dual;
set termout on
undefine 1 2 3
@@../Passer/install/passer-install.sql &PACK_APP_ID. &PACK_ACT.
set define on verify off feedback off serveroutput on

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
            else 16 end, name;
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
