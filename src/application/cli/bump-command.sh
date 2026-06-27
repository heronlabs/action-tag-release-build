#!/usr/bin/env bash
# Bump command — single entry point called from action.yml.
#
# Orchestrates the full bump-tag-release pipeline matching BumpCommand.bumpVersion():
#   1. Read current version                  (txt-service)
#   2. Resolve bump type                     (tagger-service + git-service)
#   3. Calculate next version                (tagger-service)
#   4. Write new version                     (txt-service)
#   5. Sync version to enabled bumpers       (bumper-node, bumper-claude)
#   6. Generate release notes + changelog    (github-service, before commit)
#   7. Git commit, tag, push                 (git-service)
#   8. Create GitHub release                 (github-service, after tag exists)
#
# Outputs VERSION, TAG, MAJOR_TAG, MINOR_TAG to GITHUB_OUTPUT.
#
# Required env: GITHUB_OUTPUT
# Optional env: BUMP (major|minor|patch), VERSION_FILE, REF_NAME,
#               UPDATE_PACKAGE_JSON, BUMP_CLAUDE_PLUGIN, PLUGIN_DIR,
#               UPDATE_MAJOR_TAG, GH_TOKEN, CREATE_RELEASE, CHANGELOG_FILE

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"

# ---- load services --------------------------------------------------------
# shellcheck disable=SC1091
source "$SRC_DIR/core/services/txt-service.sh"
# shellcheck disable=SC1091
source "$SRC_DIR/core/services/tagger-service.sh"
# shellcheck disable=SC1091
source "$SRC_DIR/infrastructure/git/git-ops-service.sh"
# shellcheck disable=SC1091
source "$SRC_DIR/infrastructure/github/github-service.sh"
# shellcheck disable=SC1091
source "$SRC_DIR/infrastructure/node/bumper-node-service.sh"
# shellcheck disable=SC1091
source "$SRC_DIR/infrastructure/claude/bumper-claude-service.sh"

# ---- defaults -------------------------------------------------------------
readonly TAG_PREFIX="v"
export VERSION_FILE="${VERSION_FILE:-version.txt}"

# ---- build bumper opts from env (mockup: given.opts = [{name}]) ------------
BumperNames=()
[[ "${UPDATE_PACKAGE_JSON:-false}" == "true" ]] && BumperNames+=("node")
[[ "${BUMP_CLAUDE_PLUGIN:-false}" == "true" ]] && BumperNames+=("claude")

# ---- step 1: get version (mockup: txt.getVersion()) -----------------------
version="$(txt_get_version)"

# ---- step 2: resolve semantic (mockup: given.semantic || classifyCommit) ----
semantic="${BUMP:-}"
if [[ -z "$semantic" ]]; then
  last_commit="$(git_get_last_commit)"
  semantic="$(tagger_classify_commit "$last_commit")"
fi
echo "ℹ️  Bump: ${semantic}"

# ---- step 3: calculate next version (mockup: tagger.calculate()) ----------
next_version="$(tagger_calculate "$version" "$semantic")"

# ---- step 4: set version (mockup: txt.setVersion()) -----------------------
txt_set_version "$next_version"
echo "✅ Version: ${version} -> ${next_version} (${semantic})"

# ---- step 5: sync bumpers (mockup: for opt of given.opts) -----------------
for name in ${BumperNames[@]+"${BumperNames[@]}"}; do
  "provider_${name}_bump_version" "$next_version"
done

# ---- step 6: release notes + changelog (before git_apply, so committed) ---
CREATE_RELEASE="${CREATE_RELEASE:-true}"
TAG="${TAG_PREFIX}${next_version}"
RELEASE_NOTES=""

if [[ "${CREATE_RELEASE}" == "true" ]]; then
  : "${GH_TOKEN:?GH_TOKEN is required when CREATE_RELEASE is true}"

  prev_tag="$(git describe --tags --abbrev=0 HEAD 2>/dev/null || true)"

  RELEASE_NOTES="$(generate_release_notes "$prev_tag" "$TAG")"
  update_changelog "$TAG" "$RELEASE_NOTES"
fi

# ---- step 7: git commit, tag, push (mockup: git.apply(overrideVersions)) ---
REF_NAME="${REF_NAME:-main}"
OVERRIDE_VERSIONS="${UPDATE_MAJOR_TAG:-true}"
TAG="$(git_apply "$next_version" "$TAG_PREFIX" "$REF_NAME" "$OVERRIDE_VERSIONS")"

# ---- step 8: create GitHub release (after tag exists on remote) -----------
if [[ "${CREATE_RELEASE}" == "true" ]]; then
  create_github_release "$TAG" "$RELEASE_NOTES"
fi

# ---- outputs -------------------------------------------------------------
MAJOR="$(echo "${next_version}" | cut -d. -f1)"
MINOR="$(echo "${next_version}" | cut -d. -f2)"
MAJOR_TAG="${TAG_PREFIX}${MAJOR}"
MINOR_TAG="${TAG_PREFIX}${MAJOR}.${MINOR}"

{
  echo "version=${next_version}"
  echo "tag=${TAG}"
  echo "major-tag=${MAJOR_TAG}"
  echo "minor-tag=${MINOR_TAG}"
} >> "${GITHUB_OUTPUT:-/dev/null}"
{
  echo "BUMP=${semantic}"
  echo "VERSION=${next_version}"
} >> "${GITHUB_ENV:-/dev/null}"

echo "✅ Tagged: ${TAG}"
if [[ "${OVERRIDE_VERSIONS}" == "true" ]]; then
  echo "✅ Updated floating tags: ${MAJOR_TAG} -> ${next_version}, ${MINOR_TAG} -> ${next_version}"
fi
