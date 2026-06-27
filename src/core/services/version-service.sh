#!/usr/bin/env bash
# Core domain: version resolution and semver math.
#
# Pure functions — no side effects, no fs writes.
#
#   classify_commit(message)   -> major | minor | patch
#   resolve_bump()             -> major | minor | patch
#   bump_version(version, type) -> new version string
#
# resolve_bump priority: BUMP env > SPEC env > classify_commit(HEAD commit).

set -euo pipefail

# Classify a Conventional Commits message into a semver bump type.
classify_commit() {
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

# Resolve the semver bump: explicit BUMP wins; then SPEC; else infers from HEAD.
resolve_bump() {
  if [[ -n "${BUMP:-}" ]]; then
    echo "${BUMP}"
  elif [[ -n "${SPEC:-}" ]]; then
    echo "${SPEC}"
  else
    classify_commit "$(git log -1 --pretty=%B 2>/dev/null || echo '')"
  fi
}

# Pure semver math — no node, no grep -P, no external deps.
bump_version() {
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
