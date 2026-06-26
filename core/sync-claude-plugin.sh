#!/usr/bin/env bash
# Sync the new VERSION into Claude Code plugin files.
#
# Updates plugin.json and marketplace.json with the given version.
# Validates that plugin.json has .name and that marketplace.json has an entry
# matching that name before writing. Silent no-op if both files already at version.
#
# Required env: VERSION
# Optional env: PLUGIN_DIR (default: .)
#
# Usage:
#   VERSION=1.2.3 bash core/sync-claude-plugin.sh
#   VERSION=1.2.3 PLUGIN_DIR=/path/to/plugin bash core/sync-claude-plugin.sh

set -euo pipefail

: "${VERSION:?VERSION must be set}"

PLUGIN_DIR="${PLUGIN_DIR:-.}"
PLUGIN_JSON="${PLUGIN_DIR}/plugin.json"
MARKETPLACE_JSON="${PLUGIN_DIR}/marketplace.json"

# Fast-path: if neither file exists, this is a no-op (not an error — the input
# may be enabled for repos that don't yet have Claude plugin files).
if [[ ! -f "$PLUGIN_JSON" && ! -f "$MARKETPLACE_JSON" ]]; then
  echo "ℹ️  No plugin.json or marketplace.json found in ${PLUGIN_DIR} — skipping"
  exit 0
fi

# Read plugin name from plugin.json
if [[ -f "$PLUGIN_JSON" ]]; then
  PLUGIN_NAME="$(jq -r '.name // empty' "$PLUGIN_JSON")"
  if [[ -z "$PLUGIN_NAME" ]]; then
    echo "error: plugin.json exists but has no .name field" >&2
    exit 1
  fi

  CURRENT_VERSION="$(jq -r '.version // empty' "$PLUGIN_JSON")"
  if [[ "$CURRENT_VERSION" == "$VERSION" ]]; then
    echo "ℹ️  plugin.json already at version ${VERSION} — skipping"
  else
    jq --arg v "$VERSION" '.version = $v' "$PLUGIN_JSON" > "${PLUGIN_JSON}.tmp" && mv "${PLUGIN_JSON}.tmp" "$PLUGIN_JSON"
    echo "✅ plugin.json version -> ${VERSION}"
  fi

  # If marketplace.json exists, update the matching entry
  if [[ -f "$MARKETPLACE_JSON" ]]; then
    # Validate entry exists
    MATCHING="$(jq --arg name "$PLUGIN_NAME" '[.[] | select(.name == $name)] | length' "$MARKETPLACE_JSON")"
    if [[ "$MATCHING" -eq 0 ]]; then
      echo "error: marketplace.json has no entry matching plugin name '${PLUGIN_NAME}'" >&2
      exit 1
    fi

    CURRENT_MKT="$(jq --arg name "$PLUGIN_NAME" '.[] | select(.name == $name) | .version // empty' "$MARKETPLACE_JSON")"
    if [[ "$CURRENT_MKT" == "$VERSION" ]]; then
      echo "ℹ️  marketplace.json entry '${PLUGIN_NAME}' already at version ${VERSION} — skipping"
    else
      jq --arg name "$PLUGIN_NAME" --arg v "$VERSION" '(.[] | select(.name == $name) | .version) = $v' "$MARKETPLACE_JSON" > "${MARKETPLACE_JSON}.tmp" && mv "${MARKETPLACE_JSON}.tmp" "$MARKETPLACE_JSON"
      echo "✅ marketplace.json entry '${PLUGIN_NAME}' version -> ${VERSION}"
    fi
  fi
else
  echo "error: plugin.json not found at ${PLUGIN_JSON}" >&2
  exit 1
fi
