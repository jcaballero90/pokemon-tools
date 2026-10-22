[![English](https://img.shields.io/badge/lang-en-red.svg)](ADR-002-data-authority-and-provenance.md) [![Español](https://img.shields.io/badge/lang-es-yellow.svg)](ADR-002-data-authority-and-provenance.es.md)

# ADR-002: Separate battle and descriptive data sources

- **Date:** 2026-09-27
- **Status:** Accepted

## Context and constraints

The type chart, statistics, set validation, and damage results need one consistent Generation 9 battle model. Pokédex presentation also benefits from sprites and descriptive metadata. An external descriptive API can be unavailable independently of the battle utilities.

## Alternatives considered

- **Use PokéAPI for all data:** one integration would be simpler to describe, but it would make battle facts and mechanics dependent on an API selected for descriptive data and its availability.
- **Maintain a custom local battle database and calculator:** it would give full control, at the cost of building and validating a substantial mechanics dataset beyond this TFM's scope.

## Decision and rationale

Pin `@smogon/calc` for Generation 9 species, moves, items, abilities, type effectiveness, and damage mechanics. The current package version is `0.12.0`; dependency updates require checks for changed results. Use server-cached PokéAPI responses for descriptive details only. Map supported forms explicitly and report descriptive data unavailable when a form cannot be mapped or PokéAPI fails; never substitute its values for battle facts.


## Consequences

- Battle features can continue when PokéAPI is unavailable; descriptive fields may be stale or missing.
- The application must maintain form mappings and cache behavior. Pinning the calculator makes updates deliberate but requires periodic review.

## Evidence and sources

- Project decision: [requirements REQ-003, REQ-004, and REQ-009](../requirements/requirements.md) and the [living architecture map](../architecture/architecture.md).
- Implementation evidence: [API dependency versions](../../apps/api/package.json), [catalog](../../apps/api/src/modules/catalog/catalog.ts), [PokéAPI adapter](../../apps/api/src/modules/catalog/pokeapi-adapter.ts), and [Smogon adapter](../../apps/api/src/modules/damage/smogon-adapter.ts).
- The source hierarchy is a project-specific choice. [Smogon calculator documentation](https://github.com/smogon/damage-calc/blob/master/README.md) and [PokéAPI documentation](https://pokeapi.co/docs/v2) describe the external integrations.
