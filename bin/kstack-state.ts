#!/usr/bin/env bun

import * as fs from 'fs';
import * as path from 'path';
import {
  addDecision,
  addDocToRegenerate,
  addRequiredTest,
  addSatisfiedTest,
  addAssumption,
  appendDeltaRecord,
  buildHumanSummary,
  changedFilesAgainstBase,
  createEmptyWorkflowState,
  detectBaseBranch,
  ensureWorkflowState,
  getRepoRoot,
  inferRoutingFromFiles,
  loadWorkflowState,
  resolveWorkflowPaths,
  setEscalationStatus,
  setIntentRecord,
  setLensAssessment,
  setRoutingDecision,
  setSprintBrief,
  upsertFinding,
  validateWorkflowState,
  writeWorkflowState,
  type DecisionRecord,
  type DeltaRecord,
  type FindingRecord,
  type IntentRecord,
  type LensAssessment,
  type RoutingDecision,
  type SprintBrief,
  type WorkflowStateV1,
} from '../lib/workflow-state';

function usage(): never {
  console.error(`Usage: kstack-state <command> [args]

Commands:
  path
  ensure
  show [field]
  summary
  merge <json-file|->
  set-intent <json-file|->
  set-sprint <json-file|->
  append-delta <json-file|->
  add-lens <lens> <json-file|->
  upsert-finding <json-file|->
  require-test <name>
  satisfy-test <name>
  add-doc <path>
  add-assumption <text>
  add-decision <accepted|rejected> <json-file|->
  set-routing <json-file|->
  route --auto [base-ref]
  set-escalation <none|watch|needs-human|blocked>
  reset
`);
  process.exit(1);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function readJsonArg(arg: string): Promise<unknown> {
  const raw = arg === '-'
    ? await Bun.stdin.text()
    : fs.readFileSync(path.resolve(arg), 'utf-8');
  return JSON.parse(raw);
}

function printJson(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function getByPath(root: unknown, fieldPath: string): unknown {
  const segments = fieldPath.split('.').filter(Boolean);
  let current = root;
  for (const segment of segments) {
    if (!isRecord(current) && !Array.isArray(current)) return undefined;
    current = (current as any)[segment];
  }
  return current;
}

function deepMerge(target: unknown, patch: unknown): unknown {
  if (Array.isArray(target) && Array.isArray(patch)) {
    return patch;
  }
  if (isRecord(target) && isRecord(patch)) {
    const merged: Record<string, unknown> = { ...target };
    for (const [key, value] of Object.entries(patch)) {
      merged[key] = key in merged ? deepMerge(merged[key], value) : value;
    }
    return merged;
  }
  return patch;
}

async function main(): Promise<void> {
  const [command, ...rest] = process.argv.slice(2);
  if (!command) usage();

  const repoRoot = getRepoRoot();
  const paths = resolveWorkflowPaths(repoRoot);
  const source = `kstack-state.${command}`;

  switch (command) {
    case 'path': {
      console.log(paths.stateFile);
      return;
    }
    case 'ensure': {
      const state = ensureWorkflowState(paths);
      printJson({ state_file: paths.stateFile, schema_version: state.schema_version });
      return;
    }
    case 'show': {
      const state = loadWorkflowState(paths);
      if (rest[0]) {
        printJson(getByPath(state, rest[0]));
      } else {
        printJson(state);
      }
      return;
    }
    case 'summary': {
      const state = loadWorkflowState(paths);
      console.log(buildHumanSummary(state, paths));
      return;
    }
    case 'reset': {
      const state = createEmptyWorkflowState([], source);
      writeWorkflowState(state, paths);
      printJson(state);
      return;
    }
    case 'merge': {
      const patch = await readJsonArg(rest[0] || usage());
      const state = loadWorkflowState(paths);
      const next = validateWorkflowState(deepMerge(state, patch));
      writeWorkflowState(next, paths);
      printJson(next);
      return;
    }
    case 'set-intent': {
      const intent = await readJsonArg(rest[0] || usage()) as IntentRecord;
      const state = loadWorkflowState(paths);
      setIntentRecord(state, intent, source);
      writeWorkflowState(state, paths);
      printJson(state.intent_record);
      return;
    }
    case 'set-sprint': {
      const sprint = await readJsonArg(rest[0] || usage()) as SprintBrief;
      const state = loadWorkflowState(paths);
      setSprintBrief(state, sprint, source);
      writeWorkflowState(state, paths);
      printJson(state.active_sprint_brief);
      return;
    }
    case 'append-delta': {
      const delta = await readJsonArg(rest[0] || usage()) as DeltaRecord;
      const state = loadWorkflowState(paths);
      appendDeltaRecord(state, delta, source);
      writeWorkflowState(state, paths);
      printJson(state.deltas_since_last_sprint[state.deltas_since_last_sprint.length - 1]);
      return;
    }
    case 'add-lens': {
      const lens = rest[0];
      const assessment = await readJsonArg(rest[1] || usage()) as LensAssessment;
      if (assessment.lens !== lens) {
        throw new Error(`Lens mismatch: arg "${lens}" does not match payload "${assessment.lens}"`);
      }
      const state = loadWorkflowState(paths);
      setLensAssessment(state, assessment, source);
      writeWorkflowState(state, paths);
      printJson(state.lens_assessments[assessment.lens]);
      return;
    }
    case 'upsert-finding': {
      const finding = await readJsonArg(rest[0] || usage()) as Omit<FindingRecord, 'id'> & { id?: string };
      const state = loadWorkflowState(paths);
      upsertFinding(state, finding, source);
      writeWorkflowState(state, paths);
      printJson(state.findings);
      return;
    }
    case 'require-test': {
      const name = rest.join(' ').trim();
      if (!name) usage();
      const state = loadWorkflowState(paths);
      addRequiredTest(state, name, source);
      writeWorkflowState(state, paths);
      printJson(state.tests_required);
      return;
    }
    case 'satisfy-test': {
      const name = rest.join(' ').trim();
      if (!name) usage();
      const state = loadWorkflowState(paths);
      addSatisfiedTest(state, name, source);
      writeWorkflowState(state, paths);
      printJson(state.tests_satisfied);
      return;
    }
    case 'add-doc': {
      const docPath = rest.join(' ').trim();
      if (!docPath) usage();
      const state = loadWorkflowState(paths);
      addDocToRegenerate(state, docPath, source);
      writeWorkflowState(state, paths);
      printJson(state.docs_to_regenerate);
      return;
    }
    case 'add-assumption': {
      const assumption = rest.join(' ').trim();
      if (!assumption) usage();
      const state = loadWorkflowState(paths);
      addAssumption(state, assumption, source);
      writeWorkflowState(state, paths);
      printJson(state.assumptions);
      return;
    }
    case 'add-decision': {
      const kind = rest[0];
      if (kind !== 'accepted' && kind !== 'rejected') usage();
      const decision = await readJsonArg(rest[1] || usage()) as DecisionRecord;
      const state = loadWorkflowState(paths);
      addDecision(state, kind, decision, source);
      writeWorkflowState(state, paths);
      printJson(kind === 'accepted' ? state.accepted_decisions : state.rejected_options);
      return;
    }
    case 'set-routing': {
      const routing = await readJsonArg(rest[0] || usage()) as RoutingDecision;
      const state = loadWorkflowState(paths);
      setRoutingDecision(state, routing, source);
      writeWorkflowState(state, paths);
      printJson(state.routing);
      return;
    }
    case 'route': {
      if (rest[0] !== '--auto') usage();
      const baseRef = rest[1] || detectBaseBranch(repoRoot);
      const changedFiles = changedFilesAgainstBase(repoRoot, baseRef);
      const routing = inferRoutingFromFiles(changedFiles);
      const state = loadWorkflowState(paths);
      setRoutingDecision(state, routing, source);
      writeWorkflowState(state, paths);
      printJson({ base_ref: baseRef, changed_files: changedFiles, routing });
      return;
    }
    case 'set-escalation': {
      const status = rest[0];
      if (status !== 'none' && status !== 'watch' && status !== 'needs-human' && status !== 'blocked') usage();
      const state = loadWorkflowState(paths);
      setEscalationStatus(state, status, source);
      writeWorkflowState(state, paths);
      printJson({ escalation_status: state.escalation_status });
      return;
    }
    default:
      usage();
  }
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
