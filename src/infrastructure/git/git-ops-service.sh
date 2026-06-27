#!/usr/bin/env bash
# Git operations: commit, tag, push.
#
#   git_commit_tag_push(version, tag_prefix, ref_name, additional_files...) -> tag

set -euo pipefail

git_commit_tag_push() {
  local version="$1" tag_prefix="$2" ref_name="$3"
  shift 3
  local additional_files=("$@")
  local version_file="${VERSION_FILE:-version.txt}"

  git config user.name "github-actions[bot]"
  git config user.email "github-actions[bot]@users.noreply.github.com"

  local tag="${tag_prefix}${version}"

  git add "$version_file" ${additional_files[@]+"${additional_files[@]}"}
  git commit -m "[skip ci] bump v${version}" >&2
  git pull --rebase origin "${ref_name}" >&2
  git tag -a "${tag}" -m "Release ${version}" >&2
  git push --follow-tags >&2

  echo "${tag}"
}
