# Pokémon Tools

An English-first Generation 9 Scarlet/Violet web app for exploring battle data, planning teams, and estimating damage. Guests can draft and compare two teams in their browser. An account adds private saved teams. The first release also includes a small collection of tournament teams with links to their publications and team pastes.

This repository is the working TFM project. The application is deployed to staging and production on the owner's mini PC, with production reachable at `https://jcrserver.duckdns.org`. Several end-to-end product and security checks remain open; see the [requirements](docs/requirements/requirements.md) and [test strategy](docs/testing/test-strategy.md).

## Features

- Read an offensive type chart and browse Generation 9 Pokémon statistics.
- Draft and compare two teams of up to six Pokémon each; guest drafts stay in that browser's local storage.
- Estimate a move's damage range and one-hit KO chance **conditional on the move hitting**.
- Create an email/password account and save, reopen, list, or delete private teams.
- Explore credited pro teams with published sets and source links. Unpublished spread values are left unknown.

Battle facts and mechanics come from pinned `@smogon/calc` data. PokéAPI supplies server-cached descriptive details where available; an outage or unmapped form does not replace battle values. The [data source policy](docs/data-sources.md) explains authority, provenance, and current limitations. The API accepts known species, moves, abilities, and items without tournament-legality checks. Spanish localization, older generations, Google sign-in, and a player battle simulator are later possibilities, not first-release features.

## Stack and project structure

| Area | Current implementation |
| --- | --- |
| Web | React, TypeScript, Vite, Tailwind CSS, and a Radix-based Button component. |
| API and contracts | Fastify 5, Node.js 24, Zod 4, generated OpenAPI, Better Auth, Helmet, and Fastify rate limiting. |
| Data | PostgreSQL 18, Prisma 7, pinned `@smogon/calc`, and a server-side PokéAPI cache. |
| Verification | Vitest, Testing Library, Playwright, static Compose checks, GitHub Actions Checks, CodeQL, and Dependabot configuration. |
| Deployment design | One web/API image, separate staging and production Compose projects, shared Caddy, GHCR digest promotion, Tailscale-assisted deployment, and encrypted restic backups to USB. |

| Path | Purpose |
| --- | --- |
| [`apps/web`](apps/web/) | Browser UI, guest drafts, and Playwright journeys. |
| [`apps/api`](apps/api/) | Fastify routes and the catalog, damage, teams, pro-teams, and auth modules. |
| [`packages/contracts`](packages/contracts/) | Browser-safe Zod request schemas and types. |
| [`infra`](infra/) | Compose files, Caddy configuration, deployment, backup, and restore scripts. |
| [`.github/workflows`](.github/workflows/) | Checks, code scanning, staging build/deploy, and production promotion. |
| [`docs`](docs/) | Requirements, decisions, guides, test evidence, and TFM methodology records. |

The API is a modular monolith with pragmatic boundaries; the [architecture map](docs/architecture/architecture.md) and its [ADRs](docs/architecture/architecture.md#decision-records) explain the design. The browser calls same-origin `/api`; the [API contract guide](docs/api-contracts.md) lists current routes and OpenAPI gaps.

## Run locally

Prerequisites: Node.js 24, pnpm 11 (the workspace pins `pnpm@11.19.0`), and Docker Desktop for the local PostgreSQL container, or an existing local PostgreSQL 18 server. The following commands run from the repository root.

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
```

`pnpm test:e2e` runs the written Playwright browser journeys and needs the local PostgreSQL setup; Playwright can start the web/API development servers. The [test strategy](docs/testing/test-strategy.md) distinguishes checks that have run from tests and host drills that remain pending. On 2026-09-27, the local Vitest suite passed 8 API tests and 1 web test, and the static configuration check passed; this did not exercise a deployed Caddy/Tailscale path or USB restore.

## Deployment status and documentation

The release path uses successful Checks on `staging` to build one image, deploy it by immutable digest, and run private smoke checks through Tailscale Serve. A successful Checks run on `main` starts production promotion, which compares the main Git tree with the tree recorded by staging and deploys that same digest. Production runs behind shared Caddy at `https://jcrserver.duckdns.org`; private staging uses Tailscale Serve. The optional public Tailscale Funnel fallback is not required for the working DuckDNS route. The [infrastructure plan](docs/infrastructure/infrastructure-plan.md) records the topology; the [mini PC operations guide](docs/operations.md) records setup, CI/CD settings, release evidence, and recovery steps. The [latest TFM workflow record](docs/tfm/ai-methodology/workflows/006-staging-production-rollout.md) captures the rollout and remaining verification limits.

| TFM handoff item | Current state |
| --- | --- |
| GitHub repository URL | [github.com/jcaballero90/pokemon-tools](https://github.com/jcaballero90/pokemon-tools) |
| Public application URL | `https://jcrserver.duckdns.org` (production deployment and page reported working by the owner). |
| Slides and explanatory video | Pending; links will be added when created. |
| Reviewer login | `<user>` / `<password>` are placeholders only. The owner will arrange usable test access for final delivery without committing real credentials. |

Further project records: [security plan](docs/security/security-plan.md), [AI methodology and workflow evidence](docs/tfm/ai-methodology/README.md), [documentation-pass workflow](docs/tfm/ai-methodology/workflows/005-project-documentation-pass.md), and [staging-to-production rollout workflow](docs/tfm/ai-methodology/workflows/006-staging-production-rollout.md). The README will need a final review against the actual GitHub URL, live app, delivery materials, and reviewer access before TFM submission.
