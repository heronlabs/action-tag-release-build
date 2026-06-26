#!/usr/bin/env bash
# Pure-bash version file bump.
#
# Reads the current version from $VERSION_FILE, applies a semver bump (major|minor|patch),
# writes the result back, and exports VERSION to GITHUB_OUTPUT and GITHUB_ENV.
#
# Required env: GITHUB_OUTPUT
# Optional env: BUMP (major|minor|patch — when empty/omitted, inferred from HEAD commit),
#               VERSION_FILE (default: version.txt), SPEC (alternative to BUMP)
#
# Usage:
#   BUMP=patch bash core/bump-version-file.sh
#   bash core/bump-version-file.sh   # infers from git log

set -euo pipefail

VERSION_FILE="${VERSION_FILE:-version.txt}"

# shellcheck disable=SC1091
source "$(dirname "${BASH_SOURCE[0]}")/_inference.sh"

BUMP="$(resolve_bump)"

echo "ℹ️  Bump: ${BUMP}"

# ---------------------------------------------------------------------------
# Pure-bash semver math — no node, no grep -P, no external deps.
# ---------------------------------------------------------------------------
bump_version() {
  local version="$1" bump_type="$2"
  local major minor patch

  # Strip optional leading 'v' so we can work with it
  version="${version#v}"

  IFS='.' read -r major minor patch <<< "$version"

  # Ensure numeric defaults for missing segments
  major="${major:-0}"
  minor="${minor:-0}"
  patch="${patch:-0}"

  case "$bump_type" in
    major) echo "$((major + 1)).0.0" ;;
    minor) echo "${major}.$((minor + 1)).0" ;;
    patch) echo "${major}.${minor}.$((patch + 1))" ;;
    *)     echo "error: unknown bump type '${bump_type}'" >&2; exit 1 ;;
  esac
}

# Read current version
if [[ ! -f "$VERSION_FILE" ]]; then
  echo "error: version file '${VERSION_FILE}' not found" >&2
  exit 1
fi

CURRENT_VERSION="$(< "$VERSION_FILE")"
# Trim whitespace
CURRENT_VERSION="$(printf '%s' "$CURRENT_VERSION" | xargs)"

if [[ -z "$CURRENT_VERSION" ]]; then
  echo "error: version file '${VERSION_FILE}' is empty" >&2
  exit 1
fi

# Bump
VERSION="$(bump_version "$CURRENT_VERSION" "$BUMP")"

# Write back
printf '%s\n' "$VERSION" > "$VERSION_FILE"

# Export
echo "version=${VERSION}" >> "${GITHUB_OUTPUT:-/dev/null}"
echo "BUMP=${BUMP}" >> "${GITHUB_ENV:-/dev/null}"
echo "VERSION=${VERSION}" >> "${GITHUB_ENV:-/dev/null}"

echo "✅ Version: ${CURRENT_VERSION} -> ${VERSION} (${BUMP})"
