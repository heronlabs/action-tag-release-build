# 🏷️ tag-release-build — Bump, tag, release

[![CI][ci-badge]][ci-url]
[![License: MIT][license-badge]][license-url]
[![GitHub Marketplace][marketplace-badge]][marketplace-url]

> **GitHub Action** to bump `version.txt`, tag the commit, move floating major/minor tags, publish a GitHub release with a CHANGELOG — and optionally sync `package.json` or Claude Code plugin files.

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
- [Agentic / Autonomous Workflows](#agentic--autonomous-workflows)
- [Notes](#notes)
- [License](#license)

## Usage

Driven by `workflow_dispatch` with a `semantic` choice — the pattern used across the heronlabs repos.

```yaml
name: 'Continuous Deployment'

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
      - uses: actions/checkout@v7
        with:
          fetch-depth: 0
          token: ${{ secrets.PAT }}

      - run: git pull --rebase origin main

      - uses: heronlabs/action-tag-release-build@v5
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

When `semantic` is omitted the bump is inferred from the HEAD commit.

```yaml
- uses: heronlabs/action-tag-release-build@v5
  with:
    gh_token: ${{ secrets.PAT }}
```

### With package.json sync

```yaml
- uses: heronlabs/action-tag-release-build@v5
  with:
    gh_token: ${{ secrets.PAT }}
    semantic: minor
    bump_npm: 'true'
```

Requires `actions/setup-node` before this step.

### With Claude Code plugin sync

```yaml
- uses: heronlabs/action-tag-release-build@v5
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
| `changelog_file` | Changelog file to prepend release notes into. | No | `CHANGELOG.md` |
| `tag_prefix` | Prefix for created tags (e.g. `v` produces `v1.2.3`). | No | `v` |
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

TypeScript CLI published as `@heronlabs/bump`, wrapped by `entry-point.sh` for the composite action.

```
src/
  cli.ts                              # CLI entry point + CommandsFactory (wires all services)
  application/cli/
    bump-command.ts                   # BumpCommand — orchestrates the full pipeline
    types/
      input-bump.ts                   # BumpInputs type
      output-bump.ts                  # BumpOutputs type
  core/
    interfaces/
      bumper.ts                       # Bumper interface
    services/
      semver-service.ts               # Read version file, calculate next semver, write version file
      commit-service.ts               # Parse Conventional Commits, classify last commit type
      changelog-service.ts            # Generate release notes, update changelog, tag + push + release
      bumpers/
        npm-bumper-service.ts         # Sync version into package.json
        claude-bumper-service.ts      # Sync version into Claude Code plugin files
    types/
      commit-types.ts                 # CommitTypeLabels mapping
      parsed-commit.ts                # ParsedDescription type
      semantic.ts                     # Semantic enum
      bumpers.ts                      # Bumper name type
  infrastructure/
    git/
      git-service.ts                  # Git commands: log, describe, tag, push
    gh/
      gh-service.ts                   # GitHub CLI: release create
    terminal/
      child-process-service.ts        # Shell command execution (exec + execChain)
```

## How it works

**`entry-point.sh`** — thin shell wrapper called by `action.yml`. Runs `npx @heronlabs/bump` and maps stdout lines to `GITHUB_OUTPUT`.

**`CommandsFactory`** (`src/cli.ts`) — wires all services with their dependencies, reads env vars (`BUMP_NPM`, `BUMP_CLAUDE`, `SEMANTIC`, etc.), and maps them to a `BumpInputs` object.

**`BumpCommand.run()`** — the orchestrator:

1. **Calculate next version** — `SemverService.calculateNextVersion()` reads `version.txt`, resolves the bump type (explicit `semantic` input or inferred from the HEAD commit via `CommitService.classifyLastCommit()`), computes the next semver, and writes it back to `version.txt`.
2. **Sync bumpers** — each enabled `Bumper` (npm, claude) syncs the new version into its target file (`package.json`, `plugin.json` + `marketplace.json`).
3. **Release** — `ChangelogService.applyReleaseChangelog()` runs three steps:
   - **Generate release notes** — parses commits since the last tag via `CommitService.parseDescriptionSince()`, groups by Conventional Commit type, and formats entries with breaking change markers.
   - **Update changelog** — prepends the new entry (with date header) to `CHANGELOG.md`.
   - **Tag and push** — `GitService.apply()` commits all changes (`[skip ci]`), creates the annotated tag (`vX.Y.Z`), optionally force-moves floating major/minor tags, and pushes with `--follow-tags`.
   - **Create GitHub release** — `GhService.createRelease()` publishes the release with the generated notes.

Outputs `version`, `tag`, `tag_major`, and `tag_minor` to stdout — one per line — which `entry-point.sh` redirects to `GITHUB_OUTPUT`.

## Agentic / Autonomous Workflows

This action is designed for **AI-assisted and agentic CI/CD pipelines** where a bot, AI agent, or autonomous process drives versioning and releases without manual intervention.

### Fully automated release on merge

The `semantic` input can be omitted — the action infers the bump type from the **HEAD commit** using Conventional Commits. This makes it trivial to wire up a fully autonomous release pipeline that triggers on push to `main`:

```yaml
name: 'Autonomous Release'

on:
  push:
    branches: [main]

permissions:
  contents: write

jobs:
  release:
    if: github.actor != 'github-actions[bot]'  # Skip re-triggers
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@v7
        with:
          fetch-depth: 0
          token: ${{ secrets.PAT }}

      - run: git pull --rebase origin main

      - uses: heronlabs/action-tag-release-build@v5
        id: version
        with:
          gh_token: ${{ secrets.PAT }}
          # semantic is omitted — bump is inferred from HEAD commit
```

A bot or agent (Claude Code, Copilot, a custom script) that merges a Conventional Commit PR triggers this automatically — no `workflow_dispatch` needed.

### Agent-triggered releases (via API)

An AI agent can trigger a release by calling the GitHub API:

```bash
gh workflow run bump.yml \
  --ref main \
  --field semantic=patch
```

This pattern lets an agent decide the version bump after analyzing the commit history, then step back and let the action handle the mechanics.

### Claude Code ecosystem integration

When `bump_claude: 'true'` is set, the action syncs the new version into Claude Code plugin files (`plugin.json` + `marketplace.json`). This pairs naturally with AI agents that use Claude Code — the plugin metadata stays current without manual updates.

```yaml
- uses: heronlabs/action-tag-release-build@v5
  with:
    gh_token: ${{ secrets.PAT }}
    bump_claude: 'true'
    plugin_dir: '.'
```

### Why it fits agentic patterns

| Pattern | How this action supports it |
|---------|-----------------------------|
| **Hands-off releases** | Conventional Commit inference removes the need for a human to choose `major`/`minor`/`patch`. |
| **Self-documenting changelogs** | Release notes are generated from commit history — no agent needs to write them. |
| **Floating tags** | `v1` / `v1.0` tags let agents reference stable channels without tracking patch versions. |
| **CI-loop safety** | `[skip ci]` on the bump commit prevents infinite CI re-triggers. |
| **Deterministic outputs** | `version`, `tag`, `tag_major`, `tag_minor` are printed to `GITHUB_OUTPUT` — agents can read them in subsequent steps. |

## Notes

- **Node** — only needed when `bump_npm` is `true`. Set up the toolchain with `actions/setup-node` before this action.
- **`[skip ci]`** — the bump commit is prefixed `[skip ci]` so it does not re-trigger CI.
- **Downstream triggers** — a tag pushed with the default `GITHUB_TOKEN` will **not** start other workflows. Pass a PAT as `gh_token` (and to `actions/checkout`) when a downstream pipeline must react to the new tag.

## License

MIT

[ci-badge]: https://github.com/heronlabs/action-tag-release-build/actions/workflows/continuous-integration.yml/badge.svg
[ci-url]: https://github.com/heronlabs/action-tag-release-build/actions/workflows/continuous-integration.yml
[license-badge]: https://img.shields.io/badge/License-MIT-blue.svg
[license-url]: ./LICENSE
[marketplace-badge]: https://img.shields.io/badge/GitHub-Marketplace-green.svg
[marketplace-url]: https://github.com/marketplace/actions/action-tag-release-build
