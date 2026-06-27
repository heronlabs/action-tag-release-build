#!/usr/bin/env bats
# bats tests for src/application/cli/github-release-command.sh
#
# Builds a throwaway git repo with tags, runs github-release-command.sh,
# and asserts on gh release create calls, release notes structure, and CHANGELOG.md.

setup() {
  SCRIPT="$BATS_TEST_DIRNAME/../src/application/cli/github-release-command.sh"
  STUB_DIR="$BATS_TEST_DIRNAME"
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

build_repo_with_tags() {
  local root work
  root="$(new_origin_work)"
  work="$root/work"

  # First commit + tag
  printf 'v1\n' >"$work/file.txt"
  git_q "$work" add -A
  git_q "$work" commit -m "init"
  git_q "$work" tag -a v1.0.0 -m "Release 1.0.0"
  git_q "$work" push -u origin main --tags

  # Second commit — simulate merge commits
  printf 'v2\n' >"$work/file.txt"
  git_q "$work" add -A
  git_q "$work" commit -m "feat: add new feature (#1)"
  printf 'v3\n' >"$work/file.txt"
  git_q "$work" add -A
  git_q "$work" commit -m "fix: resolve the bug (#2)"
  printf 'v4\n' >"$work/file.txt"
  git_q "$work" add -A
  git_q "$work" commit -m "Merge pull request #3 from heronlabs/topic"
  # Tag the current HEAD as v2.0.0
  git_q "$work" tag -a v2.0.0 -m "Release 2.0.0"

  printf '%s' "$root"
}

# Run the script with the gh stub on PATH.
# Sets RUN_OUT, RUN_RC, RUN_GHLOG.
run_script() {
  RUN_GHLOG="$(mktemp)"
  : >"$RUN_GHLOG"
  set +e
  RUN_OUT="$(
    cd "$BATS_TEST_DIRNAME" &&
    env -u GH_TOKEN -u TAG \
        PATH="$STUB_DIR:$PATH" \
        GH_LOG="$RUN_GHLOG" \
        "$@" \
        bash "$SCRIPT" 2>&1
  )"
  RUN_RC=$?
  set -e
}

# Run the script inside a repo context (needed for git describe, git log, etc.)
# Sets RUN_OUT, RUN_RC, RUN_GHLOG.
run_in_repo() {
  local cwd="$1"; shift
  RUN_GHLOG="$(mktemp)"
  RUN_GHOUT="$(mktemp)"
  : >"$RUN_GHLOG"
  set +e
  RUN_OUT="$(
    cd "$cwd" &&
    env -u GH_TOKEN -u TAG \
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

@test "create-release: creates release with --notes (not --generate-notes) and populates CHANGELOG.md" {
  local root; root="$(build_repo_with_tags)"
  local work="$root/work"
  run_in_repo "$work" GH_TOKEN=x TAG=v2.0.0 TAG_PREFIX=v

  [ "$RUN_RC" -eq 0 ]

  grep -q 'release create v2.0.0' "$RUN_GHLOG"
  grep -q -- '--title v2.0.0' "$RUN_GHLOG"
  run grep -q -- '--generate-notes' "$RUN_GHLOG"
  [ "$status" -ne 0 ]

  grep -q 'Released: v2.0.0' <<<"$RUN_OUT"

  [ -f "$work/CHANGELOG.md" ]
  grep -q '## v2.0.0' "$work/CHANGELOG.md"
  grep -q "feat:" "$work/CHANGELOG.md"
  grep -q "fix:" "$work/CHANGELOG.md"

  rm -rf "$root"
}

@test "create-release: missing TAG is hard error" {
  run_script GH_TOKEN=x

  [ "$RUN_RC" -ne 0 ]
}

@test "create-release: missing GH_TOKEN is hard error" {
  run_script TAG=v1.2.3

  [ "$RUN_RC" -ne 0 ]
}

@test "create-release: prepends new CHANGELOG entry above existing, preserving old entries" {
  local root; root="$(build_repo_with_tags)"
  local work="$root/work"

  # Pre-create a CHANGELOG.md with an old entry
  printf '## v1.0.0 (2024-01-01)\n\nInitial release\n\n' >"$work/CHANGELOG.md"
  git_q "$work" add "$work/CHANGELOG.md"
  git_q "$work" commit -m "add changelog"

  # Now tag v2.0.0. Re-tag after the new commit.
  git_q "$work" checkout -b new-tag
  git_q "$work" tag -f v2.0.0

  run_in_repo "$work" GH_TOKEN=x TAG=v2.0.0 TAG_PREFIX=v

  [ "$RUN_RC" -eq 0 ]

  head -1 "$work/CHANGELOG.md" | grep -q '^## v2.0.0'
  grep -q '## v1.0.0' "$work/CHANGELOG.md"

  rm -rf "$root"
}
