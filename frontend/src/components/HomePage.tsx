import React, { useState } from 'react';
import {
  ArrowRight,
  ShieldCheck,
  Box,
  Layers,
  ChevronRight,
  Lock,
  FileCheck,
  Server,
  Zap,
  Database,
  CheckCircle2,
} from 'lucide-react';
import { ServiceBlueprint, InstalledServiceInstance } from '../types';
import { HOMEPAGE_STRINGS } from '../constants/strings';
import { FEATURE_FLAGS } from '../constants/featureFlags';
import { ThreeDClusterStage } from './ThreeDClusterStage';

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
  const runningServiceIds = services.filter((s) => s.status === 'RUNNING').map((s) => s.blueprintId);

  // 3D Block Definitions preserved for Next Release
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
      icon: <Server className="w-5 h-5 text-emerald-400" />,
      blueprintId: 'postgres',
    },
    redis: {
      name: HOMEPAGE_STRINGS.blockRedisName,
      category: HOMEPAGE_STRINGS.blockRedisCategory,
      desc: HOMEPAGE_STRINGS.blockRedisDesc,
      port: 6379,
      uiPort: 8081,
      security: HOMEPAGE_STRINGS.blockRedisSecurity,
      storage: HOMEPAGE_STRINGS.blockRedisVolume,
      color: '#f43f5e',
      icon: <Zap className="w-5 h-5 text-rose-400" />,
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
      icon: <Layers className="w-5 h-5 text-sky-400" />,
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
      icon: <Lock className="w-5 h-5 text-amber-400" />,
      blueprintId: 'keycloak',
    },
    merkle: {
      name: HOMEPAGE_STRINGS.blockMerkleName,
      category: HOMEPAGE_STRINGS.blockMerkleCategory,
      desc: HOMEPAGE_STRINGS.blockMerkleDesc,
      port: 8443,
      security: HOMEPAGE_STRINGS.blockMerkleSecurity,
      storage: HOMEPAGE_STRINGS.blockMerkleVolume,
      color: '#06b6d4',
      icon: <ShieldCheck className="w-5 h-5 text-cyan-400" />,
      blueprintId: 'postgres',
    },
    docker: {
      name: HOMEPAGE_STRINGS.blockDockerName,
      category: HOMEPAGE_STRINGS.blockDockerCategory,
      desc: HOMEPAGE_STRINGS.blockDockerDesc,
      port: 2375,
      security: HOMEPAGE_STRINGS.blockDockerSecurity,
      storage: HOMEPAGE_STRINGS.blockDockerVolume,
      color: '#38bdf8',
      icon: <Box className="w-5 h-5 text-sky-400" />,
      blueprintId: 'postgres',
    },
  };

  const activeBlock = blockDetails[selectedBlockId] || blockDetails['postgres'];
  const isSelectedBlockRunning = runningServiceIds.includes(activeBlock.blueprintId);

  // Top 4 quick deploy blueprints
  const featuredBlueprints = blueprints.slice(0, 4);

  return (
    <div className="space-y-12 pb-12">
      {/* 1. CLEAN TECHNICAL HERO */}
      <section className="text-center pt-6 pb-2 space-y-5 max-w-3xl mx-auto">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-md bg-white/[0.04] border border-white/[0.08] text-[11px] font-medium text-slate-300">
          <Layers className="w-3.5 h-3.5 text-sky-400" />
          <span>{HOMEPAGE_STRINGS.heroBadge}</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight leading-tight">
          {HOMEPAGE_STRINGS.heroTitlePrefix}{' '}
          <span className="text-sky-400">{HOMEPAGE_STRINGS.heroTitleHighlight}</span>
        </h1>

        <p className="text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
          {HOMEPAGE_STRINGS.heroSubtitle}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
          <button
            onClick={onNavigateServices}
            className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-lg font-semibold text-xs flex items-center space-x-2 transition-all shadow-sm active:scale-95"
          >
            <span>{HOMEPAGE_STRINGS.primaryCta}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onNavigateCatalog}
            className="px-4 py-2 bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 hover:text-white rounded-lg font-medium text-xs flex items-center space-x-2 transition-all border border-white/[0.1] active:scale-95"
          >
            <Box className="w-4 h-4 text-sky-400" />
            <span>{HOMEPAGE_STRINGS.secondaryCta}</span>
          </button>

          <button
            onClick={onOpenAudit}
            className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-300 rounded-lg font-medium text-xs flex items-center space-x-2 transition-all border border-emerald-500/20 active:scale-95"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{HOMEPAGE_STRINGS.securityCta}</span>
          </button>
        </div>

        {/* Telemetry Metric Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 max-w-2xl mx-auto">
          <div className="glass-surface p-3 rounded-lg text-left border border-white/[0.06]">
            <span className="text-[11px] text-slate-400 block">
              {HOMEPAGE_STRINGS.statNodesLabel}
            </span>
            <span className="text-lg font-bold font-mono text-white mt-0.5 block">
              {blueprints.length || 6}{HOMEPAGE_STRINGS.nodesSuffix}
            </span>
          </div>

          <div className="glass-surface p-3 rounded-lg text-left border border-white/[0.06]">
            <span className="text-[11px] text-slate-400 block">
              {HOMEPAGE_STRINGS.statLatencyLabel}
            </span>
            <span className="text-lg font-bold font-mono text-emerald-400 mt-0.5 block">
              {HOMEPAGE_STRINGS.statLatencyVal}
            </span>
          </div>

          <div className="glass-surface p-3 rounded-lg text-left border border-white/[0.06]">
            <span className="text-[11px] text-slate-400 block">
              {HOMEPAGE_STRINGS.statSecurityLabel}
            </span>
            <span className="text-lg font-bold font-mono text-sky-400 mt-0.5 block">
              {HOMEPAGE_STRINGS.statSecurityVal}
            </span>
          </div>

          <div className="glass-surface p-3 rounded-lg text-left border border-white/[0.06]">
            <span className="text-[11px] text-slate-400 block">
              {HOMEPAGE_STRINGS.statIntegrityLabel}
            </span>
            <span className="text-lg font-bold font-mono text-cyan-400 mt-0.5 block">
              {HOMEPAGE_STRINGS.statIntegrityVal}
            </span>
          </div>
        </div>
      </section>

      {/* 2. INTERACTIVE 3D BLOCKS STAGE (Deferred to Next Release) */}
      {FEATURE_FLAGS.ENABLE_3D_INTERACTIVE && (
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2 text-xs font-semibold text-sky-400 mb-1">
                <Layers className="w-4 h-4" />
                <span>{HOMEPAGE_STRINGS.stageSectionBadge}</span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                {HOMEPAGE_STRINGS.stageSectionTitle}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5 max-w-xl">
                {HOMEPAGE_STRINGS.stageSectionSubtitle}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8 w-full">
              <ThreeDClusterStage
                onSelectBlock={setSelectedBlockId}
                selectedBlockId={selectedBlockId}
                runningServiceIds={runningServiceIds}
              />
            </div>

            <div className="lg:col-span-4 glass-surface rounded-xl p-5 border border-white/[0.08] shadow-lg space-y-4">
              <div className="flex items-start justify-between border-b border-white/[0.08] pb-3.5">
                <div className="flex items-center space-x-3">
                  <div
                    className="p-2.5 rounded-lg border shadow-inner"
                    style={{
                      backgroundColor: `${activeBlock.color}15`,
                      borderColor: `${activeBlock.color}35`,
                    }}
                  >
                    {activeBlock.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-base text-white tracking-tight leading-snug">
                      {activeBlock.name}
                    </h3>
                    <span className="text-xs font-mono text-slate-400">{activeBlock.category}</span>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold border ${
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

              <div className="space-y-2 bg-black/40 p-3.5 rounded-lg border border-white/[0.05] text-xs font-mono">
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
                  <span className="text-cyan-300">{activeBlock.security}</span>
                </div>

                <div className="flex items-center justify-between text-slate-400">
                  <span>{HOMEPAGE_STRINGS.specsVolumeLabel}</span>
                  <span className="text-slate-300 truncate max-w-[150px]">{activeBlock.storage}</span>
                </div>
              </div>

              <div className="pt-1 space-y-2">
                <button
                  onClick={() => onDeployBlueprint(activeBlock.blueprintId)}
                  className="w-full py-2.5 px-4 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-lg font-semibold text-xs flex items-center justify-center space-x-2 transition-all shadow-sm active:scale-95"
                >
                  <Box className="w-4 h-4" />
                  <span>{HOMEPAGE_STRINGS.deployBlockButton}</span>
                </button>

                <button
                  onClick={onNavigateCatalog}
                  className="w-full py-2 px-4 bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white rounded-lg font-medium text-xs flex items-center justify-center space-x-1.5 transition-colors border border-white/[0.06]"
                >
                  <span>{HOMEPAGE_STRINGS.viewBlueprintButton}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 3. QUICK DEPLOY SERVICE BLUEPRINTS */}
      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-sky-400 mb-0.5">
              <Box className="w-3.5 h-3.5" />
              <span>{HOMEPAGE_STRINGS.quickDeployBadge}</span>
            </div>
            <h2 className="text-lg font-semibold text-white tracking-tight">
              {HOMEPAGE_STRINGS.quickDeployTitle}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {HOMEPAGE_STRINGS.quickDeploySubtitle}
            </p>
          </div>

          <button
            onClick={onNavigateCatalog}
            className="text-xs font-medium text-sky-400 hover:text-sky-300 flex items-center space-x-1 transition-colors"
          >
            <span>{HOMEPAGE_STRINGS.secondaryCta}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {featuredBlueprints.map((bp) => {
            const isRunning = runningServiceIds.includes(bp.id);

            return (
              <div
                key={bp.id}
                className="glass-surface p-4 rounded-lg border border-white/[0.06] hover:border-white/[0.12] transition-colors flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                      <Database className="w-4 h-4" />
                    </div>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold border ${
                        isRunning
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : 'bg-white/[0.04] text-slate-400 border-white/[0.06]'
                      }`}
                    >
                      {isRunning ? HOMEPAGE_STRINGS.statusRunning : HOMEPAGE_STRINGS.statusAvailable}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-white tracking-tight">
                      {bp.name}
                    </h3>
                    <div className="flex items-center space-x-2 text-[11px] text-slate-400 font-mono mt-0.5">
                      <span>{bp.category}</span>
                      <span>•</span>
                      <span>{HOMEPAGE_STRINGS.portLabel} :{bp.engine.defaultPort}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onDeployBlueprint(bp.id)}
                  className="w-full py-1.5 px-3 bg-white/[0.04] hover:bg-sky-500 hover:text-slate-950 text-slate-200 rounded-lg font-medium text-xs flex items-center justify-center space-x-1.5 transition-all border border-white/[0.08]"
                >
                  <span>{HOMEPAGE_STRINGS.deployButton}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. PLATFORM GUARANTEES (3 CRISP CARDS) */}
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
