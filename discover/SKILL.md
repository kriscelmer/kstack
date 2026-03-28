---
name: discover
description: |
  Discovery workflow that captures ambiguous requests into one canonical
  `IntentRecord` in `.kstack/state`.
---
<!-- AUTO-GENERATED from discover/SKILL.md.tmpl — do not edit directly -->
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

1. Gather the raw request, user pain, goals, non-goals, constraints, examples, hypotheses, candidate wedges, and open questions.
2. Write them as an `IntentRecord` with `$KSTACK_STATE set-intent <json-file>`.
3. If there is enough clarity to execute, recommend `/sprint-freeze`. If not, keep the route in `discovery`.

## Routing Rules

- Vague request or missing acceptance criteria: route to `discovery`.
- Docs-only change: route to `docs` with no extra review ritual.
- Small bug fix: route to `execution` plus targeted validation.
- Architecture or wide-surface change: require the `architecture` lens.
- Security-sensitive change: require the `security` lens.
- Major UI change: require the `design` lens.
