# Mini PC operations and release gates

This is a setup guide for the mini PC. The files in this repository do not themselves create GitHub, DuckDNS, Tailscale, router, USB, or SSH resources. Keep all secrets in root-owned files on the server and GitHub encrypted secrets; never commit them.

## 1. Host preparation

Install Docker Engine with Compose v2, Tailscale, restic, OpenSSH, curl, and a mounted USB drive on the mini PC. Put an administrator-reviewed copy of this repository at `/opt/pokemon-tools`. Install `infra/scripts/deploy.sh` as root-owned `/usr/local/sbin/pokemon-deploy`, `deploy-ssh.sh` as `/usr/local/sbin/pokemon-deploy-ssh`, `backup.sh` as `/usr/local/sbin/pokemon-backup`, and `restore-drill.sh` as `/usr/local/sbin/pokemon-restore-drill`. Reinstall these files deliberately when infrastructure code changes; the application image promotion does not update host scripts.

Create the two external edge networks before starting Compose:

```sh
docker network create --subnet 172.31.11.0/24 --gateway 172.31.11.1 pokemon_stage_edge
docker network create --subnet 172.31.12.0/24 --gateway 172.31.12.1 pokemon_prod_edge
```

Reserve these subnets for this stack and check for conflicts with existing Docker, LAN, and tailnet routes. Only Caddy and the matching API service may join each edge network. The database networks are Compose-private. The API service has no host port.

Create `/opt/pokemon-tools/infra/secrets/staging.env` and `production.env`, mode `0600`, owner root. Both need `DB_PASSWORD`, a URL-encoded `DATABASE_URL` for the matching database, and a distinct 32+ character `BETTER_AUTH_SECRET`. Staging also needs `STAGING_BASE_URL=https://pokemon-staging.<tailnet>.ts.net` and `STAGING_HOST=pokemon-staging.<tailnet>.ts.net`. Production needs `PUBLIC_HOST=<DuckDNS-host>`, `FUNNEL_BASE_URL=https://<mini-pc>.<tailnet>.ts.net`, and `PUBLIC_BASE_URL` set to the working primary public address: DuckDNS when direct ingress works, otherwise Funnel. Optional `SMTP_URL` and `EMAIL_FROM` enable email verification and password reset. Set `DB_PASSWORD` to the exact database password; percent-encode reserved characters in `DATABASE_URL`.

Create `caddy.env` with `PUBLIC_HOST`, `STAGING_HOST`, `FUNNEL_HOST`, `ACME_EMAIL`, and `TAILSCALE_PROXY_PEER`. The last value must be the exact host-side Docker gateway address observed by Caddy for loopback-published Tailscale requests, ordinarily `172.31.10.1`; never use a whole private subnet as the trusted peer. Test it on the actual Docker host before release. Start shared Caddy with:

```sh
docker compose --env-file infra/secrets/caddy.env -f infra/compose/caddy.yaml up -d
```

The DuckDNS record currently does not resolve from mobile data according to the owner's check. Repair the record, router forwarding for 80/443, and certificate issuance before marking direct public ingress ready. If ISP/CGNAT prevents direct ingress, use the Funnel fallback. Keep Caddy as the application-facing proxy in both cases.

## 2. Tailnet paths and proxy validation

Create a Tailscale Service named `svc:pokemon-staging`, advertise it from the mini PC, and configure Serve HTTPS to target `http://127.0.0.1:18081`. The service must yield a hostname distinct from production. Configure Funnel HTTPS for the mini PC's public `*.ts.net` name to target `http://127.0.0.1:18082`. Confirm the final commands against the installed Tailscale version; the expected shapes are:

```sh
tailscale serve --service=svc:pokemon-staging --https=443 http://127.0.0.1:18081
tailscale funnel --bg http://127.0.0.1:18082
```

Tailnet ACLs should permit the CI tag to reach only the deployment SSH target and staging service. Funnel is public; Serve is private to authorized tailnet users. Caddy's Tailscale listeners are published only on the host loopback. Caddy accepts forwarded client IPs only from the verified local proxy peer on those listeners, overwrites `X-Forwarded-For`, `X-Real-IP`, `X-Forwarded-Host`, and `X-Forwarded-Proto` sent to Fastify, and strips unused Tailscale identity headers. The direct public listener overwrites the same forwarded headers from its direct peer. Fastify checks the **raw socket peer** before auth and trusts proxy information only from its environment's edge CIDR. Better Auth reads only Caddy's sanitized `X-Real-IP` and has explicit origins.

Before enabling production, test all three browser paths with normal and spoofed `X-Forwarded-For`, `X-Real-IP`, `X-Forwarded-Host`, and `X-Forwarded-Proto`. In private staging, `/api/ingress-debug` reports Fastify's raw peer, effective client IP, scheme, and host. Verify the client IP remains the actual remote client after spoofing and that the scheme is HTTPS. Use a temporary container attached only to a non-edge network to confirm direct API requests receive 403; verify `docker ps` shows no host-published Fastify port. Check separate cookie jars for staging and production/Funnel. Production's debug route is disabled. Inspect Caddy and Fastify logs for production path checks. If Docker forwards loopback-published requests with a peer other than `TAILSCALE_PROXY_PEER`, correct the exact peer and repeat these tests; never weaken the guard to trust arbitrary private ranges.

## 3. GitHub and promotion

Initialize and push the repository to GitHub. Protect `staging` and `main`: require Checks and CodeQL, PR reviews as desired, and prevent bypass for direct pushes. Set the `production` environment to require owner approval. Enable Actions, code scanning, and Dependabot. GHCR must be readable by the mini PC: publish the package or provision a root-owned read-only registry credential on the host.

Configure GitHub encrypted secrets `TS_OAUTH_CLIENT_ID`, `TS_OAUTH_SECRET`, `DEPLOY_SSH_KEY`, and `DEPLOY_KNOWN_HOSTS`, plus variables `DEPLOY_TARGET` (restricted SSH user and tailnet host) and `STAGING_URL` (private service HTTPS URL). Tailscale's OAuth client needs an ephemeral `tag:ci` auth key scope and ACLs restricted to deployment targets.

Configure the server's deploy SSH account with a forced command `/usr/local/sbin/pokemon-deploy-ssh`, no PTY/port forwarding, and sudoers permission only for `/usr/local/sbin/pokemon-deploy` with validated commands. The root-owned deploy script accepts only GHCR sha256 digests and full Git SHAs. The image is built once after successful staging Checks, deployed by digest, smoke-tested through Caddy and through the private service, and then recorded as tested with commit and Git tree. If the private service checks fail, CI invokes `stage-abort` to restore the preceding app image; database migrations remain in place and therefore must be backward compatible. After successful main Checks and GitHub production approval, the workflow compares the main Git tree with the recorded staging tree and deploys that exact digest. No production build runs.

For a requested rollback, an administrator runs `sudo /usr/local/sbin/pokemon-deploy rollback production` or `rollback staging`. This recreates only the app service with the previous successful image. It does not roll back data. Every migration shipped with a release must remain compatible with the immediately previous image.

## 4. USB backup and restore gate

Mount the USB drive at a stable path, for example `/mnt/pokemon-backup`, and create `infra/secrets/backup.env` with `USB_MOUNT`, `RESTIC_REPOSITORY` located beneath that mount, and `RESTIC_PASSWORD_FILE` pointing to a root-only password file. The repository path is configurable for a future move or remote copy. Install and enable `infra/systemd/pokemon-backup.timer`, adjusting `RequiresMountsFor` if the mount differs. The backup script stops if the USB mount is absent; it does not silently write to the root filesystem. It creates an encrypted restic snapshot daily and before production migrations. Store the restic password separately from the USB device.

After staging has data, run a staging backup, then `sudo /usr/local/sbin/pokemon-restore-drill staging`. This restores the latest snapshot into a disposable database, queries a table, drops that database, and writes the USB restore gate marker. A successful restore from the attached USB demonstrates local recovery only. Keep an off-host copy as a future improvement.

Only after testing working public ingress from outside the home network should an administrator create `/var/lib/pokemon-deploy/public-ingress.passed`. The production deploy script requires that marker, the restore drill marker, a tested staging tree, and the approved GitHub environment. Recheck public ingress and repeat the restore drill before the first release and after changes to networking or backup storage.

## 5. Limits of workstation verification

`pnpm build`, type checks, lint, unit/API composition tests, and YAML/network static checks run locally. This Windows workstation currently has no Docker daemon, PostgreSQL, Caddy, or mini PC access, so Compose behavior, Caddy parsing, live Tailscale headers, real email delivery, database account journeys, Playwright browser journeys, encrypted USB restore, and public ingress require execution on CI and the actual host. Do not mark production live until those gates pass.
