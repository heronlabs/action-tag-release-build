# 🏷️ tag-release-build — Bump, tag, release

[![CI][ci-badge]][ci-url]
[![License: MIT][license-badge]][license-url]
[![GitHub Marketplace][marketplace-badge]][marketplace-url]

> **GitHub Action** to bump `version.txt`, tag the commit, move floating major/minor tags, publish a GitHub release with a CHANGELOG — and optionally sync `package.json`, Claude Code plugin files, or downstream environment branches.

The bump is driven by the `semantic` input. When `semantic` is omitted, the bump is **inferred from the merge/HEAD commit** using Conventional Commits — a breaking change (`feat!:`, `fix(api)!:`, or a `BREAKING CHANGE:` body) is `major`, a `feat:` commit is `minor`, and everything else (including unclear messages) falls back to `patch`.

## Contents

- [Usage](#usage)
  - [Minimal](#minimal)
  - [With package.json sync](#with-packagejson-sync)
  - [With Claude Code plugin sync](#with-claude-code-plugin-sync)
  - [With environment sync](#with-environment-sync)
- [Inputs](#inputs)
- [Outputs](#outputs)
- [Permissions](#permissions)
- [How it works](#how-it-works)
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

      - uses: heronlabs/action-tag-release-build@v7
        id: version
        with:
          ghToken: ${{ secrets.PAT }}
          semantic: ${{ inputs.semantic }}
```

The `id: version` step exposes the `version`, `tag`, `tagMajor`, and `tagMinor` outputs for later steps — e.g. to alias a published image with both floating tags:

```yaml
- run: |
    echo "tag-alias=${{ steps.version.outputs.tagMajor }},${{ steps.version.outputs.tagMinor }}" >> "$GITHUB_OUTPUT"
```

### Minimal

When `semantic` is omitted the bump is inferred from the HEAD commit.

```yaml
- uses: heronlabs/action-tag-release-build@v7
  with:
    ghToken: ${{ secrets.PAT }}
```

### With package.json sync

```yaml
- uses: heronlabs/action-tag-release-build@v7
  with:
    ghToken: ${{ secrets.PAT }}
    semantic: minor
    bumpNpm: 'true'
```

Requires `actions/setup-node` before this step.

### With Claude Code plugin sync

```yaml
- uses: heronlabs/action-tag-release-build@v7
  with:
    ghToken: ${{ secrets.PAT }}
    semantic: minor
    bumpClaude: 'true'
    pluginDir: '.'
```

Requires `jq` on the runner (GitHub-hosted runners include it).

### With environment sync

After tagging, the released ref can be cascaded into downstream environment branches.

```yaml
- uses: heronlabs/action-tag-release-build@v7
  with:
    ghToken: ${{ secrets.PAT }}
    semantic: minor
    target: 'staging,production'
    mergeCommit: 'true'
```

Each target is synced in order:

- `mergeCommit: 'false'` (default) — fast-forward push of `ref` onto the target branch.
- `mergeCommit: 'true'` — a real merge commit (`Merge <ref> into <target>`) via the GitHub merges API, so the target keeps its own history.

When a target cannot be synced (diverged branch or merge conflict), the action opens a pull request from `ref` into that target instead of failing the run. The sync summary is written to the step log — `target => ref` on success, `target xx ref` when it fell back.

## Inputs

| Name | Description | Required | Default |
|------|-------------|----------|---------|
| `ghToken` | Token used to push tags and create the release. Use a PAT to trigger downstream workflows. | Yes | — |
| `semantic` | Semver bump type: `major`, `minor`, or `patch`. When empty, the bump is inferred from the merge/HEAD commit (Conventional Commits), defaulting to `patch` when unclear. | No | `` (inferred) |
| `workingDirectory` | Sub-directory to operate in (for monorepos). | No | `.` |
| `versionFile` | File to read and write the version number. | No | `version.txt` |
| `changelogFile` | Changelog file to prepend release notes into. | No | `CHANGELOG.md` |
| `tagPrefix` | Prefix for created tags (e.g. `v` produces `v1.2.3`). | No | `v` |
| `bumpNpm` | Also bump `package.json` using `npm version`. Set up Node with `actions/setup-node` before this step. | No | `false` |
| `bumpClaude` | Sync the version into Claude Code plugin files (`plugin.json` + `marketplace.json`). Requires `jq`. | No | `false` |
| `pluginDir` | Directory containing the Claude plugin files. | No | `.claude-plugin` |
| `overrideTag` | Move the floating major/minor tags (`v1`, `v1.0`) to the new release. | No | `true` |
| `target` | Branches to sync the released ref into, comma-separated (e.g. `staging,production`). Empty disables sync. | No | `` |
| `mergeCommit` | Sync with a real merge commit (`Merge <ref> into <target>`, via the GitHub merges API) instead of a fast-forward push. | No | `false` |

## Outputs

| Name | Description |
|------|-------------|
| `version` | Released version (e.g. `1.0.3`). |
| `tag` | Created tag (e.g. `v1.0.3`). |
| `tagMajor` | Floating major tag (e.g. `v1`). |
| `tagMinor` | Floating minor tag (e.g. `v1.0`). |

## Permissions

```yaml
permissions:
  contents: write
```

## Architecture

TypeScript Node action published as `@heronlabs/bump`. Runs on the `node24` runtime from the compiled `bin/src/index.js` — inputs and outputs go through [`@actions/core`](https://github.com/actions/toolkit/tree/main/packages/core).

```
src/
  index.ts                            # Action entry point — reads inputs via @actions/core, wires CliFactory
  application/action/
    action-factory.ts                 # CliFactory — builds the Command from the layer factories
    command/
      command.ts                      # Command — orchestrates the full pipeline
      types/
        inputs.ts                     # Inputs type
        outputs.ts                    # Outputs type
  core/
    core-factory.ts                   # Wires core services and bumpers
    interfaces/
      bumper.ts                       # Bumper interface
    services/
      semver-service.ts               # Read version file, calculate next semver, write version file
      commit-service.ts               # Parse Conventional Commits, classify last commit type
      changelog-service.ts            # Generate release notes, update changelog, tag + push + release
      sync-service.ts                 # Cascade the released ref into target environment branches
      bumpers/
        npm-bumper-service.ts         # Sync version into package.json
        claude-bumper-service.ts      # Sync version into Claude Code plugin files
    types/
      commit-types.ts                 # CommitTypeLabels mapping
      parsed-commit.ts                # ParsedDescription type
      semantic.ts                     # Semantic enum
  infrastructure/
    git/
      git-factory.ts                  # Wires the git service
      services/
        git-service.ts                # Git commands: log, describe, tag, push, fast-forward sync push
    gh/
      gh-factory.ts                   # Wires the gh services
      services/
        release-notes-service.ts      # GitHub CLI: release create
        merge-service.ts              # GitHub merges API: merge ref into a target branch
        pull-request-service.ts       # GitHub CLI: list / create the sync fallback pull request
    terminal/
      terminal-factory.ts             # Wires the child process service
      services/
        child-process-service.ts      # Shell command execution (exec + execChain)
```

## How it works

**`src/index.ts`** — the entry point, compiled to `bin/src/index.js` (the `runs.main` in `action.yml`). Reads inputs with `core.getInput`, changes into `workingDirectory`, exports `ghToken` for the `gh` CLI, and reports failures with `core.setFailed`. At build time esbuild bundles the entry into a self-contained `bin/src/index.js` with `@actions/core` inlined (runners never run `npm install`, so no `node_modules` exists there); `tsc` runs typecheck-only and emits nothing else.

**`CliFactory`** (`src/application/action/action-factory.ts`) — wires all services with their dependencies through the layer factories and builds the `Command`.

**`Command.run()`** — the orchestrator:

1. **Calculate next version** — `SemverService.calculateNextVersion()` reads `version.txt`, resolves the bump type (explicit `semantic` input or inferred from the HEAD commit via `CommitService.classifyLastCommit()`), computes the next semver, and writes it back to `version.txt`.
2. **Sync bumpers** — each enabled `Bumper` (npm, claude) syncs the new version into its target file (`package.json`, `plugin.json` + `marketplace.json`).
3. **Release** — `ChangelogService.applyReleaseChangelog()` runs three steps:
   - **Generate release notes** — parses commits since the last tag via `CommitService.parseDescriptionSince()`, groups by Conventional Commit type, and formats entries with breaking change markers.
   - **Update changelog** — prepends the new entry (with date header) to `CHANGELOG.md`.
   - **Tag and push** — `GitService.apply()` commits all changes (`[skip ci]`), creates the annotated tag (`vX.Y.Z`), optionally force-moves floating major/minor tags, and pushes with `--follow-tags`.
   - **Create GitHub release** — `ReleaseNotesService.createRelease()` publishes the release with the generated notes.
4. **Sync environments** — skipped when `target` is empty. `SyncService.cascadeEnvironments()` splits `target` on commas and, for each branch, either merges via `MergeService.mergeWithCommit()` (`mergeCommit: true`) or fast-forward pushes via `GitService.mergeWithoutCommit()`. If the sync is rejected, `PullRequestService` opens a pull request from `ref` into that target (unless one is already open) and the run continues.

Outputs `version`, `tag`, `tagMajor`, and `tagMinor` are published with `core.setOutput`.

## Notes

- **Node** — only needed when `bumpNpm` is `true`. Set up the toolchain with `actions/setup-node` before this action.
- **`[skip ci]`** — the bump commit is prefixed `[skip ci]` so it does not re-trigger CI.
- **Downstream triggers** — a tag pushed with the default `GITHUB_TOKEN` will **not** start other workflows. Pass a PAT as `ghToken` (and to `actions/checkout`) when a downstream pipeline must react to the new tag.

## License

MIT

[ci-badge]: https://github.com/heronlabs/action-tag-release-build/actions/workflows/continuous-integration.yml/badge.svg
[ci-url]: https://github.com/heronlabs/action-tag-release-build/actions/workflows/continuous-integration.yml
[license-badge]: https://img.shields.io/badge/License-MIT-blue.svg
[license-url]: ./LICENSE
[marketplace-badge]: https://img.shields.io/badge/GitHub-Marketplace-green.svg
[marketplace-url]: https://github.com/marketplace/actions/action-tag-release-build
