---
name: upgrade
description: |
  Updates the local kstack checkout or installation and explains what changed.
  Use when the user asks to update kstack itself.
---
<!-- AUTO-GENERATED from upgrade/SKILL.md.tmpl — do not edit directly -->
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

Run `$KSTACK_ROOT/bin/kstack-update-check --force` first. If an update is available,
upgrade the checkout or ask before mutating a pinned vendored copy.
