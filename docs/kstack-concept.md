# The KStack Concept

## Short Version

`kstack` is an attempt to make AI coding workflows state-native instead of conversation-native.

The idea is that planning, execution, QA, security, and shipping should not be separate rituals that all reinterpret the user request independently. They should be different views over one evolving, inspectable, repo-local source of truth.

## The Problem With Conversation-Native Workflows

Most AI workflows inherit the structure of chat:

- a user asks for something
- the agent reasons in prose
- plans get written as documents
- code changes happen separately
- QA happens later
- findings live in screenshots, comments, or chat

This works for simple tasks, but breaks under iteration:

- the original request drifts
- assumptions are not versioned
- reviewers do not know which plan is current
- execution keeps going even after scope changes
- documentation and release status lag behind the real implementation

The system looks intelligent in the moment, but it is structurally forgetful.

## KStack's Core Claim

The core claim behind `kstack` is:

> workflow state should be a real artifact in the repository

Not because every problem needs heavy process, but because once an AI is doing substantial work, the marginal cost of maintaining explicit state is low and the cost of drift is high.

## Discovery, Execution, Learning

`kstack` is built around three transitions.

### 1. Intent Capture

The first job is not “make a plan”. The first job is:

- understand what the user actually wants
- understand what problem matters
- understand what should not be built

That becomes the `IntentRecord`.

### 2. Sprint Freeze

Once intent is good enough, the system needs a current execution contract.

That becomes the `SprintBrief`.

The important word is current.

This is not a master plan for all future work. It is the bounded contract that defines the present sprint.

### 3. Delta Ingest

Reality changes intent.

QA reveals hidden cases.
Security review reveals a trust-boundary issue.
Implementation exposes architecture cost.
The user clarifies what “simple” or “polished” really means.

That should not be handled by silently continuing.

It should become a `DeltaRecord` that answers:

- what changed
- what was learned
- which assumption moved
- what should happen next

This is why `kstack` is not just a planning tool. It is a workflow adaptation system.

## Git, GitHub, and KStack

KStack is not trying to replace source control or forge collaboration.

The intended split is:

- Git stores the code change.
- GitHub stores the collaboration and enforcement around that change.
- KStack stores the semantic execution contract for the branch.

That lets KStack stay narrow and useful.

It does not need to become:

- a second Git
- a parallel issue tracker
- a replacement PR system

It only needs to make the branch’s meaning explicit and inspectable.

## Why Branch-Local State

The state is branch-local because branches are already the natural unit of engineering intent.

A branch usually means:

- a focused change
- a working hypothesis
- a review surface
- a release candidate

That maps naturally to one canonical workflow state file.

Branch-local state makes it easier to:

- inspect work in progress
- compare intent against code
- preserve isolation between experiments
- ship or abandon work cleanly

The preferred branch model is trunk-based with short-lived branches:

- `main` stays releasable
- feature branches stay focused
- one branch carries one active intent and one active sprint
- if the work splits, create another branch

## Why Thin Skills

In older workflow systems, every skill carried its own ritual:

- its own plan format
- its own output format
- its own decision criteria

That creates repetition and inconsistency.

`kstack` tries to invert that.

The shared model lives in:

- types
- canonical state
- deterministic routing
- normalized findings

Skills become thin operators over that state:

- discovery writes intent
- sprint freeze writes execution contract
- review writes findings
- QA writes findings and satisfied checks
- docs update doc obligations
- ship evaluates readiness

This makes the system easier to evolve because the intelligence is not smeared across long prompt bodies.

## Why Codex-First

`kstack` is Codex-first for a practical reason:

- the workflow should not model Codex as an external second opinion
- the runtime, docs, setup, and commands should assume one primary host
- compatibility only stays where migration cost is low

That reduces both technical complexity and conceptual complexity.

The system should not pretend to be host-neutral if it is not.

## The Design Philosophy

There are a few strong opinions behind `kstack`.

### Explicit beats implicit

If the sprint changed, update the sprint.

### Current beats original

The first plan matters less than the current valid execution contract.

### Evidence beats narration

Review findings, QA repros, and satisfied checks should be stored as structured state.

### Determinism beats ritual

Routing should follow explicit heuristics and recorded reasoning, not role-play ceremony.

### Repo-local beats tool-local

If the workflow matters to the codebase, the state should live with the codebase.

### Projection beats duplication

Raw operational state and durable review state are not the same thing.

That is why KStack now uses a hybrid model:

- raw `.kstack/state` remains local operational memory
- tracked `.kstack/contracts` becomes the durable branch contract used for Git history, pull requests, and semantic readiness checks

## What KStack Is Not

`kstack` is not:

- a general project management system
- a replacement for issue tracking at org scale
- an attempt to capture every thought
- a heavy governance layer

It is a lightweight state system for AI-driven engineering work at the branch level.

## The Intended Result

When `kstack` is working well:

- the user request becomes inspectable intent
- the sprint is explicit
- new learning changes state, not just conversation
- review and QA write into the same truth
- release readiness is visible
- docs lag less because obligations are explicit

In other words, it should feel less like “chat that also edits files” and more like “a coherent engineering workflow that happens to be AI-native”.
