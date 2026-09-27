# Current state audit — 2026-09-27

> **Point-in-time snapshot, not living documentation.** This audit describes the repository and limited local observations on 2026-09-27. Future code, dependency, configuration, or deployment changes may make parts of it obsolete. Update the living [requirements](requirements/requirements.md), [architecture](architecture/architecture.md), and plans for accepted changes; retain this file as a dated assessment.

**Repository:** `pokemon-tools`, branch `main`, HEAD `deb3c4c13a74d8bc0d9ab7c3536417f562957e21` (`establish Pokémon Tools TFM application, documentation, and deployment baseline`). The configured origin is `https://github.com/jcaballero90/pokemon-tools.git`; remote availability was not checked. At the start of this audit, the working tree had two untracked repository-local skills, `react-best-practices` and `frontend-testing-debugging`, installed in the preceding task. No application files were changed for this audit.

**Evidence boundary:** I inspected [AGENTS.md](../AGENTS.md), the repository-local skills, project documents and ADRs, source, tests, workflows, and infrastructure scripts. I consulted the private knowledge index and relevant validated lessons for the distinction between verification, owner validation, and proportionate design; no private course material is reproduced here. I ran a limited local public-flow browser check using the installed dependencies, a disposable API configuration, and headless Chrome. This workstation had Node 24.18.0 and the pinned pnpm available through Corepack, but no `pnpm` executable on `PATH`, Docker/psql command, PostgreSQL listener, or live deployment. Database-backed, CI, and mini PC paths were **not verified in this audit**. Historical pass claims in the living documents were not rerun here.

## 1. Current project status

| State | Observed repository evidence | Limit |
| --- | --- | --- |
| Implemented locally | Generation 9 catalog and offensive type chart; Pokédex base stats; damage calculation; two browser-stored guest drafts and a count/type comparison; account routes and private-team persistence code; two credited pro-team records. See [web UI](../apps/web/src/main.tsx), [API composition](../apps/api/src/app.ts), and [requirements REQ-001–009](requirements/requirements.md). | “Implemented” is not “accepted” or “production verified.” Full account and Pokédex cache journeys need PostgreSQL. |
| Configured | Shared contracts, Prisma schema and initial migration, Swagger, Helmet and rate limits, Docker image, staging/production/edge Compose, Caddy, GitHub checks and promotion, backup and restore scripts. See [contracts](../packages/contracts/src/index.ts), [Prisma](../apps/api/prisma/schema.prisma), [infra](../infra/), and [workflows](../.github/workflows/). | Configuration does not establish that the image starts on the mini PC or that ingress, email, CI, and USB recovery work. |
| Partial or open | OpenAPI response coverage; project-owned mutation CSRF policy; exact pro-team source/version/date presentation; database adapter and cross-account tests; full browser journeys; email-verification policy and whether incomplete teams may be saved. These are tracked in [API contracts](api-contracts.md), [security](security/security-plan.md), [data sources](data-sources.md), [testing](testing/test-strategy.md), and [requirements](requirements/requirements.md). | Owner decisions and executable evidence remain necessary. |
| Not present or commissioned | No seed script, battle simulator, older-generation support, Spanish UI, metrics/alerting integration, verified public site, or verified deployment/restore. Deferred product items are outside first-release scope. | Do not treat optional later features as missing first-release work. |

**Interpretation:** This is a broad first-release implementation at a **pre-release verification** stage, not merely a scaffold. The initial commit contains nearly all planned application surfaces and much deployment automation. The approved plan has no dated feature milestones, so “ahead of plan” cannot be established against a schedule. The amount of implementation is ahead of the owner's expectation while database, browser, CI, host, and owner-validation evidence remain pending.

The [AI methodology record](tfm/ai-methodology/workflows/005-project-documentation-pass.md) says the application was constructed before the later documentation pass and does not reconstruct an unsaved build prompt sequence. That makes owner review of implementation-level choices especially useful; it does not prove those choices were unapproved.

## 2. Reproduce the local development environment

The authoritative short setup is the [README](../README.md); this section adds database, stop, and reset detail. Run commands from the repository root in PowerShell unless noted.

| Prerequisite | Version or purpose |
| --- | --- |
| Node.js | `>=24.11 <25`, per [root package](../package.json). Node 24.18.0 was present during this audit. |
| pnpm | `11.19.0`, pinned by `packageManager`. Ensure `pnpm --version` works on `PATH`; `corepack enable` is one setup path and may require an elevated shell on Windows. Merely running `corepack pnpm dev` did not work here because the root script invokes `pnpm` again. |
| PostgreSQL | Version 18 for the approved stack and Compose files. Use a local service or a disposable Docker container. Docker is optional if PostgreSQL 18 is already available. |
| Browser tests | Playwright's Chromium binary, installed with `pnpm --filter @pokemon-tools/web exec playwright install chromium` when needed. |

For a disposable Docker database, replace the password placeholder and use the same value in `apps/api/.env`:

```powershell
docker run --name pokemon-dev-db -d -p 127.0.0.1:5432:5432 -e POSTGRES_USER=pokemon -e POSTGRES_PASSWORD=YOUR_LOCAL_PASSWORD -e POSTGRES_DB=pokemon -v pokemon_dev_data:/var/lib/postgresql postgres:18
Copy-Item apps/api/.env.example apps/api/.env
```

Edit the ignored `apps/api/.env`:

| Variable | Local setting |
| --- | --- |
| `DATABASE_URL` | `postgresql://pokemon:YOUR_LOCAL_PASSWORD@127.0.0.1:5432/pokemon`. URL-encode reserved password characters. |
| `BETTER_AUTH_SECRET` | A locally generated random value of at least 32 characters; never use the example placeholder. |
| `PUBLIC_BASE_URL` | `http://127.0.0.1:5173`, matching Vite's bound host. |
| `TRUSTED_ORIGINS` | `http://127.0.0.1:5173`. |
| Optional | `PORT=4000`, `NODE_ENV=development`, `DEPLOY_ENV=development`, `SMTP_URL`, `EMAIL_FROM`. The latter two enable email verification and password reset when both are configured. `EDGE_CIDR` and `STATIC_DIR` are deployment settings, not local requirements. See [configuration schema](../apps/api/src/config.ts) and [auth setup](../apps/api/src/modules/auth/auth.ts). |

Then install, generate the Prisma client, apply the initial migration, and start both services:

```powershell
pnpm install --frozen-lockfile
pnpm db:generate
pnpm db:migrate
pnpm dev
```

No seed step is defined. The two pro teams are constants in [pro-teams.ts](../apps/api/src/modules/pro-teams/pro-teams.ts); battle data is bundled with pinned `@smogon/calc`; accounts and saved teams are created through the running app. Local Vite is `http://127.0.0.1:5173/`, with `/api` proxied to Fastify at `127.0.0.1:4000`. The API exposes `/api/health`; development Swagger UI is `http://127.0.0.1:4000/docs` and JSON is `/docs/json`. Use the same hostname consistently for browser cookies. The UI has one browser URL, `/`; its seven views are in-page tabs.

Stop `pnpm dev` with Ctrl+C. Stop or restart the optional database container with `docker stop pokemon-dev-db` / `docker start pokemon-dev-db`. To **delete local development data** and reapply migrations, run `pnpm --filter @pokemon-tools/api exec prisma migrate reset` against the intended development URL. Browser guest drafts are separate: clear the `pokemon-guest-team` and `pokemon-comparison-team` keys for the local origin in browser storage if a clean UI state is needed. Do not use these reset steps on staging or production.

| Check | Command |
| --- | --- |
| Prisma schema | `pnpm db:validate` |
| Unit/API/UI tests | `pnpm test` |
| Browser journeys, with local database running | `pnpm test:e2e` |
| Type checking | `pnpm check` |
| Lint | `pnpm lint` |
| Production builds | `pnpm build` |
| Workflow/Compose YAML and selected network assertions | `pnpm config:check` |

The [Playwright config](../apps/web/playwright.config.ts) starts the development servers and uses `http://127.0.0.1:5173`; it still needs a provisioned database and `apps/api/.env` for account journeys. The [Checks workflow](../.github/workflows/checks.yml) provisions PostgreSQL in CI, migrates it, and installs Chromium. This audit did not rerun those suites.

## 3. Application walkthrough and data provenance

| Screen or flow | Current behavior | Data origin |
| --- | --- | --- |
| Overview | Entry page with links into builder, damage, chart, and pro teams. | UI copy in [main.tsx](../apps/web/src/main.tsx). |
| Type chart | Offensive rows against defending type columns; 19 rows rendered in the local browser check. | `GET /api/type-chart`, calculated from pinned Generation 9 Smogon data in [catalog.ts](../apps/api/src/modules/catalog/catalog.ts). |
| Pokédex | Search a catalog species/form, show base stats, request ID/sprite/height/weight detail. The UI currently displays ID and sprite, not returned height/weight. | Base stats from Smogon. Descriptive fields from [PokéAPI adapter](../apps/api/src/modules/catalog/pokeapi-adapter.ts), cached in PostgreSQL for 24 hours, with stale-cache fallback. Sprite **URL**, not image bytes, is cached. |
| Team builder | Edit two teams of up to six, compare team count and unique member types, save/reopen/delete a team when signed in. | Drafts in this browser's `localStorage`; authenticated records in PostgreSQL via [team store](../apps/api/src/modules/teams/prisma-adapter.ts). No built-in runtime mock data. |
| Damage | One selected attacker, defender, move, and field; shows HP/percentage range and one-hit KO chance conditional on hitting. | `POST /api/damage`, pinned Smogon calculator via [adapter](../apps/api/src/modules/damage/smogon-adapter.ts). It does not calculate move accuracy into the displayed chance. |
| Pro teams | Two code-curated player records, sets, report links, and paste links. | Manually transcribed [pro-teams.ts](../apps/api/src/modules/pro-teams/pro-teams.ts), not a live tournament feed. Missing published IVs remain unknown. The [source audit](data-sources.md#audit-of-the-two-current-records) records a source-version conflict and date ambiguity. |
| Account | Email/password sign-up, sign-in/out; session-dependent private library. | Better Auth and PostgreSQL. SMTP is optional locally; enabling it changes verification behavior. Database-backed behavior was not exercised here. |

The API route inventory and error behavior are in [API contracts](api-contracts.md). The UI's local types and generic `api<T>` calls are TypeScript assertions, not runtime response validation. Test files contain synthetic fixtures; the sign-out observation below used isolated Playwright route mocks only to expose a UI state transition, not to claim a working database.

## 4. Architecture walkthrough

The [living architecture map](architecture/architecture.md) is the main system diagram. The repository is a `pnpm` monorepo: [apps/web](../apps/web/) owns React/Vite UI, tabs, draft state, styling, and browser journeys; [apps/api](../apps/api/) owns one Fastify process and the `catalog`, `damage`, `teams`, `pro-teams`, and `auth` modules; [packages/contracts](../packages/contracts/) exports browser-safe Zod input schemas and types. [app.ts](../apps/api/src/app.ts) is both route registration and composition point. Shared request schemas are converted to route request metadata for selected endpoints. Responses and errors are not yet covered uniformly by OpenAPI.

The browser calls same-origin `/api`. In development [Vite](../apps/web/vite.config.ts) proxies it to Fastify; the [Dockerfile](../Dockerfile) builds web and API into one image and [app.ts](../apps/api/src/app.ts) can serve the web build itself. The frontend uses component-local React state and effects, no external state store or routing library in use despite the `react-router` dependency. Two drafts persist in `localStorage`. API reads, auth session, and saved teams are fetched through [api.ts](../apps/web/src/lib/api.ts). Loading and failure handling vary by screen (F06).

[Config](../apps/api/src/config.ts) validates environment values before listening. Fastify registers Helmet, general rate limiting, Swagger, Better Auth delegation, public routes, and owner-protected team routes. Better Auth uses Prisma-backed user/session/account/verification tables in the [schema](../apps/api/prisma/schema.prisma). The team adapter filters database list and delete operations by `ownerId`; the browser's visibility rules are not an authorization boundary. Zod bounds fields, and the damage adapter checks known catalog names. Errors have multiple shapes and the Pokédex route currently treats all exceptions as 400 (F03). There is no uniform API error contract yet.

Pinned `@smogon/calc` supplies battle facts and damage; [PokéAPI](../apps/api/src/modules/catalog/pokeapi-adapter.ts) only supplies descriptive data. The cache uses `PokedexCache` and a four-second network timeout; cached payloads older than 24 hours are used if a refresh fails, without a visible stale label. The two published teams are source-linked constants. See [data-source policy](data-sources.md) for authority and source limitations.

Tests are [Vitest API tests](../apps/api/src/), one [Testing Library chart test](../apps/web/src/type-chart.test.tsx), and two written [Playwright journeys](../apps/web/e2e/journeys.spec.ts). The [test strategy](testing/test-strategy.md) records a historical local pass of 8 API and 1 web test, while database adapter integration, CI browser, and host ingress checks remain open. [Infra](../infra/) defines three Compose projects: shared Caddy, private staging app/database, and production app/database. Caddy's public 80/443 and host-loopback 18081/18082 listeners route to the matching API; API and database services publish no host port in the checked-in Compose files. [ADR-005](adr/ADR-005-caddy-proxy-trust.md) describes the CIDR/forwarded-header boundary. [Workflows](../.github/workflows/) and [deploy/backup scripts](../infra/scripts/) encode digest promotion and local USB recovery; [operations](operations.md) lists the external setup and checks still needed.

On the planned host, the browser's production address uses Caddy's public 80/443, while private staging Serve and public Funnel forward to host-loopback 18081 and 18082, respectively. Caddy then reaches the matching Fastify service on container port 4000; each PostgreSQL service listens on container port 5432 only within its environment's database network. Exact public and tailnet hostnames come from host environment files and are not live URLs established by this audit. [Operations](operations.md) requires Docker Engine with Compose v2, Tailscale, restic, OpenSSH, and curl on the mini PC; their exact installed versions remain to be checked there.

## 5. Decisions and authority

| Decision | Implementation | Authority and discarded alternatives | Owner review |
| --- | --- | --- | --- |
| Modular monolith and selective ports | [API modules](../apps/api/src/modules/), `TeamStore`, `DamageCalculator` | Accepted [ADR-001](adr/ADR-001-modular-monolith.md) compares separate services, rigid layers, and no boundaries. | Review the actual module coupling, but no speculative layer refactor is warranted now. |
| Battle/descriptive/published data authority | [catalog](../apps/api/src/modules/catalog/catalog.ts), [damage](../apps/api/src/modules/damage/smogon-adapter.ts), [PokéAPI adapter](../apps/api/src/modules/catalog/pokeapi-adapter.ts), [curated teams](../apps/api/src/modules/pro-teams/pro-teams.ts) | Accepted [ADR-002](adr/ADR-002-data-authority-and-provenance.md) rejects an all-PokéAPI model, a custom calculator, and inferred team values. | Validate source conflicts and licensing/publication presentation before release. |
| Browser drafts plus PostgreSQL/Prisma/Better Auth accounts | [main.tsx](../apps/web/src/main.tsx), [schema](../apps/api/prisma/schema.prisma), [auth](../apps/api/src/modules/auth/auth.ts) | Accepted [ADR-003](adr/ADR-003-private-teams-and-identity.md) compares browser-only persistence, alternative persistence, and custom auth. | Decide email verification and whether saved teams may be incomplete; fix F01. |
| One image, three Compose projects, shared Caddy, controlled proxy trust | [Dockerfile](../Dockerfile), [Compose/Caddy](../infra/), [ingress](../apps/api/src/ingress.ts) | Accepted [ADR-004](adr/ADR-004-compose-and-shared-caddy.md) and [ADR-005](adr/ADR-005-caddy-proxy-trust.md) compare Kubernetes, split images/proxies, fixed IPs, and broad proxy trust. | Validate real host routing and F02's CSP conflict. |
| Immutable staging-to-production promotion and USB recovery gates | [workflows](../.github/workflows/), [deploy.sh](../infra/scripts/deploy.sh), [backup.sh](../infra/scripts/backup.sh) | Accepted [ADR-006](adr/ADR-006-immutable-release-and-recovery.md) compares rebuilds, mutable tags, image-only recovery, and backups without restore. | Confirm host scripts, GitHub protection, ingress, and restore before release. |
| One-page tabs, default Pikachu/Charizard/Thunderbolt sets, count/type-only comparison, and current form layout | [main.tsx](../apps/web/src/main.tsx) | **Implementation choices; no specific approved UI ADR or alternative analysis found.** They fit broad features but were not explicitly selected by the requirements. | Personally validate whether this comparison is useful, whether deep links matter, and whether the calculator makes hidden set values clear. Do not infer a new product requirement from the audit. |

The approved plans select the significant stack and infrastructure choices. The last row identifies concrete design details that appear to have been chosen during implementation; their rationale should not be invented after the fact.

## 6. Comparison with the plan

| Source | Assessment |
| --- | --- |
| [Requirements](requirements/requirements.md) | REQ-001–009 and 013 have supporting implementation, with the same verification limits the specification records. REQ-010 and 014–017 remain incomplete or unverified as explicitly tracked. The private-library sign-out behavior is a **requirement deviation** (F01). |
| [Architecture](architecture/architecture.md) and [ADRs](adr/) | The monorepo, module division, data authority, persistence, and intended ingress topology align with accepted records. Helmet's current image policy conflicts with the remote-sprite display path, an **architectural/configuration deviation** (F02). Deployment behavior remains untested, so no other host architecture deviation is confirmed. |
| [Infrastructure plan](infrastructure/infrastructure-plan.md), [operations](operations.md), and release design | Compose, Caddy, digest promotion, SSH wrapper, and USB scripts exist as planned. No mini PC, public ingress, backup restore, or GitHub workflow run is claimed. These are **planned verification gaps**, not evidence of an off-plan deployment. |
| [Security plan](security/security-plan.md) | Header/edge guards, session checks, rate limits, and owner-filtered queries exist. The plan openly identifies missing own-route CSRF protection and host/cookie checks. F01 and F03 add observed behavior needing review. |
| [Test strategy](testing/test-strategy.md) | Present tests match the plan's recorded assets. Database adapter, cross-account, cache, full browser, and host verification are still missing; this is an acknowledged gap, not documentation drift. |

Additional differences classified under the requested categories:

| Difference | Classification | Evidence and judgment |
| --- | --- | --- |
| Saved rows remain visible after sign-out | **Requirement deviation** | F01; conflicts with the private-library behavior described by [REQ-006](requirements/requirements.md#req-006) and the UI. |
| Remote Pokédex sprite path versus Helmet image policy | **Architectural deviation** | F02; policy conflict confirmed in a local Fastify response, deployed browser effect still unverified. |
| Seven in-page tabs without individual URLs | **Harmless implementation detail** for current scope | [main.tsx](../apps/web/src/main.tsx); no approved deep-link requirement. Revisit only if the owner needs URL navigation. |
| Count/type-only team comparison and conditional SMTP verification | **Potential issue requiring human review** | Both are implementation choices within open/broad requirements, not proven requirement breaches. |
| Pro-team source-version/date ambiguity | **Potential issue requiring human review** | F12 is already accurately recorded in [data sources](data-sources.md); do not call it newly discovered documentation drift. |

**No confirmed documentation drift** was found in the living plans on the inspected revision. No dated milestone sequence exists to substantiate a separate “implementation ahead of plan” classification; the broader-than-expected functionality is described in section 1. Pending verification is not counted as a deviation by itself.

## 7. Findings requiring review

“Action warranted” means a future targeted decision, check, or fix. No finding was automatically changed. Static inferences are distinguished from local observations.

| ID | Finding, files, and practical impact | Action warranted? |
| --- | --- | --- |
| **F01 — high** | [main.tsx](../apps/web/src/main.tsx) `refreshSession` clears `user` but never `saved` on sign-out or failed refresh; the builder renders `saved` even in guest mode. An isolated Playwright check with mocked account/team responses showed “Guest mode” **and** a previously loaded private team row after sign-out. Real database authorization was not involved. This exposes previously fetched team data to the next user of that browser session. | **Yes, before account use.** Clear private UI state when a session ends or changes, and verify the complete lifecycle. |
| **F02 — high** | [app.ts](../apps/api/src/app.ts) registers Helmet defaults. A local Fastify response included `Content-Security-Policy: ... img-src 'self' data:`; [Pokédex UI](../apps/web/src/main.tsx) renders the adapter's remote sprite URL in an `img`. Externally hosted sprites are outside that policy, so the intended deployed display path conflicts with the configured header. The production image was not run here. | **Yes, before release.** Verify a real sprite under built/static serving, then decide an appropriately narrow image policy or same-origin image handling. |
| **F03 — medium** | [app.ts](../apps/api/src/app.ts) returns 400 and the thrown message for every Pokédex exception, including database failures. With no PostgreSQL in this audit, `/api/pokedex/Pikachu` returned 400 although Pikachu is valid. This mislabels a server outage and may reveal internal error text. | **Yes.** Distinguish unknown species from operational failure and check the public error body. |
| **F04 — medium, inferred from code** | [Pokedex](../apps/web/src/main.tsx) starts a request on each selection but does not cancel or tie its response to the selected species. A slower earlier result can set ID/sprite under a newer species and its Smogon stats. | **Yes.** Verify rapid selection and guard against stale responses. |
| **F05 — medium** | [Damage](../apps/web/src/main.tsx) retains the last result when inputs change; it also sends nature, level, EVs/IVs, boosts, status, and Tera type from set state without exposing most of them on the calculator form. The visible result can describe older inputs or hidden values. | **Yes.** Owner should validate the intended calculator workflow, then make input/result provenance unambiguous. |
| **F06 — medium** | [main.tsx](../apps/web/src/main.tsx) silently ignores chart and pro-team request errors and has no explicit loading state for those screens. The catalog alone sets a generic notice. A network failure may look like an empty chart or empty collection. | **Yes.** Add targeted loading, empty, and error behavior after defining expected states. |
| **F07 — medium** | In [TeamEditor](../apps/web/src/main.tsx), move inputs use placeholders rather than associated labels, repeated stat labels lack a fieldset/legend context, and the active navigation button has only a CSS class. This can make fields and the current view ambiguous to assistive technology. No full accessibility audit was run. | **Yes.** Perform a keyboard/screen-reader pass and address the confirmed labeling structure. |
| **F08 — medium** | [main.tsx](../apps/web/src/main.tsx) hand-declares `Catalog`, `ProTeam`, and `SavedTeam`; [api.ts](../apps/web/src/lib/api.ts) trusts generic response types without parsing. [Contracts](../packages/contracts/src/index.ts) cover inputs and one damage response but are not used consistently for returned data. Error bodies vary, as [API contracts](api-contracts.md) records. Changes can silently desynchronize API, UI, and OpenAPI. | **Yes, with REQ-010.** Review response contracts and one error strategy; avoid a broad rewrite merely for type style. |
| **F09 — low/medium** | The seven screens and their state/effects are compressed into one roughly 22 KB [main.tsx](../apps/web/src/main.tsx); most of the roughly 9 KB [style.css](../apps/web/src/style.css) is on two long lines. This makes focused reviews, accessibility changes, and conflict resolution harder. The accepted `TeamStore` and `DamageCalculator` ports are thin, but there is no evidence they currently require removal. | **Targeted action later.** Split only along real screen/state boundaries when fixing validated behavior. No speculative abstraction cleanup is warranted. |
| **F10 — high** | [Tests](../apps/api/src/) cover calculation, catalog, CIDR, and injected routes; the [web unit test](../apps/web/src/type-chart.test.tsx) covers one chart row. [Playwright journeys](../apps/web/e2e/journeys.spec.ts) are written but do not cover sign-out, cross-account isolation, cache fallback, or all guest states, and have no recorded CI run. No database adapter integration tests exist. This leaves private-data and release claims weakly evidenced. | **Yes, before public release.** Add checks by risk after the owner reproduces the environment and accepts the intended behavior. |
| **F11 — high, already documented** | [app.ts](../apps/api/src/app.ts) checks sessions on project-owned team POST/DELETE but has no explicit Origin/CSRF defense. [Security plan](security/security-plan.md#cookies-csrf-and-browser-content) already identifies the open choice; Better Auth's auth-route handling does not establish protection for these routes. | **Yes, before public release.** Owner selects the mutation policy; then verify allowed and foreign-origin requests. |
| **F12 — medium, already documented** | The two [curated records](../apps/api/src/modules/pro-teams/pro-teams.ts) have a report/paste versus public-sheet conflict for a 2024 Urshifu set, inconsistent meaning for `eventDate`, and a display model that omits some source metadata. [Data sources](data-sources.md#audit-of-the-two-current-records) accurately describes these limits. An unlabeled “official” presentation could overstate certainty. | **Yes, before publication.** Owner reviews the exact linked sources and approves wording/date semantics. |

No clear harmful duplicated business logic or premature abstraction beyond F08/F09 was established. The cross-module call from team validation into damage validation is explicitly acknowledged as a pragmatic boundary in [ADR-001](adr/ADR-001-modular-monolith.md); refactor it only if tests or changes show a concrete cost.

## 8. Frontend evidence and limits

The `react-best-practices` skill guided checks for fetch sequencing, stale state, and rendering work; `frontend-testing-debugging` guided the rendered flow, console, screenshot, and mobile checks. Its Browser plugin was absent, so I used regular Playwright against local Vite/Fastify with installed headless Chrome. No dependency or application file was changed for this check.

| Check | Observation |
| --- | --- |
| Identity/content/overlay | `http://127.0.0.1:5173/` titled “Pokémon Tools”, showed Overview content, and had no framework overlay or page exception in checked flows. |
| Interaction | Type chart rendered 19 attack rows; adding a guest set changed the first team to 1/6 and survived reload; clicking Calculate produced 68–84 HP, 44.4–54.9%, and 0% one-hit KO for the default Pikachu/Charizard example. The two pro-team cards and account form rendered. |
| Responsive | At 390×844, Overview and the empty builder had no document-width overflow. The nav itself scrolls horizontally (571 px content in a 346 px viewport); a new user may not discover off-screen views without scrolling. No full device or assistive-technology matrix was run. |
| Console | One 404 was `/favicon.ico`. Selecting Pikachu also produced 400 from the Pokédex API because the disposable run had no PostgreSQL; Smogon base stats still rendered. This run cannot establish healthy descriptive cache behavior. |
| Private UI state | A separate, explicitly **mocked** auth/team-response check confirmed F01 after sign-out. It was not a database authorization test. |

The desktop Overview and mobile Overview/builder screenshots were inspected locally outside the repository; they are transient audit evidence, not a committed artifact. Account creation, persistence, cross-account access, email delivery, real PokéAPI cache responses, deployment CSP, all ingress paths, and the full existing Playwright suite remain unverified.

## 9. What the owner should study personally

| Study area and files | Understand and be able to answer |
| --- | --- |
| [requirements](requirements/requirements.md), [architecture](architecture/architecture.md), and [ADRs](adr/) | Which features and stack choices were approved? Which entries are implemented versus verified? Why were the modular monolith, data-source hierarchy, private storage, Compose/Caddy, proxy trust, and immutable promotion chosen? |
| [main.tsx](../apps/web/src/main.tsx), [api.ts](../apps/web/src/lib/api.ts), [contracts](../packages/contracts/src/index.ts) | How do tab state, draft persistence, account state, and API calls interact? What exactly is the “comparison”? Which set fields affect damage without appearing on the calculator form? Why does F01 happen? |
| [app.ts](../apps/api/src/app.ts), [auth.ts](../apps/api/src/modules/auth/auth.ts), [team adapter](../apps/api/src/modules/teams/prisma-adapter.ts) | Where is authentication checked, where is owner filtering enforced, and which responses/errors are generated by app code versus libraries? What should happen on logout and on a foreign-origin mutation? |
| [catalog](../apps/api/src/modules/catalog/catalog.ts), [PokéAPI adapter](../apps/api/src/modules/catalog/pokeapi-adapter.ts), [damage adapter](../apps/api/src/modules/damage/smogon-adapter.ts), [data sources](data-sources.md) | Which facts are pinned, cached, externally fetched, or manually curated? How do a form mismatch, outage, or source conflict appear to users? |
| [schema/migration](../apps/api/prisma/), [test strategy](testing/test-strategy.md), [browser journeys](../apps/web/e2e/journeys.spec.ts) | What persists and what is generated? Which acceptance criteria have actual execution evidence, and how would you reproduce an account and cross-account check? |
| [Dockerfile](../Dockerfile), [infra](../infra/), [workflows](../.github/workflows/), and [operations](operations.md) | Trace one request through Caddy to Fastify and one image from staging to production. What must be configured manually on the mini PC and GitHub? What can an image rollback recover, and what needs a database restore? |
| [AGENTS.md](../AGENTS.md), [repository skills](../.agents/skills/), and [AI methodology](tfm/ai-methodology/README.md) | Which rules separate approved decisions from AI inference? Which initial-build decisions have durable records, and where should later review or correction be recorded? |

## 10. Recommended next actions

1. Read the requirements index and ADRs, then walk the seven screens with this audit beside them. Record which implementation-level choices you accept or question.
2. Install/expose pnpm 11.19, provision PostgreSQL 18, and reproduce the documented local startup with your own `.env`; confirm the initial migration and no real secrets in Git.
3. Personally exercise the guest chart/Pokédex/builder/damage/pro-team flow, then the full account lifecycle with two distinct accounts. Include sign-out, reload, and private-team visibility.
4. Validate architectural boundaries against the running database and, later, the built image: owner-scoped data, data authority, CSP/sprites, error behavior, and the Caddy/edge trust chain.
5. Decide open product/security questions: incomplete saved teams, email verification, team comparison meaning, project-owned CSRF policy, and pro-team source/date wording.
6. Correct confirmed behavior/configuration deviations first (especially F01 and F02/F03), then make only targeted UI/contract refactors justified by those fixes.
7. Add missing risk-focused database, cache, account, browser, and host checks; run existing quality gates and retain results.
8. Update living requirements, API, security, and operations documents only for decisions or evidence that actually change. This dated audit should remain a snapshot.

These are proposed owner-led follow-ups, not actions performed by this audit.

## 11. Manual checklist

- [ ] Read [REQ-001–017](requirements/requirements.md) and mark which acceptance checks you have personally observed.
- [ ] Read the six [ADRs](adr/) and explain each selected alternative in your own words.
- [ ] Confirm `node --version` satisfies the engine range and `pnpm --version` is `11.19.0`.
- [ ] Start PostgreSQL 18, create the local database, copy/edit `apps/api/.env`, then run `pnpm install --frozen-lockfile`, `pnpm db:generate`, `pnpm db:migrate`, and `pnpm dev`.
- [ ] Open `http://127.0.0.1:5173/`; check all seven tabs, the chart direction, mobile nav, and responsive builder fields.
- [ ] Select ordinary and hyphenated/form Pokémon in the Pokédex; inspect base stats, descriptive fallback, sprite, and browser console.
- [ ] Edit both guest drafts, reach six members, compare them, reload, and verify the two local-storage keys.
- [ ] Calculate damage, then change inputs before recalculating; inspect which values the result actually describes.
- [ ] Create two test accounts in a **local** database; save, reopen, list, and delete teams, then test cross-account IDs and sign-out visibility. Decide incomplete-team and email-verification policy.
- [ ] Compare both pro-team records with linked reports/pastes and resolve documented source-version/date issues.
- [ ] Inspect `/api/health`, `/docs`, and `/docs/json`; compare actual success/error responses with the generated contract.
- [ ] Run `pnpm db:validate`, `pnpm build`, `pnpm check`, `pnpm lint`, `pnpm test`, and `pnpm config:check`; record versions and failures.
- [ ] Install Playwright Chromium if necessary, then run `pnpm test:e2e` with PostgreSQL and local `.env` available.
- [ ] Review [security plan](security/security-plan.md) and decide how own-route team mutations reject cross-origin requests.
- [ ] Before any public release, follow [operations](operations.md) on the mini PC for Compose network membership, Caddy and Tailscale headers, cookies, external HTTPS, GitHub protection, digest promotion, and USB backup/restore gates.
- [ ] Stop local services with Ctrl+C and stop the optional database container; reset only the intended disposable development data.

## 12. Audit summary

The repository is a **functionally broad local first-release implementation with unverified database, CI, and production paths**. The owner's first attention should go to understanding approved scope, reproducing the environment, validating account privacy and data-source behavior, and reviewing implementation-level UI/security choices. This audit tracks **12 findings requiring review (F01–F12)**, including **1 confirmed architectural/configuration deviation** (the sprite/CSP conflict), **1 requirement behavior deviation** (private rows after sign-out), and **0 confirmed documentation drift findings**. The first concrete action to perform personally is: **read the [requirements index](requirements/requirements.md) and mark which acceptance checks you have personally seen pass**.
