#!/usr/bin/env bash
# PortGrid deployment installer
# - Animated, paced preflight checks
# - Interactive confirmation for Docker-socket access and container replacement
# - Persistent configuration and storage
# - Configurable host binding, hardened container defaults, readiness probe
# - Rollback to the previous container if the new deployment fails readiness

set -Eeuo pipefail
umask 077

readonly APP_NAME="PortGrid"
readonly SCRIPT_VERSION="2.1.0"
readonly DEFAULT_IMAGE="mannasuman134/postgrid:latest"

# Remember explicitly supplied environment settings. Environment variables win over
# saved settings, and command-line flags win over both.
PORTGRID_IMAGE_ENV_SET=0
PORTGRID_CONTAINER_ENV_SET=0
PORTGRID_PORT_ENV_SET=0
PORTGRID_BIND_ENV_SET=0
PORTGRID_URL_ENV_SET=0
PORTGRID_VOLUME_ENV_SET=0
if [[ -n "${PORTGRID_IMAGE+x}" ]]; then PORTGRID_IMAGE_ENV_SET=1; fi
if [[ -n "${PORTGRID_CONTAINER+x}" ]]; then PORTGRID_CONTAINER_ENV_SET=1; fi
if [[ -n "${PORTGRID_PORT+x}" ]]; then PORTGRID_PORT_ENV_SET=1; fi
if [[ -n "${PORTGRID_BIND_ADDRESS+x}" ]]; then PORTGRID_BIND_ENV_SET=1; fi
if [[ -n "${PORTGRID_URL+x}" || -n "${PORTGRID_PUBLIC_URL+x}" ]]; then PORTGRID_URL_ENV_SET=1; fi
if [[ -n "${PORTGRID_VOLUME+x}" ]]; then PORTGRID_VOLUME_ENV_SET=1; fi

# CLI arguments override environment variables and saved settings.
PORTGRID_IMAGE="${PORTGRID_IMAGE:-$DEFAULT_IMAGE}"
PORTGRID_CONTAINER="${PORTGRID_CONTAINER:-portgrid}"
PORTGRID_PORT="${PORTGRID_PORT:-3000}"
PORTGRID_BIND_ADDRESS="${PORTGRID_BIND_ADDRESS:-127.0.0.1}"
PORTGRID_URL="${PORTGRID_URL:-${PORTGRID_PUBLIC_URL:-}}"
PORTGRID_HEALTH_URL="${PORTGRID_HEALTH_URL:-}"
PORTGRID_HEALTH_PATH="${PORTGRID_HEALTH_PATH:-/api/services}"
PORTGRID_VOLUME="${PORTGRID_VOLUME:-portgrid_data}"
PORTGRID_CONFIG_DIR="${PORTGRID_CONFIG_DIR:-${HOME:-$PWD}/.portgrid}"
PORTGRID_ENV_FILE="${PORTGRID_CONFIG_DIR}/portgrid.env"
PORTGRID_CONTAINER_ENV_FILE="${PORTGRID_CONFIG_DIR}/container.env"
PORTGRID_STEP_DELAY="${PORTGRID_STEP_DELAY:-0.8}"
PORTGRID_HEALTH_TIMEOUT="${PORTGRID_HEALTH_TIMEOUT:-30}"
PORTGRID_STOP_TIMEOUT="${PORTGRID_STOP_TIMEOUT:-20}"
PORTGRID_MEMORY_LIMIT="${PORTGRID_MEMORY_LIMIT:-}"
PORTGRID_CPU_LIMIT="${PORTGRID_CPU_LIMIT:-}"
PORTGRID_PIDS_LIMIT="${PORTGRID_PIDS_LIMIT:-256}"
PORTGRID_LOG_MAX_SIZE="${PORTGRID_LOG_MAX_SIZE:-10m}"
PORTGRID_LOG_MAX_FILES="${PORTGRID_LOG_MAX_FILES:-3}"
PORTGRID_RESTART_POLICY="${PORTGRID_RESTART_POLICY:-unless-stopped}"
readonly MIN_CPU_CORES=2
readonly MIN_RAM_MB=2048
readonly REC_RAM_MB=4096

ASSUME_YES=0
DRY_RUN=0
ACTION="deploy"
TMP_DIR=""
ACTIVE_STEP_PID=""
BACKUP_CONTAINER=""
DETECTED_DOCKER_SOCKET=""
STEP_OUTPUT=""
STEP_STATUS=0
EXISTING_CONTAINER=0
NEW_CONTAINER_CREATED=0
PORTGRID_DASHBOARD_URL=""
PORTGRID_API_URL=""
PORTGRID_READY_URL=""

if [[ -t 1 && -z "${NO_COLOR:-}" && "${TERM:-dumb}" != "dumb" ]]; then
  C_RESET=$'\033[0m'
  C_BOLD=$'\033[1m'
  C_DIM=$'\033[2m'
  C_CYAN=$'\033[36m'
  C_BLUE=$'\033[34m'
  C_GREEN=$'\033[32m'
  C_YELLOW=$'\033[33m'
  C_RED=$'\033[31m'
else
  C_RESET=""; C_BOLD=""; C_DIM=""; C_CYAN=""; C_BLUE=""
  C_GREEN=""; C_YELLOW=""; C_RED=""
fi

log() { printf '%s[%s]%s %s\n' "$C_DIM" "$(date '+%H:%M:%S')" "$C_RESET" "$*"; }
info() { printf '  %s[i]%s %s\n' "$C_CYAN" "$C_RESET" "$*"; }
success() { printf '  %s[OK]%s %s\n' "$C_GREEN" "$C_RESET" "$*"; }
warning() { printf '  %s[WARN]%s %s\n' "$C_YELLOW" "$C_RESET" "$*"; }
error() { printf '  %s[FAIL]%s %s\n' "$C_RED" "$C_RESET" "$*" >&2; }
die() { error "$*"; exit 1; }

print_banner() {
  clear
  printf '\n'
  printf '%s%s' "$C_CYAN" "$C_BOLD"
  cat <<'BANNER'
  ____            _    _____       _     
 |  _ \ ___  _ __| |_ / ____|_ __(_) __ _
 | |_) / _ \| '__| __| |  __| '__| |/ _` |
 |  __/ (_) | |  | |_| |__| | |  | | (_| |
 |_|   \___/|_|   \__|\_____|_|  |_|\__,_|
BANNER

  printf '%s' "$C_RESET"
  printf '\n'
  printf '  Local Cloud Infrastructure Platform  |  Deployment Installer v%s\n' "$SCRIPT_VERSION"
  printf ' \n\n'
}

print_section() {
  printf '\n%s%s%s\n' "$C_YELLOW" "$C_BOLD" "$1"
  printf '%s  --------------------------------------------------------------------------%s\n' "$C_DIM" "$C_RESET"
}

# Run a command with an animated spinner and a minimum visual duration.
# Output is captured so commands such as `docker pull` do not corrupt the spinner.
# On failure, captured output is displayed to aid diagnosis.
run_step() {
  local label="$1"
  shift
  local log_file status_file status ticks=0 min_ticks frame frames='⣾⣷⣯⣟⡿⢿⣻⣽'
  local step_id

  [[ -n "$TMP_DIR" ]] || die "Internal error: temporary directory is not initialized."
  step_id="${TMP_DIR}/step.$$.${RANDOM}"
  log_file="${step_id}.log"
  status_file="${step_id}.status"

  if [[ -t 1 && "${PORTGRID_NO_ANIMATION:-0}" != "1" ]]; then
    printf '  %s' "$label"
  else
    printf '  ... %s\n' "$label"
  fi

  # Validate the configured delay once here so malformed values fail clearly.
  [[ "$PORTGRID_STEP_DELAY" =~ ^[0-9]+([.][0-9]+)?$ ]] || die "PORTGRID_STEP_DELAY must be a number between 0.1 and 5 seconds."
  awk -v d="$PORTGRID_STEP_DELAY" 'BEGIN { exit !(d >= 0.1 && d <= 5) }' || die "PORTGRID_STEP_DELAY must be between 0.1 and 5 seconds."
  min_ticks="$(awk -v d="$PORTGRID_STEP_DELAY" 'BEGIN { n=int((d * 10) + 0.999); if (n < 1) n=1; print n }')"

  (
    set +e
    "$@" >"$log_file" 2>&1
    status=$?
    printf '%s\n' "$status" >"$status_file"
    exit "$status"
  ) &
  ACTIVE_STEP_PID=$!

  while [[ ! -f "$status_file" ]] || (( ticks < min_ticks )); do
    if [[ -t 1 && "${PORTGRID_NO_ANIMATION:-0}" != "1" ]]; then
      frame="${frames:$((ticks % 4)):1}"
      printf '\r  %s%s%s %s' "$C_BOLD" "$frame" "$C_RESET" "$label"
    fi
    sleep 0.1
    ticks=$((ticks + 1))
  done

  wait "$ACTIVE_STEP_PID" 2>/dev/null || true
  ACTIVE_STEP_PID=""
  status="$(cat "$status_file" 2>/dev/null || printf '1')"
  STEP_STATUS="$status"
  STEP_OUTPUT="$(cat "$log_file" 2>/dev/null || true)"
  rm -f "$log_file" "$status_file"

  if [[ -t 1 && "${PORTGRID_NO_ANIMATION:-0}" != "1" ]]; then
    printf '\r\033[2K'
  fi

  if [[ "$status" == "0" ]]; then
    success "$label"
    return 0
  fi

  error "$label"
  if [[ -n "$STEP_OUTPUT" ]]; then
    printf '%s\n' "$STEP_OUTPUT" | sed 's/^/      /' >&2
  else
    error "Command exited with status ${status}."
  fi
  return "$status"
}

signal_process_tree() {
  local signal="$1"
  local pid="$2"
  local child
  [[ "$pid" =~ ^[0-9]+$ ]] || return 0
  if command -v pgrep >/dev/null 2>&1; then
    while IFS= read -r child; do
      [[ -n "$child" ]] && signal_process_tree "$signal" "$child"
    done < <(pgrep -P "$pid" 2>/dev/null || true)
  fi
  kill -"$signal" "$pid" 2>/dev/null || true
}

cleanup() {
  local code=$?
  if [[ -n "$ACTIVE_STEP_PID" ]]; then
    # Best-effort stop of the active check and its descendants.
    if command -v pgrep >/dev/null 2>&1; then
      signal_process_tree TERM "$ACTIVE_STEP_PID"
    else
      kill -TERM "$ACTIVE_STEP_PID" 2>/dev/null || true
    fi
    wait "$ACTIVE_STEP_PID" 2>/dev/null || true
  fi
  [[ -n "$TMP_DIR" && -d "$TMP_DIR" ]] && rm -rf "$TMP_DIR"
  exit "$code"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
trap 'exit 129' HUP

confirm() {
  local prompt="$1"
  local response=""

  if (( ASSUME_YES == 1 )); then
    info "Non-interactive confirmation accepted (--yes): ${prompt}"
    return 0
  fi

  if [[ ! -t 0 ]]; then
    error "Cannot ask for confirmation without an interactive terminal. Re-run with --yes if you intend to proceed."
    return 1
  fi

  printf '\n%s%s?%s %s %s[y/N]%s ' "$C_YELLOW" "$C_BOLD" "$C_RESET" "$prompt" "$C_DIM" "$C_RESET"
  IFS= read -r response || true
  case "$response" in
    y|Y|yes|YES|Yes) return 0 ;;
    *) info "Cancelled. No changes were made."; return 1 ;;
  esac
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || die "Required command '$1' is missing. Install it and retry."
}

# Load only known settings from the private config file. Never source it or eval it.
# Explicit environment variables and CLI options take precedence over saved values.
load_saved_settings() {
  [[ -r "$PORTGRID_ENV_FILE" ]] || return 0
  local line key value
  while IFS= read -r line || [[ -n "$line" ]]; do
    [[ "$line" == *=* ]] || continue
    key="${line%%=*}"
    value="${line#*=}"
    case "$key" in
      PORTGRID_IMAGE)        if (( PORTGRID_IMAGE_ENV_SET == 0 )) && [[ -n "$value" ]]; then PORTGRID_IMAGE="$value"; fi ;;
      PORTGRID_CONTAINER)    if (( PORTGRID_CONTAINER_ENV_SET == 0 )) && [[ -n "$value" ]]; then PORTGRID_CONTAINER="$value"; fi ;;
      PORTGRID_PORT)         if (( PORTGRID_PORT_ENV_SET == 0 )) && [[ -n "$value" ]]; then PORTGRID_PORT="$value"; fi ;;
      PORTGRID_BIND_ADDRESS) if (( PORTGRID_BIND_ENV_SET == 0 )) && [[ -n "$value" ]]; then PORTGRID_BIND_ADDRESS="$value"; fi ;;
      PORTGRID_URL)          if (( PORTGRID_URL_ENV_SET == 0 )); then PORTGRID_URL="$value"; fi ;;
      PORTGRID_VOLUME)       if (( PORTGRID_VOLUME_ENV_SET == 0 )) && [[ -n "$value" ]]; then PORTGRID_VOLUME="$value"; fi ;;
    esac
  done < "$PORTGRID_ENV_FILE"
}

validate_configuration() {
  print_section "Configuration validation"

  [[ "$PORTGRID_PORT" =~ ^[0-9]+$ ]] || die "PORTGRID_PORT must be an integer between 1 and 65535."
  (( 10#$PORTGRID_PORT >= 1 && 10#$PORTGRID_PORT <= 65535 )) || die "PORTGRID_PORT must be between 1 and 65535."
  PORTGRID_PORT="$((10#$PORTGRID_PORT))"
  [[ "$PORTGRID_HEALTH_TIMEOUT" =~ ^[0-9]+$ ]] || die "PORTGRID_HEALTH_TIMEOUT must be a positive integer."
  [[ "$PORTGRID_STOP_TIMEOUT" =~ ^[0-9]+$ ]] || die "PORTGRID_STOP_TIMEOUT must be a positive integer."
  (( 10#$PORTGRID_HEALTH_TIMEOUT >= 1 && 10#$PORTGRID_HEALTH_TIMEOUT <= 600 )) || die "PORTGRID_HEALTH_TIMEOUT must be between 1 and 600 seconds."
  (( 10#$PORTGRID_STOP_TIMEOUT >= 1 && 10#$PORTGRID_STOP_TIMEOUT <= 300 )) || die "PORTGRID_STOP_TIMEOUT must be between 1 and 300 seconds."
  PORTGRID_HEALTH_TIMEOUT="$((10#$PORTGRID_HEALTH_TIMEOUT))"
  PORTGRID_STOP_TIMEOUT="$((10#$PORTGRID_STOP_TIMEOUT))"
  [[ "$PORTGRID_CONTAINER" =~ ^[a-zA-Z0-9][a-zA-Z0-9_.-]*$ ]] || die "Invalid PORTGRID_CONTAINER name: ${PORTGRID_CONTAINER}"
  [[ "$PORTGRID_VOLUME" =~ ^[a-zA-Z0-9][a-zA-Z0-9_.-]*$ ]] || die "Invalid PORTGRID_VOLUME name: ${PORTGRID_VOLUME}"
  [[ -n "$PORTGRID_IMAGE" && "$PORTGRID_IMAGE" != *$'\n'* && "$PORTGRID_IMAGE" != *[[:space:]]* ]] || die "PORTGRID_IMAGE must be a non-empty image reference without whitespace."
  [[ -n "$PORTGRID_CONFIG_DIR" ]] || die "PORTGRID_CONFIG_DIR could not be resolved. Set HOME or PORTGRID_CONFIG_DIR."
  [[ "$PORTGRID_PIDS_LIMIT" =~ ^[1-9][0-9]*$ ]] || die "PORTGRID_PIDS_LIMIT must be a positive integer."
  [[ "$PORTGRID_LOG_MAX_FILES" =~ ^[1-9][0-9]*$ ]] || die "PORTGRID_LOG_MAX_FILES must be a positive integer."
  [[ "$PORTGRID_LOG_MAX_SIZE" =~ ^[1-9][0-9]*[kKmMgG]?$ ]] || die "PORTGRID_LOG_MAX_SIZE must look like 10m, 500k, or 1g."
  [[ "$PORTGRID_RESTART_POLICY" =~ ^(no|always|unless-stopped|on-failure(:[0-9]+)?)$ ]] || die "Invalid PORTGRID_RESTART_POLICY. Use no, always, unless-stopped, or on-failure[:N]."
  [[ "$PORTGRID_BIND_ADDRESS" =~ ^([0-9]{1,3}\.){3}[0-9]{1,3}$ ]] || die "PORTGRID_BIND_ADDRESS must be an IPv4 address, such as 127.0.0.1 or 0.0.0.0."
  local octet
  local -a bind_octets=()
  IFS='.' read -r -a bind_octets <<< "$PORTGRID_BIND_ADDRESS"
  for octet in "${bind_octets[@]}"; do
    (( 10#$octet <= 255 )) || die "Invalid IPv4 bind address: ${PORTGRID_BIND_ADDRESS}"
  done
  if [[ -n "$PORTGRID_URL" ]]; then
    [[ "$PORTGRID_URL" =~ ^https?://[^/[:space:]]+ ]] || die "PORTGRID_URL must be a valid absolute http:// or https:// URL."
    [[ "$PORTGRID_URL" != *[[:space:]]* && "$PORTGRID_URL" != *$'\n'* ]] || die "PORTGRID_URL must not contain whitespace."
  fi
  if [[ -n "$PORTGRID_HEALTH_URL" ]]; then
    [[ "$PORTGRID_HEALTH_URL" =~ ^https?://[^/[:space:]]+ ]] || die "PORTGRID_HEALTH_URL must be a valid absolute http:// or https:// URL."
    [[ "$PORTGRID_HEALTH_URL" != *[[:space:]]* && "$PORTGRID_HEALTH_URL" != *$'\n'* ]] || die "PORTGRID_HEALTH_URL must not contain whitespace."
  fi
  [[ "$PORTGRID_HEALTH_PATH" == /* && "$PORTGRID_HEALTH_PATH" != *[[:space:]]* ]] || die "PORTGRID_HEALTH_PATH must start with / and contain no whitespace."
  if [[ -n "$PORTGRID_MEMORY_LIMIT" ]]; then
    [[ "$PORTGRID_MEMORY_LIMIT" =~ ^[1-9][0-9]*[kKmMgG]?$ ]] || die "PORTGRID_MEMORY_LIMIT must look like 512m, 2g, or 1024k."
  fi
  if [[ -n "$PORTGRID_CPU_LIMIT" ]]; then
    [[ "$PORTGRID_CPU_LIMIT" =~ ^[0-9]+([.][0-9]+)?$ ]] || die "PORTGRID_CPU_LIMIT must be a positive number, for example 1 or 1.5."
    awk -v c="$PORTGRID_CPU_LIMIT" 'BEGIN { exit !(c > 0 && c <= 256) }' || die "PORTGRID_CPU_LIMIT must be greater than 0 and no more than 256."
  fi

  success "Port, image, URL, container, volume, and runtime settings are valid"
  info "Image: ${PORTGRID_IMAGE}"
  if [[ "$PORTGRID_IMAGE" == *:latest ]]; then
    warning "The image uses a mutable :latest tag. Pin a tested version or digest for repeatable production releases."
  fi
  info "Container: ${PORTGRID_CONTAINER}"
  info "Bind address: ${PORTGRID_BIND_ADDRESS}:${PORTGRID_PORT}"
  info "PIDs limit: ${PORTGRID_PIDS_LIMIT}"
  [[ -n "$PORTGRID_MEMORY_LIMIT" ]] && info "Memory limit: ${PORTGRID_MEMORY_LIMIT}"
  [[ -n "$PORTGRID_CPU_LIMIT" ]] && info "CPU limit: ${PORTGRID_CPU_LIMIT}"
  return 0
}

# Discover a host IPv4 address from local interface/routing information.
# This avoids silently sending a request to a third-party public-IP service.
detect_primary_ipv4() {
  local candidate="" iface
  if [[ "$(uname -s)" == "Linux" ]] && command -v ip >/dev/null 2>&1; then
    candidate="$(ip -4 route get 1.1.1.1 2>/dev/null | awk '{for (i=1; i<=NF; i++) if ($i == "src") {print $(i+1); exit}}' || true)"
    if [[ "$candidate" =~ ^([0-9]{1,3}\.){3}[0-9]{1,3}$ && "$candidate" != 127.* ]]; then
      printf '%s' "$candidate"; return 0
    fi
  fi
  if [[ "$(uname -s)" == "Linux" ]] && command -v hostname >/dev/null 2>&1; then
    candidate="$(hostname -I 2>/dev/null | awk '{for (i=1; i<=NF; i++) if ($i !~ /^127\./ && $i !~ /^169\.254\./) {print $i; exit}}' || true)"
    if [[ "$candidate" =~ ^([0-9]{1,3}\.){3}[0-9]{1,3}$ ]]; then
      printf '%s' "$candidate"; return 0
    fi
  fi
  if [[ "$(uname -s)" == "Darwin" ]] && command -v ipconfig >/dev/null 2>&1; then
    for iface in en0 en1 en2; do
      candidate="$(ipconfig getifaddr "$iface" 2>/dev/null || true)"
      if [[ "$candidate" =~ ^([0-9]{1,3}\.){3}[0-9]{1,3}$ && "$candidate" != 127.* ]]; then
        printf '%s' "$candidate"; return 0
      fi
    done
  fi
  return 1
}

resolve_urls() {
  local advertised_host=""
  if [[ -n "$PORTGRID_URL" ]]; then
    PORTGRID_DASHBOARD_URL="${PORTGRID_URL%/}"
  elif [[ "$PORTGRID_BIND_ADDRESS" == "127.0.0.1" ]]; then
    PORTGRID_DASHBOARD_URL="http://localhost:${PORTGRID_PORT}"
  elif [[ "$PORTGRID_BIND_ADDRESS" == "0.0.0.0" ]]; then
    advertised_host="$(detect_primary_ipv4 || true)"
    if [[ -n "$advertised_host" ]]; then
      PORTGRID_DASHBOARD_URL="http://${advertised_host}:${PORTGRID_PORT}"
    else
      PORTGRID_DASHBOARD_URL="http://localhost:${PORTGRID_PORT}"
      warning "Could not determine a non-loopback host IP. Pass --url or PORTGRID_URL to advertise an external address."
    fi
  else
    PORTGRID_DASHBOARD_URL="http://${PORTGRID_BIND_ADDRESS}:${PORTGRID_PORT}"
  fi

  PORTGRID_API_URL="${PORTGRID_DASHBOARD_URL%/}/api"
  if [[ -n "$PORTGRID_HEALTH_URL" ]]; then
    PORTGRID_READY_URL="${PORTGRID_HEALTH_URL%/}"
  elif [[ "$PORTGRID_BIND_ADDRESS" == "127.0.0.1" || "$PORTGRID_BIND_ADDRESS" == "0.0.0.0" ]]; then
    PORTGRID_READY_URL="http://localhost:${PORTGRID_PORT}${PORTGRID_HEALTH_PATH}"
  else
    PORTGRID_READY_URL="http://${PORTGRID_BIND_ADDRESS}:${PORTGRID_PORT}${PORTGRID_HEALTH_PATH}"
  fi

  info "Dashboard URL: ${PORTGRID_DASHBOARD_URL}"
  info "Readiness endpoint: ${PORTGRID_READY_URL}"
  if [[ "$PORTGRID_BIND_ADDRESS" == "0.0.0.0" ]]; then
    warning "PortGrid is bound to all IPv4 interfaces. Ensure firewall rules and network exposure are intentional."
  fi
}


check_system_resources() {
  local os_type arch cpu_cores ram_mb=0 mem_bytes=0 disk_avail_mb=0

  print_section "1/8  ·  Host qualification"
  run_step "Detect host operating system and architecture" bash -c 'printf "%s %s\n" "$(uname -s)" "$(uname -m)"'
  read -r os_type arch <<<"$STEP_OUTPUT"
  info "Platform: ${os_type} (${arch})"

  run_step "Inspect available CPU cores" bash -c '
    case "$(uname -s)" in
      Darwin) sysctl -n hw.ncpu ;;
      Linux) nproc 2>/dev/null || grep -c "^processor" /proc/cpuinfo ;;
      *) printf "1\n" ;;
    esac
  '
  cpu_cores="$(printf '%s' "$STEP_OUTPUT" | tail -n 1 | tr -cd '0-9')"
  [[ "$cpu_cores" =~ ^[0-9]+$ ]] || cpu_cores=1
  info "CPU cores: ${cpu_cores}"
  if (( cpu_cores < MIN_CPU_CORES )); then
    warning "Only ${cpu_cores} CPU core(s) detected. At least ${MIN_CPU_CORES} are recommended for multi-service stacks."
  fi

  run_step "Inspect host memory" bash -c '
    case "$(uname -s)" in
      Darwin) sysctl -n hw.memsize | awk "{printf \"%d\\n\", \$1 / 1024 / 1024}" ;;
      Linux)
        if [ -r /proc/meminfo ]; then awk "/MemTotal/ {printf \"%d\\n\", \$2 / 1024}" /proc/meminfo
        elif command -v free >/dev/null 2>&1; then free -m | awk "/^Mem:/ {print \$2}"
        else printf "0\\n"; fi ;;
      *) printf "0\\n" ;;
    esac
  '
  ram_mb="$(printf '%s' "$STEP_OUTPUT" | tail -n 1 | tr -cd '0-9')"
  [[ "$ram_mb" =~ ^[0-9]+$ ]] || ram_mb=0
  if (( ram_mb > 0 )); then
    info "System RAM: $((ram_mb / 1024)) GB (${ram_mb} MB)"
    if (( ram_mb < MIN_RAM_MB )); then
      warning "Less than ${MIN_RAM_MB} MB RAM detected. Container-heavy workloads may be unstable."
    elif (( ram_mb < REC_RAM_MB )); then
      warning "${REC_RAM_MB} MB RAM is recommended for larger local stacks."
    fi
  else
    warning "Could not determine host RAM. Continuing without a memory qualification."
  fi

  run_step "Inspect available disk space" bash -c 'df -Pm "${HOME:-.}" | awk "NR==2 {print \$4}"'
  disk_avail_mb="$(printf '%s' "$STEP_OUTPUT" | tail -n 1 | tr -cd '0-9')"
  [[ "$disk_avail_mb" =~ ^[0-9]+$ ]] || disk_avail_mb=0
  if (( disk_avail_mb > 0 )); then
    info "Available disk space: $((disk_avail_mb / 1024)) GB"
    if (( disk_avail_mb < 2048 )); then warning "Less than 2 GB free on the selected filesystem."; fi
  else
    warning "Could not determine available disk space."
  fi
}

check_software_prerequisites() {
  print_section "2/8  ·  Runtime prerequisites"
  run_step "Locate Docker CLI" bash -c 'command -v docker || { echo "Docker CLI is not installed. Install Docker Desktop or Docker Engine." >&2; exit 127; }'
  run_step "Read Docker CLI version" docker --version
  info "$STEP_OUTPUT"
  run_step "Verify Docker Engine is running and reachable" docker info --format '{{.ServerVersion}}'
  info "Docker Engine version: ${STEP_OUTPUT}"
  run_step "Verify HTTP readiness probe utility" bash -c 'command -v curl'
  run_step "Verify JSON/text processing utilities" bash -c 'command -v awk && command -v sed && command -v grep'

  if command -v openssl >/dev/null 2>&1; then
    info "OpenSSL is available for secure random key generation."
  elif command -v python3 >/dev/null 2>&1; then
    warning "OpenSSL is not installed; Python's secrets module will generate the master key."
  else
    warning "OpenSSL and Python are unavailable; the kernel entropy source will be used if supported."
  fi
}

discover_docker_socket() {
  local context_host="" candidate=""
  local candidates=()

  print_section "3/8  ·  Docker socket discovery"

  if [[ -n "${DOCKER_SOCKET:-}" ]]; then candidates+=("$DOCKER_SOCKET"); fi
  if [[ "${DOCKER_HOST:-}" == unix://* ]]; then candidates+=("${DOCKER_HOST#unix://}"); fi

  if [[ -z "${DOCKER_HOST:-}" ]] && command -v docker >/dev/null 2>&1 && docker context show >/dev/null 2>&1; then
    context_host="$(docker context inspect "$(docker context show)" --format '{{.Endpoints.docker.Host}}' 2>/dev/null || true)"
    if [[ -n "$context_host" && "$context_host" != unix://* ]]; then
      die "The active Docker context uses a remote endpoint (${context_host}). PortGrid requires a local Unix socket; switch to a local context or set DOCKER_SOCKET to a local socket."
    fi
    if [[ "$context_host" == unix://* ]]; then candidates+=("${context_host#unix://}"); fi
  fi

  candidates+=(
    "/var/run/docker.sock"
    "${HOME:-}/.docker/run/docker.sock"
    "${HOME:-}/.orbstack/run/docker.sock"
    "${HOME:-}/.colima/default/docker.sock"
    "/run/user/${UID:-1000}/podman/podman.sock"
  )

  if [[ -n "${DOCKER_HOST:-}" && "$DOCKER_HOST" != unix://* ]]; then
    die "DOCKER_HOST points to a non-Unix endpoint. PortGrid needs a local Unix socket mounted into its container."
  fi

  run_step "Locate a usable local Docker socket" bash -c '
    for p in "$@"; do
      if [ -n "$p" ] && [ -S "$p" ]; then printf "%s\n" "$p"; exit 0; fi
    done
    exit 1
  ' portgrid-socket-check "${candidates[@]}" || die "No local Docker socket was found. Set DOCKER_SOCKET to the active Docker socket path."

  DETECTED_DOCKER_SOCKET="$STEP_OUTPUT"
  [[ -S "$DETECTED_DOCKER_SOCKET" ]] || die "Selected Docker socket is not a Unix socket: ${DETECTED_DOCKER_SOCKET}"
  info "Docker socket: ${DETECTED_DOCKER_SOCKET}"
  warning "Mounting the Docker socket gives PortGrid powerful control over the host Docker Engine. Deploy only a trusted image."
}

configure_master_key() {
  local master_key="" tmp_file

  print_section "4/8  ·  Secure configuration"
  run_step "Create private PortGrid configuration directory" mkdir -p "$PORTGRID_CONFIG_DIR"
  chmod 700 "$PORTGRID_CONFIG_DIR"

  if [[ -f "$PORTGRID_ENV_FILE" ]]; then
    run_step "Read existing PortGrid master key" awk -F= '$1 == "PORTGRID_MASTER_KEY" { print substr($0, index($0, "=") + 1); exit }' "$PORTGRID_ENV_FILE"
    master_key="$STEP_OUTPUT"
    master_key="$(printf '%s' "$master_key" | tr -d '\r\n')"
  fi

  if [[ -n "$master_key" ]]; then
    [[ "$master_key" =~ ^[[:xdigit:]]{64}$ ]] || die "The existing master key in ${PORTGRID_ENV_FILE} is not a valid 64-character hex key. Back up and repair the file before continuing."
    info "Reusing existing 256-bit master key. The key will not be printed."
  else
    run_step "Generate a 256-bit cryptographic master key" bash -c '
      if command -v openssl >/dev/null 2>&1; then openssl rand -hex 32
      elif command -v python3 >/dev/null 2>&1; then python3 -c "import secrets; print(secrets.token_hex(32))"
      else head -c 32 /dev/urandom | od -An -tx1 | tr -d " \\n"
      fi
    '
    master_key="$(printf '%s' "$STEP_OUTPUT" | tr -d '[:space:]')"
    [[ "$master_key" =~ ^[[:xdigit:]]{64}$ ]] || die "Could not generate a valid 256-bit master key."
    info "Generated a new 256-bit master key. The key will not be printed."
  fi

  tmp_file="${PORTGRID_ENV_FILE}.tmp.$$"
  if [[ -f "$PORTGRID_ENV_FILE" ]]; then
    awk '!/^(PORTGRID_MASTER_KEY|PORTGRID_PORT|PORTGRID_BIND_ADDRESS|PORTGRID_URL|PORTGRID_IMAGE|PORTGRID_VOLUME|PORTGRID_CONTAINER)=/' "$PORTGRID_ENV_FILE" >"$tmp_file"
  else
    : >"$tmp_file"
  fi
  printf '\n# PortGrid deployment configuration. Keep this file private.\n' >>"$tmp_file"
  printf 'PORTGRID_MASTER_KEY=%s\n' "$master_key" >>"$tmp_file"
  printf 'PORTGRID_PORT=%s\n' "$PORTGRID_PORT" >>"$tmp_file"
  printf 'PORTGRID_BIND_ADDRESS=%s\n' "$PORTGRID_BIND_ADDRESS" >>"$tmp_file"
  printf 'PORTGRID_URL=%s\n' "$PORTGRID_URL" >>"$tmp_file"
  printf 'PORTGRID_IMAGE=%s\n' "$PORTGRID_IMAGE" >>"$tmp_file"
  printf 'PORTGRID_VOLUME=%s\n' "$PORTGRID_VOLUME" >>"$tmp_file"
  printf 'PORTGRID_CONTAINER=%s\n' "$PORTGRID_CONTAINER" >>"$tmp_file"
  chmod 600 "$tmp_file"
  mv -f "$tmp_file" "$PORTGRID_ENV_FILE"
  chmod 600 "$PORTGRID_ENV_FILE"

  local container_env_tmp="${PORTGRID_CONTAINER_ENV_FILE}.tmp.$$"
  {
    printf 'NODE_ENV=production\n'
    printf 'PORT=3000\n'
    printf 'DATA_DIR=/app/data\n'
    printf 'PORTGRID_MASTER_KEY=%s\n' "$master_key"
  } > "$container_env_tmp"
  chmod 600 "$container_env_tmp"
  mv -f "$container_env_tmp" "$PORTGRID_CONTAINER_ENV_FILE"
  chmod 600 "$PORTGRID_CONTAINER_ENV_FILE"

  # The key is consumed from the mode-0600 env file by Docker. Do not export it
  # into the installer process environment or expose it in the docker CLI args.
  unset master_key
  success "Private configuration is stored with restrictive permissions"
  info "Key file: ${PORTGRID_ENV_FILE} (mode 0600)"
}

configure_storage_volume() {
  local volumes=""
  print_section "5/8  ·  Persistent storage"
  run_step "Inspect existing Docker volumes" docker volume ls --format '{{.Name}}'
  volumes="$STEP_OUTPUT"
  if printf '%s\n' "$volumes" | grep -Fxq "$PORTGRID_VOLUME"; then
    success "Persistent volume '${PORTGRID_VOLUME}' already exists; existing data will be retained"
  else
    run_step "Create persistent Docker volume '${PORTGRID_VOLUME}'" docker volume create "$PORTGRID_VOLUME"
    info "Created volume: ${STEP_OUTPUT}"
  fi
}

check_existing_container() {
  local containers=""
  run_step "Inspect PortGrid container inventory" docker ps -a --format '{{.Names}}'
  containers="$STEP_OUTPUT"
  if printf '%s\n' "$containers" | grep -Fxq "$PORTGRID_CONTAINER"; then
    EXISTING_CONTAINER=1
    info "An existing container named '${PORTGRID_CONTAINER}' will be replaced if deployment proceeds."
  else
    EXISTING_CONTAINER=0
    info "No existing container named '${PORTGRID_CONTAINER}' was found."
  fi
}

check_port_availability() {
  local port_owner="" current_owner="" in_use=0
  print_section "6/8  ·  Network preflight"

  run_step "Inspect container port bindings" docker ps --filter "publish=${PORTGRID_PORT}" --format '{{.Names}}'
  port_owner="$(printf '%s\n' "$STEP_OUTPUT" | grep -vFx "$PORTGRID_CONTAINER" | head -n 1 || true)"
  if [[ -n "$port_owner" ]]; then
    die "Host port ${PORTGRID_PORT} is published by container '${port_owner}'. Choose another PORTGRID_PORT."
  fi

  if command -v lsof >/dev/null 2>&1; then
    run_step "Check whether host port ${PORTGRID_PORT} is listening" bash -c '
      if lsof -nP -iTCP:"$1" -sTCP:LISTEN >/dev/null 2>&1; then printf "IN_USE\n"; else printf "FREE\n"; fi
    ' _ "$PORTGRID_PORT"
    [[ "$STEP_OUTPUT" == *IN_USE* ]] && in_use=1
  elif command -v nc >/dev/null 2>&1; then
    run_step "Probe localhost port ${PORTGRID_PORT}" bash -c '
      if nc -z 127.0.0.1 "$1" >/dev/null 2>&1; then printf "IN_USE\n"; else printf "FREE\n"; fi
    ' _ "$PORTGRID_PORT"
    [[ "$STEP_OUTPUT" == *IN_USE* ]] && in_use=1
  else
    warning "Neither lsof nor nc is available; Docker will perform the final port-binding check."
  fi

  if (( in_use == 1 )); then
    run_step "Identify the current PortGrid container" docker ps --filter "name=^/${PORTGRID_CONTAINER}$" --format '{{.Names}}'
    current_owner="$STEP_OUTPUT"
    if [[ "$current_owner" == "$PORTGRID_CONTAINER" ]]; then
      info "Port ${PORTGRID_PORT} is currently used by the PortGrid container that may be replaced."
    else
      die "Host port ${PORTGRID_PORT} is already in use by another process. Set PORTGRID_PORT to a free port."
    fi
  else
    success "Host port ${PORTGRID_PORT} is available on ${PORTGRID_BIND_ADDRESS}"
  fi
}

confirm_deployment() {
  print_section "Deployment confirmation"
  printf '  Image:        %s\n' "$PORTGRID_IMAGE"
  printf '  Container:    %s\n' "$PORTGRID_CONTAINER"
  printf '  Dashboard:    %s\n' "$PORTGRID_DASHBOARD_URL"
  printf '  Bind address: %s:%s\n' "$PORTGRID_BIND_ADDRESS" "$PORTGRID_PORT"
  printf '  Data volume:  %s (preserved on container replacement)\n' "$PORTGRID_VOLUME"
  printf '  Socket:       %s\n' "$DETECTED_DOCKER_SOCKET"
  [[ -n "$PORTGRID_MEMORY_LIMIT" ]] && printf '  Memory limit: %s\n' "$PORTGRID_MEMORY_LIMIT"
  [[ -n "$PORTGRID_CPU_LIMIT" ]] && printf '  CPU limit:    %s\n' "$PORTGRID_CPU_LIMIT"
  printf '\n'
  warning "The image will receive access to the host Docker socket. This is a high-trust permission."
  if [[ "$PORTGRID_BIND_ADDRESS" == "0.0.0.0" ]]; then
    warning "The service will listen on all IPv4 interfaces, not only localhost."
  fi
  if (( EXISTING_CONTAINER == 1 )); then
    warning "An existing PortGrid container will be stopped and renamed as a rollback backup."
  fi
  confirm "Proceed with PortGrid deployment" || return 1
}


pull_docker_image() {
  print_section "7/8  ·  Image retrieval"
  run_step "Pull PortGrid image ${PORTGRID_IMAGE}" docker pull "$PORTGRID_IMAGE"
  if [[ "$STEP_OUTPUT" == *"Downloaded newer image"* ]]; then
    info "A newer image was downloaded."
  elif [[ "$STEP_OUTPUT" == *"Image is up to date"* ]]; then
    info "The local image is already up to date."
  fi
}

rollback_previous_container() {
  local reason="${1:-deployment failure}"
  warning "Attempting recovery after ${reason}..."

  if docker container inspect "$PORTGRID_CONTAINER" >/dev/null 2>&1; then
    if (( NEW_CONTAINER_CREATED == 1 )) || [[ -n "$BACKUP_CONTAINER" ]]; then
      docker stop --time "$PORTGRID_STOP_TIMEOUT" "$PORTGRID_CONTAINER" >/dev/null 2>&1 || true
      docker rm -f "$PORTGRID_CONTAINER" >/dev/null 2>&1 || true
      NEW_CONTAINER_CREATED=0
    fi
  fi

  if [[ -z "$BACKUP_CONTAINER" ]]; then
    info "No previous container backup exists. Failed new container, if any, has been removed; persistent volume is retained."
    return 0
  fi

  if docker container inspect "$BACKUP_CONTAINER" >/dev/null 2>&1; then
    docker rename "$BACKUP_CONTAINER" "$PORTGRID_CONTAINER" || return 1
    if docker start "$PORTGRID_CONTAINER" >/dev/null; then
      success "Previous PortGrid container restored and started."
      BACKUP_CONTAINER=""
      return 0
    fi
    error "Previous container was restored by name but could not be started."
  fi
  return 1
}


launch_container() {
  local container_id="" backup_name=""
  local -a docker_args=()
  print_section "8/8  ·  Container deployment"

  if (( EXISTING_CONTAINER == 1 )); then
    backup_name="${PORTGRID_CONTAINER}.backup.$(date '+%Y%m%d%H%M%S').$$"
    run_step "Inspect previous container state" docker inspect --format '{{.State.Running}}' "$PORTGRID_CONTAINER"
    if [[ "$STEP_OUTPUT" == "true" ]]; then
      run_step "Stop previous PortGrid container gracefully" docker stop --time "$PORTGRID_STOP_TIMEOUT" "$PORTGRID_CONTAINER"
    else
      info "Previous container is already stopped; no stop action is needed."
    fi
    if ! run_step "Preserve previous container as ${backup_name}" docker rename "$PORTGRID_CONTAINER" "$backup_name"; then
      docker start "$PORTGRID_CONTAINER" >/dev/null 2>&1 || true
      die "Could not preserve the existing container. Attempted to restart it; deployment was cancelled."
    fi
    BACKUP_CONTAINER="$backup_name"
  fi

  docker_args=(
    run -d
    --name "$PORTGRID_CONTAINER"
    --restart "$PORTGRID_RESTART_POLICY"
    --init
    --stop-timeout "$PORTGRID_STOP_TIMEOUT"
    --security-opt no-new-privileges:true
    --cap-drop ALL
    --pids-limit "$PORTGRID_PIDS_LIMIT"
    --log-driver json-file
    --log-opt "max-size=${PORTGRID_LOG_MAX_SIZE}"
    --log-opt "max-file=${PORTGRID_LOG_MAX_FILES}"
    --label "io.portgrid.managed=true"
    --label "io.portgrid.version=${SCRIPT_VERSION}"
    -p "${PORTGRID_BIND_ADDRESS}:${PORTGRID_PORT}:3000"
    --env-file "$PORTGRID_CONTAINER_ENV_FILE"
    -v "${DETECTED_DOCKER_SOCKET}:/var/run/docker.sock"
    -v "${PORTGRID_VOLUME}:/app/data"
  )
  [[ -n "$PORTGRID_MEMORY_LIMIT" ]] && docker_args+=(--memory "$PORTGRID_MEMORY_LIMIT")
  [[ -n "$PORTGRID_CPU_LIMIT" ]] && docker_args+=(--cpus "$PORTGRID_CPU_LIMIT")
  docker_args+=("$PORTGRID_IMAGE")

  if ! run_step "Create and start the new PortGrid container" docker "${docker_args[@]}"; then
    rollback_previous_container "container launch failure" || true
    die "Docker could not launch PortGrid. Review the error above."
  fi

  container_id="$STEP_OUTPUT"
  NEW_CONTAINER_CREATED=1
  info "Container ID: ${container_id:0:12}"
  if [[ -n "$BACKUP_CONTAINER" ]]; then
    info "Previous container retained as rollback backup: ${BACKUP_CONTAINER}"
  fi
}


verify_readiness() {
  local target_url="$PORTGRID_READY_URL"
  local output=""

  print_section "Readiness verification"
  info "Waiting up to ${PORTGRID_HEALTH_TIMEOUT}s for ${target_url}"

  if run_step "Wait for PortGrid API readiness" bash -c '
    url="$1"
    timeout="$2"
    attempt=1
    start_time=$(date +%s)
    deadline=$((start_time + timeout))
    while [ "$(date +%s)" -lt "$deadline" ]; do
      if curl --connect-timeout 1 --max-time 2 -fsS "$url" >/dev/null 2>&1; then
        printf "Ready after %s probe(s)\n" "$attempt"
        exit 0
      fi
      sleep 1
      attempt=$((attempt + 1))
    done
    echo "API did not become ready within ${timeout}s" >&2
    exit 1
  ' portgrid-health "$target_url" "$PORTGRID_HEALTH_TIMEOUT"; then
    output="$STEP_OUTPUT"
    success "PortGrid API is responding (${output})."
    return 0
  fi

  error "PortGrid did not become ready within ${PORTGRID_HEALTH_TIMEOUT}s."
  info "Recent container logs follow:"
  docker logs --tail 60 "$PORTGRID_CONTAINER" 2>&1 || true
  return 1
}


print_summary() {
  print_section "PortGrid deployment summary"
  printf '  Status:          %sACTIVE AND READY%s\n' "$C_GREEN" "$C_RESET"
  printf '  Dashboard:       %s\n' "$PORTGRID_DASHBOARD_URL"
  printf '  API:             %s\n' "$PORTGRID_API_URL"
  printf '  Bind address:    %s:%s\n' "$PORTGRID_BIND_ADDRESS" "$PORTGRID_PORT"
  printf '  Readiness URL:   %s\n' "$PORTGRID_READY_URL"
  printf '  Container:       %s\n' "$PORTGRID_CONTAINER"
  printf '  Image:           %s\n' "$PORTGRID_IMAGE"
  printf '  Docker socket:   %s\n' "$DETECTED_DOCKER_SOCKET"
  printf '  Data volume:     %s\n' "$PORTGRID_VOLUME"
  printf '  Config file:     %s (mode 0600)\n' "$PORTGRID_ENV_FILE"
  printf '  Runtime env:     %s (mode 0600; contains the app master key)\n' "$PORTGRID_CONTAINER_ENV_FILE"
  if [[ -n "$BACKUP_CONTAINER" ]]; then
    printf '  Rollback image:  %s (stopped; remove when no longer needed)\n' "$BACKUP_CONTAINER"
  fi
  printf '\n  Operational commands:\n'
  printf '    View logs:      docker logs -f %s\n' "$PORTGRID_CONTAINER"
  printf '    Check status:   ./deploy.sh --status\n'
  printf '    Stop:           ./deploy.sh --stop\n'
  printf '    Restart:        docker restart %s\n' "$PORTGRID_CONTAINER"
  if [[ -n "$BACKUP_CONTAINER" ]]; then
    printf '    Remove backup:  docker rm %s\n' "$BACKUP_CONTAINER"
  fi
}


show_help() {
  cat <<EOF
PortGrid Deployment Installer v${SCRIPT_VERSION}

Usage: ./deploy.sh [OPTIONS]

Options:
  --image IMAGE          Docker image reference to deploy
  --url URL              Advertised dashboard URL (for example https://portgrid.example.com)
  --bind-address IPv4    Host address to publish (default: 127.0.0.1; use 0.0.0.0 to expose interfaces)
  --port PORT            Host port (default: 3000)
  --health-url URL       Explicit readiness endpoint URL; otherwise derived automatically
  --health-path PATH     Readiness path (default: /api/services)
  --container NAME       Container name
  --volume NAME          Persistent volume name
  --yes, -y              Skip interactive confirmations (for intentional automation)
  --dry-run              Run preflight checks but do not create, pull, or replace resources
  --check                Run preflight checks, then exit
  --status               Show PortGrid container status
  --logs                 Follow PortGrid container logs
  --stop                 Stop PortGrid while retaining its container and data volume
  --remove               Remove PortGrid container after confirmation; retain data volume
  --version              Show installer version
  --help, -h             Show this help

Environment overrides:
  PORTGRID_IMAGE             Image reference (default: ${DEFAULT_IMAGE}; CLI --image overrides it)
  PORTGRID_URL               Advertised dashboard URL; PORTGRID_PUBLIC_URL is an alias
  PORTGRID_BIND_ADDRESS      IPv4 host binding (default: 127.0.0.1)
  PORTGRID_PORT              Host dashboard port (default: 3000)
  PORTGRID_HEALTH_URL        Explicit readiness endpoint URL
  PORTGRID_HEALTH_PATH       Readiness path (default: /api/services)
  PORTGRID_CONTAINER         Container name (default: portgrid)
  PORTGRID_VOLUME            Persistent volume (default: portgrid_data)
  PORTGRID_CONFIG_DIR        Private config directory (default: ~/.portgrid)
  PORTGRID_MEMORY_LIMIT      Optional container memory limit, such as 1g
  PORTGRID_CPU_LIMIT         Optional CPU quota, such as 1.5
  PORTGRID_PIDS_LIMIT        Container PID limit (default: 256)
  PORTGRID_LOG_MAX_SIZE      Per-file JSON log limit (default: 10m)
  PORTGRID_LOG_MAX_FILES     Retained JSON log files (default: 3)
  PORTGRID_RESTART_POLICY    no, always, unless-stopped, on-failure[:N]
  PORTGRID_STEP_DELAY        Minimum animated duration per check, 0.1-5 seconds (default: 0.5)
  PORTGRID_HEALTH_TIMEOUT    API readiness timeout in seconds (default: 30)
  PORTGRID_STOP_TIMEOUT      Docker graceful stop timeout in seconds (default: 20)
  DOCKER_SOCKET              Explicit local Docker Unix socket path
  PORTGRID_NO_ANIMATION=1    Disable spinner animation
  NO_COLOR=1                 Disable terminal colors

Examples:
  ./deploy.sh
  ./deploy.sh --image ghcr.io/example/portgrid:1.2.3
  ./deploy.sh --image ghcr.io/example/portgrid:1.2.3 --url https://portgrid.example.com
  ./deploy.sh --bind-address 0.0.0.0 --url https://portgrid.example.com --port 3000
  PORTGRID_PORT=3001 ./deploy.sh
  PORTGRID_MEMORY_LIMIT=1g PORTGRID_CPU_LIMIT=2 ./deploy.sh
  ./deploy.sh --dry-run
  ./deploy.sh --yes --image ghcr.io/example/portgrid:1.2.3

Notes:
  - With the default loopback binding, PortGrid is only reachable from the host.
  - For external access, configure the bind address, firewall, and reverse proxy intentionally.
  - --url changes the displayed/advertised URL; it does not itself publish network ports.
  - The readiness URL is a separate health endpoint and defaults to a local check.
EOF
}


parse_arguments() {
  local arg value action_count=0
  while (($#)); do
    arg="$1"
    case "$arg" in
      --help|-h|--version)
        (( action_count += 1 ))
        (( action_count <= 1 )) || die "Only one operational action may be specified."
        if [[ "$arg" == "--version" ]]; then ACTION="version"; else ACTION="help"; fi
        shift ;;
      --yes|-y) ASSUME_YES=1; shift ;;
      --dry-run) DRY_RUN=1; shift ;;
      --check|--status|--logs|--stop|--remove)
        (( action_count += 1 ))
        (( action_count <= 1 )) || die "Only one operational action may be specified."
        ACTION="${arg#--}"; shift ;;
      --image|--url|--public-url|--bind-address|--bind|--port|--health-url|--health-path|--container|--volume)
        (($# >= 2)) || die "${arg} requires a value. Use --help for usage."
        value="$2"
        case "$arg" in
          --image) PORTGRID_IMAGE="$value" ;;
          --url|--public-url) PORTGRID_URL="$value" ;;
          --bind-address|--bind) PORTGRID_BIND_ADDRESS="$value" ;;
          --port) PORTGRID_PORT="$value" ;;
          --health-url) PORTGRID_HEALTH_URL="$value" ;;
          --health-path) PORTGRID_HEALTH_PATH="$value" ;;
          --container) PORTGRID_CONTAINER="$value" ;;
          --volume) PORTGRID_VOLUME="$value" ;;
        esac
        shift 2 ;;
      --image=*) PORTGRID_IMAGE="${arg#*=}"; shift ;;
      --url=*|--public-url=*) PORTGRID_URL="${arg#*=}"; shift ;;
      --bind-address=*|--bind=*) PORTGRID_BIND_ADDRESS="${arg#*=}"; shift ;;
      --port=*) PORTGRID_PORT="${arg#*=}"; shift ;;
      --health-url=*) PORTGRID_HEALTH_URL="${arg#*=}"; shift ;;
      --health-path=*) PORTGRID_HEALTH_PATH="${arg#*=}"; shift ;;
      --container=*) PORTGRID_CONTAINER="${arg#*=}"; shift ;;
      --volume=*) PORTGRID_VOLUME="${arg#*=}"; shift ;;
      *) die "Unknown argument: ${arg}. Use --help for usage." ;;
    esac
  done
}


run_operation() {
  require_command docker
  run_step "Verify Docker Engine connectivity" docker info --format '{{.ServerVersion}}'
  case "$ACTION" in
    status)
      docker ps -a --filter "name=^/${PORTGRID_CONTAINER}$" --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
      ;;
    logs)
      exec docker logs -f "$PORTGRID_CONTAINER"
      ;;
    stop)
      if docker container inspect "$PORTGRID_CONTAINER" >/dev/null 2>&1; then
        docker stop --time "$PORTGRID_STOP_TIMEOUT" "$PORTGRID_CONTAINER"
        info "Container stopped. Its container metadata and persistent volume remain intact."
      else
        info "No PortGrid container named '${PORTGRID_CONTAINER}' exists."
      fi
      ;;
    remove)
      if ! docker container inspect "$PORTGRID_CONTAINER" >/dev/null 2>&1; then
        info "No PortGrid container named '${PORTGRID_CONTAINER}' exists."
        return 0
      fi
      confirm "Remove container '${PORTGRID_CONTAINER}' (the persistent volume will be retained)" || exit 0
      docker rm -f "$PORTGRID_CONTAINER"
      success "Container removed. Persistent volume '${PORTGRID_VOLUME}' was retained."
      ;;
    *) die "Unsupported operational action: ${ACTION}" ;;
  esac
}

main() {
  load_saved_settings
  parse_arguments "$@"
  print_banner

  if [[ "$ACTION" == "help" ]]; then show_help; return 0; fi
  if [[ "$ACTION" == "version" ]]; then printf '%s %s\n' "$APP_NAME" "$SCRIPT_VERSION"; return 0; fi

  if [[ "$ACTION" == "status" || "$ACTION" == "logs" || "$ACTION" == "stop" || "$ACTION" == "remove" ]]; then
    TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/portgrid-deploy.XXXXXX")"
    run_operation
    return 0
  fi

  TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/portgrid-deploy.XXXXXX")"
  validate_configuration
  resolve_urls
  check_system_resources
  check_software_prerequisites
  discover_docker_socket
  check_existing_container
  check_port_availability

  if [[ "$ACTION" == "check" || "$DRY_RUN" == "1" ]]; then
    print_section "Preflight result"
    success "Preflight checks passed. No deployment changes were made."
    return 0
  fi

  if ! confirm_deployment; then
    if [[ -t 0 && "$ASSUME_YES" == "0" ]]; then
      return 0
    fi
    die "Deployment was not confirmed. Re-run interactively or pass --yes for intentional automation."
  fi
  configure_master_key
  configure_storage_volume
  pull_docker_image
  launch_container

  if ! verify_readiness; then
    rollback_previous_container "readiness verification failure" || true
    die "Deployment failed readiness verification. Review the logs above before retrying."
  fi

  print_summary
}

main "$@"
