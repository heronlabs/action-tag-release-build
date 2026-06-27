#!/usr/bin/env bash
# Bump command — single entry point called from action.yml.
#
# Orchestrates the full bump-tag-release pipeline matching BumpCommand.bumpVersion():
#   1. Read current version                (txt-service)
#   2. Resolve bump type from commit or input  (version-service + git-service)
#   3. Compute next version                (version-service)
#   4. Write new version                   (txt-service)
#   5. Sync version to enabled providers   (node, claude)
#   6. Git commit, tag, push               (git-service, with optional major/minor override)
#   7. Create release + changelog notes    (github-service)
#
# Outputs VERSION, TAG, MAJOR_TAG, MINOR_TAG to GITHUB_OUTPUT.
#
# Required env: GITHUB_OUTPUT
# Optional env: BUMP (major|minor|patch), VERSION_FILE, TAG_PREFIX, REF_NAME,
#               UPDATE_PACKAGE_JSON, BUMP_CLAUDE_PLUGIN, PLUGIN_DIR,
#               UPDATE_MAJOR_TAG, GH_TOKEN, CREATE_RELEASE

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"

# ---- load services --------------------------------------------------------
# shellcheck disable=SC1091
source "$SRC_DIR/core/services/txt-service.sh"
# shellcheck disable=SC1091
source "$SRC_DIR/core/services/version-service.sh"
# shellcheck disable=SC1091
source "$SRC_DIR/infrastructure/git/git-ops-service.sh"
# shellcheck disable=SC1091
source "$SRC_DIR/infrastructure/github/github-service.sh"
# shellcheck disable=SC1091
source "$SRC_DIR/infrastructure/node/node-service.sh"
# shellcheck disable=SC1091
source "$SRC_DIR/infrastructure/claude/claude-service.sh"

# ---- defaults -------------------------------------------------------------
TAG_PREFIX="${TAG_PREFIX-v}"
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
  semantic="$(classify_commit "$last_commit")"
fi
echo "ℹ️  Bump: ${semantic}"

# ---- step 3: calculate next version (mockup: tagger.calculate()) ----------
next_version="$(bump_version "$version" "$semantic")"

# ---- step 4: set version (mockup: txt.setVersion()) -----------------------
txt_set_version "$next_version"
echo "✅ Version: ${version} -> ${next_version} (${semantic})"

# ---- step 5: sync providers (mockup: for opt of given.opts) ---------------
for name in ${BumperNames[@]+"${BumperNames[@]}"}; do
  "provider_${name}_bump_version" "$next_version"
done

# ---- step 6: git commit, tag, push (mockup: git.apply(overrideVersions)) ---
ADDITIONAL_FILES=()
[[ -f package.json ]] && ADDITIONAL_FILES+=(package.json)
[[ -f package-lock.json ]] && ADDITIONAL_FILES+=(package-lock.json)
[[ -f plugin.json ]] && ADDITIONAL_FILES+=(plugin.json)
[[ -f marketplace.json ]] && ADDITIONAL_FILES+=(marketplace.json)

REF_NAME="${REF_NAME:-main}"
OVERRIDE_VERSIONS="${UPDATE_MAJOR_TAG:-true}"
TAG="$(git_apply "$next_version" "$TAG_PREFIX" "$REF_NAME" "$OVERRIDE_VERSIONS" ${ADDITIONAL_FILES[@]+"${ADDITIONAL_FILES[@]}"})"

# ---- step 7: release + changelog (mockup: github.createReleaseChangelogNotes())
#             Runs after git.apply so the tag exists on the remote. ----
CREATE_RELEASE="${CREATE_RELEASE:-true}"
if [[ "${CREATE_RELEASE}" == "true" ]]; then
  : "${GH_TOKEN:?GH_TOKEN is required when CREATE_RELEASE is true}"
  github_create_release_changelog_notes "$TAG"
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
