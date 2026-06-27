#!/usr/bin/env bash
# Bump command — core entry point called from action.yml.
#
# Orchestrates the full bump-and-tag pipeline:
#   1. Resolve bump type + compute new version    (version-service)
#   2. Sync version to enabled providers          (node, claude)
#   3. Git commit, tag, push                      (git-ops-service)
#
# Outputs VERSION and TAG to GITHUB_OUTPUT.
#
# Required env: GITHUB_OUTPUT
# Optional env: BUMP (major|minor|patch), VERSION_FILE, TAG_PREFIX, REF_NAME,
#               UPDATE_PACKAGE_JSON, BUMP_CLAUDE_PLUGIN, PLUGIN_DIR

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"

VERSION_FILE="${VERSION_FILE:-version.txt}"
TAG_PREFIX="${TAG_PREFIX:-v}"

# ---- provider registry ---------------------------------------------------
# Each provider self-registers by appending its name when enabled.
PROVIDERS=()

# shellcheck disable=SC1091
source "$SRC_DIR/infrastructure/node/node-service.sh"
# shellcheck disable=SC1091
source "$SRC_DIR/infrastructure/claude/claude-service.sh"

# ---- version resolution --------------------------------------------------
# shellcheck disable=SC1091
source "$SRC_DIR/core/services/version-service.sh"

BUMP_TYPE="$(resolve_bump)"
echo "ℹ️  Bump: ${BUMP_TYPE}"

if [[ ! -f "$VERSION_FILE" ]]; then
  echo "error: version file '${VERSION_FILE}' not found" >&2
  exit 1
fi

CURRENT_VERSION="$(< "$VERSION_FILE")"
CURRENT_VERSION="$(printf '%s' "$CURRENT_VERSION" | xargs)"

if [[ -z "$CURRENT_VERSION" ]]; then
  echo "error: version file '${VERSION_FILE}' is empty" >&2
  exit 1
fi

NEW_VERSION="$(bump_version "$CURRENT_VERSION" "$BUMP_TYPE")"
printf '%s\n' "$NEW_VERSION" > "$VERSION_FILE"
echo "✅ Version: ${CURRENT_VERSION} -> ${NEW_VERSION} (${BUMP_TYPE})"

# ---- provider syncs ------------------------------------------------------
for provider in ${PROVIDERS[@]+"${PROVIDERS[@]}"}; do
  "provider_${provider}_sync" "$NEW_VERSION"
done

# ---- git commit, tag, push -----------------------------------------------
# shellcheck disable=SC1091
source "$SRC_DIR/infrastructure/git/git-ops-service.sh"

ADDITIONAL_FILES=()
[[ -f package.json ]] && ADDITIONAL_FILES+=(package.json)
[[ -f package-lock.json ]] && ADDITIONAL_FILES+=(package-lock.json)
[[ -f plugin.json ]] && ADDITIONAL_FILES+=(plugin.json)
[[ -f marketplace.json ]] && ADDITIONAL_FILES+=(marketplace.json)

REF_NAME="${REF_NAME:-main}"
TAG="$(git_commit_tag_push "$NEW_VERSION" "$TAG_PREFIX" "$REF_NAME" ${ADDITIONAL_FILES[@]+"${ADDITIONAL_FILES[@]}"})"

# ---- outputs -------------------------------------------------------------
echo "version=${NEW_VERSION}" >> "${GITHUB_OUTPUT:-/dev/null}"
echo "tag=${TAG}" >> "${GITHUB_OUTPUT:-/dev/null}"
echo "BUMP=${BUMP_TYPE}" >> "${GITHUB_ENV:-/dev/null}"
echo "VERSION=${NEW_VERSION}" >> "${GITHUB_ENV:-/dev/null}"

echo "✅ Tagged: ${TAG}"
