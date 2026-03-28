---
name: autoplan
description: |
  Deprecated wrapper that runs the product, architecture, and design lenses
  against the shared canonical state.
---
<!-- AUTO-GENERATED from autoplan/SKILL.md.tmpl — do not edit directly -->
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

## Wrapper Behavior

1. Ensure an `IntentRecord` exists. If not, run the `/discover` flow first.
2. Refresh the sprint brief if it is missing or stale.
3. Populate `product`, `architecture`, and `design` lens assessments in state.
4. Return a concise summary of the accepted decisions, rejected options, and unresolved risk.
