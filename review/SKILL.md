---
name: review
description: |
  Pre-landing code review focused on bugs, regressions, and missing validation.
  Use when reviewing a diff before merge or when the user asks for a PR review.
---
<!-- AUTO-GENERATED from review/SKILL.md.tmpl — do not edit directly -->
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

## Review Contract

- Read the diff against the base branch first.
- Findings must use the normalized `FindingRecord` shape in `.kstack/state`.
- Prioritize real bugs, risky assumptions, missing tests, and behavior regressions.
- If there are no findings, say so explicitly and record the review outcome in state.

## Workflow

1. Ensure state exists with `$KSTACK_STATE ensure`.
2. Inspect the branch scope and route with `$KSTACK_STATE route --auto`.
3. For each finding, write a JSON object that matches `{id, source, location, kind, severity, evidence, status, duplicate_of?, linked_sprint}` and append it with `$KSTACK_STATE upsert-finding <json-file>`.
4. Mark satisfied checks with `$KSTACK_STATE satisfy-test "<check name>"` when the diff proves them.
5. Refresh the projected branch contract with `$KSTACK_STATE export-contract`.
6. Summarize the review with findings first, then residual risk, and mention the current `$KSTACK_STATE ready` status.
