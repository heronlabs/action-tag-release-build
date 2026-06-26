#!/usr/bin/env bash

set -euo pipefail

: "${TAG_PREFIX?TAG_PREFIX must be set}"
: "${REF_NAME:?REF_NAME is required}"
: "${GITHUB_OUTPUT:?GITHUB_OUTPUT is required}"

VERSION_FILE="${VERSION_FILE:-version.txt}"

# Identify the bot author for the bump commit and tag.
git config user.name "github-actions[bot]"
git config user.email "github-actions[bot]@users.noreply.github.com"

# Read the already-bumped version from the version file.
if [[ ! -f "$VERSION_FILE" ]]; then
  echo "error: version file '${VERSION_FILE}' not found — run bump-version-file.sh first" >&2
  exit 1
fi

VERSION="$(< "$VERSION_FILE")"
# Trim whitespace
VERSION="$(printf '%s' "$VERSION" | xargs)"

if [[ -z "$VERSION" ]]; then
  echo "error: version file '${VERSION_FILE}' is empty" >&2
  exit 1
fi

TAG="${TAG_PREFIX}${VERSION}"

# Collect additional files that may have been modified by opt-in scripts
# (bump-package-json.sh, bump-claude-plugin.sh).
ADDITIONAL_FILES=()
if [[ -f package.json ]]; then
  ADDITIONAL_FILES+=( package.json )
fi
if [[ -f package-lock.json ]]; then
  ADDITIONAL_FILES+=( package-lock.json )
fi
if [[ -f plugin.json ]]; then
  ADDITIONAL_FILES+=( plugin.json )
fi
if [[ -f marketplace.json ]]; then
  ADDITIONAL_FILES+=( marketplace.json )
fi

# Commit the bump, rebase onto the latest remote state, then create an
# annotated release tag and push the commit and tag together.
git add "$VERSION_FILE" ${ADDITIONAL_FILES[@]+"${ADDITIONAL_FILES[@]}"}
git commit -m "[skip ci] bump v${VERSION}"
git pull --rebase origin "${REF_NAME}"
git tag -a "${TAG}" -m "Release ${VERSION}"
git push --follow-tags

echo "version=${VERSION}" >> "${GITHUB_OUTPUT}"
echo "tag=${TAG}" >> "${GITHUB_OUTPUT}"
echo "✅ Tagged: ${TAG}"
