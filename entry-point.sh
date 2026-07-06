#!/usr/bin/env bash

set -euo pipefail

ORIGINAL_DIR="$PWD"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Install dependencies and build the CLI locally instead of fetching from npm
cd "$SCRIPT_DIR"
pnpm install --frozen-lockfile
pnpm build

# Run from the consumer's working directory so process.cwd() resolves correctly
cd "$ORIGINAL_DIR"
output=$(node "$SCRIPT_DIR/bin/src/cli.js")

mapfile -t lines <<< "$output"

{
  echo "version=${lines[0]}"
  echo "tag=${lines[1]}"
  echo "tag_major=${lines[2]}"
  echo "tag_minor=${lines[3]}"
} >> "$GITHUB_OUTPUT"
