import React from 'react';
import { Layers, Box, Cpu, Activity, LayoutGrid, Terminal, ShieldCheck } from 'lucide-react';
import { NAVBAR_STRINGS } from '../constants/strings';

interface NavbarProps {
  activeTab: 'home' | 'services' | 'catalog';
  setActiveTab: (tab: 'home' | 'services' | 'catalog') => void;
  installedCount: number;
  runningCount: number;
  onOpenAudit?: () => void;
  pendingTicketsCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  installedCount,
  runningCount,
  onOpenAudit,
  pendingTicketsCount = 0,
}) => {
  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-[#080c14]/80 backdrop-blur-2xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Identity */}
        <div
          onClick={() => setActiveTab('home')}
          className="flex items-center space-x-3.5 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-b from-sky-400 to-sky-600 flex items-center justify-center shadow-[0_2px_12px_rgba(14,165,233,0.25)] border border-white/20 group-hover:scale-105 transition-transform">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-[15px] tracking-tight text-white group-hover:text-sky-300 transition-colors">
                {NAVBAR_STRINGS.brandName}
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-white/[0.06] text-slate-300 border border-white/[0.08]">
                {NAVBAR_STRINGS.brandBadge}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-normal">{NAVBAR_STRINGS.brandSubtitle}</p>
          </div>
        </div>

        {/* Apple macOS Style Segmented Control Tabs */}
        <div className="flex items-center bg-white/[0.04] p-1 rounded-xl border border-white/[0.06] shadow-inner">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
              activeTab === 'home'
                ? 'bg-white/[0.12] text-white shadow-[0_1px_8px_rgba(0,0,0,0.3)] border border-white/[0.1]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5 text-sky-400" />
            <span>{NAVBAR_STRINGS.homeTab}</span>
          </button>

          <button
            onClick={() => setActiveTab('services')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
              activeTab === 'services'
                ? 'bg-white/[0.12] text-white shadow-[0_1px_8px_rgba(0,0,0,0.3)] border border-white/[0.1]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>{NAVBAR_STRINGS.activeServicesTab}</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold ${
                activeTab === 'services'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-400/30'
                  : 'bg-white/[0.06] text-slate-400'
              }`}
            >
              {installedCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('catalog')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
              activeTab === 'catalog'
                ? 'bg-white/[0.12] text-white shadow-[0_1px_8px_rgba(0,0,0,0.3)] border border-white/[0.1]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{NAVBAR_STRINGS.catalogTab}</span>
          </button>
        </div>

        {/* Bank-Grade Security Shield & Cluster Indicators */}
        <div className="hidden md:flex items-center space-x-3 text-xs">
          {onOpenAudit && (
            <button
              onClick={onOpenAudit}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all active:scale-95 shadow-sm border ${
                pendingTicketsCount > 0
                  ? 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/35 text-amber-300'
                  : 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/25 text-emerald-300'
              }`}
              title={NAVBAR_STRINGS.securityShieldTooltip}
            >
              <ShieldCheck
                className={`w-3.5 h-3.5 ${
                  pendingTicketsCount > 0 ? 'text-amber-400' : 'text-emerald-400'
                }`}
              />
              <span>{NAVBAR_STRINGS.securityShield}</span>
              {pendingTicketsCount > 0 && (
                <span className="ml-1 text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-500/30 text-amber-200 border border-amber-400/40 animate-pulse">
                  {pendingTicketsCount}
                  {pendingTicketsCount > 1
                    ? NAVBAR_STRINGS.approvalSuffixPlural
                    : NAVBAR_STRINGS.approvalSuffixSingle}
                </span>
              )}
            </button>
          )}

          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-slate-300 text-[11px] font-medium">
              {runningCount}
              {NAVBAR_STRINGS.runningSuffix}
            </span>
          </div>

          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-slate-400 text-[11px]">
            <Cpu className="w-3.5 h-3.5 text-sky-400" />
            <span>{NAVBAR_STRINGS.dockerEngine}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
