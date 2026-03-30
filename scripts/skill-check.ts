#!/usr/bin/env bun

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { REGISTERED_SKILL_OUTPUTS, REGISTERED_SKILL_TEMPLATES, REGISTERED_TEMPLATE_PATHS, ROOT_SKILL_TEMPLATE } from '../lib/command-registry';

const ROOT = path.resolve(import.meta.dir, '..');
const BUN = process.env.BUN_BIN || (fs.existsSync(path.join(os.homedir(), '.bun', 'bin', 'bun')) ? path.join(os.homedir(), '.bun', 'bin', 'bun') : 'bun');
const templates = REGISTERED_SKILL_TEMPLATES;

function discoverSkillArtifacts(root: string, basename: 'SKILL.md' | 'SKILL.md.tmpl'): string[] {
  const results: string[] = [];

  if (fs.existsSync(path.join(root, basename))) {
    results.push(basename);
  }

  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith('.')) continue;
    const relPath = path.join(entry.name, basename);
    if (fs.existsSync(path.join(root, relPath))) {
      results.push(relPath);
    }
  }

  return results.sort();
}

const skills = discoverSkillArtifacts(ROOT, 'SKILL.md');
const discoveredTemplates = discoverSkillArtifacts(ROOT, 'SKILL.md.tmpl');

function extractFrontmatter(content: string): { name: string; description: string } | null {
  if (!content.startsWith('---\n')) return null;
  const end = content.indexOf('\n---\n');
  if (end === -1) return null;
  const frontmatter = content.slice(4, end);
  const name = frontmatter.match(/^name:\s*(.+)$/m)?.[1]?.trim();
  const descriptionBlock = frontmatter.match(/^description:\s*\|\n([\s\S]*)$/m)?.[1];
  if (!name || !descriptionBlock) return null;
  return {
    name,
    description: descriptionBlock
      .split('\n')
      .map((line) => line.replace(/^  /, ''))
      .join('\n')
      .trim(),
  };
}

let failed = false;

console.log('kstack skill health');
console.log('');

for (const tmpl of discoveredTemplates) {
  if (!REGISTERED_TEMPLATE_PATHS.has(tmpl)) {
    failed = true;
    console.log(`FAIL  ${tmpl}  not part of the registered public KStack surface`);
  }
}

for (const file of skills) {
  if (!REGISTERED_SKILL_OUTPUTS.has(file)) {
    failed = true;
    console.log(`FAIL  ${file}  not part of the registered public KStack surface`);
  }
}

if (failed) {
  console.log('');
}

for (const file of skills) {
  const fullPath = path.join(ROOT, file);
  const content = fs.readFileSync(fullPath, 'utf-8');
  const frontmatter = extractFrontmatter(content);
  const unresolved = content.match(/\{\{[A-Z_]+\}\}/g) || [];
  if (!frontmatter) {
    failed = true;
    console.log(`FAIL  ${file}  missing frontmatter`);
    continue;
  }
  if (frontmatter.description.length > 1024) {
    failed = true;
    console.log(`FAIL  ${file}  description too long (${frontmatter.description.length})`);
    continue;
  }
  if (unresolved.length > 0) {
    failed = true;
    console.log(`FAIL  ${file}  unresolved placeholders: ${unresolved.join(', ')}`);
    continue;
  }
  console.log(`OK    ${file}`);
}

console.log('');
console.log('template freshness');
const dryRun = Bun.spawnSync([BUN, 'run', 'scripts/gen-skill-docs.ts', '--dry-run'], {
  cwd: ROOT,
  stdout: 'pipe',
  stderr: 'pipe',
});
process.stdout.write(dryRun.stdout);
if (dryRun.exitCode !== 0) {
  failed = true;
  process.stderr.write(dryRun.stderr);
}

console.log('');
console.log('generated Codex runtime');
for (const { tmpl } of templates) {
  const dir = path.dirname(tmpl);
  const target = tmpl === ROOT_SKILL_TEMPLATE.tmpl
    ? path.join(ROOT, '.agents', 'skills', 'kstack', 'SKILL.md')
    : path.join(ROOT, '.agents', 'skills', 'kstack', dir, 'SKILL.md');
  if (!fs.existsSync(target)) {
    failed = true;
    console.log(`FAIL  ${path.relative(ROOT, target)} missing`);
    continue;
  }
  console.log(`OK    ${path.relative(ROOT, target)}`);
}

const topLevelAgents = path.join(ROOT, '.agents', 'skills');
if (fs.existsSync(topLevelAgents)) {
  for (const entry of fs.readdirSync(topLevelAgents, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (entry.name !== 'kstack') {
      failed = true;
      console.log(`FAIL  .agents/skills/${entry.name} should not exist as a public top-level skill`);
    }
  }
}

process.exit(failed ? 1 : 0);
