import { beforeEach, describe, expect, test } from 'bun:test';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { execFileSync } from 'node:child_process';

const BUN = process.env.BUN_BIN || path.join(os.homedir(), '.bun', 'bin', 'bun');

function run(args: string[], cwd: string): string {
  return execFileSync(BUN, ['run', path.join(process.cwd(), 'bin/kstack-state.ts'), ...args], {
    cwd,
    encoding: 'utf-8',
  });
}

describe('kstack-state cli', () => {
  let repoRoot = '';

  beforeEach(() => {
    repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'kstack-cli-'));
    execFileSync('git', ['init', '-b', 'main'], { cwd: repoRoot });
    execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: repoRoot });
    execFileSync('git', ['config', 'user.name', 'Test User'], { cwd: repoRoot });
    fs.writeFileSync(path.join(repoRoot, 'README.md'), 'seed\n');
    execFileSync('git', ['add', 'README.md'], { cwd: repoRoot });
    execFileSync('git', ['commit', '-m', 'seed'], { cwd: repoRoot });
    execFileSync('git', ['checkout', '-b', 'feature/ui-refresh'], { cwd: repoRoot });
    fs.mkdirSync(path.join(repoRoot, 'src'), { recursive: true });
    fs.writeFileSync(path.join(repoRoot, 'src', 'App.tsx'), 'export const App = () => null;\n');
    execFileSync('git', ['add', 'src/App.tsx'], { cwd: repoRoot });
    execFileSync('git', ['commit', '-m', 'ui refresh'], { cwd: repoRoot });
  });

  test('ensures state and supports intent, sprint, delta, and auto-route operations', () => {
    const intentFile = path.join(repoRoot, 'intent.json');
    const sprintFile = path.join(repoRoot, 'sprint.json');
    const deltaFile = path.join(repoRoot, 'delta.json');

    fs.writeFileSync(intentFile, JSON.stringify({
      raw_request: 'Refactor to canonical state',
      user_pain_examples: ['Old plans drift'],
      goals: ['State-native workflow'],
      non_goals: ['Claude compatibility'],
      constraints: ['Keep browser QA'],
      hypotheses: ['Branch-local state is enough'],
      candidate_wedges: ['discover', 'sprint-freeze'],
      open_questions: ['none'],
      provenance: [{ source: 'test', timestamp: new Date().toISOString() }],
    }));

    fs.writeFileSync(sprintFile, JSON.stringify({
      problem_statement: 'Planning drift',
      in_scope_behavior: ['Canonical branch state'],
      out_of_scope_behavior: ['Cross-host support'],
      acceptance_checks: ['CLI updates state'],
      touched_surfaces: ['lib', 'bin'],
      tolerated_unresolved_questions: [],
      escalation_triggers: ['build breakage'],
      risk_level: 'medium',
    }));

    fs.writeFileSync(deltaFile, JSON.stringify({
      timestamp: new Date().toISOString(),
      what_changed: ['Introduced wrappers'],
      what_was_learned: ['Wrappers can share state'],
      assumption_changed: ['Need only one canonical file'],
      scope_impact: 'minor',
      architecture_impact: 'minor',
      risk_impact: 'low',
      recommended_next_mode: 'execution',
    }));

    expect(run(['ensure'], repoRoot)).toContain('.kstack/state/');
    run(['set-intent', intentFile], repoRoot);
    run(['set-sprint', sprintFile], repoRoot);
    run(['append-delta', deltaFile], repoRoot);
    const routeOutput = run(['route', '--auto', 'main'], repoRoot);
    const summary = run(['summary'], repoRoot);

    expect(routeOutput).toContain('execution');
    expect(summary).toContain('feature-ui-refresh');
    expect(summary).toContain('execution');
    expect(summary).toContain('Tests: 0/0 satisfied');
  });
});
