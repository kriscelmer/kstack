# kstack — Codex Workflow Pack

`kstack` is a Codex-first workflow system. Every workflow action reads or writes the same canonical branch state at `.kstack/state/<normalized-branch>.json`.

In most KStack repositories, raw `.kstack/state/` stays local. This repository is the self-hosting exception: committed branch state under `.kstack/state/` is part of the repo and should be read before continuing KStack work on KStack itself.

Self-hosting branch policy:

- `main` keeps only `.kstack/state/main.json`
- feature branches may carry raw `.kstack/state/<branch>.json` while they are active
- raw feature-branch state must not survive merge to `main`
- committed `.kstack/contracts/<branch>.json` and `.md` remain as durable branch history

## Operational Rules

1. Treat `.kstack/state` as the workflow source of truth. In this repo, the committed branch state file is the canonical self-hosting artifact.
2. The only public skill entrypoint is `/kstack`.
3. Bare `/kstack` is help mode. Explain usage and list supported subcommands.
4. If new information changes the current contract, record it with `/kstack ingest-learning`.
5. If the delta changes scope, acceptance criteria, or risk, refresh the sprint with `/kstack sprint-freeze`.
6. Review, QA, security, and release work must write normalized findings or satisfied checks back into state.
7. Generated `SKILL.md` files are outputs. Edit `SKILL.md.tmpl` sources only.

## Public Commands

| Command | Purpose |
| --- | --- |
| `/kstack` | Help mode. Explain usage and list subcommands. |
| `/kstack init` | Bootstrap repo-local KStack state and `AGENTS.md` guidance. |
| `/kstack discover` | Capture ambiguity into an `IntentRecord`. |
| `/kstack sprint-freeze` | Write the active `SprintBrief`, routing, tests, and docs obligations. |
| `/kstack implement` | Read the active sprint and implement against it. |
| `/kstack ingest-learning` | Append `DeltaRecord`s after review, QA, or user feedback. |
| `/kstack review` | Pre-landing review with normalized findings. |
| `/kstack qa` | Browser QA with fix-and-verify, or report-only mode when the user asks not to edit code. |
| `/kstack cso` | Security lens and security findings. |
| `/kstack document-release` | Sync docs with what shipped. |
| `/kstack ship` | Final release gate using canonical state. |

## Truth Precedence

1. `code`, `tests`, and config
2. `.kstack/state/<branch>.json`
3. `.kstack/contracts/<branch>.json`
4. `.kstack/reports/`
5. conversation context

## Build Commands

```bash
bun install
bun run build
bun test
bun run gen:skill-docs
bun run skill:check
```

## Conventions

- Edit `SKILL.md.tmpl` files, never generated `SKILL.md` files.
- `kstack-state` is the canonical state interface for shell-driven skills.
- Raw repo-local workflow state lives under `.kstack/state/`, tracked branch contracts live under `.kstack/contracts/`, and local evidence artifacts live under `.kstack/reports/`.
- This repository intentionally tracks `.kstack/state/main.json` as the canonical self-hosting baseline on `main`. Feature-branch raw state is temporary and must be removed before merge.
- Committed `.kstack/contracts/*.json` and `.md` files are the durable history that stays after merge.
- Global config lives under `~/.kstack/`.
- Direct browser capability is preserved as runtime infrastructure and shell tooling, not as a routed `/kstack` command.
- Public skill invocations use `/kstack <subcommand>`, not separate top-level skills.
- If intent changes mid-sprint, do not just continue. Capture the delta and re-freeze if needed.
