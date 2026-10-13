import React from 'react';
import {
  Database,
  Layers,
  Zap,
  Key,
  GitBranch,
  ArrowRight,
  Loader2,
  ShieldCheck,
  Edit3,
  Trash2,
  Sliders,
  Server,
} from 'lucide-react';
import { ServiceBlueprint } from '../types';
import { CATALOG_STRINGS } from '../constants/strings';

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
      return <GitBranch className="w-5 h-5 text-cyan-400" />;
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
    <div className="group relative bg-[#0b101d] hover:bg-[#0e1628] border border-white/[0.08] hover:border-sky-500/40 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-[0_12px_36px_rgba(14,165,233,0.12)] transition-all duration-200 flex flex-col justify-between">
      <div>
        {/* Card Header & Badges */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shadow-inner shrink-0 group-hover:scale-105 transition-transform">
              {getIcon(blueprint.icon)}
            </div>

            <div className="flex flex-col">
              <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-slate-400">
                {blueprint.category}
              </span>
              <div className="flex items-center space-x-1.5 mt-0.5">
                {isOfficial ? (
                  <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-sky-400" />
                    <span>{CATALOG_STRINGS.officialBadge}</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 flex items-center gap-1">
                    <Sliders className="w-3 h-3 text-cyan-400" />
                    <span>{CATALOG_STRINGS.customBadge}</span>
                  </span>
                )}
                {isInstalled && (
                  <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    INSTALLED
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons for Custom Blueprints */}
          {!isOfficial && (
            <div className="flex items-center space-x-1 bg-black/40 p-1 rounded-lg border border-white/[0.08]">
              {onEdit && (
                <button
                  onClick={() => onEdit(blueprint)}
                  className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/[0.08] transition-colors"
                  title={CATALOG_STRINGS.editCustomTooltip}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(blueprint.id)}
                  className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-white/[0.08] transition-colors"
                  title={CATALOG_STRINGS.deleteCustomTooltip}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Title & Description */}
        <h3 className="text-base font-bold text-white tracking-tight group-hover:text-sky-300 transition-colors mb-1.5">
          {blueprint.name}
        </h3>
        <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed font-normal min-h-[2rem]">
          {blueprint.description}
        </p>

        {/* Cloud Specifications Grid (2-Column Port Widget + Single-Row Image Bar) */}
        <div className="space-y-2 mb-5">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-black/40 border border-white/[0.05] rounded-xl px-3 py-2 flex flex-col justify-between">
              <span className="text-[10px] font-mono uppercase text-slate-500 tracking-wider">
                {CATALOG_STRINGS.defaultPortLabel}
              </span>
              <span className="text-xs font-mono font-semibold text-sky-400 mt-0.5">
                :{blueprint.engine.defaultPort}
              </span>
            </div>

            <div className="bg-black/40 border border-white/[0.05] rounded-xl px-3 py-2 flex flex-col justify-between">
              <span className="text-[10px] font-mono uppercase text-slate-500 tracking-wider flex items-center gap-1">
                <Server className="w-3 h-3 text-emerald-400" />
                <span>{CATALOG_STRINGS.companionUiLabel}</span>
              </span>
              <span className="text-xs font-mono font-semibold text-emerald-300 truncate mt-0.5" title={blueprint.companionUi?.name || 'Native Console'}>
                {blueprint.companionUi ? `:${blueprint.companionUi.defaultPort}` : 'Native Console'}
              </span>
            </div>
          </div>

          {/* Docker Container Image (Full available width, responsive) */}
          <div className="flex items-center justify-between bg-black/40 border border-white/[0.05] rounded-xl px-3 py-2 text-xs font-mono">
            <span className="text-slate-500 text-[10px] uppercase tracking-wider shrink-0">
              {CATALOG_STRINGS.imageLabel}
            </span>
            <span
              className="text-slate-300 text-[11px] truncate ml-3 font-medium text-right"
              title={blueprint.engine.image}
            >
              {blueprint.engine.image}
            </span>
          </div>
        </div>
      </div>

      {/* Primary Deploy Button */}
      <div className="pt-2 border-t border-white/[0.05]">
        <button
          onClick={() => onSelect(blueprint)}
          disabled={isInstalling}
          className={`w-full py-2.5 px-4 rounded-xl font-semibold text-xs flex items-center justify-center space-x-2 transition-all duration-200 shadow-sm ${
            isInstalling
              ? 'bg-white/[0.08] text-slate-400 cursor-not-allowed border border-white/[0.08]'
              : 'bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold active:scale-[0.98] shadow-[0_2px_12px_rgba(14,165,233,0.2)]'
          }`}
        >
          {isInstalling ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-950" />
              <span>{CATALOG_STRINGS.deployingButton}</span>
            </>
          ) : (
            <>
              <span>{CATALOG_STRINGS.deployButton}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
