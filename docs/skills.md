# Skills

## Public Entry Point

KStack exposes one public skill:

| Command | Purpose |
| --- | --- |
| `/kstack` | Help mode. Explain how the workflow works and list supported subcommands. |

Run `/kstack` or `/kstack help` when you need to discover the available operations. All workflow actions are routed through `/kstack <subcommand>`.

## Supported Routed Subcommands

| Command | Purpose |
| --- | --- |
| `/kstack init` | Bootstrap `.kstack/state/`, repo-local `AGENTS.md` guidance, and unborn `main` in empty repos. |
| `/kstack discover` | Capture intent and ambiguity once. |
| `/kstack sprint-freeze` | Lock the active execution contract. |
| `/kstack implement` | Read the current sprint and implement against it. |
| `/kstack ingest-learning` | Record what changed after review, QA, or feedback. |
| `/kstack review` | Find code-level bugs and missing validation. |
| `/kstack qa` | Test in a real browser, then either fix-and-verify or report-only depending on the request. |
| `/kstack cso` | Run the security lens. |
| `/kstack document-release` | Sync docs with shipped behavior. |
| `/kstack ship` | Final release gate. |

The branch contract and PR body are generated through the state CLI, not through a separate public skill:

```bash
bin/kstack-state export-contract
bin/kstack-state export-pr
bin/kstack-state ready
```

## Suggested Use Order

1. `/kstack`
2. `/kstack init`
3. `/kstack discover`
4. `/kstack sprint-freeze`
5. export the branch contract and open a Draft PR
6. `/kstack implement`
7. `/kstack review`
8. `/kstack qa`
9. `/kstack ingest-learning` when assumptions or scope move
10. `/kstack document-release`
11. `/kstack ship`

## Notes

- Direct browser capability still exists as runtime infrastructure and shell tooling, but it is not a routed `/kstack` command.
- Design-specific review is represented as a `design` lens in state and routing, not as a separate public skill.
- Updating KStack is a shell workflow documented in the installation guide, not a routed skill.
