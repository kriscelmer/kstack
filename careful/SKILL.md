---
name: careful
description: |
  Safety wrapper for destructive commands. Use when the user wants an extra
  confirmation layer before risky shell or git operations.
---
<!-- AUTO-GENERATED from careful/SKILL.md.tmpl — do not edit directly -->
<!-- Regenerate: bun run gen:skill-docs -->

## Rules

- Pause before `rm -rf`, destructive SQL, force-push, history rewrites, or production-impacting commands.
- Ask for confirmation if the action is not already explicit in the user request.
- Prefer safer alternatives when they exist.
