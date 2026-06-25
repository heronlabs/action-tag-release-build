#!/usr/bin/env bats
# bats tests for core/tag-release.sh
#
# Builds throwaway git repos with a package.json, runs tag-release.sh,
# and asserts on version bumps, tags, and outputs.

setup() {
  SCRIPT="$BATS_TEST_DIRNAME/../core/tag-release.sh"
  STUB_DIR="$BATS_TEST_DIRNAME"   # contains the `gh` stub (needed for gh release create)
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

build_node_repo() {
  local root work
  root="$(new_origin_work)"
  work="$root/work"
  printf '{ "name": "x", "version": "1.0.0" }\n' >"$work/package.json"
  git_q "$work" add -A
  git_q "$work" commit -m init
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

# Run tag-release.sh in the given working tree.
# Usage: run_script <cwd> [VAR=value ...]
# Sets RUN_OUT, RUN_RC, RUN_GHLOG, RUN_GHOUT.
run_script() {
  local cwd="$1"; shift
  RUN_GHLOG="$(mktemp)"
  RUN_GHOUT="$(mktemp)"
  : >"$RUN_GHLOG"
  set +e
  RUN_OUT="$(
    cd "$cwd" &&
    env -u GH_TOKEN -u TAG -u SPEC -u VERSION -u TAG_PREFIX -u REF_NAME \
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

@test "tag patch: explicit SPEC=patch bumps 1.0.0 -> 1.0.1" {
  local root; root="$(build_node_repo)"
  local origin="$root/origin.git" work="$root/work"
  run_script "$work" SPEC=patch TAG_PREFIX=v REF_NAME=main

  [ "$RUN_RC" -eq 0 ]
  [ "$(node -p "require('$work/package.json').version" 2>/dev/null)" = "1.0.1" ]
  [ "$(git -C "$work" log -1 --pretty=%s)" = "[skip ci] bump version" ]
  origin_has_tag "$origin" v1.0.1
  grep -q '^version=1.0.1$' "$RUN_GHOUT"
  grep -q '^tag=v1.0.1$' "$RUN_GHOUT"
  grep -q 'Tagged: v1.0.1' <<<"$RUN_OUT"

  rm -rf "$root"
}

@test "tag minor: explicit SPEC=minor bumps 1.0.0 -> 1.1.0" {
  local root; root="$(build_node_repo)"
  local origin="$root/origin.git" work="$root/work"
  run_script "$work" SPEC=minor TAG_PREFIX=v REF_NAME=main

  [ "$RUN_RC" -eq 0 ]
  [ "$(node -p "require('$work/package.json').version" 2>/dev/null)" = "1.1.0" ]
  origin_has_tag "$origin" v1.1.0
  grep -q '^tag=v1.1.0$' "$RUN_GHOUT"

  rm -rf "$root"
}

@test "tag infer feat: feat commit -> minor bump" {
  local root; root="$(build_node_repo)"
  local origin="$root/origin.git" work="$root/work"
  git_q "$work" commit --amend -m "feat: add a thing"
  run_script "$work" TAG_PREFIX=v REF_NAME=main

  [ "$RUN_RC" -eq 0 ]
  [ "$(node -p "require('$work/package.json').version" 2>/dev/null)" = "1.1.0" ]
  origin_has_tag "$origin" v1.1.0
  grep -q 'Bump: minor (inferred from commit)' <<<"$RUN_OUT"

  rm -rf "$root"
}

@test "tag infer feat!: breaking bang -> major bump" {
  local root; root="$(build_node_repo)"
  local origin="$root/origin.git" work="$root/work"
  git_q "$work" commit --amend -m "feat!: drop legacy api"
  run_script "$work" TAG_PREFIX=v REF_NAME=main

  [ "$RUN_RC" -eq 0 ]
  [ "$(node -p "require('$work/package.json').version" 2>/dev/null)" = "2.0.0" ]
  origin_has_tag "$origin" v2.0.0

  rm -rf "$root"
}

@test "tag infer BREAKING CHANGE footer: major bump" {
  local root; root="$(build_node_repo)"
  local origin="$root/origin.git" work="$root/work"
  git_q "$work" commit --amend -m "$(printf 'fix: tweak\n\nBREAKING CHANGE: drops support for X')"
  run_script "$work" TAG_PREFIX=v REF_NAME=main

  [ "$RUN_RC" -eq 0 ]
  [ "$(node -p "require('$work/package.json').version" 2>/dev/null)" = "2.0.0" ]
  origin_has_tag "$origin" v2.0.0

  rm -rf "$root"
}

@test "tag infer fix: fix commit -> patch bump" {
  local root; root="$(build_node_repo)"
  local origin="$root/origin.git" work="$root/work"
  git_q "$work" commit --amend -m "fix: correct a bug"
  run_script "$work" TAG_PREFIX=v REF_NAME=main

  [ "$RUN_RC" -eq 0 ]
  [ "$(node -p "require('$work/package.json').version" 2>/dev/null)" = "1.0.1" ]
  origin_has_tag "$origin" v1.0.1

  rm -rf "$root"
}

@test "tag infer unclear: non-conventional commit -> default patch" {
  local root; root="$(build_node_repo)"
  local origin="$root/origin.git" work="$root/work"
  git_q "$work" commit --amend -m "Merge pull request #7 from heronlabs/topic"
  run_script "$work" TAG_PREFIX=v REF_NAME=main

  [ "$RUN_RC" -eq 0 ]
  [ "$(node -p "require('$work/package.json').version" 2>/dev/null)" = "1.0.1" ]
  origin_has_tag "$origin" v1.0.1

  rm -rf "$root"
}

@test "tag explicit overrides inference: SPEC=patch wins over feat!" {
  local root; root="$(build_node_repo)"
  local origin="$root/origin.git" work="$root/work"
  git_q "$work" commit --amend -m "feat!: drop legacy api"
  run_script "$work" SPEC=patch TAG_PREFIX=v REF_NAME=main

  [ "$RUN_RC" -eq 0 ]
  [ "$(node -p "require('$work/package.json').version" 2>/dev/null)" = "1.0.1" ]
  origin_has_tag "$origin" v1.0.1

  rm -rf "$root"
}
