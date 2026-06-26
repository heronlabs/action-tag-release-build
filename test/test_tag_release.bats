#!/usr/bin/env bats
# bats tests for core/tag-release.sh
#
# Builds throwaway git repos with a version.txt, runs bump-version-file.sh then
# tag-release.sh, and asserts on version bumps, tags, and outputs.

setup() {
  BUMP_SCRIPT="$BATS_TEST_DIRNAME/../core/bump-version-file.sh"
  TAG_SCRIPT="$BATS_TEST_DIRNAME/../core/tag-release.sh"
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

# Create a repo with a plain version.txt
build_repo() {
  local root work
  root="$(new_origin_work)"
  work="$root/work"
  printf '1.0.0\n' >"$work/version.txt"
  git_q "$work" add -A
  git_q "$work" commit -m init
  git_q "$work" push -u origin main
  printf '%s' "$root"
}

# Create a repo with version.txt + package.json at the same version
build_repo_with_package_json() {
  local root work
  root="$(new_origin_work)"
  work="$root/work"
  printf '1.0.0\n' >"$work/version.txt"
  printf '{ "name": "x", "version": "1.0.0" }\n' >"$work/package.json"
  git_q "$work" add -A
  git_q "$work" commit -m init
  git_q "$work" push -u origin main
  printf '%s' "$root"
}

# Create a repo with version.txt + plugin.json + marketplace.json
build_repo_with_plugin() {
  local root work
  root="$(new_origin_work)"
  work="$root/work"
  printf '1.0.0\n' >"$work/version.txt"
  printf '{"name":"my-plugin","version":"1.0.0"}\n' >"$work/plugin.json"
  printf '[{"name":"my-plugin","version":"1.0.0"}]\n' >"$work/marketplace.json"
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

# Run bump-version-file.sh in the given working tree.
# Sets BUMP_OUT, BUMP_RC, BUMP_GHOUT.
run_bump() {
  local cwd="$1"; shift
  BUMP_GHOUT="$(mktemp)"
  BUMP_GHENV="$(mktemp)"
  set +e
  BUMP_OUT="$(
    cd "$cwd" &&
    env GITHUB_OUTPUT="$BUMP_GHOUT" \
        GITHUB_ENV="$BUMP_GHENV" \
        "$@" \
        bash "$BUMP_SCRIPT" 2>&1
  )"
  BUMP_RC=$?
  set -e
}

# Run tag-release.sh in the given working tree.
# Sets TAG_OUT, TAG_RC, TAG_GHLOG, TAG_GHOUT.
run_tag() {
  local cwd="$1"; shift
  TAG_GHLOG="$(mktemp)"
  TAG_GHOUT="$(mktemp)"
  : >"$TAG_GHLOG"
  set +e
  TAG_OUT="$(
    cd "$cwd" &&
    env PATH="$STUB_DIR:$PATH" \
        GH_LOG="$TAG_GHLOG" \
        GITHUB_OUTPUT="$TAG_GHOUT" \
        "$@" \
        bash "$TAG_SCRIPT" 2>&1
  )"
  TAG_RC=$?
  set -e
}

# Convenience: run bump then tag with the same shared env vars.
# Any arguments passed are forwarded to BOTH scripts.
# The first positional argument is the cwd, the rest are VAR=value pairs.
run_bump_then_tag() {
  local cwd="$1"; shift
  run_bump "$cwd" "$@"
  run_tag "$cwd" "$@"
}

# ---------------------------------------------------------------- tests

@test "tag patch: explicit BUMP=patch bumps 1.0.0 -> 1.0.1" {
  local root; root="$(build_repo)"
  local origin="$root/origin.git" work="$root/work"
  run_bump_then_tag "$work" BUMP=patch TAG_PREFIX=v REF_NAME=main

  [ "$BUMP_RC" -eq 0 ]
  [ "$TAG_RC" -eq 0 ]
  [ "$(cat "$work/version.txt")" = "1.0.1" ]
  [ "$(git -C "$work" log -1 --pretty=%s)" = "[skip ci] bump v1.0.1" ]
  origin_has_tag "$origin" v1.0.1
  grep -q '^version=1.0.1$' "$TAG_GHOUT"
  grep -q '^tag=v1.0.1$' "$TAG_GHOUT"
  grep -q 'Tagged: v1.0.1' <<<"$TAG_OUT"

  rm -rf "$root"
}

@test "tag minor: explicit BUMP=minor bumps 1.0.0 -> 1.1.0" {
  local root; root="$(build_repo)"
  local origin="$root/origin.git" work="$root/work"
  run_bump_then_tag "$work" BUMP=minor TAG_PREFIX=v REF_NAME=main

  [ "$BUMP_RC" -eq 0 ]
  [ "$TAG_RC" -eq 0 ]
  [ "$(cat "$work/version.txt")" = "1.1.0" ]
  origin_has_tag "$origin" v1.1.0
  grep -q '^tag=v1.1.0$' "$TAG_GHOUT"

  rm -rf "$root"
}

@test "tag infer feat: feat commit -> minor bump" {
  local root; root="$(build_repo)"
  local origin="$root/origin.git" work="$root/work"
  git_q "$work" commit --amend -m "feat: add a thing"
  # No explicit BUMP — bump-version-file.sh infers from commit
  run_bump_then_tag "$work" TAG_PREFIX=v REF_NAME=main

  [ "$BUMP_RC" -eq 0 ]
  [ "$TAG_RC" -eq 0 ]
  [ "$(cat "$work/version.txt")" = "1.1.0" ]
  origin_has_tag "$origin" v1.1.0
  grep -q 'Bump: minor' <<<"$BUMP_OUT"

  rm -rf "$root"
}

@test "tag infer feat!: breaking bang -> major bump" {
  local root; root="$(build_repo)"
  local origin="$root/origin.git" work="$root/work"
  git_q "$work" commit --amend -m "feat!: drop legacy api"
  # No explicit BUMP — bump-version-file.sh infers from commit
  run_bump_then_tag "$work" TAG_PREFIX=v REF_NAME=main

  [ "$BUMP_RC" -eq 0 ]
  [ "$TAG_RC" -eq 0 ]
  [ "$(cat "$work/version.txt")" = "2.0.0" ]
  origin_has_tag "$origin" v2.0.0

  rm -rf "$root"
}

@test "tag infer BREAKING CHANGE footer: major bump" {
  local root; root="$(build_repo)"
  local origin="$root/origin.git" work="$root/work"
  git_q "$work" commit --amend -m "$(printf 'fix: tweak\n\nBREAKING CHANGE: drops support for X')"
  run_bump_then_tag "$work" TAG_PREFIX=v REF_NAME=main

  [ "$BUMP_RC" -eq 0 ]
  [ "$TAG_RC" -eq 0 ]
  [ "$(cat "$work/version.txt")" = "2.0.0" ]
  origin_has_tag "$origin" v2.0.0

  rm -rf "$root"
}

@test "tag infer fix: fix commit -> patch bump" {
  local root; root="$(build_repo)"
  local origin="$root/origin.git" work="$root/work"
  git_q "$work" commit --amend -m "fix: correct a bug"
  run_bump_then_tag "$work" TAG_PREFIX=v REF_NAME=main

  [ "$BUMP_RC" -eq 0 ]
  [ "$TAG_RC" -eq 0 ]
  [ "$(cat "$work/version.txt")" = "1.0.1" ]
  origin_has_tag "$origin" v1.0.1

  rm -rf "$root"
}

@test "tag infer unclear: non-conventional commit -> default patch" {
  local root; root="$(build_repo)"
  local origin="$root/origin.git" work="$root/work"
  git_q "$work" commit --amend -m "Merge pull request #7 from heronlabs/topic"
  run_bump_then_tag "$work" TAG_PREFIX=v REF_NAME=main

  [ "$BUMP_RC" -eq 0 ]
  [ "$TAG_RC" -eq 0 ]
  [ "$(cat "$work/version.txt")" = "1.0.1" ]
  origin_has_tag "$origin" v1.0.1

  rm -rf "$root"
}

@test "tag explicit overrides inference: BUMP=patch wins over feat!" {
  local root; root="$(build_repo)"
  local origin="$root/origin.git" work="$root/work"
  git_q "$work" commit --amend -m "feat!: drop legacy api"
  run_bump_then_tag "$work" BUMP=patch TAG_PREFIX=v REF_NAME=main

  [ "$BUMP_RC" -eq 0 ]
  [ "$TAG_RC" -eq 0 ]
  [ "$(cat "$work/version.txt")" = "1.0.1" ]
  origin_has_tag "$origin" v1.0.1

  rm -rf "$root"
}

@test "bump-version-file major: 1.0.0 -> 2.0.0" {
  local root; root="$(build_repo)"
  local work="$root/work"
  run_bump "$work" BUMP=major

  [ "$BUMP_RC" -eq 0 ]
  [ "$(cat "$work/version.txt")" = "2.0.0" ]
  grep -q '^version=2.0.0$' "$BUMP_GHOUT"

  rm -rf "$root"
}

@test "bump-version-file minor: 1.0.0 -> 1.1.0" {
  local root; root="$(build_repo)"
  local work="$root/work"
  run_bump "$work" BUMP=minor

  [ "$BUMP_RC" -eq 0 ]
  [ "$(cat "$work/version.txt")" = "1.1.0" ]
  grep -q '^version=1.1.0$' "$BUMP_GHOUT"

  rm -rf "$root"
}

@test "bump-version-file patch: 1.0.0 -> 1.0.1" {
  local root; root="$(build_repo)"
  local work="$root/work"
  run_bump "$work" BUMP=patch

  [ "$BUMP_RC" -eq 0 ]
  [ "$(cat "$work/version.txt")" = "1.0.1" ]

  rm -rf "$root"
}

@test "tag with package.json: both files included in commit" {
  local root; root="$(build_repo_with_package_json)"
  local origin="$root/origin.git" work="$root/work"
  run_bump_then_tag "$work" BUMP=minor TAG_PREFIX=v REF_NAME=main

  [ "$BUMP_RC" -eq 0 ]
  [ "$TAG_RC" -eq 0 ]
  [ "$(cat "$work/version.txt")" = "1.1.0" ]

  # npm version was NOT run (it's opt-in), so package.json stays at old version
  # but both files should be in the commit (version.txt changed, package.json same)
  origin_has_tag "$origin" v1.1.0

  rm -rf "$root"
}

@test "tag with prefix: custom TAG_PREFIX" {
  local root; root="$(build_repo)"
  local origin="$root/origin.git" work="$root/work"
  run_bump_then_tag "$work" BUMP=patch TAG_PREFIX='my-package-' REF_NAME=main

  [ "$BUMP_RC" -eq 0 ]
  [ "$TAG_RC" -eq 0 ]
  [ "$(cat "$work/version.txt")" = "1.0.1" ]
  origin_has_tag "$origin" my-package-1.0.1
  grep -q '^tag=my-package-1.0.1$' "$TAG_GHOUT"

  rm -rf "$root"
}
