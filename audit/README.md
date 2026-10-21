# Audit Tools

The shared mechanical checkers for "## Full Project Audits" in `CLAUDE.md`.
Every project's audit runs these same tools, so the same code always gives the
same answer.

- `run.sh <project-root>` runs ESLint, `tsc -b`, and `check.ts`, and exits
  non-zero when any of them finds something.
- `check.ts <project-root>` runs the scripted format checks on every tracked
  file: em dashes, file boundaries, trailing whitespace and space indentation,
  block comment widths, quotes (JS, JSX, CSS, and HTML attributes),
  parentheses spacing (calls, declarations, conditions, and CSS), import
  grouping, order, extensions, and alignment, exports at the end, JSON format,
  plain-text config comments, CSS sibling regions closer than 3 blank
  lines, and test Hows that never say what
  they check (a How names the assertions its test makes). It loads TypeScript from the project's own
  `node_modules`, so Node 23.6 or newer runs it directly.

Written during reese-roofing's first full audit (2026-10-21), since ease-my-life's
earlier checkers couldn't be recovered. Each later audit improves them: a false
alarm gets an exception that names the rule allowing it, and a missed violation
gets a new check.
