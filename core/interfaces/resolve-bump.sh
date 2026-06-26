#!/usr/bin/env bash
# Interface: resolve_bump
#
# Resolve the semver bump: explicit BUMP wins; then SPEC; else infers from HEAD commit.
# Depends on classify_commit (sourced internally).
# shellcheck disable=SC1091
source "$(dirname "${BASH_SOURCE[0]}")/classify-commit.sh"

resolve_bump() {
  if [[ -n "${BUMP:-}" ]]; then
    echo "${BUMP}"
  elif [[ -n "${SPEC:-}" ]]; then
    echo "${SPEC}"
  else
    classify_commit "$(git log -1 --pretty=%B 2>/dev/null || echo '')"
  fi
}
