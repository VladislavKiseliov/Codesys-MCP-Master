# Проверка Codesys-MCP-Master на CODESYS SP17

- Дата: 2026-11-03
- CODESYS: V3.5 SP17 Patch 3 (3.5.17.30), ScriptEngine 4.0.0.0
- Сервер: 0.19.1-ru.1 (watcher 0.7.2), режим persistent
- Проект: `E:\Project\codesys-test\full\Full.project`, устройство CODESYS Control Win V3 x64, онлайн-шаги — только в симуляции
- Способ: прямой MCP-клиент (`tests/live-sp17/mcp.mjs`), шаги скилла `codesys-sp17-check`

## Итог

**73 из 132 инструментов проверены вживую, 125 вызовов: OK 122, FAIL 1, EXPECTED-FAIL 2.**

- Кириллица (UTF-8-исправление) работает везде: комментарии, `WSTRING` в коде и **в онлайне** (запись и чтение `"Мир"`), `edit_text_lines`, поиск ссылок, путь `Кириллица\Full_копия.project`, зеркало `.st`, PLCopenXML, русские сообщения компилятора.
- Онлайн-команды после правки `_needs_script_context` работают: вход, старт/стоп, чтение/запись/мониторинг/форсирование, проверка online change.
- Сломано на SP17: только `download_to_device` в симуляции без `skipReachabilityCheck` (см. ниже).
- Только SP21+: `create_persistent_vars`, `download_missing_libraries`.

## Найдено

1. **`download_to_device` в симуляции.** Предварительная проверка ищет шлюз устройства, а у симулятора его нет. Сервер отвечает ошибкой с подсказкой «Pass skipReachabilityCheck=true to bypass»; с этим параметром загрузка проходит. На реальном ПЛК не проверялось.
2. **`compile_project` проверяет только код, который вызывается из задач** — так компилирует сам CODESYS. Ошибка в POU, который не вызывается ни одной задачей, сборкой не находится (0 ошибок), но видна в `get_compile_messages` (фоновая проверка). Это не ошибка сервера, но агенту об этом надо знать.
3. `list_tasks` печатает лишнюю строку `DeprecationWarning: callable() is removed in 3.x` — безвредно.
4. `list_device_parameters` у CODESYS Control Win V3 x64 возвращает `<none>` — у этого устройства нет параметров; на устройствах с параметрами не проверялось.

## Все шаги

| Шаг | Инструмент | Статус | Результат |
|---|---|---|---|
| 0.1 | `get_codesys_status` | OK | SP17 Patch 3 <- current Exe: C:\Program Files (x86)\CODESYS 3.5.17.30(1)\CODESYS\Common\CODESYS.exe State: sto |
| 0.2 | `launch_codesys` | OK | CODESYS SP17 Patch 3 launched successfully in persistent mode. |
| 1.1 | `create_project` | OK | Project created: E:\Project\codesys-test\full\Full.project. Wrote E:\Project\codesys-test\full\.codesys-versio |
| 1.2 | `save_project` | OK | Project saved: E:\Project\codesys-test\full\Full.project |
| 1.3a | `get_project_info` | OK | company: title: version: None author: description: values[Project]: Full |
| 1.3b | `set_project_info` | OK | Project info updated and saved. |
| 1.3c | `get_project_info` | OK | company: title: Full test version: None author: Проверка SP17 description: values[Author]: Проверка SP17 value |
| 1.4 | `get_compiler_version` | OK | Compiler version: 3.5.17.30 |
| 1.5 | `list_project_libraries` | OK | Project: Full.project — 4 library reference(s) across 1 container(s). Project info: Title: Full test Author: П |
| 1.6 | `list_applications` | OK | 1 application(s) in E:\Project\codesys-test\full\Full.project: - Device/Plc Logic/Application (ACTIVE) device= |
| 1.7a | `close_project` | OK | Project closed: E:\Project\codesys-test\full\Full.project |
| 1.7b | `open_project` | OK | Project opened: E:\Project\codesys-test\full\Full.project |
| 2.1 | `create_folder` | OK | Folder 'Test' created in 'Application' of E:\Project\codesys-test\full\Full.project. Project saved. |
| 2.2 | `create_pou` | OK | POU 'PRG_Test' created in 'Application/Test' of E:\Project\codesys-test\full\Full.project. Code applied. Proje |
| 2.3 | `create_pou` | OK | POU 'FB_Test' created in 'Application' of E:\Project\codesys-test\full\Full.project. Code applied. Project sav |
| 2.4 | `create_pou` | OK | POU 'F_Add' created in 'Application/Test' of E:\Project\codesys-test\full\Full.project. Code applied. Project  |
| 2.5 | `create_method` | OK | Method 'Run' created under 'Application/FB_Test' in E:\Project\codesys-test\full\Full.project. Code applied. P |
| 2.6 | `create_property` | OK | Property 'Value' created under 'Application/FB_Test' in E:\Project\codesys-test\full\Full.project. Project sav |
| 2.7 | `create_action` | OK | Action 'Reset' created under Application/Test/PRG_Test. Project saved. |
| 2.8 | `create_interface` | OK | Interface 'I_Test' created under Application. Project saved. |
| 2.9a | `create_dut` | OK | DUT 'ST_Data' (Structure) created in 'Application' of E:\Project\codesys-test\full\Full.project. Project saved |
| 2.9b | `create_dut` | OK | DUT 'E_Mode' (Enumeration) created in 'Application' of E:\Project\codesys-test\full\Full.project. Project save |
| 2.9c | `set_pou_code` | OK | Code set for 'Application/ST_Data' in E:\Project\codesys-test\full\Full.project. Project saved. |
| 2.10 | `create_gvl` | OK | GVL 'GVL_Test' created in 'Application' of E:\Project\codesys-test\full\Full.project. Project saved. |
| 2.11 | `create_persistent_vars` | EXPECTED-FAIL | Persistent Vars через скрипт — только SP21+ (в описании инструмента помечен «SP21+»). |
| 2.12 | `set_pou_code` | OK | Code set for 'Application/Test/PRG_Test' in E:\Project\codesys-test\full\Full.project. Project saved. |
| 2.13 | `get_text_lines` | OK | Object: Application/Test/PRG_Test (implementation), 2 lines 1\| nCounter := nCounter + 1; 2\| bFlag := nCounter  |
| 2.14a | `edit_text_lines` | OK | 1 line operation(s) applied to Application/Test/PRG_Test (implementation), 2 -> 3 lines. Project saved. |
| 2.14b | `get_text_lines` | OK | Object: Application/Test/PRG_Test (implementation), 3 lines 1\| nCounter := nCounter + 1; 2\| bFlag := nCounter  |
| 2.15 | `get_all_pou_code` | OK | 13 object(s) with code: === Device/Plc Logic/Application/PLC_PRG (ExtendedObject[IScriptObject]) === // -----  |
| 2.16 | `find_references` | OK | { "total": 6, "name": "nCounter", "shown": 6, "objects_named_like_it": [], "references": [ { "line": 3, "quali |
| 2.17a | `rename_symbol` | OK | { "occurrences": 6, "changes": [ { "count": 1, "object": "Device/Plc Logic/Application/Test/PRG_Test", "part": |
| 2.17b | `rename_symbol` | OK | { "occurrences": 6, "changes": [ { "count": 1, "object": "Device/Plc Logic/Application/Test/PRG_Test", "part": |
| 2.17c | `find_references` | OK | { "total": 6, "name": "nCycles", "shown": 6, "objects_named_like_it": [], "references": [ { "line": 3, "qualif |
| 2.18 | `rename_object` | OK | Object 'Application/Test/F_Add' renamed to 'F_Sum' in E:\Project\codesys-test\full\Full.project. Project saved |
| 2.19 | `move_object` | OK | Object 'Application/Test/F_Sum' moved to 'Application'. Project saved. |
| 2.20a | `create_pou` | OK | POU 'PRG_Delete' created in 'Application' of E:\Project\codesys-test\full\Full.project. Project saved. |
| 2.20b | `delete_object` | OK | Object 'Application/PRG_Delete' deleted from E:\Project\codesys-test\full\Full.project. Project saved. |
| 3.1a | `set_pou_code` | OK | Code set for 'Application/Test/PRG_Test' in E:\Project\codesys-test\full\Full.project. Project saved. |
| 3.1b | `get_text_lines` | OK | Object: Application/Test/PRG_Test (declaration), 5 lines 1\| PROGRAM PRG_Test 2\| VAR 3\| nCycles : INT; // Счётч |
| 3.1c | `get_text_lines` | OK | Object: Application/Test/PRG_Test (implementation), 4 lines 1\| (* Проверка кириллицы: Привет, мир! ёЁ *) 2\| nC |
| 3.2a | `set_pou_code` | OK | Code set for 'Application/GVL_Test' in E:\Project\codesys-test\full\Full.project. Project saved. |
| 3.2b | `get_text_lines` | OK | Object: Application/GVL_Test (declaration), 5 lines 1\| VAR_GLOBAL 2\| gnValue : INT; 3\| wsText : WSTRING := "Пр |
| 3.3a | `edit_text_lines` | OK | 1 line operation(s) applied to Application/Test/PRG_Test (implementation), 4 -> 5 lines. Project saved. |
| 3.3b | `get_text_lines` | OK | Object: Application/Test/PRG_Test (implementation), 5 lines 1\| (* Проверка кириллицы: Привет, мир! ёЁ *) 2\| // |
| 3.4a | `create_pou` | OK | POU 'PRG_Kirill' created in 'Application' of E:\Project\codesys-test\full\Full.project. Code applied. Project  |
| 3.4b | `get_text_lines` | OK | Object: Application/PRG_Kirill (declaration), 3 lines 1\| PROGRAM PRG_Kirill // Создано с кириллицей 2\| VAR 3\|  |
| 3.5 | `find_references` | OK | { "total": 1, "name": "wsText", "shown": 1, "objects_named_like_it": [], "references": [ { "line": 3, "qualifi |
| 3.6 | `create_text_list` | OK | Text list 'TL_Test' created. Project saved. |
| 3.7a | `save_project_as` | OK | Project saved as: E:\Project\codesys-test\full\Кириллица\Full_копия.project |
| 3.7b | `open_project` | OK | Project opened: E:\Project\codesys-test\full\Full.project |
| 3.8 | `get_all_pou_code` | OK | 14 object(s) with code: === Device/Plc Logic/Application/PLC_PRG (ExtendedObject[IScriptObject]) === // -----  |
| 4.1 | `compile_project` | OK | Compilation complete for E:\Project\codesys-test\full\Full.project. 0 error(s), 0 warning(s). |
| 4.2a | `edit_text_lines` | OK | 1 line operation(s) applied to Application/Test/PRG_Test (implementation), 5 -> 6 lines. Project saved. |
| 4.2b | `compile_project` | OK | Compilation complete for E:\Project\codesys-test\full\Full.project. 0 error(s), 0 warning(s). |
| 4.2c | `get_compile_messages` | OK | Ожидаемо: в коде намеренная ошибка, инструмент вернул её как ошибку («Идентификатор 'nUnknown' не задан»). |
| 4.3a | `edit_text_lines` | OK | 1 line operation(s) applied to Application/Test/PRG_Test (implementation), 6 -> 5 lines. Project saved. |
| 4.3b | `compile_project` | OK | Compilation complete for E:\Project\codesys-test\full\Full.project. 0 error(s), 0 warning(s). |
| 4.4 | `application_build` | OK | generate_code executed. Use get_compile_messages for details. |
| 4.5a | `clean_all` | OK | Clean All executed. |
| 4.5b | `compile_project` | OK | Compilation complete for E:\Project\codesys-test\full\Full.project. 0 error(s), 0 warning(s). |
| 4.6 | `get_build_properties` | OK | Object: Application/Test/PRG_Test exclude_from_build: False link_always: False external: False enable_system_c |
| 5.1 | `list_tasks` | OK | Task Configuration: TaskConfiguration <string>:575: DeprecationWarning: callable() is removed in 3.x. instead  |
| 5.2 | `create_task` | OK | Task 'TestTask' created. Project saved. |
| 5.3 | `configure_task` | OK | Task 'TestTask' configured. Project saved. |
| 5.4a | `add_pou_to_task` | OK | POU 'PRG_Kirill' added to task 'TestTask'. Project saved. |
| 5.4b | `list_tasks` | OK | Task Configuration: TaskConfiguration <string>:575: DeprecationWarning: callable() is removed in 3.x. instead  |
| 5.5a | `remove_pou_from_task` | OK | POU 'PRG_Kirill' removed from task 'TestTask'. Project saved. |
| 5.5b | `list_tasks` | OK | Task Configuration: TaskConfiguration <string>:575: DeprecationWarning: callable() is removed in 3.x. instead  |
| 6.1 | `get_device_identification` | OK | Device: Device type: 4096 id: 0000 0004 version: 3.5.17.30 enabled: True simulation: False |
| 6.2 | `list_device_parameters` | OK | Device parameters (scope id name value unit): <none> |
| 6.3 | `get_plc_settings` | OK | Device: Device Bus cycle task: <unspecified> Update IOs while in stop: False Behaviour for outputs on stop: Ke |
| 6.4 | `list_device_repository` | OK | { "installed": 776, "shown": 2, "matched": 2, "devices": [ { "description": "CODESYS V3 Soft-PLC for Windows w |
| 7.1 | `add_library` | OK | Library 'Util' added to E:\Project\codesys-test\full\Full.project. Project saved. |
| 7.2 | `list_project_libraries` | OK | Project: Full.project — 5 library reference(s) across 1 container(s). Project info: Title: Full test Author: П |
| 7.3a | `remove_library` | OK | Library 'Util' removed from E:\Project\codesys-test\full\Full.project. Project saved. |
| 7.3b | `list_project_libraries` | OK | Project: Full.project — 4 library reference(s) across 1 container(s). Project info: Title: Full test Author: П |
| 7.4 | `download_missing_libraries` | EXPECTED-FAIL | Нужен IScriptLibManObject3 — только SP21+. |
| 8.1a | `add_pou_to_task` | OK | POU 'PRG_Test' added to task 'MainTask'. Project saved. |
| 8.1b | `compile_project` | OK | Compilation complete for E:\Project\codesys-test\full\Full.project. 0 error(s), 1 warning(s). Warnings: WARNIN |
| 8.2a | `set_simulation_mode` | OK | Device: Device Simulation mode: ON (was OFF) |
| 8.2b | `set_simulation_mode` | OK | Device: Device Simulation mode: ON |
| 8.3 | `connect_to_device` | OK | Connected to device for E:\Project\codesys-test\full\Full.project. |
| 8.4 | `download_to_device` | FAIL | В симуляции предварительная проверка шлюза падает («gateway Guid ... is not in scriptengine.online.gateways»). С skipReachabilityCheck=true загрузка проходит (шаг 8.4r-b). |
| 8.5a | `start_stop_application` | OK | Application start executed for E:\Project\codesys-test\full\Full.project. |
| 8.5b | `get_application_state` | OK | Application: Application State: run Logged In: True |
| 8.6 | `read_variable` | OK | PRG_Test.nCycles = INT#77 (unknown) |
| 8.7 | `read_variables` | OK | PRG_Test.nCycles = INT#127 PRG_Test.bFlag = TRUE |
| 8.8 | `monitor_variables` | OK | { "truncated": false, "samples": 8, "duration_ms": 3099.0, "interval_ms": 200, "variables": [ { "first": "INT# |
| 8.9a | `write_variable` | OK | Variable 'GVL_Test.gnSecond' set to '42'. |
| 8.9b | `read_variable` | OK | GVL_Test.gnSecond = INT#42 (unknown) |
| 8.10 | `write_variables` | OK | Wrote 2 variable(s) in one batch. |
| 8.11 | `read_variables` | OK | GVL_Test.gnSecond = INT#7 GVL_Test.wsText = "Мир" |
| 8.12a | `force_variables` | OK | Forced 1 variable(s). |
| 8.12b | `list_forced_variables` | OK | forced: PRG_Test.bFlag (Forced Count: 1, Prepared Count: 0) |
| 8.12c | `unforce_variables` | OK | Unforced ALL forced variables. |
| 8.13 | `check_online_change` | OK | Online change possible: True |
| 8.14a | `start_stop_application` | OK | Application stop executed for E:\Project\codesys-test\full\Full.project. |
| 8.14b | `disconnect_from_device` | OK | Disconnected from device for E:\Project\codesys-test\full\Full.project. |
| 8.15 | `set_simulation_mode` | OK | Device: Device Simulation mode: OFF (was ON) |
| 8.4r-0 | `open_project` | OK | Project opened: E:\Project\codesys-test\full\Full.project |
| 8.4r-a | `set_simulation_mode` | OK | Device: Device Simulation mode: ON (was OFF) |
| 8.4r-b | `download_to_device` | OK | Application downloaded to device for E:\Project\codesys-test\full\Full.project. |
| 8.4r-c | `get_application_state` | OK | Application: Application State: stop Logged In: True |
| 8.4r-d | `disconnect_from_device` | OK | Disconnected from device for E:\Project\codesys-test\full\Full.project. |
| 8.4r-e | `set_simulation_mode` | OK | Device: Device Simulation mode: OFF (was ON) |
| 9.1 | `export_plcopen_xml` | OK | PLCopenXML exported to: E:\Project\codesys-test\full\export\Full.xml |
| 9.2 | `export_native` | OK | Native export written to: E:\Project\codesys-test\full\export\PRG_Test.export |
| 9.3 | `mirror_export` | OK | mirror_export complete for E:\Project\codesys-test\full\Full.project -> E:\Project\codesys-test\full\mcp-mirro |
| 9.4 | `save_project_archive` | OK | Project archive saved: E:\Project\codesys-test\full\export\Full.projectarchive |
| 9.5 | `compare_projects` | OK | Left (primary): E:\Project\codesys-test\full\Full.project Right: E:\Project\codesys-test\full\Кириллица\Full_к |
| 10.1 | `create_symbol_config` | OK | Symbol Configuration ensured under '<active application>' in E:\Project\codesys-test\full\Full.project. [auto- |
| 10.2 | `set_symbol_access` | OK | Symbol access set: GVL_Test.gnValue = ReadWrite. [auto-compile] Compilation complete for E:\Project\codesys-te |
| 10.3 | `list_configured_symbols` | OK | DEBUG: list_configured_symbols: Project='E:\Project\codesys-test\full\Full.project' DEBUG: Ensuring project is |
| 10.4 | `find_symbol_config` | OK | DEBUG: find_symbol_config: Project='E:\Project\codesys-test\full\Full.project' DEBUG: Ensuring project is open |
| 11.1 | `save_project` | OK | Project saved: E:\Project\codesys-test\full\Full.project |
| 11.2 | `close_project` | OK | Project closed: E:\Project\codesys-test\full\Full.project |
| 11.3 | `shutdown_codesys` | OK | CODESYS SP17 Patch 3 shut down successfully. The next tool call for it will relaunch the IDE. |
| 4.2r-0 | `open_project` | OK | Project opened: E:\Project\codesys-test\full\Full.project |
| 4.2r-a | `edit_text_lines` | OK | 1 line operation(s) applied to Application/Test/PRG_Test (implementation), 5 -> 6 lines. Project saved. |
| 4.2r-b | `compile_project` | OK | Ожидаемо: намеренная ошибка найдена, 2 ошибки компиляции. |
| 4.2r-c | `edit_text_lines` | OK | 1 line operation(s) applied to Application/Test/PRG_Test (implementation), 6 -> 5 lines. Project saved. |
| 4.2r-d | `compile_project` | OK | Compilation complete for E:\Project\codesys-test\full\Full.project. 0 error(s), 1 warning(s). Warnings: WARNIN |
| 4.2r-e | `close_project` | OK | Project closed: E:\Project\codesys-test\full\Full.project |
| 4.2r-f | `shutdown_codesys` | OK | CODESYS SP17 Patch 3 shut down successfully. The next tool call for it will relaunch the IDE. |

## Не проверено (59)

Требуют реального ПЛК, сети, SSH, другого оборудования или разрушают проект, либо не входят в шаги скилла:

`add_device`, `add_device_user`, `add_external_file`, `add_project_user`, `attach_codesys`, `bump_project_version`, `create_boot_application`, `create_image_pool`, `create_nvl_receiver`, `create_redundancy_config`, `export_io_mappings_csv`, `export_symbol_xsd`, `find_device_description`, `get_device_parameter`, `get_library_reference`, `get_signature_crc`, `get_symbol_config_settings`, `get_user_selection`, `grant_object_access`, `import_io_mappings_csv`, `import_native`, `import_plcopen_xml`, `import_text_list_file`, `install_device_description`, `launch_codesys_with_project`, `list_all_datatypes`, `list_all_signatures`, `list_project_users`, `open_project_archive`, `plc_file_delete`, `plc_file_list`, `plc_file_transfer`, `plug_device`, `read_running_version_online`, `read_running_version_ssh`, `rebind_device_to_scan_result`, `release_project_version`, `remove_device_description`, `remove_project_user`, `reset_application`, `restart_runtime_ssh`, `save_as_compiled_library`, `scan_network_devices`, `set_active_application`, `set_build_properties`, `set_compiler_version_to_newest`, `set_device_parameter`, `set_device_state`, `set_exclude_from_build`, `set_library_reference`, `set_nvl_sender`, `set_plc_settings`, `set_signature_access_bulk`, `set_symbol_config_settings`, `source_download`, `source_upload`, `unplug_device`, `update_device_type`, `verify_device_reachable`.
