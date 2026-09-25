-- Registriert in den Testbett-Apps den Theme Style "Theme Lab" und macht ihn aktiv.
-- Seine CSS-Dateien werden vom Test-Harness (_tools/lib/lab.mjs) abgefangen und
-- live aus dem Theme-Quellordner geliefert. Ohne Harness greift ein leerer Platzhalter,
-- die App sieht dann aus wie "Vita".
--
-- Aufruf (SQLcl):  sql -name hr_freepdb1 @_tools/sql/setup-testbed-lab-style.sql
set serveroutput on feedback off define off

declare
  type t_app is record (app_id number, style_id number, file_id1 number, file_id2 number);
  type t_apps is table of t_app;
  l_apps t_apps := t_apps(
    t_app(9042, 990000000000000002, 990000000000000001, 990000000000000003),
    t_app(9242, 990000000000000012, 990000000000000011, 990000000000000013));
  l_ws    number;
  l_owner varchar2(128);
  l_placeholder blob := utl_raw.cast_to_raw('/* Theme Lab Platzhalter - wird vom Test-Harness ersetzt */');
begin
  for i in 1 .. l_apps.count loop
    select workspace_id, owner into l_ws, l_owner
      from apex_applications where application_id = l_apps(i).app_id;
    apex_application_install.set_workspace_id(l_ws);
    apex_application_install.set_application_id(l_apps(i).app_id);
    apex_application_install.set_offset(0);
    apex_application_install.set_schema(l_owner);

    wwv_flow_imp.component_begin(
      p_version_yyyy_mm_dd     => '2024.11.30',
      p_release                => '24.2.0',
      p_default_workspace_id   => l_ws,
      p_default_application_id => l_apps(i).app_id,
      p_default_id_offset      => 0,
      p_default_owner          => l_owner);

    wwv_flow_imp_shared.create_app_static_file(
      p_id => l_apps(i).file_id1, p_file_name => 'themelab/theme.css',
      p_mime_type => 'text/css', p_file_charset => 'utf-8', p_file_content => l_placeholder);
    wwv_flow_imp_shared.create_app_static_file(
      p_id => l_apps(i).file_id2, p_file_name => 'themelab/theme.min.css',
      p_mime_type => 'text/css', p_file_charset => 'utf-8', p_file_content => l_placeholder);

    wwv_flow_imp_shared.create_theme_style(
      p_id                     => l_apps(i).style_id,
      p_theme_id               => 42,
      p_name                   => 'Theme Lab',
      p_css_file_urls          => '#THEME_FILES#css/Vita#MIN#.css?v=#APEX_VERSION#' || chr(10) ||
                                  '#APP_FILES#themelab/theme#MIN#.css',
      p_is_current             => true,
      p_is_public              => true,
      p_is_accessible          => false,
      p_theme_roller_read_only => true);

    wwv_flow_imp.component_end(p_auto_install_sup_obj => false, p_is_component_import => true);

    -- set_current_style benötigt eine APEX-Session im Kontext der App
    apex_session.create_session(p_app_id => l_apps(i).app_id, p_page_id => 100, p_username => l_owner);
    apex_theme.set_current_style(
      p_application_id => l_apps(i).app_id,
      p_theme_number   => 42,
      p_id             => to_char(l_apps(i).style_id));
    apex_session.delete_session;
    dbms_output.put_line('Theme Lab aktiv in App ' || l_apps(i).app_id);
  end loop;
  commit;
end;
/

select application_id, name, is_current, replace(css_file_urls, chr(10), ' | ') css_file_urls
  from apex_application_theme_styles
 where application_id in (9042, 9242) and name = 'Theme Lab';
select application_id, file_name from apex_application_static_files
 where application_id in (9042, 9242) order by 1, 2;
exit
