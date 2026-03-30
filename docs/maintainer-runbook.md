# Maintainer Runbook

This runbook describes how to develop KStack with KStack itself.

## Main-Branch Baseline

The self-hosting baseline for this repository is:

- `.kstack/state/main.json`
- `.kstack/contracts/main.json`
- `.kstack/contracts/main.md`

`main` must not accumulate raw feature-branch state.

## Feature-Branch Workflow

Use short-lived branches from `main`.

Recommended loop:

1. create a branch from `main`
2. run `/kstack discover`
3. run `/kstack sprint-freeze`
4. run `bin/kstack-state export-contract`
5. run `bin/kstack-state export-pr`
6. open a Draft PR
7. run `/kstack implement`
8. run `/kstack review`
9. run `/kstack qa`
10. run `/kstack cso` when the change is security-sensitive
11. run `/kstack ingest-learning` if assumptions or scope change
12. run `/kstack sprint-freeze` again if the contract moved
13. run `/kstack document-release`
14. run `/kstack ship`

## Raw State Policy

- `main` keeps only `.kstack/state/main.json`
- feature branches may commit `.kstack/state/<branch>.json` while the branch is active
- before merge, remove the raw feature-branch state file from the merge tip
- keep the committed branch contract artifacts after merge

The durable history of a shipped feature branch is the committed contract:

- `.kstack/contracts/<branch>.json`
- `.kstack/contracts/<branch>.md`

## Pre-Merge Validation

Before merging into `main`, run:

```bash
bun run build
bun test
bun run skill:check
```

For the committed main baseline, also keep these checks passing:

```bash
bun run bin/kstack-state.ts export-contract --check --branch main
bun run bin/kstack-state.ts verify-self-hosting
```

## Mainline Rule

After merge, `main` should be able to continue work immediately from committed repo state and committed main contract without any bootstrap step.
