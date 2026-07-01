#!/usr/bin/env bash

set -euo pipefail

output=$(npx --yes "@heronlabs/bump")

mapfile -t lines <<< "$output"

{
  echo "version=${lines[0]}"
  echo "tag=${lines[1]}"
  echo "tag_major=${lines[2]}"
  echo "tag_minor=${lines[3]}"
} >> "$GITHUB_OUTPUT"
