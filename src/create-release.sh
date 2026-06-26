#!/usr/bin/env bash
# Create a GitHub release with structured release notes and CHANGELOG.md.
#
# Required env: GH_TOKEN, TAG
# Optional env: TAG_PREFIX (default: v), VERSION (read from git tag),
#               CHANGELOG_FILE (default: CHANGELOG.md)
#
# Usage:
#   GH_TOKEN=x TAG=v1.2.3 bash src/create-release.sh

set -euo pipefail

: "${GH_TOKEN:?GH_TOKEN is required}"
: "${TAG:?TAG is required}"

TAG_PREFIX="${TAG_PREFIX:-v}"

# Derive the previous tag for changelog diff.
# We look for the most recent tag that is strictly before HEAD.
PREV_TAG="$(git describe --tags --abbrev=0 "${TAG}^" 2>/dev/null || true)"

generate_release_notes() {
  local prev="$1" current="$2"

  if [[ -z "$prev" ]]; then
    echo "## ${current}"
    echo ""
    echo "Initial release — no previous tag to compare against."
    echo ""
    return
  fi

  local repo_url
  repo_url="$(git remote get-url origin 2>/dev/null || true)"
  # Normalize various URL formats to https://github.com/...
  if [[ "$repo_url" =~ git@github\.com: ]]; then
    repo_url="https://github.com/${repo_url#*:}"
    repo_url="${repo_url%.git}"
  elif [[ "$repo_url" =~ ^https://github\.com/ ]]; then
    repo_url="${repo_url%.git}"
  elif [[ "$repo_url" =~ ^git://github\.com/ ]]; then
    repo_url="https://${repo_url#git://}"
    repo_url="${repo_url%.git}"
  else
    # Non-GitHub or local URL — skip link generation
    repo_url=""
  fi

  local notes=""
  local new_authors=""

  # Get commits grouped by type.
  # Use tab delimiter (\x09) since commit messages may contain pipes.
  while IFS=$'\t' read -r msg hash author; do
    # Skip empty lines (e.g. from git log with no output)
    [[ -z "$msg" ]] && continue

    local sha_short="${hash:0:7}"

    # Determine type from conventional commit prefix
    local type="other"
    local display_msg="$msg"
    if [[ "$msg" =~ ^(feat|fix|chore|docs|refactor|test|perf|ci|build|style|revert)(\([^\)]*\))?!?: ]]; then
      type="${BASH_REMATCH[1]}"
      # Strip conventional commit prefix for cleaner display
      display_msg="${msg#*: }"
    fi

    # Check if author has commits before this release (new contributor detection)
    local is_new_contributor=0
    if [[ -n "$prev" ]]; then
      if ! git log "$prev" --author="$author" --oneline 2>/dev/null | grep -q .; then
        is_new_contributor=1
      fi
    fi
    if [[ "$is_new_contributor" -eq 1 && "$new_authors" != *"|${author}|"* ]]; then
      new_authors="${new_authors}|${author}|"
    fi

    local link=""
    if [[ -n "$repo_url" ]]; then
      link=" ([${sha_short}](${repo_url}/commit/${hash}))"
    fi

    case "$type" in
      feat)     notes+="* **feat:** ${display_msg}${link} @${author}"$'\n' ;;
      fix)      notes+="* **fix:** ${display_msg}${link} @${author}"$'\n' ;;
      chore)    notes+="* **chore:** ${display_msg}${link} @${author}"$'\n' ;;
      docs)     notes+="* **docs:** ${display_msg}${link} @${author}"$'\n' ;;
      refactor) notes+="* **refactor:** ${display_msg}${link} @${author}"$'\n' ;;
      test)     notes+="* **test:** ${display_msg}${link} @${author}"$'\n' ;;
      perf)     notes+="* **perf:** ${display_msg}${link} @${author}"$'\n' ;;
      ci)       notes+="* **ci:** ${display_msg}${link} @${author}"$'\n' ;;
      build)    notes+="* **build:** ${display_msg}${link} @${author}"$'\n' ;;
      style)    notes+="* **style:** ${display_msg}${link} @${author}"$'\n' ;;
      revert)   notes+="* **revert:** ${display_msg}${link} @${author}"$'\n' ;;
      *)        notes+="* ${display_msg}${link} @${author}"$'\n' ;;
    esac
  done < <(git log "${prev}..HEAD" --pretty=tformat:"%s%x09%H%x09%an" 2>/dev/null || true)

  local result="## What's Changed"
  result+=$'\n'
  result+="${notes}"

  # Add New Contributors section
  local new_contributors_section=""
  if [[ -n "$new_authors" ]]; then
    # Parse the |author| format
    local temp_authors="$new_authors"
    while [[ "$temp_authors" == *"|"* ]]; do
      temp_authors="${temp_authors#|}"
      local author="${temp_authors%%|*}"
      temp_authors="${temp_authors#*|}"
      local first_sha
      first_sha="$(git log --author="$author" --pretty=format:"%H" HEAD 2>/dev/null | tail -1)"
      local sha_short="${first_sha:0:7}"
      local link=""
      if [[ -n "$repo_url" ]]; then
        link="[${sha_short}](${repo_url}/commit/${first_sha})"
      fi
      new_contributors_section+="* @${author} made their first contribution in ${link}"$'\n'
    done
  fi

  if [[ -n "$new_contributors_section" ]]; then
    result+=$'\n'"## New Contributors"$'\n'
    result+="${new_contributors_section}"
  fi

  # Full Changelog link
  local changelog_link
  if [[ -n "$repo_url" ]]; then
    changelog_link="${repo_url}/compare/${prev}...${current}"
    result+=$'\n'"**Full Changelog**: ${changelog_link}"
  fi

  echo "$result"
}

# Generate release notes
NOTES="$(generate_release_notes "$PREV_TAG" "$TAG")"

# Prepend to CHANGELOG.md (create if not exists)
CHANGELOG_FILE="${CHANGELOG_FILE:-CHANGELOG.md}"
CHANGELOG_ENTRY="## ${TAG} ($(date '+%Y-%m-%d'))"
CHANGELOG_ENTRY+=$'\n\n'
CHANGELOG_ENTRY+="${NOTES}"
CHANGELOG_ENTRY+=$'\n\n'

if [[ -f "$CHANGELOG_FILE" ]]; then
  # Prepend to existing changelog
  { echo -n "$CHANGELOG_ENTRY"; cat "$CHANGELOG_FILE"; } > "${CHANGELOG_FILE}.tmp" && mv "${CHANGELOG_FILE}.tmp" "$CHANGELOG_FILE"
else
  echo -n "$CHANGELOG_ENTRY" > "$CHANGELOG_FILE"
fi
echo "✅ Updated ${CHANGELOG_FILE}"

# Create the GitHub release with populated notes (not auto-generated).
gh release create "${TAG}" \
  --title "${TAG}" \
  --notes "${NOTES}"

echo "✅ Released: ${TAG}"
