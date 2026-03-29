import { describe, expect, test } from 'bun:test';
import * as fs from 'node:fs';
import * as path from 'node:path';

const ROOT = path.resolve(import.meta.dir, '..');

describe('GitHub integration scaffolding', () => {
  test('root gitignore keeps raw kstack runtime local and allows tracked contracts', () => {
    const gitignore = fs.readFileSync(path.join(ROOT, '.gitignore'), 'utf-8');
    expect(gitignore).toContain('.kstack/*');
    expect(gitignore).toContain('!.kstack/contracts/');
    expect(gitignore).toContain('!.kstack/contracts/**');
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
});
