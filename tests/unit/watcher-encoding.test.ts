import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// src/ipc.ts writes the command and script files as UTF-8. The watcher read
// them with a plain open(), which IronPython 2.7 decodes byte-per-char, so
// Cyrillic comments and string literals reached CODESYS as mojibake
// ("Счётчик" -> "Ð¡ÑÑÑÑÐ¸Ðº"). codecs.open does no newline translation, and
// exec() rejects the '\r' of CRLF templates, so the reader normalizes line
// endings itself. Verified live on SP17 (2026-11-02).
describe('watcher: command files are read as UTF-8', () => {
  const w = fs.readFileSync(path.join(__dirname, '..', '..', 'src', 'scripts', 'watcher.py'), 'utf-8');

  it('decodes the command JSON and the script as UTF-8', () => {
    expect(w).toContain('with codecs.open(command_path, "r", "utf-8-sig") as f:');
    expect(w).toContain('with codecs.open(script_path, "r", "utf-8-sig") as f:');
    // No plain open() of a command or script file is left anywhere.
    expect(w).not.toMatch(/(?<!codecs\.)open\((command_path|script_path|os\.path\.join\(COMMANDS_DIR)/);
  });

  it('normalizes CRLF before exec', () => {
    expect(w).toContain('f.read().replace(u"\\r\\n", u"\\n").replace(u"\\r", u"\\n")');
  });
});

// Headless mode hands the script to CODESYS --runscript; latin1 cannot encode
// Cyrillic at all (Node writes the low byte of each char).
describe('headless: scripts keep non-ASCII text', () => {
  const h = fs.readFileSync(path.join(__dirname, '..', '..', 'src', 'headless.ts'), 'utf-8');

  it('writes the temp script as UTF-8 with a coding declaration', () => {
    expect(h).not.toContain("'latin1'");
    expect(h).toContain("'# -*- coding: utf-8 -*-\\n' + normalized");
  });
});
