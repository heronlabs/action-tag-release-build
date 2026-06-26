#!/usr/bin/env bats
# bats tests for src/update-major-tag.sh
#
# Builds a plain git repo, runs update-major-tag.sh, and asserts on force-pushed
# floating major and minor tags plus GITHUB_OUTPUT.

setup() {
  SCRIPT="$BATS_TEST_DIRNAME/../src/update-major-tag.sh"
  STUB_DIR="$BATS_TEST_DIRNAME"   # contains the `gh` stub
}

git_q() { git -C "$1" "${@:2}" >/dev/null 2>&1; }

new_origin_work() {
  local root origin work
  root="$(mktemp -d)"
  origin="$root/origin.git"
  work="$root/work"
  git init -q --bare "$origin"
  git clone -q "$origin" "$work" 2>/dev/null
  git -C "$work" config user.name  tester
  git -C "$work" config user.email tester@example.com
  git -C "$work" checkout -q -b main
  printf '%s' "$root"
}

build_plain_repo() {
  local root work
  root="$(new_origin_work)"
  work="$root/work"
  printf 'base\n' >"$work/file.txt"
  git_q "$work" add -A
  git_q "$work" commit -m base
  git_q "$work" push -u origin main
  printf '%s' "$root"
}

origin_has_tag() {
  local origin="$1" tag="$2" tmp r=1
  tmp="$(mktemp -d)"
  git clone -q "$origin" "$tmp" >/dev/null 2>&1
  git -C "$tmp" rev-parse -q --verify "refs/tags/$tag" >/dev/null 2>&1 && r=0
  rm -rf "$tmp"
  return $r
}

# Run update-major-tag.sh in the given working tree.
# Usage: run_script <cwd> [VAR=value ...]
# Sets RUN_OUT, RUN_RC, RUN_GHLOG, RUN_GHOUT.
# shellcheck disable=SC2034  # RUN_OUT used by callers
run_script() {
  local cwd="$1"; shift
  RUN_GHLOG="$(mktemp)"
  RUN_GHOUT="$(mktemp)"
  : >"$RUN_GHLOG"
  set +e
  RUN_OUT="$(
    cd "$cwd" &&
    env -u VERSION -u TAG_PREFIX \
        PATH="$STUB_DIR:$PATH" \
        GH_LOG="$RUN_GHLOG" \
        GITHUB_OUTPUT="$RUN_GHOUT" \
        "$@" \
        bash "$SCRIPT" 2>&1
  )"
  RUN_RC=$?
  set -e
}

# ---------------------------------------------------------------- tests

@test "update-major with prefix v: force-pushes v1 and v1.2" {
  local root; root="$(build_plain_repo)"
  local origin="$root/origin.git" work="$root/work"
  run_script "$work" VERSION=1.2.3 TAG_PREFIX=v

  [ "$RUN_RC" -eq 0 ]
  origin_has_tag "$origin" v1
  origin_has_tag "$origin" v1.2
  grep -q '^major-tag=v1$' "$RUN_GHOUT"
  grep -q '^minor-tag=v1.2$' "$RUN_GHOUT"

  rm -rf "$root"
}

@test "update-major empty prefix: force-pushes 2 and 2.5" {
  local root; root="$(build_plain_repo)"
  local origin="$root/origin.git" work="$root/work"
  run_script "$work" VERSION=2.5.0 TAG_PREFIX=

  [ "$RUN_RC" -eq 0 ]
  origin_has_tag "$origin" 2
  origin_has_tag "$origin" 2.5
  grep -q '^major-tag=2$' "$RUN_GHOUT"
  grep -q '^minor-tag=2.5$' "$RUN_GHOUT"

  rm -rf "$root"
}
