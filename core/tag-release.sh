#!/usr/bin/env bash

set -euo pipefail

: "${TAG_PREFIX?TAG_PREFIX must be set}"
: "${REF_NAME:?REF_NAME is required}"
: "${GITHUB_OUTPUT:?GITHUB_OUTPUT is required}"

# Classify a Conventional Commits message into a semver bump:
#   major - `!` after the type/scope (feat!:, fix(api)!:) or a BREAKING CHANGE token
#   minor - a non-breaking feat commit
#   patch - everything else (the default when the message is unclear)
classify_commit() {
  local message="$1" subject
  subject="${message%%$'\n'*}"

  if [[ "$subject" =~ ^[a-zA-Z]+(\([^\)]*\))?! ]] \
     || grep -qE '(^|[[:space:]])BREAKING[ -]CHANGE:' <<<"$message"; then
    echo major
  elif [[ "$subject" =~ ^feat(\([^\)]*\))?: ]]; then
    echo minor
  else
    echo patch
  fi
}

# Resolve the effective bump: an explicit SPEC wins verbatim; an omitted/empty
# SPEC infers the bump from the HEAD (merge) commit message, defaulting to patch.
resolve_bump() {
  if [[ -n "${SPEC:-}" ]]; then
    echo "${SPEC}"
  else
    classify_commit "$(git log -1 --pretty=%B)"
  fi
}

BUMP="$(resolve_bump)"
if [[ -n "${SPEC:-}" ]]; then
  echo "ℹ️  Bump: ${BUMP} (explicit spec)"
else
  echo "ℹ️  Bump: ${BUMP} (inferred from commit)"
fi

# Identify the bot author for the bump commit and tag.
git config user.name "github-actions[bot]"
git config user.email "github-actions[bot]@users.noreply.github.com"

# Bump the version in package.json without creating a git tag (we tag below).
npm version "${BUMP}" --no-git-tag-version

VERSION=$(node -p "require('./package.json').version")
TAG="${TAG_PREFIX}${VERSION}"

# Commit the bump, rebase onto the latest remote state, then create an
# annotated release tag and push the commit and tag together.
git add package.json package-lock.json 2>/dev/null || git add package.json
git commit -m "[skip ci] bump version"
git pull --rebase origin "${REF_NAME}"
git tag -a "${TAG}" -m "Release ${VERSION}"
git push --follow-tags

echo "version=${VERSION}" >> "${GITHUB_OUTPUT}"
echo "tag=${TAG}" >> "${GITHUB_OUTPUT}"
echo "✅ Tagged: ${TAG}"
