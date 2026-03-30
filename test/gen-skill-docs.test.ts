import { describe, expect, test } from 'bun:test';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { execFileSync } from 'node:child_process';
import { PUBLIC_ROUTED_COMMAND_NAMES, REMOVED_PUBLIC_COMMANDS } from '../lib/command-registry';

const ROOT = path.resolve(import.meta.dir, '..');
const BUN = process.env.BUN_BIN || path.join(os.homedir(), '.bun', 'bin', 'bun');

describe('gen-skill-docs', () => {
  test('generates only the registered KStack routed commands', () => {
    execFileSync(BUN, ['run', 'scripts/gen-skill-docs.ts'], { cwd: ROOT, stdio: 'pipe' });

    expect(fs.existsSync(path.join(ROOT, '.agents', 'skills', 'kstack', 'SKILL.md'))).toBe(true);

    for (const command of PUBLIC_ROUTED_COMMAND_NAMES) {
      expect(fs.existsSync(path.join(ROOT, '.agents', 'skills', 'kstack', command, 'SKILL.md'))).toBe(true);
    }

    for (const command of REMOVED_PUBLIC_COMMANDS) {
      expect(fs.existsSync(path.join(ROOT, '.agents', 'skills', 'kstack', command, 'SKILL.md'))).toBe(false);
    }

    expect(fs.existsSync(path.join(ROOT, '.agents', 'skills', 'codex'))).toBe(false);
    expect(fs.existsSync(path.join(ROOT, '.agents', 'skills', 'discover'))).toBe(false);

    const rootSkill = fs.readFileSync(path.join(ROOT, 'SKILL.md'), 'utf-8');
    expect(rootSkill).toContain('/kstack help');
    expect(rootSkill).toContain('If the user invokes `/kstack` with no subcommand');
    expect(rootSkill).toContain('/kstack discover');
    expect(rootSkill).toContain('/kstack sprint-freeze');
    expect(rootSkill).toContain('/kstack ingest-learning');
    expect(rootSkill).toContain('/kstack implement');
    expect(rootSkill).toContain('/kstack qa');
    expect(rootSkill).not.toContain('/kstack browse');
    expect(rootSkill).not.toContain('/kstack qa-only');
    expect(rootSkill).not.toContain('/kstack office-hours');
    expect(rootSkill).not.toContain('## Browse Command Reference');
    expect(rootSkill).not.toContain('## Snapshot Flags');
    expect(rootSkill).not.toContain('cookie-import-browser');
    expect(rootSkill).not.toContain('{{');
  });

  test('is fresh on dry run after generation', () => {
    execFileSync(BUN, ['run', 'scripts/gen-skill-docs.ts'], { cwd: ROOT, stdio: 'pipe' });
    expect(() => execFileSync(BUN, ['run', 'scripts/gen-skill-docs.ts', '--dry-run'], { cwd: ROOT, stdio: 'pipe' })).not.toThrow();
  });
});
