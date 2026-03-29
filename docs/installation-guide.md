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

This is the normal installation mode.

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
- generated skill docs in the repo
- generated Codex runtime files under `.agents/skills/`

### 4. Install into Codex

```bash
./setup
```

This creates or updates:

- `~/.codex/skills/kstack`
- `~/.codex/skills/discover`
- `~/.codex/skills/sprint-freeze`
- other generated skill directories
- `~/.kstack/`

### 5. Verify installation

Check that the runtime exists:

```bash
ls ~/.codex/skills/kstack
ls ~/.codex/skills/discover
ls ~/.codex/skills/sprint-freeze
```

Check local health:

```bash
BUN_BIN="${BUN_BIN:-$HOME/.bun/bin/bun}" "$BUN_BIN" test
BUN_BIN="${BUN_BIN:-$HOME/.bun/bin/bun}" "$BUN_BIN" run skill:check
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

### I changed templates but Codex still sees old skill content

Regenerate and reinstall:

```bash
BUN_BIN="${BUN_BIN:-$HOME/.bun/bin/bun}" "$BUN_BIN" run build
./setup --force
```
