# Contributing

## Local Workflow

```bash
bun install
bun run build
bun test
```

`kstack` is Codex-only. The build regenerates `SKILL.md` files, compiles the browse CLI, compiles `kstack-state`, and refreshes the `.agents/skills/kstack` runtime root.

## Repository Rules

- Edit `*/SKILL.md.tmpl`, not generated `SKILL.md`.
- Keep workflow truth in `.kstack/state/`, not ad hoc plan files.
- Prefer `kstack-*` binaries and `KSTACK_*` environment variables in new code.
- Leave `gstack-*` wrappers only for migration compatibility.

## Testing Focus

The test suite covers:

- workflow state schema and mutation rules
- routing heuristics
- generator freshness and output shape
- Codex-only setup behavior
- utility binaries and compatibility wrappers
- browse path resolution under `.kstack/`

## Release Docs

Any public behavior change should update:

- `README.md`
- `AGENTS.md`
- `ARCHITECTURE.md`
- `docs/skills.md`
- `docs/migration-to-kstack.md` when migration semantics changed
