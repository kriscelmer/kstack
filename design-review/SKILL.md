---
name: design-review
description: |
  Visual QA and polish skill for frontend work. Use when the user wants a
  design audit, UI cleanup, or evidence-backed visual fixes.
---
<!-- AUTO-GENERATED from design-review/SKILL.md.tmpl — do not edit directly -->
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

1. Verify the UI in `browse` before editing.
2. Attach or refresh the `design` lens when the surface materially changed.
3. Record spacing, hierarchy, accessibility, and consistency issues as normalized findings.
4. Fix the issues, then re-open the page and confirm the result visually.
