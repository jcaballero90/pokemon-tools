# API contracts and OpenAPI guide

**Scope:** the routes currently registered by the Fastify application for the English-first Generation 9 release. **Status:** this is a code-backed consumer guide and an audit of the generated description, not a claim that every route has a complete OpenAPI contract. [REQ-010](requirements/requirements.md#req-010) requires accurate request **and response** descriptions before acceptance. The [test strategy](testing/test-strategy.md) records what has actually been checked.

## Calling the API

The web app sends same-origin requests to `/api` through its [fetch wrapper](../apps/web/src/lib/api.ts), using JSON and browser credentials. Local Vite proxies those requests to Fastify; the deployed image serves web and API on the same origin behind Caddy. The public API is currently unversioned. Its implemented routes are registered in [app.ts](../apps/api/src/app.ts); this page should be updated when those routes or their contracts change.

The browser does not need an API key for public utilities. Private team routes require a Better Auth session cookie. The server checks the session and scopes database operations to its user ID. Guest comparison teams stay in the browser and do not have API endpoints. The [security plan](security/security-plan.md) covers cookies, rate limits, proxy identity, and the still-open project-owned mutation CSRF decision.

| Method and path | Access | Request | Success and important outcomes |
| --- | --- | --- | --- |
| `GET /api/health` | Public | None | `200` with `{ "status": "ok" }`; used for health checks. |
| `GET /api/catalog` | Public | None | `200` with Generation 9 `species` (name, types, base stats), `moves`, `abilities`, `items`, `types`, and `natures`. Battle values come from pinned calculator data. |
| `GET /api/type-chart` | Public | None | `200` array of `{ attack, against }` rows; `against` maps defending type names to multipliers. |
| `GET /api/pokedex/:species` | Public | Species name in path | `200` descriptive PokéAPI fields, cached fields, or an `unavailable` object; `400` for a species outside the known Generation 9 catalog. A missing form mapping or upstream failure is represented as unavailable rather than replacing battle values. |
| `POST /api/damage` | Public | [Damage request](../packages/contracts/src/index.ts) JSON | `200` damage range and conditional one-hit KO chance; `400` for invalid shape or unknown catalog names. |
| `GET /api/pro-teams` | Public | None | `200` array of credited curated teams. This collection is manually maintained; see the [data source policy](data-sources.md). |
| `GET /api/me/teams` | Session | None | `200` saved teams for this owner, newest updated first; `401` without a session. |
| `POST /api/me/teams` | Session | [Team input](../packages/contracts/src/index.ts) JSON | `201` created owner-scoped team; `400` for invalid shape or unknown set names; `401` without a session. |
| `DELETE /api/me/teams/:id` | Session | Team ID in path | `204` with no body when deleted; `401` without a session; `404` if no team with that ID belongs to the caller. |
| `GET` or `POST /api/auth/*` | Varies by Better Auth operation | Delegated to Better Auth | The UI currently calls `GET /api/auth/get-session` and `POST` for email sign-up, sign-in, and sign-out. Exact auth payloads, responses, cookies, and other delegated operations are not described by the app's wildcard OpenAPI route. |

In development and private staging, `GET /api/ingress-debug` exposes raw peer, effective client IP, protocol, host, and selected forwarding headers for proxy verification. It is absent when `DEPLOY_ENV=production` and is an operational diagnostic, not a product API. The interactive OpenAPI UI is mounted at `/docs` in development and staging, with its JSON at `/docs/json`; it is not registered in production. The API should still be checked on the deployed paths because configuration and generated documents alone do not prove exposure or behavior.

## Shared request shapes

The browser-safe [contracts package](../packages/contracts/src/index.ts) exports Zod schemas and inferred TypeScript types. It fixes the first-release generation at 9. These schemas govern damage requests and new saved teams; they are not yet a full response-schema registry. `app.ts` converts the two request schemas to JSON Schema for the generated OpenAPI description and also parses the input with Zod in the handlers.

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

The success result includes `generation`, `min`, `max`, `minPercent`, `maxPercent`, `koChanceOnHit`, `defenderHp`, and `description`. `koChanceOnHit` is a 0–1 probability **conditional on the move hitting**; accuracy is not included. Percentages are relative to defender HP. The [response Zod schema](../packages/contracts/src/index.ts) exists, but the route does not currently register it as an OpenAPI or runtime response schema.

**Saved team input.** Supply a nonempty `name` and `pokemon` array of at most six sets; `notes` defaults to an empty string and `format` to `gen9`. Zero sets are currently accepted by the shared schema. A minimal example is:

```json
{
  "name": "Practice team",
  "pokemon": [{ "species": "Pikachu", "moves": ["Thunderbolt"] }]
}
```

The persistence adapter stores the parsed set data and returns database team records on create and list. The web client currently opens a saved team from the list; there is no separate `GET /api/me/teams/:id` or update route. The [requirements](requirements/requirements.md#req-006) leave the exact saved-team size policy open, so this document records current behavior rather than setting a new rule.

## Response and error boundaries

The route handlers deliberately use `200`, `201`, `204`, `400`, `401`, and `404` in the cases above; the raw-peer ingress guard can return `403`, and missing non-development ingress configuration can return `503`. Fastify configures a general limit of 120 requests per minute and Better Auth configures its own limit of 100 per 60 seconds; excessive requests can return `429`. These are current configuration values, not a public capacity guarantee. Fastify can also reject malformed JSON or request schema violations before a handler runs. There is **no single stable error-body contract yet**: handlers return an `error` string, validation may return structured details, and Fastify or Better Auth may use their own response shape. Clients should check the HTTP status first and handle the body defensively. Do not promise a uniform error envelope until one is implemented and tested.

The [PokéAPI adapter](../apps/api/src/modules/catalog/pokeapi-adapter.ts) may return cached descriptive fields or `{ "source": "PokéAPI", "unavailable": true }`, sometimes with a reason. Consumers must treat unavailable descriptive data as a normal result and keep battle utilities usable. The [catalog source policy](data-sources.md) is authoritative for battle versus descriptive fields.

## OpenAPI coverage and publication

`@fastify/swagger` builds an OpenAPI description from registered Fastify route schemas. The current description contains summaries/tags for most app-owned routes, JSON request bodies for damage and team creation, a path parameter for Pokédex species, a response schema for health, and a cookie security scheme referenced on team list/create. The [API composition test](../apps/api/src/app.test.ts) confirms only that the damage and team-create request bodies appear. It does not audit full route coverage or response accuracy.

The remaining contract work for [REQ-010](requirements/requirements.md#req-010) is concrete:

1. Add and verify success and error response schemas for every published app-owned route, including unavailable Pokédex results and no-body delete behavior. Link the existing damage response schema where appropriate.
2. Document the missing delete-team path parameter and its session requirement. Decide whether the generated document should describe Better Auth's supported operations explicitly or link to a separately versioned auth contract; the wildcard route currently does not provide that detail.
3. Compare generated OpenAPI output with actual status codes and JSON from a running database-backed API. Exercise invalid input, missing sessions, another owner's ID, and PokéAPI fallback. Preserve the audit result in the [test strategy](testing/test-strategy.md) and [requirements](requirements/requirements.md).
4. Verify `/docs` and `/docs/json` through private staging, and verify they are unavailable through public production ingress. Confirm the documented cookie and rate-limit behavior over HTTPS.

These are documentation and verification gaps, not an assertion that the currently working handlers reject every valid request. No standalone checked-in `openapi.yaml` exists; the generated description is the current source of published API metadata. Changes to route behavior and its OpenAPI schema should be reviewed together to avoid drift.

## Course influence and project ownership

The validated private course lesson **Calidad → Documentación con IA → APIs y componentes** calls for methods, auth, request and response examples, errors, and rate limits, and distinguishes a generated OpenAPI file from proof that it matches behavior. **Fundamentos del desarrollo de software → Fundamentos de sistemas y redes → APIs y comunicación** supports reading method, status, headers, and JSON as one request/response contract. Those principles guide this audit. The routes, Zod schemas, auth choice, and release scope are Pokémon Tools implementation and owner-approved decisions; no private course text or material is reproduced here.
