import { describe, expect, test } from 'bun:test';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = path.resolve(import.meta.dir, '..');
const BUN = process.env.BUN_BIN || path.join(os.homedir(), '.bun', 'bin', 'bun');

describe('gen-skill-docs', () => {
  test('generates Codex-native skills and removes stale gstack skill dirs', () => {
    execFileSync(BUN, ['run', 'scripts/gen-skill-docs.ts'], { cwd: ROOT, stdio: 'pipe' });

    expect(fs.existsSync(path.join(ROOT, '.agents', 'skills', 'kstack', 'SKILL.md'))).toBe(true);
    expect(fs.existsSync(path.join(ROOT, '.agents', 'skills', 'kstack', 'discover', 'SKILL.md'))).toBe(true);
    expect(fs.existsSync(path.join(ROOT, '.agents', 'skills', 'kstack', 'sprint-freeze', 'SKILL.md'))).toBe(true);
    expect(fs.existsSync(path.join(ROOT, '.agents', 'skills', 'kstack', 'ingest-learning', 'SKILL.md'))).toBe(true);
    expect(fs.existsSync(path.join(ROOT, '.agents', 'skills', 'kstack', 'implement', 'SKILL.md'))).toBe(true);
    expect(fs.existsSync(path.join(ROOT, '.agents', 'skills', 'codex'))).toBe(false);
    expect(fs.existsSync(path.join(ROOT, '.agents', 'skills', 'discover'))).toBe(false);

    const rootSkill = fs.readFileSync(path.join(ROOT, 'SKILL.md'), 'utf-8');
    expect(rootSkill).toContain('/kstack help');
    expect(rootSkill).toContain('If the user invokes `/kstack` with no subcommand');
    expect(rootSkill).toContain('/kstack discover');
    expect(rootSkill).toContain('/kstack sprint-freeze');
    expect(rootSkill).toContain('/kstack ingest-learning');
    expect(rootSkill).toContain('/kstack implement');
    expect(rootSkill).not.toContain('{{');
  });

  test('is fresh on dry run after generation', () => {
    execFileSync(BUN, ['run', 'scripts/gen-skill-docs.ts'], { cwd: ROOT, stdio: 'pipe' });
    expect(() => execFileSync(BUN, ['run', 'scripts/gen-skill-docs.ts', '--dry-run'], { cwd: ROOT, stdio: 'pipe' })).not.toThrow();
  });
});
