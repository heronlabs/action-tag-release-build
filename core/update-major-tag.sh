#!/usr/bin/env bash

set -euo pipefail

: "${VERSION:?VERSION is required}"
: "${TAG_PREFIX?TAG_PREFIX must be set}"
: "${GITHUB_OUTPUT:?GITHUB_OUTPUT is required}"

# Derive the major (e.g. v1) and minor (e.g. v1.0) floating tags from the version.
MAJOR=$(echo "${VERSION}" | cut -d. -f1)
MINOR=$(echo "${VERSION}" | cut -d. -f2)

MAJOR_TAG="${TAG_PREFIX}${MAJOR}"
MINOR_TAG="${TAG_PREFIX}${MAJOR}.${MINOR}"

# Force the floating tags to point at the current commit, then push them.
git tag -fa "${MAJOR_TAG}" -m "Latest ${MAJOR_TAG}.x.x release"
git tag -fa "${MINOR_TAG}" -m "Latest ${MINOR_TAG}.x release"
git push origin "${MAJOR_TAG}" --force
git push origin "${MINOR_TAG}" --force

echo "major-tag=${MAJOR_TAG}" >> "${GITHUB_OUTPUT}"
echo "minor-tag=${MINOR_TAG}" >> "${GITHUB_OUTPUT}"
echo "✅ Updated floating tags: ${MAJOR_TAG} -> ${VERSION}, ${MINOR_TAG} -> ${VERSION}"
