#!/usr/bin/env bun

import * as fs from 'node:fs';
import * as path from 'node:path';
import { COMMAND_DESCRIPTIONS } from '../browse/src/commands';
import { SNAPSHOT_FLAGS } from '../browse/src/snapshot';
import { discoverTemplates } from './discover-skills';

const ROOT = path.resolve(import.meta.dir, '..');
const DRY_RUN = process.argv.includes('--dry-run');
const HOST_ARG = process.argv.find((arg) => arg === '--host' || arg.startsWith('--host='));
const HOST = (() => {
  if (!HOST_ARG) return 'codex';
  if (HOST_ARG.includes('=')) return HOST_ARG.split('=')[1];
  const idx = process.argv.indexOf(HOST_ARG);
  return process.argv[idx + 1] || 'codex';
})();

if (!['codex', 'agents'].includes(HOST)) {
  throw new Error(`Unsupported host "${HOST}". kstack only generates Codex-native skills.`);
}

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

function codexSkillName(relDir: string): string {
  return relDir === '.' || relDir === '' ? 'kstack' : relDir;
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

function renderCommandReference(): string {
  const grouped = new Map<string, Array<[string, (typeof COMMAND_DESCRIPTIONS)[string]]>>();
  for (const [command, meta] of Object.entries(COMMAND_DESCRIPTIONS)) {
    const list = grouped.get(meta.category) || [];
    list.push([command, meta]);
    grouped.set(meta.category, list);
  }

  const sections = [...grouped.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([category, entries]) => {
      const rows = entries
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([command, meta]) => `| \`${meta.usage || command}\` | ${meta.description} |`)
        .join('\n');
      return `### ${category}\n| Command | Description |\n| --- | --- |\n${rows}`;
    });

  return sections.join('\n\n');
}

function renderSnapshotFlags(): string {
  const rows = SNAPSHOT_FLAGS.map((flag) => `| \`${flag.short}\` | \`${flag.long}\` | ${flag.description} |`).join('\n');
  return `| Short | Long | Description |\n| --- | --- | --- |\n${rows}`;
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
    '# Inspect or patch specific records',
    '$KSTACK_STATE show',
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
    '3. `.kstack/reports/` contains human-readable projections derived from code plus state.',
    '4. Conversation context is advisory. If it conflicts with code or state, update the state instead of carrying stale prose forward.',
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

function buildSkillIndex(templates: Array<{ tmpl: string }>): string {
  const rows = templates
    .filter(({ tmpl }) => tmpl !== 'SKILL.md.tmpl')
    .map(({ tmpl }) => {
      const relDir = path.dirname(tmpl);
      const frontmatter = extractFrontmatter(readText(path.join(ROOT, tmpl)));
      const firstSentence = frontmatter.description.split('. ')[0]?.trim() || frontmatter.description;
      return { command: `/${relDir}`, summary: firstSentence.endsWith('.') ? firstSentence : `${firstSentence}.` };
    })
    .sort((left, right) => left.command.localeCompare(right.command))
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

  const assets = ['bin', 'browse', 'review', 'README.md', 'ARCHITECTURE.md', 'AGENTS.md', 'CLAUDE.md', 'VERSION', 'CHANGELOG.md', 'docs'];
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

const templates = discoverTemplates(ROOT);
const replacements = {
  KSTACK_RUNTIME: renderRuntimeSnippet(),
  STATE_CLI: renderStateCli(),
  WORKFLOW_PRECEDENCE: renderWorkflowPrecedence(),
  SKILL_INDEX: buildSkillIndex(templates),
  COMMAND_REFERENCE: renderCommandReference(),
  SNAPSHOT_FLAGS: renderSnapshotFlags(),
  ROUTING_RULES: renderRoutingRules(),
};

const expectedSkillDirs = new Set<string>();
const results: string[] = [];

for (const { tmpl, output } of templates) {
  const tmplPath = path.join(ROOT, tmpl);
  const raw = readText(tmplPath);
  const rendered = replacePlaceholders(raw, replacements);
  const finalContent = withGeneratedHeader(rendered, tmpl);
  const changed = writeFileIfChanged(path.join(ROOT, output), finalContent);
  results.push(`${changed ? 'STALE' : 'FRESH'}: ${output}`);

  const relDir = path.dirname(tmpl);
  const skillDir = codexSkillName(relDir);
  expectedSkillDirs.add(skillDir);

  const agentSkillPath = path.join(ROOT, '.agents', 'skills', skillDir, 'SKILL.md');
  const agentYamlPath = path.join(ROOT, '.agents', 'skills', skillDir, 'agents', 'openai.yaml');
  const fm = extractFrontmatter(rendered);
  const agentChanged = writeFileIfChanged(agentSkillPath, finalContent);
  writeFileIfChanged(agentYamlPath, openAiYaml(fm.name, fm.description));
  results.push(`${agentChanged ? 'STALE' : 'FRESH'}: .agents/skills/${skillDir}/SKILL.md`);
}

removeStaleGeneratedSkills(expectedSkillDirs);
materializeRuntimeRoot();

for (const line of results) {
  console.log(line);
}

if (DRY_RUN && results.some((line) => line.startsWith('STALE'))) {
  process.exit(1);
}
