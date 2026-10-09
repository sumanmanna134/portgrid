import React, { useEffect, useState } from 'react';
import {
  ExternalLink,
  Key,
  Terminal,
  Trash2,
  Cpu,
  Activity,
  Network,
  Database,
  Layers,
  Zap,
  HardDrive,
  GitBranch,
  Play,
  Square,
  ShieldCheck,
} from 'lucide-react';
import { InstalledServiceInstance, ContainerMetrics } from '../types';
import { SERVICE_CARD_STRINGS, COMMON_STRINGS } from '../constants/strings';

interface ServiceCardProps {
  service: InstalledServiceInstance;
  onOpenCredentials: (service: InstalledServiceInstance) => void;
  onOpenLogs: (service: InstalledServiceInstance) => void;
  onUninstall: (service: InstalledServiceInstance) => void;
  onStop: (serviceId: string) => void;
  onStart?: (serviceId: string) => void;
}

const getCategoryIcon = (blueprintId: string) => {
  if (blueprintId.includes('pg') || blueprintId.includes('postgres'))
    return <Database className="w-4 h-4 text-emerald-400" />;
  if (blueprintId.includes('redis'))
    return <Zap className="w-4 h-4 text-rose-400" />;
  if (blueprintId.includes('kafka') || blueprintId.includes('rabbit'))
    return <Layers className="w-4 h-4 text-sky-400" />;
  if (blueprintId.includes('keycloak'))
    return <Key className="w-4 h-4 text-amber-400" />;
  if (blueprintId.includes('jenkins'))
    return <GitBranch className="w-4 h-4 text-cyan-400" />;
  return <Database className="w-4 h-4 text-sky-400" />;
};

const formatBytes = (bytes: number) => {
  if (bytes === 0) return COMMON_STRINGS.zeroBytes;
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  onOpenCredentials,
  onOpenLogs,
  onUninstall,
  onStop,
  onStart,
}) => {
  const [metrics, setMetrics] = useState<ContainerMetrics | null>(null);

  useEffect(() => {
    if (service.status !== 'RUNNING') return;

    let isMounted = true;
    const fetchMetrics = async () => {
      try {
        const res = await fetch(`/api/services/${service.id}/metrics`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data) {
            setMetrics(data);
          }
        }
      } catch { }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [service.id, service.status]);

  const isRunning = service.status === 'RUNNING';

  return (
    <div className="glass-surface glass-surface-hover rounded-xl p-5 shadow-sm flex flex-col justify-between transition-all duration-150 border border-white/[0.08]">
      <div>
        {/* Card Header */}
        <div className="flex items-start justify-between mb-3.5">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] shadow-inner">
              {getCategoryIcon(service.blueprintId)}
            </div>
            <div>
              <h4 className="font-semibold text-white text-[15px] tracking-tight leading-snug">
                {service.name}
              </h4>
              <div className="flex items-center space-x-1.5 mt-0.5 text-[11px] font-mono text-slate-400">
                <span>
                  {COMMON_STRINGS.port} <strong className="text-sky-400 font-semibold">{service.enginePort}</strong>
                </span>
                {service.uiPort && service.uiPort !== service.enginePort && (
                  <>
                    <span className="text-slate-600">•</span>
                    <span>
                      {COMMON_STRINGS.ui} <strong className="text-emerald-400 font-semibold">{service.uiPort}</strong>
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Status Indicator & Power Toggle */}
          <div className="flex items-center space-x-2">
            {isRunning ? (
              <button
                onClick={() => onStop(service.id)}
                className="px-2 py-0.5 rounded-lg bg-white/[0.04] hover:bg-rose-500/15 text-slate-400 hover:text-rose-300 text-[10px] font-medium flex items-center gap-1 border border-white/[0.08] hover:border-rose-500/20 transition-all"
                title={SERVICE_CARD_STRINGS.stopTooltip}
              >
                <Square className="w-2.5 h-2.5 fill-current" />
                <span>{COMMON_STRINGS.stop}</span>
              </button>
            ) : onStart ? (
              <button
                onClick={() => onStart(service.id)}
                className="px-2 py-0.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-[10px] font-medium flex items-center gap-1 border border-emerald-500/30 transition-all shadow-sm"
                title={SERVICE_CARD_STRINGS.startTooltip}
              >
                <Play className="w-2.5 h-2.5 fill-emerald-300" />
                <span>{COMMON_STRINGS.start}</span>
              </button>
            ) : null}

            <span
              className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium tracking-tight ${
                isRunning
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isRunning ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-rose-400'
                }`}
              ></span>
              <span>{isRunning ? COMMON_STRINGS.live : COMMON_STRINGS.offline}</span>
            </span>
          </div>
        </div>

        {/* Companion Web UI Quick Action */}
        {service.uiUrl && (
          <div className="mb-4">
            {isRunning ? (
              <a
                href={service.uiUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 px-3.5 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent hover:from-emerald-500/15 hover:via-teal-500/15 border border-emerald-500/20 rounded-xl flex items-center justify-between text-xs font-medium text-emerald-300 transition-all group"
              >
                <span className="flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{SERVICE_CARD_STRINGS.openWebConsole}</span>
                </span>
                <span className="font-mono text-[11px] text-emerald-400/90 group-hover:translate-x-0.5 transition-transform">
                  {service.uiUrl.replace('http://', '')} ↗
                </span>
              </a>
            ) : (
              <div
                className="w-full py-2 px-3.5 bg-white/[0.02] border border-white/[0.05] rounded-xl flex items-center justify-between text-xs font-normal text-slate-500 cursor-not-allowed opacity-60"
                title={SERVICE_CARD_STRINGS.offlineTooltip}
              >
                <span className="flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-slate-600" />
                  <span>{SERVICE_CARD_STRINGS.companionConsoleOffline}</span>
                </span>
                <span className="font-mono text-[10px] text-slate-500">
                  {SERVICE_CARD_STRINGS.offlineStatus}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Google / Apple Activity Telemetry Panel */}
        <div className="bg-black/40 p-3.5 rounded-xl border border-white/[0.05] mb-4 space-y-2.5 text-xs">
          {/* CPU Metric with gauge bar */}
          <div>
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-sky-400" /> {COMMON_STRINGS.cpuUsage}
              </span>
              <span className="font-mono font-medium text-slate-200">
                {metrics ? `${metrics.cpuPercent}%` : isRunning ? COMMON_STRINGS.measuring : COMMON_STRINGS.zeroPercent}
              </span>
            </div>
            <div className="w-full bg-white/[0.06] rounded-full h-1 overflow-hidden">
              <div
                className="bg-sky-400 h-1 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(2, metrics?.cpuPercent || 0))}%` }}
              ></div>
            </div>
          </div>

          {/* Memory Metric with gauge bar */}
          <div>
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-amber-400" /> {COMMON_STRINGS.memory}
              </span>
              <span className="font-mono font-medium text-slate-200">
                {metrics
                  ? `${formatBytes(metrics.memoryUsageBytes)} (${metrics.memoryPercent}%)`
                  : isRunning
                  ? COMMON_STRINGS.measuring
                  : COMMON_STRINGS.zeroMb}
              </span>
            </div>
            <div className="w-full bg-white/[0.06] rounded-full h-1 overflow-hidden">
              <div
                className="bg-amber-400 h-1 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(2, metrics?.memoryPercent || 0))}%` }}
              ></div>
            </div>
          </div>

          {/* Network Throughput */}
          <div className="flex items-center justify-between pt-1 border-t border-white/[0.04] text-[11px]">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Network className="w-3.5 h-3.5 text-cyan-400" /> {COMMON_STRINGS.network}
            </span>
            <span className="font-mono text-slate-300">
              {metrics
                ? `↓ ${formatBytes(metrics.networkRxBytes)}  ↑ ${formatBytes(metrics.networkTxBytes)}`
                : COMMON_STRINGS.zeroBytes}
            </span>
          </div>

          {/* Storage Volume */}
          {service.volumes && service.volumes.length > 0 && (
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-slate-500" /> {COMMON_STRINGS.storage}
              </span>
              <span className="font-mono text-slate-400 truncate max-w-[170px]">
                {service.volumes[0]}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Control Actions Toolbar */}
      <div className="grid grid-cols-4 gap-2 pt-2 border-t border-white/[0.06]">
        <button
          onClick={() => onOpenCredentials(service)}
          className="col-span-2 py-2 px-3 bg-white/[0.04] hover:bg-white/[0.08] text-sky-300 hover:text-white rounded-lg text-xs font-medium flex items-center justify-center space-x-1.5 transition-all border border-white/[0.06] active:scale-[0.98]"
        >
          <Key className="w-3.5 h-3.5" />
          <span>{SERVICE_CARD_STRINGS.configAndKeys}</span>
        </button>

        <button
          onClick={() => onOpenLogs(service)}
          className="py-2 px-2 bg-white/[0.03] hover:bg-white/[0.06] text-slate-300 hover:text-white rounded-lg text-xs font-medium flex items-center justify-center space-x-1 transition-all border border-white/[0.05]"
          title={SERVICE_CARD_STRINGS.logsTooltip}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>{SERVICE_CARD_STRINGS.logs}</span>
        </button>

        <button
          onClick={() => onUninstall(service)}
          className="py-2 px-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 rounded-lg text-xs font-medium flex items-center justify-center space-x-1 transition-all border border-rose-500/20"
          title={SERVICE_CARD_STRINGS.deleteTooltip}
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>{SERVICE_CARD_STRINGS.delete}</span>
        </button>
      </div>
    </div>
  );
};

