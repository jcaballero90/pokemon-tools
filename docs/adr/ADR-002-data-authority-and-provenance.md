# ADR-002: Separate battle data authority from descriptive and published data

- **Date:** 2026-09-27
- **Status:** Accepted

## Context and constraints

The type chart, statistics, set validation, and damage results need one consistent Generation 9 battle model. Pokédex presentation also benefits from sprites and descriptive metadata. Pro team sheets require a traceable source and must not imply unpublished competitive spreads. An external descriptive API can be unavailable independently of the battle utilities.

## Alternatives considered

- **Use PokéAPI for all data:** one integration would be simpler to describe, but it would make battle facts and mechanics dependent on an API selected for descriptive data and its availability.
- **Maintain a custom local battle database and calculator:** it would give full control, at the cost of building and validating a substantial mechanics dataset beyond this TFM's scope.
- **Import uncredited or inferred team details:** it could fill more fields, but readers could not distinguish published facts from guesses.

## Decision and rationale

Pin `@smogon/calc` for Generation 9 species, moves, items, abilities, type effectiveness, and damage mechanics. The current package version is `0.12.0`; dependency updates require checks for changed results. Use server-cached PokéAPI responses for descriptive details only. Map supported forms explicitly and report descriptive data unavailable when a form cannot be mapped or PokéAPI fails; never substitute its values for battle facts.

Curate a small set of pro teams manually from credited publications and linked team pastes. Preserve player, event, placement, format, date, and source information. Represent EVs or IVs absent from a cited publication as unknown. The detailed procedure and current source audit are in the [data sources and publication policy](../data-sources.md).

## Consequences

- Battle features can continue when PokéAPI is unavailable; descriptive fields may be stale or missing.
- The application must maintain form mappings and cache behavior. Pinning the calculator makes updates deliberate but requires periodic review.
- The pro team collection is small and requires human source review. Some sets remain incomplete because source detail is unavailable.

## Evidence and sources

- Project decision: [requirements REQ-003, REQ-004, REQ-008, and REQ-009](../requirements/requirements.md) and the [living architecture map](../architecture/architecture.md).
- Implementation evidence: [API dependency versions](../../apps/api/package.json), [catalog](../../apps/api/src/modules/catalog/catalog.ts), [PokéAPI adapter](../../apps/api/src/modules/catalog/pokeapi-adapter.ts), [Smogon adapter](../../apps/api/src/modules/damage/smogon-adapter.ts), and [curated teams](../../apps/api/src/modules/pro-teams/pro-teams.ts).
- The source hierarchy is a project-specific choice. [Smogon calculator documentation](https://github.com/smogon/damage-calc/blob/master/README.md) and [PokéAPI documentation](https://pokeapi.co/docs/v2) describe the external integrations; they do not establish the publication credit of individual pro teams.
