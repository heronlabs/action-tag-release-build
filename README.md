# Build Tag Release

[![CI](https://github.com/heronlabs/action-tag-release-build/actions/workflows/ci.yml/badge.svg)](https://github.com/heronlabs/action-tag-release-build/actions/workflows/ci.yml)

Tag and release based on commit message prefix.

## Usage

```yaml
name: CI

on:
  push:
    branches: [main]

permissions:
  contents: write

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
        with:
          fetch-depth: 0

      - uses: heronlabs/actions/build-tag-release@v1
        with:
          github-token: ${{ github.token }}
```

### Tag Only (no release)

```yaml
- uses: heronlabs/actions/build-tag-release@v1
  with:
    github-token: ${{ github.token }}
    create-release: 'false'
```

### Monorepo

```yaml
- uses: heronlabs/actions/build-tag-release@v1
  with:
    github-token: ${{ github.token }}
    working-directory: packages/my-package
    tag-prefix: 'my-package-v'
```

Creates tags like `my-package-v1.0.0`.

## Commit Prefixes

| Prefix | Bump |
|--------|------|
| `major:` | Major (1.0.0 → 2.0.0) |
| `minor:` | Minor (1.0.0 → 1.1.0) |
| `patch:` | Patch (1.0.0 → 1.0.1) |
| *(none)* | Patch (default) |

## Inputs

| Input | Description | Default |
|-------|-------------|---------|
| `github-token` | GitHub token (required) | - |
| `working-directory` | Sub-directory for monorepos | `.` |
| `create-release` | Create GitHub release | `true` |
| `tag-prefix` | Tag prefix (e.g., `my-package-v`) | `v` |
| `update-major-tag` | Update floating major/minor version tags | `true` |

## Outputs

| Output | Description |
|--------|-------------|
| `version` | Released version (e.g., `1.0.3`) |
| `tag` | Created tag (e.g., `v1.0.3`) |
| `major-tag` | Major version tag (e.g., `v1`) |
| `minor-tag` | Minor version tag (e.g., `v1.0`) |

## Floating Version Tags

When `update-major-tag` is enabled (default), the action creates floating tags that always point to the latest release:

- **Major tag** (`v1`): Points to latest v1.x.x release
- **Minor tag** (`v1.0`): Points to latest v1.0.x release

This allows consumers to reference `@v1` to always get the latest compatible version.

## License

MIT
