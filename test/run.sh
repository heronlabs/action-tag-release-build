#!/usr/bin/env bash
# Offline test harness for core/create-release.sh, core/tag-release.sh and
# core/update-major-tag.sh.
#
# Builds throwaway git repos (a bare "origin" + a working clone), points a `gh`
# stub at PATH, runs each action script, and asserts on pushed tags / GITHUB_OUTPUT
# / stdout lines / gh calls. npm, node and git are real and run fully offline.
# No network, no real GitHub.
#
# shellcheck disable=SC2015  # `cond && ok || bad` is intentional; ok() always returns 0
set -uo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT_RELEASE="$HERE/../core/create-release.sh"
SCRIPT_TAG="$HERE/../core/tag-release.sh"
SCRIPT_MAJOR="$HERE/../core/update-major-tag.sh"
STUB_DIR="$HERE"   # contains the `gh` stub

pass=0
fail=0
note() { printf '  %s\n' "$*"; }
ok()   { pass=$((pass + 1)); printf 'ok   - %s\n' "$1"; }
bad()  { fail=$((fail + 1)); printf 'FAIL - %s\n' "$1"; [ -n "${2:-}" ] && note "$2"; }

git_q() { git -C "$1" "${@:2}" >/dev/null 2>&1; }

# Create a bare origin + working clone checked out on an empty `main`.
# Echoes the temp root; caller uses "$root/origin.git" and "$root/work".
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

# Origin + clone with a committed package.json (version 1.0.0) on main.
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

# Origin + clone with a single plain commit on main.
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

# Run a core script with the gh stub on PATH and fresh GH_LOG / GITHUB_OUTPUT.
# The action-specific env vars start unset so each test sets only what it needs.
# Usage: run_script <script> <cwd> [VAR=value ...]
# Sets RUN_OUT / RUN_RC / RUN_GHLOG / RUN_GHOUT.
run_script() {
  local script="$1" cwd="$2"; shift 2
  RUN_GHLOG="$(mktemp)"
  RUN_GHOUT="$(mktemp)"
  : >"$RUN_GHLOG"
  RUN_OUT="$(
    cd "$cwd" &&
    env -u GH_TOKEN -u TAG -u SPEC -u VERSION -u TAG_PREFIX -u REF_NAME \
        PATH="$STUB_DIR:$PATH" \
        GH_LOG="$RUN_GHLOG" \
        GITHUB_OUTPUT="$RUN_GHOUT" \
        "$@" \
        bash "$script" 2>&1
  )"
  RUN_RC=$?
}

origin_has_tag() { # <origin> <tag> -> true if the tag exists on origin
  local origin="$1" tag="$2" tmp r=1
  tmp="$(mktemp -d)"
  git clone -q "$origin" "$tmp" >/dev/null 2>&1
  git -C "$tmp" rev-parse -q --verify "refs/tags/$tag" >/dev/null 2>&1 && r=0
  rm -rf "$tmp"
  return $r
}

# ---------------------------------------------------------------- tests

test_create_release_success() {
  run_script "$SCRIPT_RELEASE" "$HERE" GH_TOKEN=x TAG=v1.2.3
  [ "$RUN_RC" -eq 0 ] && ok "create-release: exit 0" || bad "create-release: exit 0" "rc=$RUN_RC out=$RUN_OUT"
  grep -q 'release create v1.2.3' "$RUN_GHLOG" && ok "create-release: gh release create v1.2.3" || bad "create-release: gh release create v1.2.3" "$(cat "$RUN_GHLOG")"
  grep -q -- '--title v1.2.3' "$RUN_GHLOG" && ok "create-release: --title v1.2.3" || bad "create-release: --title v1.2.3" "$(cat "$RUN_GHLOG")"
  grep -q -- '--generate-notes' "$RUN_GHLOG" && ok "create-release: --generate-notes" || bad "create-release: --generate-notes" "$(cat "$RUN_GHLOG")"
  grep -q 'Released: v1.2.3' <<<"$RUN_OUT" && ok "create-release: stdout Released: v1.2.3" || bad "create-release: stdout Released: v1.2.3" "$RUN_OUT"
}

test_create_release_missing_tag() {
  run_script "$SCRIPT_RELEASE" "$HERE" GH_TOKEN=x
  [ "$RUN_RC" -ne 0 ] && ok "create-release: missing TAG is a hard error" || bad "create-release: missing TAG is a hard error" "rc=$RUN_RC out=$RUN_OUT"
}

test_create_release_missing_token() {
  run_script "$SCRIPT_RELEASE" "$HERE" TAG=v1.2.3
  [ "$RUN_RC" -ne 0 ] && ok "create-release: missing GH_TOKEN is a hard error" || bad "create-release: missing GH_TOKEN is a hard error" "rc=$RUN_RC out=$RUN_OUT"
}

test_tag_release_patch() {
  local root; root="$(build_node_repo)"
  local origin="$root/origin.git" work="$root/work"
  run_script "$SCRIPT_TAG" "$work" SPEC=patch TAG_PREFIX=v REF_NAME=main

  [ "$RUN_RC" -eq 0 ] && ok "tag patch: exit 0" || bad "tag patch: exit 0" "rc=$RUN_RC out=$RUN_OUT"
  [ "$(node -p "require('$work/package.json').version" 2>/dev/null)" = "1.0.1" ] && ok "tag patch: package.json bumped to 1.0.1" || bad "tag patch: package.json bumped to 1.0.1"
  [ "$(git -C "$work" log -1 --pretty=%s)" = "[skip ci] bump version" ] && ok "tag patch: bump commit present" || bad "tag patch: bump commit present" "$(git -C "$work" log -1 --pretty=%s)"
  origin_has_tag "$origin" v1.0.1 && ok "tag patch: tag v1.0.1 pushed to origin" || bad "tag patch: tag v1.0.1 pushed to origin"
  grep -q '^version=1.0.1$' "$RUN_GHOUT" && ok "tag patch: output version=1.0.1" || bad "tag patch: output version=1.0.1" "$(cat "$RUN_GHOUT")"
  grep -q '^tag=v1.0.1$' "$RUN_GHOUT" && ok "tag patch: output tag=v1.0.1" || bad "tag patch: output tag=v1.0.1" "$(cat "$RUN_GHOUT")"
  grep -q 'Tagged: v1.0.1' <<<"$RUN_OUT" && ok "tag patch: stdout Tagged: v1.0.1" || bad "tag patch: stdout Tagged: v1.0.1" "$RUN_OUT"

  rm -rf "$root"
}

test_tag_release_minor() {
  local root; root="$(build_node_repo)"
  local origin="$root/origin.git" work="$root/work"
  run_script "$SCRIPT_TAG" "$work" SPEC=minor TAG_PREFIX=v REF_NAME=main

  [ "$RUN_RC" -eq 0 ] && ok "tag minor: exit 0" || bad "tag minor: exit 0" "rc=$RUN_RC out=$RUN_OUT"
  [ "$(node -p "require('$work/package.json').version" 2>/dev/null)" = "1.1.0" ] && ok "tag minor: package.json bumped to 1.1.0" || bad "tag minor: package.json bumped to 1.1.0"
  origin_has_tag "$origin" v1.1.0 && ok "tag minor: tag v1.1.0 pushed to origin" || bad "tag minor: tag v1.1.0 pushed to origin"
  grep -q '^tag=v1.1.0$' "$RUN_GHOUT" && ok "tag minor: output tag=v1.1.0" || bad "tag minor: output tag=v1.1.0" "$(cat "$RUN_GHOUT")"

  rm -rf "$root"
}

test_tag_release_infer_feat_minor() {
  local root; root="$(build_node_repo)"
  local origin="$root/origin.git" work="$root/work"
  git_q "$work" commit --amend -m "feat: add a thing"
  run_script "$SCRIPT_TAG" "$work" TAG_PREFIX=v REF_NAME=main

  [ "$RUN_RC" -eq 0 ] && ok "tag infer feat: exit 0" || bad "tag infer feat: exit 0" "rc=$RUN_RC out=$RUN_OUT"
  [ "$(node -p "require('$work/package.json').version" 2>/dev/null)" = "1.1.0" ] && ok "tag infer feat: package.json bumped to 1.1.0 (minor)" || bad "tag infer feat: package.json bumped to 1.1.0 (minor)"
  origin_has_tag "$origin" v1.1.0 && ok "tag infer feat: tag v1.1.0 pushed to origin" || bad "tag infer feat: tag v1.1.0 pushed to origin"
  grep -q 'Bump: minor (inferred from commit)' <<<"$RUN_OUT" && ok "tag infer feat: stdout reports inferred minor" || bad "tag infer feat: stdout reports inferred minor" "$RUN_OUT"

  rm -rf "$root"
}

test_tag_release_infer_breaking_bang_major() {
  local root; root="$(build_node_repo)"
  local origin="$root/origin.git" work="$root/work"
  git_q "$work" commit --amend -m "feat!: drop legacy api"
  run_script "$SCRIPT_TAG" "$work" TAG_PREFIX=v REF_NAME=main

  [ "$RUN_RC" -eq 0 ] && ok "tag infer feat!: exit 0" || bad "tag infer feat!: exit 0" "rc=$RUN_RC out=$RUN_OUT"
  [ "$(node -p "require('$work/package.json').version" 2>/dev/null)" = "2.0.0" ] && ok "tag infer feat!: package.json bumped to 2.0.0 (major)" || bad "tag infer feat!: package.json bumped to 2.0.0 (major)"
  origin_has_tag "$origin" v2.0.0 && ok "tag infer feat!: tag v2.0.0 pushed to origin" || bad "tag infer feat!: tag v2.0.0 pushed to origin"

  rm -rf "$root"
}

test_tag_release_infer_breaking_footer_major() {
  local root; root="$(build_node_repo)"
  local origin="$root/origin.git" work="$root/work"
  git_q "$work" commit --amend -m "$(printf 'fix: tweak\n\nBREAKING CHANGE: drops support for X')"
  run_script "$SCRIPT_TAG" "$work" TAG_PREFIX=v REF_NAME=main

  [ "$RUN_RC" -eq 0 ] && ok "tag infer BREAKING CHANGE: exit 0" || bad "tag infer BREAKING CHANGE: exit 0" "rc=$RUN_RC out=$RUN_OUT"
  [ "$(node -p "require('$work/package.json').version" 2>/dev/null)" = "2.0.0" ] && ok "tag infer BREAKING CHANGE: package.json bumped to 2.0.0 (major)" || bad "tag infer BREAKING CHANGE: package.json bumped to 2.0.0 (major)"
  origin_has_tag "$origin" v2.0.0 && ok "tag infer BREAKING CHANGE: tag v2.0.0 pushed to origin" || bad "tag infer BREAKING CHANGE: tag v2.0.0 pushed to origin"

  rm -rf "$root"
}

test_tag_release_infer_fix_patch() {
  local root; root="$(build_node_repo)"
  local origin="$root/origin.git" work="$root/work"
  git_q "$work" commit --amend -m "fix: correct a bug"
  run_script "$SCRIPT_TAG" "$work" TAG_PREFIX=v REF_NAME=main

  [ "$RUN_RC" -eq 0 ] && ok "tag infer fix: exit 0" || bad "tag infer fix: exit 0" "rc=$RUN_RC out=$RUN_OUT"
  [ "$(node -p "require('$work/package.json').version" 2>/dev/null)" = "1.0.1" ] && ok "tag infer fix: package.json bumped to 1.0.1 (patch)" || bad "tag infer fix: package.json bumped to 1.0.1 (patch)"
  origin_has_tag "$origin" v1.0.1 && ok "tag infer fix: tag v1.0.1 pushed to origin" || bad "tag infer fix: tag v1.0.1 pushed to origin"

  rm -rf "$root"
}

test_tag_release_infer_unclear_patch() {
  local root; root="$(build_node_repo)"
  local origin="$root/origin.git" work="$root/work"
  git_q "$work" commit --amend -m "Merge pull request #7 from heronlabs/topic"
  run_script "$SCRIPT_TAG" "$work" TAG_PREFIX=v REF_NAME=main

  [ "$RUN_RC" -eq 0 ] && ok "tag infer unclear: exit 0" || bad "tag infer unclear: exit 0" "rc=$RUN_RC out=$RUN_OUT"
  [ "$(node -p "require('$work/package.json').version" 2>/dev/null)" = "1.0.1" ] && ok "tag infer unclear: package.json bumped to 1.0.1 (patch default)" || bad "tag infer unclear: package.json bumped to 1.0.1 (patch default)"
  origin_has_tag "$origin" v1.0.1 && ok "tag infer unclear: tag v1.0.1 pushed to origin" || bad "tag infer unclear: tag v1.0.1 pushed to origin"

  rm -rf "$root"
}

test_update_major_with_prefix() {
  local root; root="$(build_plain_repo)"
  local origin="$root/origin.git" work="$root/work"
  run_script "$SCRIPT_MAJOR" "$work" VERSION=1.2.3 TAG_PREFIX=v

  [ "$RUN_RC" -eq 0 ] && ok "update-major: exit 0" || bad "update-major: exit 0" "rc=$RUN_RC out=$RUN_OUT"
  origin_has_tag "$origin" v1 && ok "update-major: tag v1 force-pushed to origin" || bad "update-major: tag v1 force-pushed to origin"
  origin_has_tag "$origin" v1.2 && ok "update-major: tag v1.2 force-pushed to origin" || bad "update-major: tag v1.2 force-pushed to origin"
  grep -q '^major-tag=v1$' "$RUN_GHOUT" && ok "update-major: output major-tag=v1" || bad "update-major: output major-tag=v1" "$(cat "$RUN_GHOUT")"
  grep -q '^minor-tag=v1.2$' "$RUN_GHOUT" && ok "update-major: output minor-tag=v1.2" || bad "update-major: output minor-tag=v1.2" "$(cat "$RUN_GHOUT")"

  rm -rf "$root"
}

test_update_major_empty_prefix() {
  local root; root="$(build_plain_repo)"
  local origin="$root/origin.git" work="$root/work"
  run_script "$SCRIPT_MAJOR" "$work" VERSION=2.5.0 TAG_PREFIX=

  [ "$RUN_RC" -eq 0 ] && ok "update-major (no prefix): exit 0" || bad "update-major (no prefix): exit 0" "rc=$RUN_RC out=$RUN_OUT"
  origin_has_tag "$origin" 2 && ok "update-major (no prefix): tag 2 pushed to origin" || bad "update-major (no prefix): tag 2 pushed to origin"
  origin_has_tag "$origin" 2.5 && ok "update-major (no prefix): tag 2.5 pushed to origin" || bad "update-major (no prefix): tag 2.5 pushed to origin"
  grep -q '^major-tag=2$' "$RUN_GHOUT" && ok "update-major (no prefix): output major-tag=2" || bad "update-major (no prefix): output major-tag=2" "$(cat "$RUN_GHOUT")"
  grep -q '^minor-tag=2.5$' "$RUN_GHOUT" && ok "update-major (no prefix): output minor-tag=2.5" || bad "update-major (no prefix): output minor-tag=2.5" "$(cat "$RUN_GHOUT")"

  rm -rf "$root"
}

# ---------------------------------------------------------------- run

test_create_release_success
test_create_release_missing_tag
test_create_release_missing_token
test_tag_release_patch
test_tag_release_minor
test_tag_release_infer_feat_minor
test_tag_release_infer_breaking_bang_major
test_tag_release_infer_breaking_footer_major
test_tag_release_infer_fix_patch
test_tag_release_infer_unclear_patch
test_update_major_with_prefix
test_update_major_empty_prefix

printf '\n%d passed, %d failed\n' "$pass" "$fail"
[ "$fail" -eq 0 ]
