# Security Policy

## Reporting a Vulnerability

Report vulnerabilities to **security@heronlabs.com**. Do not open public issues.

Expect a response within 72 hours. After triage we will keep you updated on progress and coordinate disclosure timing.

## Scope

This repository is a GitHub Action that handles:

- GitHub Personal Access Tokens (`ghToken` input)
- Git tag and release creation via the GitHub CLI

Key concerns: token exposure in logs, supply chain integrity of bundled dependencies, tag/release manipulation.

### Supported versions

| Version | Supported |
|---------|-----------|
| v6.x    | ✅ |
| v5.x    | ❌ |
| < v5    | ❌ |

## Disclosure

We follow coordinated disclosure. After a fix is released we will publish a GitHub Security Advisory and credit reporters (unless you prefer anonymity).
