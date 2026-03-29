# Skills

## Public Entry Point

KStack now exposes one public skill:

| Command | Purpose |
| --- | --- |
| `/kstack` | Help mode. Explain how the workflow works and list supported subcommands. |

Run `/kstack` or `/kstack help` when you need to discover the available operations. All actual workflow actions are routed through `/kstack <subcommand>`.

## Primary Routed Subcommands

| Command | Purpose |
| --- | --- |
| `/kstack init` | Bootstrap `.kstack/state/`, repo-local `AGENTS.md` guidance, and unborn `main` in empty repos. |
| `/kstack discover` | Capture intent and ambiguity once. |
| `/kstack sprint-freeze` | Lock the active execution contract. |
| `/kstack implement` | Read the current sprint and implement against it. |
| `/kstack ingest-learning` | Record what changed after review, QA, or feedback. |
| `/kstack review` | Find code-level bugs and missing validation. |
| `/kstack qa` | Test, fix, and verify in a real browser. |
| `/kstack qa-only` | Test and report without changing code. |
| `/kstack cso` | Run the security lens. |
| `/kstack document-release` | Sync docs with shipped behavior. |
| `/kstack ship` | Final release gate. |
| `/kstack browse` | Use the browser runtime directly. |
| `/kstack careful` | Activate destructive-command warnings. |
| `/kstack freeze` | Restrict edits to one directory or module. |
| `/kstack guard` | Combine careful and freeze. |
| `/kstack unfreeze` | Remove a previous freeze boundary. |
| `/kstack upgrade` | Update the local KStack installation. |

Routed commands are meant to be short and neutral because the workflow is state-native. The subcommand name should describe the transition or operation being performed, not a persona.

## Legacy Wrappers

| Command | Maps To |
| --- | --- |
| `/kstack office-hours` | `/kstack discover` |
| `/kstack plan-ceo-review` | `/kstack sprint-freeze` + `product` lens |
| `/kstack plan-eng-review` | `/kstack sprint-freeze` + `architecture` lens |
| `/kstack plan-design-review` | `/kstack sprint-freeze` + `design` lens |
| `/kstack autoplan` | `/kstack discover` + `/kstack sprint-freeze` + all lenses |

## Suggested Use Order

1. `/kstack`
2. `/kstack init`
3. `/kstack discover`
4. `/kstack sprint-freeze`
5. `/kstack implement`
6. `/kstack review` and `/kstack qa`
7. `/kstack ingest-learning` when assumptions or scope move
8. `/kstack document-release`
9. `/kstack ship`
