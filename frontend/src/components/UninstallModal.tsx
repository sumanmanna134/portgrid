import React, { useState } from 'react';
import {
  AlertTriangle,
  Trash2,
  X,
  CheckSquare,
  Square,
  Loader2,
  HardDrive,
  UserCheck,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { InstalledServiceInstance, ApprovalTicket } from '../types';
import { UNINSTALL_MODAL_STRINGS, COMMON_STRINGS } from '../constants/strings';

interface UninstallModalProps {
  service: InstalledServiceInstance | null;
  isOpen: boolean;
  isUninstalling?: boolean;
  makerCheckerEnabled?: boolean;
  createdTicket?: ApprovalTicket | null;
  onClose: () => void;
  onConfirm: (serviceId: string, removeVolumes: boolean) => void;
  onOpenGovernance?: () => void;
}

export const UninstallModal: React.FC<UninstallModalProps> = ({
  service,
  isOpen,
  isUninstalling = false,
  makerCheckerEnabled = true,
  createdTicket = null,
  onClose,
  onConfirm,
  onOpenGovernance,
}) => {
  const [removeVolumes, setRemoveVolumes] = useState(true);
  const [stage, setStage] = useState(1);

  React.useEffect(() => {
    if (isUninstalling) {
      setStage(1);
      const t1 = setTimeout(() => setStage(2), 1000);
      const t2 = setTimeout(() => setStage(3), 2000);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    } else {
      setStage(1);
    }
  }, [isUninstalling]);

  if (!isOpen || !service) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
      <div className="glass-modal w-full max-w-md rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col border border-rose-500/20">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/[0.08] flex items-center justify-between bg-rose-500/[0.04]">
          <div className="flex items-center space-x-3.5">
            <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20 shadow-inner">
              {isUninstalling ? (
                <Loader2 className="w-5 h-5 animate-spin text-rose-400" />
              ) : createdTicket ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : makerCheckerEnabled ? (
                <UserCheck className="w-5 h-5 text-amber-400" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              )}
            </div>
            <div>
              <h3 className="text-base font-semibold text-white tracking-tight">
                {isUninstalling
                  ? UNINSTALL_MODAL_STRINGS.titleDeProvisioning
                  : createdTicket
                  ? UNINSTALL_MODAL_STRINGS.titleTicketCreated
                  : makerCheckerEnabled
                  ? UNINSTALL_MODAL_STRINGS.titleAuthorization
                  : UNINSTALL_MODAL_STRINGS.titleUninstall}
              </h3>
              <p className="text-xs text-slate-400 font-normal">{service.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isUninstalling}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.08] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs text-slate-300">
          {/* STATE 1: Ticket already generated */}
          {createdTicket ? (
            <div className="space-y-4 py-1">
              <div className="p-4 bg-emerald-500/[0.08] border border-emerald-500/25 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-300">
                    {UNINSTALL_MODAL_STRINGS.ticketActivePrefix(createdTicket.id)}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {UNINSTALL_MODAL_STRINGS.pendingCheckerBadge}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {UNINSTALL_MODAL_STRINGS.ticketNotice(service.name)}
                </p>
                <div className="text-[10px] font-mono text-slate-400 pt-1 border-t border-white/[0.06]">
                  <div>
                    {UNINSTALL_MODAL_STRINGS.makerPrefix} {createdTicket.maker.userId} ({createdTicket.maker.ipAddress})
                  </div>
                  <div>
                    {UNINSTALL_MODAL_STRINGS.purgeVolumesPrefix}{' '}
                    {createdTicket.payload.removeVolumes
                      ? UNINSTALL_MODAL_STRINGS.purgeVolumesYes
                      : UNINSTALL_MODAL_STRINGS.purgeVolumesNo}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                <Lock className="w-3.5 h-3.5 text-sky-400" />
                <span>{UNINSTALL_MODAL_STRINGS.fourEyesPrincipleNotice}</span>
              </div>
            </div>
          ) : isUninstalling ? (
            /* STATE 2: Actively De-provisioning Progress Gauge */
            <div className="space-y-4 py-2">
              <div className="p-4 bg-black/50 border border-rose-500/20 rounded-2xl space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                    <Loader2 className="w-4 h-4 text-rose-400 animate-spin" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">
                      {stage === 1 && UNINSTALL_MODAL_STRINGS.step1Title}
                      {stage === 2 && UNINSTALL_MODAL_STRINGS.step2Title}
                      {stage === 3 && UNINSTALL_MODAL_STRINGS.step3Title}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {stage === 1 && UNINSTALL_MODAL_STRINGS.step1Desc}
                      {stage === 2 &&
                        (removeVolumes
                          ? UNINSTALL_MODAL_STRINGS.step2DescPurge
                          : UNINSTALL_MODAL_STRINGS.step2DescPreserve)}
                      {stage === 3 && UNINSTALL_MODAL_STRINGS.step3Desc}
                    </div>
                  </div>
                </div>

                {/* 3-Stage Progress Gauge */}
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      stage >= 1 ? 'bg-rose-500' : 'bg-white/[0.08]'
                    }`}
                  ></div>
                  <div
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      stage >= 2 ? 'bg-rose-500' : 'bg-white/[0.08]'
                    }`}
                  ></div>
                  <div
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      stage >= 3 ? 'bg-rose-500' : 'bg-white/[0.08]'
                    }`}
                  ></div>
                </div>
              </div>

              <div className="space-y-2 text-[11px] text-slate-400">
                <div className="flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping"></span>
                  <span>{UNINSTALL_MODAL_STRINGS.executingSafetyWindow}</span>
                </div>
                {removeVolumes && service.volumes && service.volumes.length > 0 && (
                  <div className="flex items-center space-x-2 text-slate-400">
                    <HardDrive className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate">
                      {UNINSTALL_MODAL_STRINGS.targetVolumePrefix}{' '}
                      <strong className="text-slate-300 font-mono">{service.volumes[0]}</strong>
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* STATE 3: Confirmation View */
            <>
              {makerCheckerEnabled && (
                <div className="p-3.5 bg-amber-500/[0.08] border border-amber-500/25 rounded-2xl space-y-1 text-[11px] text-amber-200">
                  <div className="font-semibold flex items-center gap-1.5 text-amber-300">
                    <ShieldAlert className="w-4 h-4" />
                    <span>{UNINSTALL_MODAL_STRINGS.fourEyesEnforcedTitle}</span>
                  </div>
                  <p className="text-slate-300 leading-normal">
                    {UNINSTALL_MODAL_STRINGS.fourEyesEnforcedDesc}
                  </p>
                </div>
              )}

              <p className="text-slate-300 leading-relaxed">
                {UNINSTALL_MODAL_STRINGS.terminateWarning(service.name)}
              </p>

              {/* Volume removal toggle card */}
              <div
                onClick={() => setRemoveVolumes(!removeVolumes)}
                className="flex items-start space-x-3 p-3.5 bg-black/50 rounded-2xl border border-white/[0.06] cursor-pointer hover:border-white/[0.12] transition-colors select-none"
              >
                <div className="pt-0.5 text-sky-400">
                  {removeVolumes ? (
                    <CheckSquare className="w-4 h-4 text-rose-400" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-600" />
                  )}
                </div>
                <div>
                  <span className="font-semibold text-xs text-white block">
                    {UNINSTALL_MODAL_STRINGS.purgeStorageTitle}
                  </span>
                  <span className="text-[11px] text-slate-400 leading-normal block mt-0.5">
                    {UNINSTALL_MODAL_STRINGS.purgeStorageDesc(
                      service.volumes?.join(', ') || UNINSTALL_MODAL_STRINGS.noneVolumes
                    )}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white/[0.02] border-t border-white/[0.08] flex justify-end space-x-2.5">
          {createdTicket ? (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-white/[0.06] hover:bg-white/[0.1] text-white rounded-xl text-xs font-medium transition-colors"
              >
                {COMMON_STRINGS.dismiss}
              </button>
              {onOpenGovernance && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenGovernance();
                  }}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-md active:scale-95"
                >
                  <span>{UNINSTALL_MODAL_STRINGS.openGovernanceCenter}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </>
          ) : (
            <>
              <button
                onClick={onClose}
                disabled={isUninstalling}
                className="px-4 py-2 bg-white/[0.06] hover:bg-white/[0.1] text-white rounded-xl text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {COMMON_STRINGS.cancel}
              </button>
              <button
                onClick={() => onConfirm(service.id, removeVolumes)}
                disabled={isUninstalling}
                className={`px-4 py-2 rounded-xl text-xs font-medium flex items-center space-x-1.5 transition-all shadow-lg ${
                  isUninstalling
                    ? 'bg-rose-950/60 text-rose-300/60 cursor-not-allowed border border-rose-500/20 shadow-none'
                    : makerCheckerEnabled
                    ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/25 active:scale-95'
                    : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/25 active:scale-95'
                }`}
              >
                {isUninstalling ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{UNINSTALL_MODAL_STRINGS.deProvisioningButton}</span>
                  </>
                ) : makerCheckerEnabled ? (
                  <>
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>{UNINSTALL_MODAL_STRINGS.submitDualAuth}</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{UNINSTALL_MODAL_STRINGS.confirmUninstall}</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
