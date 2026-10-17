#!/usr/bin/env bash

# ==============================================================================
# PortGrid: Multi-Environment Startup Automation
# Environments: dev (default), qa, prod
# ==============================================================================

set -Eeuo pipefail

readonly APP_NAME="PortGrid"
readonly ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
readonly BACKEND_DIR="${ROOT_DIR}/backend"
readonly FRONTEND_DIR="${ROOT_DIR}/frontend"

# Target environment resolution (cli argument or env variable, default: dev)
ENV_ARG="${1:-${PORTGRID_ENV:-dev}}"
# Shift if first argument is an environment name
if [[ "$ENV_ARG" == "dev" || "$ENV_ARG" == "qa" || "$ENV_ARG" == "prod" ]]; then
  shift || true
fi

readonly TARGET_ENV="${ENV_ARG}"
readonly SHUTDOWN_TIMEOUT="${PORTGRID_SHUTDOWN_TIMEOUT:-10}"
readonly DASHBOARD_URL="${PORTGRID_DASHBOARD_URL:-http://localhost:3000}"
readonly API_URL="${PORTGRID_API_URL:-http://localhost:4000/api}"

BACKEND_PID=""
FRONTEND_PID=""
QA_CONTAINER_NAME="portgrid-qa"

log() {
  printf '[%s] [%s] %s\n' "$(date '+%H:%M:%S')" "${TARGET_ENV^^}" "$*"
}

die() {
  log "ERROR: $*" >&2
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 ||
    die "Required command '$1' was not found. Please install it and retry."
}

free_port_if_occupied() {
  local port="$1"
  local desc="$2"
  local pids

  if command -v lsof >/dev/null 2>&1; then
    pids=$(lsof -ti :"$port" 2>/dev/null || true)
    if [[ -n "$pids" ]]; then
      log "Port ${port} (${desc}) is held by PID(s): ${pids}. Clearing socket..."
      for pid in $pids; do
        kill -15 "$pid" 2>/dev/null || true
      done
      sleep 0.5
      for pid in $pids; do
        if kill -0 "$pid" 2>/dev/null; then
          kill -9 "$pid" 2>/dev/null || true
        fi
      done
    fi
  fi
}

signal_tree() {
  local signal="$1"
  local pid="$2"
  local child

  [[ "$pid" =~ ^[0-9]+$ ]] || return 0
  kill -0 "$pid" 2>/dev/null || return 0

  if command -v pgrep >/dev/null 2>&1; then
    while IFS= read -r child; do
      [[ -n "$child" ]] || continue
      signal_tree "$signal" "$child"
    done < <(pgrep -P "$pid" 2>/dev/null || true)
  fi

  kill "-${signal}" "$pid" 2>/dev/null || true
}

stop_processes() {
  local pid
  local deadline
  local running

  if [[ "$TARGET_ENV" == "qa" && -n "${DOCKER_QA_RUNNING:-}" ]]; then
    log "Stopping QA container '${QA_CONTAINER_NAME}'..."
    docker stop "$QA_CONTAINER_NAME" >/dev/null 2>&1 || true
    docker rm -f "$QA_CONTAINER_NAME" >/dev/null 2>&1 || true
    return
  fi

  for pid in "$BACKEND_PID" "$FRONTEND_PID"; do
    [[ -n "$pid" ]] || continue
    signal_tree TERM "$pid"
  done

  deadline=$((SECONDS + SHUTDOWN_TIMEOUT))

  while (( SECONDS < deadline )); do
    running=0
    for pid in "$BACKEND_PID" "$FRONTEND_PID"; do
      [[ -n "$pid" ]] || continue
      if kill -0 "$pid" 2>/dev/null; then
        running=1
      fi
    done
    (( running == 0 )) && break
    sleep 0.2
  done

  for pid in "$BACKEND_PID" "$FRONTEND_PID"; do
    [[ -n "$pid" ]] || continue
    if kill -0 "$pid" 2>/dev/null; then
      log "Graceful shutdown timed out for PID ${pid}; sending SIGKILL."
      signal_tree KILL "$pid"
    fi
    wait "$pid" 2>/dev/null || true
  done
}

cleanup() {
  local exit_code=$?
  trap - EXIT INT TERM HUP
  log "Shutting down ${APP_NAME} (${TARGET_ENV})..."
  stop_processes
  log "${APP_NAME} shutdown complete."
  exit "$exit_code"
}

check_docker() {
  require_command docker
  if ! docker info >/dev/null 2>&1; then
    die "Docker daemon is not active. Please start Docker engine and retry."
  fi
}

start_dev() {
  log "Starting ${APP_NAME} in LOCAL DEVELOPMENT mode (hot reload enabled)..."
  
  require_command node
  require_command npm
  check_docker

  free_port_if_occupied 4000 "Backend API"
  free_port_if_occupied 3000 "Frontend Dashboard"

  trap cleanup EXIT
  trap 'exit 130' INT
  trap 'exit 143' TERM

  log "Launching NestJS backend in watch mode..."
  (
    cd "$BACKEND_DIR"
    export NODE_ENV=development
    exec npm run start:dev
  ) &
  BACKEND_PID=$!

  log "Launching Vite frontend in development HMR mode..."
  (
    cd "$FRONTEND_DIR"
    export NODE_ENV=development
    exec npm run dev
  ) &
  FRONTEND_PID=$!

  printf '\n'
  log "============================================================"
  log "  PortGrid DEV Environment is Active"
  log "  Frontend Console: http://localhost:3000"
  log "  Backend API:      http://localhost:4000/api"
  log "============================================================"
  printf '\n'
  log "Press Ctrl+C to stop dev session."

  while true; do
    if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
      die "Backend process crashed."
    fi
    if ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
      die "Frontend process crashed."
    fi
    sleep 1
  done
}

start_qa() {
  local USE_CONTAINER=true
  # Check if user requested local compiled QA mode instead of container
  if [[ "${1:-}" == "--local" ]]; then
    USE_CONTAINER=false
  fi

  check_docker

  if [[ "$USE_CONTAINER" == "true" ]]; then
    log "Starting ${APP_NAME} in QA mode via Docker image (mannasuman134/postgrid:qa)..."
    free_port_if_occupied 3000 "PortGrid QA Container"

    DOCKER_QA_RUNNING="1"
    trap cleanup EXIT
    trap 'exit 130' INT
    trap 'exit 143' TERM

    # Pull latest QA image if accessible, fallback to local if offline
    log "Checking for QA image updates..."
    docker pull mannasuman134/postgrid:qa 2>/dev/null || log "Using cached QA image."

    # Remove any stale QA container
    docker rm -f "$QA_CONTAINER_NAME" >/dev/null 2>&1 || true

    # Resolve docker socket
    local DOCKER_SOCK="/var/run/docker.sock"
    if [[ -S "${HOME}/.docker/run/docker.sock" ]]; then
      DOCKER_SOCK="${HOME}/.docker/run/docker.sock"
    fi

    log "Spawning QA container '${QA_CONTAINER_NAME}' on port 3000..."
    docker run --name "$QA_CONTAINER_NAME" \
      -p 127.0.0.1:3000:3000 \
      -v "${DOCKER_SOCK}:/var/run/docker.sock" \
      -e NODE_ENV=qa \
      -e PORTGRID_ENV=qa \
      mannasuman134/postgrid:qa

  else
    log "Starting ${APP_NAME} in LOCAL QA COMPILED mode..."
    require_command node
    require_command npm

    free_port_if_occupied 3000 "Production Bundle Preview"
    free_port_if_occupied 4000 "Backend Control Plane"

    trap cleanup EXIT
    trap 'exit 130' INT

    log "Compiling production bundles for QA validation..."
    npm run build

    log "Launching backend with NODE_ENV=qa..."
    (
      cd "$BACKEND_DIR"
      export NODE_ENV=qa
      exec npm run start:prod
    ) &
    BACKEND_PID=$!

    log "Serving compiled frontend..."
    (
      cd "$FRONTEND_DIR"
      exec npm run preview -- --port 3000
    ) &
    FRONTEND_PID=$!

    printf '\n'
    log "============================================================"
    log "  PortGrid LOCAL QA Environment is Active"
    log "  QA Console: http://localhost:3000"
    log "============================================================"
    printf '\n'
    log "Press Ctrl+C to terminate QA test."

    while true; do
      if ! kill -0 "$BACKEND_PID" 2>/dev/null; then die "Backend stopped."; fi
      if ! kill -0 "$FRONTEND_PID" 2>/dev/null; then die "Frontend stopped."; fi
      sleep 1
    done
  fi
}

start_prod() {
  log "Starting ${APP_NAME} in PRODUCTION mode via CLI orchestrator..."
  check_docker
  node "${ROOT_DIR}/bin/portgrid.js" up --env prod "$@"
}

main() {
  case "$TARGET_ENV" in
    dev|development)
      start_dev "$@"
      ;;
    qa|test|testing)
      start_qa "$@"
      ;;
    prod|production)
      start_prod "$@"
      ;;
    *)
      printf "Usage: %s [dev|qa|prod]\n" "$0"
      printf "  dev  : Local hot-reloading development server (default)\n"
      printf "  qa   : QA validation mode (dockerized mannasuman134/postgrid:qa or --local)\n"
      printf "  prod : Production orchestrator (mannasuman134/postgrid:latest)\n"
      exit 1
      ;;
  esac
}

main "$@"