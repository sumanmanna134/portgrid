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
  Search,
  ChevronDown,
  ChevronRight,
  Database,
  Layers,
} from 'lucide-react';
import { ApprovalTicket, GovernanceSettings } from '../types';
import { AUDIT_MODAL_STRINGS, COMMON_STRINGS } from '../constants/strings';

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
  initialTab = 'audit',
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
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

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
      const comment = checkerComment[ticketId] || AUDIT_MODAL_STRINGS.defaultCheckerApprovalComment;
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
        alert(`${AUDIT_MODAL_STRINGS.failedApprovePrefix} ${err.message || res.statusText}`);
      }
    } catch (err: any) {
      alert(`${AUDIT_MODAL_STRINGS.approvalErrorPrefix} ${err.message}`);
    } finally {
      setApprovingTicketId(null);
    }
  };

  const handleRejectTicket = async (ticketId: string) => {
    setRejectingTicketId(ticketId);
    try {
      const comment = checkerComment[ticketId] || AUDIT_MODAL_STRINGS.defaultCheckerRejectComment;
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
        alert(`${AUDIT_MODAL_STRINGS.failedRejectPrefix} ${err.message || res.statusText}`);
      }
    } catch (err: any) {
      alert(`${AUDIT_MODAL_STRINGS.rejectErrorPrefix} ${err.message}`);
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

  // Filter and search logic
  const filteredLogs = logs.filter((log) => {
    // 1. Category Filter
    let matchesCategory = true;
    if (logFilter === 'INSTALLS') matchesCategory = log.action.includes('INSTALL') && !log.action.includes('UNINSTALL');
    else if (logFilter === 'UNINSTALLS') matchesCategory = log.action.includes('UNINSTALL');
    else if (logFilter === 'STATE') matchesCategory = log.action.includes('START') || log.action.includes('STOP');
    else if (logFilter === 'GOVERNANCE') matchesCategory = log.action.includes('CONFIG') || log.action.includes('AUDIT');

    let matchesSearch = true;
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      matchesSearch =
        log.action.toLowerCase().includes(q) ||
        (log.resource.name || '').toLowerCase().includes(q) ||
        log.resource.id.toLowerCase().includes(q) ||
        log.actor.userId.toLowerCase().includes(q) ||
        log.hash.toLowerCase().includes(q);
    }

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-modal w-full max-w-5xl h-[88vh] max-h-[880px] rounded-3xl shadow-[0_30px_90px_-20px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col border border-white/[0.1] bg-[#090d16]/95 backdrop-blur-2xl">
        {/* Top Header */}
        <div className="px-6 sm:px-8 pt-6 pb-5 border-b border-white/[0.08] flex items-center justify-between gap-4 bg-white/[0.015] shrink-0">
          <div className="flex items-center space-x-4 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-slate-950 shadow-[0_2px_16px_rgba(16,185,129,0.3)] border border-emerald-300/30 shrink-0">
              <ShieldCheck className="w-5 h-5 text-slate-950" />
            </div>
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h3 className="text-base sm:text-lg font-semibold text-white tracking-tight">
                  {AUDIT_MODAL_STRINGS.title}
                </h3>
                <span
                  className={`text-[10px] font-mono font-bold tracking-wider px-2.5 py-0.5 rounded-full border shrink-0 ${settings.securityProfile === 'BANK_GRADE_STRICT'
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    : 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                    }`}
                >
                  {settings.securityProfile === 'BANK_GRADE_STRICT'
                    ? AUDIT_MODAL_STRINGS.profileStrict
                    : AUDIT_MODAL_STRINGS.profileStandard}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-normal leading-relaxed truncate sm:overflow-visible">
                {AUDIT_MODAL_STRINGS.subtitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/[0.08] transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Apple Segmented Control Tab Navigation */}
        <div className="px-6 sm:px-8 py-3.5 bg-white/[0.01] border-b border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center bg-black/50 p-1 rounded-2xl border border-white/[0.06] shadow-inner gap-1">
            <button
              onClick={() => setActiveTab('audit')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${activeTab === 'audit'
                ? 'bg-white/[0.12] text-white shadow-sm border border-white/[0.08]'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.02]'
                }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>{AUDIT_MODAL_STRINGS.tabAudit}</span>
            </button>

            <button
              onClick={() => setActiveTab('governance')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${activeTab === 'governance'
                ? 'bg-white/[0.12] text-white shadow-sm border border-white/[0.08]'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.02]'
                }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>{AUDIT_MODAL_STRINGS.tabGovernance}</span>
              {pendingTickets.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-amber-500/25 text-amber-200 border border-amber-500/35 animate-pulse">
                  {pendingTickets.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('compliance')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${activeTab === 'compliance'
                ? 'bg-white/[0.12] text-white shadow-sm border border-white/[0.08]'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.02]'
                }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>{AUDIT_MODAL_STRINGS.tabCompliance}</span>
            </button>
          </div>

          <div className="text-[11px] font-mono text-slate-400 flex items-center space-x-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>{AUDIT_MODAL_STRINGS.loopbackEnclaveBadge}</span>
          </div>
        </div>

        {/* Scrollable Modal Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* TAB 1: CRYPTOGRAPHIC AUDIT TRAIL */}
          {activeTab === 'audit' && (
            <div className="space-y-5">
              {/* Refined Unified Header: Cryptographic Status & Safeguards */}
              <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-500/[0.08] via-emerald-500/[0.03] to-transparent border border-emerald-500/20 rounded-3xl space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
                      {verification?.verified ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <ShieldAlert className="w-5 h-5 text-rose-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2.5">
                        <h4 className="text-sm font-semibold text-white tracking-tight">
                          {AUDIT_MODAL_STRINGS.merkleLedgerTitle}
                        </h4>
                        <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {verification?.verified ? AUDIT_MODAL_STRINGS.intactBadge : AUDIT_MODAL_STRINGS.tamperBadge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 font-mono mt-0.5">
                        {verification?.message || AUDIT_MODAL_STRINGS.validatingChain}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={verifyChain}
                    disabled={isVerifying}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-md active:scale-95 shrink-0 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
                    <span>{AUDIT_MODAL_STRINGS.verifyChainButton}</span>
                  </button>
                </div>

                {/* Micro Safeguard Badges */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 border-t border-white/[0.06]">
                  <div className="flex items-center space-x-2.5 px-3 py-2 rounded-xl bg-black/40 border border-white/[0.05]">
                    <Network className="w-4 h-4 text-sky-400 shrink-0" />
                    <div className="truncate">
                      <span className="text-[10px] text-slate-400 block font-mono">{AUDIT_MODAL_STRINGS.networkBoundaryLabel}</span>
                      <span className="text-xs font-medium text-white truncate">{AUDIT_MODAL_STRINGS.networkBoundaryValue}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2.5 px-3 py-2 rounded-xl bg-black/40 border border-white/[0.05]">
                    <Lock className="w-4 h-4 text-purple-400 shrink-0" />
                    <div className="truncate">
                      <span className="text-[10px] text-slate-400 block font-mono">{AUDIT_MODAL_STRINGS.storageEncryptionLabel}</span>
                      <span className="text-xs font-medium text-white truncate">{AUDIT_MODAL_STRINGS.storageEncryptionValue}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2.5 px-3 py-2 rounded-xl bg-black/40 border border-white/[0.05]">
                    <Cpu className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div className="truncate">
                      <span className="text-[10px] text-slate-400 block font-mono">{AUDIT_MODAL_STRINGS.runtimeIsolationLabel}</span>
                      <span className="text-xs font-medium text-white truncate">{AUDIT_MODAL_STRINGS.runtimeIsolationValue}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ledger Controls: Filters & Search */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Category Pills */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {[
                      { id: 'ALL', label: AUDIT_MODAL_STRINGS.logFilterAll },
                      { id: 'INSTALLS', label: AUDIT_MODAL_STRINGS.logFilterInstalls },
                      { id: 'UNINSTALLS', label: AUDIT_MODAL_STRINGS.logFilterUninstalls },
                      { id: 'STATE', label: AUDIT_MODAL_STRINGS.logFilterLifecycle },
                      { id: 'GOVERNANCE', label: AUDIT_MODAL_STRINGS.logFilterGovernance },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setLogFilter(tab.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${logFilter === tab.id
                          ? 'bg-white/[0.12] text-white border border-white/[0.1] shadow-sm'
                          : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
                          }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Search box & Count badge */}
                  <div className="flex items-center space-x-3">
                    <div className="relative w-full sm:w-60">
                      <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder={AUDIT_MODAL_STRINGS.searchPlaceholder}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-black/40 border border-white/[0.08] rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500/50"
                      />
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono shrink-0">
                      {filteredLogs.length}{AUDIT_MODAL_STRINGS.blocksSuffix}
                    </span>
                  </div>
                </div>

                {/* Dedicated Scroll Container with Sticky Header */}
                {filteredLogs.length === 0 ? (
                  <div className="p-10 text-center bg-black/30 border border-white/[0.06] rounded-2xl space-y-2 text-slate-400">
                    <FileCheck className="w-8 h-8 mx-auto text-slate-500" />
                    <div className="text-xs font-medium text-white">{AUDIT_MODAL_STRINGS.emptyRecordsTitle}</div>
                    <p className="text-[11px] text-slate-500">
                      {AUDIT_MODAL_STRINGS.emptyRecordsDesc}
                    </p>
                  </div>
                ) : (
                  <div className="bg-black/50 rounded-2xl border border-white/[0.08] overflow-hidden shadow-inner flex flex-col">
                    <div className="overflow-x-auto overflow-y-auto max-h-[380px]">
                      <table className="w-full text-left border-collapse text-xs min-w-[780px]">
                        <thead className="bg-[#0f1422] border-b border-white/[0.08] text-slate-400 sticky top-0 z-10 backdrop-blur-md">
                          <tr>
                            <th className="py-3 px-4 font-semibold w-24">{AUDIT_MODAL_STRINGS.thTimestamp}</th>
                            <th className="py-3 px-4 font-semibold w-44">{AUDIT_MODAL_STRINGS.thEventAction}</th>
                            <th className="py-3 px-4 font-semibold w-52">{AUDIT_MODAL_STRINGS.thTargetResource}</th>
                            <th className="py-3 px-4 font-semibold w-40">{AUDIT_MODAL_STRINGS.thActorIdentity}</th>
                            <th className="py-3 px-4 font-semibold w-44">{AUDIT_MODAL_STRINGS.thShaBlock}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04] text-slate-300 font-mono">
                          {filteredLogs.map((log) => {
                            const isExpanded = expandedLogId === log.id;
                            return (
                              <React.Fragment key={log.id}>
                                <tr
                                  onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                                  className={`hover:bg-white/[0.025] transition-colors cursor-pointer select-none ${isExpanded ? 'bg-white/[0.03]' : ''
                                    }`}
                                >
                                  {/* Timestamp */}
                                  <td className="py-2.5 px-4 text-slate-400 whitespace-nowrap text-[11px]">
                                    <div className="flex items-center space-x-1.5">
                                      {isExpanded ? (
                                        <ChevronDown className="w-3 h-3 text-sky-400 shrink-0" />
                                      ) : (
                                        <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
                                      )}
                                      <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                                    </div>
                                  </td>

                                  {/* Action Badge */}
                                  <td className="py-2.5 px-4 whitespace-nowrap">
                                    <span
                                      className={`px-2.5 py-0.5 rounded-md text-[10px] font-semibold tracking-wide border ${log.action.includes('INSTALL') && !log.action.includes('UNINSTALL')
                                        ? 'bg-sky-500/15 text-sky-300 border-sky-500/25'
                                        : log.action.includes('UNINSTALL')
                                          ? 'bg-rose-500/15 text-rose-300 border-rose-500/25'
                                          : log.action.includes('START')
                                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25'
                                            : log.action.includes('STOP')
                                              ? 'bg-amber-500/15 text-amber-300 border-amber-500/25'
                                              : 'bg-purple-500/15 text-purple-300 border-purple-500/25'
                                        }`}
                                    >
                                      {log.action}
                                    </span>
                                  </td>

                                  {/* Target Resource */}
                                  <td className="py-2.5 px-4 truncate max-w-[200px]">
                                    <span className="text-white font-medium block truncate">
                                      {log.resource.name || log.resource.id}
                                    </span>
                                    <span className="text-[10px] text-slate-500 block truncate">
                                      {log.resource.id}
                                    </span>
                                  </td>

                                  {/* Operator / Actor */}
                                  <td className="py-2.5 px-4 text-slate-300 text-[11px] whitespace-nowrap">
                                    <div>{log.actor.userId}</div>
                                    <div className="text-[10px] text-slate-500 font-mono">{log.actor.ipAddress}</div>
                                  </td>

                                  {/* SHA-256 Hash */}
                                  <td className="py-2.5 px-4 text-emerald-400 text-[11px]">
                                    <div
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        copyHashToClipboard(log.hash);
                                      }}
                                      className="inline-flex items-center space-x-1.5 px-2 py-1 rounded bg-black/40 hover:bg-black/80 border border-white/[0.06] transition-colors cursor-copy"
                                      title={AUDIT_MODAL_STRINGS.copyHashTooltip}
                                    >
                                      <span>{log.hash.substring(0, 10)}...</span>
                                      {copiedHash === log.hash ? (
                                        <Check className="w-3 h-3 text-emerald-400" />
                                      ) : (
                                        <Copy className="w-3 h-3 text-slate-500 hover:text-white" />
                                      )}
                                    </div>
                                  </td>
                                </tr>

                                {/* Expanded Detail Drawer */}
                                {isExpanded && (
                                  <tr className="bg-black/70 border-b border-white/[0.04]">
                                    <td colSpan={5} className="p-4 space-y-2 font-mono text-[11px]">
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2 border-b border-white/[0.06]">
                                        <div>
                                          <span className="text-slate-500 block text-[10px]">{AUDIT_MODAL_STRINGS.eventIdLabel}</span>
                                          <span className="text-slate-300 select-all">{log.id}</span>
                                        </div>
                                        <div>
                                          <span className="text-slate-500 block text-[10px]">{AUDIT_MODAL_STRINGS.prevHashLabel}</span>
                                          <span className="text-slate-400 select-all truncate block">{log.prevHash}</span>
                                        </div>
                                      </div>

                                      <div>
                                        <span className="text-slate-500 block text-[10px]">{AUDIT_MODAL_STRINGS.payloadSignatureLabel}</span>
                                        <pre className="p-2.5 bg-black/60 rounded-xl border border-white/[0.04] text-[10px] text-sky-300 overflow-x-auto">
                                          {JSON.stringify(log.details, null, 2)}
                                        </pre>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: DUAL-CONTROL GOVERNANCE & MAKER-CHECKER */}
          {activeTab === 'governance' && (
            <div className="space-y-6">
              {/* Policy Controls Section */}
              <div className="bg-white/[0.02] border border-white/[0.07] rounded-3xl p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-3.5">
                  <div className="flex items-center space-x-2.5">
                    <Settings2 className="w-4 h-4 text-sky-400" />
                    <div>
                      <h4 className="text-xs font-semibold text-white tracking-tight">
                        {AUDIT_MODAL_STRINGS.fourEyesPolicyTitle}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {AUDIT_MODAL_STRINGS.fourEyesPolicyDesc}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.06]">
                    {AUDIT_MODAL_STRINGS.policyTag}
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
                          {AUDIT_MODAL_STRINGS.makerCheckerTitle}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {AUDIT_MODAL_STRINGS.makerCheckerDesc}
                      </p>
                    </div>
                    {/* iOS style toggle switch */}
                    <div
                      className={`w-11 h-6 rounded-full transition-colors flex items-center p-1 shrink-0 ${settings.makerCheckerEnabled ? 'bg-emerald-500' : 'bg-slate-700'
                        }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white transition-transform ${settings.makerCheckerEnabled ? 'translate-x-5' : 'translate-x-0'
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
                          {AUDIT_MODAL_STRINGS.cryptoShreddingTitle}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {AUDIT_MODAL_STRINGS.cryptoShreddingDesc}
                      </p>
                    </div>
                    {/* iOS style toggle switch */}
                    <div
                      className={`w-11 h-6 rounded-full transition-colors flex items-center p-1 shrink-0 ${settings.cryptoShreddingEnabled ? 'bg-purple-500' : 'bg-slate-700'
                        }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white transition-transform ${settings.cryptoShreddingEnabled ? 'translate-x-5' : 'translate-x-0'
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
                    <span>{AUDIT_MODAL_STRINGS.pendingQueueTitle}</span>
                  </h4>
                  <span className="text-[11px] font-mono text-slate-400">
                    {AUDIT_MODAL_STRINGS.pendingQueueDesc(pendingTickets.length)}
                  </span>
                </div>

                {pendingTickets.length === 0 ? (
                  <div className="p-8 text-center bg-white/[0.015] border border-white/[0.06] rounded-3xl space-y-2">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div className="text-xs font-semibold text-white">{AUDIT_MODAL_STRINGS.queueClearTitle}</div>
                    <p className="text-[11px] text-slate-400 max-w-sm mx-auto leading-relaxed">
                      {AUDIT_MODAL_STRINGS.queueClearDesc}
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
                                <span>{AUDIT_MODAL_STRINGS.actionPrefix} {ticket.action}</span>
                                <span className="text-[10px] font-mono font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                                  {AUDIT_MODAL_STRINGS.highSeverityBadge}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                {AUDIT_MODAL_STRINGS.targetPrefix} <strong className="text-white font-medium">{ticket.resource.name}</strong> ({ticket.resource.id})
                              </p>
                            </div>
                          </div>

                          <div className="text-right text-[11px] text-slate-400 font-mono">
                            <div>{AUDIT_MODAL_STRINGS.makerLabel} <strong className="text-slate-200">{ticket.maker.userId}</strong></div>
                            <div>{AUDIT_MODAL_STRINGS.originLabel} {ticket.maker.ipAddress} • {new Date(ticket.createdAt).toLocaleTimeString()}</div>
                          </div>
                        </div>

                        {/* Blast Radius & Payload Details */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-white/[0.02] rounded-2xl border border-white/[0.04] text-[11px] font-mono">
                          <div>
                            <span className="text-slate-500 block">{AUDIT_MODAL_STRINGS.blastRadiusLabel}</span>
                            <span className="text-rose-400 font-semibold mt-0.5 block">{AUDIT_MODAL_STRINGS.containerEviction}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">{AUDIT_MODAL_STRINGS.storagePurgeLabel}</span>
                            <span className={ticket.payload.removeVolumes ? 'text-amber-400 font-semibold mt-0.5 block' : 'text-slate-300 font-semibold mt-0.5 block'}>
                              {ticket.payload.removeVolumes ? AUDIT_MODAL_STRINGS.storagePurgeYes : AUDIT_MODAL_STRINGS.storagePurgeNo}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">{AUDIT_MODAL_STRINGS.signOffWindowLabel}</span>
                            <span className="text-slate-300 mt-0.5 block">{new Date(ticket.expiresAt).toLocaleTimeString()}</span>
                          </div>
                        </div>

                        {/* Checker Decision Controls */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                          <input
                            type="text"
                            placeholder={AUDIT_MODAL_STRINGS.checkerNotePlaceholder}
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
                                AUDIT_MODAL_STRINGS.rejectTicketButton
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
                                  <span>{AUDIT_MODAL_STRINGS.authorizingExecutingButton}</span>
                                </>
                              ) : (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>{AUDIT_MODAL_STRINGS.approveTicketButton}</span>
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
                    <span>{AUDIT_MODAL_STRINGS.historicalQueueTitle(pastTickets.length)}</span>
                  </h4>

                  <div className="bg-black/50 rounded-2xl border border-white/[0.07] overflow-hidden">
                    <div className="overflow-x-auto max-h-56">
                      <table className="w-full text-left border-collapse text-xs min-w-[600px]">
                        <thead className="bg-[#0f1422] border-b border-white/[0.06] text-slate-400 sticky top-0">
                          <tr>
                            <th className="py-2.5 px-4 font-medium">{AUDIT_MODAL_STRINGS.thTicketId}</th>
                            <th className="py-2.5 px-4 font-medium">{AUDIT_MODAL_STRINGS.thAction}</th>
                            <th className="py-2.5 px-4 font-medium">{AUDIT_MODAL_STRINGS.thResource}</th>
                            <th className="py-2.5 px-4 font-medium">{AUDIT_MODAL_STRINGS.thMakerChecker}</th>
                            <th className="py-2.5 px-4 font-medium">{AUDIT_MODAL_STRINGS.thStatus}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04] text-slate-300 font-mono">
                          {pastTickets.map((t) => (
                            <tr key={t.id} className="hover:bg-white/[0.02]">
                              <td className="py-2.5 px-4 text-sky-400 font-semibold font-mono">#{t.id}</td>
                              <td className="py-2.5 px-4 text-slate-300">{t.action}</td>
                              <td className="py-2.5 px-4 text-slate-200">{t.resource.name}</td>
                              <td className="py-2.5 px-4 text-slate-400 text-[11px]">
                                {t.maker.userId} / {t.checker?.userId || COMMON_STRINGS.notApplicable}
                              </td>
                              <td className="py-2.5 px-4">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-semibold ${t.status === 'EXECUTED'
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
                </div>
              )}
            </div>
          )}

          {/* TAB 3: FINTECH COMPLIANCE SPECIFICATION */}
          {activeTab === 'compliance' && (
            <div className="space-y-5">
              <div className="p-4 bg-sky-500/[0.05] border border-sky-500/20 rounded-2xl flex items-center space-x-3">
                <ShieldCheck className="w-5 h-5 text-sky-400 shrink-0" />
                <div className="text-xs">
                  <div className="font-semibold text-white">{AUDIT_MODAL_STRINGS.baselineTitle}</div>
                  <div className="text-slate-400 mt-0.5">
                    {AUDIT_MODAL_STRINGS.baselineDesc}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/[0.02] p-5 rounded-3xl border border-white/[0.07] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{AUDIT_MODAL_STRINGS.pciTitle}</span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {AUDIT_MODAL_STRINGS.compliantBadge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed font-normal">
                    {AUDIT_MODAL_STRINGS.pciDesc}
                  </p>
                </div>

                <div className="bg-white/[0.02] p-5 rounded-3xl border border-white/[0.07] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{AUDIT_MODAL_STRINGS.nistTitle}</span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {AUDIT_MODAL_STRINGS.compliantBadge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed font-normal">
                    {AUDIT_MODAL_STRINGS.nistDesc}
                  </p>
                </div>

                <div className="bg-white/[0.02] p-5 rounded-3xl border border-white/[0.07] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{AUDIT_MODAL_STRINGS.ffiecTitle}</span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {AUDIT_MODAL_STRINGS.compliantBadge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed font-normal">
                    {AUDIT_MODAL_STRINGS.ffiecDesc}
                  </p>
                </div>

                <div className="bg-white/[0.02] p-5 rounded-3xl border border-white/[0.07] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{AUDIT_MODAL_STRINGS.soc2Title}</span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {AUDIT_MODAL_STRINGS.compliantBadge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed font-normal">
                    {AUDIT_MODAL_STRINGS.soc2Desc}
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
            <span>{AUDIT_MODAL_STRINGS.footerStandards}</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-white/[0.08] hover:bg-white/[0.12] text-white rounded-xl text-xs font-medium transition-colors active:scale-95 shadow-sm"
          >
            {COMMON_STRINGS.close}
          </button>
        </div>
      </div>
    </div>
  );
};
