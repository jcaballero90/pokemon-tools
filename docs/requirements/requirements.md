# Pokémon Tools requirements: first release

This living specification records the project owner's approved Generation 9 Scarlet/Violet architecture and release plan. It separates **requirement approval** from **implementation progress**. All entries in the index below come from that approved plan; neither the course examples nor the implementation alone add requirements.

The project owner has approved first-release scope without assigning relative priority to each item, so the priority field is **Undecided**. **Implemented** means supporting code or configuration exists but the full acceptance check has not passed. **Verified** means the recorded check has evidence. **In progress** means part of the requested behavior or its required environment is still absent. Verification of a local behavior does not imply the public deployment has passed its release gates.

| ID | Title | Type | Priority | Implementation |
| --- | --- | --- | --- | --- |
| [REQ-001](#req-001) | English Generation 9 release | Constraint | Undecided | Implemented |
| [REQ-002](#req-002) | Type chart | Functional | Undecided | Verified |
| [REQ-003](#req-003) | Pokémon statistics | Functional | Undecided | Implemented |
| [REQ-004](#req-004) | Damage calculation | Functional | Undecided | Implemented |
| [REQ-005](#req-005) | Guest team drafting and comparison | Functional | Undecided | Implemented |
| [REQ-006](#req-006) | Accounts and private teams | Functional | Undecided | Implemented |
| [REQ-007](#req-007) | Competitive set validation | Functional | Undecided | Implemented |
| [REQ-008](#req-008) | Credited pro teams | Functional | Undecided | Implemented |
| [REQ-009](#req-009) | Battle and descriptive data authority | Constraint | Undecided | Implemented |
| [REQ-010](#req-010) | API contracts and documentation | Constraint | Undecided | In progress |
| [REQ-011](#req-011) | Application security controls | Nonfunctional | Undecided | Implemented |
| [REQ-012](#req-012) | Ingress and proxy trust | Constraint | Undecided | In progress |
| [REQ-013](#req-013) | Workspace and runtime stack | Constraint | Undecided | Implemented |
| [REQ-014](#req-014) | Automated checks | Nonfunctional | Undecided | In progress |
| [REQ-015](#req-015) | Image promotion and rollback | Constraint | Undecided | In progress |
| [REQ-016](#req-016) | Backup and production gates | Nonfunctional | Undecided | In progress |
| [REQ-017](#req-017) | Verification journeys | Nonfunctional | Undecided | In progress |

## Requirement details

### REQ-001

The first release shall present English-language utilities for Generation 9 Scarlet/Violet.

- **Origin:** Project owner's approved architecture and release plan.
- **Acceptance:** The released UI and battle catalog use this scope. Spanish, older generations, and a player battle simulator are not first-release commitments.
- **Current evidence:** The web app and API are implemented around the Generation 9 catalog. The owner reports the production page is live at `https://jcrserver.duckdns.org`; feature acceptance still needs product review.

### REQ-002

Users shall be able to read offensive type effectiveness against defending types.

- **Origin:** Project owner's approved architecture and release plan.
- **Acceptance:** The chart labels attacking and defending directions and gives known matchups, including Fire against Grass at 2× and Electric against Ground at 0×.
- **Current evidence:** [Catalog tests](../../apps/api/src/modules/catalog/catalog.test.ts), [UI test](../../apps/web/src/type-chart.test.tsx), and local browser inspection passed. This verifies the specified local behavior; public ingress remains a separate gate.

### REQ-003

Users shall be able to inspect Pokémon base statistics and available descriptive Pokédex details.

- **Origin:** Project owner's approved architecture and release plan.
- **Acceptance:** Selecting a known species shows battle statistics. If descriptive details are unavailable, battle statistics remain available.
- **Current evidence:** The [catalog](../../apps/api/src/modules/catalog/catalog.ts), [PokéAPI adapter](../../apps/api/src/modules/catalog/pokeapi-adapter.ts), and web view exist; the complete browser journey has not been verified.

### REQ-004

Users shall be able to calculate one move's damage against one target as an HP range, percentage range, and one-hit KO chance conditional on a hit.

- **Origin:** Project owner's approved architecture and release plan.
- **Acceptance:** Valid inputs return the stated results, and unknown catalog names receive an error. The chance does not incorporate move accuracy.
- **Current evidence:** The [calculator tests](../../apps/api/src/modules/damage/damage.test.ts), API composition test, and local preview returned a result. Broader checks of supported battle conditions remain.

### REQ-005

Guests shall be able to draft and compare two temporary teams of up to six Pokémon each in their browser.

- **Origin:** Project owner's approved architecture and release plan.
- **Acceptance:** Each side accepts no more than six sets, both drafts remain after a reload in the same browser, and the comparison reflects team edits.
- **Current evidence:** The builder and browser storage are implemented; a local preview confirmed adding a set and persistence after reload. The full browser journey has not run in CI.

### REQ-006

Users shall be able to create an email/password account, sign in and out, and save, list, reopen, and delete their own private teams.

- **Origin:** Project owner's approved architecture and release plan.
- **Acceptance:** Unauthenticated team requests fail, and an authenticated account cannot read or delete another account's teams. Saved set fields remain available when reopened.
- **Current evidence:** Better Auth, the team routes, and owner-scoped Prisma operations exist. Database-backed account and cross-account journeys have not run locally.

### REQ-007

The application shall accept combinations of known Generation 9 species, moves, abilities, and items within defined field ranges without claiming tournament legality.

- **Origin:** Project owner's approved architecture and release plan.
- **Acceptance:** Unknown catalog names and out-of-range level, EV, IV, or boost values fail validation. An otherwise valid combination is not rejected merely for lacking tournament legality.
- **Current evidence:** [Shared Zod contracts](../../packages/contracts/src/index.ts) and [catalog-name validation](../../apps/api/src/modules/damage/smogon-adapter.ts) implement these boundaries; full validation cases remain to be verified.

### REQ-008

Users shall be able to inspect a small collection of manually curated pro teams with publication credit.

- **Origin:** Project owner's approved architecture and release plan.
- **Acceptance:** Every published entry identifies its player, event, placement, format, and source. EVs and IVs absent from the cited publication remain unknown rather than inferred.
- **Current evidence:** The [curated entries](../../apps/api/src/modules/pro-teams/pro-teams.ts) and UI exist. A [source comparison](../data-sources.md#audit-of-the-two-current-records) found a 2024 public-sheet/report discrepancy and inconsistent event-date semantics. Final publication review and release presentation remain subject to human verification.

### REQ-009

Pinned `@smogon/calc` data shall supply battle facts and mechanics; cached PokéAPI data shall supply descriptive information only.

- **Origin:** Project owner's approved architecture and release plan.
- **Acceptance:** PokéAPI failures do not replace calculator values or disable type, statistics, or damage utilities. Supported forms map explicitly; unmapped forms report unavailable descriptive data rather than substituting another form.
- **Current evidence:** The catalog and PokéAPI adapter implement this separation. An outage exercise has not been run.

### REQ-010

The browser shall call same-origin `/api` endpoints using browser-safe Zod contracts, with generated OpenAPI documentation and interactive docs limited to development and private staging.

- **Origin:** Project owner's approved architecture and release plan.
- **Acceptance:** Published routes have accurate request and response descriptions; production does not expose the interactive docs UI.
- **Current evidence:** Contracts and Swagger generation exist. The OpenAPI audit still needs to check response descriptions across all routes.

### REQ-011

Authentication and API routes shall use proportionate application security controls, including HTTPS cookies, input validation, Helmet, patched Fastify rate limiting, and Better Auth authentication limits.

- **Origin:** Project owner's approved architecture and release plan, including the requirement for `@fastify/rate-limit` 11.2.0 or newer.
- **Acceptance:** Inspect deployed cookie attributes and response headers; verify invalid inputs and excessive requests are rejected as configured. Private team access remains owner-scoped.
- **Current evidence:** The relevant packages and configuration exist. Their behavior over deployed HTTPS paths is unverified.

### REQ-012

Shared Caddy shall be the application-facing reverse proxy for private staging and public production. Fastify and Better Auth shall trust forwarding information only through the verified Caddy proxy path, without depending on a fixed Caddy container IP.

- **Origin:** Project owner's approved architecture and release plan and explicit proxy-trust decision.
- **Acceptance:** Test direct DuckDNS HTTPS where available, private Tailscale Serve staging, and public Funnel fallback. Spoofed forwarding headers cannot alter the trusted client address, host, or scheme; a non-edge peer receives a rejection; Fastify has no host-published port; staging and production cookies remain isolated by hostname.
- **Current evidence:** The owner reports staging Serve and the public DuckDNS production page working through Caddy. This verifies basic reachability, not spoofed-header handling, non-edge rejection, deployed security headers, or cookie isolation; those host checks remain open.

### REQ-013

The project shall use one `pnpm` monorepo with the approved React/Vite, Fastify 5, Node 24, Zod 4, Better Auth, PostgreSQL 18, and Prisma 7 stack. The deployable image shall contain both the frontend and API, with environment-specific runtime configuration.

- **Origin:** Project owner's approved architecture and release plan.
- **Acceptance:** The workspace builds and its runtime image starts against separate staging and production configuration and databases.
- **Current evidence:** The local workspace builds and the Dockerfile exists. Image startup and environment separation await Docker validation.

### REQ-014

Feature PRs and pushes to the release branches shall run automated quality checks, with CodeQL and Dependabot configured for the repository.

- **Origin:** Project owner's approved architecture and release plan.
- **Acceptance:** GitHub executes the configured build, type, lint, test, schema, browser, and code-scanning checks on the intended events; dependency updates are proposed through Dependabot.
- **Current evidence:** The owner reports successful Checks and staging/production deployment workflow runs. The workflows encode checks and deployment for `staging` and `main`; retain the Actions run links as evidence. Repository branch protection, CodeQL coverage, and production environment reviewer/branch settings still require direct confirmation in GitHub settings.

### REQ-015

A staging push shall build one image, deploy and smoke-test it by immutable digest, and record the tested Git tree and digest. Production shall deploy that same digest after approval; a failed release or requested rollback shall recreate only the previous app service.

- **Origin:** Project owner's approved architecture and release plan.
- **Acceptance:** A tested staging tree is required for promotion; production performs no rebuild; rollback restores the previous app digest without reversing the database. Shipped migrations remain compatible with the immediately previous image.
- **Current evidence:** The owner reports that staging and production deployment workflows completed and the production page is live. The staging workflow builds one digest and smoke-tests selected endpoints; production checks the Git tree and promotes that recorded digest without rebuilding. Failed-stage recovery and app-only rollback have not been exercised.

### REQ-016

PostgreSQL shall receive encrypted daily and pre-production-migration backups on the mini PC's USB drive. Production shall require working public ingress and a successful disposable restore drill.

- **Origin:** Project owner's approved architecture and release plan, including the USB destination chosen in place of a NAS.
- **Acceptance:** Backups stop if the USB mount is absent; a restored snapshot can be queried in a disposable database; public ingress works from outside the home network before production is enabled.
- **Current evidence:** The owner reports a successful backup/check and ran the disposable staging restore drill. The owner also reports successful production deployment and public page reachability, implying the host's production gates passed. These facts do not establish missing-mount behavior or an off-host recovery copy; the current USB is local to the mini PC.

### REQ-017

Critical guest, account, data-adapter, and ingress behavior shall have automated or explicit host verification.

- **Origin:** Project owner's approved architecture and release plan.
- **Acceptance:** Run Vitest, adapter integration tests, Testing Library, and Playwright for the relevant journeys; run spoofed-header and network-boundary checks on each ingress path. Record any gap that cannot be exercised locally.
- **Current evidence:** Local unit/API-composition and UI tests pass, and Playwright journeys are written. Database-backed adapter integration, Playwright in CI, and host ingress checks remain pending.

## Open questions and deferred scope

These points are **not** accepted first-release requirements until the owner decides them:

- Must a saved team contain exactly six Pokémon, or may accounts save an incomplete draft of up to six?
- Is email verification required for the first public release, or is email/password sign-in sufficient when SMTP is not configured?
- What relative priorities should be assigned to the approved first-release requirements?

Spanish localization, Google sign-in, older generations, a player battle simulator, Kubernetes, a remote backup copy, and Prisma 8 remain deferred decisions. Sentry, Husky, ElevenLabs, and local AI tooling mentioned during exploration have not been selected as first-release requirements.

## Source and decision traceability

The requirements originate from the project owner's approved plan, not from course examples. The writing method is informed by the validated course knowledge documents **Ingeniería del software → Análisis de requisitos → Tipologías de requisitos**, **Documentación y especificación de requisitos**, and **Validación y verificación de requisitos**. Those lessons support clear types, origin, and checkable criteria; they do not prescribe this product's features or stack. Architecture rationale belongs in the architecture overview and ADRs, while detailed checks belong in the test strategy and operations guide.
