import * as crypto from 'crypto';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { upsertKstackGitignore } from './kstack-gitignore';

export const WORKFLOW_SCHEMA_VERSION = 'workflow-state/v1';
export const BRANCH_CONTRACT_SCHEMA_VERSION = 'branch-contract/v1';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type EscalationStatus = 'none' | 'watch' | 'needs-human' | 'blocked';
export type RoutingMode = 'discovery' | 'execution' | 'docs' | 'review' | 'qa' | 'security';
export type LensName = 'product' | 'architecture' | 'design' | 'security';
export type FindingStatus = 'open' | 'accepted' | 'fixed' | 'deferred' | 'duplicate';
export type ReadinessStatus = 'draft' | 'ready-for-review' | 'ready-to-ship' | 'blocked';

export interface ProvenanceEntry {
  source: string;
  timestamp: string;
  note?: string;
}

export interface WorkflowProvenance {
  created_at: string;
  updated_at: string;
  migrated_from: string[];
  sources: ProvenanceEntry[];
}

export interface DecisionRecord {
  title: string;
  rationale: string;
  source: string;
  timestamp: string;
}

export interface IntentRecord {
  raw_request: string;
  user_pain_examples: string[];
  goals: string[];
  non_goals: string[];
  constraints: string[];
  hypotheses: string[];
  candidate_wedges: string[];
  open_questions: string[];
  provenance: ProvenanceEntry[];
}

export interface SprintBrief {
  problem_statement: string;
  in_scope_behavior: string[];
  out_of_scope_behavior: string[];
  acceptance_checks: string[];
  touched_surfaces: string[];
  tolerated_unresolved_questions: string[];
  escalation_triggers: string[];
  risk_level: RiskLevel;
}

export interface DeltaRecord {
  timestamp: string;
  what_changed: string[];
  what_was_learned: string[];
  assumption_changed: string[];
  scope_impact: 'none' | 'minor' | 'major';
  architecture_impact: 'none' | 'minor' | 'major';
  risk_impact: RiskLevel;
  recommended_next_mode: RoutingMode;
}

export interface FindingRecord {
  id: string;
  source: string;
  location: string;
  kind: string;
  severity: RiskLevel;
  evidence: string;
  status: FindingStatus;
  duplicate_of?: string;
  linked_sprint?: string;
}

export interface LensAssessment {
  lens: LensName;
  summary: string;
  concerns: string[];
  recommendations: string[];
  risk_level: RiskLevel;
  updated_at: string;
}

export interface RoutingDecision {
  mode: RoutingMode;
  change_type: 'unknown' | 'docs' | 'bugfix' | 'ui' | 'security' | 'architecture';
  required_lenses: LensName[];
  reason: string;
}

export interface WorkflowStateV1 {
  schema_version: typeof WORKFLOW_SCHEMA_VERSION;
  intent_record: IntentRecord | null;
  active_sprint_brief: SprintBrief | null;
  active_sprint_revision: number;
  active_sprint_frozen_at: string | null;
  lens_assessments: Partial<Record<LensName, LensAssessment>>;
  accepted_decisions: DecisionRecord[];
  rejected_options: DecisionRecord[];
  assumptions: string[];
  deltas_since_last_sprint: DeltaRecord[];
  findings: FindingRecord[];
  tests_required: string[];
  tests_satisfied: string[];
  docs_to_regenerate: string[];
  risk_level: RiskLevel;
  routing: RoutingDecision;
  escalation_status: EscalationStatus;
  provenance: WorkflowProvenance;
}

export interface ReadinessEvaluation {
  status: ReadinessStatus;
  blockers: string[];
  requires_refreeze: boolean;
  has_assurance_evidence: boolean;
  summary: string;
}

export interface BranchContractV1 {
  schema_version: typeof BRANCH_CONTRACT_SCHEMA_VERSION;
  workflow_schema_version: typeof WORKFLOW_SCHEMA_VERSION;
  branch: string;
  normalized_branch: string;
  generated_at: string;
  state_file: string;
  intent: {
    present: boolean;
    raw_request: string | null;
    goals: string[];
    non_goals: string[];
    constraints: string[];
    candidate_wedges: string[];
    open_questions: string[];
  };
  sprint: {
    present: boolean;
    revision: number;
    frozen_at: string | null;
    problem_statement: string | null;
    in_scope_behavior: string[];
    out_of_scope_behavior: string[];
    acceptance_checks: string[];
    touched_surfaces: string[];
    tolerated_unresolved_questions: string[];
    escalation_triggers: string[];
    risk_level: RiskLevel | null;
  };
  routing: RoutingDecision;
  risk_level: RiskLevel;
  tests: {
    required: string[];
    satisfied: string[];
    missing: string[];
  };
  docs: {
    queued: string[];
  };
  findings: {
    total: number;
    open: number;
    blockers: number;
    open_by_severity: Record<RiskLevel, number>;
    items: Array<{
      id: string;
      source: string;
      location: string;
      kind: string;
      severity: RiskLevel;
      status: FindingStatus;
    }>;
  };
  deltas_since_freeze: {
    count: number;
    latest_timestamp: string | null;
    requires_refreeze: boolean;
    items: Array<{
      timestamp: string;
      scope_impact: DeltaRecord['scope_impact'];
      architecture_impact: DeltaRecord['architecture_impact'];
      risk_impact: RiskLevel;
      recommended_next_mode: RoutingMode;
      what_changed: string[];
      what_was_learned: string[];
      assumption_changed: string[];
      requires_refreeze: boolean;
    }>;
  };
  readiness: ReadinessEvaluation;
  pr: {
    recommendation: ReadinessStatus;
  };
}

export interface BranchContractFreshnessCheck {
  ok: boolean;
  contract: BranchContractV1;
  expected_json: string;
  expected_markdown: string;
  missing_files: string[];
  stale_files: string[];
}

export interface SelfHostingInvariantCheck {
  ok: boolean;
  current_branch: string;
  main_state_file: string;
  main_contract_json: string;
  main_contract_markdown: string;
  raw_state_files: string[];
  errors: string[];
  warnings: string[];
}

export interface WorkflowPaths {
  repoRoot: string;
  branch: string;
  normalizedBranch: string;
  stateRoot: string;
  stateDir: string;
  reportsDir: string;
  contractsDir: string;
  stateFile: string;
  contractJsonFile: string;
  contractMarkdownFile: string;
  globalStateDir: string;
}

function runGit(args: string[], cwd: string): string {
  try {
    const proc = Bun.spawnSync(['git', ...args], {
      cwd,
      stdout: 'pipe',
      stderr: 'pipe',
      timeout: 3000,
    });
    if (proc.exitCode !== 0) return '';
    return proc.stdout.toString().trim();
  } catch {
    return '';
  }
}

export function normalizeBranchName(branch: string): string {
  const cleaned = branch
    .replace(/^refs\/heads\//, '')
    .replace(/[^\w.-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  if (!cleaned || cleaned === 'HEAD') {
    return 'detached-head';
  }
  return cleaned;
}

export function getRepoRoot(startDir: string = process.cwd()): string {
  return runGit(['rev-parse', '--show-toplevel'], startDir) || startDir;
}

export function getCurrentBranch(repoRoot: string = getRepoRoot()): string {
  const symbolic = runGit(['symbolic-ref', '--quiet', '--short', 'HEAD'], repoRoot);
  if (symbolic) return symbolic;
  return runGit(['rev-parse', '--abbrev-ref', 'HEAD'], repoRoot) || 'detached-head';
}

export function getRemoteSlug(repoRoot: string = getRepoRoot()): string {
  const remote = runGit(['remote', 'get-url', 'origin'], repoRoot);
  if (!remote) return path.basename(repoRoot);

  const match = remote.match(/[:/]([^/]+)\/([^/]+?)(?:\.git)?$/);
  if (!match) return path.basename(repoRoot);
  return `${match[1]}-${match[2]}`.replace(/[^\w.-]+/g, '-');
}

export function resolveWorkflowPaths(repoRoot: string = getRepoRoot(), branchOverride?: string): WorkflowPaths {
  const branch = branchOverride || getCurrentBranch(repoRoot);
  const normalizedBranch = normalizeBranchName(branch);
  const stateRoot = path.join(repoRoot, '.kstack');
  const stateDir = path.join(stateRoot, 'state');
  const reportsDir = path.join(stateRoot, 'reports');
  const contractsDir = path.join(stateRoot, 'contracts');
  const globalStateDir = path.join(os.homedir(), '.kstack');
  return {
    repoRoot,
    branch,
    normalizedBranch,
    stateRoot,
    stateDir,
    reportsDir,
    contractsDir,
    stateFile: path.join(stateDir, `${normalizedBranch}.json`),
    contractJsonFile: path.join(contractsDir, `${normalizedBranch}.json`),
    contractMarkdownFile: path.join(contractsDir, `${normalizedBranch}.md`),
    globalStateDir,
  };
}

function now(): string {
  return new Date().toISOString();
}

function repoRelativePath(repoRoot: string, targetPath: string): string {
  const relative = path.relative(repoRoot, targetPath);
  return relative.split(path.sep).join('/');
}

function serializeJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function defaultRouting(): RoutingDecision {
  return {
    mode: 'discovery',
    change_type: 'unknown',
    required_lenses: [],
    reason: 'No execution contract has been frozen yet.',
  };
}

export function createEmptyWorkflowState(
  migratedFrom: string[] = [],
  source: string = 'kstack-state.ensure',
): WorkflowStateV1 {
  const timestamp = now();
  return {
    schema_version: WORKFLOW_SCHEMA_VERSION,
    intent_record: null,
    active_sprint_brief: null,
    active_sprint_revision: 0,
    active_sprint_frozen_at: null,
    lens_assessments: {},
    accepted_decisions: [],
    rejected_options: [],
    assumptions: [],
    deltas_since_last_sprint: [],
    findings: [],
    tests_required: [],
    tests_satisfied: [],
    docs_to_regenerate: [],
    risk_level: 'medium',
    routing: defaultRouting(),
    escalation_status: 'none',
    provenance: {
      created_at: timestamp,
      updated_at: timestamp,
      migrated_from: migratedFrom,
      sources: [{ source, timestamp }],
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertStringArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value) || value.some(item => typeof item !== 'string')) {
    throw new Error(`${field} must be a string[]`);
  }
  return value as string[];
}

function assertRiskLevel(value: unknown, field: string): RiskLevel {
  if (value === 'low' || value === 'medium' || value === 'high' || value === 'critical') {
    return value;
  }
  throw new Error(`${field} must be one of: low, medium, high, critical`);
}

function assertFindingStatus(value: unknown, field: string): FindingStatus {
  if (value === 'open' || value === 'accepted' || value === 'fixed' || value === 'deferred' || value === 'duplicate') {
    return value;
  }
  throw new Error(`${field} must be a valid finding status`);
}

function assertRoutingMode(value: unknown, field: string): RoutingMode {
  if (value === 'discovery' || value === 'execution' || value === 'docs' || value === 'review' || value === 'qa' || value === 'security') {
    return value;
  }
  throw new Error(`${field} must be a valid routing mode`);
}

function assertLensNameArray(value: unknown, field: string): LensName[] {
  const values = assertStringArray(value, field);
  values.forEach(item => {
    if (!['product', 'architecture', 'design', 'security'].includes(item)) {
      throw new Error(`${field} contains invalid lens "${item}"`);
    }
  });
  return values as LensName[];
}

function validateDecisionRecord(value: unknown, field: string): DecisionRecord {
  if (!isRecord(value)) throw new Error(`${field} must be an object`);
  if (typeof value.title !== 'string' || typeof value.rationale !== 'string' || typeof value.source !== 'string' || typeof value.timestamp !== 'string') {
    throw new Error(`${field} has invalid decision shape`);
  }
  return value as DecisionRecord;
}

function validateProvenanceEntry(value: unknown, field: string): ProvenanceEntry {
  if (!isRecord(value)) throw new Error(`${field} must be an object`);
  if (typeof value.source !== 'string' || typeof value.timestamp !== 'string') {
    throw new Error(`${field} has invalid provenance shape`);
  }
  return value as ProvenanceEntry;
}

function validateIntentRecord(value: unknown): IntentRecord {
  if (!isRecord(value)) throw new Error('intent_record must be an object');
  if (typeof value.raw_request !== 'string') throw new Error('intent_record.raw_request must be a string');
  return {
    raw_request: value.raw_request,
    user_pain_examples: assertStringArray(value.user_pain_examples, 'intent_record.user_pain_examples'),
    goals: assertStringArray(value.goals, 'intent_record.goals'),
    non_goals: assertStringArray(value.non_goals, 'intent_record.non_goals'),
    constraints: assertStringArray(value.constraints, 'intent_record.constraints'),
    hypotheses: assertStringArray(value.hypotheses, 'intent_record.hypotheses'),
    candidate_wedges: assertStringArray(value.candidate_wedges, 'intent_record.candidate_wedges'),
    open_questions: assertStringArray(value.open_questions, 'intent_record.open_questions'),
    provenance: (Array.isArray(value.provenance) ? value.provenance : []).map((entry, index) =>
      validateProvenanceEntry(entry, `intent_record.provenance[${index}]`),
    ),
  };
}

function validateSprintBrief(value: unknown): SprintBrief {
  if (!isRecord(value)) throw new Error('active_sprint_brief must be an object');
  if (typeof value.problem_statement !== 'string') throw new Error('active_sprint_brief.problem_statement must be a string');
  return {
    problem_statement: value.problem_statement,
    in_scope_behavior: assertStringArray(value.in_scope_behavior, 'active_sprint_brief.in_scope_behavior'),
    out_of_scope_behavior: assertStringArray(value.out_of_scope_behavior, 'active_sprint_brief.out_of_scope_behavior'),
    acceptance_checks: assertStringArray(value.acceptance_checks, 'active_sprint_brief.acceptance_checks'),
    touched_surfaces: assertStringArray(value.touched_surfaces, 'active_sprint_brief.touched_surfaces'),
    tolerated_unresolved_questions: assertStringArray(value.tolerated_unresolved_questions, 'active_sprint_brief.tolerated_unresolved_questions'),
    escalation_triggers: assertStringArray(value.escalation_triggers, 'active_sprint_brief.escalation_triggers'),
    risk_level: assertRiskLevel(value.risk_level, 'active_sprint_brief.risk_level'),
  };
}

function validateDeltaRecord(value: unknown, field: string): DeltaRecord {
  if (!isRecord(value)) throw new Error(`${field} must be an object`);
  if (typeof value.timestamp !== 'string') throw new Error(`${field}.timestamp must be a string`);
  return {
    timestamp: value.timestamp,
    what_changed: assertStringArray(value.what_changed, `${field}.what_changed`),
    what_was_learned: assertStringArray(value.what_was_learned, `${field}.what_was_learned`),
    assumption_changed: assertStringArray(value.assumption_changed, `${field}.assumption_changed`),
    scope_impact: value.scope_impact === 'none' || value.scope_impact === 'minor' || value.scope_impact === 'major' ? value.scope_impact : (() => { throw new Error(`${field}.scope_impact must be none|minor|major`); })(),
    architecture_impact: value.architecture_impact === 'none' || value.architecture_impact === 'minor' || value.architecture_impact === 'major' ? value.architecture_impact : (() => { throw new Error(`${field}.architecture_impact must be none|minor|major`); })(),
    risk_impact: assertRiskLevel(value.risk_impact, `${field}.risk_impact`),
    recommended_next_mode: assertRoutingMode(value.recommended_next_mode, `${field}.recommended_next_mode`),
  };
}

function validateFindingRecord(value: unknown, field: string): FindingRecord {
  if (!isRecord(value)) throw new Error(`${field} must be an object`);
  if (
    typeof value.id !== 'string' ||
    typeof value.source !== 'string' ||
    typeof value.location !== 'string' ||
    typeof value.kind !== 'string' ||
    typeof value.evidence !== 'string'
  ) {
    throw new Error(`${field} has invalid finding shape`);
  }

  const finding: FindingRecord = {
    id: value.id,
    source: value.source,
    location: value.location,
    kind: value.kind,
    severity: assertRiskLevel(value.severity, `${field}.severity`),
    evidence: value.evidence,
    status: assertFindingStatus(value.status, `${field}.status`),
  };

  if (typeof value.duplicate_of === 'string') finding.duplicate_of = value.duplicate_of;
  if (typeof value.linked_sprint === 'string') finding.linked_sprint = value.linked_sprint;
  return finding;
}

function validateLensAssessment(value: unknown, field: string): LensAssessment {
  if (!isRecord(value)) throw new Error(`${field} must be an object`);
  if (
    typeof value.lens !== 'string' ||
    typeof value.summary !== 'string' ||
    typeof value.updated_at !== 'string'
  ) {
    throw new Error(`${field} has invalid lens shape`);
  }
  if (!['product', 'architecture', 'design', 'security'].includes(value.lens)) {
    throw new Error(`${field}.lens is invalid`);
  }

  return {
    lens: value.lens as LensName,
    summary: value.summary,
    concerns: assertStringArray(value.concerns, `${field}.concerns`),
    recommendations: assertStringArray(value.recommendations, `${field}.recommendations`),
    risk_level: assertRiskLevel(value.risk_level, `${field}.risk_level`),
    updated_at: value.updated_at,
  };
}

function validateRoutingDecision(value: unknown): RoutingDecision {
  if (!isRecord(value)) throw new Error('routing must be an object');
  if (typeof value.reason !== 'string') throw new Error('routing.reason must be a string');
  if (
    value.change_type !== 'unknown' &&
    value.change_type !== 'docs' &&
    value.change_type !== 'bugfix' &&
    value.change_type !== 'ui' &&
    value.change_type !== 'security' &&
    value.change_type !== 'architecture'
  ) {
    throw new Error('routing.change_type must be a valid change type');
  }

  return {
    mode: assertRoutingMode(value.mode, 'routing.mode'),
    change_type: value.change_type,
    required_lenses: assertLensNameArray(value.required_lenses, 'routing.required_lenses'),
    reason: value.reason,
  };
}

export function validateWorkflowState(value: unknown): WorkflowStateV1 {
  if (!isRecord(value)) throw new Error('workflow state must be an object');
  if (value.schema_version !== WORKFLOW_SCHEMA_VERSION) {
    throw new Error(`schema_version must be ${WORKFLOW_SCHEMA_VERSION}`);
  }

  const provenance = value.provenance;
  if (!isRecord(provenance)) throw new Error('provenance must be an object');
  if (
    typeof provenance.created_at !== 'string' ||
    typeof provenance.updated_at !== 'string' ||
    !Array.isArray(provenance.migrated_from) ||
    !Array.isArray(provenance.sources)
  ) {
    throw new Error('provenance has invalid shape');
  }

  const lensAssessments: Partial<Record<LensName, LensAssessment>> = {};
  if (!isRecord(value.lens_assessments)) throw new Error('lens_assessments must be an object');
  for (const [lens, assessment] of Object.entries(value.lens_assessments)) {
    lensAssessments[lens as LensName] = validateLensAssessment(assessment, `lens_assessments.${lens}`);
  }

  return {
    schema_version: WORKFLOW_SCHEMA_VERSION,
    intent_record: value.intent_record === null ? null : validateIntentRecord(value.intent_record),
    active_sprint_brief: value.active_sprint_brief === null ? null : validateSprintBrief(value.active_sprint_brief),
    active_sprint_revision: typeof value.active_sprint_revision === 'number' ? value.active_sprint_revision : 0,
    active_sprint_frozen_at: typeof value.active_sprint_frozen_at === 'string' ? value.active_sprint_frozen_at : null,
    lens_assessments: lensAssessments,
    accepted_decisions: (Array.isArray(value.accepted_decisions) ? value.accepted_decisions : []).map((entry, index) =>
      validateDecisionRecord(entry, `accepted_decisions[${index}]`),
    ),
    rejected_options: (Array.isArray(value.rejected_options) ? value.rejected_options : []).map((entry, index) =>
      validateDecisionRecord(entry, `rejected_options[${index}]`),
    ),
    assumptions: assertStringArray(value.assumptions, 'assumptions'),
    deltas_since_last_sprint: (Array.isArray(value.deltas_since_last_sprint) ? value.deltas_since_last_sprint : []).map((entry, index) =>
      validateDeltaRecord(entry, `deltas_since_last_sprint[${index}]`),
    ),
    findings: (Array.isArray(value.findings) ? value.findings : []).map((entry, index) =>
      validateFindingRecord(entry, `findings[${index}]`),
    ),
    tests_required: assertStringArray(value.tests_required, 'tests_required'),
    tests_satisfied: assertStringArray(value.tests_satisfied, 'tests_satisfied'),
    docs_to_regenerate: assertStringArray(value.docs_to_regenerate, 'docs_to_regenerate'),
    risk_level: assertRiskLevel(value.risk_level, 'risk_level'),
    routing: validateRoutingDecision(value.routing),
    escalation_status: value.escalation_status === 'none' || value.escalation_status === 'watch' || value.escalation_status === 'needs-human' || value.escalation_status === 'blocked'
      ? value.escalation_status
      : (() => { throw new Error('escalation_status must be valid'); })(),
    provenance: {
      created_at: provenance.created_at,
      updated_at: provenance.updated_at,
      migrated_from: assertStringArray(provenance.migrated_from, 'provenance.migrated_from'),
      sources: provenance.sources.map((entry, index) => validateProvenanceEntry(entry, `provenance.sources[${index}]`)),
    },
  };
}

export function ensureWorkflowDirs(paths: WorkflowPaths): void {
  fs.mkdirSync(paths.stateDir, { recursive: true });
  fs.mkdirSync(paths.reportsDir, { recursive: true });
  fs.mkdirSync(paths.contractsDir, { recursive: true });

  const gitignorePath = path.join(paths.repoRoot, '.gitignore');
  try {
    void gitignorePath;
    upsertKstackGitignore(paths.repoRoot);
  } catch {
    // Best effort only.
  }
}

function readJsonFile<T>(filePath: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
  } catch {
    return null;
  }
}

export function readWorkflowState(paths: WorkflowPaths = resolveWorkflowPaths()): WorkflowStateV1 | null {
  const raw = readJsonFile<unknown>(paths.stateFile);
  if (!raw) return null;
  return validateWorkflowState(raw);
}

export function ensureWorkflowState(paths: WorkflowPaths = resolveWorkflowPaths()): WorkflowStateV1 {
  ensureWorkflowDirs(paths);
  const existing = readWorkflowState(paths);
  if (existing) return existing;

  const initial = createEmptyWorkflowState([], 'kstack-state.ensure');
  writeWorkflowState(initial, paths);
  return initial;
}

export function writeWorkflowState(
  state: WorkflowStateV1,
  paths: WorkflowPaths = resolveWorkflowPaths(),
): void {
  ensureWorkflowDirs(paths);
  state.provenance.updated_at = now();
  const tmpPath = `${paths.stateFile}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmpPath, `${JSON.stringify(state, null, 2)}\n`, 'utf-8');
  fs.renameSync(tmpPath, paths.stateFile);
}

export function loadWorkflowState(
  paths: WorkflowPaths = resolveWorkflowPaths(),
  opts: { ensure?: boolean } = { ensure: true },
): WorkflowStateV1 {
  const state = readWorkflowState(paths);
  if (state) return state;
  if (opts.ensure === false) {
    throw new Error(`No workflow state found at ${paths.stateFile}`);
  }
  return ensureWorkflowState(paths);
}

function recordSource(state: WorkflowStateV1, source: string, note?: string): void {
  state.provenance.sources.push({
    source,
    timestamp: now(),
    ...(note ? { note } : {}),
  });
}

function hashFindingIdentity(finding: Omit<FindingRecord, 'id'>): string {
  return crypto
    .createHash('sha1')
    .update([finding.source, finding.location, finding.kind, finding.severity, finding.linked_sprint || ''].join('|'))
    .digest('hex')
    .slice(0, 12);
}

export function setIntentRecord(
  state: WorkflowStateV1,
  intent: IntentRecord,
  source: string,
): WorkflowStateV1 {
  state.intent_record = intent;
  recordSource(state, source, 'intent_record updated');
  return state;
}

export function setSprintBrief(
  state: WorkflowStateV1,
  sprint: SprintBrief,
  source: string,
): WorkflowStateV1 {
  state.active_sprint_brief = sprint;
  state.active_sprint_revision += 1;
  state.active_sprint_frozen_at = now();
  state.risk_level = sprint.risk_level;
  recordSource(state, source, 'active_sprint_brief updated');
  return state;
}

export function appendDeltaRecord(
  state: WorkflowStateV1,
  delta: DeltaRecord,
  source: string,
): WorkflowStateV1 {
  state.deltas_since_last_sprint.push(delta);
  state.risk_level = delta.risk_impact;
  recordSource(state, source, 'delta appended');
  return state;
}

export function setLensAssessment(
  state: WorkflowStateV1,
  assessment: LensAssessment,
  source: string,
): WorkflowStateV1 {
  state.lens_assessments[assessment.lens] = assessment;
  state.risk_level = highestRisk(state.risk_level, assessment.risk_level);
  recordSource(state, source, `${assessment.lens} lens updated`);
  return state;
}

export function upsertFinding(
  state: WorkflowStateV1,
  findingInput: Omit<FindingRecord, 'id'> & { id?: string },
  source: string,
): WorkflowStateV1 {
  const id = findingInput.id || hashFindingIdentity(findingInput);
  const finding: FindingRecord = { ...findingInput, id };
  const existingIndex = state.findings.findIndex(item => item.id === id);
  if (existingIndex >= 0) {
    state.findings[existingIndex] = {
      ...state.findings[existingIndex],
      ...finding,
      status: finding.status === 'duplicate' && !finding.duplicate_of
        ? state.findings[existingIndex].status
        : finding.status,
    };
  } else {
    state.findings.push(finding);
  }
  state.risk_level = highestRisk(state.risk_level, finding.severity);
  recordSource(state, source, `finding ${id} upserted`);
  return state;
}

export function appendUnique(values: string[], next: string): string[] {
  if (!values.includes(next)) values.push(next);
  return values;
}

export function addRequiredTest(state: WorkflowStateV1, testName: string, source: string): WorkflowStateV1 {
  appendUnique(state.tests_required, testName);
  recordSource(state, source, `required test added: ${testName}`);
  return state;
}

export function addSatisfiedTest(state: WorkflowStateV1, testName: string, source: string): WorkflowStateV1 {
  appendUnique(state.tests_satisfied, testName);
  recordSource(state, source, `satisfied test added: ${testName}`);
  return state;
}

export function addDocToRegenerate(state: WorkflowStateV1, docPath: string, source: string): WorkflowStateV1 {
  appendUnique(state.docs_to_regenerate, docPath);
  recordSource(state, source, `doc to regenerate added: ${docPath}`);
  return state;
}

export function resolveDocToRegenerate(state: WorkflowStateV1, docPath: string, source: string): WorkflowStateV1 {
  state.docs_to_regenerate = state.docs_to_regenerate.filter(item => item !== docPath);
  recordSource(state, source, `doc obligation resolved: ${docPath}`);
  return state;
}

export function addAssumption(state: WorkflowStateV1, assumption: string, source: string): WorkflowStateV1 {
  appendUnique(state.assumptions, assumption);
  recordSource(state, source, `assumption added`);
  return state;
}

export function setRoutingDecision(
  state: WorkflowStateV1,
  routing: RoutingDecision,
  source: string,
): WorkflowStateV1 {
  state.routing = routing;
  recordSource(state, source, `routing updated`);
  return state;
}

export function setEscalationStatus(
  state: WorkflowStateV1,
  status: EscalationStatus,
  source: string,
): WorkflowStateV1 {
  state.escalation_status = status;
  recordSource(state, source, `escalation updated`);
  return state;
}

export function addDecision(
  state: WorkflowStateV1,
  kind: 'accepted' | 'rejected',
  decision: DecisionRecord,
  source: string,
): WorkflowStateV1 {
  if (kind === 'accepted') {
    state.accepted_decisions.push(decision);
  } else {
    state.rejected_options.push(decision);
  }
  recordSource(state, source, `${kind} decision added`);
  return state;
}

export function highestRisk(current: RiskLevel, candidate: RiskLevel): RiskLevel {
  const order: RiskLevel[] = ['low', 'medium', 'high', 'critical'];
  return order.indexOf(candidate) > order.indexOf(current) ? candidate : current;
}

export function riskRank(value: RiskLevel): number {
  return ['low', 'medium', 'high', 'critical'].indexOf(value);
}

export function deltaRequiresRefreeze(delta: DeltaRecord, sprintRiskLevel: RiskLevel | null): boolean {
  if (delta.recommended_next_mode === 'discovery') return true;
  if (delta.scope_impact === 'major') return true;
  if (delta.architecture_impact === 'major') return true;
  if (sprintRiskLevel && riskRank(delta.risk_impact) > riskRank(sprintRiskLevel)) return true;
  return false;
}

export function deltasSinceLatestFreeze(state: WorkflowStateV1): DeltaRecord[] {
  if (!state.active_sprint_frozen_at) return state.deltas_since_last_sprint;
  return state.deltas_since_last_sprint.filter(delta => delta.timestamp > state.active_sprint_frozen_at!);
}

export function evaluateReadiness(state: WorkflowStateV1): ReadinessEvaluation {
  const blockers: string[] = [];
  if (!state.active_sprint_brief) {
    blockers.push('No active sprint brief has been frozen for this branch.');
  }

  const deltasAfterFreeze = deltasSinceLatestFreeze(state);
  const requiresRefreeze = state.active_sprint_brief
    ? deltasAfterFreeze.some(delta => deltaRequiresRefreeze(delta, state.active_sprint_brief?.risk_level ?? null))
    : false;
  if (requiresRefreeze) {
    blockers.push('Post-freeze learning requires `/kstack sprint-freeze` before review or ship.');
  }

  const openBlockerFindings = state.findings.filter(finding =>
    finding.status === 'open' && (finding.severity === 'high' || finding.severity === 'critical'),
  );
  if (openBlockerFindings.length > 0) {
    blockers.push(`Open high-severity findings remain: ${openBlockerFindings.length}.`);
  }

  const missingTests = state.tests_required.filter(testName => !state.tests_satisfied.includes(testName));
  if (missingTests.length > 0) {
    blockers.push(`Required tests remain unsatisfied: ${missingTests.join(', ')}.`);
  }

  if (state.docs_to_regenerate.length > 0) {
    blockers.push(`Documentation obligations remain: ${state.docs_to_regenerate.join(', ')}.`);
  }

  const hasAssuranceEvidence =
    state.tests_satisfied.length > 0 ||
    state.findings.length > 0 ||
    Object.keys(state.lens_assessments).length > 0;

  if (blockers.length > 0) {
    return {
      status: 'blocked',
      blockers,
      requires_refreeze: requiresRefreeze,
      has_assurance_evidence: hasAssuranceEvidence,
      summary: blockers.join(' '),
    };
  }

  const openFindings = state.findings.filter(finding => finding.status === 'open');
  if (!hasAssuranceEvidence) {
    return {
      status: 'draft',
      blockers: [],
      requires_refreeze: false,
      has_assurance_evidence: false,
      summary: 'A sprint exists, but assurance evidence has not been recorded yet.',
    };
  }

  if (openFindings.length > 0) {
    return {
      status: 'ready-for-review',
      blockers: [],
      requires_refreeze: false,
      has_assurance_evidence: true,
      summary: 'The branch is coherent and reviewable, but non-blocking findings remain open.',
    };
  }

  return {
    status: 'ready-to-ship',
    blockers: [],
    requires_refreeze: false,
    has_assurance_evidence: true,
    summary: 'The branch contract is current and no semantic blockers remain.',
  };
}

function summarizeOpenFindingsBySeverity(findings: FindingRecord[]): Record<RiskLevel, number> {
  return findings.reduce<Record<RiskLevel, number>>((acc, finding) => {
    if (finding.status === 'open') {
      acc[finding.severity] += 1;
    }
    return acc;
  }, {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  });
}

export function buildBranchContract(
  state: WorkflowStateV1,
  paths: WorkflowPaths = resolveWorkflowPaths(),
): BranchContractV1 {
  const readiness = evaluateReadiness(state);
  const sprintRisk = state.active_sprint_brief?.risk_level ?? null;
  const deltasAfterFreeze = deltasSinceLatestFreeze(state).map(delta => ({
    timestamp: delta.timestamp,
    scope_impact: delta.scope_impact,
    architecture_impact: delta.architecture_impact,
    risk_impact: delta.risk_impact,
    recommended_next_mode: delta.recommended_next_mode,
    what_changed: delta.what_changed,
    what_was_learned: delta.what_was_learned,
    assumption_changed: delta.assumption_changed,
    requires_refreeze: deltaRequiresRefreeze(delta, sprintRisk),
  }));
  const latestDelta = deltasAfterFreeze[deltasAfterFreeze.length - 1] || null;
  const missingTests = state.tests_required.filter(testName => !state.tests_satisfied.includes(testName));
  const openFindingCounts = summarizeOpenFindingsBySeverity(state.findings);

  return {
    schema_version: BRANCH_CONTRACT_SCHEMA_VERSION,
    workflow_schema_version: WORKFLOW_SCHEMA_VERSION,
    branch: paths.branch,
    normalized_branch: paths.normalizedBranch,
    generated_at: state.provenance.updated_at,
    state_file: repoRelativePath(paths.repoRoot, paths.stateFile),
    intent: {
      present: state.intent_record !== null,
      raw_request: state.intent_record?.raw_request ?? null,
      goals: state.intent_record?.goals ?? [],
      non_goals: state.intent_record?.non_goals ?? [],
      constraints: state.intent_record?.constraints ?? [],
      candidate_wedges: state.intent_record?.candidate_wedges ?? [],
      open_questions: state.intent_record?.open_questions ?? [],
    },
    sprint: {
      present: state.active_sprint_brief !== null,
      revision: state.active_sprint_revision,
      frozen_at: state.active_sprint_frozen_at,
      problem_statement: state.active_sprint_brief?.problem_statement ?? null,
      in_scope_behavior: state.active_sprint_brief?.in_scope_behavior ?? [],
      out_of_scope_behavior: state.active_sprint_brief?.out_of_scope_behavior ?? [],
      acceptance_checks: state.active_sprint_brief?.acceptance_checks ?? [],
      touched_surfaces: state.active_sprint_brief?.touched_surfaces ?? [],
      tolerated_unresolved_questions: state.active_sprint_brief?.tolerated_unresolved_questions ?? [],
      escalation_triggers: state.active_sprint_brief?.escalation_triggers ?? [],
      risk_level: state.active_sprint_brief?.risk_level ?? null,
    },
    routing: state.routing,
    risk_level: state.risk_level,
    tests: {
      required: state.tests_required,
      satisfied: state.tests_satisfied,
      missing: missingTests,
    },
    docs: {
      queued: state.docs_to_regenerate,
    },
    findings: {
      total: state.findings.length,
      open: state.findings.filter(finding => finding.status === 'open').length,
      blockers: openFindingCounts.high + openFindingCounts.critical,
      open_by_severity: openFindingCounts,
      items: state.findings.map(finding => ({
        id: finding.id,
        source: finding.source,
        location: finding.location,
        kind: finding.kind,
        severity: finding.severity,
        status: finding.status,
      })),
    },
    deltas_since_freeze: {
      count: deltasAfterFreeze.length,
      latest_timestamp: latestDelta?.timestamp ?? null,
      requires_refreeze: readiness.requires_refreeze,
      items: deltasAfterFreeze,
    },
    readiness,
    pr: {
      recommendation: readiness.status,
    },
  };
}

export function renderBranchContractMarkdown(contract: BranchContractV1): string {
  const lines = [
    `# Branch Contract: ${contract.branch}`,
    '',
    `- Status: \`${contract.readiness.status}\``,
    `- Routing: \`${contract.routing.mode}\` (\`${contract.routing.change_type}\`)`,
    `- Risk: \`${contract.risk_level}\``,
    `- Sprint revision: \`${contract.sprint.revision}\``,
    `- Generated: \`${contract.generated_at}\``,
    '',
    '## Problem Statement',
    contract.sprint.problem_statement || 'No sprint has been frozen yet.',
    '',
    '## In Scope',
    ...(contract.sprint.in_scope_behavior.length > 0 ? contract.sprint.in_scope_behavior.map(item => `- ${item}`) : ['- None recorded']),
    '',
    '## Out of Scope',
    ...(contract.sprint.out_of_scope_behavior.length > 0 ? contract.sprint.out_of_scope_behavior.map(item => `- ${item}`) : ['- None recorded']),
    '',
    '## Acceptance Checks',
    ...(contract.sprint.acceptance_checks.length > 0 ? contract.sprint.acceptance_checks.map(item => `- ${item}`) : ['- None recorded']),
    '',
    '## Touched Surfaces',
    ...(contract.sprint.touched_surfaces.length > 0 ? contract.sprint.touched_surfaces.map(item => `- ${item}`) : ['- None recorded']),
    '',
    '## Tests',
    `- Required: ${contract.tests.required.length}`,
    `- Satisfied: ${contract.tests.satisfied.length}`,
    ...(contract.tests.missing.length > 0 ? contract.tests.missing.map(item => `- Missing: ${item}`) : ['- Missing: none']),
    '',
    '## Docs Obligations',
    ...(contract.docs.queued.length > 0 ? contract.docs.queued.map(item => `- ${item}`) : ['- None']),
    '',
    '## Findings',
    `- Total: ${contract.findings.total}`,
    `- Open: ${contract.findings.open}`,
    `- Blockers: ${contract.findings.blockers}`,
    `- Open by severity: low=${contract.findings.open_by_severity.low}, medium=${contract.findings.open_by_severity.medium}, high=${contract.findings.open_by_severity.high}, critical=${contract.findings.open_by_severity.critical}`,
    '',
    '## Deltas Since Latest Freeze',
    `- Count: ${contract.deltas_since_freeze.count}`,
    `- Requires re-freeze: ${contract.deltas_since_freeze.requires_refreeze ? 'yes' : 'no'}`,
    ...(contract.deltas_since_freeze.items.length > 0
      ? contract.deltas_since_freeze.items.map(item => `- ${item.timestamp}: scope=${item.scope_impact}, architecture=${item.architecture_impact}, risk=${item.risk_impact}, next=${item.recommended_next_mode}`)
      : ['- None']),
    '',
    '## Readiness',
    `- Recommendation: \`${contract.pr.recommendation}\``,
    `- Summary: ${contract.readiness.summary}`,
    ...(contract.readiness.blockers.length > 0 ? contract.readiness.blockers.map(item => `- Blocker: ${item}`) : ['- Blocker: none']),
  ];

  return `${lines.join('\n')}\n`;
}

export function renderPullRequestBody(contract: BranchContractV1): string {
  const lines = [
    '## Branch Contract',
    '',
    `**Status:** \`${contract.readiness.status}\``,
    `**Risk:** \`${contract.risk_level}\``,
    `**PR Recommendation:** \`${contract.pr.recommendation}\``,
    '',
    '### Problem Statement',
    contract.sprint.problem_statement || 'No sprint brief has been frozen yet.',
    '',
    '### In Scope',
    ...(contract.sprint.in_scope_behavior.length > 0 ? contract.sprint.in_scope_behavior.map(item => `- ${item}`) : ['- None recorded']),
    '',
    '### Out of Scope',
    ...(contract.sprint.out_of_scope_behavior.length > 0 ? contract.sprint.out_of_scope_behavior.map(item => `- ${item}`) : ['- None recorded']),
    '',
    '### Acceptance Checks',
    ...(contract.sprint.acceptance_checks.length > 0 ? contract.sprint.acceptance_checks.map(item => `- ${item}`) : ['- None recorded']),
    '',
    '### Touched Surfaces',
    ...(contract.sprint.touched_surfaces.length > 0 ? contract.sprint.touched_surfaces.map(item => `- ${item}`) : ['- None recorded']),
    '',
    '### Open Questions',
    ...(contract.intent.open_questions.length > 0 ? contract.intent.open_questions.map(item => `- ${item}`) : ['- None']),
    '',
    '### Deltas Since Latest Freeze',
    ...(contract.deltas_since_freeze.items.length > 0
      ? contract.deltas_since_freeze.items.map(item => `- ${item.timestamp}: ${item.what_was_learned.join('; ') || 'Updated understanding.'}`)
      : ['- None']),
    '',
    '### Findings and Blockers',
    `- Open findings: ${contract.findings.open}`,
    `- Blocking findings: ${contract.findings.blockers}`,
    ...(contract.readiness.blockers.length > 0 ? contract.readiness.blockers.map(item => `- ${item}`) : ['- No semantic blockers recorded']),
    '',
    '### Readiness',
    `- ${contract.readiness.summary}`,
  ];

  return `${lines.join('\n')}\n`;
}

function readJsonIfExists<T>(filePath: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
  } catch {
    return null;
  }
}

export function readBranchContract(paths: WorkflowPaths = resolveWorkflowPaths()): BranchContractV1 | null {
  return readJsonIfExists<BranchContractV1>(paths.contractJsonFile);
}

export function writeBranchContract(
  contract: BranchContractV1,
  paths: WorkflowPaths = resolveWorkflowPaths(),
): void {
  ensureWorkflowDirs(paths);
  fs.writeFileSync(paths.contractJsonFile, serializeJson(contract), 'utf-8');
  fs.writeFileSync(paths.contractMarkdownFile, renderBranchContractMarkdown(contract), 'utf-8');
}

export function exportBranchContract(
  state: WorkflowStateV1,
  paths: WorkflowPaths = resolveWorkflowPaths(),
): BranchContractV1 {
  const contract = buildBranchContract(state, paths);
  writeBranchContract(contract, paths);
  return contract;
}

export function checkBranchContractFreshness(
  state: WorkflowStateV1,
  paths: WorkflowPaths = resolveWorkflowPaths(),
): BranchContractFreshnessCheck {
  const contract = buildBranchContract(state, paths);
  const expectedJson = serializeJson(contract);
  const expectedMarkdown = renderBranchContractMarkdown(contract);
  const missingFiles: string[] = [];
  const staleFiles: string[] = [];

  if (!fs.existsSync(paths.contractJsonFile)) {
    missingFiles.push(paths.contractJsonFile);
  } else if (fs.readFileSync(paths.contractJsonFile, 'utf-8') !== expectedJson) {
    staleFiles.push(paths.contractJsonFile);
  }

  if (!fs.existsSync(paths.contractMarkdownFile)) {
    missingFiles.push(paths.contractMarkdownFile);
  } else if (fs.readFileSync(paths.contractMarkdownFile, 'utf-8') !== expectedMarkdown) {
    staleFiles.push(paths.contractMarkdownFile);
  }

  return {
    ok: missingFiles.length === 0 && staleFiles.length === 0,
    contract,
    expected_json: expectedJson,
    expected_markdown: expectedMarkdown,
    missing_files: missingFiles,
    stale_files: staleFiles,
  };
}

export function verifySelfHostingInvariants(
  repoRoot: string = getRepoRoot(),
): SelfHostingInvariantCheck {
  const mainPaths = resolveWorkflowPaths(repoRoot, 'main');
  const currentBranch = getCurrentBranch(repoRoot);
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!fs.existsSync(mainPaths.stateFile)) {
    errors.push(`Missing required self-hosting state file: ${repoRelativePath(repoRoot, mainPaths.stateFile)}.`);
  }

  let mainState: WorkflowStateV1 | null = null;
  if (fs.existsSync(mainPaths.stateFile)) {
    try {
      mainState = validateWorkflowState(JSON.parse(fs.readFileSync(mainPaths.stateFile, 'utf-8')));
    } catch (error) {
      errors.push(`Invalid main workflow state: ${error instanceof Error ? error.message : String(error)}.`);
    }
  }

  if (!fs.existsSync(mainPaths.contractJsonFile)) {
    errors.push(`Missing required main branch contract JSON: ${repoRelativePath(repoRoot, mainPaths.contractJsonFile)}.`);
  }

  if (!fs.existsSync(mainPaths.contractMarkdownFile)) {
    errors.push(`Missing required main branch contract Markdown: ${repoRelativePath(repoRoot, mainPaths.contractMarkdownFile)}.`);
  }

  if (mainState) {
    const freshness = checkBranchContractFreshness(mainState, mainPaths);
    for (const filePath of freshness.missing_files) {
      const relative = repoRelativePath(repoRoot, filePath);
      if (!errors.some(item => item.includes(relative))) {
        errors.push(`Missing committed contract artifact: ${relative}.`);
      }
    }
    for (const filePath of freshness.stale_files) {
      errors.push(`Stale committed contract artifact: ${repoRelativePath(repoRoot, filePath)}.`);
    }
  }

  const rawStateFiles = fs.existsSync(mainPaths.stateDir)
    ? fs.readdirSync(mainPaths.stateDir)
      .filter(entry => entry.endsWith('.json'))
      .sort()
    : [];
  const extraStateFiles = rawStateFiles.filter(entry => entry !== 'main.json');
  if (normalizeBranchName(currentBranch) === 'main' && extraStateFiles.length > 0) {
    errors.push(`main must not contain extra raw branch state files: ${extraStateFiles.join(', ')}.`);
  } else if (extraStateFiles.length > 0) {
    warnings.push(`Feature branch raw state is present in this worktree: ${extraStateFiles.join(', ')}.`);
  }

  return {
    ok: errors.length === 0,
    current_branch: currentBranch,
    main_state_file: repoRelativePath(repoRoot, mainPaths.stateFile),
    main_contract_json: repoRelativePath(repoRoot, mainPaths.contractJsonFile),
    main_contract_markdown: repoRelativePath(repoRoot, mainPaths.contractMarkdownFile),
    raw_state_files: rawStateFiles.map(file => `.kstack/state/${file}`),
    errors,
    warnings,
  };
}

export function inferRoutingFromFiles(changedFiles: string[]): RoutingDecision {
  if (changedFiles.length === 0) {
    return {
      mode: 'discovery',
      change_type: 'unknown',
      required_lenses: [],
      reason: 'No changed files detected, so discovery remains the safest default.',
    };
  }

  const normalized = changedFiles.map(file => file.toLowerCase());
  const docsOnly = normalized.every(file =>
    file.endsWith('.md') || file.startsWith('docs/') || file === 'readme' || file === 'readme.md',
  );

  if (docsOnly) {
    return {
      mode: 'docs',
      change_type: 'docs',
      required_lenses: [],
      reason: 'All changed files are documentation, so run the docs-only path.',
    };
  }

  const securityHit = normalized.some(file =>
    /(auth|oauth|secret|token|session|permission|security|cso|middleware|crypt|rbac)/.test(file),
  );
  if (securityHit) {
    return {
      mode: 'security',
      change_type: 'security',
      required_lenses: ['security'],
      reason: 'Auth or security-sensitive files changed, so the security lens is required.',
    };
  }

  const uiHit = normalized.some(file =>
    /(component|page|screen|view|style|css|scss|tailwind|design|ui|frontend|tsx|jsx|html)/.test(file),
  );

  if (uiHit) {
    return {
      mode: 'execution',
      change_type: 'ui',
      required_lenses: ['design'],
      reason: 'User-facing files changed, so treat the sprint as execution with the design lens.',
    };
  }

  if (changedFiles.length >= 8 || normalized.some(file => /(package\.json|setup|browse\/src|lib\/|scripts\/)/.test(file))) {
    return {
      mode: 'execution',
      change_type: 'architecture',
      required_lenses: ['architecture'],
      reason: 'Broad or infrastructure-heavy changes suggest an architecture-level execution sprint.',
    };
  }

  return {
    mode: 'execution',
    change_type: 'bugfix',
    required_lenses: [],
    reason: 'The diff is narrow enough for direct execution with targeted validation.',
  };
}

export function changedFilesAgainstBase(repoRoot: string, baseRef: string): string[] {
  const output = runGit(['diff', '--name-only', `${baseRef}...HEAD`], repoRoot);
  if (!output) return [];
  return output.split('\n').map(line => line.trim()).filter(Boolean);
}

export function detectBaseBranch(repoRoot: string = getRepoRoot()): string {
  const symbolic = runGit(['symbolic-ref', 'refs/remotes/origin/HEAD'], repoRoot);
  if (symbolic) {
    return symbolic.replace('refs/remotes/origin/', '');
  }
  if (runGit(['rev-parse', '--verify', 'origin/main'], repoRoot)) return 'origin/main';
  if (runGit(['rev-parse', '--verify', 'origin/master'], repoRoot)) return 'origin/master';
  if (runGit(['rev-parse', '--verify', 'main'], repoRoot)) return 'main';
  if (runGit(['rev-parse', '--verify', 'master'], repoRoot)) return 'master';
  return 'main';
}

export function buildHumanSummary(state: WorkflowStateV1, paths: WorkflowPaths = resolveWorkflowPaths()): string {
  const readiness = evaluateReadiness(state);
  const lines = [
    `State: ${paths.stateFile}`,
    `Contract: ${paths.contractJsonFile}`,
    `Schema: ${state.schema_version}`,
    `Routing: ${state.routing.mode} (${state.routing.change_type})`,
    `Risk: ${state.risk_level}`,
    `Escalation: ${state.escalation_status}`,
    `Intent: ${state.intent_record ? 'present' : 'missing'}`,
    `Sprint brief: ${state.active_sprint_brief ? 'present' : 'missing'}`,
    `Sprint revision: ${state.active_sprint_revision}`,
    `Findings: ${state.findings.length}`,
    `Tests: ${state.tests_satisfied.length}/${state.tests_required.length} satisfied`,
    `Docs queued: ${state.docs_to_regenerate.length}`,
    `Readiness: ${readiness.status}`,
  ];

  return lines.join('\n');
}
