# 🏷️ tag-release-build — Bump, tag, release.

[![CI](https://github.com/heronlabs/action-tag-release-build/actions/workflows/continuous-integration.yml/badge.svg)](https://github.com/heronlabs/action-tag-release-build/actions/workflows/continuous-integration.yml)

> Bump `version.txt`, tag the commit, move floating major/minor tags, publish a GitHub release with a CHANGELOG — and optionally sync `package.json` or Claude Code plugin files.

The bump is driven by the `semantic` input. When `semantic` is omitted, the bump is **inferred from the merge/HEAD commit** using Conventional Commits — a breaking change (`feat!:`, `fix(api)!:`, or a `BREAKING CHANGE:` body) is `major`, a `feat:` commit is `minor`, and everything else (including unclear messages) falls back to `patch`.

## Contents

- [Usage](#usage)
  - [Minimal](#minimal)
  - [With package.json sync](#with-packagejson-sync)
  - [With Claude Code plugin sync](#with-claude-code-plugin-sync)
- [Inputs](#inputs)
- [Outputs](#outputs)
- [Permissions](#permissions)
- [How it works](#how-it-works)
- [Notes](#notes)
- [License](#license)

## Usage

Driven by `workflow_dispatch` with a `semantic` choice — the pattern used across the heronlabs repos.

```yaml
name: '[ CD ] | Tags'

on:
  workflow_dispatch:
    inputs:
      semantic:
        description: The SEMVER specification.
        required: true
        type: choice
        default: patch
        options:
          - major
          - minor
          - patch

permissions:
  contents: write

jobs:
  release:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@v6
        with:
          fetch-depth: 0
          token: ${{ secrets.PAT }}

      - run: git pull --rebase origin main

      - uses: heronlabs/action-tag-release-build@v4
        id: version
        with:
          gh_token: ${{ secrets.PAT }}
          semantic: ${{ inputs.semantic }}
```

The `id: version` step exposes the `version`, `tag`, `tag_major`, and `tag_minor` outputs for later steps — e.g. to alias a published image with both floating tags:

```yaml
- run: |
    echo "tag-alias=${{ steps.version.outputs.tag_major }},${{ steps.version.outputs.tag_minor }}" >> "$GITHUB_OUTPUT"
```

### Minimal

```yaml
- uses: heronlabs/action-tag-release-build@v4
  with:
    gh_token: ${{ secrets.PAT }}
    semantic: patch
```

### With package.json sync

```yaml
- uses: heronlabs/action-tag-release-build@v4
  with:
    gh_token: ${{ secrets.PAT }}
    semantic: minor
    bump_npm: 'true'
```

Requires `actions/setup-node` before this step.

### With Claude Code plugin sync

```yaml
- uses: heronlabs/action-tag-release-build@v4
  with:
    gh_token: ${{ secrets.PAT }}
    semantic: minor
    bump_claude: 'true'
    plugin_dir: '.'
```

Requires `jq` on the runner (GitHub-hosted runners include it).

## Inputs

| Name | Description | Required | Default |
|------|-------------|----------|---------|
| `gh_token` | Token used to push tags and create the release. Use a PAT to trigger downstream workflows. | Yes | — |
| `semantic` | Semver bump type: `major`, `minor`, or `patch`. When empty, the bump is inferred from the merge/HEAD commit (Conventional Commits), defaulting to `patch` when unclear. | No | `` (inferred) |
| `working-directory` | Sub-directory to operate in (for monorepos). | No | `.` |
| `version_file` | File to read and write the version number. | No | `version.txt` |
| `bump_npm` | Also bump `package.json` using `npm version`. Set up Node with `actions/setup-node` before this step. | No | `false` |
| `bump_claude` | Sync the version into Claude Code plugin files (`plugin.json` + `marketplace.json`). Requires `jq`. | No | `false` |
| `plugin_dir` | Directory containing the Claude plugin files. | No | `.` |
| `override_tag` | Move the floating major/minor tags (`v1`, `v1.0`) to the new release. | No | `true` |

## Outputs

| Name | Description |
|------|-------------|
| `version` | Released version (e.g. `1.0.3`). |
| `tag` | Created tag (e.g. `v1.0.3`). |
| `tag_major` | Floating major tag (e.g. `v1`). |
| `tag_minor` | Floating minor tag (e.g. `v1.0`). |

## Permissions

```yaml
permissions:
  contents: write
```

## Architecture

Maps to the `BumpCommand` interface — single entry point orchestrating services.

```
src/
  application/cli/              # Single entry point called from action.yml
    bump-command.sh              # Full pipeline: bump → sync → notes → commit → tag → release
  core/services/                 # Domain rules (no side effects)
    tagger-service.sh            # Tagger: classify_commit, calculate
    txt-service.sh               # Txt: getVersion, setVersion
  infrastructure/                # External systems
    git/git-ops-service.sh       # Git: getLastCommit, apply
    github/github-service.sh     # Github: generate_release_notes, update_changelog, create_github_release
    node/bumper-node-service.sh  # Bumper: getName, bumpVersion (package.json)
    claude/bumper-claude-service.sh  # Bumper: getName, bumpVersion (plugin.json + marketplace.json)
```

## How it works

**Bump-command** — the single entry point called from `action.yml`. Orchestrates the full pipeline:

1. Reads the current version from `version.txt` (`Txt.getVersion`)
2. Resolves the bump type: explicit `semantic` input, or inferred from the HEAD commit via Conventional Commits (`Tagger.classifyCommit` + `Git.getLastCommit`)
3. Computes the next semver (`Tagger.calculate`)
4. Writes the new version to `version.txt` (`Txt.setVersion`)
5. Syncs the version to enabled bumpers — `package.json` (node) and/or Claude Code plugin files (claude) (`Bumper.bumpVersion`)
6. Generates structured release notes from git log and prepends them to `CHANGELOG.md` (`Github.generate_release_notes` + `update_changelog`) — **before the git commit**, so the changelog is committed alongside the version bump
7. Commits all changes (`git add -A`), tags (`vX.Y.Z`), and pushes; when `override_tag` is `true`, also force-moves the floating major (`vX`) and minor (`vX.Y`) tags (`Git.apply`)
8. Creates the GitHub release with populated notes after the tag exists on the remote (`Github.create_github_release`)

Outputs `version`, `tag`, `tag_major`, and `tag_minor` to `GITHUB_OUTPUT`.

## Notes

- **Node** — only needed when `bump_npm` is `true`. Set up the toolchain with `actions/setup-node` before this action.
- **`[skip ci]`** — the bump commit is prefixed `[skip ci]` so it does not re-trigger CI.
- **Downstream triggers** — a tag pushed with the default `GITHUB_TOKEN` will **not** start other workflows. Pass a PAT as `gh_token` (and to `actions/checkout`) when a downstream pipeline must react to the new tag.

## License

MIT
