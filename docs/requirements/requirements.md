[![English](https://img.shields.io/badge/lang-en-red.svg)](requirements.md) [![Español](https://img.shields.io/badge/lang-es-yellow.svg)](requirements.es.md)

# Pokémon Tools requirements: current MVP

**Review: 2026-10-25; base code: 38ae16a.** This specification consolidates the owner's approved requests against current code, contracts, tests, and configuration. It retains REQ-001 through REQ-020 and adds approved behavior that had no individual requirement. Implementation describes the present state; a technical possibility alone does not establish a new commitment.

## Review outcome

| Previous situation | Adaptation to the current MVP |
| --- | --- |
| REQ-001 through REQ-020 defined, but supported by older evidence. | Retain their identifiers and clarify acceptance criteria and verification limits. |
| Comparison described as a generic two-team feature. | REQ-022 and REQ-023 specify A vs B, Speed, and transfer to Damage. |
| Import/export and numeric controls had no individual requirements. | REQ-021 and REQ-024 cover format, bounds, errors, and inherited values. |
| Account described email-only login and a library inside Account. | REQ-006 and REQ-025 through REQ-027 cover usernames, a separate library, A/B controls, and the trainer card. |
| Data sources summarized as Smogon and cached PokéAPI. | REQ-009 distinguishes the engine, JSON snapshots, external requests, and PostgreSQL cache. |
| Overview, branding, themes, and phones had no explicit requirements. | REQ-028 and REQ-029 capture approved presentation and navigation requests. |
| Team size and email verification left as open questions. | Document current behavior: zero to six valid sets; verification depends on SMTP. |

**States:** “Implemented” means behavior located in code, with tests where cited; it does not mean complete production acceptance. “Configured” identifies workflows/scripts that need execution and external-setting verification. “Partial” indicates incomplete verification. “Removed” preserves traceability outside the MVP. Written tests are not equivalent to executed tests.

**Evidence from this review:** contracts compilation and Vitest passed: **54 API tests in 11 files, 170 web tests in 23 files, and 6 contract tests in 2 files: 230 total**. The pnpm test command could not obtain its AppData store lock; the installed TypeScript and Vitest binaries were executed directly with Node. Playwright, production build, deployments, and mini PC checks were not repeated. The [test strategy](../testing/test-strategy.md) retains historical evidence and its limits.

## Index

All active requirements belong to the approved MVP. “Scope” replaces the previous undecided priorities: it identifies delivery commitments without inventing a relative product ranking.

| ID | Title | Type | Scope | State |
| --- | --- | --- | --- | --- |
| [REQ-001](#req-001) | Generation 9 scope | Constraint | MVP | Implemented |
| [REQ-002](#req-002) | Defensive type chart | Functional | MVP | Implemented |
| [REQ-003](#req-003) | Pokémon details and statistics | Functional | MVP | Implemented |
| [REQ-004](#req-004) | Damage and battle conditions | Functional | MVP | Implemented |
| [REQ-005](#req-005) | Independent A/B drafts | Functional | MVP | Implemented |
| [REQ-006](#req-006) | Accounts and team ownership | Functional | MVP | Implemented |
| [REQ-007](#req-007) | Valid contracts and catalog names | Functional | MVP | Implemented |
| [REQ-008](#req-008) | Pro teams | Functional | Removed | Removed |
| [REQ-009](#req-009) | Sources, snapshots, and cache | Constraint | MVP | Implemented |
| [REQ-010](#req-010) | API contracts and documentation | Constraint | MVP | Implemented; verify deployment |
| [REQ-011](#req-011) | Security and sessions | Nonfunctional | MVP | Implemented; verify deployment |
| [REQ-012](#req-012) | Ingress and proxy trust | Constraint | MVP | Configured; verify host |
| [REQ-013](#req-013) | Monorepo and technologies | Constraint | MVP | Implemented |
| [REQ-014](#req-014) | GitHub Actions | Nonfunctional | MVP | Configured; verify GitHub settings |
| [REQ-015](#req-015) | Digest promotion and rollback | Constraint | MVP | Configured; verify recovery |
| [REQ-016](#req-016) | Backups and restore | Nonfunctional | MVP | Configured; verify host |
| [REQ-017](#req-017) | Journey verification | Nonfunctional | MVP | Partial: local tests; host pending |
| [REQ-018](#req-018) | English and Spain Spanish | Functional | MVP | Implemented |
| [REQ-019](#req-019) | Pokédex browsing and moves | Functional | MVP | Implemented |
| [REQ-020](#req-020) | Direct routes and basic SEO | Functional | MVP | Implemented; verify deployed origin |
| [REQ-021](#req-021) | Showdown import/export | Functional | MVP | Implemented |
| [REQ-022](#req-022) | A vs B, balance, and Speed | Functional | MVP | Implemented |
| [REQ-023](#req-023) | Transfer to Damage | Functional | MVP | Implemented |
| [REQ-024](#req-024) | Numeric editing and inheritance | Functional | MVP | Implemented |
| [REQ-025](#req-025) | Username or email login | Functional | MVP | Implemented |
| [REQ-026](#req-026) | Library and A/B controls | Functional | MVP | Implemented |
| [REQ-027](#req-027) | Trainer card and library access | Functional | MVP | Implemented |
| [REQ-028](#req-028) | Overview, navigation, and branding | Functional | MVP | Implemented |
| [REQ-029](#req-029) | Themes, phones, and keyboard access | Nonfunctional | MVP | Implemented; visual review pending |

## Requirement details

### REQ-001

**The delivery shall provide utilities based on the Generation 9 engine without simulating complete battles.**

- **Origin:** Approved release plan and the owner's request to close the MVP.
- **Acceptance:** Type chart, Pokédex, teams, comparison, Damage, Account, and private library available in English and es-ES. The engine uses Generation 9; learnsets explicitly identify base Scarlet/Violet. A catalog entry does not guarantee availability in those games or competitive legality.
- **Evidence:** [Catalog](../../apps/api/src/modules/catalog/catalog.ts), [contracts](../../packages/contracts/src/index.ts), and [routes](../../apps/web/src/lib/pokedex-routes.ts).

### REQ-002

**The chart shall display combined defensive effectiveness for one or two types.**

- **Origin:** Approved defensive-chart request.
- **Acceptance:** Manual selection limited to two types, or a species selection that fills its types; group every attacking type by multiplier, including immunities. Grass/Ground takes 4× from Ice, 2× from Bug/Fire/Flying, 0.5× from Ground/Rock, and 0× from Electric. The finder retains an accessible name when its redundant visible label is removed.
- **Evidence:** [UI test](../../apps/web/src/type-chart.test.tsx), [catalog tests](../../apps/api/src/modules/catalog/catalog.test.ts), and [guest journey](../../apps/web/e2e/journeys.spec.ts).

### REQ-003

**The detail view shall show base statistics and available descriptions for the selected species or form.**

- **Origin:** Approved product plan and Pokédex improvements.
- **Acceptance:** Battle statistics and types remain available if PokéAPI fails; accessible ability help, artwork, and evolution family appear where available. Report missing data without substituting forms. Older responses must not replace a newer selection.
- **Evidence:** [Pokédex](../../apps/web/src/features/pokedex/Pokedex.tsx), [adapter](../../apps/api/src/modules/catalog/pokeapi-adapter.ts), [adapter tests](../../apps/api/src/modules/catalog/pokeapi-adapter.test.ts), and [web regressions](../../apps/web/src/app-behavior.test.tsx).

### REQ-004

**Damage shall calculate one move against one target and show HP/percentage ranges and one-hit KO probability conditional on a hit.**

- **Origin:** Approved plan and battle-condition additions.
- **Acceptance:** Use sets and exposed conditions: Singles/Doubles, weather, terrain, screens, Helping Hand, Friend Guard, critical hit, Stealth Rock, Spikes, and per-side Terastallization. Preserve level, item, ability, nature, EVs/IVs, boosts, and status. Validate before submission, report errors, and hide previous results when editing or returning to the view. Probability excludes accuracy and does not constitute turn simulation.
- **Evidence:** [Smogon adapter](../../apps/api/src/modules/damage/smogon-adapter.ts), [damage tests](../../apps/api/src/modules/damage/damage.test.ts), [Damage](../../apps/web/src/features/damage/Damage.tsx), and [journeys](../../apps/web/e2e/journeys.spec.ts).

### REQ-005

**Guests and authenticated users shall edit two independent drafts of up to six Pokémon.**

- **Origin:** Approved A/B team and persistence plan.
- **Acceptance:** Retain name, notes, and every set field; allow zero to six members and four move positions. Preserve incomplete edits, blanks, and optional saved-team associations on reload; migrate compatible legacy formats. Storage failure reports a notice and leaves editing available. Logout preserves local contents and clears private associations.
- **Evidence:** [Persistence](../../apps/web/src/lib/team-drafts.ts), [draft tests](../../apps/web/src/lib/team-drafts.test.ts), [contracts](../../packages/contracts/src/index.ts), and [reload journey](../../apps/web/e2e/journeys.spec.ts).

### REQ-006

**Each account shall have a session and exclusive access to its own saved teams.**

- **Origin:** Private-account plan and approved update extension.
- **Acceptance:** Registration, sign-in/out, listing, creation, update, and deletion through a session. Ownership comes from the session, never the request body. Updates are atomic and owner-scoped; foreign and missing IDs both return 404 team-not-found. Empty teams are allowed if the rest of the contract is valid; a set with invalid species or values is not.
- **Evidence:** [Routes](../../apps/api/src/app.ts), [Prisma store](../../apps/api/src/modules/teams/prisma-adapter.ts), [ownership tests](../../apps/api/src/modules/teams/prisma-adapter.test.ts), and [two-account journey](../../apps/web/e2e/journeys.spec.ts).

### REQ-007

**Final actions shall validate structure, catalog names, and numbers without certifying tournament legality.**

- **Origin:** Approved legal-input plan.
- **Acceptance:** Validate before save, export, calculate, or transfer; permit partial text while editing and show localized errors on blur or action. Require known species/nature; optional item, ability, Tera type, and move slots may remain empty. Convert localized selections to canonical values. The server repeats validation for saving/calculation. Preserve invalid legacy drafts and block affected actions until corrected.
- **Evidence:** [Zod](../../packages/contracts/src/index.ts), [web validation](../../apps/web/src/features/teams/set-validation.ts), [tests](../../apps/web/src/features/teams/set-validation.test.ts), and [API validation](../../apps/api/src/modules/damage/smogon-adapter.ts).

| Field | Bound |
| --- | --- |
| Level | Integer 1–100 |
| EV per stat / per-Pokémon total | Integer 0–252 / maximum sum 510 |
| IV | Integer 0–31 |
| Boosts | Integer −6 to +6 |
| Spikes layers | Integer 0–3 |
| Team / submitted moves | 0–6 members / 0–4 nonempty moves |
| Team name / notes | 1–80 characters / up to 2000, according to the contract |

### REQ-008

**Removed:** The Pro teams tab, endpoint, and curated records are no longer part of the product. Retain the identifier for traceability. There is no pending acceptance for this feature.

### REQ-009

**Distinguish the battle engine, local snapshots, and descriptive requests with caching.**

- **Origin:** Approved data-authority decision and Pokédex/localization improvements.
- **Acceptance:** Pinned @smogon/calc supplies Generation 9 battle catalog and mechanics. Versioned JSON supplies species/form mappings, identifiers, localized names, ability descriptions, and base Scarlet/Violet learnsets, recording the source revision. PokéAPI supplies details/evolution on demand. PokedexCache stores descriptions and image URLs with 24-hour freshness and flagged stale fallback on upstream failure. It does not store image bytes or supply damage calculation data.
- **Evidence:** [Generator](../../apps/api/scripts/generate-pokedex-identities.mjs), [catalog](../../apps/api/src/modules/catalog/catalog.ts), [local learnsets](../../apps/api/src/modules/catalog/pokedex-moves.ts), [cache](../../apps/api/src/modules/catalog/pokeapi-adapter.ts), and [Prisma](../../apps/api/prisma/schema.prisma). Tests stub upstream and storage; they do not establish real external availability.

### REQ-010

**The browser and API shall share contracts and use same-origin requests.**

- **Origin:** Approved architecture.
- **Acceptance:** /api routes, Zod feature-input/response validation, and OpenAPI for app-owned routes, including PUT /api/me/teams/:id. /docs UI available in development/staging and disabled in production. Better Auth retains delegated wildcard routes without claiming individual documentation that does not exist.
- **Evidence:** [Client](../../apps/web/src/lib/api.ts), [composition tests](../../apps/api/src/app.test.ts), and [HTTP contracts](../api-contracts.md). Pending: deployed origin and exposure verification.

### REQ-011

**Protect sessions, inputs, and private data with controls proportionate to the MVP.**

- **Origin:** Security plan and account extensions.
- **Acceptance:** Secure cookies under HTTPS, Helmet/CSP, request limits, and Better Auth limits. Team creation/update/deletion require exact trusted Origin and session. Unexpected errors/logs must not expose secrets/tokens; discard private data from previous sessions. The higher NODE_ENV=test limit does not change production's 120 requests per minute.
- **Evidence:** [API](../../apps/api/src/app.ts), [origins](../../apps/api/src/origins.test.ts), [logging](../../apps/api/src/logger.test.ts), and [security](../security/security-plan.md). Pending: cookies, headers, and limits through the real deployment.

### REQ-012

**Caddy shall be the ingress proxy and trust path for forwarded headers.**

- **Origin:** Approved architecture and proxy-trust decision.
- **Acceptance:** Private staging through Tailscale Serve and HTTPS production; Funnel as the planned public fallback. Check the raw socket peer, reject peers outside the edge, and sanitize IP/host/scheme. Fastify has no host-published port; separate environment networks, databases, and cookies. Do not depend on a fixed Caddy container IP.
- **Evidence:** [Ingress](../../apps/api/src/ingress.ts), [tests](../../apps/api/src/ingress.test.ts), [Caddyfile](../../infra/caddy/Caddyfile), and [operations](../operations.md). Owner-reported reachability does not establish host spoofing or isolation checks.

### REQ-013

**Maintain one pnpm monorepo and a common frontend/API image.**

- **Origin:** Approved technologies and architecture.
- **Acceptance:** TypeScript, React/Vite and React Router, Fastify 5, Zod 4, Better Auth, Node 24, Prisma 7, and PostgreSQL 18. Contracts in packages/contracts, UI in apps/web, and API in apps/api, with versions pinned by manifests/lockfile. Docker builds/runs both parts with a non-root app user and separate runtime configuration/databases per environment.
- **Evidence:** [Manifest](../../package.json), [Dockerfile](../../Dockerfile), [staging](../../infra/compose/staging.yaml), and [production](../../infra/compose/production.yaml). This review does not rebuild or start the image.

### REQ-014

**GitHub Actions shall distinguish change validation from deployment.**

- **Origin:** Approved branch and automation flow.
- **Acceptance:** Checks and CodeQL on PRs targeting development/staging/main and pushes to those branches; not on an isolated working-branch push. Checks uses disposable PostgreSQL 18, frozen installation, Prisma, build, types/UI copy, lint, configuration, unit tests, migrations, and Playwright. Promotion source requires same-repository staging for PRs to main. CodeQL and Dependabot also run weekly. Deployments wait for successful Checks from a push to their branch, not a PR.
- **Evidence:** [Checks](../../.github/workflows/checks.yml), [CodeQL](../../.github/workflows/codeql.yml), [Promotion source](../../.github/workflows/promotion-source.yml), and [Dependabot](../../.github/dependabot.yml). docs:check exists but is not included in Checks. Pending: mandatory checks and real GitHub settings, which YAML alone does not enforce.

### REQ-015

**Production shall reuse the image tested in staging and support restoring the previous app without reverting data.**

- **Origin:** Approved immutable-release plan.
- **Acceptance:** Staging builds/publishes to GHCR, deploys the digest, migrates, and smoke-tests health, catalog, OpenAPI, and damage over private ingress. Confirm commit/tree/digest only after smoke success. Production checks matching trees and uses the same digest without rebuilding. Failure restores the previous app; manual rollback recreates only the app. Migrations must remain compatible with the previous image. Human approval requires effective environment/GitHub-rule configuration.
- **Evidence:** [Staging](../../.github/workflows/staging.yml), [production](../../.github/workflows/production.yml), and [deployment](../../infra/scripts/deploy.sh). The owner reported successful releases; reviewed evidence of rollback, failed staging, and mandatory approval remains missing.

### REQ-016

**Production PostgreSQL shall have encrypted daily/pre-migration backups and a verifiable restore.**

- **Origin:** Approved USB recovery plan.
- **Acceptance:** Daily production timer and pre-migration backup; staging supports manual backup/restore. Restic stores encrypted dumps on USB and stops without its mount. Restore into a disposable database, query data, and remove it. Promotion requires public-ingress/restore markers; markers do not replace checks. Do not promise off-host copies or unmeasured recovery times.
- **Evidence:** [Backup](../../infra/scripts/backup.sh), [restore](../../infra/scripts/restore-drill.sh), [timer](../../infra/systemd/pokemon-backup.timer), and [service](../../infra/systemd/pokemon-backup.service). The owner reported successful backup/restore; this review does not test USB or host.

### REQ-017

**Acceptance shall retain test evidence and its limits.**

- **Origin:** Quality plan and the request to close the MVP with passing tests.
- **Acceptance:** Unit/components for rules/state, PostgreSQL integration for accounts/ownership, Playwright for journeys, and host checks for ingress/recovery. The E2E runner must exit zero. Distinguish mocks from real integration and written tests from executed tests. Record date, scope, and failures; do not claim no defects or complete mechanics coverage.
- **Evidence:** [Strategy](../testing/test-strategy.md), [E2E](../../apps/web/e2e/journeys.spec.ts), and [runner](../../apps/web/scripts/run-e2e.mjs). This review establishes the unit results at the top; the strategy records 12 successful journeys on 2026-10-24, not repeated here. Host checks remain pending.

### REQ-018

**Provide English and Spain-Spanish presentation while retaining canonical identifiers.**

- **Origin:** Approved bilingual plan.
- **Acceptance:** Saved choice, browser locale, and English fallback; Spanish variants select es-ES. Switching updates copy/messages/metadata without losing forms, drafts, selection, or session. Equivalent EN/ES resources and source-backed Pokémon terminology, using PokéAPI language 7 rather than es-419.
- **Evidence:** [Locale](../../apps/web/src/i18n.test.ts), [labels](../../apps/web/src/lib/catalog-labels.test.ts), [pseudolocale](../../apps/web/src/pseudolocale-app.test.tsx), and [copy audit](../../apps/web/scripts/check-ui-literals.mjs). Tests do not replace human language review.

### REQ-019

**The Pokédex shall search the complete catalog and show available base Scarlet/Violet moves.**

- **Origin:** Approved list, move, and evolution improvements.
- **Acceptance:** National order with base forms before alternatives; canonical/localized search independent of the visible limit and accessible progressive loading. Moves grouped by method with name, type/category, and available level/TM. Identify version and missing data; exclude DLC and do not infer egg parents or set legality.
- **Evidence:** [List](../../apps/web/src/pokedex-list.test.tsx), [moves UI](../../apps/web/src/pokedex-moves.test.tsx), [moves API](../../apps/api/src/modules/catalog/pokedex-moves.test.ts), and [Pokédex E2E](../../apps/web/e2e/pokedex-redesign.spec.ts).

### REQ-020

**Each eligible entry shall have a stable URL and basic localized metadata.**

- **Origin:** Approved routes/basic SEO plan.
- **Acceptance:** Collision-free slug, direct navigation, refresh, history, and canonical URL; localized title/description, sitemap, and robots per origin/environment. Unknown slug returns HTTP 404 and localized content. Do not guarantee indexing/ranking or claim server-rendered metadata.
- **Evidence:** [Routes](../../apps/web/src/lib/pokedex-routes.test.ts), [sitemap/fallback](../../apps/api/src/app.test.ts), and [regressions](../../apps/web/src/app-behavior.test.tsx). Deployed canonical-origin verification remains pending.

### REQ-021

**Both editors shall import and export Pokémon Showdown format.**

- **Origin:** Approved team exchange and validation plan.
- **Acceptance:** Preview/apply valid imports; reject unknown names, invalid numbers/syntax, and excess size, reporting fields that cannot be retained. Export validated drafts using canonical names, explicit zeroes, and Showdown conventions. Do not generate invalid pastes or certify competitive legality.
- **Evidence:** [Import](../../apps/web/src/features/teams/showdown-import.test.ts), [export](../../apps/web/src/features/teams/showdown-export.test.ts), [component](../../apps/web/src/features/teams/ShowdownTeamExport.test.tsx), and [journey](../../apps/web/e2e/journeys.spec.ts).

### REQ-022

**Comparison shall default to A vs B and retain Team balance.**

- **Origin:** Approved comparison plan.
- **Acceptance:** Switch A→B/B→A, use selected attacks, and show the move with highest type effectiveness per cell, with incomplete-data/omitted-move diagnostics; remove the two summary cards. Balance reports weaknesses/resistances/immunities and gaps. Speed table and ↑/↓/=/ ? indicators use level, EVs/IVs, and nature, excluding items, abilities, status, boosts, and field; reversing direction reverses the reference.
- **Evidence:** [Model](../../apps/web/src/features/teams/comparison-model.test.ts), [UI](../../apps/web/src/features/teams/Compare.test.tsx), and [E2E](../../apps/web/e2e/team-comparison.spec.ts). Effectiveness excludes STAB and does not equal actual damage, success, or KO.

### REQ-023

**Each usable cell shall open its exact pair in Damage through the swords button.**

- **Origin:** Approved comparison-to-Damage plan.
- **Acceptance:** Localized accessible label/help and explained blocking for invalid sets or no move. Resolve by team/slot, including duplicate species. Copy species, nickname, level, item, ability, nature, moves, EVs/IVs, boosts, status, and Tera type with the displayed canonical move. Show set summaries; begin with neutral field, inactive Terastallization, blank EV/IV overrides, and no result. Consume each transfer once, allow fresh transfers, do not calculate automatically, and do not mutate drafts.
- **Evidence:** [Typed copying](../../apps/web/src/features/teams/team-model.ts), [cells](../../apps/web/src/features/teams/TeamMatchup.tsx), [Damage](../../apps/web/src/features/damage/Damage.tsx), and [slot/duplicate/direction tests](../../apps/web/src/features/teams/Compare.test.tsx).

### REQ-024

**Numeric editing shall prevent invalid values without confusing blanks and zeroes.**

- **Origin:** Approved legal-input and inheritance plan.
- **Acceptance:** Immediately bound integers to REQ-007; cap the edited EV at the remaining 510 budget without changing others. Show total and explanation. Reject decimals/malformed values with help; allow temporary clearing and restore the last valid required value on blur. Damage uses 0–252/0–31 placeholders, visible inherited values, and explicit zeroes. Blank inherits; if clearing exceeds budget, keep an explicitly capped override and explain. Preserve invalid legacy values and block actions until corrected.
- **Evidence:** [Integer control](../../apps/web/src/components/bounded-integer-input.test.tsx), [inherited overrides](../../apps/web/src/features/damage/damage-spreads.test.ts), and [EV/IV regressions](../../apps/web/src/app-behavior.test.tsx).

### REQ-025

**Login shall accept username or email while preserving legacy accounts.**

- **Origin:** Approved login/library plan.
- **Acceptance:** Registration with display name, separate username, email, and password. Username is case-insensitively unique, lowercase, 3–30 ASCII letters/digits/periods/underscores, validated by client/server. One login field selects email or username endpoint. Nullable column supports legacy email login and claiming a username in Account without deriving it from the display name. Localized errors. Verification and reset-email delivery depend on SMTP/sender; do not promise a visible recovery flow that does not exist.
- **Evidence:** [Better Auth](../../apps/api/src/modules/auth/auth.ts), [format](../../apps/api/src/modules/auth/auth.test.ts), [Account](../../apps/web/src/features/account/Account.tsx), [migrations](../../apps/api/prisma/migrations/), and [E2E](../../apps/web/e2e/journeys.spec.ts). Apply the username migration before running this version in each environment.

### REQ-026

**The library and both editors shall create, load, update, copy, and delete teams with session isolation.**

- **Origin:** Approved library/A/B-controls plan.
- **Acceptance:** Three-column table: name, ordered localized Pokémon names, and delete; retain duplicates, omit nicknames/artwork, and provide an accessible trash control naming the team. Delete without confirmation and remove rows only after success. A/B selectors use IDs and summaries, copy complete sets only to the selected side, and reset for repeated loading; clear errors/import/export state. Save team creates; Save changes updates; Save a copy creates and links.
- **Reliability:** Validate each side; serialize loads/mutations, disabling only library controls while busy. Save captured snapshots without replacing later edits; verify restored ownerId/teamId links and ignore other-session responses. Library failure retains the session and offers Retry. Logout/account change/deletion clears associations and keeps local contents. PUT 404 reports failure without creating another record.
- **Evidence:** [Coordination](../../apps/web/src/main.tsx), [editors](../../apps/web/src/features/teams/TeamEditor.tsx), [table](../../apps/web/src/features/account/PrivateLibrary.tsx), [regressions](../../apps/web/src/app-behavior.test.tsx), and [PostgreSQL E2E](../../apps/web/e2e/journeys.spec.ts). Not every race has an independent assertion; gaps appear below.

### REQ-027

**Account shall show a trainer card and the library shall have separate navigation.**

- **Origin:** Trainer-card plan and subsequent navigation requests.
- **Acceptance:** Username, real team count, and localized valid creation date; loading count and omission after failure. No email, invented statistics, or portrait. If username is absent, show that state and a separate spaced form; sign-out in a distinct footer. Library at /private-library, outside Account/Team Builder. Header option disabled without session, with accessible account-required help; direct URL/Overview link shows access to Account. Header shows username with a missing-name fallback. Help remains inside the viewport without header vertical scrolling.
- **Evidence:** [Account](../../apps/web/src/features/account/Account.tsx), [library](../../apps/web/src/features/account/PrivateLibrary.tsx), [header](../../apps/web/src/main.tsx), [regressions](../../apps/web/src/app-behavior.test.tsx), and [theme E2E](../../apps/web/e2e/theme.spec.ts).

### REQ-028

**Overview shall present every tool and the Pokémon Tools brand with existing Quick Ball artwork.**

- **Origin:** Presentation plan and subsequent corrections.
- **Acceptance:** One primary heading, direct introduction, Build team/Calculate damage actions, and six links: types, Pokédex, builder, comparison, Damage, and saved teams. Comparison navigates to /team-builder#team-comparison, scrolls, and focuses the section. Brand links home with existing Quick Ball art, no generated logo or pixel font; regular body text and moderate headings in both languages.
- **Evidence:** [Overview](../../apps/web/src/features/overview/Overview.tsx), [header/focus](../../apps/web/src/main.tsx), and [Overview E2E](../../apps/web/e2e/overview.spec.ts).

### REQ-029

**Retain light/dark themes and readable phone/keyboard use.**

- **Origin:** Approved presentation, form, and trainer-card plans.
- **Acceptance:** Follow system theme until a choice is saved; accessible names, visible focus, and keyboard help. Check 320 px, 390 px, and desktop in both themes/languages; wrap long text, scroll tables inside their container, and avoid vertical header scrolling. Separate help/actions; decorative icons must not duplicate accessible names. Do not claim WCAG certification or tested compatibility with every browser.
- **Evidence:** [Theme](../../apps/web/src/lib/theme.test.tsx), [CSS](../../apps/web/src/style.css), [Account/theme E2E](../../apps/web/e2e/theme.spec.ts), [Overview E2E](../../apps/web/e2e/overview.spec.ts), and [comparison E2E](../../apps/web/e2e/team-comparison.spec.ts). Human visual/accessibility review of the delivery remains pending.

## Pending verification and undefined aspects

Code existence does not establish the following items or add new MVP features.

| Area | Situation and missing evidence |
| --- | --- |
| GitHub and delivered revision | Retain Checks/CodeQL/Playwright/deployment run links for the delivered revision; confirm branch rules, required checks, Promotion source, and production approval. |
| Host and recovery | Recheck cookies/headers, spoofing, networks, and environment separation; verify daily backup, missing-USB rejection, restore, and real rollback. This review does not retest previously reported successes. |
| Recent cases | Complete specific evidence for editing during save, deletion failure, PUT 404 without replacement creation, and successive transfers preserving every field. Tests of other scenarios are not represented as exhaustive coverage of these combinations. |
| Performance/availability | No approved and measured latency, concurrency, availability, RPO, or RTO targets. No invented numbers or guarantees. |
| Quotas/lifecycle | No defined functional per-account team quota or documented cache/backup retention/purge policy. Twenty-four-hour freshness is not automatic deletion. No account-deletion UI is included. |
| Compatibility/accessibility | Browser/keyboard/phone tests do not establish certification or an exhaustive browser matrix. |
| Future priority | No approved relative product ranking. Active requirements belong to the MVP; ranking future iterations requires a new decision. |

## Outside this delivery

- Turn simulator, older generations as selectable modes, and complete tournament or species-learnset validation.
- Pro/curated teams, inferred egg parents, and Scarlet/Violet DLC learnset expansion.
- Google login, visible account recovery/deletion flow, and other features absent from the current product.
- Server-rendered SEO, separate language routes, and indexing guarantees.
- Kubernetes, Prisma 8, off-host backup, and unagreed operational targets.

## Traceability and maintenance

Requirements come from the owner's plans/corrections; this review uses code, contracts, tests, and configuration to describe their state. Technical rationale belongs in [architecture](../architecture/architecture.md) and ADRs; verification belongs in the [test strategy](../testing/test-strategy.md) and [operations](../operations.md). Those documents retain historical records: an older screen description does not replace this specification's current criteria and reviewed code. This update does not modify code or presentation deliverables.
