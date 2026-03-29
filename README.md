# kstack

`kstack` is a Codex-first workflow system for software delivery. It replaces ad hoc planning artifacts with one canonical branch-local state file, keeps discovery and execution aligned as work evolves, and preserves a fast browser runtime for QA and verification.

At the center of `kstack` is this rule:

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

`kstack` is meant to fix that. It treats workflow state as a real artifact in the repo, not as a side effect of a conversation.

For the deeper design rationale, read [docs/kstack-concept.md](/Users/krzysztofcelmer/Documents/codex/kstack/docs/kstack-concept.md).

## Core Ideas

1. Discovery is explicit. Ambiguous work becomes an `IntentRecord`, not a vague chat thread.
2. Execution is explicit. A frozen sprint becomes a `SprintBrief`, not a moving target.
3. Learning is explicit. New information becomes `DeltaRecord`s, not silent plan drift.
4. Findings are normalized. Review, QA, and security write the same `FindingRecord` shape.
5. Truth has precedence. Code and tests outrank prose. Canonical state outranks chat memory.
6. Skills are thin. The workflow intelligence lives in state and deterministic rules, not in repeated ceremony embedded in every skill.

## Canonical Workflow

The normal loop is:

1. `/discover`
2. `/sprint-freeze`
3. implementation
4. `/review`, `/qa`, `/cso`, `/document-release`
5. `/ingest-learning` when new facts change the original assumptions
6. `/ship`

Truth precedence:

1. `code`, `tests`, and config
2. `.kstack/state/<branch>.json`
3. `.kstack/reports/`
4. conversation context

## Primary Commands

| Command | Purpose |
| --- | --- |
| `/discover` | Capture ambiguity and write the current `IntentRecord`. |
| `/sprint-freeze` | Freeze the execution contract as a `SprintBrief`. |
| `/ingest-learning` | Record a delta when assumptions or scope move. |
| `/review` | Code review with normalized findings. |
| `/qa` | Test-fix-verify loop in a real browser. |
| `/qa-only` | QA reporting without code changes. |
| `/cso` | Security review and security findings. |
| `/document-release` | Sync docs with what actually shipped. |
| `/ship` | Final release gate using canonical state. |
| `/browse` | Direct access to the headless browser runtime. |

Legacy wrappers are still available for migration:

- `/office-hours`
- `/plan-ceo-review`
- `/plan-eng-review`
- `/plan-design-review`
- `/autoplan`

`/codex` is intentionally gone. Codex is the native runtime, not an external second-opinion layer.

## Installation

Quick start:

```bash
git clone https://github.com/krzysztofcelmer/kstack.git ~/.codex/skills-src/kstack
cd ~/.codex/skills-src/kstack
bun install
BUN_BIN="${BUN_BIN:-$HOME/.bun/bin/bun}" "$BUN_BIN" run build
./setup
```

That installs the Codex runtime under:

```text
~/.codex/skills/kstack
```

For the full installation guide, including prerequisites, verification, repo-local development installs, upgrades, uninstall, and troubleshooting, read [docs/installation-guide.md](/Users/krzysztofcelmer/Documents/codex/kstack/docs/installation-guide.md).

## Typical Usage Scenario

Example: the user asks for a new onboarding flow, but the request is still fuzzy.

1. Run `/discover` to capture the real pain, examples, goals, non-goals, and candidate wedge.
2. Run `/sprint-freeze` to turn that into a bounded execution contract.
3. Implement the flow.
4. Run `/review` and `/qa`.
5. If QA reveals that the original assumptions were wrong, run `/ingest-learning`.
6. If the delta materially changes scope, refresh `/sprint-freeze`.
7. Only then continue implementation or ship.

That intent-update cycle is a first-class part of the model, not an exception.

For a detailed end-to-end scenario, including multiple intent update cycles, read [docs/typical-workflow.md](/Users/krzysztofcelmer/Documents/codex/kstack/docs/typical-workflow.md).

## Runtime Layout

- Repo-local workflow state: `.kstack/state/`
- Repo-local report projections: `.kstack/reports/`
- User-global config and install metadata: `~/.kstack/`
- Installed Codex runtime root: `~/.codex/skills/kstack`
- Repo-local generated runtime root: `.agents/skills/kstack`

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
