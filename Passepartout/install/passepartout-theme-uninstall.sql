--------------------------------------------------------------------------------
-- Passepartout 1.0.0 – Deinstallation der Theme-Variante
-- Rahmen und Leinwand: Kopf und Navigation als ein ruhiges Passepartout, der Inhalt auf einer eingesetzten Arbeitsfläche. Ein Akzent: Kartenmagenta. Schrift: Instrument Sans (variabel, Gewicht 400–700 und Breite 75–100 %). Vertrag für Komponenten: docs/ARCHITECTURE.md.
--
-- Erzeugt von _tools/build.mjs – nicht von Hand bearbeiten.
-- Ausführen als Parsing-Schema der Ziel-App (oder mit APEX_ADMINISTRATOR_ROLE)
-- in SQLcl, SQL*Plus oder SQL Developer (Skript ausführen, F5).
--------------------------------------------------------------------------------
--
-- Aufruf:
--   @passepartout-theme-uninstall.sql <APP_ID>
--
-- Entfernt das Theme 142 "Passepartout" samt Theme-Dateien und Styles
-- (wwv_flow_imp_shared.delete_theme). Das Universal Theme der App bleibt unberührt.
-- Ist Passepartout das aktuelle Theme der App (-20006) oder wurde es entkoppelt und die App
-- verwendet seine Template-Kopien (-20007, nach "Unsubscribe"), bricht das Skript ab:
-- vorher die App aus dem Backup (Export vor dem Unsubscribe) wiederherstellen. Der
-- Rückweg per Switch Theme (Passepartout -> Universal Theme) scheitert in APEX 26.1 an den
-- Template Components.
-- Auch eigene Styles am Theme 142 (z. B. aus dem Theme Roller) werden entfernt.
--------------------------------------------------------------------------------
prompt === Passepartout 1.0.0: Deinstallation des Themes 142 ===
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

prompt ... Theme 142 entfernen
declare
  c_theme  constant number := 142;
  l_app_id number;
  l_ws     number;
  l_owner  varchar2(128);
  l_theme  apex_application_themes%rowtype;
  l_refs   number;
begin
  if '&APP_ID.' is null then
    raise_application_error(-20000, 'Bitte die Application ID als ersten Parameter angeben, z. B.: @passepartout-theme-uninstall.sql 100');
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
  begin
    select * into l_theme
      from apex_application_themes
     where application_id = l_app_id and theme_number = c_theme;
  exception
    when no_data_found then
      dbms_output.put_line('Theme ' || c_theme || ' ist in Application ' || l_app_id || ' nicht vorhanden – nichts zu tun.');
      return;
  end;
  if not (upper(l_theme.theme_internal_name) = 'PASSEPARTOUT' or lower(l_theme.static_id) = 'passepartout') then
    raise_application_error(-20003, 'Theme ' || c_theme || ' ("' || l_theme.theme_name || '") in Application ' || l_app_id || ' ist nicht Passepartout – es wird nicht entfernt.');
  end if;
  if l_theme.is_current = 'Yes' then
    raise_application_error(-20006, 'Passepartout ist das aktuelle Theme von Application ' || l_app_id || '. Bitte zuerst die App aus dem Backup (Export vor dem Unsubscribe) wiederherstellen, dann erneut ausführen.');
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
               and is_subscribed = 'No' and name not in ('Passepartout Light', 'Passepartout Dark', 'Passepartout Auto'))
  loop
    dbms_output.put_line('Hinweis: auch der eigene Style "' || s.name || '" wird entfernt.');
  end loop;
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
