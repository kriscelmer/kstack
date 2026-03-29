# Typical Workflow

## Purpose

This document shows how `kstack` is supposed to be used in practice, especially when intent changes during implementation.

The core idea is simple:

- discovery captures intent
- sprint freeze captures the current execution contract
- execution generates evidence
- ingest-learning updates intent or assumptions when reality changes

## Example Scenario

Assume the user says:

> Build an onboarding flow for new users. Make it feel simple and polished.

That request is useful, but still incomplete:

- what kind of onboarding
- for which product
- what the user is trying to optimize
- what must not change
- what success looks like

## Phase 1: Discovery

Run `/discover`.

The job here is not to start coding. The job is to write a high-quality `IntentRecord`.

The discovery output should capture:

- raw request
- user pain or examples
- goals
- non-goals
- constraints
- hypotheses
- candidate wedge
- open questions

At the end of discovery, the system should know whether the work is still too vague or whether it is ready to freeze into a sprint.

## Phase 2: Sprint Freeze

Run `/sprint-freeze`.

Now the system writes the `SprintBrief`:

- problem statement
- in-scope behavior
- out-of-scope behavior
- acceptance checks
- touched surfaces
- tolerated unresolved questions
- escalation triggers
- risk level

This is the contract for the current sprint, not for the entire product forever.

That distinction matters.

## Phase 3: Execution

With a sprint frozen, implementation begins.

Typical execution sequence:

1. change code
2. run tests
3. run `/review`
4. run `/qa`
5. run `/cso` if relevant
6. run `/document-release`

Each of those updates the same canonical state.

## Intent Update Cycle

This is where `kstack` differs from a linear planner.

Suppose QA reveals:

- users are confused by step 2
- the feature needs to support invited users and self-signup users
- the original scope assumed only one entry path

That is not “just a bug”.

It is new information that changes the assumptions behind the sprint.

### What To Do

Run `/ingest-learning`.

That writes a `DeltaRecord`:

- what changed
- what was learned
- what assumption changed
- scope impact
- architecture impact
- risk impact
- recommended next mode

### Decision After Delta

There are three normal outcomes:

1. Continue execution unchanged.
   The delta is real but does not alter the sprint contract.

2. Refresh the sprint.
   The intent is still valid, but acceptance criteria or scope boundaries changed.

3. Reopen discovery.
   The user now wants something materially different from the original request.

## Example Intent Update Sequence

### Initial intent

- Goal: reduce onboarding drop-off.
- Constraint: no database redesign.
- Wedge: simple three-step self-serve onboarding.

### After QA

New learning:

- invited users bypass the first step
- the current three-step flow is wrong for half the traffic

### Result

Run `/ingest-learning`.

Then either:

- refresh `/sprint-freeze` with two entry paths
- or reopen `/discover` if the product ask has fundamentally widened

## Why This Matters

Most teams update the plan informally and keep coding. That makes the codebase and the workflow diverge.

`kstack` makes the update explicit, so:

- reviewers see the current sprint, not the original stale one
- QA findings are attached to the real execution context
- release decisions reflect current truth
- docs are updated against the actual sprint state

## Typical End-To-End Flow

```text
user request
  -> /discover
  -> /sprint-freeze
  -> implementation
  -> /review
  -> /qa
  -> /ingest-learning (if assumptions changed)
  -> /sprint-freeze again (if needed)
  -> implementation continues
  -> /document-release
  -> /ship
```

## Anti-Patterns

Avoid these:

- treating `/discover` as optional when the request is still fuzzy
- freezing a sprint and then silently changing scope in code
- leaving QA findings in screenshots or chat only
- using `/ingest-learning` as a note-taking tool instead of a routing decision point
- shipping from chat memory instead of `.kstack/state`

## Rule Of Thumb

If the answer to “what are we building in this sprint?” changes, the state should change too.
