#!/usr/bin/env bash
set -euo pipefail
[[ $EUID -eq 0 ]] || exit 1
ROOT=/opt/pokemon-tools
ENVIRONMENT=${1:-staging}
[[ $ENVIRONMENT == staging || $ENVIRONMENT == production ]] || exit 2
source "$ROOT/infra/secrets/backup.env"
mountpoint -q "$USB_MOUNT"
export RESTIC_REPOSITORY RESTIC_PASSWORD_FILE
TMP=$(mktemp -d)
DB=restore_drill_$(date +%s)
CONTAINER=pokemon-staging-db
[[ $ENVIRONMENT == production ]] && CONTAINER=pokemon-prod-db
trap 'docker exec "$CONTAINER" sh -c '\''PGPASSWORD="$POSTGRES_PASSWORD" dropdb -U pokemon --if-exists "$1"'\'' sh "$DB" >/dev/null 2>&1 || true; rm -rf "$TMP"' EXIT
restic restore latest --tag "$ENVIRONMENT" --target "$TMP"
DUMP=$(find "$TMP" -name "$ENVIRONMENT.dump" -type f -print -quit)
[[ -n "$DUMP" ]] || exit 2
docker exec "$CONTAINER" sh -c 'PGPASSWORD="$POSTGRES_PASSWORD" createdb -U pokemon "$1"' sh "$DB"
docker exec -i "$CONTAINER" sh -c 'PGPASSWORD="$POSTGRES_PASSWORD" pg_restore -U pokemon -d "$1" --exit-on-error' sh "$DB" < "$DUMP"
docker exec "$CONTAINER" sh -c 'PGPASSWORD="$POSTGRES_PASSWORD" psql -U pokemon -d "$1" -Atc '\''SELECT count(*) FROM "User"'\''' sh "$DB" >/dev/null
date -u +%FT%TZ > /var/lib/pokemon-deploy/usb-restore.passed
