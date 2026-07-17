# Contributing

## Setup

```bash
pnpm install --frozen-lockfile
pnpm build
```

Requires Node.js 22+ and pnpm 10.29.3+.

## Scripts

| Command | Purpose |
|---------|---------|
| `pnpm build` | Compile TypeScript to `bin/` |
| `pnpm lint:check` | Run ESLint + gts |
| `pnpm lint:fix` | Auto-fix lint issues |
| `pnpm test:unit` | Run Vitest unit tests |
| `pnpm test:integration` | Run Vitest integration tests |
| `pnpm dep:cruise` | Dependency validation |

## Conventions

- **Commits**: [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `chore:`, etc.)
- **PRs**: one logical change per PR. Fill the template — include motivation and approach.
- **Tests**: new behaviour needs tests. Bug fixes should include a regression test.
- **Lint**: CI runs `pnpm lint:check` — run it locally before pushing.

## CI

All PRs must pass:

1. Install & Build — `pnpm build`
2. Audit & Supply Chain — `pnpm dep:cruise` + `pnpm audit`
3. Lint — `pnpm lint:check`
4. Unit Tests — `pnpm test:unit`
5. Integration Tests — `pnpm test:integration`
6. Mutation Tests — `pnpm test:mutation`
