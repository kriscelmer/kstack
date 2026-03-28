# Migration To kstack

## What Changed

- The project was rebranded from `gstack` to `kstack`.
- Codex is the only supported host.
- The old planning ceremony was replaced by canonical repo-local workflow state.
- Public binaries now use `kstack-*` and `KSTACK_*`.
- `gstack-*` binaries remain as compatibility wrappers only.
- `/codex` was removed.

## New Canonical Commands

- `/discover`
- `/sprint-freeze`
- `/ingest-learning`

## Legacy Wrappers Still Supported

- `/office-hours`
- `/plan-ceo-review`
- `/plan-eng-review`
- `/plan-design-review`
- `/autoplan`

## State Migration

- New writes go to `.kstack/` and `~/.kstack/`.
- `lib/workflow-state.ts` can read legacy `.gstack/` and `~/.gstack/` locations as fallback inputs when no `.kstack` state exists yet.
- New workflow truth should never be written back to `.gstack/`.

## Intentionally Deferred

- The Chrome side-panel automation path is preserved as runtime code, but the workflow model around it is no longer a first-class planning surface.
- Community telemetry and multi-host eval infrastructure were removed instead of being ported.
