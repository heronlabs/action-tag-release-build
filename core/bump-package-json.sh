#!/usr/bin/env bash
# Sync the new VERSION into package.json via npm version.
#
# This is the only script that requires a Node toolchain on the runner.
# It runs `npm version BUMP --no-git-tag-version` in the working directory
# and also updates package-lock.json if present.
#
# Optional env: BUMP (major|minor|patch — when empty, inferred from HEAD commit),
#               SPEC (alternative to BUMP)
#
# Usage:
#   BUMP=patch bash core/bump-package-json.sh

set -euo pipefail

# ---------------------------------------------------------------------------
# Inference helpers (mirrored from bump-version-file.sh)
# ---------------------------------------------------------------------------
classify_commit() {
  local message="$1" subject
  subject="${message%%$'\n'*}"

  if [[ "$subject" =~ ^[a-zA-Z]+(\([^\)]*\))?!: ]] \
     || grep -qE '(^|[[:space:]])BREAKING[ -]CHANGE:' <<<"$message"; then
    echo major
  elif [[ "$subject" =~ ^feat(\([^\)]*\))?: ]]; then
    echo minor
  else
    echo patch
  fi
}

resolve_bump() {
  if [[ -n "${BUMP:-}" ]]; then
    echo "${BUMP}"
  elif [[ -n "${SPEC:-}" ]]; then
    echo "${SPEC}"
  else
    classify_commit "$(git log -1 --pretty=%B 2>/dev/null || echo '')"
  fi
}

BUMP="$(resolve_bump)"

echo "ℹ️  Syncing package.json version (bump: ${BUMP})"

npm version "${BUMP}" --no-git-tag-version

echo "✅ package.json updated"
