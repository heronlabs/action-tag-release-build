<!-- supera:guardrails -->
## Working with this repo (managed by /start — edits between these markers are overwritten on re-run)

- **Edit, don't rewrite.** Change only the needed entry in a config/generated file (lockfiles, manifests, CI yaml); preserve the rest. Never regenerate a whole file to add one line.
- **No scope creep.** Build only what was asked; no speculative abstractions, layers, or options. Prefer the simplest working solution.
- **Ambiguous literals: flag, don't guess.** Config keys, IDs, and env names can be literal values, not mappings. State which reading you took.
- **Scope a change to where it belongs** — most changes are localized to one area; touch other repos only when the change genuinely cuts across, and then update the related repos too.
<!-- /supera:guardrails -->

## Stack
- **Runtime**: TypeScript + Node.js (composite GitHub Action with CLI)
- **Package**: `@heronlabs/bump` — published to npm
- **Test framework**: [Vitest](https://vitest.dev/) — `tests/`
- **Linter**: [ESLint](https://eslint.org/) — `eslint.config.ts`
- **Entry point**: `entry-point.sh` → `src/cli.ts` (CommandsFactory → BumpCommand)

## Commands
| Command | Description |
|---------|-------------|
| `pnpm test` | Run Vitest tests |
| `pnpm lint` | Run ESLint |
| `pnpm build` | Compile TypeScript |

## Key files
| File | Purpose |
|------|---------|
| `action.yml` | Composite action definition (inputs, outputs, steps) |
| `entry-point.sh` | Shell wrapper — runs npx and maps outputs to GITHUB_OUTPUT |
| `src/cli.ts` | CLI entry point + CommandsFactory (wires all services) |
| `src/application/cli/bump-command.ts` | BumpCommand — orchestrates the full pipeline |
| `src/core/services/semver-service.ts` | Read version file, calculate next semver, write version file |
| `src/core/services/commit-service.ts` | Parse Conventional Commits, classify last commit type |
| `src/core/services/changelog-service.ts` | Generate release notes, update changelog, tag + push + release |
| `src/core/services/bumpers/npm-bumper-service.ts` | Sync version into package.json |
| `src/core/services/bumpers/claude-bumper-service.ts` | Sync version into Claude Code plugin files |
| `src/infrastructure/git/git-service.ts` | Git commands: log, describe, tag, push |
| `src/infrastructure/gh/gh-service.ts` | GitHub CLI: release create |
| `src/infrastructure/terminal/child-process-service.ts` | Shell command execution |
| `vitest.config.ts` | Vitest configuration |
| `eslint.config.ts` | ESLint configuration |
| `package.json` | Dependencies + scripts |
| `version.txt` | Current semver version |
| `CHANGELOG.md` | Release history |
