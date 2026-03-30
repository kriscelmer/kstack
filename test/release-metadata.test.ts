import { describe, expect, test } from 'bun:test';
import * as fs from 'node:fs';
import * as path from 'node:path';

const ROOT = path.resolve(import.meta.dir, '..');

describe('release metadata', () => {
  test('VERSION and package.json are aligned on 1.0.0', () => {
    const version = fs.readFileSync(path.join(ROOT, 'VERSION'), 'utf-8').trim();
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8'));

    expect(version).toBe('1.0.0');
    expect(pkg.version).toBe('1.0.0');
  });

  test('changelog contains the self-hosted V1 release entry', () => {
    const changelog = fs.readFileSync(path.join(ROOT, 'CHANGELOG.md'), 'utf-8');
    expect(changelog).toContain('## [1.0.0] - 2026-03-30 — Self-Hosted KStack');
    expect(changelog).toContain('Repository Validation');
    expect(changelog).toContain('Self-Hosting Invariants');
  });
});
