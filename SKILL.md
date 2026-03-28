---
name: kstack
description: |
  Codex-first workflow pack for repo-local discovery, sprint freezing, review,
  QA, and shipping. Use when the user wants to operate the kstack workflow or
  needs the shared browser/runtime tooling.
---
<!-- AUTO-GENERATED from SKILL.md.tmpl — do not edit directly -->
<!-- Regenerate: bun run gen:skill-docs -->

## Canonical State

`kstack` keeps one canonical workflow state per branch at `.kstack/state/<normalized-branch>.json`.
Use that state to carry intent, sprint scope, routing, findings, tests, and doc obligations.

1. `code`, `tests`, and `config` are the source of truth for behavior.
2. `.kstack/state/<branch>.json` is the source of truth for workflow intent, sprint scope, routing, and findings.
3. `.kstack/reports/` contains human-readable projections derived from code plus state.
4. Conversation context is advisory. If it conflicts with code or state, update the state instead of carrying stale prose forward.

## Runtime

```bash
_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
KSTACK_ROOT="$HOME/.codex/skills/kstack"
[ -d "$_ROOT/.agents/skills/kstack" ] && KSTACK_ROOT="$_ROOT/.agents/skills/kstack"
KSTACK_BIN="$KSTACK_ROOT/bin"
KSTACK_STATE="$KSTACK_BIN/kstack-state"
$KSTACK_STATE ensure >/dev/null 2>&1 || true
```

```bash
# Show the canonical repo-local workflow state for the current branch
$KSTACK_STATE summary

# Inspect or patch specific records
$KSTACK_STATE show
$KSTACK_STATE set-intent ./intent.json
$KSTACK_STATE set-sprint ./sprint.json
$KSTACK_STATE append-delta ./delta.json
$KSTACK_STATE upsert-finding ./finding.json
$KSTACK_STATE route --auto
```

## Primary Commands

| Command | Purpose |
| --- | --- |
| `/autoplan` | Deprecated wrapper that runs the product, architecture, and design lenses
against the shared canonical state. |
| `/browse` | Headless browser skill for fast QA, visual verification, screenshots, form
testing, and repro capture. |
| `/careful` | Safety wrapper for destructive commands. |
| `/cso` | Security review and threat-model skill that records normalized security
findings against the canonical workflow state. |
| `/design-review` | Visual QA and polish skill for frontend work. |
| `/discover` | Discovery workflow that captures ambiguous requests into one canonical
`IntentRecord` in `.kstack/state`. |
| `/document-release` | Post-change documentation sync that updates README, architecture, and workflow
docs to match what actually shipped. |
| `/freeze` | Constrains edits to one directory or module. |
| `/guard` | Combined careful plus freeze mode. |
| `/ingest-learning` | Delta-ingest workflow that appends new learnings after review, QA, or user
feedback and decides whether to continue execution or reopen discovery. |
| `/investigate` | Root-cause debugging workflow. |
| `/office-hours` | Deprecated wrapper for discovery. |
| `/plan-ceo-review` | Deprecated wrapper for the product lens. |
| `/plan-design-review` | Deprecated wrapper for the design lens. |
| `/plan-eng-review` | Deprecated wrapper for the architecture lens. |
| `/qa` | Browser-driven QA that finds defects, fixes them in source, and re-verifies.
Use when the user wants test-fix-verify on a web experience. |
| `/qa-only` | Browser-driven QA that reports defects without changing code. |
| `/review` | Pre-landing code review focused on bugs, regressions, and missing validation.
Use when reviewing a diff before merge or when the user asks for a PR review. |
| `/setup-browser-cookies` | Imports cookies from a real Chromium profile into the headless browse session
so authenticated QA can run inside kstack. |
| `/ship` | Shipping workflow that checks canonical state, validation, docs, and merge
readiness before creating the final commit or PR. |
| `/sprint-freeze` | Converts discovery into an execution contract by writing the active
`SprintBrief`, route, required lenses, tests, and docs obligations. |
| `/unfreeze` | Clears a previously declared freeze boundary so edits can continue anywhere in
the repository again. |
| `/upgrade` | Updates the local kstack checkout or installation and explains what changed.
Use when the user asks to update kstack itself. |

## Routing Rules

- Vague request or missing acceptance criteria: route to `discovery`.
- Docs-only change: route to `docs` with no extra review ritual.
- Small bug fix: route to `execution` plus targeted validation.
- Architecture or wide-surface change: require the `architecture` lens.
- Security-sensitive change: require the `security` lens.
- Major UI change: require the `design` lens.

## Browse Command Reference

### Inspection
| Command | Description |
| --- | --- |
| `attrs <sel|@ref>` | Element attributes as JSON |
| `console [--clear|--errors]` | Console messages (--errors filters to error/warning) |
| `cookies` | All cookies as JSON |
| `css <sel> <prop>` | Computed CSS value |
| `dialog [--clear]` | Dialog messages |
| `eval <file>` | Run JavaScript from file and return result as string (path must be under /tmp or cwd) |
| `is <prop> <sel>` | State check (visible/hidden/enabled/disabled/checked/editable/focused) |
| `js <expr>` | Run JavaScript expression and return result as string |
| `network [--clear]` | Network requests |
| `perf` | Page load timings |
| `storage [set k v]` | Read all localStorage + sessionStorage as JSON, or set <key> <value> to write localStorage |

### Interaction
| Command | Description |
| --- | --- |
| `click <sel>` | Click element |
| `cookie <name>=<value>` | Set cookie on current page domain |
| `cookie-import <json>` | Import cookies from JSON file |
| `cookie-import-browser [browser] [--domain d]` | Import cookies from installed Chromium browsers (opens picker, or use --domain for direct import) |
| `dialog-accept [text]` | Auto-accept next alert/confirm/prompt. Optional text is sent as the prompt response |
| `dialog-dismiss` | Auto-dismiss next dialog |
| `fill <sel> <val>` | Fill input |
| `header <name>:<value>` | Set custom request header (colon-separated, sensitive values auto-redacted) |
| `hover <sel>` | Hover element |
| `press <key>` | Press key — Enter, Tab, Escape, ArrowUp/Down/Left/Right, Backspace, Delete, Home, End, PageUp, PageDown, or modifiers like Shift+Enter |
| `scroll [sel]` | Scroll element into view, or scroll to page bottom if no selector |
| `select <sel> <val>` | Select dropdown option by value, label, or visible text |
| `type <text>` | Type into focused element |
| `upload <sel> <file> [file2...]` | Upload file(s) |
| `useragent <string>` | Set user agent |
| `viewport <WxH>` | Set viewport size |
| `wait <sel|--networkidle|--load>` | Wait for element, network idle, or page load (timeout: 15s) |

### Meta
| Command | Description |
| --- | --- |
| `chain` | Run commands from JSON stdin. Format: [["cmd","arg1",...],...] |
| `frame <sel|@ref|--name n|--url pattern|main>` | Switch to iframe context (or main to return) |
| `inbox [--clear]` | List messages from sidebar scout inbox |
| `watch [stop]` | Passive observation — periodic snapshots while user browses |

### Navigation
| Command | Description |
| --- | --- |
| `back` | History back |
| `forward` | History forward |
| `goto <url>` | Navigate to URL |
| `reload` | Reload page |
| `url` | Print current URL |

### Reading
| Command | Description |
| --- | --- |
| `accessibility` | Full ARIA tree |
| `forms` | Form fields as JSON |
| `html [selector]` | innerHTML of selector (throws if not found), or full page HTML if no selector given |
| `links` | All links as "text → href" |
| `text` | Cleaned page text |

### Server
| Command | Description |
| --- | --- |
| `connect` | Launch headed Chromium with Chrome extension |
| `disconnect` | Disconnect headed browser, return to headless mode |
| `focus [@ref]` | Bring headed browser window to foreground (macOS) |
| `handoff [message]` | Open visible Chrome at current page for user takeover |
| `restart` | Restart server |
| `resume` | Re-snapshot after user takeover, return control to AI |
| `state save|load <name>` | Save/load browser state (cookies + URLs) |
| `status` | Health check |
| `stop` | Shutdown server |

### Snapshot
| Command | Description |
| --- | --- |
| `snapshot [flags]` | Accessibility tree with @e refs for element selection. Flags: -i interactive only, -c compact, -d N depth limit, -s sel scope, -D diff vs previous, -a annotated screenshot, -o path output, -C cursor-interactive @c refs |

### Tabs
| Command | Description |
| --- | --- |
| `closetab [id]` | Close tab |
| `newtab [url]` | Open new tab |
| `tab <id>` | Switch to tab |
| `tabs` | List open tabs |

### Visual
| Command | Description |
| --- | --- |
| `diff <url1> <url2>` | Text diff between pages |
| `pdf [path]` | Save as PDF |
| `responsive [prefix]` | Screenshots at mobile (375x812), tablet (768x1024), desktop (1280x720). Saves as {prefix}-mobile.png etc. |
| `screenshot [--viewport] [--clip x,y,w,h] [selector|@ref] [path]` | Save screenshot (supports element crop via CSS/@ref, --clip region, --viewport) |

## Snapshot Flags

| Short | Long | Description |
| --- | --- | --- |
| `-i` | `--interactive` | Interactive elements only (buttons, links, inputs) with @e refs |
| `-c` | `--compact` | Compact (no empty structural nodes) |
| `-d` | `--depth` | Limit tree depth (0 = root only, default: unlimited) |
| `-s` | `--selector` | Scope to CSS selector |
| `-D` | `--diff` | Unified diff against previous snapshot (first call stores baseline) |
| `-a` | `--annotate` | Annotated screenshot with red overlay boxes and ref labels |
| `-o` | `--output` | Output path for annotated screenshot (default: <temp>/browse-annotated.png) |
| `-C` | `--cursor-interactive` | Cursor-interactive elements (@c refs — divs with pointer, onclick) |
