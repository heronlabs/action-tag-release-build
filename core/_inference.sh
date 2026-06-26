#!/usr/bin/env bash
# Shared inference helpers — sourced by bump scripts.
# Do not execute directly.
#
# classify_commit: classify a Conventional Commits message into a semver bump:
#   major - `!` after the type/scope (feat!:, fix(api)!:) or BREAKING CHANGE
#   minor - a non-breaking feat commit
#   patch - everything else (the default when the message is unclear)
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

# resolve_bump: explicit BUMP wins; then SPEC; else infers from HEAD commit.
resolve_bump() {
  if [[ -n "${BUMP:-}" ]]; then
    echo "${BUMP}"
  elif [[ -n "${SPEC:-}" ]]; then
    echo "${SPEC}"
  else
    classify_commit "$(git log -1 --pretty=%B 2>/dev/null || echo '')"
  fi
}
