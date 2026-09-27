#!/usr/bin/env bash
set -Eeuo pipefail

# Install as root-owned /usr/local/sbin/pokemon-deploy; grant the deploy user
# only this command through sudoers and a forced SSH command.
[[ $EUID -eq 0 ]] || { echo "Run as root" >&2; exit 1; }
ROOT=/opt/pokemon-tools
STATE=/var/lib/pokemon-deploy
ACTION=${1:-}
mkdir -p "$STATE"
chmod 700 "$STATE"

valid_digest() { [[ $1 =~ ^ghcr\.io/[a-zA-Z0-9_.-]+/[a-zA-Z0-9_.-]+@sha256:[0-9a-f]{64}$ ]]; }
valid_sha() { [[ $1 =~ ^[0-9a-f]{40}$ ]]; }
project_file() { printf '%s/infra/compose/%s.yaml' "$ROOT" "$1"; }
env_file() { printf '%s/infra/secrets/%s.env' "$ROOT" "$1"; }
compose() { docker compose --env-file "$(env_file "$1")" -f "$(project_file "$1")" "${@:2}"; }
current_digest() { cat "$STATE/$1.current" 2>/dev/null || true; }
rollback_failed() {
  trap - ERR
  if valid_digest "$PREVIOUS"; then
    export IMAGE_DIGEST="$PREVIOUS"
    compose "$1" up -d --no-deps api || true
  else
    compose "$1" stop api || true
  fi
}

case "$ACTION" in
  stage)
    DIGEST=${2:?digest}; COMMIT=${3:?commit}; TREE=${4:?tree}
    valid_digest "$DIGEST" && valid_sha "$COMMIT" && valid_sha "$TREE" || exit 2
    set -a; source "$(env_file staging)"; set +a
    PREVIOUS=$(current_digest staging)
    trap 'rollback_failed staging' ERR
    export IMAGE_DIGEST="$DIGEST"
    docker pull "$DIGEST"
    compose staging up -d db
    compose staging run --rm --no-deps api sh -c 'cd apps/api && ./node_modules/.bin/prisma migrate deploy'
    compose staging up -d --no-deps api
    sleep 5
    curl --fail --silent --show-error --max-time 15 -H "Host: ${STAGING_HOST:?}" http://127.0.0.1:18081/api/health >/dev/null
    printf '%s\n' "$PREVIOUS" > "$STATE/staging.previous"
    printf '%s\n' "$DIGEST" > "$STATE/staging.current"
    printf '%s %s %s\n' "$COMMIT" "$TREE" "$DIGEST" > "$STATE/staging.candidate"
    trap - ERR
    ;;
  stage-confirm)
    DIGEST=${2:?digest}; COMMIT=${3:?commit}; TREE=${4:?tree}
    valid_digest "$DIGEST" && valid_sha "$COMMIT" && valid_sha "$TREE" || exit 2
    read -r CANDIDATE_COMMIT CANDIDATE_TREE CANDIDATE_DIGEST < "$STATE/staging.candidate"
    [[ $DIGEST == "$CANDIDATE_DIGEST" && $COMMIT == "$CANDIDATE_COMMIT" && $TREE == "$CANDIDATE_TREE" ]] || exit 3
    cp "$STATE/staging.candidate" "$STATE/staging.tested"
    rm -f "$STATE/staging.candidate"
    ;;
  stage-abort)
    DIGEST=${2:?digest}; COMMIT=${3:?commit}; TREE=${4:?tree}
    valid_digest "$DIGEST" && valid_sha "$COMMIT" && valid_sha "$TREE" || exit 2
    read -r CANDIDATE_COMMIT CANDIDATE_TREE CANDIDATE_DIGEST < "$STATE/staging.candidate"
    [[ $DIGEST == "$CANDIDATE_DIGEST" && $COMMIT == "$CANDIDATE_COMMIT" && $TREE == "$CANDIDATE_TREE" ]] || exit 3
    set -a; source "$(env_file staging)"; set +a
    PREVIOUS=$(cat "$STATE/staging.previous")
    if valid_digest "$PREVIOUS"; then
      export IMAGE_DIGEST="$PREVIOUS"
      compose staging up -d --no-deps api
      printf '%s\n' "$PREVIOUS" > "$STATE/staging.current"
    else
      compose staging stop api
      rm -f "$STATE/staging.current"
    fi
    rm -f "$STATE/staging.candidate"
    ;;
  release-info)
    cat "$STATE/staging.tested"
    ;;
  production)
    DIGEST=${2:?digest}; TREE=${3:?tree}
    valid_digest "$DIGEST" && valid_sha "$TREE" || exit 2
    set -a; source "$(env_file production)"; set +a
    read -r TESTED_COMMIT TESTED_TREE TESTED_DIGEST < "$STATE/staging.tested"
    [[ $DIGEST == "$TESTED_DIGEST" && $TREE == "$TESTED_TREE" ]] || { echo "Digest/tree not tested in staging" >&2; exit 3; }
    [[ -f "$STATE/public-ingress.passed" && -f "$STATE/usb-restore.passed" ]] || { echo "Production gates not passed" >&2; exit 4; }
    PREVIOUS=$(current_digest production)
    trap 'rollback_failed production' ERR
    export IMAGE_DIGEST="$DIGEST"
    docker pull "$DIGEST"
    if docker container inspect pokemon-prod-db >/dev/null 2>&1; then "$ROOT/infra/scripts/backup.sh" production pre-migration; fi
    compose production up -d db
    compose production run --rm --no-deps api sh -c 'cd apps/api && ./node_modules/.bin/prisma migrate deploy'
    compose production up -d --no-deps api
    sleep 5
    curl --fail --silent --show-error --max-time 15 "${PUBLIC_BASE_URL:?}/api/health" >/dev/null
    printf '%s\n' "$PREVIOUS" > "$STATE/production.previous"
    printf '%s\n' "$DIGEST" > "$STATE/production.current"
    trap - ERR
    ;;
  rollback)
    ENVIRONMENT=${2:?staging-or-production}
    [[ $ENVIRONMENT == staging || $ENVIRONMENT == production ]] || exit 2
    set -a; source "$(env_file "$ENVIRONMENT")"; set +a
    DIGEST=$(cat "$STATE/$ENVIRONMENT.previous")
    valid_digest "$DIGEST" || { echo "No previous image" >&2; exit 3; }
    export IMAGE_DIGEST="$DIGEST"
    compose "$ENVIRONMENT" up -d --no-deps api
    printf '%s\n' "$DIGEST" > "$STATE/$ENVIRONMENT.current"
    ;;
  *) echo "Usage: $0 stage DIGEST COMMIT TREE | stage-confirm DIGEST COMMIT TREE | stage-abort DIGEST COMMIT TREE | release-info | production DIGEST TREE | rollback staging|production" >&2; exit 2;;
esac
