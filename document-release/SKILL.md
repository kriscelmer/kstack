---
name: document-release
description: |
  Post-change documentation sync that updates README, architecture, and workflow
  docs to match what actually shipped.
---
<!-- AUTO-GENERATED from document-release/SKILL.md.tmpl — do not edit directly -->
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

1. Read the diff and the current `.kstack/state` summary.
2. Update docs that drifted from the shipped behavior.
3. For every satisfied docs obligation, clear it with `$KSTACK_STATE resolve-doc "<path>"`.
4. Refresh the projected branch contract with `$KSTACK_STATE export-contract`.
5. If docs remain intentionally deferred, say that explicitly in the final summary.
