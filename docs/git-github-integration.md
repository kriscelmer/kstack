# Git, GitHub, and KStack

## The Responsibility Split

KStack is not a replacement for Git or GitHub.

The intended model is:

- **Git** is the source of code truth.
- **GitHub** is the source of collaboration and enforcement.
- **KStack** is the source of workflow truth for the current branch.

That means:

- Git owns branches, commits, diffs, and merges.
- GitHub owns pull requests, reviews, Actions, required checks, and merge policy.
- KStack owns the branch-local execution contract:
  - intent
  - active sprint
  - findings
  - required and satisfied checks
  - docs obligations
  - semantic readiness

## Why Branches Matter

KStack is branch-local by design.

A branch is already the natural unit of:

- a focused change
- a working hypothesis
- a review surface
- a release candidate

That makes branch-local workflow state a good fit for AI-assisted engineering work.

The preferred model is:

- `main` is protected and releasable
- feature branches are short-lived
- one branch carries one active `IntentRecord`
- one branch carries one active `SprintBrief`

If a change splits into two unrelated directions, create two branches instead of one branch with two execution contracts.

## The Hybrid Projection Model

KStack now distinguishes between:

### 1. Raw operational state

Local runtime state lives in:

```text
.kstack/state/<normalized-branch>.json
```

This file is operational memory for the current branch. It is intentionally noisy and not committed by default.

### 2. Local runtime artifacts

Runtime artifacts and repro material live under:

```text
.kstack/reports/
```

These stay local as well.

### 3. Durable branch contracts

Commitable branch contract projections live under:

```text
.kstack/contracts/<normalized-branch>.json
.kstack/contracts/<normalized-branch>.md
```

These are low-noise summaries derived from the raw state. They are meant for:

- review
- pull request context
- semantic readiness checks
- auditability in Git history

## Pull Requests

In the GitHub model:

- the branch is the code change
- the branch contract is the semantic execution contract
- the pull request is the GitHub representation of that branch

Recommended rule:

- open a **Draft PR after `/kstack sprint-freeze`**

At that point:

- the branch has an explicit sprint contract
- the branch contract can be exported from KStack
- the PR can describe what the branch is supposed to do before the code is complete

Use:

```bash
bin/kstack-state export-pr
```

to generate the PR body fragment from the current branch contract.

## Semantic Readiness

GitHub checks tell you whether automation passed.
KStack readiness tells you whether the branch contract is still coherent.

That is what the `kstack-ready` check is for.

It evaluates whether:

- a sprint is frozen
- post-freeze learning requires a new sprint freeze
- blocking findings remain open
- required tests are satisfied
- docs obligations are resolved

This complements CI. It does not replace CI.

## Recommended GitHub Settings

For repositories using KStack:

- protect `main`
- disallow direct pushes to `main`
- merge through PR only
- require approving reviews
- require these checks:
  - `Workflow Lint`
  - `Skill Docs Freshness`
  - `E2E Evals`
  - `kstack-ready`

Recommended `CODEOWNERS` coverage:

- `.github/workflows/*`
- `AGENTS.md`
- `README.md`
- `docs/*`
- `*/SKILL.md.tmpl`
- `scripts/*`
- `bin/*`
- `lib/*`

## Workflow Shape

The preferred loop is:

```text
git checkout -b feat/my-change
  -> /kstack discover
  -> /kstack sprint-freeze
  -> export branch contract
  -> open Draft PR
  -> /kstack implement
  -> /kstack review
  -> /kstack qa
  -> /kstack cso (if relevant)
  -> /kstack ingest-learning (if assumptions changed)
  -> /kstack sprint-freeze again (if needed)
  -> /kstack ship
  -> merge PR
```

That keeps the responsibilities clean:

- Git manages the code change
- GitHub manages acceptance of the change
- KStack manages the meaning of the change
