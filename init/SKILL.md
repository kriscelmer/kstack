---
name: init
description: |
  Repo bootstrap for KStack. Use when a new repository needs local AGENTS
  instructions, canonical state directories, and KStack workflow wiring.
---
<!-- AUTO-GENERATED from init/SKILL.md.tmpl — do not edit directly -->
<!-- Regenerate: bun run gen:skill-docs -->

## Runtime

```bash
_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
KSTACK_ROOT="$HOME/.codex/skills/kstack"
[ -d "$_ROOT/.agents/skills/kstack" ] && KSTACK_ROOT="$_ROOT/.agents/skills/kstack"
KSTACK_BIN="$KSTACK_ROOT/bin"
KSTACK_STATE="$KSTACK_BIN/kstack-state"
$KSTACK_STATE ensure >/dev/null 2>&1 || true
```

## Purpose

`/kstack init` makes a repository KStack-aware. It should be the first KStack command used in a brand-new project repo.

If the repo has no commits yet and no usable working branch, init should create or switch the unborn branch to `main` before writing state.

## Workflow

1. Run `$KSTACK_BIN/kstack-init`.
2. Explain what was created or updated:
   - unborn `main` branch, if the repo was still branchless in practice after `git init`
   - `.kstack/state/`
   - `.kstack/reports/`
   - `.gitignore` entry for `.kstack/`
   - managed KStack block inside `AGENTS.md`
3. Tell the user the next normal step is `/kstack discover`.

## Rules

- Be idempotent. Re-running init should refresh the managed block, not duplicate it.
- Respect user content already present in `AGENTS.md`.
- Do not overwrite unrelated project instructions.
