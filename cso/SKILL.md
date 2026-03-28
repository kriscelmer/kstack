---
name: cso
description: |
  Security review and threat-model skill that records normalized security
  findings against the canonical workflow state.
---
<!-- AUTO-GENERATED from cso/SKILL.md.tmpl — do not edit directly -->
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

1. Confirm the current route with `$KSTACK_STATE route --auto`.
2. If the change is security-sensitive, attach a `security` lens assessment with `$KSTACK_STATE add-lens security <json-file>`.
3. Record vulnerabilities, trust-boundary violations, secret leaks, or unsafe defaults as `FindingRecord`s with `source: "cso"`.
4. Escalate with `$KSTACK_STATE set-escalation needs-human` when you cannot verify a security-sensitive behavior confidently.
