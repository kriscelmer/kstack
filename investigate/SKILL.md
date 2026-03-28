---
name: investigate
description: |
  Root-cause debugging workflow. Use when a failure needs investigation before
  any fix is attempted.
---
<!-- AUTO-GENERATED from investigate/SKILL.md.tmpl — do not edit directly -->
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

1. Reproduce the issue and capture the observed behavior.
2. State the suspected root cause and the evidence that supports it.
3. Only after the cause is credible, update the sprint or findings state and implement the fix.
4. If the issue changes scope or assumptions, append a `DeltaRecord` after the investigation.
