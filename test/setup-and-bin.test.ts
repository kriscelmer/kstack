import { describe, expect, test } from 'bun:test';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = path.resolve(import.meta.dir, '..');
const BUN = process.env.BUN_BIN || path.join(os.homedir(), '.bun', 'bin', 'bun');

describe('setup and bin compatibility', () => {
  test('setup installs into Codex skill directories and uninstall removes it', () => {
    execFileSync(BUN, ['run', 'scripts/gen-skill-docs.ts'], { cwd: ROOT, stdio: 'pipe' });

    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'kstack-home-'));
    const codexHome = path.join(home, '.codex');

    execFileSync('bash', ['setup', '--codex-home', codexHome, '--force'], {
      cwd: ROOT,
      env: { ...process.env, HOME: home, KSTACK_SKIP_BUILD: '1', BUN_BIN: BUN },
      stdio: 'pipe',
    });

    expect(fs.existsSync(path.join(codexHome, 'skills', 'kstack'))).toBe(true);
    expect(fs.existsSync(path.join(codexHome, 'skills', 'discover'))).toBe(false);
    expect(fs.existsSync(path.join(home, '.kstack'))).toBe(true);

    execFileSync('bash', ['bin/kstack-uninstall', '--force'], {
      cwd: ROOT,
      env: { ...process.env, HOME: home, KSTACK_STATE_DIR: path.join(home, '.kstack') },
      stdio: 'pipe',
    });

    expect(fs.existsSync(path.join(codexHome, 'skills', 'kstack'))).toBe(false);
  });

  test('kstack-init bootstraps repo-local AGENTS instructions, state, and unborn main', () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'kstack-init-'));
    execFileSync('git', ['init', '-b', 'trunk'], { cwd: repoRoot });
    execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: repoRoot });
    execFileSync('git', ['config', 'user.name', 'Test User'], { cwd: repoRoot });

    const output = execFileSync(BUN, ['run', path.join(ROOT, 'bin/kstack-init.ts')], {
      cwd: repoRoot,
      encoding: 'utf-8',
    });
    const parsed = JSON.parse(output);
    const branch = execFileSync('git', ['symbolic-ref', '--short', 'HEAD'], { cwd: repoRoot, encoding: 'utf-8' }).trim();

    expect(fs.existsSync(path.join(repoRoot, '.kstack', 'state'))).toBe(true);
    expect(fs.existsSync(path.join(repoRoot, 'AGENTS.md'))).toBe(true);
    const agents = fs.readFileSync(path.join(repoRoot, 'AGENTS.md'), 'utf-8');
    expect(agents).toContain('<!-- KSTACK:BEGIN -->');
    expect(agents).toContain('/kstack implement');
    expect(branch).toBe('main');
    expect(parsed.branch).toBe('main');
    expect(parsed.normalized_branch).toBe('main');
    expect(parsed.initialized_main_branch).toBe(true);
    expect(parsed.state_file).toContain(path.join('.kstack', 'state', 'main.json'));
    expect(parsed.next_steps).toEqual(['/kstack discover', '/kstack sprint-freeze', '/kstack implement']);
  });

  test('config and review log wrappers read the same state', () => {
    const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kstack-config-'));
    execFileSync('bash', ['bin/kstack-config', 'set', 'skill_prefix', 'false'], {
      cwd: ROOT,
      env: { ...process.env, KSTACK_STATE_DIR: stateDir },
      stdio: 'pipe',
    });
    const direct = execFileSync('bash', ['bin/kstack-config', 'get', 'skill_prefix'], {
      cwd: ROOT,
      env: { ...process.env, KSTACK_STATE_DIR: stateDir },
      encoding: 'utf-8',
    }).trim();
    const wrapped = execFileSync('bash', ['bin/gstack-config', 'get', 'skill_prefix'], {
      cwd: ROOT,
      env: { ...process.env, GSTACK_STATE_DIR: stateDir },
      encoding: 'utf-8',
    }).trim();

    expect(direct).toBe('false');
    expect(wrapped).toBe('false');
  });

  test('review log writes branch-local records and review-read returns them', () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'kstack-review-'));
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'kstack-review-home-'));
    execFileSync('git', ['init', '-b', 'main'], { cwd: repoRoot });
    execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: repoRoot });
    execFileSync('git', ['config', 'user.name', 'Test User'], { cwd: repoRoot });
    fs.writeFileSync(path.join(repoRoot, 'README.md'), 'seed\n');
    execFileSync('git', ['add', 'README.md'], { cwd: repoRoot });
    execFileSync('git', ['commit', '-m', 'seed'], { cwd: repoRoot });
    execFileSync('git', ['remote', 'add', 'origin', 'git@github.com:example/kstack.git'], { cwd: repoRoot });

    execFileSync('bash', [path.join(ROOT, 'bin/kstack-review-log'), '{"skill":"review","status":"ok"}'], {
      cwd: repoRoot,
      env: { ...process.env, HOME: home },
      stdio: 'pipe',
    });

    const output = execFileSync('bash', [path.join(ROOT, 'bin/kstack-review-read')], {
      cwd: repoRoot,
      env: { ...process.env, HOME: home },
      encoding: 'utf-8',
    });

    expect(output).toContain('"skill":"review"');
    expect(output).toContain('---HEAD---');
  });
});
