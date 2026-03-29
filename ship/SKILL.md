---
name: ship
description: |
  Shipping workflow that checks canonical state, validation, docs, and merge
  readiness before creating the final commit or PR.
---
<!-- AUTO-GENERATED from ship/SKILL.md.tmpl — do not edit directly -->
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

1. Read `.kstack/state` and confirm the sprint brief still matches the diff.
2. Make sure required tests are either satisfied or explicitly unresolved.
3. Review open findings and block on high-severity unresolved issues.
4. Update docs or note any deferred docs obligations.
5. Refresh the branch contract with `$KSTACK_STATE export-contract`.
6. Evaluate semantic readiness with `$KSTACK_STATE ready` and treat the projected contract as the semantic source of truth.
7. Generate the PR body fragment with `$KSTACK_STATE export-pr` before versioning, commit, push, or PR creation.
