# Tag Release Build Action

[![CI](https://github.com/heronlabs/action-tag-release-build/actions/workflows/continuous-integration.yml/badge.svg)](https://github.com/heronlabs/action-tag-release-build/actions/workflows/continuous-integration.yml)

> Bump the `version.txt` file (and optionally `package.json` and Claude Code plugin files), tag the commit, move the floating major/minor tags, and optionally publish a GitHub release with a CHANGELOG.

The bump is driven by the `spec` input. When `spec` is omitted, the bump is **inferred from the merge/HEAD commit** using Conventional Commits — a breaking change (`feat!:`, `fix(api)!:`, or a `BREAKING CHANGE:` body) is `major`, a `feat:` commit is `minor`, and everything else (including unclear messages) falls back to `patch`.

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
    sync-claude-plugin: 'true'
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
| `update-package-json` | Also bump `package.json` using `npm version`. Requires a Node toolchain. | No | `false` |
| `sync-claude-plugin` | Sync the version into Claude Code plugin files (`plugin.json` + `marketplace.json`). Requires `jq`. | No | `false` |
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

## How it works

1. **Bump version file** — runs `core/bump-version-file.sh` (pure bash, no Node needed) to read `version.txt`, apply the semver bump, and write the new version back.
2. **Sync package.json** (optional) — if `update-package-json` is `true`, runs `npm version` to keep `package.json` in sync.
3. **Sync Claude plugin** (optional) — if `sync-claude-plugin` is `true`, uses `jq` to update version in `plugin.json` and `marketplace.json`.
4. **Tag release** — commits all changed files as `[skip ci] bump v<version>`, rebases onto the current branch, creates the annotated `<tag-prefix><version>` tag, and pushes with `--follow-tags`.
5. **Update major tags** — when `update-major-tag` is `true`, force-moves the floating major (`v1`) and minor (`v1.0`) tags to the new commit, so consumers pinning `@v1` always get the latest compatible release.
6. **Create release** — when `create-release` is `true`, generates structured release notes from git log, prepends them to `CHANGELOG.md`, and creates a GitHub release with populated notes (not auto-generated).

## Notes

- **No Node required for the core flow** — the version bump uses pure bash. A Node toolchain is only needed when `update-package-json` is `true`.
- **`[skip ci]`** — the bump commit is prefixed `[skip ci]` so it does not re-trigger CI.
- **Downstream triggers** — a tag pushed with the default `GITHUB_TOKEN` will **not** start other workflows. Pass a PAT as `github-token` (and to `actions/checkout`) when a downstream pipeline must react to the new tag.

## License

MIT
