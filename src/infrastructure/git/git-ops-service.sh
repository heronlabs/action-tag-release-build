#!/usr/bin/env bash
# Git operations: commit, tag, push.
#
#   git_get_last_commit()                                     -> last commit message
#   git_apply(version, tag_prefix, ref_name, override_versions, additional_files...) -> tag

set -euo pipefail

git_get_last_commit() {
  git log -1 --pretty=%B 2>/dev/null || echo ''
}

git_apply() {
  local version="$1" tag_prefix="$2" ref_name="$3" override_versions="$4"
  shift 4
  local additional_files=("$@")
  local version_file="${VERSION_FILE:-version.txt}"

  git config user.name "github-actions[bot]"
  git config user.email "github-actions[bot]@users.noreply.github.com"

  local tag="${tag_prefix}${version}"

  git add "$version_file" ${additional_files[@]+"${additional_files[@]}"}
  git commit -m "[skip ci] bump v${version}" >&2
  git pull --rebase origin "${ref_name}" >&2
  git tag -a "${tag}" -m "Release ${version}" >&2

  if [[ "${override_versions}" == "true" ]]; then
    local major minor
    major="$(echo "${version}" | cut -d. -f1)"
    minor="$(echo "${version}" | cut -d. -f2)"
    local major_tag="${tag_prefix}${major}"
    local minor_tag="${tag_prefix}${major}.${minor}"
    git tag -fa "${major_tag}" -m "Latest ${major_tag}.x.x release" >&2
    git tag -fa "${minor_tag}" -m "Latest ${minor_tag}.x release" >&2
  fi

  git push --follow-tags >&2

  if [[ "${override_versions}" == "true" ]]; then
    local major minor
    major="$(echo "${version}" | cut -d. -f1)"
    minor="$(echo "${version}" | cut -d. -f2)"
    local major_tag="${tag_prefix}${major}"
    local minor_tag="${tag_prefix}${major}.${minor}"
    git push origin "${major_tag}" --force >&2
    git push origin "${minor_tag}" --force >&2
  fi

  echo "${tag}"
}
