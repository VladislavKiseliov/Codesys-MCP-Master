// Generates the call lists for groups 3-11 of the SP17 check on Full.project.
import { writeFileSync, mkdirSync } from 'node:fs'
const DIR = 'E:\\Project\\codesys-test\\full'
const P = DIR + '\\Full.project'
mkdirSync(DIR + '\\export', { recursive: true })
const c = (id, name, args = {}, max) => ({ id, name, arguments: { projectFilePath: P, ...args }, ...(max ? { max } : {}) })
const raw = (id, name, args = {}, max) => ({ id, name, arguments: args, ...(max ? { max } : {}) })
const launch = raw('L', 'launch_codesys', { otherInstances: 'leave' })
const PRG = 'Application/Test/PRG_Test'

const g3_7 = [
  launch,
  c('3.1a', 'set_pou_code', { pouPath: PRG,
    declarationCode: 'PROGRAM PRG_Test\nVAR\n\tnCycles : INT; // Счётчик циклов\n\tbFlag : BOOL;\nEND_VAR',
    implementationCode: '(* Проверка кириллицы: Привет, мир! ёЁ *)\nnCycles := nCycles + 1;\nbFlag := nCycles > 10;\nGVL_Test.gnValue := nCycles;' }),
  c('3.1b', 'get_text_lines', { objectPath: PRG, part: 'declaration' }),
  c('3.1c', 'get_text_lines', { objectPath: PRG, part: 'implementation' }),
  c('3.2a', 'set_pou_code', { pouPath: 'Application/GVL_Test',
    declarationCode: 'VAR_GLOBAL\n\tgnValue : INT;\n\twsText : WSTRING := "Привет";\n\tgnSecond : INT;\nEND_VAR' }),
  c('3.2b', 'get_text_lines', { objectPath: 'Application/GVL_Test', part: 'declaration' }),
  c('3.3a', 'edit_text_lines', { objectPath: PRG, operations: [{ op: 'insert', line: 2, text: '// Комментарий через edit_text_lines' }] }),
  c('3.3b', 'get_text_lines', { objectPath: PRG }),
  c('3.4a', 'create_pou', { name: 'PRG_Kirill', type: 'Program', language: 'ST', parentPath: 'Application',
    declarationCode: 'PROGRAM PRG_Kirill // Создано с кириллицей\nVAR\nEND_VAR' }),
  c('3.4b', 'get_text_lines', { objectPath: 'Application/PRG_Kirill', part: 'declaration' }),
  c('3.5', 'find_references', { name: 'wsText' }, 600),
  c('3.6', 'create_text_list', { name: 'TL_Test', parentPath: 'Application' }),
  c('3.7a', 'save_project_as', { newPath: DIR + '\\Кириллица\\Full_копия.project' }),
  raw('3.7b', 'open_project', { filePath: P }),
  c('3.8', 'get_all_pou_code', {}, 2500),
  c('4.1', 'compile_project', {}, 800),
  c('4.2a', 'edit_text_lines', { objectPath: PRG, operations: [{ op: 'insert', line: 1, text: 'nUnknown := 1;' }] }),
  c('4.2b', 'compile_project', {}, 800),
  c('4.2c', 'get_compile_messages', {}, 800),
  c('4.3a', 'edit_text_lines', { objectPath: PRG, operations: [{ op: 'delete', line: 1, expect: 'nUnknown := 1;' }] }),
  c('4.3b', 'compile_project', {}, 800),
  c('4.4', 'application_build', { action: 'generate_code' }, 800),
  c('4.5a', 'clean_all'),
  c('4.5b', 'compile_project', {}, 800),
  c('4.6', 'get_build_properties', { objectPath: PRG }),
  c('5.1', 'list_tasks', {}, 800),
  c('5.2', 'create_task', { taskName: 'TestTask' }),
  c('5.3', 'configure_task', { taskName: 'TestTask', kind: 'cyclic', interval: '50', intervalUnit: 'ms' }),
  c('5.4a', 'add_pou_to_task', { taskName: 'TestTask', pouName: 'PRG_Kirill' }),
  c('5.4b', 'list_tasks', {}, 800),
  c('5.5a', 'remove_pou_from_task', { taskName: 'TestTask', pouName: 'PRG_Kirill' }),
  c('5.5b', 'list_tasks', {}, 800),
  c('6.1', 'get_device_identification'),
  c('6.2', 'list_device_parameters', {}, 600),
  c('6.3', 'get_plc_settings', {}, 800),
  raw('6.4', 'list_device_repository', { nameContains: 'Control Win', limit: 5 }, 800),
  c('7.1', 'add_library', { libraryName: 'Util' }, 800),
  c('7.2', 'list_project_libraries', {}, 800),
  c('7.3a', 'remove_library', { libraryName: 'Util' }, 800),
  c('7.3b', 'list_project_libraries', {}, 800),
  c('7.4', 'download_missing_libraries', {}, 800),
]

// 8a: make PRG_Test cyclic, compile, switch simulation on and read it back.
const g8a = [
  launch,
  c('8.1a', 'add_pou_to_task', { taskName: 'MainTask', pouName: 'PRG_Test' }),
  c('8.1b', 'compile_project', {}, 800),
  c('8.2a', 'set_simulation_mode', { enabled: true }, 800),
  c('8.2b', 'set_simulation_mode', {}, 800),
]

// 8b: runs only after 8.2b confirmed simulation.
const g8b = [
  launch,
  c('8.3', 'connect_to_device', {}, 1200),
  c('8.4', 'download_to_device', {}, 1200),
  c('8.5a', 'start_stop_application', { action: 'start' }),
  c('8.5b', 'get_application_state'),
  c('8.6', 'read_variable', { variablePath: 'PRG_Test.nCycles' }),
  c('8.7', 'read_variables', { expressions: ['PRG_Test.nCycles', 'PRG_Test.bFlag'] }, 800),
  c('8.8', 'monitor_variables', { expressions: ['PRG_Test.nCycles'], durationSeconds: 3 }, 800),
  c('8.9a', 'write_variable', { variablePath: 'GVL_Test.gnSecond', value: '42' }),
  c('8.9b', 'read_variable', { variablePath: 'GVL_Test.gnSecond' }),
  c('8.10', 'write_variables', { assignments: [{ expression: 'GVL_Test.gnSecond', value: '7' }, { expression: 'GVL_Test.wsText', value: '"Мир"' }] }, 800),
  c('8.11', 'read_variables', { expressions: ['GVL_Test.gnSecond', 'GVL_Test.wsText'] }, 800),
  c('8.12a', 'force_variables', { assignments: [{ expression: 'PRG_Test.bFlag', value: 'TRUE' }] }, 800),
  c('8.12b', 'list_forced_variables', {}, 800),
  c('8.12c', 'unforce_variables', {}, 800),
  c('8.13', 'check_online_change', {}, 800),
  c('8.14a', 'start_stop_application', { action: 'stop' }),
  c('8.14b', 'disconnect_from_device'),
  c('8.15', 'set_simulation_mode', { enabled: false }),
]

const g9_11 = [
  launch,
  c('9.1', 'export_plcopen_xml', { exportPath: DIR + '\\export\\Full.xml' }),
  c('9.2', 'export_native', { destination: DIR + '\\export\\PRG_Test.export', objectPath: PRG }),
  c('9.3', 'mirror_export', {}, 800),
  c('9.4', 'save_project_archive', { archivePath: DIR + '\\export\\Full.projectarchive' }),
  c('9.5', 'compare_projects', { otherProjectFilePath: DIR + '\\Кириллица\\Full_копия.project' }, 1200),
  c('10.1', 'create_symbol_config', {}, 800),
  c('10.2', 'set_symbol_access', { signatureFqn: 'GVL_Test', variableName: 'gnValue', access: 'ReadWrite' }, 800),
  c('10.3', 'list_configured_symbols', {}, 800),
  c('10.4', 'find_symbol_config', {}, 600),
  c('11.1', 'save_project'),
  c('11.2', 'close_project'),
  raw('11.3', 'shutdown_codesys', {}),
]

for (const [f, v] of Object.entries({ 'g3-7.json': g3_7, 'g8a.json': g8a, 'g8b.json': g8b, 'g9-11.json': g9_11 })) {
  writeFileSync(f, JSON.stringify(v, null, 1))
  console.log(f, v.length)
}
