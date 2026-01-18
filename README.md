# build-tag-release

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

## Outputs

| Output | Description |
|--------|-------------|
| `version` | Released version |
| `tag` | Created tag |

## License

MIT
