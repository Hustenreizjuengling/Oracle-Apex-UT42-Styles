-- Installiert eine Universal Theme Reference App als Testbett.
-- Aufruf (SQLcl, als Workspace-Schema):
--   @_tools/sql/install-testbed-app.sql <exportdatei> <app_id> <alias> <workspace> <schema> <supporting_objects Y/N/AUTO>
-- Beispiel:
--   @_tools/sql/install-testbed-app.sql _tmp/testbed/ut-26.1.sql 9042 UT-LAB HR_DEV HR AUTO
--   @_tools/sql/install-testbed-app.sql _tmp/testbed/ut-24.2.sql 9242 UT-LAB-242 HR_DEV HR N
-- Supporting Objects = Tabellen EBA_UT_* samt Beispieldaten im Schema:
--   Y     anlegen (bricht ab, wenn schon eine der Tabellen existiert)
--   N     nicht anlegen
--   AUTO  anlegen, wenn keine der Tabellen existiert, sonst nicht (die App nutzt dann die vorhandenen,
--         z. B. die der Showcase-App 9000); bricht ab, wenn nur ein Teil der Tabellen existiert
-- Die Exportdateien lädt  node _tools/setup-testbed.mjs  herunter.
set define on verify off feedback off serveroutput on
whenever sqlerror exit failure rollback

declare
  l_tables pls_integer;
  l_mode   varchar2(10) := upper(trim('&6'));
begin
  if l_mode not in ('Y', 'N', 'AUTO') then
    raise_application_error(-20002, 'Parameter 6 muss Y, N oder AUTO sein (ist: "&6").');
  end if;
  select count(*) into l_tables from all_tables
   where owner = upper('&5')
     and table_name in ('EBA_UT_CHART_PROJECTS', 'EBA_UT_CHART_TASKS', 'EBA_UT_DEMO_CARDS', 'EBA_UT_MAP_AIRPORTS');
  if l_mode = 'Y' and l_tables > 0 then
    raise_application_error(-20003, l_tables || ' der 4 Tabellen EBA_UT_* existieren schon in &5 – '
      || 'mit N oder AUTO installieren (die App nutzt dann die vorhandenen Tabellen).');
  end if;
  if l_mode = 'AUTO' and l_tables not in (0, 4) then
    raise_application_error(-20004, 'Nur ' || l_tables || ' der 4 Tabellen EBA_UT_* existieren in &5 – '
      || 'bitte prüfen (fehlende anlegen oder alle löschen) und erneut aufrufen.');
  end if;
  dbms_output.put_line('Tabellen EBA_UT_* vorhanden: ' || l_tables || ' von 4');
end;
/
column tb_supobj new_value TB_SUPOBJ noprint
select case
         when upper(trim('&6')) = 'AUTO' then
           case when (select count(*) from all_tables
                       where owner = upper('&5')
                         and table_name in ('EBA_UT_CHART_PROJECTS', 'EBA_UT_CHART_TASKS', 'EBA_UT_DEMO_CARDS', 'EBA_UT_MAP_AIRPORTS')) = 4
                then 'N' else 'Y' end
         else upper(trim('&6'))
       end tb_supobj
  from dual;
prompt Supporting Objects installieren: &TB_SUPOBJ.

begin
  apex_application_install.set_workspace('&4');
  apex_application_install.set_application_id(&2);
  apex_application_install.generate_offset;
  apex_application_install.set_schema('&5');
  apex_application_install.set_application_alias('&3');
  apex_application_install.set_application_name('UT Lab &2 (Theme Test Bed)');
  apex_application_install.set_auto_install_sup_obj(p_auto_install_sup_obj => '&TB_SUPOBJ.' = 'Y');
end;
/
@&1
select application_id, application_name, alias, pages from apex_applications where application_id = &2;
