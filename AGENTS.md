# kstack — Codex Workflow Pack

`kstack` is a Codex-first workflow system. Every skill uses the same canonical branch state at `.kstack/state/<normalized-branch>.json`.

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
