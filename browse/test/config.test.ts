import { describe, expect, test } from 'bun:test';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { ensureStateDir, getRemoteSlug, readVersionHash, resolveConfig } from '../src/config';

describe('browse config', () => {
  test('defaults to .kstack under the project root', () => {
    const projectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kstack-browse-'));
    const config = resolveConfig({ BROWSE_STATE_FILE: path.join(projectDir, '.kstack', 'browse.json') });
    expect(config.projectDir).toBe(projectDir);
    expect(config.stateDir).toBe(path.join(projectDir, '.kstack'));
    expect(config.consoleLog).toBe(path.join(projectDir, '.kstack', 'browse-console.log'));
  });

  test('ensureStateDir creates .kstack and updates .gitignore', () => {
    const projectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kstack-browse-gitignore-'));
    fs.writeFileSync(path.join(projectDir, '.gitignore'), 'node_modules/\n');
    const config = resolveConfig({ BROWSE_STATE_FILE: path.join(projectDir, '.kstack', 'browse.json') });
    ensureStateDir(config);
    expect(fs.existsSync(config.stateDir)).toBe(true);
    expect(fs.readFileSync(path.join(projectDir, '.gitignore'), 'utf-8')).toContain('.kstack/');
  });

  test('reads version hashes from adjacent .version files', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kstack-browse-version-'));
    fs.writeFileSync(path.join(dir, '.version'), 'abc123\n');
    expect(readVersionHash(path.join(dir, 'browse'))).toBe('abc123');
  });

  test('remote slug falls back to the current directory outside a git repo', () => {
    const cwd = process.cwd();
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kstack-browse-slug-'));
    process.chdir(dir);
    try {
      expect(getRemoteSlug()).toBe(path.basename(dir));
    } finally {
      process.chdir(cwd);
    }
  });
});
