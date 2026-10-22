#!/usr/bin/env bash
# Validates the docker deployment (docker-compose.yml): builds the images with
# Nx, starts the stack in an isolated compose project and checks it through the
# published UI port. Exits non-zero when any check fails.
#
# Usage: tools/docker/validate-deployment.sh [--skip-build]

set -uo pipefail

readonly COMPOSE_PROJECT="scheduler-validate"
readonly UI_PORT="${SCHEDULER_UI_PORT:-18080}"
readonly UI_URL="http://localhost:${UI_PORT}"
readonly API_SERVICE="scheduler-api"
readonly UI_SERVICE="scheduler-ui"
readonly PUBLISHED_PORTS_FORMAT='{{range .Publishers}}{{.PublishedPort}} {{end}}'
readonly NONZERO_PORT_PATTERN='[1-9]'
readonly API_PATH="/api"
readonly API_BODY_PATTERN='Hello API'
readonly SPA_DEEP_ROUTE="/some/deep/route"
readonly MISSING_ASSET="/missing.js"
readonly IMMUTABLE_CACHE_PATTERN='max-age=31536000, immutable'
readonly NO_CACHE_PATTERN='no-cache'
readonly ASSET_PATTERN='src="(main-[^"]+\.js)"'
readonly STATUS_OK=200
readonly STATUS_NOT_FOUND=404
readonly STATUS_BAD_GATEWAY=502
readonly READY_TIMEOUT_SECONDS=60
readonly POLL_INTERVAL_SECONDS=1
readonly ROOT_UID=0
readonly BUILD_TARGETS=(-t docker:build -p "$API_SERVICE" "$UI_SERVICE")
readonly DOCKER_DESKTOP_BIN="$HOME/.docker/bin"

readonly REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

passed=0
failed=0

# Docker Desktop installs the CLI outside the default PATH on some setups
if ! command -v docker >/dev/null 2>&1 && [[ -d "$DOCKER_DESKTOP_BIN" ]]; then
  export PATH="$DOCKER_DESKTOP_BIN:$PATH"
fi

export SCHEDULER_UI_PORT="$UI_PORT"

compose() {
  docker compose -p "$COMPOSE_PROJECT" -f "$REPO_ROOT/docker-compose.yml" "$@"
}

report() {
  local description="$1" outcome="$2"
  if [[ "$outcome" == "pass" ]]; then
    passed=$((passed + 1))
    echo "  ✔ $description"
  else
    failed=$((failed + 1))
    echo "  ✘ $description"
  fi
}

# check <description> <command...>: passes when the command succeeds
check() {
  local description="$1"
  shift
  if "$@" >/dev/null 2>&1; then report "$description" pass; else report "$description" fail; fi
}

http_status() {
  curl -s -o /dev/null -w '%{http_code}' "$UI_URL$1"
}

http_headers() {
  curl -s -D - -o /dev/null "$UI_URL$1"
}

http_body() {
  curl -s "$UI_URL$1"
}

status_is() {
  [[ "$(http_status "$1")" == "$2" ]]
}

header_matches() {
  http_headers "$1" | grep -iq "^cache-control:.*$2"
}

body_matches() {
  http_body "$1" | grep -q "$2"
}

# Polls until the command succeeds or the timeout elapses
wait_until() {
  local deadline=$((SECONDS + READY_TIMEOUT_SECONDS))
  until "$@" >/dev/null 2>&1; do
    ((SECONDS >= deadline)) && return 1
    sleep "$POLL_INTERVAL_SECONDS"
  done
}

runs_unprivileged() {
  local uid
  uid="$(compose exec -T "$1" id -u 2>/dev/null | tr -d '\r')"
  [[ -n "$uid" && "$uid" != "$ROOT_UID" ]]
}

# An unpublished port is listed with PublishedPort 0
api_not_published() {
  local ports
  ports="$(compose ps --format "$PUBLISHED_PORTS_FORMAT" "$API_SERVICE" 2>/dev/null)" || return 1
  [[ -n "$ports" ]] && ! grep -qE "$NONZERO_PORT_PATTERN" <<<"$ports"
}

hashed_asset_path() {
  http_body / | grep -oE "$ASSET_PATTERN" | head -1 | sed -E 's/src="(.*)"/\/\1/'
}

hashed_asset_is_immutable() {
  local asset
  asset="$(hashed_asset_path)"
  [[ -n "$asset" ]] && header_matches "$asset" "$IMMUTABLE_CACHE_PATTERN"
}

cleanup() {
  compose down --volumes --remove-orphans >/dev/null 2>&1
}

if ! command -v docker >/dev/null 2>&1 || ! docker info >/dev/null 2>&1; then
  echo "Docker is not available or its daemon is not running" >&2
  exit 1
fi

if [[ "${1:-}" != "--skip-build" ]]; then
  echo "Building images"
  (cd "$REPO_ROOT" && npx nx run-many "${BUILD_TARGETS[@]}" --no-tui) || {
    echo "Image build failed" >&2
    exit 1
  }
fi

trap cleanup EXIT
cleanup

echo "Starting stack (${COMPOSE_PROJECT}, ${UI_URL})"
if ! compose up -d --wait --wait-timeout "$READY_TIMEOUT_SECONDS" >/dev/null 2>&1; then
  report "stack starts and the api becomes healthy" fail
  compose logs --tail 30 >&2
  echo "Results: $passed passed, $failed failed"
  exit 1
fi
report "stack starts and the api becomes healthy" pass

echo "UI"
check "serves the app at /" wait_until status_is / "$STATUS_OK"
check "serves index.html for client-side routes" status_is "$SPA_DEEP_ROUTE" "$STATUS_OK"
check "does not cache index.html" header_matches / "$NO_CACHE_PATTERN"
check "caches fingerprinted assets as immutable" hashed_asset_is_immutable
check "returns 404 for a missing asset" status_is "$MISSING_ASSET" "$STATUS_NOT_FOUND"

echo "API through the UI proxy"
check "proxies ${API_PATH} to the api" status_is "$API_PATH" "$STATUS_OK"
check "returns the api response body" body_matches "$API_PATH" "$API_BODY_PATTERN"

echo "Hardening"
check "api is not published to the host" api_not_published
check "api runs as non-root" runs_unprivileged "$API_SERVICE"
check "ui runs as non-root" runs_unprivileged "$UI_SERVICE"

echo "Resilience"
compose stop "$API_SERVICE" >/dev/null 2>&1
check "ui answers 502 for ${API_PATH} while the api is down" status_is "$API_PATH" "$STATUS_BAD_GATEWAY"
check "ui keeps serving the app while the api is down" status_is / "$STATUS_OK"
compose start "$API_SERVICE" >/dev/null 2>&1
check "proxy recovers when the api returns" wait_until status_is "$API_PATH" "$STATUS_OK"

echo "Results: $passed passed, $failed failed"
((failed == 0))
