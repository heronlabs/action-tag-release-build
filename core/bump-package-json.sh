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

# shellcheck disable=SC1091
source "$(dirname "${BASH_SOURCE[0]}")/interfaces/resolve-bump.sh"

BUMP="$(resolve_bump)"

echo "ℹ️  Syncing package.json version (bump: ${BUMP})"

npm version "${BUMP}" --no-git-tag-version

echo "✅ package.json updated"
