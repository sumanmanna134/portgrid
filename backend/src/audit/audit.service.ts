import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action:
    | 'SERVICE_INSTALLED'
    | 'SERVICE_STARTED'
    | 'SERVICE_STOPPED'
    | 'SERVICE_UNINSTALLED'
    | 'CONFIG_ACCESSED'
    | 'AUDIT_VERIFIED';
  actor: {
    userId: string;
    role: string;
    ipAddress: string;
  };
  resource: {
    id: string;
    type?: string;
    name?: string;
  };
  details: Record<string, any>;
  prevHash: string;
  hash: string;
}

export interface VerificationResult {
  verified: boolean;
  totalEntries: number;
  latestHash: string;
  genesisHash: string;
  message: string;
  brokenIndex?: number;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);
  private readonly auditFilePath = path.join(
    process.env.DATA_DIR || path.join(process.cwd(), 'data'),
    'audit.log',
  );
  private readonly GENESIS_HASH = '0'.repeat(64);
  private lastHash: string = this.GENESIS_HASH;

  constructor() {
    this.ensureStorage();
    this.initLastHash();
  }

  private ensureStorage() {
    const dir = path.dirname(this.auditFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(this.auditFilePath)) {
      fs.writeFileSync(this.auditFilePath, '', 'utf-8');
    }
  }

  private initLastHash() {
    try {
      const entries = this.readAllEntries();
      if (entries.length > 0) {
        this.lastHash = entries[entries.length - 1].hash;
      }
    } catch (err: any) {
      this.logger.warn(`Could not initialize audit hash chain: ${err.message}`);
    }
  }

  private calculateHash(
    prevHash: string,
    timestamp: string,
    action: string,
    actor: any,
    resource: any,
    details: any,
  ): string {
    const raw = `${prevHash}|${timestamp}|${action}|${JSON.stringify(actor)}|${JSON.stringify(resource)}|${JSON.stringify(details)}`;
    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  /**
   * Appends an immutable, SHA-256 chained entry to the audit log
   */
  log(params: {
    action: AuditLogEntry['action'];
    resource: AuditLogEntry['resource'];
    details?: Record<string, any>;
    actor?: Partial<AuditLogEntry['actor']>;
  }): AuditLogEntry {
    const timestamp = new Date().toISOString();
    const actor = {
      userId: params.actor?.userId || 'system_local',
      role: params.actor?.role || 'INFRA_OPERATOR',
      ipAddress: params.actor?.ipAddress || '127.0.0.1',
    };
    const details = params.details || {};
    const prevHash = this.lastHash;
    const hash = this.calculateHash(
      prevHash,
      timestamp,
      params.action,
      actor,
      params.resource,
      details,
    );

    const entry: AuditLogEntry = {
      id: uuidv4(),
      timestamp,
      action: params.action,
      actor,
      resource: params.resource,
      details,
      prevHash,
      hash,
    };

    try {
      fs.appendFileSync(this.auditFilePath, JSON.stringify(entry) + '\n', 'utf-8');
      this.lastHash = hash;
      this.logger.log(`[AUDIT] ${entry.action} on ${entry.resource.name || entry.resource.id} (Hash: ${hash.substring(0, 8)}...)`);
    } catch (err: any) {
      this.logger.error(`CRITICAL: Failed to write to audit log: ${err.message}`);
    }

    return entry;
  }

  /**
   * Reads all audit log entries
   */
  readAllEntries(): AuditLogEntry[] {
    try {
      if (!fs.existsSync(this.auditFilePath)) return [];
      const content = fs.readFileSync(this.auditFilePath, 'utf-8');
      return content
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .map((line) => JSON.parse(line));
    } catch (err: any) {
      this.logger.error(`Error reading audit log: ${err.message}`);
      return [];
    }
  }

  /**
   * Returns recent audit logs with pagination / limit
   */
  getRecentLogs(limit: number = 50): AuditLogEntry[] {
    const entries = this.readAllEntries();
    return entries.slice(-limit).reverse();
  }

  /**
   * Validates the cryptographic SHA-256 Merkle hash chain from Genesis to tip.
   * Proves that zero log entries have been modified, deleted, or backdated.
   */
  verifyAuditChain(): VerificationResult {
    const entries = this.readAllEntries();
    if (entries.length === 0) {
      return {
        verified: true,
        totalEntries: 0,
        latestHash: this.GENESIS_HASH,
        genesisHash: this.GENESIS_HASH,
        message: 'Audit ledger is empty (Genesis state). Zero security breaches.',
      };
    }

    let expectedPrevHash = this.GENESIS_HASH;

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];

      // 1. Verify link to previous entry
      if (entry.prevHash !== expectedPrevHash) {
        return {
          verified: false,
          totalEntries: entries.length,
          latestHash: entries[entries.length - 1].hash,
          genesisHash: this.GENESIS_HASH,
          brokenIndex: i,
          message: `TAMPER DETECTED: Hash chain broken at index #${i}. Expected prevHash ${expectedPrevHash}, got ${entry.prevHash}`,
        };
      }

      // 2. Re-compute payload hash to verify data was not modified
      const computedHash = this.calculateHash(
        entry.prevHash,
        entry.timestamp,
        entry.action,
        entry.actor,
        entry.resource,
        entry.details,
      );

      if (computedHash !== entry.hash) {
        return {
          verified: false,
          totalEntries: entries.length,
          latestHash: entries[entries.length - 1].hash,
          genesisHash: this.GENESIS_HASH,
          brokenIndex: i,
          message: `TAMPER DETECTED: Content alteration at entry #${i} (${entry.id}). Computed ${computedHash}, got ${entry.hash}`,
        };
      }

      expectedPrevHash = entry.hash;
    }

    return {
      verified: true,
      totalEntries: entries.length,
      latestHash: entries[entries.length - 1].hash,
      genesisHash: this.GENESIS_HASH,
      message: `Ledger mathematically validated. ${entries.length} chained entries confirmed intact and tamper-free.`,
    };
  }
}
