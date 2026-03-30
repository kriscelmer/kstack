# Architecture

## System Model

`kstack` is built around one canonical repo-local state file per branch:

- `.kstack/state/<normalized-branch>.json`

That file is versioned through `WorkflowStateV1` and carries:

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

## Responsibility Split

- **Git** is the source of code truth.
- **GitHub** is the source of collaboration and enforcement.
- **KStack** is the source of workflow truth for the branch.

## Core Architecture

KStack is organized around four core responsibilities:

### State core

Responsible for:

- loading workflow state
- normalizing branch identity
- schema validation
- atomic writes and updates
- contract projection generation

### Transition core

Responsible for:

- discovery to sprint-freeze transitions
- delta ingest transitions
- normalized finding ingestion
- semantic readiness evaluation

### Router core

Responsible for:

- one public skill surface: `/kstack`
- deterministic subcommand routing
- supported command registry
- help and error handling

### Runtime layer

Responsible for:

- browser automation
- extension support
- local CLI affordances
- generated skill/runtime layout

The runtime layer is not the workflow brain. The state and transition layer are the workflow brain.

## Discovery, Freeze, Delta

### Discovery

Discovery produces an `IntentRecord`.

Its job is to answer:

- what the user actually wants
- what pain or examples matter
- what goals and non-goals exist
- what constraints are real
- what wedge is worth attempting first
- what remains unresolved

### Sprint Freeze

Sprint freeze produces the active `SprintBrief`.

Its job is to answer:

- what problem is being solved in this sprint
- what behavior is explicitly in scope
- what behavior is explicitly out of scope
- what acceptance checks define done
- what surfaces are expected to change
- what unresolved questions are tolerated
- what should trigger escalation

### Delta Ingest

Delta ingest produces `DeltaRecord`s.

Its job is to answer:

- what changed
- what was learned
- which assumptions moved
- whether scope changed
- whether architecture changed
- whether risk changed
- whether the correct next action is continued execution, re-freeze, or renewed discovery

## Contract Projection Layer

Raw workflow state is normally local and operational.

Tracked branch contracts are separate:

- source: `.kstack/state/<branch>.json`
- outputs:
  - `.kstack/contracts/<branch>.json`
  - `.kstack/contracts/<branch>.md`

The projected contract is the durable semantic artifact for Git and GitHub. It contains:

- intent summary
- active sprint summary
- routing and risk
- tests required vs satisfied
- docs obligations
- findings summary
- delta summary since the last freeze
- semantic readiness

Self-hosting exception:

- this repository intentionally commits `.kstack/state/main.json`
- feature branches may commit their own raw branch state while active, but that raw state must be removed before merge
- committed `.kstack/contracts/<branch>.json` and `.md` remain after merge as the durable branch-history projection
- this is a repo-specific exception, not the default behavior KStack applies to other repositories

## Public Command Routing

KStack exposes one public skill:

- `/kstack`

Supported routed subcommands:

- `init`
- `discover`
- `sprint-freeze`
- `implement`
- `ingest-learning`
- `review`
- `qa`
- `cso`
- `document-release`
- `ship`

There are no legacy wrapper commands and no secondary public routed surfaces.

## Browser Runtime

The browser runtime is preserved as infrastructure:

- `browse/dist/browse` is the compiled CLI entrypoint
- `browse/src/server.ts` runs the persistent browser server
- project-local browser state and logs live under `.kstack/`

It exists to feed evidence back into canonical state, not to compete with the routed workflow surface.

## Skill Generation

Every `SKILL.md` file is generated from a `SKILL.md.tmpl` source.

The generator writes:

- in-repo `SKILL.md`
- `.agents/skills/kstack/SKILL.md` for the public router
- `.agents/skills/kstack/<subcommand>/SKILL.md` for supported routed subcommands
- `.agents/skills/kstack/agents/openai.yaml` for the public router

Generation is driven by an explicit command registry, not by scanning every directory in the repo.

## Installation Model

`kstack` is Codex-only.

The install model is:

- source checkout in a repo
- generated runtime under `.agents/skills/kstack`
- installed public runtime under `~/.codex/skills/kstack`
- internal browser runtime bundled as a shared asset under that root

## GitHub Integration

KStack is GitHub-first in v1.

The repository-level contract is:

- Draft PR after `/kstack sprint-freeze`
- PR description generated from the branch contract
- `kstack-ready` complements CI by checking semantic readiness
- `Repository Validation` checks build, tests, skill freshness, and main-contract freshness
- `Self-Hosting Invariants` validates the committed main baseline on pushes to `main`
