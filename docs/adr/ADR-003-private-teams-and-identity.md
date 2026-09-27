# ADR-003: Store private teams with PostgreSQL, Prisma 7, and Better Auth

- **Date:** 2026-09-27
- **Status:** Accepted

## Context and constraints

Guests can compare temporary teams in one browser, while account holders need private teams that survive beyond a browser session. The project also aims to practice a backend, APIs, migrations, and authentication. Staging and production need separate databases and runtime secrets.

## Alternatives considered

- **Browser storage for every team:** adequate for temporary drafts, but it would not provide account-owned server storage or a useful authorization boundary.
- **A lighter database or handwritten SQL and migrations:** plausible at this scale, but it would change the selected PostgreSQL learning goal and increase persistence code the project must maintain.
- **Custom authentication:** gives full control, but places credential and session behavior on project code rather than a dedicated auth library.

## Decision and rationale

Keep guest drafts in browser storage. Store account-owned teams in PostgreSQL 18, reached through a Prisma 7 adapter. Pin the Prisma major at 7 while Prisma 8 remains a later review. Use Better Auth for email/password accounts and sessions with its Prisma adapter. Authorize private team operations through the session, and filter team reads and deletes by the authenticated owner in the persistence query. Keep the database URL, auth secret, base URL, and trusted origins in per-environment runtime configuration.

Email verification for the first public release is an open requirement question. The current implementation enables verification when SMTP is configured; this ADR does not settle the release policy.

## Consequences

- Server-side storage supports private teams and independent staging/production data. It also creates a duty to protect, migrate, back up, and restore that data.
- Better Auth reduces custom credential and session code, while coupling the project to its configuration and schema integration.
- Prisma eases typed data access, but generated client and migration compatibility become build and release concerns.
- Browser drafts remain local to that browser until the user chooses a save flow.

## Evidence and sources

- Project decision: [requirements REQ-005, REQ-006, REQ-011, and REQ-013](../requirements/requirements.md) and the [living architecture map](../architecture/architecture.md).
- Implementation evidence: [Prisma schema](../../apps/api/prisma/schema.prisma), [team store](../../apps/api/src/modules/teams/prisma-adapter.ts), [auth configuration](../../apps/api/src/modules/auth/auth.ts), and [API dependency versions](../../apps/api/package.json).
- Course influence: the validated **Aplicando Clean Architecture con TypeScript → Puertos y adaptadores** informs the persistence seam. PostgreSQL, Prisma, and Better Auth are owner-approved project choices rather than course prescriptions.
