import { describe, expect, test } from 'bun:test';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {
  appendDeltaRecord,
  buildBranchContract,
  createEmptyWorkflowState,
  evaluateReadiness,
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

  test('creates canonical state without legacy migration fallbacks', () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'kstack-state-'));

    const paths = resolveWorkflowPaths(repoRoot);
    const state = ensureWorkflowState(paths, 'test.ensure');

    expect(fs.existsSync(paths.stateFile)).toBe(true);
    expect(state.schema_version).toBe('workflow-state/v1');
    expect(state.provenance.migrated_from).toEqual([]);
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

  test('increments sprint revision and records the freeze timestamp', () => {
    let state = createEmptyWorkflowState([], 'test');
    state = setSprintBrief(state, {
      problem_statement: 'First sprint',
      in_scope_behavior: ['A'],
      out_of_scope_behavior: ['B'],
      acceptance_checks: ['C'],
      touched_surfaces: ['D'],
      tolerated_unresolved_questions: [],
      escalation_triggers: [],
      risk_level: 'medium',
    }, 'test.sprint.1');

    const firstFrozenAt = state.active_sprint_frozen_at;
    expect(state.active_sprint_revision).toBe(1);
    expect(typeof firstFrozenAt).toBe('string');

    state = setSprintBrief(state, {
      problem_statement: 'Second sprint',
      in_scope_behavior: ['A2'],
      out_of_scope_behavior: ['B2'],
      acceptance_checks: ['C2'],
      touched_surfaces: ['D2'],
      tolerated_unresolved_questions: [],
      escalation_triggers: [],
      risk_level: 'high',
    }, 'test.sprint.2');

    expect(state.active_sprint_revision).toBe(2);
    expect(typeof state.active_sprint_frozen_at).toBe('string');
    expect(state.active_sprint_frozen_at).not.toBeNull();
    expect(state.active_sprint_frozen_at! >= firstFrozenAt!).toBe(true);
  });

  test('blocks readiness when no sprint exists', () => {
    const state = createEmptyWorkflowState([], 'test');
    const readiness = evaluateReadiness(state);

    expect(readiness.status).toBe('blocked');
    expect(readiness.blockers[0]).toContain('No active sprint brief');
  });

  test('blocks readiness when post-freeze delta requires a re-freeze', () => {
    let state = createEmptyWorkflowState([], 'test');
    state = setSprintBrief(state, {
      problem_statement: 'Frozen sprint',
      in_scope_behavior: ['A'],
      out_of_scope_behavior: ['B'],
      acceptance_checks: ['C'],
      touched_surfaces: ['D'],
      tolerated_unresolved_questions: [],
      escalation_triggers: [],
      risk_level: 'medium',
    }, 'test.sprint');

    state = appendDeltaRecord(state, {
      timestamp: new Date(Date.now() + 1_000).toISOString(),
      what_changed: ['New architecture requirement'],
      what_was_learned: ['The change is broader than expected'],
      assumption_changed: ['Original scope was too narrow'],
      scope_impact: 'major',
      architecture_impact: 'major',
      risk_impact: 'high',
      recommended_next_mode: 'execution',
    }, 'test.delta');

    const readiness = evaluateReadiness(state);
    expect(readiness.status).toBe('blocked');
    expect(readiness.requires_refreeze).toBe(true);
  });

  test('classifies ready-for-review and ready-to-ship deterministically', () => {
    let state = createEmptyWorkflowState([], 'test');
    state = setSprintBrief(state, {
      problem_statement: 'QA pass',
      in_scope_behavior: ['A'],
      out_of_scope_behavior: ['B'],
      acceptance_checks: ['C'],
      touched_surfaces: ['D'],
      tolerated_unresolved_questions: [],
      escalation_triggers: [],
      risk_level: 'medium',
    }, 'test.sprint');
    state.tests_required.push('unit');
    state.tests_satisfied.push('unit');
    state.findings.push({
      id: 'finding-1',
      source: 'review',
      location: 'src/App.tsx',
      kind: 'copy',
      severity: 'low',
      evidence: 'Minor wording issue',
      status: 'open',
    });

    expect(evaluateReadiness(state).status).toBe('ready-for-review');

    state.findings[0] = { ...state.findings[0], status: 'fixed' };
    const readiness = evaluateReadiness(state);
    const contract = buildBranchContract(state, resolveWorkflowPaths(fs.mkdtempSync(path.join(os.tmpdir(), 'kstack-contract-')), 'feature/review'));

    expect(readiness.status).toBe('ready-to-ship');
    expect(contract.readiness.status).toBe('ready-to-ship');
    expect(contract.tests.missing).toHaveLength(0);
  });

  test('routes deterministically from changed files', () => {
    expect(inferRoutingFromFiles([]).mode).toBe('discovery');
    expect(inferRoutingFromFiles(['README.md']).mode).toBe('docs');
    expect(inferRoutingFromFiles(['src/App.tsx']).required_lenses).toContain('design');
    expect(inferRoutingFromFiles(['lib/server.ts', 'package.json']).required_lenses).toContain('architecture');
    expect(inferRoutingFromFiles(['security/policy.ts']).required_lenses).toContain('security');
  });
});
