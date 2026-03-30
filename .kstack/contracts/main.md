# Branch Contract: main

- Status: `ready-to-ship`
- Routing: `execution` (`architecture`)
- Risk: `medium`
- Sprint revision: `1`
- Generated: `2026-03-30T12:00:00Z`

## Problem Statement
KStack needs a clean self-hosted V1 baseline so further KStack work can happen entirely through KStack workflow and committed repo artifacts.

## In Scope
- Commit and validate main branch state plus committed main branch contract artifacts.
- Keep /kstack help limited to the supported routed workflow surface.
- Align CI and release metadata with the actual V1 repo surface.
- Make setup and uninstall safe for a self-hosting repository that tracks its own state.

## Out of Scope
- Adding new routed workflow commands or reviving removed legacy surfaces.
- Implementing post-V1 backlog items such as contract diffs, PR-body sync helpers, or browser ergonomics enhancements.
- Expanding KStack beyond its Codex-first source-checkout distribution model.

## Acceptance Checks
- .kstack/state/main.json exists, validates, and reflects the V1 self-hosting baseline.
- .kstack/contracts/main.json and .md exist, are deterministic, and stay fresh against main state.
- Root /kstack help exposes only the supported routed workflow and not browser command tables.
- GitHub validation references only shipped V1 surfaces and current tests.
- Setup and uninstall remain safe for a repository that tracks its own workflow state.
- VERSION and package metadata are aligned on 1.0.0.

## Touched Surfaces
- .kstack/
- .github/workflows/
- SKILL.md.tmpl
- bin/
- docs/
- lib/
- scripts/
- test/

## Tests
- Required: 5
- Satisfied: 5
- Missing: none

## Docs Obligations
- None

## Findings
- Total: 0
- Open: 0
- Blockers: 0
- Open by severity: low=0, medium=0, high=0, critical=0

## Deltas Since Latest Freeze
- Count: 0
- Requires re-freeze: no
- None

## Readiness
- Recommendation: `ready-to-ship`
- Summary: The branch contract is current and no semantic blockers remain.
- Blocker: none
