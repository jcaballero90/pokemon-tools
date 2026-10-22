[![English](https://img.shields.io/badge/lang-en-red.svg)](website-guide.md) [![Español](https://img.shields.io/badge/lang-es-yellow.svg)](website-guide.es.md)

# How the website works

**Reviewed:** 2026-10-22. This guide describes the current English and Spain-Spanish Generation 9 implementation after localization, Pokédex, move-list, and routing work. It maps the code; it does not prove that every feature has passed production acceptance. The [code audit](code-audit-2026-10-03.md) is historical, while the [latest workflow record](tfm/ai-methodology/workflows/007-post-rollout-product-evolution.md) records later implementation and validation evidence.

## The parts of the website

The website runs as one React application in the browser and one Fastify API process on the server. React Router maps `/`, `/type-chart`, `/pokedex`, `/pokedex/:slug`, `/team-builder`, `/damage`, and `/account` to views. The URL identifies the selected Pokédex entry; direct links, refresh, and browser history are supported. Shared team, account, and session state remains above routed content.

| Part | Where it lives | What it does |
| --- | --- | --- |
| Browser application and mount | [`apps/web/src/main.tsx`](../apps/web/src/main.tsx) | Mounts React StrictMode and BrowserRouter; owns route-level composition, shared catalog and library state, session coordination, both browser drafts, and the team-builder composition. It starts the catalog, chart, session, and public site-configuration requests when the app mounts. |
| Feature views | [`apps/web/src/features/`](../apps/web/src/features/) | Keeps Overview, Type chart, Pokédex, Team editor, team comparison, Damage, and Account components in their feature folders. Their private state and effects live alongside the components. |
| Browser API client and localized errors | [`apps/web/src/lib/api.ts`](../apps/web/src/lib/api.ts) and [`apps/web/src/lib/errors.ts`](../apps/web/src/lib/errors.ts) | Adds `/api` to a request, sends same-origin cookies, checks typed responses with shared Zod schemas, and formats failures from stable API codes and validation details through locale resources. Network and unexpected-response messages also come from those resources. |
| Locale strings and active locale | [`apps/web/src/locales/en.ts`](../apps/web/src/locales/en.ts), [`apps/web/src/locales/es-ES.ts`](../apps/web/src/locales/es-ES.ts), [`apps/web/src/i18n/LocaleProvider.tsx`](../apps/web/src/i18n/LocaleProvider.tsx), and [`apps/web/src/i18n/presentation.ts`](../apps/web/src/i18n/presentation.ts) | Provides English and Spain-Spanish UI messages and a reactive locale. A saved preference takes precedence over the browser locale; Spanish browser locales select `es-ES`; unsupported locales fall back to English. The circular flag control switches languages without remounting application state. |
| Localized catalog labels and input | [`apps/web/src/lib/catalog-labels.ts`](../apps/web/src/lib/catalog-labels.ts), [`apps/web/src/components/catalog-input.tsx`](../apps/web/src/components/catalog-input.tsx), and generated API catalog resources | Displays official catalog labels in the active language while retaining canonical English values in drafts and API requests. Recognized input resolves to a canonical catalog name; incomplete edits remain unchanged. Shared datalists avoid copying the full catalog into each team field. |
| Browser draft storage | [`apps/web/src/lib/team-drafts.ts`](../apps/web/src/lib/team-drafts.ts) | Reads and writes both drafts under versioned local-storage keys, imports the older keys when present, tolerates unavailable storage, and preserves incomplete edits. |
| Shared rules and response shapes | [`packages/contracts/src/index.ts`](../packages/contracts/src/index.ts) | Defines what a Pokémon set, submitted team, damage request, API response, and in-progress browser draft look like. Submission validation remains stricter than draft recovery. |
| API composition and routes | [`apps/api/src/app.ts`](../apps/api/src/app.ts) | Composes Fastify plugins and registers catalog, type-chart, Pokédex detail/evolution/moves, damage, team, account, health, site-config, sitemap, robots, and development routes. Its static fallback serves the React app for valid page routes and returns HTTP 404 for unknown Pokédex slugs. [`apps/api/src/main.ts`](../apps/api/src/main.ts) starts the server process. |
| Database setup | [`apps/api/src/db.ts`](../apps/api/src/db.ts) and [`apps/api/prisma/schema.prisma`](../apps/api/prisma/schema.prisma) | Connect Prisma to PostgreSQL. Account records and saved teams live there; `PokedexCache` stores selected descriptive PokéAPI fields. |
| Local website delivery | [`apps/web/vite.config.ts`](../apps/web/vite.config.ts), [`apps/web/src/style.css`](../apps/web/src/style.css), [`apps/web/index.html`](../apps/web/index.html), [`apps/api/src/main.ts`](../apps/api/src/main.ts) | Vite serves the browser app during development and proxies `/api` to Fastify. For a built deployment, Fastify serves the built website and API from the same image. |

The browser-to-server flow is:

```mermaid
flowchart LR
  Browser[React UI and browser drafts] -->|same-origin /api| API[Fastify routes in app.ts]
  Contracts[Shared Zod contracts] -.-> Browser
  Contracts -.-> API
  API --> Catalog[Catalog and type chart]
  API --> Damage[Damage]
  API --> Teams[Private team routes]
  API --> Auth[Better Auth]
  Catalog -->|bundled Generation 9 data| Calc["@smogon/calc"]
  Damage -->|bundled damage mechanics| Calc
  Catalog -->|details on cache miss| PokeAPI[PokéAPI]
  PokeAPI -->|id, sprite URL, size| Cache[(PostgreSQL descriptive cache)]
  Teams -->|owner-scoped records| DB[(PostgreSQL accounts and teams)]
  Auth --> DB
  Browser -->|loads sprite image URL| Sprite[Approved PokeAPI sprites path]
```

## Translation resources and canonical values

Interface wording, placeholders, notices, accessibility text, validation messages, and error labels live in typed English and Spain-Spanish resources. The locale provider resolves a saved choice first, then the browser's supported language preferences, then English; any Spanish locale resolves to `es-ES`. Storage failures do not prevent use. The app updates the document language, localized page title and description, and SEO metadata when the route or locale changes. The locale switch preserves the mounted application state.

Battle data still uses canonical English names. The generated local catalog includes official English and Spain-Spanish labels for species/forms, moves, abilities, items, natures, and types from pinned PokéAPI data (language 7). The snapshot is committed and reproducible; builds and startup do not download translation data. Display translation does not change Smogon battle data, draft identifiers, database records, or API request values.

`CatalogInput` displays a translated suggestion but writes its canonical name when a recognized suggestion is selected or entered. Canonical English names also remain valid input. If translated suggestions collide with one another or another canonical name, `catalogOptions()` adds the canonical name in parentheses, such as `Shared (Thunderbolt)` and `Shared (Protect)`, so each choice resolves unambiguously. Unrecognized or incomplete text is retained exactly while editing; normal save/calculation validation still rejects invalid submitted names. Nature and Tera-type selects likewise display translated labels while retaining canonical option values. Pokédex search accepts both displayed and English names, and sends the selected canonical species to its endpoint.

The server's [error resources](../apps/api/src/resources/errors.ts) retain English compatibility text. App-owned failures also carry stable codes and optional field/rule details from the shared contracts. `lib/errors.ts` converts those fields, local Zod validation failures, and recognized Better Auth codes into locale messages; it does not display arbitrary server or authentication prose. The API does not negotiate or return translated catalog names.

Damage responses provide structured matchup, modifier, and damage fields. The UI presents those details in the active language and omits the calculator's English narrative. User-entered team names, nicknames, and notes remain as entered.

## What each view shows and where its data comes from

| View | What the user sees | Request and server logic | Source and storage |
| --- | --- | --- | --- |
| Overview | Introductory text and links into the team builder, calculator, type chart, and Pokédex. | [`features/overview/Overview.tsx`](../apps/web/src/features/overview/Overview.tsx); route `/`. Startup loads the catalog, chart, session, and site configuration in `main.tsx`. | Interface copy comes from the active locale resources; no sample team or seed database is used. |
| Type chart | Choose one or two defending types with buttons, or use the Pokémon finder to fill them in. The matching attacking types appear in multiplier groups; a selected Pokémon's sprite is shown when available. | UI and derived matchup groups: [`features/type-chart/TypeChart.tsx`](../apps/web/src/features/type-chart/TypeChart.tsx). `GET /api/type-chart` and `GET /api/catalog` supply the Gen 9 effectiveness chart and canonical species typings. A recognized Pokémon also uses the existing `GET /api/pokedex/:species` sprite lookup. | Matchups come from the bundled, pinned Generation 9 `@smogon/calc` data. Species types come from the same battle catalog. The optional sprite uses the existing PokéAPI cache and sprite host; the matchup calculation remains available if descriptive data or its image is unavailable. |
| Pokédex | Browse and search eligible species/forms ordered by National Dex number, with base forms before alternate forms. Search covers the full catalog and active-language labels. National numbers appear in the list; 60 results render initially and more load at scroll end or by button. A selected entry opens at `/pokedex/:slug`. | Route-aware screen and cancellable requests: [`features/pokedex/Pokedex.tsx`](../apps/web/src/features/pokedex/Pokedex.tsx), [`features/pokedex/PokemonMoves.tsx`](../apps/web/src/features/pokedex/PokemonMoves.tsx), and [`lib/pokedex-routes.ts`](../apps/web/src/lib/pokedex-routes.ts). `GET /api/catalog` supplies names, order, and battle stats. `GET /api/pokedex/:species` supplies details; separate evolution and moves requests load family and learnset data. | Battle stats come from `@smogon/calc`. Descriptive data, artwork, and evolution come from PokéAPI/cache. Moves are the recorded base Scarlet/Violet learnset; unavailable entries are identified explicitly. The panel groups Level, TM, Egg, and conditional Other methods; type and category use icons with accessible names. No egg-parent claims are presented. |
| Team builder | Two drafts of up to six Pokémon. Each set has a species, nickname, item, ability, nature, level, Tera type, status, four move slots, EVs, IVs, and boosts. | Team and draft coordination: [`features/teams/TeamEditor.tsx`](../apps/web/src/features/teams/TeamEditor.tsx). Individual Pokémon controls: [`features/teams/PokemonSetEditor.tsx`](../apps/web/src/features/teams/PokemonSetEditor.tsx). Editing and comparison are local browser state. Shared contracts validate and normalize data when submitting a save. `GET /api/me/teams`, `POST /api/me/teams`, and `DELETE /api/me/teams/:id` list, create, and remove the signed-in user's private records. | The two drafts persist in this browser's local storage. A versioned migration imports `pokemon-guest-team` and `pokemon-comparison-team`. Reused set defaults and submission normalization live in [`features/teams/team-model.ts`](../apps/web/src/features/teams/team-model.ts). Saved records use PostgreSQL through [`modules/teams/teams.ts`](../apps/api/src/modules/teams/teams.ts) and [`modules/teams/prisma-adapter.ts`](../apps/api/src/modules/teams/prisma-adapter.ts). Saving sends Team A; there is no save control for the comparison draft. |
| Team comparison | Team names, member counts, and the distinct Pokémon types present in each draft. | UI and browser-side calculation: [`features/teams/Compare.tsx`](../apps/web/src/features/teams/Compare.tsx). It prepares a short summary for each draft using the current drafts and bundled catalog; no separate API route. | It summarizes member types only. It does not calculate defensive weaknesses, move coverage, or a predicted battle outcome. |
| Damage | Attacker, defender, move, Singles/Doubles, weather, terrain, screens, field effects, HP/percentage damage range, conditional one-hit KO chance, and structured matchup/modifier/damage details in the active language. | Request state, validation, and stale-response guard: [`features/damage/Damage.tsx`](../apps/web/src/features/damage/Damage.tsx). Form controls: [`features/damage/DamageForm.tsx`](../apps/web/src/features/damage/DamageForm.tsx). Result display: [`features/damage/DamageResult.tsx`](../apps/web/src/features/damage/DamageResult.tsx). `POST /api/damage` calls [`modules/damage/smogon-adapter.ts`](../apps/api/src/modules/damage/smogon-adapter.ts), which builds Generation 9 calculator inputs and calls `@smogon/calc`. | Pinned calculator data and mechanics; no database or remote battle-data request. The KO chance is conditional on the move hitting; accuracy is excluded. Editing a set hides its old result until recalculated. |
| Account | Email/password registration and sign-in, the signed-in user, and a sign-out button. The team builder shows the user's private saved-team library. | Screen state and authentication coordination: [`features/account/Account.tsx`](../apps/web/src/features/account/Account.tsx), with colocated `AuthenticationForm` and `SignedInAccount` sections. Better Auth receives `GET/POST /api/auth/*`. The app also calls `/api/auth/get-session`; team routes require a valid session and filter by its owner. The team builder's library controls are colocated with app composition in `main.tsx`. | Better Auth and Prisma store users, sessions, accounts, and verifications in PostgreSQL. SMTP is optional in configuration; with SMTP enabled, email verification/reset delivery is configured, but the current UI does not expose those workflows. |

## What the website does not do

- It does not implement older game generations or a battle simulator. English and Spanish share the same routes; there are no separate language URL namespaces.
- Pokédex SEO metadata is rendered in the browser; the app does not use server-side rendering and cannot guarantee search-engine indexing.
- Scarlet/Violet moves describe the base-game snapshot and exclude The Teal Mask and The Indigo Disk. Egg-move parent candidates are omitted because the available source data was not considered reliable enough to claim them.
- Known Pokémon, moves, items, and abilities are checked against the catalog; that does not prove a tournament set is legal or historically used.
- The team-size cap is six, but an incomplete team can still be drafted and the current schema permits saving an empty team. This audit does not set a new team-size policy.
- A saved team opened from the library becomes the Team A browser draft. That draft continues to persist on the device after logout, because it shares the intended guest-draft storage. Logout immediately hides and discards in-memory private-library rows, but does not erase the browser draft.
- Pro-team sets are selected and transcribed from their linked publications. They are not complete exports of every possible simulator field.
- Pokédex sprite bytes remain external and depend on that image host. Height and weight are returned by the server but not shown in the present view.
- Better Auth handles its own wildcard account endpoints. Those operations do not have the same hand-written operation-by-operation OpenAPI descriptions as the project-owned feature routes.

## Where to change something

| If you want to change… | Start here |
| --- | --- |
| View layout, routes, session coordination, or private-team library interactions | [`apps/web/src/main.tsx`](../apps/web/src/main.tsx), [`apps/web/src/lib/pokedex-routes.ts`](../apps/web/src/lib/pokedex-routes.ts); feature UI lives under [`apps/web/src/features/`](../apps/web/src/features/) |
| Colors, spacing, responsive layout | [`apps/web/src/style.css`](../apps/web/src/style.css) |
| Request URLs, browser cookies, or response checks | [`apps/web/src/lib/api.ts`](../apps/web/src/lib/api.ts) |
| UI wording or language behavior | [`apps/web/src/locales/en.ts`](../apps/web/src/locales/en.ts), [`apps/web/src/locales/es-ES.ts`](../apps/web/src/locales/es-ES.ts), and [`apps/web/src/i18n/LocaleProvider.tsx`](../apps/web/src/i18n/LocaleProvider.tsx); shared display helpers are in [`apps/web/src/i18n/presentation.ts`](../apps/web/src/i18n/presentation.ts) |
| Translated Pokémon/move/item/ability/nature/type labels and input resolution | [`apps/web/src/lib/catalog-labels.ts`](../apps/web/src/lib/catalog-labels.ts), [`apps/web/src/components/catalog-input.tsx`](../apps/web/src/components/catalog-input.tsx), shared suggestions in [`apps/web/src/components/catalog-datalists.tsx`](../apps/web/src/components/catalog-datalists.tsx), and the `catalog` resource registered in [`apps/web/src/i18n.ts`](../apps/web/src/i18n.ts) |
| Localized client errors or validation wording | [`apps/web/src/lib/errors.ts`](../apps/web/src/lib/errors.ts) and [`apps/web/src/locales/en.ts`](../apps/web/src/locales/en.ts); server compatibility messages are in [`apps/api/src/resources/errors.ts`](../apps/api/src/resources/errors.ts) |
| Guest draft migration and browser persistence | [`apps/web/src/lib/team-drafts.ts`](../apps/web/src/lib/team-drafts.ts) and [`packages/contracts/src/index.ts`](../packages/contracts/src/index.ts) |
| Species list, stats, type chart, or catalog name checks | [`apps/api/src/modules/catalog/catalog.ts`](../apps/api/src/modules/catalog/catalog.ts) |
| Pokédex lookup/cache/form mapping/sprite policy | [`apps/api/src/modules/catalog/pokeapi-adapter.ts`](../apps/api/src/modules/catalog/pokeapi-adapter.ts) |
| Generated official labels, Pokédex slugs, and national/form ordering | [`apps/api/scripts/generate-pokedex-identities.mjs`](../apps/api/scripts/generate-pokedex-identities.mjs), [`apps/api/src/modules/catalog/pokedex-identities.json`](../apps/api/src/modules/catalog/pokedex-identities.json), and [`apps/api/src/modules/catalog/pokedex-identities.ts`](../apps/api/src/modules/catalog/pokedex-identities.ts) |
| Scarlet/Violet learnset data and moves UI | [`apps/api/src/modules/catalog/pokedex-moves.ts`](../apps/api/src/modules/catalog/pokedex-moves.ts) and [`apps/web/src/features/pokedex/PokemonMoves.tsx`](../apps/web/src/features/pokedex/PokemonMoves.tsx) |
| Sitemap, robots, public site metadata, and app fallback | [`apps/api/src/app.ts`](../apps/api/src/app.ts) |
| Damage inputs or result calculation | [`apps/api/src/modules/damage/damage.ts`](../apps/api/src/modules/damage/damage.ts) and [`apps/api/src/modules/damage/smogon-adapter.ts`](../apps/api/src/modules/damage/smogon-adapter.ts) |
| Saved-team ownership or Prisma queries | [`apps/api/src/modules/teams/teams.ts`](../apps/api/src/modules/teams/teams.ts), [`apps/api/src/modules/teams/prisma-adapter.ts`](../apps/api/src/modules/teams/prisma-adapter.ts), and [`apps/api/src/app.ts`](../apps/api/src/app.ts) |
| Login, account cookies, or email delivery | [`apps/api/src/modules/auth/auth.ts`](../apps/api/src/modules/auth/auth.ts) |
| Routes, API errors, Origin checks, or OpenAPI | [`apps/api/src/app.ts`](../apps/api/src/app.ts), [`apps/api/src/origins.ts`](../apps/api/src/origins.ts), and [`packages/contracts/src/index.ts`](../packages/contracts/src/index.ts) |
| PostgreSQL tables or migrations | [`apps/api/prisma/schema.prisma`](../apps/api/prisma/schema.prisma) and [`apps/api/prisma/migrations/`](../apps/api/prisma/migrations/) |

The [architecture map](architecture/architecture.md), [API contract guide](api-contracts.md), [data source policy](data-sources.md), [requirements](requirements/requirements.md), and [test strategy](testing/test-strategy.md) give the broader design, data rules, requirements, and verification status.
