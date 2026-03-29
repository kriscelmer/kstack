# kstack — Codex Workflow Pack

`kstack` is a Codex-first workflow system. Every workflow action reads or writes the same canonical branch state at `.kstack/state/<normalized-branch>.json`.

## Operational Rules

1. Treat `.kstack/state` as the workflow source of truth.
2. The only public skill entrypoint is `/kstack`.
3. If the user invokes bare `/kstack`, treat it as help mode and explain the available subcommands.
4. If new information changes the original plan, update state with `/kstack ingest-learning` instead of silently continuing.
5. If the delta changes scope or acceptance criteria, refresh the sprint with `/kstack sprint-freeze`.
6. Review, QA, security, and release work should write normalized findings or satisfied checks back into state.
7. Generated `SKILL.md` files are outputs. Edit `SKILL.md.tmpl` sources only.

## Primary Commands

| Command | Purpose |
| --- | --- |
| `/kstack` | Help mode. Explain usage and list subcommands. |
| `/kstack init` | Bootstrap repo-local KStack state and `AGENTS.md` guidance. |
| `/kstack discover` | Capture ambiguous requests into an `IntentRecord`. |
| `/kstack sprint-freeze` | Write the active `SprintBrief`, routing, tests, and docs obligations. |
| `/kstack implement` | Read the active sprint and implement against it. |
| `/kstack ingest-learning` | Append `DeltaRecord`s after review, QA, or user feedback. |
| `/kstack review` | Pre-landing review with normalized findings. |
| `/kstack qa` | Browser QA with fix-and-verify loop. |
| `/kstack qa-only` | Browser QA without code changes. |
| `/kstack cso` | Security lens and security findings. |
| `/kstack document-release` | Sync docs with what shipped. |
| `/kstack ship` | Final release gate using canonical state. |
| `/kstack browse` | Headless browser runtime. |

## Legacy Wrappers

These commands still exist for migration, but they write to the same canonical state and are invoked through the same routed entrypoint:

- `/kstack office-hours`
- `/kstack plan-ceo-review`
- `/kstack plan-eng-review`
- `/kstack plan-design-review`
- `/kstack autoplan`

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
- Global config lives under `~/.kstack/`.
- `gstack-*` binaries are compatibility wrappers only. New code should use `kstack-*`.
- Public skill invocations use `/kstack <subcommand>`, not separate top-level skills.
- If intent changes mid-sprint, do not just “keep going”. Capture the delta and re-freeze if needed.
