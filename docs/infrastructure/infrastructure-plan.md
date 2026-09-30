# Infrastructure plan

**Scope:** the approved first release on one owner-operated mini PC. **Status:** host foundation is partially commissioned: shared Caddy and both databases run, direct public HTTPS and private staging Serve reach Caddy, and an encrypted USB restic repository has passed a repository check. Application containers, Tailscale Funnel, full ingress security checks, and the disposable restore drill remain outstanding. This is the living plan for those components. The [operations guide](../operations.md) gives the current setup and recovery procedure; the [requirements](../requirements/requirements.md) track acceptance evidence.

## Decision basis

The owner selected Docker Compose for this single host, one shared Caddy instance, separate staging and production application/database projects, GHCR image promotion, Tailscale-assisted deployment, and encrypted USB backups. [ADR-004](../adr/ADR-004-compose-and-shared-caddy.md), [ADR-005](../adr/ADR-005-caddy-proxy-trust.md), and [ADR-006](../adr/ADR-006-immutable-release-and-recovery.md) record the alternatives, rationale, and consequences. Kubernetes adds a control plane and operating work that the current single-host requirement does not justify; the Compose choice can be revisited if scale or availability requirements change. Docker documents external networks as a way to connect separate Compose projects and notes that container IPs can change on recreation, which supports service names and controlled network membership rather than a fixed proxy container address. [Docker Compose networking](https://docs.docker.com/compose/how-tos/networking/).

The validated private course lessons **Infraestructura y cloud → Contenerización** and **DevOps y CI/CD** inform the container, registry, build-once, test, promotion, and rollback concepts. They do not prescribe this host, Compose layout, GitHub, Tailscale, or USB choice. Those are project decisions. The lesson's platform and cost descriptions are not treated as current provider facts.

## Environments and network ownership

| Environment or component | Repository configuration | Intended boundary |
| --- | --- | --- |
| Local development | `pnpm` workspace, Vite proxy, local Fastify and PostgreSQL | Developer workstation; no production credentials. |
| Shared edge | [Caddy Compose](../../infra/compose/caddy.yaml) and [Caddyfile](../../infra/caddy/Caddyfile) | One Caddy service receives direct public traffic and the two host-loopback Tailscale handoffs; it joins both dedicated app edge networks. |
| Private staging | [Staging Compose](../../infra/compose/staging.yaml) | App and PostgreSQL use staging-only runtime secrets and storage. Caddy and staging app are the only intended members of `pokemon_stage_edge` (`172.31.11.0/24`); the database stays on its internal network. |
| Public production | [Production Compose](../../infra/compose/production.yaml) | Separate app and PostgreSQL configuration and storage. Caddy and production app are the only intended members of `pokemon_prod_edge` (`172.31.12.0/24`); the database stays on its internal network. |

The single image contains the web build and API. Browsers call same-origin `/api`; runtime variables select the database, auth URL, and other environment settings. Neither Fastify nor PostgreSQL publishes a host port. Caddy publishes 80/443 for direct ingress and binds staging and Funnel handoffs to host loopback ports 18081 and 18082. Edge subnet reservations and actual Docker network membership must be checked on the mini PC; the numeric ranges in Compose are intended configuration, not proof they are conflict-free on that host.

| Browser path | Intended route | Current state |
| --- | --- | --- |
| Preferred public production | DuckDNS HTTPS → Caddy public listener → production app | DNS, certificate issuance, and external HTTPS reachability to Caddy have been observed. The current response is 502 because the production API container has not been deployed. |
| Private staging | Authorized tailnet browser → `svc:pokemon-staging` Serve HTTPS on 443 → `127.0.0.1:18081` → Caddy → staging app | The Service host is tagged and the browser reaches Caddy; the current response is 502 because the staging API container has not been deployed. Full proxy-header and application checks remain. |
| Public fallback | Browser → mini PC `*.ts.net` address with Tailscale Funnel HTTPS on 8443 → `127.0.0.1:18082` → Caddy → production app | Funnel is not configured. Port 8443 is used because Tailscale Serve and Funnel cannot use the same port on one node. |

Serve is the private tailnet path; Funnel is the public fallback. Both terminate at Caddy's dedicated loopback handoff listeners, so Caddy remains the application-facing proxy. The staging hostname differs from the production DuckDNS and Funnel hostnames to keep host-scoped cookies apart. Tailscale documents [Services](https://tailscale.com/docs/features/tailscale-services), [Serve](https://tailscale.com/docs/features/tailscale-serve), and [Funnel](https://tailscale.com/docs/features/tailscale-funnel). The current tailnet policy still has an allow-all grant; least-privilege access and the exact proxy-header trust behavior remain to be verified. See the [proxy trust ADR](../adr/ADR-005-caddy-proxy-trust.md), [security plan](../security/security-plan.md), and [ingress tests](../testing/test-strategy.md#requirement-to-check-map).

Shared Caddy is a common failure point for both environments. The one mini PC, its power and network connection, and its Docker daemon are also shared. This plan accepts those limits for the TFM; it makes no high-availability claim. Adding an app to the wrong edge network would also weaken the proxy boundary, so membership checks are part of release verification.

## Delivery and deployment authority

The intended path is feature PR → protected `staging` → successful Checks → one image build/push to GHCR → staging deployment by immutable digest → host and private-path smoke checks → recorded commit, Git tree, and digest → protected `main` with the same Git tree → production approval → deployment of that recorded digest. The [staging](../../.github/workflows/staging.yml) and [production](../../.github/workflows/production.yml) workflows encode this path. GHCR supports pulling an image by digest, avoiding a mutable tag as the release identity. [GitHub Container registry documentation](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry). GitHub environment protection can require a reviewer before a deployment job proceeds; its availability and the actual repository rules must be checked during setup. [GitHub deployment environments](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments).

GitHub-hosted deployment jobs are intended to join the tailnet temporarily using the [Tailscale GitHub Action](https://tailscale.com/docs/integrations/github/github-action), then call a restricted SSH account on the mini PC. A forced-command wrapper accepts only supported deployment operations and invokes a root-owned script. The runner does not become an app-facing proxy or connect to PostgreSQL. Tailnet ACLs, SSH key scope, host-key pinning, registry read access, repository rules, and production environment approval need real configuration and verification. The mini PC must have access to the selected GHCR package; package visibility or a host-side read-only credential remains an operator setup choice.

The [deployment script](../../infra/scripts/deploy.sh) uses the recorded digest for app service recreation and keeps the previous successful digest for an app-only rollback. Database migrations remain after rollback, so every release migration must remain compatible with the preceding image. A database or data failure needs restoration or a separate repair; image rollback alone cannot undo it. A failed staging external smoke check triggers `stage-abort` for the app, with that same migration constraint.

Application promotion does **not** update the host's checked-out Compose/Caddy files or its installed root-owned scripts. The intended `/opt/pokemon-tools` copy and `/usr/local/sbin` installations are separate host state. Before a release that changes them, an administrator must review, synchronize, and verify those files deliberately, as described in the [operations guide](../operations.md). This is a manual operational dependency of the current design, not an automated feature of the image workflow.

## Configuration, data, and recovery

Runtime values belong in root-owned host environment files, with distinct staging/production database passwords and Better Auth secrets. GitHub deployment credentials belong in encrypted repository or environment secrets; no real value goes into this public repository or the image. Caddy's `TAILSCALE_PROXY_PEER` must match the observed immediate host-side peer on the mini PC, not an assumed Docker address. Fastify's raw-peer guard and edge-CIDR proxy trust, plus Caddy's forwarded-header rewriting, are described and tested in the [security plan](../security/security-plan.md). Production's base URL must be the public address actually selected for users.

PostgreSQL has separate persistent data per environment. The [backup script](../../infra/scripts/backup.sh) and [daily systemd timer](../../infra/systemd/pokemon-backup.timer) target an encrypted restic repository on the mounted USB drive; the script also runs before production migrations and refuses to proceed if the mount is absent. Keep the repository password separate from the drive. The [restore drill](../../infra/scripts/restore-drill.sh) restores into a disposable database and checks readable data. Only a successful on-host drill establishes this local recovery gate. The attached USB drive can be lost with the mini PC; a remote or off-host copy is an explicit future improvement, with the repository destination kept configurable.

Production readiness requires a tested staging digest, working **off-host** public HTTPS ingress, a successful USB restore drill, and the approval and tree-match gates above. The [operations guide](../operations.md) explains when an administrator may create the host gate markers. A marker is a record of a completed check, not a substitute for performing it. [REQ-014 through REQ-016](../requirements/requirements.md#req-014) and the [test strategy](../testing/test-strategy.md) define the evidence to retain.

## Operations and unresolved work

Current observability is limited to application and proxy logs, health and smoke responses, workflow results, and backup/restore exit status. No metrics, alerting service, or Sentry integration has been selected or verified. During first host setup, the operator should inspect those existing signals and retain non-secret evidence of ingress, promotion, and restore checks. Monitoring and off-host backup can be reconsidered once the first release operates on the mini PC.

The known cost-bearing resources are the existing mini PC, its electricity/network connection, the USB device, and any selected account or registry plan. This document assumes no current free tier, quota, or price. Check GitHub, GHCR, and Tailscale account eligibility and current limits during service setup; no paid provider has been approved here.

| Open setup or verification item | Evidence needed before claiming it complete |
| --- | --- |
| GitHub repository, protected branches, Checks/CodeQL, deployment environments, package access | A real PR and both workflow paths exercising the configured rules. |
| Mini PC Compose and secrets | Container start, network membership, separate databases, no API/DB host ports, and correct file ownership. |
| Tailscale Serve/Funnel and proxy trust | Observed immediate peer, valid HTTPS, spoofed-header tests through every ingress path, non-edge rejection, and isolated staging/production cookies. |
| DuckDNS or Funnel public route | Successful browser request from outside the home network; record which address is the production base URL. |
| Encrypted USB backup | Snapshot, missing-mount failure, disposable restore and query, plus protected repository password. |
| Release and rollback | Matching Git tree and digest across staging/production, failed-stage abort, and app-only rollback with a compatible migration. |

Local tests and static configuration checks are listed in the [test strategy](../testing/test-strategy.md). They cannot validate the actual mini PC network, Tailscale headers, public DNS, or USB restore. No production service is claimed live. The next work remains operator-led host setup, one step at a time, after the owner's separate GitHub initialization and first commit.
