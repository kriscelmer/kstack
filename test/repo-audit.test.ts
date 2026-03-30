import { describe, expect, test } from 'bun:test';
import * as fs from 'node:fs';
import * as path from 'node:path';

const ROOT = path.resolve(import.meta.dir, '..');
const ALLOWED_HISTORICAL_REFERENCES = new Set([
  'CHANGELOG.md',
]);

const TEXT_EXTENSIONS = new Set([
  '.css',
  '.html',
  '.js',
  '.json',
  '.md',
  '.sh',
  '.tmpl',
  '.ts',
  '.yaml',
  '.yml',
]);

const REMOVED_COMMAND_DIRS = [
  'autoplan',
  'careful',
  'design-review',
  'freeze',
  'guard',
  'investigate',
  'office-hours',
  'plan-ceo-review',
  'plan-design-review',
  'plan-eng-review',
  'qa-only',
  'setup-browser-cookies',
  'unfreeze',
  'upgrade',
];

const REMOVED_FILES = [
  'browse/SKILL.md',
  'browse/SKILL.md.tmpl',
  'CLAUDE.md',
  'DESIGN.md',
  'ETHOS.md',
  'TASK.md',
];

function shouldScanFile(relPath: string): boolean {
  if (relPath.startsWith('.git/')) return false;
  if (relPath.startsWith('.agents/')) return false;
  if (relPath.startsWith('node_modules/')) return false;
  if (relPath.startsWith('test/')) return false;
  if (relPath.startsWith('browse/dist/')) return false;
  if (relPath.startsWith('design/dist/')) return false;
  if (ALLOWED_HISTORICAL_REFERENCES.has(relPath)) return false;
  return TEXT_EXTENSIONS.has(path.extname(relPath));
}

function walk(dir: string, base = dir): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === '.agents' || entry.name === 'node_modules') {
      continue;
    }
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walk(fullPath, base));
      continue;
    }
    results.push(path.relative(base, fullPath));
  }
  return results.sort();
}

describe('repo audit', () => {
  test('removes retired command directories and transition-only docs', () => {
    for (const dir of REMOVED_COMMAND_DIRS) {
      expect(fs.existsSync(path.join(ROOT, dir))).toBe(false);
    }

    for (const file of REMOVED_FILES) {
      expect(fs.existsSync(path.join(ROOT, file))).toBe(false);
    }
  });

  test('contains no active legacy naming or runtime paths outside changelog', () => {
    const offenders: string[] = [];

    for (const relPath of walk(ROOT)) {
      if (!shouldScanFile(relPath)) continue;
      const content = fs.readFileSync(path.join(ROOT, relPath), 'utf-8');
      if (/\bgstack\b/i.test(content) || /\.gstack(?:\/|\b)/.test(content) || /\bGSTACK[A-Z_]*\b/.test(content)) {
        offenders.push(relPath);
      }
    }

    expect(offenders).toEqual([]);
  });

  test('contains no active assistant-specific legacy references outside changelog', () => {
    const offenders: string[] = [];

    for (const relPath of walk(ROOT)) {
      if (!shouldScanFile(relPath)) continue;
      const content = fs.readFileSync(path.join(ROOT, relPath), 'utf-8');
      if (/\bclaude\b/i.test(content) || /\banthropic\b/i.test(content) || /\.claude(?:\/|\b)/.test(content)) {
        offenders.push(relPath);
      }
    }

    expect(offenders).toEqual([]);
  });

  test('does not reference retired routed commands in active repo text', () => {
    const retiredCommandPattern = /\/kstack (autoplan|browse|careful|design-review|freeze|guard|investigate|office-hours|plan-ceo-review|plan-design-review|plan-eng-review|qa-only|setup-browser-cookies|unfreeze|upgrade)\b/;
    const offenders: string[] = [];

    for (const relPath of walk(ROOT)) {
      if (!shouldScanFile(relPath)) continue;
      const content = fs.readFileSync(path.join(ROOT, relPath), 'utf-8');
      if (retiredCommandPattern.test(content)) {
        offenders.push(relPath);
      }
    }

    expect(offenders).toEqual([]);
  });
});
