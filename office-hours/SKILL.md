---
name: office-hours
description: |
  Deprecated wrapper for discovery. Use only when a user explicitly asks for
  office-hours style exploration; otherwise prefer `/kstack discover`.
---
<!-- AUTO-GENERATED from office-hours/SKILL.md.tmpl — do not edit directly -->
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

This is a migration wrapper around `/kstack discover`.

## Wrapper Behavior

1. Capture the request as an `IntentRecord`.
2. Focus the conversation on user pain, goals, non-goals, hypotheses, and the narrowest useful wedge.
3. Tell the user the canonical command is `/kstack discover` and keep the state in `.kstack/state`.
