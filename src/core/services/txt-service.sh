#!/usr/bin/env bash
# Txt service: version file read/write.
#
#   txt_get_version()   -> version string
#   txt_set_version(ver) -> writes version to file

set -euo pipefail

txt_get_version() {
  local version_file="${VERSION_FILE:-version.txt}"

  if [[ ! -f "$version_file" ]]; then
    echo "error: version file '${version_file}' not found" >&2
    exit 1
  fi

  local version
  version="$(< "$version_file")"
  version="$(printf '%s' "$version" | xargs)"

  if [[ -z "$version" ]]; then
    echo "error: version file '${version_file}' is empty" >&2
    exit 1
  fi

  printf '%s' "$version"
}

txt_set_version() {
  local version="$1"
  local version_file="${VERSION_FILE:-version.txt}"
  printf '%s\n' "$version" > "$version_file"
}
