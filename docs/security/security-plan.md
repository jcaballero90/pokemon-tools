# Security plan

**Scope:** the approved first release and its staging/production deployment. **Purpose:** identify the assets, trust boundaries, material risks, current controls, and evidence needed before public release. This is a living design record, not a security audit or a statement that the mini PC is ready. The [requirements](../requirements/requirements.md) remain the authoritative implementation tracker, especially REQ-006, REQ-007, REQ-011, REQ-012, REQ-014, REQ-016, and REQ-017.

## Assets, users, and boundaries

Account email addresses, password credentials managed by Better Auth, session tokens, private teams, database dumps, deployment credentials, and runtime secrets need protection. Guest drafts remain in the browser's `localStorage` and are accessible to scripts running on that origin. Public battle and pro-team data do not require account access, but availability and source integrity matter.

| Boundary | Expected access and authority |
| --- | --- |
| Browser → Caddy → Fastify | Guests can use public utilities. Account holders can manage only their own saved teams. Caddy is the application-facing proxy on direct HTTPS, private Serve, and public Funnel paths. |
| Fastify → PostgreSQL | Only the matching environment's API and database share its internal database network. Staging and production use different databases and secrets. |
| Fastify → PokéAPI | The server requests a fixed PokéAPI endpoint for a known species or curated form mapping. Descriptive data cannot override pinned battle data. |
| GitHub Actions → mini PC | A temporary tailnet connection and restricted SSH command may invoke the root-owned deployment script. This is a privileged release path, not an application user path. |
| Mini PC → USB repository | Root-run scripts create encrypted restic backups and run a disposable restore drill. The USB device and repository password must be protected separately. |

The mini PC, Docker daemon, shared Caddy, GitHub repository, tailnet policy, and host administrator are trusted operational components. A compromise of any of them can bypass application-level controls. The [architecture map](../architecture/architecture.md), [ADR-005](../adr/ADR-005-caddy-proxy-trust.md), [ADR-006](../adr/ADR-006-immutable-release-and-recovery.md), and [operations guide](../operations.md) define their intended relationships and host procedure.

## Risks, controls, and proof needed

### Account access and team ownership

An unauthenticated caller must not read or change private teams; changing an object ID must not expose another account's team. The API obtains a Better Auth session for each private route and the Prisma team adapter filters list and delete operations by `ownerId`. The UI hiding a control is not an authorization boundary. The local API composition test checks that an anonymous list request returns 401; **database-backed cross-account tests have not run**. Before release, create two accounts, save distinct teams, attempt cross-account reads and deletes, and verify denial and retained data. See [auth setup](../../apps/api/src/modules/auth/auth.ts), [team routes](../../apps/api/src/app.ts), and [owner-scoped adapter](../../apps/api/src/modules/teams/prisma-adapter.ts).

### Cookies, CSRF, and browser content

Production configuration requires an HTTPS base URL and requests secure Better Auth cookies. Better Auth's current [security documentation](https://better-auth.com/docs/reference/security) describes `HttpOnly` and `SameSite=Lax` session cookies and origin checks for **its auth routes**. Those library defaults must be confirmed in actual staging and production `Set-Cookie` responses, including `Secure`, `HttpOnly`, `SameSite`, host/domain, path, and logout behavior. The separate staging hostname is necessary for cookie isolation when production uses Funnel.

The project-owned `POST /api/me/teams` and `DELETE /api/me/teams/:id` handlers check the session and validate input, but currently have **no explicit Origin or CSRF check**. Better Auth's auth-route protection does not establish protection for these handlers. [OWASP's CSRF guidance](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html) treats `SameSite` as a supporting layer because same-site contexts and browser behavior can still matter. Before public release, select and implement an explicit check for these mutations, such as trusted-origin validation or a CSRF token, and test allowed same-origin requests alongside foreign-origin and missing-origin requests. That choice is **proposed**, not yet an accepted implementation decision; its handling of non-browser clients must be deliberate.

React renders current team text through ordinary JSX; the repository has no `dangerouslySetInnerHTML` use. Helmet is registered in Fastify. These facts reduce common script-injection paths but do not prove a complete XSS or CSP policy. Inspect deployed security headers and test that saved names/notes and PokéAPI-derived text render as text. If rich HTML is ever introduced, reassess sanitization before enabling it. See [web rendering](../../apps/web/src/main.tsx) and [API composition](../../apps/api/src/app.ts).

### Proxy identity and network isolation

Spoofed forwarding headers could distort client IP rate limits, HTTPS detection, or auth behavior. Caddy's public listener overwrites forwarding headers. Its Tailscale-facing listeners are configured to accept a client address only from the configured immediate peer and then rewrite the headers sent to Fastify. Fastify checks the raw socket peer against the environment's dedicated edge CIDR before Better Auth runs; `trustProxy` uses that CIDR. Better Auth reads only Caddy's `X-Real-IP`. Neither API nor database publishes a host port. These are [configured controls](../../infra/caddy/Caddyfile), not proof of deployed behavior.

On the mini PC, verify the immediate Tailscale peer, Docker network membership, loopback-only Caddy ports, and absence of a Fastify host port. Send spoofed client IP, host, and scheme headers through direct HTTPS, Serve, and Funnel. Check Fastify's resulting address and HTTPS scheme; a container outside the edge network must receive 403. Inspect separate staging and production cookie jars. A container accidentally added to an edge network would fall inside the trusted CIDR, so membership remains an operational control. The exact commands and gate are in the [operations guide](../operations.md).

### Input, abuse, and dependency integrity

Shared Zod schemas bound team and damage fields, and the server additionally checks known Generation 9 names. Prisma uses structured queries for private teams. Fastify registers Helmet and a general 120 requests/minute rate limit; Better Auth configures its own 100 requests/minute limit. The project pins `@fastify/rate-limit` at 11.2.0, the first patched version named in the [maintainer's advisory](https://github.com/fastify/fastify-rate-limit/security/advisories/GHSA-grpc-p53c-r64v). These limits control some abuse but cannot by themselves prevent account attacks or guarantee availability on a small host.

Before release, exercise malformed and oversized team and damage inputs, unknown names, repeated login attempts, and repeated public API calls. Confirm 400/429 responses and that buckets use the actual client address on all ingress paths, including IPv6. Check that the generated OpenAPI descriptions match request and response behavior. `@smogon/calc` and other dependencies are version-pinned; GitHub Checks, CodeQL, and Dependabot are configured but have not executed in the owner's GitHub repository yet. Review dependency alerts and image updates before promotion. See [contracts](../../packages/contracts/src/index.ts), [API dependencies](../../apps/api/package.json), and [workflow configuration](../../.github/workflows/checks.yml).

### Secrets, release authority, and recoverability

The API parses required runtime values before listening and requires an HTTPS public base URL and edge CIDR in production mode. `.env` files are ignored by Git; the host procedure requires root-owned environment files, distinct staging/production auth secrets, restricted SSH, and GitHub encrypted secrets. No real credentials belong in repository examples, logs, URLs, or browser-visible Vite variables. Check file ownership and permissions on the host, GitHub environment approval and branch protection, registry read access, and log output during a deployment. The current [forced-command wrapper](../../infra/scripts/deploy-ssh.sh) and [deployment script](../../infra/scripts/deploy.sh) are configured but untested on the host.

An image rollback does not restore lost or incompatible data. The backup script refuses an absent USB mount and writes encrypted restic snapshots; the restore script loads a snapshot into a disposable database and queries it. A working external public path and successful restore drill are production gates. Run both before enabling the first release and after relevant host changes. The USB repository is local recovery: loss or compromise of the mini PC and attached drive can affect both the database and backup; an off-host copy remains a future improvement. See the [backup script](../../infra/scripts/backup.sh), [restore drill](../../infra/scripts/restore-drill.sh), and [ADR-006](../adr/ADR-006-immutable-release-and-recovery.md).

## Open decisions and residual risks

- **Own-route CSRF defense:** choose and implement the explicit mutation check described above, then test it. This plan recommends treating it as a public-release gate.
- **Email verification policy:** [REQ-006](../requirements/requirements.md#req-006) leaves the first-release requirement open. The current Better Auth configuration requires verification only when SMTP is configured. Decide the public policy and verify real email delivery before relying on verification or password reset.
- **Host verification:** Caddy parsing, exact proxy peer, Serve/Funnel behavior, cookies, deployed headers, cross-account authorization, CI checks, USB restoration, and public ingress remain unverified. Configuration alone does not close these risks.
- **Shared host exposure:** Caddy, Docker, the API, database, deployment credentials, and USB backups reside on one mini PC. Hardening and an off-host backup would reduce the impact of host compromise or loss, but neither is asserted complete here.

## Source and decision traceability

The validated course documents **Calidad → Seguridad + ENV + OWASP Top 10 → Variables de entorno y secretos seguros**, **Fundamentos de seguridad web**, and **Autenticación y autorización con tokens** inform environment validation, layered browser defenses, and the separation of authentication from authorization. **Seguridad → Introducción al desarrollo seguro → Modelos de amenazas actuales** informs this scoped risk analysis; **Seguridad → OWASP Top 10 → Broken Access Control** and **Security Misconfiguration** inform the ownership and deployment checks. These lessons do not prescribe this project's stack or certify its controls. The controls in this plan come from the owner's approved release design, observed repository configuration, and the explicitly labelled CSRF recommendation. Detailed acceptance and deployment instructions stay in the [requirements](../requirements/requirements.md) and [operations guide](../operations.md).
