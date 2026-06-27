#!/usr/bin/env bash
# Tagger service — maps to mockup's Tagger interface.
#
# Pure functions — no side effects, no fs writes, no env reads.
#
#   tagger_classify_commit(message)        -> major | minor | patch
#   tagger_calculate(version, bump_type)   -> new version string

set -euo pipefail

# Classify a Conventional Commits message into a semver bump type.
tagger_classify_commit() {
  local message="$1" subject
  subject="${message%%$'\n'*}"

  if [[ "$subject" =~ ^[a-zA-Z]+(\([^\)]*\))?!: ]] \
     || grep -qE '(^|[[:space:]])BREAKING[ -]CHANGE:' <<<"$message"; then
    echo major
  elif [[ "$subject" =~ ^feat(\([^\)]*\))?: ]]; then
    echo minor
  else
    echo patch
  fi
}

# Pure semver math — no node, no grep -P, no external deps.
tagger_calculate() {
  local version="$1" bump_type="$2"
  local major minor patch

  version="${version#v}"

  IFS='.' read -r major minor patch <<< "$version"
  major="${major:-0}"
  minor="${minor:-0}"
  patch="${patch:-0}"

  case "$bump_type" in
    major) echo "$((major + 1)).0.0" ;;
    minor) echo "${major}.$((minor + 1)).0" ;;
    patch) echo "${major}.${minor}.$((patch + 1))" ;;
    *)     echo "error: unknown bump type '${bump_type}'" >&2; exit 1 ;;
  esac
}
