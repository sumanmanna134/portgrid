import React, { useState, useEffect, useRef } from 'react';
import {
  X,
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
  AlertTriangle,
  Lock,
  Cpu,
  Activity,
  ShieldCheck,
  Check,
  Loader2,
  ExternalLink,
  Terminal,
} from 'lucide-react';
import { ServiceBlueprint, InstalledServiceInstance } from '../types';
import { INSTALL_MODAL_STRINGS, COMMON_STRINGS } from '../constants/strings';
import { FEATURE_FLAGS } from '../constants/featureFlags';
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
  onOpenTerminalLogs?: (instance: InstalledServiceInstance) => void;
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
    return { color: '#06b6d4', icon: <Database className="w-5 h-5 text-cyan-400" /> };
  }
  return { color: '#38bdf8', icon: <Box className="w-5 h-5 text-cyan-400" /> };
};

export const InstallModal: React.FC<InstallModalProps> = ({
  blueprint,
  isOpen,
  onClose,
  onDeploy,
  onViewCredentials,
  onOpenTerminalLogs,
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
  const [selectedBlockIndex, setSelectedBlockIndex] = useState(0);
  const [deployedInstance, setDeployedInstance] = useState<InstalledServiceInstance | null>(null);
  const [deployError, setDeployError] = useState<string | null>(null);
  const [pullProgress, setPullProgress] = useState<{
    image: string;
    percent: number;
    currentBytes: number;
    totalBytes: number;
    status: string;
    active: boolean;
    formatted: string;
  } | null>(null);
  const [showLiveLogs, setShowLiveLogs] = useState(false);
  const [liveLogs, setLiveLogs] = useState<string>('');
  const liveLogsEndRef = useRef<HTMLDivElement>(null);

  // Dynamic console URL resolver mapping localhost to 127.0.0.1 for IPv4 Docker compatibility
  const resolveConsoleUrl = (url?: string, port?: number) => {
    if (!port && !url) return '';
    const targetPort = port || (url ? parseInt(new URL(url).port, 10) : 0);
    const currentHost = window.location.hostname || '127.0.0.1';
    const targetHost = currentHost === 'localhost' ? '127.0.0.1' : currentHost;
    if (url) {
      return url.replace('localhost', targetHost);
    }
    return `http://${targetHost}:${targetPort}`;
  };

  // Live log polling during deployment or after completion
  useEffect(() => {
    if (!showLiveLogs) return;
    let isMounted = true;

    const pollLogs = async () => {
      try {
        if (deployedInstance?.id) {
          const res = await fetch(`/api/services/${deployedInstance.id}/logs`);
          if (res.ok && isMounted) {
            const text = await res.text();
            if (text) setLiveLogs(text);
          }
        } else {
          const res = await fetch('/api/services/pull-progress');
          if (res.ok && isMounted) {
            const data = await res.json();
            if (data && data.formatted) {
              setLiveLogs((prev) => {
                if (prev.includes(data.formatted)) return prev;
                return prev ? `${prev}\n${data.formatted}` : data.formatted;
              });
            }
          }
        }
      } catch {
        // Ignore polling errors
      }
    };

    pollLogs();
    const interval = setInterval(pollLogs, 1200);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [showLiveLogs, deployedInstance?.id]);

  useEffect(() => {
    if (showLiveLogs && liveLogsEndRef.current) {
      liveLogsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [liveLogs, showLiveLogs]);

  useEffect(() => {
    if (blueprint) {
      setCustomName('');
      setCustomEnginePort('');
      setCustomUiPort('');
      setIsDeploying(false);
      setStep(1);
      setProgress(0);
      setSelectedBlockIndex(0);
      setDeployedInstance(null);
      setDeployError(null);
      setPullProgress(null);
      setShowLiveLogs(false);
      setLiveLogs('');
    }
  }, [blueprint, isOpen]);

  if (!isOpen || !blueprint) return null;

  const theme = getBlueprintTheme(blueprint.id);
  const targetPort = customEnginePort ? parseInt(customEnginePort, 10) : blueprint.engine.defaultPort;
  const targetUiPort = customUiPort
    ? parseInt(customUiPort, 10)
    : blueprint.companionUi?.defaultPort;

  // Enclave block specs definition for interactive inspection
  const enclaveBlocks = [
    {
      id: 1,
      title: INSTALL_MODAL_STRINGS.block1Title,
      spec: INSTALL_MODAL_STRINGS.block1Spec,
      desc: INSTALL_MODAL_STRINGS.step1Desc,
      icon: <Network className="w-4 h-4 text-sky-400" />,
    },
    {
      id: 2,
      title: INSTALL_MODAL_STRINGS.block2Title,
      spec: INSTALL_MODAL_STRINGS.block2Spec,
      desc: INSTALL_MODAL_STRINGS.step2Desc,
      icon: <Lock className="w-4 h-4 text-amber-400" />,
    },
    {
      id: 3,
      title: INSTALL_MODAL_STRINGS.block3Title,
      spec: INSTALL_MODAL_STRINGS.block3Spec,
      desc: INSTALL_MODAL_STRINGS.step3Desc,
      icon: <Cpu className="w-4 h-4 text-emerald-400" />,
    },
    {
      id: 4,
      title: INSTALL_MODAL_STRINGS.block4Title,
      spec: `${INSTALL_MODAL_STRINGS.block4Spec} (:${targetPort})`,
      desc: INSTALL_MODAL_STRINGS.step4Desc,
      icon: <Activity className="w-4 h-4 text-cyan-400" />,
    },
    {
      id: 5,
      title: INSTALL_MODAL_STRINGS.block5Title,
      spec:
        pullProgress && pullProgress.active
          ? `${INSTALL_MODAL_STRINGS.block5Spec} (${pullProgress.percent}%)`
          : INSTALL_MODAL_STRINGS.block5Spec,
      desc:
        pullProgress && pullProgress.active && pullProgress.formatted
          ? pullProgress.formatted
          : INSTALL_MODAL_STRINGS.step5Desc,
      icon: <ShieldCheck className="w-4 h-4 text-emerald-300" />,
    },
  ];

  const startDeploymentFlow = async (options: {
    blueprintId: string;
    customName?: string;
    customEnginePort?: number;
    customUiPort?: number;
  }) => {
    setIsDeploying(true);
    setDeployError(null);
    setStep(1);
    setSelectedBlockIndex(0);
    setProgress(15);

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

    // Step-by-step interactive block assembly transitions
    // Block 2: Key & Secret Vault
    await new Promise((r) => setTimeout(r, 650));
    setStep(2);
    setSelectedBlockIndex(1);
    setProgress(35);

    // Block 3: Container Engine & Persistent Storage
    await new Promise((r) => setTimeout(r, 700));
    setStep(3);
    setSelectedBlockIndex(2);
    setProgress(60);

    // Block 4: Port Socket & Loopback Binding
    await new Promise((r) => setTimeout(r, 700));
    setStep(4);
    setSelectedBlockIndex(3);
    setProgress(85);

    // Block 5: Tamper-Evident Merkle Audit Seal
    await new Promise((r) => setTimeout(r, 650));
    setStep(5);
    setSelectedBlockIndex(4);
    setProgress(96);

    let pullPollInterval: ReturnType<typeof setInterval> | null = null;
    try {
      pullPollInterval = setInterval(async () => {
        try {
          const res = await fetch('/api/services/pull-progress');
          if (res.ok) {
            const data = await res.json();
            if (data && (data.active || data.percent > 0)) {
              setPullProgress(data);
              if (data.percent > 0) {
                // Scale 96% to 99.8% based on pull percent
                const scaled = 96 + (data.percent / 100) * 3.8;
                setProgress((prev) => Math.max(prev, Math.min(99.8, scaled)));
              }
            }
          }
        } catch {
          // Ignore transient polling errors
        }
      }, 400);

      // Await API completion
      await apiPromise;
    } finally {
      if (pullPollInterval) {
        clearInterval(pullPollInterval);
      }
    }

    if (apiError) {
      setDeployError(apiError);
      return;
    }

    // Block Stack Complete
    await new Promise((r) => setTimeout(r, 450));
    setStep(6);
    setProgress(100);
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
  const activeBlockData = enclaveBlocks[selectedBlockIndex] || enclaveBlocks[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-2xl bg-[#090d16] border border-white/[0.08] shadow-[0_32px_80px_-16px_rgba(0,0,0,0.85)] overflow-hidden transition-all duration-300">

        {/* MODAL HEADER */}
        <div className="flex-shrink-0 px-6 sm:px-7 py-5 border-b border-white/[0.06] flex items-center justify-between bg-white/[0.015]">
          <div className="flex items-center space-x-3.5">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center border shadow-inner transition-transform"
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
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-medium border ${isCompleted
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
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* MODAL SCROLLABLE BODY */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-7 pt-6 pb-8 sm:pb-10 space-y-5">
          {isDeploying ? (
            /* VIEW 1: ENCLAVE PROVISIONING */
            <div className="space-y-4">
              {FEATURE_FLAGS.ENABLE_3D_INTERACTIVE ? (
                /* 3D Model Stage (Deferred to Next Release) */
                <div className="rounded-xl bg-[#050811] border border-white/[0.06] overflow-hidden p-2 relative shadow-inner">
                  <DeployingCube3D
                    step={step}
                    progress={progress}
                    accentColor={theme.color}
                    icon={theme.icon}
                    serviceName={customName || blueprint.name}
                    port={targetPort}
                    selectedBlockIndex={selectedBlockIndex}
                    onSelectBlock={setSelectedBlockIndex}
                  />
                </div>
              ) : (
                /* Crisp Enterprise 2D Enclave Status Card with Live Provisioning State */
                <div className="rounded-xl bg-[#050811] border border-white/[0.08] p-5 shadow-inner">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3.5">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center border shadow-sm transition-all ${!isCompleted ? 'relative ring-1 ring-sky-500/30' : ''
                          }`}
                        style={{
                          backgroundColor: `${theme.color}15`,
                          borderColor: `${theme.color}35`,
                          color: theme.color,
                        }}
                      >
                        {!isCompleted && (
                          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-500"></span>
                          </span>
                        )}
                        {theme.icon}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-sm text-white">
                            {customName || blueprint.name}
                          </h3>
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold border flex items-center gap-1.5 ${isCompleted
                                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                : 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                              }`}
                          >
                            {!isCompleted && (
                              <Loader2 className="w-2.5 h-2.5 animate-spin text-sky-400 shrink-0" />
                            )}
                            <span>
                              {isCompleted
                                ? INSTALL_MODAL_STRINGS.statusOnline
                                : INSTALL_MODAL_STRINGS.statusInitializing}
                            </span>
                          </span>
                        </div>
                        <div className="flex items-center space-x-3 text-[11px] text-slate-400 font-mono mt-0.5">
                          <span>{INSTALL_MODAL_STRINGS.portAssignedLabel} 127.0.0.1:{targetPort}</span>
                          {targetUiPort && (
                            <span>• {INSTALL_MODAL_STRINGS.uiPortAssignedLabel} :{targetUiPort}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {!isCompleted && (
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                        )}
                        <span className="text-base font-bold font-mono text-white">
                          {Math.round(progress)}%
                        </span>
                      </div>
                      <span className="block text-[10px] text-slate-400 font-mono">
                        {isCompleted
                          ? INSTALL_MODAL_STRINGS.enclaveReadyBadge
                          : INSTALL_MODAL_STRINGS.stepCount(Math.min(5, step), 5)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Banner */}
              {deployError && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/25 rounded-xl flex items-center justify-between text-xs text-rose-300">
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
                    className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 rounded-lg text-xs font-semibold transition-colors shrink-0 ml-3"
                  >
                    {INSTALL_MODAL_STRINGS.retryButton}
                  </button>
                </div>
              )}

              {/* Unified Progress Track with Animated Pulse */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    {!isCompleted && (
                      <Loader2 className="w-3 h-3 text-sky-400 animate-spin shrink-0" />
                    )}
                    <span className="text-slate-400 font-mono text-[11px]">
                      {INSTALL_MODAL_STRINGS.blocksAssembledCount(Math.min(5, step), 5)}
                    </span>
                  </div>
                  <span className="text-slate-300 font-mono font-semibold">
                    {Math.round(progress)}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-white/[0.06] rounded-md overflow-hidden relative">
                  <div
                    className="h-full rounded-md transition-all duration-500 ease-out relative overflow-hidden"
                    style={{
                      width: `${progress}%`,
                      backgroundColor: isCompleted ? '#10b981' : theme.color,
                    }}
                  >
                    {!isCompleted && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
                    )}
                  </div>
                </div>
              </div>

              {/* Image Pull Live Streaming Bar */}
              {step === 5 && !isCompleted && pullProgress && pullProgress.active && (
                <div className="p-3.5 rounded-xl bg-sky-500/[0.06] border border-sky-500/20 space-y-2 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-3.5 h-3.5 text-sky-400 animate-spin shrink-0" />
                      <span className="font-semibold text-white font-mono text-[11px]">
                        {INSTALL_MODAL_STRINGS.pullProgressTitle}
                      </span>
                    </div>
                    <span className="font-mono text-sky-300 text-[11px] font-semibold">
                      {pullProgress.percent}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-white/[0.08] rounded-full overflow-hidden relative">
                    <div
                      className="h-full rounded-full bg-sky-400 transition-all duration-300 ease-out"
                      style={{ width: `${Math.max(2, pullProgress.percent)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span className="truncate max-w-[320px]">
                      {pullProgress.status || INSTALL_MODAL_STRINGS.pullProgressSubtext}
                    </span>
                    <span>{pullProgress.percent}%</span>
                  </div>
                </div>
              )}

              {/* Interactive Block Selector Strip (Click to inspect block) */}
              <div className="grid grid-cols-5 gap-1.5 pt-1">
                {enclaveBlocks.map((blk, idx) => {
                  const isAssembled = step >= blk.id;
                  const isSelected = selectedBlockIndex === idx;
                  const isCurrentAssembling = step === blk.id && !isCompleted;

                  return (
                    <button
                      key={blk.id}
                      type="button"
                      onClick={() => setSelectedBlockIndex(idx)}
                      className={`p-2 rounded-lg border text-left flex flex-col justify-between transition-all ${isSelected
                          ? 'bg-sky-500/15 border-sky-500/40 text-white shadow-sm'
                          : isAssembled
                            ? 'bg-white/[0.03] hover:bg-white/[0.06] border-white/[0.08] text-slate-300'
                            : 'bg-white/[0.01] border-white/[0.04] text-slate-600 opacity-60'
                        }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="text-[10px] font-mono font-semibold">
                          #{blk.id}
                        </span>
                        {isCompleted || step > blk.id ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : isCurrentAssembling ? (
                          <Loader2 className="w-3 h-3 text-sky-400 animate-spin" />
                        ) : null}
                      </div>
                      <span className="text-[10px] font-medium truncate block">
                        {blk.title}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Active Block Specification Card */}
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    {activeBlockData.icon}
                    <span className="font-semibold text-white">
                      {activeBlockData.title}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-sky-400 font-medium flex items-center gap-1.5">
                    {!isCompleted && step === activeBlockData.id && (
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping inline-block" />
                    )}
                    <span>{activeBlockData.spec}</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed font-normal">
                  {activeBlockData.desc}
                </p>
              </div>

              {/* Live Logs Collapsible Terminal Drawer */}
              {showLiveLogs && (
                <div className="rounded-xl bg-[#040711] border border-white/[0.08] overflow-hidden shadow-2xl animate-in fade-in duration-200">
                  <div className="px-3.5 py-2 bg-[#080d19] border-b border-white/[0.06] flex items-center justify-between text-[11px] font-mono">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                      <span className="text-slate-300 font-medium ml-1">
                        {INSTALL_MODAL_STRINGS.deploymentLogsTitle}
                      </span>
                      <span className="relative flex h-2 w-2 ml-1">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowLiveLogs(false)}
                      className="text-slate-400 hover:text-white text-[10px] px-1.5 py-0.5 rounded hover:bg-white/[0.06] transition-colors"
                    >
                      {INSTALL_MODAL_STRINGS.hideLogsButton}
                    </button>
                  </div>
                  <div className="p-3 max-h-40 overflow-y-auto font-mono text-[11px] leading-relaxed select-text space-y-0.5 bg-[#02050e] text-slate-300">
                    {liveLogs ? (
                      liveLogs.split('\n').map((line, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <span className="text-slate-600 select-none text-[10px] w-6 shrink-0 text-right">{idx + 1}</span>
                          <span className="break-all">{line}</span>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center gap-2 text-slate-500 italic py-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-400" />
                        <span>{pullProgress?.status || INSTALL_MODAL_STRINGS.streamingLogsPlaceholder}</span>
                      </div>
                    )}
                    <div ref={liveLogsEndRef} />
                  </div>
                </div>
              )}

              {/* Completion Summary Card */}
              {isCompleted && (
                <div className="p-4 rounded-xl bg-emerald-500/[0.04] border border-emerald-500/20 space-y-3 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="font-semibold text-white">{deployedInstance.name}</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/25 font-semibold">
                      {INSTALL_MODAL_STRINGS.serviceSummaryTitle}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-black/40 border border-white/[0.06] flex items-center justify-between">
                      <span className="text-slate-400 text-[11px]">{INSTALL_MODAL_STRINGS.enginePortBadge}</span>
                      <span className="font-mono text-white font-semibold">:{deployedInstance.enginePort}</span>
                    </div>

                    {deployedInstance.uiPort && (
                      <div className="p-2.5 rounded-lg bg-black/40 border border-white/[0.06] flex items-center justify-between">
                        <span className="text-slate-400 text-[11px]">{INSTALL_MODAL_STRINGS.uiPortBadge}</span>
                        <span className="font-mono text-emerald-400 font-semibold">:{deployedInstance.uiPort}</span>
                      </div>
                    )}
                  </div>

                  {deployedInstance.uiPort && (
                    <p className="text-[10px] text-slate-500 font-normal italic pt-0.5">
                      {INSTALL_MODAL_STRINGS.companionWarmingNote}
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* VIEW 2: PARAMETERS CONFIGURATION FORM */
            <div className="space-y-4 text-xs">
              {/* Sandbox Defaults Callout */}
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400">
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
                  className="w-full bg-black/40 border border-white/[0.08] hover:border-white/[0.14] rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/20 text-xs transition-all font-mono"
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
                  className="w-full bg-black/40 border border-white/[0.08] hover:border-white/[0.14] rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/20 font-mono text-xs transition-all"
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
                      <Server className="w-3.5 h-3.5 text-cyan-400" />
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
                    className="w-full bg-black/40 border border-white/[0.08] hover:border-white/[0.14] rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/20 font-mono text-xs transition-all"
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
        <div className="flex-shrink-0 px-6 sm:px-7 py-4 sm:py-5 border-t border-white/[0.06] bg-white/[0.015] flex items-center justify-between">
          {isDeploying ? (
            isCompleted ? (
              <div className="flex items-center justify-between w-full gap-2">
                <div className="flex items-center gap-2 shrink-0">
                  {onViewCredentials && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onViewCredentials(deployedInstance);
                      }}
                      className="px-3.5 py-2 bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 hover:text-white rounded-xl text-xs font-medium transition-all border border-white/[0.1] flex items-center gap-1.5 active:scale-95 shadow-sm whitespace-nowrap shrink-0"
                    >
                      <Key className="w-3.5 h-3.5 text-amber-400" />
                      <span>{INSTALL_MODAL_STRINGS.viewCredentialsButton}</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-auto">
                  {deployedInstance.uiPort && (
                    <a
                      href={resolveConsoleUrl(deployedInstance.uiUrl, deployedInstance.uiPort)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        e.preventDefault();
                        const url = resolveConsoleUrl(deployedInstance.uiUrl, deployedInstance.uiPort);
                        window.open(url, '_blank', 'noopener,noreferrer');
                      }}
                      className="px-3.5 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 hover:text-emerald-200 border border-emerald-500/30 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm active:scale-95 whitespace-nowrap shrink-0"
                      title={INSTALL_MODAL_STRINGS.openConsoleTooltip}
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{INSTALL_MODAL_STRINGS.openConsoleButton}</span>
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      if (onDone) onDone(deployedInstance);
                      else onClose();
                    }}
                    className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold rounded-xl text-xs transition-all shadow-sm active:scale-95 whitespace-nowrap shrink-0"
                  >
                    {INSTALL_MODAL_STRINGS.goToServicesButton}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center justify-center w-5 h-5 rounded-md bg-sky-500/10 border border-sky-500/25 shrink-0">
                    <Loader2 className="w-3.5 h-3.5 text-sky-400 animate-spin" />
                  </div>
                  <div className="flex items-center gap-1 text-xs font-medium text-slate-200">
                    <span>{INSTALL_MODAL_STRINGS.deployingAnimatedText}</span>
                    <span className="inline-flex items-center space-x-0.5 text-sky-400 font-mono">
                      <span className="inline-block animate-bounce [animation-delay:0ms]">.</span>
                      <span className="inline-block animate-bounce [animation-delay:150ms]">.</span>
                      <span className="inline-block animate-bounce [animation-delay:300ms]">.</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  {/* Live Log Button During Deployment */}
                  <button
                    type="button"
                    onClick={() => setShowLiveLogs((prev) => !prev)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-all active:scale-95 ${showLiveLogs
                        ? 'bg-sky-500/20 text-sky-300 border-sky-500/35 shadow-sm'
                        : 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border-white/[0.08]'
                      }`}
                  >
                    <Terminal className="w-3 h-3 text-sky-400" />
                    <span>
                      {showLiveLogs
                        ? INSTALL_MODAL_STRINGS.hideLogsButton
                        : INSTALL_MODAL_STRINGS.liveLogsButton}
                    </span>
                  </button>

                  <span className="text-[11px] text-slate-400 font-mono">
                    {INSTALL_MODAL_STRINGS.stepCount(Math.min(5, step), 5)}
                  </span>
                  <span className="text-xs font-mono font-bold text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-md border border-sky-500/25">
                    {Math.round(progress)}%
                  </span>
                </div>
              </div>
            )
          ) : (
            <>
              <button
                type="button"
                onClick={handleQuickDeploy}
                className="px-4 py-2 bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 hover:text-white rounded-xl text-xs font-medium flex items-center gap-2 transition-all border border-white/[0.1] shadow-sm active:scale-95 whitespace-nowrap shrink-0"
              >
                <Server className="w-3.5 h-3.5 text-sky-400" />
                <span>{INSTALL_MODAL_STRINGS.useDefaultsButton}</span>
              </button>

              <div className="flex items-center gap-2 shrink-0 ml-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 bg-transparent hover:bg-white/[0.05] text-slate-400 hover:text-white rounded-xl text-xs font-medium transition-colors whitespace-nowrap shrink-0"
                >
                  {COMMON_STRINGS.cancel}
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold rounded-xl text-xs flex items-center space-x-1.5 transition-all shadow-sm active:scale-95 whitespace-nowrap shrink-0"
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
