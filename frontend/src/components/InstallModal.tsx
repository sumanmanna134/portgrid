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
  GitBranch,
  Box,
  CheckCircle2,
  Check,
  ShieldCheck,
  Lock,
  Cpu,
  Activity,
  Terminal,
  ExternalLink,
  RotateCcw,
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

  // 3D Deployment Chamber State
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
    setProgress(10);
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
    setProgress(32);
    setLogs((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()} ${INSTALL_MODAL_STRINGS.logCryptoSeed}`,
    ]);

    // Step 3: Container Engine & Volume Mount
    await new Promise((r) => setTimeout(r, 700));
    setStep(3);
    setProgress(58);
    setLogs((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()} ${INSTALL_MODAL_STRINGS.logDockerSpawn}`,
      `${new Date().toLocaleTimeString()} ${INSTALL_MODAL_STRINGS.logVolumeMount}`,
    ]);

    // Step 4: Loopback Socket Handshake & Port Ping
    await new Promise((r) => setTimeout(r, 700));
    setStep(4);
    setProgress(80);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className={`glass-modal w-full rounded-3xl shadow-[0_25px_70px_-10px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col transition-all duration-300 border border-white/[0.09] ${
          isDeploying ? 'max-w-2xl' : 'max-w-lg'
        }`}
      >
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center space-x-3.5">
            <div
              className="p-2.5 rounded-xl border shadow-inner transition-transform"
              style={{
                backgroundColor: `${theme.color}20`,
                borderColor: `${theme.color}40`,
              }}
            >
              {theme.icon}
            </div>
            <div>
              <h3 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
                <span>
                  {isDeploying
                    ? isCompleted
                      ? INSTALL_MODAL_STRINGS.deploymentCompleteTitle
                      : INSTALL_MODAL_STRINGS.deployChamberTitle
                    : `${INSTALL_MODAL_STRINGS.titlePrefix} ${blueprint.name}`}
                </span>
                {isDeploying && (
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                      isCompleted
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : 'bg-sky-500/15 text-sky-300 border-sky-500/30 animate-pulse'
                    }`}
                  >
                    {isCompleted
                      ? INSTALL_MODAL_STRINGS.statusOnline
                      : INSTALL_MODAL_STRINGS.statusInitializing}
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400 font-normal">
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
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.08] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* VIEW 1: INTERACTIVE 3D ANIMATED DEPLOYMENT CHAMBER */}
        {isDeploying ? (
          <div className="p-6 space-y-5">
            {/* 3D Cube Viewport */}
            <div className="relative rounded-2xl bg-[#05080f] border border-white/[0.06] overflow-hidden">
              <DeployingCube3D
                step={step}
                progress={progress}
                accentColor={theme.color}
                icon={theme.icon}
                serviceName={customName || blueprint.name}
                port={targetPort}
              />

              {/* 3D Orbit Drag Hint */}
              <div className="absolute bottom-2.5 left-3 text-[10px] font-mono text-slate-500 flex items-center gap-1.5 pointer-events-none">
                <Sparkles className="w-3 h-3 text-sky-400" />
                <span>{INSTALL_MODAL_STRINGS.dragRotateHint}</span>
              </div>

              {/* Progress Percentage Gauge Pill */}
              <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-xl border border-white/[0.08] text-xs font-mono font-bold text-white">
                {Math.round(progress)}%
              </div>
            </div>

            {/* Error Banner (if any) */}
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

            {/* Step-by-Step Milestones Progress Indicator */}
            <div className="space-y-2">
              <div className="grid grid-cols-5 gap-1.5">
                {[1, 2, 3, 4, 5].map((s) => {
                  const isCurrent = step === s;
                  const isPast = step > s || isCompleted;
                  return (
                    <div
                      key={s}
                      className={`h-1.5 rounded-full transition-all duration-500 ${
                        isPast
                          ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                          : isCurrent
                          ? 'bg-sky-400 animate-pulse'
                          : 'bg-white/[0.08]'
                      }`}
                    />
                  );
                })}
              </div>

              {/* Active Step Description Bar */}
              <div className="flex items-center justify-between text-xs pt-1">
                <div className="flex items-center space-x-2">
                  <span
                    className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md"
                    style={{ backgroundColor: `${theme.color}20`, color: theme.color }}
                  >
                    {step === 1 && INSTALL_MODAL_STRINGS.step1Badge}
                    {step === 2 && INSTALL_MODAL_STRINGS.step2Badge}
                    {step === 3 && INSTALL_MODAL_STRINGS.step3Badge}
                    {step === 4 && INSTALL_MODAL_STRINGS.step4Badge}
                    {step >= 5 && INSTALL_MODAL_STRINGS.step5Badge}
                  </span>
                  <span className="font-semibold text-white">
                    {step === 1 && INSTALL_MODAL_STRINGS.step1Title}
                    {step === 2 && INSTALL_MODAL_STRINGS.step2Title}
                    {step === 3 && INSTALL_MODAL_STRINGS.step3Title}
                    {step === 4 && INSTALL_MODAL_STRINGS.step4Title}
                    {step >= 5 && INSTALL_MODAL_STRINGS.step5Title}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  {isCompleted ? '100%' : `${Math.round(progress)}%`}
                </span>
              </div>
            </div>

            {/* Simulated Live Deployment Terminal Logs */}
            <div className="bg-[#05080f] rounded-2xl p-3.5 border border-white/[0.06] font-mono text-[11px] max-h-28 overflow-y-auto space-y-1 text-slate-300 select-text">
              <div className="flex items-center space-x-1.5 text-slate-500 pb-1 border-b border-white/[0.04]">
                <Terminal className="w-3 h-3 text-sky-400" />
                <span className="text-[10px]">{INSTALL_MODAL_STRINGS.logStreamHeader}</span>
              </div>
              {logs.map((line, idx) => (
                <div
                  key={idx}
                  className={`leading-relaxed ${
                    line.includes('[HEALTH]')
                      ? 'text-emerald-400'
                      : line.includes('[CRYPTO]')
                      ? 'text-amber-400'
                      : line.includes('[MERKLE]')
                      ? 'text-purple-400'
                      : line.includes('>>>')
                      ? 'text-sky-300 font-bold'
                      : 'text-slate-300'
                  }`}
                >
                  {line}
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>

            {/* Final Completion Action Buttons */}
            {isCompleted && (
              <div className="p-4 bg-emerald-500/[0.08] border border-emerald-500/25 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in duration-300">
                <div className="text-xs space-y-0.5">
                  <div className="font-semibold text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{deployedInstance.name}</span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-300">
                    {INSTALL_MODAL_STRINGS.portAssignedLabel}{' '}
                    <strong className="text-sky-400 font-bold">{deployedInstance.enginePort}</strong>
                    {deployedInstance.uiPort && (
                      <span className="ml-3">
                        {INSTALL_MODAL_STRINGS.uiPortAssignedLabel}{' '}
                        <strong className="text-emerald-400 font-bold">
                          {deployedInstance.uiPort}
                        </strong>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                  {deployedInstance.uiUrl && (
                    <a
                      href={deployedInstance.uiUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-xl text-xs flex items-center space-x-1 transition-all shadow-md active:scale-95"
                    >
                      <span>{INSTALL_MODAL_STRINGS.openConsoleButton}</span>
                    </a>
                  )}

                  {onViewCredentials && (
                    <button
                      onClick={() => {
                        onClose();
                        onViewCredentials(deployedInstance);
                      }}
                      className="px-3.5 py-2 bg-white/[0.08] hover:bg-white/[0.12] text-white rounded-xl text-xs font-medium transition-colors"
                    >
                      {INSTALL_MODAL_STRINGS.viewCredentialsButton}
                    </button>
                  )}

                  <button
                    onClick={() => {
                      if (onDone) onDone(deployedInstance);
                      else onClose();
                    }}
                    className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-xl text-xs font-semibold transition-all shadow-sm active:scale-95"
                  >
                    {INSTALL_MODAL_STRINGS.goToServicesButton}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* VIEW 2: PARAMETERS FORM */
          <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-4 text-xs">
              {/* Custom Name */}
              <div>
                <label className="text-slate-300 font-medium mb-1 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-sky-400" />
                  {INSTALL_MODAL_STRINGS.customNameLabel}{' '}
                  <span className="text-slate-500 font-normal">{INSTALL_MODAL_STRINGS.optionalLabel}</span>
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder={INSTALL_MODAL_STRINGS.customNamePlaceholder(blueprint.name)}
                  className="w-full bg-black/50 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20 font-medium text-xs transition-all"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  {INSTALL_MODAL_STRINGS.customNameHelp}
                </span>
              </div>

              {/* Custom Engine Port */}
              <div>
                <label className="text-slate-300 font-medium mb-1 flex items-center gap-1.5">
                  <Network className="w-3.5 h-3.5 text-emerald-400" />
                  {INSTALL_MODAL_STRINGS.servicePortLabel}{' '}
                  <span className="text-slate-500 font-normal">{INSTALL_MODAL_STRINGS.optionalLabel}</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="65535"
                  value={customEnginePort}
                  onChange={(e) => setCustomEnginePort(e.target.value)}
                  placeholder={INSTALL_MODAL_STRINGS.servicePortPlaceholder(blueprint.engine.defaultPort)}
                  className="w-full bg-black/50 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20 font-mono text-xs transition-all"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  {INSTALL_MODAL_STRINGS.servicePortHelp(blueprint.engine.defaultPort)}
                </span>
              </div>

              {/* Custom Companion UI Port */}
              {blueprint.companionUi && (
                <div>
                  <label className="text-slate-300 font-medium mb-1 flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5 text-purple-400" />
                    {INSTALL_MODAL_STRINGS.companionUiPortLabel(blueprint.companionUi.name)}{' '}
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
                    className="w-full bg-black/50 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20 font-mono text-xs transition-all"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    {INSTALL_MODAL_STRINGS.companionUiPortHelp(blueprint.companionUi.defaultPort)}
                  </span>
                </div>
              )}
            </div>

            {/* Footer Controls */}
            <div className="px-6 py-4 bg-white/[0.02] border-t border-white/[0.08] flex items-center justify-between">
              <button
                type="button"
                onClick={handleQuickDeploy}
                className="px-3.5 py-2 bg-white/[0.05] hover:bg-white/[0.08] text-slate-300 hover:text-white rounded-xl text-xs font-medium flex items-center space-x-1.5 transition-colors border border-white/[0.06]"
              >
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                <span>{INSTALL_MODAL_STRINGS.useDefaultsButton}</span>
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-transparent hover:bg-white/[0.05] text-slate-400 hover:text-white rounded-xl text-xs font-medium transition-colors"
                >
                  {COMMON_STRINGS.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold rounded-xl text-xs flex items-center space-x-2 transition-all shadow-[0_2px_12px_rgba(14,165,233,0.3)] active:scale-95"
                >
                  <span>{INSTALL_MODAL_STRINGS.deployContainerButton}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
