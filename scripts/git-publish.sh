#!/usr/bin/env bash
# Stage all, commit, push. Used by /save and /save-now Cursor commands.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

MSG="${1:-}"
if [[ -z "$MSG" ]]; then
  echo "usage: scripts/git-publish.sh <commit-message>" >&2
  exit 1
fi

git add .
if git diff --cached --quiet; then
  echo "COMMIT_NOTHING"
  exit 0
fi

git commit -m "$MSG"
HASH="$(git rev-parse --short HEAD)"
BRANCH="$(git branch --show-current)"
git push

echo "COMMIT_OK"
echo "HASH=$HASH"
echo "BRANCH=$BRANCH"
echo "MSG=$MSG"
