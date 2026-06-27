#!/usr/bin/env bash
# Claude Code provider: sync version into plugin.json and marketplace.json.
#
# Self-registers into the PROVIDERS array when BUMP_CLAUDE_PLUGIN is true.
# Validates plugin.json has .name and marketplace.json has a matching entry
# before writing. Silent no-op if both files already at version.

set -euo pipefail

provider_claude_enabled() {
  [[ "${BUMP_CLAUDE_PLUGIN:-false}" == "true" ]]
}

provider_claude_sync() {
  local version="$1"
  local plugin_dir="${PLUGIN_DIR:-.}"
  local plugin_json="${plugin_dir}/plugin.json"
  local marketplace_json="${plugin_dir}/marketplace.json"

  # Fast-path: if neither file exists, skip silently.
  if [[ ! -f "$plugin_json" && ! -f "$marketplace_json" ]]; then
    echo "ℹ️  No plugin.json or marketplace.json found in ${plugin_dir} — skipping"
    return 0
  fi

  if [[ -f "$plugin_json" ]]; then
    local plugin_name
    plugin_name="$(jq -r '.name // empty' "$plugin_json")"
    if [[ -z "$plugin_name" ]]; then
      echo "error: plugin.json exists but has no .name field" >&2
      exit 1
    fi

    local current_version
    current_version="$(jq -r '.version // empty' "$plugin_json")"
    if [[ "$current_version" == "$version" ]]; then
      echo "ℹ️  plugin.json already at version ${version} — skipping"
    else
      jq --arg v "$version" '.version = $v' "$plugin_json" > "${plugin_json}.tmp" \
        && mv "${plugin_json}.tmp" "$plugin_json"
      echo "✅ plugin.json version -> ${version}"
    fi

    if [[ -f "$marketplace_json" ]]; then
      local matching
      matching="$(jq --arg name "$plugin_name" '[.[] | select(.name == $name)] | length' "$marketplace_json")"
      if [[ "$matching" -eq 0 ]]; then
        echo "error: marketplace.json has no entry matching plugin name '${plugin_name}'" >&2
        exit 1
      fi

      local current_mkt
      current_mkt="$(jq --arg name "$plugin_name" '.[] | select(.name == $name) | .version // empty' "$marketplace_json")"
      if [[ "$current_mkt" == "$version" ]]; then
        echo "ℹ️  marketplace.json entry '${plugin_name}' already at version ${version} — skipping"
      else
        jq --arg name "$plugin_name" --arg v "$version" \
          '(.[] | select(.name == $name) | .version) = $v' "$marketplace_json" > "${marketplace_json}.tmp" \
          && mv "${marketplace_json}.tmp" "$marketplace_json"
        echo "✅ marketplace.json entry '${plugin_name}' version -> ${version}"
      fi
    fi
  else
    echo "error: plugin.json not found at ${plugin_json}" >&2
    exit 1
  fi
}

if provider_claude_enabled; then
  PROVIDERS+=("claude")
fi
