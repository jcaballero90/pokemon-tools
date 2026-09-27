# ADR-001: Use a modular monolith with pragmatic Clean boundaries

- **Date:** 2026-09-27
- **Status:** Accepted

## Context and constraints

The first release combines a small set of related Generation 9 utilities, accounts, and private teams. One developer must build, test, explain, and host it on a mini PC. The approved workspace has a React/Vite browser app, a Fastify API, and browser-safe Zod contracts in one `pnpm` monorepo. The future battle simulator is outside this release.

## Alternatives considered

- **Separate services from the start:** independent deployment boundaries could help if modules later need different scaling or ownership. They would add service communication, deployment, and failure modes without a current requirement for them.
- **A rigid Clean Architecture layer for every feature:** this could make dependency direction uniform, but simple read-only catalog operations would acquire interfaces and files with little present benefit.
- **One process with no module boundaries:** simplest initially, but it would make ownership of damage, persistence, and authentication harder to see and test as the project grows.

## Decision and rationale

Use one Fastify process organized around `catalog`, `damage`, `teams`, `pro-teams`, and `auth`. Routes translate HTTP requests into application operations. Introduce ports where an external dependency merits substitution: `TeamStore` for persistence and `DamageCalculator` for the battle calculation. Keep simple catalog reads direct. The frontend and API share browser-safe contracts and communicate through same-origin `/api`.

This is a **pragmatic** boundary choice, not a claim that the current code follows every Clean Architecture dependency rule. Team validation currently calls `damage.validateSet`, whose default path wires the Smogon adapter, and catalog reads use that library directly. Refactor those paths if they impede change or testing; the ADR does not require speculative layers.

## Consequences

- Local development and deployment have fewer moving parts, and related changes can be tested together.
- Module ownership and adapter seams support focused tests and future extraction if there is evidence for it.
- A fault or resource spike in one module can affect the whole API process. Module boundaries depend on code review rather than process isolation.
- A later simulator may warrant its own architecture decision; this ADR does not predesign it.

## Evidence and sources

- Project decision: [requirements REQ-001, REQ-010, and REQ-013](../requirements/requirements.md) and the [living architecture map](../architecture/architecture.md).
- Implementation evidence: [workspace configuration](../../pnpm-workspace.yaml), [API composition](../../apps/api/src/app.ts), [team port](../../apps/api/src/modules/teams/teams.ts), and [damage port](../../apps/api/src/modules/damage/damage.ts).
- Course influence: the validated **Arquitectura del software → Introducción a la arquitectura de software → Monolito modular** and **Aplicando Clean Architecture con TypeScript → Puertos y adaptadores** and **Estructura de carpetas de un proyecto Clean** explain the patterns and their limits. The module cuts and stack are project decisions, not course prescriptions.
