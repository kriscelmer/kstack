# kstack

`kstack` is a Codex-first workflow pack for software delivery. It keeps one canonical workflow state per branch in `.kstack/state/<normalized-branch>.json`, gives Codex short high-signal commands for discovery and execution, and preserves the fast headless browser runtime for QA and verification.

## What Changed

- `gstack` has been rebranded to `kstack`.
- Codex is the only supported host. Claude, Gemini, and Kiro-specific setup and review flows were removed.
- The old artifact-heavy planning ceremony was replaced by canonical repo-local workflow state.
- `/discover`, `/sprint-freeze`, and `/ingest-learning` are now the primary planning commands.
- `/office-hours`, `/plan-ceo-review`, `/plan-eng-review`, `/plan-design-review`, and `/autoplan` remain as migration wrappers over the same state.
- `/codex` does not exist anymore.

## Canonical Workflow

1. `/discover` captures the `IntentRecord`.
2. `/sprint-freeze` writes the active `SprintBrief`, routing decision, required lenses, tests, and doc obligations.
3. `/review`, `/qa`, `/cso`, `/document-release`, and `/ship` update the same state instead of creating parallel workflow artifacts.
4. `/ingest-learning` appends deltas after review, QA, or user feedback when assumptions move.

Truth precedence:

1. `code`, `tests`, and config
2. `.kstack/state/<branch>.json`
3. `.kstack/reports/`
4. conversation

## Install

Global Codex install:

```bash
git clone https://github.com/krzysztofcelmer/kstack.git ~/.codex/skills-src/kstack
cd ~/.codex/skills-src/kstack
bun install
bun run build
./setup
```

Repo-local install for development:

```bash
cd /path/to/kstack
bun install
bun run build
./setup --local --force
```

## Primary Skills

- `/discover` for ambiguity capture and intent framing.
- `/sprint-freeze` for the execution contract.
- `/ingest-learning` for delta-based iteration.
- `/review`, `/qa`, `/qa-only`, `/cso`, `/document-release`, and `/ship` for assurance and release work.
- `/browse` for headless browser control.
- `/office-hours`, `/plan-ceo-review`, `/plan-eng-review`, `/plan-design-review`, and `/autoplan` as legacy wrappers.

## Runtime Layout

- Repo-local workflow state: `.kstack/state/`
- Repo-local report projections: `.kstack/reports/`
- User-global config and install metadata: `~/.kstack/`
- Codex runtime root: `~/.codex/skills/kstack`
- Repo-local generated runtime root: `.agents/skills/kstack`

## Development

```bash
bun install
bun run build
bun test
bun run skill:check
```

Templates live in `*/SKILL.md.tmpl`. Generated outputs should never be edited directly.

For migration notes, see [docs/migration-to-kstack.md](/Users/krzysztofcelmer/Documents/codex/kstack/docs/migration-to-kstack.md).
