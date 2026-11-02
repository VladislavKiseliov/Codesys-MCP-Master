/**
 * Tool groups for --tools.
 *
 * An MCP client sends every tool schema with every model request. All 132
 * tools come to about 57k tokens, so a 60-call session spends most of its
 * tokens re-sending tools it never calls (measured 2026-11-02 under DeepSeek
 * Harness: ~5M tokens for 60 calls). --tools registers only the named groups
 * and tools; omitted, every tool is registered as before.
 */

/** Every tool, by group. A tool belongs to exactly one group (unit-tested). */
export const TOOL_GROUPS: Record<string, readonly string[]> = {
  management: [
    'launch_codesys', 'attach_codesys', 'launch_codesys_with_project', 'shutdown_codesys',
    'get_codesys_status', 'get_user_selection',
  ],
  project: [
    'open_project', 'create_project', 'save_project', 'close_project', 'save_project_as',
    'save_project_archive', 'open_project_archive', 'get_project_info', 'set_project_info',
    'list_applications', 'set_active_application', 'compare_projects',
  ],
  code: [
    'create_pou', 'set_pou_code', 'create_property', 'create_method', 'create_action',
    'create_interface', 'create_dut', 'create_gvl', 'create_persistent_vars', 'create_folder',
    'delete_object', 'rename_object', 'move_object', 'get_all_pou_code', 'get_text_lines',
    'edit_text_lines', 'find_references', 'rename_symbol',
  ],
  build: [
    'compile_project', 'get_compile_messages', 'clean_all', 'application_build',
    'get_compiler_version', 'set_compiler_version_to_newest', 'get_signature_crc',
    'set_exclude_from_build', 'get_build_properties', 'set_build_properties',
    'save_as_compiled_library',
  ],
  tasks: ['list_tasks', 'create_task', 'configure_task', 'add_pou_to_task', 'remove_pou_from_task'],
  libraries: [
    'list_project_libraries', 'add_library', 'remove_library', 'get_library_reference',
    'set_library_reference', 'download_missing_libraries',
  ],
  online: [
    'connect_to_device', 'disconnect_from_device', 'download_to_device', 'start_stop_application',
    'reset_application', 'get_application_state', 'check_online_change', 'set_simulation_mode',
    'read_variable', 'read_variables', 'monitor_variables', 'write_variable', 'write_variables',
    'force_variables', 'unforce_variables', 'list_forced_variables', 'create_boot_application',
  ],
  devices: [
    'get_device_identification', 'list_device_parameters', 'get_device_parameter',
    'set_device_parameter', 'set_device_state', 'add_device', 'update_device_type', 'plug_device',
    'unplug_device', 'get_plc_settings', 'set_plc_settings', 'export_io_mappings_csv',
    'import_io_mappings_csv', 'list_device_repository', 'install_device_description',
    'find_device_description', 'remove_device_description',
  ],
  interop: ['export_plcopen_xml', 'import_plcopen_xml', 'export_native', 'import_native', 'mirror_export'],
  objects: [
    'list_project_users', 'add_project_user', 'remove_project_user', 'create_text_list',
    'import_text_list_file', 'create_image_pool', 'add_external_file',
  ],
  symbols: [
    'find_symbol_config', 'create_symbol_config', 'get_symbol_config_settings',
    'set_symbol_config_settings', 'list_all_signatures', 'list_all_datatypes',
    'list_configured_symbols', 'set_symbol_access', 'set_signature_access_bulk', 'export_symbol_xsd',
  ],
  network: [
    'scan_network_devices', 'verify_device_reachable', 'rebind_device_to_scan_result',
    'add_device_user', 'grant_object_access',
  ],
  'plc-files': ['source_download', 'source_upload', 'plc_file_list', 'plc_file_transfer', 'plc_file_delete'],
  nvl: ['set_nvl_sender', 'create_nvl_receiver'],
  redundancy: ['create_redundancy_config'],
  release: [
    'bump_project_version', 'release_project_version', 'read_running_version_online',
    'read_running_version_ssh', 'restart_runtime_ssh',
  ],
};

/** The CODESYS-shipped bridge tools (SP22+), registered with this prefix at runtime. */
export const IDE_GROUP = 'ide';
const IDE_PREFIX = 'ide_';

/** Named sets of groups. */
export const TOOL_PRESETS: Record<string, readonly string[]> = {
  core: ['management', 'project', 'code', 'build', 'tasks'],
  all: [...Object.keys(TOOL_GROUPS), IDE_GROUP],
};

/** Decides per tool name whether it is registered. */
export type ToolFilter = (name: string) => boolean;

/**
 * Parse a --tools value: comma-separated presets, groups and single tool
 * names, e.g. "core,libraries,online" or "core,download_to_device".
 * @returns undefined when no value was given (every tool is registered).
 * @throws on an empty list or an unknown name, listing the valid ones.
 */
export function parseToolFilter(spec: string | undefined): ToolFilter | undefined {
  if (spec === undefined) return undefined;
  const items = spec.split(',').map((x) => x.trim()).filter((x) => x.length > 0);
  if (items.length === 0) throw new Error('--tools: empty list');
  const allTools = new Set(Object.values(TOOL_GROUPS).flat());
  const enabled = new Set<string>();
  let ide = false;
  const addGroup = (g: string): void => {
    if (g === IDE_GROUP) ide = true;
    else for (const t of TOOL_GROUPS[g]) enabled.add(t);
  };
  for (const item of items) {
    if (item in TOOL_PRESETS) TOOL_PRESETS[item].forEach(addGroup);
    else if (item in TOOL_GROUPS || item === IDE_GROUP) addGroup(item);
    else if (allTools.has(item)) enabled.add(item);
    else {
      throw new Error(
        `--tools: unknown name '${item}'. Presets: ${Object.keys(TOOL_PRESETS).join(', ')}. ` +
        `Groups: ${[...Object.keys(TOOL_GROUPS), IDE_GROUP].join(', ')}. Or a single tool name.`,
      );
    }
  }
  return (name) => (name.startsWith(IDE_PREFIX) ? ide : enabled.has(name));
}
