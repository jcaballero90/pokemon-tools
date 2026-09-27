#!/usr/bin/env bash
set -euo pipefail
# ForcedCommand target; all input is parsed and validated by deploy.sh.
read -r -a ARGS <<< "${SSH_ORIGINAL_COMMAND:-}"
case "${ARGS[0]:-}" in
  stage|stage-confirm|stage-abort) [[ ${#ARGS[@]} -eq 4 ]] || exit 2;;
  release-info) [[ ${#ARGS[@]} -eq 1 ]] || exit 2;;
  production) [[ ${#ARGS[@]} -eq 3 ]] || exit 2;;
  *) exit 2;;
esac
exec sudo -n /usr/local/sbin/pokemon-deploy "${ARGS[@]}"
