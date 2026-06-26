#!/usr/bin/env bash
# Interface: classify_commit
#
# Classify a Conventional Commits message into a semver bump:
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
