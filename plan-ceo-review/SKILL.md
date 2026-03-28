---
name: plan-ceo-review
description: |
  Deprecated wrapper for the product lens. Use only for legacy workflows;
  otherwise prefer `/sprint-freeze` plus the `product` lens.
---
<!-- AUTO-GENERATED from plan-ceo-review/SKILL.md.tmpl — do not edit directly -->
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

1. Read the active intent and sprint brief.
2. Write a `product` lens assessment with strengths, weaknesses, gaps, and the clearest product wedge.
3. Keep the canonical sprint in `.kstack/state`; do not create a parallel plan file.
