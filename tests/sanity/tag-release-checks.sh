#!/usr/bin/env bash

# verify-release.sh — sanity check a release after the CD workflow publishes.
# Verifies the tag, GitHub release, changelog entry, version file, and synced
# target branches. Exits 1 (fail-fast) on the first check that fails.

set -euo pipefail

GREEN=$'\033[0;32m'
RED=$'\033[0;31m'
NC=$'\033[0m'

usage() {
  cat <<'EOF'
Usage: verify-release.sh --tag <tag> --version <version> --released-refs '<json>' [options]

Verifies a release ran correctly:
  - tag exists on the origin remote
  - GitHub release exists
  - CHANGELOG contains the release heading
  - version file content matches the released version
  - synced target branches point at the released SHA

Options:
  --tag <tag>              Released tag (e.g. v1.2.3) [required]
  --version <version>      Released version (e.g. 1.2.3) [required]
  --released-refs <json>   JSON array of released refs, e.g.
                           [{"target":"main","sha":"abc123"},
                            {"target":"staging","sha":"abc123"}]
                           The first entry is the source ref and is skipped.
                           [required]
  --version-file <file>    Version file to check (default: version.txt)
  --changelog-file <file>  Changelog file to check (default: CHANGELOG.md)
  --help                   Show this help and exit
EOF
}

die() {
  echo -e "${RED}✗${NC} $1" >&2
  exit 1
}

pass() {
  echo -e "${GREEN}✓${NC} $1"
}

TAG=""
VERSION=""
RELEASED_REFS=""
VERSION_FILE="version.txt"
CHANGELOG_FILE="CHANGELOG.md"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --tag)
      TAG="${2:-}"
      shift 2
      ;;
    --version)
      VERSION="${2:-}"
      shift 2
      ;;
    --released-refs)
      RELEASED_REFS="${2:-}"
      shift 2
      ;;
    --version-file)
      VERSION_FILE="${2:-}"
      shift 2
      ;;
    --changelog-file)
      CHANGELOG_FILE="${2:-}"
      shift 2
      ;;
    --help)
      usage
      exit 0
      ;;
    *)
      echo -e "${RED}✗${NC} unknown argument: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if [[ -z "$TAG" || -z "$VERSION" || -z "$RELEASED_REFS" ]]; then
  echo -e "${RED}✗${NC} --tag, --version and --released-refs are required" >&2
  usage >&2
  exit 1
fi

for cmd in git gh jq; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    die "required command not found: $cmd. Install it or run the script on a GitHub Actions ubuntu runner"
  fi
done

if ! jq -e 'type == "array"' <<<"$RELEASED_REFS" >/dev/null 2>&1; then
  die "released-refs: expected a JSON array, got: $RELEASED_REFS. Check the releasedRefs output of the release step"
fi

echo "Verifying release $TAG (version $VERSION)..."

# 1. Tag on remote
ls_remote_tags="$(git ls-remote --tags origin "$TAG" 2>/dev/null || true)"
if [[ -z "$ls_remote_tags" ]] || ! grep -q "refs/tags/${TAG}$" <<<"$ls_remote_tags"; then
  die "tag on remote: expected origin to advertise refs/tags/${TAG}, but 'git ls-remote --tags origin $TAG' found nothing.
  found: ${ls_remote_tags:-no matching ref}
  suggestion: inspect the tag step logs; run 'git ls-remote --tags origin $TAG' and 'git tag -l' to confirm the tag was pushed"
fi
pass "tag $TAG exists on origin"

# 2. GitHub release exists
if gh_release_output="$(gh release view "$TAG" 2>&1)"; then
  pass "GitHub release $TAG exists"
else
  gh_release_rc=$?
  die "GitHub release: expected 'gh release view $TAG' to exit 0, but it exited ${gh_release_rc}.
  found: ${gh_release_output:-<no output>}
  suggestion: run 'gh release view $TAG' locally with GH_TOKEN set; inspect the release step logs"
fi

# 3. CHANGELOG entry
if ! grep -q -- "## $TAG" "$CHANGELOG_FILE" 2>/dev/null; then
  die "changelog: expected an entry '## $TAG' in $CHANGELOG_FILE, but none found.
  found: $(grep -h '^## ' "$CHANGELOG_FILE" 2>/dev/null | head -5 || true)
  suggestion: inspect the changelog step logs; run 'grep -n \"^## \" $CHANGELOG_FILE' to list headings"
fi
pass "changelog entry '## $TAG' found in $CHANGELOG_FILE"

# 4. version file matches
if [[ ! -f "$VERSION_FILE" ]]; then
  die "version file: expected $VERSION_FILE to contain '$VERSION', but the file does not exist.
  suggestion: confirm the semver service wrote the version; run 'ls -la' in the checkout"
fi
file_version="$(cat "$VERSION_FILE")"
if [[ "$file_version" != "$VERSION" ]]; then
  die "version file: expected $VERSION_FILE to contain exactly '$VERSION', but found '${file_version:-<empty>}'.
  suggestion: run 'cat $VERSION_FILE' and compare with the version output of the release step"
fi
pass "version file $VERSION_FILE contains $VERSION"

# 5. Sync targets at expected SHA (skip first entry: the source ref)
target_count="$(jq 'length' <<<"$RELEASED_REFS")"
if [[ "$target_count" -le 1 ]]; then
  pass "no sync targets to verify ($target_count released ref(s))"
else
  for ((i = 1; i < target_count; i++)); do
    target="$(jq -r --argjson idx "$i" '.[$idx].target' <<<"$RELEASED_REFS")"
    expected_sha="$(jq -r --argjson idx "$i" '.[$idx].sha' <<<"$RELEASED_REFS")"
    ls_remote_heads="$(git ls-remote --heads origin "$target" 2>/dev/null || true)"
    actual_sha="$(awk '{print $1}' <<<"$ls_remote_heads")"
    if [[ -z "$actual_sha" ]]; then
      die "sync target $target: expected origin/$target to point at $expected_sha, but 'git ls-remote --heads origin $target' returned nothing.
      suggestion: confirm the target branch exists on the remote; inspect the sync step logs"
    fi
    if [[ "$actual_sha" != "$expected_sha" ]]; then
      die "sync target $target: expected origin/$target at $expected_sha, but found $actual_sha.
      suggestion: run 'git ls-remote --heads origin $target' and compare with the releasedRefs output; the target may have moved after the release"
    fi
    pass "sync target $target at $expected_sha"
  done
fi

echo ""
echo -e "${GREEN}All checks passed for $TAG (version $VERSION).${NC}"
