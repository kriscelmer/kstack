# Installation Guide

## Overview

This guide covers:

- prerequisites
- global installation for everyday use
- repo-local installation for development
- verification
- upgrade and reinstall paths
- uninstall
- troubleshooting

`kstack` is Codex-only. There is no Claude, Gemini, or Kiro installation path.

## Prerequisites

You need:

- Git
- Bun
- a working Codex installation and login
- write access to `~/.codex/skills/`
- write access to `~/.kstack/`

Recommended verification commands:

```bash
git --version
~/.bun/bin/bun --version
codex --version
codex login
```

If `bun` is already on your PATH, `bun --version` is enough.

## Global Installation

This is the normal installation mode. It installs one public Codex skill root:

```text
~/.codex/skills/kstack
```

All KStack operations are then invoked as `/kstack <subcommand>`.

### 1. Clone the repo

```bash
git clone https://github.com/krzysztofcelmer/kstack.git ~/.codex/skills-src/kstack
cd ~/.codex/skills-src/kstack
```

### 2. Install dependencies

```bash
~/.bun/bin/bun install
```

If `bun` is on PATH:

```bash
bun install
```

### 3. Build runtime artifacts

```bash
BUN_BIN="${BUN_BIN:-$HOME/.bun/bin/bun}" "$BUN_BIN" run build
```

This generates:

- compiled browse binaries under `browse/dist/`
- compiled `kstack-state` under `bin/kstack-state`
- compiled `kstack-init` under `bin/kstack-init`
- generated skill docs in the repo
- generated Codex runtime files under `.agents/skills/kstack/`

### 4. Install into Codex

```bash
./setup
```

This creates or updates:

- `~/.codex/skills/kstack`
- `~/.kstack/`

### 5. Verify installation

Check that the runtime exists:

```bash
ls ~/.codex/skills/kstack
```

Check local health:

```bash
BUN_BIN="${BUN_BIN:-$HOME/.bun/bin/bun}" "$BUN_BIN" test
BUN_BIN="${BUN_BIN:-$HOME/.bun/bin/bun}" "$BUN_BIN" run skill:check
```

Then verify the command surface inside Codex:

1. Open a new Codex thread in any repo.
2. Run `/kstack`.
3. Confirm that it behaves like help and lists the available subcommands.

## First Use In A New Repo

Installing KStack globally only makes the routed skill available. It does not automatically bootstrap each repository you work on.

For a new project repo:

### 1. Create the repo

```bash
mkdir my-new-project
cd my-new-project
git init
```

### 2. Add the repo to Codex App

Open the repo as a project in Codex App so Codex can operate inside the repo root.

### 3. Bootstrap repo-local workflow guidance

Run:

```text
/kstack init
```

That command:

- creates or switches the unborn branch to `main` if the repo has no commits yet
- ensures `.kstack/state/` exists for the current branch
- ensures `.kstack/reports/` exists
- writes or updates a managed KStack block in repo-local `AGENTS.md`
- tells Codex that workflow truth lives in `.kstack/state/<branch>.json`
- prints the next steps for discovery, sprint freeze, and implementation

### 4. Start the normal workflow

From there, the usual sequence is:

```text
/kstack discover
/kstack sprint-freeze
/kstack implement
```

If QA or user feedback changes the assumptions behind the sprint, use:

```text
/kstack ingest-learning
```

Then refresh the sprint if needed:

```text
/kstack sprint-freeze
```

## Repo-Local Development Install

Use this when hacking on `kstack` itself or when testing a local branch without touching your global Codex install.

From the repo root:

```bash
bun install
bun run build
./setup --local --force
```

That installs into:

```text
<repo>/.codex/skills/
```

This is useful when:

- testing a feature branch of `kstack`
- developing templates
- iterating on `kstack-state`
- verifying setup behavior in isolation

## Reinstalling After Pulling Changes

If you update the checkout:

```bash
git pull
BUN_BIN="${BUN_BIN:-$HOME/.bun/bin/bun}" "$BUN_BIN" run build
./setup --force
```

## Upgrading From an Older gstack Install

If you previously used `gstack`:

1. keep the old install around temporarily
2. install `kstack`
3. let `kstack` read legacy `.gstack` state only as fallback during migration
4. stop writing new workflow data to `.gstack`

`kstack` setup also copies `~/.gstack/config.yaml` into `~/.kstack/config.yaml` if the new config file does not exist yet.

## Uninstall

To remove the installed Codex runtime and global state:

```bash
bin/kstack-uninstall --force
```

To keep `~/.kstack/` but remove the installed skills:

```bash
bin/kstack-uninstall --force --keep-state
```

## Troubleshooting

### Bun is installed, but `bun` is not found

Use the absolute path:

```bash
~/.bun/bin/bun --version
```

Then run:

```bash
BUN_BIN="$HOME/.bun/bin/bun" "$BUN_BIN" run build
```

### `./setup` cannot find Bun

Set `BUN_BIN` explicitly:

```bash
BUN_BIN="$HOME/.bun/bin/bun" ./setup
```

### `.agents/skills/` cannot be regenerated

This usually means the working directory or sandbox context cannot write generated runtime files. Re-run the build from a shell with normal repo write access:

```bash
BUN_BIN="${BUN_BIN:-$HOME/.bun/bin/bun}" "$BUN_BIN" run build
```

### Skills are installed but not showing up in Codex

Verify the directories exist:

```bash
ls ~/.codex/skills
```

Then re-run:

```bash
./setup --force
```

If the install is correct but the old direct commands still appear in your mental model, remember that KStack is now routed through one public skill:

```text
/kstack
/kstack help
/kstack discover
/kstack sprint-freeze
/kstack implement
```

### I changed templates but Codex still sees old skill content

Regenerate and reinstall:

```bash
BUN_BIN="${BUN_BIN:-$HOME/.bun/bin/bun}" "$BUN_BIN" run build
./setup --force
```
