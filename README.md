# kstack

`kstack` is a Codex-first workflow system for software delivery. It keeps one canonical branch-local workflow state in the repo, exports a durable branch contract for Git and GitHub, and uses browser automation as verification infrastructure instead of as the workflow brain.

At the center of `kstack` is one rule:

> one branch, one workflow state, one current execution contract

## What KStack Owns

- **Git** owns code history, diffs, branches, and merges.
- **GitHub** owns pull requests, collaboration, CI, approvals, and merge enforcement.
- **KStack** owns workflow meaning for the current branch: intent, sprint scope, findings, checks, docs obligations, and semantic readiness.

The canonical workflow state lives at:

```text
.kstack/state/<normalized-branch>.json
```

Durable branch contract projections live at:

```text
.kstack/contracts/<normalized-branch>.json
.kstack/contracts/<normalized-branch>.md
```

In normal KStack-managed repositories, raw `.kstack/state/` stays local and untracked while `.kstack/contracts/` is the durable tracked artifact. This repository is the deliberate self-hosting exception: `.kstack/state/` is committed here so KStack can manage itself from repo truth.

Self-hosting rule:

- `main` keeps only `.kstack/state/main.json`
- feature branches may carry raw `.kstack/state/<branch>.json` while work is active
- raw feature-branch state must be removed before merge
- committed `.kstack/contracts/<branch>.json` and `.md` remain as durable branch history after merge

## Public Command Surface

`kstack` exposes exactly one public skill entrypoint:

```text
/kstack
```

Supported routed commands:

- `/kstack`
- `/kstack help`
- `/kstack init`
- `/kstack discover`
- `/kstack sprint-freeze`
- `/kstack implement`
- `/kstack ingest-learning`
- `/kstack review`
- `/kstack qa`
- `/kstack cso`
- `/kstack document-release`
- `/kstack ship`

`/kstack qa` handles both fix-and-verify QA and report-only QA, depending on the user’s request. There are no legacy wrapper commands, no secondary public aliases, and no extra routed browser command.

## Canonical Workflow

1. `/kstack init`
2. `/kstack discover`
3. `/kstack sprint-freeze`
4. `bin/kstack-state export-contract`
5. `bin/kstack-state export-pr`
6. `/kstack implement`
7. `/kstack review`
8. `/kstack qa`
9. `/kstack cso` when the change is security-sensitive
10. `/kstack ingest-learning` if new information changes the contract
11. `/kstack sprint-freeze` again if the sprint moved
12. `/kstack document-release`
13. `/kstack ship`

For KStack working on itself, treat `main` as the self-hosting baseline:

- `.kstack/state/main.json` is the canonical raw main-branch state
- `.kstack/contracts/main.json` and `.md` are the canonical committed main contract
- future KStack work happens on short-lived feature branches that follow the same discover -> freeze -> implement -> review/qa -> ingest-learning -> ship loop

Truth precedence:

1. `code`, `tests`, and config
2. `.kstack/state/<branch>.json`
3. `.kstack/contracts/<branch>.json`
4. `.kstack/reports/`
5. conversation context

## Environment Prerequisites

Required:

- Git installed and available in the shell
- Bun installed and available either on `PATH` or at `~/.bun/bin/bun`
- Codex installed and logged in
- write access to `~/.codex/skills/`
- write access to `~/.kstack/`

Expected runtime context:

- `kstack` is Codex-only
- repositories should be git repos so branch-local state can be stored at `.kstack/state/<branch>.json`
- browser-driven QA depends on the local browser runtime generated during `bun run build`

Quick verification:

```bash
git --version
~/.bun/bin/bun --version
codex --version
codex login
```

## Installation

```bash
git clone https://github.com/kriscelmer/kstack.git ~/.codex/skills-src/kstack
cd ~/.codex/skills-src/kstack
bun install
BUN_BIN="${BUN_BIN:-$HOME/.bun/bin/bun}" "$BUN_BIN" run build
./setup
```

That installs one public Codex runtime root:

```text
~/.codex/skills/kstack
```

## Updating

KStack updates are a shell workflow, not a routed skill:

```bash
cd ~/.codex/skills-src/kstack
git pull --ff-only
bun install
bun run build
./setup --force
```

## Runtime Layout

- Repo-local workflow state: `.kstack/state/`
- In most KStack repos this state stays local; in this repo `main.json` is intentionally tracked for self-hosting and feature-branch raw state is temporary
- Repo-local tracked branch contracts: `.kstack/contracts/`
- Repo-local report projections: `.kstack/reports/`
- User-global config and install metadata: `~/.kstack/`
- Installed Codex runtime root: `~/.codex/skills/kstack`
- Repo-local generated runtime root: `.agents/skills/kstack`
- Browser and extension runtime assets: `browse/` and `extension/`

## Development

```bash
bun install
BUN_BIN="${BUN_BIN:-$HOME/.bun/bin/bun}" "$BUN_BIN" run build
BUN_BIN="${BUN_BIN:-$HOME/.bun/bin/bun}" "$BUN_BIN" test
BUN_BIN="${BUN_BIN:-$HOME/.bun/bin/bun}" "$BUN_BIN" run skill:check
BUN_BIN="${BUN_BIN:-$HOME/.bun/bin/bun}" "$BUN_BIN" run bin/kstack-state.ts export-contract --check --branch main
BUN_BIN="${BUN_BIN:-$HOME/.bun/bin/bun}" "$BUN_BIN" run bin/kstack-state.ts verify-self-hosting
```

Templates live in `*/SKILL.md.tmpl`. Generated outputs should never be edited directly.

## Documentation Map

- [docs/installation-guide.md](docs/installation-guide.md)
- [docs/typical-workflow.md](docs/typical-workflow.md)
- [docs/maintainer-runbook.md](docs/maintainer-runbook.md)
- [docs/kstack-concept.md](docs/kstack-concept.md)
- [docs/git-github-integration.md](docs/git-github-integration.md)
- [docs/skills.md](docs/skills.md)
- [ARCHITECTURE.md](ARCHITECTURE.md)
- [BROWSER.md](BROWSER.md)
