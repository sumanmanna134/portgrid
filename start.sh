#!/usr/bin/env bash

set -Eeuo pipefail

readonly APP_NAME="PortGrid"
readonly ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
readonly BACKEND_DIR="${ROOT_DIR}/backend"
readonly FRONTEND_DIR="${ROOT_DIR}/frontend"

readonly BACKEND_SCRIPT="${PORTGRID_BACKEND_SCRIPT:-start:dev}"
readonly FRONTEND_SCRIPT="${PORTGRID_FRONTEND_SCRIPT:-dev}"
readonly SHUTDOWN_TIMEOUT="${PORTGRID_SHUTDOWN_TIMEOUT:-10}"

readonly DASHBOARD_URL="${PORTGRID_DASHBOARD_URL:-http://localhost:3000}"
readonly API_URL="${PORTGRID_API_URL:-http://localhost:4000/api}"

BACKEND_PID=""
FRONTEND_PID=""

log() {
  printf '[%s] %s\n' "$(date '+%H:%M:%S')" "$*"
}

die() {
  log "ERROR: $*" >&2
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 ||
    die "Required command '$1' was not found. Please install it and retry."
}

validate_service() {
  local service_name="$1"
  local service_dir="$2"
  local script_name="$3"
  local package_file="${service_dir}/package.json"

  [[ -d "$service_dir" ]] ||
    die "${service_name} directory not found: ${service_dir}"

  [[ -f "$package_file" ]] ||
    die "${service_name} package.json not found: ${package_file}"

  node -e '
    const fs = require("node:fs");
    const file = process.argv[1];
    const script = process.argv[2];
    const pkg = JSON.parse(fs.readFileSync(file, "utf8"));

    if (!pkg.scripts || typeof pkg.scripts[script] !== "string") {
      console.error(`Missing npm script "${script}" in ${file}`);
      process.exit(1);
    }
  ' "$package_file" "$script_name" ||
    die "Cannot validate ${service_name} startup script."
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

  # Request graceful shutdown of both process trees.
  for pid in "$BACKEND_PID" "$FRONTEND_PID"; do
    [[ -n "$pid" ]] || continue
    signal_tree TERM "$pid"
  done

  deadline=$((SECONDS + SHUTDOWN_TIMEOUT))

  # Allow time for npm scripts and their children to terminate.
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

  # Force-stop any remaining top-level processes.
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

  # Prevent recursive EXIT handling.
  trap - EXIT INT TERM HUP

  log "Shutting down ${APP_NAME}..."
  stop_processes
  log "${APP_NAME} shutdown complete."

  exit "$exit_code"
}

report_unexpected_exit() {
  local service_name="$1"
  local pid="$2"
  local status

  if wait "$pid"; then
    status=0
  else
    status=$?
  fi

  log "ERROR: ${service_name} exited unexpectedly with status ${status}."

  # A service exiting successfully still ends the combined session.
  if (( status == 0 )); then
    status=1
  fi

  exit "$status"
}

monitor_processes() {
  while true; do
    if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
      report_unexpected_exit "Backend" "$BACKEND_PID"
    fi

    if ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
      report_unexpected_exit "Frontend" "$FRONTEND_PID"
    fi

    sleep 1
  done
}

check_docker() {
  require_command docker

  local docker_version

  if ! docker_version="$(docker info --format '{{.ServerVersion}}' 2>&1)"; then
    log "ERROR: Docker Engine is not running or is inaccessible."

    case "$(uname -s)" in
      Darwin)
        log "Start Docker Desktop and wait until the engine is running."
        ;;
      Linux)
        log "Check Docker status with: sudo systemctl status docker"
        log "Start Docker with: sudo systemctl start docker"
        log "Also verify your Docker socket permissions."
        ;;
      MINGW*|MSYS*|CYGWIN*)
        log "Start Docker Desktop and wait for the engine to become ready."
        ;;
      *)
        log "Start your Docker Engine and verify that the current user can access it."
        ;;
    esac

    log "Docker diagnostic: ${docker_version}"
    die "Docker is required by PortGrid. Startup aborted."
  fi

  log "Docker Engine is ready (version ${docker_version})."
}

main() {
  log "Validating ${APP_NAME} environment..."

  check_docker
  require_command node
  require_command npm

  validate_service "Backend" "$BACKEND_DIR" "$BACKEND_SCRIPT"
  validate_service "Frontend" "$FRONTEND_DIR" "$FRONTEND_SCRIPT"

  [[ "$SHUTDOWN_TIMEOUT" =~ ^[1-9][0-9]*$ ]] ||
    die "PORTGRID_SHUTDOWN_TIMEOUT must be a positive integer."

  # Register traps before starting any services.
  trap cleanup EXIT
  trap 'exit 130' INT
  trap 'exit 143' TERM
  trap 'exit 129' HUP

  log "Starting ${APP_NAME} backend..."
  (
    cd "$BACKEND_DIR"
    exec npm run "$BACKEND_SCRIPT"
  ) &
  BACKEND_PID=$!

  log "Backend process launched (PID ${BACKEND_PID})."

  log "Starting ${APP_NAME} frontend..."
  (
    cd "$FRONTEND_DIR"
    exec npm run "$FRONTEND_SCRIPT"
  ) &
  FRONTEND_PID=$!

  log "Frontend process launched (PID ${FRONTEND_PID})."

  printf '\n'
  log "${APP_NAME} development environment launched."
  printf '  Dashboard:      %s\n' "$DASHBOARD_URL"
  printf '  Control Plane:  %s\n' "$API_URL"
  printf '\n'
  log "Press Ctrl+C to stop both services."

  monitor_processes
}

main "$@"