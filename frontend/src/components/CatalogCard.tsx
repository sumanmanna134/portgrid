import React from 'react';
import {
  Database,
  Layers,
  Zap,
  Key,
  GitBranch,
  ArrowRight,
  Loader2,
  Sparkles,
  ShieldCheck,
  Edit3,
  Trash2,
  Sliders,
} from 'lucide-react';
import { ServiceBlueprint } from '../types';

interface CatalogCardProps {
  blueprint: ServiceBlueprint;
  isInstalling: boolean;
  isInstalled: boolean;
  onSelect: (blueprint: ServiceBlueprint) => void;
  onEdit?: (blueprint: ServiceBlueprint) => void;
  onDelete?: (blueprintId: string) => void;
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

export const CatalogCard: React.FC<CatalogCardProps> = ({
  blueprint,
  isInstalling,
  isInstalled,
  onSelect,
  onEdit,
  onDelete,
}) => {
  const isOfficial = blueprint.isOfficial !== false;

  return (
    <div className="glass-surface glass-surface-hover rounded-2xl p-5 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)] flex flex-col justify-between transition-all duration-200 group">
      <div>
        {/* Card Header & Badges */}
        <div className="flex items-start justify-between mb-3.5">
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] shadow-inner group-hover:scale-105 transition-transform duration-200">
              {getIcon(blueprint.icon)}
            </div>

            {/* Official vs Custom Status Pill */}
            {isOfficial ? (
              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center gap-1 shadow-sm">
                <ShieldCheck className="w-3 h-3 text-sky-400" />
                <span>Official</span>
              </span>
            ) : (
              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 flex items-center gap-1 shadow-sm">
                <Sparkles className="w-3 h-3 text-purple-400" />
                <span>Custom</span>
              </span>
            )}
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-[11px] font-medium tracking-wide uppercase px-2.5 py-0.5 rounded-full bg-white/[0.05] text-slate-300 border border-white/[0.08]">
              {blueprint.category}
            </span>

            {/* Action buttons for Custom Blueprints */}
            {!isOfficial && (
              <div className="flex items-center space-x-1 ml-1 bg-black/40 p-0.5 rounded-lg border border-white/[0.08]">
                {onEdit && (
                  <button
                    onClick={() => onEdit(blueprint)}
                    className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/[0.08] transition-colors"
                    title="Edit custom blueprint workflow"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(blueprint.id)}
                    className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-white/[0.08] transition-colors"
                    title="Delete custom blueprint"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Title & Description */}
        <h3 className="text-base font-semibold text-white tracking-tight mb-1.5">
          {blueprint.name}
        </h3>
        <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed font-normal">
          {blueprint.description}
        </p>

        {/* Cloud Specifications Grid */}
        <div className="space-y-1.5 mb-5 text-xs">
          <div className="flex items-center justify-between text-slate-400 bg-black/40 px-3 py-1.5 rounded-lg border border-white/[0.04]">
            <span className="text-slate-500 text-[11px]">Image</span>
            <span className="font-mono text-slate-300 text-[11px] truncate max-w-[170px]">
              {blueprint.engine.image}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-400 bg-black/40 px-3 py-1.5 rounded-lg border border-white/[0.04]">
            <span className="text-slate-500 text-[11px]">Default Port</span>
            <span className="font-mono font-medium text-sky-400">{blueprint.engine.defaultPort}</span>
          </div>

          {blueprint.companionUi && (
            <div className="flex items-center justify-between text-slate-400 bg-emerald-500/[0.06] px-3 py-1.5 rounded-lg border border-emerald-500/15">
              <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
                <Sparkles className="w-3 h-3" /> Companion UI
              </span>
              <span className="font-medium text-emerald-300 text-[11px]">
                {blueprint.companionUi.name}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Primary Deploy Button */}
      <div className="pt-2">
        <button
          onClick={() => onSelect(blueprint)}
          disabled={isInstalling}
          className={`w-full py-2.5 px-4 rounded-xl font-medium text-xs flex items-center justify-center space-x-2 transition-all duration-150 shadow-sm ${
            isInstalling
              ? 'bg-white/[0.08] text-slate-400 cursor-not-allowed border border-white/[0.08]'
              : 'bg-sky-500 hover:bg-sky-400 text-white shadow-[0_2px_12px_rgba(14,165,233,0.3)] active:scale-[0.98]'
          }`}
        >
          {isInstalling ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-300" />
              <span>Deploying container...</span>
            </>
          ) : (
            <>
              <span>Deploy Service</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
