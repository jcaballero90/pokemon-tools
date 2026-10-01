# Staging and production rollout

> Status: Recorded from the repository configuration and the owner's reports on 2026-09-30. Workflow execution details are not reconstructed beyond evidence supplied in the conversation; retain the GitHub Actions runs as the authoritative logs.

## Purpose and trigger

After completing host preparation and CI deployment setup, the owner asked to promote the staging boilerplate to production and make it reachable at the public DuckDNS address. The owner subsequently reported that production worked and the page was up. This record captures the rollout path and operational configuration for the TFM. It is not a full transcript, an independent production audit, or evidence that every application acceptance criterion has passed.

## Inputs and roles

- **Owner:** prepared the mini PC, Tailscale network policy, GitHub environment values, host configuration and secrets; ran commands and reviewed results; reported successful staging and production workflows and public availability.
- **Codex:** inspected the checked-in Actions workflows and deployment scripts, guided host and GitHub setup, diagnosed Caddy/Docker networking and DNS issues from pasted command output, and updated documentation from the reported result.
- **Repository evidence:** [`staging.yml`](../../../../.github/workflows/staging.yml), [`production.yml`](../../../../.github/workflows/production.yml), [`deploy.sh`](../../../../infra/scripts/deploy.sh), [`deploy-ssh.sh`](../../../../infra/scripts/deploy-ssh.sh), and the Compose/Caddy files define the automation. Conversation-provided terminal output is evidence of individual host steps; the latest GitHub run logs remain the source for exact run IDs, SHAs, and conclusions.

## Host preparation and debugging recorded

The mini PC runs Ubuntu 24.04.4 with Docker Compose 5.1.1 and Tailscale 1.102.4. The administrator-reviewed repository copy is at `/opt/pokemon-tools`; privileged deploy, SSH wrapper, backup, and restore-drill scripts were installed under `/usr/local/sbin`. Root-only deployment state and root-owned runtime environment files are kept on the host. Caddy runs with UID/GID `1003:1003` to match the `utilities` account's file ownership needs.

The host has separate staging and production PostgreSQL services, shared Caddy, and dedicated app edge networks. Caddy publishes public ports 80/443 and loopback-only Tailscale handoff ports 18081/18082. When staging first returned 502, the API logs showed Docker's embedded DNS could not resolve the recreated API service. The owner refreshed Docker's resolver configuration after restoring host DNS resolution, and Caddy was attached to the staging edge network declared in Compose. The user later confirmed staging deployment worked. This debugging history is useful operational context; it does not imply the same DNS problem will recur.

The owner configured `svc:pokemon-staging` for HTTPS Serve on port 443, targeting Caddy at `127.0.0.1:18081`. The initial tailnet ACL allowed all traffic; the owner replaced it with grants for administrators and `tag:ci` to access the host over SSH and the staging Service over TCP 443, then reported that it continued to work. The production public path uses DuckDNS HTTPS → Caddy → production API. Funnel on 8443 remains an optional fallback and was not reported enabled.

The USB drive is mounted at `/mnt/pokemon-backup`; an encrypted restic repository was initialized and checked. The owner ran a staging backup and the disposable restore drill, which restored the snapshot and completed without reported errors. This is local recovery on storage attached to the same host, not an off-host backup.

## CI/CD configuration and behavior

The `staging` and `production` GitHub Actions environments supply their deployment configuration. Both deployment jobs read encrypted secrets named `TS_OAUTH_CLIENT_ID`, `TS_OAUTH_SECRET`, `DEPLOY_SSH_KEY`, and `DEPLOY_KNOWN_HOSTS`. Both read `DEPLOY_TARGET`; staging also reads `STAGING_URL`. This workflow record intentionally omits values. The owner stated that the four secrets had been created in the production environment; staging needs its own environment-scoped copies of those secrets. Verify each scope and variable in GitHub **Settings → Environments**.

The workflows run after successful push-triggered `Checks` on their respective branches:

1. The staging workflow checks that its triggering SHA remains the head of `staging`, builds and pushes one container image to GHCR, joins the tailnet with the `tag:ci` identity, and asks the forced-command SSH account to deploy the immutable digest.
2. Staging applies migrations and tests health, catalog, pro-team data, generated OpenAPI, and a damage request through the private staging URL. On success the host records the tested commit, Git tree, and image digest. A failed smoke check calls `stage-abort` to restore the prior application image; it does not undo migrations.
3. The production workflow runs after successful Checks on `main`, confirms the triggering SHA is still main's head, connects to the host with the restricted SSH account, compares main's Git tree with the tree recorded by staging, and deploys the recorded digest. It does not build a second image.
4. Both workflows use GitHub Environments. A required-reviewer pause is applied only when a reviewer rule is enabled in environment settings; the YAML reference to `production` does not itself impose approval. The owner wanted a production approval gate, but the final reviewer and branch-rule settings were not shown in the evidence available for this record.

The owner reported that staging and production workflow runs completed successfully and that the production page is live at [`https://jcrserver.duckdns.org`](https://jcrserver.duckdns.org). This supports deployment and reachability at the time reported. It does not establish the exact release SHA, Actions run identifiers, configured reviewer rule, full browser behavior, or all security acceptance checks. Preserve the corresponding Actions run pages as primary execution evidence.

## Documentation changes

The [root README](../../../../README.md), [operations guide](../../../operations.md), and [infrastructure plan](../../../infrastructure/infrastructure-plan.md) were updated to reflect the live production report, staging-to-production digest flow, GitHub environment configuration, host DNS/network debugging, backup/restore evidence, and remaining verification. Secret values were not copied into the repository. Older records retain their historical as-of dates and findings; they are not rewritten as if they had been current at the time.

## Verification still open

- Confirm GitHub's `staging` and `production` environment secrets/variables, production required reviewers, allowed deployment branches, and repository branch protections directly in settings.
- Save links or run IDs for successful Checks, staging deployment, and production promotion; record the promoted image digest and Git tree if they are needed in the final TFM evidence.
- Exercise direct and Tailscale ingress with spoofed forwarding headers, verify host/network membership and no API/database host ports, and inspect deployed cookie/security headers.
- Run full Playwright journeys, database-backed account and cross-account checks, email flows if SMTP is enabled, and an app-only rollback drill.
- Keep off-host backups and Funnel as explicit optional follow-up items unless the owner chooses to configure them.

## Limits and human review

This record uses user-reported deployment success where exact run output was not pasted into this task. It does not claim that a black/blank health endpoint is the product UI: `/api/health` is an API route, while the public root URL serves the web page. A working public page is a meaningful deployment check but is not equivalent to product acceptance, a security audit, or high availability. The owner should correct any operational details that differ from the actual host or GitHub settings.
