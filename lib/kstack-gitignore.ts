import * as fs from 'fs';
import * as path from 'path';

export const KSTACK_GITIGNORE_BEGIN = '# KSTACK:BEGIN';
export const KSTACK_GITIGNORE_END = '# KSTACK:END';
export const KSTACK_GITIGNORE_RULES = [
  '.kstack/*',
  '!.kstack/contracts/',
  '!.kstack/contracts/**',
];

export function renderKstackGitignoreBlock(): string {
  return [
    KSTACK_GITIGNORE_BEGIN,
    ...KSTACK_GITIGNORE_RULES,
    KSTACK_GITIGNORE_END,
  ].join('\n');
}

export function upsertKstackGitignore(repoRoot: string): void {
  const gitignorePath = path.join(repoRoot, '.gitignore');
  const existing = fs.existsSync(gitignorePath) ? fs.readFileSync(gitignorePath, 'utf-8') : '';
  const managedBlock = renderKstackGitignoreBlock();

  let next = existing.replace(/^\.kstack\/?\r?\n?/gm, '');

  if (next.includes(KSTACK_GITIGNORE_BEGIN) && next.includes(KSTACK_GITIGNORE_END)) {
    next = next.replace(
      new RegExp(`${KSTACK_GITIGNORE_BEGIN}[\\s\\S]*?${KSTACK_GITIGNORE_END}\\n?`, 'm'),
      `${managedBlock}\n`,
    );
  } else {
    const separator = next.length === 0 || next.endsWith('\n') ? '' : '\n';
    next = `${next}${separator}${managedBlock}\n`;
  }

  if (next !== existing) {
    fs.writeFileSync(gitignorePath, next, 'utf-8');
  }
}
