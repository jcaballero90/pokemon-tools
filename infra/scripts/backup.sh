#!/usr/bin/env bash
set -euo pipefail
[[ $EUID -eq 0 ]] || exit 1
ENVIRONMENT=${1:?staging-or-production}
REASON=${2:-daily}
[[ $ENVIRONMENT == staging || $ENVIRONMENT == production ]] || exit 2
[[ $REASON == daily || $REASON == pre-migration ]] || exit 2
ROOT=/opt/pokemon-tools
source "$ROOT/infra/secrets/backup.env"
[[ -n ${USB_MOUNT:-} && -n ${RESTIC_REPOSITORY:-} && -n ${RESTIC_PASSWORD_FILE:-} ]] || exit 3
mountpoint -q "$USB_MOUNT" || { echo "USB backup drive is not mounted" >&2; exit 4; }
case "$RESTIC_REPOSITORY" in "$USB_MOUNT"/*) ;; *) echo "Repository must be on the mounted USB drive" >&2; exit 4;; esac
export RESTIC_REPOSITORY RESTIC_PASSWORD_FILE
[[ -f "$RESTIC_PASSWORD_FILE" ]] || exit 4
[[ -f "$RESTIC_REPOSITORY/config" ]] || restic init
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
CONTAINER=pokemon-prod-db
[[ $ENVIRONMENT == staging ]] && CONTAINER=pokemon-staging-db
docker exec "$CONTAINER" sh -c 'PGPASSWORD="$POSTGRES_PASSWORD" pg_dump -U pokemon -d pokemon -Fc' > "$TMP/$ENVIRONMENT.dump"
restic backup "$TMP/$ENVIRONMENT.dump" --tag "$ENVIRONMENT" --tag "$REASON"
restic check --read-data-subset=1/30
