#!/usr/bin/env bash

set -euo pipefail

# ---- Get the last commit message to classify semantic;
git_get_last_commit() {
  git log -1 --pretty=%B 2>/dev/null || echo ''
}

# ---- Config github-action bot, commit, tag and push;
git_apply() {
  local version="$1" tag="$2" prefix="$3" ref_name="$4" override_versions="$5"

  git config user.name "github-actions[bot]"
  git config user.email "github-actions[bot]@users.noreply.github.com"

  git add -A
  git commit -m "[skip ci] bump v${version}" >&2
  git pull --rebase origin "${ref_name}" >&2
  git tag -a "${tag}" -m "Release ${version}" >&2

  if [[ "${override_versions}" == "true" ]]; then
    local major minor
    major="$(echo "${version}" | cut -d. -f1)"
    minor="$(echo "${version}" | cut -d. -f2)"
    local tag_major="${prefix}${major}"
    local tag_minor="${prefix}${major}.${minor}"

    git tag -fa "${tag_major}" -m "Latest ${tag_major}.x.x release" >&2
    git tag -fa "${tag_minor}" -m "Latest ${tag_minor}.x release" >&2
    git push --follow-tags >&2
    git push origin "${tag_major}" --force >&2
    git push origin "${tag_minor}" --force >&2
  else
    git push --follow-tags >&2
  fi

  echo "${tag}"
}
