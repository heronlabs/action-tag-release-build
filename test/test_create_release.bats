#!/usr/bin/env bats
# bats tests for core/create-release.sh
#
# Points a `gh` stub at PATH and asserts on gh release create calls.

setup() {
  SCRIPT="$BATS_TEST_DIRNAME/../core/create-release.sh"
  STUB_DIR="$BATS_TEST_DIRNAME"
}

# Run the script with the gh stub on PATH.
# Usage: run_script [VAR=value ...]
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
        GITHUB_OUTPUT=/dev/null \
        "$@" \
        bash "$SCRIPT" 2>&1
  )"
  RUN_RC=$?
  set -e
}

@test "create-release success: gh release create with --generate-notes" {
  run_script GH_TOKEN=x TAG=v1.2.3

  [ "$RUN_RC" -eq 0 ]
  grep -q 'release create v1.2.3' "$RUN_GHLOG"
  grep -q -- '--title v1.2.3' "$RUN_GHLOG"
  grep -q -- '--generate-notes' "$RUN_GHLOG"
  grep -q 'Released: v1.2.3' <<<"$RUN_OUT"
}

@test "create-release: missing TAG is hard error" {
  run_script GH_TOKEN=x

  [ "$RUN_RC" -ne 0 ]
}

@test "create-release: missing GH_TOKEN is hard error" {
  run_script TAG=v1.2.3

  [ "$RUN_RC" -ne 0 ]
}
