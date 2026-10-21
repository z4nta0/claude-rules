#!/usr/bin/env bash
# run.sh = Mechanical Audit Runner
#
# Runs every mechanical audit from "## Full Project Audits" against one
# project: ESLint, the TypeScript build check, and check.ts's scripted format
# checks. Prints each tool's findings and exits non-zero if any tool failed.
#
# Usage: ~/projects/claude-rules/audit/run.sh <project-root>

set -u
rooDirStr="${1:?usage: run.sh <project-root>}"
audDirStr="$( cd "$( dirname "$0" )" && pwd )"
staNum=0

echo '== eslint'
( cd "$rooDirStr" && npx eslint . ) || staNum=1

echo '== tsc -b'
( cd "$rooDirStr" && npx tsc -b ) || staNum=1

echo '== check.ts'
node "$audDirStr/check.ts" "$rooDirStr" || staNum=1

exit $staNum
