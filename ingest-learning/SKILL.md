---
name: ingest-learning
description: |
  Delta-ingest workflow that appends new learnings after review, QA, or user
  feedback and decides whether to continue execution or reopen discovery.
---
<!-- AUTO-GENERATED from ingest-learning/SKILL.md.tmpl — do not edit directly -->
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

1. Capture what changed, what was learned, which assumption moved, and the impact on scope, architecture, and risk.
2. Save it as a `DeltaRecord` with `$KSTACK_STATE append-delta <json-file>`.
3. If the delta materially changes scope or intent, move the route back to `discovery` or refresh `/sprint-freeze`.
4. If the sprint still holds, leave the route in `execution` and continue.
