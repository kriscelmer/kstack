---
name: qa
description: |
  Browser-driven QA that finds defects, fixes them in source, and re-verifies.
  Use when the user wants test-fix-verify on a web experience.
---
<!-- AUTO-GENERATED from qa/SKILL.md.tmpl — do not edit directly -->
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

1. Use `browse` to exercise the feature on the real page.
2. Record each defect as a `FindingRecord` in `.kstack/state`.
3. Fix issues in source, then re-run the exact repro.
4. Mark verified checks with `$KSTACK_STATE satisfy-test "<check name>"`.
5. Leave `.kstack/reports/` artifacts when screenshots or repro notes will matter later.

## Rules

- Only close a QA finding after a verified rerun.
- Keep findings normalized. Do not invent a separate QA report format.
- If a problem is risky but not fixed, leave it open in state and say why.
