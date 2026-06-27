#!/usr/bin/env bash
# GitHub operations: release notes, changelog, release creation.
#
#   generate_release_notes(prev_tag, current_tag) -> notes markdown
#   update_changelog(tag, notes, changelog_file)
#   create_github_release(tag, notes)
#   github_create_release_changelog_notes(tag)  -> combined entry point

set -euo pipefail

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
    repo_url=""
  fi

  local notes=""
  local new_authors=""

  # Use tab delimiter since commit messages may contain pipes.
  while IFS=$'\t' read -r msg hash author; do
    [[ -z "$msg" ]] && continue

    local sha_short="${hash:0:7}"

    local type="other"
    local display_msg="$msg"
    if [[ "$msg" =~ ^(feat|fix|chore|docs|refactor|test|perf|ci|build|style|revert)(\([^\)]*\))?!?: ]]; then
      type="${BASH_REMATCH[1]}"
      display_msg="${msg#*: }"
    fi

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

  # New Contributors section
  local new_contributors_section=""
  if [[ -n "$new_authors" ]]; then
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

update_changelog() {
  local tag="$1" notes="$2" changelog_file="${3:-CHANGELOG.md}"

  local entry
  entry="## ${tag} ($(date '+%Y-%m-%d'))"
  entry+=$'\n\n'
  entry+="${notes}"
  entry+=$'\n\n'

  if [[ -f "$changelog_file" ]]; then
    { echo -n "$entry"; cat "$changelog_file"; } > "${changelog_file}.tmp" \
      && mv "${changelog_file}.tmp" "$changelog_file"
  else
    echo -n "$entry" > "$changelog_file"
  fi
  echo "✅ Updated ${changelog_file}"
}

create_github_release() {
  local tag="$1" notes="$2"

  gh release create "${tag}" \
    --title "${tag}" \
    --notes "${notes}"

  echo "✅ Released: ${tag}"
}

# Combined entry point: generate notes, update changelog, create release.
github_create_release_changelog_notes() {
  local tag="$1"
  local changelog_file="${CHANGELOG_FILE:-CHANGELOG.md}"

  local prev_tag
  prev_tag="$(git describe --tags --abbrev=0 "${tag}^" 2>/dev/null || true)"

  local notes
  notes="$(generate_release_notes "$prev_tag" "$tag")"

  update_changelog "$tag" "$notes" "$changelog_file"
  create_github_release "$tag" "$notes"
}
