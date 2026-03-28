---
name: sprint-freeze
description: |
  Converts discovery into an execution contract by writing the active
  `SprintBrief`, route, required lenses, tests, and docs obligations.
---
<!-- AUTO-GENERATED from sprint-freeze/SKILL.md.tmpl — do not edit directly -->
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

1. Read the current `IntentRecord`.
2. Produce a `SprintBrief` with problem statement, in-scope behavior, out-of-scope behavior, acceptance checks, touched surfaces, tolerated unresolved questions, escalation triggers, and risk level.
3. Save it with `$KSTACK_STATE set-sprint <json-file>`.
4. Set routing with `$KSTACK_STATE set-routing <json-file>` or `$KSTACK_STATE route --auto`.
5. Add required tests and docs regeneration duties before execution begins.

## Routing Rules

- Vague request or missing acceptance criteria: route to `discovery`.
- Docs-only change: route to `docs` with no extra review ritual.
- Small bug fix: route to `execution` plus targeted validation.
- Architecture or wide-surface change: require the `architecture` lens.
- Security-sensitive change: require the `security` lens.
- Major UI change: require the `design` lens.
