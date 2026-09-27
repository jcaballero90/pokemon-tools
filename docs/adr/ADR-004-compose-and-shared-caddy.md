# ADR-004: Deploy one application image through Compose and shared Caddy

- **Date:** 2026-09-27
- **Status:** Accepted

## Context and constraints

The first release runs on one self-hosted mini PC with private staging and public production. Both environments need separate databases and secrets, while one reverse proxy should own their application ingress. The frontend calls same-origin `/api`; the production image must be usable in either environment through runtime configuration.

## Alternatives considered

- **Kubernetes now:** offers stronger orchestration facilities but adds cluster setup and maintenance without a current multi-node or scaling requirement.
- **Separate frontend and API images:** could deploy each independently, but would introduce another deployment artifact and cross-origin or additional routing concerns for this small release.
- **A proxy bundled into each environment's app project:** easier isolation at first, but duplicates ingress configuration and complicates sharing the host's 80/443 listeners.

## Decision and rationale

Build one image containing the Vite frontend assets and Fastify API. Fastify serves the assets and `/api` internally. Use three Compose projects: shared Caddy, staging app/database, and production app/database. Caddy joins each environment's dedicated edge network; each API also joins its environment's private database network. Neither API nor PostgreSQL publishes a host port. Caddy publishes public 80/443 and separate host-loopback listeners for staging Serve and production Funnel.

Compose is proportional to the current single-host deployment. The same digest runs in staging and production with different runtime database, auth, and public URL settings. The proxy trust decision is recorded separately in [ADR-005](ADR-005-caddy-proxy-trust.md).

## Consequences

- The host has a single application-facing proxy and clear environment boundaries in configuration.
- Caddy is shared infrastructure: a proxy outage or bad reload can affect both environments, so its changes need their own checks.
- The design relies on correct Docker network membership and host-loopback publishing; those behaviors still require verification on the mini PC.
- The single image ties frontend and API releases together. Independent scaling can be reconsidered if actual use warrants it.

## Evidence and sources

- Project decision: [requirements REQ-010, REQ-012, and REQ-013](../requirements/requirements.md), the [living architecture map](../architecture/architecture.md), and the [operations guide](../operations.md).
- Implementation evidence: [Dockerfile](../../Dockerfile), [shared Caddy Compose file](../../infra/compose/caddy.yaml), [staging Compose file](../../infra/compose/staging.yaml), and [production Compose file](../../infra/compose/production.yaml).
- Course influence: the validated **Arquitectura del software → Introducción a la arquitectura de software → Criterios para comparar estilos de arquitectura** informs the proportionality trade-off. Compose, the image layout, and shared Caddy are owner-approved project choices.
