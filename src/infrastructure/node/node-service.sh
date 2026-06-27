#!/usr/bin/env bash
# Node provider: sync version into package.json.
#
# Self-registers into the PROVIDERS array when UPDATE_PACKAGE_JSON is true.
# Uses npm version with an absolute version to avoid drift from version.txt.

set -euo pipefail

provider_node_enabled() {
  [[ "${UPDATE_PACKAGE_JSON:-false}" == "true" ]]
}

provider_node_sync() {
  local version="$1"
  echo "ℹ️  Syncing package.json version -> ${version}"
  npm version "${version}" --no-git-tag-version >/dev/null 2>&1
  echo "✅ package.json -> ${version}"
}

if provider_node_enabled; then
  PROVIDERS+=("node")
fi
