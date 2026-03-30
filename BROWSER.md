# Browser Runtime

This document covers the preserved browser runtime that powers KStack QA and verification.

The browser engine is runtime infrastructure, not a routed `/kstack` command.

## What It Is

KStack ships a compiled browser CLI that talks to a persistent local Chromium daemon over HTTP. The server does the real work through [Playwright](https://playwright.dev/). The CLI is a thin client that reads state, sends a command, and prints the response.

State and logs live under `.kstack/` in the project root:

- `.kstack/browse.json`
- `.kstack/browse-console.log`
- `.kstack/browse-network.log`
- `.kstack/browse-dialog.log`

## Why It Still Exists

The browser runtime is preserved because it is structurally valuable:

- real-page QA
- screenshots and visual verification
- form interaction and repro capture
- console, network, and dialog evidence
- real-browser handoff when a visible browser is needed

KStack keeps this power, but it no longer exposes the browser as a public routed workflow command.

## Primary Runtime Commands

| Category | Commands | What for |
| --- | --- | --- |
| Navigate | `goto`, `back`, `forward`, `reload`, `url` | Get to a page |
| Read | `text`, `html`, `links`, `forms`, `accessibility` | Extract content |
| Snapshot | `snapshot [-i] [-c] [-d N] [-s sel] [-D] [-a] [-o] [-C]` | Get refs, diff, annotate |
| Interact | `click`, `fill`, `select`, `hover`, `type`, `press`, `scroll`, `wait`, `viewport`, `upload` | Use the page |
| Inspect | `js`, `eval`, `css`, `attrs`, `is`, `console`, `network`, `dialog`, `cookies`, `storage`, `perf` | Debug and verify |
| Visual | `screenshot [--viewport] [--clip x,y,w,h] [sel\|@ref] [path]`, `pdf`, `responsive` | See and compare output |
| Compare | `diff <url1> <url2>` | Spot differences between environments |
| Dialogs | `dialog-accept [text]`, `dialog-dismiss` | Control alert and prompt handling |
| Tabs | `tabs`, `tab`, `newtab`, `closetab` | Multi-page workflows |
| Cookies | `cookie-import`, `cookie-import-browser` | Import cookies |
| Multi-step | `chain` | Batch commands in one call |
| Handoff | `handoff [reason]`, `resume` | Switch to visible Chrome |
| Real browser | `connect`, `disconnect`, `focus` | Control a visible Chrome session |

## How It Fits the Workflow

- `/kstack qa` uses the browser runtime for fix-and-verify or report-only QA.
- The browser runtime captures evidence and feeds it back into `.kstack/state`.
- Contract projections and readiness remain state-driven, not browser-driven.

## Manual Extension Setup

If you want the Chrome extension in a regular Chrome profile, run:

```bash
bin/kstack-extension
```

Or load the unpacked `extension/` directory manually.

The extension shows:

- connection status
- command activity
- current refs and overlays

## Development

Useful commands:

```bash
bun run build
bun run browse/src/cli.ts --help
browse/dist/browse --help
```

The browser runtime remains a core part of KStack’s QA story, but it is intentionally infrastructure rather than a second public workflow surface.
