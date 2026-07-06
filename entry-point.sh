#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

output=$(node "$SCRIPT_DIR/bin/src/cli.js")

mapfile -t lines <<< "$output"

{
  echo "version=${lines[0]}"
  echo "tag=${lines[1]}"
  echo "tag_major=${lines[2]}"
  echo "tag_minor=${lines[3]}"
} >> "$GITHUB_OUTPUT"
