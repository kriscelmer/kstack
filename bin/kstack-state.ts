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
  checkBranchContractFreshness,
  exportBranchContract,
  changedFilesAgainstBase,
  createEmptyWorkflowState,
  detectBaseBranch,
  ensureWorkflowState,
  getRepoRoot,
  inferRoutingFromFiles,
  loadWorkflowState,
  readWorkflowState,
  readBranchContract,
  renderPullRequestBody,
  resolveDocToRegenerate,
  resolveWorkflowPaths,
  setEscalationStatus,
  setIntentRecord,
  setLensAssessment,
  setRoutingDecision,
  setSprintBrief,
  upsertFinding,
  validateWorkflowState,
  verifySelfHostingInvariants,
  writeWorkflowState,
  type DecisionRecord,
  type DeltaRecord,
  type FindingRecord,
  type IntentRecord,
  type LensAssessment,
  type RoutingDecision,
  type SprintBrief,
  type WorkflowStateV1,
  type WorkflowPaths,
} from '../lib/workflow-state';

function usage(): never {
  console.error(`Usage: kstack-state <command> [args]

Commands:
  path
  ensure
  show [field]
  summary
  export-contract [--check] [--branch <name>]
  export-pr [--branch <name>]
  ready [--json] [--branch <name>]
  verify-self-hosting
  merge <json-file|->
  set-intent <json-file|->
  set-sprint <json-file|->
  append-delta <json-file|->
  add-lens <lens> <json-file|->
  upsert-finding <json-file|->
  require-test <name>
  satisfy-test <name>
  add-doc <path>
  resolve-doc <path>
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

function parseReadyArgs(args: string[]): { asJson: boolean; branchOverride?: string } {
  let asJson = false;
  let branchOverride: string | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--json') {
      asJson = true;
      continue;
    }
    if (arg === '--branch') {
      branchOverride = args[index + 1] || usage();
      index += 1;
      continue;
    }
    usage();
  }

  return { asJson, branchOverride };
}

function parseBranchOverrideArgs(
  args: string[],
  opts: { allowCheck?: boolean } = {},
): { branchOverride?: string; checkOnly: boolean } {
  let branchOverride: string | undefined;
  let checkOnly = false;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (opts.allowCheck && arg === '--check') {
      checkOnly = true;
      continue;
    }
    if (arg === '--branch') {
      branchOverride = args[index + 1] || usage();
      index += 1;
      continue;
    }
    usage();
  }

  return { branchOverride, checkOnly };
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
  const defaultPaths = resolveWorkflowPaths(repoRoot);
  const source = `kstack-state.${command}`;

  switch (command) {
    case 'path': {
      console.log(defaultPaths.stateFile);
      return;
    }
    case 'ensure': {
      const state = ensureWorkflowState(defaultPaths);
      printJson({ state_file: defaultPaths.stateFile, schema_version: state.schema_version });
      return;
    }
    case 'show': {
      const state = loadWorkflowState(defaultPaths);
      if (rest[0]) {
        printJson(getByPath(state, rest[0]));
      } else {
        printJson(state);
      }
      return;
    }
    case 'summary': {
      const state = loadWorkflowState(defaultPaths);
      console.log(buildHumanSummary(state, defaultPaths));
      return;
    }
    case 'export-contract': {
      const { branchOverride, checkOnly } = parseBranchOverrideArgs(rest, { allowCheck: true });
      const paths = resolveWorkflowPaths(repoRoot, branchOverride);
      const state = loadWorkflowState(paths, { ensure: false });

      if (checkOnly) {
        const freshness = checkBranchContractFreshness(state, paths);
        printJson({
          branch: freshness.contract.branch,
          normalized_branch: freshness.contract.normalized_branch,
          ok: freshness.ok,
          missing_files: freshness.missing_files,
          stale_files: freshness.stale_files,
          contract_json: paths.contractJsonFile,
          contract_markdown: paths.contractMarkdownFile,
        });
        if (!freshness.ok) {
          process.exitCode = 1;
        }
        return;
      }

      const contract = exportBranchContract(state, paths);
      printJson({
        branch: contract.branch,
        status: contract.readiness.status,
        contract_json: paths.contractJsonFile,
        contract_markdown: paths.contractMarkdownFile,
      });
      return;
    }
    case 'export-pr': {
      const { branchOverride } = parseBranchOverrideArgs(rest);
      const paths = resolveWorkflowPaths(repoRoot, branchOverride);
      const state = readWorkflowState(paths);
      const contract = state ? exportBranchContract(state, paths) : readBranchContract(paths);
      if (!contract) {
        throw new Error(`No workflow state or branch contract found for ${paths.normalizedBranch}`);
      }
      process.stdout.write(renderPullRequestBody(contract));
      return;
    }
    case 'ready': {
      const { asJson, branchOverride } = parseReadyArgs(rest);
      const paths = resolveWorkflowPaths(repoRoot, branchOverride);
      const state = readWorkflowState(paths);
      const contract = state ? buildAndMaybeWriteContract(state, paths) : readBranchContract(paths);
      if (!contract) {
        throw new Error(`No workflow state or branch contract found for ${paths.normalizedBranch}`);
      }
      if (asJson) {
        printJson({
          branch: contract.branch,
          normalized_branch: contract.normalized_branch,
          status: contract.readiness.status,
          blockers: contract.readiness.blockers,
          requires_refreeze: contract.readiness.requires_refreeze,
          summary: contract.readiness.summary,
          contract_json: paths.contractJsonFile,
        });
      } else {
        const lines = [
          `Branch: ${contract.branch}`,
          `Status: ${contract.readiness.status}`,
          `Summary: ${contract.readiness.summary}`,
          ...(contract.readiness.blockers.length > 0 ? contract.readiness.blockers.map(item => `- ${item}`) : ['- No semantic blockers recorded.']),
        ];
        console.log(lines.join('\n'));
      }
      if (contract.readiness.status === 'blocked') {
        process.exitCode = 1;
      }
      return;
    }
    case 'verify-self-hosting': {
      const result = verifySelfHostingInvariants(repoRoot);
      printJson(result);
      if (!result.ok) {
        process.exitCode = 1;
      }
      return;
    }
    case 'reset': {
      const state = createEmptyWorkflowState([], source);
      writeWorkflowState(state, defaultPaths);
      printJson(state);
      return;
    }
    case 'merge': {
      const patch = await readJsonArg(rest[0] || usage());
      const state = loadWorkflowState(defaultPaths);
      const next = validateWorkflowState(deepMerge(state, patch));
      writeWorkflowState(next, defaultPaths);
      printJson(next);
      return;
    }
    case 'set-intent': {
      const intent = await readJsonArg(rest[0] || usage()) as IntentRecord;
      const state = loadWorkflowState(defaultPaths);
      setIntentRecord(state, intent, source);
      writeWorkflowState(state, defaultPaths);
      printJson(state.intent_record);
      return;
    }
    case 'set-sprint': {
      const sprint = await readJsonArg(rest[0] || usage()) as SprintBrief;
      const state = loadWorkflowState(defaultPaths);
      setSprintBrief(state, sprint, source);
      writeWorkflowState(state, defaultPaths);
      printJson(state.active_sprint_brief);
      return;
    }
    case 'append-delta': {
      const delta = await readJsonArg(rest[0] || usage()) as DeltaRecord;
      const state = loadWorkflowState(defaultPaths);
      appendDeltaRecord(state, delta, source);
      writeWorkflowState(state, defaultPaths);
      printJson(state.deltas_since_last_sprint[state.deltas_since_last_sprint.length - 1]);
      return;
    }
    case 'add-lens': {
      const lens = rest[0];
      const assessment = await readJsonArg(rest[1] || usage()) as LensAssessment;
      if (assessment.lens !== lens) {
        throw new Error(`Lens mismatch: arg "${lens}" does not match payload "${assessment.lens}"`);
      }
      const state = loadWorkflowState(defaultPaths);
      setLensAssessment(state, assessment, source);
      writeWorkflowState(state, defaultPaths);
      printJson(state.lens_assessments[assessment.lens]);
      return;
    }
    case 'upsert-finding': {
      const finding = await readJsonArg(rest[0] || usage()) as Omit<FindingRecord, 'id'> & { id?: string };
      const state = loadWorkflowState(defaultPaths);
      upsertFinding(state, finding, source);
      writeWorkflowState(state, defaultPaths);
      printJson(state.findings);
      return;
    }
    case 'require-test': {
      const name = rest.join(' ').trim();
      if (!name) usage();
      const state = loadWorkflowState(defaultPaths);
      addRequiredTest(state, name, source);
      writeWorkflowState(state, defaultPaths);
      printJson(state.tests_required);
      return;
    }
    case 'satisfy-test': {
      const name = rest.join(' ').trim();
      if (!name) usage();
      const state = loadWorkflowState(defaultPaths);
      addSatisfiedTest(state, name, source);
      writeWorkflowState(state, defaultPaths);
      printJson(state.tests_satisfied);
      return;
    }
    case 'add-doc': {
      const docPath = rest.join(' ').trim();
      if (!docPath) usage();
      const state = loadWorkflowState(defaultPaths);
      addDocToRegenerate(state, docPath, source);
      writeWorkflowState(state, defaultPaths);
      printJson(state.docs_to_regenerate);
      return;
    }
    case 'resolve-doc': {
      const docPath = rest.join(' ').trim();
      if (!docPath) usage();
      const state = loadWorkflowState(defaultPaths);
      resolveDocToRegenerate(state, docPath, source);
      writeWorkflowState(state, defaultPaths);
      printJson(state.docs_to_regenerate);
      return;
    }
    case 'add-assumption': {
      const assumption = rest.join(' ').trim();
      if (!assumption) usage();
      const state = loadWorkflowState(defaultPaths);
      addAssumption(state, assumption, source);
      writeWorkflowState(state, defaultPaths);
      printJson(state.assumptions);
      return;
    }
    case 'add-decision': {
      const kind = rest[0];
      if (kind !== 'accepted' && kind !== 'rejected') usage();
      const decision = await readJsonArg(rest[1] || usage()) as DecisionRecord;
      const state = loadWorkflowState(defaultPaths);
      addDecision(state, kind, decision, source);
      writeWorkflowState(state, defaultPaths);
      printJson(kind === 'accepted' ? state.accepted_decisions : state.rejected_options);
      return;
    }
    case 'set-routing': {
      const routing = await readJsonArg(rest[0] || usage()) as RoutingDecision;
      const state = loadWorkflowState(defaultPaths);
      setRoutingDecision(state, routing, source);
      writeWorkflowState(state, defaultPaths);
      printJson(state.routing);
      return;
    }
    case 'route': {
      if (rest[0] !== '--auto') usage();
      const baseRef = rest[1] || detectBaseBranch(repoRoot);
      const changedFiles = changedFilesAgainstBase(repoRoot, baseRef);
      const routing = inferRoutingFromFiles(changedFiles);
      const state = loadWorkflowState(defaultPaths);
      setRoutingDecision(state, routing, source);
      writeWorkflowState(state, defaultPaths);
      printJson({ base_ref: baseRef, changed_files: changedFiles, routing });
      return;
    }
    case 'set-escalation': {
      const status = rest[0];
      if (status !== 'none' && status !== 'watch' && status !== 'needs-human' && status !== 'blocked') usage();
      const state = loadWorkflowState(defaultPaths);
      setEscalationStatus(state, status, source);
      writeWorkflowState(state, defaultPaths);
      printJson({ escalation_status: state.escalation_status });
      return;
    }
    default:
      usage();
  }
}

function buildAndMaybeWriteContract(state: WorkflowStateV1, paths: WorkflowPaths) {
  return exportBranchContract(state, paths);
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
