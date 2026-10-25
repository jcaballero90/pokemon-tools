[![English](https://img.shields.io/badge/lang-en-red.svg)](README.md) [![Español](https://img.shields.io/badge/lang-es-yellow.svg)](README.es.md)

# Pokémon Tools

A bilingual English and Spain-Spanish Generation 9 Scarlet/Violet web app for exploring battle data, planning teams, and estimating damage. Guests can draft and compare two teams in their browser. An account adds private saved teams.

This repository is the working TFM project. The application is deployed to staging and production on the owner's mini PC, with production reachable at `https://jcrserver.duckdns.org`. Several end-to-end product and security checks remain open; see the [requirements](docs/requirements/requirements.md) and [test strategy](docs/testing/test-strategy.md).

## Features

- Explore defensive Generation 9 type matchups by type or Pokémon and browse Pokémon statistics in national Pokédex order.
- Search the complete Pokédex catalog, load entries progressively, and open an entry directly at `/pokedex/:slug`.
- Review Scarlet/Violet moves grouped into Level, TM, Egg, and (when present) Other tabs, with localized move names and category icons.
- Draft and compare two teams of up to six Pokémon each; guest drafts stay in that browser's local storage.
- Estimate a move's damage range and one-hit KO chance **conditional on the move hitting**.
- Create an email/password account and save, reopen, list, or delete private teams.
- Switch between English and Spanish from Spain. The browser locale selects the initial language unless the user has saved a preference.

Battle facts and mechanics come from pinned `@smogon/calc` data. PokéAPI supplies server-cached descriptive details and Spain-Spanish labels where available; generated snapshots keep translation data reproducible without startup downloads. An outage or unmapped form does not replace battle values. The [data source policy](docs/data-sources.md) explains authority, provenance, and current limitations. The API accepts known species, moves, abilities, and items without tournament-legality checks. Older generations, Google sign-in, and a player battle simulator remain outside the current release scope.

## Stack and project structure

| Area | Current implementation |
| --- | --- |
| Web | React, TypeScript, Vite, React Router, Tailwind CSS, and Radix UI components. |
| API and contracts | Fastify 5, Node.js 24, Zod 4, generated OpenAPI, Better Auth, Helmet, and Fastify rate limiting. |
| Data | PostgreSQL 18, Prisma 7, pinned `@smogon/calc`, and a server-side PokéAPI cache. |
| Verification | Vitest, Testing Library, Playwright, static Compose checks, GitHub Actions Checks, CodeQL, and Dependabot configuration. |
| Deployment design | One web/API image, separate staging and production Compose projects, shared Caddy, GHCR digest promotion, Tailscale-assisted deployment, and encrypted restic backups to USB. |

| Path | Purpose |
| --- | --- |
| [`apps/web`](apps/web/) | Browser UI, guest drafts, and Playwright journeys. |
| [`apps/api`](apps/api/) | Fastify routes and the catalog, damage, teams, and auth modules. |
| [`packages/contracts`](packages/contracts/) | Browser-safe Zod request schemas and types. |
| [`infra`](infra/) | Compose files, Caddy configuration, deployment, backup, and restore scripts. |
| [`.github/workflows`](.github/workflows/) | Checks, code scanning, staging build/deploy, and production promotion. |
| [`docs`](docs/) | Requirements, decisions, guides, test evidence, and TFM methodology records. |

The API is a modular monolith with pragmatic boundaries; the [architecture map](docs/architecture/architecture.md) and its [ADRs](docs/architecture/architecture.md#decision-records) explain the design. The browser calls same-origin `/api`; the [API contract guide](docs/api-contracts.md) lists current routes and OpenAPI coverage. For a feature-by-feature map from each view to its UI, endpoint, backend adapter, data source, and storage, see the [website guide](docs/website-guide.md). The [2026-10-03 code audit](docs/code-audit-2026-10-03.md) records findings, fixes, and verification limits.

## Run locally

Prerequisites: Node.js 24.21.0 or newer within the 24.x line, pnpm 11.19.0 (pinned by the workspace; check with `pnpm --version`), and Docker Desktop for the local PostgreSQL container, or an existing local PostgreSQL 18 server. The following commands run from the repository root.

1. Install dependencies and generate the Prisma client:

   ```sh
   pnpm install --frozen-lockfile
   pnpm db:generate
   ```

2. Copy [`apps/api/.env.example`](apps/api/.env.example) to `apps/api/.env`. Replace `POSTGRES_PASSWORD` with a local URL-safe password and use the same password in `DATABASE_URL`. Replace `BETTER_AUTH_SECRET` with a random value of at least 32 characters. Keep `.env` out of Git; the example values are placeholders. Set `PUBLIC_BASE_URL` and `TRUSTED_ORIGINS` to `http://127.0.0.1:5173` so they match Vite's default local address. SMTP settings are optional for local exploration; email verification and password reset require a working mail transport.

3. Start the local database container:

   ```sh
   pnpm db:up
   ```

   Common database commands, run from the repository root:

   ```sh
   pnpm db:status  # check whether PostgreSQL is running
   pnpm db:logs    # follow its logs; press Ctrl+C to stop viewing
   pnpm db:stop    # stop PostgreSQL while keeping its data
   pnpm db:down    # remove its container and network; keep the database volume
   ```

   Skip the container commands if you already run a local PostgreSQL server.

4. Apply the development migration and start both apps:

   ```sh
   pnpm db:migrate
   pnpm dev
   ```

Vite serves the UI at `http://127.0.0.1:5173` and proxies `/api` to Fastify at `http://127.0.0.1:4000`. The API's interactive OpenAPI UI is at `http://127.0.0.1:4000/docs` in development. Use the same hostname in your browser and auth configuration so cookies remain on the intended origin.

## Checks

```sh
pnpm build
pnpm check
pnpm lint
pnpm test
pnpm config:check
pnpm docs:check
```

`pnpm test:e2e` runs the Playwright journeys against a local PostgreSQL database. Start Docker, run `pnpm db:up`, apply outstanding migrations with `pnpm --filter @pokemon-tools/api db:deploy`, then run the test command. The runner starts and stops the API and web servers, uses a higher request limit only in the test environment, and returns Playwright's exit code. Use a disposable database; the account journey creates test users and teams. Install the configured browser with `pnpm --filter @pokemon-tools/web exec playwright install chromium` if needed. The [test strategy](docs/testing/test-strategy.md) distinguishes completed checks from host drills and human review that remain pending. On 2026-10-24, lint, TypeScript checks, the contracts build, Vite production build, UI-copy audit, 54 API tests, 166 web tests, and all 12 Playwright journeys passed. The database-backed account journey covered username/email login, saved-team loading, update/copy, reload associations, deletion, and cross-account ownership. The [workflow record](docs/tfm/ai-methodology/workflows/007-post-rollout-product-evolution.md) preserves earlier dated test results and current limits.

## Deployment status and documentation

The release path uses successful Checks on `staging` to build one image, deploy it by immutable digest, and run private smoke checks through Tailscale Serve. A successful Checks run on `main` starts production promotion, which compares the main Git tree with the tree recorded by staging and deploys that same digest. Production runs behind shared Caddy at `https://jcrserver.duckdns.org`; private staging uses Tailscale Serve. The optional public Tailscale Funnel fallback is not required for the working DuckDNS route. The [infrastructure plan](docs/infrastructure/infrastructure-plan.md) records the topology; the [mini PC operations guide](docs/operations.md) records setup, CI/CD settings, release evidence, and recovery steps. The [latest TFM workflow record](docs/tfm/ai-methodology/workflows/006-staging-production-rollout.md) captures the rollout and remaining verification limits.

| TFM handoff item | Current state |
| --- | --- |
| GitHub repository URL | [github.com/jcaballero90/pokemon-tools](https://github.com/jcaballero90/pokemon-tools) |
| Public application URL | `https://jcrserver.duckdns.org` (production deployment and page reported working by the owner). |
| Slides | https://canva.link/4wyyj6ig7gd08u1 |
| Explanatory video | https://youtu.be/i4BER2PJHYs |
| Reviewer login | Indicated in the submission form  |

Further project records: [security plan](docs/security/security-plan.md), [AI methodology and workflow evidence](docs/tfm/ai-methodology/README.md), and the [latest product-evolution workflow](docs/tfm/ai-methodology/workflows/007-post-rollout-product-evolution.md). Review the GitHub URL, live app, delivery materials, and reviewer access before TFM submission.
