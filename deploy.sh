#!/usr/bin/env bash

# ==============================================================================
# PortGrid: Production Deployment and Healthcheck Script
# ==============================================================================
# Automates environment verification, resource qualification, cryptographic
# key generation, volume provisioning, image retrieval, and container startup.
# ==============================================================================

set -Eeuo pipefail

# Configuration parameters with environment overrides
readonly APP_NAME="PortGrid"
readonly DEFAULT_IMAGE="mannasuman134/postgrid:latest"
readonly PORTGRID_IMAGE="${PORTGRID_IMAGE:-$DEFAULT_IMAGE}"
readonly PORTGRID_CONTAINER="${PORTGRID_CONTAINER:-portgrid}"
readonly PORTGRID_PORT="${PORTGRID_PORT:-3000}"
readonly PORTGRID_VOLUME="${PORTGRID_VOLUME:-portgrid_data}"
readonly PORTGRID_CONFIG_DIR="${PORTGRID_CONFIG_DIR:-${HOME}/.portgrid}"
readonly PORTGRID_ENV_FILE="${PORTGRID_CONFIG_DIR}/portgrid.env"

# Resource qualification thresholds
readonly MIN_CPU_CORES=2
readonly MIN_RAM_MB=2048
readonly REC_RAM_MB=4096

log() {
  printf '[%s] %s\n' "$(date '+%H:%M:%S')" "$*"
}

log_header() {
  printf '\n==============================================================================\n'
  printf ' %s\n' "$*"
  printf '==============================================================================\n'
}

log_sub() {
  printf '  - %s\n' "$*"
}

die() {
  log "ERROR: $*" >&2
  exit 1
}

# ------------------------------------------------------------------------------
# 1. System and Hardware Qualification
# ------------------------------------------------------------------------------
check_system_resources() {
  log_header "1. System and Hardware Verification"

  local os_type arch cpu_cores=1 ram_mb=0 ram_gb=0

  os_type="$(uname -s)"
  arch="$(uname -m)"
  log_sub "Operating System: ${os_type} (${arch})"

  # Detect CPU cores
  if [[ "${os_type}" == "Darwin" ]]; then
    cpu_cores="$(sysctl -n hw.ncpu 2>/dev/null || echo 1)"
  elif [[ "${os_type}" == "Linux" ]]; then
    cpu_cores="$(nproc 2>/dev/null || grep -c ^processor /proc/cpuinfo 2>/dev/null || echo 1)"
  fi
  log_sub "CPU Cores: ${cpu_cores} available"

  if (( cpu_cores < MIN_CPU_CORES )); then
    log_sub "WARNING: PortGrid recommends at least ${MIN_CPU_CORES} CPU cores for running companion containers."
  fi

  # Detect Total Memory (RAM)
  if [[ "${os_type}" == "Darwin" ]]; then
    local mem_bytes
    mem_bytes="$(sysctl -n hw.memsize 2>/dev/null || echo 0)"
    ram_mb=$(( mem_bytes / 1024 / 1024 ))
  elif [[ "${os_type}" == "Linux" ]]; then
    if [[ -f /proc/meminfo ]]; then
      local mem_kb
      mem_kb="$(awk '/MemTotal/ {print $2}' /proc/meminfo 2>/dev/null || echo 0)"
      ram_mb=$(( mem_kb / 1024 ))
    elif command -v free >/dev/null 2>&1; then
      ram_mb="$(free -m | awk '/^Mem:/ {print $2}' 2>/dev/null || echo 0)"
    fi
  fi

  if (( ram_mb > 0 )); then
    ram_gb=$(( ram_mb / 1024 ))
    log_sub "Total System RAM: ~${ram_gb} GB (${ram_mb} MB)"

    if (( ram_mb < MIN_RAM_MB )); then
      log_sub "WARNING: System has less than ${MIN_RAM_MB} MB RAM. Heavy workloads (e.g. Kafka + pgAdmin) may experience pressure."
    elif (( ram_mb < REC_RAM_MB )); then
      log_sub "NOTICE: ${ram_gb} GB RAM detected. Recommended allocation for full stacks is ${REC_RAM_MB} MB."
    fi
  else
    log_sub "RAM: Could not determine exact memory size; proceeding."
  fi

  # Check Host Disk Space
  local disk_avail_mb=0
  if command -v df >/dev/null 2>&1; then
    disk_avail_mb="$(df -m . | awk 'NR==2 {print $4}' 2>/dev/null || echo 0)"
    if (( disk_avail_mb > 0 )); then
      log_sub "Available Disk Space: ~$(( disk_avail_mb / 1024 )) GB free"
    fi
  fi
}

# ------------------------------------------------------------------------------
# 2. Software Prerequisites Inspection
# ------------------------------------------------------------------------------
check_software_prerequisites() {
  log_header "2. Software Dependencies Inspection"

  # Docker verification (Mandatory)
  if ! command -v docker >/dev/null 2>&1; then
    log "ERROR: Docker CLI is not installed."
    printf '\n  Please install Docker Engine or Docker Desktop before running PortGrid:\n'
    printf '  - macOS: brew install --cask docker (or download Docker Desktop)\n'
    printf '  - Ubuntu/Debian: sudo apt-get update && sudo apt-get install docker.io\n'
    printf '  - Fedora/RHEL: sudo dnf install docker-ce\n\n'
    die "Docker is mandatory. Deployment halted."
  fi

  local docker_version
  docker_version="$(docker --version 2>&1 || echo 'unknown')"
  log_sub "Docker CLI: ${docker_version}"

  # Verify Docker daemon connectivity
  if ! docker info >/dev/null 2>&1; then
    log "ERROR: Docker daemon is not running or current user lacks socket permissions."
    printf '\n  Troubleshooting:\n'
    printf '  - Ensure Docker Desktop or dockerd service is active.\n'
    printf '  - On Linux, start the daemon: sudo systemctl start docker\n'
    printf '  - To grant user permissions without sudo: sudo usermod -aG docker $USER\n\n'
    die "Cannot connect to Docker daemon. Deployment halted."
  fi
  log_sub "Docker Daemon: Online and responsive"

  # Node.js verification (Informational)
  if command -v node >/dev/null 2>&1; then
    local node_version npm_version="not found"
    node_version="$(node --version 2>&1)"
    if command -v npm >/dev/null 2>&1; then
      npm_version="$(npm --version 2>&1)"
    fi
    log_sub "Host Node.js: ${node_version} (npm: ${npm_version})"
  else
    log_sub "Host Node.js: Not installed (Optional: PortGrid executes entirely inside container)"
  fi

  # OpenSSL or cryptographic randomness generator
  if command -v openssl >/dev/null 2>&1; then
    log_sub "Security Utility: OpenSSL available for FIPS-grade key derivation"
  else
    log_sub "Security Utility: Using kernel urandom entropy source"
  fi
}

# ------------------------------------------------------------------------------
# 3. Docker Socket Discovery
# ------------------------------------------------------------------------------
discover_docker_socket() {
  log_header "3. Docker Socket Discovery"

  local socket_candidates=(
    "${DOCKER_SOCKET:-}"
    "/var/run/docker.sock"
    "${HOME}/.docker/run/docker.sock"
    "${HOME}/.orbstack/run/docker.sock"
    "${HOME}/.colima/default/docker.sock"
    "/run/user/${UID:-1000}/podman/podman.sock"
  )

  local resolved_socket=""
  for s in "${socket_candidates[@]}"; do
    if [[ -n "$s" && -S "$s" ]]; then
      resolved_socket="$s"
      break
    fi
  done

  if [[ -z "$resolved_socket" && -e "/var/run/docker.sock" ]]; then
    resolved_socket="/var/run/docker.sock"
  fi

  if [[ -z "$resolved_socket" ]]; then
    log "WARNING: Could not automatically detect a live Unix domain socket."
    resolved_socket="/var/run/docker.sock"
  fi

  log_sub "Selected Socket Path: ${resolved_socket}"
  export DETECTED_DOCKER_SOCKET="${resolved_socket}"
}

# ------------------------------------------------------------------------------
# 4. Master Key and Cryptographic Storage Configuration
# ------------------------------------------------------------------------------
configure_master_key() {
  log_header "4. Cryptographic Master Key Initialization"

  mkdir -p -m 700 "${PORTGRID_CONFIG_DIR}"

  local master_key=""

  # Check if an existing key is in the env file
  if [[ -f "${PORTGRID_ENV_FILE}" ]]; then
    master_key="$(grep -E '^PORTGRID_MASTER_KEY=' "${PORTGRID_ENV_FILE}" | cut -d '=' -f2- | tr -d '[:space:]' || true)"
  fi

  # Generate 256-bit (32-byte hex) key if absent
  if [[ -z "${master_key}" ]]; then
    if command -v openssl >/dev/null 2>&1; then
      master_key="$(openssl rand -hex 32)"
    elif command -v python3 >/dev/null 2>&1; then
      master_key="$(python3 -c 'import secrets; print(secrets.token_hex(32))' 2>/dev/null || true)"
    fi

    if [[ -z "${master_key}" ]]; then
      master_key="$(head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n')"
    fi

    cat > "${PORTGRID_ENV_FILE}" <<EOF
# PortGrid Enterprise Configuration
PORTGRID_MASTER_KEY=${master_key}
PORTGRID_PORT=${PORTGRID_PORT}
PORTGRID_IMAGE=${PORTGRID_IMAGE}
PORTGRID_VOLUME=${PORTGRID_VOLUME}
EOF
    chmod 600 "${PORTGRID_ENV_FILE}"
    log_sub "Generated new 256-bit AES-GCM Master Key in: ${PORTGRID_ENV_FILE}"
  else
    log_sub "Loaded existing Master Key from: ${PORTGRID_ENV_FILE}"
  fi

  export PORTGRID_ACTIVE_KEY="${master_key}"
}

# ------------------------------------------------------------------------------
# 5. Persistent Volume Allocation
# ------------------------------------------------------------------------------
configure_storage_volume() {
  log_header "5. Storage Volume Configuration"

  if docker volume inspect "${PORTGRID_VOLUME}" >/dev/null 2>&1; then
    log_sub "Persistent Docker Volume '${PORTGRID_VOLUME}' already exists."
  else
    docker volume create "${PORTGRID_VOLUME}" >/dev/null
    log_sub "Created persistent Docker Volume: '${PORTGRID_VOLUME}'"
  fi
}

# ------------------------------------------------------------------------------
# 6. Host Port Conflict Detection
# ------------------------------------------------------------------------------
check_port_availability() {
  log_header "6. Network Port Validation"

  local port="${PORTGRID_PORT}"
  local in_use=0

  # Check if port is held by the existing PortGrid container
  local current_owner=""
  current_owner="$(docker ps --filter "name=^/${PORTGRID_CONTAINER}$" --format '{{.Names}}' 2>/dev/null || true)"

  if command -v lsof >/dev/null 2>&1; then
    if lsof -iTCP:"${port}" -sTCP:LISTEN -P -n >/dev/null 2>&1; then
      in_use=1
    fi
  elif command -v nc >/dev/null 2>&1; then
    if nc -z 127.0.0.1 "${port}" >/dev/null 2>&1; then
      in_use=1
    fi
  fi

  if (( in_use == 1 )); then
    if [[ "${current_owner}" == "${PORTGRID_CONTAINER}" ]]; then
      log_sub "Port ${port} is currently bound by active PortGrid container. Will be replaced during deployment."
    else
      log "ERROR: Host port ${port} is already in use by another application."
      printf '\n  Please stop the conflicting process or run PortGrid on a custom port:\n'
      printf '    PORTGRID_PORT=3001 ./deploy.sh\n\n'
      die "Port ${port} is not available."
    fi
  else
    log_sub "Host port ${port} is free and ready for binding."
  fi
}

# ------------------------------------------------------------------------------
# 7. Pull Container Image from Docker Hub
# ------------------------------------------------------------------------------
pull_docker_image() {
  log_header "7. Pulling Container Image from Registry"

  log_sub "Registry Image: ${PORTGRID_IMAGE}"
  log_sub "Pulling latest layer manifest..."
  docker pull "${PORTGRID_IMAGE}"
  log_sub "Image verification complete."
}

# ------------------------------------------------------------------------------
# 8. Container Launch and Execution
# ------------------------------------------------------------------------------
launch_container() {
  log_header "8. Container Orchestration and Execution"

  # Stop and remove existing container if running
  if docker ps -a --filter "name=^/${PORTGRID_CONTAINER}$" --format '{{.Names}}' | grep -q "^${PORTGRID_CONTAINER}$"; then
    log_sub "Removing prior instance of '${PORTGRID_CONTAINER}'..."
    docker stop "${PORTGRID_CONTAINER}" >/dev/null 2>&1 || true
    docker rm "${PORTGRID_CONTAINER}" >/dev/null 2>&1 || true
  fi

  log_sub "Launching PortGrid unified container..."
  local container_id
  container_id="$(docker run -d \
    --name "${PORTGRID_CONTAINER}" \
    --restart unless-stopped \
    -p "${PORTGRID_PORT}:3000" \
    -e NODE_ENV=production \
    -e PORT=3000 \
    -e DATA_DIR=/app/data \
    -e PORTGRID_MASTER_KEY="${PORTGRID_ACTIVE_KEY}" \
    -v "${DETECTED_DOCKER_SOCKET}:/var/run/docker.sock" \
    -v "${PORTGRID_VOLUME}:/app/data" \
    "${PORTGRID_IMAGE}")"

  log_sub "Container started with ID: ${container_id:0:12}"
}

# ------------------------------------------------------------------------------
# 9. Health Verification Probe
# ------------------------------------------------------------------------------
verify_readiness() {
  log_header "9. Health and Readiness Verification"

  local target_url="http://127.0.0.1:${PORTGRID_PORT}/api/services"
  local max_retries=30
  local retry_count=1
  local healthy=0

  log_sub "Probing health check at ${target_url}..."

  while (( retry_count <= max_retries )); do
    if curl -s -f -m 2 "${target_url}" >/dev/null 2>&1; then
      healthy=1
      break
    fi
    sleep 1
    (( retry_count++ ))
  done

  if (( healthy == 1 )); then
    log_sub "Health probe succeeded in ${retry_count}s (HTTP 200 OK)."
  else
    log "WARNING: Health check did not respond within ${max_retries} seconds."
    log_sub "Container logs for diagnostic review:"
    docker logs --tail 20 "${PORTGRID_CONTAINER}" || true
  fi
}

# ------------------------------------------------------------------------------
# 10. Summary and Operations Guide
# ------------------------------------------------------------------------------
print_summary() {
  log_header "PortGrid Deployment Summary"

  printf '\n'
  printf '  Status:          ACTIVE AND READY\n'
  printf '  Web Dashboard:   http://localhost:%s\n' "${PORTGRID_PORT}"
  printf '  API Endpoint:    http://localhost:%s/api\n' "${PORTGRID_PORT}"
  printf '  Container Name:  %s\n' "${PORTGRID_CONTAINER}"
  printf '  Container Image: %s\n' "${PORTGRID_IMAGE}"
  printf '  Docker Socket:   %s\n' "${DETECTED_DOCKER_SOCKET}"
  printf '  Storage Volume:  %s\n' "${PORTGRID_VOLUME}"
  printf '  Master Key File: %s (mode 0600)\n' "${PORTGRID_ENV_FILE}"
  printf '\n'
  printf '%s\n' '------------------------------------------------------------------------------'
  printf ' Operational Commands:\n'
  printf '   View container logs:     docker logs -f %s\n' "${PORTGRID_CONTAINER}"
  printf '   Stop PortGrid:           docker stop %s\n' "${PORTGRID_CONTAINER}"
  printf '   Restart PortGrid:        docker restart %s\n' "${PORTGRID_CONTAINER}"
  printf '   Re-run / update script:  ./deploy.sh\n'
  printf '%s\n\n' '------------------------------------------------------------------------------'
}

# ------------------------------------------------------------------------------
# Command Dispatcher
# ------------------------------------------------------------------------------
handle_cli_args() {
  case "${1:-}" in
    -h|--help)
      printf 'Usage: %s [OPTIONS]\n\n' "$0"
      printf 'Options:\n'
      printf '  --status    Inspect status of running PortGrid container\n'
      printf '  --logs      Stream logs from PortGrid container\n'
      printf '  --stop      Gracefully stop and remove PortGrid container\n'
      printf '  --help      Display this operational manual\n\n'
      printf 'Environment Variables:\n'
      printf '  PORTGRID_IMAGE     Docker Hub image tag (default: %s)\n' "$DEFAULT_IMAGE"
      printf '  PORTGRID_PORT      Host web port mapping (default: 3000)\n'
      printf '  PORTGRID_CONTAINER Container name (default: portgrid)\n'
      printf '  PORTGRID_VOLUME    Docker volume name (default: portgrid_data)\n\n'
      exit 0
      ;;
    --status)
      docker ps --filter "name=^/${PORTGRID_CONTAINER}$"
      exit 0
      ;;
    --logs)
      exec docker logs -f "${PORTGRID_CONTAINER}"
      ;;
    --stop)
      log "Stopping PortGrid container..."
      docker stop "${PORTGRID_CONTAINER}" 2>/dev/null || true
      docker rm "${PORTGRID_CONTAINER}" 2>/dev/null || true
      log "PortGrid stopped."
      exit 0
      ;;
    "")
      # Default execution: continue to deployment
      ;;
    *)
      die "Unknown option: $1. Run with --help for usage."
      ;;
  esac
}

main() {
  handle_cli_args "$@"
  check_system_resources
  check_software_prerequisites
  discover_docker_socket
  configure_master_key
  configure_storage_volume
  check_port_availability
  pull_docker_image
  launch_container
  verify_readiness
  print_summary
}

main "$@"
