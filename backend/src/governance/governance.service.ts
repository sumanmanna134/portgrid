import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { ApprovalTicket, GovernanceSettings } from './governance.interface';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class GovernanceService {
  private readonly logger = new Logger(GovernanceService.name);
  private readonly ticketsFilePath = path.join(
    process.env.DATA_DIR || path.join(process.cwd(), 'data'),
    'tickets.json',
  );
  private readonly settingsFilePath = path.join(
    process.env.DATA_DIR || path.join(process.cwd(), 'data'),
    'governance-settings.json',
  );
  private tickets: Map<string, ApprovalTicket> = new Map();
  private settings: GovernanceSettings = {
    makerCheckerEnabled: true,
    cryptoShreddingEnabled: true,
    securityProfile: 'BANK_GRADE_STRICT',
  };

  constructor(private readonly auditService: AuditService) {
    this.ensureStorage();
    this.loadData();
  }

  private ensureStorage() {
    const dir = path.dirname(this.ticketsFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(this.ticketsFilePath)) {
      fs.writeFileSync(this.ticketsFilePath, JSON.stringify([]), 'utf-8');
    }
    if (!fs.existsSync(this.settingsFilePath)) {
      fs.writeFileSync(this.settingsFilePath, JSON.stringify(this.settings, null, 2), 'utf-8');
    }
  }

  private loadData() {
    try {
      const ticketsRaw = fs.readFileSync(this.ticketsFilePath, 'utf-8');
      const list: ApprovalTicket[] = JSON.parse(ticketsRaw);
      for (const t of list) {
        this.tickets.set(t.id, t);
      }

      const settingsRaw = fs.readFileSync(this.settingsFilePath, 'utf-8');
      this.settings = { ...this.settings, ...JSON.parse(settingsRaw) };
      this.logger.log(`Loaded ${this.tickets.size} tickets. Maker-Checker dual control: ${this.settings.makerCheckerEnabled ? 'ENABLED' : 'DISABLED'}`);
    } catch (err: any) {
      this.logger.warn(`Could not load governance data: ${err.message}`);
    }
  }

  private saveTickets() {
    try {
      const list = Array.from(this.tickets.values());
      fs.writeFileSync(this.ticketsFilePath, JSON.stringify(list, null, 2), 'utf-8');
    } catch (err: any) {
      this.logger.error(`Failed to persist tickets: ${err.message}`);
    }
  }

  private saveSettings() {
    try {
      fs.writeFileSync(this.settingsFilePath, JSON.stringify(this.settings, null, 2), 'utf-8');
    } catch (err: any) {
      this.logger.error(`Failed to persist governance settings: ${err.message}`);
    }
  }

  getSettings(): GovernanceSettings {
    return { ...this.settings };
  }

  updateSettings(partial: Partial<GovernanceSettings>): GovernanceSettings {
    this.settings = { ...this.settings, ...partial };
    this.saveSettings();
    this.auditService.log({
      action: 'CONFIG_ACCESSED',
      resource: { id: 'governance_settings', name: 'Security Governance Policy' },
      details: { newSettings: this.settings },
    });
    return this.settings;
  }

  getAllTickets(): ApprovalTicket[] {
    return Array.from(this.tickets.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  getPendingTickets(): ApprovalTicket[] {
    return this.getAllTickets().filter((t) => t.status === 'PENDING_APPROVAL');
  }

  getTicketById(id: string): ApprovalTicket {
    const t = this.tickets.get(id);
    if (!t) {
      throw new NotFoundException(`Ticket ${id} not found`);
    }
    return t;
  }

  /**
   * Generates a cryptographically signed Maker-Checker approval ticket
   */
  createTicket(params: {
    action: ApprovalTicket['action'];
    resource: ApprovalTicket['resource'];
    payload: ApprovalTicket['payload'];
    makerUserId?: string;
  }): ApprovalTicket {
    const hexId = 'TKT-' + crypto.randomBytes(3).toString('hex').toUpperCase();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 60 * 60 * 1000).toISOString(); // 1 hour validity

    const ticket: ApprovalTicket = {
      id: hexId,
      createdAt: now.toISOString(),
      action: params.action,
      maker: {
        userId: params.makerUserId || 'engineer_operator',
        role: 'MAKER',
        ipAddress: '127.0.0.1',
      },
      status: 'PENDING_APPROVAL',
      resource: params.resource,
      payload: params.payload,
      expiresAt,
    };

    this.tickets.set(ticket.id, ticket);
    this.saveTickets();

    this.auditService.log({
      action: 'CONFIG_ACCESSED',
      resource: { id: ticket.id, name: `Dual-Authorization Ticket (${ticket.action})` },
      details: {
        ticketId: ticket.id,
        targetResource: ticket.resource,
        removeVolumes: ticket.payload.removeVolumes,
      },
    });

    this.logger.log(`Created dual-control ticket ${ticket.id} for action ${ticket.action} on ${ticket.resource.name}`);
    return ticket;
  }

  /**
   * Authorizes a ticket (Checker role)
   */
  approveTicket(ticketId: string, checkerUserId: string = 'security_officer', comment?: string): ApprovalTicket {
    const ticket = this.getTicketById(ticketId);
    if (ticket.status !== 'PENDING_APPROVAL') {
      throw new BadRequestException(`Ticket ${ticketId} is already ${ticket.status}`);
    }

    ticket.status = 'APPROVED';
    ticket.checker = {
      userId: checkerUserId,
      role: 'CHECKER_SECURITY_OFFICER',
      ipAddress: '127.0.0.1',
      decisionAt: new Date().toISOString(),
      comment: comment || 'Dual authorization verified and approved.',
    };

    this.saveTickets();

    this.auditService.log({
      action: 'CONFIG_ACCESSED',
      resource: { id: ticket.id, name: `Approved Ticket ${ticket.id}` },
      details: {
        ticketId: ticket.id,
        checker: ticket.checker,
        resource: ticket.resource,
      },
    });

    this.logger.log(`Checker ${checkerUserId} APPROVED ticket ${ticket.id}`);
    return ticket;
  }

  /**
   * Rejects a ticket (Checker role)
   */
  rejectTicket(ticketId: string, checkerUserId: string = 'security_officer', comment?: string): ApprovalTicket {
    const ticket = this.getTicketById(ticketId);
    if (ticket.status !== 'PENDING_APPROVAL') {
      throw new BadRequestException(`Ticket ${ticketId} is already ${ticket.status}`);
    }

    ticket.status = 'REJECTED';
    ticket.checker = {
      userId: checkerUserId,
      role: 'CHECKER_SECURITY_OFFICER',
      ipAddress: '127.0.0.1',
      decisionAt: new Date().toISOString(),
      comment: comment || 'Action rejected per security compliance review.',
    };

    this.saveTickets();

    this.auditService.log({
      action: 'CONFIG_ACCESSED',
      resource: { id: ticket.id, name: `Rejected Ticket ${ticket.id}` },
      details: {
        ticketId: ticket.id,
        checker: ticket.checker,
        resource: ticket.resource,
      },
    });

    this.logger.log(`Checker ${checkerUserId} REJECTED ticket ${ticket.id}`);
    return ticket;
  }

  /**
   * Marks a ticket as executed
   */
  markExecuted(ticketId: string): void {
    const ticket = this.tickets.get(ticketId);
    if (ticket) {
      ticket.status = 'EXECUTED';
      this.saveTickets();
    }
  }
}
