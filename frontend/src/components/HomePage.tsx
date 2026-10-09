import React, { useState } from 'react';
import {
  ShieldCheck,
  Zap,
  Layers,
  ArrowRight,
  Database,
  Lock,
  Cpu,
  CheckCircle2,
  Box,
  Key,
  Terminal,
  Activity,
  HardDrive,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Server,
  FileCheck,
} from 'lucide-react';
import { ThreeDClusterStage } from './ThreeDClusterStage';
import { TiltCard } from './TiltCard';
import { HOMEPAGE_STRINGS, COMMON_STRINGS } from '../constants/strings';
import { ServiceBlueprint, InstalledServiceInstance } from '../types';

interface HomePageProps {
  blueprints: ServiceBlueprint[];
  services: InstalledServiceInstance[];
  onNavigateServices: () => void;
  onNavigateCatalog: () => void;
  onOpenAudit: () => void;
  onDeployBlueprint: (blueprintId: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  blueprints,
  services,
  onNavigateServices,
  onNavigateCatalog,
  onOpenAudit,
  onDeployBlueprint,
}) => {
  const [selectedBlockId, setSelectedBlockId] = useState<string>('postgres');

  const runningServiceIds = services
    .filter((s) => s.status === 'RUNNING')
    .map((s) => s.blueprintId);

  // Detail lookup for selected 3D block
  const blockDetails: Record<
    string,
    {
      name: string;
      category: string;
      desc: string;
      port: number;
      uiPort?: number;
      security: string;
      storage: string;
      color: string;
      icon: React.ReactNode;
      blueprintId: string;
    }
  > = {
    postgres: {
      name: HOMEPAGE_STRINGS.blockPostgresName,
      category: HOMEPAGE_STRINGS.blockPostgresCategory,
      desc: HOMEPAGE_STRINGS.blockPostgresDesc,
      port: 5432,
      uiPort: 5050,
      security: HOMEPAGE_STRINGS.blockPostgresSecurity,
      storage: HOMEPAGE_STRINGS.blockPostgresVolume,
      color: '#10b981',
      icon: <Database className="w-6 h-6 text-emerald-400" />,
      blueprintId: 'postgresql',
    },
    redis: {
      name: HOMEPAGE_STRINGS.blockRedisName,
      category: HOMEPAGE_STRINGS.blockRedisCategory,
      desc: HOMEPAGE_STRINGS.blockRedisDesc,
      port: 6379,
      uiPort: 8082,
      security: HOMEPAGE_STRINGS.blockRedisSecurity,
      storage: HOMEPAGE_STRINGS.blockRedisVolume,
      color: '#f43f5e',
      icon: <Zap className="w-6 h-6 text-rose-400" />,
      blueprintId: 'redis',
    },
    kafka: {
      name: HOMEPAGE_STRINGS.blockKafkaName,
      category: HOMEPAGE_STRINGS.blockKafkaCategory,
      desc: HOMEPAGE_STRINGS.blockKafkaDesc,
      port: 9092,
      uiPort: 8080,
      security: HOMEPAGE_STRINGS.blockKafkaSecurity,
      storage: HOMEPAGE_STRINGS.blockKafkaVolume,
      color: '#0ea5e9',
      icon: <Layers className="w-6 h-6 text-sky-400" />,
      blueprintId: 'kafka',
    },
    keycloak: {
      name: HOMEPAGE_STRINGS.blockKeycloakName,
      category: HOMEPAGE_STRINGS.blockKeycloakCategory,
      desc: HOMEPAGE_STRINGS.blockKeycloakDesc,
      port: 8080,
      security: HOMEPAGE_STRINGS.blockKeycloakSecurity,
      storage: HOMEPAGE_STRINGS.blockKeycloakVolume,
      color: '#f59e0b',
      icon: <Key className="w-6 h-6 text-amber-400" />,
      blueprintId: 'keycloak',
    },
    merkle: {
      name: HOMEPAGE_STRINGS.blockMerkleName,
      category: HOMEPAGE_STRINGS.blockMerkleCategory,
      desc: HOMEPAGE_STRINGS.blockMerkleDesc,
      port: 5001,
      security: HOMEPAGE_STRINGS.blockMerkleSecurity,
      storage: HOMEPAGE_STRINGS.blockMerkleVolume,
      color: '#a855f7',
      icon: <ShieldCheck className="w-6 h-6 text-purple-400" />,
      blueprintId: 'merkle',
    },
    docker: {
      name: HOMEPAGE_STRINGS.blockDockerName,
      category: HOMEPAGE_STRINGS.blockDockerCategory,
      desc: HOMEPAGE_STRINGS.blockDockerDesc,
      port: 2375,
      security: HOMEPAGE_STRINGS.blockDockerSecurity,
      storage: HOMEPAGE_STRINGS.blockDockerVolume,
      color: '#38bdf8',
      icon: <Cpu className="w-6 h-6 text-cyan-400" />,
      blueprintId: 'docker',
    },
  };

  const activeBlock = blockDetails[selectedBlockId] || blockDetails.postgres;
  const isSelectedBlockRunning = runningServiceIds.includes(activeBlock.blueprintId);

  return (
    <div className="space-y-16 py-4 animate-in fade-in duration-300">
      {/* 1. HERO SECTION */}
      <section className="relative text-center max-w-4xl mx-auto space-y-6 pt-4">
        {/* Fintech Shield Pill */}
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl shadow-inner">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold tracking-wide text-slate-300">
            {HOMEPAGE_STRINGS.heroBadge}
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-[10px] font-mono text-sky-400 font-bold uppercase">
            {HOMEPAGE_STRINGS.fipsBadge}
          </span>
        </div>

        {/* Dynamic Animated Gradient Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.12]">
          {HOMEPAGE_STRINGS.heroTitlePrefix}{' '}
          <span className="bg-gradient-to-r from-sky-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
            {HOMEPAGE_STRINGS.heroTitleHighlight}
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed font-normal">
          {HOMEPAGE_STRINGS.heroSubtitle}
        </p>

        {/* Action CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
          <button
            onClick={onNavigateServices}
            className="px-6 py-3 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-2xl font-semibold text-xs flex items-center space-x-2 transition-all shadow-[0_2px_20px_rgba(14,165,233,0.35)] active:scale-95"
          >
            <span>{HOMEPAGE_STRINGS.primaryCta}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onNavigateCatalog}
            className="px-5 py-3 bg-white/[0.05] hover:bg-white/[0.1] text-white rounded-2xl font-medium text-xs flex items-center space-x-2 transition-all border border-white/[0.08] active:scale-95"
          >
            <Box className="w-4 h-4 text-sky-400" />
            <span>{HOMEPAGE_STRINGS.secondaryCta}</span>
          </button>

          <button
            onClick={onOpenAudit}
            className="px-5 py-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 rounded-2xl font-medium text-xs flex items-center space-x-2 transition-all border border-emerald-500/25 active:scale-95"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{HOMEPAGE_STRINGS.securityCta}</span>
          </button>
        </div>

        {/* Live Telemetry KPI Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 max-w-3xl mx-auto">
          <div className="glass-surface p-4 rounded-2xl text-left border border-white/[0.06]">
            <span className="text-[11px] text-slate-400 block font-normal">
              {HOMEPAGE_STRINGS.statNodesLabel}
            </span>
            <span className="text-xl font-bold font-mono text-white mt-1 block">
              {blueprints.length || 6}{HOMEPAGE_STRINGS.nodesSuffix}
            </span>
          </div>

          <div className="glass-surface p-4 rounded-2xl text-left border border-white/[0.06]">
            <span className="text-[11px] text-slate-400 block font-normal">
              {HOMEPAGE_STRINGS.statLatencyLabel}
            </span>
            <span className="text-xl font-bold font-mono text-emerald-400 mt-1 block">
              {HOMEPAGE_STRINGS.statLatencyVal}
            </span>
          </div>

          <div className="glass-surface p-4 rounded-2xl text-left border border-white/[0.06]">
            <span className="text-[11px] text-slate-400 block font-normal">
              {HOMEPAGE_STRINGS.statSecurityLabel}
            </span>
            <span className="text-xl font-bold font-mono text-sky-400 mt-1 block">
              {HOMEPAGE_STRINGS.statSecurityVal}
            </span>
          </div>

          <div className="glass-surface p-4 rounded-2xl text-left border border-white/[0.06]">
            <span className="text-[11px] text-slate-400 block font-normal">
              {HOMEPAGE_STRINGS.statIntegrityLabel}
            </span>
            <span className="text-xl font-bold font-mono text-purple-400 mt-1 block">
              {HOMEPAGE_STRINGS.statIntegrityVal}
            </span>
          </div>
        </div>
      </section>

      {/* 2. INTERACTIVE 3D BLOCKS STAGE & INSPECTOR */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-sky-400 mb-1">
              <Sparkles className="w-4 h-4" />
              <span>{HOMEPAGE_STRINGS.stageSectionBadge}</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {HOMEPAGE_STRINGS.stageSectionTitle}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 max-w-xl">
              {HOMEPAGE_STRINGS.stageSectionSubtitle}
            </p>
          </div>
        </div>

        {/* 3D Stage + Block Inspector Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* 3D Viewport (8 Cols) */}
          <div className="lg:col-span-8 w-full">
            <ThreeDClusterStage
              onSelectBlock={setSelectedBlockId}
              selectedBlockId={selectedBlockId}
              runningServiceIds={runningServiceIds}
            />
          </div>

          {/* Interactive Block Inspector Drawer (4 Cols) */}
          <div className="lg:col-span-4 glass-surface rounded-3xl p-6 border border-white/[0.08] shadow-2xl space-y-5">
            <div className="flex items-start justify-between border-b border-white/[0.08] pb-4">
              <div className="flex items-center space-x-3">
                <div
                  className="p-3 rounded-2xl border shadow-inner"
                  style={{
                    backgroundColor: `${activeBlock.color}15`,
                    borderColor: `${activeBlock.color}35`,
                  }}
                >
                  {activeBlock.icon}
                </div>
                <div>
                  <h3 className="font-bold text-base text-white tracking-tight leading-snug">
                    {activeBlock.name}
                  </h3>
                  <span className="text-xs font-mono text-slate-400">{activeBlock.category}</span>
                </div>
              </div>

              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                  isSelectedBlockRunning
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    : 'bg-white/[0.05] text-slate-400 border-white/[0.08]'
                }`}
              >
                {isSelectedBlockRunning
                  ? HOMEPAGE_STRINGS.statusRunning
                  : HOMEPAGE_STRINGS.statusAvailable}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-normal">
              {activeBlock.desc}
            </p>

            {/* Hardware & Network Specs Matrix */}
            <div className="space-y-2 bg-black/40 p-4 rounded-2xl border border-white/[0.05] text-xs font-mono">
              <div className="flex items-center justify-between text-slate-400">
                <span>{HOMEPAGE_STRINGS.specsPortLabel}</span>
                <strong className="text-sky-400 font-semibold">{activeBlock.port}</strong>
              </div>

              {activeBlock.uiPort && (
                <div className="flex items-center justify-between text-slate-400">
                  <span>{HOMEPAGE_STRINGS.specsUiPortLabel}</span>
                  <strong className="text-emerald-400 font-semibold">{activeBlock.uiPort}</strong>
                </div>
              )}

              <div className="flex items-center justify-between text-slate-400">
                <span>{HOMEPAGE_STRINGS.specsBoundaryLabel}</span>
                <span className="text-slate-200">{HOMEPAGE_STRINGS.specsBoundaryVal}</span>
              </div>

              <div className="flex items-center justify-between text-slate-400">
                <span>{HOMEPAGE_STRINGS.specsSecurityLabel}</span>
                <span className="text-purple-300">{activeBlock.security}</span>
              </div>

              <div className="flex items-center justify-between text-slate-400">
                <span>{HOMEPAGE_STRINGS.specsVolumeLabel}</span>
                <span className="text-slate-300 truncate max-w-[150px]">{activeBlock.storage}</span>
              </div>
            </div>

            {/* Deploy Trigger Button */}
            <div className="pt-1 space-y-2">
              <button
                onClick={() => onDeployBlueprint(activeBlock.blueprintId)}
                className="w-full py-3 px-4 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-2xl font-semibold text-xs flex items-center justify-center space-x-2 transition-all shadow-[0_2px_15px_rgba(14,165,233,0.3)] active:scale-95"
              >
                <Box className="w-4 h-4" />
                <span>{HOMEPAGE_STRINGS.deployBlockButton}</span>
              </button>

              <button
                onClick={onNavigateCatalog}
                className="w-full py-2.5 px-4 bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white rounded-2xl font-medium text-xs flex items-center justify-center space-x-1.5 transition-colors border border-white/[0.06]"
              >
                <span>{HOMEPAGE_STRINGS.viewBlueprintButton}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. DEFENSE-IN-DEPTH 3D ARCHITECTURAL STACK */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-1.5">
          <div className="inline-flex items-center space-x-1.5 text-xs font-semibold text-purple-400">
            <Layers className="w-4 h-4" />
            <span>{HOMEPAGE_STRINGS.archBadge}</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {HOMEPAGE_STRINGS.archSectionTitle}
          </h2>
          <p className="text-xs text-slate-400">
            {HOMEPAGE_STRINGS.archSectionSubtitle}
          </p>
        </div>

        {/* 4 Interactive Stacked Architecture Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <TiltCard
            glareColor="rgba(56, 189, 248, 0.15)"
            className="glass-surface p-5 border border-white/[0.07] flex flex-col justify-between h-48 hover:border-sky-500/30"
          >
            <div className="space-y-2.5">
              <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shadow-inner">
                <ExternalLink className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-white tracking-tight">
                {HOMEPAGE_STRINGS.layer1Title}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed font-normal">
                {HOMEPAGE_STRINGS.layer1Desc}
              </p>
            </div>
          </TiltCard>

          <TiltCard
            glareColor="rgba(16, 185, 129, 0.15)"
            className="glass-surface p-5 border border-white/[0.07] flex flex-col justify-between h-48 hover:border-emerald-500/30"
          >
            <div className="space-y-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-inner">
                <Lock className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-white tracking-tight">
                {HOMEPAGE_STRINGS.layer2Title}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed font-normal">
                {HOMEPAGE_STRINGS.layer2Desc}
              </p>
            </div>
          </TiltCard>

          <TiltCard
            glareColor="rgba(245, 158, 11, 0.15)"
            className="glass-surface p-5 border border-white/[0.07] flex flex-col justify-between h-48 hover:border-amber-500/30"
          >
            <div className="space-y-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-inner">
                <Cpu className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-white tracking-tight">
                {HOMEPAGE_STRINGS.layer3Title}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed font-normal">
                {HOMEPAGE_STRINGS.layer3Desc}
              </p>
            </div>
          </TiltCard>

          <TiltCard
            glareColor="rgba(168, 85, 247, 0.15)"
            className="glass-surface p-5 border border-white/[0.07] flex flex-col justify-between h-48 hover:border-purple-500/30"
          >
            <div className="space-y-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shadow-inner">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-white tracking-tight">
                {HOMEPAGE_STRINGS.layer4Title}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed font-normal">
                {HOMEPAGE_STRINGS.layer4Desc}
              </p>
            </div>
          </TiltCard>
        </div>
      </section>

      {/* 4. MISSION-CRITICAL FEATURES MATRIX (6 3D Hover Tilt Cards) */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-1.5">
          <div className="inline-flex items-center space-x-1.5 text-xs font-semibold text-sky-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>{HOMEPAGE_STRINGS.featuresBadge}</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {HOMEPAGE_STRINGS.featuresSectionTitle}
          </h2>
          <p className="text-xs text-slate-400">
            {HOMEPAGE_STRINGS.featuresSectionSubtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <TiltCard
            onClick={onOpenAudit}
            glareColor="rgba(168, 85, 247, 0.2)"
            className="glass-surface p-6 border border-white/[0.07] space-y-3 hover:border-purple-500/30"
          >
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shadow-inner">
              <FileCheck className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white tracking-tight">
              {HOMEPAGE_STRINGS.feature1Title}
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed font-normal">
              {HOMEPAGE_STRINGS.feature1Desc}
            </p>
          </TiltCard>

          <TiltCard
            onClick={onOpenAudit}
            glareColor="rgba(245, 158, 11, 0.2)"
            className="glass-surface p-6 border border-white/[0.07] space-y-3 hover:border-amber-500/30"
          >
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-inner">
              <Lock className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white tracking-tight">
              {HOMEPAGE_STRINGS.feature2Title}
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed font-normal">
              {HOMEPAGE_STRINGS.feature2Desc}
            </p>
          </TiltCard>

          <TiltCard
            glareColor="rgba(244, 63, 94, 0.2)"
            className="glass-surface p-6 border border-white/[0.07] space-y-3 hover:border-rose-500/30"
          >
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shadow-inner">
              <HardDrive className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white tracking-tight">
              {HOMEPAGE_STRINGS.feature3Title}
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed font-normal">
              {HOMEPAGE_STRINGS.feature3Desc}
            </p>
          </TiltCard>

          <TiltCard
            onClick={onNavigateServices}
            glareColor="rgba(16, 185, 129, 0.2)"
            className="glass-surface p-6 border border-white/[0.07] space-y-3 hover:border-emerald-500/30"
          >
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-inner">
              <Activity className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white tracking-tight">
              {HOMEPAGE_STRINGS.feature4Title}
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed font-normal">
              {HOMEPAGE_STRINGS.feature4Desc}
            </p>
          </TiltCard>

          <TiltCard
            onClick={onNavigateCatalog}
            glareColor="rgba(14, 165, 233, 0.2)"
            className="glass-surface p-6 border border-white/[0.07] space-y-3 hover:border-sky-500/30"
          >
            <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shadow-inner">
              <Server className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white tracking-tight">
              {HOMEPAGE_STRINGS.feature5Title}
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed font-normal">
              {HOMEPAGE_STRINGS.feature5Desc}
            </p>
          </TiltCard>

          <TiltCard
            glareColor="rgba(56, 189, 248, 0.2)"
            className="glass-surface p-6 border border-white/[0.07] space-y-3 hover:border-cyan-500/30"
          >
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-inner">
              <Zap className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white tracking-tight">
              {HOMEPAGE_STRINGS.feature6Title}
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed font-normal">
              {HOMEPAGE_STRINGS.feature6Desc}
            </p>
          </TiltCard>
        </div>
      </section>

      {/* 5. BOTTOM INTERACTIVE CALL TO ACTION BANNER */}
      <section className="glass-surface rounded-3xl p-8 sm:p-12 border border-sky-500/20 shadow-[0_20px_60px_rgba(14,165,233,0.12)] text-center relative overflow-hidden">
        {/* Glow backdrop sphere */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl mx-auto space-y-5">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {HOMEPAGE_STRINGS.ctaTitle}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            {HOMEPAGE_STRINGS.ctaSubtitle}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={onNavigateServices}
              className="px-6 py-3 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-2xl font-semibold text-xs flex items-center space-x-2 transition-all shadow-[0_2px_18px_rgba(14,165,233,0.3)] active:scale-95"
            >
              <span>{HOMEPAGE_STRINGS.ctaPrimary}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onNavigateCatalog}
              className="px-5 py-3 bg-white/[0.06] hover:bg-white/[0.1] text-white rounded-2xl font-medium text-xs flex items-center space-x-2 transition-all border border-white/[0.08]"
            >
              <Box className="w-4 h-4 text-sky-400" />
              <span>{HOMEPAGE_STRINGS.ctaSecondary}</span>
            </button>
          </div>

          <div className="pt-6 border-t border-white/[0.06] text-[11px] font-mono text-slate-500">
            {HOMEPAGE_STRINGS.complianceBanner}
          </div>
        </div>
      </section>
    </div>
  );
};
