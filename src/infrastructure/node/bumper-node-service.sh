#!/usr/bin/env bash

set -euo pipefail

# ---- Match action semantic variable name;
provider_node_get_name() {
  echo "node"
}

# ---- Bump package.json;
provider_node_bump_version() {
  local version="$1"
  echo "ℹ️  Syncing package.json version -> ${version}"
  npm version "${version}" --no-git-tag-version >/dev/null 2>&1
  echo "✅ package.json -> ${version}"
}
