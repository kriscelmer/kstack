---
name: kstack
description: |
  Codex-first workflow router for repo-local discovery, sprint freezing,
  implementation, review, QA, and shipping. Invoke as `/kstack <subcommand>`.
---
<!-- AUTO-GENERATED from SKILL.md.tmpl — do not edit directly -->
<!-- Regenerate: bun run gen:skill-docs -->

## How To Use `/kstack`

This is the only public KStack skill. All KStack actions are invoked through it.

Examples:

- `/kstack init`
- `/kstack discover`
- `/kstack sprint-freeze`
- `/kstack implement`
- `/kstack review`
- `/kstack qa`
- `/kstack ship`

If the user invokes `/kstack` with no subcommand, or `/kstack help`, explain usage and list the available subcommands. Do not mutate repo state in help mode.

If the user invokes `/kstack <subcommand>`:

1. Read the internal subcommand guide at `$KSTACK_ROOT/<subcommand>/SKILL.md`.
2. Follow that guide instead of improvising from chat memory.
3. If the subcommand is unknown, return help and show the supported commands.

## Canonical State

`kstack` keeps one canonical workflow state per branch at `.kstack/state/<normalized-branch>.json`. Use that state to carry intent, sprint scope, routing, findings, tests, and doc obligations.

1. `code`, `tests`, and `config` are the source of truth for behavior.
2. `.kstack/state/<branch>.json` is the source of truth for workflow intent, sprint scope, routing, and findings.
3. `.kstack/contracts/<branch>.json` contains durable, committable branch contract projections.
4. `.kstack/reports/` contains human-readable projections derived from code plus state.
5. Conversation context is advisory. If it conflicts with code or state, update the state instead of carrying stale prose forward.

## Runtime

```bash
_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
KSTACK_ROOT="$HOME/.codex/skills/kstack"
[ -d "$_ROOT/.agents/skills/kstack" ] && KSTACK_ROOT="$_ROOT/.agents/skills/kstack"
KSTACK_BIN="$KSTACK_ROOT/bin"
KSTACK_STATE="$KSTACK_BIN/kstack-state"
$KSTACK_STATE ensure >/dev/null 2>&1 || true
```

```bash
# Show the canonical repo-local workflow state for the current branch
$KSTACK_STATE summary

# Inspect the current state and branch contract
$KSTACK_STATE show
$KSTACK_STATE export-contract
$KSTACK_STATE export-pr
$KSTACK_STATE ready --json

# Advanced state mutation and routing helpers
$KSTACK_STATE set-intent ./intent.json
$KSTACK_STATE set-sprint ./sprint.json
$KSTACK_STATE append-delta ./delta.json
$KSTACK_STATE upsert-finding ./finding.json
$KSTACK_STATE route --auto
```

## Primary Commands

| Command | Purpose |
| --- | --- |
| `/kstack init` | Repo bootstrap for KStack. |
| `/kstack discover` | Discovery workflow that captures ambiguous requests into one canonical
`IntentRecord` in `.kstack/state`. |
| `/kstack sprint-freeze` | Converts discovery into an execution contract by writing the active
`SprintBrief`, route, required lenses, tests, and docs obligations. |
| `/kstack implement` | Execute the frozen sprint by reading the current branch state and coding
against the active `SprintBrief`, not against chat memory alone. |
| `/kstack ingest-learning` | Delta-ingest workflow that appends new learnings after review, QA, or user
feedback and decides whether to continue execution or reopen discovery. |
| `/kstack review` | Pre-landing code review focused on bugs, regressions, and missing validation.
Use when reviewing a diff before merge or when the user asks for a PR review. |
| `/kstack qa` | Browser-driven QA that finds defects, fixes them in source, and re-verifies.
Use when the user wants test-fix-verify on a web experience. |
| `/kstack cso` | Security review and threat-model skill that records normalized security
findings against the canonical workflow state. |
| `/kstack document-release` | Post-change documentation sync that updates README, architecture, and workflow
docs to match what actually shipped. |
| `/kstack ship` | Shipping workflow that checks canonical state, validation, docs, and merge
readiness before creating the final commit or PR. |

## Routing Rules

- Vague request or missing acceptance criteria: route to `discovery`.
- Docs-only change: route to `docs` with no extra review ritual.
- Small bug fix: route to `execution` plus targeted validation.
- Architecture or wide-surface change: require the `architecture` lens.
- Security-sensitive change: require the `security` lens.
- Major UI change: require the `design` lens.
