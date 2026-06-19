#!/usr/bin/env bash

set -euo pipefail

: "${SPEC:?SPEC is required}"
: "${TAG_PREFIX?TAG_PREFIX must be set}"
: "${REF_NAME:?REF_NAME is required}"
: "${GITHUB_OUTPUT:?GITHUB_OUTPUT is required}"

# Identify the bot author for the bump commit and tag.
git config user.name "github-actions[bot]"
git config user.email "github-actions[bot]@users.noreply.github.com"

# Bump the version in package.json without creating a git tag (we tag below).
npm version "${SPEC}" --no-git-tag-version

VERSION=$(node -p "require('./package.json').version")
TAG="${TAG_PREFIX}${VERSION}"

# Commit the bump, rebase onto the latest remote state, then create an
# annotated release tag and push the commit and tag together.
git add package.json package-lock.json 2>/dev/null || git add package.json
git commit -m "[skip ci] bump version"
git pull --rebase origin "${REF_NAME}"
git tag -a "${TAG}" -m "Release ${VERSION}"
git push --follow-tags

echo "version=${VERSION}" >> "${GITHUB_OUTPUT}"
echo "tag=${TAG}" >> "${GITHUB_OUTPUT}"
echo "✅ Tagged: ${TAG}"
