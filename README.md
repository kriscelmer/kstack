# kstack

`kstack` is a Codex-first workflow system for software delivery. It replaces ad hoc planning artifacts with one canonical branch-local state file, keeps discovery and execution aligned as work evolves, and preserves a fast browser runtime for QA and verification.

At the center of `kstack` is one rule:

> one branch, one workflow state, one current execution contract

That state lives at:

```text
.kstack/state/<normalized-branch>.json
```

Everything else is a projection of that truth:

- the active intent
- the frozen sprint brief
- findings from review, QA, and security
- required and satisfied tests
- doc obligations
- routing and escalation state
- deltas captured as intent or assumptions change

## Why kstack Exists

Most AI coding workflows drift because intent is stored in chat, planning is stored in prose, execution happens in code, and QA findings end up in separate notes or screenshots. The result is predictable:

- the original request gets reinterpreted several times
- new learnings do not update the actual execution contract
- reviewers reason from stale context
- shipping status is implicit instead of inspectable

`kstack` fixes that by treating workflow state as a real artifact in the repo, not as a side effect of a conversation.

For the deeper rationale, read [docs/kstack-concept.md](/Users/krzysztofcelmer/Documents/codex/kstack/docs/kstack-concept.md).

## Public Command Surface

`kstack` now exposes one public skill entrypoint:

```text
/kstack
```

Every KStack operation is routed through that entrypoint:

- `/kstack` or `/kstack help` explains usage and lists subcommands
- `/kstack init` bootstraps a repo so Codex knows where workflow truth lives
- `/kstack discover` captures intent
- `/kstack sprint-freeze` writes the active sprint contract
- `/kstack implement` reads the frozen sprint and starts coding against it
- `/kstack review`, `/kstack qa`, `/kstack cso`, `/kstack document-release`, and `/kstack ship` run the assurance and release loop

There are no public top-level skills like `/discover` or `/review` anymore. Internally, those subcommands still have their own guides, but they are invoked through `/kstack <subcommand>`.

`/codex` is intentionally gone. Codex is the native runtime, not an external second-opinion layer.

## Core Ideas

1. Discovery is explicit. Ambiguous work becomes an `IntentRecord`, not a vague chat thread.
2. Execution is explicit. A frozen sprint becomes a `SprintBrief`, not a moving target.
3. Implementation is explicit. `/kstack implement` reads the current sprint instead of relying on chat memory.
4. Learning is explicit. New information becomes `DeltaRecord`s, not silent plan drift.
5. Findings are normalized. Review, QA, and security write the same `FindingRecord` shape.
6. Truth has precedence. Code and tests outrank prose. Canonical state outranks chat memory.
7. Skills are thin. The workflow intelligence lives in state and deterministic rules, not in repeated ceremony embedded in every skill.

## Canonical Workflow

The normal loop is:

1. `/kstack init`
2. `/kstack discover`
3. `/kstack sprint-freeze`
4. `/kstack implement`
5. `/kstack review`, `/kstack qa`, `/kstack cso`, `/kstack document-release`
6. `/kstack ingest-learning` when new facts change the original assumptions
7. `/kstack sprint-freeze` again if the sprint contract moved
8. `/kstack ship`

Truth precedence:

1. `code`, `tests`, and config
2. `.kstack/state/<branch>.json`
3. `.kstack/reports/`
4. conversation context

## Primary Subcommands

| Command | Purpose |
| --- | --- |
| `/kstack` | Help mode. Explain the workflow and list subcommands. |
| `/kstack init` | Bootstrap repo-local KStack state and `AGENTS.md` guidance. |
| `/kstack discover` | Capture ambiguity and write the current `IntentRecord`. |
| `/kstack sprint-freeze` | Freeze the execution contract as a `SprintBrief`. |
| `/kstack implement` | Read the frozen sprint and implement against it. |
| `/kstack ingest-learning` | Record a delta when assumptions or scope move. |
| `/kstack review` | Code review with normalized findings. |
| `/kstack qa` | Test-fix-verify loop in a real browser. |
| `/kstack qa-only` | QA reporting without code changes. |
| `/kstack cso` | Security review and security findings. |
| `/kstack document-release` | Sync docs with what actually shipped. |
| `/kstack ship` | Final release gate using canonical state. |
| `/kstack browse` | Direct access to the headless browser runtime. |

Legacy wrappers are still available for migration, but they are also routed through `kstack`:

- `/kstack office-hours`
- `/kstack plan-ceo-review`
- `/kstack plan-eng-review`
- `/kstack plan-design-review`
- `/kstack autoplan`

## Installation

Quick start:

```bash
git clone https://github.com/krzysztofcelmer/kstack.git ~/.codex/skills-src/kstack
cd ~/.codex/skills-src/kstack
bun install
BUN_BIN="${BUN_BIN:-$HOME/.bun/bin/bun}" "$BUN_BIN" run build
./setup
```

That installs one public Codex runtime root:

```text
~/.codex/skills/kstack
```

For the full installation guide, including prerequisites, verification, repo-local development installs, upgrades, uninstall, troubleshooting, and first-use bootstrap in a new repo, read [docs/installation-guide.md](/Users/krzysztofcelmer/Documents/codex/kstack/docs/installation-guide.md).

## Typical Usage Scenario

Example: you create a new repo for an onboarding idea, add it to Codex App, and want the workflow to survive intent changes.

1. Run `/kstack` to confirm the routed command surface.
2. Run `/kstack init` in the repo to create `.kstack/state/` and repo-local `AGENTS.md` guidance.
3. Run `/kstack discover` to capture the real pain, examples, goals, non-goals, and candidate wedge.
4. Run `/kstack sprint-freeze` to turn that into a bounded execution contract.
5. Run `/kstack implement` to code against the frozen sprint.
6. Run `/kstack review` and `/kstack qa`.
7. If QA reveals that the original assumptions were wrong, run `/kstack ingest-learning`.
8. If the delta materially changes scope, refresh `/kstack sprint-freeze`.
9. Only then continue implementation or ship with `/kstack ship`.

That intent-update cycle is a first-class part of the model, not an exception.

For a detailed end-to-end scenario, including multiple intent update cycles, read [docs/typical-workflow.md](/Users/krzysztofcelmer/Documents/codex/kstack/docs/typical-workflow.md).

## Runtime Layout

- Repo-local workflow state: `.kstack/state/`
- Repo-local report projections: `.kstack/reports/`
- User-global config and install metadata: `~/.kstack/`
- Installed Codex runtime root: `~/.codex/skills/kstack`
- Repo-local generated runtime root: `.agents/skills/kstack`
- Internal subcommand guides: `.agents/skills/kstack/<subcommand>/SKILL.md`

## Development

```bash
bun install
BUN_BIN="${BUN_BIN:-$HOME/.bun/bin/bun}" "$BUN_BIN" run build
BUN_BIN="${BUN_BIN:-$HOME/.bun/bin/bun}" "$BUN_BIN" test
BUN_BIN="${BUN_BIN:-$HOME/.bun/bin/bun}" "$BUN_BIN" run skill:check
```

Templates live in `*/SKILL.md.tmpl`. Generated outputs should never be edited directly.

## Documentation Map

- [docs/installation-guide.md](/Users/krzysztofcelmer/Documents/codex/kstack/docs/installation-guide.md)
- [docs/typical-workflow.md](/Users/krzysztofcelmer/Documents/codex/kstack/docs/typical-workflow.md)
- [docs/kstack-concept.md](/Users/krzysztofcelmer/Documents/codex/kstack/docs/kstack-concept.md)
- [docs/skills.md](/Users/krzysztofcelmer/Documents/codex/kstack/docs/skills.md)
- [docs/migration-to-kstack.md](/Users/krzysztofcelmer/Documents/codex/kstack/docs/migration-to-kstack.md)
