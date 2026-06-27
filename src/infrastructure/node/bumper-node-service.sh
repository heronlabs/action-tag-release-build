#!/usr/bin/env bash
# Node provider: bump version into package.json.
#
#   provider_node_get_name()  -> "node"
#   provider_node_bump_version(version)

set -euo pipefail

provider_node_get_name() {
  echo "node"
}

provider_node_bump_version() {
  local version="$1"
  echo "ℹ️  Syncing package.json version -> ${version}"
  npm version "${version}" --no-git-tag-version >/dev/null 2>&1
  echo "✅ package.json -> ${version}"
}
