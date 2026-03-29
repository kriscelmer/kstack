#!/usr/bin/env bun

import * as fs from 'node:fs';
import * as path from 'node:path';
import { ensureWorkflowState, getCurrentBranch, getRepoRoot, resolveWorkflowPaths } from '../lib/workflow-state';

const MANAGED_BEGIN = '<!-- KSTACK:BEGIN -->';
const MANAGED_END = '<!-- KSTACK:END -->';

function ensureGitRepo(repoRoot: string): void {
  const gitDir = path.join(repoRoot, '.git');
  if (fs.existsSync(gitDir)) return;
  throw new Error('kstack-init must be run inside a git repository.');
}

function runGit(args: string[], repoRoot: string): { exitCode: number; stdout: string; stderr: string } {
  const proc = Bun.spawnSync(['git', ...args], {
    cwd: repoRoot,
    stdout: 'pipe',
    stderr: 'pipe',
    timeout: 3000,
  });

  return {
    exitCode: proc.exitCode,
    stdout: proc.stdout.toString().trim(),
    stderr: proc.stderr.toString().trim(),
  };
}

function repoHasCommits(repoRoot: string): boolean {
  return runGit(['rev-parse', '--verify', 'HEAD'], repoRoot).exitCode === 0;
}

function ensurePrimaryBranch(repoRoot: string, preferredBranch: string = 'main'): { branch: string; created: boolean } {
  if (repoHasCommits(repoRoot)) {
    return { branch: getCurrentBranch(repoRoot), created: false };
  }

  const currentBranch = getCurrentBranch(repoRoot);
  if (currentBranch === preferredBranch) {
    return { branch: preferredBranch, created: false };
  }

  const setHead = runGit(['symbolic-ref', 'HEAD', `refs/heads/${preferredBranch}`], repoRoot);
  if (setHead.exitCode !== 0) {
    throw new Error(`Failed to initialize ${preferredBranch} branch: ${setHead.stderr || 'unknown git error'}`);
  }

  return { branch: preferredBranch, created: true };
}

function managedAgentsBlock(normalizedBranch: string): string {
  return [
    MANAGED_BEGIN,
    '# KStack Workflow',
    '',
    'This repository uses KStack.',
    '',
    'Workflow truth precedence:',
    '1. code, tests, and config',
    `2. .kstack/state/${normalizedBranch}.json`,
    '3. .kstack/reports/',
    '4. chat context',
    '',
    'Operational rules:',
    '- Use `/kstack discover` to capture intent.',
    '- Use `/kstack sprint-freeze` to define the current execution contract.',
    '- Use `/kstack implement` to code against the frozen sprint.',
    '- If assumptions or scope change, use `/kstack ingest-learning` and refresh `/kstack sprint-freeze` before continuing.',
    '- Review, QA, security, and docs work should update canonical state instead of relying on chat memory.',
    MANAGED_END,
    '',
  ].join('\n');
}

function upsertAgentsFile(repoRoot: string, normalizedBranch: string): { file: string; changed: boolean } {
  const target = path.join(repoRoot, 'AGENTS.md');
  const block = managedAgentsBlock(normalizedBranch);
  const existing = fs.existsSync(target) ? fs.readFileSync(target, 'utf-8') : '';

  let next = '';
  if (existing.includes(MANAGED_BEGIN) && existing.includes(MANAGED_END)) {
    next = existing.replace(new RegExp(`${MANAGED_BEGIN}[\\s\\S]*?${MANAGED_END}\\n?`, 'm'), block);
  } else if (existing.trim().length === 0) {
    next = block;
  } else {
    const separator = existing.endsWith('\n') ? '\n' : '\n\n';
    next = `${existing}${separator}${block}`;
  }

  if (next !== existing) {
    fs.writeFileSync(target, next);
    return { file: target, changed: true };
  }

  return { file: target, changed: false };
}

function main(): void {
  const repoRoot = getRepoRoot(process.cwd());
  ensureGitRepo(repoRoot);
  const branchBootstrap = ensurePrimaryBranch(repoRoot);

  const paths = resolveWorkflowPaths(repoRoot);
  ensureWorkflowState(paths, 'kstack-init');
  const agentsResult = upsertAgentsFile(repoRoot, paths.normalizedBranch);
  const branch = getCurrentBranch(repoRoot);

  console.log(JSON.stringify({
    repo_root: repoRoot,
    branch,
    normalized_branch: paths.normalizedBranch,
    initialized_main_branch: branchBootstrap.created,
    state_file: paths.stateFile,
    reports_dir: paths.reportsDir,
    agents_file: agentsResult.file,
    agents_updated: agentsResult.changed,
    next_steps: [
      '/kstack discover',
      '/kstack sprint-freeze',
      '/kstack implement',
    ],
  }, null, 2));
}

main();
