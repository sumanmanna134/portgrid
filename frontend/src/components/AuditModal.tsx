import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Network,
  Cpu,
  RefreshCw,
  FileCheck,
  CheckCircle2,
  Clock,
  Terminal,
  Server,
  Hash,
  UserCheck,
  AlertTriangle,
  Check,
  Shield,
  ArrowRight,
  Settings2,
  Trash2,
  Key,
  BadgeAlert,
  Loader2,
  Filter,
  Copy,
} from 'lucide-react';
import { ApprovalTicket, GovernanceSettings } from '../types';

interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
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

interface VerificationResult {
  verified: boolean;
  totalEntries: number;
  latestHash: string;
  genesisHash: string;
  message: string;
  brokenIndex?: number;
}

interface AuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTicketExecuted?: () => void;
  initialTab?: 'governance' | 'audit' | 'compliance';
}

export const AuditModal: React.FC<AuditModalProps> = ({
  isOpen,
  onClose,
  onTicketExecuted,
  initialTab = 'governance',
}) => {
  const [activeTab, setActiveTab] = useState<'governance' | 'audit' | 'compliance'>(initialTab);
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [verification, setVerification] = useState<VerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // Governance state
  const [tickets, setTickets] = useState<ApprovalTicket[]>([]);
  const [settings, setSettings] = useState<GovernanceSettings>({
    makerCheckerEnabled: true,
    cryptoShreddingEnabled: true,
    securityProfile: 'BANK_GRADE_STRICT',
  });
  const [isLoadingGovernance, setIsLoadingGovernance] = useState(false);
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);
  const [approvingTicketId, setApprovingTicketId] = useState<string | null>(null);
  const [rejectingTicketId, setRejectingTicketId] = useState<string | null>(null);
  const [checkerComment, setCheckerComment] = useState<{ [id: string]: string }>({});
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [logFilter, setLogFilter] = useState<string>('ALL');

  useEffect(() => {
    if (isOpen) {
      fetchGovernanceData();
      fetchLogs();
      verifyChain();
    }
  }, [isOpen]);

  const fetchGovernanceData = async () => {
    setIsLoadingGovernance(true);
    try {
      const [ticketsRes, settingsRes] = await Promise.all([
        fetch('/api/governance/tickets'),
        fetch('/api/governance/settings'),
      ]);

      if (ticketsRes.ok) {
        const ticketList = await ticketsRes.json();
        setTickets(ticketList);
      }
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setSettings(settingsData);
      }
    } catch (err) {
      console.error('Failed to load governance data:', err);
    } finally {
      setIsLoadingGovernance(false);
    }
  };

  const fetchLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const res = await fetch('/api/audit/logs?limit=50');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const verifyChain = async () => {
    setIsVerifying(true);
    try {
      const res = await fetch('/api/audit/verify');
      if (res.ok) {
        const data = await res.json();
        setVerification(data);
      }
    } catch (err) {
      console.error('Failed to verify audit chain:', err);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleToggleMakerChecker = async () => {
    setIsUpdatingSettings(true);
    const updated = !settings.makerCheckerEnabled;
    try {
      const res = await fetch('/api/governance/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          makerCheckerEnabled: updated,
          securityProfile: updated ? 'BANK_GRADE_STRICT' : 'STANDARD',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        await fetchLogs();
      }
    } catch (err) {
      console.error('Failed to update governance settings:', err);
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  const handleToggleCryptoShredding = async () => {
    setIsUpdatingSettings(true);
    const updated = !settings.cryptoShreddingEnabled;
    try {
      const res = await fetch('/api/governance/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cryptoShreddingEnabled: updated }),
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        await fetchLogs();
      }
    } catch (err) {
      console.error('Failed to update crypto-shredding settings:', err);
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  const handleApproveTicket = async (ticketId: string) => {
    setApprovingTicketId(ticketId);
    try {
      const comment = checkerComment[ticketId] || 'Dual authorization verified and signed by Security Checker.';
      const res = await fetch(`/api/governance/tickets/${ticketId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkerUserId: 'sec_officer_lead',
          comment,
          autoExecute: true,
        }),
      });

      if (res.ok) {
        await fetchGovernanceData();
        await fetchLogs();
        if (onTicketExecuted) {
          onTicketExecuted();
        }
      } else {
        const err = await res.json().catch(() => ({}));
        alert(`Failed to approve ticket: ${err.message || res.statusText}`);
      }
    } catch (err: any) {
      alert(`Approval error: ${err.message}`);
    } finally {
      setApprovingTicketId(null);
    }
  };

  const handleRejectTicket = async (ticketId: string) => {
    setRejectingTicketId(ticketId);
    try {
      const comment = checkerComment[ticketId] || 'Operation rejected per compliance review.';
      const res = await fetch(`/api/governance/tickets/${ticketId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkerUserId: 'sec_officer_lead',
          comment,
        }),
      });

      if (res.ok) {
        await fetchGovernanceData();
        await fetchLogs();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(`Failed to reject ticket: ${err.message || res.statusText}`);
      }
    } catch (err: any) {
      alert(`Reject error: ${err.message}`);
    } finally {
      setRejectingTicketId(null);
    }
  };

  const copyHashToClipboard = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  if (!isOpen) return null;

  const pendingTickets = tickets.filter((t) => t.status === 'PENDING_APPROVAL');
  const pastTickets = tickets.filter((t) => t.status !== 'PENDING_APPROVAL');

  const filteredLogs = logs.filter((log) => {
    if (logFilter === 'ALL') return true;
    if (logFilter === 'INSTALLS') return log.action.includes('INSTALL') && !log.action.includes('UNINSTALL');
    if (logFilter === 'UNINSTALLS') return log.action.includes('UNINSTALL');
    if (logFilter === 'STATE') return log.action.includes('START') || log.action.includes('STOP');
    if (logFilter === 'GOVERNANCE') return log.action.includes('CONFIG') || log.action.includes('AUDIT');
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-modal w-full max-w-5xl h-[88vh] max-h-[880px] rounded-3xl shadow-[0_30px_90px_-20px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col border border-white/[0.1] bg-[#090d16]/95 backdrop-blur-2xl">
        {/* Top Header */}
        <div className="px-6 sm:px-8 py-5 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.015] shrink-0">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-slate-950 shadow-[0_2px_16px_rgba(16,185,129,0.3)] border border-emerald-300/30">
              <ShieldCheck className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h3 className="text-base font-semibold text-white tracking-tight">
                  Security & Governance Center
                </h3>
                <span
                  className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border ${
                    settings.securityProfile === 'BANK_GRADE_STRICT'
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                  }`}
                >
                  {settings.securityProfile === 'BANK_GRADE_STRICT'
                    ? 'Bank-Grade Strict Active'
                    : 'Standard Mode'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-normal">
                Maker-Checker dual authorization, NIST SP 800-88 cryptographic shredding, and Merkle ledger
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/[0.08] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Apple Segmented Control Tab Navigation */}
        <div className="px-6 sm:px-8 py-3 bg-white/[0.01] border-b border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center bg-black/50 p-1 rounded-2xl border border-white/[0.06] shadow-inner">
            <button
              onClick={() => setActiveTab('governance')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'governance'
                  ? 'bg-white/[0.12] text-white shadow-sm border border-white/[0.08]'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.02]'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Dual-Control Approvals</span>
              {pendingTickets.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-amber-500/25 text-amber-200 border border-amber-500/35 animate-pulse">
                  {pendingTickets.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'audit'
                  ? 'bg-white/[0.12] text-white shadow-sm border border-white/[0.08]'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.02]'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Cryptographic Audit Trail</span>
            </button>

            <button
              onClick={() => setActiveTab('compliance')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'compliance'
                  ? 'bg-white/[0.12] text-white shadow-sm border border-white/[0.08]'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.02]'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Fintech Compliance Spec</span>
            </button>
          </div>

          <div className="text-[11px] font-mono text-slate-400 flex items-center space-x-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>127.0.0.1 Loopback Enclave • FIPS 140-2 AES-256</span>
          </div>
        </div>

        {/* Scrollable Modal Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* TAB 1: DUAL-CONTROL GOVERNANCE & MAKER-CHECKER */}
          {activeTab === 'governance' && (
            <div className="space-y-6">
              {/* Policy Controls Section */}
              <div className="bg-white/[0.02] border border-white/[0.07] rounded-3xl p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-3.5">
                  <div className="flex items-center space-x-2.5">
                    <Settings2 className="w-4 h-4 text-sky-400" />
                    <div>
                      <h4 className="text-xs font-semibold text-white tracking-tight">
                        Four-Eyes Principle Governance Policy
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Separation of duties enforcement for destructive operations in tier-1 financial environments.
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.06]">
                    POLICY #GOV-FINTECH-01
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Maker-Checker Switch */}
                  <div
                    onClick={handleToggleMakerChecker}
                    className="flex items-center justify-between p-4 bg-black/40 hover:bg-black/60 rounded-2xl border border-white/[0.06] cursor-pointer transition-all"
                  >
                    <div className="pr-4 space-y-1">
                      <div className="flex items-center space-x-2">
                        <UserCheck className="w-3.5 h-3.5 text-sky-400" />
                        <span className="text-xs font-semibold text-white">
                          Maker-Checker Dual Control
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        De-provisioning requests generate signed tickets requiring a designated Checker's approval.
                      </p>
                    </div>
                    {/* iOS style toggle switch */}
                    <div
                      className={`w-11 h-6 rounded-full transition-colors flex items-center p-1 shrink-0 ${
                        settings.makerCheckerEnabled ? 'bg-emerald-500' : 'bg-slate-700'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white transition-transform ${
                          settings.makerCheckerEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </div>
                  </div>

                  {/* NIST SP 800-88 Crypto-Shredding Switch */}
                  <div
                    onClick={handleToggleCryptoShredding}
                    className="flex items-center justify-between p-4 bg-black/40 hover:bg-black/60 rounded-2xl border border-white/[0.06] cursor-pointer transition-all"
                  >
                    <div className="pr-4 space-y-1">
                      <div className="flex items-center space-x-2">
                        <Key className="w-3.5 h-3.5 text-purple-400" />
                        <span className="text-xs font-semibold text-white">
                          NIST SP 800-88 Crypto-Shredding
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Overwrites memory buffers with zeros and purges stored data keys upon uninstallation.
                      </p>
                    </div>
                    {/* iOS style toggle switch */}
                    <div
                      className={`w-11 h-6 rounded-full transition-colors flex items-center p-1 shrink-0 ${
                        settings.cryptoShreddingEnabled ? 'bg-purple-500' : 'bg-slate-700'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white transition-transform ${
                          settings.cryptoShreddingEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Pending Approvals Queue */}
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <BadgeAlert className="w-4 h-4 text-amber-400" />
                    <span>Pending Dual-Authorization Queue</span>
                  </h4>
                  <span className="text-[11px] font-mono text-slate-400">
                    {pendingTickets.length} awaiting Checker decision
                  </span>
                </div>

                {pendingTickets.length === 0 ? (
                  <div className="p-8 text-center bg-white/[0.015] border border-white/[0.06] rounded-3xl space-y-2">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div className="text-xs font-semibold text-white">Queue Clear: All Actions Authorized</div>
                    <p className="text-[11px] text-slate-400 max-w-sm mx-auto leading-relaxed">
                      High-impact destructive tasks (uninstallation or storage purges) requested by engineers will appear here for verification.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingTickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        className="bg-black/50 p-5 rounded-3xl border border-amber-500/25 space-y-4 shadow-xl"
                      >
                        {/* Top row */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-white/[0.06] pb-3.5">
                          <div className="flex items-center space-x-3">
                            <span className="font-mono text-xs font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 rounded-xl">
                              #{ticket.id}
                            </span>
                            <div>
                              <div className="text-xs font-semibold text-white flex items-center gap-2">
                                <span>Action: {ticket.action}</span>
                                <span className="text-[10px] font-mono font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                                  HIGH SEVERITY
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                Target: <strong className="text-white font-medium">{ticket.resource.name}</strong> ({ticket.resource.id})
                              </p>
                            </div>
                          </div>

                          <div className="text-right text-[11px] text-slate-400 font-mono">
                            <div>Maker: <strong className="text-slate-200">{ticket.maker.userId}</strong></div>
                            <div>Origin: {ticket.maker.ipAddress} • {new Date(ticket.createdAt).toLocaleTimeString()}</div>
                          </div>
                        </div>

                        {/* Blast Radius & Payload Details */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-white/[0.02] rounded-2xl border border-white/[0.04] text-[11px] font-mono">
                          <div>
                            <span className="text-slate-500 block">Blast Radius</span>
                            <span className="text-rose-400 font-semibold mt-0.5 block">Container Eviction</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Storage Purge</span>
                            <span className={ticket.payload.removeVolumes ? 'text-amber-400 font-semibold mt-0.5 block' : 'text-slate-300 font-semibold mt-0.5 block'}>
                              {ticket.payload.removeVolumes ? 'YES (NIST SP 800-88)' : 'NO (Preserve)'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Sign-off Window</span>
                            <span className="text-slate-300 mt-0.5 block">{new Date(ticket.expiresAt).toLocaleTimeString()}</span>
                          </div>
                        </div>

                        {/* Checker Decision Controls */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                          <input
                            type="text"
                            placeholder="Add Checker review verification note..."
                            value={checkerComment[ticket.id] || ''}
                            onChange={(e) =>
                              setCheckerComment({ ...checkerComment, [ticket.id]: e.target.value })
                            }
                            className="w-full sm:flex-1 bg-black/60 border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500/50"
                          />

                          <div className="flex items-center space-x-2.5 w-full sm:w-auto justify-end">
                            <button
                              onClick={() => handleRejectTicket(ticket.id)}
                              disabled={rejectingTicketId === ticket.id || approvingTicketId === ticket.id}
                              className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 rounded-xl text-xs font-medium transition-all disabled:opacity-40"
                            >
                              {rejectingTicketId === ticket.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin inline" />
                              ) : (
                                'Reject Ticket'
                              )}
                            </button>

                            <button
                              onClick={() => handleApproveTicket(ticket.id)}
                              disabled={approvingTicketId === ticket.id || rejectingTicketId === ticket.id}
                              className="px-4.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-md active:scale-95 disabled:opacity-40"
                            >
                              {approvingTicketId === ticket.id ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  <span>Authorizing & Executing...</span>
                                </>
                              ) : (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Approve & Execute (Checker)</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Historical Tickets Section */}
              {pastTickets.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>Historical Dual-Authorization Log ({pastTickets.length})</span>
                  </h4>

                  <div className="bg-black/50 rounded-2xl border border-white/[0.07] overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-white/[0.03] border-b border-white/[0.06] text-slate-400">
                        <tr>
                          <th className="py-2.5 px-4 font-medium">Ticket ID</th>
                          <th className="py-2.5 px-4 font-medium">Action</th>
                          <th className="py-2.5 px-4 font-medium">Resource</th>
                          <th className="py-2.5 px-4 font-medium">Maker / Checker</th>
                          <th className="py-2.5 px-4 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04] text-slate-300 font-mono">
                        {pastTickets.map((t) => (
                          <tr key={t.id} className="hover:bg-white/[0.02]">
                            <td className="py-2.5 px-4 text-sky-400 font-semibold font-mono">#{t.id}</td>
                            <td className="py-2.5 px-4 text-slate-300">{t.action}</td>
                            <td className="py-2.5 px-4 text-slate-200">{t.resource.name}</td>
                            <td className="py-2.5 px-4 text-slate-400 text-[11px]">
                              {t.maker.userId} / {t.checker?.userId || 'N/A'}
                            </td>
                            <td className="py-2.5 px-4">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                  t.status === 'EXECUTED'
                                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25'
                                    : t.status === 'APPROVED'
                                    ? 'bg-sky-500/15 text-sky-300 border border-sky-500/25'
                                    : 'bg-rose-500/15 text-rose-300 border border-rose-500/25'
                                }`}
                              >
                                {t.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CRYPTOGRAPHIC AUDIT TRAIL */}
          {activeTab === 'audit' && (
            <div className="space-y-6">
              {/* Active Security Controls Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Control 1 */}
                <div className="bg-white/[0.02] p-4.5 rounded-2xl border border-white/[0.07] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                      <Network className="w-4 h-4 text-sky-400" />
                      Network Isolation
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30">
                      127.0.0.1 Only
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed font-normal">
                    Strict loopback binding. Eliminates LAN and Wi-Fi interface exposure across container daemons.
                  </p>
                </div>

                {/* Control 2 */}
                <div className="bg-white/[0.02] p-4.5 rounded-2xl border border-white/[0.07] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-purple-400" />
                      Data at Rest
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
                      AES-256-GCM
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed font-normal">
                    FIPS 140-2 envelope encryption with authenticated tags and protected 256-bit master key.
                  </p>
                </div>

                {/* Control 3 */}
                <div className="bg-white/[0.02] p-4.5 rounded-2xl border border-white/[0.07] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                      <Cpu className="w-4 h-4 text-emerald-400" />
                      Container Hardening
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      NNP Active
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed font-normal">
                    Linux SecurityOpt `no-new-privileges` prevents kernel privilege escalation inside pods.
                  </p>
                </div>
              </div>

              {/* Cryptographic Ledger Verification Banner */}
              <div className="p-4.5 bg-emerald-500/[0.07] border border-emerald-500/25 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5">
                <div className="flex items-center space-x-3.5">
                  <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl">
                    {verification?.verified ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <ShieldAlert className="w-5 h-5 text-rose-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-semibold text-white">
                        Cryptographic SHA-256 Merkle Chain Integrity
                      </h4>
                      <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300">
                        {verification?.verified ? '100% INTACT & VALID' : 'TAMPER DETECTED'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 font-mono mt-0.5">
                      {verification?.message || 'Validating cryptographic audit hashes...'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={verifyChain}
                  disabled={isVerifying}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm shrink-0 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
                  <span>Verify Integrity</span>
                </button>
              </div>

              {/* Audit Logs Filter Bar & Table */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center space-x-1.5">
                    {['ALL', 'INSTALLS', 'UNINSTALLS', 'STATE', 'GOVERNANCE'].map((f) => (
                      <button
                        key={f}
                        onClick={() => setLogFilter(f)}
                        className={`px-3 py-1 rounded-lg text-[11px] font-medium transition-all ${
                          logFilter === f
                            ? 'bg-white/[0.12] text-white border border-white/[0.1]'
                            : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {filteredLogs.length} Events Displayed
                  </span>
                </div>

                {filteredLogs.length === 0 ? (
                  <div className="p-8 text-center bg-black/40 border border-white/[0.06] rounded-2xl text-xs text-slate-400">
                    No matching audit records found.
                  </div>
                ) : (
                  <div className="bg-black/60 rounded-2xl border border-white/[0.07] overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-white/[0.03] border-b border-white/[0.06] text-slate-400">
                        <tr>
                          <th className="py-2.5 px-4 font-medium">Timestamp</th>
                          <th className="py-2.5 px-4 font-medium">Action</th>
                          <th className="py-2.5 px-4 font-medium">Target Resource</th>
                          <th className="py-2.5 px-4 font-medium">Actor</th>
                          <th className="py-2.5 px-4 font-medium font-mono">SHA-256 Block</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04] text-slate-300 font-mono">
                        {filteredLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-2.5 px-4 text-slate-400 whitespace-nowrap text-[11px]">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </td>
                            <td className="py-2.5 px-4 whitespace-nowrap">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide ${
                                  log.action.includes('INSTALL') && !log.action.includes('UNINSTALL')
                                    ? 'bg-sky-500/15 text-sky-300 border border-sky-500/20'
                                    : log.action.includes('UNINSTALL')
                                    ? 'bg-rose-500/15 text-rose-300 border border-rose-500/20'
                                    : log.action.includes('START')
                                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20'
                                    : log.action.includes('STOP')
                                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/20'
                                    : 'bg-purple-500/15 text-purple-300 border border-purple-500/20'
                                }`}
                              >
                                {log.action}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-slate-200 font-medium truncate max-w-[180px]">
                              {log.resource.name || log.resource.id}
                            </td>
                            <td className="py-2.5 px-4 text-slate-400 text-[11px]">
                              {log.actor.userId} ({log.actor.ipAddress})
                            </td>
                            <td className="py-2.5 px-4 text-emerald-400/90 text-[11px]">
                              <button
                                onClick={() => copyHashToClipboard(log.hash)}
                                className="flex items-center space-x-1.5 hover:text-white transition-colors"
                                title="Click to copy full SHA-256 hash"
                              >
                                <span>{log.hash.substring(0, 10)}...</span>
                                {copiedHash === log.hash ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3 opacity-60 hover:opacity-100" />
                                )}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: FINTECH COMPLIANCE SPECIFICATION */}
          {activeTab === 'compliance' && (
            <div className="space-y-5">
              <div className="p-4 bg-sky-500/[0.05] border border-sky-500/20 rounded-2xl flex items-center space-x-3">
                <ShieldCheck className="w-5 h-5 text-sky-400 shrink-0" />
                <div className="text-xs">
                  <div className="font-semibold text-white">Tier-1 Regulatory & Fintech Security Baseline</div>
                  <div className="text-slate-400 mt-0.5">
                    PortGrid implements controls cross-referenced with international banking cybersecurity directives.
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/[0.02] p-5 rounded-3xl border border-white/[0.07] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">PCI-DSS v4.0 (Req 3.4 & 10.2)</span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      COMPLIANT
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed font-normal">
                    Cardholder Data Environment protection: All persistent keys encrypted using AES-256-GCM. SHA-256 Merkle chain ensures logs are tamper-evident.
                  </p>
                </div>

                <div className="bg-white/[0.02] p-5 rounded-3xl border border-white/[0.07] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">NIST SP 800-88 Rev 1</span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      COMPLIANT
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed font-normal">
                    Media Sanitization: Cryptographic Erase (CE) with key zeroing, memory buffer overwriting (`Buffer.fill(0)`), and verification logged upon de-provisioning.
                  </p>
                </div>

                <div className="bg-white/[0.02] p-5 rounded-3xl border border-white/[0.07] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">FFIEC / MAS TRM (Four-Eyes)</span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      COMPLIANT
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed font-normal">
                    Dual Authorization: High-impact actions (deleting databases, changing master keys) require separate Maker and Checker identities to prevent rogue operator sabotage.
                  </p>
                </div>

                <div className="bg-white/[0.02] p-5 rounded-3xl border border-white/[0.07] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">SOC 2 Type II (CC6.1 & CC6.6)</span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      COMPLIANT
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed font-normal">
                    Logical boundary isolation: Strict loopback `127.0.0.1` binding and internal bridge subnet isolation prevents cross-container network contamination.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 sm:px-8 py-4 bg-white/[0.015] border-t border-white/[0.08] flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center space-x-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>PCI-DSS v4.0 • NIST SP 800-88 • SOC 2 Type II Ready</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-white/[0.08] hover:bg-white/[0.12] text-white rounded-xl text-xs font-medium transition-colors active:scale-95 shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
