import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as Docker from 'dockerode';
import * as net from 'net';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

export interface ContainerMetricSnapshot {
  cpuPercent: number;
  memoryUsageBytes: number;
  memoryLimitBytes: number;
  memoryPercent: number;
  networkRxBytes: number;
  networkTxBytes: number;
}

export interface PortBindingSpec {
  hostPort: number;
  containerPort: number;
}

@Injectable()
export class DockerService implements OnModuleInit {
  private readonly logger = new Logger(DockerService.name);
  private docker: Docker;
  public readonly networkName = 'portgrid-net';

  constructor() {
    this.docker = this.initDockerClient();
  }

  async onModuleInit() {
    try {
      await this.ensureNetwork();
      this.logger.log(`Initialized Docker connection and ensured network: ${this.networkName}`);
    } catch (err: any) {
      this.logger.warn(`Could not verify Docker connection during boot: ${err.message}`);
    }
  }

  private initDockerClient(): Docker {
    const homeDir = os.homedir();
    const macDockerSocket = path.join(homeDir, '.docker/run/docker.sock');
    const standardSocket = '/var/run/docker.sock';

    if (fs.existsSync(macDockerSocket)) {
      return new Docker({ socketPath: macDockerSocket });
    }
    if (fs.existsSync(standardSocket)) {
      return new Docker({ socketPath: standardSocket });
    }
    return new Docker(); // fallback to DOCKER_HOST env var
  }

  /**
   * Ping Docker engine to check health
   */
  async ping(): Promise<boolean> {
    try {
      await this.docker.ping();
      return true;
    } catch (err) {
      return false;
    }
  }

  /**
   * Ensures the internal bridge network exists
   */
  async ensureNetwork(): Promise<void> {
    try {
      const networks = await this.docker.listNetworks();
      const exists = networks.some((n) => n.Name === this.networkName);
      if (!exists) {
        await this.docker.createNetwork({
          Name: this.networkName,
          Driver: 'bridge',
          CheckDuplicate: true,
        });
        this.logger.log(`Created bridge network: ${this.networkName}`);
      }
    } catch (err: any) {
      this.logger.error(`Error ensuring network ${this.networkName}: ${err.message}`);
    }
  }

  /**
   * Finds the first available free port on localhost starting at preferredPort
   */
  async findAvailablePort(preferredPort: number): Promise<number> {
    const isPortAvailable = (port: number): Promise<boolean> => {
      return new Promise((resolve) => {
        const server = net.createServer();
        server.once('error', () => resolve(false));
        server.once('listening', () => {
          server.close(() => resolve(true));
        });
        server.listen(port, '0.0.0.0');
      });
    };

    let port = preferredPort;
    while (!(await isPortAvailable(port))) {
      port++;
      if (port > preferredPort + 50) {
        throw new Error(`Could not find an available port near ${preferredPort}`);
      }
    }
    return port;
  }

  /**
   * Pulls an image if not already present locally
   */
  async pullImageIfNeeded(image: string): Promise<void> {
    const images = await this.docker.listImages();
    const exists = images.some((img) =>
      img.RepoTags?.some((tag) => tag === image || tag.startsWith(`${image}:`)),
    );

    if (exists) {
      this.logger.log(`Image ${image} already present locally.`);
      return;
    }

    this.logger.log(`Pulling image: ${image}... This may take a moment.`);
    await new Promise<void>((resolve, reject) => {
      this.docker.pull(image, (err: any, stream: any) => {
        if (err) return reject(err);
        this.docker.modem.followProgress(stream, (followErr: any) => {
          if (followErr) return reject(followErr);
          resolve();
        });
      });
    });
    this.logger.log(`Successfully pulled image ${image}`);
  }

  /**
   * Creates and starts a container with multi-port mapping and DNS network aliases
   */
  async runContainer(options: {
    name: string;
    image: string;
    ports?: PortBindingSpec[];
    hostPort?: number;
    containerPort?: number;
    env?: Record<string, string>;
    volumes?: Array<{ name: string; mountPath: string }>;
    cmd?: string[];
    aliases?: string[];
  }): Promise<string> {
    await this.ensureNetwork();
    await this.pullImageIfNeeded(options.image);

    // Format environment variables
    const envArray: string[] = options.env
      ? Object.entries(options.env).map(([k, v]) => `${k}=${v}`)
      : [];

    // Format port bindings (support both options.ports and legacy hostPort/containerPort)
    const exposedPorts: Record<string, {}> = {};
    const portBindings: Record<string, Array<{ HostIp?: string; HostPort: string }>> = {};

    const mappings: PortBindingSpec[] = options.ports ? [...options.ports] : [];
    if (options.hostPort && options.containerPort) {
      mappings.push({ hostPort: options.hostPort, containerPort: options.containerPort });
    }

    for (const m of mappings) {
      const portKey = `${m.containerPort}/tcp`;
      exposedPorts[portKey] = {};
      // Bank-Grade Security: Enforce strict 127.0.0.1 binding to eliminate LAN exposure
      portBindings[portKey] = [{ HostIp: '127.0.0.1', HostPort: String(m.hostPort) }];
    }

    // Format volume binds
    const binds: string[] = options.volumes
      ? options.volumes.map((v) => `${v.name}:${v.mountPath}`)
      : [];

    // Cleanup existing container with same name if any
    try {
      const existing = this.docker.getContainer(options.name);
      await existing.stop().catch(() => {});
      await existing.remove({ force: true }).catch(() => {});
    } catch {}

    // Prepare DNS aliases for container on portgrid-net
    const dnsAliases = options.aliases ? Array.from(new Set([options.name, ...options.aliases])) : [options.name];

    const container = await this.docker.createContainer({
      name: options.name,
      Image: options.image,
      Env: envArray,
      Cmd: options.cmd,
      ExposedPorts: exposedPorts,
      HostConfig: {
        PortBindings: portBindings,
        Binds: binds,
        NetworkMode: this.networkName,
        RestartPolicy: { Name: 'unless-stopped' },
        SecurityOpt: ['no-new-privileges:true'],
      },
      NetworkingConfig: {
        EndpointsConfig: {
          [this.networkName]: {
            Aliases: dnsAliases,
          },
        },
      },
    });

    await container.start();
    this.logger.log(`Started container: ${options.name} (${container.id.substring(0, 12)}) with aliases: [${dnsAliases.join(', ')}]`);
    return container.id;
  }

  /**
   * Starts an existing container
   */
  async startContainer(containerIdOrName: string): Promise<void> {
    try {
      const container = this.docker.getContainer(containerIdOrName);
      await container.start();
      this.logger.log(`Successfully started container ${containerIdOrName}`);
    } catch (err: any) {
      if (!err.message?.includes('already started')) {
        this.logger.warn(`Failed to start container ${containerIdOrName}: ${err.message}`);
        throw err;
      }
    }
  }

  /**
   * Stops a container
   */
  async stopContainer(containerIdOrName: string): Promise<void> {
    try {
      const container = this.docker.getContainer(containerIdOrName);
      await container.stop();
    } catch (err: any) {
      if (!err.message?.includes('already stopped') && !err.message?.includes('not running')) {
        this.logger.warn(`Failed to stop container ${containerIdOrName}: ${err.message}`);
      }
    }
  }

  /**
   * Lists Docker containers on the host
   */
  async listContainers(options: Docker.ContainerListOptions = { all: true }): Promise<Docker.ContainerInfo[]> {
    return new Promise((resolve) => {
      this.docker.listContainers(options, (err: any, containers: any) => {
        if (err) {
          this.logger.warn(`Error listing containers: ${err.message}`);
          return resolve([]);
        }
        resolve(containers || []);
      });
    });
  }

  /**
   * Removes a container
   */
  async removeContainer(containerIdOrName: string): Promise<void> {
    try {
      const container = this.docker.getContainer(containerIdOrName);
      await container.remove({ force: true });
    } catch (err: any) {
      if (!err.message?.includes('no such container')) {
        this.logger.warn(`Failed to remove container ${containerIdOrName}: ${err.message}`);
      }
    }
  }

  /**
   * Safely deletes Docker persistent volumes
   */
  async removeVolume(volumeName: string): Promise<void> {
    try {
      const volume = this.docker.getVolume(volumeName);
      await volume.remove();
      this.logger.log(`Successfully purged volume: ${volumeName}`);
    } catch (err: any) {
      this.logger.warn(`Could not remove volume ${volumeName}: ${err.message}`);
    }
  }

  /**
   * Fetches container metrics (CPU %, Memory, Network I/O)
   */
  async getContainerMetrics(containerId: string): Promise<ContainerMetricSnapshot | null> {
    try {
      const container = this.docker.getContainer(containerId);
      const stats = await container.stats({ stream: false });

      // CPU % calculation
      let cpuPercent = 0.0;
      const cpuDelta =
        stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
      const systemDelta =
        stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
      const onlineCpus = stats.cpu_stats.online_cpus || 1;

      if (systemDelta > 0 && cpuDelta > 0) {
        cpuPercent = (cpuDelta / systemDelta) * onlineCpus * 100.0;
      }

      // Memory
      const memoryUsage =
        stats.memory_stats.usage - (stats.memory_stats.stats?.cache || 0);
      const memoryLimit = stats.memory_stats.limit || 1;
      const memoryPercent = (memoryUsage / memoryLimit) * 100.0;

      // Network
      let networkRxBytes = 0;
      let networkTxBytes = 0;
      if (stats.networks) {
        for (const net of Object.values<any>(stats.networks)) {
          networkRxBytes += net.rx_bytes || 0;
          networkTxBytes += net.tx_bytes || 0;
        }
      }

      return {
        cpuPercent: Math.round(cpuPercent * 100) / 100,
        memoryUsageBytes: memoryUsage,
        memoryLimitBytes: memoryLimit,
        memoryPercent: Math.round(memoryPercent * 100) / 100,
        networkRxBytes,
        networkTxBytes,
      };
    } catch (err) {
      return null;
    }
  }

  /**
   * Fetches container logs (last 100 lines)
   */
  async getContainerLogs(containerId: string, tail: number = 100): Promise<string> {
    try {
      const container = this.docker.getContainer(containerId);
      const logsBuffer = await container.logs({
        stdout: true,
        stderr: true,
        tail,
        timestamps: true,
      });
      return logsBuffer.toString('utf-8');
    } catch (err: any) {
      return `Failed to fetch logs: ${err.message}`;
    }
  }
}
