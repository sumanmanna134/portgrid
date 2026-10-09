export interface ServiceBlueprint {
  id: string;
  name: string;
  category: 'Database' | 'Message Broker' | 'Cache' | 'Identity' | 'DevOps' | 'Search' | 'Analytics' | 'Other';
  description: string;
  icon: string;
  isOfficial?: boolean;
  engine: {
    namePrefix: string;
    image: string;
    defaultPort: number;
    internalPort?: number;
    env: Record<string, string>;
    volumes?: Array<{ name: string; mountPath: string }>;
    cmd?: string[];
  };
  companionUi?: {
    name: string;
    namePrefix: string;
    image: string;
    defaultPort: number;
    internalPort?: number;
    env?: Record<string, string>;
    note?: string;
  };
  connectionFormatters: {
    uri?: string;
    jdbc?: string;
    envSnippet: string;
    notes?: string;
  };
}

export interface InstalledServiceInstance {
  id: string;
  blueprintId: string;
  name: string;
  status: 'STARTING' | 'RUNNING' | 'STOPPED' | 'ERROR';
  createdAt: string;
  enginePort: number;
  uiPort?: number;
  engineContainerId?: string;
  uiContainerId?: string;
  volumes: string[];
  secrets: Record<string, string>;
  connectionStrings: {
    uri?: string;
    jdbc?: string;
    envSnippet: string;
  };
  uiUrl?: string;
}

export interface ContainerMetrics {
  cpuPercent: number;
  memoryUsageBytes: number;
  memoryLimitBytes: number;
  memoryPercent: number;
  networkRxBytes: number;
  networkTxBytes: number;
}

export type TicketStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'EXECUTED';

export interface ApprovalTicket {
  id: string; // e.g. TKT-F4A92
  createdAt: string;
  action: 'UNINSTALL_SERVICE' | 'ROTATE_MASTER_KEY' | 'PURGE_STORAGE';
  maker: {
    userId: string;
    role: string;
    ipAddress: string;
  };
  checker?: {
    userId: string;
    role: string;
    ipAddress: string;
    decisionAt: string;
    comment?: string;
  };
  status: TicketStatus;
  resource: {
    id: string;
    name: string;
    type?: string;
  };
  payload: {
    removeVolumes: boolean;
    reason?: string;
  };
  expiresAt: string;
}

export interface GovernanceSettings {
  makerCheckerEnabled: boolean;
  cryptoShreddingEnabled: boolean;
  securityProfile: 'STANDARD' | 'BANK_GRADE_STRICT';
}
