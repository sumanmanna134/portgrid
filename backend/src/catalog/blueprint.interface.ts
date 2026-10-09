export interface VolumeSpec {
  name: string;
  mountPath: string;
}

export interface PortMapping {
  hostPort: number;
  containerPort: number;
}

export interface ContainerSpec {
  namePrefix: string;
  image: string;
  defaultPort: number;
  internalPort?: number; // Internal container port if different from defaultPort
  additionalPorts?: Array<{ defaultHostPort: number; containerPort: number; isUi?: boolean }>;
  env: Record<string, string>;
  volumes?: VolumeSpec[];
  cmd?: string[];
}

export interface CompanionUiSpec {
  name: string;
  namePrefix: string;
  image: string;
  defaultPort: number;
  internalPort?: number; // Internal container port (e.g. 80 for pgadmin, 8080 for kafka-ui)
  env: Record<string, string>;
  note?: string;
  serversJson?: any; // For pgAdmin auto-provisioning
}

export interface ServiceBlueprint {
  id: string;
  name: string;
  category: 'Database' | 'Message Broker' | 'Cache' | 'Identity' | 'DevOps' | 'Search' | 'Analytics' | 'Other';
  description: string;
  icon: string;
  isOfficial?: boolean; // True for built-in system blueprints; false for custom onboarding
  engine: ContainerSpec;
  companionUi?: CompanionUiSpec;
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
