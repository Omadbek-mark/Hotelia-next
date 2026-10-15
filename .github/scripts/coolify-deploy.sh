#!/usr/bin/env bash
set -euo pipefail

: "${COOLIFY_URL:?COOLIFY_URL is required}"
: "${COOLIFY_TOKEN:?COOLIFY_TOKEN is required}"
: "${APP_UUID:?APP_UUID is required}"

base_url="${COOLIFY_URL%/}/api/v1"
# Do not retry this POST: a lost response could otherwise queue duplicate deployments.
response=$(curl --silent --show-error --fail --connect-timeout 15 --max-time 30 \
  --request POST --header "Authorization: Bearer $COOLIFY_TOKEN" \
  "$base_url/deploy?uuid=$APP_UUID&force=false")
deployment=$(jq -er '.deployments[0].deployment_uuid | strings | select(length > 0)' <<< "$response")
echo "Waiting for Coolify deployment $deployment"

deadline=$((SECONDS + 1800))
while true; do
  body=$(curl --silent --show-error --fail --connect-timeout 15 --max-time 30 \
    --retry 3 --retry-delay 5 --header "Authorization: Bearer $COOLIFY_TOKEN" \
    "$base_url/deployments/$deployment")
  status=$(jq -er '.status | strings | select(length > 0)' <<< "$body")
  echo "Deployment status: $status"
  case "$status" in
    finished) break ;;
    failed|cancelled*|canceled*) echo "::error::Coolify deployment failed or was cancelled"; exit 1 ;;
  esac
  if (( SECONDS >= deadline )); then
    echo "::error::Coolify deployment did not finish within 30 minutes"
    exit 1
  fi
  sleep 15
done

# Internal batch has no public domain; its health check is configured in Coolify.
if [[ -n "${SMOKE_URL:-}" ]]; then
  for attempt in {1..12}; do
    code=$(curl --silent --output /dev/null --write-out '%{http_code}' \
      --connect-timeout 5 --max-time 15 "$SMOKE_URL") || code=000
    echo "HTTP smoke test $attempt: $code"
    if [[ "$code" == 200 ]]; then exit 0; fi
    sleep 10
  done
  echo "::error::Public endpoint did not return HTTP 200 after deployment"
  exit 1
fi
