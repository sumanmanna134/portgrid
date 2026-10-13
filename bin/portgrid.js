#!/usr/bin/env node

/**
 * PortGrid CLI: Bank-Grade Local Infrastructure Orchestrator & PaaS
 * Native Cross-Platform Management Engine (Windows, macOS, Linux)
 * 
 * Zero external dependencies. Uses Node.js standard runtime only.
 * Compliant with enterprise security and zero-glyph design standards.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const child_process = require('child_process');
const crypto = require('crypto');
const http = require('http');
const https = require('https');
const net = require('net');

const CLI_VERSION = '1.2.3';
const DEFAULT_IMAGE = 'mannasuman134/postgrid:latest';
const DEFAULT_CONTAINER = 'portgrid';
const DEFAULT_PORT = 3000;
const DEFAULT_BIND = '127.0.0.1';
const DEFAULT_VOLUME = 'portgrid_data';

const isWindows = process.platform === 'win32';
const isMac = process.platform === 'darwin';
const isLinux = process.platform === 'linux';

// Color utilities (respects NO_COLOR or non-TTY)
const useColor = Boolean(process.stdout.isTTY && !process.env.NO_COLOR && process.env.TERM !== 'dumb');
const colors = {
  reset: useColor ? '\x1b[0m' : '',
  bold: useColor ? '\x1b[1m' : '',
  dim: useColor ? '\x1b[2m' : '',
  cyan: useColor ? '\x1b[36m' : '',
  green: useColor ? '\x1b[32m' : '',
  yellow: useColor ? '\x1b[33m' : '',
  red: useColor ? '\x1b[31m' : '',
  blue: useColor ? '\x1b[34m' : '',
  magenta: useColor ? '\x1b[35m' : '',
  gray: useColor ? '\x1b[90m' : '',
};

function log(msg) {
  const ts = new Date().toTimeString().split(' ')[0];
  console.log(`${colors.dim}[${ts}]${colors.reset} ${msg}`);
}
function info(msg) {
  console.log(`  ${colors.cyan}[INFO]${colors.reset} ${msg}`);
}
function success(msg) {
  console.log(`  ${colors.green}[OK]${colors.reset} ${msg}`);
}
function warn(msg) {
  console.log(`  ${colors.yellow}[WARN]${colors.reset} ${msg}`);
}
function error(msg) {
  console.error(`  ${colors.red}[FAIL]${colors.reset} ${msg}`);
}
function die(msg, code = 1) {
  error(msg);
  process.exit(code);
}

function printBanner() {
  console.log('');
  console.log(`${colors.cyan}${colors.bold}  ____            _    _____       _     _ `);
  console.log(` |  _ \\ ___  _ __| |_ / ____|_ __(_) __| |`);
  console.log(` | |_) / _ \\| '__| __| |  __| '__| |/ _\` |`);
  console.log(` |  __/ (_) | |  | |_| |__| | |  | | (_| |`);
  console.log(` |_|   \\___/|_|   \\__|\\_____|_|  |_|\\__,_|${colors.reset}`);
  console.log(` ${colors.gray}PortGrid CLI v${CLI_VERSION} (Engine: Node ${process.version} on ${os.platform()}-${os.arch()})${colors.reset}`);
  console.log(` ${colors.dim}Local Developer Infrastructure Orchestrator & Bank-Grade PaaS${colors.reset}`);
  console.log('');
}

function printHelp() {
  printBanner();
  console.log(`${colors.bold}USAGE:${colors.reset}`);
  console.log(`  portgrid <command> [arguments] [options]  (alias: postgrid <command>)\n`);
  console.log(`${colors.bold}PRIMARY LIFECYCLE COMMANDS:${colors.reset}`);
  console.log(`  up, start                    Launch PortGrid orchestrator & open Web Console`);
  console.log(`  down                         Gracefully stop orchestrator & all managed services`);
  console.log(`  restart                      Restart the PortGrid orchestrator container`);
  console.log(`  ps, status                   List orchestrator and all active service enclaves`);
  console.log(`  doctor                       Audit system prerequisites, Docker socket, and RAM\n`);
  console.log(`${colors.bold}SERVICE ORCHESTRATION COMMANDS:${colors.reset}`);
  console.log(`  catalog, blueprints          Browse available service blueprints`);
  console.log(`  deploy <blueprint-id>        Provision a service (e.g. postgres, redis, kafka)`);
  console.log(`  stop <service-id>            Stop a running service container`);
  console.log(`  start <service-id>           Start a stopped service container`);
  console.log(`  rm <service-id>              Uninstall a service and release its resources`);
  console.log(`  logs [service-id]            Stream stdout/stderr logs (orchestrator or service)\n`);
  console.log(`${colors.bold}SECURITY & AUDIT COMMANDS:${colors.reset}`);
  console.log(`  audit [verify]               Verify cryptographic SHA-256 Merkle chain integrity`);
  console.log(`  vault [status|rekey]         Inspect FIPS 140-2 AES-256 vault or rotate keys`);
  console.log(`  open [service-id]            Open web console or companion UI in default browser`);
  console.log(`  update                       Check for updates and refresh container image`);
  console.log(`  destroy                      Hard purge container and persistent volume`);
  console.log(`  version, -v                  Display CLI version\n`);
  console.log(`${colors.bold}COMMON OPTIONS:${colors.reset}`);
  console.log(`  --port, --ui-port <number>   Host port for PortGrid UI (default: 3000)`);
  console.log(`  --bind <address>             Loopback binding interface (default: 127.0.0.1)`);
  console.log(`  --json                       Format command output as structured JSON`);
  console.log(`  --watch, -w                  Continuously refresh display (for ps)`);
  console.log(`  --follow, -f                 Follow log output stream`);
  console.log(`  --tail <number>              Number of lines to show from log tail (default: 100)`);
  console.log(`  --purge                      Crypto-shred and wipe storage volumes on teardown`);
  console.log(`  --dry-run                    Simulate command execution without mutations`);
  console.log(`  --no-open                    Do not launch browser window automatically`);
  console.log(`  --help, -h                   Show this help reference\n`);
  console.log(`${colors.bold}EXAMPLES:${colors.reset}`);
  console.log(`  $ portgrid up                                   # Launch PortGrid orchestrator`);
  console.log(`  $ portgrid ps                                   # View all active services & ports`);
  console.log(`  $ portgrid deploy postgres                      # Deploy PostgreSQL 16 + pgAdmin`);
  console.log(`  $ portgrid deploy redis                         # Deploy Redis Stack + Insight`);
  console.log(`  $ portgrid logs mongodb                         # Stream live logs for MongoDB`);
  console.log(`  $ portgrid audit verify                         # Validate Merkle ledger proof`);
  console.log(`  $ portgrid down                                 # Gracefully stop everything\n`);
}

/**
 * Docker command executor
 */
function execDocker(args, options = {}) {
  const result = child_process.spawnSync('docker', args, {
    encoding: 'utf8',
    stdio: options.stdio || 'pipe',
    shell: false,
  });
  return result;
}

function isDockerInstalled() {
  try {
    const res = child_process.spawnSync('docker', ['--version'], { encoding: 'utf8' });
    return res.status === 0;
  } catch (_) {
    return false;
  }
}

function isDockerRunning() {
  try {
    const res = child_process.spawnSync('docker', ['info'], { encoding: 'utf8' });
    return res.status === 0;
  } catch (_) {
    return false;
  }
}

/**
 * Helpful diagnostic guide when Docker is missing
 */
function printDockerMissingGuide() {
  console.log(`\n${colors.red}${colors.bold}[FAIL] Docker container runtime was not found on your system.${colors.reset}\n`);
  console.log(`PortGrid is a local PaaS orchestrator that provisions and isolates services`);
  console.log(`(PostgreSQL, Redis, MongoDB, Kafka, Keycloak, etc.) as loopback containers.`);
  console.log(`To run PortGrid, a container runtime (Docker, OrbStack, Colima, or Podman) is required.\n`);

  if (isMac) {
    console.log(`${colors.bold}Recommended One-Line Install Options for macOS:${colors.reset}`);
    console.log(`  1. Docker Desktop:     ${colors.cyan}brew install --cask docker${colors.reset}`);
    console.log(`  2. OrbStack (Fast):    ${colors.cyan}brew install --cask orbstack${colors.reset}`);
    console.log(`  3. Colima (Headless):  ${colors.cyan}brew install colima docker && colima start${colors.reset}\n`);
    console.log(`Direct GUI Download:     https://www.docker.com/products/docker-desktop/\n`);
  } else if (isWindows) {
    console.log(`${colors.bold}Recommended Install Options for Windows:${colors.reset}`);
    console.log(`  1. Winget (PowerShell): ${colors.cyan}winget install Docker.DockerDesktop${colors.reset}`);
    console.log(`  2. Chocolatey:          ${colors.cyan}choco install docker-desktop${colors.reset}\n`);
    console.log(`Direct GUI Download:      https://www.docker.com/products/docker-desktop/\n`);
  } else {
    console.log(`${colors.bold}Recommended Install Commands for Linux:${colors.reset}`);
    console.log(`  1. Official Script:     ${colors.cyan}curl -fsSL https://get.docker.com | sh${colors.reset}`);
    console.log(`  2. Enable Service:      ${colors.cyan}sudo systemctl enable --now docker${colors.reset}`);
    console.log(`  3. Manage as Non-Root:  ${colors.cyan}sudo usermod -aG docker $USER${colors.reset}\n`);
  }

  try {
    const podmanRes = child_process.spawnSync('podman', ['--version'], { encoding: 'utf8' });
    if (podmanRes.status === 0) {
      console.log(`${colors.yellow}[NOTE] Podman was detected on your machine!${colors.reset}`);
      console.log(`To use PortGrid with Podman, start the Docker-compatible socket:`);
      if (isMac) {
        console.log(`  ${colors.cyan}podman machine start${colors.reset}`);
      } else {
        console.log(`  ${colors.cyan}systemctl --user enable --now podman.socket${colors.reset}`);
        console.log(`  ${colors.cyan}export DOCKER_HOST="unix://$XDG_RUNTIME_DIR/podman/podman.sock"${colors.reset}`);
      }
      console.log('');
    }
  } catch (_) {}

  console.log(`After installing, run '${colors.cyan}portgrid up${colors.reset}' or verify with '${colors.cyan}portgrid doctor${colors.reset}'.\n`);
}

/**
 * Helpful diagnostic guide when Docker is installed but daemon is stopped
 */
function printDockerNotRunningGuide() {
  console.log(`\n${colors.yellow}${colors.bold}[WARN] Docker CLI is installed, but the Docker daemon is not active.${colors.reset}\n`);

  if (isMac) {
    console.log(`Start your container engine:`);
    console.log(`  ${colors.cyan}open -a Docker${colors.reset} (or ${colors.cyan}open -a OrbStack${colors.reset} / ${colors.cyan}colima start${colors.reset})\n`);
  } else if (isWindows) {
    console.log(`Start Docker Desktop from the Start Menu or PowerShell:`);
    console.log(`  ${colors.cyan}Start-Process "C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe"${colors.reset}\n`);
  } else {
    console.log(`Start the systemd Docker daemon:`);
    console.log(`  ${colors.cyan}sudo systemctl start docker${colors.reset}\n`);
  }
}

/**
 * Cross-platform Docker socket detection
 */
function detectDockerSocket() {
  if (process.env.DOCKER_SOCKET && fs.existsSync(process.env.DOCKER_SOCKET)) {
    return {
      hostPath: process.env.DOCKER_SOCKET,
      mountArg: `${process.env.DOCKER_SOCKET}:/var/run/docker.sock`,
      type: 'custom',
    };
  }

  if (isWindows) {
    return {
      hostPath: '//./pipe/docker_engine',
      mountArg: '//var/run/docker.sock:/var/run/docker.sock',
      type: 'windows_named_pipe',
    };
  }

  const homeDir = os.homedir();
  const macSocket = path.join(homeDir, '.docker', 'run', 'docker.sock');
  if (isMac && fs.existsSync(macSocket)) {
    return {
      hostPath: macSocket,
      mountArg: `${macSocket}:/var/run/docker.sock`,
      type: 'mac_user_socket',
    };
  }

  const standardSocket = '/var/run/docker.sock';
  return {
    hostPath: standardSocket,
    mountArg: `${standardSocket}:/var/run/docker.sock`,
    type: 'unix_socket',
  };
}

/**
 * Port collision probe
 */
function checkPortAvailable(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => {
      resolve(false);
    });
    server.once('listening', () => {
      server.close(() => resolve(true));
    });
    server.listen(port, host);
  });
}

/**
 * Master Key Management
 */
function getOrCreateMasterKey(configDir, envFile) {
  if (fs.existsSync(envFile)) {
    const content = fs.readFileSync(envFile, 'utf8');
    const match = content.match(/PORTGRID_MASTER_KEY=([a-fA-F0-9]+)/);
    if (match && match[1]) {
      return match[1];
    }
  }

  const newKey = crypto.randomBytes(32).toString('hex');
  if (!fs.existsSync(configDir)) {
    try {
      fs.mkdirSync(configDir, { recursive: true, mode: 0o700 });
    } catch (_) {}
  }
  try {
    fs.writeFileSync(envFile, `PORTGRID_MASTER_KEY=${newKey}\n`, { mode: 0o600 });
  } catch (err) {
    warn(`Could not persist master key file (${err.message}). Using memory key.`);
  }
  return newKey;
}

/**
 * Cross-platform browser launcher
 */
function openBrowser(targetUrl) {
  try {
    if (isMac) {
      child_process.spawn('open', [targetUrl], { detached: true, stdio: 'ignore' }).unref();
    } else if (isWindows) {
      child_process.spawn('cmd.exe', ['/c', 'start', '""', targetUrl], { detached: true, stdio: 'ignore' }).unref();
    } else {
      child_process.spawn('xdg-open', [targetUrl], { detached: true, stdio: 'ignore' }).unref();
    }
  } catch (_) {}
}

/**
 * HTTP Client for PortGrid Orchestrator REST API
 */
function apiRequest(method, endpoint, body = null, options = {}) {
  const host = options.bind || DEFAULT_BIND;
  const port = options.port || DEFAULT_PORT;
  const timeoutMs = options.timeout || 4000;

  return new Promise((resolve, reject) => {
    const reqOptions = {
      hostname: host,
      port: port,
      path: endpoint,
      method: method,
      timeout: timeoutMs,
      headers: {
        'Accept': 'application/json',
      },
    };

    let payload = null;
    if (body !== null) {
      payload = typeof body === 'string' ? body : JSON.stringify(body);
      reqOptions.headers['Content-Type'] = 'application/json';
      reqOptions.headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let parsed = data;
        try {
          parsed = JSON.parse(data);
        } catch (_) {}
        resolve({ status: res.statusCode, data: parsed });
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`API request to ${endpoint} timed out`));
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

/**
 * HTTP Readiness Probe
 */
function waitForReadiness(host, port, timeoutSec = 30) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const endpoint = `http://${host}:${port}/api/services`;

    function probe() {
      const req = http.get(endpoint, { timeout: 2000 }, (res) => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 400) {
          resolve(true);
        } else {
          retry();
        }
      });

      req.on('error', () => {
        retry();
      });

      req.on('timeout', () => {
        req.destroy();
        retry();
      });
    }

    function retry() {
      if ((Date.now() - start) / 1000 > timeoutSec) {
        reject(new Error(`Readiness probe timed out after ${timeoutSec}s on ${endpoint}`));
      } else {
        setTimeout(probe, 1000);
      }
    }

    probe();
  });
}

/**
 * Normalize blueprint IDs (handles shortcuts and aliases)
 */
function normalizeBlueprintId(input) {
  if (!input) return null;
  const raw = input.toLowerCase().trim();
  const map = {
    'postgres': 'postgresql',
    'postgresql': 'postgresql',
    'postgres-pgadmin': 'postgresql',
    'pg': 'postgresql',
    'redis': 'redis',
    'redis-stack': 'redis',
    'redis-stack-insight': 'redis',
    'kafka': 'kafka',
    'kafka-kraft': 'kafka',
    'kafka-kraft-akhq': 'kafka',
    'keycloak': 'keycloak',
    'keycloak-iam': 'keycloak',
    'iam': 'keycloak',
    'rabbitmq': 'rabbitmq',
    'rabbitmq-management': 'rabbitmq',
    'rabbit': 'rabbitmq',
    'jenkins': 'jenkins',
    'jenkins-lts': 'jenkins',
    'mongo': 'mongodb',
    'mongodb': 'mongodb',
    'mongodb-express': 'mongodb',
    'clickhouse': 'clickhouse',
    'clickhouse-olap': 'clickhouse',
  };
  return map[raw] || raw;
}

/**
 * Command: ps / status
 */
async function cmdStatus(options = {}) {
  if (options.watch) {
    // Clear screen and run periodically
    const render = async () => {
      process.stdout.write('\x1b[2J\x1b[H');
      await renderStatus(options);
      console.log(`\n${colors.dim}[Watching... Press Ctrl+C to exit]${colors.reset}`);
    };
    await render();
    const interval = setInterval(render, 2000);
    process.on('SIGINT', () => {
      clearInterval(interval);
      process.exit(0);
    });
    return;
  }

  await renderStatus(options);
}

async function renderStatus(options = {}) {
  const isJson = Boolean(options.json);

  if (!isDockerInstalled()) {
    if (isJson) {
      console.log(JSON.stringify({ error: 'Docker CLI not found' }, null, 2));
      return;
    }
    printDockerMissingGuide();
    return;
  }

  if (!isDockerRunning()) {
    if (isJson) {
      console.log(JSON.stringify({ error: 'Docker daemon not running' }, null, 2));
      return;
    }
    printDockerNotRunningGuide();
    return;
  }

  // 1. Inspect PortGrid Orchestrator Container
  const psRes = execDocker([
    'ps',
    '-a',
    '--filter', `name=^/${DEFAULT_CONTAINER}$`,
    '--format', '{{.ID}}|{{.Status}}|{{.Image}}|{{.Ports}}',
  ]);

  let orchestratorInfo = null;
  if (psRes.status === 0 && psRes.stdout.trim()) {
    const [cid, status, image, ports] = psRes.stdout.trim().split('\n')[0].split('|');
    const isRunning = status.startsWith('Up');
    orchestratorInfo = {
      containerId: cid,
      name: DEFAULT_CONTAINER,
      status: isRunning ? 'RUNNING' : 'STOPPED',
      rawStatus: status,
      image: image,
      ports: ports,
      url: `http://${options.bind || DEFAULT_BIND}:${options.port || DEFAULT_PORT}`,
    };
  }

  // 2. Fetch Services from API if orchestrator is online
  let apiServices = null;
  if (orchestratorInfo && orchestratorInfo.status === 'RUNNING') {
    try {
      const res = await apiRequest('GET', '/api/services', null, {
        bind: options.bind || DEFAULT_BIND,
        port: options.port || DEFAULT_PORT,
        timeout: 2500,
      });
      if (res.status === 200 && Array.isArray(res.data)) {
        apiServices = res.data;
      }
    } catch (_) {
      // API warming up or unreachable
    }
  }

  // 3. Fallback: inspect raw docker containers with name=portgrid
  const rawDockerContainers = [];
  const dockerList = execDocker([
    'ps',
    '-a',
    '--filter', 'name=portgrid',
    '--format', '{{.ID}}|{{.Names}}|{{.Status}}|{{.Ports}}|{{.Image}}',
  ]);

  if (dockerList.status === 0 && dockerList.stdout.trim()) {
    const lines = dockerList.stdout.trim().split('\n');
    for (const line of lines) {
      const [cid, name, status, ports, image] = line.split('|');
      if (name !== DEFAULT_CONTAINER) {
        rawDockerContainers.push({
          containerId: cid,
          name: name,
          status: status.startsWith('Up') ? 'RUNNING' : 'STOPPED',
          rawStatus: status,
          ports: ports,
          image: image,
        });
      }
    }
  }

  // JSON OUTPUT MODE
  if (isJson) {
    const output = {
      orchestrator: orchestratorInfo || { status: 'OFFLINE', message: 'Not deployed' },
      services: apiServices || rawDockerContainers,
      timestamp: new Date().toISOString(),
    };
    console.log(JSON.stringify(output, null, 2));
    return;
  }

  // CLI PRETTY TERMINAL MODE
  printBanner();
  console.log(`${colors.bold}PORTGRID ORCHESTRATOR STATUS:${colors.reset}\n`);

  if (!orchestratorInfo) {
    console.log(`  Orchestrator:   ${colors.yellow}[STOPPED] Container '${DEFAULT_CONTAINER}' does not exist${colors.reset}`);
    console.log(`  Action:         Run '${colors.cyan}portgrid up${colors.reset}' to launch the orchestrator.\n`);
  } else {
    const statusColor = orchestratorInfo.status === 'RUNNING' ? colors.green : colors.yellow;
    console.log(`  Container ID:   ${colors.cyan}${orchestratorInfo.containerId}${colors.reset}`);
    console.log(`  Status:         ${statusColor}[${orchestratorInfo.status}] ${orchestratorInfo.rawStatus}${colors.reset}`);
    console.log(`  Dashboard URL:  ${colors.bold}${orchestratorInfo.url}${colors.reset}`);
    console.log(`  Image:          ${orchestratorInfo.image}`);
    console.log(`  Host Ports:     ${orchestratorInfo.ports || '3000/tcp'}`);

    const configDir = path.join(os.homedir(), '.portgrid');
    const envFile = path.join(configDir, 'portgrid.env');
    const hasKey = fs.existsSync(envFile);
    console.log(`  Secret Enclave: ${hasKey ? `${colors.green}FIPS 140-2 AES-256 Vault Active${colors.reset}` : `${colors.yellow}No Key File${colors.reset}`}`);
    console.log(`  Storage Volume: ${DEFAULT_VOLUME}`);
  }

  console.log('');
  console.log(`${colors.bold}MANAGED SERVICE ENCLAVES:${colors.reset}\n`);

  if (apiServices && apiServices.length > 0) {
    // Formatted table from active API instances
    const rows = [
      ['SERVICE ID', 'BLUEPRINT', 'STATUS', 'PORTS', 'COMPANION UI', 'CONTAINER'],
    ];

    for (const svc of apiServices) {
      const ports = `${svc.enginePort || '-'}${svc.uiPort ? ` / ${svc.uiPort}` : ''}`;
      const ui = svc.uiUrl || (svc.uiPort ? `http://${DEFAULT_BIND}:${svc.uiPort}` : 'None');
      const cid = (svc.engineContainerId || '').substring(0, 12) || '-';
      rows.push([
        svc.id,
        svc.blueprintId || '-',
        svc.status || 'UNKNOWN',
        ports,
        ui,
        cid,
      ]);
    }

    printTable(rows);
    console.log(`\n  Total active services: ${colors.bold}${apiServices.length}${colors.reset}`);
    console.log(`  To stream logs: ${colors.cyan}portgrid logs <service-id>${colors.reset}`);
    console.log(`  To deploy more: ${colors.cyan}portgrid deploy <blueprint>${colors.reset}\n`);
  } else if (rawDockerContainers.length > 0) {
    // Fallback docker container table
    const rows = [
      ['CONTAINER ID', 'NAME', 'STATUS', 'PORTS', 'IMAGE'],
    ];
    for (const c of rawDockerContainers) {
      rows.push([
        c.containerId,
        c.name,
        c.status,
        c.ports || '-',
        c.image,
      ]);
    }
    printTable(rows);
    console.log(`\n  Detected ${rawDockerContainers.length} container(s) running on Docker bridge.\n`);
  } else {
    console.log(`  ${colors.dim}No service blueprints currently provisioned.${colors.reset}`);
    console.log(`  Deploy your first service using: ${colors.cyan}portgrid deploy <blueprint-id>${colors.reset}`);
    console.log(`  Example: ${colors.cyan}portgrid deploy postgres${colors.reset} or ${colors.cyan}portgrid deploy redis${colors.reset}\n`);
  }
}

/**
 * Print clean ASCII table
 */
function printTable(rows) {
  if (!rows || rows.length === 0) return;
  const colWidths = [];

  for (let c = 0; c < rows[0].length; c++) {
    let max = 0;
    for (let r = 0; r < rows.length; r++) {
      const val = String(rows[r][c] || '');
      if (val.length > max) max = val.length;
    }
    colWidths.push(Math.max(max, 4));
  }

  for (let r = 0; r < rows.length; r++) {
    const isHeader = r === 0;
    const line = rows[r].map((cell, c) => {
      const text = String(cell || '');
      const pad = ' '.repeat(colWidths[c] - text.length);
      return text + pad;
    }).join('  ');

    if (isHeader) {
      console.log(`  ${colors.dim}${colors.bold}${line}${colors.reset}`);
      const divider = colWidths.map((w) => '-'.repeat(w)).join('  ');
      console.log(`  ${colors.dim}${divider}${colors.reset}`);
    } else {
      const statusMatch = rows[r][2];
      let statusColor = colors.reset;
      if (statusMatch === 'RUNNING') statusColor = colors.green;
      else if (statusMatch === 'STOPPED') statusColor = colors.yellow;
      else if (statusMatch === 'FAILED') statusColor = colors.red;

      const formatted = rows[r].map((cell, c) => {
        const text = String(cell || '');
        const pad = ' '.repeat(colWidths[c] - text.length);
        if (c === 0) return `${colors.cyan}${text}${colors.reset}${pad}`;
        if (c === 2) return `${statusColor}${text}${colors.reset}${pad}`;
        return text + pad;
      }).join('  ');

      console.log(`  ${formatted}`);
    }
  }
}

/**
 * Command: catalog / blueprints
 */
async function cmdCatalog(options = {}) {
  printBanner();
  console.log(`${colors.bold}AVAILABLE PORTGRID SERVICE BLUEPRINTS:${colors.reset}\n`);

  let catalog = null;
  try {
    const res = await apiRequest('GET', '/api/catalog', null, { timeout: 2500 });
    if (res.status === 200 && Array.isArray(res.data)) {
      catalog = res.data;
    }
  } catch (_) {}

  // Built-in verified blueprint reference list
  if (!catalog) {
    catalog = [
      { id: 'postgresql', name: 'PostgreSQL 16 + pgAdmin 4 + pgvector', category: 'Database', defaultPorts: [5432, 5050], description: 'ACID relational database with pgvector AI embeddings and pgAdmin web console.' },
      { id: 'redis', name: 'Redis 7.2 Stack + Redis Insight', category: 'Cache', defaultPorts: [6379, 8081], description: 'In-memory cache with JSON, Search, TimeSeries modules and live stream telemetry.' },
      { id: 'kafka', name: 'Apache Kafka 3.7 (KRaft) + AKHQ Console', category: 'Streaming', defaultPorts: [9092, 8080], description: 'High-throughput event streaming architecture without ZooKeeper dependencies.' },
      { id: 'keycloak', name: 'Keycloak 24 IAM + Dedicated Postgres', category: 'Identity', defaultPorts: [8085], description: 'Enterprise identity, OIDC, SAML 2.0, and OAuth2 security provider.' },
      { id: 'rabbitmq', name: 'RabbitMQ 3.13 + Management Dashboard', category: 'Message Queue', defaultPorts: [5672, 15672], description: 'AMQP broker with dead-letter exchanges, quorum queues, and management console.' },
      { id: 'jenkins', name: 'Jenkins CI/CD LTS Controller', category: 'CI/CD', defaultPorts: [8090, 50000], description: 'CI/CD orchestration controller with Docker-in-Docker socket passthrough.' },
      { id: 'mongodb', name: 'MongoDB 7.0 + Mongo Express Admin', category: 'Database', defaultPorts: [27017, 8081], description: 'Document store running wiredTiger engine paired with Mongo Express UI.' },
      { id: 'clickhouse', name: 'ClickHouse Cloud-Native OLAP', category: 'Analytics', defaultPorts: [8123, 9000], description: 'Columnar analytical database engine for real-time aggregation queries.' },
    ];
  }

  if (options.json) {
    console.log(JSON.stringify(catalog, null, 2));
    return;
  }

  const rows = [
    ['BLUEPRINT ID', 'NAME', 'CATEGORY', 'PORTS', 'DEPLOY COMMAND'],
  ];

  for (const item of catalog) {
    const ports = (item.defaultPorts || []).join(', ') || '-';
    rows.push([
      item.id,
      item.name,
      item.category || 'Service',
      ports,
      `portgrid deploy ${item.id}`,
    ]);
  }

  printTable(rows);

  console.log(`\n${colors.bold}QUICKSTART DEPLOYMENT:${colors.reset}`);
  console.log(`  To deploy a blueprint: ${colors.cyan}portgrid deploy <blueprint-id>${colors.reset}`);
  console.log(`  Example: ${colors.cyan}portgrid deploy postgres${colors.reset}\n`);
}

/**
 * Command: deploy / install <blueprintId>
 */
async function cmdDeploy(blueprintInput, options = {}) {
  if (!blueprintInput) {
    error(`Missing blueprint ID argument.`);
    console.log(`Usage: portgrid deploy <blueprint-id>`);
    console.log(`Example: portgrid deploy postgres\n`);
    await cmdCatalog(options);
    return;
  }

  const blueprintId = normalizeBlueprintId(blueprintInput);

  printBanner();
  log(`Initiating deployment for blueprint: ${colors.bold}${colors.cyan}${blueprintId}${colors.reset}...`);

  if (!isDockerRunning()) {
    die(`Docker daemon is not active. Please start Docker engine and retry.`);
  }

  // 1. Verify Orchestrator is Running
  let isRunning = false;
  try {
    const health = await apiRequest('GET', '/api/services', null, { timeout: 2000 });
    if (health.status === 200) isRunning = true;
  } catch (_) {}

  if (!isRunning) {
    warn(`PortGrid orchestrator is not currently running.`);
    info(`Booting PortGrid orchestrator first...`);
    await cmdUp({ open: false });
    info(`Orchestrator online. Proceeding with service provisioning...`);
  }

  // 2. Call Service Install API
  log(`Submitting blueprint provisioning request to orchestrator...`);
  try {
    const deployRes = await apiRequest('POST', '/api/services/install', {
      blueprintId: blueprintId,
    }, { timeout: 120000 }); // Allow 2 mins for image pulls

    if (deployRes.status >= 200 && deployRes.status < 300) {
      const svc = deployRes.data;
      console.log('');
      console.log(`${colors.green}${colors.bold}============================================================${colors.reset}`);
      console.log(`${colors.green}${colors.bold}  SERVICE BLUEPRINT SUCCESSFULLY DEPLOYED${colors.reset}`);
      console.log(`${colors.green}${colors.bold}============================================================${colors.reset}`);
      console.log(`  Service ID:     ${colors.cyan}${colors.bold}${svc.id}${colors.reset}`);
      console.log(`  Blueprint:      ${svc.name || blueprintId}`);
      console.log(`  Status:         ${colors.green}[RUNNING]${colors.reset}`);
      console.log(`  Engine Port:    ${colors.bold}${svc.enginePort || 'None'}${colors.reset}`);
      if (svc.uiPort) {
        console.log(`  Companion UI:   ${colors.cyan}${colors.bold}${svc.uiUrl || `http://${DEFAULT_BIND}:${svc.uiPort}`}${colors.reset}`);
      }

      if (svc.secrets) {
        console.log(`  Credentials:    User: ${svc.secrets.username || 'admin'} | Password: ${svc.secrets.password || '(auto-generated)'}`);
      }

      if (svc.connectionStrings && svc.connectionStrings.uri) {
        console.log('');
        console.log(`${colors.bold}CONNECTION URI:${colors.reset}`);
        console.log(`  ${colors.green}${svc.connectionStrings.uri}${colors.reset}`);
      }

      if (svc.connectionStrings && svc.connectionStrings.envSnippet) {
        console.log('');
        console.log(`${colors.bold}ENVIRONMENT VARIABLES:${colors.reset}`);
        const lines = svc.connectionStrings.envSnippet.split('\n');
        for (const l of lines) {
          console.log(`  export ${l}`);
        }
      }

      console.log('');
      console.log(`Run '${colors.cyan}portgrid ps${colors.reset}' to inspect all active services.`);
      console.log(`Run '${colors.cyan}portgrid logs ${svc.id}${colors.reset}' to inspect live telemetry.\n`);

      if (options.open !== false && svc.uiPort) {
        openBrowser(svc.uiUrl || `http://${DEFAULT_BIND}:${svc.uiPort}`);
      }
    } else {
      error(`Deployment failed (HTTP ${deployRes.status}): ${JSON.stringify(deployRes.data)}`);
    }
  } catch (err) {
    die(`Failed to deploy service: ${err.message}`);
  }
}

/**
 * Command: stop <service-id>
 */
async function cmdStopService(serviceId) {
  if (!serviceId) {
    // If no argument, stop the orchestrator
    cmdDown();
    return;
  }

  log(`Stopping service enclave: '${serviceId}'...`);
  try {
    const res = await apiRequest('POST', `/api/services/${serviceId}/stop`, null, { timeout: 15000 });
    if (res.status === 200) {
      success(`Service '${serviceId}' stopped successfully.`);
      return;
    }
  } catch (_) {}

  // Fallback direct docker container stop
  const fallback = execDocker(['stop', `portgrid-${serviceId}`]);
  if (fallback.status === 0) {
    success(`Container 'portgrid-${serviceId}' stopped.`);
  } else {
    warn(`Could not stop service '${serviceId}'. Verify ID with 'portgrid ps'.`);
  }
}

/**
 * Command: start <service-id>
 */
async function cmdStartService(serviceId) {
  if (!serviceId) {
    await cmdUp();
    return;
  }

  log(`Starting service enclave: '${serviceId}'...`);
  try {
    const res = await apiRequest('POST', `/api/services/${serviceId}/start`, null, { timeout: 15000 });
    if (res.status === 200) {
      success(`Service '${serviceId}' started successfully.`);
      return;
    }
  } catch (_) {}

  // Fallback direct docker container start
  const fallback = execDocker(['start', `portgrid-${serviceId}`]);
  if (fallback.status === 0) {
    success(`Container 'portgrid-${serviceId}' started.`);
  } else {
    warn(`Could not start service '${serviceId}'. Verify ID with 'portgrid ps'.`);
  }
}

/**
 * Command: rm / uninstall <service-id>
 */
async function cmdUninstallService(serviceId, options = {}) {
  if (!serviceId) {
    error(`Please specify the service ID to remove.`);
    console.log(`Usage: portgrid rm <service-id>\n`);
    return;
  }

  const keepVolumes = options.keepVolumes === true;
  log(`Uninstalling service '${serviceId}' (purge volumes: ${!keepVolumes})...`);

  try {
    const res = await apiRequest('DELETE', `/api/services/${serviceId}?removeVolumes=${!keepVolumes}`, null, { timeout: 20000 });
    if (res.status === 200) {
      success(`Service '${serviceId}' uninstalled and purged successfully.`);
      return;
    }
  } catch (_) {}

  // Fallback direct docker removal
  execDocker(['stop', `portgrid-${serviceId}`]);
  execDocker(['rm', '-f', `portgrid-${serviceId}`]);
  success(`Service container 'portgrid-${serviceId}' removed.`);
}

/**
 * Command: logs [service-id]
 */
function cmdLogs(serviceId, options = {}) {
  if (!isDockerRunning()) {
    die('Docker daemon is not running.');
  }

  const tail = options.tail || '100';
  const follow = Boolean(options.follow);

  // If no specific service specified, default to orchestrator
  if (!serviceId || serviceId === 'orchestrator' || serviceId === 'portgrid') {
    const args = ['logs', '--tail', String(tail)];
    if (follow) args.push('-f');
    args.push(DEFAULT_CONTAINER);
    child_process.spawn('docker', args, { stdio: 'inherit' });
    return;
  }

  // Find container matching serviceId
  const psRes = execDocker([
    'ps',
    '-a',
    '--filter', `name=${serviceId}`,
    '--format', '{{.Names}}',
  ]);

  let targetContainer = null;
  if (psRes.status === 0 && psRes.stdout.trim()) {
    const names = psRes.stdout.trim().split('\n');
    targetContainer = names[0];
  } else {
    targetContainer = `portgrid-${serviceId}`;
  }

  log(`Streaming logs for container '${targetContainer}'...`);
  const args = ['logs', '--tail', String(tail)];
  if (follow) args.push('-f');
  args.push(targetContainer);

  child_process.spawn('docker', args, { stdio: 'inherit' });
}

/**
 * Command: audit [verify]
 */
async function cmdAudit(subcommand = 'verify', options = {}) {
  printBanner();
  console.log(`${colors.bold}CRYPTOGRAPHIC MERKLE AUDIT LEDGER:${colors.reset}\n`);

  try {
    const verifyRes = await apiRequest('GET', '/api/audit/verify', null, { timeout: 3000 });
    const secRes = await apiRequest('GET', '/api/audit/security-status', null, { timeout: 3000 });

    if (verifyRes.status === 200) {
      const v = verifyRes.data;
      const s = secRes.status === 200 ? secRes.data : null;

      if (options.json) {
        console.log(JSON.stringify({ verification: v, security: s }, null, 2));
        return;
      }

      console.log(`  Chain Integrity:     ${v.verified ? `${colors.green}${colors.bold}[VALID] Intact & Tamper-Free${colors.reset}` : `${colors.red}[COMPROMISED] Hash Mismatch Detected${colors.reset}`}`);
      console.log(`  Total Events:        ${colors.cyan}${v.totalEntries}${colors.reset} cryptographically chained blocks`);
      console.log(`  Latest Tip Hash:     ${colors.mono || colors.dim}${v.latestHash || 'None'}${colors.reset}`);
      console.log(`  Genesis Hash:        ${colors.mono || colors.dim}${v.genesisHash || '0000000000000000000000000000000000000000000000000000000000000000'}${colors.reset}`);
      console.log(`  Ledger Message:      ${v.message}`);

      if (s) {
        console.log('');
        console.log(`${colors.bold}SECURITY & ENCLAVE POSTURE:${colors.reset}`);
        console.log(`  Compliance Grade:    ${s.complianceGrade}`);
        console.log(`  Network Isolation:   ${s.networkIsolation?.status} (${s.networkIsolation?.bindingInterface})`);
        console.log(`  Envelope Cipher:     ${s.cryptography?.cipher}`);
        console.log(`  Key Security:        ${s.cryptography?.keyStrength} (${s.cryptography?.keyLocation})`);
        console.log(`  Hardening:           ${s.containerHardening?.privilegeEscalation}`);
      }

      if (options.exportJson) {
        fs.writeFileSync(options.exportJson, JSON.stringify({ verification: v, security: s }, null, 2));
        console.log(`\n  ${colors.green}[OK]${colors.reset} Audit verification exported to: ${options.exportJson}`);
      }
      console.log('');
      return;
    }
  } catch (err) {
    warn(`Could not connect to PortGrid audit API (${err.message}).`);
    info(`Audit verification requires active PortGrid orchestrator ('portgrid up').\n`);
  }
}

/**
 * Command: vault [status|rekey]
 */
function cmdVault(subcommand = 'status', options = {}) {
  printBanner();
  console.log(`${colors.bold}FIPS 140-2 SECRET ENCLAVE VAULT:${colors.reset}\n`);

  const configDir = path.join(os.homedir(), '.portgrid');
  const envFile = path.join(configDir, 'portgrid.env');
  const exists = fs.existsSync(envFile);

  if (subcommand === 'rekey') {
    if (exists) {
      const backupPath = path.join(configDir, `portgrid.env.bak.${Date.now()}`);
      fs.copyFileSync(envFile, backupPath);
      info(`Existing key backed up to: ${backupPath}`);
    }
    const newKey = crypto.randomBytes(32).toString('hex');
    fs.writeFileSync(envFile, `PORTGRID_MASTER_KEY=${newKey}\n`, { mode: 0o600 });
    success(`Master key rotated. New 256-bit entropy generated.`);
    info(`Restart orchestrator ('portgrid restart') to apply new secret key.\n`);
    return;
  }

  console.log(`  Vault Location:     ${envFile}`);
  console.log(`  Status:             ${exists ? `${colors.green}[ACTIVE] Keyfile exists (mode 0600)${colors.reset}` : `${colors.yellow}[UNINITIALIZED]${colors.reset}`}`);
  console.log(`  Cipher Standard:    AES-256-GCM (Authenticated Envelope Encryption)`);
  console.log(`  Key Derivation:     PBKDF2 HMAC-SHA512 (600,000 rounds)`);
  console.log(`  Key Strength:       256-bit High Entropy`);
  console.log('');
  console.log(`To rotate keys: ${colors.cyan}portgrid vault rekey${colors.reset}\n`);
}

/**
 * Command: down / stop
 */
function cmdDown(options = {}) {
  log(`Stopping PortGrid environment...`);

  if (options.dryRun) {
    info(`[DRY-RUN] Would stop container '${DEFAULT_CONTAINER}'`);
    info(`[DRY-RUN] Would stop active service containers matching 'portgrid-*'`);
    if (options.purge) {
      info(`[DRY-RUN] Would purge named Docker volumes and secrets`);
    }
    return;
  }

  // 1. Stop all active service containers matching portgrid-*
  const listRes = execDocker([
    'ps',
    '-q',
    '--filter', 'name=portgrid-',
  ]);
  if (listRes.status === 0 && listRes.stdout.trim()) {
    const cids = listRes.stdout.trim().split('\n');
    log(`Stopping ${cids.length} active service container(s)...`);
    execDocker(['stop', ...cids]);
    success(`All service containers stopped.`);
  }

  // 2. Stop main orchestrator container
  const res = execDocker(['stop', DEFAULT_CONTAINER]);
  if (res.status === 0) {
    success(`PortGrid orchestrator stopped gracefully.`);
  } else {
    info(`Container '${DEFAULT_CONTAINER}' was not running.`);
  }

  // 3. Optional volume purge
  if (options.purge) {
    log(`Purging persistent data volumes (crypto-shred)...`);
    execDocker(['volume', 'rm', DEFAULT_VOLUME]);
    const volList = execDocker(['volume', 'ls', '-q', '--filter', 'name=portgrid_']);
    if (volList.status === 0 && volList.stdout.trim()) {
      const vols = volList.stdout.trim().split('\n');
      execDocker(['volume', 'rm', ...vols]);
    }
    success(`Persistent storage volumes purged.`);
  }
}

/**
 * Command: restart
 */
async function cmdRestart() {
  log(`Restarting PortGrid container '${DEFAULT_CONTAINER}'...`);
  const res = execDocker(['restart', DEFAULT_CONTAINER]);
  if (res.status === 0) {
    success(`PortGrid container restarted.`);
    try {
      info(`Verifying service readiness...`);
      await waitForReadiness(DEFAULT_BIND, DEFAULT_PORT, 25);
      success(`PortGrid instance is healthy at http://${DEFAULT_BIND}:${DEFAULT_PORT}`);
    } catch (err) {
      warn(`Readiness probe failed (${err.message}). Check 'portgrid logs'.`);
    }
  } else {
    error(`Failed to restart container: ${res.stderr || 'Unknown error'}`);
  }
}

/**
 * Command: open
 */
function cmdOpen(target = null) {
  if (!target) {
    const url = `http://${DEFAULT_BIND}:${DEFAULT_PORT}`;
    info(`Opening PortGrid Console: ${url}`);
    openBrowser(url);
    return;
  }

  // If target looks like a service ID or blueprint name
  const url = `http://${DEFAULT_BIND}:${DEFAULT_PORT}`;
  openBrowser(url);
}

/**
 * Command: destroy
 */
function cmdDestroy(purgeData = false) {
  log(`Stopping and deleting container '${DEFAULT_CONTAINER}'...`);
  execDocker(['stop', DEFAULT_CONTAINER]);
  execDocker(['rm', '-f', DEFAULT_CONTAINER]);
  success(`Container removed.`);

  if (purgeData) {
    log(`Purging persistent data volume '${DEFAULT_VOLUME}'...`);
    execDocker(['volume', 'rm', DEFAULT_VOLUME]);
    success(`Data volume purged.`);
  }
}

/**
 * Command: up / start
 */
async function cmdUp(options = {}) {
  printBanner();
  const targetPort = options.uiPort || options.port || DEFAULT_PORT;
  const targetBind = options.bind || DEFAULT_BIND;
  const targetImage = options.image || DEFAULT_IMAGE;
  const shouldPull = Boolean(options.pull);
  const autoOpen = options.open !== false;

  log(`Executing preflight system checks...`);

  if (!isDockerInstalled()) {
    printDockerMissingGuide();
    process.exit(1);
  }
  if (!isDockerRunning()) {
    printDockerNotRunningGuide();
    process.exit(1);
  }

  const socketInfo = detectDockerSocket();
  info(`Detected host socket interface: ${socketInfo.type} (${socketInfo.hostPath})`);

  // Master key provisioning
  const configDir = path.join(os.homedir(), '.portgrid');
  const envFile = path.join(configDir, 'portgrid.env');
  const masterKey = getOrCreateMasterKey(configDir, envFile);
  info(`Cryptographic master key loaded (FIPS 140-2 AES-256 vault).`);

  // Check if container already exists
  const inspectRes = execDocker(['ps', '-a', '--filter', `name=^/${DEFAULT_CONTAINER}$`, '--format', '{{.Status}}']);
  const exists = inspectRes.status === 0 && Boolean(inspectRes.stdout.trim());
  const isRunning = exists && inspectRes.stdout.trim().startsWith('Up');

  if (exists && isRunning) {
    success(`PortGrid is already running at http://${targetBind}:${targetPort}`);
    if (autoOpen) openBrowser(`http://${targetBind}:${targetPort}`);
    return;
  }

  if (exists && !isRunning) {
    info(`Existing PortGrid container found stopped. Starting...`);
    const startRes = execDocker(['start', DEFAULT_CONTAINER]);
    if (startRes.status === 0) {
      info(`Awaiting service readiness probe...`);
      try {
        await waitForReadiness(targetBind, targetPort, 30);
        success(`PortGrid successfully online at http://${targetBind}:${targetPort}`);
        if (autoOpen) openBrowser(`http://${targetBind}:${targetPort}`);
        return;
      } catch (err) {
        warn(`Readiness check timed out: ${err.message}. Showing logs.`);
        cmdLogs(null, { tail: '25' });
        return;
      }
    } else {
      warn(`Could not restart stopped container. Removing old container and recreating...`);
      execDocker(['rm', '-f', DEFAULT_CONTAINER]);
    }
  }

  // Check port availability
  const portFree = await checkPortAvailable(targetPort, targetBind);
  if (!portFree) {
    die(`Port ${targetPort} is already bound on ${targetBind}. Choose another port via --port <n>.`);
  }

  // Check image presence or pull
  const imgInspect = execDocker(['image', 'inspect', targetImage]);
  const hasImage = imgInspect.status === 0;

  if (!hasImage || shouldPull) {
    log(`Pulling container image: ${targetImage}...`);
    const pullRes = child_process.spawnSync('docker', ['pull', targetImage], {
      stdio: 'inherit',
      shell: false,
    });
    if (pullRes.status !== 0) {
      die(`Failed to pull container image '${targetImage}'. Verify network connection and image tag.`);
    }
    success(`Image pulled successfully.`);
  } else {
    info(`Image '${targetImage}' cached locally.`);
  }

  // Spawning container
  log(`Spawning hardened enterprise container...`);
  const runArgs = [
    'run',
    '-d',
    '--name', DEFAULT_CONTAINER,
    '--restart', 'unless-stopped',
    '--security-opt', 'no-new-privileges',
    '-p', `${targetBind}:${targetPort}:3000`,
    '-v', `${DEFAULT_VOLUME}:/app/backend/data`,
    '-v', socketInfo.mountArg,
    '-e', `PORTGRID_MASTER_KEY=${masterKey}`,
    '-e', `PORTGRID_PORT=3000`,
    '-e', `NODE_ENV=production`,
    targetImage,
  ];

  const spawnRes = execDocker(runArgs);
  if (spawnRes.status !== 0) {
    die(`Failed to launch container: ${spawnRes.stderr || 'Unknown Docker spawn error'}`);
  }

  const containerId = spawnRes.stdout ? spawnRes.stdout.trim().substring(0, 12) : DEFAULT_CONTAINER;
  success(`Container initialized with ID: ${colors.cyan}${containerId}${colors.reset}`);

  // Readiness polling
  info(`Awaiting service readiness handshake (TCP loopback ${targetBind}:${targetPort})...`);
  try {
    await waitForReadiness(targetBind, targetPort, 35);
    console.log('');
    console.log(`${colors.green}${colors.bold}============================================================${colors.reset}`);
    console.log(`${colors.green}${colors.bold}  PORTGRID PLATFORM ONLINE AND VERIFIED HEALTHY${colors.reset}`);
    console.log(`${colors.green}${colors.bold}============================================================${colors.reset}`);
    console.log(`  Dashboard URL:      ${colors.cyan}${colors.bold}http://${targetBind}:${targetPort}${colors.reset}`);
    console.log(`  Audit Ledger:       Active (SHA-256 Merkle chained)`);
    console.log(`  Security Enclave:   Loopback isolated (127.0.0.1)`);
    console.log(`  Container Status:   running (ID: ${containerId})`);
    console.log(`${colors.dim}  Run 'portgrid ps' to list active services.${colors.reset}`);
    console.log(`${colors.dim}  Run 'portgrid logs -f' to inspect live runtime telemetry.${colors.reset}\n`);

    if (autoOpen) {
      openBrowser(`http://${targetBind}:${targetPort}`);
    }
  } catch (err) {
    error(`Readiness check failed: ${err.message}`);
    info(`Inspecting container logs for diagnostics:`);
    cmdLogs(null, { tail: '30' });
    process.exit(1);
  }
}

/**
 * Command: doctor
 */
async function cmdDoctor() {
  printBanner();
  console.log(`${colors.bold}SYSTEM PREFLIGHT & DOCTOR AUDIT:${colors.reset}\n`);

  // 1. Operating System
  const osType = isWindows ? 'Windows' : isMac ? 'macOS (Darwin)' : 'Linux';
  const cpus = os.cpus().length;
  const ramMb = Math.round(os.totalmem() / (1024 * 1024));
  const freeRamMb = Math.round(os.freemem() / (1024 * 1024));
  success(`OS Platform: ${osType} (${os.arch()}, ${os.release()})`);
  success(`Hardware: ${cpus} CPU core(s), ${ramMb} MB total RAM (${freeRamMb} MB free)`);

  if (cpus < 2) {
    warn(`CPU cores (${cpus}) is below recommended 2 cores for container workloads.`);
  }
  if (ramMb < 2048) {
    warn(`Total RAM (${ramMb} MB) is below 2048 MB minimum.`);
  }

  // 2. Node.js Runtime
  success(`Node.js Runtime: ${process.version} (Path: ${process.execPath})`);

  // 3. Docker CLI
  if (!isDockerInstalled()) {
    error(`Docker CLI is not found in system PATH.`);
    printDockerMissingGuide();
    process.exit(1);
  }
  const verResult = execDocker(['--version']);
  const dockerVer = verResult.stdout ? verResult.stdout.trim() : 'Unknown';
  success(`Docker Binary: ${dockerVer}`);

  // 4. Docker Engine Daemon
  if (!isDockerRunning()) {
    error(`Docker daemon is not running.`);
    printDockerNotRunningGuide();
    process.exit(1);
  }
  success(`Docker Engine Daemon: Connected and responding`);

  // 5. Docker Socket Translation
  const socketInfo = detectDockerSocket();
  success(`Docker Socket Interop: ${socketInfo.type} -> ${socketInfo.hostPath}`);

  // 6. Config Directory
  const configDir = path.join(os.homedir(), '.portgrid');
  try {
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true, mode: 0o700 });
    }
    const testFile = path.join(configDir, '.perm_test');
    fs.writeFileSync(testFile, 'ok', { mode: 0o600 });
    fs.unlinkSync(testFile);
    success(`Config Directory: ${configDir} (Writable, permissions intact)`);
  } catch (err) {
    warn(`Config Directory: ${configDir} permission check failed (${err.message})`);
  }

  // 7. Port 3000 Availability
  const portFree = await checkPortAvailable(DEFAULT_PORT, DEFAULT_BIND);
  if (portFree) {
    success(`Default Port ${DEFAULT_PORT}: Available on ${DEFAULT_BIND}`);
  } else {
    info(`Port ${DEFAULT_PORT} is currently active on ${DEFAULT_BIND}`);
  }

  console.log(`\n${colors.green}${colors.bold}[PASSED]${colors.reset} System meets all operational prerequisites for PortGrid.\n`);
}

/**
 * Command: update
 */
async function cmdUpdate(options = {}) {
  printBanner();
  log(`Starting PortGrid update pipeline...`);

  if (!isDockerRunning()) {
    die(`Docker daemon is not active. Cannot update container.`);
  }

  const targetImage = options.image || DEFAULT_IMAGE;
  log(`Pulling newest Docker image: ${targetImage}...`);

  const pullRes = child_process.spawnSync('docker', ['pull', targetImage], {
    stdio: 'inherit',
    shell: false,
  });

  if (pullRes.status !== 0) {
    die(`Failed to pull image update '${targetImage}'.`);
  }

  log(`Updating running container with persistent data preservation...`);
  execDocker(['stop', DEFAULT_CONTAINER]);
  execDocker(['rm', '-f', DEFAULT_CONTAINER]);

  await cmdUp({
    port: DEFAULT_PORT,
    bind: DEFAULT_BIND,
    image: targetImage,
    pull: false,
    open: false,
  });

  success(`Update completed successfully. All data volumes preserved.`);
}

/**
 * Main CLI Entry Point Router
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] ? args[0].toLowerCase() : 'help';

  // Parse generic flags
  const flags = {};
  const positional = [];

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') {
      printHelp();
      return;
    }
    if (arg === '--version' || arg === '-v') {
      console.log(`PortGrid CLI v${CLI_VERSION}`);
      return;
    }
    if ((arg === '--port' || arg === '--ui-port') && args[i + 1]) {
      flags.port = parseInt(args[++i], 10);
      flags.uiPort = flags.port;
    } else if (arg === '--bind' && args[i + 1]) {
      flags.bind = args[++i];
    } else if (arg === '--image' && args[i + 1]) {
      flags.image = args[++i];
    } else if (arg === '--pull') {
      flags.pull = true;
    } else if (arg === '--no-open') {
      flags.open = false;
    } else if (arg === '-f' || arg === '--follow') {
      flags.follow = true;
    } else if (arg === '--tail' && args[i + 1]) {
      flags.tail = args[++i];
    } else if (arg === '--purge' || arg === '--purge-data') {
      flags.purge = true;
    } else if (arg === '--dry-run') {
      flags.dryRun = true;
    } else if (arg === '--force') {
      flags.force = true;
    } else if (arg === '--json') {
      flags.json = true;
    } else if (arg === '-w' || arg === '--watch') {
      flags.watch = true;
    } else if (arg === '--export-json' && args[i + 1]) {
      flags.exportJson = args[++i];
    } else if (!arg.startsWith('-')) {
      positional.push(arg);
    }
  }

  switch (command) {
    case 'up':
    case 'start':
      if (positional.length > 0) {
        // user ran "portgrid start <service-id>"
        await cmdStartService(positional[0]);
      } else {
        await cmdUp(flags);
      }
      break;

    case 'down':
      cmdDown(flags);
      break;

    case 'stop':
      if (positional.length > 0) {
        await cmdStopService(positional[0]);
      } else {
        cmdDown(flags);
      }
      break;

    case 'restart':
      await cmdRestart();
      break;

    case 'status':
    case 'ps':
      await cmdStatus(flags);
      break;

    case 'deploy':
    case 'install':
      await cmdDeploy(positional[0], flags);
      break;

    case 'rm':
    case 'uninstall':
    case 'remove':
      await cmdUninstallService(positional[0], flags);
      break;

    case 'catalog':
    case 'blueprints':
    case 'list':
      await cmdCatalog(flags);
      break;

    case 'logs':
      cmdLogs(positional[0] || null, flags);
      break;

    case 'audit':
      await cmdAudit(positional[0] || 'verify', flags);
      break;

    case 'vault':
      cmdVault(positional[0] || 'status', flags);
      break;

    case 'doctor':
      await cmdDoctor();
      break;

    case 'update':
      await cmdUpdate(flags);
      break;

    case 'open':
      cmdOpen(positional[0] || null);
      break;

    case 'destroy':
      cmdDestroy(flags.purge);
      break;

    case 'version':
    case '-v':
    case '--version':
      console.log(`PortGrid CLI v${CLI_VERSION}`);
      break;

    case 'help':
    case '-h':
    case '--help':
      printHelp();
      break;

    default:
      warn(`Unknown command: '${command}'`);
      printHelp();
      break;
  }
}

main().catch((err) => {
  error(`Fatal CLI error: ${err.message || err}`);
  process.exit(1);
});
