#!/usr/bin/env bash
# GitHub release command — creates a release with structured notes and CHANGELOG.
#
# Required env: GH_TOKEN, TAG
# Optional env: TAG_PREFIX (default: v), CHANGELOG_FILE (default: CHANGELOG.md)

set -euo pipefail

: "${GH_TOKEN:?GH_TOKEN is required}"
: "${TAG:?TAG is required}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/../../infrastructure/github/github-service.sh"

TAG_PREFIX="${TAG_PREFIX:-v}"
CHANGELOG_FILE="${CHANGELOG_FILE:-CHANGELOG.md}"

PREV_TAG="$(git describe --tags --abbrev=0 "${TAG}^" 2>/dev/null || true)"
NOTES="$(generate_release_notes "$PREV_TAG" "$TAG")"
update_changelog "$TAG" "$NOTES" "$CHANGELOG_FILE"
create_github_release "$TAG" "$NOTES"
