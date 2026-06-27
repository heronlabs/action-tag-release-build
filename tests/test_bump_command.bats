#!/usr/bin/env bats
# bats tests for src/application/cli/bump-command.sh
#
# Covers the full bump-tag-release pipeline in a single command:
#   - bump + tag (explicit BUMP, inferred from commit)
#   - provider sync (package.json, claude plugin)
#   - major/minor tag override (UPDATE_MAJOR_TAG)
#   - release + changelog (CREATE_RELEASE + GH_TOKEN)

setup() {
  SCRIPT="$BATS_TEST_DIRNAME/../src/application/cli/bump-command.sh"
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

# Create a repo with tags for release-notes testing
build_repo_with_tags() {
  local root work
  root="$(new_origin_work)"
  work="$root/work"

  printf '1.0.0\n' >"$work/version.txt"
  printf 'v1\n' >"$work/file.txt"
  git_q "$work" add -A
  git_q "$work" commit -m "init"
  git_q "$work" tag -a v1.0.0 -m "Release 1.0.0"
  git_q "$work" push -u origin main --tags

  printf '2.0.0\n' >"$work/version.txt"
  printf 'v2\n' >"$work/file.txt"
  git_q "$work" add -A
  git_q "$work" commit -m "feat: add new feature (#1)"
  printf 'v3\n' >"$work/file.txt"
  git_q "$work" add -A
  git_q "$work" commit -m "fix: resolve the bug (#2)"
  git_q "$work" push

  printf '%s' "$root"
}

# Create a repo with everything: version.txt + package.json + plugin files + tags
build_repo_full() {
  local root work
  root="$(new_origin_work)"
  work="$root/work"

  printf '1.0.0\n' >"$work/version.txt"
  printf '{ "name": "x", "version": "1.0.0" }\n' >"$work/package.json"
  printf '{"name":"my-plugin","version":"1.0.0"}\n' >"$work/plugin.json"
  printf '[{"name":"my-plugin","version":"1.0.0"}]\n' >"$work/marketplace.json"
  git_q "$work" add -A
  git_q "$work" commit -m "init"
  git_q "$work" tag -a v1.0.0 -m "Release 1.0.0"
  git_q "$work" push -u origin main --tags

  printf '2.0.0\n' >"$work/version.txt"
  printf '{ "name": "x", "version": "2.0.0" }\n' >"$work/package.json"
  git_q "$work" add -A
  git_q "$work" commit -m "feat: add new feature (#1)"
  git_q "$work" push

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

# Run bump-command.sh in the given working tree.
# Usage: run_bump_command <cwd> [VAR=value ...]
# Sets RUN_OUT, RUN_RC, RUN_GHOUT, RUN_GHLOG.
run_bump_command() {
  local cwd="$1"; shift
  RUN_GHOUT="$(mktemp)"
  RUN_GHENV="$(mktemp)"
  RUN_GHLOG="$(mktemp)"
  : >"$RUN_GHLOG"
  set +e
  RUN_OUT="$(
    cd "$cwd" &&
    env -u BUMP \
        PATH="$STUB_DIR:$PATH" \
        GITHUB_OUTPUT="$RUN_GHOUT" \
        GITHUB_ENV="$RUN_GHENV" \
        GH_LOG="$RUN_GHLOG" \
        "$@" \
        bash "$SCRIPT" 2>&1
  )"
  RUN_RC=$?
  set -e
}

# ---- bump + tag ----

@test "bump: explicit BUMP=patch bumps 1.0.0 -> 1.0.1" {
  local root; root="$(build_repo)"
  local origin="$root/origin.git" work="$root/work"
  run_bump_command "$work" BUMP=patch REF_NAME=main CREATE_RELEASE=false UPDATE_MAJOR_TAG=false

  [ "$RUN_RC" -eq 0 ]
  [ "$(cat "$work/version.txt")" = "1.0.1" ]
  [ "$(git -C "$work" log -1 --pretty=%s)" = "[skip ci] bump v1.0.1" ]
  origin_has_tag "$origin" v1.0.1
  grep -q '^version=1.0.1$' "$RUN_GHOUT"
  grep -q '^tag=v1.0.1$' "$RUN_GHOUT"
  grep -q 'Tagged: v1.0.1' <<<"$RUN_OUT"

  rm -rf "$root"
}

@test "bump: explicit BUMP=minor bumps 1.0.0 -> 1.1.0" {
  local root; root="$(build_repo)"
  local origin="$root/origin.git" work="$root/work"
  run_bump_command "$work" BUMP=minor REF_NAME=main CREATE_RELEASE=false UPDATE_MAJOR_TAG=false

  [ "$RUN_RC" -eq 0 ]
  [ "$(cat "$work/version.txt")" = "1.1.0" ]
  origin_has_tag "$origin" v1.1.0
  grep -q '^tag=v1.1.0$' "$RUN_GHOUT"

  rm -rf "$root"
}

@test "bump: infer feat commit -> minor" {
  local root; root="$(build_repo)"
  local origin="$root/origin.git" work="$root/work"
  git_q "$work" commit --amend -m "feat: add a thing"
  run_bump_command "$work" REF_NAME=main CREATE_RELEASE=false UPDATE_MAJOR_TAG=false

  [ "$RUN_RC" -eq 0 ]
  [ "$(cat "$work/version.txt")" = "1.1.0" ]
  origin_has_tag "$origin" v1.1.0
  grep -q 'Bump: minor' <<<"$RUN_OUT"

  rm -rf "$root"
}

@test "bump: infer feat! breaking bang -> major" {
  local root; root="$(build_repo)"
  local origin="$root/origin.git" work="$root/work"
  git_q "$work" commit --amend -m "feat!: drop legacy api"
  run_bump_command "$work" REF_NAME=main CREATE_RELEASE=false UPDATE_MAJOR_TAG=false

  [ "$RUN_RC" -eq 0 ]
  [ "$(cat "$work/version.txt")" = "2.0.0" ]
  origin_has_tag "$origin" v2.0.0

  rm -rf "$root"
}

@test "bump: infer BREAKING CHANGE footer -> major" {
  local root; root="$(build_repo)"
  local origin="$root/origin.git" work="$root/work"
  git_q "$work" commit --amend -m "$(printf 'fix: tweak\n\nBREAKING CHANGE: drops support for X')"
  run_bump_command "$work" REF_NAME=main CREATE_RELEASE=false UPDATE_MAJOR_TAG=false

  [ "$RUN_RC" -eq 0 ]
  [ "$(cat "$work/version.txt")" = "2.0.0" ]
  origin_has_tag "$origin" v2.0.0

  rm -rf "$root"
}

@test "bump: infer fix commit -> patch" {
  local root; root="$(build_repo)"
  local origin="$root/origin.git" work="$root/work"
  git_q "$work" commit --amend -m "fix: correct a bug"
  run_bump_command "$work" REF_NAME=main CREATE_RELEASE=false UPDATE_MAJOR_TAG=false

  [ "$RUN_RC" -eq 0 ]
  [ "$(cat "$work/version.txt")" = "1.0.1" ]
  origin_has_tag "$origin" v1.0.1

  rm -rf "$root"
}

@test "bump: infer non-conventional commit -> default patch" {
  local root; root="$(build_repo)"
  local origin="$root/origin.git" work="$root/work"
  git_q "$work" commit --amend -m "Merge pull request #7 from heronlabs/topic"
  run_bump_command "$work" REF_NAME=main CREATE_RELEASE=false UPDATE_MAJOR_TAG=false

  [ "$RUN_RC" -eq 0 ]
  [ "$(cat "$work/version.txt")" = "1.0.1" ]
  origin_has_tag "$origin" v1.0.1

  rm -rf "$root"
}

@test "bump: explicit BUMP overrides inference (patch wins over feat!)" {
  local root; root="$(build_repo)"
  local origin="$root/origin.git" work="$root/work"
  git_q "$work" commit --amend -m "feat!: drop legacy api"
  run_bump_command "$work" BUMP=patch REF_NAME=main CREATE_RELEASE=false UPDATE_MAJOR_TAG=false

  [ "$RUN_RC" -eq 0 ]
  [ "$(cat "$work/version.txt")" = "1.0.1" ]
  origin_has_tag "$origin" v1.0.1

  rm -rf "$root"
}

@test "bump: BUMP=major 1.0.0 -> 2.0.0" {
  local root; root="$(build_repo)"
  local origin="$root/origin.git" work="$root/work"
  run_bump_command "$work" BUMP=major REF_NAME=main CREATE_RELEASE=false UPDATE_MAJOR_TAG=false

  [ "$RUN_RC" -eq 0 ]
  [ "$(cat "$work/version.txt")" = "2.0.0" ]
  grep -q '^version=2.0.0$' "$RUN_GHOUT"
  origin_has_tag "$origin" v2.0.0

  rm -rf "$root"
}

# ---- provider sync ----

@test "bump: with package.json sync" {
  local root; root="$(build_repo_with_package_json)"
  local origin="$root/origin.git" work="$root/work"
  run_bump_command "$work" BUMP=minor REF_NAME=main UPDATE_PACKAGE_JSON=true CREATE_RELEASE=false UPDATE_MAJOR_TAG=false

  [ "$RUN_RC" -eq 0 ]
  [ "$(cat "$work/version.txt")" = "1.1.0" ]
  origin_has_tag "$origin" v1.1.0

  rm -rf "$root"
}

@test "bump: with claude plugin sync" {
  local root; root="$(build_repo_with_plugin)"
  local origin="$root/origin.git" work="$root/work"
  run_bump_command "$work" BUMP=minor REF_NAME=main BUMP_CLAUDE_PLUGIN=true PLUGIN_DIR=. CREATE_RELEASE=false UPDATE_MAJOR_TAG=false

  [ "$RUN_RC" -eq 0 ]
  [ "$(cat "$work/version.txt")" = "1.1.0" ]
  origin_has_tag "$origin" v1.1.0

  rm -rf "$root"
}

# ---- major/minor tag override ----

@test "bump: UPDATE_MAJOR_TAG=true force-pushes v1 and v1.1 floating tags" {
  local root; root="$(build_repo)"
  local origin="$root/origin.git" work="$root/work"
  run_bump_command "$work" BUMP=minor REF_NAME=main UPDATE_MAJOR_TAG=true CREATE_RELEASE=false

  [ "$RUN_RC" -eq 0 ]
  origin_has_tag "$origin" v1
  origin_has_tag "$origin" v1.1
  grep -q '^major-tag=v1$' "$RUN_GHOUT"
  grep -q '^minor-tag=v1.1$' "$RUN_GHOUT"
  grep -q 'Updated floating tags' <<<"$RUN_OUT"

  rm -rf "$root"
}

@test "bump: UPDATE_MAJOR_TAG=false does NOT push floating tags" {
  local root; root="$(build_repo)"
  local origin="$root/origin.git" work="$root/work"
  run_bump_command "$work" BUMP=patch REF_NAME=main UPDATE_MAJOR_TAG=false CREATE_RELEASE=false

  [ "$RUN_RC" -eq 0 ]
  origin_has_tag "$origin" v1.0.1
  # v1 should NOT exist (override disabled)
  run origin_has_tag "$origin" v1
  [ "$status" -ne 0 ]

  rm -rf "$root"
}

# ---- release + changelog ----

@test "bump: CREATE_RELEASE=true creates release with notes and CHANGELOG.md" {
  local root; root="$(build_repo_with_tags)"
  local origin="$root/origin.git" work="$root/work"
  run_bump_command "$work" BUMP=patch REF_NAME=main CREATE_RELEASE=true UPDATE_MAJOR_TAG=false GH_TOKEN=x

  [ "$RUN_RC" -eq 0 ]

  # gh release create was called (not --generate-notes)
  grep -q 'gh release create v2.0.1' "$RUN_GHLOG"
  grep -q -- '--title v2.0.1' "$RUN_GHLOG"
  run grep -q -- '--generate-notes' "$RUN_GHLOG"
  [ "$status" -ne 0 ]

  grep -q 'Released: v2.0.1' <<<"$RUN_OUT"

  [ -f "$work/CHANGELOG.md" ]
  grep -q '## v2.0.1' "$work/CHANGELOG.md"
  grep -q "feat:" "$work/CHANGELOG.md"
  grep -q "fix:" "$work/CHANGELOG.md"

  rm -rf "$root"
}

@test "bump: CREATE_RELEASE=true GH_TOKEN missing is hard error" {
  local root; root="$(build_repo)"
  local origin="$root/origin.git" work="$root/work"
  run_bump_command "$work" BUMP=patch REF_NAME=main CREATE_RELEASE=true UPDATE_MAJOR_TAG=false

  [ "$RUN_RC" -ne 0 ]

  rm -rf "$root"
}

@test "bump: CREATE_RELEASE=false skips release and changelog" {
  local root; root="$(build_repo_with_tags)"
  local origin="$root/origin.git" work="$root/work"
  run_bump_command "$work" BUMP=patch REF_NAME=main CREATE_RELEASE=false UPDATE_MAJOR_TAG=false

  [ "$RUN_RC" -eq 0 ]
  [ ! -f "$work/CHANGELOG.md" ]
  # gh should NOT have been called
  run grep -q 'gh release create' "$RUN_GHLOG"
  [ "$status" -ne 0 ]

  rm -rf "$root"
}

@test "bump: release prepends new CHANGELOG entry above old entries" {
  local root; root="$(build_repo_with_tags)"
  local origin="$root/origin.git" work="$root/work"

  # Pre-create a CHANGELOG.md with an old entry
  printf '## v1.0.0 (2024-01-01)\n\nInitial release\n\n' >"$work/CHANGELOG.md"
  git_q "$work" add "$work/CHANGELOG.md"
  git_q "$work" commit -m "add changelog"
  git_q "$work" push

  run_bump_command "$work" BUMP=patch REF_NAME=main CREATE_RELEASE=true UPDATE_MAJOR_TAG=false GH_TOKEN=x

  [ "$RUN_RC" -eq 0 ]

  head -1 "$work/CHANGELOG.md" | grep -q '^## v2.0.1'
  grep -q '## v1.0.0' "$work/CHANGELOG.md"

  rm -rf "$root"
}

# ---- full pipeline (all features enabled) ----

@test "bump: full pipeline — bump, provider sync, major tags, release, changelog" {
  local root; root="$(build_repo_full)"
  local origin="$root/origin.git" work="$root/work"
  run_bump_command "$work" BUMP=minor REF_NAME=main UPDATE_PACKAGE_JSON=true BUMP_CLAUDE_PLUGIN=true PLUGIN_DIR=. UPDATE_MAJOR_TAG=true CREATE_RELEASE=true GH_TOKEN=x

  [ "$RUN_RC" -eq 0 ]

  # version bumped
  [ "$(cat "$work/version.txt")" = "2.1.0" ]

  # tagged
  origin_has_tag "$origin" v2.1.0

  # floating tags
  grep -q '^major-tag=v2$' "$RUN_GHOUT"
  grep -q '^minor-tag=v2.1$' "$RUN_GHOUT"

  # release created
  grep -q 'gh release create v2.1.0' "$RUN_GHLOG"
  grep -q 'Released: v2.1.0' <<<"$RUN_OUT"

  # changelog created
  [ -f "$work/CHANGELOG.md" ]
  grep -q '## v2.1.0' "$work/CHANGELOG.md"

  rm -rf "$root"
}
