import React, { useEffect, useState } from 'react';
import { X, Terminal, RefreshCw, Copy, Check } from 'lucide-react';
import { InstalledServiceInstance } from '../types';
import { LOGS_MODAL_STRINGS, COMMON_STRINGS } from '../constants/strings';

interface LogsModalProps {
  service: InstalledServiceInstance | null;
  onClose: () => void;
}

export const LogsModal: React.FC<LogsModalProps> = ({ service, onClose }) => {
  const [logs, setLogs] = useState<string>(LOGS_MODAL_STRINGS.connecting);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchLogs = async () => {
    if (!service) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/services/${service.id}/logs`);
      const data = await res.text();
      setLogs(data || LOGS_MODAL_STRINGS.noLogs);
    } catch (err: any) {
      setLogs(`${LOGS_MODAL_STRINGS.errorFetchingPrefix} ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (service) {
      fetchLogs();
    }
  }, [service]);

  if (!service) return null;

  const copyLogs = () => {
    navigator.clipboard.writeText(logs);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="glass-modal w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden flex flex-col h-[80vh]">
        {/* Header - macOS Terminal Style */}
        <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center space-x-3.5">
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
            </div>
            <div className="h-4 w-px bg-white/[0.1] mx-1"></div>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
                <span>{service.name}</span>
                <span className="text-[10px] font-mono text-slate-500 px-2 py-0.5 rounded bg-white/[0.04]">
                  {LOGS_MODAL_STRINGS.streamLabel}
                </span>
              </h3>
            </div>
          </div>
          <div className="flex items-center space-x-1.5">
            <button
              onClick={fetchLogs}
              disabled={isLoading}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.08] transition-colors"
              title={LOGS_MODAL_STRINGS.refreshTooltip}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-sky-400' : ''}`} />
            </button>
            <button
              onClick={copyLogs}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.08] transition-colors"
              title={LOGS_MODAL_STRINGS.copyTooltip}
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.08] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Log Viewer Terminal Screen */}
        <div className="flex-1 p-5 bg-[#05080f] overflow-y-auto font-mono text-xs text-slate-300 leading-relaxed select-text">
          <pre className="whitespace-pre-wrap break-all text-[11px] font-mono">{logs}</pre>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-white/[0.02] border-t border-white/[0.06] flex justify-between items-center text-[11px] text-slate-500">
          <span>{LOGS_MODAL_STRINGS.tailNotice}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white/[0.06] hover:bg-white/[0.1] text-white rounded-lg text-xs font-medium transition-colors border border-white/[0.08]"
          >
            {COMMON_STRINGS.close}
          </button>
        </div>
      </div>
    </div>
  );
};

