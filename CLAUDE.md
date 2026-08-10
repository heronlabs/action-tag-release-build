<!-- supera:guardrails -->
## Working with this repo (managed by /start — edits between these markers are overwritten on re-run)

- **Edit, don't rewrite.** Change only the needed entry in a config/generated file (lockfiles, manifests, CI yaml); preserve the rest. Never regenerate a whole file to add one line.
- **No scope creep.** Build only what was asked; no speculative abstractions, layers, or options. Prefer the simplest working solution.
- **Ambiguous literals: flag, don't guess.** Config keys, IDs, and env names can be literal values, not mappings. State which reading you took.
- **Scope a change to where it belongs** — most changes are localized to one area; touch other repos only when the change genuinely cuts across, and then update the related repos too.
<!-- /supera:guardrails -->

## Stack
- **Runtime**: TypeScript + Node.js (node24 GitHub Action, compiled `bin/src/index.js` entry)
- **Package**: `@heronlabs/bump` — published to npm
- **Test framework**: [Vitest](https://vitest.dev/) — `tests/`
- **Linter**: [ESLint](https://eslint.org/) — `eslint.config.ts`
- **Entry point**: `src/index.ts` (@actions/core inputs/outputs; built to `bin/src/index.js` with @actions/core inlined by esbuild) → CliFactory → Command

## Commands
| Command | Description |
|---------|-------------|
| `pnpm test:unit` | Run Vitest unit tests |
| `pnpm test:integration` | Run Vitest integration tests |
| `pnpm lint:check` | Run ESLint + gts |
| `pnpm build` | Compile TypeScript |

## Key files
| File | Purpose |
|------|---------|
| `action.yml` | Node action definition (inputs, outputs, runs.main) |
| `src/index.ts` | Action entry point — @actions/core inputs/outputs, wires CliFactory. Only file importing @actions/core; excluded from coverage |
| `src/index.ts` | `InputDefaults` — sole authority for input defaults (`action.yml` declares no `default:`; its descriptions restate the values) |
| `src/application/action/command/types/inputs.ts` | `Inputs` type |
| `src/application/action/command/types/outputs.ts` | `Outputs` + `ReleasedRef` types |
| `bin/` | Compiled output; `bin/src/index.js` is `runs.main` with @actions/core inlined — build artifact, do not edit |
| `src/application/action/action-factory.ts` | CliFactory (wires all services) |
| `src/application/action/command/command.ts` | Command — orchestrates the full pipeline |
| `src/core/services/semver-service.ts` | Read version file, calculate next semver, write version file |
| `src/core/services/commit-service.ts` | Parse Conventional Commits, classify last commit type |
| `src/core/services/changelog-service.ts` | Generate release notes, update changelog, tag + push + release |
| `src/core/services/bumpers/npm-bumper-service.ts` | Sync version into package.json |
| `src/core/services/bumpers/claude-bumper-service.ts` | Sync version into Claude Code plugin files |
| `src/core/services/sync-service.ts` | Cascade released ref into target environment branches (merge or fast-forward, PR fallback) — targets must already exist on the remote |
| `src/infrastructure/git/services/git-service.ts` | Git commands: log, describe, tag, push |
| `src/infrastructure/gh/services/release-notes-service.ts` | GitHub CLI: release create |
| `src/infrastructure/gh/services/merge-service.ts` | GitHub merges API (merge commit) + git refs API (fast-forward) — sync ref into an existing target branch |
| `src/infrastructure/gh/services/pull-request-service.ts` | GitHub CLI: list / create the sync fallback pull request |
| `src/infrastructure/terminal/services/child-process-service.ts` | Shell command execution |
| `vitest.unit.config.ts` / `vitest.integration.config.ts` | Vitest configuration (unit / integration) |
| `eslint.config.ts` | ESLint configuration |
| `package.json` | Dependencies + scripts |
| `version.txt` | Current semver version |
| `CHANGELOG.md` | Release history |
