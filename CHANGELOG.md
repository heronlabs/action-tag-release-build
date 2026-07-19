## v6.0.11 (2026-07-19)



## v6.0.10 (2026-07-17)



## v6.0.9 (2026-07-17)

### Miscellaneous Chores

* other: [skip ci] chore: update bin/ build artifact (f3d6a95c9c30543ec0af55cd2a47028569288162)

## v6.0.8 (2026-07-17)

### Bug Fixes

* fix: remove bin build cache from CI (#41) (9a7026b8d22a902417932fdbb665a12289bd9ee2)

## v6.0.7 (2026-07-16)



## v6.0.6 (2026-07-16)

### Bug Fixes

* fix: Replace stdout.write with stderr outside CLI (#39) (9297e26bde4d121e7334fe2c1bb63b8f6c3ae06d)

## v6.0.5 (2026-07-16)



## v6.0.4 (2026-07-16)



## v6.0.3 (2026-07-16)



## v6.0.2 (2026-07-16)



## v6.0.1 (2026-07-10)



## v6.0.0 (2026-07-09)



## v5.3.1 (2026-07-09)



## v5.3.0 (2026-07-09)

### Features

* feat: add CODEOWNERS file and update continuous deployment workflow (25d0edffcb4f74b0a1ac98f5f37c0043b4d40a8a)

## v5.2.1 (2026-07-09)

### Miscellaneous Chores

* other: [skip ci] chore: update bin/ build artifact (ea43f9a219559b87d30ed6e933ecde35808af41a)

## v5.2.0 (2026-07-08)

### Features

* feat: create composite action + workflow to build and commit bin/ artifact (#27) (3c68e26c36532674712c122876639a2f38cc1e3a)

## v5.1.1 (2026-07-08)



## v5.1.0 (2026-07-08)



## v5.0.13 (2026-07-08)

### Bug Fixes

* fix: add minimumReleaseAge=0 to .npmrc to prevent CI failure on fresh dependabot bumps (#26) (5e55a3d5bebbcf7d0a7b0574bf8ce320e9533234)

## v5.0.12 (2026-07-08)

### Bug Fixes

* fix: force-push moving tags on release to keep them in sync (#25) (a4ecbf1f2d980195e5163395ea26f03c7c371bc9)

## v5.0.11 (2026-07-08)

### Bug Fixes

* fix: update marketplace.json handling to check for 'plugins' array (f64ee09a698f64665ef749332c8f31a1ff60d9b0)

## v5.0.10 (2026-07-08)

### Bug Fixes

* fix: parse marketplace.json as {plugins: [...]} object, not top-level array (#24) (b0b3dc12a2dcb80b9783ffb1c72d4c7112806492)

## v5.0.9 (2026-07-08)

### Bug Fixes

* fix(cli): use || instead of ?? for env var defaults (8d9507aa92e2bfa6ac4eec5abbb77f2d439316d6)

## v5.0.8 (2026-07-08)

### Bug Fixes

* fix: enforce required pluginDir parameter in ClaudeService constructor (1cfd56f165685e88a040e8126dcfb72a1c68965f)

## v5.0.7 (2026-07-08)

### Bug Fixes

* fix: remove deprecated shamefully-hoist, tighten dependabot window (#22) (74ee2857ef588d5b7d46d41a400bde6120135e4f)

## v5.0.6 (2026-07-08)

### Bug Fixes

* fix(claude-bumper): accept plugin dir via PLUGIN_DIR env, default .claude-plugin (b127381d14b91a47dfe076e965af612b63759931)

## v5.0.5 (2026-07-07)

### Documentation

* docs: standardize README badges and add repo-specific CLAUDE.md (#20) (1fb167b07761eeb506d6e9273ff09b7cc01b99a8)

## v5.0.4 (2026-07-07)



## v5.0.3 (2026-07-06)



## v5.0.2 (2026-07-06)

### Bug Fixes

* fix: update tag handling in changelog service to use specific major and minor tags (747bbd6af39680797611f8a3237a2f73f919539c)

## v5.0.1 (2026-07-06)

### Bug Fixes

* fix: ship built CLI with action, replace npx with direct node call (f5c1d8ae53a0347bf78d8de94b8bd1f452c3f571)
* fix: use npx instead of pnpm install + build in entry-point.sh (#16) (86d2f02f56a183b48ded0c67674718b3f18f34ac)

## v5.0.0 (2026-07-06)



## v4.1.0 (2026-07-06)

### Features

* feat: remove outdated GitHub workflows for audit and Dependabot PR watch (#14) (a7a88eb1818171f35fc053278b63c6710689b275)
* feat(tests): update test descriptions for clarity and improve child process service tests (35e16b72bef474ab8fa11f92389c47dbbc3780b6)
* feat(tests): add comprehensive mocks and unit tests for core services (7beb502bea3da369ce18ecb1330794e7fe0d2cc5)
* feat: enhance commit parsing and add mock services for testing (ddffb76583494b30aaabdb8025e12c592f4ac772)
* feat: add rules to prevent infrastructure and core layer dependencies (f615e89f76ff0e6196b25e45f8dc9690cbb3533b)
* feat: enhance release action with additional inputs and improved error handling (2de5f7f99f286c3e8d23550a6488e83326a70212)

### Miscellaneous Chores

* other: wip (6693cfac38f2ee78a3d081cf88d440cbf7dfd0f7)
* other: wip (f7b137904e1ec17e3dcdb5a6c386704bd8ac28d6)
* other: wip (98ab59395c1cacec84490f42a42c012f9f7136d6)

