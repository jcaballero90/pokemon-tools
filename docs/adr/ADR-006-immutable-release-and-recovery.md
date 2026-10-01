# ADR-006: Promote one tested image digest with explicit recovery gates

- **Date:** 2026-09-27
- **Status:** Accepted

## Context and constraints

The project needs a staged path from local work to a public mini PC release. A production deployment should be the artifact already tested in staging. A failed release must have a practical rollback, while private PostgreSQL data needs recoverable backups. The available backup device is a USB drive attached to the mini PC; there is no NAS or off-host repository yet.

## Alternatives considered

- **Rebuild from `main` for production:** would produce a new artifact even when the source tree is the same, weakening the link to staging checks.
- **Deploy mutable tags:** convenient to type, but a tag can later refer to different image content.
- **Rely on image rollback for all failures:** restores application code but cannot reverse a database migration or recover lost data.
- **Use local backups without a restore drill:** creates snapshots but does not demonstrate that they can be restored.

## Decision and rationale

After checks pass on `staging`, build and publish one GHCR image, deploy it by immutable digest, smoke-test through the private staging path, and record its commit, Git tree, and digest. A protected `main` workflow must match that tested tree. After production approval, deploy the recorded digest without rebuilding. Keep the previous successful digest so a failed release or requested rollback recreates only the application service. Migrations must be compatible with the immediately preceding image because rollback does not reverse database changes.

Back up PostgreSQL daily and before production migrations into an encrypted restic repository on the mounted USB drive. Require an actual restore into a disposable database and a working public ingress check before the first production release. The backup destination remains configurable for a later off-host copy. The host scripts currently implement marker checks; administrators must only create the public-ingress marker after an external test.

## Consequences

- The promoted artifact is traceable to the staging tree and checks, and an app rollback is quick to invoke.
- Backward-compatible migrations constrain schema changes. A data or migration failure may still require a separate recovery procedure.
- The USB repository provides local recovery from some host failures, but it is exposed to loss of the mini PC's location until an off-host copy exists.
- **Implementation status (2026-09-30):** the owner reports successful staging and production workflow runs, a completed staging restore drill, and a live public production page. Retain Actions run links for exact commit/digest evidence. Reviewer settings, failed-stage recovery, and app-only rollback remain to be verified.

## Evidence and sources

- Project decision: [requirements REQ-014, REQ-015, and REQ-016](../requirements/requirements.md) and the [operations guide](../operations.md).
- Implementation evidence: [staging workflow](../../.github/workflows/staging.yml), [production workflow](../../.github/workflows/production.yml), [deployment script](../../infra/scripts/deploy.sh), [backup script](../../infra/scripts/backup.sh), and [restore drill](../../infra/scripts/restore-drill.sh).
- Course influence: the validated **Calidad → Documentación con IA → ADRs** informs recording alternatives and consequences. Digest promotion, rollback, and USB gates are owner-approved project choices.
