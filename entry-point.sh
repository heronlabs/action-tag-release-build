#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Read the version from package.json so the CLI version matches the action version
VERSION="$(node -p "require('$SCRIPT_DIR/package.json').version")"

# Run the published CLI directly via npx — no local install or build needed.
output=$(npx --yes "@heronlabs/bump@$VERSION")

mapfile -t lines <<< "$output"

{
  echo "version=${lines[0]}"
  echo "tag=${lines[1]}"
  echo "tag_major=${lines[2]}"
  echo "tag_minor=${lines[3]}"
} >> "$GITHUB_OUTPUT"
