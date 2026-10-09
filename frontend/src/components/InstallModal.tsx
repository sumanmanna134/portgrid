import React, { useState, useEffect } from 'react';
import { X, Sparkles, Server, Network, Tag, ArrowRight, Loader2, Database, Layers, Zap, Key, GitBranch } from 'lucide-react';
import { ServiceBlueprint } from '../types';

interface InstallModalProps {
  blueprint: ServiceBlueprint | null;
  isOpen: boolean;
  isInstalling: boolean;
  onClose: () => void;
  onDeploy: (options: {
    blueprintId: string;
    customName?: string;
    customEnginePort?: number;
    customUiPort?: number;
  }) => void;
}

const getIcon = (iconName: string) => {
  switch (iconName) {
    case 'Database':
      return <Database className="w-5 h-5 text-emerald-400" />;
    case 'Zap':
      return <Zap className="w-5 h-5 text-rose-400" />;
    case 'Layers':
      return <Layers className="w-5 h-5 text-sky-400" />;
    case 'Key':
      return <Key className="w-5 h-5 text-amber-400" />;
    case 'GitBranch':
      return <GitBranch className="w-5 h-5 text-purple-400" />;
    default:
      return <Database className="w-5 h-5 text-sky-400" />;
  }
};

export const InstallModal: React.FC<InstallModalProps> = ({
  blueprint,
  isOpen,
  isInstalling,
  onClose,
  onDeploy,
}) => {
  const [customName, setCustomName] = useState('');
  const [customEnginePort, setCustomEnginePort] = useState<string>('');
  const [customUiPort, setCustomUiPort] = useState<string>('');

  useEffect(() => {
    if (blueprint) {
      setCustomName('');
      setCustomEnginePort('');
      setCustomUiPort('');
    }
  }, [blueprint]);

  if (!isOpen || !blueprint) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onDeploy({
      blueprintId: blueprint.id,
      customName: customName.trim() || undefined,
      customEnginePort: customEnginePort ? parseInt(customEnginePort, 10) : undefined,
      customUiPort: customUiPort ? parseInt(customUiPort, 10) : undefined,
    });
  };

  const handleQuickDeploy = () => {
    onDeploy({
      blueprintId: blueprint.id,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-150">
      <div className="glass-modal w-full max-w-lg rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center space-x-3.5">
            <div className="p-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] shadow-inner">
              {getIcon(blueprint.icon)}
            </div>
            <div>
              <h3 className="text-base font-semibold text-white tracking-tight">Deploy {blueprint.name}</h3>
              <p className="text-xs text-slate-400 font-normal">Configure custom instance parameters or deploy with defaults</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isInstalling}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.08] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 text-xs">
            {/* Custom Name */}
            <div>
              <label className="text-slate-300 font-medium mb-1 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-sky-400" />
                Custom Instance Name <span className="text-slate-500 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder={`Default: ${blueprint.name}`}
                className="w-full bg-black/50 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20 font-medium text-xs transition-all"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Leave empty to auto-generate a unique instance identifier.
              </span>
            </div>

            {/* Custom Engine Port */}
            <div>
              <label className="text-slate-300 font-medium mb-1 flex items-center gap-1.5">
                <Network className="w-3.5 h-3.5 text-emerald-400" />
                Service Port <span className="text-slate-500 font-normal">(Optional)</span>
              </label>
              <input
                type="number"
                min="1"
                max="65535"
                value={customEnginePort}
                onChange={(e) => setCustomEnginePort(e.target.value)}
                placeholder={`Default: ${blueprint.engine.defaultPort}`}
                className="w-full bg-black/50 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20 font-mono text-xs transition-all"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Default is <strong className="text-slate-400 font-mono">{blueprint.engine.defaultPort}</strong>. If occupied, next free port will be safely allocated.
              </span>
            </div>

            {/* Custom Companion UI Port */}
            {blueprint.companionUi && (
              <div>
                <label className="text-slate-300 font-medium mb-1 flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-purple-400" />
                  Web UI Port ({blueprint.companionUi.name}) <span className="text-slate-500 font-normal">(Optional)</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="65535"
                  value={customUiPort}
                  onChange={(e) => setCustomUiPort(e.target.value)}
                  placeholder={`Default: ${blueprint.companionUi.defaultPort}`}
                  className="w-full bg-black/50 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20 font-mono text-xs transition-all"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Default is <strong className="text-slate-400 font-mono">{blueprint.companionUi.defaultPort}</strong>.
                </span>
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="px-6 py-4 bg-white/[0.02] border-t border-white/[0.08] flex items-center justify-between">
            <button
              type="button"
              onClick={handleQuickDeploy}
              disabled={isInstalling}
              className="px-3.5 py-2 bg-white/[0.05] hover:bg-white/[0.08] text-slate-300 hover:text-white rounded-xl text-xs font-medium flex items-center space-x-1.5 transition-colors border border-white/[0.06]"
            >
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>Use Defaults</span>
            </button>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isInstalling}
                className="px-4 py-2 bg-transparent hover:bg-white/[0.05] text-slate-400 hover:text-white rounded-xl text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isInstalling}
                className="px-5 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-xl text-xs font-medium flex items-center space-x-2 transition-all shadow-[0_2px_12px_rgba(14,165,233,0.3)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isInstalling ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deploying...</span>
                  </>
                ) : (
                  <>
                    <span>Deploy Container</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
