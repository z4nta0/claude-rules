# User-Level CLAUDE.md

Rules that apply to every project: development servers, language, linting,
browser testing, commit messages, copy, and code formatting, naming, and comments. A project's own CLAUDE.md
describes that project and adds anything specific to it (scoped naming
overrides, its own values).

These rules were developed in the ease-my-life project
(`~/projects/ease-my-life`). Unless a rule says otherwise, every file it
cites and every "this codebase" in its examples refers to ease-my-life: the
examples illustrate the rule, and other projects aren't expected to have
those files.

## CRITICAL: Development Server Management
- NEVER use global or pattern-based kill commands (e.g., `pkill`, `killall`, `fuser -k`) for `node`, `npm`, `vite`, `next`, or port numbers: these match by process name/command line across the *entire system*, so they can just as easily kill the user's own separately-running dev server as the one Claude started.
- Shell state (including a PID captured via `$!`) does NOT persist between separate Bash tool calls in this environment: capturing a PID in one command and referencing it in a later command silently fails.
- Start any dev/test server via the Bash tool's `run_in_background: true` option (not a manual `&` subshell); this returns a task ID that stays valid across turns.
- To stop a server started that way, use the `TaskStop` tool with that task ID. Never `pkill`/`kill` by name, port, or a guessed PID.
- Do not interfere with any pre-existing Node processes running in this environment, or any dev server the user started themselves.

## Language: TypeScript
Decided 2026-10-05. Every project is written in TypeScript unless the user
explicitly says otherwise for that specific project.
- **A new project** starts in TypeScript from its first file, with
  `typescript` installed as a dev dependency and a `tsconfig.json` in place.
- **An existing JavaScript project** is migrated to TypeScript (ease-my-life's
  migration runs on its `integrate-typescript` branch). Until a migration
  finishes, its remaining `.js`/`.jsx` files keep following this doc as
  written.
- **This doc's `.js`/`.jsx` rules carry over**: anything said about a `.js`
  or `.jsx` file applies the same way to a `.ts` or `.tsx` one.
- **Exception, scripts in `public/` stay JavaScript**: everything in
  `public/` is copied into the build untouched and loaded by its exact URL
  (a boot script `index.html` pulls in, a script a service worker imports),
  so nothing compiles it, and a `.ts` file there would reach the browser as
  raw TypeScript. They keep their `.js` extension and every other rule in
  this doc.
- **Type names and their documentation** follow "TypeScript types" under
  "### Naming conventions" (decided 2026-10-05).
- **Compiler strictness** (decided 2026-10-05): a new project starts with
  `strict` on from its first file. A migrated project starts with `strict`
  off, so the rename doesn't bury real problems under a flood of errors, and
  turns it on once its code is typed, area by area where that's practical.
  Until then, tightening stays a tracked to-do in that project's CLAUDE.md
  and is never dropped, and type checking joins the build only once the
  code is clean.

## Linting: ESLint
Decided 2026-10-07. Every project is linted with ESLint, which the pre-commit
rule check runs before anything else (see "### Pre-commit rule check").
- **Setup**: `eslint`, `typescript-eslint`, `eslint-plugin-react`, and
  `eslint-plugin-react-hooks` are installed as dev dependencies, with a flat
  config in `eslint.config.ts` (plus `jiti`, which ESLint needs to read a
  TypeScript config) and a `lint` script (`eslint .`) in `package.json`. A
  new project starts with it in place; an existing project without it gets
  it before its next change is committed.
- **The config starts from ease-my-life's own `eslint.config.ts`**:
  typescript-eslint's recommended rules with its two overrides,
  `react/jsx-no-undef` on everything under `src/`, and the React Hooks
  recommended rules on every `.tsx` file minus the four React Compiler
  readiness rules. A project changes only what doesn't apply to it (its own
  ignores, comments naming the other app), and a real difference in rules
  is recorded in its own CLAUDE.md.
- **Versions follow the ecosystem, not the latest release**: ESLint and
  TypeScript are upgraded only once every lint package's peer range
  supports the new version. As of 2026-10-07 that holds ESLint at 9
  (`eslint-plugin-react` doesn't support 10 yet) and TypeScript at 6.0
  (`typescript-eslint` doesn't support 7 yet).

## Testing: Every Browser Engine
Decided 2026-10-07. Any check of what a page renders or how it behaves (a
screenshot comparison, an interaction or animation test, a computed-style
probe) runs in all three of Playwright's engines: Chromium, Firefox, and
WebKit. Passing in one engine proves nothing about the others: in
reese-roofing, a drawer animation that relied on transitioning `display`
worked in Chromium but snapped shut in Firefox, which the user caught by hand.
- **Missing browsers are installed, not skipped**: when an engine fails to
  launch because its browser isn't downloaded, or the installed build doesn't
  match the Playwright version in use, run `npx playwright install chromium
  firefox webkit` from the project whose Playwright is being used, then
  rerun the check.
- **Anything needing `sudo` goes to the user**: system libraries (most often
  WebKit's on Linux and WSL, via `npx playwright install-deps`) need admin
  rights, and Claude can't enter a password. Stop and ask the user to run the
  exact command, then verify every engine launches before continuing.
- **A check that only one engine can run says so**: a test built on a
  Chromium-only tool (the DevTools Protocol, e.g. reading a `mailto`
  navigation) runs in Chromium, and the report names it as Chromium-only
  rather than implying the other engines passed it.
- **Report the engines**: when reporting a verification, say which engines
  ran it.

## Commit messages

### Commit message structure

Every commit message is a single What/Why/How comment, in EXACTLY the
same one-line template used for code comments elsewhere in this doc, not
a traditional subject-then-body split: `What: <Name>. Why: <sentence(s)>.
How: <sentence(s)>.` The whole message is that one line (git itself may
soft-wrap it in a terminal; that's display only, not a real line break).
- **`What:`**: a short, cohesive, Title Case name covering everything the
  commit actually changes, the same way a comment's `What:` names its
  target. If it can't be written as one cohesive name without papering
  over unrelated changes, that's a sign the commit is really 2+ commits
  pretending to be one, split it into separate commits, each with its own
  clean, nameable `What:`, rather than picking a vague umbrella name.
  E.g. discovering and fixing unrelated issues in other files while
  working on one file's own formatting pass becomes separate commits
  like `What: Cadence Control Formatting Issues Fixed.` and `What: JSX
  Element Empty Row Rule Added with Fixes.`, not one commit named after
  only one of the two, or a vague catch-all like `What: Various fixes.`
- **`Why:`/`How:`**: real sentences (capitalized start, subject + verb),
  not fragments, matching the code-comment convention exactly, as terse
  as they can be while staying descriptive, the same balance the code
  comments strike.
  - **Don't re-enumerate the file list, and describe kinds of changes,
    not individual ones.** The commit's own touched-file list is already
    visible via ordinary git tooling (`git show --stat`, `git log`, any
    host's own diff view), so the `How:` doesn't need to repeat it. Name
    a specific file only when doing so adds real narrative value a file
    list alone wouldn't (where a pattern was first discovered, a
    deliberate asymmetry like "X's own instance is held for its own
    later commit"); once a list would otherwise run past 3-4 names with
    nothing distinguishing them, collapse it to a collective phrase
    instead ("across every already-reviewed file it recurred in",
    "throughout the codebase"). This applies doubly to a large
    single-file review-pass commit: describe the KINDS of changes made
    (a handful of miscorrection renames, several dozen missing per-line
    comments filled in, a couple of return-shape restructurings, ...),
    not an exhaustive list of every individual identifier or line
    touched; a reader wanting that level of detail reads the diff
    itself, the same reason the file list itself is left to git.
- **Catch-all**: on the rare occasion a commit genuinely can't be split
  cleanly enough to produce one cohesive `What:`, don't force an
  artificial split or a dishonest name. Use the best reasonably-nameable
  `What:` possible, and say plainly in the `Why:` or `How:` that the
  commit covers more ground than a single clean name can capture, and
  why splitting it further wasn't practical.
- **Known risk: this format is not a common real-world convention**,
  unlike a plain imperative subject line, so it's just as vulnerable to
  silent drift as the naming/spacing/comment rules elsewhere in this doc,
  arguably more so: a violation here has no passive detection surface the
  way a file's own naming or spacing does (those get caught just by
  reading the file; nobody casually reads `git log` the same way).
  **Mandatory self-check before running `git commit`**: re-read the
  drafted message against this section's own bullets above (literal
  `What:`/`Why:`/`How:` labels, one cohesive `What:`, real terse
  sentences, all one line) before the commit actually runs, the same
  discipline as the JSX comment rule's own mandatory grep self-audit. If
  a spot check is ever needed later, this format's own literal labels
  make it cheap: `git log --format=%B -10 | grep -c '^What:'` should
  equal the number of commits checked: a single grep, unlike
  naming/spacing drift, which needed custom detection scripts to even
  find.

### Reporting a commit
After running `git commit`, always show the user the FULL commit message
(the entire one-line What/Why/How message described in "### Commit
message structure" above) alongside the short hash, not just the hash or
a truncated fragment of it. This is the cheapest available check that
the commit message rule is actually being followed, since nobody
casually reads `git log` the way a file gets read; showing the real
message every time means a drift is visible immediately, in the same
turn it happens, without the user ever needing to go look for it.

### PR summaries
Decided 2026-10-07. When the user asks for a PR (or merge) summary, it
covers the whole branch (`git log main..HEAD`), condensed to a high-level
overview in the same What/Why/How shape as a commit message, but laid out
as Markdown for a PR description rather than squeezed onto one line:
- **`What:`**: one bold-labelled line naming everything the branch does, in
  Title Case, with the release version in parentheses when the branch bumps
  it, e.g. `**What:** TypeScript Integration, Pre-Merge Test Suites, and Bug
  Fixes (v0.13.0)`.
- **`Why:`**: one short paragraph of real sentences: the problem the branch
  set out to solve, plus anything worth knowing that it turned up along the
  way.
- **`How:`**: a bulleted list, one bullet per area of work, each opening
  with a short bold label (`**TypeScript:**`, `**Tests:**`, `**Bug
  fixes:**`, `**Docs:**`, ...) and nesting sub-bullets for the kinds of
  changes in that area, not individual commits, files, or identifiers. A
  short area keeps its one line instead of sub-bullets.
- **Terse throughout**: each sub-bullet is a phrase or one sentence, and
  bug fixes are named by what the user saw, not by the code that changed.
- It's written for the PR's readers, follows the Copy rules (no em dashes),
  and is given in the reply as rendered Markdown, never inside a code
  block, ready to paste into the PR description.

### Backing up at the end of a session
Decided 2026-10-05. Feature branches can run for weeks before they're
merged, and until they're pushed their only copy is the local disk. So
whenever the user says the session is over for the day ("that is all the
time I have for today", or anything else that signals the work is done for
now), the reply ends with a reminder to push the branch to GitHub (`git
push`, or `git push -u origin <branch>` the first time a branch goes up).
Pushing a branch only backs it up; nothing is merged until the branch is
done.
- **No separate backup commit is needed when everything is committed**:
  work is committed after each verified step, so a push already uploads
  all of it. Check `git status` before giving the reminder.
- **Uncommitted work gets a normal commit first**: if a change is still
  half done when the session ends, it's committed in the usual one-line
  format, named for what it is, e.g. `What: Work In Progress Backup. Why:
  The session ended partway through ... How: ...`, saying in the `Why:`
  or `How:` what's still unfinished. It never uses a bare `WIP:` subject,
  which would break the `What:` format check above.

## Copy rules

Applies to every piece of prose this repo produces: user-facing app copy
(toasts, tooltips, help text, onboarding/tour copy, labels, aria-labels,
legal docs, seed/sample data strings, ...) and prose written as part of the
code itself (comments, this file's own writing, commit messages, PR
descriptions, ...). Being rolled out gradually, the same way the formatting/
naming rules below are: existing text gets cleaned up as its file is next
touched, not swept all at once.

- **No em dashes ("—"), full stop.** Reword the sentence instead: split it
  into two sentences, use a comma, a colon, or a parenthetical, whichever
  reads most naturally for that specific sentence. There's no single
  mechanical substitution that always works; judge each case on its own.
  Reason: regardless of how carefully a sentence was actually written, an
  em dash reads to many people today as a tell for hastily-generated AI
  text, undermining copy that was in fact deliberately reviewed.
- **Exception**: an em dash used as a standalone placeholder GLYPH for "no
  value yet" in a stat/number display (e.g. a table cell rendering `—`
  instead of a number that hasn't been computed) is a display character,
  not prose punctuation, and is unaffected by this rule.

## Code formatting rules

Formatting, naming, and comment conventions for every project. They were
developed in ease-my-life, whose `src/app.tsx` is the reference
implementation; consult it for worked examples of every rule below before
guessing. "N blank lines" always
means N visually-empty rows, i.e. N+1 newline characters between two lines
of content, not N newline characters.

### Undefined cases: stop and ask
This governs every rule in this section, permanently, not just while the
rule set is still being defined, and it covers every language this section
applies to, including CSS and HTML (CSS rules live under "### CSS modules
and JS hooks"; HTML rules live under "### HTML"). If a piece of code needs a formatting, naming, or comment
decision that isn't already covered by an explicit rule here, stop before
making any change and ask what to do, rather than guessing, extrapolating
from a rule that seems "close enough," or inventing something in the
moment. Once an answer is given, write the new rule down (here when it
applies to every project, or in the project's own CLAUDE.md when it's
specific to that project), in
whichever section it belongs, before or alongside applying it, so the
decision is captured for next time instead of getting re-asked later.

### Rendered output always wins
No formatting rule in this doc (spacing, line breaks, alignment, wrapping,
reordering) is ever applied where it would change what the app actually
displays or does. Where a rule and the rendered output conflict, the code
stays exactly as written. See the display exemption under "### JSX" for
the most common case (inline JSX text runs, where JSX drops whitespace that
contains a line break).

### Pre-commit rule check
Added 2026-09-26. Whenever any code is added or changed, for any reason (a
feature, a bug fix, a refactor, not only a formatting pass), the last step
before committing is a check of just the new/changed code against every
rule in "## Copy rules" and "## Code formatting rules". Take the changed
lines from `git diff` (staged and unstaged), check them, fix anything that
doesn't comply, and only then commit, the same way the commit message
itself gets its own mandatory self-check.
- **Automated checks run first** (decided 2026-10-05): before this rule
  check, run the project's linter and type checker over the change
  (ESLint, `npx eslint <files>`, and TypeScript, e.g. `npm run typecheck`
  or `tsc -b`) and fix everything they report. Then run the rule check
  below, so it reviews code that already lints and type checks, and any
  fix it makes gets the same automated checks again before committing.
- **Scope**: the added/changed lines, plus whatever they directly affect
  around them, since a change can break a rule on a line it didn't touch:
  the column alignment of the run a changed line sits in, the blank-line
  gaps on either side of it, the enclosing function's own JSDoc and region
  when its signature or behavior changed, the file's import lines (an
  import can go unused, or a new one needs its place in the group),
  anything referencing a renamed identifier, and the file's own export
  statement. Untouched code elsewhere in the file is out of scope; a
  violation noticed there is fixed separately, not folded into this
  commit.
- **What to check, at minimum**: naming (the 9-character/3-segment rule,
  every segment against the Known miscorrections list, the project-scoped
  overrides), a correct one-line What/Why/How comment on every line that
  needs one (including the JSX comment self-audit greps under "###
  Comments"), JSDoc/region qualification for any new or changed function,
  blank-line spacing and alignment, attribute tiers and alphabetical order,
  object/destructuring alphabetization, quotes and parentheses spacing,
  imports and exports, the File/Directory structure placement of any new
  file, no em dashes in any new prose, token value comments on any
  changed token read (and every comment quoting a token whose value or
  use changed), and that nothing changes what the
  app renders or does beyond the change itself (see "### Rendered output
  always wins").
- **Report it**: when reporting the commit, say the check was run and what
  it caught and fixed, if anything, so a skipped check is visible the same
  way a commit message drift is.

### Import statements
- One imported binding per `import` statement, even when multiple bindings
  come from the same source; never combine them into one `import { A, B }`
  line. Splitting an existing combined import (without reordering it) is a
  real, mechanical source change, not whitespace, but produces an identical
  build output; verify with a byte-for-byte-identical bundle hash before
  treating it as done. Reordering to alphabetize (below) is also a real
  change and generally safe for side-effect-free modules like these, but
  don't expect an identical hash from that step, only from the splitting
  itself.
- Group non-destructured (default) imports separately from destructured
  (named, `{ ... }`) imports: all default imports first, then 2 blank lines,
  then all named imports.
- **TypeScript type imports form a third group** (decided 2026-10-05), after
  the named imports and 2 blank lines apart from them, written `import type
  { HolStaTyp } from './data-model.ts';` (never the inline `import { type
  HolStaTyp }`, which our `verbatimModuleSyntax` leaves behind as an empty
  import in the build). One binding per statement, alphabetized and padded
  among themselves the same way the named group is, since the extra `type`
  word shifts their columns.
- **Side-effect imports form a fourth, last group** (decided 2026-10-07,
  matching ease-my-life's practice): a bare import with no binding
  (`import './styles/styles.css';`) goes after every other group, 2 blank
  lines apart from the group before it, each line commented and the
  comments aligned. These stay in load order rather than alphabetical
  whenever their order matters, e.g. `fonts.css` before `styles.css`, so
  the font faces register before the stylesheet that uses them.
- **Relative imports name the file's real extension** (decided 2026-10-07,
  matching ease-my-life's practice): `from './app.tsx'`, `from
  './state/storage.ts'`, `from './logo-mark.svg'`, never an extensionless
  `from './app'`, so the import line alone says exactly which file it reads.
  The tsconfig's `allowImportingTsExtensions` allows it. Package imports
  (`from 'react'`) are unaffected.
- Within each of those groups, alphabetize by the imported binding's own
  name (case-insensitive), not by source path, regardless of which source
  file each one came from.
- Within the named-imports group, pad every specifier name (left-justify) so
  the closing `}`, the `from` keyword, and the start of every source string
  all line up in their own columns, computed from the single longest
  specifier name in that group. Default imports don't need this treatment
  unless there's more than one (rare, since only one default export per
  module makes multiple default imports from the same source impossible
  anyway).
- **Unused imports**: after modifying a file for any reason, not just an
  import-statement change, verify every one of its own import lines is
  still used somewhere else in that file before considering the change
  done. Grep the file for the imported binding's own name, excluding the
  import line itself, to confirm real usage rather than assuming a
  binding is needed. Remove any import that comes back unused, e.g. a
  stale default `import React from 'react';` left in a file whose JSX
  compiles under ease-my-life's automatic JSX runtime (`@vitejs/
  plugin-react`'s default, confirmed in `vite.config.ts`, meaning JSX
  never needs `React` in scope, unlike the older classic runtime) and
  never calls `React.*` directly elsewhere in the file. This check runs
  on every file touched regardless of what the edit itself was about,
  since an import can go unused as a side effect of any other change to
  the file, not only a change to the imports themselves.

### Exports
- **Every export goes at the very end of the file**, after every
  declaration, never inline on the declaration itself (no `export const
  foo = ...` / `export function Foo`). Declare the binding normally
  where it belongs, then export it by name at the bottom.
- **Prefer one exported namespace object** (the `CAD_NAM_OBJ`/
  `STG_NAM_OBJ` pattern documented under the naming rules below), but
  only when it genuinely makes sense for what the file exports: a
  domain module's family of related functions/constants, called as
  `SomeObj.memFun(...)`. It does NOT make sense for a React component
  (a JSX tag like `<SomeObj.FooCom />` reads worse than `<FooCom />`),
  or for a file that exports only a small, unrelated handful of
  bindings; those use plain named exports instead.
- **Plain named exports all go in ONE `export { ... };` statement on a
  single line**, unlike the one-binding-per-`import` rule above, with
  one comment generalized to describe everything the statement exports
  (not a separate comment per binding). See `ui/conditional-controls.tsx`'s own
  `export { CodConCom, conDraFun };` for the reference example. An exported
  TypeScript type joins that same statement, marked with an inline `type`
  (`export { aveEasFun, type EscEntTyp };`), which the tsconfig's
  `verbatimModuleSyntax` requires, rather than a separate `export type {
  ... }` statement (decided 2026-10-05).

### Indentation
- Use tabs for indentation, one tab per nesting level, not spaces.
- Exception: a continuation line that's deliberately visually aligned to a
  specific column on the line above it (e.g. a wrapped JSX attribute list
  where the second attribute lines up directly under the first one, right
  after the tag name) keeps that alignment as literal spaces, but ONLY for
  the portion beyond its own structural depth. Concretely, such a line's
  leading whitespace is: the SAME number of tabs as the element's own
  opening line (not one level deeper: it's a continuation of the same
  element, not a child of it), followed by literal spaces to reach the
  exact alignment column (i.e. matching the width of the tag name and
  whatever it's lining up under).
- A continuation line that ISN'T deliberately aligned to a specific column
  (it's just wrapped for length, with nothing on the line(s) above to line up
  with (e.g. `<path\n  d='...'\n  strokeWidth='8' />`, where `<path` alone
  leaves nothing to align to)) uses one MORE tab than its own opening line,
  same as any other nested content, with no space-padding at all.
- When judging which case applies: does the continuation line's indentation
  match a specific character position on the line(s) above (typically right
  after `<tagname `)? If yes, it's an alignment case (tabs to the opening
  line's own depth + spaces for the rest). If the line above ends with just
  the tag name and nothing else, or the "continuation" is really just
  deeper nesting, it's a plain structural indent (tabs only, one level
  deeper).
- This rule only governs LEADING indentation. Mid-line spacing (e.g.
  padding array/object entries so their values line up in a column, like
  `TAB_OBJ_ARR`'s `label :`/`icon :` fields) is untouched; it stays literal
  spaces regardless, since it isn't indentation at all.

### File boundaries
- Every file starts with exactly 3 blank lines before its first real line.
  When the file's imports are wrapped in a `// #region Imports` marker (see
  "### Sectioning / fold regions" below), that marker counts as the first
  real line for this purpose.
- Every file ends with exactly 2 blank lines after its last real line, not
  3, deliberately asymmetric with the start-of-file rule above. VS Code
  (and most, if not all, other editors) automatically ensures a file ends
  with a trailing newline, which silently adds one more empty row on top
  of whatever was actually written; a file whose own written content ends
  in 3 blank lines therefore actually shows 4 once saved. Writing 2 blank
  lines accounts for that automatic extra row, landing on the same
  3-empty-row visual result the start-of-file rule specifies, without
  actually being 3 blank lines in the file's own written content.

### File structure
Rules for what a file holds and the order its contents appear in. Written
2026-09-26, after the last manual file review: the first five bullets are
applied during the final file-by-file pass, and the last two ("What a file
holds" and "File size") during a separate pass that follows it, since they
can move code between files rather than just within one.
- **Section order.** After the `// #region Imports` block and the file's
  own header comment, a file's top-level contents always appear in this
  order, skipping any section the file doesn't need:
  1. **Types**: TypeScript types that two or more declarations in the
     file use (added 2026-10-05; see "Type placement" below).
  2. **Constants**: `ALL_CAPS` values and lookup tables.
  3. **Module state**: module-level `let` bindings, `window.__` globals
     and their one-time setup.
  4. **Helpers**: plain, non-component functions (formatters, math,
     comparators, ...).
  5. **Hooks**: this file's own custom `useXxxFun` hooks.
  6. **Components**: private sub-components first, then the main/exported
     ones.
  7. **Module init**: code that runs once on load, e.g. an IIFE or a
     document-level listener registration.
  8. **Exports**: the single export statement (or the namespace object
     followed by its export), per "### Exports" above.
  The order follows the dependency direction: types describe everything
  below them, constants feed helpers, helpers feed hooks, hooks feed
  components.
- **Order within a section: define before use.** Anything a declaration
  reads sits above it, so a reader never has to scroll down to learn what
  a name means, and a `const` is never read before its own line. When two
  declarations in the same section don't depend on each other, they're
  alphabetized (case-insensitive) as the tie-break. Decided 2026-09-27:
  define-before-use also wins over the section order itself and over the
  Components section's "private first" split. A constant built by
  calling a helper at load time (e.g. `tabs/data/reminders-manager.tsx`'s
  own `REM_MAT_ARR`, built with `paiSubFun`) sits in Helpers right after
  the helper it calls, not in Constants, and an exported component that a
  private one renders comes before it; "private first, then exported" only
  orders components that don't depend on each other.
- **Type placement** (decided 2026-10-05). A type sits next to what uses
  it, keeping define-before-use:
  - **Used by one standalone declaration**: the type sits directly above
    it with no blank line between them, the same way a comment is glued to
    its target, so the two read as one unit. When the declaration is wrapped
    in its own `// #region` (a JSDoc'd function or component), the type sits
    above that marker instead, with exactly 1 blank line between them, the
    same gap a marker keeps from what it wraps (decided 2026-10-05). A
    component's props type is the common case: it's named from the
    component's own segments under the acronym-reference rule (`ButBasCom`'s
    props are `BbcProTyp`), as in `ui/button.tsx`.
  - **Used by members of a tightly grouped run** (consecutive declarations
    with no blank lines between them): the types for every member that
    needs one form their own tight group directly above the run, with 3
    blank lines between the two groups, and align their `=` signs and
    comments like any declaration run. This holds even when only one
    member of the run needs a type, so the run is never split up by a type
    wedged between its lines.
  - **Used by two or more declarations in the file**: the type moves to
    the Types section at the top.
  - **Used by two or more files**: the type lives in the module that owns
    the data it describes and is exported from there, the same way callers
    already import that module's functions (e.g. `core/holidays.ts`'s own
    `HolRcdTyp`, the resolved holiday its functions return). A type no
    single module owns, such as a saved record every layer reads, goes in a
    shared types file instead (`core/data-model.ts`), placed by the
    directory structure rules like any shared file.
- **Section regions.** A file with at least 2 of the sections above wraps
  each of them in a `// #region <Section>` / `// #endregion <Section>`
  pair, whatever the file's length, using the section's own name from the list above (`// #region
  Constants`, `// #region Components`, ...), so the whole file collapses
  to its outline. Spacing matches every other region: 1 blank line
  between each marker and the content it wraps, 3 blank lines between one
  section's `#endregion` and the next section's `#region`. Every region
  already defined elsewhere in this doc (a function's own region, a
  section-intro region, ...) nests inside its section's region unchanged,
  and the contents of each section are further sectioned by purpose where
  that makes sense (see "### Sectioning / fold regions"). A file with only
  one section has no section regions.
- **Design-rationale comments travel with their declaration.** A `/** ...
  */` block attached to a constant, helper, or component moves with it
  wherever the section order puts it; it never stays behind as a
  free-standing block. A file with section regions also lists its
  sections, in order, in its own file-level header comment, as a table of
  contents: a `Sections:` line after the `@summary` prose, then one ` *  -
  <Section>` line per section, then a bare ` *` line before `@author`. It
  lists only the file-level category sections above (Constants, Helpers,
  Components, ...), never the purpose-based sub-sections inside them or
  the sections inside a function. See `constants.ts` for the reference
  example:
  ```
   * Sections:
   *  - Constants
   *  - Exports
   *
   * @author z4nta0 <https://github.com/z4nta0>
  ```
  - **A section-intro spanning more than one section** (decided
    2026-09-27): when a section-intro block introduces declarations that
    belong to different sections (e.g. `tab-settings.tsx`'s own "Theme
    Picker Interface", which introduced 2 theme arrays and 3 theme
    components), the block and its region stay with the components it
    introduces, wrapping only those, and the other declarations move to
    their own sections (the arrays to Constants). The block's prose may
    still name the declarations that moved.
- **Generated files.** Decided 2026-09-27. A file written by a script
  (so far only `src/state/onboarding-stats-data.ts`, from
  `scripts/build-onboarding-stats.mts`) gets its formatting from the
  generator's own output template, never from hand edits: the
  file-level rules (naming, header table of contents, sections and
  regions, a shape JSDoc block, end-of-file export, sorted keys, a
  comment on each multi-line construct's opening line) apply through
  that template, while the generated data rows themselves are exempt
  from per-line comments only. The rows are still column-aligned by
  position, with one exception to key sorting: keys every row carries
  come first, alphabetized, and any optional key only some rows carry
  follows them, alphabetized, so it never shifts the aligned columns
  (the pickLog rows' own `outcome`/`depletedEnd`). When the template
  changes, the existing data is rewritten with the generator's
  `--reformat` flag, which reuses the data already on disk instead of
  simulating new random history.
- **Extension and naming.** A file uses `.jsx` only when it actually
  contains JSX, and `.js` otherwise (in TypeScript, `.tsx` and `.ts` the same
  way; see "## Language: TypeScript"). Every filename is kebab-case
  (`tab-today.tsx`, `onboarding-seed-data.ts`). Renaming a file means
  updating every import of it in the same change.
- **What a file holds.** A file is either one domain module (a family of
  related pure functions/constants, usually exported as one namespace
  object, e.g. `cadence.ts`) or one main component plus the private
  sub-components only it uses (e.g. a tab file). A sub-component used by 2
  or more files moves to a shared file instead of being exported from the
  file it happens to live in, the way `ui/` holds the app-wide
  primitives. Where that shared file lives follows the directory structure
  rules.
- **File size.** Whenever it makes logical sense for a block of code to
  live in its own file, it moves there: a self-contained sub-component
  (together with the constants, helpers, and hooks only it uses), a
  distinct sub-concern of a domain module (e.g. one family of `store.ts`'s
  own actions), or a distinct section of a large data catalog. This is a
  judgment call about cohesion, not a line count. Length is only a
  guideline for when to look: a file past roughly 2,000 lines is a strong
  signal that something in it probably belongs in its own file, but a
  longer file that's genuinely one cohesive unit stays whole, and a shorter
  one still splits when part of it clearly stands on its own. Each
  extracted file follows every rule in this section on its own, including
  its own file-level header comment, and lives where the directory
  structure rules put it. A split must not change behavior: any value a
  sub-component used to read from its enclosing scope becomes a real prop,
  and the result is verified against the pre-split build the same way a
  rename is.

### Directory structure
Where each file lives under `src/`. Written 2026-09-26; applied in the same
pass as the "What a file holds" and "File size" rules above (after the final
file-by-file pass), since moving files and splitting them both rewrite import
paths across the codebase. The layout ease-my-life uses (a new project
adapts the folder names to its own features):
```
src/
  main.tsx               entry point
  app.tsx                root component + tab bar
  constants.ts           app-wide constants
  utils/                 app-agnostic pure helpers (see below)
  core/                  pure domain logic, no React
  state/                 app state and persistence (store, storage, seed,
                         the tour bus, onboarding sample data)
  platform/              browser services (notify, pwa, appearance)
  ui/                    shared primitives and shared editors
  tabs/
    today/  pickers/  stats/  data/  settings/
  onboarding/            every onboarding tour and modal
  help/                  help mode, its catalog, its sample data
  styles/                global CSS only (tokens, base, fonts)
  assets/                shared images, icons, fonts (imported, never public/)
```
- **Placement.** A file used by only one feature (one tab, onboarding, or
  help) lives in that feature's own folder. A file used by 2 or more
  features lives in the shared folder that matches what it is: `ui/` for
  components and UI behavior, `state/` for app state, `platform/` for
  browser services, `core/` for domain logic, `utils/` for app-agnostic
  helpers. This is where files extracted under "What a file holds" and
  "File size" land.
- **`utils/` holds only app-agnostic pure helpers**: code that could be
  copied into a different project unchanged, with no domain knowledge, no
  app state, no React components, and no reliance on app globals. It's
  grouped by kind (`utils/date.ts`, `utils/format.ts`, ...). Something
  that merely looks generic but encodes this app's own vocabulary or
  globals goes elsewhere (e.g. `sorEntFun`, which encodes the Data tab's
  sort keys, lives in `tabs/data/list-sorting.ts`). In ease-my-life, the
  date helpers once duplicated across `tasks.ts`, `cadence.ts`, and
  several other files (`nwmDayFun`, `ordSufFun`, `dimCouFun`, the ISO date
  formatter) live in one shared `utils/date.ts`, alongside the old
  `ui.jsx` date formatters, with `redMotFun` in `utils/motion.ts`.
- **Dependency direction.** A folder imports only from itself or from
  folders below it in this order: `tabs/`, `onboarding/`, `help/` (top);
  then `ui/`; then `state/` and `platform/`; then `core/`; then `utils/`
  (bottom). `utils/` never imports anything from `src/`; `core/` never
  imports React; no tab imports from another tab. `main.tsx`, `app.tsx`,
  and `constants.ts` sit outside the order: `app.tsx` may import from any
  folder, and `constants.ts` may be imported by any. Decided 2026-09-27:
  folders on the same tier may import each other (a tab uses `help/` and
  `onboarding/`, `store.ts` uses `pwa.ts`), except that no tab imports from
  another tab's folder. The tour bus and the onboarding sample, stats, and
  checklist data live in `state/`, since `store.ts` and the shared
  reminders editor in `ui/` both read them, and neither may import upward
  from `onboarding/`.
- **No redundant prefixes.** A file inside a folder drops whatever prefix
  the folder already says (`onboarding/onboarding-tour-runner.jsx` becomes
  `onboarding/tour-runner.tsx`), the same reasoning as the naming rule that
  drops a word the import path already conveys. Exception: a tab's main
  file keeps its `tab-` name (`tabs/today/tab-today.tsx`) so a search for
  a tab's file lands on it directly.
- **Folder names** are lowercase kebab-case and short, plural only when
  the folder holds many of one kind of thing (`tabs/`).
- **`vite-env.d.ts` stays at the `src/` root** (decided 2026-10-07), where
  Vite's template puts it, beside `main.tsx`. It's an ambient type
  declaration file that nothing imports, so it sits outside the folder
  layout and the dependency order, the same as `main.tsx`.
- **No barrel files.** No `index.js` that just re-exports a folder's
  contents; every import names the real file, so the import line alone
  answers where a binding comes from.
- **Depth.** At most 2 folder levels under `src/` (`tabs/today/`), which
  keeps relative imports short. No path alias (e.g. Vite's `@/`); plain
  relative imports only.
- **A folder exists only once it has a file.** A layout folder with nothing
  to hold isn't created empty.
- **Assets live in `src/` and are imported, never served from `public/`.**
  An image, icon, font, or other static file the app itself uses is
  imported from its own module (`import logSvgUrl from '../assets/
  logo.svg';`, or a `url()` in CSS, which Vite resolves the same way), so
  Vite fingerprints its filename (long-term cacheable), fails the build if
  it's missing, and drops it when nothing uses it any more. An asset used
  by one feature lives in that feature's folder (next to its component,
  like its CSS module will); one used by 2 or more features lives in
  `src/assets/`, grouped by kind (`assets/images/`, `assets/fonts/`, ...).
  `assets/` sits outside the dependency order: any folder may import from
  it, and it imports nothing. Moving an asset means updating every
  reference to it (JS imports, CSS `url()`s) in the same change.
- **`public/` holds only files that must be served at a fixed, unhashed
  URL**, because something outside Vite's module graph requests them by
  exact path. Every file there must fit one of these exceptions:
  - **Browser/OS conventions**: `favicon.ico` (browsers request
    `/favicon.ico` on their own), `apple-touch-icon.png`, and the other
    favicon/home-screen icons `index.html` links to.
  - **The web app manifest and everything it references**:
    `manifest.webmanifest` is hand-written static JSON (the PWA plugin runs
    with `manifest: false`), so its `icons` entries can't point at hashed
    files.
  - **Hosting/deploy files**: Netlify's `_headers` and `_redirects`.
  - **Crawler files**: `robots.txt`, `sitemap.xml`, and any site
    verification file (e.g. a search console token) or `.well-known/`
    entry.
  - **Social preview images** (e.g. `og-image.png`): `og:image`/
    `twitter:image` meta tags need a stable absolute URL that scrapers can
    fetch.
  - **Scripts loaded outside the bundle**: a script `index.html` pulls in
    by fixed path before the app's own bundle runs (`boot-splash.js`), or
    one a service worker loads at runtime via `importScripts`
    (`sw-notify.js`).
  - **Anything shared or linked to by a fixed URL outside the app** (a
    downloadable file, an image an external site or email embeds).
  A file in `public/` that nothing requests by its fixed path (no
  `index.html` link, manifest entry, hosting rule, or external use) is
  either moved into `src/` and imported, if the app uses it, or deleted,
  if nothing does. Source/master artwork that isn't served at all (e.g. an
  editable SVG a PNG was exported from) doesn't belong in `public/` or
  `src/`; keep it outside the served tree (e.g. a top-level `design/`
  folder) or delete it.
- **Everything else in `public/` is untouched**: Netlify, the browser, and
  the PWA read those files from exactly those paths, so they're never
  renamed or reorganized.
- **CSS.** Component styles become CSS modules living next to their
  component during the CSS pass (see "### CSS modules and JS hooks");
  `styles/` keeps only global CSS that can't belong to one component
  (design tokens/themes, base element styles, `@font-face`, shared
  keyframes). Decided 2026-09-29: that global CSS is `styles/fonts.css`
  (the `@font-face` rules) plus one `styles/styles.css` for everything
  else, formatted per "The global stylesheet" under "### CSS modules and
  JS hooks".

### Top-level (module scope)
- Between any two distinct top-level declarations (a comment block, a
  `const`, a `function`, an `export` statement, ...) always use 3 blank
  lines, regardless of how related they seem (e.g. a component and a
  constant it reads from still get 3, not fewer, purely because they're
  both top-level).
- Import statements are the one exception within top-level scope: no blank
  lines between individual `import` lines: they're one tight block. The
  gap between that whole block and whatever follows it is still 3,
  except when the block is wrapped in a `// #region Imports` marker (see
  "### Sectioning / fold regions" below), in which case that 3-blank gap
  moves to after the `// #endregion Imports` marker instead.

### Comments
- A comment sits glued (0 blank lines) to the specific line/block it
  describes: never insert a blank line between a comment and its target.
- If a comment's own target is genuinely ambiguous (unclear what it's
  actually describing), don't guess a glue point; treat it as its own
  freestanding unit, with whatever blank-line count applies on both sides
  given its surroundings (3 if it sits between top-level declarations).
- **Every line of code gets a comment.** Rare exceptions: a closing
  bracket alone on its own line (a function/object/array/block's `}`,
  `]`, `)`, or a combination like `});`/`};`) never gets one. A bare
  `function foo ( ... ) {}` declaration (a custom function that ISN'T stored
  in a `const`/`let`) gets its own, more involved JSDoc-style comment
  instead. See "### Custom function declaration comments" below. This
  does NOT extend to inline/anonymous functions passed
  as arguments (a hook's callback like `useLayoutEffect(() => {...})`, a
  `return () => {...}` cleanup, `.map((x) => ...)`, ...): those get
  commented normally, same as everything else. Other exceptions will turn
  up rarely; handle them case by case as they're found.
  - **Repeated-shape object literals**: when a file defines MANY object
    literals that all share the exact same property shape (a catalog
    of near-identical config/data entries), and a given property's own
    What/Why/How is always the exact same boilerplate text (or one of
    a small, fixed set of variants, e.g. "String" vs "Function") no
    matter which specific object it sits on, document that shape and
    its variants ONCE in a JSDoc shape block attached to the
    declaration that holds the literals, instead of repeating the
    identical text on every single instance. Amended 2026-09-27: the
    file-level header is for the file's own summary only, so shape
    documentation never goes there. The shape block follows the
    attached-declaration form under "### Large / design-rationale
    comments" (`<Name> = <Expanded Name>` name line, `@summary` listing
    each field alphabetically, `@author`), and its `#region` rule
    applies too. Files documented the older way (in the header) move
    their shape blocks during the final file-by-file pass. Verify this
    condition actually holds first (grep every instance of the property
    across the file and confirm they really do collapse to a small,
    genuinely fixed set of texts) rather than assuming it from a few
    examples. Once documented, every per-item line for one of those
    shared fields gets NO trailing comment at all. This does NOT cover
    a leading comment already sitting above one specific instance that
    explains something genuinely unique to that instance (e.g., why
    one particular item needs a specific pad-override amount): that
    stays exactly where it is, since it was never the repeated
    boilerplate this exception targets. See `appearance.ts`'s own
    `PAL_SET_OBJ` and `THE_PAI_OBJ` for the reference examples, and
    `help/content.tsx`, whose "Help Catalogs Subsystem" section-intro
    block documents its shared
    `{ bodEle, groStr?, ideStr, labStr?, mulBoo?, padXcoNum?, padYcoNum?,
    scrBoo?, selStr, shaStr?, titStr }` catalog-item shape once (its own
    fields listed alphabetically, per the object-property-ordering rule
    below), and none of its 210 individual items repeat those same 11
    fields' own boilerplate comments.
    - **A shape shared by several declarations** (decided 2026-09-27):
      when more than one declaration holds literals of the same shape
      (e.g. help/content.tsx's 5 per-page catalogs), the shape block
      becomes one Section-intro block (see "### Large / design-rationale
      comments") whose region wraps every one of those declarations,
      rather than being attached to just one of them.
    - **Each item's own opening line still gets its identity comment**
      (decided 2026-09-27): the exemption covers the shared fields' own
      lines only, so a multi-line item's opening `{` gets a one-line
      What/Why/How naming that item (e.g. `What: Progress Ring Help
      Item.`). A leading note about that one item merges onto the same
      line after the identity comment, per the merging rule below; a note
      covering several sibling items stays above the first of them.
    - **A repeated-shape literal declared inside a function** has nowhere
      to carry that shape documentation, so when it reads nothing from
      its enclosing scope it's hoisted to a module-level `ALL_CAPS`
      constant instead, gaining its own JSDoc shape block (and `#region`
      once it reaches 25 lines), the same treatment as any other one.
      See `tabs/settings/contact-support.tsx`'s own `BRO_PAT_ARR`, moved
      out of `detBroFun`.
  - **Purely decorative banner comments** (e.g. `{ /* ── Appearance ──
    */ }` above a section) are deleted outright when the element they
    sit above already carries its own identity comment, since they add
    nothing a What/Why/How comment doesn't already say.
  - **Exception to the closing-bracket exemption**: a React hook call's
    closing line that carries a dependency array (`}, [ a, b, c ] );`)
    DOES get a comment, even though it's otherwise just a closing bracket,
    specifically to explain why the effect/callback/memo needs to
    re-run when each of those values changes, one clause per dependency
    if there's more than one:
    ```
    }, [ actIdeStr, tabPlaStr, raiOpeBoo ] ); // What: Effect Dependency Array. Why: This effect must re-run whenever a change to one of these values could move or resize the active tab's indicator target. How: actIdeStr changes which button is marked active, tabPlaStr changes the tab bar's placement and therefore its whole layout, and raiOpeBoo toggling the rail open or closed can resize the nav itself.
    ```
- **A leading comment block that actually mixes 2+ distinct, unrelated
  topics** (most commonly found in older free-form comment blocks that
  predate this doc's one-line comment rule, where several separate
  notes about the same upcoming target were run together across many
  `//` lines with no blank line between them): first separate out any
  topic that is specifically about ONE property's own value/behavior
  (see the next bullet below for what to do with those). Whatever
  topics remain (genuinely about the item's own overall identity,
  selector design, or history, not any one property) collapse to ONE
  physical line overall, each keeping its own leading `// ` marker
  inline, one after another on that same line, rather than spreading
  across separate lines with blank lines between them. E.g. `// First
  topic's own sentence(s). // Second topic's own sentence(s).` all as
  one line. This keeps each topic visually recognizable as its own
  distinct note (the `// ` marker still catches the eye, including
  under the editor's soft-wrap, Alt+Z/Option+Z) without the extra
  vertical space separate lines would cost. A block that turns out to
  be genuinely ONE cohesive topic merely spanning several `//` lines
  still gets joined into a single line the same way, just without any
  internal `// ` markers beyond the one at the very start. Judge
  cohesion by content, not by the presence/absence of existing blank
  lines within the block, since these predate any real structure.
- **Merging a line's own normal identity comment with a separate,
  already-existing design-rationale note that used to sit on its own
  leading line** follows this exact same one-line, multiple-`// `-marker
  mechanism, just approached from the opposite direction: instead of
  splitting one old free-form block apart, two ALREADY well-formed
  comments, the line's own normal What/Why/How and a separate leading
  note explaining something extra about it (a selector's own design, why
  a step exists in this order, ...), get combined onto that SAME line.
  **The normal What/Why/How comment always comes first**; any additional
  comment(s) follow it, each keeping its own leading `// ` marker, same
  as the topic-splitting case above. This keeps a line's real identity
  comment easy to spot on a quick scan (it's always first, right after
  the code) while still surfacing the extra context right there instead
  of on a separate line above it. See `onboarding/app-features.tsx`'s
  own GuidedTour step objects in `buiTesFun` for the reference example
  (e.g. the `Your Pickers Step`/`pulSelStr`/`runFun` lines): each one's
  own What/Why/How comes first, followed by its own extra design note,
  both on the object's/property's own single line.
  - **JSX variant**: when the target line is a JSX comment-only
    expression rather than a plain `//` comment, the same mechanism
    applies but each topic keeps its own separate `{ /* ... */ }`
    block instead of sharing one, chained back-to-back on the same
    line, identity comment first: `{ /* What: ... Why: ... How: ...
    */ }{ /* <design note prose> */ }`. A design note that was
    originally spread across several `//`-prefixed lines above the
    target (the free-form block case above) still collapses to one
    physical line first, exactly as that case describes, before being
    moved into its own trailing `{ /* */ }` block. See
    `onboarding/tour-runner.tsx`'s own Spotlight Element line for the
    reference example, whose leading multi-line comment about the
    ".ob-spot" box-shadow/is-dragging behavior moved into a second
    `{ /* */ }` block right after the element's own identity comment.
- **A topic that is specifically about one property's own value or
  implementation quirk** (e.g. "padXcoNum: 4 exists because...", "mulBoo
  is true because...", "titStr/bodEle are functions because...") moves
  out of the leading position entirely and becomes a normal trailing
  comment on that property's own line instead, right after its value,
  NOT column-aligned with sibling properties' own `:` (per the
  Repeated-shape-object-literals exception above, most of these objects
  have no per-property comments at all normally, so a real one here
  should stay glued close rather than pushed out to some far-right
  aligned column where it could go unnoticed). If the same topic
  explains 2+ properties at once (e.g. one explanation covering why
  BOTH `titStr` and `bodEle` are functions), copy the identical comment
  text onto each of those properties' own lines rather than picking
  just one. See `help/content.tsx`'s own `editMode` item for the
  reference example: `padXcoNum`'s own override reasoning sits after
  `padXcoNum`'s own value, and the "title/body are functions..."
  explanation is copied verbatim after both `titStr` and `bodEle`.
  - **Exception, a property-specific topic that actually explains
    SEVERAL SIBLING ITEMS at once**, not just the one item it happens
    to sit above (recognizable because one or more of those sibling
    items share the exact same property value with no comment of their
    own: the giveaway that the explanation was always meant to cover
    the whole group): this stays in the leading position above the
    first item of the group, unmoved, exactly like an item-identity
    topic would. Moving it down to just the first item's own property
    line would incorrectly imply the other, uncommented siblings have
    no stated reason for sharing that same value. E.g. `groupGrip`'s
    own leading comment ("These three only exist in the DOM while Edit
    Mode is on... mulBoo is true on all three because...") covers
    `mulBoo` across `groupGrip`/`cardGrip`/`groupNameEdit` together,
    since the latter two carry `mulBoo: true` with no comment of their
    own; splitting "mulBoo is true..." down to just `groupGrip`'s own
    line would have orphaned the other two. Before moving any
    property-specific topic down, check whether a sibling item shares
    that same value with no comment before assuming it's safe to move.
  - **Not limited to Repeated-shape object literals**: the same "copy
    the identical text onto each property it covers, never a `See
    <property>` pointer" treatment applies just as directly on an
    object whose properties DO already carry their own normal per-line
    What/Why/How comments (i.e. outside the Repeated-shape-object-
    literals case above), whenever a separate design-rationale note
    genuinely explains 2+ of that object's own properties at once. Here
    the copy lands MERGED onto each covered property's own single line
    instead of a separate leading line above it, the exact same
    one-line/What-Why-How-first mechanism the merging rule above uses
    for a single property, just applied once per property the note
    covers rather than once. A `See <property>` pointer instead would
    send the reader on a jump to recover context a quick scan should
    already have; the small duplication cost is worth avoiding that.
    See `onboarding/app-features.tsx`'s own `buiTesFun`, e.g. its Picker
    Selection/Manual Generation/Add To Todo List/Picker Items step
    objects: each one's own "Title/body copied verbatim..." note
    explains both `titStr` and `bodEle` together, so it's merged onto
    BOTH of their own lines (after each one's own What/Why/How), not
    left as a standalone line above either.
- **Placement**: a single-line statement's comment goes at the very end of
  the line, one space after the line's own trailing `;` (or just one space
  after whatever the line ends with, if it doesn't need a `;`, e.g. a
  `,` on an array/object entry). A multi-line construct (an array, object,
  if/else block, function, call, ...) gets its comment right after its own
  opening bracket, one space in, on that same line, not a new one:
  `const TAB_OBJ_ARR = [ // What: ...`, `React.useLayoutEffect( () => { // What: ...`.
  - **After the code unless the syntax forbids it** (decided 2026-10-07):
    a comment always goes after the code it describes, on the same line,
    and only moves to its own line above when the file's or language's
    syntax rules out a trailing one (an ESLint directive, which ESLint reads
    only at the start of a comment). A TypeScript triple-slash directive
    takes its comment after it: `/// <reference types="vite/client" /> //
    What: ...`, which TypeScript still reads.
  - **Known blind spot**: a bare `return {`/`return [` that opens a
    multi-line object/array literal is easy to skip, since it reads as
    "just a return statement" rather than as its own multi-line
    construct distinct from the properties/entries already commented
    inside it. This rule makes no exception for it: found to be a
    systemic, recurring miss across multiple already-reviewed files
    (conditionals.ts, ui/conditional-controls.tsx, seed.ts, pickers.ts,
    help/mode.tsx, tab-data.tsx, onboarding/page-tours.tsx,
    onboarding/app-features.tsx, in one audit), the same recurring-bias
    pattern as the other "Known blind spot" notes elsewhere in this doc.
    When auditing a file for comment completeness, explicitly grep
    `^\s*return \{$` and `^\s*return \[$` for hits with no trailing
    `// What: ...` on that same line, not just the properties/entries
    inside the literal.
  - **A second, related blind spot**: an object property whose OWN value
    is a nested multi-line object/array literal (`someKey : {` opening a
    multi-line object, sitting inside a PARENT object or array, not a
    top-level `const`/`return`) is just as easy to leave uncommented,
    for the same reason as the bare-return case above: it reads as "just
    a property" rather than as its own multi-line construct. Found live
    in `onboarding/reminder-tours.tsx`'s own `VAR_COP_OBJ`, whose
    `once`/`recurring` entries (each a nested multi-line object) had no
    comment on their own opening `{` at all. When auditing a file for
    comment completeness, explicitly check every `<key> : {`/`<key> : [`
    line that opens a multi-line value nested inside another object or
    array, not just top-level declarations and `return` statements.
- **Column alignment**: when a run of lines has NO blank lines between
  them (e.g. entries in the same array/object literal), pad each line so
  every comment's `//` starts at the same column, computed from the
  longest line in that run, same mechanism used for colon/import
  alignment elsewhere in this doc.
  - **Exception, length mismatch too wide to align**: skip this
    alignment for any line whose own code portion (everything before its
    own `//`) is more than 100 characters away from the rest of the run.
    Padding across a gap that wide produces a huge empty gulf on the
    shorter lines that hurts readability more than unaligned comments
    would. Only the outlier(s) drop out, though, not the whole run: the
    largest group of lines whose code portions all fall within 100
    characters of each other still aligns among itself, and each outlier's
    own comment just sits one space after its own code instead. When two
    candidate groups are the same size, the one with the longer lines
    aligns. E.g. `tab-picker.tsx`'s own draft `draActObj`: its short
    `delIteFun` line sits unaligned, while the four longer method lines
    below it still align with each other. This is most
    commonly found among a tightly-grouped run of one-line function
    declarations (see "### Variable declarations" above) whose own
    bodies happen to vary a lot in length, e.g. `padZerFun`/`locDayFun`
    in `notify.ts`, where forcing alignment would have padded
    `padZerFun`'s own comment out by 73 extra spaces to reach
    `locDayFun`'s own, much longer line.
    - **Refinement: a single object literal's own properties reorder
      around the outlier instead of losing alignment entirely**: this
      case (as opposed to the function-declaration-run case above,
      which has no properties to reorder) has an extra option the
      general rule doesn't: when one or more properties in an object
      are the ones tripping the 100-char threshold (most commonly a
      `bodEle`/`body`-style property holding real prose, dramatically
      longer than short sibling fields like a selector string or a
      boolean), move each such long property to the END of the object
      instead of letting it disable alignment for the whole thing.
      Multiple long properties keep their own original relative order
      among themselves once moved. The remaining (short) properties
      then column-align their `:` and their comments with EACH OTHER
      normally, computed only from that shorter set; the relocated long
      propert(y/ies) at the end get natural one-space comment placement,
      unaligned, the same treatment the general exception above already
      gives an outlier. This was found live across the GuidedTour step
      objects in `onboarding/welcome-tour.tsx`/`onboarding/picker-tours.tsx`/
      `onboarding/page-steps.tsx`/`onboarding/app-features.tsx`/
      `onboarding/reminder-tours.tsx`, where nearly every step object's
      own `bodEle` property was tripping the 100-char exception and
      silently killing alignment for every other property in the same
      object; reordering `bodEle` to the end and aligning the rest
      recovers real, useful alignment across dozens of objects that
      would otherwise have none at all.
      - **Exception, a GuidedTour step object's own `bodEle` always
        joins the outlier group, even when its own comment is short
        enough that it wouldn't otherwise trip the 100-char threshold.**
        A GuidedTour step object (identified by its own `bodEle`+
        `tabStr`+`titStr` trio, the shape documented in `onboarding/
        tour-runner.tsx`) is reused as dozens of near-identical sibling
        objects across `onboarding/welcome-tour.tsx`/`onboarding/picker-
        tours.jsx`/`onboarding/page-steps.tsx`/`onboarding/app-features.tsx`/
        `onboarding/reminder-tours.tsx`, and `bodEle` is inherently this
        shape's own prose field regardless of how long any one
        instance's own copy happens to be. Measuring its comment length
        case by case (the general rule just above) produces an
        inconsistent shape across otherwise-identical sibling step
        objects for no real reason, a short `bodEle` sitting inline in
        its own natural alphabetical spot on one step while every other
        step's own `bodEle` sits alone at the end. Force it into the
        outlier group unconditionally for this one specific shape
        instead, so every GuidedTour step object looks the same
        regardless of how long its own particular tutorial copy happens
        to be. Where exactly it lands WITHIN that outlier group (last
        overall, or ahead of some other outlier) is governed by the
        tiering the next bullet describes, since a step object can carry
        more than one kind of outlier at once (most commonly `bodEle`
        alongside a `runFun`).
      - **A property whose value is a genuinely multi-line construct, a
        function (e.g. a step object's own `runFun`), an array literal,
        or an object literal, is a long outlier too, even when its own
        trailing comment would fit on one line just fine (a function
        commonly has no trailing comment at all, since its own body is
        already commented line by line).** Its VALUE, not its comment,
        is what makes it disruptive: a multi-line body sitting between
        two short scalar properties breaks up what would otherwise be
        one clean, tightly-aligned run. It belongs to the same "long
        outlier" category a long single-line value like `bodEle` already
        belongs to, just reached via genuine multi-line length instead of
        a single very long line, and both forms move to the end of the
        object together, after every short scalar property.
        **The two outlier kinds are not interchangeable within that
        trailing group, though: a long SINGLE-LINE value (`bodEle`-style)
        always sits closer to the short group than a genuinely
        MULTI-LINE construct (a function, array, or object) does**,
        since a long single-line value is still fundamentally the same
        kind of thing as an ordinary short property (one line, one
        value), just longer, while a multi-line construct is a
        structurally different kind of thing entirely. Concretely: short
        scalar group, then every single-line-long outlier (alphabetized
        among themselves, `bodEle` included), then every multi-line
        construct outlier (alphabetized among themselves). `bodEle`
        therefore lands last only when no multi-line construct outlier
        also exists in the same object, which is the common case; when a
        `runFun` (or any other multi-line construct) is also present,
        `bodEle` sits ahead of it instead, not after. Spacing between
        the short group and the first outlier, and between each pair of
        outliers, follows the ordinary multi-line-property padding rule
        (1 blank line on each side, since none of them is the object's
        own true first/last entry once the final outlier claims that
        spot). See `buiNewFun`'s own returned step object in
        `onboarding/picker-tours.tsx` for the reference example:
        `bacBoo`/`cirBoo`/`priStr`/`selStr`/`sttBoo`/`tabStr`/`titStr`
        form one tight, aligned short group, followed by `bodEle` (a
        long single-line value), followed by `runFun` (a genuinely
        multi-line construct) at the very end.
- **Structure: every comment is exactly one line**, following this exact
  template: `// What: <Name Expansion Or Short Descriptive Purpose, Title
  Cased>. Why: <a terse but complete sentence explaining why this exists>.
  How: <a terse but complete sentence explaining how it works and/or how
  it's used.>` The `What:` value is Title Case (capitalize every word,
  e.g. `TAB_OBJ_ARR` → `Tab Object Array`): it's a label, not a sentence.
  When the name being expanded follows the 9-char/3-segment (or 6-char
  property) naming rule, expand each segment to its actual full word, in
  the SAME ORDER the segments appear in the name, never reordered, and
  never replaced with a paraphrase of what the thing conceptually is. E.g.
  `butActEle` (But+Act+Ele) → `Button Active Element`, not `Active Button
  Element` (segments swapped) and not `Clicked Tab Node` (a paraphrase
  instead of an expansion). This includes the type segment: expand it to
  its real word too (`Ref` → `Reference`, `Obj` → `Object`, `Ele` →
  `Element`, ...), don't leave it abbreviated while expanding the others.
  A clarifying word beyond the strict segment expansion is fine, but only
  APPENDED after all the real segment words, never inserted between them
  (e.g. `Indicator Record Object And Setter` is fine; `Left Offset Number`
  is not, since "Offset" sits between the two real segments; say that in
  the Why/How sentences instead). `Why:`/`How:` are real sentences
  (capitalized start, subject + verb,
  often starting with "This" as the subject), not sentence fragments:
  e.g. `Why: This defines the fixed set of tabs that TabBarCom renders.`,
  not `Why: defines the fixed set of tabs TabBarCom renders.` For an
  object literal with multiple properties packed onto ONE line, chain a
  separate What/Why/How group per property, one after another in the same
  comment: `// What: Prop1... Why: This... How: This... // What: Prop2...
  Why: This... How: This...`. These comments get long: that's expected
  and accepted, not a sign something's wrong.
  - **Editor tip worth knowing**: Alt+Z (Windows/Linux) or Option+Z (Mac)
    toggles soft-wrap in most editors (VS Code included), which makes
    these long single-line comments actually readable on screen without
    changing the file's real line structure. Turn it on when working in
    this codebase.
- **JSX elements get exactly the same comment treatment as everything
  else**: every element, one comment each.
  - **The `What:` for a native HTML/SVG element**: pretend the element
    has an `id`, even though it doesn't; invent a plausible 3-segment
    name for it the same way the `id`-naming rule would, then expand THAT
    (Title Case, same segment order) as the `What:` value. E.g. `<nav>` →
    imagine an id like `conNavEle` (Container + Nav + Element) → `What:
    Container Nav Element`. Structurally-identical sibling elements (e.g.
    8 decorative grid-line `<path>`s, or repeated single-letter spans) may
    share the exact same What/Why/How text; they don't need distinct
    invented names just to be different.
  - **The `What:` for a custom component**: if the component's OWN name
    already follows the naming rules (like `TabBarCom`), use its real
    expanded name directly, same as any other named identifier; don't
    invent a separate pretend-id name for it. If the component HASN'T had
    naming rules applied yet (e.g. `Icon`, still awaiting its own pass),
    just use its literal current name as-is for now (e.g. `What: Icon.`);
    that comment is expected to be revisited once the component itself
    gets renamed.
  - **A library component that will never be renamed** (decided
    2026-10-07) names what that instance is for, ending in the component's
    own name: a React Router `<Route>` reads `What: Home Route.` or `What:
    Not Found Route.`
  - **Placement: NEVER a bare `//`/text comment as JSX children.**
    Anything that isn't wrapped in `{}` between an opening and closing tag
    is literal DOM text content, so a plain `// comment` placed after an
    element's closing tag (even a multi-line one) gets rendered as visible
    text, a real bug, not just a style slip. Instead, every JSX element
    comment is a comment-only JSX expression, `{ /* What: ... Why: ...
    How: ... */ }`: no `//`, and it compiles away to nothing at all (a
    comment-only `{}` child produces zero arguments to `createElement`,
    verified identical output with or without it), so it's always safe.
  - **Container elements and self-closing elements** get their comment
    glued directly onto their own closing bracket: the opening tag's own
    `>` for a container (right where the tag itself finishes, BEFORE any
    of its children/content; this is what keeps a big element like `<nav>`
    readable, since its comment sits right at its declaration instead of
    buried after everything it contains), or the `/>` for a self-closing
    element. Same line, no space, tight:
    ```
    <nav
    	ref={ navEleRef }
    	...
    >{ /* What: Container Nav Element. Why: ... How: ... */ }

    	...real children...

    </nav>
    ```
    ```
    <path d='M 528 112 L 16 112' />{ /* What: Grid Line Element. Why: ... How: ... */ }

    <path d='M 216 528 L 216 16' />{ /* What: Grid Line Element. Why: ... How: ... */ }
    ```
    Self-closing elements stay self-closing; no need to convert them to
    an explicit open/close pair, since a comment-only `{}` sibling on the
    same line works exactly like any other sibling in a normal children
    list (an element can have any number of siblings; the special case
    below is the one exception to that).
  - **A fully one-line element** (opening tag, real text/expression
    content, AND its own closing tag all on the same physical line (e.g.
    `<span className='bw-ease'>Ease</span>`, or `<span>{ tabConObj.labStr
    }</span>`)) gets its comment AFTER that closing tag instead, same
    line, so the comment never sits between the tag and its own content:
    `<span className='bw-ease'>Ease</span>{ /* What: Ease Span Element. Why: ... How: ... */ }`.
    Several such elements chained on one physical line (e.g. three
    single-letter spans) each get their own comment immediately after
    their own closing tag, chained along that same line, not one merged
    trailing comment covering the whole line.
  - **Exception, an element sitting directly inside a `{}` JS expression**
    (e.g. a self-closing element that's the sole value of a
    `{cond && ( <span ... /> )}` or `.map((x) => ( <span ... /> ))`
    expression, rather than a normal member of some element's DOM children
    list) is still real JS at that point, not JSX children syntax, so an
    ordinary `//` comment works there directly, at the same position the
    `{ /* */ }` rule would otherwise use (after the `>` for a multi-line
    tag, after the content and closing tag for a one-liner). This keeps
    the comment glued to the element itself instead of needing to hunt
    for an external sibling slot:
    ```
    { indRecObj && (

    	<span
    		className='tabbar-indicator'
    		...
    	/> // What: Indicator Span Element. Why: ... How: ...

    ) }
    ```
    **This exception applies ONLY to the single outermost element of
    that expression, never to anything nested inside it.** A fragment
    (`<>...</>`) or container element that itself sits in a `{cond &&
    (...)}`/ternary/`.map()`/`return (...)` boundary is safe for its
    OWN trailing comment, but every child inside it (each `<p>`, each
    nested `<div>`) is back to being a normal JSX child, so those still
    need the `{ /* */ }` form. This was found live, twice, as a real
    rendering bug: `body: ( <> <p>...</p> // comment <p>...</p> //
    comment </> )` rendered the bare comments as literal visible text
    between the paragraphs, since the fragment's own children are an
    ordinary children list, not a further JS-expression boundary, no
    matter how many levels deep the `//` comment is nested under the
    outermost safe boundary.
    - **Mandatory self-audit**: before calling a file's JSX comments
      done, run `grep -nE "(/>|</[a-zA-Z][a-zA-Z0-9.]*>)\s*//" ` and
      also `grep -nE "^\s*<[a-zA-Z][^/]*[^/]>\s*//"` (the "opening tag
      immediately followed by a bare `//`" case, e.g. a container's own
      `<div ...> // What: ...` instead of `<div ...>{ /* What: ... */
      }`) against the file. For every hit, trace back to that specific
      element's own immediate parent: if the parent is a real JSX
      element/fragment's children list (not the direct `? (`/`: (`/`&&
      (`/`.map((x) => (`/`return (` boundary), the comment is a live bug
      and must be converted.
  - The closing tag itself still gets nothing, same as always.
  - **Inline phrasing elements inside text need no comment of their
    own**: a `<strong>`, `<b>`, `<em>`, `<i>`, `<br />`, or similar
    element that sits inline within a run of text content on the same
    line (e.g. `conditional is <strong>fully charged</strong>`, or a
    fragment of such text returned from a ternary) is part of that text,
    not a structural element, so it's exempt from the one-comment-per-
    element rule. The exemption ends the moment such an element sits on
    a line of its own; then it's commented like any other element.
  - **A bare-variable text child on its own line needs no comment**
    (e.g. `{ groNamStr }` inside a button), since it just prints that
    value. Anything more than a bare variable (a ternary, a fallback like
    `a?.name || ' '`, a call) does get one, as a `{ /* */ }` block right
    after it on the same line. See `tab-today.tsx`'s own Edit Mode rail
    button label.
  - **An attribute whose value is a multi-line construct** (a multi-line
    arrow function body, a multi-line array/object literal, ...) always
    gets a comment, following the ordinary "multi-line construct gets a
    comment right after its own opening bracket" treatment, the exact same
    as anywhere else in this doc. See `onboarding/page-tours.tsx`'s own
    `<GuiTouCom>` element for the reference example: `onBacTouFun`/
    `onSkiTouFun` (each a multi-line arrow function) and `steObjArr` (a
    multi-line array literal) all carry their own comment on the
    attribute's own opening `{`/`[`.
  - **A single-line attribute gets a comment when a reader would need to
    look somewhere else, or work through the expression, to know what it
    does.** Amended 2026-09-26 (previously every single-line attribute
    went uncommented) and applied during the final file-by-file pass. This
    covers any attribute or prop, function or not, on a native element or
    a custom component. Signs it qualifies:
    1. **It branches or guards**: an `if`, a ternary, or `&&` inside means
       it only sometimes acts, or picks between values (e.g.
       `ui/info-tip.tsx`'s InfTipCom `onPointerEnter`, which only opens for a mouse, and its
       `aria-label` ternary, which changes what a screen reader announces
       when the tip stands in for a disabled action).
    2. **It does something its name doesn't suggest**: stopping
       propagation or preventing a default, moving focus, writing a global
       or a ref, or any side effect beyond the element itself (e.g.
       InfTipCom's `onPointerDown`, which only records the pointer type
       for the click handler to read later).
    3. **It passes values whose meaning isn't obvious**: a magic string,
       number, or flag (e.g. `cloTouFun( 'finished' )`, or a bare
       `true`/`false` argument whose meaning lives in the called
       function).
    4. **It exists for a reason that lives elsewhere** (e.g. FilButCom's
       `onAnimationEnd={ () => setSpiAniBoo( false ) }`, which only makes
       sense once you know the spin is a self-ending CSS animation).
    Never needs one: a plain HTML attribute with a simple value
    (`className='x'`, `type='button'`, a literal `aria-label`, `disabled={
    isaDisBoo }`), a bare reference to a named function or variable
    (`onBlur={ cmtTexFun }`, which carries its own comment where it's
    declared), and a single call whose name and arguments already say
    everything (`onClick={ () => togDayFun( dayIndNum ) }`), and a
    `className` whose only ternary/`&&` toggles a modifier class on or
    off (`${ isaPadBoo ? 'card--p' : '' }`), since the class name reads
    for itself (decided 2026-09-27); a `className` ternary whose branches
    are anything more than a class or `''` still gets one. The comment
    is a normal trailing `// What: ...` one space after the attribute's
    own value, never column-aligned with other attributes (most of an
    element's attributes have no comment, so a shared column would be
    mostly empty); a `//` comment inside an opening tag compiles away
    cleanly (verified with both Babel and Vite's own Oxc transformer).
    - **Exception, the element's only attribute** (decided 2026-10-04):
      a one-attribute element stays on one line even when that attribute
      qualifies for a comment (e.g. `<UnmWatCom onUnmWatFun={ () => { if
      ( opeIdeStr === curTasObj.id ) cloTasFun(); } } />`), since a
      trailing `//` there would comment out the element's own `/>`. The
      element's own `{ /* */ }` comment covers it instead, as long as it
      explains what the attribute does.
    - **Exception, `style={{ ... }}` objects**: a multi-line `style`
      object needs no comment on its `style={{` line or on its own
      properties, since real CSS property names already say what each
      line does. Only add one when something tricky or complicated is
      going on that a reader would genuinely need explained (e.g. a
      computed value with a non-obvious formula, or a shorthand/longhand
      ordering that has to stay put). See `app.tsx`'s own uncommented
      `style={{` blocks for the reference examples.
    - **Token value comments in JavaScript** (decided 2026-10-02): any
      JS that reads a design token gets the same comment CSS does under
      "Token value comments" in "### CSS modules and JS hooks" (the
      token's expanded name and its value), on the line that reads it: a
      `var( --token )` string (in a `style` object, a `setProperty` call,
      or a config row), a `rhyPxlFun( '<step>' )` or `durMilFun( '<step>'
      )` call (a Vertical Rhythm or Duration step), and an icon's
      `sizSteStr='<step>'`. On a line that already has its What/Why/How
      comment, the token comment follows it as its own `// ...` (or `{ /*
      ... */ }` in JSX children), per the merging rule above; a `style`
      property or attribute with no comment of its own gets just the token
      comment. A step built from a variable at runtime (`--fon-siz-${
      sizStr }`) has no fixed value to quote and is exempt.
  - A multi-line JS expression embedded in JSX that ISN'T itself an
    element (a `{condition && (` wrapper, a `{arr.map((x) => (` call)
    still gets a comment (it's still a line of code), but follows the
    general descriptive-purpose comment rule instead of the pretend-id
    one, placed after its own opening bracket like any other multi-line
    construct: `{ indRecObj && ( // What: Indicator Visibility Check. Why: ... How: ...`.
    - **Known blind spot**: this specific case (a `{cond && (`/`{cond ? (`
      ternary-branch/`{arr.map((x) => (` opener, or a ternary's own `) : (`
      else-branch line) is easy to leave uncommented even in a file whose
      actual JSX elements and statements are all correctly commented,
      since real-world JSX almost never comments a bare control-flow
      wrapper line like this at all, that's standard idiomatic React
      elsewhere. This rule makes no exception for it: found to be a
      systemic, file-wide miss across most files this rule set had
      already been applied to (136 instances across 9 files in one
      audit), the same recurring-bias pattern as the naming "Known
      miscorrections" list and the JSX-spacing blind spot above, just for
      control-flow wrapper comments instead of word choice or spacing.
      When auditing a file for comment completeness, explicitly grep for
      `{.*(&&|\?)\s*\($`, `^\s*\)\s*:\s*\($`, and `{.*\.map\(.*=>\s*\($`
      lines with no trailing `//`, not just bare elements/statements.
- **Import statements** get the same one-line What/Why/How comment as any
  other single-line statement; treat the imported binding like a variable
  declaration. Since import lines have no blank lines between them, pad
  every line so its `//` lines up in the same column as its neighbors,
  computed from the longest line in that run, same column-alignment
  mechanism used elsewhere in this doc (named-import padding, object
  `:` alignment, ...). The two import groups (default vs. named, see
  "Import statements" above) are padded independently, each against its
  own longest line; a single default import naturally has nothing to
  align against. The `What:` value expands the imported binding's OWN
  CURRENT name: split it into whatever camelCase/PascalCase word segments
  it already has (NOT the strict 9-char/3-segment truncation: the name
  hasn't had its own naming pass yet, so it may have more or fewer than 3
  segments), Title Case each word, and expand a recognizable abbreviation
  to its real word the same way segment-type expansion works elsewhere
  (`Obj`→`Object`, `Bg`→`Background`, `Eml`→`Ease My Life`, ...), e.g.
  `AppFeatureTour` → `What: App Feature Tour.`, `applyPaletteObj` → `What:
  Apply Palette Object.` Since almost none of these imported names have
  been through their own defining file's naming pass yet, this expansion
  is provisional: once a source file gets its own naming/comment pass,
  revisit every import comment that pulls a binding from it so the
  expansion matches whatever segment words that pass actually lands on,
  same spirit as the "revisit once renamed" note already covering JSX
  custom components (`Icon`, `TabToday`, ...) above.

### ESLint directive comments
An `// eslint-disable-next-line <rule>` directive has to stay on its own line
directly above the line it covers, since ESLint only reads a directive at the
very start of a comment and a `//` comment runs to the end of its line. It
still follows the one-line comment template, through ESLint's own `-- reason`
suffix: `// eslint-disable-next-line react-hooks/exhaustive-deps -- What:
Deliberate Dependency Omission. Why: ... How: ...`. A directive ESLint reports
as unused ("Unused eslint-disable directive") is deleted, not documented.
Check with `npx eslint <file>` after touching one.

### Custom function declaration comments
Which functions get a JSDoc-style block comment (the full template below)
instead of, or on top of, the usual one-line What/Why/How treatment. Amended
2026-09-26 from "every bare `function` declaration" to the rule below, which
is judged by what a function is, never by how it's written (a bare
`function`, a `const` arrow, a `React.forwardRef( function Name ... )`
wrapper, an anonymous function, and a function-module object's own entries
are all judged the same way). Applied during the final file-by-file pass,
which re-evaluates every existing JSDoc too: a bare `function` that got one
under the old rule keeps it only if it passes the test below.
- **The test**: would someone calling this function, or relying on what it
  does, need to read its body to use or understand it correctly? If yes,
  it gets a JSDoc. Length never decides it on
  its own: a one-line function hiding a non-obvious rule (e.g. `tasks.ts`'s
  `eveNthFun`, where an interval of 1 always qualifies and a negative count
  never does) can need one, while a long handler wired to a single button
  may not.
- **Always gets one**: anything exported or called from another file;
  every component; every custom hook.
- **Gets one when the test says yes**: any other function, named or
  anonymous, at module scope or declared inside another function or
  component (e.g. `tabs/settings/announce.ts`'s own announce-status setup
  IIFE, which builds the live region and assigns `annStaFun`'s real
  implementation). Typical
  signs the test says yes: parameters, a return value, or side effects
  that aren't obvious from the name (a sentinel return like `null` meaning
  "fall through", a returned shape the caller destructures, state or DOM
  writes in more than one branch), or a function passed down to children
  as a prop or called from several places, so its contract has more than
  one reader. Everything that doesn't pass keeps its ordinary one-line
  comment.
- **Never gets one**: a function written inline in JSX (an event handler,
  a `.map` callback rendering children); a function inside an ordinary
  object literal (a config row, a small helper object like `emlTouObj`); a
  trivial local wrapper or alias (`const onTipMovFun = () =>
  plaTipFun();`). Other anonymous functions (a hook's
  own body, an effect's cleanup, a `.sort` comparator, an IIFE, ...) are
  not exempt: most of them don't pass the test, but one that does gets a
  JSDoc like any other function.
- **Naming an anonymous function's JSDoc**: since it has no name of its
  own, its name line uses the file's own name plus a descriptive name for
  what the function does, the same form an in-function design-rationale
  block uses (`announce.ts = Announce Status Setup`), and its region reuses that
  descriptive name (`// #region Announce Status Setup`).
- **Exception to the objects exclusion, a function-module object**: an
  object that is really a module of named functions (the themed-region
  "Object-literal variant" under "### Sectioning / fold regions", i.e.
  `store.ts`'s own `actStoObj`) has each entry judged by the test above,
  exactly like a standalone function, since those entries are the app's
  own action API, called by name from every tab. The "Always gets one"
  bullet's own "called from another file" clause doesn't apply to these
  entries (every action is called from another file, which would force
  a JSDoc onto even a one-line setter); the test alone decides, e.g.
  `togDonFun` and `delPicFun` get one, `setTheFun` and `revIteFun`
  don't.
- **Everything that qualifies gets the full template**: name line,
  `@summary`, `@author`, `@param`, `@returns`, and `@example`, exactly as
  described below, however short the function is. A function written as a
  `const` (or an object entry) also keeps its own one-line comment on the
  declaration line; the JSDoc sits between its own `// #region` marker and
  that line. A component that takes a `ref` (React 19 passes it as an
  ordinary prop, so no `forwardRef` wrapper is needed) destructures it with
  its other props and documents it as `@param props.ref`, in its
  alphabetical place; see `ui/button.tsx`'s own `ButBasCom`. A component
  still wrapped in `React.forwardRef` (React 18 or older) documents its
  forwarded ref as a bare `@param` after the `props.` lines instead, since
  there it's a positional parameter. See `TabBarCom`/`AppRooCom` in
  `src/app.tsx` for the reference implementation of every rule below.
- **Placement**: exactly 1 blank line before the opening `/**` (see
  "### Sectioning / fold regions" below for what comes before that blank
  line), exactly 1 blank line between the closing `*/` and the function's
  own declaration line.
- **Name line** (first line inside the block): `<FunctionName> = <expanded
  name>`, expanded the exact same way a variable/import `What:` value is
  (Title Case each segment, expand the type segment too), e.g.
  `TabBarCom = Tab Bar Component`, `AppRooCom = App Root Component`.
- A blank ` *` line (no trailing space; every blank line inside the block
  is a bare ` *`, never ` * ` with a trailing space).
- **`@summary`**: a real, multi-sentence explanation (multiple paragraphs
  only if that actually helps), hard-wrapped at a strict 79-character line
  limit (i.e. never reaching column 80), never splitting a word across
  lines. This limit applies throughout the whole JSDoc block, not just
  `@summary`: every line inside it, `@param`/`@returns` continuation
  lines included, stays at 79 characters or fewer.
- **Tabs count as 4 columns** toward every 79-character limit in this doc
  (decided 2026-10-07), the width VS Code shows them at, so a tab-indented
  comment block (an HTML section summary, a nested JSDoc) wraps earlier
  than a flush one.
- **`@author z4nta0 <https://github.com/z4nta0>`**: a static, literal line,
  always exactly this, every time.
- **`@param`**: which form to use depends on the function's own parameter
  list, not on whether any individual value happens to be an object:
  - No parameters at all: exactly ONE of these two lines, verbatim, never
    both together: `props` for a React component (even a zero-prop one,
    since it's still conceptually a component), `void` for a plain,
    non-component JS function:
    ```
    @param props - This component does not use any props.
    ```
    ```
    @param void - This function takes no parameters.
    ```
  - A single destructured-object parameter (the common case for a React
    component, e.g. `function Foo ( { a, b } )`): one `@param props.<name>`
    line PER destructured field, in the same order as the destructuring
    itself. This is the ONLY form used for this case; do not also emit a
    bare `@param <name>` line for the same field, that was a documentation
    mistake in an earlier draft of this rule.
  - A plain, non-destructured positional parameter (e.g.
    `function foo ( bar )`): a bare `@param <name>` line (no `props.` prefix),
    since there's no props object at all in that case.
  - Whichever form applies, pad every specifier (left-justify) so every
    line's `-` lines up in one shared column, computed from the single
    longest specifier in that function's own `@param` block, the same
    column-alignment mechanism used elsewhere in this doc. No blank lines
    between different parameters' lines.
  - **Name expansion prefix**: every `@param` line's description begins
    with the parameter's own expanded name, formatted exactly like a
    variable's `What:` label (Title Case, each segment expanded to its
    real word, in the same order the segments appear in the name),
    followed by a colon and a space, then the rest of the description.
    E.g. `yeaValNum` (Year + Value + Number) → `@param yeaValNum - Year
    Value Number: The calendar year to compute against.` This applies
    even to a name exempt from the 9-char/3-segment naming rule itself
    (`value`, `onChange`, a `props.<name>` field that hasn't had its own
    naming pass yet, ...): expand it plainly by its own existing word
    segments instead, the same way an import comment's `What:` expands a
    not-yet-renamed name (`value` → `Value:`, `onChange` → `On Change:`).
  - **Description content**: if the parameter's value, at its PRIMARY real
    call site (the non-decorative one, when a function like `TabBarCom` is
    called from more than one place), is itself a named variable or
    function that already carries its own What/Why/How comment at its
    declaration, use `{@link <thatName>}` instead of writing prose; this
    points at the existing description rather than duplicating it, and
    once this codebase migrates to TypeScript, `@link` should point at a
    real type definition wherever one exists instead. Otherwise (the value
    passed in is an inline expression, ternary, literal, or anonymous
    arrow with no standalone declared-and-commented identifier of its own)
    write a terse plain-English description instead, following the
    no-em-dash Copy rule same as any other prose in this repo.
  - If the parameter has a default value in the function signature (e.g.
    `className = ''`), mention that default in the description.
  - A description that doesn't fit the 80-column limit on one line wraps
    onto a continuation line indented to the same column the description
    text itself starts at (not the `@param` column), still prefixed with
    ` * ` so it stays inside the comment.
- A blank ` *` line.
- **`@returns`**: exactly one of three shapes, depending on what the
  function's own `return` statement actually does:
  - Returns nothing: `@returns This function does not return anything.`
  - Returns a value that was first assigned to a variable and then that
    variable is returned: `@returns <terse description>` followed by its
    own `@see {@link <variableName>}` line.
  - Returns an expression directly, not stored in a variable first (JSX is
    the common case, e.g. `return ( <nav>...</nav> );`): just `@returns
    <terse description>`, no `@see`.
- A blank ` *` line.
- **`@example`**: matches whichever return type applies.
  - A JSX-returning component: a ` ```tsx ``` ` fenced block whose one
    line calls the function with its REAL call signature (a single
    destructured-object argument shown as an object literal, e.g.
    `TabBarCom({ actIdeStr, onChange, tabPlaStr, ... })`, truncated with
    `...` if the full real prop list would make the line unwieldy) followed
    by `// => <FunctionName />`.
  - A plain JS/TS function: a ` ```ts ``` ` fenced block calling the
    function with its real positional arguments, followed by `// =>` and
    either the returned variable/void/a terse description of the returned
    data.
  - **Example calls are written tight** (decided 2026-10-04): no space
    inside the call's parentheses (`sorEntFun(rowOneObj, rowTwoObj,
    sorKeyStr)`, `pagColFun(rawValStr)`), unlike real code. An example is
    illustration only, some run long, and the tight form keeps them
    compact; the parentheses spacing rule doesn't apply inside them.
- A final blank ` *` line (no trailing space) directly before the closing
  `*/`.

### Large / design-rationale comments
A comment block that documents a specific problem-and-solution, a
non-obvious design decision, or otherwise genuinely warrants staying
substantial (rather than being compressed into a single-line What/Why/How)
gets formatted with the same `/** ... */` block structure as a custom
function declaration comment above, minus the parts that only make sense
for a callable's signature. Applies equally whether the comment already
existed as a large prose block being reformatted, or is being newly
written because the file/section genuinely warrants one; see the
file-level comment and the `COL_WID_NUM`/`MIN_COL_NUM`/`BIG_CHA_NUM`
comments in `src/ui/bg-flourish.tsx` for the reference examples.
- **Every file gets a file-level one of these, mandatory, regardless of
  whether the file's own design would otherwise "genuinely warrant" one
  under the general rule above.** This is a firm exception to that
  judgment call: the FILE-LEVEL variant (nothing attached to any one
  declaration, `<filename.ext> = <Expanded Name>` per the next bullet)
  is required on every file in `src/`, even a short, simple one with no
  real design rationale to document, since it also gives a reader the
  file's own purpose/role before they dive into its actual code. (The
  general judgment-call framing above still governs whether a SEPARATE
  comment attached to one specific declaration, like `COL_WID_NUM`'s own
  in `bg-flourish.tsx`, is warranted; that part of the rule is
  unaffected, and a file can have both its own mandatory file-level
  comment AND any number of these declaration-attached ones.) Placed
  right after the file's own imports, per "### Sectioning / fold
  regions" above: after the `// #endregion Imports` marker plus its own
  3-blank gap when the file has any imports, or as the very first real
  content (right after the file's own leading 3 blank lines) when it
  has none. See `constants.ts` (no imports) and `state/tour-bus.ts` (has
  imports) for the two placement variants.
- **Name/title line**: if the comment is attached to a specific
  declaration (the thing it immediately precedes), use that
  declaration's own name and expansion, exactly like a function
  comment's own name line (`<Name> = <Expanded Name>`). If the comment
  is genuinely file-level, not attached to any one declaration (e.g.
  explaining the whole file's own purpose/design), use the file's own
  name in place of a function name (`<filename.ext> = <Expanded Name>`).
  - **Section-intro** (a third case, distinct from both of the above): a
    design-rationale block that introduces one particular subsystem or
    theme within a large, multi-concern file (spanning one or more
    declarations that follow it), rather than describing the file's
    ENTIRE purpose the way the genuinely-file-level case does. This
    reuses the SAME `<filename.ext> = <Expanded Name>` naming form as
    the genuinely-file-level case (both are substantial, header-style
    blocks, so both look the part), but names the SECTION instead of
    the file, alongside that same file's own single genuinely-file-level
    header (`store.ts = Store And Persisted-State Layer`) at the very
    top. A file may have any number of these, one per distinct subsystem
    it documents this way, on top of its own single mandatory file-level
    one. This case is ALWAYS wrapped in its own `// #region`/
    `// #endregion` pair together with everything it introduces (see
    "### Sectioning / fold regions" below); that region wrapper is what
    visually distinguishes it from the one genuine file-level header at
    a glance, since both otherwise share the same naming form.
    - **Descriptor suffix**: the section's own name always ends with one
      extra plain-English word naming WHAT KIND of thing the section is,
      not just what it's about, so a reader sees at a glance why it was
      pulled out into its own commented, regioned block rather than
      inferring that from the prose alone. Pick whichever word actually
      fits that section's own nature (`Subsystem` for a section built
      around one specific piece of persisted/managed data, `Mechanism`
      for a section implementing a specific behavioral pattern or
      invariant across several functions, or another word entirely when
      neither fits); this is a per-section judgment call, not a fixed
      vocabulary. E.g. `store.ts = Pick Log Subsystem` (introduces
      state.pickLog's own data shape and its row-builder), `store.ts =
      Done-Gated Pick Mutations Mechanism` (introduces the pending/
      revert staging pattern spanning 5 functions, not any one piece of
      data). The region markers reuse this same full name, suffix
      included, e.g. `// #region Pick Log Subsystem`.
- Hard-wrapped at the same strict 79-character line limit as a function
  comment.
- Blank ` *` lines are bare, no trailing space, same as a function
  comment.
- **Only `@summary` and `@author`, nothing else**: no `@param`,
  `@returns`, or `@example`, since this is a narrative/design-rationale
  block, not documentation of a callable's own signature.
- **Placement**: exactly 3 blank lines before the opening `/**`, always,
  a fixed override regardless of what relatedness tiering would otherwise
  put there (these blocks are dense enough to want visual separation on
  their own). What comes after the closing `*/` depends on whether the
  block is attached to something:
  - **Attached to a specific declaration**: exactly 1 blank line between
    the closing `*/` and that declaration (same as a function comment),
    then exactly 3 blank lines after "whatever it is the comment
    describes" is fully finished, before whatever comes next. When one
    comment covers more than one declaration (e.g. a single comment
    explaining the calibration behind two related constants declared
    right after each other), that 3-blank gap lands after the LAST such
    declaration, not right after the comment's own `*/`.
  - **File-level** (nothing to attach to): exactly 3 blank lines after
    the closing `*/` too, same as before it, since the comment block
    itself is the whole unit.
  - **Section-intro** (wrapped in its own `#region`, per "### Sectioning
    / fold regions" below): the mandatory 3-blank-before this bullet
    opens with is superseded, landing before the `// #region` marker
    instead of before the opening `/**` (the same supersession the
    Custom-function-declarations region case already uses), with
    exactly 1 blank line between the marker and `/**`. After the
    closing `*/`, exactly 3 blank lines before the first declaration the
    section introduces, the SAME 3-blank count as the File-level case
    just above rather than the Attached-to-a-declaration case's 1
    blank; this is deliberately more than a plain attached-declaration
    comment would get, specifically to keep the section's own summary
    prose visually distinct from the first block of code it wraps, even
    though there's no genuinely unrelated top-level gap between them the
    way the File-level case's own 3-blank count is normally reasoned
    about. See the Sectioning section below for the close-side spacing
    and the full worked example.
- **This does NOT replace the per-line What/Why/How comment still
  required on the actual declaration line itself** (when there is one):
  the two serve different purposes, this block explains the design
  rationale or history, the trailing comment explains the declaration's
  own role, so both coexist.
- **A comment attached to a top-level declaration gets a `#region` once
  it reaches 25 lines**, measured together (the comment's own `/** ...
  */` plus every declaration it describes). Below 25 lines, no `#region`
  is needed; every example in `src/ui/bg-flourish.tsx` currently falls under
  this (the longest, `COL_WID_NUM`'s, is around 20 lines total). A
  design-rationale comment inside a function body always gets one,
  regardless of length (see "### Sectioning / fold regions").

### Sectioning / fold regions
A collapsible fold region uses the editor-standard `// #region <Name>` /
`// #endregion <Name>` marker pair (recognized by VS Code and other
editors for code folding), wrapped tightly around the specific unit it
covers. The cases below are the only ones defined; more may be added
later, but don't invent one for anything else yet:
- **Custom function declarations**: every function that gets a JSDoc under
  "### Custom function declaration comments" above, whatever form it's
  written in, always gets a region, wrapping the function's own JSDoc comment AND its
  declaration/body together as one collapsible unit.
  - `<Name>` on both markers is the function's own literal name,
    unexpanded, e.g. `// #region TabBarCom` / `// #endregion TabBarCom`,
    not its Title Case expansion.
  - **This supersedes the function-comment placement rule above**: the 3
    blank lines that otherwise sit before a top-level declaration now sit
    before the `// #region` marker instead of before the JSDoc's opening
    `/**`. Between the marker and the JSDoc's own `/**`, use exactly 1
    blank line (per the "Placement" bullet above); nothing else about
    the JSDoc block itself changes.
  - Symmetrically on the close side: exactly 1 blank line between the
    function's own closing `}` and the `// #endregion` marker, then the
    normal 3 blank lines after `// #endregion` before whatever top-level
    thing comes next.
- **The whole import-statement block**: a file's entire run of `import`
  lines (see "### Import statements" above) gets wrapped as a single
  `// #region Imports` / `// #endregion Imports` region: one region for
  the whole block, not one per import and not split by the default/named
  grouping within it.
  - `<Name>` is the literal word `Imports`, every time.
  - **This supersedes the file-boundary and top-level-declaration rules
    where they'd otherwise apply directly to the imports**: the file's
    own "exactly 3 blank lines before the first real line" now lands
    before the `// #region Imports` marker instead of before the first
    `import`. Between the marker and the first `import` line, use exactly
    1 blank line.
  - Symmetrically on the close side: exactly 1 blank line between the
    last `import` line and the `// #endregion Imports` marker, then the
    normal 3 blank lines after it before whatever top-level thing comes
    next, the same as the 3-blank-line gap that used to sit directly
    after the import block per "### Top-level (module scope)" above.
  - Nothing about the imports themselves changes: still no blank lines
    between individual `import` lines, still the default/named grouping
    with its own 2-blank-line separator inside the region.
- **Sectioning by purpose.** Replaces (2026-09-26) the earlier
  function-body cluster rule and its 25-line/3-blank-gap conditions; applied
  during the final file-by-file pass. A manual, judgment-call process, never
  a mechanical scan; see `TabBarCom`'s "Active Tab Indicator" region in
  `src/app.tsx` for an example.
  - **What a section is**: a run of consecutive statements that together
    serve one nameable purpose. Any kind of statement counts
    (declarations, local functions, `if` blocks, effects, calls), and there
    is no minimum size beyond making sense: 2 statements that genuinely
    share a purpose are a section. E.g. a tooltip's position state, the
    function that measures it, and the effect that re-measures on scroll
    together make up "Tooltip Positioning". A single construct on its own
    (one `if`/`else` chain, one effect, one function) is never a section,
    however big it is, since it already folds on its own.
  - **When sections get regions**: whenever a scope divides into at least
    2 sections, each one gets its own `// #region <Name>` / `//
    #endregion <Name>` pair. A scope is a function or component body, a
    nested function's own body, a file's top level, or one of the file's
    category sections (see "### File structure"). A scope that serves
    one purpose throughout gets no regions, since wrapping all of it in
    one region adds nothing.
  - **Statements that don't belong stay outside**: sectioning is never
    forced. A statement that doesn't share a purpose with its neighbors
    (an opening guard, the final `return`, a lone call) stays unwrapped
    between the regions; no one-statement section is invented to hold it.
  - **`<Name>`** is a short, plain-English, Title Case description of the
    section's shared purpose (e.g. `Tooltip Positioning`, `Outside Close
    Handling`), not an abbreviated/segmented identifier name.
  - **Spacing**: exactly 1 blank line between each marker and the content
    it wraps. Separate sections serve different purposes by definition, so
    3 blank lines separate a section's `#endregion` from whatever comes
    next and its `#region` from whatever came before, unless the enclosing
    block's own 2-blank open/close padding applies at that edge.
  - **Nesting**: a nested function or component body is judged on its own,
    so a section can contain functions that are sectioned inside. Every
    other region type nests inside a section unchanged (a function's own
    region, a design-rationale region, a section-intro region).
  - **JSX is entirely exempt.** VS Code/TypeScript's `#region` folding only
    recognizes a `//`-style LINE comment as the marker, never a `/* */`
    block comment. A bare `// #region ...` can't be placed as JSX children
    at all (it would render as literal DOM text, the same reason JSX
    elements themselves use `{ /* ... */ }` comments instead of `//`), and
    the only syntactically-safe alternative, `{ /* #region Name */ }`, is a
    block comment the folding provider doesn't recognize, so it would
    never produce a collapsible chevron. Don't add one, however long or
    clearly-groupable a run of JSX children is. (A JSX-returning
    function's own region still works, since that marker sits outside the
    JSX, in the function's own plain-JS scope.)
- **A themed cluster of entries inside a top-level array literal** (a
  catalog/config array whose entries correspond to a real, user-facing
  grouping, e.g. every help-catalog item belonging to one page section
  or one step of a multi-step form) can also get its own named region,
  the same judgment-call process as sectioning by purpose above
  (propose a grouping and a name, confirm it, never a mechanical scan).
  This is the array-literal counterpart of that case: same naming
  convention (`<Name>` a short, plain-English, Title Case description,
  e.g. `// #region Create A Picker Form Step 1`), same 1-blank-line
  spacing between each marker and the content it wraps. It does NOT
  require a minimum size or any particular surrounding gap,
  since array entries are already naturally 1-blank-separated siblings
  rather than statements that need a 3-blank gap to prove they're a
  genuinely distinct topic; the grouping itself (does this run of
  entries really correspond to one real, user-facing section) is the
  judgment call instead. Between an `#endregion` and the very next
  `#region` when two regions sit back to back, use 3 blank lines instead
  of the array's own normal 1-blank inter-entry spacing, the same
  "unrelated" tier as two genuinely distinct top-level topics, since
  that's exactly what two different named sections are: `},` / blank /
  `#endregion Name A` / 3 blanks / `#region Name B` / blank / `{`. See
  `help/content.tsx`'s own
  `Create A Picker Form Step 1`/`Step 2` and `Appearance`/`Daily
  Generator`/`Holidays`/`Data Control`/`Account`/`About`/`Legal` regions
  for the reference examples. Not every array needs this: only apply it
  where a file's own catalog genuinely groups into distinct, nameable,
  real sections, the same restraint as sectioning by purpose.
  - **Object-literal variant, a large action/API object grouped by
    domain**: the same themed-region treatment also applies to a large
    object literal whose entries genuinely split into distinct domains,
    as a deliberate exception to the object-property alphabetization
    rule under "### Arrays and objects" below. The reference (and so
    far only) case is `store.ts`'s own `actStoObj`, whose ~60 actions
    group into real domains (Today entries, pickers, items, reminders,
    appearance, holidays, ...); a flat A to Z list would scatter every
    domain's actions across the whole object, while grouping them keeps
    "everything that touches reminders" in one collapsible place.
    Alphabetization still applies at two levels instead of one: the
    regions themselves are ordered alphabetically by their own region
    name, and the entries inside each region are alphabetized among
    themselves. A domain whose summary comment introduces the whole
    region follows the Section-intro design-rationale treatment below
    (its own `store.ts = <Name> <Descriptor>` name line, 3 blank lines
    between its closing `*/` and the region's first entry); an entry
    carrying its own single-entry design-rationale comment keeps it as
    an attached comment instead, with its own name line using the
    entry's own key (`<key> = <Expanded Key> Action`), wrapped in a
    nested `// #region <key>` of its own once the comment plus the
    entry reach the usual 25-line threshold.
    - **Entry spacing**: an object that uses this themed-region variant
      is, in practice, a module of functions wrapped in an object
      literal, so its entries follow top-level declaration spacing
      instead of the object-literal spacing under "### Arrays and
      objects": 3 blank lines between one entry and the next, whether
      each entry is multi-line or a one-liner. The markers keep their
      usual spacing (1 blank line between a `// #region`/`// #endregion`
      marker and the content it wraps, 3 blank lines between one
      region's `#endregion` and the next region's `#region`). The
      object's own opening and closing padding stays at 2 blank lines,
      like any other block. Smaller objects that merely contain a few
      methods (e.g. `state/tour-bus.ts`'s own `emlTouObj`) aren't covered
      and keep the normal object-literal spacing.
- **A section-intro design-rationale comment and everything it
  introduces**: the Section-intro variant of "### Large /
  design-rationale comments" above (a design-rationale block that
  introduces one particular subsystem within a large, multi-concern
  file, using the same `<filename.ext> = <Expanded Name>` naming form a
  genuinely-file-level header uses, but for a named section instead of
  the whole file) always gets a region, wrapping the comment itself AND
  every declaration it introduces together as one collapsible unit,
  mandatory for this shape rather than a judgment call the way the
  function-body and array-literal cluster cases above are.
  - `<Name>` on both markers is the SAME short, plain-English, Title
    Case name already used in the comment's own name line (the part
    after `<filename.ext> = `, descriptor suffix included), e.g.
    `// #region Pick Log Subsystem` / `// #endregion Pick Log Subsystem`
    for a comment whose name line reads `store.ts = Pick Log Subsystem`.
  - **This supersedes the Section-intro comment's own placement rule**:
    the 3 blank lines that otherwise sit before the opening `/**` now
    sit before the `// #region` marker instead, the same supersession
    the Custom-function-declarations case above already uses. Between
    the marker and the comment's own `/**`, use exactly 1 blank line.
  - Between the comment's own closing `*/` and the first declaration it
    introduces, exactly 3 blank lines, matching the File-level case's
    own count rather than the Attached-to-a-declaration case's 1 blank,
    specifically so the section's own summary prose reads as visually
    separate from the first block of code it wraps.
  - Every declaration the comment introduces keeps its own existing
    spacing/region treatment untouched (e.g. each one may still be its
    own `#region <FunctionName>` per the Custom-function-declarations
    case, nested inside this outer region); this case only adds the
    OUTER wrapper, it doesn't change anything about what's already
    inside it.
  - Symmetrically on the close side: exactly 1 blank line between the
    LAST declaration's own closing `}` (or its own `// #endregion`
    marker, if it has one) and this section's own `// #endregion`
    marker, then the normal 3 blank lines after `// #endregion` before
    whatever top-level thing comes next.
  - See `store.ts`'s own "Pick Log Subsystem" (wrapping `logRowFun`,
    itself already its own nested `#region logRowFun`) and "Done-Gated
    Pick Mutations Mechanism" (wrapping `dropStalePendingUpdates`
    through `applyConditionalLog`, five nested function regions) for the
    reference examples; that same file's own genuinely-file-level
    header at the very top (`store.ts = Store And Persisted-State
    Layer`) is NOT wrapped in a region of its own, since the file
    itself is already that header's natural boundary.
- **A design-rationale comment inside a function body, and everything it
  describes**: whenever a `/** ... */` summary is used to explain code
  inside a function (or inside a plain JS expression within JSX, such as
  a ternary branch or a `createPortal( ... )` argument), it always gets
  a region wrapping the comment AND the code it describes, even when
  that code is a single line, and regardless of the 25-line threshold,
  so it's always obvious exactly what the summary covers.
  - **Name line and region name**: a summary about exactly one
    declaration keeps that declaration's own `<Name> = <Expanded Name>`
    line, and its region uses the declaration's literal name (like a
    function's own region, e.g. `// #region finCloFun`). A summary about
    anything else (a run of statements, one effect, a mechanism, a JSX
    element) uses `<filename.ext> = <Descriptive Name>`, naming whatever
    it describes as a whole (its concept or purpose), and its region
    reuses that same descriptive name (e.g. `// #region Skip
    Animation`).
  - **Spacing**: the gap before the `// #region` marker is whatever the
    comment itself would have had (3 blank lines, or 2 as the first
    thing inside its enclosing block), then 1 blank line to the `/**`,
    1 blank line after the `*/`, the described code, 1 blank line, and
    the `// #endregion` marker, followed by the same gap the described
    code originally had after it.
  - Regions nest normally: a summary describing a whole effect can wrap
    another summary's region inside that effect. See `tab-today.tsx`'s
    own `Completion Celebration` region (wrapping `Celebration
    Particles`, `Celebration Overlay Rect`, and the effect holding
    `Celebration Fire Sequence`) for the reference example.

### Quotes
- **CSS follows the same rule** (decided 2026-10-02): every CSS string is
  single-quoted too, attribute selector values included
  (`[aria-pressed='true']`, `url( '...' )`, `font-family : 'Geist'`), with
  double quotes only inside a single-quoted string or where they're
  genuinely required.
- Use `'single quotes'` for every string literal, including JSX attribute
  values, even though double quotes are the idiomatic default there (e.g.
  `className="x"` becomes `className='x'`). If a string's own content
  needs a literal `"` character, that's fine: it just sits inside the
  single-quoted string as normal text, no escaping concern either way.
- This only governs actual string-literal delimiters in code. Quotation
  marks used as ordinary English punctuation inside a `//`/`/* */` comment
  (e.g. quoting a UI phrase in a design-rationale comment) are prose, not
  a code token, and are untouched by this rule.
- **`className` template literals specifically**: a backtick-templated
  `className` value gets a space directly after its opening backtick and
  directly before its closing one, and each individual class-name token
  inside it (a plain word, or a `${...}` interpolation standing in for
  one) is separated from its neighbors by exactly 3 spaces, not the
  normal single space:
  ```
  className={ ` tabbar   tabbar--${ tabPlaStr }   ${ raiOpeBoo ? 'is-open' : '' }   ${ className } ` }
  ```
  This only changes the SOURCE formatting, not the rendered class list:
  the browser collapses any run of whitespace in an element's `class`
  attribute to a single separator when matching selectors, so the extra
  spacing is purely a readability convention with no visual/behavioral
  effect. Plain non-templated `className='single-class'` strings are
  unaffected, since this only applies to the backtick-templated form. Once a
  file uses a CSS module, every token is a module interpolation instead,
  in the same 3-space form (see "### CSS modules and JS hooks").

### Units: rem first
Decided 2026-09-29. Every length uses
`rem` unless something genuinely can't: that way everything scales when a
person changes their browser's default font size, which a `px` value
ignores. In ease-my-life 1rem is the 11px base font size (see the core
design numbers exception under "### CSS modules and JS hooks"), so a `px`
value converts at 11px per rem. Where a size has to scale with the
viewport instead (e.g. a heading that grows with the screen), a viewport
unit or another scaling unit is fine, but only when that scaling is
actually needed. A value that really has to stay in `px` is raised when it
comes up and recorded here, per "### Undefined cases: stop and ask".
- **Text measure uses `em` or `ch`** (decided 2026-10-01): a paragraph's
  `max-width` follows its own font rather than the root, per "Text measure
  is font based" under "### CSS modules and JS hooks".
- **Glyph spacing uses `em`** (decided 2026-10-07): spacing that belongs to
  the text itself and has to keep its proportion as the element's own font
  size changes is written in `em`, not `rem`: `letter-spacing`, the gap
  between a number and its suffix, and an inline mark's raise. A fixed
  `rem` value would look right at one size and wrong at every other one,
  most visibly beside fluid type. Where a value has a scale step within
  10%, it still reads that step times `1em` (reese-roofing's stat suffixes
  use `calc( var( --cdn-pow-008-rec ) * 1em )` for their 0.1em gap).
- **Breakpoints are `px` values** (decided 2026-10-01): see "Breakpoints
  are a short list of round numbers" under "### Custom property naming".
- **A 3D `perspective` is a length too** (decided 2026-10-03): even though
  it only shapes 3D foreshortening, it moves to its nearest vertical rhythm
  step times `1rem` like any other length (the Today card's 800px became
  `calc( var( --ver-rhy-p14 ) * 1rem )`, about 747px).

### Reduced motion
Decided 2026-09-28. Everything that can have a reduced-motion variant gets
one, whether the motion comes from CSS or from JS.
- **CSS**: every `animation` or `transition`, color-only transitions
  included, is paired with a `@media ( prefers-reduced-motion : reduce )`
  variant (placed per the `@media` bullet under "### CSS modules and JS
  hooks") that turns it off with `animation : none` or `transition :
  none`. The exception is one that JS waits on (an
  `onAnimationEnd`/`transitionend` handler that updates state): there
  the variant shortens the duration to `.01ms` instead, since `none`
  never fires the end event and would leave that state stuck.
- **JS**: any motion JS drives itself (an `Element.animate` call, a
  `requestAnimationFrame` tween, a smooth `scrollIntoView`/`scrollTo`, a
  timed class or step sequence, a canvas or particle effect) checks
  `utils/motion.ts`'s own `redMotFun()` first and, when it returns
  true, skips the motion and jumps straight to its end state (an
  instant scroll, the final value, no particles), still running any
  follow-up the motion's own completion would have triggered. The CSS
  media query alone can't stop these, which is why the check lives in
  JS.
- **Exception, an explicitly requested preview**: an animation the user
  starts on purpose just to see it (Settings' celebration and pick-animation
  previews, played by pressing Play or Preview) keeps its motion under
  reduced motion, since the press is consent to see it. Only the animation
  being previewed is exempt; ordinary transitions inside the preview (a
  hover fade, say) still get their reduced-motion variant. See `ui/
  picker-strip.tsx`'s own `data-motion-force-active` and `tabs/settings/
  previews.module.css`.
- The modules migrated before this rule were brought in line in one
  pass; everything else is checked as its file is next touched.

### Animation performance
Decided 2026-10-03. Covers every
animation and transition, CSS or JS-driven (an `Element.animate` call, a
`requestAnimationFrame` loop writing styles).
- **Animate compositor properties.** Motion uses `transform` (translate,
  scale, rotate) and `opacity`, which the browser can run on the GPU
  without redoing layout or paint, plus `filter` where a blur or glow is
  the effect itself. Layout properties (`top`/`left`/`right`/`bottom`,
  `width`/`height`, `max-height`, `margin`, `padding`, `inset`, ...) and
  heavy paint properties (an animated `box-shadow` spread, a moving
  `background-position`, ...) are animated only when no compositor
  version can produce the effect, e.g. a collapse that has to push the
  content below it, which a `transform` can't do. Such an exception gets
  a comment on its line saying why the compositor version won't work. A
  color change (a hover's `color`, `background-color`, or
  `border-color`) has no compositor equivalent and is fine as is, since
  it only repaints the one element.
- **Decide on `will-change` deliberately.** For every animation, check
  whether the hint helps, and add it when it does:
  - **Use it** when JS moves an element frame by frame through
    `transform` (no CSS animation is running to promote it), or when an
    animation must start without a first-frame hitch on something that
    isn't on its own layer yet. Set it for the motion's duration only (JS
    adds it when the motion starts and clears it when it ends, the way
    `tabs/today/reorder.ts` does for a drag), or put it in CSS only on an
    element that exists solely while it's moving (e.g. `ui/
    picker-strip.module.css`'s reel track).
  - **Leave it off** a plain CSS animation or transition, which the
    browser already promotes for exactly as long as it runs, and never
    leave it permanently on an element that only moves now and then:
    each hint holds a layer in memory, and on text it can soften the
    rendering.
- Existing animations are checked against both bullets as each file comes
  up in the CSS pass, and a property swap that changes how the motion
  looks is raised with the user first.

### CSS modules and JS hooks
Decided 2026-09-27, for the CSS pass that follows the file-split pass. The
pass runs in two stages, in this order: first every JS lookup across the
whole app moves off class names onto `data-*` attributes (CSS untouched,
still global), then each component file's styles move into its own module,
one file at a time. Hooks go first because a module hashes its class names,
and any other file still finding those elements by class (a tour or help
selector, a `querySelector` elsewhere) would break silently while the build
still passes.
- **JS never finds elements by class name.** Anything that locates an
  element (`querySelector`/`querySelectorAll`, `closest`, `matches`, a tour
  or help catalog's selector fields, test and verification scripts) uses a
  `data-*` attribute instead.
- **State that CSS reacts to is an attribute, not a class.** Use the
  matching `aria-*` attribute where one already means that state
  (`aria-expanded`, `aria-pressed`, `aria-current`, `aria-disabled`, ...),
  otherwise a `data-*` attribute, styled with an attribute selector (e.g.
  `.card[data-open]`). Attribute names aren't hashed by a module, so these
  keep working unchanged.
- **Classes are for styling only**, always taken from the file's own
  module. The one exception: JS may add or remove a module class to
  trigger an animation or transition (`classList.add(
  cssModObj.isCelebrating )`), since that switches styling on rather than
  recording state for something to read back.
  - **A trigger JS applies to another file's elements** (decided
    2026-09-28) is a presence-only `data-*` attribute instead, since a
    file can only reach its own module's classes: e.g. `tab-today.tsx`'s
    ripple celebration sets `data-card-exhale-active` on every card it
    finds by hook, entry cards and reminder cards alike, and each card's
    own module styles `.today-card[data-card-exhale-active]`. Removing and
    re-adding the attribute restarts the animation the same way a class
    does. A trigger that stays within one file keeps its module class.
  - **Long-form prose keeps tag selectors** (decided 2026-10-03): a
    container holding a document's worth of the file's own prose
    (headings, paragraphs, list items), such as the legal documents'
    body, styles that content through descendant tag selectors on the
    container's own class (`.panBodDiv h2`, `.panBodDiv p`) rather
    than a class on every element. This covers long, uniform prose
    only; any other element gets its own class.
  - **A wrapper styling its caller's children keeps the tag** (decided
    2026-10-03): when a component has to style content its caller passes
    in as children (e.g. InfTipCom letting touch pass through a disabled
    button it wraps), it has no way to put a class on that content, so the
    selector names the child by tag under the wrapper's own class
    (`.infTriSpa button:disabled`), with a comment on the rule saying why.
- **Body-level state stays global**: `body[data-palette]`,
  `body[data-placement]`, and the other attributes set on `<body>` or
  `<html>` already follow this pattern and are styled from global CSS.
  - **A module element that reacts to body-level state** (decided
    2026-09-28) reads a custom property the body sets, the same
    parent-sets, child-reads pattern as a cross-component variant: the
    global sheet sets the property under the body's own attribute
    (`body[data-tour-active] { --tab-tou-pad: 200px; }`), and the
    element's module reads it with its normal value as the fallback
    (`.tab--picker { padding-bottom: var(--tab-tou-pad, 0); }`). A
    module never uses `:global()` to reach a body state. A body state
    still held as a class (like the old `ob-touring`) becomes a
    presence-only `data-*` attribute when a module first needs it.
- **One identity attribute per element.** Every element JS needs to find
  carries `data-element-name-hook`, whose value names the element itself,
  not what any one piece of code uses it for, so every consumer (a
  lookup, a tour step, a help item, a test script) shares the same hook
  and a search for the value lists all of them. The value follows the
  class naming rule below, element-type segment included (e.g.
  `data-element-name-hook='remRowBut'`), the same name the element's
  class gets in the design-system pass. An element that genuinely needs
  a second identity holds both values, space-separated, so every
  selector matches the hook with `~=`
  (`[data-element-name-hook~="remRowBut"]`), never an exact `=`, which
  silently stops matching the moment an element gains a second value.
  Hooks are for JS only: CSS never styles through a hook selector,
  except where there is genuinely no other way, and then it uses `~=`
  too. The element's own What/Why/How comment says
  which kinds of code rely on the hook. A custom component that renders
  a hooked element accepts `data-element-name-hook` under that same name
  at its call sites and forwards it to the element.
- **A selector's top-level commas are fallbacks, not a union.** Help mode
  and the tour runner try a selector list's top-level alternatives in
  order and use the first one that matches anything, splitting the list
  with `utils/selector.ts`'s own `splSelFun`, which ignores commas inside
  `:is()`, `:not()`, `:has()`, brackets, and quotes. A selector meant to
  match several different elements at once (e.g. a button that renders
  as an InfTipCom trigger span while disabled) joins them with `:is( a,
  b )` rather than a top-level comma, which would quietly turn every
  alternative after the first into a fallback.
- **State attributes stay separate from identity**: runtime state is an
  `aria-*` attribute where one fits, otherwise its own presence-only
  `data-*` attribute, set as `data-row-edit-active={ isaEdiBoo ||
  undefined }` so it disappears when false, and matched with
  `[data-row-edit-active]`.
- **Converting an existing state class** (`is-on`, `is-open`, ...) during
  the module move, judged per element, since the same class often sits
  on elements with different semantics: first, an `aria-*` attribute the
  element already carries that mirrors the same condition (e.g. a switch's
  own `aria-checked`) replaces the class, with no accessibility change;
  otherwise a new presence-only `data-*` attribute does. An aria
  attribute the element doesn't already have is never added just to
  carry styling, since it changes what assistive technology announces.
  Animation-trigger classes (`is-celebrating`, `is-pulsing`,
  `is-closing`, ...) stay module classes, per the exception above.
  - **A converted modifier keeps its old specificity** (decided
    2026-10-03): turning `.x.is-state` (2 classes) into `.x--state` (1
    class) drops its specificity, so wherever the old selector won by
    specificity rather than order, the base class stays chained in
    (`.x.x--state`), in the base rule and its `@media` variants alike.
    The common case is an animation trigger beside a reduced-motion
    `.x { animation : none }`: without the chain the modifier's
    animation loses, its end event never fires, and the state it waits
    on gets stuck (the Pickers add-item close, fixed in `3e21a11`).
    Check each converted trigger with reduced motion on.
- **Other `data-*` attribute names** (state attributes, and any future
  attribute) are kebab-case and built like any other name (name,
  descriptor, purpose, in that order), but from 3 full words with no
  3-letter truncation and no fixed length, within reason (e.g.
  `data-row-edit-active`). This is expected to need refinement as the
  pass goes; record each refinement here.
- **Module files** share their component file's own name, with a
  `.module.css` extension, next to it (`tabs/today/group-header.tsx` →
  `tabs/today/group-header.module.css`).
- **The import** is a default import named `cssModObj` (CSS Module
  Object), in the file's default-import group: `import cssModObj from
  './group-header.module.css';`.
- **Class keys are camelCase** (Vite's `css.modules.localsConvention:
  'camelCaseOnly'`), so `.today-card` in the module is read as
  `cssModObj.todayCard`. During this pass each selector keeps its existing
  class name verbatim; renaming classes belongs to the design-system pass
  that follows it.
- **One class per element is preferred.** When an element genuinely needs
  more than one, each is its own module interpolation inside one template
  literal: the `{` and the backtick sit together with no space, a single
  space follows the opening backtick and precedes the closing one, and 3
  spaces separate each interpolation from the next (the same 3-space
  spacing as the className template rule under "### Quotes"):
  ```
  className={` ${ cssModObj.namDesBut }   ${ cssModObj.namDesSpa } `}
  ```
- **Class names** follow the JS naming rules (3 segments, 9 characters,
  each segment the first 3 letters of its word, camelCase, every Known
  miscorrection and project-scoped override applying), except the type
  segment names the element's own type rather than a JS type: `<button>`
  → `But`, `<section>` → `Sec`, `<div>` → `Div`, `<span>` → `Spa`, and so
  on (e.g. `.groHeaSec`, read as `cssModObj.groHeaSec`). A tag too short
  for a 3-letter segment is expanded to the full word it stands for first:
  `p` → `Par` (Paragraph), `a` → `Anc` (Anchor), `h1`-`h6` → `Hea`
  (Heading), `ul` → `Uno` (Unordered list), `ol` → `Ord` (Ordered list),
  `li` → `Ite` (list Item), `img` → `Ima` (Image), `svg` → `Svg`, `g` →
  `Gro` (Group), `tr` → `Row`, `td` → `Cel` (Cell), `th` → `Hce`
  (Header cell, since `Hea` already means Heading), `i` → `Ita`
  (Italic), and (decided 2026-10-07) `em` → `Emp` (Emphasis), `dt` → `Ter`
  (description Term), `dd` → `Det` (description Details), `dl` → `Des`
  (Description list), and `header` → `Hed` (Header, since `Hea` already
  means Heading). Longer tags take their own first three letters, as
  ease-my-life's do: `nav` → `Nav`, `main` → `Mai`, `section` → `Sec`,
  `article` → `Art`, `footer` → `Foo`, `form` → `For`, `label` → `Lab`,
  `input` → `Inp`, `select` → `Sel`, `option` → `Opt`, `textarea` →
  `Tex`, `button` → `But`, `blockquote` → `Blo`. A tag not listed here is always expanded to its full name
  the same way; one that can't be expanded is raised with the user
  rather than guessed. A modifier (variant)
  class is its base class's name, then `--`, then the variant (the
  existing `.prog--warm` form). Existing classes
  keep their current names while they move into modules; renaming them
  to this rule belongs to the design-system pass.
  - **One element rendered as different tags** (decided 2026-10-02):
    when one class sits on an element that renders as different tags
    (e.g. an Add control that's a `<button>`, but an InfTipCom `<span>`
    while disabled), each tag gets its own class matching its own hook
    (`rowAddBut`, `rowAddSpa`). Declarations both share go in one
    multi-selector rule, and a rule only one tag needs targets that tag's
    class alone. Variants both tags share (decided 2026-10-03) become a
    modifier on each tag's class, sharing one multi-selector rule per
    variant, e.g. the Stats heat cells' levels, `.hetCelIta--level2,
    .hetCelBut--level2`.
  - **A copied element keeps one name across modules** (decided
    2026-10-02): when several modules carry their own copies of the same
    element's rules (e.g. the Data tab's section cards, headers, and
    rows), that element takes the same class name in every one of them,
    from its shared hook where it has one, so a later move into one shared
    component is a straight merge.
  - **A hook shared by different elements names a group, not an
    element** (decided 2026-10-03): when help mode or a tour marks several
    different elements with one hook (e.g. the Day Log's `logGenSpa` on a
    column's header cell and on every value cell under it), each element
    takes its own class instead of the hook's name, and whatever the group
    shares (a column's alignment) is written into each element's own rule
    rather than a utility class stacked beside it. Identical elements
    sharing a hook (every value cell in one column) still share one class.
- **CSS file boundaries and header**: the same as a JS file: exactly 3
  blank lines before the first real line, exactly 2 blank lines after the
  last one, and a mandatory file-level `/** ... */` header comment
  (`<filename.module.css> = <Expanded Name>`, `@summary`, `@author`), per
  "### Large / design-rationale comments".
- **Declarations**: one declaration per line, tab-indented, alphabetized
  by property name (case-insensitive), except that a shorthand stays
  before any of its own longhands in the same rule (the same exception as
  `style={{ ... }}` objects under "### Arrays and objects", since a later
  shorthand would wipe out the longhand). Within each rule, pad every
  property name so the `:` lines up in one column, computed from that
  rule's longest property name, e.g. `border-radius : 999px;`. Like a
  JS block, every rule's declarations get exactly 2 blank lines after
  the rule's opening `{` line and 2 before its closing `}`. See
  `tabs/pickers/progress-bar.module.css` for the reference example.
  - **Custom properties come first** (decided 2026-10-03): a rule's own
    custom property declarations (`--fad-edg-off`, `--pill-flex`, ...)
    sit above its ordinary declarations, alphabetized among themselves,
    with exactly 1 blank line between the two groups. Each group aligns
    its own `:` and comment columns separately, like any other run of
    lines split by a blank line. A rule holding only custom properties,
    or none, has no blank line. See `tabs/pickers/tab-picker.module.css`'s
    own `.picTabDiv`.
- **No `!important` unless it's genuinely necessary** (decided
  2026-10-03). A rule wins through its selector's specificity or its place
  in the cascade, never through `!important`, which can only be beaten by
  another `!important` and so escalates. Before reaching for it, check
  whether ordering, chaining the base class (see "A converted modifier
  keeps its old specificity"), or a more specific selector does the job,
  and whether the declaration it would fight is even reachable (the Day
  Log's conditional row carried two that nothing ever contested). The
  necessary case is a page-wide override that has to beat every element's
  own rule at once, e.g. `styles.css`'s drag-in-progress cursor on `body[
  data-page-reorder-active] *`. Each one kept gets a comment on its line
  saying why nothing else works, and an existing one is checked as its
  file comes up.
- **`z-index` only as high as it needs to be** (decided 2026-10-03). A
  `z-index` is the smallest value that puts the element above (or below)
  exactly what it has to clear, judged within its own stacking context,
  never a large round number picked to be safe (`999`, `9999`). Escalating
  values turn into an arms race, the same way `!important` does. Where an
  element has to clear a specific other layer, its comment names that
  layer and its value (e.g. a tip at 1 above the tour's dim). Since
  overlays are layered against each other, lowering one means checking
  every layer it sits above or below and moving them together. An existing
  value is checked as its file comes up.
- **Parentheses in CSS functions** (decided 2026-09-29) follow the same
  spacing as JS calls under "### Parentheses spacing": a space after `(`
  and before `)` when there's anything inside, e.g. `var( --fon-siz-p01 )`
  and `calc( var( --fon-siz-bas ) * var( --cdn-pow-001 ) )`. Values still
  written tight (`var(--tex-mut-col)`) are converted as their files come up in
  the design-system pass.
- **Parentheses in queries** (decided 2026-10-02) get the same inner
  spaces: every condition in a `@media`, `@container`, or `@supports`
  query (decided 2026-10-02 for `@supports`) is written
  `( feature : value )`, e.g. `@media ( prefers-reduced-motion : reduce )`
  and `@container app ( max-width : 640px )`, and each condition in a
  combined query gets its own, `( min-width : 720px ) and ( max-width :
  760px )`. The colon takes a space on both sides, the same as a
  declaration's. A query passed to JS as a string (`window.matchMedia(
  '(prefers-reduced-motion: reduce)' )`) is a string value, not CSS, and
  stays as written. CSS modules' `global( name )` wrapper follows the same
  spacing as any other CSS function.
- **Parentheses in functional pseudo-classes** (decided 2026-10-02) get
  the same inner spaces: `:not( .basRowDiv--group )`, `:has( input:focus-visible )`,
  `:is( a, b )`, `:nth-child( 2 )`, nested ones included
  (`:not( :has( .easConDiv ) )`). A selector string inside JS (a hook
  lookup such as `[data-element-name-hook~="..."]:not(:disabled)`) is a
  string value, not CSS, and stays as written, the same as a JS query
  string.
- **`@media` blocks**: a `@media` override is a variant of the element it
  styles, so it sits directly under that element's base rule with its
  other variants. The block gets its own What/Why/How comment after its
  `{` and the usual 2 blank lines of padding inside it; each rule inside
  is indented one more tab and formatted like any other rule. A global
  `@media` block holding rules for several elements splits into one
  block per element, each placed with its own element's variants. See
  `ui/info-tip.module.css`.
- **Reduced motion**: every `animation` or `transition` in a module
  gets a reduced-motion variant, per "### Reduced motion" above.
- **`@keyframes`**: a keyframe only one module uses moves into that
  module (Vite scopes its name and rewrites the `animation` reference);
  one several modules share stays global. A module that plays a global
  keyframe writes its name as `global( overlayOpenFadeIn )`: CSS modules rename
  every bare keyframe name in a module to a scoped one, so a plain
  `overlayOpenFadeIn` would point at a keyframe that doesn't exist and silently not animate. It sits directly after the
  variants of the element that uses it, with one What/Why/How comment
  on its own `@keyframes` line. Its steps (`from`, `to`, `50%`, ...) get
  no comment of their own, are indented one tab, get the usual 2 blank
  lines of padding, aligned colons, and 1 blank line between steps.
  A module exports its keyframe names on `cssModObj` alongside its class
  keys, so a keyframe whose name equals a class's camelCase key (e.g.
  keyframes `holidayRowEnter` beside the class `.holiday-row--enter`)
  shadows that class, and the element silently gets a class with no
  rule. Such a keyframe is renamed right away under the keyframe naming
  rule below (`holidayRowEnterFadeIn`), even during the module move.
- **Keyframe names** follow the 3-segment naming rule with no fixed
  character count (within reason): segment 1 identifies what animates
  (the element's own class when it's for one specific element, or the
  HTML tag when it's for several, e.g. `button`), segment 2 is a
  descriptor (e.g. the state it's for or that triggers it), and segment
  3 is the type of animation where one fits (`bounce`, `fade`/`fadeIn`/
  `fadeOut`, `spin`, `flip`, ...). Like class names, existing keyframes
  keep their current names while they move into modules; renaming them
  belongs to the design-system pass, where this rule may be refined.
  - **A shared keyframe names its role** (decided 2026-10-02): a keyframe
    in the global sheet that several elements play names segment 1 after
    what those elements are (`card`, `check`, `confetti`, `footer`, ...)
    rather than their HTML tag, since shared elements are mostly generic
    `<div>`s and `<span>`s and a tag says nothing about what moves, e.g.
    `cardRemoveSlideOut` or `overlayOpenFadeIn`.
- **A rule with more than one selector** puts each selector on its own
  line, ending with `,`, and only the last one carries the `{` and the
  rule's comment, the same "once it's multi-line, one entry per line"
  reasoning as array entries and JSX attributes. See
  `ui/number-stepper.module.css`'s own spin-arrow rule.
- **CSS comments**: every rule gets one What/Why/How comment, written as
  `/* What: ... Why: ... How: ... */` one space after its own opening
  `{`, the same as any multi-line construct. Declarations get no comment
  of their own, for the same reason `style={{ ... }}` properties don't:
  the property name already says what the line does. The exception is a
  declaration a reader would genuinely need explained, such as a tricky
  or non-obvious value, or a custom property whose name doesn't make
  clear what it is or why it's used; that one gets its own comment after
  its `;`. Expect this exception to be refined as files get reviewed.
- **Token value comments** (decided 2026-10-02): a declaration whose
  value reads a token gets a comment that expands the token's name and
  gives its value, instead of the What/Why/How format: `font-size : var(
  --fon-siz-p01 ); /* Font Size Base Plus 1 ~= 14.572px */`.
  - `=` for an exact value (`ease`, `1rem`), `~=` for a rounded one.
  - A token wrapped in a calc gives the value it resolves to on screen:
    `calc( var( --ver-rhy-m03 ) * 1rem )` is `/* Vertical Rhythm Base
    Minus 3 ~= 6.268px */`.
  - Several tokens make a comma-separated list in the order they appear,
    each token once: `/* Duration Transition Base Plus 2 ~= 277.0ms,
    Motion Standard Easing = ease */`.
  - A theme color gives the default theme's value: `/* Text Muted Color =
    oklch( 0.5 0.012 250 ) */`; a role read through relative color syntax
    lists the role and any alpha token.
  - **Fixed wording for derived values** (decided 2026-10-07): a value that
    runs between two bounds is written `about <low> - <high>` (`/* Gutter
    Side Padding, about 19.304px - 44.876px */`), and a color at an opacity
    is written `= <color> @ <alpha> opacity` (`/* Border Main Color =
    #1a1f24 @ 0.12 opacity */`). Every other derived note keeps its plain
    wording (`the accent lightened by 0.204`).
  - **Numbers of 1,000 or more take thousands separators** in every
    comment (decided 2026-10-07), since they read more easily: `1,130.0ms`,
    `@ 1,920px width`. Code values stay as the language requires
    (`calc( 1920px / ... )`).
  - A declaration that also needs a real explanation (the tricky-value
    exception above) keeps both: the token comment first, then the
    What/Why/How in its own `/* */` right after it on the same line.
  - Token definitions in `:root` are exempt, since each already carries
    its own What/Why/How stating its value. A not-yet-renamed component
    property is expanded as it's named and given its value, or "set by its
    parent" when a parent sets it.
  - The comments in one rule align their columns like any run of lines,
    under the 100-character exception.
  - **They're kept current**: whenever a token's value changes, or a
    declaration switches to a different token, every comment quoting that
    token is found (grep the token's name across `src/`, CSS and JS
    alike) and updated in the same commit. The pre-commit check covers
    this.
- **Spacing inside a region**: exactly 1 blank line between a parent's
  own rule (with its variants) and its first child's rule, or 2 blank
  lines when that first child contains elements of its own and so opens
  its own region (decided 2026-10-02), so a nested section stands out the
  way it does between siblings. A variant (see below) sits directly under
  its base rule, 0 blank lines. The closing side is unaffected: stacked
  `#endregion` markers stay 1 blank line apart.
- **Modifier classes built from a string** (`prog--${ tonValStr }`) can't
  be looked up that way once hashed, so each one becomes its own
  conditional interpolation (`${ tonValStr === 'warm' ?
  cssModObj.progWarm : '' }`), and a modifier with no rule behind it
  (e.g. `prog--accent`) is dropped.
  - **Many values indexed by a number** (decided 2026-09-29): when the
    string was built from a numeric index over a fixed run of values,
    too many for readable ternaries, a module-level constant array lists
    each value's module class in order and the className indexes it
    instead, which still names every class explicitly. See
    `tabs/stats/tab-stats.tsx`'s own `HEA_LEV_ARR` (`heat-${ levValNum }`
    became `HEA_LEV_ARR[ levValNum ]`).
- **CSS file order follows the cascade**: a parent element's rules come
  first, then its first child's, then the next child's, and so on, in the
  same order the elements appear in the component's own markup, each
  child's own descendants following it before its next sibling.
- **Variants of one element's rule** (`:hover`, `[data-open]`,
  `::before`, a `@media` override, ...) come directly after that element's
  own base rule and before its children's rules.
- **Sectioning in CSS**: an element that contains child elements gets a
  `/* #region <Name> */` / `/* #endregion <Name> */` pair (the CSS form
  VS Code folds), named after the element's own class and wrapping its
  own rule (with its variants) plus every one of its children's rules. An
  element with no child elements gets no region. Exactly 1 blank line
  sits between each marker and the rules it wraps, the same as every
  other region in this doc.
  - **A classless wrapper gets no region** (decided 2026-10-07): an
    element that needs no styling of its own (a plain `<div>` grouping a
    column) has no class to name a region after, so its children's rules
    sit at its parent's level. It never gains a class just to name one.
- **Blank lines between siblings in CSS** mirror the JSX sibling spacing
  rule under "### JSX": 3 blank lines around a section whose element
  contains elements that themselves have children, 2 around a section
  whose children are all simple (childless) elements, and 1 around a
  childless element's own rule. When two neighbors call for different
  counts, the bigger count wins.
- **What moves into a module.** Everything that can, even at the cost of
  temporary duplication, which the design-system pass cleans up:
  - Every rule styling the file's own elements moves (cut, never copied,
    so a broken module can't hide behind a leftover global rule).
  - A rule where a parent in one component file styles an element that
    another file renders (e.g. `.entry-editor .pie-reset`) moves into the
    child's own module, and the child owns every one of its own styles.
    When the child only ever renders inside that parent, the parent
    prefix was only scoping and is simply dropped. When the child looks
    different depending on where it sits (a real variant, e.g. `.seg`
    compacted inside Settings rows), the child's module reads the value
    from a custom property with its normal value as the fallback (`.seg
    { height: var(--seg-height, 34px); }`), and the parent's own module
    sets that property on itself (`.setDataRow { --seg-height: 28px;
    }`). The property is named after the child it's for (`--seg-...`),
    since a custom property inherits to every descendant, including a
    nested instance of the same child. Where a variant changes
    structure rather than values (decided 2026-09-28), the child takes
    a layout prop naming which layout it's in, e.g. `ui/
    schedule-editor.tsx`'s own `layVarStr` (`'stacked'` on Today,
    `'rows'` in the Data tab), and its own module holds each layout as
    a modifier class on its root (`.rem-editor--stacked`,
    `.rem-editor--rows`) with that layout's descendant rules, so the
    child still owns every one of its styles and the parent only names
    the layout. A case that fits neither this nor a custom property is
    raised with the user first.
  - **A parent's own styling on an element a shared component renders**
    (decided 2026-10-03), such as an animation on one icon (the Pickers
    tab's sent check popping in): the component accepts a `className`
    prop and forwards it to that element, and the parent passes a class
    from its own module (`<IcoSvgCom className={ cssModObj.senCheSvg }
    ... />`). Hashing only renames the class, so the parent's rule still
    matches the element wherever it renders. A descendant tag selector
    reaching into the component's markup (`.pool-send svg`) is replaced
    this way as each module comes up.
  - A class several components use (`btn`, `pill`, ...) has its
    declarations copied into each module that uses it, attached to that
    element's existing class.
  - A global rule is deleted once every element it styled has its own
    module copy.
  - Only what genuinely can't belong to one component stays global:
    design tokens and themes, base element styles, `@font-face`, keyframes
    several modules share, body/html-level state selectors, `index.html`'s
    boot splash, and elements created outside React (e.g. the `livRegDiv`
    live region).
  - Splitting rules across module files changes the order they apply in,
    so every move is checked for a rule that relied on appearing later in
    the global file to win.
- **The global stylesheet** (`styles/styles.css`, decided 2026-09-29)
  follows every CSS rule above that isn't about markup (declarations,
  comments, `@media` placement, keyframe formatting, multi-selector rules,
  file boundaries and header), with these additions, since a global sheet
  has no markup to order it by:
  - **Purpose regions, in this order**: `Tokens`, `Base Elements` (resets
    and element styles), `Body State` (states set on `<html>`/`<body>`,
    plus elements created outside React such as the live region), and
    `Shared Keyframes` (alphabetical by keyframe name). Siblings inside a
    region sit 1 blank line apart, and regions 3 apart. Decorative banner
    comments are deleted, and the header lists the regions as its
    `Sections:` table of contents.
  - **One `:root`** holds every token, split into token sections, each a
    `/* #region <Name> Tokens */` fold region inside the rule (the CSS
    counterpart of the themed-region object variant under "### Sectioning
    / fold regions"): the sections are ordered alphabetically by name, the
    tokens alphabetically within each, 1 blank line between a marker and
    its tokens, and 3 blank lines between sections. Two families inside
    one section (e.g. the `--dur-ani-*` and `--dur-tra-*` durations, or
    the `--spa-hor-*` and `--spa-ver-*` spacing) sit 2 blank lines apart
    (decided 2026-10-02). Every token gets its
    own one-line What/Why/How comment after its `;` (decided 2026-10-02,
    replacing an earlier rule that only commented tokens whose names didn't
    say what they were), and a run of tokens column-aligns its comments
    like any other run of lines, under the same 100-character exception.
    - **Exception, a scale** (decided 2026-09-29): tokens that form a
      scale of steps (font sizes, and every scale like them) are ordered
      smallest to biggest instead of alphabetically, so the steps read in
      order (`m02`, `m01`, `bas`, `p01`, `p02`, ... rather than
      alphabetically, which would put `bas` first and `m02` after
      `m01`).
    - **Exception, the core design numbers** (decided 2026-09-29): the
      user's own section of core design numbers always comes first inside
      `:root`, ahead of the alphabetized token sections, and is never
      alphabetized, neither its position nor the values inside it, which
      stay in the order the user wrote them. They're the base values every
      other custom property (and literal number) draws from, so other
      tokens are fitted to them over time, carefully and one step at a
      time, never all at once.
    - **Height is ratio based** (decided 2026-09-29): everything vertical (font size, line-height, height,
      max-height, row gaps, top and bottom margins and padding, ...) is the
      base font size times a power of the core design number, never a
      free-standing number. The base font size is 11px, the smallest size
      accessibility tools accept without flagging it, so the font size
      scale starts there and only goes up. `html` sets the root font size
      to 68.75% (11/16) of the browser's own default, so 1rem is that 11px
      base at the usual 16px default and still follows any size a person
      sets: `--fon-siz-bas` is `1rem`, and each step above it is `var(
      --fon-siz-bas )` times the next `--cdn-pow-*` token.
    - **Fluid sizes snap their bounds to steps** (decided 2026-10-07): a
      vertical value that scales with the viewport through `clamp( min,
      vw, max )` (a heading that grows with the screen, a section's
      padding) keeps its viewport middle, but its min and max each move
      to the nearest font size or rhythm step, e.g. `clamp( var(
      --fon-siz-p05 ), 6.5vw, var( --fon-siz-p07 ) )`. Its token value
      comment quotes both bounds.
    - **Width is decided per project** (decided 2026-10-01, replacing an
      earlier viewport-based rule): horizontal sizes are responsive, and
      layouts vary too much between projects for one approach to fit all
      of them. So whenever a project's horizontal sizes first need a
      system, stop and discuss its horizontal layout design with the user
      before converting anything, per "### Undefined cases: stop and
      ask". The two options are the vertical rhythm (a `--ver-rhy-*` step
      times `1rem`, the same steps heights use) or the plastic ratio
      dividing the viewport width proportionally (a horizontal rhythm of
      `100vw` over a power of the core design number, e.g. ease-my-life's
      `--hor-rhy-*` tokens, whose comments quote each step at a 1920px
      viewport). Record the project's choice in its own CLAUDE.md. In ease-my-life the
      viewport steps were tried on the Today tab and didn't hold up below
      about 1100px, so maximum widths use the vertical rhythm, e.g.
      `max-width : calc( var( --ver-rhy-p11 ) * 1rem )`, with the steps
      above `p09` added as these caps needed them.
    - **Horizontal spacing is its own family** (decided 2026-10-01):
      left and right padding and margin use `--spa-hor-*` (spacing,
      horizontal), never `--spa-ver-*`, even where the two currently hold
      the same values, so the intent reads clearly and a project can tune
      the two directions separately. In ease-my-life its steps mirror the
      vertical spacing's (`m09` to `p07`, each a vertical rhythm step
      times `1rem`), and each px value moved to its nearest step. A
      negative margin takes the same step as the padding it cancels,
      written `calc( var( --spa-hor-bas ) * -1 )`. The `-1px` margin of
      the visually-hidden technique isn't spacing and stays literal.
    - **Gaps follow the direction they run** (decided 2026-10-01): a gap
      that only runs horizontally (a flex row that doesn't wrap, or
      `column-gap`) uses `--spa-hor-*`, one that only runs vertically (a
      flex column, or `row-gap`) uses `--spa-ver-*`, and one that runs
      both ways (a grid, or a wrapping flex row) is written as the
      two-value `gap : var( --spa-ver-x ) var( --spa-hor-x )`, row gap
      then column gap, so each direction reads from its own family. A gap
      whose layout is set by another rule (a base rule or a variant)
      follows that layout. A `0` gap stays `0`.
    - **Position offsets follow their axis too** (decided 2026-10-01):
      `top` and `bottom` (and `scroll-margin-top`) use `--spa-ver-*`,
      `left` and `right` use `--spa-hor-*`, and an `inset` covering every
      side is written as two values, vertical then horizontal. An offset
      that mirrors another size references that size's token instead of
      the nearest step: a padding it lines up with, a border width it
      covers, or half an element's own size (e.g. a tooltip arrow at
      `calc( var( --ver-rhy-bas ) * 1rem / -2 )`). An off-screen technique
      (e.g. `left: -9999px`) isn't spacing and stays literal. A motion
      distance in a `translate` (decided 2026-10-02) follows the same axis
      families, `translateX` reading `--spa-hor-*` and `translateY`
      `--spa-ver-*` (negated with `* -1`), when its nearest step is within
      10%; one that isn't (e.g. a 3px nudge, 10% off `m06`) stays literal.
    - **JavaScript follows the same scale** (decided 2026-10-01). An icon
      takes its size as a rhythm step name rather than a pixel number
      (`<IcoSvgCom icoNamStr='plus' sizSteStr='bas' />`), which the component
      turns into `calc( var( --ver-rhy-<step> ) * 1rem )`. Layout math that
      works in pixels (placing a tooltip or tour card, a scroll offset, a
      sticky fallback) reads a step through `utils/rhythm.ts`'s own
      `rhyPxlFun( '<step>' )`, which computes the step's pixel size from
      the root font size and the core design number with the same formula
      `styles.css` uses, so the two can never drift apart. A number that
      only tunes behavior rather than spacing (a "moved more than N px"
      threshold, animation pacing, a clamp that keeps an arrow off a
      rounded corner) stays literal. Numbers inside an SVG's own drawing
      space (path coordinates, `viewBox`, `strokeWidth`) are not CSS
      lengths, scale with the SVG, and are exempt.
    - **Text measure is font based** (decided 2026-10-01): a paragraph's `max-width` comes from the
      project's main body font, not from either rhythm. Paragraph text
      targets 66 characters per line and must land within 45 to 75; small
      or secondary text (hints, captions, subtitles) targets 50 and must
      land within 40 to 60. To pick a value, measure the main font's
      average character width on real prose against both `1ch` (the width
      of its "0") and `1em`, then use whichever unit and `--cdn-pow-*`
      power lands closest to the target, written as `calc( var(
      --cdn-pow-NNN ) * 1em )` or `* 1ch`. Both units follow the element's
      own font size, so the measure holds at any text size. The token's
      comment records the measured characters per unit and the line length
      it gives, so the choice can be rechecked if the font changes. In
      ease-my-life (Geist, about 2.22 characters per `em` and 1.49 per
      `ch`), paragraphs use `--tex-wid-bas` (`pow-012 * 1em`, about 65
      characters) and small text `--tex-wid-sma` (`pow-011 * 1em`, about
      49).
      - **Headings are exempt** (decided 2026-10-01): a heading is never a
        long line of text, so it gets no text width cap; its container sets
        its width.
      - **A container that exists to hold reading text** (a modal, a card)
        takes its `max-width` from its text's width plus its own horizontal
        padding and borders (boxes are `border-box`), rather than a
        free-standing number, e.g. `calc( var( --cdn-pow-012 ) * var(
        --fon-siz-p01 ) + 56px + var( --bor-wid-sma ) * 2 )` for a panel
        whose paragraphs are set at `--fon-siz-p01` with 28px of padding on
        each side. The text's font size is written out, since an `em` on the
        container would resolve against the container's own font size.
      - **Every font follows the same caps**: text in a secondary font (e.g.
        a mono caption) still uses the main font's `--tex-wid-*` tokens,
        which land a little differently in that font but stay close.
  - **A long explanatory comment** becomes a design-rationale block per
    "### Large / design-rationale comments": attached to a rule, its name
    line is `<selector> = <Expanded Name>` (e.g. `html, body = Page
    Root`), with 3 blank lines before the block and after its rule (or the
    region's own 1 blank line at an edge), and 1 blank line between the
    block and its rule; inside a token section, it's `styles.css =
    <Section> Tokens`, sitting between the section's marker and its
    tokens. A short note folds into the rule's own one-line What/Why/How
    instead. The rule keeps its own one-line comment either way.

### Custom property naming
Decided 2026-09-29, for the design-system pass. Every CSS custom property,
design tokens and component-level ones alike (`--seg-flex`,
`--btn-display`, `--entry-editor-*`, ...), is named from three lowercase,
hyphen-joined segments of exactly three letters each: `--<what>-<descriptor>-<kind>`.
Each segment follows the same word-truncation rules as JS names (the word's
own first three letters, every Known miscorrection and project-scoped
override applying, e.g. Offset is `off`, never `ofs`). Existing properties
are renamed to this as their files come up in the design-system pass.
- **The last segment names the kind of value**, not a JS type:
  - **A step in a scale**: `sma` (small), `med` (medium), `lar` (large),
    with `xsm` (extra small) and `xla` (extra large) at either end. `med`
    is the default middle step; `bas` (base) replaces it in a scale whose
    values center on that step rather than treating it as just another
    step, decided per scale.
  - **A scale that needs more steps than those** (decided 2026-10-01,
    replacing the earlier numbered `xl1`/`xs1` steps, since small and
    large stop reading logically once a scale runs past them) names every
    step by its distance from `bas`: `p01`, `p02`, `p03`, ... (base plus
    1, 2, 3, ...) above it and `m01`, `m02`, `m03`, ... (base minus 1, 2,
    3, ...) below it, always two digits. The steps next to the base
    become `m01` and `p01` too, so the whole scale follows one pattern,
    and a comment's `What:` reads `Base Plus 3` or `Base Minus 8` (e.g.
    `--ver-rhy-p15` is `What: Vertical Rhythm Base Plus 15.`). Each family
    counts from its own base, so the same suffix can stand for different
    sizes in different families (`--fon-siz-p03` and `--ver-rhy-p03` are
    one power apart, since the font size base is 1rem and the vertical
    rhythm base is the first power). In ease-my-life the vertical rhythm
    runs `m12` to `p15`, the vertical spacing `m09` to `p07`, and the
    font sizes `bas` to `p06`. A scale that fits within `xsm` to `xla`
    keeps the plain names (e.g. the border widths).
  - **Font sizes start at their base and only grow**: `bas` (base, 1rem,
    which is 11px by default), then `p01` through `p06` (one to six
    powers up).
  - **Font families are named by role, not by typeface** (decided
    2026-10-01), so the same names fit any project: `--fon-fam-mai` (the
    main font), `--fon-fam-sec` (the secondary font, e.g. a mono font for
    numbers and captions), and `--fon-fam-bra` for a single brand font, or
    `--fon-fam-br1`, `--fon-fam-br2`, ... when there are several, with 1
    the main brand face. A brand token falls back through the main font
    (`'Shantell Sans', var( --fon-fam-mai )`), and every font a project
    uses gets a token, even one used only once, so all of them are set in
    one place. In ease-my-life the brand faces are Shantell Sans (1) and
    Quicksand (2).
  - **A category**: `col` (color), `fon` (font family), `dur` (duration),
    `del` (delay), `eas` (easing curve), `spr` (spread, e.g. a shadow or
    glow's reach), `opa` (opacity), `sca` (scale factor), `sha` (a whole
    shadow value), `off` (offset or distance), `ang` (angle), `hei`
    (a height, decided 2026-09-30, e.g. `--cat-rem-hei`, the measured
    height a removing Data card collapses from), `pad` (a padding, decided
    2026-10-02, e.g. `--tab-tou-pad`, the room a tab adds below its content
    during a tour), `bor` (a whole `border` value, width, style, and color
    together, decided 2026-10-02, e.g. `--sor-row-bor`, the divider a Data
    section hands its sort row). `mar` (a margin, decided 2026-10-03, the
    counterpart of `pad`, e.g. `--edi-foo-mar`, the margin a full-bleed
    editor hands its footer). `rad` (a border radius, decided 2026-10-03,
    matching the `--rad-bor-*` tokens, since `bor` already means a whole
    border, e.g. `--ent-edi-rad`, the rounding a row strips from the item
    editor). `wid` (a width, decided 2026-10-03, the counterpart of `hei`,
    e.g. `--pil-tag-wid`, the fixed column a pool row hands its pill). `ind` (an
    index, decided 2026-10-03, a position number the CSS multiplies out, e.g.
    `--equ-tok-ind`, each boot splash token's place in its stagger). A keyword value a parent hands a child
    (decided 2026-10-03) takes the first 3 letters of the CSS property it
    feeds as its kind: `dis` (a `display`), `fle` (a `flex`), `whi` (a
    `white-space`), and `fig` (a `font-variant-numeric`, since it sets
    figure style), e.g. `--but-bas-dis`, the display a parent hands
    ButBasCom. New categories are added here as they come up.
- **A scaled family ends in its step**, and the family moves to the first
  segment: `--fon-siz-p01` (font size, base plus 1), `--gri-gap-sma` (grid gap,
  small; the app lays out with grid first and flexbox only where needed),
  `--rad-bor-lar` (radius, border, large).
- **Durations split by what plays them**: `--dur-tra-med` for transitions,
  `--dur-ani-med` for animations.
- **Colors are named by role, not by hue** (decided 2026-10-01), so the
  same names fit any project: `--bac-pag-col` (page background),
  `--bac-sur-col` (card and panel surface), `--tex-mai-col` (main text),
  `--tex-sec-col` (secondary text), `--tex-mut-col` (muted text: hints,
  labels, metadata), `--bor-mai-col` (borders and dividers),
  `--acc-mai-col` (the main accent, for actions and selection),
  `--acc-sec-col` (a second accent), and `--acc-tin-col` (a pale tint of
  the main accent, behind accent text). A role a project doesn't use stays
  defined but empty, with a comment saying so, so the set is the same in
  every project: ease-my-life uses muted text instead of secondary text,
  so `--tex-sec-col` is empty here.
  - **More roles** (decided 2026-10-01): `--tex-acc-col` (text on the
    accent), `--bac-hov-col` (a hover overlay), `--scr-mai-col` (the scrim
    behind modals and spotlights), `--att-rin-col` (an attention ring, the
    pulse that calls the eye to something, kept apart from the accent so
    it can change on its own), `--sha-mai-col` (the color every elevation
    shadow casts, read with each layer's own alpha), and three status families, `--err-*`
    (errors and deletes), `--suc-*` (success), and `--war-*` (warnings),
    each with `mai` (badges, borders, outlines), `dar` (a darker shade for
    status text), and `tin` (a pale tint behind a badge). A use that needs
    transparency reads its role through relative color syntax, e.g.
    `oklch(from var( --scr-mai-col ) l c h / 0.55)`, rather than defining
    a token per alpha. A literal that matches a theme role's default
    value uses that role instead, so it follows the theme. Exempt from
    color tokens: the black in a `mask-image` (a mask reads only
    transparency), `transparent` and `currentColor`, a preview that has
    to show a fixed palette whatever the active theme (the theme picker's
    rows), and seed data in JS. In ease-my-life the theme system writes
    only the original eight roles, so the newer ones keep one value across
    every theme for now.
  - **Shades of a role are tokens too** (decided 2026-10-02): a lighter
    or darker version of a role that several elements share gets its own
    token, defined once in `:root` through relative color syntax so it
    still follows every theme, e.g. `--bac-sun-col : oklch( from var(
    --bac-sur-col ) calc( l - 0.006 ) c h )`. In ease-my-life: the surface
    family `--bac-rai-col` (raised, +0.006), `--bac-sun-col` (sunken,
    -0.006), `--bac-pre-col` (hovered or pressed, -0.01), and
    `--bac-wel-col` (a well, -0.015); `--bor-fil-col` (a soft fill one
    notch off the border, +0.02) and `--bor-hov-col` (a hovered border,
    -0.08); and the Stats heat map's three accent levels, `--hea-lev-sma`,
    `--hea-lev-med`, and `--hea-lev-lar`. Shifts within a few thousandths
    of each other fold into one token. The lightness shift stays a plain
    number, since a base plus a rhythm number isn't truly on the scale. A
    shade only one element uses stays inline where it's used.
    Decided 2026-10-07: `--acc-lig-col` (accent light) is a lighter
    accent shade for text, hovers, and focus lines on a dark surface, where
    the main accent would sink (reese-roofing's soft blue).
  - **Dark surfaces have their own role** (decided 2026-10-07):
    `--bac-inv-col` (background inverse) is the background of a dark band,
    a dark footer, or a dark button, so a dark surface is named for what it
    is and can change apart from the text color it often matches. Text on
    it reads `--bac-pag-col` (or that role through relative color syntax
    with an alpha), since the page color is what reads as light on dark.
  - **Transparency sits on the rhythm** (decided 2026-10-02): an alpha
    read through relative color syntax uses the reciprocal power of the
    core design number nearest to it (`/ var( --cdn-pow-004-rec )`, about
    0.325), under the 10% rule for behavior numbers. An alpha with no power
    within 10% stays literal: in ease-my-life 0.16, 0.5, 0.65, 0.85, the
    near-opaque 0.88 to 0.94, and 0 and 1.
- **Examples mapped from today's tokens**: `--bg` → `--bac-pag-col`,
  `--surface` → `--bac-sur-col`, `--text` → `--tex-mai-col`, `--muted` →
  `--tex-mut-col`, `--accent-soft` → `--acc-tin-col`, `--warm` →
  `--acc-sec-col`, `--font-sans` → `--fon-fam-mai`, `--r-lg` →
  `--rad-bor-lar`, `--exhale-dur` →
  `--exh-car-dur`, `--exhale-glow` → `--exh-glo-spr`, `--exhale-glow-op`
  → `--exh-glo-opa`, `--exhale-scale` → `--exh-car-sca`.
- **A component-level property** still names the child it's for (see
  "What moves into a module" under "### CSS modules and JS hooks"), now as
  its first segment.
- **Negative values get no tokens of their own** (decided 2026-09-30): a
  negative margin or offset multiplies its positive token at the point of
  use, `calc( var( --spa-ver-m05 ) * -1 )`, rather than each scale carrying
  a mirrored set of negative tokens. The core design numbers' own negative
  tokens (`--cdn-pow-001-neg`, ...) are the one exception, since they're
  the raw numbers other values draw from.
- **Border widths use the rhythm too** (decided 2026-09-30), even though
  browsers snap them to whole pixels (Chromium rounds down to whole CSS
  pixels, with a 1px minimum), so the intent stays visible in the value:
  `--bor-wid-sma` (`m12`, about 0.499px, the hairline), `--bor-wid-bas`
  (`m09`, about 1.160px), `--bor-wid-lar` (`m07`, about 2.035px), and
  `--bor-wid-xla` (`m05`, about 3.571px), each a rhythm step times 1rem. A
  step is picked so it snaps to the intended width: `m06` (about 2.696px)
  would draw as 2px, so 3px takes `m05`.
- **Border radii use a five-step scale** (decided 2026-10-01):
  `--rad-bor-xsm` (`m05`, about 3.57px), `--rad-bor-sma` (`m02`, about
  8.30px), `--rad-bor-med` (`m01`, 11px), `--rad-bor-lar` (`bas`, about
  14.57px), and `--rad-bor-xla` (`p01`, about 19.30px), each a rhythm step
  times 1rem. Every literal radius folds into the nearest token, so a
  corner size changes in one place. Values that mean a shape rather than a
  size stay as they are: `999px` (a fully rounded pill), `50%` (a circle),
  `0`, and `inherit`. JavaScript reads a radius the same way as any other
  step, through `rhyPxlFun`.
- **Durations use a scale on the core design number** (decided
  2026-10-01): every step is a power of the core design number in milliseconds, the
  same way every length is a power of it in rem. The base step is the 18th
  power (`calc( var( --cdn-pow-018 ) * 1ms )`, about 157.8ms), chosen over
  a free-standing 150ms because it keeps durations on the rhythm and fits
  common interface timings closely (120ms lands on about 119ms). Steps
  are named by base offset like the rhythm, from `m03` (about 68ms, the
  shortest step that still reads as motion) up. Transitions use
  `--dur-tra-*` and animations `--dur-ani-*`, the same steps in both. A
  literal moves to a step by what the motion is for: **expressive** motion
  (celebrations, confetti, check-mark pops, pulses, spins, sparkles)
  rounds up to the next step, since extra length reads as more satisfying;
  **interface** motion (hovers, toggles, collapses, modals, confirm rows,
  cards and tabs entering and leaving) rounds to the nearest step, unless
  that would make it more than 10% shorter, in which case it rounds up.
  Durations aren't snapped to whole frames: the browser paints by elapsed
  time, so any duration animates smoothly. Reduced-motion `.01ms` values,
  `0ms`, and other near-zero durations that exist only so an end event
  fires stay literal.
- **Shadows use an elevation scale** (decided 2026-10-01): a drop shadow
  that lifts something off the page reads one of `--ele-sma-sha` (knobs and
  small raised controls), `--ele-med-sha` (small floating surfaces such as
  tooltips and a floating tab bar), `--ele-lar-sha` (popovers and anything
  being dragged), `--ele-xla-sha` (modals), or `--ele-sid-sha` (the large
  shadow turned to fall sideways, for a drawer sliding in from an edge).
  Every length in them is a vertical rhythm step, and each level above the
  smallest pairs its soft key shadow with a crisp contact layer. A
  `box-shadow` that isn't elevation (a `0 0 0 Npx` ring or outline, an inset
  border, a pulse keyframe, a spotlight's huge spread) isn't covered by
  the scale.
  - **A `filter: drop-shadow()` is exempt too** (decided 2026-10-07): it
    follows an image's own outline rather than its box, and it can't take
    a spread value, so it can't read the `--ele-*-sha` tokens. Its lengths
    still read rhythm steps, and its color may be tinted (reese-roofing's
    hero logo casts an accent-tinted shadow).
- **Rings and outlines use the same lengths** (decided 2026-10-02): a
  focus ring's `outline-offset`, and a `box-shadow` that draws a ring, gap,
  or extra line, read the token of the size they mirror (`var(
  --bor-wid-lar )` for an offset that equals the ring's own width, `var(
  --bor-wid-bas )` for a line that doubles a border), negated with `* -1`
  when they point inward, and otherwise the nearest vertical rhythm step
  times `1rem`. An `outline-offset` snaps toward zero to whole pixels the
  way a border width does, while a `box-shadow` doesn't snap at all, so a
  gap drawn by one and cleared by the other takes the step whose snapped
  offset draws the intended width: Today's checkbox gap and the offset
  that clears it both use `m05` (about 3.57px), whose offset snaps to 3px
  and whose ring covers the gap's extra fraction, drawing a 3px gap.
  A pulse keyframe's ring sizes come from the rhythm too, and an
  intermediate step that only shapes the motion (a ring halfway grown at
  40%) is written as a fraction of the final step, e.g. `calc( var(
  --ver-rhy-p01 ) * 1rem / 2 )`, so the motion keeps its shape.
- **Easing curves use five tokens** (decided 2026-10-01): `--mot-sta-eas`
  (standard, `ease`), `--mot-dec-eas` (decelerate, for things arriving),
  `--mot-acc-eas` (accelerate, for things leaving), `--mot-ove-eas` (a
  gentle overshoot), and `--mot-bou-eas` (a strong, springy bounce). Every
  hand-tuned curve folds into its family; the plain `linear` keyword stays
  as is.
- **JavaScript timing follows the same steps** (decided 2026-10-01). A
  timer that waits for a CSS animation or transition to finish reads that
  animation's own step through `utils/rhythm.ts`'s own `durMilFun(
  '<step>' )` (plus the step of any delay it also waits through), so the
  two can never drift apart. Motion JavaScript plays itself (an
  `Element.animate` call, a `requestAnimationFrame` tween) takes its
  duration from `durMilFun` too and its curve from `utils/motion.ts`'s own
  `motEasFun( '<family>' )`, which reads the matching `--mot-*-eas`
  token. A timer that only paces behavior stays literal: loading and
  safety timeouts, how long a confirmation stays up, waits on a browser
  action (a smooth scroll, a focus move), clock ticks, extra safety
  margins, and reduced-motion short-cuts.
- **A behavior number moves onto the rhythm** (decided 2026-10-02: a
  stagger, a pacing step, an opacity, ...) when all three hold: every timer
  or value that depends on it reads the same rhythm step, so they stay in
  exact sync (e.g. a 70ms card stagger and the cleanup that waits `count ×
  stagger` both read `durMilFun( 'm03' )`); its nearest step is within 10%
  of the current value; and its value isn't constrained by layout, meaning
  no element's size, position, or closeness to its neighbors limits what
  it can be. A value that fails any of these stays literal, e.g. the
  exhale's `1.012` swell, which has to stay small enough that swelling
  cards never crowd each other.
- **Breakpoints are a short list of round numbers** (decided 2026-10-01).
  A custom property can't be read inside an `@media` or `@container`
  condition, so breakpoints are literal. They don't come from the rhythm:
  its steps sit about 32% apart, too coarse for the widths a layout really
  needs to switch at, so each project keeps a small set of round `px`
  values instead of one tuned number per fix. They stay `px` rather than
  `rem`, so a layout switches at a predictable screen width. A new
  breakpoint snaps to one of the set; since nearly every query is a
  `max-width` fix for something that crowds below that width, it rounds up
  to the next value, because rounding down would bring back the problem in
  the gap. A pair of queries that must not overlap keeps its offset (`max-
  width: 719.98px` beside `min-width: 720px`, `min-width: 761px` after
  `max-width: 760px`). Layout queries measure the app container (`@container
  app`); only what a container can't measure, such as the viewport's
  height, stays `@media`. In ease-my-life the set is 440, 500, 560, 640,
  720, 760, and 880px, plus a 750px height query.
- **The core design numbers are exempt** from this naming pattern (see
  the exception under "The global stylesheet" above): they're named and
  ordered as the user writes them.
- A property that doesn't fit the pattern is raised with the user when it
  comes up, per "### Undefined cases: stop and ask", and the decision is
  recorded here.

### HTML
Decided 2026-10-03, for the HTML pass that follows the CSS pass.
- **Elements follow the JSX rules**: tab indentation, the 1/2/3 blank-line
  sibling spacing by nesting depth, attribute tiers and alphabetical order,
  2+ attributes going multi-line (body elements only, see the head rules
  below), single-quoted attribute values, and a comment on every element in
  the same places JSX puts them (glued after a container's opening `>`,
  after a void element's own `/>`, after a one-line element's closing tag).
  An inline `<style>` follows the CSS rules, and an inline `<script>` the
  JS rules; a JSON-LD script's contents stay valid JSON (double quotes, its
  own key order), indented with tabs.
- **The doctype is its own section**: exactly 3 blank lines separate
  `<!doctype html>` from the `<html>` tag after it.
- **The head and body are separate sections too** (decided 2026-10-07):
  exactly 3 blank lines separate `</head>` from `<body>`, whatever their
  contents.
- **Comments are HTML comments in the same one-line template**: `<!-- What:
  ... Why: ... How: ... -->`. An HTML file gets no file-level summary. A
  raw-text element (`<script>`, `<style>`) can't hold an HTML comment, since
  anything inside it is script or CSS, so its comment still goes right after
  its opening tag, written in its content's own syntax: `<style>/* What: ...
  */`, or `<script src='...'>/* What: ... */</script>` for an external
  script, whose only allowed content is JS comments. A JSON-LD script is the
  one exception, since JSON has no comments: its comment follows its closing
  `</script>`. A `style` attribute's declarations are spaced like CSS
  declarations (`style='--equ-tok-ind : 3'`).
- **The shipped page drops its comments** (decided 2026-10-07): Vite
  processes `index.html` but doesn't minify it, so every comment and
  indentation level above would ship to every visitor. Each project's
  `vite.config.ts` carries a build-only plugin whose `transformIndexHtml`
  step (ordered `'post'`, after Vite injects its own tags) strips every HTML
  comment and the comment inside an external `<script>` tag, trims each
  line, and drops blank lines, keeping the newlines between lines so wrapped
  text keeps its spaces. A project with inline styles, JSON-LD, or scripts
  in `public/` minifies those in the same plugin. See ease-my-life's
  `minShiFun` for the full version and reese-roofing's for the
  `index.html`-only one.
- **A section summary** is the section-intro design-rationale block in HTML
  form, a multi-line `<!-- ... -->` whose lines are indented one tab and
  hard-wrapped at 79 characters: an `index.html = <Name> <Descriptor>` name
  line, `@summary`, and `@author`. It sits inside its section's region, 1
  blank line after the `<!-- #region <Name> -->` marker, with 3 blank lines
  between its closing `-->` and the section's first tag, the same as a
  section-intro block anywhere else.
- **The head is grouped into sections**, each wrapped in a `<!-- #region
  <Name> -->` / `<!-- #endregion <Name> -->` pair (VS Code folds these in
  HTML), with 1 blank line between each marker and its tags and exactly 2
  blank lines between one section's `#endregion` and the next section's
  `#region`. Tags within a section sit on consecutive lines, no blank lines
  between them. The sections, in this order, skipping any a page doesn't
  need:
  1. **Document**: `charset` (always the head's first tag), `viewport`, and
     the `<title>`.
  2. **Search**: the `description` meta and the `canonical` link.
  3. **Web App**: the `manifest` link and the `theme-color` metas.
  4. **Icons**: the browser favicon links.
  5. **Home Screen**: the `apple-touch-icon` link and the
     `apple-mobile-web-app-*` and `mobile-web-app-capable` metas.
  6. **Open Graph**: the `og:*` metas.
  7. **Twitter Card**: the `twitter:*` metas.
  8. **Structured Data**: JSON-LD scripts.
  9. Inline styles and scripts, each a section of its own named for what it
     does (e.g. **Boot Splash Styles**).
  A tag that fits none of these is raised with the user and its section
  recorded here.
- **Order within a section**: where order changes behavior it stays as
  authored (`charset` first; favicon links from most to least preferred
  format; a light `theme-color` before its dark one); otherwise tags are
  alphabetized by their identifying attribute (`name`, `property`, `rel`).
- **Head tags stay one per line**: unlike body elements, a head tag keeps
  its attributes inline whatever their count, followed by its one-line
  comment. A run of same-shape tags column-aligns its attributes by
  position, the same as stacked one-line object rows under "### Arrays and
  objects" (stopping before a long, prose-length value), and its comments
  under the usual 100-character exception.
- **Existing head comments**: a note about one tag becomes that tag's own
  trailing comment (merged after its What/Why/How, per the merging rule
  under "### Comments"); a note about a whole group becomes that section's
  summary.
- **XML files follow these rules too** (decided 2026-10-03, so far only
  `public/sitemap.xml`): tabs, the JSX sibling spacing, single-quoted
  attribute values (XML allows them), and a `<!-- What: ... -->` comment on
  every element, with no file-level summary. One exception: the file starts
  with its `<?xml ... ?>` declaration on its very first line, since anything
  before it makes the file invalid, and ends with exactly one newline, the
  same boundaries as JSON. An exported image (`public/assets/icon.svg`) is
  artwork rather than hand-edited code, and stays exactly as exported.

### JSON
Decided 2026-10-03. JSON can't hold comments and its syntax is fixed, so
almost none of the JS rules apply. Instead, a JSON file matches exactly what
`JSON.stringify( value, null, '\t' )` produces plus a single trailing
newline, which is also what npm writes whenever it rewrites `package.json`
(an `npm version` bump, `npm install <pkg>`), keeping only the file's own
indentation and trailing newline. Formatting that matches the serializer
never churns when a tool rewrites the file.
- **Scope**: hand-maintained JSON files (`package.json`,
  `public/manifest.webmanifest`, and the `tsconfig*.json` files). A
  generated one (`package-lock.json`) is exempt: its tool owns its format,
  and nobody edits or reformats it.
- **`tsconfig` files follow it exactly** (decided 2026-10-05), even though
  TypeScript accepts comments and trailing commas in them: no comments or
  section labels, and every key alphabetical, since a tsconfig has no
  established key order of its own.
- **Format**: tab indentation, double quotes (JSON requires them, the one
  exception to the single-quote rule), `"key": value` with no space before
  the colon, every non-empty object or array expanded one entry per line,
  `[]`/`{}` when empty, no trailing commas, and no blank lines anywhere.
- **File boundaries**: JSON is exempt from the 3-blank-line start and
  2-blank-line end rules. A file starts with its opening bracket and ends
  with exactly one newline, since npm would strip anything else from
  `package.json`.
- **Key order**: object keys are alphabetical, except where a format has an
  established order of its own, which it keeps: `package.json`'s top level
  follows npm's conventional order (name, version, private, type, scripts,
  then the dependency maps), its dependency maps stay as npm sorts them, and
  `manifest.webmanifest` keeps the web app manifest's conventional order
  throughout, with none of its keys alphabetized. Arrays always keep their
  authored order.
- **No comments**: anything a JSON file needs explained lives where the file
  is used or in this doc (e.g. `vite.config.ts` explains why the manifest is
  hand-written).
- **Check**: a JSON file passes when parsing and re-serializing it
  reproduces it byte for byte:
  ```
  node -e "const s = require( 'fs' ).readFileSync( process.argv[ 1 ], 'utf8' );
  process.exit( s === JSON.stringify( JSON.parse( s ), null, '\t' ) + '\n'
  ? 0 : 1 )" <file>
  ```

### Plain-text config files
Decided 2026-10-03. Files in a tool's own line-based format: Netlify's
`_headers` and `_redirects`, `robots.txt`, and `.gitignore`. Their tools read them line by
line, so only the rules that can't change what a tool reads apply.
- **File boundaries**: exempt from the 3-blank-line start and 2-blank-line
  end rules, the same as JSON. A file starts on its first line and ends with
  exactly one newline, since older `robots.txt` parsers read a blank line as
  the end of a group.
- **Comments are `#` lines of their own**, never trailing, since these
  formats read anything after a value as part of that value. Every rule or
  block gets the one-line `# What: ... Why: ... How: ...` directly above it,
  glued with no blank line. A long explanation becomes a summary block above
  that line, the `#` form of a design-rationale block: `#` lines hard-wrapped
  at 79 characters, a `<filename> = <Name> <Descriptor>` name line,
  `@summary`, and `@author`, with a bare `#` for each blank line inside it
  and 1 blank line between the block and the comment it sits above. There's
  no file-level summary, the same as HTML.
- **Spacing**: 3 blank lines between one block (its summary, comment, and
  lines) and the next, the same as top-level JS declarations. A block's own
  lines sit together with no blank lines.
- **Indentation**: tabs, which Netlify accepts for a `_headers` block's
  header lines.
- **Order**: where order changes behavior it stays as authored (`_redirects`
  rules match top to bottom, and a `robots.txt` group's rules are read in
  order); otherwise lines are alphabetized, e.g. the headers within one
  `_headers` block. A Content-Security-Policy's directives follow the
  convention: `default-src` first, then the rest alphabetized.
- **`.gitignore` re-includes get their own block** (decided 2026-10-03):
  every `!` line goes in a block of its own after all the other blocks,
  alphabetized within it, since a re-include only works after the pattern
  it overrides.
- **Long values stay on one line**: Netlify can't continue a header value
  onto the next line, so a long one (the Content-Security-Policy) stays
  whole.

### Arrays and objects
- **Once an array literal cannot stay on a single line, every one of its
  entries gets its own line, never 2+ entries packed onto one shared
  physical line.** This is the array-literal counterpart to the object-
  literal and JSX-attribute versions of the same rule elsewhere in this
  doc (`### Multi-line attributes`' own "2+ attributes always goes
  multi-line, one per line" rule; the object-literal "2+ properties gets
  split to one property per line" rule below): once a construct is
  multi-line at all, it commits fully, rather than a partial collapse
  that crams several entries onto a leftover line. This applies
  regardless of entry shape (a bare identifier, a function call, a
  conditional spread, a literal) and regardless of how short an
  individual entry is; a short entry sitting next to other short entries
  is not an exception; the byte savings of "these all clearly fit
  together" is never worth the inconsistency of some entries getting
  their own line while others don't. See `onboarding/picker-tours.tsx`'s
  own `steObjArr` for a fixed reference example: what used to be 4
  entries crammed onto a shared line (`NAV_STE_OBJ, buiNewFun(...),
  NAM_STE_OBJ, GRO_STE_OBJ,`) now gets one line per entry instead, each
  with its own trailing comment per the usual "every line of code gets a
  comment" rule.
- No blank lines between entries within the same array/object literal
  (e.g. the rows of a plain config array); but directly after the opening
  `[`/`{` and directly before the closing `]`/`}`, use 2 blank lines, same
  as a function body (below). This only applies when the literal already
  spans multiple lines; a single-line literal (e.g. one inline `{ id, label }`
  passed as a prop) needs no padding.
  - **Exception, a long, prose-length single-line array entry still gets
    1 blank line before and after it**, the array-entry counterpart of the
    object-property long-outlier exception below, even though this specific
    exception is for ARRAY entries rather than object properties: a plain
    config array's own short rows (a string, a number, a small object) stay
    flush together with no blank lines per the base rule above, but an
    array whose entries are each a full paragraph of prose (e.g. a modal's
    own `parEleArr` body paragraphs) reads far more clearly with 1 blank
    line separating each paragraph, the same readability reasoning the
    object-property outlier exception already applies to a long `bodEle`-
    style value. See `onboarding/welcome-tour.tsx`'s own `parEleArr` array (passed to
    `IntModCom`) for the reference example: its 3 paragraph entries each
    get 1 blank line before and after, despite each being syntactically
    one physical line, not a genuinely multi-line entry.
- **Exception, a large function-module object**: an object using the
  themed-region "Object-literal variant" under "### Sectioning / fold
  regions" above (`store.ts`'s own `actStoObj`) spaces its entries 3
  blank lines apart instead, per that variant's own "Entry spacing"
  bullet; everything below still applies to every other object.
- **A multi-line entry inside an array, or a multi-line property inside an
  object, gets exactly 1 blank line before and after it**, UNLESS that
  side is also the container's own first/last position, in which case the
  container's own 2-blank-line open/close padding (the bullet above)
  applies instead of the 1-blank rule. The two sides (before/after) are
  judged independently: an entry can be "first" (so its own 2-blank rule
  applies before it, but only 1 blank after it, assuming something follows)
  or "last" (2 blanks after, 1 before) or neither (1 blank both sides) or
  both at once if it's the container's only entry (2 blanks both sides).
  This nests recursively at every depth: a deeply-nested multi-line
  property follows the exact same before/after logic relative to ITS OWN
  immediate parent, independent of how outer levels are padded:
  ```
  const exaRulArr = [


  	{


  		exaBoo : true,
  		exaNum : 456,

  		exaObj : {


  			exaBoo : true,
  			exaNum : 456,

  			exaObj : {


  				exaBoo : true,
  				exaNum : 456,
  				exaStr : 'example property string'


  			},

  			exaStr : 'example property string'


  		},

  		exaStr : 'example property string'


  	},

  	{

  		...
  	}


  ];
  ```
  Walking this: `exaRulArr`'s first entry gets 2 blanks after `[` (first);
  that entry's first property `exaBoo` gets 2 blanks after its own `{`
  (first); the simple properties `exaBoo`/`exaNum` have no blanks between
  each other (plain entries, not multi-line); the multi-line property
  `exaObj` gets 1 blank before it (not first) and 1 blank after it (not
  last either, since `exaStr` follows it); `exaStr`, even though it's a
  plain simple property, is still this object's own LAST entry, so the
  object's own closing `}` still gets the base 2-blank close padding
  before it, exactly as it would if the last entry had been multi-line
  instead. Between sibling array entries that are each multi-line objects
  (neither first nor last), it's 1 blank on both sides.
- **Every multi-line object literal's own properties are ordered
  alphabetically by property name** (case-insensitive), independent of
  whatever order they were originally written in. This applies at every
  nesting depth (a nested object's own properties are alphabetized
  independently of its parent's, same as its own `:` alignment is), and
  applies to a namespace object's own external-facing keys too (e.g.
  `STORAGE`/`PICKERS`/`CAD_NAM_OBJ`), since a plain object literal's own
  property order has no functional effect in JS. This does NOT apply to
  array literal entries (e.g. `TAB_OBJ_ARR`'s own rows, a help-catalog's
  own items), only to an object literal's own named properties; an
  array's own entry order is frequently meaningful (a tour's own step
  sequence, a nav bar's own left-to-right order) and stays exactly as
  authored.
  - **One-line object literals are alphabetized too**, not just
    multi-line ones: a config row like `{ colStr : 'var(--acc-sec-col)', keyStr
    : 'once', labStr : 'One-Time' }`, an options object like `{ day :
    'numeric', month : 'short' }`, or a lookup table all follow the same
    case-insensitive order, unless their order genuinely matters (per the
    exception below). A stack of one-line rows keeps its position-based
    column alignment after reordering. See `tab-stats.tsx`'s own
    `STA_RAN_ARR`/`SOU_MET_ARR`/`TYP_MET_ARR` for the reference examples.
    The same applies to the field list in a Repeated-shape JSDoc block,
    which documents the shape's fields alphabetically. Earlier-reviewed
    files get this in the final file-by-file pass.
    - **Rows that don't all share the same keys** (decided 2026-09-27):
      keys every row carries come first, alphabetized, then each row's
      own optional keys, alphabetized, so an optional key never shifts
      the shared columns out of line. The same order generated data rows
      use. See `help/sample-data.ts`'s own `TAS_SAM_ARR`.
  - **Object destructuring patterns are alphabetized the same way**,
    most commonly a component's own `function Foo ( { a, b } )` props,
    unless their order matters (a `...rest` element always stays last).
    Since a function comment's `@param props.<name>` lines follow the
    destructuring order and its `@example` shows the real call
    signature, both end up alphabetized along with it. Array
    destructuring (`const [ a, b ] = ...`) is positional, so it's never
    reordered. See `tab-stats.tsx`'s own `BreBarCom`/`PagNavCom`/
    `TabStaCom` for the reference examples.
  - **`style={{ ... }}` objects are alphabetized too**, the same as any
    other multi-line object literal. Their keys are real CSS property
    names (an external contract, so they're never RENAMED, per the
    object-property naming exemption), but their ORDER is free, so it
    follows the same case-insensitive alphabetical rule, with every
    other ordering rule here (computed/expression-key sections, long
    outliers, spreads) applying within them as usual.
    - **Exception, a CSS shorthand next to one of its own longhands**
      (e.g. `margin` with `marginTop`, `border` with `borderColor`,
      `background` with `backgroundColor`): the longhand must stay
      AFTER its shorthand, since React applies inline style properties
      in order and a shorthand written later would silently wipe out the
      longhand's value. Alphabetize everything else normally around that
      pair.
    - **When it's applied**: this rule was written on 2026-09-24. From
      `tab-data.tsx`'s review onward it's applied as part of each file's
      own manual review; files reviewed before that get it during the
      second, file-by-file pass that follows every manual review.
  - **Computed keys (`[ someVar ] : value`) form their own group, placed
    ahead of every normally named property**, so their bracketed keys
    never sit in the same `:`-aligned column as plain names (which would
    push the whole column out of line). Within that group, they're
    alphabetized by the name of the variable inside the brackets, using
    the same case-insensitive comparison as any other key, and aligned
    among themselves. Exactly 1 blank line separates the computed-key
    group from whatever named properties follow it; each group computes
    its own `:`/comment alignment independently. Any leading spread keeps
    its own pinned position and spacing ahead of both groups, per the
    spread rules below. This only applies when property order genuinely
    doesn't matter: if a computed key could collide with a named key
    (an override relationship) or something reads the object's own key
    order, leave the authored order alone, the same exception every
    other reordering here already has. E.g. `store.ts`'s own
    `setCusFun` builds `nexAppObj` as its appearance spread, 1
    blank line, `[ keyNamStr ] : savColObj`, 1 blank line, then
    `theme : keyNamStr` (`keyNamStr` is always `'customLight'` or
    `'customDark'`, so it can never collide with `theme`).
    - **Expression keys** (a computed key whose brackets hold an
      expression rather than a bare variable, e.g. `[ 'a' + b ]`,
      `[ obj.key ]`, `[ fooFun() ]`) get a section of their own, placed
      right after the bare-variable computed-key group and before the
      named properties. They follow the exact same rules within their
      section: alphabetized, aligned among themselves, 1 blank line
      separating the section from its neighbors on each side, and the
      same "only when order doesn't matter" condition. Since there's no
      single variable name to sort by, they're alphabetized by the
      expression's own source text exactly as written inside the
      brackets, compared case-insensitively.
  - **Exception, skip when the current order is actually relied on**:
    before reordering a given object, check whether anything reads it
    via `Object.keys()`/`Object.entries()`/`Object.values()`/a
    `for...in` loop in a way that assumes its own current property
    sequence (as opposed to just looking up one property by name,
    which is order-independent and always safe to reorder around).
    If reordering would change real behavior, leave that one object's
    own order exactly as-is and note it rather than guessing; this is
    judged per-object, not assumed from the object's shape alone.
  - **Exception, a large object deliberately grouped into themed
    regions**: see the "Object-literal variant" bullet under "###
    Sectioning / fold regions" above (`store.ts`'s own `actStoObj`),
    where alphabetization applies to the regions and within each region
    rather than across the whole object at once.
  - **Object literals containing a spread (`...someObj`) are NOT
    entirely skipped, only the spread's own position is protected.**
    A spread carries real override/inheritance semantics based on
    WHERE it sits relative to the object's other entries (a spread
    followed by explicit properties means "start from these defaults,
    then override some of them"; a spread placed after explicit
    properties would instead override THEM), so moving a spread
    relative to any named property, or relative to another spread, is
    a genuine behavior change, not a cosmetic reorder: its own
    position stays exactly as authored. Every other, named property in
    the same object still gets alphabetized normally among itself,
    exactly as if the spread were not there at all (and still applies
    the `bodEle`-always-last refinement above where relevant); only the
    spread's own slot in the sequence is pinned. This refines an
    earlier, more conservative practice of skipping such an object
    entirely: `onboarding/page-steps.tsx`'s own `buiTs1Fun` is the
    reference example, where `...navTarObj` opens the returned step
    object and the explicit `bacBoo`/`cirBoo`/`priStr`/`tabStr`
    properties after it are alphabetized normally, with `bodEle` still
    pulled to the very end per its own separate exception.
    - **Refinement: a spread with no real key overlap against the named
      properties it would move past MAY be relocated to sit after all
      of them, treated as its own outlier, when doing so lets those
      named properties form one clean, tightly-grouped, aligned run
      instead of being split around it.** The "position is protected"
      rule above exists specifically to preserve override semantics;
      when the spread's own resolved keys share nothing with any named
      property it would newly sit next to, moving it changes nothing at
      runtime, so alignment can win instead. Verify this by inspecting
      the spread's own contents against every named property in the
      object before moving it; if there is real overlap, or any doubt,
      leave the spread exactly where it was authored instead, per the
      base rule above. Once moved, it still gets its own 1-blank-line
      separation from the last named property before it (per the
      blank-line rule just below), and the CONTAINER's own close
      padding (2 blank lines) applies after it instead of that 1-blank
      rule if it lands as the object's own new last entry. See
      `onboarding/reminder-tours.tsx`'s own `buiAddFun`, whose
      `emlTouObj.set()` prefill payload moved its own `daysOfWeek`-only
      conditional spread to the very end, after `createdFromSample`/
      `name`/`repeat` were alphabetized and tightly grouped, since
      `daysOfWeek` shares no key with any of those 3.
    - **Blank-line spacing around a spread**: exactly 1 blank line
      separates a spread from a NAMED property immediately next to it
      (in either direction), and exactly 1 blank line precedes a
      spread's own first line, UNLESS it is the object's own first
      entry, in which case the container's normal 2-blank open-padding
      applies instead (per the general multi-line-entry padding rule
      above) rather than a redundant extra 1-blank rule on top of it.
      - **Exception, a run of consecutive spreads with nothing named
        between them stays tightly grouped, 0 blank lines within the
        run itself**, the same "same kind of thing" tiering already
        used for a run of consecutive `const`/`let` declarations or a
        run of consecutive same-operation calls elsewhere in this doc
        (e.g. a base spread immediately followed by one or more
        conditional-override spreads building up toward one combined
        object, `...curTasObj, ...( cond ? {...} : {} ), ...( cond2 ?
        {...} : {} )`). The 1-blank-line rule from the bullet above
        still governs the transition INTO the run's own first spread
        (unless it's the object's own first entry) and OUT of the
        run's own last spread (unless it's the object's own last
        entry); it just does not apply BETWEEN spreads inside the
        same run. Each spread in the run still gets its own comment.
    - **A conditional spread whose object literal itself needs to go
      multi-line** (`...( cond ? { a : x || null, b : y || '' } : {} )`
      where the object has 2+ properties with non-trivial values, per
      the multi-line object rule below) is wrapped in place rather than
      pulled out into a separately named value first: the spread's own
      opening line ends at the object's opening brace (`...( cond ? {`),
      carrying the spread's own comment, the object's properties follow
      one per line (alphabetized, `:`-aligned, each with its own
      comment, the usual 2-blank open/close padding), and the ternary's
      own remainder closes on a line of its own (`} : {} ),`, or with no
      trailing comma when it's the containing object's own last entry),
      which needs no comment since it's only closing brackets.
      - **Amends the 0-blank run-of-spreads exception above**: a
        multi-line spread breaks out of that tight grouping the same way
        a multi-line property does elsewhere in this doc. It gets exactly
        1 blank line separating it from the spread before it (and from
        any spread after it), and it moves to the END of its run of
        spreads, after every single-line spread, the same "multi-line
        constructs go last" ordering the long-outlier rule applies to
        properties. Since a spread's position carries override
        semantics, moving it is only allowed when its own keys don't
        overlap with any spread it would move past (the same check the
        spread-relocation refinement above requires); if they do
        overlap, it keeps its authored position but still gets the 1
        blank line separation. 2+ multi-line spreads in the same run
        keep their own original relative order and are each separated
        by 1 blank line. See `store.ts`'s own `setEntFun` for
        the reference example: its single-line `periodKey` spread comes
        first, then 1 blank line, then the multi-line day-off-card
        fields spread last (no key overlap between the two).
    - **A spread gets its own comment, same as any other line of
      code**: `...navTarObj, // What: Nav Target Spread. Why: ... How:
      ...`, explaining what it spreads in and why, following the same
      one-line What/Why/How template as everything else in this
      section: a spread is not exempt from the "every line of code
      gets a comment" rule just because it has no property name of its
      own to hang a `What:` label off of.
  - **Amends the "reorder the long outlier(s) to the end" refinement
    above**: once alphabetical order is established, the long/short
    split still happens exactly as described there, but the two
    groups no longer sit flush together: leave exactly 1 blank line
    between the last short property and the first long one, the same
    "somewhat related, different kind of thing" gap already used
    elsewhere for a comparable shift in what a block of lines is doing.
    Each group stays internally alphabetical (the short group already
    is, from the base rule above; when 2+ properties both qualify as
    "long," they're alphabetized against each other too, not left in
    whatever order they happened to fall in before the split).
- Every multi-line object's properties get their `:` column-aligned:
  pad each property name (left-justify) to the width of the longest name
  in that specific object, same computation used for `style` objects and
  named imports elsewhere in this doc. This applies per-object: a nested
  object's own alignment is computed independently from its parent's.
  - **This only applies within a tightly-grouped run of properties (0
    blank lines between them)**, the same "run" concept used for
    consecutive `const`/`let` declarations elsewhere in this doc.
    Properties separated by a blank line (the normal case for a
    multi-line property, per the 1-blank/2-blank padding rule above)
    are NOT forced to align with each other across that gap; each such
    property's own `:` just gets its ordinary single space, no padding,
    even when every property involved is plainly a field of the same
    record. E.g. `emlTouObj`'s own `get`/`set`/`subscribe` properties in
    `state/tour-bus.ts` sit 1 blank line apart from each other and don't
    align with each other, and a help-catalog item's own `id`/`sel`/
    `title` in `help/content.tsx` do NOT pad to match a blank-separated
    `body` below them, even though all 4 are fields of the same item.
    - **Known blind spot**: this is easy to get backwards specifically
      when the blank-separated properties are themselves EACH a
      multi-line object (not a short scalar), since two same-shaped
      nested objects sitting right next to each other can look like
      they "obviously" belong in one aligned table even though a blank
      line already separates them the same as any other multi-line
      property. `onboarding/reminder-tours.tsx`'s own `VAR_COP_OBJ` was
      found live padding its own `once`/`recurring` keys out to match
      each other's width (`once      : {` / `recurring : {`), even
      though each is its own multi-line entry separated by a blank line
      from the other, exactly the case this rule already rules out;
      fixed to a plain single space on each (`once : {` /
      `recurring : {`). When auditing a file for this rule, explicitly
      check every blank-separated run of same-shaped nested multi-line
      objects/entries, not just runs of short scalar properties, since
      the visual "these clearly form a table" instinct applies just as
      strongly (and just as wrongly) to those.
- A one-line array literal (including a destructuring array binding like
  `const [ indRecObj, setIndRecObj ] = React.useState( null );`) gets a
  space directly after `[` and directly before `]` when it has at least one
  element. An empty array (`[]`, e.g. an empty `useEffect`/`useCallback`
  dependency list) stays tight, no space either side.
- Every object literal gets a space between each property name and its
  `:` (`id : 'today'`, not `id: 'today'`); this applies universally to
  every object literal in the file, not just one array of config objects.
- When several structurally-similar object literals (or JSX conditional
  branches) are stacked as adjacent lines, column-align their matching
  parts too, e.g. every entry's closing `}` in a config array, or the
  `&&`/tag-name padding across parallel `{x === 'a' && <TabA .../>}`
  branches, computed from the longest entry's needed width.
  - **A stack of adjacent one-line object literals** (each entry small
    enough to stay on its own single line rather than needing the
    "2+ properties" multi-line split below) gets this treatment applied
    property-by-property, left to right: pad each property's own
    `value,` (or `value` with no comma, for whichever property sits last
    in a given row) so the NEXT property starts at the same column
    across every row, computed from the widest row at that position,
    the same mechanism as column-aligning a run of plain object
    properties elsewhere in this doc, just applied across sibling ROWS
    instead of down one object's own properties. This still applies even
    when the rows don't all share the exact same property set, e.g. one
    entry ends after 3 properties while its neighbors carry a 4th, each
    with a genuinely different name (`daysOfWeek` on one row, `interval`
    on the next). Align by POSITION in that case too, treating whatever
    sits in a given slot as that slot's own column regardless of whether
    the property name matches its neighbors': the goal is a clean visual
    table, not literally aligning identical keys. Finally, pad the
    closing `}` itself to a shared column the same way, so shorter rows
    get trailing spaces before their own `}`/`},`. See
    `help/sample-data.ts`'s own `TAS_SAM_ARR` for the reference example,
    where `id`/`name`/`repeat` line up across all 5 entries and each
    entry's own differently-named 4th field (`daysOfWeek`/`interval`/
    `dayOfMonth`/`day`+`month`) still lines up by position, closing `}`
    included.
    Aligning the closing `}` this way also lines up every row's own
    trailing comment for free, since each row's code then ends at the
    same column; the last row, which has no trailing comma, gets one
    space in its place (`}  //` instead of `}, //`) so its comment still
    lands in that same column. See `tab-data.tsx`'s own `SEC_SOR_ARR` and
    `conditionals-manager.tsx`'s own `CIS_OPT_ARR` for further examples.
    - **An entry of a different shape moves to the start or end of the
      stack**, whichever reads more naturally, when the array's order
      doesn't matter: a ternary choosing between two objects, a bare
      identifier, a function call, or anything else that isn't one of
      the plain one-line object rows. Left in the middle, it forces every
      row's comment out to its own width; at either end it sits 1 blank
      line apart from the rows (the same gap a long outlier property
      gets), so the plain rows form their own run and line up naturally
      among themselves, while its own comment sits one space after it.
      When the order DOES matter (e.g. the entries render left to right),
      pull the odd entry out into its own named `const` declared just
      above the array instead, and leave that short identifier in its
      real position; it no longer widens the comment column. See
      `tab-stats.tsx`'s own `freSpeObj`/`metPilArr`.
    - **Exception, stop aligning before a long/paragraph-length
      property.** Once a row's own value for a given property is
      genuinely prose-length (a sentence or more, varying wildly in
      length row to row, as opposed to a short string/number that just
      happens to differ a little), padding every shorter row's closing
      `}` out to match the single longest one would mean tens or
      hundreds of meaningless trailing spaces, which hurts readability
      instead of helping it. Align every property up through the last
      one whose values stay short across every row, then leave that
      long property and the closing `}` completely unaligned/natural,
      each row ending wherever its own value happens to end. See
      `help/mode.tsx`'s own `NAV_TAB_ARR` (`icoStr`/`labStr`/`desStr`,
      the `NAV_HEL_OBJ` tip's own tab-description catalog): `icoStr`
      and `labStr` line up across all 5 rows, but
      `desStr` (a full sentence or more per row) and the closing `}`
      after it are left natural.
- An object literal with 2+ properties gets split to one property per line
  (even if it would otherwise still fit on one line character-count-wise)
  whenever at least one property's value is a non-trivial expression
  (contains a binary operator like `+`/`-`/`*`/`/`, or is otherwise more
  than a bare literal/identifier/single property-access; decided
  2026-10-06, a non-null `!` on one of those, `curEntObj.itemId!`, doesn't
  make it non-trivial, since it computes nothing). A simple
  config-style object whose values are plain literals only (e.g.
  `TAB_OBJ_ARR`'s entries) stays on one line even with several properties,
  since there's nothing to visually untangle. Even when it's really just
  one call argument wrapped for readability (as opposed to a genuine
  multi-entry container like `TAB_OBJ_ARR`), it STILL gets the usual
  2-blank-line padding after `{`/before `}`, same as any other multi-line
  object literal, no exception for the call-argument case; but its last
  property still does NOT get a trailing comma. Combined with the
  tight-`({`/`})` exception from the Parentheses spacing section below
  (a call whose sole argument is this kind of object skips the paren's own
  inner space):
  ```
  setIndRecObj({


  	heiNum : butRecObj.height,
  	lefNum : butRecObj.left - navRecObj.left + navCurEle.scrollLeft,
  	topNum : butRecObj.top - navRecObj.top + navCurEle.scrollTop,
  	widNum : butRecObj.width


  });
  ```
- **Exception to the exception: an exported namespace object always goes
  multi-line at 2+ properties, even though its own values are always bare
  identifiers** (the explicit `originalName : internalName` mapping this
  same doc's own Naming Conventions section requires) and would otherwise
  qualify as the "simple config-style object" case just above. This
  object is a file's whole public API surface, likely to grow over time
  and worth keeping easy to scan/diff one property at a time, unlike a
  genuine fixed-shape config entry like `TAB_OBJ_ARR`'s own rows. See
  `CAD_NAM_OBJ` (`cadence.ts`), `CON_NAM_OBJ` (`conditionals.ts`),
  `TAS_NAM_OBJ` (`tasks.ts`), `STORAGE` (`storage.ts`), `NOT_NAM_OBJ`
  (`notify.ts`), and `PICKERS` (`pickers.ts`) for the reference examples:
  each property still gets its own specific What/Why/How comment (never
  one shared comment covering the whole object) and both its own
  property-name column (aligning the `:`) AND its own internal-name
  value column are padded to line up, the same two-column alignment
  `holidays.ts`'s own `HOL_NAM_OBJ` already used (there coincidentally
  invisible since every property name equals its own value verbatim):
  pad the value column (plus its trailing comma, absent only on the
  last entry) to the width of the longest value in the object, the same
  computation used for the property-name column itself.

### TypeScript annotations
Decided 2026-10-05, for the TypeScript migration.
- **A type annotation's colon takes a space on both sides**, the same as
  an object literal's: `( yeaValNum : number )`, `const curIteObj :
  IteRcdTyp = ...`, an optional field `labStr? : string`, and a return type
  `) : number =>`.
- **Return types are explicit where a JSDoc is**: every exported function,
  component, and hook declares its return type, so its contract is written
  in its signature and an accidental change is caught. Any other function
  lets TypeScript infer it, the accepted default.
- **Angle brackets take inner spaces**, the same as parentheses:
  `React.useState< number >( 0 )`, `Map< string, IteRcdTyp >`, `Array<
  EscEntTyp >`. Next to a name they can't be misread as comparisons, and
  the spacing reads more easily. Empty brackets don't occur.
- **JSDoc doesn't restate types**: `@param` and `@returns` keep their
  descriptions as they are, with no `{number}`-style type, since the
  signature already declares it.
- **Assertions say why** (decided 2026-10-05): where the code guarantees
  something TypeScript can't see, a value that can't be null at that point
  takes the postfix non-null `!` (`picMapObj.get( picIdeStr )!`), and a
  value whose type is wider than the code allows takes `as <Type>` (an
  event target read `as Element`, an `Object.entries` key read `as
  ModNamTyp`). Either way, the line's own comment gains a merged note
  after its What/Why/How saying what guarantees it (`// What: Non-Null
  Note. Why: ... How: ...`). A real runtime guard is added only where the
  value genuinely can be missing.
  - **One label per kind** (decided 2026-10-06): the note is always
    labelled `Non-Null Note` for a `!` and `Type Assertion Note` for an
    `as`, never a custom label (`Event Target Note`) and never an
    explanation folded into the line's own `How:`, so a single search finds
    every assertion and what guarantees it. A line holding both kinds gets
    one note of each. On a multi-line construct, the note merges onto the
    line carrying the construct's own comment.
- **Checks that don't narrow use a shared type guard** (decided
  2026-10-05): when a built-in check proves a type without TypeScript
  knowing it (`Number.isInteger( x )` says nothing about `x`'s type), the
  check goes through a small type-guard helper in `utils/` instead (e.g.
  `isaIntFun( valAny : unknown ) : valAny is number`), which keeps the
  same runtime result and lets TypeScript narrow. The same goes for
  `.filter( Boolean )`, which drops nulls without TypeScript seeing it:
  it filters through `isaTruFun` instead (`utils/guard.ts` in
  ease-my-life), which runs `Boolean` and declares a passing value
  non-null.

### Parentheses spacing (declarations, calls, control-flow)
- A non-empty parenthesized list gets a space directly after `(` and
  directly before `)`; this covers a function/arrow declaration's own
  parameter list, a function/method call's own arguments, AND an
  `if`/`else if`/`while` condition alike (`if ( !navCurEle ) return;`,
  `resObsObj.observe( navCurEle );`, `function TabBarCom ( { ... } ) {`).
- An EMPTY parenthesized list stays tight instead: a zero-argument call
  (`foo()`), a zero-parameter arrow (`() => ...`), an empty dependency
  array's enclosing call, no space inserted either side.
- **A space before the `(` marks a declaration, never a call** (decided
  2026-10-04): a function declaration's name (or the `function` keyword
  itself, when it has no name) is followed by one space before its
  parameter list, whether the function is bare or stored somewhere
  (`function TabBarCom ( { ... } ) {`, `function AppRooCom () {`,
  `React.memo( function Name ( ... ) {`, `const fooFun =
  function ( ... ) {`). A call never takes that space: `togDayFun(
  dayIndNum )`, `redMotFun()`. An arrow function has no name or keyword
  directly before its `(`, so nothing changes for it.
- Ternary/grouping parens used purely for operator precedence (not a call,
  a declaration, or a control-flow condition) are NOT covered by this rule
  and stay exactly as written.
- **Exception**: a call whose sole argument is a multi-line object literal
  (where the `(` is followed immediately by `{` with nothing else on
  that line, and (on the matching closing line) `}` is followed
  immediately by `)` with nothing else before it) skips the space on
  that side. The object literal's own opening/closing braces already mark
  the boundary clearly, so the paren adds no useful separation there:
  ```
  setIndRecObj({


  	heiNum : butRecObj.height,
  	lefNum : butRecObj.left - navRecObj.left + navCurEle.scrollLeft,
  	topNum : butRecObj.top - navRecObj.top + navCurEle.scrollTop,
  	widNum : butRecObj.width


  });
  ```
  This is narrow: it's specifically about `(`/`{` and `}`/`)` landing
  directly adjacent at a line boundary. A call whose argument is anything
  else (an arrow function, a ternary, multiple arguments, ...) still
  follows the normal spacing rule above.

### Functions
This means ANY function that isn't a one-line declaration: named
functions, arrow functions, and inline callbacks passed to hooks like
`useEffect`/`useState`'s lazy initializer/`useCallback`/`useMemo`, no matter
how short the body is.
- Directly after the opening `{` (or the opening `(` for an implicit-return
  arrow like `() => ( expr )`, which counts as a function body too) insert
  2 blank lines before the first line inside. Directly before the closing
  `}`/`)`, insert 2 blank lines after the last line inside.
- A function that fits entirely on one line AND has only a single
  statement inside (e.g.
  `const onDarChaFun = ( chaEveObj ) => setSysDarBoo( chaEveObj.matches );`,
  or a one-line cleanup `return () => { resObsObj.disconnect(); };`) is
  exempt; there's nothing to pad. See "Multi-statement one-line blocks"
  below for what happens once there's more than one statement.

### Multi-statement one-line blocks
- A one-line block that requires 2 or more semicolon-separated statements
  crammed together (e.g. a cleanup function running two unrelated
  teardown calls) must be broken into a real multi-line block instead,
  even if it's a `return`ed arrow function and would otherwise qualify
  for the "Functions" one-liner exemption above. Space the resulting
  statements using the normal relatedness tiering (see "General
  relatedness tiering" below), and pad the block like any other
  multi-line function body (2 blank lines after `{`, 2 before `}`):
  ```
  return () => {

  	if ( resObsObj ) resObsObj.disconnect();

  	window.removeEventListener( 'resize', meaPosFun );

  };
  ```
- **Exception**: a guard-clause block whose second (and final) statement
  is a bare `return;` stays exempt and compact on one line regardless,
  e.g. `if ( !butActEle ) { setIndRecObj( null ); return; }`. Any other
  combination of 2+ statements (including two calls with no `return` at
  all, like two sibling `clearTimeout(...)` calls) follows the rule above
  instead.

### if/else, while, and for statements
- **This section covers `for` loops identically to `if`/`while`**: every
  rule below (multi-line body padding, and the gap before the statement
  itself, governed by "### General relatedness tiering" below the same
  way it governs the gap before an `if`/`while`) applies to a `for` loop
  with no special-casing. A `for` loop immediately following a plain
  declaration it reads from (e.g. `const iteFlaMap = new Map(); ... for
  ( const logRowObj of picLogArr ) {`) is the ordinary "Somewhat related"
  (2 blank lines) declare-then-block case, the same as a declaration
  immediately followed by an `if` block would be, not the "Related" (1
  blank line) tier a plain declaration run gets from "### Variable
  declarations" above.
- Same padding as functions (2 blank lines after the opening `{` and 2
  before the closing `}`), but only when the block actually spans multiple
  lines. A one-line body with a single statement (`if ( !navCurEle )
  return;`), or the guard-clause-ending-in-`return` exception from
  "Multi-statement one-line blocks" above (`if ( !butActEle ) {
  setIndRecObj( null ); return; }`), is exempt and stays exactly as
  compact as it already is.
- A `const`/`let` declaration immediately followed by a single-line guard
  clause that checks that SAME variable and exits (`return`/`continue`/
  `break`), e.g.
  `const prePlaStr = prePlaRef.current; if ( prePlaStr === tabPlaStr ) return;`,
  gets exactly 2 blank lines between the two lines: this is the ordinary
  "Somewhat related" tier from "### General relatedness tiering" below
  (a plain declaration followed by a different KIND of construct
  operating on that same data), not the tighter 1-blank tier a run of
  same-kind plain declarations would get. The guard's own blank-line
  treatment AFTER it needs no separate rule here at all: it's already
  fully governed by the single-line-exit-guard rule under "### Return
  and continue statements" below (always 3 blank lines after, regardless
  of what precedes it). There is no separate "isolated pair" concept
  requiring its own symmetric before/after spacing: a second, unrelated
  `declare + guard` pair checking a completely different condition
  immediately after the first one still naturally lands 3 blank lines
  away, simply because that gap IS the first guard's own mandatory
  3-blank-after, not a rule of its own.
- A multi-line `if`/`else if`/`else` chain puts each `else if`/`else` on
  its OWN line, never cuddled onto the previous block's closing `}` (no
  `} else {`), with exactly 1 blank line between that closing `}` and
  the next `else if`/`else` keyword. This is the same "related" (1 blank
  line) tiering already used for mutually-exclusive branches elsewhere in
  this doc, just made explicit for statement-level if/else chains: each
  branch of one conditional is inherently related to its siblings. Each
  branch's own body still gets the standard 2-blank-line padding from the
  bullet above when it spans multiple lines:
  ```
  if ( exaConBoo === true ) {


  	example code;


  }

  else if ( exaConBoo === false ) {


  	example code;


  }

  else {


  	example code;


  }
  ```
- **This applies just as strictly to a compact, brace-free single-statement
  chain**: `if`/`else if`/`else` are NEVER allowed to share a physical
  line with each other, even when every branch is short enough to stay a
  single statement with no `{ }` block at all. A branch that's genuinely
  just one statement still doesn't need its own braces (per "###
  Multi-statement one-line blocks" above), but the `if`/`else if`/`else`
  keyword itself always starts a fresh line, with exactly 1 blank line
  before it, the same spacing as the braced case:
  ```
  if ( bottom - canTopNum > 0 ) top = canTopNum;

  else bottom = Math.min( bottom, chrIteObj.recObj.top );
  ```
  not `if ( bottom - canTopNum > 0 ) top = canTopNum; else bottom =
  Math.min( bottom, chrIteObj.recObj.top );` all on one line. Reason: an
  `else` sharing a line with its own `if` is easy to miss entirely on a
  skim, especially once the line has grown long with a real condition and
  two real statements. When a comment on the original one-line form
  covered both branches together, split it into 2 separate comments (one
  per branch) the normal way a multi-line split gets commented, rather
  than leaving one branch uncommented. This also forces open anything
  that was relying on the whole `if`/`else` being a single compact
  statement to qualify as a one-line function/loop body (see "###
  Functions" and this section's own "declare + guard" bullet above);
  once it's genuinely 2 lines, the enclosing block follows its own normal
  multi-line padding rules like any other multi-statement body.
- **Multiple standalone `if` blocks are NOT the same thing as an `if`/
  `else if`/`else` chain, even when they check different values of the
  exact same variable and share an identical shape.** The 1-blank "each
  branch is inherently related to its siblings" reasoning above is
  specific to a real chain, where the branches are literally one
  conditional construct and mutually exclusive by construction. A run of
  separate `if ( cond ) { ... }` statements with no `else` tying them
  together (most commonly an early-return dispatch on different values
  of one variable, e.g. `if ( pagIdeStr === 'explore_pickers' ) { ...
  return [...]; }` followed later by its own separate `if ( pagIdeStr
  === 'explore_stats' ) { ... return [...]; }`) are genuinely
  independent statements that only happen to look parallel, the exact
  "looks structurally parallel but isn't really related" case "###
  General relatedness tiering" below already warns about. These get 3
  blank lines between them, the "Unrelated" tier, the same as any other
  pair of independent statements. See `buiTesFun`'s own 4 standalone
  `if ( pagIdeStr === '...' )` branch checks (Pickers/Stats/Data/
  Settings) for the reference example: each one is its own complete,
  self-contained early return, not a shared conditional, so 3 blank
  lines separate each one from the next.
- **A different, separate rule from the one above: once a complete `if`/
  `else if`/`else` construct finishes (a single standalone `if` with no
  `else` at all, or a full chain) the very next line of code always
  gets 3 blank lines before it, unconditionally, no matter what that
  next line actually is** (another separate, unrelated `if`, a plain
  statement, a function call, ...) **and no matter whether the
  construct's own branch(es) were written compact/single-line or as a
  full multi-line block.** This is the same "a genuinely separate
  decision, always 3 apart" reasoning `try`/`catch` statements already
  get under "### try/catch statements" below, applied to if/else-if/else
  constructs instead: by the time every branch of one conditional
  decision has already been resolved, whatever comes next is a fresh
  topic, never a continuation of the branch(es) that just closed, so it
  can never collapse to the tighter 1-or-2-blank tiers a plain
  relatedness guess might otherwise assign just because it sits right
  next to the construct or touches similar-looking data. This stacks
  with the bullet above rather than replacing it: that one is about
  several independent `if`s specifically sitting next to EACH OTHER;
  this one is about the boundary right after ANY if/else-if/else
  construct ends, whatever comes after it. See `cloTouFun`'s own cleanup
  dispatch for the reference example (`onboarding/page-tours.tsx`): its
  `if ( neeCopFun( pagIdeStr ) ) ... else if ( pagIdeStr ===
  'explore_stats' ) ...` chain is followed by a separate, standalone
  `if ( pagIdeStr === 'explore_data' ) cleTasFun( actStoObj );`, which is
  in turn followed by `actStoObj.setCarFun(...)`, despite every
  line here being a single-line statement, not a braced block, both
  transitions (chain → standalone `if`, and standalone `if` → the
  `setCarFun` call after it) get 3 blank lines, not the 1 a quick
  glance at their shared `pagIdeStr`/cleanup theme might suggest.

### Multi-line ternary expressions
A multi-line ternary expression that isn't a JSX wrapper (the
`{ cond ? ( ... ) : ( ... ) }` shape keeps its own existing rule under
"### JSX") has no blank lines anywhere inside it, since it's one
statement. The condition stays on the opening line with its own
comment; each branch sits on its own line one tab deeper, starting with
`?` or `:`, with its own trailing comment. A nested ternary chain
follows the same shape, every `?`/`:` on its own line. The `?`/`:`
branch lines are a tightly-grouped run, so their comments are
column-aligned with each other (the opening line keeps its own single
space), with the same exception as any other run: skip the alignment
when the longest branch's code is more than 100 characters longer than
the shortest's. An object literal sitting directly in a `?`/`:` branch
stays on that branch's one line even when its values are non-trivial,
an exemption from the "2+ properties with a non-trivial value go
multi-line" rule under "### Arrays and objects" (decided 2026-09-27), so
the ternary still reads as one unit; e.g. `store.ts`'s own `togDonFun`
live-row toggle. See
`ui/conditional-controls.tsx`'s own `sooSubStr`/`latSubStr` for the reference
example:
```
const sooSubStr = isaDowBoo // What: ...
	? `stays triggered ...` // What: ...
	: `... until it can trigger`; // What: ...
```

### try/catch statements
Treated the same as an `if`/`else` chain in every respect: `catch` (and
`finally`, by the same logic) goes on its OWN line, never cuddled onto
the `try` block's own closing `}` (no `} catch (errCatObj) {`), with exactly 1
blank line between that closing `}` and the `catch` keyword. Each
block's own body still gets the standard 2-blank-line padding from
"if/else and while statements" above when it spans multiple lines.
- **One-line vs. multi-line body follows "### Multi-statement one-line
  blocks" above, exactly like an `if`/`while` body does**: a `try` or
  `catch` block whose body is a single statement may stay compact on one
  line (e.g. `catch ( errCatObj ) { return null; }`); the moment its body needs 2
  or more statements, it must become a real multi-line block instead,
  padded like any other (2 blank lines after `{`, 2 before `}`), with
  the same guard-clause-ending-in-`return` exception staying compact
  regardless (e.g. `catch ( errCatObj ) { setErrBoo( true ); return; }`). This is
  independent of the "own line" rule above: `catch` never shares a
  physical line with `try`'s own closing `}` (no `} catch (errCatObj) {}`)
  regardless of whether either block's own body is compact or
  multi-line: a compact `try { ... }` is still followed by `catch` on
  its own fresh line below, per the reference examples throughout
  storage.ts (e.g. `ownKeyFun`).
- **One `try`/`catch` statement is always separated from the next `try`/
  `catch` statement by 3 blank lines (the "unrelated" tier), regardless
  of what the general relatedness tiering would otherwise assign.** Two
  separate try/catch statements are always genuinely distinct pieces of
  error-handling behavior, even when they sit right next to each other
  doing conceptually similar things (e.g. two independent cleanup calls
  in the same click handler, or a service-worker attempt immediately
  followed by its own page-level fallback attempt): each one's own catch
  handles a DIFFERENT failure mode for a DIFFERENT operation, so they
  never collapse to a lower tier the way, say, two sibling `useState`
  calls might. This applies whether the try/catch pair involved is
  compact or fully multi-line, and stacks with (doesn't replace) the
  normal blank-line rule between a `try`'s own closing `}`/compact line
  and its OWN `catch` (still 1 blank line, per the intro above); the
  3-blank rule is specifically about the gap AFTER one statement's own
  `catch` and BEFORE the next statement's own `try`. See `genNotFun` in
  `notify.ts` for the reference example: its service-worker attempt's
  `catch` and the page-level fallback's own `try` get 3 blank lines
  between them, and so do the `window.focus()`/`pagNotObj.close()`
  cleanup pair inside that fallback's own click handler.
- **A catch binding exists only when it's read** (decided 2026-10-06): a
  `catch` that guards an expected fallback (private-mode storage, an old
  browser API, a feature check) and never reads its error drops the
  binding entirely (`catch { return null; }`), so lint has nothing unused
  to report. A `catch` that guards a real failure (a storage write or read,
  a save, a wipe, an import) logs it with `console.warn( errCatObj );` as
  its first statement, so the failure stays visible to anyone debugging
  without filling the console during normal use.
- **A complete `try`/`catch` (or `try`/`catch`/`finally`) statement always
  gets 3 blank lines before its own `try` AND 3 blank lines after its own
  final block**, whatever sits on the other side of either gap (a
  declaration, a call, another `try`, ...), the same "a genuinely
  separate construct, always 3 apart" treatment a finished
  if/else-if/else construct gets. The intro's own "treated the same as an
  if/else chain in every respect" already implied the after-gap, but both
  gaps are stated explicitly here so neither has to be inferred.
  - **Exception, the enclosing block's own open/close padding wins**: a
    `try` that is the very first thing inside its own enclosing `{`/`(`
    gets that block's normal 2 blank lines before it instead, and a
    try/catch/finally that is the very last thing before its own
    enclosing block's closing `}`/`)` gets that block's normal 2 blank
    lines after it instead, exactly like every other construct in this
    doc. See `store.ts`'s own `reset` action for the reference example:
    its first `try` opens the action's own body (2 blank lines before
    it), while its second `try` follows ordinary code (3 blank lines
    before it), and both get 3 blank lines before whatever follows them.
```
try {


	example code;


}

catch ( errCatObj ) {


	example code;


}
```

### do/while statements
Treated the same as an `if`/`else` chain and a `try`/`catch` statement in
one specific respect: `while` goes on its OWN line, never cuddled onto
the `do` block's own closing `}` (no `} while ( cond );`), with exactly 1
blank line between that closing `}` and the `while` keyword, regardless
of whether the `do` block's own body is compact or multi-line. The
block's own body still gets the standard 2-blank-line padding from
"if/else and while statements" above when it spans multiple lines.
- **One-line vs. multi-line body follows "### Multi-statement one-line
  blocks" above, exactly like an `if`/`while`/`try`/`catch` body does**:
  a `do` block whose body is a single statement may stay compact on one
  line (e.g. `do { tosIteObj = itePooArr[ ... ]; }`); the moment its body
  needs 2 or more statements, it must become a real multi-line block
  instead, padded like any other (2 blank lines after `{`, 2 before `}`).
  This is independent of the "own line" rule above: `while` never shares
  a physical line with `do`'s own closing `}`, even when the block's own
  body stays compact: a compact `do { ... }` is still followed by
  `while ( cond );` on its own fresh line below, per `picLogFun`'s own
  toss-draw loop in `seed.ts` (the reference example this rule was
  written from).
```
do {


	example code;


}

while ( condition );
```

### Return and continue statements
- **This section's own blank-line counts (3 before a standalone
  return/continue, 3 after a single-line exit guard, 2 before an
  immediately-following enclosing close) always win over any OTHER
  rule elsewhere in this doc that would otherwise prescribe a
  different count for the same gap** (e.g. the "Long boolean
  expressions" section's own fixed "2 blanks after the final combining
  boolean"), since a return/continue is always a hard control-flow
  boundary regardless of what else is going on around it. The ONLY
  thing that overrides this section's own count instead: a
  return/continue/guard sitting immediately next to its own enclosing
  block's opening or closing bracket always gets that block's fixed
  2-blank open/close padding, the same "first/last entry" exception
  every other multi-line construct in this doc already gets, nothing
  unique to returns. E.g. a return that is literally the first
  statement inside a function body gets 2 blanks after the opening
  `{`, not this section's own usual 3-before.
- A `return` that occupies its own line (not a `return;`/`return x;` fused
  into a compact one-line guard clause like `if (!x) return;`) always gets
  3 blank lines directly before it, regardless of whether the returned
  value itself is one line or many. This is the one case where "3" shows up
  inside a function body, not just between top-level declarations.
- If the enclosing function/block's own closing brace comes right after the
  return statement, put 2 blank lines between the return's own close and
  that enclosing `}`.
- A multi-line/parenthesized return (most commonly a JSX return,
  `return (\n  <div>...</div>\n);`) additionally follows the function
  padding rule for its own content: 2 blank lines after the opening `(` and
  2 before the closing `)`.
- **A `return` that returns JSX directly (`return ( <div>...</div> );`)
  needs no comment of its own**: the JSDoc's own `@returns` already
  documents what the function returns, and every element inside the JSX
  already gets its own comment, so a comment on the bare `return (` line
  itself would just repeat one or the other. This is NOT the same as a
  `return` that calls a real function, passing the JSX as one of its
  arguments (`return createPortal( <div>...</div>, document.body );`):
  that line is a genuine function call with its own behavior/arguments
  worth explaining (why THIS function, why these arguments), not merely
  "returning JSX", so it still gets a normal trailing/attached comment
  like any other multi-line construct. See `HelOveCom`'s own `return
  createPortal(` in `help/mode.tsx` for the reference example.
- A single-line exit guard (`if (!btn) { setInd(null); return; }`, or the
  fused one-liner form `if (cond) return;`) skips the standalone "3
  before" rule ONLY when it is the guard half of the "declare a value,
  then immediately guard-check that same value" pair documented under
  "### if/else, while, and for statements" above: that pair's own guard
  gets exactly 2 blank lines before it instead, per that pair's own
  dedicated rule, since its condition operates directly on the value the
  line right above it just declared.
- **Every other single-line exit guard gets the full 3 blank lines
  before it too, unconditionally, exactly like a standalone return/
  continue statement.** General relatedness tiering is never consulted
  to judge this "before" gap by degree: a single-line exit guard is
  still a hard control-flow boundary regardless of how compactly it's
  written, so whatever precedes it (when it isn't the one declared value
  the guard itself is checking) can never be "related" to it in the
  tiering sense, no matter how topically close it looks. This is most
  commonly seen on a standalone fallback guard sitting right after some
  other, unrelated `if` block's own closing `}`, e.g. `buiTesFun`'s own
  per-branch fallback guards (`if ( pagIdeStr !== 'explore_today' )
  return [];` immediately below the Settings tour's own `if` block's
  closing `}`) get 3 blank lines on both sides, since the guard's own
  condition has nothing to do with whichever branch happened to close
  right above it.
- **`continue` (inside a loop) follows this exact same treatment as
  `return`, with no exceptions beyond the ones already listed above**: a
  `continue;` that occupies its own line always gets 3 blank lines
  directly before it, 2 blank lines between it and the loop/if-block's
  own closing `}` when that `}` comes right after it, and a single-line
  early guard fused onto one line (`if ( conCurObj.active === false )
  continue;`) follows the same "3 before, unless it's the declare +
  guard pair's own guard half" rule as a fused early-return guard.
  `continue` never takes a value, so the multi-line/parenthesized-return
  bullet has no equivalent case for it.
- **A single-line exit guard always gets 3 blank lines AFTER it too.**
  `if (cond) return;`, `if (cond) return <value>;` (a guard that returns
  an actual value, e.g. a fallback/placeholder, rather than a bare
  `return;`), `if (cond) continue;`, and `if (cond) break;` each hand
  control out of the enclosing function/loop the moment they fire, the
  same hard control-flow boundary a standalone `return`/`continue`
  already gets 3 blank lines for, just written compactly on one line
  instead of its own block. Whatever code follows such a guard only ever
  runs once every one of those exits has already been ruled out, so it
  is never "related" to the guard in the ordinary tiering sense,
  regardless of what it actually does next; this overrides whatever the
  General relatedness tiering below would otherwise assign. Example:
  `if ( logRowObj.date !== dayKeyStr || logRowObj.pickerId !==
  picIdeStr ) continue;` in `day-log.tsx`'s own `dayFlaFun` gets 3 blank
  lines before the next line, not the 1 an ordinary relatedness guess
  might otherwise assign just because neighboring lines touch the same
  data.

### JSX
- No space after `<`/`</` or before `>`/`/>` on any element, including a
  one-line element with exactly one attribute: `<span>`, `</span>`,
  `<span className='brand-name'>`, `<img src='x' />` all stay tight. (An
  earlier version of this doc required a space before a one-attribute
  element's closing `>` specifically; dropped as stale/superseded once
  app.tsx's own actual practice (confirmed never applying it, including
  at the exact element the old rule used as its own example) showed it
  wasn't really the intended convention.)
- Every JSX expression container (an attribute value (`ref={navEleRef}`)
  or a JSX child expression (`{actIdeStr === 'today' && ...}`)) gets a
  space directly after its `{` and directly before its `}`:
  `ref={ navEleRef }`, `{ actIdeStr === 'today' && ... }`. This extends to
  `${...}` template-literal interpolations too: `` `tab--${tabPlaStr}` ``
  → `` `tab--${ tabPlaStr }` ``.
  - **Exception**: when the container's content is itself an object
    literal (the double-brace case, e.g. `style={{ stroke : '...' }}`),
    don't add a second, separate space on top of the object literal's own
    spacing: `{{`/`}}` stays tight exactly as it already reads.
  - **Exception**: when a JSX child expression's closing `}` is directly
    preceded by more than one other closing bracket from nested
    calls/arrows (e.g. `.map((x) => (<Foo />))`'s trailing `))}`), those
    closing brackets stay tight against each other and against the `}`;
    don't force a space between each one just because they're stacked:
    `{ TAB_OBJ_ARR.map( ( tabConObj ) => (\n\t...\n))}`, not
    `( ... ) )}`.
- Treat a JSX element that has actual children spanning multiple lines the
  same as a function/array/object: 2 blank lines directly after its opening
  tag and 2 directly before its closing tag. This includes a
  `{ condition && (\n  <Foo />\n) }` multi-line conditional wrapper: the
  `(` and `)` count as an opening/closing pair too.
  - Exception: a self-closing element whose only multi-line aspect is its
    own wrapped attributes (no children at all, e.g.
    `<button\n\tclassName='x'\n\tonClick={...}\n>`) needs no padding
    between its attribute lines; there's no "inside" to pad.
  - Exception, an element holding only text (decided 2026-10-07): a
    paragraph, heading, label, or button whose children are just text,
    with any inline phrasing elements inside it (`<br />`, `<em>`, a
    `<span>` within the run), needs no padding, however many lines the
    text wraps across or whether its opening tag spans several lines.
    Padding applies once a child is a structural element on its own line.
- **JSX sibling spacing is set by nesting depth alone.** Rewritten
  2026-09-26 and applied during the final file-by-file pass; it replaces
  the earlier approach of borrowing the JS relatedness tiers for JSX
  siblings (and the old "a heading always gets 3 blank lines before it"
  rule). Every JSX sibling gets at least 1 blank line before and after it,
  and only these conditions raise that:
  - **2 blank lines** when one of its block-level children itself contains
    at least one element (e.g. a `<div>` holding a `<ul>` of `<li>`s).
  - **3 blank lines** when one of those block-level children in turn
    contains a block-level element that has elements inside it (e.g. a
    `<section>` holding a `<div>` holding a `<ul>` of `<li>`s). 3 is the
    maximum, however deep the nesting goes, the same as the JS tiers.
  - **Every custom component** (`<ColDisCom>`, `<CarSurCom>`, ...) gets 3
    blank lines before and after it, self-closing or not, since what it
    renders can't be seen from the call site and frequently holds many
    elements. Exception: a component sitting inline, among text or inline
    elements (e.g. an `<IcoSvgCom />` next to a button's label), is part
    of that inline run instead (see the display exemption below).
  - **Block-level** means the HTML block-level elements (`div`, `section`,
    `header`, `footer`, `main`, `nav`, `article`, `aside`, `form`,
    `fieldset`, `ul`, `ol`, `li`, `p`, `h1`-`h6`, `table`, `details`,
    `dialog`, `figure`, `blockquote`, `pre`, ...) plus `<svg>`, which
    counts as block-level here because it usually holds many elements.
    Inline elements (`span`, `i`, `b`, `strong`, `em`, `a`, `label`,
    `input`, `select`, `img`, ...) never count. A `<button>` counts as
    block-level only when its own content is genuinely structured (it
    holds block-level elements, or elements that themselves hold
    elements); a button holding just text, or an icon plus text, doesn't.
  - **When two neighbors call for different counts, the bigger count
    wins** for the gap between them.
  - **A `{ cond && ( ... ) }` or `.map( ... )` wrapper** holding a
    qualifying element takes that element's count, as a whole, among its
    own siblings.
  - **Exception, first or last in its parent**: the parent's own 2-blank
    open/close padding wins over this rule, exactly like every other block
    in this doc.
  - **Exception, anything where whitespace affects what's displayed**: no
    spacing or line-break rule in this doc ever applies where adding or
    removing a blank line or line break would change the rendered output.
    Most commonly that's an inline run: text mixed with inline elements
    or inline components on one line (JSX drops whitespace that contains
    a line break, so splitting `Tap <strong>Save</strong> to finish` across
    lines would lose the spaces around `Save`), plus anything relying on an
    explicit `{ ' ' }`, and the content of a `<pre>` or other
    whitespace-preserving element. Such content stays exactly as written.
  - **Known blind spot**: a run of fully one-line siblings (opening tag,
    content, closing tag, and its own trailing comment all on one physical
    line) is easy to under-space, since compact one-liners are
    conventionally left ungapped in typical JSX found elsewhere. The
    1-blank minimum makes no such exception; this was found to be a
    systemic, file-wide miss across every file reviewed before it was
    written down. When auditing a file, explicitly check one-liner-to-
    one-liner and one-liner-to-next-sibling transitions, not just
    multi-line element closings.

### Attribute/prop ordering
Every JSX element's attributes/props (native DOM/SVG elements AND custom
components alike: a custom component's props follow the exact same
8-tier scheme, mapped by role, not by whether they're a "real" HTML
attribute) are ordered into these 8 tiers, top to bottom:
1. **React-internal, not real DOM attributes**: `key`, `ref`,
   `dangerouslySetInnerHTML`. React strips these before the element ever
   reaches the DOM, so they always come first regardless of element type;
   this includes SVG elements (SVG's own attributes do NOT get ranked
   ahead of `key`/`ref`, see tier 6 below).
2. **Identity**: `id` on a native element; on a custom component, whichever
   prop plays the equivalent identity role (e.g. `pickerId`, `featureId`,
   `pageId`). Decided 2026-09-27: a key that only labels which instance of
   a component is running, like GuiTouCom's own `touIdeStr` tour slot key,
   is core data in tier 6, not identity.
3. **Class**: `className` (never bare `class`: that attribute name
   doesn't exist in JSX at all).
4. **Style**: `style={{ ... }}`.
5. **State/custom identifiers**: `name`, `data-*`, `htmlFor` (never bare
   `for`, reserved word in JS, so JSX renames it).
6. **Core functional / primary data**: the tier that does the most work,
   so it absorbs a few different things:
   - Native elements: `src`, `href`, `action`, `type`, `value`/
     `defaultValue`, `checked`/`defaultChecked`, `disabled`, `required`,
     `readOnly`, `placeholder`, `min`/`max`/`step`/`pattern`/`maxLength`,
     `target`/`rel`, `autoFocus`, `autoComplete`, `spellCheck`,
     `contentEditable`, `draggable`.
   - SVG elements specifically: every SVG geometry/presentation attribute
     (`viewBox`, `width`, `height`, `x`, `y`, `cx`, `cy`, `r`, `rx`, `ry`,
     `d`, `points`, `transform`, `fill`, `stroke`, `strokeWidth`,
     `strokeLinecap`, `strokeLinejoin`, `clipPath`, `clipPathUnits`, ...)
     sits in THIS tier, alphabetized among themselves rather than
     individually ranked, since there are too many to rank one by one.
   - Custom components: whatever core data/behavior props actually drive
     the component (e.g. `state`, `actions`, `animStyle`): anything that
     isn't identity/style/descriptive/an event callback lands here.
7. **Descriptive / accessibility**: `alt`, `title`, `aria-*`, `role`,
   `tabIndex`.
8. **Events/callbacks, always last**: native handlers (`onClick`,
   `onChange`, ...) AND custom-component callback props (`onHome`,
   `onNavTab`, `onClose`, ...): both are the same conceptual category, so
   they're interleaved alphabetically, not native-first.

Within each tier, attributes are alphabetized by name (case-insensitive),
the same way object properties are, unless their order genuinely matters,
e.g. a `{ ...spread }` attribute, whose position decides what it overrides
and so stays exactly where it was written, or a form control whose prop
order changes how React applies it. E.g. tier 7's `aria-label` comes before
`role`, and tier 1's `key` before `ref`. See `tab-stats.tsx`'s own
`<BreBarCom>`/`<PagNavCom>` call sites for the reference examples.

On a multi-line attribute list, exactly 1 blank line separates each tier
from the next, so the tiers read as visible groups; attributes within the
same tier stay flush together, and an element whose attributes all fall in
one tier has no blank lines at all. (This is whitespace inside the opening
tag, so it has no effect on rendering.) A multi-line attribute value keeps
its own internal spacing untouched, e.g. an arrow function body's usual
2-blank padding. The tier a prop lands in is judged by role on a custom
component, so `name` is tier 5 only on a native element (where it's the
real HTML `name` attribute); a custom component's own name-like prop, like
`IcoSvgCom`'s own `icoNamStr`, is core data in tier 6. See
`tabs/today/group-header.tsx`'s own GroHeaCom name `<input>` for the
reference example:

```
<input
	ref={ namInpRef }

	className={ ... }

	maxLength={ 30 }
	type='text'
	value={ draNamStr }

	aria-label='Group name'

	onBlur={ comEdiFun }
	onChange={ ... }
	onKeyDown={ ... }
/>
```

### Multi-line attributes
- Any element (native or custom component) with 2 OR MORE attributes/props
  always goes multi-line, never all on one line, no matter how short the
  attributes are. This is exact, not "as long as it's reasonably long":
  even a 2-attribute element like `<span className='x' aria-hidden='true'>`
  must split.
- Exactly one attribute per line, no grouping multiple attributes onto a
  shared line. The opening tag name gets its OWN line with nothing else on
  it (not even the first attribute). The closing `>`/`/>` ALSO gets its
  own line, at the same indentation depth as (i.e. column-aligned under)
  the opening tag name's own `<`; it does NOT stay glued to the last
  attribute's line:
  ```
  <span
  	className='x'
  	aria-hidden='true'
  >
  ```
  Applies identically to self-closing elements: the `/>` sits alone on
  its own line too, aligned with the `<`:
  ```
  <Icon
  	name={ tabConObj.icon }
  	size={ 20 }
  />
  ```
  This supersedes the earlier "wrapped attributes column-aligned under the
  first attribute" indentation case for element attribute lists specifically,
  since the tag name never shares a line with an attribute anymore, there's
  no longer a column to align under. Use plain structural indent (one tab
  deeper than the opening tag's own line) for every attribute line instead.
  (That said, the alignment mechanism itself, from the Indentation section
  above, still applies to OTHER kinds of deliberately-column-aligned
  continuation lines that aren't an element's own attribute list.)
- A single-attribute element is unaffected as long as that attribute's own
  value doesn't itself force multi-line (see the `style` rule right below):
  e.g. `<path d='...' />` stays exactly as compact as it already is.
- **`style={{ ... }}` objects follow this same "2+ means multi-line" rule,
  one property per line**, regardless of whether the property values are
  simple literals or complex expressions (this is stricter than the
  general object-literal rule elsewhere in this doc, which only splits an
  object when a value is non-trivial; `style` always splits at 2+
  properties). No trailing comma on the last property, and it stays tight
  (no blank-line padding), same convention as a wrapped call-argument
  object. Additionally, the `:` of every property in the same `style`
  object always lines up in one column: pad each property name
  (left-justify) to the width of the longest name in that object, same
  computation as the column-alignment already used for named imports and
  stacked object literals elsewhere in this doc:
  ```
  style={{
  	stroke      : 'var(--acc-tin-col)',
  	strokeWidth : 16
  }}
  ```
  If `style` is an element's ONLY attribute and it has 2+ properties, the
  element itself still goes multi-line as a consequence: the tag name
  gets its own line, `style={{` follows, then each property, then the
  closing `}}`, then (per the closing-bracket rule above) the element's
  own `>`/`/>` on its own line after that:
  ```
  <g
  	style={{
  		stroke      : 'var(--acc-tin-col)',
  		strokeWidth : 16
  	}}
  >
  ```
- When this turns a JSX child into a genuine multi-line element (most
  commonly a `{condition && <Foo attr1 attr2 />}` one-liner that now has
  to expand), wrap it in the multi-line conditional `(...)` pattern from
  the JSX section above, with the usual 2 blank lines inside.
- A run of visually-repetitive sibling conditionals that used to share a
  deliberately-aligned single line each (e.g. four
  `{actIdeStr === 'x' && <TabX .../>}` branches column-padded to line up)
  loses that alignment once each one expands to multi-line; that's an
  accepted tradeoff of this rule, not a bug to fix.
- **Exception, an element inside a run of text** (decided 2026-10-03): an
  element sitting inline among text on the same line (an icon in help copy,
  a link or a button in the middle of a sentence) may keep its attributes on
  that one line, since splitting it would only scatter the sentence.
- **Exception, a table of self-contained markup** (decided 2026-10-03): a
  lookup table whose entries are each one self-contained piece of markup,
  such as `ui/icon.tsx`'s icon table, keeps each entry's markup on its own
  single line. The shapes inside an entry need no comments of their own and
  no multi-line attributes, since the entry's own comment covers the whole
  icon.

### Variable declarations
- Every variable gets its own `const`/`let` on its own row: a single
  `const a = foo(), b = bar();` combining multiple declarations must be
  split into separate statements, each on its own line (this is a real,
  intentional code change, not just whitespace; verify nothing depends on
  the original combined-statement ordering/scoping before splitting).
- **Consecutive plain `const`/`let` declarations get 0 blank lines between
  them, not the general "related" (1-blank) tier**, whenever they're
  tightly connected: the next one directly consumes the previous one (the
  resulting lines from splitting a combined declaration, per the bullet
  above, are the common case), or several declarations jointly share one
  clearly-scoped purpose even without directly consuming each other (e.g.
  a small group of module-private state variables all backing the same
  piece of behavior). This is a correction to (and takes priority over)
  "### General relatedness tiering" below, whose own "Related" tier does
  NOT cover plain declarations at all anymore.
  - **Only same-keyword declarations (all `const`, or all `let`) group
    this tightly.** A run that would otherwise mix `const` and `let`
    splits into two separate sub-groups by keyword instead (each 0-blank
    internally, using the mechanism below independently within itself),
    with the normal 1 blank line between the two sub-groups, even though
    the whole run still shares one overall purpose.
  - **Same keyword still isn't enough on its own: a run also splits by
    declaration SHAPE.** A plain single-name binding (`const x = ...;`)
    and a destructured binding (`const [ a, b ] = ...;` or `const { a,
    b } = ...;`, most commonly a `React.useState()` pair) are a
    different KIND of declaration from each other, the same "different
    kind of code" reasoning the const/let split above already uses, even
    when both use the same keyword and would otherwise tightly group.
    Split a run that mixes the two shapes into separate sub-groups the
    same way: 1 blank line between the sub-groups, 0-blank internally
    within each (trivial when a sub-group is a single line). This also
    keeps a destructured binding's own differently-shaped left-hand side
    from forcing the `=`/comment alignment columns of an otherwise
    plain, evenly-named run wider than they need to be. E.g.
    `PagTouCom`'s own `onbStaObj`/`resTouObj` (2 plain bindings) followed
    by `const [ touPhaStr, setTouPhaStr ] = React.useState( ... );` (a
    destructured `useState` pair) gets a blank line before the
    `useState` line, splitting it into its own single-line group rather
    than folding it into the same 0-blank run as the two plain bindings
    above it.
  - **A mixed-shape run of genuinely independent declarations gets
    physically reordered to cluster same-shape declarations together,
    not just spaced according to whatever order they happened to be
    written in.** This is a different, further step beyond the shape-
    split spacing rule just above: that rule only governs blank-line
    treatment for a run in its existing order, while this one governs
    whether the run's own order is worth changing in the first place.
    A run qualifies when every declaration in it is independent of
    every other one, meaning none of them reads a value another
    declaration in that same run just produced (a genuine dependency
    chain, e.g. a destructured `useState` pair immediately consumed by
    the next line, must stay in its original relative position; only
    the mutually-independent members of the run are free to move).
    React's own Rules of Hooks make this safe to apply to a run of
    `React.useState`/`React.useRef`/etc. calls specifically: React only
    requires hook calls to run in a *consistent* order across every
    render, not any particular order, so reordering a set of
    unconditional, independent hook calls relative to each other
    changes nothing observable. Once reordered, each same-shape cluster
    is spaced and column-aligned exactly per the ordinary rules above
    (0-blank/aligned within a cluster, 1 blank between clusters). Pick
    which cluster leads by whichever shape appeared first in the
    original, unreordered sequence, and preserve each cluster's own
    internal relative order from that original sequence; don't
    introduce a new ordering within a cluster that wasn't already
    there. See `RemManCom` in `tabs/data/reminders-manager.tsx` for the
    reference example:
    its own `opeIdeStr`/`newAddRef`/`insIdeStr`/`opeEdiRef`/`froIndRef`/
    `preOpeRef` declarations were originally interleaved
    useState/useRef/useState/useRef/useRef/useRef (each pair 1-blank
    apart, since the shape kept alternating); grouped into a
    `useState` cluster (`opeIdeStr`, `insIdeStr`, in their own original
    relative order) followed by a `useRef` cluster (`newAddRef`,
    `opeEdiRef`, `froIndRef`, `preOpeRef`, likewise), since `useState`
    was the first shape to appear originally.
  - **Even within the same keyword and the same plain/destructured
    shape, a run further splits by whether each declaration's own
    VALUE is single-line or spans multiple lines** (a function body,
    an array/object literal, a multi-line `useMemo`/`useCallback`,
    ...). Two adjacent single-line-valued declarations still tightly
    group at 0-blank as normal, but any transition where EITHER side of
    a pair is multi-line-valued breaks out of the run entirely and
    falls back to relatedness tiering, symmetric in both directions
    (entering a multi-line value, leaving one back to a single-line
    value, or between two consecutive multi-line values): 2 blank
    lines when the two are genuinely connected (one reads the other,
    or they're sibling handlers building the same feature, e.g. a
    Cancel/Save pair), 3 blank lines when they share no real data or
    purpose. The multi-line value's own body is a separate block of
    code, so the tighter 0/1-blank declaration-run tiers never apply
    across it. E.g. `pwa.ts`'s own `staGraNum`/`finProFun`: `const
    staGraNum = 2500;` followed by `const finProFun = () => { ... };`,
    which reads staGraNum in its own body, gets 2 blank lines; in
    `tab-data.tsx`, `canNewFun`/`savNewFun` (sibling draft handlers)
    get 2, while `savNewFun` followed by the unrelated `draCarRef` gets
    3. (An earlier version of this rule fixed every such transition at
    1 blank line; files reviewed before 2026-09-25 get corrected in the
    final file-by-file pass.)
  - **A run also splits when it mixes standard-length (9-char/3-segment)
    names with a non-standard, longer composite name** (e.g. a 4-segment
    Initialism-compression case like `lmsLonPriNum`). Forcing the
    shorter, standard names' own `=`/comment columns out to match a much
    longer non-standard name defeats the whole point of keeping most
    names at the compact standard length. Split into separate
    sub-groups the same way as the other splits above: 1 blank line
    between the sub-groups, 0-blank internally within each, each
    sub-group's own alignment computed independently. E.g.
    `utils/color.ts`'s own `lmsLonPriNum`/`lmsMedPriNum`/`lmsShoPriNum` (3 non-standard,
    12-character Initialism-compression names) sit in their own group,
    followed by a blank line, then `lmsLonNum`/`lmsMedNum`/`lmsShoNum`
    (3 standard, 9-character names) in their own separately-aligned
    group, even though all 6 are `const`, plain-shaped, and
    single-line-valued, and the second group directly consumes values
    from the first.
  - **A run also splits off a declaration carrying a TypeScript type
    annotation** (decided 2026-10-05), the same way it splits off a
    longer non-standard name: `const curPicObj : Partial< PicRcdTyp > =
    ...` sits 1 blank line apart from its plain-named neighbors, in its
    own group, so the annotation never widens their `=` and comment
    columns. Several annotated declarations next to each other form one
    group, aligned among themselves. See `state/pending-mutations.ts`'s
    own `curPicObj`, split from `hasPipBoo`/`perRunStr` above it.
  - **This same run gets its `=` signs column-aligned**, the same
    column-alignment mechanism used elsewhere in this doc (named imports,
    object `:` alignment, ...): pad each line's own left-hand side
    (everything before its own `=`, whether that's a bare name or a
    destructured `[ a, b ]`/`{ a, b }` pattern) to the width of the
    longest one in that run. This is usually a non-event in practice,
    since the naming rules already produce same-length names within a
    tightly-related group most of the time, but apply it explicitly
    whenever a run's names (or their destructuring shapes) genuinely
    differ in length, e.g. a mix of a plain name and a destructured
    `[ a, b ]` pair, or a mix of prefixed and unprefixed names.
  - The comment on each line in the run still gets column-aligned per the
    usual "no blank lines between them" comment rule too, computed from
    the single longest full line (code plus its own padding) in that run.
  - The moment a declaration is followed by anything that ISN'T also a
    plain `const`/`let` declaration, that's the end of THIS run; normal
    relatedness tiering resumes, UNLESS what follows is itself the start
    of a same-operation statement run (see the bullet below), which gets
    its own fresh 0-blank grouping instead of reverting to 1-blank.
  - **This 0-blank rule is strictly for a fresh `const`/`let`
    declaration: a plain reassignment of an already-declared variable
    (no `const`/`let` keyword at all, e.g. `iteFlaObj = { ... };`
    reassigning a `let` declared earlier) is NOT a declaration for this
    rule's own purposes, even when it sits directly next to a call that
    consumes it and superficially looks like the same "declare, then use
    it" shape.** That pairing falls back to plain "### General
    relatedness tiering" below instead, which most commonly lands on
    Related (1 blank line) via its own "a value used on the very next
    line" case: e.g. `iteFlaObj = { autBoo : false, ... };` immediately
    followed by `iteFlaMap.set( logRowObj.itemId, iteFlaObj );` in
    `dayFlaFun` (`day-log.tsx`) gets exactly 1 blank line between them,
    not 0, since the reassignment and the `.set()` call are two
    genuinely different kinds of statement (an assignment, then a method
    call) even though they're tightly related.
- **A run of consecutive statement-calls that all perform the same
  repeated operation on different data gets 0 blank lines between them
  too** (e.g. 8 back-to-back `rooStyObj.setProperty(...)` calls, one per
  palette token), the same principle as consecutive plain declarations
  above, just for calls instead of declarations. Column-align their
  comments the same way (computed from the single longest line in the
  run). This is the exception the bullet above refers to: a
  declaration immediately followed by the FIRST call of such a run does
  NOT end up 1-blank-separated by default just because a call isn't a
  declaration; judge it on whether the calls themselves are a genuine
  repeated-operation run, and give that run its own correct spacing
  (0-blank internally, then the normal tiering rules for whatever
  precedes/follows the run as a whole).

### Long boolean expressions
A "long boolean expression" is an `&&`/`||` chain where MORE THAN 2 of
its operands are real expressions (a comparison, a negation, a member/
array access, a function call, or anything else that isn't already just
a bare variable reference), whether it's a `while`/`if` condition or a
plain boolean assignment. A chain that already combines nothing but
bare, already-named identifiers (e.g. `a && b && c && d`, every operand
an existing variable) does NOT count, no matter how many operands it
has: there's nothing left to extract from it, that's the intended,
readable end state, not something to decompose further. Each operand
that IS a real expression gets pulled out into its own named `const`
boolean variable (named per the usual 9-character/3-segment naming
rules, `Boo` as the type segment), rather than left inline as part of
one long, hard-to-parse condition. The point is purely readability: a
chain mixing real expressions with bare names forces the reader to
parse each real expression inline; naming them removes that burden
without also demanding that already-simple bare identifiers get
pointlessly wrapped in variables of their own. See `canBigBoo` and
`diaOpeBoo` in `src/ui/bg-flourish.tsx` for the reference examples:
`canBigBoo` combines 6 bare identifiers and needs no further extraction
despite having "more than 2" operands, while `diaOpeBoo` (`rowFitBoo &&
colFitBoo && !bloGriArr[ rowIndNum + 1 ][ colIndNum + 1 ]`) has only 1
real-expression operand among its 3 (the other 2 are already bare
identifiers) and also stays inline as one line, for the same reason.
- **Grouping**: the extracted variables are placed directly before the
  final boolean that combines them, tightly grouped (0 blank lines
  between them, same mechanism as "### Variable declarations" above),
  followed by exactly 1 blank line, then the final combining
  declaration.
- Exactly 2 or fewer real-expression operands stay inline as-is,
  regardless of how many additional bare-identifier operands are also
  in the same chain (e.g. `canBigBoo && Math.random() < BIG_CHA_NUM` has
  1 real-expression operand and stays inline); extraction only kicks in
  once a chain has 3 or more real-expression operands.
- If the surrounding code has no existing named variable for the final
  combined condition (e.g. it was written directly inline in an `if`),
  a new one still needs to be introduced for the extracted operands to
  combine into, following the same naming and grouping rules as if the
  original code had already used one.
- **The final combining boolean never tight-groups with what comes
  after it, even when what follows would otherwise directly consume it
  and normally qualify for the 0-blank "### Variable declarations" tier
  above.** Its own visual relationship is with the block of extracted
  operands it summarizes (1 blank line before it, per the bullet
  above); collapsing the gap to whatever reads it next would blur that
  specific pairing. Always exactly 2 blank lines after the final
  combining boolean, regardless of what the general tiering rules would
  otherwise assign: e.g. `canBigBoo` (the combined result) sits flush
  with nothing, gets 2 blank lines before `isBigBoo` even though
  `isBigBoo` directly consumes it and would normally tight-group at
  0-blank.
  - **Exception, a standalone `return` immediately consuming the
    combining boolean still gets its own mandatory 3 blank lines
    before it, not this rule's own 2**, per "### Return and continue
    statements" below's own precedence modifier: that section's blank-
    line counts always win over this one's. E.g. `isaStaFun` in
    `pwa.ts`: `const isaStaBoo = disStaBoo || disFulBoo || navStaBoo;`
    followed by `return isaStaBoo;` gets 3 blank lines, not 2, even
    though `isaStaBoo` is exactly this rule's own "final combining
    boolean" shape (three bare identifiers ORed together).
- **Chains whose operands guard each other stay inline** (decided
  2026-10-04). When a later operand only works because an earlier one
  already passed, as in a null-guard chain (`staAppObj.ui &&
  staAppObj.ui.dataSort && staAppObj.ui.dataSort.reminders`), pulling it
  out would either crash on missing data or need optional chaining
  (`a?.b?.c`), which is harder to read than the chain itself. Such a chain
  stays exactly as written. The same goes for an operand with side
  effects (a call that does something rather than just answering a
  question): extracting it would run it every time instead of only when
  the earlier operands let it.
- **JSX render conditions and value fallbacks are covered too** (decided
  2026-10-04). In `{ a && b && c && <Foo /> }` the condition's operands
  are extracted and the rendered element is not counted as one. A value
  fallback (`picArgObj.replaceId || picArgObj.id || newIdeStr`) extracts
  its operands the same way, each named with its own value's type
  segment rather than `Boo`. A `??` chain isn't an `&&`/`||` chain and is
  not covered.
- **A literal counts like a bare name** (decided 2026-10-04): a
  literal operand (`null`, `[]`, `'name-asc'`, `0`) is already as easy to
  read as a variable, so it never counts toward the "more than 2 real
  expressions" threshold and is never extracted into a constant of its
  own.

### General relatedness tiering
Used for spacing between statements inside a function/block body (JSX
siblings use their own nesting-depth rule under "### JSX" instead).
Three tiers:
- **Related (1 blank line)**: tightly, directly connected: a value used on
  the very next line; two lines that are literally the same *kind* of code
  working toward the same immediate step (e.g. two sibling `useState` calls
  backing the same visual feature; parallel/mutually-exclusive branches of
  one conditional). This does NOT cover two plain `const`/`let`
  declarations, even when the second directly consumes the first: see
  "### Variable declarations" above, which gets 0 blank lines instead.
- **Somewhat related (2 blank lines)**: connected, but via a different
  specific mechanism or a different *kind* of code, even when the
  underlying data is identical. Two recurring shapes:
  - Different mechanism, same overarching goal: e.g. a `ResizeObserver`
    call and a `window.addEventListener('resize', ...)` call right after
    it both exist to trigger the same re-measurement, but they're
    different specific tools, so 2, not 1.
  - Same data, different *kind* of code construct: a plain variable/state
    declaration (or a function's own definition) immediately followed by a
    function/effect/if-block/function-call that operates on that exact
    same data (or the function itself being invoked) is 2, not 1, purely
    because a plain declaration and a function/block/call are inherently
    different *kinds* of code. This applies in both directions (declare →
    block, or block → declare) and also to "define a function, then call
    it" pairs. Only two instances of the *same kind* of code (e.g. two
    plain declarations, or two sibling effects) can be "1".
  - The same logic applies to two `useEffect`s specifically: 1 if they
    handle the exact same data, 2 if they operate on different (even if
    related/sibling) data while doing a similar kind of action, 3 otherwise.
  - **Mutually-exclusive sibling branches involving a multi-line one**: a
    run of independent early-return `if`s dispatching on the same value
    (e.g. `if ( mode === 'a' ) return ...; if ( mode === 'b' ) return
    ...;`, not a formal `else if` chain, which has its own fixed
    1-blank rule under "### if/else and while statements" regardless of
    shape) never groups tighter than 3 blank lines between two adjacent
    one-line siblings: each one is a single-line exit guard, so "###
    Return and continue statements" gives it 3 blank lines before and
    after, even when every guard checks the same value (e.g.
    `tasks.ts`'s own `sumTasFun` `dowSetArr.length` checks). The same
    holds when either sibling is a multi-line `if` block (decided
    2026-10-03, replacing an earlier 2-blank allowance): the line after any
    finished `if` construct always gets 3 blank lines, per "### if/else,
    while, and for statements", and only the branches of one `if`/`else
    if`/`else` chain sit 1 blank line apart.
- **Unrelated (3 blank lines)**: no real shared data and no real shared
  purpose, including cases that only *look* structurally parallel. Two
  independent "declare + guard clause" pairs that happen to share the same
  shape but check entirely unrelated conditions (e.g. one checking that a
  DOM ref exists, the next checking that a *different* DOM ref exists) are
  still 3 apart, not 1 or 2, because what they actually check is unrelated.
  When judging this, check for real data/behavior overlap (e.g. "does the
  effect after this ref actually reference it in its own body or dependency
  array?") rather than assuming a topical-sounding comment means they're
  related; several calls in this file were revised from 2 down to 3 after
  actually checking for shared data and finding none.

### Naming conventions
Applies to every named thing (variables, function/component declarations,
function parameters, destructured bindings), no matter how short-lived or
narrowly scoped, subject to the specific exemptions below. Being rolled out
gradually alongside the whitespace rules above (started with `src/app.tsx`).

- **The 9-character/3-segment rule**: a name is built from exactly three
  3-character segments (9 characters total, camelCase for regular
  identifiers): segment 1 = what it is, segment 2 = a descriptor or
  continuation of what it is (no hard rule for this one beyond "strictly
  3 letters"), segment 3 = the type of variable (e.g.
  `Str`/`Boo`/`Obj`/`Arr`/`Fun`/`Ref`/`Tmo`/`Lis`). Each segment is
  strictly the first 3 letters of a chosen English word, even when a
  shorter conventional abbreviation exists (e.g. `but` for "button", not
  `btn`; `con` for "config", not `cfg`), e.g. `Lis` for "List" (a
  `NodeList`, such as `querySelectorAll`'s return value), not `Lst`.
  - Example: `TABS` → `TAB_OBJ_ARR` (Tab + Object + Array).
  - Example: `active` (the app's current tab id) → `actIdeStr` (Active +
    Identifier + String).
- **Known miscorrections: check every segment against this list before
  finalizing a name.** In practice, segments built from a word with a
  strong, ubiquitous conventional abbreviation (the kind used constantly
  across real-world code) keep drifting toward that abbreviation instead
  of the word's own literal first 3 letters, even when the rule above is
  explicit and has already been applied correctly elsewhere in the same
  file. Don't reason from the abbreviation you'd normally reach for;
  spell out the actual English word first, then take its own literal
  first 3 letters. Confirmed wrong → right pairs found so far, each
  caught only after being used repeatedly across multiple files:
  - `idx` → `ind` (Index)
  - `cnt` → `cou` (Count)
  - `itm` → `ite` (Item)
  - `evt` → `eve` (Event)
  - `msg` → `mes` (Message)
  - `chk` → `che` (Check)
  - `evr` → `eve` (Every)
  - `avg` → `ave` (Average)
  - `cfg` → `con` (Config/Configuration)
  - `btn` → `but` (Button)
  - `tgt` → `tar` (Target)
  - `mgr` → `man` (Manager)
  - `ptr` → `poi` (Pointer)
  - `std` → `sta` (Standard *or* Standalone: both truncate the same way)
  - `prv` → `pre` (Previous)
  - `tsk` → `tas` (Task)
  - `fmt` → `for` (Format)
  - `frm` → `for` (Form: found in `onCloFrmFun`
    (`onboarding/reminder-tours.tsx`), fixed to `onCloForFun`; note this
    collides with `fmt` → `for` (Format) just above, and separately with
    `for`'s own already-correct existing use for Force (e.g. `forIdeStr`
    in `pickers.ts`); context disambiguates which of the three "for"
    stands for)
  - `pkr` → `pic` (Picker)
  - `ctl` → `con` (Control: note this collides with `cfg` → `con`
    (Config) above; when both "Control" and "Config/Configuration" are
    real concepts in the same name, resolve the collision via the
    normal Naming-conflict resolution escalation rather than guessing)
  - `fld` → `fie` (Field)
  - `bak` → `bac` (Back)
  - `pck` → `pic` (Pick: note this collides with `pkr` → `pic` (Picker)
    above, the same way `ctl`/`cfg` collide; a name's own surrounding
    context, e.g. `picLogArr` holding pick-log rows rather than a list of
    pickers, disambiguates which word "pic" stands for in practice)
  - `txt` → `tex` (Text)
  - `src` → `sou` (Source: this is distinct from the bare `src` DOM/JSX
    attribute name itself, e.g. `<img src=...>`/`<script src=...>`, which
    stays exactly as-is per the Naming conventions exemptions, since it
    is a real external HTML attribute, not our own invented segment)
  - `lbl` → `lab` (Label)
  - `pct` → `per` (Percent: note this collides with `per` already
    meaning Period (`perStaFun`/`perDayNum`) and Permission (`perCheFun`)
    elsewhere, the same way `ctl`/`cfg` collide; a name's own surrounding
    context, e.g. `finPerNum` holding a clamped percentage rather than a
    period or a permission state, disambiguates which word "per" stands
    for in practice)
  - `flg` → `fla` (Flag)
  - `chp` → `chi` (Chip: note this collides with `chi` already meaning
    Child (`chiMouBoo`/`setChiMouBoo` in `ui.jsx`'s `Collapse`); a name's
    own surrounding context, e.g. `chiTupArr` holding chip tuples in a
    status-chip renderer rather than anything about mounted children,
    disambiguates which word "chi" stands for in practice)
  - `rnd` → `rou` (Round/Rounded: note this collides with `rou` already
    meaning Roulette (`rouRemNum` in `pickers.ts`'s own weighted-pick
    algorithm); a name's own surrounding context, e.g. `booRouNum`
    holding a rounded boost value rather than anything about a roulette
    wheel, disambiguates which word "rou" stands for in practice)
  - `unt` → `uni` (Unit: note `uni` already carries two other meanings
    in this codebase, Union (`uniRecFun`) and Unique (`uniNamFun`);
    context disambiguates which of the three "uni" stands for)
  - `wrd` → `wor` (Word)
  - `cls` → `cla` (Class: note `cla` already carries two other meanings
    in this codebase, Clamp (`claValFun`) and Clause (`tutClaStr`), and
    this collides with `cla`'s own already-correct existing use for
    Class too (`extClaStr`); context disambiguates which of the three
    "cla" stands for)
  - `cls` → `clo` (Close/Closing: a second, distinct miscorrection
    sharing the same wrong `cls` spelling as the Class case above, found
    across `clsGroFun`/`clsIdeStr`/`savClsFun` (`tab-data.tsx`),
    `clsImpFun`/`clsResFun` (`tab-settings.tsx`), `clsWayRef`
    (`tab-today.tsx`), and `ediClsBoo` (`tab-picker.tsx`); `clo` is
    already the established, heavily-used code for Close elsewhere
    (`cloAddFun`, `cloTimRef`, `onCloConFun`, ...), so these were
    renamed to match rather than left as a fourth "cls" variant)
  - `id` → `ide` (Identifier: this one drifts to a 2-letter segment
    instead of the usual wrong-3-letter case, since "id" is the common
    real-world abbreviation people reach for; found in `conIdArr`,
    `pilIdStr`, `skiIdSet`, and `visIdSet` across `day-log.tsx` and
    `tab-data.tsx`, all fixed to their own 3-letter `ide` segment)
  - `grp` → `gro` (Group: found across 33 identifiers spanning 7 files;
    `gro` was already the established correct code for Group elsewhere
    in this codebase, e.g. `GroLogCom`, `GroHeaCom`, `curGroObj`)
  - `grp` → `gri` (Grip: a second, distinct miscorrection sharing the
    same wrong `grp` spelling as the Group case above, found in
    `grpCurEle` (`tab-today.tsx`), a drag-handle grip element; `gri` is
    already the established code for Grip in that same file
    (`onGriDowFun`), though note `gri` also separately means Grid in
    `bg-flourish.tsx` (`plaGriFun`), an unrelated multi-meaning segment
    in a different file with no collision risk between the two)
  - `ovf` → `ove` (Overflow: found in `ownOveStr`/`ancOveStr`/`oveRigBoo`
    in `help/mode.tsx`, `oveBelNum`/`oveStyStr` across
    `tab-settings.tsx` and `tab-picker.tsx`, and a third, distinct
    recurrence in `onboarding/tour-runner.tsx`'s own `ownOveStr`/
    `ancOveStr`/`ancOveYStr`, this last one caught during an automated
    Known-miscorrections sweep rather than a full manual review pass)
  - `clp` → `cli` (Clip: found in `cliRecObj` across `help/mode.tsx` and
    `onboarding/tour-runner.tsx`; `cli` was already the established code
    for Clip elsewhere in this codebase, e.g. `cliHorFun`, `cliChrFun`)
  - `clp` → `cla` (Clamp: a second, distinct miscorrection sharing the
    same wrong `clp` spelling as the Clip case above, found in
    `claValNum` (`tab-picker.tsx`), a clamped ease-drift value; `cla` is
    already the established code for Clamp elsewhere in this codebase
    (`claValFun`, `claPadFun`), though note `cla` also separately means
    Clause (`tutClaStr`) and Class (`extClaStr`); context disambiguates
    which of the three "cla" stands for)
  - `ovl` → `ove` (Overlap: found in `horOveBoo`/`verOveBoo`
    (`help/mode.tsx`); note this collides with `ove` already meaning
    Overflow just above, and separately with `ove` meaning Overlay in
    `HelOveCom` (`help/mode.tsx`, exported and used across every
    tab-*.jsx file); context (a `Com`-suffixed component vs. a
    `Str`/`Boo`-suffixed value) disambiguates which of the three "ove"
    stands for)
  - `vp` → `vie` (Viewport: a 2-letter abbreviation rather than the
    usual wrong-3-letter case, since "vp" is the common real-world
    shorthand people reach for; found in `vpWidNum`/`vpHeiNum` across
    `help/mode.tsx`, `ui.jsx`, and `onboarding/tour-runner.tsx`,
    including `onboarding/tour-runner.tsx`'s own `coaLayFun` parameters)
  - `abv` → `abo` (Above: found in `aboAncNum`/`gapAboNum` in
    `help/mode.tsx` and `ftsAboBoo` in `onboarding/tour-runner.tsx`)
  - `spc` → `spa` (Space: found in `spaAboNum`/`spaBelNum` across
    `help/mode.tsx` and `onboarding/tour-runner.tsx`)
  - `ctr` → `cen` (Center: found in `cenXNum` (`help/mode.tsx`); `cen`
    was already the established code for Center elsewhere in this
    codebase, e.g. `cenBadBoo`)
  - `arw` → `arr` (Arrow: found in `arrClaStr`/`arrXNum`/`arrClaVal`
    across `help/mode.tsx` and `arrXFun`/`arrClaStr`/`arrXNum` in
    `onboarding/tour-runner.tsx`)
  - `nxt` → `nex` (Next: a very widely recurring miscorrection, found in
    `nexRecObj` (`help/mode.tsx`), `nexDayArr` (`tab-picker.tsx`),
    `nexSetObj` (`tab-today.tsx`), and dozens of distinct `nexXxxArr`/
    `nexXxxObj`/`nexXxxStr`/`nexXxxBoo` names throughout `store.ts`,
    where it is the file's own dominant convention for "the next state"
    passed to every action's own setter; `nex` was already the
    established correct code elsewhere in this codebase, e.g.
    `nexMapObj` (`help/mode.tsx`, sitting right next to the wrong
    `nxtRecObj` in the same file))
  - `cnd` → `con` (Conditional: another very widely recurring
    miscorrection, touching dozens of distinct `conXxxObj`/`conXxxArr`/
    `conXxxStr`/`conXxxBoo`/`conXxxFun` names plus 2 component aliases
    across `store.ts`, `tab-data.tsx`, `tab-picker.tsx`, `tab-today.tsx`,
    `seed.ts`, and `help/sample-data.ts`. **Known blind spot**: a plain
    substring/word-boundary grep for this one is easy to under-scope,
    since a name that begins DIRECTLY with `cnd`/`Cnd` (no other segment
    before it, e.g. `cndOnBoo`, `cndCurObj`, `CndEdiCom`) doesn't match a
    regex that requires a leading character before the pattern, the
    exact miss that happened here on a first pass; re-grep with a
    pattern that also allows zero characters before the target substring
    when auditing for this or any future miscorrection. `con` was
    already the established, deliberate code for Conditional in
    `conditionals.ts`'s own exported
    `CON_NAM_OBJ` (originally `CONDITIONALS`), so this sweep brings
    every other file in line with that existing choice. Note `con`
    already carried 3 other meanings before this one (Config/
    Configuration via `cfg`→`con` above, Control via `ctl`→`con` above,
    and Confirm, e.g. `tab-data.tsx`'s own `conDelBoo`/`setConDelBoo`),
    making it a genuinely heavily-overloaded segment now; a name's own
    surrounding context (the other segments, and which file/module it
    sits in) disambiguates which of the 4 meanings "con" stands for in
    practice. **A single genuine self-collision surfaced from this
    sweep**: `tab-data.tsx`'s own `CndConCom` (a local alias, `const
    CndConCom = ConditionalControls;`) already used `Con` for its own
    segment 2 (Control), so renaming segment 1 (Conditional) to `Con`
    the normal way would have produced `ConConCom`, the same code
    twice in one name. Resolved via the general Naming-conflict
    escalation's Phase A on segment 1: keep `Co`, then take
    "Conditional"'s own 4th letter (`d`, since the 3rd letter `n` was
    already ruled out) instead of the literal first-3-letters `Con`,
    giving `CodConCom`. `cod` is otherwise used sparingly elsewhere
    (`holidays.ts`'s own `couCodStr`/`regCodStr`, meaning Code), with
    no collision risk against this file's own segments)
  - `cpy` → `cop` (Copy: found in `cpyIdeStr` (`help/sample-data.ts`)
    and `cpyAdrFun`/`cpyDonFun` (`tab-settings.tsx`); `cop` was already
    the established, heavily-used code for Copy elsewhere in this
    codebase, e.g. `copIdeStr`/`neeCopFun`/`picCopFun`/`tasCopFun`
    (`onboarding/page-tours.tsx`), `datCopObj` (`seed.ts`/`store.ts`),
    and `PAG_COP_OBJ`/`PIC_COP_OBJ`/`REP_COP_OBJ`/`VAR_COP_OBJ`)
  - `boot` → `boo` (Boot: a 4-letter word left untruncated instead of
    taking its own literal first 3 letters, found in `bootAppFun`
    (`main.tsx`), fixed to `booAppFun`; note `boo` already carries 2
    other meanings in this codebase, Boolean (the universal type
    segment) and Boost (`booRouNum`, `BooResCom`), making this a third;
    context (the type segment always being literally `Boo` for
    Boolean, versus `boo` appearing as segment 1 or 2 for Boot/Boost)
    disambiguates which of the three it stands for)
  - `hdr` → `hea` (Header: found in `opeHdrEle`/`hdrButArr`
    (`onboarding/app-features.tsx`), `hdrEle` (`onboarding-tour-
    runner.jsx`), and `hdrEleRef`/`hdrCurEle`/`hdrHeiNum`
    (`tab-today.tsx`); `hea` was already the established, unambiguous
    code for Header elsewhere in this codebase, e.g. `TabHeaCom`,
    `GroHeaCom`, `heaLabStr`)
  - `bld` → `bui` (Build, found across 9 functions spanning
    `onboarding/page-tours.tsx`, `onboarding/app-features.tsx`,
    `onboarding/picker-tours.tsx`, and `onboarding/reminder-tours.tsx`,
    e.g. `bldAddFun`, `bldNewFun`, `bldModFun`, `bldSteFun`; `bld` is a
    common real-world abbreviation for "build" (build tooling, CI
    scripts, ...) that crept in over the word's own literal first 3
    letters the same way `btn`/`cfg` did elsewhere in this list)
  - `frq` → `fre` (Frequency: found in `buiFrqFun`
    (`onboarding/reminder-tours.tsx`), fixed to `buiFreFun`; `fre` was
    already the established, correct code for this exact word elsewhere
    in this codebase, e.g. `freModStr`/`freGapMap`/`freKeyStr`/
    `freEntObj` in `tab-stats.tsx`. Note `fre` is a heavily multi-meaning
    segment even before this fix, already carrying Fresh (dozens of
    uses, e.g. `isaFreBoo`/`freIndNum`/`freBoo` throughout
    `reminders.jsx`/`tab-today.tsx`/`onboarding/tour-runner.tsx`) and
    Freeze (`freEdiFun` in `ui.jsx`) alongside Frequency; a name's own
    surrounding context disambiguates which of the three "fre" stands
    for in practice, the same reasoning already used for `con`/`sta`/
    `per` elsewhere in this list)
  - `tsp` → `tim` (Timestamp: found in `rowTspObj`
    (`onboarding-seed-data.ts`, 3 separate declarations) and `pikTspObj`
    (`seed.ts`, 2 separate declarations), fixed to `rowTimObj`/
    `pikTimObj`; `tim` was already the established, correct code for
    this exact word right next to one of the miscorrected instances,
    `comTimStr` in `onboarding-seed-data.ts`'s own `hydStaFun`)
  - `dwn` → `dow` (Down: a very widely recurring miscorrection, found in
    `dwnGuaFun` (`onboarding/tour-runner.tsx`), `onPoiDwnFun`/
    `poiDwnObj`/`onKeyDwnFun`/`keyDwnObj` (`ui.jsx`), `dwnLnkEle`
    (`tab-settings.tsx`), `keyDwnFun`/`keyDwnObj` (`help/mode.tsx`), and
    `easDwnBoo`/`isDwnBoo` (`store.ts`, 2 separate declarations), fixed
    to `dowGuaFun`/`onPoiDowFun`/`poiDowObj`/`onKeyDowFun`/`keyDowObj`/
    `dowLnkEle`/`keyDowFun`/`keyDowObj`/`easDowBoo`/`isDowBoo` across all
    5 files in one sweep; every one of these comments already spelled
    out "Down"/"Key Down"/"Pointer Down"/"Download"/"Mousedown"/
    "Ease-Down" in full, so none needed any text changes, only the
    identifiers themselves were wrong. Note `dow` collides in SPELLING
    (not meaning) with `dow` already meaning Day-Of-Week in
    `cadence-control.tsx`'s own `dowIndNum`, a single narrow usage in an
    unrelated file; a name's own surrounding context disambiguates which
    of the two "dow" stands for in practice, the same reasoning already
    used for `con`/`sta`/`per`/`fre` elsewhere in this list)
  - `amt` → `amo` (Amount: found in `resAmtNum`/`scrAmtFun`
    (`onboarding/tour-runner.tsx`), `easAmtNum`/`newAmtNum`
    (`ui/conditional-controls.tsx`, 2 separate `easSooFun`/`easLatFun`
    parameters and 2 separate `newAmtNum` declarations), and `offAmtNum`
    (`appearance.ts`), fixed to `resAmoNum`/`scrAmoFun`/`easAmoNum`/
    `newAmoNum`/`offAmoNum` across all 3 files in one sweep; every one
    of these comments already spelled "Amount" out in full, so none
    needed any text changes, only the identifiers themselves were
    wrong. No collision: `amo` was not already in use anywhere)
  - `fnd` → `fou` (Found: found in `notFndNum`
    (`onboarding/tour-runner.tsx`), `fndIteObj` (`tab-picker.tsx`, 2
    separate declarations), and `curFndIndNum` (`tab-today.tsx`), fixed
    to `notFouNum`/`fouIteObj`/`curFouIndNum` across all 3 files in one
    sweep; `fou` was already the established, correct code for this
    exact word elsewhere in this codebase, e.g. `fouCouNum` in
    `seed.ts`. Every one of these comments already spelled "Found" out
    in full, so none needed any text changes, only the identifiers
    themselves were wrong. No collision: none of the fixed names were
    already in use anywhere)
  - `plc` → `pla` (Place: found in `plcTarFun`
    (`onboarding/tour-runner.tsx`), fixed to `plaTarFun`; `pla` was
    already the established, heavily-used code for Place elsewhere in
    this codebase, e.g. `plaTipFun` (`help/mode.tsx`/`ui.jsx`),
    `plaGriFun` (`bg-flourish.tsx`), `plaThuFun` (`reminders.jsx`).
    Every comment referencing this function already spelled out
    "Place"/"placement" in full, so only the identifier itself was
    wrong. No collision: `plaTarFun` was not already in use anywhere.
    Searched the rest of the codebase for other `plc` instances and
    found none, so this one was an isolated fix rather than a
    multi-file sweep)
  - `stb` → `sta` (Stable: found in `stbFraNum`
    (`onboarding/tour-runner.tsx`), fixed to `staFraNum`; `sta` was
    already the established code for Stable/Standard/Standalone
    elsewhere in this codebase. Every comment referencing this
    variable already spelled out "Stable"/"stability" in full, so only
    the identifier itself was wrong. No collision: `staFraNum` was not
    already in use anywhere. Note `stb` itself also appears elsewhere
    in this codebase, in `onboarding/app-features.tsx` and
    `onboarding/picker-tours.tsx`'s own `stbBoo` (Scroll-To-Bottom, an
    initialism-compressed name, not an abbreviation of "Stable"), which
    is unrelated and correctly left untouched, a spelling coincidence
    rather than the same miscorrection)
  - `pik` → `pic` (Pick: found across 6 files: `pickers.ts` itself
    (`pikIteFun`/`pikRecObj`/`pikResObj`/`pikIdeStr`), `seed.ts`
    (`pikTimObj`, `pikLogArr`, `todPikArr`), `onboarding-seed-data.ts`
    (2 prose mentions of `pikIteFun`), `tab-settings.tsx` (`pikCouNum`,
    `plyPikFun`), `tab-data.tsx` (`pikIdeStr`), and `tab-today.tsx`
    (`newPikArr`, `pikNamSet`, `pikResObj`); `pic` was already the
    established, correct code for this exact word elsewhere in several
    of these same files (`weiPicFun` in `pickers.ts` itself, `picResObj`
    in `tab-picker.tsx`, `picCouNum` in `tab-picker.tsx`, `picIdeStr`
    used pervasively across `day-log.tsx`/`app.tsx`/`store.ts`/
    `onboarding/picker-tours.tsx`/etc.). Since `pik`→`pic` is a
    straight 1-for-1 letter swap, every renamed identifier stayed
    exactly the same length, so no column-alignment recalculation was
    needed anywhere. Every comment referencing these identifiers
    already spelled "Pick"/"Picked" out in full, so none needed text
    changes, only the identifiers themselves were wrong.
    **Two deliberate, documented exceptions were left as `pik`,
    unrenamed**, both a genuine collision against `pic` already meaning
    Picker in the exact same file: `seed.ts`'s own `curPikObj` (used
    throughout `buiTodFun`'s own today-row-building section, lines
    ~1071-1095 and ~1162, where the exact same function body ALSO reads
    a real `curPicObj` = Current Picker Object looked up from it,
    e.g. `const curPicObj = picByIdeObj[ curPikObj.pickerId ];`, a hard
    technical collision the user explicitly chose to resolve by leaving
    `curPikObj` exactly as-is rather than escalating segment 1's
    "Current" to an awkward `cuePicObj`); and `tab-today.tsx`'s own
    `curPikObj` (the loop variable iterating `newPicArr` at line 4415),
    left unrenamed by the same reasoning even though it does not sit in
    literal scope alongside a `curPicObj`, since this exact file already
    uses `curPicObj` = Picker dozens of times elsewhere and a lone
    differently-meaning `curPicObj` outlier would be a real readability
    trap on a file-wide search)
  - `chg` → `chr` (Charge/Charging: found in `chgUpdFun`
    (`pickers.ts`'s own ease-up/ease-down charge-application helper)
    and `chgFreBoo` (`tab-today.tsx`, a charging-card's own "just
    finished charging" fresh-cue flag), fixed to `chrUpdFun`/
    `chrFreBoo`. This did NOT use the literal first-3-letters `cha`:
    that code already carries a large, heavily-established meaning
    elsewhere in this codebase (Change, dozens of uses, e.g.
    `chaEveObj` throughout `ui/conditional-controls.tsx`/`app.tsx`/
    `cadence-control.tsx`), squarely the "heavy pre-existing overload"
    case from the Naming-conflict resolution section below, not the
    few-uses case documented as an ordinary multi-meaning segment.
    Phase A escalation on "Charge" (keep `Ch`, skip the normal 3rd
    letter, try the word's own 4th letter `r`) landed on `chr` with no
    further collision. Every comment referencing these identifiers
    already spelled "Charge"/"Charging" out in full, so none needed
    text changes, only the identifiers themselves were wrong)
  - `chg` → `cha` (Change/Changed: a separate, much larger
    miscorrection surfaced while checking the `chg`→`chr` fix above for
    collisions: `chgEveObj` (~40 instances across `tab-settings.tsx`,
    `tab-picker.tsx`, `tab-data.tsx`, `tab-today.tsx`), `chgIteArr`/
    `modChgBoo` (`store.ts`), `chgBoo` (`tab-data.tsx`), and
    `filChgBoo` (`tab-stats.tsx`, `tab-picker.tsx`), fixed to
    `chaEveObj`/`chaIteArr`/`modChaBoo`/`chaBoo`/`filChaBoo`. Unlike the
    Charge/Charging case just above, this one uses the literal
    first-3-letters `cha` directly, no escalation needed, since `cha`
    was already the established, correct code for this exact word
    elsewhere in this same codebase (`chaEveObj` already used
    throughout `ui/conditional-controls.tsx`/`app.tsx`/`cadence-control.tsx`,
    confirmed with no same-scope collision anywhere the sweep touched:
    `tab-picker.tsx`'s own pre-existing `chaEveObj` at line 131 sits in
    a completely separate function from every `chgEveObj` instance
    fixed there). Every comment referencing these identifiers already
    spelled "Change"/"Changed" out in full, so none needed text
    changes, only the identifiers themselves were wrong)
  - `ovr` → `ove` (Over: found in `ovrShoArr`/`minOvrNum`
    (`pickers.ts`'s own ease-up overshoot-compression block), fixed to
    `oveShoArr`/`minOveNum`; this is a distinct word from the `ovf`→
    `ove` (Overflow) and `ovl`→`ove` (Overlap) cases already documented
    above, `ove` now carrying a fourth meaning, the same "context
    disambiguates" reasoning already covering the other three. Only 2
    instances, both in this one file; no collision, `oveShoArr`/
    `minOveNum` were not already in use anywhere. Every comment
    referencing these identifiers already spelled "Overshoot" out in
    full, so none needed text changes, only the identifiers themselves
    were wrong)
  - `chs` → `cho` (Chosen: found in `chsIteObj` (`pickers.ts`'s own
    ease-down new-streak branch), fixed to `choIteObj`; `cho` was
    already the established, correct code for this word family
    elsewhere in this codebase, just for a different member of it
    (Choice, e.g. `choArr` in `tab-data.tsx`, `choResObj` in `pwa.ts`),
    so `cho` now carries a second, closely-related meaning (Choice vs.
    Chosen), disambiguated by context the same way as any other
    multi-meaning segment in this list. Only 1 instance, and no
    collision: `choIteObj` was not already in use anywhere. The
    comment already spelled "Chosen" out in full, so it needed no text
    changes, only the identifier itself was wrong)
  - `ok` → `oka` (Okay: a 2-letter abbreviation rather than the usual
    wrong-3-letter case, since "ok" is the common real-world shorthand
    people reach for, the same reasoning as the `id`→`ide` case
    earlier in this list; found in `askOkBoo` (`pwa.ts`) and `perOkBoo`
    (`tab-settings.tsx`), fixed to `askOkaBoo`/`perOkaBoo`, with each
    one's own comment updated from "Ask/Persist Ok Boolean" to
    "Ask/Persist Okay Boolean" since the old text was the abbreviation
    itself, not a full-word spelling that just needed the identifier
    fixed underneath it. No collision: `oka` was not already in use
    anywhere. **Not swept**: `Oklab`/`linOklFun`/`okLANum`/`okLBNum`/
    `okLLitNum`/`oklLinFun` (`store.ts`) also match a bare `ok`/`Ok`
    substring search, but none of them mean "Okay" at all; they name
    the real OKLab color space, an unrelated technical term that
    happens to share the same 2 letters, left untouched)
  - `shw` → `sho` (Show: found in `shwYeaBoo` (`reminders.jsx`),
    `shwAllBoo`/`shwConBoo`/`shwEntArr`/`shwPicArr`/`shwRemBoo`/
    `disShwBoo` (`tab-data.tsx`), `shwErrBoo`/`setShwErrBoo`
    (`tab-settings.tsx`), and `shwCheBoo`/`shwFeaBoo`/`shwFeaIntBoo`/
    `setShwFeaIntBoo`/`onbShwNorBoo` (`tab-today.tsx`), fixed across all
    4 files in one sweep; `sho` was already the established, correct
    code for this exact word in several OTHER identifiers in this same
    codebase (`shoSavBoo`/`shoDriBoo`/`shoWgtBoo` in `tab-picker.tsx`,
    `shoRemBoo` in `tab-stats.tsx`), so no escalation was needed, this
    was purely an inconsistent spelling of a word already spelled
    correctly elsewhere. Note `sho` is a heavily multi-meaning segment
    even before this fix, already carrying Should (`shoDedBoo` in
    `pickers.ts`, `shoPulBoo` in `onboarding/tour-runner.tsx`), Short
    (`shoPilNum` in `help/mode.tsx`), and Shown (`shoOrdRef`/`shoArr` in
    `tab-today.tsx`) alongside Show; a name's own surrounding context
    disambiguates which of the four "sho" stands for in practice, the
    same reasoning already used for `con`/`sta`/`per`/`fre`/`dow`
    elsewhere in this list. Every comment referencing these identifiers
    already spelled "Show" out in full, so none needed text changes,
    only the identifiers themselves were wrong. No literal-name
    collision in any of the 4 files: none of the corrected names were
    already in use anywhere)
  - `knd` → `kin` (Kind: found in `kndValStr`/`kndWorStr`
    (`reminders.jsx`) and `kndStr` (`tab-today.tsx`), fixed across both
    files in one sweep; `kin` was already the established, correct code
    for this exact word elsewhere in this codebase (`kinStr` in
    `tabs/settings/previews.tsx`), so no escalation was needed, this was
    purely an inconsistent spelling of a word already spelled correctly
    elsewhere. Every comment referencing these identifiers already
    spelled "Kind" out in full, so none needed text changes, only the
    identifiers themselves were wrong. No collision: neither `kinValStr`/
    `kinWorStr` nor `kinStr` (in `tab-today.tsx`'s own scope) was already
    in use anywhere)
  - `snp` → `sna` (Snapshot/Snap: found in `draSnpObj`/`snpOptRef`/
    `snpTasObj` (`reminders.jsx`), `curSnpObj`/`preSnpObj`/`snpIteObj`/
    `snpPicObj`/`snpTasObj` (`store.ts`), `snpIteObj`/`snpRef`
    (`tab-data.tsx`), and `ordSnpRef` (`tab-today.tsx`), fixed across
    all 4 files in one sweep; `sna` was already the established,
    correct code for this exact word in several OTHER identifiers in
    this same codebase (`genSnaObj` in `day-log.tsx`, `busSnaObj` in
    `state/tour-bus.ts`, `recSnaArr` in `reorder.ts`, `ediSnaRef`/
    `snaIteObj`/`iteSnaArr` in `tab-picker.tsx`), so no escalation was
    needed, this was purely an inconsistent spelling of a word already
    spelled correctly elsewhere; `tab-picker.tsx`'s own `snaIteObj` in
    particular already meant the exact same thing (a snapshot value
    passed to a revIteFun-style call) as the corrected `snpIteObj`
    instances. Every comment referencing these identifiers already
    spelled "Snapshot" out in full, so none needed text changes, only
    the identifiers themselves were wrong. No collision: none of the
    corrected names were already in use anywhere)
  - `cln` → `cle` (Cleanup/Clean: found in `clnDonBoo`/`clnDraFun`
    (`reorder.ts`, the latter also in its own `#region`/`#endregion`
    markers) and `clnFunArr`/`clnCurFun`/`curClnFun` (`tab-data.tsx`,
    `tab-picker.tsx`), fixed across all 3 files in one sweep; `cle` was
    already the established, correct code for this exact word in
    several OTHER identifiers in this same codebase (`ripCleTmo`/
    `ripCleFun`/`parCleTmo` in `tabs/settings/previews.tsx`, `clePicFun`/
    `cleTasFun` in `help/sample-data.ts`, `buiCleFun` in `seed.ts`),
    so no escalation was needed, this was purely an inconsistent
    spelling of a word already spelled correctly elsewhere;
    `tab-stats.tsx`'s own `cleFunArr` in particular already meant the
    exact same thing (an array of per-row cleanup functions) as the
    corrected `clnFunArr` instances. Every comment referencing these
    identifiers already spelled "Cleanup" out in full, so none needed
    text changes, only the identifiers themselves were wrong. **Not
    swept**: `seed.ts`'s own `'tk_drycln'` also matches a bare `cln`
    substring search, but it's a literal sample-task-id STRING VALUE
    (short for "dry cleaning"), not one of our own invented
    identifiers, so it was left untouched. No collision: none of the
    corrected identifier names were already in use anywhere)
  - `lop` → `loo` (Loop: found in `edgLopFun`/`edgLopNum`
    (`reorder.ts`, the former also in its own `#region`/`#endregion`
    markers); `loo` was already the established, correct code for this
    exact word elsewhere in this codebase (`looRafFun`/`looCanBoo` in
    `help/mode.tsx`, `entLooFun` in `onboarding-checklist.ts`), so no
    escalation was needed, this was purely an inconsistent spelling of
    a word already spelled correctly elsewhere. Every comment
    referencing these identifiers already spelled "Loop" out in full,
    so none needed text changes, only the identifiers themselves were
    wrong. No collision: neither `edgLooFun` nor `edgLooNum` was
    already in use anywhere)
  - `skp` → `ski` (Skip: found across 7 files: `seed.ts`
    (`skpRowArr`/`addSkpFun`/`skpDatObj`), `onboarding-seed-data.ts`
    (`skpRowObj`), `tab-settings.tsx`/`tab-today.tsx` (`skpSpyRef`,
    shared by both), `tab-picker.tsx` (`skpHolBoo`/`setSkpHolBoo`/
    `skpAutBoo`), `tab-today.tsx`'s own separate `skpAniMsNum`, and
    `onboarding/tour-runner.tsx` (`skpTouFun`); `ski` was already the
    established, correct code for this exact word in several OTHER
    identifiers across this same codebase (`skiBoo`/`skiIdeSet` in
    day-log.tsx, `skiLabStr`/`onSkiTouFun` in onboarding/intro-modal.tsx
    and onboarding/welcome-tour.tsx, `skiIdeStr`/`isaSkiBoo` in
    reminders.jsx, `skiCouMap` in tab-stats.tsx), so no escalation was
    needed, this was purely an inconsistent spelling of a word already
    spelled correctly elsewhere. Every comment referencing these
    identifiers already spelled "Skip" out in full, so none needed text
    changes, only the identifiers themselves were wrong. No collision:
    grepped every `ski`-prefixed identifier already in the codebase
    first and confirmed all of them already meant Skip, nothing else)
  - `wks`/`wek` → `wee` (Week: two distinct wrong spellings of the same
    word, both found only in `seed.ts`: `wksSinNum` (`buiConFun`, 4
    instances) and `wekAllArr`/`wekDayArr` (`buiPicFun`)/`wekIndNum`
    (`buiConFun`, sitting in the very same function as `wksSinNum`).
    `wee` was already the established, heavily-used code for this exact
    word elsewhere in this codebase (`weeValNum`/`firWeeNum` in
    cadence.ts/tasks.ts, `weeStaObj` in cadence.ts, `weeAgoNum`/
    `remWeeNum` in tab-stats.tsx, `WEE_ABB_ARR`/`weeSumFun` in ui.jsx,
    `weeSelArr` in reminders.jsx), so no escalation was needed, this was
    purely 2 inconsistent spellings of a word already spelled correctly
    elsewhere. Every comment referencing these identifiers already
    spelled "Week"/"Weeks"/"Weekly" out in full, so none needed text
    changes, only the identifiers themselves were wrong. No collision:
    seed.ts had no pre-existing `wee`-prefixed identifier of its own)
  - `tmo` → `tim` (Timeout: a very widely recurring miscorrection,
    found across 7 files: `idlTmoRef` (`store.ts`), `picPreTmo`
    (`tab-settings.tsx`), `ripCleTmo`/`parCleTmo`
    (`tabs/settings/previews.tsx`), `pulEndTmo`/`freTmoNum`/`feaIntTmoNum`/
    `celEndTmo`/`bmpEndTmo`/`purTmoNum`/`celTmoNum`/`alnTmoNum`
    (`tab-today.tsx`), `scrTmo`/`defDonTmo`/`kicOffTmo`
    (`tab-picker.tsx`), `focDelTmo` (`legal-docs.tsx`), and
    `exiEndTmo`/`entEndTmo` (`app.tsx`), fixed to their own `tim`
    equivalents across all 7 files in one sweep. `tim` was already the
    established, heavily-used code for this exact word in several OTHER
    identifiers across this same codebase (`cloTimRef`/`addTimRef` in
    reminders.jsx, `scrTimNum` in tab-data.tsx/reminders.jsx,
    `annTimNum` in ui.jsx), so no escalation was needed, this was purely
    an inconsistent spelling of a word already spelled correctly
    elsewhere; reminders.jsx's own pre-existing `freTimNum` in particular
    already meant the exact same thing (a fresh-cue clear timeout) as
    the corrected `freTmoNum` instance in tab-today.tsx. Note `tim` also
    already carries two other meanings in this codebase, Timestamp (`tsp`
    → `tim` above) and plain Time (e.g. `staTimNum` in ui.jsx), making
    this a third; context disambiguates which of the three "tim" stands
    for in practice, the same reasoning already used for `con`/`sta`/
    `per`/`fre`/`dow`/`sho` elsewhere in this list. Every comment
    referencing these identifiers already spelled "Timeout" out in full,
    so none needed text changes, only the identifiers themselves were
    wrong; since `tmo`/`tim` are both exactly 3 letters, every rename was
    a straight 1-for-1 substitution with no column-alignment
    recalculation needed anywhere. No collision: none of the corrected
    names were already in use in the same scope anywhere)
  - `stp` → `sti` (Stripped: found in `stpNamStr` (`store.ts`'s own
    `uniNamFun`), fixed to `stiNamStr`. This did NOT use the literal
    first-3-letters `str`: that code is the universal String
    type-segment used throughout this entire codebase, definitionally
    unusable for anything else, not just a "heavy overload" case.
    Phase A escalation on "Stripped" (keep `St`, skip the normal 3rd
    letter, try the word's own 4th letter `i`) landed on `sti` with
    only one existing use, `ONB_STI_ARR`'s own Initialism-compressed
    segment (Sample-Task-Identifiers, `onboarding-seed-data.ts`), a
    low-risk multi-meaning case since it's a different KIND of segment
    (an initialism, not a plain-word-truncation) sitting in a different
    position (a module-level export, not a local variable). The next 2
    escalation candidates were both worse: the word's own 5th/6th
    letters land back on `stp` itself, then a common vowel-drop spelling
    of Step (since fixed to `ste`, e.g. `advSteFun`/`bacSteFun`/
    `schSteFun`); the 7th letter `ste` is even more heavily used for Step
    elsewhere (30+ hits, `steCouNum`, `NumSteCom`, `curSteNum`, ...);
    the 8th letter `std` is already an established Known-miscorrections
    collision (Standard/Standalone) above. Every comment referencing
    `stpNamStr` already spelled "Stripped" out in full, so it needed no
    text changes, only the identifier itself was wrong)
  - `cnl` → `can` (Cancel: swept the OPPOSITE direction from the usual
    pattern in this list: found the MINORITY form, `cnl` (6 instances:
    `cnlRunBoo`/`cnlCnfFun` ×2/`cnlCreFun` in `tab-picker.tsx`,
    `cnlFrmFun`/`cnlImpFun` in `tab-settings.tsx`, plus the prop name
    `onCnlFun`), while the MAJORITY of this codebase's own
    "Cancel"-meaning identifiers already used `can` directly (~20
    instances across `store.ts`, `tab-data.tsx`, `tab-today.tsx`,
    `reminders.jsx`, `onboarding/page-tours.tsx`,
    `onboarding/tour-runner.tsx`, and `help/mode.tsx`, e.g. `canGroFun`,
    `canNewFun`, `canRenFun`, `canEdiFun`, `canPenFun`), fixed to
    `canRunBoo`/`canCnfFun`/`canCreFun`/`canFrmFun`/`canImpFun`/
    `onCanFun`. `can` was deliberately left unescalated even though it
    already carries 2 other established meanings (Candidate, e.g.
    `tarCanNum`/`curCanObj`; the verb "can"/is-able-to, e.g.
    `canInsFun`): the literal first-3-letters of "Cancel" already IS
    `can`, and this codebase's own overwhelming real-world usage (~20
    instances, all predating this fix) had already settled on it long
    before `cnl` ever appeared anywhere, so `can` now carries a third,
    easily-disambiguated meaning rather than `cnl` needing its own
    escalation. Checked for collisions before applying: none of the 6
    new names were already in use anywhere. Every comment referencing
    these identifiers already spelled "Cancel" out in full, so none
    needed text changes, only the identifiers themselves were wrong)
  - `done` → `don` (Done: the same "word wasn't truncated to its own
    literal first 3 letters" class as `boot`→`boo` above, not a
    3-letter-vs-4-letter miscorrection; found in `nowDoneBoo` (`store.ts`,
    18 instances across `cotAplFun`/`applyConditionalLog`/
    `stkRecFun`/the `togDonFun` action) and `wasDoneBoo`
    (`store.ts`, 3 instances in the `skiEntFun`-adjacent reminder-toggle
    action), fixed to `nowDonBoo`/`wasDonBoo`; `doneCouNum`
    (`tab-stats.tsx`'s own `couLevFun` parameter, self-contained, no
    external callers) fixed to `donCouNum`; and `doneCount`
    (`tab-today.tsx`'s own `GroHeaCom` component prop, whose
    destructuring already aliased it to the correct `donCouNum`
    internally, only the outward-facing prop key itself was wrong)
    fixed to `donCouNum` too, collapsing to shorthand destructuring and
    rippling into its own 3 call sites plus 2 comment mentions of the
    old prop name (`store.ts`, `onboarding/app-features.tsx`). `don` was
    already the established, heavily-used code for Done elsewhere in
    this codebase before this fix (`donCouNum`/`donNum`/`donIteNum`/
    `donNowFun`/`donValBoo` across `day-log.tsx`, `onboarding-
    checklist.js`, `reminders.jsx`, and `seed.ts`), so no escalation was
    needed. **Not a collision, deliberately left untouched at the
    time**: `TASKS.isDoneToday` (`tasks.ts`'s own exported namespace-
    object property, explicitly re-exporting the already-correctly-named
    `isaDonFun` under its own stable external key, since swept to
    `TAS_NAM_OBJ.isaDonFun` with the rest of that object, called from `store.ts`/
    `day-log.tsx`/`tab-today.tsx`/`reminders.jsx`) and the bare `done`
    field itself (the real, persisted property on every Today entry and
    pickLog row, e.g. `entry.done`/`curEntObj.done`) are both protected
    external contracts, not local identifiers, the same class of
    exemption already covering `pickLog`'s own field names elsewhere in
    this list. Every comment referencing the fixed identifiers already
    spelled "Done" out in full, so none needed text changes, only the
    identifiers themselves were wrong)
  - `cch` → `cac` (Cached/Cache: found in `cchStaObj` (`store.ts`'s own
    `loaStaFun`, 2 instances), fixed to `cacStaObj`; `cac` was already
    the established, heavily-used code for this exact word elsewhere in
    this codebase, e.g. `storage.ts`'s own `cacStaObj`/`cacStaFun`
    (~20 uses, including the very `STG_NAM_OBJ.cacStaFun()` call this
    fixed variable reads from) and `bg-flourish.tsx`'s own `floCacMap`,
    so no escalation was needed, this was purely an inconsistent
    spelling of a word already spelled correctly elsewhere. Every
    comment referencing this identifier already spelled "Cached" out in
    full, so it needed no text changes, only the identifier itself was
    wrong. No collision: `cacStaObj` was not already in use in the same
    scope)
  - `Jsn` → `Jso` (Json: found in `rawJsnStr` (`store.ts`'s own
    `loaStaFun`, 2 instances; `tab-today.tsx`, 3 instances), fixed to
    `rawJsoStr` across both files; `Jso` was already the established,
    correct code for this exact word elsewhere in this codebase, e.g.
    `storage.ts`'s own `rawJsoStr`/`jsoTexStr`, so no escalation was
    needed, this was purely an inconsistent spelling of a word already
    spelled correctly elsewhere. Every comment referencing these
    identifiers already spelled "Json" out in full, so none needed text
    changes, only the identifiers themselves were wrong. No collision:
    `rawJsoStr` was not already in use in either file's own scope)
  - `rsv` → `res` (Resolve/Resolved: found in `rsvPicIde`
    (`store.ts`'s own `migStaFun`, 2 instances; this instance ALSO had
    its own type-segment error, see the Two-word-single-segment
    compression section below for the full fix), fixed to `rspIdeStr`.
    `res` was already the established, correct code for this exact word
    elsewhere in this codebase, e.g. `app.tsx`'s own `resCusFun`/
    `resTheFun`/`palResObj`, so no escalation was needed for the word
    itself, this was purely an inconsistent spelling of a word already
    spelled correctly elsewhere. Note `res` already carries a second
    meaning in this codebase, Resize (`resObsObj` in `app.tsx`, a
    `ResizeObserver` instance); context disambiguates which of the two
    "res" stands for in practice, the same reasoning already used for
    `con`/`sta`/`per`/`fre`/`dow`/`sho` elsewhere in this list.)
  - `wgt` → `wei` (Weight: found across 4 files: `store.ts`'s own
    `wgtValNum` (8 instances spanning the conditional odds-migration and
    the ease-down fairness-weight calc), `tab-data.tsx`'s own
    `useWgtBoo` (4 instances), `tab-picker.tsx`'s own `wgtValNum`/
    `useWgtBoo`/`wgtTipStr`/`shoWgtBoo`/`setTypWgtFun`/`newWgtNum` (~23
    instances), and `tab-today.tsx`'s own `hasWgtBoo` (2 instances),
    fixed to `weiValNum`/`useWeiBoo`/`weiTipStr`/`shoWeiBoo`/
    `setTypWeiFun`/`newWeiNum`/`hasWeiBoo`. `wei` was already the
    established, heavily-used code for this exact word elsewhere in
    this codebase, e.g. `seed.ts`'s own `picWeiFun`/`totWeiNum`/
    `remWeiNum`, `ui/conditional-controls.tsx`'s own `useWeiBoo`, and even
    `store.ts`'s own `perWeiArr`/`curWeiNum` sitting just a few lines
    from one of the fixed `wgtValNum` instances, so no escalation was
    needed, this was purely an inconsistent spelling of a word already
    spelled correctly elsewhere. Every comment referencing these
    identifiers already spelled "Weight" out in full, so none needed
    text changes, only the identifiers themselves were wrong. No
    collision: none of the corrected names were already in use in the
    same scope anywhere)
  - `nrm` → `nor` (Normalize/Normalized: found in `nrmGroStr`/
    `nrmNamStr`/`nrmKeyStr`/`nrmOptObj` (`store.ts`, 4 instances each in
    the picker-tidy/group-remap section and `setOptFun`), fixed to
    `norGroStr`/`norNamStr`/`norKeyStr`/`norOptObj`. `nor` was already
    the established, heavily-used code for this exact word elsewhere in
    this codebase, e.g. `cadence-control.tsx`'s own `norCadFun`/
    `norCadObj`, and `norNamStr`/`norOptObj` in particular already
    existed with this exact meaning in `ui/conditional-controls.tsx`/
    `reminders.jsx`, so no escalation was needed, this was purely an
    inconsistent spelling of a word already spelled correctly
    elsewhere. Every comment referencing these identifiers already
    spelled "Normalized" out in full, so none needed text changes, only
    the identifiers themselves were wrong. No collision: none of the
    corrected names were already in use in the same scope anywhere)
  - `clm` → `cla` (Claimed: found in `preClmRef`/`clmNowBoo`
    (`tab-today.tsx`'s own streak-pulse effect) and `wasClmBoo`/
    `stkClmBoo` (`store.ts`'s own `stkRecFun`), fixed to `preClaRef`/
    `claNowBoo`/`wasClaBoo`/`stkClaBoo`; `clm` drops the word's own
    vowel the same way `cnl`/`cln` did elsewhere in this list, rather
    than taking its literal first 3 letters. Note `cla` already carries
    3 other meanings in this codebase (Clamp, e.g. `claValFun`; Clause,
    e.g. `tutClaStr`; Class, e.g. `extClaStr`), making this a fourth; a
    name's own surrounding context (every one of these sits right next
    to a `streakClaimed` read) disambiguates which "cla" stands for in
    practice, the same reasoning already used for `con`/`sta`/`per`/
    `fre` elsewhere in this list. Every comment referencing these
    identifiers already spelled "Claimed" out in full, so none needed
    text changes, only the identifiers themselves were wrong. No
    collision: none of the corrected names were already in use anywhere)
  - `fls` → `flu` (Flush: found in `runFlsFun` (`store.ts`'s own
    persistence-flush effect inside `useAppStaFun`), fixed to
    `runFluFun`; `flu` was already the established, correct code for
    this exact word elsewhere in this codebase, e.g. `storage.ts`'s own
    `fluSynFun` and `store.ts`'s own `fluStaFun`, so no escalation was
    needed. The comment already spelled "Flush" out in full, so it
    needed no text changes, only the identifier itself was wrong. No
    collision: `runFluFun` was not already in use anywhere)
  - `frs` → `fre` (Fresh: found in `frsEntArr` (`store.ts`'s own
    `setEntFun` action), fixed to `freEntArr`; `fre` was
    already the established, heavily-used code for Fresh elsewhere in
    this codebase (`isaFreBoo`, `freIndNum`, `freBoo`, ...), so no
    escalation was needed. Found in the same action as a second,
    separate miscorrection, `dsc` → `des` (Descriptor: `curDscObj`,
    fixed to `curDesObj`), whose `des` already appears as Description
    elsewhere (`desStr`, `desIdeStr`); context disambiguates which of
    the two "des" stands for in practice. Every comment referencing
    these identifiers already spelled "Fresh"/"descriptor" out in full,
    so none needed text changes. No collision: neither corrected name
    was already in use anywhere)
  - `nmd` → `nam` (Named: found in `nmdTasObj` (`store.ts`'s own
    `addTasFun` action), fixed to `namTasObj`; `nam` was already the
    established, heavily-used code for Name elsewhere in this codebase
    (`sibNamArr`, `uniNamStr`, `uniNamFun`, `finNamStr`, ...), and
    "Named" shares that same code, so no escalation was needed. The
    comment already spelled "Named" out in full, so it needed no text
    changes, only the identifier itself was wrong. No collision:
    `namTasObj` was not already in use anywhere)
  - `tdy` → `tid` (Tidied: found in `tdyNamStr` (`store.ts`'s own
    `renPicFun` action), fixed to `tidNamStr`; `tdy` drops the word's
    own vowel the same way `cnl`/`cln`/`clm` did elsewhere in this list,
    rather than taking its literal first 3 letters. The comment already
    spelled "Tidied" out in full, so it needed no text changes. No
    collision: `tid` was not already in use anywhere)
  - `cst` → `cus` (Custom: found in `curCstObj` (`store.ts`'s own
    `delHolFun` action), fixed to `curCusObj`; `cus` was already
    the established code for Custom elsewhere in this codebase (`resCusFun`,
    `cusColObj`, `addCusFun`), and `cst` drops the word's own vowel the same
    way `cnl`/`cln`/`clm`/`tdy` did elsewhere in this list. No collision:
    `curCusObj` was not already in use anywhere)
  - `opn` → `ope` (Open, found across a dozen `tab-data.tsx` names,
    e.g. `opnIdeStr`/`isaOpnBoo`/`onOpnSecFun`, fixed to `opeIdeStr`/
    `isaOpeBoo`/`onOpeSecFun`; `ope` was already the established code for
    Open elsewhere, e.g. `opeIdeStr` in `reminders.jsx`. Instances in
    `tab-picker.tsx` and `tab-settings.tsx` remain for their own reviews)
  - `drf` → `dra` (Draft, found across `tab-data.tsx`, e.g. `newDrfStr`/
    `isaDrfBoo`/`drfCrdRef`, plus the shared `conDrfFun` export from
    `ui/conditional-controls.tsx` and its `tab-picker.tsx` import, fixed to
    `conDraFun`. `tab-today.tsx`'s own `drfSooFun`/`drfLatFun`/
    `dayDrfFun` used `drf` for Drift instead, a different word whose
    literal first 3 letters are `dri`, fixed to `driSooFun`/`driLatFun`/
    `dayDriFun`)
  - A batch of vowel-drop spellings found together in one `tab-data.tsx`
    pass, each fixed to its word's literal first 3 letters: `ftr` → `foo`
    (Footer, `fooActFun`/`fooDisBoo`/`fooLabStr`/`fooTipStr`), `flp` →
    `fli` (Flip, `fliFirRef`/`groFliRef`), `flb` → `fal` (Fallback,
    `falEasObj`), `frz` → `fro` (Frozen, `froIndRef`, matching
    `reminders.jsx`'s own), `org` → `ori` (Original, `oriGroRef`), `son` →
    `soo` (Soonest, `sooValNum`), `rng` → `ran` (Range, `conRanFun`),
    `str` → `sta` (Start, `staAddFun`/`staNewFun`), `crt` → `cre`
    (Create, `disCreBoo`), `crd` → `car` (Card, `draCarRef`), `dsp` →
    `dis` (Display, `disIteArr`, matching `reminders.jsx`'s own
    `disTasArr`), `rdr` → `sho` (Rendered, `shoSecArr`, following the
    same "Shown" synonym `tab-today.tsx`'s own `rndOrdRef` resolved to,
    since `ren` reads first as Rename via `renPicFun`/`renIteFun`), and
    `blr` →
    `blu` (Blur, `bluEveObj`). `bst` → `boo` (Boost, `conBooFun`) joins
    `boo`'s existing Boost meaning (`booRouNum`). `nexIdsArr` also became
    `nexIdeArr`, since "Ids" is a plural spelling, not the segment `Ide`.
    `rel` → `rea` (Real, `isaRelBoo` → `isaReaBoo`, originally `realMode`;
    "Mode" was dropped rather than compressed into `ram`, since the value
    it's compared against already reads as a mode)
  - A second vowel-drop batch, found together in `tab-picker.tsx`'s own
    review, each fixed to its word's literal first 3 letters: `avd` → `avo`
    (Avoid), `bck` → `bac` (Back), `blk` → `blo` (Block), `bnd` → `ban`
    (Band), `cnf` → `con` (Confirm), `dft` → `dra` (Draft), `dly` → `dai`
    (Daily), `edt` → `edi` (Edit), `hlp` → `hel` (Help), `hlt` → `hig`
    (Highlight), `itc` → `int` (Intercept), `lev`/`lvg` → `lea` (Leaving),
    `mch` → `mat` (Match), `pfi` → `pre` (Prefill), `pld` → `pay` (Payload),
    `pnd` → `pen` (Pending), `ral` → `rai` (Rail), `rdy` → `rea` (Ready),
    `snd` → `sen` (Send), `srt` → `sor` (Sorted), `stg` → `sta` (Staged),
    `stp` → `ste` (Step), `vld` → `val` (Valid), `wlk` → `wal` (Walk),
    `wrp` → `wra` (Wrap), `wth` → `wit` (With), and `tdy` → `tod` where it
    meant Today (`sndTdyFun` → `senTodFun`; `tdy` meaning Tidy still goes
    to `tid`, e.g. `tidValStr`). `cnv` (Convert) couldn't take the literal
    `con`, which already carries 4 meanings, so Phase A escalation gave
    `cov` (`covDriFun`/`covLatFun`/`covSooFun`)
  - A third batch, found together in `tab-settings.tsx`'s own review, each
    fixed to its word's literal first 3 letters: `bra` → `bro` (Browser,
    `broNamStr`/`BRO_PAT_ARR`), `clk` → `cli` (Click, which recurred in
    `onboarding/tour-runner.tsx`'s own step fields, now `advCliStr`/
    `cliSelStr`, and in `help/mode.tsx`'s own `cliEveObj`/`cliCapFun`,
    and still has instances in `tab-data.tsx` and `tab-picker.tsx` for
    their own passes), `cpd` →
    `cop` (Copied), `drk` → `dar` (Dark), `jmp` → `jum` (Jump), `lnk` → `lin`
    (Link), `mnt` → `mou` (Mount), `ofs` → `off` (Offset), `ply` → `pla`
    (Play), `rch` → `rea` (Reached), `rdr` → `rea` (Reader), `sht` → `sho`
    (Short), `stk` → `sti` (Sticky), `stm` → `sta` (Stamp), `thm` → `the`
    (Theme), `tik` → `tic` (Tick), `viw` → `vie` (View), `whn` → `whe`
    (When), and `blb` → `blo` (Blob). Untruncated or too-short words were
    fixed the same way: `rail` → `rai`, `real` → `rea`, `rd` → `rea`
    (Read), `ul` → `lis` (List), and `apm` (AM/PM) became `mer`
    (Meridiem). Address keeps `adr` via Phase A escalation, since its own
    literal `add` already heavily means Add
  - A fourth batch, found together in `tab-today.tsx`'s own review, each
    fixed to its word's literal first 3 letters: `rng` → `rin` (Ring),
    `slt` → `slo` (Slot), `shn` → `sho` (Shown), `bst` → `bes` (Best),
    `hnd` → `han` (Handle), `tmr` → `tim` (Timer), `rdc` → `red`
    (Reduced), `bnd` → `bou` (Boundary), `rsn` → `rea` (Reason), `pmp` →
    `pro` (Prompt), `cfm` → `con` (Confirm), `psh` → `pus` (Push), `ext` →
    `exi` (Exit), `mn` → `mai` (Main), `Ns` → `Nam` (Namespace), and `eid`
    → `ide` (an entry's own Identifier). Arriving can't take its literal
    `arr` (Array/Arrow), so Phase A gave `ari`. Complete can't take
    `com`, and its Phase A candidates `cop`/`col` are equally loaded, so
    its synonym Full was used instead (`isaFulBoo`, `preFulRef`). Day-Off
    is a two-word "what", so it follows Two-word single-segment
    compression: `dao` (`daoCarArr`, `daoTitStr`), not the old `dof`
  This list grows every time a new instance is found; add to it rather
  than only fixing the one file where it turned up, since the same
  miscorrection reliably recurs in later files too.
- **True module-level constants** use `ALL_CAPS_WITH_UNDERSCORES` instead
  of camelCase, but still 9 letters across the 3 segments; underscores
  don't count toward that total (`TAB_OBJ_ARR` is Tab+Obj+Arr = 9 letters
  plus 2 separating underscores).
- **React components** get PascalCase (all 3 segments capitalized) but
  otherwise follow the same 9-character/3-segment rule, e.g. `TabBar` →
  `TabBarCom` (Tab+Bar+Component), the root `App` export → `AppRooCom`
  (App+Root+Component).
  - Renaming an exported symbol (a component, in particular) ripples to
    every file that imports it, e.g. renaming `App` also required
    updating `main.tsx`'s import and its `<App />` JSX usage. Check for
    other importers before committing to a rename like this.
- **TypeScript types** (decided 2026-10-05) get PascalCase like components
  and follow the same 9-character/3-segment rule, with `Typ` (Type) as the
  final segment, e.g. a type for one escape-stack entry is `EscEntTyp`
  (Escape+Entry+Type), so a type never reads like a value: an `escEntObj`
  holds an `EscEntTyp`. A shape is declared with `type` by default, and with
  `interface` only where it's required (extending a built-in such as
  `Window`, which merges only with an `interface`) or reads more logically.
  A name TypeScript or a library already defines (`Window`, `CSSProperties`,
  ...) is an external contract and stays as it is.
  - **Generic type parameters are exempt** (decided 2026-10-05): a type
    parameter is named `T`, the universal convention, so it reads as a
    type variable at a glance instead of passing for a real named type,
    e.g. `function useRcdDraFun< T extends { id : string } > ( rcdDatObj :
    T | null )` in `ui/record-draft.ts`. A second parameter, where one is
    ever needed, follows on alphabetically (`U`, then `V`).
  - **Type names are unique across the codebase** (decided 2026-10-05),
    even for a type private to its file, so a search for one always lands
    on exactly one declaration. The type added later is the one renamed.
    When its first segment is an acronym (a props type named by the
    acronym-reference rule), the clash escalates the way a two-word
    compressed segment does: keep the first and last letters, and replace
    the middle one with the next letter of the referenced name's second
    word, then its later letters in turn. E.g. `CodConCom`'s props would
    be `CccProTyp`, already `CadConCom`'s, so "Con" gives `o` and they
    became `CocProTyp`. Any other clash follows the usual
    Naming-conflict resolution.
  - **Documented like a variable**: a type gets the same one-line
    What/Why/How comment a variable does, expanding its name (`What:
    Escape Entry Type.`); a multi-line object type gets that comment on its
    opening line and one per field, the same as an object literal; and a
    type needing a longer design note gets the usual `/** ... */` block
    under "### Large / design-rationale comments".
- **Exemptions**: standard React/DOM convention names are left as-is,
  entirely exempt from the rule: `onChange`, `className`, `value` (a
  controlled component's own current value, always paired with
  `onChange` the same way a native `<input value=... onChange=...>`
  is, confirmed already left bare consistently everywhere this pairing
  is used in this codebase, e.g. `Segmented`, `SortSelect`,
  `CadenceControl`), `open` (a disclosure/collapse component's own
  expanded state, the same native boolean attribute convention as
  `<details open>`/`<dialog open>`, confirmed already left bare
  consistently across all 39 call sites of `Collapse`'s own `open` prop
  plus `DayLogChip`'s own `open`), `ref` (decided 2026-10-05: React only
  attaches a ref passed under that exact name, so a component that takes
  one destructures it as plain `ref`, the same way it destructures
  `className`; see `ui/button.tsx`'s own `ButBasCom`), and React's own
  hooks (`useState`, `useRef`, `useLayoutEffect`, `useEffect`,
  `useCallback`, ...).
- **Generic JS API-shape exemption**: separately from the React/DOM
  exemptions above, a hand-rolled object that deliberately mirrors a
  well-known, generic (non-React) API shape keeps that shape's own
  conventional method names bare too, the same reasoning as the
  React-convention exemptions just applied to a different convention
  family. Example: `state/tour-bus.ts`'s own `emlTouObj` is a minimal
  observable/store (the same shape as `Map`'s `get`/`set`, or a Redux
  store's `getState`/`subscribe`), so its own `get`, `set`, and
  `subscribe` properties stay bare rather than becoming e.g. `getFun`/
  `setFun`/`subFun`. This is judged case by case, same as any other
  "Undefined case" here, not a blanket exemption for the words "get"/
  "set"/"subscribe" wherever they appear (an unrelated local variable
  named `set` would still need the normal treatment).
- **"on"-prefix pattern**: a custom callback prop/handler that isn't the
  exact standard `onChange` keeps the "on" prefix (since "on" itself is
  standard convention) and applies the normal 9-character/3-segment rule
  to the rest of the name, for an 11-character total, e.g. `onToggleRail`
  → `onTogRaiFun` (on + Toggle + Rail + Function).
- **"set"-prefix pattern**: a `useState` setter function keeps the "set"
  prefix and reuses its paired state variable's own (already-renamed) name
  verbatim after it, for a 12-character total, e.g. the state variable
  `railOpen` → `raiOpeBoo`, so its setter `setRailOpen` → `setRaiOpeBoo`.
- **"use"-prefix pattern**: a local custom hook (one this codebase defines
  itself, as opposed to React's own exempted hooks) keeps the "use" prefix
  and applies the normal 9-character/3-segment rule to the rest of the
  name, for a 12-character total, the same mechanism as the "on"-prefix
  pattern above, e.g. `useFlourishItems` → `useFloIteFun` (use + Flourish
  + Items + Function).
- **`__`-prefix pattern**: a module-private variable that already uses a
  leading `__` (a plain JS convention marking "private to this module,"
  distinct from the `window.__thing` runtime-globals convention described
  under "Runtime globals on `window`") keeps the `__` prefix and applies
  the normal 9-character/3-segment rule to the rest of the name, e.g.
  `__paletteApplied` → `__palAppBoo` (Palette + Applied + Boolean).
- **Initialism compression for a "what" that genuinely needs more than 2
  words**: some concepts need 3 (or more) real words just to say what the
  value IS, before even getting to what specific aspect of it matters or
  what actual JS type it holds. Forcing that into the normal "1 truncated
  word per segment" scheme means either dropping words that were actually
  load-bearing, or letting a domain concept masquerade as the type segment
  even though it doesn't say what JS type the value actually is (which
  defeats the type segment's whole purpose: naming-conflict resolution
  and everything else relies on the last segment being an honest, real JS
  type). When this happens, compress every "what" word down to its own
  first LETTER (not first 3 letters) into one 3-letter initialism segment,
  freeing the other 2 segments for a genuine descriptor and a real type.
  Example: a variable holding the numeric id a scheduled `setTimeout` call
  returns, used to animate a theme cross-fade, has a 3-word "what" (Theme,
  Animation, Timeout) before even getting to what it specifically is (an
  Identifier) or what type it holds (a plain Number in a browser, not a
  string): `__theAniTmo` (the normal scheme, which lost "identifier" and
  used "Timeout" as a fake, non-revealing type segment) becomes
  `__tatIdeNum` (tat = Theme+Animation+Timeout initialism, Ide =
  Identifier, Num = the actual type).
  - **Comment expansion differs for an initialism segment**: since it
    doesn't correspond to one truncated word, spell out every word it
    stands for, hyphenated, in the same order, in place of the normal
    single-word expansion, then expand the remaining segments normally,
    e.g. `__tatIdeNum` → `What: Theme-Animation-Timeout Identifier
    Number.`
  - This is a last resort for the genuinely hard case, not a shortcut to
    reach for whenever 2 words feels like a squeeze; the normal "drop a
    less-essential word, keep 2 concepts + a real type" resolution from
    the base rule still applies whenever it doesn't lose something
    genuinely load-bearing.
- **Two-word single-segment compression**: a genuinely two-word "what"
  (not 3+, which uses the Initialism-compression rule above) that still
  needs to collapse into ONE 3-letter segment takes the first 2 letters
  of the first word plus the first letter of the second word, e.g.
  "Pick" + "Log" → `pil` (`Pi` from Pick, `l` from Log). This keeps more
  of the first word's own identity than a pure first-letter-each
  initialism would, while still fitting the standard 3-letter/
  9-character budget.
  - **Escalation**: if the base form collides (or is already heavily
    overloaded elsewhere), keep the first word's own 1st letter and the
    second word's own contributed letter both fixed, and escalate the
    MIDDLE character through the first word's own later letters (its
    own 2nd, 3rd, 4th, ... letters in turn) before touching the second
    word at all. Once the first word's own letters are exhausted, move
    to the second word's own contribution instead: replace its 1st
    letter with its 2nd, cycling back through every one of the first
    word's own middle-letter candidates again against that new final
    letter, then its 3rd letter, and so on. Example (`store.ts`'s own
    `__plSeqNum`, meaning "Pick-Log Sequence Number"): base `pil`
    (`Pi`+`l`) collides with `ui.jsx`'s own heavily-established `pil` =
    Pill (`PilTagCom`, `pilIdeStr`, ... 14 uses); escalating the middle
    letter through "Pick"'s own later letters gives `pcl` (Pick's own
    3rd letter, `c`) next, which came back clean, so `__plSeqNum` became
    `__pclSeqNum`. Had `pcl` also collided, the next candidate would
    have been `pkl` (Pick's own 4th and last letter, `k`), then, once
    Pick's own letters are exhausted, `pio`/`pco`/`pko` (cycling the
    middle letter again, now against Log's own 2nd letter, `o`, instead
    of its 1st, `l`), then `pig`/`pcg`/`pkg` against Log's own 3rd
    letter `g`, and so on. A second example, this time actually needing
    2 escalation steps (`store.ts`'s own `__clSeqNum`, "Conditional-Log
    Sequence Number"): base `col` (`Co`+`l`) collides with 3 separate
    established meanings across this codebase at once (Color, e.g. this
    same file's own `hexColStr`/`invColFun`; Column, e.g.
    `bg-flourish.tsx`'s own `colIndNum`/`colCouNum`; Collapse, e.g.
    `ColDisCom`/`conColBoo`), so escalating the middle letter through
    "Conditional"'s own later letters was tried first: its own 3rd
    letter gives `cnl`, which turned out to already mean Cancel
    (`cnlCnfFun`, `onCnlFun`, ...), so escalation continued to
    "Conditional"'s own 4th letter, `cdl`, which came back clean, so
    `__clSeqNum` became `__cdlSeqNum`.
  - A third example, this time the compressed segment sitting as
    segment 1 of a genuinely 3-concept name rather than standing alone
    (`store.ts`'s own `rsvPicIde`, meaning "Resolved Picker Identifier",
    which ALSO had its own type-segment error: `Ide` isn't a real JS
    type, so it was misplaced as segment 3 instead of the actual type,
    `Str`, matching the same "an item's pickerId is always a string or
    null" shape as every other `xxxIdeStr` in this file): 3 real
    concepts (Resolved, Picker, Identifier) plus a real type (String)
    is one concept too many for 2 segments + type, so "Resolved" and
    "Picker" compress together (`Re`+`p` = `rep`), freeing "Identifier"
    to stay its own normal segment (`Ide`) and `Str` to be the real
    type. Base `rep` triggers the "heavy pre-existing overload" case
    from the general Naming-conflict-resolution section below rather
    than a literal collision: it's already used dozens of times for
    Repeat (`repTokNum`, `curRepStr`, `repCopObj`, ...) and separately
    for Report (`staRepFun`), so adding a third meaning was escalated
    instead of accepted as an ordinary multi-meaning segment. Escalating
    the middle character through "Resolved"'s own later letters (`e`
    already used, try its 3rd letter, `s`) gives `rsp`, which came back
    clean, so `rsvPicIde` became `rspIdeStr`.
  - **Comment expansion** matches the Initialism-compression segment
    above: since the segment doesn't correspond to one truncated word,
    spell out both words it stands for, hyphenated, in place of the
    normal single-word expansion, then expand the remaining segments
    normally, e.g. `pclSeqNum` → `What: Pick-Log Sequence Number.`
- **Dropping a domain-context word an exported function's own import path
  already conveys**: a function that needs 3+ real words (a verb plus a
  multi-word target) can drop a word that names the whole MODULE's own
  domain, rather than compressing everything into an initialism, when
  every real caller already sees that context for free at the import
  site (`import { sedPicFun } from './help-sample-data.js'` already says
  "this is help-mode sample data" before the function's own name has to
  say it again). This is judged case by case like any other resolution
  here, not a blanket license to drop context: it only applies to a word
  that's redundant with the DEFINING FILE's own name/purpose, never to a
  word that distinguishes this function from a sibling in the SAME file.
  Example: `help/sample-data.ts`'s own `seedHelpPickers`/`clearHelpPickers`/
  `seedHelpTasks`/`clearHelpTasks`/`unhideHelpStatsHistory`/
  `hideHelpStatsHistory` each had a verb, "Help", and a 1-2 word target
  (Pickers/Tasks/Stats+History): 3-4 real concepts, one segment too many.
  "Help" was dropped from every one of them (redundant with the file
  they're all defined in and imported from), and the History pair's own
  "Stats" was dropped too (redundant with "History" in context), giving
  `sedPicFun`/`clePicFun`/`sedTasFun`/`cleTasFun`/`unhHisFun`/`hidHisFun`.
  "Seed" itself needed its own separate escalation (see the general
  Naming-conflict resolution below) once truncated: literal `See`
  collides in MEANING with `tab-picker.tsx`'s own already-established
  `see` = Seen (`seeGroArr`/`seeModSet`), so Phase A's own "keep first 2
  letters, escalate the 3rd character" landed on `Sed` (seed's own 4th
  letter) instead.
- **Under-length first-word padding**: the opposite problem from
  initialism compression: some segment 1 words are naturally SHORTER
  than 3 letters (e.g. "is", for a boolean naturally phrased "is
  <adjective> <noun>"). Pad the word with the fewest extra letters
  needed to reach exactly 3, chosen so the padded segment still reads
  as a short natural phrase rather than an arbitrary truncation. The
  reference case is "is": pad with an "a" to get `isa` (reading "is
  a"/"is an" depending on what follows), e.g. `isBigBoo` →
  `isaBigBoo`, `isOutBoo` → `isaOutBoo`. This is a case-by-case
  resolution, not a general algorithm; document each new instance here
  as it's encountered rather than inventing a fresh padding scheme each
  time.
  - **Comment expansion**: since the padded segment doesn't correspond
    to one truncated word, expand it the same way an initialism segment
    is expanded above: spell out the full grammatical phrase it stands
    for, hyphenated, in place of the normal single-word expansion, then
    expand the remaining segments normally. For `isa`, choose "Is-A" or
    "Is-An" based on whether the word immediately after it in the
    comment starts with a vowel sound: `isaBigBoo` → `What: Is-A Big
    Boolean.`, `isaOutBoo` → `What: Is-An Outer Boolean.` ("Outer"
    starts with a vowel sound, so "An").
- **Under-length segment 2 word: resolve by real behavior, not padding**:
  the same under-length problem can hit segment 2 (the descriptor)
  instead of segment 1, and padding a 2-letter preposition like "on"
  with a filler letter (there is no natural "on" + 1-letter word the
  way "is" + "a" reads as "is-a") doesn't produce anything readable.
  Instead, pick a different, real 3-letter word that describes what the
  field actually DOES, the same reasoning already used to name
  `clickSel`/`pulseSel`'s own "Sel" segment after the value's real
  shape (a selector) rather than its literal old name. Example:
  `onboarding/tour-runner.tsx`'s own `advanceOn` field (a selector
  where a real click ALSO counts as clicking Next) has "Advance" +
  "On" as its literal two words, but "On" is only 2 letters; since the
  field is fundamentally about a CLICK counting as advancing, it
  became `advCliStr` (Advance + Click + String) instead, kept
  distinct from the separate `advanceWhen`/`advSelStr` field (which
  polls for a selector to exist, not a click) by using "Sel" there
  instead for the same "value is a selector" reasoning.
  - **A second instance, this time the under-length word being a
    complete word rather than a preposition**: `reorder.ts`'s own
    `onUpPoiFun` (the "on"-prefix pattern's own pointerup/pointercancel
    handler) had "Up" as its literal segment 2, a genuine, complete
    2-letter English word rather than a truncation, so there was no
    natural single-letter padding to reach for either (unlike `is`'s own
    `isa`, nothing reads naturally as "up" + 1 letter). The function
    handles BOTH `pointerup` and `pointercancel`, and its own JSDoc
    already described it as "the handler that ends the gesture," so two
    real-word candidates were considered: `End` (matching that JSDoc
    language) was rejected because this same file already has a
    differently-shaped `onEndDraFun` (the caller's own optional
    lifecycle callback) sitting right next to where this function is
    defined, and `onEndPoiFun` beside `onEndDraFun` would misleadingly
    suggest they're the same kind of thing. `Rel` (Release) was chosen
    instead, the more literal, precise word for what the handler
    actually captures (the pointer being released, whether by lifting
    it or having the gesture cancelled out from under it), giving
    `onRelPoiFun`. `rel` already appears in `pwa.ts` meaning "Related"
    (`relInsBoo`, `proRelFun`), an unrelated word sharing the same
    3-letter code, the same acceptable multi-meaning-segment pattern
    already documented for `con`/`sta`/`per`/`fre`/`dow`/`sho` elsewhere
    in this list. No literal identifier collision: `onRelPoiFun` was not
    already in use anywhere in the file or the wider codebase.
- **An axis letter (X/Y) in a name becomes its own full segment,
  `Xco`/`Yco` (X-Coordinate/Y-Coordinate)**: a variable or object
  property holding a position, offset, or amount along one axis uses
  `Xco` or `Yco` as a normal 3-letter segment, never a bare `X`/`Y`
  letter, e.g. `preXcoNum` (Previous X-Coordinate Number), `difXcoNum`
  (Difference X-Coordinate Number), never a bare-letter `preXNum`. The
  `What:` expansion hyphenates it like an initialism segment:
  `X-Coordinate`. A variable keeps the usual 9-character shape; an
  object property follows the "Axis qualifier" bullet under the object
  property naming rules below (e.g. `padXcoNum`).
- **No unused positional parameters**: a parameter that exists only to
  reach a later one (e.g. `Array.from`'s own element argument, always
  `undefined` when mapping over `{ length : n }`) is never left in
  place, whether as a bare `_` placeholder or a named-but-unread
  parameter, since a future TypeScript migration would flag it as
  unused. Restructure the call so the value actually needed arrives
  first instead, e.g. `tab-data.tsx`'s own `Array.from( Array( 31
  ).keys(), ( arrIndNum ) => arrIndNum + 1 )`, where `keys()` yields
  the indices as the values themselves. Only when no such restructure
  exists does the parameter stay, named like any other parameter.
  The same goes for a `useState` value that is never read (kept only so
  its setter can force a re-render): bind the setter alone with an
  elision, `const [ , setPwaTicNum ] = React.useState( 0 );`, rather
  than naming an unread value (`tab-settings.tsx`).
- **Comparator parameters use `One`/`Two`, never `a`/`b` prefixes**: a
  sort comparator's own two parameters are named like any other pair of
  same-kind values, with `One`/`Two` as segment 2, e.g. `cadence.ts`'s
  own `dowOneNum`/`dowTwoNum` and `tab-data.tsx`'s own `conOneObj`/
  `conTwoObj`, not `aConObj`/`bConObj`.
- **Acronym-reference rule**: when a name describes or refers to another
  named thing (a component, function, etc.), its own first segment is
  built from the first letter of *that* thing's own three segments,
  instead of inventing a fourth truncated word, e.g. a boolean describing
  whether `TabBarCom` itself (Tab+Bar+Com) is a ghost copy becomes
  `tbcGhoBoo` (tbc from Tab/Bar/Com + Ghost + Boolean).
- **Naming-conflict resolution** (rare: only when the standard first-3-
  letters rule would produce a 9-character name that collides with an
  already-in-use name elsewhere). Segment 3 (the type segment) is never
  touched by this: it's standard and always stays as the literal first 3
  letters of the type word, to avoid confusion about what type a variable
  is. Only segments 1 and 2 are ever adjusted, trying segment 1's word
  first and then segment 2's, using this escalating two-phase search:
  - **Phase A**: keep the segment's first 2 letters, skip its normal 3rd
    letter, and escalate which LATER letter fills the segment's 3rd
    character: try the word's 4th letter; if the name still collides, try
    the 5th letter, then 6th, and so on, one letter further each time. If
    the word is too short to reach a next letter before the collision
    resolves, stop escalating this segment and restart Phase A on segment
    2's word instead (only if segment 1 was the one just tried).
  - **Phase B**: only reached if Phase A ran out on both segments 1 and 2
    without resolving the collision. Restart from segment 1 with a
    different skip pattern: keep the word's 1st letter, skip its 2nd
    letter, and escalate the segment's 3rd character starting from the
    4th letter: try `[1st letter, 3rd letter, 4th letter]`; if it still
    collides, try `[1st letter, 3rd letter, 5th letter]`, then 6th, and so
    on. If segment 1's word runs out again, move to segment 2's word and
    repeat Phase B on it.
  - A segment whose word is too short even for a phase's first attempt
    (e.g. a 3-letter word has no 4th letter to skip to) contributes
    nothing in that phase and is simply skipped in favor of the other one.
    In the near-impossible case Phase B also exhausts both segments 1 and
    2, fall back to choosing a different word entirely for one of them and
    reapply the normal rule.
  - **Heavy pre-existing overload, not just a literal collision**: this
    same escalation also applies when a word's own literal first-3-
    letters truncation is technically correct and doesn't collide with
    any single specific in-scope name, but that exact 3-letter code
    already carries a large, heavily-established meaning elsewhere in
    the codebase (a handful of uses is fine and gets documented as an
    ordinary multi-meaning segment instead, like `con`/`sta`/`app`/
    `pla`/`rem`/`pat`/`per` elsewhere in this list; this is for the
    dozens-of-uses case). Example: `day-log.tsx`'s own icon-lookup
    property for a clock glyph would literally truncate to `clo`, but
    `clo` already means "Close" in dozens of other identifiers
    throughout this codebase (`cloAddFun`, `cloTimRef`, `onCloConFun`,
    ...); rather than adding an eleventh meaning to an already-loaded
    code, it was escalated via Phase A to `clcEle` instead, keeping
    `clo`'s own meaning unambiguous everywhere else.
  - **When even the escalation letters collide, pick a different word
    entirely rather than force one through**: `tab-today.tsx`'s own
    `rndOrdRef`/`rndArr` (holding the group order actually rendered to
    the DOM, so a drag-drop's own DOM-position indices can be resolved
    against it) truncated Rendered to the common `rnd` abbreviation
    instead of `rendered`'s own literal first 3 letters, and every
    Phase A escalation candidate for "Rendered" (`red`, `ree`, `rer`,
    the word's only 3 distinct later letters) already meant Reduced
    (`redMotBoo`), Reel (`LoaReeCom`), and Reroll (`onRerFun`)
    respectively, all in this exact same file. Rather than force
    through one of those (or Phase B's own literal answer, which
    happened to land back on `rnd` itself), the word was replaced
    entirely with its own close synonym "Shown" (`sho`, already an
    established, unambiguous code elsewhere in this codebase and not
    used anywhere in this file), giving `shoOrdRef`/`shoArr`.
- **`id` attributes** follow the same 9-character/3-segment rule as any
  other name, but segment 3 (the "type" segment) describes what KIND OF
  THING the id labels (the element/role it identifies) rather than the
  JS data type of the string holding it. Example: the SVG `<clipPath>`
  that clips the nav brand-mark's glyph path to its rounded-square badge
  → `braMarCli` (Brand + Mark + Clippath). This names the id VALUE
  only; a JS variable holding that value is an ordinary variable and
  follows the normal rule with a real type segment, e.g. `bmcIdeStr`
  (Brand-Mark-ClipPath Identifier String, an Initialism-compression
  case), referenced via `clipPath={ \`url(#${ bmcIdeStr })\` }` on the
  path it clips.
  - When a component can render more than one live instance of itself at
    once (e.g. `TabBarCom` mounts a second "ghost" copy of itself during
    the nav placement-switch animation, gated by its own `tbcGhoBoo`
    prop), a static id shared by both instances is a real bug: ids must
    be document-unique, and a duplicate means `url(#id)` only ever
    resolves to whichever instance is first in the DOM. Compute the id
    once as a local variable and append a `--` + 3-letter modifier
    segment (same truncation rule as the base name, e.g. `--gho` for
    "ghost") when the condition that causes duplication is true:
    ```
    const bmcIdeStr = `braMarCli${ tbcGhoBoo ? '--gho' : '' }`;
    ```
    Reference that variable everywhere the id is needed (both the
    defining element's `id` and every place that reads it back via
    `url(#...)`) rather than recomputing or restating the ternary each
    time, so the definition and every reference can never drift apart.
  - The same `--` modifier also keeps a repeated element's id unique
    across DIFFERENT components that render the same markup onto the
    page together, e.g. every tab header's own copy of the logo, which
    sits on screen alongside the nav's own unmodified `braMarCli`: each
    tab uses its own 3-letter modifier (`braMarCli--dat`, `--pic`,
    `--set`, `--sta`, `--tod`). A literal id is fine when only one
    instance of that component can ever exist, no variable needed.
  - **Exception, an id that's a navigation target** (decided 2026-10-07):
    an id that in-page links jump to (`href='#contact'`), and so appears in
    the page's URL (`/#contact`), keeps its plain, readable name instead of
    the 9-character form. A visitor can bookmark or share that URL, so the
    id is an external contract, the same reasoning that exempts CSS property
    names in a `style` object. Its element's comment says it's kept as is
    for that reason. Every other id on the page (a label's `htmlFor`
    target, an SVG pattern, a mount point) still follows the normal rule.
    See reese-roofing's section anchors `top`, `services`, `about`, and
    `contact`.
- **Object property names** follow the same naming rule as everything
  above, but are only 6 characters: they drop the middle "descriptor"
  segment and keep just segment 1 (what it is) + segment 3 (type), each
  still strictly the first 3 letters of its word. Example: `TAB_OBJ_ARR`'s
  own entries: `id` → `ideStr` (Identifier + String), `label` → `labStr`
  (Label + String), `icon` → `icoStr` (Icon + String). Every place that
  reads the property (e.g. `tabConObj.ideStr`) must be updated to match
  when a property is renamed this way, same as any other rename.
  - **Naming-conflict resolution for properties**: with only 2 segments
    (6 characters) instead of 3, conflicts are more likely. The type
    segment (segment 2 here) is protected exactly like segment 3 is for
    the general rule, never touched. Only segment 1's word is ever
    escalated, using the same two-phase search as the general rule's
    Phase A/Phase B (Phase A: keep the first 2 letters, escalate the 3rd
    character through the word's 4th, 5th, 6th, ... letters; Phase B, only
    if Phase A exhausts: keep the 1st letter, skip the 2nd, escalate the
    3rd character through the 4th, 5th, 6th, ... letters). Since there's
    no second segment to fall back to this time (there's nowhere else for
    the escalation to move to), if Phase A and Phase B both exhaust
    without resolving the collision, stop and ask the user what to do;
    don't guess a different word unprompted the way the general rule's
    final fallback does.
  - **Axis qualifier**: some properties are inherently a base concept
    PLUS an axis (X vs Y being the common case). The axis becomes its own
    full segment, `Xco`/`Yco` (X-Coordinate/Y-Coordinate), placed after
    the truncated base word and before the type segment, breaking the
    strict 6-character count up to the full 9, the same way the
    Full-word variant below does, e.g. a catalog item's own
    horizontal/vertical highlight-padding override in `help/content.tsx`
    is `padXcoNum`/`padYcoNum` (Pad + X-Coordinate/Y-Coordinate +
    Number). This is the same `Xco`/`Yco` segment variables use (see the
    axis-letter rule in the general naming rules above); it replaced an
    earlier single-letter form (`padXNum`/`padYNum`).
  - **Full-word variant of the same exception**: the identical reasoning
    applies when the second concept IS a genuine truncatable word rather
    than a bare axis letter, e.g. a per-side padding amount needing
    "which side" (Top/Bottom/Left/Right) alongside "this is padding" and
    a real type. Truncate that word to its own normal 3 letters (same as
    any other segment) and keep the type segment too, breaking the
    6-character budget up to the full 9 rather than dropping the type
    segment to force a fit. E.g. `help/geometry.ts`'s own `claPadFun` return
    shape became `padTopNum`/`padBotNum`/`padLefNum`/`padRigNum` (Pad +
    Top/Bot/Lef/Rig + Number), not a 6-char `padBot`/`padLef`/`padRig`
    missing a type segment entirely, and not a bare `topNum`/`botNum`/
    `leftNum`/`rigNum` dropping "Pad", which would have collided in
    MEANING (not literal spelling) with the same object's own unrelated
    `top`/`left`/`right`/`bottom` rect-edge fields (kept bare under the
    `style={{...}}` exemption below); losing "Pad" would make it
    genuinely ambiguous which of the two a bare `topNum` referred to.
    This full-word variant conveniently often already matches whatever
    a reading local variable independently converged on naming itself
    (see the "Third exemption, an object whose properties get
    destructured into local variables" bullet below), worth checking for that kind of existing convergence before
    picking a name, since matching it removes any rename at the read
    site entirely.
  - **Exemption**: this rule only applies to an object whose property
    names are entirely OUR OWN invention: both the write site and every
    read site are code we control, so renaming is free (e.g. the
    `{ heiNum, lefNum, topNum, widNum }` shape `setIndRecObj` builds and
    `indRecObj.lefNum`/etc. reads back, all private to `TabBarCom`). An
    object whose keys are constrained by an external contract is exempt
    entirely: most commonly a `style={{ ... }}` object, whose keys must
    stay as real camelCase CSS property names (`strokeWidth`, `transform`,
    ...) because React passes them straight through to the DOM; renaming
    those would silently break rendering, not just look different. The
    test is always "do I control every reader of this key," not merely
    "is this an object I wrote."
  - **Second exemption, an exported namespace object's own properties**:
    this 6-character rule does not apply to the property names of an
    EXPORTED namespace object either (`STORAGE`, `PICKERS`, `TAS_NAM_OBJ`,
    `CAD_NAM_OBJ`, `ONB_CHE_OBJ`, ...). See "Exported namespace objects"
    below for the fuller rule, but in short: each property should just
    reuse the already-named 9-character internal function/constant's own
    real name directly as its external key, rather than compressing it
    down to 6 characters. The whole point of a namespace object is so a
    consuming file can trace `SomeObj.propName` straight back to the
    exact internal implementation it's calling; a separately-compressed
    6-char key would just be a second, different abbreviation of the same
    concept, adding a translation step for zero benefit. This is the
    standard, default practice for this category of object, not a rare
    exception; apply it to every exported namespace object, not only the
    ones already swept this way.
    This also covers an object that plays the same role without being
    exported directly, e.g. a hook's own returned actions object passed
    down as a prop and called by name across many files (`store.ts`'s own
    `actStoObj`). When its values are inline functions with no internal
    names to reuse, each key is written as a full 9-character name under
    the normal naming rules, the same as if it had an internal
    implementation of its own.
  - **Third exemption, an object whose properties get destructured into
    local variables**: when a reader destructures one of our own objects
    (`const { a, b } = someFun();`), every binding it creates is a real
    local variable, and local variables always follow the full
    9-character/3-segment rule. Giving such an object normal 6-character
    keys would force every reader to alias each one back to a 9-character
    name (`const { claBoo : stkClaBoo, stkNum : stkValNum } = ...`), a
    second name for the same value at every read site. Instead, the
    object's own keys use the full 9-character name the reading local
    variable would get anyway, so every reader can use plain shorthand
    destructuring (`const { stkClaBoo, stkValNum } = ...`) with nothing to
    translate. This applies whenever at least one reader destructures the
    object; a reader that uses dot access instead (`resObj.stkValNum`)
    works just as well with the longer key, so a mix of both reader styles
    still follows this exemption. It only covers objects whose keys are
    entirely our own invention (the same "do I control every reader of
    this key" test as the first exemption above); an externally
    constrained key stays exactly as it is, and a destructuring reader
    aliases it instead. An object read only through dot access, never
    destructured, keeps the normal 6-character keys. See `store.ts`'s own
    `stkSynFun` for the reference example: its `{ stkClaBoo, stkValNum }`
    return shape matches the local variables of the same names inside the
    function itself, and each of its 4 callers destructures it with
    shorthand, then writes the persisted `streak`/`streakClaimed` state
    keys out explicitly (`streak : stkValNum`). Earlier precedents
    reached the same result before this bullet existed: `group-header.tsx`'s
    own `GroHeaCom` prop key `doneCount` became `donCouNum` so its own
    destructuring could collapse to shorthand, and `help/geometry.ts`'s own
    `claPadFun` return shape (`padTopNum`/`padBotNum`/...) matched the
    reading local variables' own names.
    - **Large, externally constrained argument objects are read, not
      destructured**: when a function receives an object whose keys it
      can't rename (most commonly because callers pass real persisted
      records straight in, e.g. a whole sample picker) and it would
      otherwise destructure many of those keys, it takes the object as
      ONE named parameter instead and reads each field by property
      access (`picArgObj.name`, `picArgObj.mode`, ...), rather than
      aliasing every key to a 9-character local in the destructuring
      pattern. This keeps the external key visible at every read, needs
      only one new name, and can't drift out of sync the way a long
      alias list can. Default parameter values move to where each field
      is read, written as an explicit `=== undefined ? <default> :
      <value>` check so they keep default-parameter semantics exactly
      (`??` would also replace `null`, which a default parameter never
      does); a default the callee already applies itself can simply be
      dropped. A single field read many times may still get one plain
      local (`const newConObj = picArgObj.newConditional;`). A short
      destructuring with only a couple of constrained keys can still
      alias them in place instead, whichever reads more clearly. See
      `store.ts`'s own `addPicFun`/`savEdiFun` (`picArgObj`) for
      the reference example.
- **Exported namespace objects must use explicit `originalName :
  internalName` mapping, never JS shorthand `{ internalName }`.** A
  domain module's public API (`STORAGE`, `PICKERS`, `TAS_NAM_OBJ`,
  `HOL_NAM_OBJ`, `NOT_NAM_OBJ`, ...) keeps its own
  ORIGINAL external property names stable while every internal
  implementation gets renamed to the 9-char scheme. Writing the export
  as shorthand (e.g. `export const X = { perCheFun, askOncFun }`)
  silently renames the external API to match the internal names
  instead, since shorthand's key IS the internal name; this has caused
  two separate live production outages (`holidays.ts`'s `HOL_NAM_OBJ`
  and `notify.ts`'s `NOT_NAM_OBJ`, both caught only after a real page
  went blank/threw in the browser). Before finishing any file that
  exports a namespace object, grep every other file for
  `<ObjectName>\.` to enumerate every property name actually called
  externally, then verify the export object explicitly maps EACH one
  (`realName : internalName`), never bare.
  - **Standard practice (not a rare exception): sweep the external
    property names to match their internal implementation exactly.**
    `cadence.ts`'s own `CAD_NAM_OBJ` (originally `CADENCE`),
    `conditionals.ts`'s own `CON_NAM_OBJ` (originally `CONDITIONALS`),
    `notify.ts`'s own `NOT_NAM_OBJ`, `onboarding-checklist.ts`'s own
    `ONB_CHE_OBJ`, `pickers.ts`'s own `PIC_NAM_OBJ` (originally
    `PICKERS`), `pwa.ts`'s own `PWA_NAM_OBJ` (originally `PWA`), and
    `reorder.ts`'s own `REO_NAM_OBJ` (originally `REORDER`), and
    `tasks.ts`'s own `TAS_NAM_OBJ` (originally `TASKS`) all
    deliberately swept their external property names to
    match their internal implementation exactly (e.g. `normalize` →
    `norCadFun`, `isCadence` → `isaCadFun` for the first; `cardComplete`
    → `carComFun`, `advanceOnCompletion` → `advValFun` for the second;
    `permission` → `perCheFun`, `subscribe` → `subAddFun`, `askOnce` →
    `askOncFun`, `request` → `reqPerFun`, `generated` → `genNotFun` for
    the third; `entryFor` → `entLooFun`, `items` → `cheIteArr`,
    `othersRemaining` → `othRemFun`, `readyToGenerate` → `reaGenFun`,
    `realPickerCount` → `reaPicFun`, `status` → `cheStaFun`,
    `tutorialsInProgress` → `tutProFun` for the fourth; `pick` →
    `picIteFun`, `readiness` → `reaValFun`, `easeEligible` → `easEliFun`,
    `modeEligible` → `modEliFun`, `EASE_TOL` → `EAS_TOL_NUM`, `avgEase`
    → `aveEasFun`, `DEFAULT_EASE` → `DEF_EAS_OBJ` for the fifth;
    `noteFirstPicker` → `askFirFun`, `promptInstall` → `askInsFun`,
    `requestPersistOnce` → `askPerFun`, `canInstall` → `canInsFun`,
    `installState` → `insStaFun`, `isIOS` → `isaIosBoo`, `isMac` →
    `isaMacBoo`, `isStandalone` → `isaStaFun` for the sixth, keeping its
    own already-conventional `subscribe` bare per the Generic JS
    API-shape exemption above; `startDrag` → `staDraFun` for the
    seventh, its only property; `defaultTask` → `defTasFun`,
    `isDoneToday` → `isaDonFun`, `nextEligible` → `nexEliFun` and the
    rest of its 17 keys for the eighth, whose unused `REPEATS` was
    removed instead), with
    every external call site (~60 across 7 consumer files for
    CAD_NAM_OBJ, 6 across 3 for CON_NAM_OBJ, 6 across 2 for NOT_NAM_OBJ,
    ~28 across 4 for ONB_CHE_OBJ, 28 across 4 for PIC_NAM_OBJ, 13 across
    2 for PWA_NAM_OBJ, 14 across 1 for REO_NAM_OBJ, ~115 across 7 for
    TAS_NAM_OBJ) updated
    in the same pass. Reusing the already-named
    9-char internal identifier directly as the external key (rather than
    inventing a separately-compressed name, 6-char property-style or
    otherwise) means a reader can trace `SomeObj.propName` straight back
    to the exact function/constant it calls, with nothing to translate.
    This was a deliberate, fully-swept rename each time, not a case of
    the shorthand danger above: the blast radius was checked first for
    each (every call site is plain JS, resolved at call time, never
    persisted to IndexedDB/localStorage), unlike a picker's own persisted
    cadence fields (`anchorDow`, `anchorDom`, ...) or a conditional's own
    persisted fields (`oddsPct`, `easeMin`, `chargeStep`, ...), which stay
    unrenamed for exactly that reason. The explicit `name : name` mapping
    is still kept (never JS shorthand) even once the names match, so a
    future internal rename still has to touch the export line
    deliberately. Apply this same treatment to every future exported
    namespace object as a matter of course, not only when it happens to
    come up again.

### Default parameter values
- Only give a parameter a default where it's genuinely reachable/
  meaningful (some real caller actually relies on the fallback, or it
  documents real existing behavior), not a blanket "every parameter gets
  one" rule.
- For a callback prop that's central to a component's core purpose, weigh
  a silent no-op default (`() => {}`) against letting a call fail loudly
  with a thrown error if the prop is never wired up: a no-op can mask a
  forgotten-integration bug, while a thrown error surfaces it immediately.
  Lean toward the loud failure for those; a quiet, cosmetic default (e.g. a
  boolean flag's natural resting state, or a string's natural starting
  value) is fine either way.
