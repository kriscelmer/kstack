import { describe, expect, test } from 'bun:test';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {
  appendDeltaRecord,
  createEmptyWorkflowState,
  ensureWorkflowState,
  getCurrentBranch,
  inferRoutingFromFiles,
  normalizeBranchName,
  resolveWorkflowPaths,
  setIntentRecord,
  setSprintBrief,
  upsertFinding,
} from '../lib/workflow-state';

describe('workflow-state', () => {
  test('normalizes branch names predictably', () => {
    expect(normalizeBranchName('feature/hello world')).toBe('feature-hello-world');
    expect(normalizeBranchName('refs/heads/main')).toBe('main');
    expect(normalizeBranchName('HEAD')).toBe('detached-head');
  });

  test('reads symbolic unborn branch names before first commit', () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'kstack-unborn-'));
    Bun.spawnSync(['git', 'init', '-b', 'trunk'], { cwd: repoRoot, stdout: 'pipe', stderr: 'pipe' });

    expect(getCurrentBranch(repoRoot)).toBe('trunk');
  });

  test('creates canonical state and records legacy migration sources', () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'kstack-state-'));
    fs.mkdirSync(path.join(repoRoot, '.gstack'), { recursive: true });
    fs.writeFileSync(path.join(repoRoot, '.gstack', 'browse.json'), '{}');

    const paths = resolveWorkflowPaths(repoRoot);
    const state = ensureWorkflowState(paths, 'test.ensure');

    expect(fs.existsSync(paths.stateFile)).toBe(true);
    expect(state.schema_version).toBe('workflow-state/v1');
    expect(state.provenance.migrated_from).toContain(path.join(repoRoot, '.gstack', 'browse.json'));
  });

  test('updates intent, sprint, delta, and findings in one canonical object', () => {
    let state = createEmptyWorkflowState([], 'test');
    state = setIntentRecord(state, {
      raw_request: 'Make QA state-native',
      user_pain_examples: ['Findings are split across logs'],
      goals: ['Unify state'],
      non_goals: ['Support multiple hosts'],
      constraints: ['Keep browse runtime'],
      hypotheses: ['One state file reduces drift'],
      candidate_wedges: ['Discovery plus sprint freeze'],
      open_questions: ['How much legacy compatibility remains?'],
      provenance: [{ source: 'test', timestamp: new Date().toISOString() }],
    }, 'test.intent');

    state = setSprintBrief(state, {
      problem_statement: 'Workflow truth is fragmented.',
      in_scope_behavior: ['Add canonical state'],
      out_of_scope_behavior: ['Rebuild unrelated tooling'],
      acceptance_checks: ['State file exists', 'Skills use it'],
      touched_surfaces: ['bin', 'docs', 'skills'],
      tolerated_unresolved_questions: ['None'],
      escalation_triggers: ['Missing build parity'],
      risk_level: 'medium',
    }, 'test.sprint');

    state = appendDeltaRecord(state, {
      timestamp: new Date().toISOString(),
      what_changed: ['Removed old review ritual'],
      what_was_learned: ['Canonical state is enough'],
      assumption_changed: ['Legacy wrappers can be thin'],
      scope_impact: 'minor',
      architecture_impact: 'minor',
      risk_impact: 'medium',
      recommended_next_mode: 'execution',
    }, 'test.delta');

    state = upsertFinding(state, {
      id: 'review-1',
      source: 'review',
      location: 'README.md',
      kind: 'doc-drift',
      severity: 'medium',
      evidence: 'Old command names remained.',
      status: 'open',
      linked_sprint: 'active',
    }, 'test.finding');

    state = upsertFinding(state, {
      id: 'review-1',
      source: 'review',
      location: 'README.md',
      kind: 'doc-drift',
      severity: 'low',
      evidence: 'Fixed.',
      status: 'fixed',
      linked_sprint: 'active',
    }, 'test.finding.fixed');

    expect(state.intent_record?.raw_request).toBe('Make QA state-native');
    expect(state.active_sprint_brief?.problem_statement).toContain('fragmented');
    expect(state.deltas_since_last_sprint).toHaveLength(1);
    expect(state.findings).toHaveLength(1);
    expect(state.findings[0]?.status).toBe('fixed');
  });

  test('routes deterministically from changed files', () => {
    expect(inferRoutingFromFiles([]).mode).toBe('discovery');
    expect(inferRoutingFromFiles(['README.md']).mode).toBe('docs');
    expect(inferRoutingFromFiles(['src/App.tsx']).required_lenses).toContain('design');
    expect(inferRoutingFromFiles(['lib/server.ts', 'package.json']).required_lenses).toContain('architecture');
    expect(inferRoutingFromFiles(['security/policy.ts']).required_lenses).toContain('security');
  });
});
