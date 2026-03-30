#!/usr/bin/env bun

import * as fs from 'node:fs';
import * as path from 'node:path';
import { PUBLIC_ROUTED_COMMANDS, REGISTERED_SKILL_TEMPLATES, ROOT_SKILL_TEMPLATE, RUNTIME_SHARED_ASSETS } from '../lib/command-registry';

const ROOT = path.resolve(import.meta.dir, '..');
const DRY_RUN = process.argv.includes('--dry-run');

const GENERATED_HEADER = (source: string) =>
  `<!-- AUTO-GENERATED from ${source} — do not edit directly -->\n<!-- Regenerate: bun run gen:skill-docs -->\n`;

interface Frontmatter {
  name: string;
  description: string;
}

function readText(file: string): string {
  return fs.readFileSync(file, 'utf-8');
}

function extractFrontmatter(content: string): Frontmatter {
  if (!content.startsWith('---\n')) {
    throw new Error('Templates must start with YAML frontmatter.');
  }

  const end = content.indexOf('\n---\n');
  if (end === -1) {
    throw new Error('Template frontmatter is missing a closing --- line.');
  }

  const frontmatter = content.slice(4, end);
  const nameMatch = frontmatter.match(/^name:\s*(.+)$/m);
  const descriptionBlockMatch = frontmatter.match(/^description:\s*\|\n([\s\S]*)$/m);

  if (!nameMatch || !descriptionBlockMatch) {
    throw new Error('Template frontmatter must include name and description.');
  }

  const description = descriptionBlockMatch[1]
    .split('\n')
    .map((line) => line.replace(/^  /, ''))
    .join('\n')
    .trim();

  return {
    name: nameMatch[1].trim(),
    description,
  };
}

function withoutFrontmatter(content: string): string {
  const end = content.indexOf('\n---\n');
  if (end === -1) return content;
  return content.slice(end + 5);
}

function shortDescription(description: string): string {
  const singleLine = description.replace(/\s+/g, ' ').trim();
  return singleLine.length <= 120 ? singleLine : `${singleLine.slice(0, 117).trimEnd()}...`;
}

function openAiYaml(displayName: string, description: string): string {
  return `interface:
  display_name: ${JSON.stringify(displayName)}
  short_description: ${JSON.stringify(shortDescription(description))}
  default_prompt: ${JSON.stringify(`Use ${displayName} for this task.`)}
policy:
  allow_implicit_invocation: true
`;
}

function renderRuntimeSnippet(): string {
  return [
    '```bash',
    '_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"',
    'KSTACK_ROOT="$HOME/.codex/skills/kstack"',
    '[ -d "$_ROOT/.agents/skills/kstack" ] && KSTACK_ROOT="$_ROOT/.agents/skills/kstack"',
    'KSTACK_BIN="$KSTACK_ROOT/bin"',
    'KSTACK_STATE="$KSTACK_BIN/kstack-state"',
    '$KSTACK_STATE ensure >/dev/null 2>&1 || true',
    '```',
  ].join('\n');
}

function renderStateCli(): string {
  return [
    '```bash',
    '# Show the canonical repo-local workflow state for the current branch',
    '$KSTACK_STATE summary',
    '',
    '# Inspect the current state and branch contract',
    '$KSTACK_STATE show',
    '$KSTACK_STATE export-contract',
    '$KSTACK_STATE export-pr',
    '$KSTACK_STATE ready --json',
    '',
    '# Advanced state mutation and routing helpers',
    '$KSTACK_STATE set-intent ./intent.json',
    '$KSTACK_STATE set-sprint ./sprint.json',
    '$KSTACK_STATE append-delta ./delta.json',
    '$KSTACK_STATE upsert-finding ./finding.json',
    '$KSTACK_STATE route --auto',
    '```',
  ].join('\n');
}

function renderWorkflowPrecedence(): string {
  return [
    '1. `code`, `tests`, and `config` are the source of truth for behavior.',
    '2. `.kstack/state/<branch>.json` is the source of truth for workflow intent, sprint scope, routing, and findings.',
    '3. `.kstack/contracts/<branch>.json` contains durable, committable branch contract projections.',
    '4. `.kstack/reports/` contains human-readable projections derived from code plus state.',
    '5. Conversation context is advisory. If it conflicts with code or state, update the state instead of carrying stale prose forward.',
  ].join('\n');
}

function renderRoutingRules(): string {
  return [
    '- Vague request or missing acceptance criteria: route to `discovery`.',
    '- Docs-only change: route to `docs` with no extra review ritual.',
    '- Small bug fix: route to `execution` plus targeted validation.',
    '- Architecture or wide-surface change: require the `architecture` lens.',
    '- Security-sensitive change: require the `security` lens.',
    '- Major UI change: require the `design` lens.',
  ].join('\n');
}

function buildSkillIndex(): string {
  const rows = PUBLIC_ROUTED_COMMANDS
    .map(({ name, tmpl }) => {
      const frontmatter = extractFrontmatter(readText(path.join(ROOT, tmpl)));
      const firstSentence = frontmatter.description.split('. ')[0]?.trim() || frontmatter.description;
      return { command: `/kstack ${name}`, summary: firstSentence.endsWith('.') ? firstSentence : `${firstSentence}.` };
    })
    .map(({ command, summary }) => `| \`${command}\` | ${summary} |`)
    .join('\n');

  return `| Command | Purpose |\n| --- | --- |\n${rows}`;
}

function replacePlaceholders(content: string, replacements: Record<string, string>): string {
  return content.replace(/\{\{([A-Z_]+)\}\}/g, (_match, key) => {
    if (!(key in replacements)) {
      throw new Error(`Unresolved placeholder: {{${key}}}`);
    }
    return replacements[key];
  });
}

function withGeneratedHeader(rendered: string, source: string): string {
  if (!rendered.startsWith('---\n')) {
    return `${GENERATED_HEADER(source)}${rendered}`;
  }

  const end = rendered.indexOf('\n---\n');
  if (end === -1) {
    return `${GENERATED_HEADER(source)}${rendered}`;
  }

  const frontmatter = rendered.slice(0, end + 5);
  const body = rendered.slice(end + 5);
  return `${frontmatter}${GENERATED_HEADER(source)}${body}`;
}

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

function writeFileIfChanged(target: string, content: string): boolean {
  const current = fs.existsSync(target) ? readText(target) : null;
  const changed = current !== content;
  if (!DRY_RUN && changed) {
    ensureDir(path.dirname(target));
    fs.writeFileSync(target, content);
  }
  return changed;
}

function linkOrCopy(source: string, target: string): void {
  fs.rmSync(target, { recursive: true, force: true });
  try {
    const type = fs.statSync(source).isDirectory() ? 'dir' : 'file';
    fs.symlinkSync(source, target, type as fs.symlink.Type);
  } catch {
    const stat = fs.statSync(source);
    if (stat.isDirectory()) {
      fs.cpSync(source, target, { recursive: true });
    } else {
      fs.copyFileSync(source, target);
    }
  }
}

function materializeRuntimeRoot(): void {
  if (DRY_RUN) return;

  const runtimeRoot = path.join(ROOT, '.agents', 'skills', 'kstack');
  ensureDir(runtimeRoot);

  const skillDirs = PUBLIC_ROUTED_COMMANDS.map(({ tmpl }) => path.dirname(tmpl));
  const assets = [...RUNTIME_SHARED_ASSETS, ...skillDirs];
  for (const asset of assets) {
    const source = path.join(ROOT, asset);
    if (!fs.existsSync(source)) continue;
    linkOrCopy(source, path.join(runtimeRoot, path.basename(asset)));
  }
}

function removeStaleGeneratedSkills(expected: Set<string>): void {
  if (DRY_RUN) return;

  const agentsSkills = path.join(ROOT, '.agents', 'skills');
  ensureDir(agentsSkills);
  for (const entry of fs.readdirSync(agentsSkills, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (!expected.has(entry.name)) {
      fs.rmSync(path.join(agentsSkills, entry.name), { recursive: true, force: true });
    }
  }
}

const templates = REGISTERED_SKILL_TEMPLATES;
const replacements = {
  KSTACK_RUNTIME: renderRuntimeSnippet(),
  STATE_CLI: renderStateCli(),
  WORKFLOW_PRECEDENCE: renderWorkflowPrecedence(),
  SKILL_INDEX: buildSkillIndex(),
  ROUTING_RULES: renderRoutingRules(),
};

const expectedSkillDirs = new Set<string>(['kstack']);
const results: string[] = [];

for (const { tmpl, output } of templates) {
  const tmplPath = path.join(ROOT, tmpl);
  const raw = readText(tmplPath);
  const rendered = replacePlaceholders(raw, replacements);
  const finalContent = withGeneratedHeader(rendered, tmpl);
  const changed = writeFileIfChanged(path.join(ROOT, output), finalContent);
  results.push(`${changed ? 'STALE' : 'FRESH'}: ${output}`);

  if (tmpl === ROOT_SKILL_TEMPLATE.tmpl) {
    const agentSkillPath = path.join(ROOT, '.agents', 'skills', 'kstack', 'SKILL.md');
    const agentYamlPath = path.join(ROOT, '.agents', 'skills', 'kstack', 'agents', 'openai.yaml');
    const fm = extractFrontmatter(rendered);
    const agentChanged = writeFileIfChanged(agentSkillPath, finalContent);
    writeFileIfChanged(agentYamlPath, openAiYaml(fm.name, fm.description));
    results.push(`${agentChanged ? 'STALE' : 'FRESH'}: .agents/skills/kstack/SKILL.md`);
  }
}

removeStaleGeneratedSkills(expectedSkillDirs);
materializeRuntimeRoot();

for (const line of results) {
  console.log(line);
}

if (DRY_RUN && results.some((line) => line.startsWith('STALE'))) {
  process.exit(1);
}
