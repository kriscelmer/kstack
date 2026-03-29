# Contributing

## Development Setup

```bash
bun install
bun run build
bun test
```

If `bun` is installed outside your shell PATH, use:

```bash
BUN_BIN="${BUN_BIN:-$HOME/.bun/bin/bun}" "$BUN_BIN" run build
BUN_BIN="${BUN_BIN:-$HOME/.bun/bin/bun}" "$BUN_BIN" test
```

`kstack` is Codex-only. The build:

- regenerates all `SKILL.md` files
- refreshes `.agents/skills/kstack`
- compiles the browse CLI
- compiles `kstack-state`
- compiles `kstack-init`

## Repository Rules

- Edit `*/SKILL.md.tmpl`, not generated `SKILL.md`.
- Keep workflow truth in `.kstack/state/`, not ad hoc plan files.
- Prefer `kstack-*` binaries and `KSTACK_*` environment variables in new code.
- Leave `gstack-*` wrappers only for migration compatibility.
- If intent changes mid-implementation, reflect that in docs and state-oriented code paths instead of encoding assumptions in chat-only prose.

## What To Update When Behavior Changes

Any public behavior change should update:

- `README.md`
- `AGENTS.md`
- `ARCHITECTURE.md`
- `docs/skills.md`
- `docs/installation-guide.md`
- `docs/typical-workflow.md` when the workflow loop changed
- `docs/kstack-concept.md` when the design philosophy changed
- `docs/migration-to-kstack.md` when migration semantics changed

## Testing Focus

The test suite covers:

- workflow state schema and mutation rules
- routing heuristics
- generator freshness and output shape
- Codex-only setup behavior
- utility binaries and compatibility wrappers
- browse path resolution under `.kstack/`

Run:

```bash
bun test
bun run skill:check
```

before shipping doc or workflow changes.

## Working On Skills

The important workflow pattern is:

1. the root template describes the routed `/kstack` entrypoint
2. subcommand templates describe `/kstack <subcommand>` behavior
3. the generator produces in-repo `SKILL.md` files
4. the generator produces `.agents/skills/kstack/SKILL.md` for the public router
5. the generator produces `.agents/skills/kstack/<subcommand>/SKILL.md` for internal routed guides
6. `./setup` exposes only `~/.codex/skills/kstack` as the public skill

Do not hand-edit generated skill output.

## Working On Workflow State

If you change:

- `WorkflowStateV1`
- routing heuristics
- intent, sprint, delta, or finding semantics
- setup paths

you should update:

- docs
- tests
- any shell-facing `kstack-*` utility that reads or writes state
