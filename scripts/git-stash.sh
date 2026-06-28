#!/usr/bin/env bash
# Stash working tree. Used by /trash Cursor command.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

MSG="trash $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
if OUTPUT="$(git stash push -m "$MSG" 2>&1)"; then
  echo "STASH_OK"
  git stash list -1
elif [[ "$OUTPUT" == *"No local changes to save"* ]]; then
  echo "STASH_NOTHING"
else
  echo "$OUTPUT" >&2
  exit 1
fi
