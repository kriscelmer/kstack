---
name: qa-only
description: |
  Browser-driven QA that reports defects without changing code. Use when the user
  wants a structured bug report and evidence only.
---
<!-- AUTO-GENERATED from qa-only/SKILL.md.tmpl — do not edit directly -->
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

## Workflow

1. Use `browse` to exercise the feature and capture concrete repro steps.
2. Record every issue as a `FindingRecord` in `.kstack/state`.
3. Write screenshots or detailed repro notes under `.kstack/reports/qa/` when they add evidence.
4. Do not modify application code.
