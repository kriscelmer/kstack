# TODOs

This file tracks active KStack backlog items in target-state terminology only.

## Workflow Core

### Stronger command registry validation

Ensure any new routed subcommand must be added to the explicit command registry and corresponding tests before generation succeeds.

### Richer readiness explanations

Expand `kstack-state ready` so blocked states explain the exact missing inputs, findings, or docs obligations in a more review-friendly format.

### Contract projection diffs

Add a simple command or report projection that shows what changed between the previous branch contract and the current one.

## GitHub Integration

### PR body sync helper

Add an optional shell helper that updates a Draft PR body from `bin/kstack-state export-pr` without turning that into a public routed skill.

### Better `kstack-ready` summaries

Improve the GitHub job summary so reviewers see the blocked checks, open findings summary, and re-freeze requirement at a glance.

## Browser Runtime

### Better real-browser reconnect recovery

Tighten recovery behavior when the visible Chrome session is alive but partially disconnected.

### Authenticated QA ergonomics

Make cookie import and headed-session handoff more predictable for QA flows that need authenticated state.

## Documentation

### Example branch contract fixture

Add one realistic example of `.kstack/contracts/<branch>.json` and the corresponding PR projection to make the Git/GitHub integration model easier to learn.

### Maintainer runbook

Write a shorter permanent maintainer runbook for large refactors that use KStack itself as the workflow manager.
