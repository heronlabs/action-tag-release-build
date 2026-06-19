#!/usr/bin/env bash

set -euo pipefail

: "${GH_TOKEN:?GH_TOKEN is required}"
: "${TAG:?TAG is required}"

# Create the GitHub release with auto-generated notes.
# gh reads GH_TOKEN from the environment for authentication.
gh release create "${TAG}" \
  --title "${TAG}" \
  --generate-notes

echo "✅ Released: ${TAG}"
