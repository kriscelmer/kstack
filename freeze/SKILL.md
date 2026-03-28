---
name: freeze
description: |
  Constrains edits to one directory or module. Use when the user wants the
  session scoped tightly while debugging or refactoring.
---
<!-- AUTO-GENERATED from freeze/SKILL.md.tmpl — do not edit directly -->
<!-- Regenerate: bun run gen:skill-docs -->

## Rules

- Declare the allowed directory before editing.
- Refuse unrelated edits outside the frozen scope until explicitly unfrozen.
