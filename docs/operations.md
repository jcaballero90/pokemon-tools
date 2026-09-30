# Mini PC operations and release gates

This is a setup guide for the mini PC. The files in this repository do not themselves create GitHub, DuckDNS, Tailscale, router, USB, or SSH resources. Keep all secrets in root-owned files on the server and GitHub encrypted secrets; never commit them.

## Current host progress (2026-09-29)

The mini PC is running Ubuntu 24.04.4, Docker Compose 5.1.1, and Tailscale 1.102.4. The reviewed repository is at `/opt/pokemon-tools`; the root-owned host scripts and `/var/lib/pokemon-deploy` state directory have been installed. The external staging and production edge networks exist.

Shared Caddy is running as UID/GID `1003:1003`. Its public listeners are host ports 80 and 443; the Tailscale handoff listeners are loopback-only at `127.0.0.1:18081` (staging) and `127.0.0.1:18082` (production Funnel). The staging and production PostgreSQL containers have both reported healthy. Only the database services have been started; neither application API container has been deployed yet.

The USB backup mount and encrypted restic repository are set up. A backup service run completed successfully and `restic check` reported no errors. A disposable restore drill has not yet been completed.

The Tailscale host has `tag:pokemon-host`. The `svc:pokemon-staging` Service is configured for `tcp:443`, and its HTTPS Serve proxy targets `http://127.0.0.1:18081`. A tailnet browser request reached Caddy and returned 502 because `pokemon-staging-api` is not running. Direct DuckDNS HTTPS also reaches Caddy and returns 502 because `pokemon-prod-api` is not running. These responses verify ingress to Caddy, not application readiness.

Tailscale Funnel is not configured yet. Because private staging Serve uses HTTPS port 443 on this Tailscale node, the public production Funnel must use port 8443; update `FUNNEL_BASE_URL` to include `:8443` before enabling Funnel. The production app, CI deployment path, full proxy-header checks, restore drill, and production release gates remain outstanding. The current tailnet policy still has an allow-all grant; replace it with least-privilege grants before adding CI access.

## 1. Host preparation

Install Docker Engine with the current Compose plugin (`docker compose`), Tailscale, restic, the OpenSSH server, curl, and a mounted USB drive on the mini PC. Put an administrator-reviewed copy of this repository at `/opt/pokemon-tools`. Keep that host copy and the installed scripts controlled by the administrator, because privileged deployment reads its Compose definitions and sources its environment files. Preserve LF line endings in shell scripts and environment files.

From that reviewed host copy, install executable root-owned commands and create the private release-state directory:

```sh
cd /opt/pokemon-tools
sudo install -o root -g root -m 0755 infra/scripts/deploy.sh /usr/local/sbin/pokemon-deploy
sudo install -o root -g root -m 0755 infra/scripts/deploy-ssh.sh /usr/local/sbin/pokemon-deploy-ssh
sudo install -o root -g root -m 0755 infra/scripts/backup.sh /usr/local/sbin/pokemon-backup
sudo install -o root -g root -m 0755 infra/scripts/restore-drill.sh /usr/local/sbin/pokemon-restore-drill
sudo install -d -o root -g root -m 0700 /var/lib/pokemon-deploy
```

`install` copies each script, gives it execute permission, and sets its owner; it does not deploy an application or run a backup. Reinstall these files deliberately when infrastructure code changes; the application image promotion does not update host scripts. Production deployment invokes the installed `/usr/local/sbin/pokemon-backup` before migrations when its database container already exists. Host script ownership is separate from Caddy's container UID/GID, configured below.

Create the two external edge networks before starting Compose:

```sh
docker network create --subnet 172.31.11.0/24 --gateway 172.31.11.1 pokemon_stage_edge
docker network create --subnet 172.31.12.0/24 --gateway 172.31.12.1 pokemon_prod_edge
```

Reserve these subnets for this stack and check for conflicts with existing Docker, LAN, and tailnet routes. Only Caddy and the matching API service may join each edge network. The database networks are Compose-private. The API service has no host port.

Copy [`infra/secrets/staging.env.example`](../infra/secrets/staging.env.example) and [`production.env.example`](../infra/secrets/production.env.example) to `/opt/pokemon-tools/infra/secrets/staging.env` and `production.env`, mode `0600`, owner root. Replace all placeholders before use and preserve already configured files when repeating setup. Both need `DB_PASSWORD`, a URL-encoded `DATABASE_URL` for the matching database, and a distinct 32+ character `BETTER_AUTH_SECRET`. Staging also needs `STAGING_BASE_URL=https://pokemon-staging.<tailnet>.ts.net` and `STAGING_HOST=pokemon-staging.<tailnet>.ts.net`. Production needs `PUBLIC_HOST=<DuckDNS-host>`, `FUNNEL_BASE_URL=https://<mini-pc>.<tailnet>.ts.net:8443`, and `PUBLIC_BASE_URL` set to the working primary public address: DuckDNS when direct ingress works, otherwise Funnel. Optional `SMTP_URL` and `EMAIL_FROM` enable email verification and password reset. Set `DB_PASSWORD` to the exact database password; percent-encode reserved characters in `DATABASE_URL`. The deployment script also sources these files as Bash, so keep literal `KEY='value'` assignments without variable references. Choose the database passwords before the volumes are initialized.

Copy [`infra/secrets/caddy.env.example`](../infra/secrets/caddy.env.example) to root-owned `caddy.env`, mode `0600`. Set `CADDY_UID=1003` and `CADDY_GID=1003` to match the mini PC's `utilities` account, and fill in `PUBLIC_HOST`, `STAGING_HOST`, `FUNNEL_HOST`, `ACME_EMAIL`, and `TAILSCALE_PROXY_PEER`. The last value must be the exact host-side Docker gateway address observed by Caddy for loopback-published Tailscale requests, ordinarily `172.31.10.1`; never use a whole private subnet as the trusted peer. Test it on the actual Docker host before release.

Compose explicitly runs the Caddy process as the configured UID/GID. Docker on the mini PC uses the system daemon; the `utilities` account's Docker group membership permits CLI access. The environment file remains root-owned: Compose reads it and passes its values into Caddy. Keep `infra/caddy/Caddyfile` readable by UID 1003, for example root-owned with mode `0644`, and keep the parent directories traversable. The bind mount is read-only and refuses to create a directory if the source file is missing ([Compose mount reference](https://docs.docker.com/reference/compose-file/services/#volumes)).

The current official Caddy image permits a non-root process to write to `/data/caddy` and `/config/caddy` and bind its HTTP/HTTPS ports ([image Dockerfile](https://github.com/caddyserver/caddy-docker/blob/fba2853501d36e8a72f946ac8cb7ff64d07e48f2/2.11/alpine/Dockerfile)). Fresh named volumes inherit the image contents, so first startup should not need a manual ownership change. Existing volumes from a previous root-run Caddy may need an ownership adjustment of the affected Caddy data while stopped; preserve the certificates and leave Docker's storage directory ownership unchanged. Start shared Caddy from `/opt/pokemon-tools` with:

```sh
sudo docker compose --env-file infra/secrets/caddy.env -f infra/compose/caddy.yaml up -d
```

For host preparation before staging CI builds the first application image, start only the databases. Compose still interpolates the required API image variable, so these commands supply a temporary parsing placeholder ([Docker interpolation reference](https://docs.docker.com/compose/how-tos/environment-variables/variable-interpolation/)):

```sh
sudo env IMAGE_DIGEST=pokemon-tools-bootstrap:db-only docker compose --env-file infra/secrets/staging.env -f infra/compose/staging.yaml up -d db
sudo env IMAGE_DIGEST=pokemon-tools-bootstrap:db-only docker compose --env-file infra/secrets/production.env -f infra/compose/production.yaml up -d db
```

The selected `db` service has no API dependency, so these commands start PostgreSQL only. Keep the placeholder out of the environment files and use it only with `up -d db`. Full application deployment uses a real GHCR digest exported by `pokemon-deploy`. Caddy can run at this point, but application routes will fail until their API containers are deployed.

The DuckDNS hostname now resolves and Caddy has obtained a valid certificate. A browser request from outside the host's LAN reached Caddy over HTTPS and returned 502 while the production API container was absent. Direct DNS/TLS ingress is therefore responding, but production application health is not verified. Keep router forwarding for 80/443 directed to the mini PC so Caddy can renew its certificate and serve the public route. If direct ingress becomes unavailable, use the Tailscale Funnel fallback described below; keep Caddy as the application-facing proxy in both cases.

## 2. Tailnet paths and proxy validation

### Private staging with Tailscale Serve

Define `tag:pokemon-host` in the tailnet policy's `tagOwners` section and assign it to the mini PC. For example:

```json
"tagOwners": {
  "tag:pokemon-host": ["autogroup:admin"],
},
```

Applying a tag changes the device to a tag-based identity. Define a Tailscale Service named `pokemon-staging` in the admin console with endpoint `tcp:443`; approve the mini PC as a Service host if no auto-approval rule is configured. Enable Tailscale Serve/HTTPS when prompted, then configure its HTTPS endpoint to target Caddy's staging handoff:

```sh
sudo tailscale serve --service=svc:pokemon-staging --https=443 http://127.0.0.1:18081
sudo tailscale serve status --json
```

The staging Service is private to tailnet devices allowed by the policy. Test it from a second device with Tailscale installed and connected. Tailscale Service endpoints require explicit access grants when moving away from the current allow-all policy; grant the intended user devices access to `svc:pokemon-staging` on port 443.

### Public production fallback with Tailscale Funnel

Tailscale Serve and Funnel cannot use the same port on the same node. Since staging Serve occupies HTTPS port 443, configure the production Funnel on HTTPS port 8443. Funnel is public; do not use it for private staging. Set `FUNNEL_BASE_URL` in the production environment to `https://<mini-pc>.<tailnet>.ts.net:8443`. Keep `FUNNEL_HOST` as just `<mini-pc>.<tailnet>.ts.net`, with no scheme, path, or port, because Caddy uses it as the upstream host. When direct DuckDNS ingress is the production primary URL, keep `PUBLIC_BASE_URL` set to that DuckDNS URL.

The installed Tailscale client may provide a consent link to enable Funnel and update the tailnet policy. After enabling it, configure the production handoff:

```sh
sudo tailscale funnel --bg --https=8443 http://127.0.0.1:18082
sudo tailscale funnel status
```

The public fallback URL includes `:8443`. Verify the current CLI syntax against the installed Tailscale version before operating on another host. Caddy's Tailscale listeners are published only on host loopback. Caddy accepts forwarded client IPs only from the verified local proxy peer on those listeners, overwrites `X-Forwarded-For`, `X-Real-IP`, `X-Forwarded-Host`, and `X-Forwarded-Proto` sent to Fastify, and strips unused Tailscale identity headers. The direct public listener overwrites the same forwarded headers from its direct peer. Fastify checks the **raw socket peer** before auth and trusts proxy information only from its environment's edge CIDR. Better Auth reads only Caddy's sanitized `X-Real-IP` and has explicit origins.

The current tailnet policy uses an allow-all grant. Before adding the CI deployment device, replace that grant with least-privilege rules for the CI tag, deployment SSH target, and staging Service. Do not assume that the desired restricted CI policy is already configured.

Before enabling production, test all three browser paths with normal and spoofed `X-Forwarded-For`, `X-Real-IP`, `X-Forwarded-Host`, and `X-Forwarded-Proto`. In private staging, `/api/ingress-debug` reports Fastify's raw peer, effective client IP, scheme, and host. Verify the client IP remains the actual remote client after spoofing and that the scheme is HTTPS. Use a temporary container attached only to a non-edge network to confirm direct API requests receive 403; verify `docker ps` shows no host-published Fastify port. Check separate cookie jars for staging and production/Funnel. Production's debug route is disabled. Inspect Caddy and Fastify logs for production path checks. If Docker forwards loopback-published requests with a peer other than `TAILSCALE_PROXY_PEER`, correct the exact peer and repeat these tests; never weaken the guard to trust arbitrary private ranges.

## 3. GitHub and promotion

Initialize and push the repository to GitHub. Protect `development`, `staging`, and `main`: require Checks and CodeQL, PR reviews as desired, and prevent bypass for direct pushes. Development runs checks and CodeQL but has no deployment workflow. Staging builds and deploys the image after a successful push; main promotes the exact tested digest after production approval. Set the `production` environment to require owner approval. Enable Actions, code scanning, and Dependabot. GHCR must be readable by the mini PC: publish the package or provision a root-owned read-only registry credential on the host.

Configure GitHub encrypted secrets `TS_OAUTH_CLIENT_ID`, `TS_OAUTH_SECRET`, `DEPLOY_SSH_KEY`, and `DEPLOY_KNOWN_HOSTS`, plus variables `DEPLOY_TARGET` (restricted SSH user and tailnet host) and `STAGING_URL` (private service HTTPS URL). Tailscale's OAuth client needs an ephemeral `tag:ci` auth key scope and ACLs restricted to deployment targets.

Configure the server's deploy SSH account with a forced command `/usr/local/sbin/pokemon-deploy-ssh`, no PTY/port forwarding, and sudoers permission only for `/usr/local/sbin/pokemon-deploy` with validated commands. The root-owned deploy script accepts only GHCR sha256 digests and full Git SHAs. The image is built once after successful staging Checks, deployed by digest, smoke-tested through Caddy and through the private service, and then recorded as tested with commit and Git tree. If the private service checks fail, CI invokes `stage-abort` to restore the preceding app image; database migrations remain in place and therefore must be backward compatible. After successful main Checks and GitHub production approval, the workflow compares the main Git tree with the recorded staging tree and deploys that exact digest. No production build runs.

For a requested rollback, an administrator runs `sudo /usr/local/sbin/pokemon-deploy rollback production` or `rollback staging`. This recreates only the app service with the previous successful image. It does not roll back data. Every migration shipped with a release must remain compatible with the immediately previous image.

## 4. USB backup and restore gate

Mount the USB drive at a stable path, for example `/mnt/pokemon-backup`, and copy [`infra/secrets/backup.env.example`](../infra/secrets/backup.env.example) to root-owned `infra/secrets/backup.env`, mode `0600`. Set `USB_MOUNT`, `RESTIC_REPOSITORY` located beneath that mount, and `RESTIC_PASSWORD_FILE` pointing to a root-only password file. The repository path is configurable for a future move or remote copy. Install and enable `infra/systemd/pokemon-backup.timer`, adjusting `RequiresMountsFor` if the mount differs. The backup script stops if the USB mount is absent; it does not silently write to the root filesystem. It creates an encrypted restic snapshot daily and before production migrations. Store the restic password separately from the USB device.

After staging has data, run a staging backup, then `sudo /usr/local/sbin/pokemon-restore-drill staging`. This restores the latest snapshot into a disposable database, queries a table, drops that database, and writes the USB restore gate marker. A successful restore from the attached USB demonstrates local recovery only. Keep an off-host copy as a future improvement.

Only after testing working public ingress from outside the home network should an administrator create `/var/lib/pokemon-deploy/public-ingress.passed`. The production deploy script requires that marker, the restore drill marker, a tested staging tree, and the approved GitHub environment. Recheck public ingress and repeat the restore drill before the first release and after changes to networking or backup storage.

## 5. Limits of workstation verification

`pnpm build`, type checks, lint, unit/API composition tests, and YAML/network static checks run locally. The Windows workstation does not run the mini PC's Docker daemon or PostgreSQL; host operations have been performed separately over SSH. Caddy startup, public HTTPS reachability to Caddy, private Tailscale Serve reachability to Caddy, and both database health checks have been observed. Full application behavior, proxy-header spoofing checks, email delivery, database account journeys, Playwright browser journeys, disposable USB restore, Funnel reachability, and production promotion still require verification. Do not mark production live until those gates pass.
