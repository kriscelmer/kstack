# Contributing

## Development Loop

```bash
bun install
bun run build
bun test
bun run skill:check
```

## Workflow Rules

- Treat `.kstack/state/<branch>.json` as workflow truth.
- Use `/kstack` as the only public skill entrypoint.
- Keep changes branch-scoped and contract-driven.
- On `main`, keep only `.kstack/state/main.json`; raw feature-branch state must be removed before merge.
- If intent changes mid-sprint, record the delta with `/kstack ingest-learning` and refresh `/kstack sprint-freeze` when needed.

## Editing Rules

- Edit `SKILL.md.tmpl`, not generated `SKILL.md`.
- Keep public routed commands limited to the supported KStack surface.
- Keep browser capability as runtime infrastructure, not as a second public workflow surface.
- Keep repo-facing text in English.
- Do not reintroduce old product naming, old runtime paths, or retired wrapper commands.
- Keep committed `.kstack/contracts/<branch>.json` and `.md` files as the durable branch-history artifacts after merge.

## Command Surface

Supported routed commands:

- `/kstack init`
- `/kstack discover`
- `/kstack sprint-freeze`
- `/kstack implement`
- `/kstack ingest-learning`
- `/kstack review`
- `/kstack qa`
- `/kstack cso`
- `/kstack document-release`
- `/kstack ship`

## Validation

Before landing a change:

- run `bun run build`
- run `bun test`
- run `bun run skill:check`
- run `bun run bin/kstack-state.ts export-contract --check --branch main`
- run `bun run bin/kstack-state.ts verify-self-hosting` before landing changes on `main`
- verify that docs, runtime strings, and templates remain KStack-only
