# Installation Guide

## Prerequisites

Before installing `kstack`, make sure the environment can support the routed Codex workflow.

Required:

- Git installed and available in the shell
- Bun installed and available either on `PATH` or at `~/.bun/bin/bun`
- Codex installed and logged in
- write access to `~/.codex/skills/`
- write access to `~/.kstack/`

Expected runtime context:

- `kstack` is Codex-only
- repositories should be git repos so branch-local workflow state can be stored at `.kstack/state/<branch>.json`
- browser-driven QA depends on the local browser runtime generated during `bun run build`

Quick verification:

```bash
git --version
~/.bun/bin/bun --version
codex --version
codex login
```

## Global Install

```bash
git clone https://github.com/kriscelmer/kstack.git ~/.codex/skills-src/kstack
cd ~/.codex/skills-src/kstack
bun install
BUN_BIN="${BUN_BIN:-$HOME/.bun/bin/bun}" "$BUN_BIN" run build
./setup
```

What this does:

- installs dependencies
- generates `SKILL.md` outputs
- builds the browser runtime and state CLI
- links the public runtime to `~/.codex/skills/kstack`

## Repo-Local Development Install

Use this when you want to test the current checkout directly:

```bash
cd /path/to/kstack
bun install
bun run build
./setup --local --force
```

This writes the runtime under:

```text
/path/to/kstack/.codex/skills/kstack
```

## First Use In a New Repo

Once KStack is installed globally:

1. create or clone a git repo
2. add the repo to Codex App
3. run `/kstack`
4. run `/kstack init`

`/kstack init` will:

- create `.kstack/state/`
- create `.kstack/reports/`
- create `.kstack/contracts/`
- add or update repo-local `AGENTS.md` guidance
- create or switch to unborn `main` in an empty repo

After that, the normal flow is:

```text
/kstack discover
/kstack sprint-freeze
/kstack implement
```

## Verification

Run:

```bash
cd ~/.codex/skills-src/kstack
bun run build
bun test
bun run skill:check
```

Expected outcomes:

- build succeeds
- tests pass
- skill generation is fresh
- `.agents/skills/kstack/` contains only the supported routed command set

## Updating

KStack updates are a shell workflow:

```bash
cd ~/.codex/skills-src/kstack
git pull --ff-only
bun install
bun run build
./setup --force
```

After updating:

1. open a fresh Codex thread
2. run `/kstack`
3. confirm the help output reflects the current command surface

For the KStack repository itself, keep the committed self-hosting baseline fresh after updates:

```bash
cd ~/.codex/skills-src/kstack
bun run bin/kstack-state.ts export-contract --check --branch main
bun run bin/kstack-state.ts verify-self-hosting
```

## Uninstall

```bash
cd ~/.codex/skills-src/kstack
bin/kstack-uninstall --force
```

Add `--keep-state` if you want to preserve `~/.kstack/`.

`kstack-uninstall` does not remove committed repo artifacts such as `.kstack/state/main.json` or `.kstack/contracts/` by default.

## Troubleshooting

### `bun` not found

Install Bun and re-run the build:

```bash
curl -fsSL https://bun.sh/install | bash
exec zsh -l
```

### The browser runtime is missing

Rebuild from the source checkout:

```bash
cd ~/.codex/skills-src/kstack
bun run build
```

### `/kstack` shows stale help

Re-run setup and open a new Codex thread:

```bash
cd ~/.codex/skills-src/kstack
./setup --force
```

### Repo state looks out of sync with chat

The workflow source of truth is not the chat thread. Inspect:

```bash
bin/kstack-state summary
bin/kstack-state show
bin/kstack-state ready
```

If the plan changed, record it with `/kstack ingest-learning` and refresh `/kstack sprint-freeze` if needed.
