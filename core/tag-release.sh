#!/usr/bin/env bash

set -euo pipefail

: "${TAG_PREFIX?TAG_PREFIX must be set}"
: "${REF_NAME:?REF_NAME is required}"
: "${GITHUB_OUTPUT:?GITHUB_OUTPUT is required}"

VERSION_FILE="${VERSION_FILE:-version.txt}"

# ---------------------------------------------------------------------------
# Inference functions — kept here for standalone/documentation use. When the
# action.yml orchestrates the workflow, bump-version-file.sh (run as a prior
# step) handles inference directly.
# ---------------------------------------------------------------------------
# classify_commit: classify a Conventional Commits message into a semver bump:
#   major - `!` after the type/scope (feat!:, fix(api)!:) or a BREAKING CHANGE token
#   minor - a non-breaking feat commit
#   patch - everything else (the default when the message is unclear)
classify_commit() {
  local message="$1" subject
  subject="${message%%$'\n'*}"

  if [[ "$subject" =~ ^[a-zA-Z]+(\([^\)]*\))?!: ]] \
     || grep -qE '(^|[[:space:]])BREAKING[ -]CHANGE:' <<<"$message"; then
    echo major
  elif [[ "$subject" =~ ^feat(\([^\)]*\))?: ]]; then
    echo minor
  else
    echo patch
  fi
}

# resolve_bump: explicit SPEC wins; omitted/empty infers from HEAD commit.
resolve_bump() {
  if [[ -n "${SPEC:-}" ]]; then
    echo "${SPEC}"
  else
    classify_commit "$(git log -1 --pretty=%B)"
  fi
}

# Identify the bot author for the bump commit and tag.
git config user.name "github-actions[bot]"
git config user.email "github-actions[bot]@users.noreply.github.com"

# Read the already-bumped version from the version file.
if [[ ! -f "$VERSION_FILE" ]]; then
  echo "error: version file '${VERSION_FILE}' not found — run bump-version-file.sh first" >&2
  exit 1
fi

VERSION="$(< "$VERSION_FILE")"
# Trim whitespace
VERSION="$(printf '%s' "$VERSION" | xargs)"

if [[ -z "$VERSION" ]]; then
  echo "error: version file '${VERSION_FILE}' is empty" >&2
  exit 1
fi

TAG="${TAG_PREFIX}${VERSION}"

# Collect additional files that may have been modified by opt-in scripts
# (bump-package-json.sh, sync-claude-plugin.sh).
ADDITIONAL_FILES=()
if [[ -f package.json ]]; then
  ADDITIONAL_FILES+=( package.json )
fi
if [[ -f package-lock.json ]]; then
  ADDITIONAL_FILES+=( package-lock.json )
fi
if [[ -f plugin.json ]]; then
  ADDITIONAL_FILES+=( plugin.json )
fi
if [[ -f marketplace.json ]]; then
  ADDITIONAL_FILES+=( marketplace.json )
fi

# Commit the bump, rebase onto the latest remote state, then create an
# annotated release tag and push the commit and tag together.
git add "$VERSION_FILE" ${ADDITIONAL_FILES[@]+"${ADDITIONAL_FILES[@]}"}
git commit -m "[skip ci] bump v${VERSION}"
git pull --rebase origin "${REF_NAME}"
git tag -a "${TAG}" -m "Release ${VERSION}"
git push --follow-tags

echo "version=${VERSION}" >> "${GITHUB_OUTPUT}"
echo "tag=${TAG}" >> "${GITHUB_OUTPUT}"
echo "✅ Tagged: ${TAG}"
