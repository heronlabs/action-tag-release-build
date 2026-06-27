# 🏷️ tag-release-build — Bump, tag, release.

[![CI](https://github.com/heronlabs/action-tag-release-build/actions/workflows/continuous-integration.yml/badge.svg)](https://github.com/heronlabs/action-tag-release-build/actions/workflows/continuous-integration.yml)

> Bump `version.txt`, tag the commit, move floating major/minor tags, publish a GitHub release with a CHANGELOG — and optionally sync `package.json` or Claude Code plugin files.

The bump is driven by the `spec` input. When `spec` is omitted, the bump is **inferred from the merge/HEAD commit** using Conventional Commits — a breaking change (`feat!:`, `fix(api)!:`, or a `BREAKING CHANGE:` body) is `major`, a `feat:` commit is `minor`, and everything else (including unclear messages) falls back to `patch`.

## Contents

- [Usage](#usage)
  - [Minimal (tag only)](#tag-only-no-github-release)
  - [With package.json sync](#with-packagejson-sync)
  - [With Claude Code plugin sync](#with-claude-code-plugin-sync)
  - [Monorepo sub-package](#monorepo-sub-package)
- [Inputs](#inputs)
- [Outputs](#outputs)
- [Permissions](#permissions)
- [How it works](#how-it-works)
- [Notes](#notes)
- [License](#license)

## Usage

Driven by `workflow_dispatch` with a `spec` choice — the pattern used across the heronlabs repos.

```yaml
name: '[ CD ] | Tags'

on:
  workflow_dispatch:
    inputs:
      spec:
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
          github-token: ${{ secrets.PAT }}
          spec: ${{ inputs.spec }}
```

The `id: version` step exposes the `version`, `tag`, `major-tag`, and `minor-tag` outputs for later steps — e.g. to alias a published image with both floating tags:

```yaml
- run: |
    echo "tag-alias=${{ steps.version.outputs.major-tag }},${{ steps.version.outputs.minor-tag }}" >> "$GITHUB_OUTPUT"
```

### Tag only (no GitHub release)

```yaml
- uses: heronlabs/action-tag-release-build@v4
  with:
    github-token: ${{ secrets.PAT }}
    spec: patch
    create-release: 'false'
```

### With package.json sync

```yaml
- uses: heronlabs/action-tag-release-build@v4
  with:
    github-token: ${{ secrets.PAT }}
    spec: minor
    update-package-json: 'true'
```

Requires `actions/setup-node` before this step.

### With Claude Code plugin sync

```yaml
- uses: heronlabs/action-tag-release-build@v4
  with:
    github-token: ${{ secrets.PAT }}
    spec: minor
    bump-claude-plugin: 'true'
    plugin-dir: '.'
```

Requires `jq` on the runner (GitHub-hosted runners include it).

### Monorepo sub-package

```yaml
- uses: heronlabs/action-tag-release-build@v4
  with:
    github-token: ${{ secrets.PAT }}
    spec: minor
    working-directory: packages/my-package
    tag-prefix: 'my-package-v'
```

Creates tags like `my-package-v1.1.0`.

## Inputs

| Name | Description | Required | Default |
|------|-------------|----------|---------|
| `github-token` | Token used to push tags and create the release. Use a PAT to trigger downstream workflows. | Yes | — |
| `spec` | Semver bump type: `major`, `minor`, or `patch`. When empty, the bump is inferred from the merge/HEAD commit (Conventional Commits), defaulting to `patch` when unclear. | No | `` (inferred) |
| `working-directory` | Sub-directory to operate in (for monorepos). | No | `.` |
| `version-file` | File to read and write the version number. | No | `version.txt` |
| `update-package-json` | Also bump `package.json` using `npm version`. Set up Node with `actions/setup-node` before this step. | No | `false` |
| `bump-claude-plugin` | Sync the version into Claude Code plugin files (`plugin.json` + `marketplace.json`). Requires `jq`. | No | `false` |
| `plugin-dir` | Directory containing the Claude plugin files. | No | `.` |
| `create-release` | Create a GitHub release after tagging. | No | `true` |
| `changelog` | Generate `CHANGELOG.md` and populated GitHub release notes. | No | `true` |
| `tag-prefix` | Tag prefix (e.g. `my-package-v`). | No | `v` |
| `update-major-tag` | Move the floating major/minor tags to the new release. | No | `true` |

## Outputs

| Name | Description |
|------|-------------|
| `version` | Released version (e.g. `1.0.3`). |
| `tag` | Created tag (e.g. `v1.0.3`). |
| `major-tag` | Floating major tag (e.g. `v1`). |
| `minor-tag` | Floating minor tag (e.g. `v1.0`). |

## Permissions

```yaml
permissions:
  contents: write
```

## Architecture

```
src/
  application/cli/         # Single entry point called from action.yml
    bump-command.sh         # Full pipeline: bump → sync → tag → release → changelog
  core/services/            # Domain rules (no side effects)
    version-service.sh      # classify_commit, resolve_bump, bump_version
    txt-service.sh          # Version file read/write
  infrastructure/           # External systems
    git/git-ops-service.sh  # Commit, tag, push (with optional major/minor tag override)
    github/github-service.sh# Release notes, changelog, gh release create
    node/node-service.sh    # package.json bump (provider)
    claude/claude-service.sh# plugin.json + marketplace.json bump (provider)
```

## How it works

**Bump-command** — the single entry point called from `action.yml`. Orchestrates the full pipeline:

1. Reads the current version from `version.txt` (`txt-service`)
2. Resolves the bump type: explicit `spec` input, or inferred from the HEAD commit via Conventional Commits (`version-service` + `git-service`)
3. Computes the next semver (`version-service`)
4. Writes the new version to `version.txt` (`txt-service`)
5. Syncs the version to enabled providers — `package.json` (node) and/or Claude Code plugin files (claude)
6. Commits, tags (`vX.Y.Z`), and pushes; when `update-major-tag` is `true`, also force-moves the floating major (`vX`) and minor (`vX.Y`) tags so consumers pinning `@vX` always get the latest compatible release (`git-service`)
7. When `create-release` is `true`, generates structured release notes from git log, prepends them to `CHANGELOG.md`, and creates a GitHub release with populated notes (`github-service`)

Outputs `version`, `tag`, `major-tag`, and `minor-tag` to `GITHUB_OUTPUT`.

## Notes

- **Node** — only needed when `update-package-json` is `true`. Set up the toolchain with `actions/setup-node` before this action.
- **`[skip ci]`** — the bump commit is prefixed `[skip ci]` so it does not re-trigger CI.
- **Downstream triggers** — a tag pushed with the default `GITHUB_TOKEN` will **not** start other workflows. Pass a PAT as `github-token` (and to `actions/checkout`) when a downstream pipeline must react to the new tag.

## License

MIT
