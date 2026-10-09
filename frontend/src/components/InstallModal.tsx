import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sparkles,
  Server,
  Network,
  Tag,
  ArrowRight,
  Database,
  Layers,
  Zap,
  Key,
  Box,
  CheckCircle2,
  Terminal,
  AlertTriangle,
} from 'lucide-react';
import { ServiceBlueprint, InstalledServiceInstance } from '../types';
import { INSTALL_MODAL_STRINGS, COMMON_STRINGS } from '../constants/strings';
import { DeployingCube3D } from './DeployingCube3D';

interface InstallModalProps {
  blueprint: ServiceBlueprint | null;
  isOpen: boolean;
  isInstalling?: boolean;
  onClose: () => void;
  onDeploy: (options: {
    blueprintId: string;
    customName?: string;
    customEnginePort?: number;
    customUiPort?: number;
  }) => Promise<InstalledServiceInstance | null>;
  onViewCredentials?: (instance: InstalledServiceInstance) => void;
  onDone?: (instance: InstalledServiceInstance) => void;
}

const getBlueprintTheme = (blueprintId: string) => {
  if (blueprintId.includes('postgres') || blueprintId.includes('mongo')) {
    return { color: '#10b981', icon: <Database className="w-5 h-5 text-emerald-400" /> };
  }
  if (blueprintId.includes('redis') || blueprintId.includes('meili')) {
    return { color: '#f43f5e', icon: <Zap className="w-5 h-5 text-rose-400" /> };
  }
  if (blueprintId.includes('kafka') || blueprintId.includes('rabbit')) {
    return { color: '#0ea5e9', icon: <Layers className="w-5 h-5 text-sky-400" /> };
  }
  if (blueprintId.includes('keycloak')) {
    return { color: '#f59e0b', icon: <Key className="w-5 h-5 text-amber-400" /> };
  }
  if (blueprintId.includes('clickhouse')) {
    return { color: '#6366f1', icon: <Database className="w-5 h-5 text-indigo-400" /> };
  }
  return { color: '#38bdf8', icon: <Box className="w-5 h-5 text-cyan-400" /> };
};

export const InstallModal: React.FC<InstallModalProps> = ({
  blueprint,
  isOpen,
  onClose,
  onDeploy,
  onViewCredentials,
  onDone,
}) => {
  // Form fields
  const [customName, setCustomName] = useState('');
  const [customEnginePort, setCustomEnginePort] = useState<string>('');
  const [customUiPort, setCustomUiPort] = useState<string>('');

  // Deployment state
  const [isDeploying, setIsDeploying] = useState(false);
  const [step, setStep] = useState(1); // 1 to 5, 6 is complete
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [deployedInstance, setDeployedInstance] = useState<InstalledServiceInstance | null>(null);
  const [deployError, setDeployError] = useState<string | null>(null);

  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (blueprint) {
      setCustomName('');
      setCustomEnginePort('');
      setCustomUiPort('');
      setIsDeploying(false);
      setStep(1);
      setProgress(0);
      setLogs([]);
      setDeployedInstance(null);
      setDeployError(null);
    }
  }, [blueprint, isOpen]);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  if (!isOpen || !blueprint) return null;

  const theme = getBlueprintTheme(blueprint.id);
  const targetPort = customEnginePort ? parseInt(customEnginePort, 10) : blueprint.engine.defaultPort;
  const targetUiPort = customUiPort
    ? parseInt(customUiPort, 10)
    : blueprint.companionUi?.defaultPort;

  const startDeploymentFlow = async (options: {
    blueprintId: string;
    customName?: string;
    customEnginePort?: number;
    customUiPort?: number;
  }) => {
    setIsDeploying(true);
    setDeployError(null);
    setStep(1);
    setProgress(12);
    setLogs([
      `${new Date().toLocaleTimeString()} ${INSTALL_MODAL_STRINGS.logEnclaveAlloc}`,
    ]);

    // Start API call in background
    let instanceResult: InstalledServiceInstance | null = null;
    let apiError: string | null = null;

    const apiPromise = onDeploy(options)
      .then((inst) => {
        instanceResult = inst;
      })
      .catch((err) => {
        apiError = err.message || INSTALL_MODAL_STRINGS.deployFailedTitle;
      });

    // Step-by-step animated progression
    // Step 2: Cryptographic Key Vault
    await new Promise((r) => setTimeout(r, 650));
    setStep(2);
    setProgress(35);
    setLogs((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()} ${INSTALL_MODAL_STRINGS.logCryptoSeed}`,
    ]);

    // Step 3: Container Engine & Volume Mount
    await new Promise((r) => setTimeout(r, 700));
    setStep(3);
    setProgress(60);
    setLogs((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()} ${INSTALL_MODAL_STRINGS.logDockerSpawn}`,
      `${new Date().toLocaleTimeString()} ${INSTALL_MODAL_STRINGS.logVolumeMount}`,
    ]);

    // Step 4: Loopback Socket Handshake & Port Ping
    await new Promise((r) => setTimeout(r, 700));
    setStep(4);
    setProgress(82);
    setLogs((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()} ${INSTALL_MODAL_STRINGS.logHealthPing(targetPort)}`,
      ...(targetUiPort
        ? [`${new Date().toLocaleTimeString()} ${INSTALL_MODAL_STRINGS.logUiAttached(targetUiPort)}`]
        : []),
    ]);

    // Step 5: Merkle Audit Ledger Block Minting
    await new Promise((r) => setTimeout(r, 650));
    setStep(5);
    setProgress(95);
    setLogs((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()} ${INSTALL_MODAL_STRINGS.logMerkleBlock}`,
    ]);

    // Await API completion
    await apiPromise;

    if (apiError) {
      setDeployError(apiError);
      return;
    }

    // Step 6: Complete!
    await new Promise((r) => setTimeout(r, 450));
    setStep(6);
    setProgress(100);
    setLogs((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()} ${INSTALL_MODAL_STRINGS.logComplete}`,
    ]);
    setDeployedInstance(instanceResult);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startDeploymentFlow({
      blueprintId: blueprint.id,
      customName: customName.trim() || undefined,
      customEnginePort: customEnginePort ? parseInt(customEnginePort, 10) : undefined,
      customUiPort: customUiPort ? parseInt(customUiPort, 10) : undefined,
    });
  };

  const handleQuickDeploy = () => {
    startDeploymentFlow({
      blueprintId: blueprint.id,
    });
  };

  const isCompleted = step === 6 && deployedInstance !== null;

  const getStepTitle = () => {
    switch (step) {
      case 1:
        return INSTALL_MODAL_STRINGS.step1Title;
      case 2:
        return INSTALL_MODAL_STRINGS.step2Title;
      case 3:
        return INSTALL_MODAL_STRINGS.step3Title;
      case 4:
        return INSTALL_MODAL_STRINGS.step4Title;
      default:
        return INSTALL_MODAL_STRINGS.step5Title;
    }
  };

  const getStepDesc = () => {
    switch (step) {
      case 1:
        return INSTALL_MODAL_STRINGS.step1Desc;
      case 2:
        return INSTALL_MODAL_STRINGS.step2Desc;
      case 3:
        return INSTALL_MODAL_STRINGS.step3Desc;
      case 4:
        return INSTALL_MODAL_STRINGS.step4Desc;
      default:
        return INSTALL_MODAL_STRINGS.step5Desc;
    }
  };

  const getStepBadge = () => {
    switch (step) {
      case 1:
        return INSTALL_MODAL_STRINGS.step1Badge;
      case 2:
        return INSTALL_MODAL_STRINGS.step2Badge;
      case 3:
        return INSTALL_MODAL_STRINGS.step3Badge;
      case 4:
        return INSTALL_MODAL_STRINGS.step4Badge;
      default:
        return INSTALL_MODAL_STRINGS.step5Badge;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl bg-[#090d16] border border-white/[0.08] shadow-[0_32px_80px_-16px_rgba(0,0,0,0.85)] overflow-hidden transition-all duration-300">
        
        {/* MODAL HEADER */}
        <div className="flex-shrink-0 px-6 sm:px-7 py-5 border-b border-white/[0.06] flex items-center justify-between bg-white/[0.015]">
          <div className="flex items-center space-x-3.5">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center border shadow-inner transition-transform"
              style={{
                backgroundColor: `${theme.color}15`,
                borderColor: `${theme.color}35`,
              }}
            >
              {theme.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-white tracking-tight">
                  {isDeploying
                    ? isCompleted
                      ? INSTALL_MODAL_STRINGS.deploymentCompleteTitle
                      : INSTALL_MODAL_STRINGS.deployChamberTitle
                    : `${INSTALL_MODAL_STRINGS.titlePrefix} ${blueprint.name}`}
                </h3>
                {isDeploying && (
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-medium border ${
                      isCompleted
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                        : 'bg-sky-500/10 text-sky-400 border-sky-500/25'
                    }`}
                  >
                    {isCompleted
                      ? INSTALL_MODAL_STRINGS.statusOnline
                      : INSTALL_MODAL_STRINGS.statusInitializing}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-normal">
                {isDeploying
                  ? isCompleted
                    ? INSTALL_MODAL_STRINGS.deploymentCompleteDesc
                    : INSTALL_MODAL_STRINGS.deployChamberSubtitle
                  : INSTALL_MODAL_STRINGS.subtitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isDeploying && !isCompleted && !deployError}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/[0.06] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* MODAL SCROLLABLE BODY */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-7 py-6 space-y-5">
          {isDeploying ? (
            /* VIEW 1: 3D DEPLOYMENT ENCLAVE & LIVE TELEMETRY */
            <div className="space-y-5">
              {/* 3D Model Stage */}
              <div className="rounded-2xl bg-[#050811] border border-white/[0.06] overflow-hidden p-2 relative shadow-inner">
                <DeployingCube3D
                  step={step}
                  progress={progress}
                  accentColor={theme.color}
                  icon={theme.icon}
                  serviceName={customName || blueprint.name}
                  port={targetPort}
                />
              </div>

              {/* Error Banner */}
              {deployError && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/25 rounded-2xl flex items-center justify-between text-xs text-rose-300">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{deployError}</span>
                  </div>
                  <button
                    onClick={() =>
                      startDeploymentFlow({
                        blueprintId: blueprint.id,
                        customName: customName.trim() || undefined,
                        customEnginePort: customEnginePort ? parseInt(customEnginePort, 10) : undefined,
                        customUiPort: customUiPort ? parseInt(customUiPort, 10) : undefined,
                      })
                    }
                    className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 rounded-xl text-xs font-semibold transition-colors shrink-0 ml-3"
                  >
                    {INSTALL_MODAL_STRINGS.retryButton}
                  </button>
                </div>
              )}

              {/* Clean Unified Progress Bar & Active Phase */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span
                      className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded-md border"
                      style={{
                        backgroundColor: `${theme.color}15`,
                        color: theme.color,
                        borderColor: `${theme.color}30`,
                      }}
                    >
                      {getStepBadge()}
                    </span>
                    <span className="font-semibold text-white">
                      {getStepTitle()}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono font-medium">
                    {Math.round(progress)}%
                  </span>
                </div>

                {/* Smooth Progress Bar */}
                <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${progress}%`,
                      backgroundColor: isCompleted ? '#10b981' : theme.color,
                    }}
                  />
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed font-normal">
                  {getStepDesc()}
                </p>
              </div>

              {/* Clean Telemetry Event Log Stream */}
              <div className="bg-[#04070e] rounded-2xl border border-white/[0.06] overflow-hidden">
                <div className="flex items-center justify-between px-3.5 py-2.5 bg-white/[0.02] border-b border-white/[0.04]">
                  <div className="flex items-center space-x-2 text-slate-400">
                    <div className="flex space-x-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
                      <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
                      <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
                    </div>
                    <span className="text-[10px] font-mono tracking-wider ml-1 text-slate-400">
                      {INSTALL_MODAL_STRINGS.logStreamHeader}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[9px] font-mono text-slate-400 font-medium">
                      {INSTALL_MODAL_STRINGS.terminalLiveBadge}
                    </span>
                  </div>
                </div>

                <div className="h-28 overflow-y-auto p-3.5 font-mono text-[11px] leading-relaxed text-slate-400 space-y-1 select-text">
                  {logs.map((line, idx) => (
                    <div
                      key={idx}
                      className={
                        line.includes('[HEALTH]')
                          ? 'text-emerald-400 font-medium'
                          : line.includes('[CRYPTO]')
                          ? 'text-amber-400'
                          : line.includes('[MERKLE]')
                          ? 'text-purple-400'
                          : line.includes('>>>')
                          ? 'text-sky-300 font-semibold'
                          : 'text-slate-300'
                      }
                    >
                      {line}
                    </div>
                  ))}
                  <div ref={logsEndRef} />
                </div>
              </div>

              {/* Completion Summary Card */}
              {isCompleted && (
                <div className="p-4.5 rounded-2xl bg-emerald-500/[0.04] border border-emerald-500/20 space-y-3 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="font-semibold text-white">{deployedInstance.name}</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/25 font-semibold">
                      {INSTALL_MODAL_STRINGS.serviceSummaryTitle}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/[0.06] flex items-center justify-between">
                      <span className="text-slate-400 text-[11px]">{INSTALL_MODAL_STRINGS.enginePortBadge}</span>
                      <span className="font-mono text-white font-semibold">:{deployedInstance.enginePort}</span>
                    </div>

                    {deployedInstance.uiPort && (
                      <div className="p-2.5 rounded-xl bg-black/40 border border-white/[0.06] flex items-center justify-between">
                        <span className="text-slate-400 text-[11px]">{INSTALL_MODAL_STRINGS.uiPortBadge}</span>
                        <span className="font-mono text-emerald-400 font-semibold">:{deployedInstance.uiPort}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* VIEW 2: PARAMETERS CONFIGURATION FORM */
            <div className="space-y-5 text-xs">
              {/* Sandbox Defaults Callout */}
              <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
                  <Server className="w-4 h-4" />
                </div>
                <div className="text-[11px] leading-relaxed">
                  <div className="font-semibold text-white">
                    {INSTALL_MODAL_STRINGS.blueprintDefaultsBadge}
                  </div>
                  <div className="text-slate-400 mt-0.5 font-mono">
                    {INSTALL_MODAL_STRINGS.blueprintDefaultsDesc(
                      blueprint.engine.image,
                      blueprint.engine.defaultPort
                    )}
                  </div>
                </div>
              </div>

              {/* Custom Name */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-sky-400" />
                    {INSTALL_MODAL_STRINGS.customNameLabel}
                  </span>
                  <span className="text-slate-500 font-normal">{INSTALL_MODAL_STRINGS.optionalLabel}</span>
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder={INSTALL_MODAL_STRINGS.customNamePlaceholder(blueprint.name)}
                  className="w-full bg-black/40 border border-white/[0.08] hover:border-white/[0.14] rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/15 text-xs transition-all"
                />
                <span className="text-[11px] text-slate-500 block">
                  {INSTALL_MODAL_STRINGS.customNameHelp}
                </span>
              </div>

              {/* Custom Engine Port */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Network className="w-3.5 h-3.5 text-emerald-400" />
                    {INSTALL_MODAL_STRINGS.servicePortLabel}
                  </span>
                  <span className="text-slate-500 font-normal">{INSTALL_MODAL_STRINGS.optionalLabel}</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="65535"
                  value={customEnginePort}
                  onChange={(e) => setCustomEnginePort(e.target.value)}
                  placeholder={INSTALL_MODAL_STRINGS.servicePortPlaceholder(blueprint.engine.defaultPort)}
                  className="w-full bg-black/40 border border-white/[0.08] hover:border-white/[0.14] rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/15 font-mono text-xs transition-all"
                />
                <span className="text-[11px] text-slate-500 block">
                  {INSTALL_MODAL_STRINGS.servicePortHelp(blueprint.engine.defaultPort)}
                </span>
              </div>

              {/* Custom Companion UI Port */}
              {blueprint.companionUi && (
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Server className="w-3.5 h-3.5 text-purple-400" />
                      {INSTALL_MODAL_STRINGS.companionUiPortLabel(blueprint.companionUi.name)}
                    </span>
                    <span className="text-slate-500 font-normal">{INSTALL_MODAL_STRINGS.optionalLabel}</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="65535"
                    value={customUiPort}
                    onChange={(e) => setCustomUiPort(e.target.value)}
                    placeholder={INSTALL_MODAL_STRINGS.companionUiPortPlaceholder(
                      blueprint.companionUi.defaultPort
                    )}
                    className="w-full bg-black/40 border border-white/[0.08] hover:border-white/[0.14] rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/15 font-mono text-xs transition-all"
                  />
                  <span className="text-[11px] text-slate-500 block">
                    {INSTALL_MODAL_STRINGS.companionUiPortHelp(blueprint.companionUi.defaultPort)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* MODAL FIXED FOOTER */}
        <div className="flex-shrink-0 px-6 sm:px-7 py-4.5 border-t border-white/[0.06] bg-white/[0.015] flex items-center justify-between">
          {isDeploying ? (
            isCompleted ? (
              <div className="flex items-center justify-between w-full gap-3">
                {onViewCredentials && (
                  <button
                    onClick={() => {
                      onClose();
                      onViewCredentials(deployedInstance);
                    }}
                    className="px-4 py-2.5 bg-white/[0.06] hover:bg-white/[0.1] text-slate-200 hover:text-white rounded-xl text-xs font-medium transition-colors"
                  >
                    {INSTALL_MODAL_STRINGS.viewCredentialsButton}
                  </button>
                )}

                <div className="flex items-center space-x-2.5 ml-auto">
                  {deployedInstance.uiUrl && (
                    <a
                      href={deployedInstance.uiUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-xl text-xs flex items-center space-x-1.5 transition-all shadow-md active:scale-95"
                    >
                      <span>{INSTALL_MODAL_STRINGS.openConsoleButton}</span>
                    </a>
                  )}

                  <button
                    onClick={() => {
                      if (onDone) onDone(deployedInstance);
                      else onClose();
                    }}
                    className="px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-xl text-xs font-semibold transition-all shadow-sm active:scale-95"
                  >
                    {INSTALL_MODAL_STRINGS.goToServicesButton}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full">
                <span className="text-xs text-slate-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
                  <span>{INSTALL_MODAL_STRINGS.deployingButton}</span>
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {Math.round(progress)}%
                </span>
              </div>
            )
          ) : (
            <>
              <button
                type="button"
                onClick={handleQuickDeploy}
                className="px-4 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white rounded-xl text-xs font-medium flex items-center space-x-2 transition-colors border border-white/[0.06]"
              >
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                <span>{INSTALL_MODAL_STRINGS.useDefaultsButton}</span>
              </button>

              <div className="flex items-center space-x-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 bg-transparent hover:bg-white/[0.05] text-slate-400 hover:text-white rounded-xl text-xs font-medium transition-colors"
                >
                  {COMMON_STRINGS.cancel}
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold rounded-xl text-xs flex items-center space-x-2 transition-all shadow-[0_2px_12px_rgba(14,165,233,0.3)] active:scale-95"
                >
                  <span>{INSTALL_MODAL_STRINGS.deployContainerButton}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
