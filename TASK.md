# TASK.md

## Title
Refactor `gstack` into a Codex-first, AI-coding-agent-native workflow system

## Checked on
2026-03-28

## Working assumptions
- This repo will be opened locally in **Codex App for Mac**.
- The primary model is **GPT-5.4**.
- The user does **not** use Claude Code as their main driver.
- The user wants this fork to become **Codex-first**, while still preserving anything genuinely useful and portable from the original project.
- You may keep optional compatibility shims for other hosts only if they are cheap and do not distort the architecture. The priority is **Codex-first local use**.

---

## Why this refactor exists
The original `gstack` is impressive, but it is optimized around **Claude Code + human-style role choreography**.

That original design has two different layers:

1. **A genuinely agent-native runtime layer**
   - persistent browser
   - low-latency browser control
   - repo-local skills generation
   - host integration and eval tooling

2. **A human-shaped coordination layer**
   - role-specific stages and artifacts
   - repeated restatement of the same intent
   - sequential review ceremony
   - cross-agent “second opinion” logic
   - design docs / plans / reports acting as working memory

The browser/runtime layer is worth preserving.
The coordination layer needs redesign.

The target is **not** “make Codex imitate Claude.”
The target is:

> make this repo feel natural for Codex as the primary coding agent, and make the workflow itself native to AI coding agents rather than to a team of humans pretending to be serialized through prompts.

---

## External product facts to respect
Use these as constraints when making design decisions:

1. **Codex App is now a command center for multiple agents and supports worktrees and long-running parallel tasks.**
2. **Codex follows repository instruction files such as `AGENTS.md`.**
3. **Codex is available across app / CLI / IDE / cloud, and local coding workflows should assume project instructions, worktree isolation, and task delegation are first-class.**
4. **Codex cloud and related Codex docs emphasize isolated environments, explicit environment configuration, and background task execution.**
5. **OpenAI exposes a docs MCP server for developer docs, and Codex can use MCP in CLI / IDE setups.**

Design the fork around those realities.

---

## Key diagnosis of the current repo

### What is already strong
Preserve these ideas unless there is a compelling reason not to:
- persistent browser runtime
- low-latency interaction model
- diff-aware testing / review instincts
- generated skill docs from templates
- strong local-tooling bias
- explicit safety affordances where they are genuinely useful

### What creates friction for AI coding agents
The main problems to remove or reduce are:

1. **Repeated re-representation of the same intent**
   - same change is reframed across `/office-hours`, `/plan-ceo-review`, `/plan-design-review`, `/plan-eng-review`, `/autoplan`, `/review`, `/qa`, `/ship`, and docs.

2. **Too many semi-canonical artifacts**
   - design docs, reports, plan files, release docs, QA artifacts, etc. require the agent to stitch truth back together.

3. **Human role serialization instead of machine-readable shared state**
   - specialist personas are useful as lenses, but expensive as separate restatement-heavy stages.

4. **Overlapping assurance passes**
   - `/review`, `/qa`, `/ship`, `/cso`, and `/codex` can re-scan the same branch with overlapping understanding costs.

5. **Human-style decision gates during execution**
   - too many intermediate approval / summary loops where a compact execution contract would do.

6. **The `/codex` skill is currently framed as a second-opinion tool against Claude**
   - that concept is wrong for this fork.

---

## Non-negotiable product direction
This fork must satisfy **both** of these goals.

### Goal A — Codex-first
Refactor the project so the default mental model, docs, setup flow, and contributor path are optimized for **Codex**.

This means at minimum:
- Codex is the primary host in docs and setup guidance.
- Root-level project instructions should be written for Codex via `AGENTS.md`.
- The repo should no longer assume a Claude-first worldview.
- The old `/codex` “second opinion” step must be removed as a core concept.

### Goal B — AI-coding-agent-native workflow
Refactor the process so it is not just a human org chart expressed as slash commands.

This means at minimum:
- ambiguity is captured once, not repeatedly restated
- downstream execution uses a stable machine-readable state
- sprint iteration is delta-based, not full-replay-based
- artifacts become projections of state, not the primary memory substrate
- role viewpoints become lenses over shared state
- review/test/security evidence flows into a normalized findings graph

---

## Strategic design principles
Implement around these principles.

### 1) Preserve human ambiguity at the boundary
Humans begin with vague intent. Do **not** try to eliminate that. Instead:
- absorb ambiguity once
- store it in a lightweight structured object
- only force precision at the sprint boundary

### 2) Freeze execution locally
Once coding starts, Codex should operate against a **bounded sprint contract**, not against a drifting pile of docs, conversations, and role outputs.

### 3) Iterate by deltas
After an MVP or sprint, new human input should be represented as a **delta**:
- what changed
- what was learned
- which assumption changed
- whether scope / architecture / risk changed

Do **not** rerun the full planning ceremony by default.

### 4) Maintain one canonical branch/sprint state
The system should have one machine-readable state object that downstream skills update and consume.

### 5) Convert roles into lenses
Product / design / architecture / security remain valid perspectives, but they should annotate a shared execution object instead of rebuilding the story in parallel prose.

### 6) Keep evidence structured
Findings, test obligations, docs obligations, risks, and validation results should be stored in structured state and rendered into human docs only as needed.

### 7) Route by risk, not ritual
Not every change deserves the full `think → plan → build → review → test → ship` pipeline at equal depth.

---

## Required implementation outcomes

### Outcome 1 — Codex becomes the primary host
Make the repo read and behave like a Codex-native project.

Required work:
- Update the README and install/setup paths so **Codex is the default** host and primary path.
- Keep or remove Claude-specific paths based on cost/benefit, but they must become secondary.
- Add a high-quality root `AGENTS.md` for Codex contributors and Codex App usage.
- Ensure repo instructions explain:
  - generated-file workflow
  - build/test commands
  - how to work with this repo in Codex
  - what files are canonical vs generated
  - how to validate changes before finishing
- Rework any text that still frames Codex as an outsider or second-opinion reviewer.

### Outcome 2 — Remove the “second opinion” concept
The existing `/codex` skill is conceptually wrong for this fork.

Required work:
- Remove the `/codex` skill as a distinct workflow concept.
- Remove or replace all references in docs, setup, quickstarts, skill tables, and generated skill docs.
- Remove any logic in `/autoplan` or related skills that escalates “codex disagreements” as a planning gate.
- Keep **Codex host support** and **Codex E2E / host integration** if useful; do **not** conflate those with the old `/codex` skill.
- If any useful logic inside the `/codex` skill should survive, migrate it into a more general internal review or challenge mechanism that is not model-brand-specific.

### Outcome 3 — Introduce canonical workflow state
Create one canonical machine-readable state for the active branch / workstream.

Suggested location:
- `.gstack/state/<branch>.json`
- or a nearby equivalent if you find a better fit

Suggested minimum schema:
- `intent_record`
- `active_sprint_brief`
- `accepted_decisions`
- `rejected_options`
- `assumptions`
- `deltas_since_last_sprint`
- `findings`
- `tests_required`
- `tests_satisfied`
- `docs_to_regenerate`
- `risk_level`
- `escalation_status`
- `provenance`

Implementation requirements:
- introduce typed helpers / schema validation
- make downstream commands read and update this state
- document precedence rules clearly

### Outcome 4 — Add explicit Discovery vs Execution split
The workflow must distinguish between:

#### Discovery mode
Handles vague intent, user pain, hypotheses, examples, non-goals, and candidate wedges.

Primary artifact:
- `Intent Record`

#### Execution mode
Handles bounded sprint implementation.

Primary artifact:
- `Sprint Brief`

Required work:
- either refactor existing skills or add new ones so this split is explicit
- discovery should feed sprint freeze
- execution should consume sprint brief, not re-litigate the whole product

### Outcome 5 — Add Sprint Freeze
Before meaningful code changes begin, the system should materialize a bounded sprint contract.

Suggested contents:
- sprint problem statement
- in-scope behavior
- out-of-scope behavior
- acceptance checks
- touched surfaces / files if known
- tolerated unresolved questions
- escalation triggers
- risk level

Required work:
- make this a real structured artifact in the canonical state
- make at least the core downstream workflow consume it

### Outcome 6 — Add Delta Record and Learning Ingest
After QA / feedback / sprint results, the system should convert learning into structured updates instead of restarting from scratch.

Required work:
- add a `Delta Record` structure
- add a clear “learning ingest” step or command
- update downstream planning / routing logic to use deltas
- only reopen broad planning when escalation thresholds are crossed

### Outcome 7 — Risk-based routing
Stop defaulting to full-process ceremony.

Required work:
- create clear routing rules based on delta / risk / change type
- examples:
  - docs-only diff → docs pipeline only
  - small bug fix → direct execution + targeted validation
  - security-sensitive change → security lens required
  - architecture change → architecture lens + deeper plan
  - vague new product request → discovery mode

This can be implemented as explicit logic, helper functions, or documented routing tables used by the relevant skills.

### Outcome 8 — Normalize findings across review/QA/security/shipping
Create a shared findings schema.

Suggested shape:
- `id`
- `source`
- `location`
- `kind`
- `severity`
- `evidence`
- `status`
- `duplicate_of`
- `linked_sprint`

Required work:
- make `/review`, `/qa`, `/cso`, `/ship`, and related flows write to the same findings model where feasible
- reduce duplicated reporting and duplicated understanding
- preserve human-readable reports as projections, not canonical memory

### Outcome 9 — Human-readable artifacts become projections
Design docs, QA reports, release docs, etc. should be derived from canonical state and evidence whenever feasible.

Required work:
- document truth precedence explicitly
- preferred order:
  1. source code / tests / configs
  2. canonical workflow state
  3. generated docs / summaries / reports
  4. freeform conversation
- update docs and implementation to reflect that

### Outcome 10 — Preserve and strengthen the real strengths
Do **not** accidentally damage the good parts while refactoring.

Must preserve if at all possible:
- browser architecture and low-latency workflow
- build system and generated skill docs workflow
- local-first development
- regression-testing instincts
- safety checks that are genuinely useful and not just ceremony

---

## Implementation guidance

### A. Prefer evolutionary refactoring over vague manifesto edits
Do not stop at README philosophy changes. This task requires **real structural changes** in code, templates, docs, and tests.

### B. Generated files rule
The repo already uses generated `SKILL.md` files.
Respect that system.

If a `SKILL.md` is generated from a template:
- edit the template and generator inputs
- regenerate outputs
- do not hand-edit only the generated result unless the repo genuinely requires it

### C. Minimize brand-coupled architecture
Do not redesign this as “Codex-themed Claude.”
Instead, make it:
- Codex-first in defaults and ergonomics
- agent-native in architecture
- portable where portability is cheap

### D. Use backward compatibility only when it buys something real
Compatibility is nice, but not at the cost of architectural clarity.
Prefer:
- compatibility shims / aliases
- migration notes
- deprecation notes

over preserving bad abstractions forever.

### E. Keep the browser layer mostly intact unless you discover a real technical issue
The architecture doc suggests the browser layer is already the most agent-native part of the system. Avoid churn here unless required.

---

## Suggested concrete work plan
You may improve the sequencing, but the end state should look roughly like this.

### Phase 1 — Audit and stabilize the migration surface
1. Audit current Claude-first assumptions in:
   - README
   - setup
   - generated skill docs
   - root docs
   - skill tables
   - tests
2. Identify which parts are:
   - host integration
   - workflow architecture
   - pure docs / branding
3. Map the current `/codex` skill references and remove/replace them cleanly.

### Phase 2 — Establish Codex-first project conventions
1. Add root `AGENTS.md`.
2. Make Codex the default install / usage path in docs.
3. Make project structure and generated-file workflow obvious for Codex contributors.
4. Update any local-development instructions accordingly.

### Phase 3 — Add canonical state scaffolding
1. Introduce schema + helpers for branch/sprint state.
2. Add persistence location(s).
3. Add precedence rules and docs.
4. Add tests for state load/save/merge/validation behavior.

### Phase 4 — Refactor the planning workflow
1. Split discovery from execution.
2. Introduce `Intent Record` and `Sprint Brief`.
3. Refactor `/office-hours` / `/autoplan` / relevant planning skills to use the new state model.
4. Remove “codex disagreement” and similar model-brand-specific gates.

### Phase 5 — Make iteration delta-based
1. Add `Delta Record` and learning-ingest pathway.
2. Teach routing logic when to reopen discovery versus continue execution.
3. Add explicit escalation thresholds.

### Phase 6 — Normalize assurance
1. Introduce shared findings graph/schema.
2. Refactor review/qa/security/ship outputs toward that model.
3. Keep human-readable reports, but derive them from structured evidence where possible.

### Phase 7 — Docs and tests
1. Regenerate all generated docs.
2. Update README / architecture / contribution docs / examples.
3. Update test suites and remove obsolete assumptions.
4. Ensure the repo is coherent for a Codex-first user reading it fresh.

---

## Specific repo-aware things to respect
These facts are already true in the repo and should shape the work:
- `setup` already has Codex host support and generates `.agents/skills` for Codex-compatible hosts.
- The repo already includes Codex-related tests and host-aware generation scripts.
- `SKILL.md` files are generated.
- The browser/runtime and design tooling are compiled/build artifacts with Bun-based build steps.
- The repo includes an existing `codex/` skill directory, but that directory represents the removable “second opinion” workflow concept, not Codex host support as a whole.

Do not accidentally remove actual Codex host support while removing the `/codex` skill concept.

---

## Acceptance criteria
The task is complete only when the repo satisfies **all** of the following.

### Product / architecture
- [ ] The repo is clearly **Codex-first** in docs and contributor ergonomics.
- [ ] The old `/codex` second-opinion skill concept is removed or fully subsumed.
- [ ] A canonical machine-readable branch/sprint state exists.
- [ ] Discovery and Execution are explicit workflow modes.
- [ ] Sprint Freeze exists as a structured execution contract.
- [ ] Delta-based iteration exists in the architecture and at least the core workflow.
- [ ] Risk-based routing is explicit.
- [ ] Shared findings normalization exists for at least the key assurance surfaces.
- [ ] Artifacts are treated as projections / reports rather than primary memory.

### Code / tests
- [ ] Build passes.
- [ ] Relevant tests pass.
- [ ] New or changed logic is covered by tests where reasonable.
- [ ] Generated files are regenerated.
- [ ] No stale references remain to removed workflow concepts.

### Docs / onboarding
- [ ] README explains the new Codex-first worldview clearly.
- [ ] `AGENTS.md` exists and is useful.
- [ ] CONTRIBUTING / architecture docs explain canonical state and generated-file workflow.
- [ ] A new contributor opening the repo in Codex App can understand how to work on it without Claude-specific assumptions.

---

## Validation checklist
Before finishing, run the appropriate repo commands and report results clearly.

At minimum, try to run:
```bash
bun install
bun run build
bun test
```

Then run any additional targeted tests needed for your refactor.

If some existing paid / host-specific / external-service tests are skipped, explain exactly why.

---

## Deliverables
Produce all of the following inside the repo:
1. Code changes
2. Updated templates and regenerated generated docs
3. Updated README and supporting docs
4. Root `AGENTS.md`
5. Canonical state implementation
6. Refactored workflow pieces that use it
7. Test updates
8. A concise migration note summarizing:
   - what changed
   - what was removed
   - what is still intentionally deferred

---

## Constraints and preferences
- Prefer **real implementation** over placeholder TODOs.
- Prefer **small typed state + clear helpers** over sprawling ad hoc JSON writes.
- Prefer **clear naming** over preserving legacy branding.
- Preserve valuable browser/runtime behavior.
- Do not leave half-migrated docs or stale command references.
- If the full migration is too large for one pass, complete the highest-leverage architectural slice end-to-end rather than touching every file shallowly.

In that case, prioritize in this order:
1. Codex-first project conventions
2. remove `/codex` second-opinion concept cleanly
3. canonical state + sprint freeze + delta scaffolding
4. refactor core planning path to consume the state
5. findings normalization
6. broad doc cleanup and remaining compatibility shims

---

## Helpful reference points
Use the local repo first. If you need external confirmation, prefer current official docs.

### Official OpenAI references
- Codex App announcement: https://openai.com/index/introducing-the-codex-app/
- Codex overview: https://platform.openai.com/docs/codex/overview
- Docs MCP for Codex / editors: https://platform.openai.com/docs/docs-mcp
- Codex / code generation overview: https://platform.openai.com/docs/guides/code-generation

### Existing repo reference points
Inspect these areas carefully before changing architecture:
- `README.md`
- `ARCHITECTURE.md`
- `CLAUDE.md`
- `setup`
- `scripts/gen-skill-docs.ts`
- `test/`
- `autoplan/`
- `office-hours/`
- `plan-ceo-review/`
- `plan-eng-review/`
- `plan-design-review/`
- `review/`
- `qa/`
- `ship/`
- `cso/`
- `document-release/`
- `codex/` (remove / refactor the workflow concept, not host support generally)

---

## Final instruction
Optimize for the repo that **should exist after this fork**, not for preserving the original project’s storytelling.

This fork should feel like:
- a **Codex-native local project**
- with a **persistent agent runtime**
- a **single canonical workflow state**
- **delta-based sprint iteration**
- **risk-based routing**
- and **structured evidence instead of repeated prose restatement**

Make the codebase align with that reality.
