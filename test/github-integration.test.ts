import { describe, expect, test } from 'bun:test';
import * as fs from 'node:fs';
import * as path from 'node:path';

const ROOT = path.resolve(import.meta.dir, '..');

describe('GitHub integration scaffolding', () => {
  test('root gitignore keeps reports local, allows tracked contracts, and tracks raw state as a self-hosting exception', () => {
    const gitignore = fs.readFileSync(path.join(ROOT, '.gitignore'), 'utf-8');
    expect(gitignore).toContain('.kstack/*');
    expect(gitignore).toContain('!.kstack/contracts/');
    expect(gitignore).toContain('!.kstack/contracts/**');
    expect(gitignore).toContain('!.kstack/state/');
    expect(gitignore).toContain('!.kstack/state/**');
    expect(gitignore).not.toContain('!.kstack/reports/');
  });

  test('CODEOWNERS covers the critical KStack integration surfaces', () => {
    const codeowners = fs.readFileSync(path.join(ROOT, '.github', 'CODEOWNERS'), 'utf-8');
    expect(codeowners).toContain('.github/workflows/* @kriscelmer');
    expect(codeowners).toContain('AGENTS.md @kriscelmer');
    expect(codeowners).toContain('README.md @kriscelmer');
    expect(codeowners).toContain('docs/* @kriscelmer');
    expect(codeowners).toContain('*/SKILL.md.tmpl @kriscelmer');
    expect(codeowners).toContain('scripts/* @kriscelmer');
    expect(codeowners).toContain('bin/* @kriscelmer');
    expect(codeowners).toContain('lib/* @kriscelmer');
  });

  test('kstack-ready workflow evaluates the projected branch contract on pull requests', () => {
    const workflow = fs.readFileSync(path.join(ROOT, '.github', 'workflows', 'kstack-ready.yml'), 'utf-8');
    expect(workflow).toContain('name: kstack-ready');
    expect(workflow).toContain('pull_request:');
    expect(workflow).toContain('branches: [main]');
    expect(workflow).toContain('bun run bin/kstack-state.ts ready --json --branch');
    expect(workflow).toContain('GITHUB_STEP_SUMMARY');
  });

  test('repository validation workflow matches the shipped V1 checks', () => {
    const workflow = fs.readFileSync(path.join(ROOT, '.github', 'workflows', 'evals.yml'), 'utf-8');
    expect(workflow).toContain('name: Repository Validation');
    expect(workflow).toContain('bun run build');
    expect(workflow).toContain('bun test');
    expect(workflow).toContain('bun run skill:check');
    expect(workflow).toContain('bun run bin/kstack-state.ts export-contract --check --branch main');
    expect(workflow).not.toContain('gemini');
    expect(workflow).not.toContain('skill-e2e-design.test.ts');
    expect(workflow).not.toContain('skill-e2e-bws.test.ts');
  });

  test('self-hosting invariant workflows validate the committed main baseline', () => {
    const periodic = fs.readFileSync(path.join(ROOT, '.github', 'workflows', 'evals-periodic.yml'), 'utf-8');
    const invariants = fs.readFileSync(path.join(ROOT, '.github', 'workflows', 'self-hosting-invariants.yml'), 'utf-8');

    expect(periodic).toContain('name: Periodic Validation');
    expect(periodic).toContain('bun run bin/kstack-state.ts verify-self-hosting');
    expect(invariants).toContain('name: Self-Hosting Invariants');
    expect(invariants).toContain('branches: [main]');
    expect(invariants).toContain('bun run bin/kstack-state.ts verify-self-hosting');
  });
});
