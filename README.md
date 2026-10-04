# claude-rules

My personal rules for Claude Code: development servers, commit messages,
copy, and code formatting, naming, and comments. They apply to every project
I open, and each project's own `CLAUDE.md` adds what's specific to it.

The rules were developed in the [ease-my-life](https://github.com/z4nta0/ease-my-life)
project, so the files their examples cite are from that repo.

## Setup

Clone this repo to `~/projects/claude-rules`, then make
`~/.claude/CLAUDE.md` (Claude Code's user-level instructions file) a single
import line pointing at it:

```
@~/projects/claude-rules/CLAUDE.md
```

Claude Code then loads these rules in every project, and edits made here are
tracked in this repo.
