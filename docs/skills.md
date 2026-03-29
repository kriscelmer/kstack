# Skills

## Primary

| Command | Purpose |
| --- | --- |
| `/discover` | Capture intent and ambiguity once. |
| `/sprint-freeze` | Lock the active execution contract. |
| `/ingest-learning` | Record what changed after review, QA, or feedback. |
| `/review` | Find code-level bugs and missing validation. |
| `/qa` | Test, fix, and verify in a real browser. |
| `/qa-only` | Test and report without changing code. |
| `/cso` | Run the security lens. |
| `/document-release` | Sync docs with shipped behavior. |
| `/ship` | Final release gate. |
| `/browse` | Use the browser runtime directly. |

Primary commands are meant to be short and neutral because the workflow is state-native. The command name should describe the transition or operation being performed, not a persona.

## Legacy Wrappers

| Command | Maps To |
| --- | --- |
| `/office-hours` | `/discover` |
| `/plan-ceo-review` | `/sprint-freeze` + `product` lens |
| `/plan-eng-review` | `/sprint-freeze` + `architecture` lens |
| `/plan-design-review` | `/sprint-freeze` + `design` lens |
| `/autoplan` | `/discover` + `/sprint-freeze` + all lenses |

## Suggested Use Order

1. `/discover`
2. `/sprint-freeze`
3. implementation
4. `/review` and `/qa`
5. `/ingest-learning` when assumptions or scope move
6. `/document-release`
7. `/ship`
