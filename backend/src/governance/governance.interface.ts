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
