import { describe, expect, test } from 'bun:test';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { execFileSync } from 'node:child_process';
import { validateWorkflowState } from '../lib/workflow-state';

const ROOT = path.resolve(import.meta.dir, '..');
const BUN = process.env.BUN_BIN || path.join(os.homedir(), '.bun', 'bin', 'bun');

function run(args: string[], cwd: string, expectSuccess = true): string {
  try {
    return execFileSync(BUN, ['run', path.join(ROOT, 'bin/kstack-state.ts'), ...args], {
      cwd,
      encoding: 'utf-8',
      stdio: 'pipe',
    });
  } catch (error) {
    if (!expectSuccess && error && typeof error === 'object' && 'stdout' in error) {
      return String((error as { stdout?: Buffer | string }).stdout || '');
    }
    throw error;
  }
}

describe('self-hosting bootstrap state', () => {
  test('the committed main state and main contract exist and validate in the repo itself', () => {
    const statePath = path.join(ROOT, '.kstack', 'state', 'main.json');
    const contractJsonPath = path.join(ROOT, '.kstack', 'contracts', 'main.json');
    const contractMarkdownPath = path.join(ROOT, '.kstack', 'contracts', 'main.md');

    expect(fs.existsSync(statePath)).toBe(true);
    expect(fs.existsSync(contractJsonPath)).toBe(true);
    expect(fs.existsSync(contractMarkdownPath)).toBe(true);

    const validated = validateWorkflowState(JSON.parse(fs.readFileSync(statePath, 'utf-8')));
    const shown = JSON.parse(run(['show'], ROOT));
    const summary = run(['summary'], ROOT);
    const contractCheck = JSON.parse(run(['export-contract', '--check', '--branch', 'main'], ROOT));
    const invariantCheck = JSON.parse(run(['verify-self-hosting'], ROOT));
    const contractJson = JSON.parse(fs.readFileSync(contractJsonPath, 'utf-8'));

    expect(validated.schema_version).toBe('workflow-state/v1');
    expect(validated.intent_record?.raw_request).toContain('self-hosted KStack release');
    expect(validated.tests_required).toContain('bun run build');
    expect(validated.tests_satisfied).toContain('bin/kstack-state verify-self-hosting');
    expect(validated.docs_to_regenerate).toEqual([]);
    expect(shown.schema_version).toBe('workflow-state/v1');
    expect(summary).toContain(path.join('.kstack', 'state', 'main.json'));
    expect(summary).toContain('Readiness: ready-to-ship');
    expect(contractCheck.ok).toBe(true);
    expect(invariantCheck.ok).toBe(true);
    expect(contractJson.schema_version).toBe('branch-contract/v1');
    expect(contractJson.state_file).toBe('.kstack/state/main.json');
    expect(contractJson.readiness.status).toBe('ready-to-ship');
  });

  test('self-hosting invariants fail on main when extra raw branch state is present', () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'kstack-self-hosting-'));
    execFileSync('git', ['init', '-b', 'main'], { cwd: repoRoot, stdio: 'pipe' });

    fs.mkdirSync(path.join(repoRoot, '.kstack', 'state'), { recursive: true });
    fs.mkdirSync(path.join(repoRoot, '.kstack', 'contracts'), { recursive: true });
    fs.copyFileSync(path.join(ROOT, '.kstack', 'state', 'main.json'), path.join(repoRoot, '.kstack', 'state', 'main.json'));
    fs.copyFileSync(path.join(ROOT, '.kstack', 'contracts', 'main.json'), path.join(repoRoot, '.kstack', 'contracts', 'main.json'));
    fs.copyFileSync(path.join(ROOT, '.kstack', 'contracts', 'main.md'), path.join(repoRoot, '.kstack', 'contracts', 'main.md'));
    fs.writeFileSync(path.join(repoRoot, '.kstack', 'state', 'feature-v1-cleanup.json'), '{}\n');

    const result = JSON.parse(run(['verify-self-hosting'], repoRoot, false));
    expect(result.ok).toBe(false);
    expect(result.errors.join(' ')).toContain('extra raw branch state files');
  });
});
