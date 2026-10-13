import React from 'react';
import {
  ArrowRight,
  ShieldCheck,
  Box,
  Layers,
  ChevronRight,
  Lock,
  FileCheck,
} from 'lucide-react';
import { ServiceBlueprint, InstalledServiceInstance } from '../types';
import { HOMEPAGE_STRINGS } from '../constants/strings';
import { DEFAULT_OFFICIAL_BLUEPRINTS } from '../constants/defaultBlueprints';
import { IsometricClusterIllustration } from './IsometricClusterIllustration';

interface HomePageProps {
  blueprints: ServiceBlueprint[];
  services: InstalledServiceInstance[];
  onNavigateServices: () => void;
  onNavigateCatalog: () => void;
  onOpenAudit: () => void;
  onDeployBlueprint: (blueprintId: string) => void;
}

/**
 * Branded upper banner graphics for official service blueprint cards.
 * Matches visual presentation with top-right diagonal ribbon tag.
 */
const BlueprintBrandBanner: React.FC<{ blueprintId: string; blueprintName: string }> = ({
  blueprintId,
  blueprintName,
}) => {
  switch (blueprintId) {
    case 'postgresql':
      return (
        <div className="w-full h-28 bg-[#0b172a] relative overflow-hidden flex items-center px-4 select-none">
          <div className="absolute inset-0 bg-[radial-gradient(#38bdf812_1px,transparent_1px)] [background-size:12px_12px] opacity-40 pointer-events-none" />
          <div className="flex items-center space-x-3 z-0">
            <svg className="w-10 h-10 shrink-0 text-sky-400" viewBox="0 0 64 64" fill="none">
              <path
                d="M32 10C22 10 14 17 14 26C14 31 16.5 35 20.5 38C20 40 18 43 15 45C19 45 23 43 25.5 40.5C27.5 41.5 29.7 42 32 42C42 42 50 35 50 26C50 17 42 10 32 10Z"
                stroke="#38bdf8"
                strokeWidth="2.5"
                fill="#0f243e"
              />
              <path d="M22 28C22 28 25 32 32 32C39 32 42 28 42 28" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
              <circle cx="26" cy="22" r="2.5" fill="#e0f2fe" />
              <circle cx="38" cy="22" r="2.5" fill="#e0f2fe" />
              <path d="M24 35C24 42 26 48 30 51" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M40 35C40 42 38 48 34 51" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <div className="flex flex-col">
              <span className="text-white font-bold text-base tracking-tight leading-none">PostgreSQL</span>
              <span className="text-sky-400 font-mono text-[10px] mt-1 tracking-wider uppercase font-medium">Relational SQL</span>
            </div>
          </div>
        </div>
      );

    case 'redis':
      return (
        <div className="w-full h-28 bg-gradient-to-b from-slate-100 to-slate-200 relative overflow-hidden flex items-center px-4 select-none">
          <div className="flex items-center space-x-3 z-0">
            <div className="w-10 h-10 relative flex items-center justify-center shrink-0">
              <svg className="w-10 h-10" viewBox="0 0 48 48" fill="none">
                <path d="M24 6L40 14L24 22L8 14L24 6Z" fill="#dc2626" />
                <path d="M8 18L24 26L40 18L40 24L24 32L8 24L8 18Z" fill="#b91c1c" />
                <path d="M8 27L24 35L40 27L40 33L24 41L8 33L8 27Z" fill="#991b1b" />
                <path d="M24 6L40 14L24 22L8 14Z" stroke="#fca5a5" strokeWidth="1" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-slate-900 font-black text-xl tracking-tight leading-none">redis</span>
              <span className="text-red-700 font-mono text-[10px] mt-0.5 tracking-wider uppercase font-bold">In-Memory Cache</span>
            </div>
          </div>
        </div>
      );

    case 'kafka':
      return (
        <div className="w-full h-28 bg-[#0c182b] relative overflow-hidden flex items-center px-4 select-none">
          <div className="absolute inset-0 bg-[radial-gradient(#0ea5e912_1px,transparent_1px)] [background-size:12px_12px] opacity-40 pointer-events-none" />
          <div className="flex items-center space-x-3 z-0">
            <div className="w-10 h-10 relative flex items-center justify-center shrink-0">
              <svg className="w-10 h-10" viewBox="0 0 48 48" fill="none">
                <path d="M24 6L38 14L24 22L10 14L24 6Z" fill="#38bdf8" />
                <path d="M10 14L24 22L24 36L10 28Z" fill="#0284c7" />
                <path d="M24 22L38 14L38 28L24 36Z" fill="#0369a1" />
                <circle cx="10" cy="14" r="2.5" fill="#e0f2fe" />
                <circle cx="38" cy="14" r="2.5" fill="#e0f2fe" />
                <circle cx="24" cy="36" r="2.5" fill="#e0f2fe" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-white font-bold text-base tracking-tight leading-none">Apache Kafka</span>
              <span className="text-cyan-400 font-mono text-[10px] mt-1 tracking-wider uppercase font-medium">KRaft Streaming</span>
            </div>
          </div>
        </div>
      );

    case 'keycloak':
      return (
        <div className="w-full h-28 bg-[#0d1627] relative overflow-hidden flex items-center px-4 select-none">
          <div className="flex items-center space-x-3 z-0">
            <div className="w-10 h-10 relative flex items-center justify-center shrink-0">
              <svg className="w-10 h-10" viewBox="0 0 48 48" fill="none">
                <path d="M24 6L38 12V24C38 33 28 39 24 42C20 39 10 33 10 24V12L24 6Z" fill="#1e293b" stroke="#f59e0b" strokeWidth="2" />
                <circle cx="24" cy="20" r="4.5" fill="#f59e0b" />
                <path d="M24 24.5V32M21.5 28.5H26.5" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-white font-bold text-base tracking-tight leading-none">Keycloak</span>
              <span className="text-amber-400 font-mono text-[10px] mt-1 tracking-wider uppercase font-medium">IAM & OAuth2</span>
            </div>
          </div>
        </div>
      );

    case 'rabbitmq':
      return (
        <div className="w-full h-28 bg-[#121924] relative overflow-hidden flex items-center px-4 select-none">
          <div className="flex items-center space-x-3 z-0">
            <div className="w-10 h-10 relative flex items-center justify-center shrink-0">
              <svg className="w-10 h-10" viewBox="0 0 48 48" fill="none">
                <path d="M12 10L18 22H30L36 10" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M18 22L12 34H36L30 22" fill="#ea580c" fillOpacity="0.25" stroke="#f97316" strokeWidth="2" />
                <circle cx="21" cy="27" r="2" fill="#fdba74" />
                <circle cx="27" cy="27" r="2" fill="#fdba74" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-white font-bold text-base tracking-tight leading-none">RabbitMQ</span>
              <span className="text-orange-400 font-mono text-[10px] mt-1 tracking-wider uppercase font-medium">AMQP Broker</span>
            </div>
          </div>
        </div>
      );

    case 'jenkins':
      return (
        <div className="w-full h-28 bg-[#151f2e] relative overflow-hidden flex items-center px-4 select-none">
          <div className="flex items-center space-x-3 z-0">
            <div className="w-10 h-10 relative flex items-center justify-center shrink-0">
              <svg className="w-10 h-10" viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="18" r="8" fill="#334155" stroke="#38bdf8" strokeWidth="2" />
                <path d="M14 36C14 29 18 27 24 27C30 27 34 29 34 36" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
                <path d="M22 20L24 23L26 20" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-white font-bold text-base tracking-tight leading-none">Jenkins CI</span>
              <span className="text-sky-400 font-mono text-[10px] mt-1 tracking-wider uppercase font-medium">CI/CD Engine</span>
            </div>
          </div>
        </div>
      );

    default:
      return (
        <div className="w-full h-28 bg-[#0e1726] relative overflow-hidden flex items-center px-4 select-none">
          <div className="flex items-center space-x-3 z-0">
            <div className="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
              <Box className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-white font-bold text-base tracking-tight leading-none truncate max-w-[120px]">
                {blueprintName}
              </span>
              <span className="text-sky-400 font-mono text-[10px] mt-1 tracking-wider uppercase font-medium">
                Container
              </span>
            </div>
          </div>
        </div>
      );
  }
};

export const HomePage: React.FC<HomePageProps> = ({
  blueprints,
  services,
  onNavigateServices,
  onNavigateCatalog,
  onOpenAudit,
  onDeployBlueprint,
}) => {
  const runningServiceIds = services.filter((s) => s.status === 'RUNNING').map((s) => s.blueprintId);

  // Always supply all 6 official blueprints for instant high-fidelity rendering
  const activeBlueprintsList = blueprints.length > 0 ? blueprints : DEFAULT_OFFICIAL_BLUEPRINTS;
  const featuredBlueprints = activeBlueprintsList.slice(0, 6);

  return (
    <div className="space-y-12 pb-12">
      {/* 1. HERO SECTION (2 COLUMNS: TECHNICAL HEADLINE & ISOMETRIC 3D ENCLAVE GRAPHIC) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center pt-2 pb-6">
        {/* Left Column: Headline, Subtitle, Actions, Telemetry */}
        <div className="lg:col-span-7 xl:col-span-6 space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-md bg-white/[0.04] border border-white/[0.08] text-[11px] font-medium text-slate-300">
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            <span>{HOMEPAGE_STRINGS.heroBadge}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-extrabold text-white tracking-tight leading-[1.12]">
            {HOMEPAGE_STRINGS.heroTitlePrefix}{' '}
            <span className="block text-sky-400 drop-shadow-[0_0_25px_rgba(56,189,248,0.35)]">
              {HOMEPAGE_STRINGS.heroTitleHighlight}
            </span>
          </h1>

          <p className="text-sm sm:text-base lg:text-lg text-slate-400 max-w-2xl leading-relaxed font-normal">
            {HOMEPAGE_STRINGS.heroSubtitle}
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3 pt-1">
            <button
              onClick={onNavigateServices}
              className="px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-lg font-semibold text-xs sm:text-sm flex items-center justify-center space-x-2 transition-all shadow-sm active:scale-95"
            >
              <span>{HOMEPAGE_STRINGS.primaryCta}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onNavigateCatalog}
              className="px-5 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 hover:text-white rounded-lg font-medium text-xs sm:text-sm flex items-center justify-center space-x-2 transition-all border border-white/[0.1] active:scale-95"
            >
              <Box className="w-4 h-4 text-sky-400" />
              <span>{HOMEPAGE_STRINGS.secondaryCta}</span>
            </button>

            <button
              onClick={onOpenAudit}
              className="px-5 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-300 rounded-lg font-medium text-xs sm:text-sm flex items-center justify-center space-x-2 transition-all border border-emerald-500/20 active:scale-95"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{HOMEPAGE_STRINGS.securityCta}</span>
            </button>
          </div>

          {/* Telemetry Metric Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 max-w-2xl">
            <div className="glass-surface p-3 rounded-lg text-left border border-white/[0.06]">
              <span className="text-[10px] text-slate-400 block">
                {HOMEPAGE_STRINGS.statNodesLabel}
              </span>
              <span className="text-lg font-bold font-mono text-white mt-0.5 block">
                {activeBlueprintsList.length}{HOMEPAGE_STRINGS.nodesSuffix}
              </span>
            </div>

            <div className="glass-surface p-3 rounded-lg text-left border border-white/[0.06]">
              <span className="text-[10px] text-slate-400 block">
                {HOMEPAGE_STRINGS.statLatencyLabel}
              </span>
              <span className="text-lg font-bold font-mono text-emerald-400 mt-0.5 block">
                {HOMEPAGE_STRINGS.statLatencyVal}
              </span>
            </div>

            <div className="glass-surface p-3 rounded-lg text-left border border-white/[0.06]">
              <span className="text-[10px] text-slate-400 block">
                {HOMEPAGE_STRINGS.statSecurityLabel}
              </span>
              <span className="text-lg font-bold font-mono text-sky-400 mt-0.5 block">
                {HOMEPAGE_STRINGS.statSecurityVal}
              </span>
            </div>

            <div className="glass-surface p-3 rounded-lg text-left border border-white/[0.06]">
              <span className="text-[10px] text-slate-400 block">
                {HOMEPAGE_STRINGS.statIntegrityLabel}
              </span>
              <span className="text-lg font-bold font-mono text-cyan-400 mt-0.5 block">
                {HOMEPAGE_STRINGS.statIntegrityVal}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Isometric 3D Cluster Illustration */}
        <div className="lg:col-span-5 xl:col-span-6 flex items-center justify-center lg:justify-end mt-4 lg:mt-0">
          <IsometricClusterIllustration className="w-full max-w-[320px] sm:max-w-[440px] md:max-w-[520px] lg:max-w-[560px] xl:max-w-[660px]" />
        </div>
      </section>

      {/* 2. ONE-CLICK LAUNCH BLUEPRINTS SECTION */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {HOMEPAGE_STRINGS.oneClickLaunchTitle}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              {HOMEPAGE_STRINGS.oneClickLaunchSubtitle}
            </p>
          </div>

          <button
            onClick={onNavigateCatalog}
            className="self-start sm:self-auto group inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 hover:border-sky-500/35 text-sky-400 hover:text-sky-300 text-xs font-semibold tracking-wide transition-all duration-200 shadow-sm active:scale-95 shrink-0"
          >
            <span>{HOMEPAGE_STRINGS.seeAllLink}</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 font-bold border border-sky-400/30">
              {activeBlueprintsList.length}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-sky-400 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Horizontal Row of Blueprint Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 gap-4 xl:gap-5">
          {featuredBlueprints.map((bp) => {
            const isRunning = runningServiceIds.includes(bp.id);

            return (
              <div
                key={bp.id}
                onClick={() => onDeployBlueprint(bp.id)}
                className="group relative bg-[#0c1220] border border-slate-800/80 hover:border-cyan-500/50 rounded-2xl overflow-hidden shadow-lg hover:shadow-[0_8px_30px_rgba(6,182,212,0.15)] transition-all duration-300 flex flex-col justify-between cursor-pointer"
              >
                {/* Diagonal Ribbon in Top Right Corner */}
                <div className="absolute top-0 right-0 overflow-hidden w-24 h-24 pointer-events-none z-10">
                  <div className="absolute transform rotate-45 bg-emerald-400 text-slate-950 font-black text-[8.5px] tracking-wider uppercase py-0.5 right-[-32px] top-[14px] w-[110px] text-center shadow-md select-none">
                    {HOMEPAGE_STRINGS.officialRibbon}
                  </div>
                </div>

                {/* Branded Upper Banner */}
                <BlueprintBrandBanner blueprintId={bp.id} blueprintName={bp.name} />

                {/* Card Lower Content */}
                <div className="p-4 pt-3 flex flex-col justify-between flex-1 bg-[#0a0f1d] border-t border-white/[0.06]">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white tracking-tight group-hover:text-cyan-400 transition-colors">
                        {bp.name}
                      </h3>
                      <span
                        className={`text-[9.5px] font-mono px-2 py-0.5 rounded font-semibold border ${isRunning
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : 'bg-white/[0.04] text-slate-400 border-white/[0.06]'
                          }`}
                      >
                        {isRunning ? HOMEPAGE_STRINGS.statusRunning : HOMEPAGE_STRINGS.statusAvailable}
                      </span>
                    </div>

                    <p className="mt-1.5 text-xs leading-relaxed text-slate-400 line-clamp-2 font-normal">
                      {bp.description}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      <div className="inline-flex items-center gap-1 rounded border border-white/[0.08] bg-white/[0.03] px-2 py-0.5">
                        <span className="text-[9px] font-medium uppercase tracking-wider text-slate-500">
                          Engine
                        </span>
                        <span className="font-mono text-[11px] font-medium text-slate-200">
                          :{bp.engine.defaultPort}
                        </span>
                      </div>

                      {bp.companionUi && (
                        <div className="inline-flex items-center gap-1 rounded border border-cyan-400/20 bg-cyan-400/[0.06] px-2 py-0.5">
                          <span className="text-[9px] font-medium uppercase tracking-wider text-cyan-400/80">
                            UI
                          </span>
                          <span className="font-mono text-[11px] font-medium text-cyan-300">
                            :{bp.companionUi.defaultPort}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom Action Link */}
                  <div className="pt-3 mt-3 flex items-center justify-between border-t border-white/[0.04]">
                    <span className="text-cyan-400 group-hover:text-cyan-300 font-semibold text-xs inline-flex items-center space-x-1.5 group-hover:translate-x-0.5 transition-all">
                      <span>{HOMEPAGE_STRINGS.deployNowLink}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-cyan-400" />
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 group-hover:text-slate-400 transition-colors">
                      127.0.0.1
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. PLATFORM GUARANTEES (3 ENTERPRISE SECURITY CARDS) */}
      <section className="space-y-4">
        <div>
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-sky-400 mb-0.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{HOMEPAGE_STRINGS.guaranteesBadge}</span>
          </div>
          <h2 className="text-lg font-semibold text-white tracking-tight">
            {HOMEPAGE_STRINGS.guaranteesTitle}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {HOMEPAGE_STRINGS.guaranteesSubtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <div className="glass-surface p-4 rounded-lg border border-white/[0.06] space-y-2">
            <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-xs font-semibold text-white tracking-tight">
              {HOMEPAGE_STRINGS.card1Title}
            </h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {HOMEPAGE_STRINGS.card1Desc}
            </p>
          </div>

          <div className="glass-surface p-4 rounded-lg border border-white/[0.06] space-y-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Lock className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-xs font-semibold text-white tracking-tight">
              {HOMEPAGE_STRINGS.card2Title}
            </h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {HOMEPAGE_STRINGS.card2Desc}
            </p>
          </div>

          <div
            onClick={onOpenAudit}
            className="glass-surface p-4 rounded-lg border border-white/[0.06] hover:border-white/[0.12] transition-colors space-y-2 cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <FileCheck className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-xs font-semibold text-white tracking-tight">
              {HOMEPAGE_STRINGS.card3Title}
            </h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {HOMEPAGE_STRINGS.card3Desc}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
