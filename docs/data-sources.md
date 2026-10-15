# Data sources and publication policy

**Scope:** Generation 9 battle and Pokédex data. This living document applies the accepted [data authority decision](adr/ADR-002-data-authority-and-provenance.md) to source selection and cache behavior. It records current code behavior and limitations; it does not grant rights to third-party text or images.

## Authority by data type

| Data used by the site | Authority and current implementation | Boundary |
| --- | --- | --- |
| Type effectiveness, species names and base stats, moves, abilities, items, natures, and damage mechanics | Pinned `@smogon/calc` `0.12.0`, selected with `Generations.get(9)` in the [catalog](../apps/api/src/modules/catalog/catalog.ts) and [damage adapter](../apps/api/src/modules/damage/smogon-adapter.ts). The [calculator project](https://github.com/smogon/damage-calc/blob/master/README.md) supplies a generation-specific data layer and damage ranges. | These values are not replaced by PokéAPI fields. Dependency upgrades need catalog and representative damage regression checks. |
| Pokédex ID, sprite URL, height, and weight | The server's [PokéAPI adapter](../apps/api/src/modules/catalog/pokeapi-adapter.ts) requests the [Pokémon endpoint](https://pokeapi.co/docs/v2#pokemon) for a known catalog species and stores the selected response in `PokedexCache`. | Descriptive only. A missing response, form mapping, or sprite must leave battle features available. The cached value contains a sprite **URL**; the image bytes themselves are not cached by this adapter. |
| Guest and saved teams | Entered by the user, validated against known names and field ranges. | These are user data, not evidence that a set was legal or played in an event. |

The [Smogon calculator README](https://github.com/smogon/damage-calc/blob/master/README.md#license) identifies the package's MIT license. [PokéAPI's fair-use policy](https://pokeapi.co/docs/v2#fair-use-policy) asks consumers to cache requested resources; the server caches selected response fields, while sprite image bytes remain external. The rights to Pokémon imagery are a separate matter; do not assume an open API alone grants every reuse right.

## PokéAPI mapping, cache, and failure behavior

The API first requires a species known to the pinned Generation 9 catalog. A [small explicit map](../apps/api/src/modules/catalog/pokeapi-adapter.ts) covers Wellspring, Hearthflame, and Cornerstone Ogerpon, Rapid Strike Urshifu, female Indeedee, and Chien-Pao. A plain name without a hyphen uses the calculator's normalized ID. Other unmapped names containing a hyphen return `unavailable` rather than silently substituting another form. Do not present the current map as complete form support.

A cached response younger than 24 hours is returned without a network request. Otherwise the adapter requests PokéAPI with a four-second timeout and best-effort writes the selected fields to PostgreSQL. On fetch, status, parse, or cache failure, it uses an older cached payload when available and marks the response `stale`; with no usable cache it returns `unavailable`. Cache read/write failures do not prevent fresh descriptive data from being returned. The UI permits only the expected PokéAPI sprite URL path in its image source; sprite bytes are still loaded by the browser from GitHub and are not server-cached. The battle catalog and damage engine do not call this adapter. Unit tests cover cache failures, stale fallback, and mapped/unmapped species; they do not prove live PokéAPI availability. This behavior supports [REQ-003](requirements/requirements.md#req-003) and [REQ-009](requirements/requirements.md#req-009) without promising that every descriptive image stays reachable when its remote host fails.

