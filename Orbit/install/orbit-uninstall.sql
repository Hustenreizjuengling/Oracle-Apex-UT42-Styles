--------------------------------------------------------------------------------
-- Orbit 1.0.0 – Deinstallation
-- Orbit – Theme Styles für das Universal Theme 42 im Stil einer Raumschiff-Konsole: Kopf als dunkles Bedienfeld mit Skala an der Unterkante, Navigation als schmale Instrumentenleiste mit Eis-Kante am aktiven Eintrag, Regionen als Anzeige-Panels mit feiner Haarlinie, Abschnitts-Labels in gesperrten Versalien, Kennzahlen groß und leicht wie Telemetrie, umrandete Tasten und eine gefüllte Hauptaktion, Warnungen als Caution-Kasten in Bernstein. Dark „Konsole“ in tiefem Navy mit Eisblau, Light „Kabine“ in Weiß und Kabinengrau mit graphitgrauem Kopf, Auto folgt dem Betriebssystem. Die Anmeldung zeigt ein Rundinstrument mit gebogener Zeitleiste aus reinem CSS. Schrift: Barlow und Barlow Semi Condensed (OFL).
--
-- Erzeugt von _tools/build.mjs – nicht von Hand bearbeiten.
-- Ausführen als Parsing-Schema der Ziel-App (oder mit APEX_ADMINISTRATOR_ROLE)
-- in SQLcl, SQL*Plus oder SQL Developer (Skript ausführen, F5).
--------------------------------------------------------------------------------
--
-- Aufruf:
--   @orbit-uninstall.sql <APP_ID>
--
-- Was passiert:
--   1. Ist ein Orbit-Style aktiv, wird auf "Vita" zurückgeschaltet.
--   2. Die Orbit-Styles werden deaktiviert (nicht mehr öffentlich, nur noch Vita-CSS).
--   3. Alle statischen Dateien unter #APP_FILES#orbit/ werden gelöscht.
--
-- APEX bietet keine API zum Löschen von Theme Styles. Die deaktivierten Einträge
-- bitte bei Bedarf in Shared Components > Themes > Universal Theme > Theme Styles
-- löschen. Eine erneute Installation reaktiviert sie.
--------------------------------------------------------------------------------
prompt === Orbit 1.0.0: Deinstallation ===
set define on verify off feedback off serveroutput on
whenever sqlerror exit sql.sqlcode rollback

-- optionale Parameter vorbelegen, damit nicht nachgefragt wird
set termout off
column 1 new_value 1 noprint
column 2 new_value 2 noprint
select '' "1", '' "2" from dual where rownum = 0;
set termout on
define APP_ID   = "&1"
define ACTIVATE = "&2"

prompt ... Ziel-App prüfen
declare
  l_app_id number;
  l_ws     number;
  l_owner  varchar2(128);
  l_cnt    pls_integer;
begin
  if '&APP_ID.' is null then
    raise_application_error(-20000, 'Bitte die Application ID als ersten Parameter angeben, z. B.: @orbit-install.sql 100 light');
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
  if l_current in ('Orbit Light', 'Orbit Dark', 'Orbit Auto') then
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
-- legt einen Theme Style an oder ersetzt ihn (Suche über den Namen).
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
  select to_number(regexp_substr(version_no, '^\d+')) into l_major from apex_release;
  if l_major >= 26 then
    execute immediate 'begin wwv_flow_imp_shared.create_theme_style(p_id => :1, p_theme_id => 42, p_name => :2, p_static_id => :3, p_css_file_urls => :4, p_is_current => false, p_is_public => ' || l_pub || ', p_is_accessible => false, p_theme_roller_read_only => true); end;'
      using l_id, p_name, p_static_id, p_css;
  else
    execute immediate 'begin wwv_flow_imp_shared.create_theme_style(p_id => :1, p_theme_id => 42, p_name => :2, p_css_file_urls => :3, p_is_current => false, p_is_public => ' || l_pub || ', p_is_accessible => false, p_theme_roller_read_only => true); end;'
      using l_id, p_name, p_css;
  end if;
end upsert_style;

begin
  select count(*) into l_cnt from apex_application_theme_styles
   where application_id = wwv_flow_application_install.get_application_id and theme_number = 42 and name = 'Orbit Light';
  if l_cnt > 0 then
    upsert_style(p_name => 'Orbit Light', p_static_id => 'orbit-light',
                 p_css => '#THEME_FILES#css/Vita#MIN#.css?v=#APEX_VERSION#', p_public => false);
  end if;
  select count(*) into l_cnt from apex_application_theme_styles
   where application_id = wwv_flow_application_install.get_application_id and theme_number = 42 and name = 'Orbit Dark';
  if l_cnt > 0 then
    upsert_style(p_name => 'Orbit Dark', p_static_id => 'orbit-dark',
                 p_css => '#THEME_FILES#css/Vita#MIN#.css?v=#APEX_VERSION#', p_public => false);
  end if;
  select count(*) into l_cnt from apex_application_theme_styles
   where application_id = wwv_flow_application_install.get_application_id and theme_number = 42 and name = 'Orbit Auto';
  if l_cnt > 0 then
    upsert_style(p_name => 'Orbit Auto', p_static_id => 'orbit-auto',
                 p_css => '#THEME_FILES#css/Vita#MIN#.css?v=#APEX_VERSION#', p_public => false);
  end if;
end;
/
prompt ... statische Dateien entfernen
begin
  for f in (select application_file_id, file_name
              from apex_application_static_files
             where application_id = wwv_flow_application_install.get_application_id
               and file_name like 'orbit/%')
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
