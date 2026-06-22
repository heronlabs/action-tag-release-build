# Build Tag Release

[![CI](https://github.com/heronlabs/action-tag-release-build/actions/workflows/ci.yml/badge.svg)](https://github.com/heronlabs/action-tag-release-build/actions/workflows/ci.yml)

A GitHub Action that bumps the `package.json` version by an explicit semver `spec`
(`major`, `minor`, or `patch`), commits the bump, creates the matching git tag,
moves the floating major/minor tags, and optionally publishes a GitHub release.

The bump is driven by the `spec` input. When `spec` is omitted, the bump is
**inferred from the merge/HEAD commit** using Conventional Commits — a breaking
change (`feat!:`, `fix(api)!:`, or a `BREAKING CHANGE:` body) is `major`, a
`feat:` commit is `minor`, and everything else (including unclear messages) falls
back to `patch`.

## Usage

Driven by `workflow_dispatch` with a `spec` choice — the pattern used across the
heronlabs repos:

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
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
        with:
          fetch-depth: 0
          token: ${{ secrets.PAT }}

      - uses: actions/setup-node@v6
        with:
          node-version-file: '.node-version'

      - run: git pull --rebase origin main

      - uses: heronlabs/action-tag-release-build@v2
        id: version
        with:
          github-token: ${{ secrets.PAT }}
          spec: ${{ inputs.spec }}
```

The `id: version` step exposes the `version`, `tag`, `major-tag`, and `minor-tag`
outputs for later steps — e.g. to alias a published image with both floating tags:

```yaml
- run: |
    echo "tag-alias=${{ steps.version.outputs.major-tag }},${{ steps.version.outputs.minor-tag }}" >> "$GITHUB_OUTPUT"
```

### Tag only (no GitHub release)

```yaml
- uses: heronlabs/action-tag-release-build@v2
  with:
    github-token: ${{ secrets.PAT }}
    spec: patch
    create-release: 'false'
```

### Monorepo sub-package

```yaml
- uses: heronlabs/action-tag-release-build@v2
  with:
    github-token: ${{ secrets.PAT }}
    spec: minor
    working-directory: packages/my-package
    tag-prefix: 'my-package-v'
```

Creates tags like `my-package-v1.1.0`.

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `github-token` | Token used to push tags and create the release. Use a PAT to trigger downstream workflows. | Yes | — |
| `spec` | Semver bump type: `major`, `minor`, or `patch`. When empty, the bump is inferred from the merge/HEAD commit (Conventional Commits), defaulting to `patch` when unclear. | No | `` (inferred) |
| `working-directory` | Sub-directory to operate in (for monorepos). | No | `.` |
| `create-release` | Create a GitHub release after tagging. | No | `true` |
| `tag-prefix` | Tag prefix (e.g. `my-package-v`). | No | `v` |
| `update-major-tag` | Move the floating major/minor tags to the new release. | No | `true` |

## Outputs

| Output | Description |
|--------|-------------|
| `version` | Released version (e.g. `1.0.3`). |
| `tag` | Created tag (e.g. `v1.0.3`). |
| `major-tag` | Floating major tag (e.g. `v1`). |
| `minor-tag` | Floating minor tag (e.g. `v1.0`). |

## How it works

1. Configures git as `github-actions[bot]`.
2. Runs `npm version <spec> --no-git-tag-version` in `working-directory` to bump `package.json`.
3. Commits the bump as `[skip ci] bump version`, rebases onto the current branch, creates the annotated tag `<tag-prefix><version>`, and pushes with `--follow-tags`.
4. When `update-major-tag` is `true`, force-moves the floating major (`v1`) and minor (`v1.0`) tags to the new commit, so consumers pinning `@v1` always get the latest compatible release.
5. When `create-release` is `true`, runs `gh release create` with auto-generated notes.

## Notes

- **Node required**: the bump uses `npm version`, so a Node toolchain must be available on the runner (set it up with `actions/setup-node` before this step).
- **`[skip ci]`**: the bump commit is prefixed `[skip ci]` so it does not re-trigger CI.
- **Downstream triggers**: a tag pushed with the default `GITHUB_TOKEN` will **not** start other workflows. Pass a PAT as `github-token` (and to `actions/checkout`) when a downstream pipeline must react to the new tag.

## License

MIT
