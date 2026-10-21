# API contracts and OpenAPI guide

**Scope:** the routes currently registered by the Fastify application for the English-first Generation 9 release. **Status (2026-10-04):** app-owned feature routes declare response schemas, status outcomes, and relevant security in generated OpenAPI, with stable error codes and structured validation details for client localization. Better Auth remains behind a wildcard route and does not have operation-by-operation schemas. Local injection checks passed; database-backed and deployed OpenAPI checks remain. See the [code audit](code-audit-2026-10-03.md) and [test strategy](testing/test-strategy.md) for evidence.

## Calling the API

The web app sends same-origin requests to `/api` through its [fetch wrapper](../apps/web/src/lib/api.ts), using JSON and browser credentials. Local Vite proxies those requests to Fastify; the deployed image serves web and API on the same origin behind Caddy. The public API is currently unversioned. Its implemented routes are registered in [app.ts](../apps/api/src/app.ts); this page should be updated when those routes or their contracts change.

The browser does not need an API key for public utilities. Private team routes require a Better Auth session cookie. The server checks the session and scopes database operations to its user ID. Team create and delete also require an exact trusted `Origin`; missing, malformed, `null`, or untrusted values receive 403. Guest comparison teams stay in the browser and do not have API endpoints. The [security plan](security/security-plan.md) covers cookies, rate limits, proxy identity, and the selected Origin control.

| Method and path | Access | Request | Success and important outcomes |
| --- | --- | --- | --- |
| `GET /api/health` | Public | None | `200` with `{ "status": "ok" }`; used for health checks. |
| `GET /api/catalog` | Public | None | `200` with Generation 9 `species` (name, types, base stats, optional `pokedexEligible`), `moves`, `abilities`, `items`, `types`, and `natures`. Battle values come from pinned calculator data. |
| `GET /api/type-chart` | Public | None | `200` array of `{ attack, against }` rows; `against` maps defending type names to multipliers. |
| `GET /api/pokedex/:species` | Public | Species name in path | `200` descriptive PokéAPI fields, normal/shiny and male/female artwork candidate arrays, abilities with hidden status and optional descriptions, cached fields, or an `unavailable` object; `400` for a species outside the official Pokédex set. The legacy `sprite` field remains the first normal candidate for existing clients. |
| `GET /api/pokedex/:species/evolution` | Public | Species name in path | `200` family nodes, transitions with alternative requirement groups, and separate Mega links; lookup failures return `unavailable`; `400` for a species outside the official Pokédex set. |
| `POST /api/damage` | Public | [Damage request](../packages/contracts/src/index.ts) JSON | `200` damage range, conditional one-hit KO chance, and structured canonical matchup/no-effect fields; `400` for invalid shape or unknown catalog names. |
| `GET /api/me/teams` | Session | None | `200` saved teams for this owner, newest updated first; `401` without a session. |
| `POST /api/me/teams` | Session + trusted Origin | [Team input](../packages/contracts/src/index.ts) JSON | `201` created owner-scoped team; `400` for invalid shape or unknown set names; `401` without a session; `403` for missing/untrusted Origin. |
| `DELETE /api/me/teams/:id` | Session + trusted Origin | Team ID in path | `204` with no body when deleted; `401` without a session; `403` for missing/untrusted Origin; `404` if no team with that ID belongs to the caller. |
| `GET` or `POST /api/auth/*` | Varies by Better Auth operation | Delegated to Better Auth | The UI currently calls `GET /api/auth/get-session` and `POST` for email sign-up, sign-in, and sign-out. Exact auth payloads, responses, cookies, and other delegated operations are not described by the app's wildcard OpenAPI route. |

In development and private staging, `GET /api/ingress-debug` exposes raw peer, effective client IP, protocol, host, and selected forwarding headers for proxy verification. It is absent when `DEPLOY_ENV=production` and is an operational diagnostic, not a product API. The interactive OpenAPI UI is mounted at `/docs` in development and staging, with its JSON at `/docs/json`; it is not registered in production. The API should still be checked on the deployed paths because configuration and generated documents alone do not prove exposure or behavior.

## Shared request shapes

The browser-safe [contracts package](../packages/contracts/src/index.ts) exports Zod schemas and inferred TypeScript types. It fixes the first-release generation at 9. It includes distinct schemas for permissive local drafts, strict submitted teams, and app-owned response bodies. `app.ts` converts request and response schemas to JSON Schema for OpenAPI, while the browser parses feature-response payloads at runtime. Better Auth's delegated operations are outside this app-owned response registry.

**Canonical names and translations.** `/api/catalog` supplies canonical English species, moves, items, abilities, natures, and types; the API has no locale parameter or translated-name negotiation. The frontend [catalog-label helpers](../apps/web/src/lib/catalog-labels.ts) and [catalog input](../apps/web/src/components/catalog-input.tsx) translate display labels while retaining canonical values in recognized draft fields and their API submissions. Existing name validation still accepts supported normalized spellings, and team persistence stores parsed submitted names without rewriting them; external clients should use catalog names. Dictionaries use normalized canonical IDs and fall back to the catalog name for missing entries. Colliding translated input suggestions include their canonical name in parentheses; canonical English input remains valid. Incomplete browser edits stay local and still face normal submission validation. The [website guide](website-guide.md#translation-resources-and-canonical-values) explains registration and the present English-only locale resources.

**Pokémon set.** `species` is required. A set can include nickname, item, ability, nature, level, up to four moves, EVs, IVs, boosts, Tera type, and status. Defaults include level 50, Serious nature, zero EVs/boosts, and 31 IVs. Each EV is 0–252 and the total is at most 510; level is 1–100. Known names are checked against Generation 9 calculator data by the [damage adapter](../apps/api/src/modules/damage/smogon-adapter.ts). This is name and range validation, not tournament-legality validation. Empty optional item and ability names are accepted.

**Damage request.** Supply `attacker`, `defender`, `move`, and optionally `field` with Singles/Doubles, weather, terrain, screens, hazards, critical hit, Helping Hand, Friend Guard, and Terastallization flags. Unspecified field values default to neutral conditions. When a Terastallization flag is true, that set needs a Tera type. A minimal valid example is:

```json
{
  "attacker": { "species": "Pikachu" },
  "defender": { "species": "Charizard" },
  "move": "Thunderbolt",
  "field": {}
}
```

The success result includes `generation`, `min`, `max`, `minPercent`, `maxPercent`, `koChanceOnHit`, `defenderHp`, and `description`. The current adapter also returns `matchup: { attacker, defender, move }` with canonical English names and `hasEffect`, a boolean that is true when the maximum damage is greater than zero. These two additive fields are optional in `damageResponseSchema` for compatibility with older payloads. The browser builds a localized matchup/no-effect summary from them; when absent it falls back to the submitted matchup and `max > 0`. `description` retains English Smogon calculator prose, or the English no-effect message, and the UI only exposes that detail when the resolved locale is `en`.

`koChanceOnHit` is a 0–1 probability **conditional on the move hitting**; accuracy is not included. Percentages are relative to defender HP. The shared response schema is registered with OpenAPI and checked by the frontend API wrapper.

**Saved team input.** Supply a nonempty `name` and `pokemon` array of at most six sets; `notes` defaults to an empty string and `format` to `gen9`. Zero sets are currently accepted by the shared schema. A minimal example is:

```json
{
  "name": "Practice team",
  "pokemon": [{ "species": "Pikachu", "moves": ["Thunderbolt"] }]
}
```

The persistence adapter stores the parsed set data and returns database team records on create and list. The web client currently opens a saved team from the list; there is no separate `GET /api/me/teams/:id` or update route. The [requirements](requirements/requirements.md#req-006) leave the exact saved-team size policy open, so this document records current behavior rather than setting a new rule.

## Response and error boundaries

The route handlers use `200`, `201`, `204`, `400`, `401`, `403`, and `404` in the cases above; the raw-peer ingress guard can return `403`, and missing non-development ingress configuration can return `503`. Fastify configures a general limit of 120 requests per minute and Better Auth configures its own limit of 100 per 60 seconds; excessive requests can return `429`. These are current configuration values, not a public capacity guarantee. Fastify can also reject malformed JSON or request schema violations before a handler runs. Framework 4xx statuses are retained with controlled messages, and unexpected server failures return a sanitized generic 500 body. Better Auth keeps its own response semantics, and not every infrastructure-level response is described as an app-owned route result; clients should still check status first.

Project-owned failure bodies use `apiErrorResponseSchema`: required `error` compatibility text/details, a required stable `code`, and optional `issues`. Codes cover authentication/origin/ownership failures, unknown catalog names, request validation, ingress failures, and controlled HTTP/server errors. Each issue has its own `code` and a `path` of field names/array indexes, with optional `value`, `rule`, `minimum`, `maximum`, or `expected` values. For example:

```json
{
  "error": "Unknown move: Invalid move",
  "code": "validation-failed",
  "issues": [{ "code": "unknown-move", "path": ["move"], "value": "Invalid move" }]
}
```

The server's [error resource file](../apps/api/src/resources/errors.ts) centralizes English compatibility strings. Clients should use `code` and structured issue metadata for display rather than translate or parse `error`. The frontend [error formatter](../apps/web/src/lib/errors.ts) maps these codes and validation paths/rules to [locale messages](../apps/web/src/locales/en.ts); local Zod failures use the same formatting. It also maps known Better Auth codes to locale messages and uses controlled status-based fallbacks for unrecognized failures instead of arbitrary response prose. Network failures and invalid success-response shapes have localized client messages. Error codes do not change HTTP status semantics or relax API validation.

The [PokéAPI adapter](../apps/api/src/modules/catalog/pokeapi-adapter.ts) may return cached descriptive fields or `{ "source": "PokéAPI", "unavailable": true }`, sometimes with a reason. A detail response can include `pokedexId` (National Dex number), `familyKey` (the ordinary family node represented by the selection), abilities (`name`, `isHidden`, and an optional English `description`), and `artwork.normal`/`artwork.shiny` arrays in Scarlet/Violet, Legends Z-A, Champions, HOME, then official-artwork order. `artwork.genderVariants.male` and `.female` each contain separate `normal` and `shiny` candidate arrays. A missing shiny or gender-specific candidate never falls back to a different variant. When a species has no visible gender difference, both gender arrays may share the same sprite; explicitly gender-specific forms expose an empty array for the unavailable gender. `sprite` is retained as the first normal candidate for compatibility. Evolution data is fetched independently and returns `nodes`, `edges` (`alternatives` is OR between methods and AND within one method), and `megaForms`. Detail, ability-description, and evolution data use versioned keys in the existing 24-hour JSON cache and serve stale valid data after an upstream failure. Consumers must treat unavailable descriptive data as a normal result and keep battle utilities usable. The [catalog source policy](data-sources.md) is authoritative for battle versus descriptive fields.

## OpenAPI coverage and publication

`@fastify/swagger` builds an OpenAPI description from registered Fastify route schemas. App-owned feature routes now declare success/error schemas and status codes. The team list/create/delete routes all declare cookie security; POST/DELETE describe trusted-Origin 403 responses, and DELETE describes its `id` path parameter and no-body 204. The local [API composition tests](../apps/api/src/app.test.ts) inspect representative generated response/status/security entries. Better Auth's wildcard route remains delegated rather than expanded into individual operations.

The remaining contract work for [REQ-010](requirements/requirements.md#req-010) is concrete:

1. Expand generated-OpenAPI assertions to every app-owned route and compare database-backed status codes and JSON, including invalid input, missing sessions, another owner's ID, and PokéAPI fallback.
2. Decide whether Better Auth's supported operations should have a separately versioned contract; its wildcard endpoints currently have no operation-by-operation descriptions here.
3. Verify `/docs` and `/docs/json` through private staging, and verify they are unavailable through public production ingress. Confirm the documented cookie and rate-limit behavior over HTTPS.

These are documentation and verification gaps, not an assertion that the currently working handlers reject every valid request. No standalone checked-in `openapi.yaml` exists; the generated description is the current source of published API metadata. Changes to route behavior and its OpenAPI schema should be reviewed together to avoid drift.

## Course influence and project ownership

The validated private course lesson **Calidad → Documentación con IA → APIs y componentes** calls for methods, auth, request and response examples, errors, and rate limits, and distinguishes a generated OpenAPI file from proof that it matches behavior. **Fundamentos del desarrollo de software → Fundamentos de sistemas y redes → APIs y comunicación** supports reading method, status, headers, and JSON as one request/response contract. Those principles guide this audit. The routes, Zod schemas, auth choice, and release scope are Pokémon Tools implementation and owner-approved decisions; no private course text or material is reproduced here.
