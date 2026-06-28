#!/usr/bin/env bash
# shellcheck disable=SC1091

set -euo pipefail

# ---- Load services;
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"
source "$SRC_DIR/core/services/txt-service.sh"
source "$SRC_DIR/core/services/tagger-service.sh"
source "$SRC_DIR/infrastructure/git/git-ops-service.sh"
source "$SRC_DIR/infrastructure/github/github-service.sh"
source "$SRC_DIR/infrastructure/node/bumper-node-service.sh"
source "$SRC_DIR/infrastructure/claude/bumper-claude-service.sh"

readonly TAG_PREFIX="v" # Tag is the version with prefix, e.g. v1.2.3;
export VERSION_FILE="${VERSION_FILE:-version.txt}"

BumperNames=()
[[ "${BUMP_NODE:-false}" == "true" ]] && BumperNames+=("node")
[[ "${BUMP_CLAUDE:-false}" == "true" ]] && BumperNames+=("claude")

# ---- Step 1: Get version from txt file;
version="$(txt_get_version)"

# ---- Step 2: Resolve semantic from commit message or input;
semantic="${SEMANTIC:-}"
if [[ -z "$semantic" ]]; then
  last_commit="$(git_get_last_commit)"
  semantic="$(tagger_classify_commit "$last_commit")"
fi
echo "ℹ️  Bump: ${semantic}"

# ---- Step 3: Calculate next version;
next_version="$(tagger_calculate "$version" "$semantic")"

# ---- step 4: Set version in txt file;
txt_set_version "$next_version"
echo "✅ Version: ${version} -> ${next_version} (${semantic})"

# ---- step 5: Sync bumpers;
for name in "${BumperNames[@]:-}"; do
  "provider_${name}_bump_version" "$next_version"
done

# ---- step 6: Generate release notes and changelog;
: "${GH_TOKEN:?GH_TOKEN is required}"
TAG="${TAG_PREFIX}${next_version}"
prev_tag="$(git describe --tags --abbrev=0 HEAD 2>/dev/null || true)"
RELEASE_NOTES="$(generate_release_notes "$prev_tag" "$TAG")"
update_changelog "$TAG" "$RELEASE_NOTES"

# ---- step 7: Git Ops;
REF_NAME="${REF_NAME:-main}"
OVERRIDE_TAG="${OVERRIDE_TAG:-true}"
git_apply "$next_version" "$TAG" "$TAG_PREFIX" "$REF_NAME" "$OVERRIDE_TAG" >&2

# ---- step 8: Create GitHub release;
create_github_release "$TAG" "$RELEASE_NOTES"

# ---- Outputs;
MAJOR="$(echo "${next_version}" | cut -d. -f1)"
MINOR="$(echo "${next_version}" | cut -d. -f2)"
MAJOR_TAG="${TAG_PREFIX}${MAJOR}"
MINOR_TAG="${TAG_PREFIX}${MAJOR}.${MINOR}"

{
  echo "version=${next_version}"
  echo "tag=${TAG}"
  echo "tag_major=${MAJOR_TAG}"
  echo "tag_minor=${MINOR_TAG}"
} >> "${GITHUB_OUTPUT:-/dev/null}"

echo "🏷️ Tagged: ${TAG}"
if [[ "${OVERRIDE_TAG}" == "true" ]]; then
  echo "🗂️ Updated floating tags: ${MAJOR_TAG} -> ${next_version}, ${MINOR_TAG} -> ${next_version}"
fi
