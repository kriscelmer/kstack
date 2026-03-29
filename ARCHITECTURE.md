# Architecture

## System Model

`kstack` is built around one canonical repo-local state file per branch:

- `.kstack/state/<normalized-branch>.json`

That file is versioned through `WorkflowStateV1` and currently carries:

- `intent_record`
- `active_sprint_brief`
- `active_sprint_revision`
- `active_sprint_frozen_at`
- `lens_assessments`
- `accepted_decisions`
- `rejected_options`
- `assumptions`
- `deltas_since_last_sprint`
- `findings`
- `tests_required`
- `tests_satisfied`
- `docs_to_regenerate`
- `risk_level`
- `routing`
- `escalation_status`
- `provenance`

## The Problem It Solves

Traditional AI-assisted coding workflows scatter planning truth across:

- chat transcripts
- design docs
- review logs
- QA notes
- shell output
- unstated human memory

That makes the workflow hard to inspect and easy to drift. A reviewer can be reasoning from a stale plan while the implementation has already moved on.

`kstack` treats workflow state as a first-class artifact inside the repo. Discovery, execution, QA, security, and release work all write into the same branch-local object.

Git and GitHub still retain their normal roles:

- Git is the source of code truth.
- GitHub is the source of collaboration and enforcement.
- KStack is the source of workflow truth for the branch.

## Discovery, Freeze, Delta

The architecture is intentionally centered on three workflow phases:

### 1. Discovery

Discovery produces an `IntentRecord`.

Its job is to answer:

- what the user actually wants
- what pain or examples matter
- what goals and non-goals exist
- what constraints are real
- what wedge is worth attempting first
- what remains unresolved

### 2. Sprint Freeze

Sprint freeze produces the active `SprintBrief`.

Its job is to answer:

- what problem is being solved in this sprint
- what behavior is explicitly in scope
- what behavior is explicitly out of scope
- what acceptance checks define “done”
- what surfaces are expected to change
- what unresolved questions are tolerated
- what should trigger escalation

### 3. Delta Ingest

Delta ingest produces `DeltaRecord`s.

Its job is to answer:

- what changed
- what was learned
- which assumptions moved
- whether scope changed
- whether architecture changed
- whether risk changed
- whether the correct next action is continued execution, re-freeze, or renewed discovery

This matters because intent drift is normal. `kstack` makes it explicit rather than pretending the first plan survived contact with implementation.

## Routing

Routing is deterministic and state-backed.

The current route answers which mode the branch is in:

- `discovery`
- `execution`
- `docs`
- `review`
- `qa`
- `security`

It also records:

- `change_type`
- `required_lenses`
- the reason for the route

That allows old role-based review concepts to survive as lenses instead of independent plan stacks.

## Normalized Findings

`kstack` uses one normalized `FindingRecord` shape across review, QA, security, and release checks.

That prevents duplicated issue systems such as:

- review comments in one place
- QA issues in another
- release blockers in a third

Instead, different skills become different producers of the same record type.

## Truth Precedence

The system is opinionated about truth:

1. `code`, `tests`, and config define actual behavior.
2. `.kstack/state` defines workflow intent and current execution contract.
3. `.kstack/contracts/` holds durable, commitable branch contract projections.
4. `.kstack/reports/` holds local evidence-oriented projections derived from state plus code.
5. chat context is advisory only.

If chat and state conflict, the answer is not “remember harder”. The answer is “update the state”.

## Runtime Layout

- `.kstack/state/` stores canonical workflow state.
- `.kstack/contracts/` stores tracked branch contract projections for Git and GitHub integration.
- `.kstack/reports/` stores projections such as QA evidence or human-readable summaries.
- `~/.kstack/` stores user-global config and install metadata.
- `.agents/skills/kstack/` is the repo-local Codex runtime root used in development.
- `~/.codex/skills/kstack` is the installed Codex runtime root.

## Contract Projection Layer

Raw workflow state is intentionally local and operational.

Tracked branch contracts are separate:

- source: `.kstack/state/<branch>.json`
- outputs:
  - `.kstack/contracts/<branch>.json`
  - `.kstack/contracts/<branch>.md`

This hybrid projection model keeps runtime state noisy and local while still giving Git and GitHub a durable semantic artifact to review.

The projected contract is built from:

- intent summary
- active sprint summary
- routing and risk
- tests required vs satisfied
- docs obligations
- findings summary
- delta summary since the last freeze
- semantic readiness

This is also the basis for PR body generation and the `kstack-ready` GitHub check.

## Public Command Routing

`kstack` exposes one public skill:

- `/kstack`

That root skill is a router.

- Bare `/kstack` and `/kstack help` are help mode. They explain the workflow and list supported subcommands.
- `/kstack <subcommand>` loads the internal guide at `.agents/skills/kstack/<subcommand>/SKILL.md` or the repo-local equivalent during development.
- There are no public top-level skills like `/discover` or `/review`. Those remain internal subcommand guides so the public namespace stays coherent.

This matters because the routed entrypoint makes the workflow self-describing. New users only need to remember one command prefix, and new repos can be bootstrapped with `/kstack init`.

## Browser Runtime

The browse architecture is intentionally preserved:

- `browse/dist/browse` is the compiled CLI entrypoint.
- `browse/src/server.ts` runs the persistent browser server.
- project-local browser state and logs live under `.kstack/`

The browser runtime is not the workflow brain. It is a verification runtime that feeds evidence back into canonical state.

## Skill Generation

Every `SKILL.md` file is generated from a `SKILL.md.tmpl` source. The generator writes:

- in-repo `SKILL.md`
- `.agents/skills/kstack/SKILL.md` for the public router
- `.agents/skills/kstack/<subcommand>/SKILL.md` for routed subcommands
- `.agents/skills/kstack/agents/openai.yaml` for the public router

The root runtime directory `.agents/skills/kstack/` also links shared runtime assets such as:

- `bin/`
- `browse/`
- docs
- version files

## Installation Model

`kstack` is Codex-only.

The install model is:

- source checkout in a repo
- generated runtime under `.agents/skills/kstack`
- installed public runtime under `~/.codex/skills/kstack`
- internal subcommand guides nested under that runtime root
- compatibility wrappers kept only where migration cost is low

The repo no longer treats Claude, Gemini, or Kiro as equal host targets.

## GitHub Integration

KStack is GitHub-first in v1.

The repository-level contract is:

- Draft PR after `/kstack sprint-freeze`
- PR description generated from the branch contract
- `kstack-ready` complements CI by checking semantic readiness
- existing Actions remain the mechanical gate layer

This repo does not attempt to enforce branch protection or GitHub settings from code. Those remain repository settings, documented as recommendations.
