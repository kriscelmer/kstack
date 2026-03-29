# kstack — Codex Workflow Pack

`kstack` is a Codex-first workflow system. Every skill reads or writes the same canonical branch state at `.kstack/state/<normalized-branch>.json`.

## Operational Rules

1. Treat `.kstack/state` as the workflow source of truth.
2. If new information changes the original plan, update state with `/ingest-learning` instead of silently continuing.
3. If the delta changes scope or acceptance criteria, refresh the sprint with `/sprint-freeze`.
4. Review, QA, security, and release work should write normalized findings or satisfied checks back into state.
5. Generated `SKILL.md` files are outputs. Edit `SKILL.md.tmpl` sources only.

## Primary Skills

| Skill | Purpose |
| --- | --- |
| `/discover` | Capture ambiguous requests into an `IntentRecord`. |
| `/sprint-freeze` | Write the active `SprintBrief`, routing, tests, and docs obligations. |
| `/ingest-learning` | Append `DeltaRecord`s after review, QA, or user feedback. |
| `/review` | Pre-landing review with normalized findings. |
| `/qa` | Browser QA with fix-and-verify loop. |
| `/qa-only` | Browser QA without code changes. |
| `/cso` | Security lens and security findings. |
| `/document-release` | Sync docs with what shipped. |
| `/ship` | Final release gate using canonical state. |
| `/browse` | Headless browser runtime. |

## Legacy Wrappers

These commands still exist for migration, but they write to the same canonical state:

- `/office-hours`
- `/plan-ceo-review`
- `/plan-eng-review`
- `/plan-design-review`
- `/autoplan`

## Truth Precedence

1. `code`, `tests`, and config
2. `.kstack/state/<branch>.json`
3. `.kstack/reports/`
4. conversation context

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
- Repo-local truth lives under `.kstack/`. Global config lives under `~/.kstack/`.
- `gstack-*` binaries are compatibility wrappers only. New code should use `kstack-*`.
- If intent changes mid-sprint, do not just “keep going”. Capture the delta and re-freeze if needed.
