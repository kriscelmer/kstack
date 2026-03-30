export interface RegisteredSkillTemplate {
  name: string;
  tmpl: string;
  output: string;
}

export const ROOT_SKILL_TEMPLATE: RegisteredSkillTemplate = {
  name: 'kstack',
  tmpl: 'SKILL.md.tmpl',
  output: 'SKILL.md',
};

export const PUBLIC_ROUTED_COMMANDS: RegisteredSkillTemplate[] = [
  { name: 'init', tmpl: 'init/SKILL.md.tmpl', output: 'init/SKILL.md' },
  { name: 'discover', tmpl: 'discover/SKILL.md.tmpl', output: 'discover/SKILL.md' },
  { name: 'sprint-freeze', tmpl: 'sprint-freeze/SKILL.md.tmpl', output: 'sprint-freeze/SKILL.md' },
  { name: 'implement', tmpl: 'implement/SKILL.md.tmpl', output: 'implement/SKILL.md' },
  { name: 'ingest-learning', tmpl: 'ingest-learning/SKILL.md.tmpl', output: 'ingest-learning/SKILL.md' },
  { name: 'review', tmpl: 'review/SKILL.md.tmpl', output: 'review/SKILL.md' },
  { name: 'qa', tmpl: 'qa/SKILL.md.tmpl', output: 'qa/SKILL.md' },
  { name: 'cso', tmpl: 'cso/SKILL.md.tmpl', output: 'cso/SKILL.md' },
  { name: 'document-release', tmpl: 'document-release/SKILL.md.tmpl', output: 'document-release/SKILL.md' },
  { name: 'ship', tmpl: 'ship/SKILL.md.tmpl', output: 'ship/SKILL.md' },
];

export const REGISTERED_SKILL_TEMPLATES: RegisteredSkillTemplate[] = [
  ROOT_SKILL_TEMPLATE,
  ...PUBLIC_ROUTED_COMMANDS,
];

export const REGISTERED_TEMPLATE_PATHS = new Set(REGISTERED_SKILL_TEMPLATES.map((entry) => entry.tmpl));
export const REGISTERED_SKILL_OUTPUTS = new Set(REGISTERED_SKILL_TEMPLATES.map((entry) => entry.output));
export const PUBLIC_ROUTED_COMMAND_NAMES = PUBLIC_ROUTED_COMMANDS.map((entry) => entry.name);

export const REMOVED_PUBLIC_COMMANDS = [
  'autoplan',
  'browse',
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
] as const;

export const RUNTIME_SHARED_ASSETS = [
  'bin',
  'browse',
  'extension',
  'README.md',
  'ARCHITECTURE.md',
  'AGENTS.md',
  'BROWSER.md',
  'VERSION',
  'CHANGELOG.md',
  'docs',
];
