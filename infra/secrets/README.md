Copy the matching `.env.example` files to root-owned `staging.env`, `production.env`, `caddy.env`, and `backup.env` here on the mini PC, with mode `0600`. Replace all placeholders before use. Keep existing configured files when repeating setup. Only the examples belong in Git; the real files remain ignored.

- [`caddy.env.example`](caddy.env.example): Caddy process UID/GID and ingress hostnames.
- [`staging.env.example`](staging.env.example): staging database, authentication, URLs, and optional email.
- [`production.env.example`](production.env.example): production database, authentication, URLs, and optional email.
- [`backup.env.example`](backup.env.example): USB mount and encrypted backup repository.

The deployment and backup scripts source their files as Bash. Keep LF line endings and `KEY='literal-value'` assignments with no spaces around `=` or references to other variables. Use separate staging and production secrets. `IMAGE_DIGEST` is supplied by the deployment script rather than stored in these files.

See [`docs/operations.md`](../../docs/operations.md) for setup and database-only preparation before the first application image. Local workstation PostgreSQL uses [`apps/api/.env.example`](../../apps/api/.env.example).
