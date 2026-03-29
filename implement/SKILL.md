---
name: implement
description: |
  Execute the frozen sprint by reading the current branch state and coding
  against the active `SprintBrief`, not against chat memory alone.
---
<!-- AUTO-GENERATED from implement/SKILL.md.tmpl — do not edit directly -->
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

## Preconditions

- The repository should already be initialized with `/kstack init`.
- An `active_sprint_brief` must exist in `.kstack/state/<branch>.json`.

If no active sprint exists, stop and tell the user to run `/kstack discover` and `/kstack sprint-freeze` first.

## Implementation Contract

When implementing, treat these fields as binding execution context:

- `active_sprint_brief`
- `routing`
- `tests_required`
- open `findings`
- `docs_to_regenerate`

The sprint brief defines what to build. Chat context is secondary.

## Workflow

1. Read the current branch state.
2. Restate the sprint in one concise paragraph before coding.
3. Implement the sprint directly in code.
4. If code reality conflicts with the frozen sprint, stop and route to `/kstack ingest-learning`.
5. If the conflict changes scope or acceptance criteria, refresh with `/kstack sprint-freeze` before continuing.

## Rules

- Do not silently expand scope.
- Do not keep coding against stale intent.
- If a blocked assumption changes, capture the delta explicitly.
