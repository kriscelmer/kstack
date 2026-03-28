# Architecture

## Core Model

`kstack` is built around one canonical repo-local state file per branch:

- `.kstack/state/<normalized-branch>.json`

That file carries:

- `intent_record`
- `active_sprint_brief`
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

## Why This Replaced The Old Plan Stack

The original `gstack` workflow spread planning state across review transcripts, docs, JSONL logs, and host-specific side effects. That made the workflow hard to inspect, hard to update after new learnings, and hard to automate across branches.

`kstack` collapses that into one branch-local source of truth. Skills become thin views over shared state instead of separate plan systems.

## Runtime Layout

- `.kstack/state/` stores canonical workflow state.
- `.kstack/reports/` stores projections such as QA evidence or human-readable summaries.
- `~/.kstack/` stores user-global config and install metadata.
- `.agents/skills/kstack/` is the repo-local Codex runtime root used in development.
- `~/.codex/skills/kstack` is the installed Codex runtime root.

## Browser Runtime

The browse architecture is intentionally preserved:

- `browse/dist/browse` is the compiled CLI entrypoint.
- `browse/src/server.ts` runs the persistent browser server.
- Project-local browser state and logs now live under `.kstack/` instead of `.gstack/`.

## Skill Generation

Every `SKILL.md` file is generated from a `SKILL.md.tmpl` source. The generator writes:

- in-repo `SKILL.md`
- `.agents/skills/<skill>/SKILL.md`
- `.agents/skills/<skill>/agents/openai.yaml`

The root runtime directory `.agents/skills/kstack/` also links shared runtime assets such as `bin/`, `browse/`, docs, and version files.
