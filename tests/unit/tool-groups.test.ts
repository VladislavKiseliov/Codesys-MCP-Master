import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { TOOL_GROUPS, TOOL_PRESETS, parseToolFilter } from '../../src/tool-groups';

// Every tool registered in server.ts, by its literal name.
const serverSrc = fs.readFileSync(path.join(__dirname, '..', '..', 'src', 'server.ts'), 'utf-8');
const registered = [...serverSrc.matchAll(/\bs\.tool\(\s*'([a-z_]+)'/g)].map((m) => m[1]);

describe('tool groups', () => {
  it('cover every registered tool exactly once', () => {
    const grouped = Object.values(TOOL_GROUPS).flat();
    expect(new Set(grouped).size).toBe(grouped.length);
    expect([...grouped].sort()).toEqual([...new Set(registered)].sort());
  });

  it('presets name only known groups', () => {
    for (const groups of Object.values(TOOL_PRESETS)) {
      for (const g of groups) expect(g === 'ide' || g in TOOL_GROUPS).toBe(true);
    }
  });
});

describe('parseToolFilter', () => {
  it('registers every tool when --tools is not given', () => {
    expect(parseToolFilter(undefined)).toBeUndefined();
  });

  it('combines presets, groups and single tools', () => {
    const f = parseToolFilter('core, libraries ,download_to_device')!;
    expect(f('set_pou_code')).toBe(true);
    expect(f('add_library')).toBe(true);
    expect(f('download_to_device')).toBe(true);
    expect(f('connect_to_device')).toBe(false);
    expect(f('create_redundancy_config')).toBe(false);
  });

  it('enables the SP22 ide_ passthrough tools only with the ide group', () => {
    expect(parseToolFilter('core')!('ide_get_project')).toBe(false);
    expect(parseToolFilter('core,ide')!('ide_get_project')).toBe(true);
    expect(parseToolFilter('all')!('ide_get_project')).toBe(true);
  });

  it('fails loud on an unknown name or an empty list', () => {
    expect(() => parseToolFilter('core,onlin')).toThrow(/unknown name 'onlin'.*Groups:.*online/);
    expect(() => parseToolFilter(' , ')).toThrow(/empty list/);
  });
});
