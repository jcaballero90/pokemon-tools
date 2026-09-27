# ADR-005: Trust forwarding only through the controlled Caddy path

- **Date:** 2026-09-27
- **Status:** Accepted

## Context and constraints

Production should use direct DuckDNS HTTPS when repaired, with Tailscale Funnel as a public fallback. Private staging uses a distinct Tailscale Service with Serve HTTPS. All paths must reach Caddy before Fastify. Browser-supplied forwarding headers must not determine client identity, host, or scheme. Docker may assign a new container address when a service is recreated.

## Alternatives considered

- **Expose Fastify through Serve or Funnel directly:** fewer proxy steps, but bypasses the shared application-facing header policy and ingress boundary.
- **Trust a fixed Caddy container IP:** narrow in appearance, but brittle across container recreation.
- **Trust all proxies or a hop count:** simpler configuration, but would accept information outside the verified proxy path if network topology changes.

## Decision and rationale

Keep Caddy in front of Fastify on all public and tailnet paths. The direct public listener overwrites incoming forwarding headers. The two host-loopback Caddy listeners accept Tailscale's forwarded client address only from the configured immediate peer, then overwrite client IP, host, and HTTPS forwarding headers before proxying. Unused Tailscale identity headers are removed.

Only Caddy and the matching API may join each dedicated edge network. Before Better Auth handles a request, Fastify checks the **raw socket peer** against that environment's edge subnet and rejects a non-edge peer. Fastify's `trustProxy` function trusts only that CIDR. Better Auth uses the single Caddy-written `X-Real-IP` header, an explicit HTTPS base URL, and trusted origins. Better Auth's header setting does not enforce the socket boundary itself. The policy depends on controlled network membership and subnet configuration, not a stable Caddy container IP.

## Consequences

- The trust chain is explicit and resilient to a changed Caddy container address within its assigned subnet.
- A mistakenly attached container on the edge network could fall within Fastify's trusted CIDR; restricting membership and inspecting the deployed networks are necessary controls.
- The exact Tailscale-to-Caddy peer and forwarded-header behavior depend on the host. Spoofing, host, scheme, cookie, and non-edge rejection tests are release checks, not assumed successes.
- Staging needs its own hostname because cookies are scoped by host, not port.

## Evidence and sources

- Project decision: [requirements REQ-011 and REQ-012](../requirements/requirements.md), the [living architecture map](../architecture/architecture.md), and the [host verification procedure](../operations.md).
- Implementation evidence: [Caddyfile](../../infra/caddy/Caddyfile), [Compose networks](../../infra/compose/caddy.yaml), [Fastify guard](../../apps/api/src/app.ts), [CIDR matcher](../../apps/api/src/ingress.ts), and [Better Auth configuration](../../apps/api/src/modules/auth/auth.ts).
- External guidance: [Fastify proxy trust options](https://fastify.dev/docs/latest/Reference/Server/) and [Caddy trusted proxy configuration](https://caddyserver.com/docs/caddyfile/options). The combined trust policy is the project's decision; the mini PC path remains unverified.
