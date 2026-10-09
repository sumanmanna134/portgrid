import React, { useState } from 'react';
import {
  X,
  Key,
  Copy,
  Check,
  Eye,
  EyeOff,
  Terminal,
  Link2,
  FileCode,
  User,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { InstalledServiceInstance } from '../types';
import { CREDENTIALS_MODAL_STRINGS, COMMON_STRINGS } from '../constants/strings';

interface CredentialsModalProps {
  service: InstalledServiceInstance | null;
  onClose: () => void;
}

export const CredentialsModal: React.FC<CredentialsModalProps> = ({ service, onClose }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  if (!service) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const password = service.secrets?.password || CREDENTIALS_MODAL_STRINGS.notApplicable;

  // Determine username with intelligent fallbacks
  const username =
    service.secrets?.username ||
    (service.blueprintId === 'postgresql'
      ? 'postgres'
      : service.blueprintId === 'rabbitmq'
      ? 'guest'
      : service.blueprintId === 'redis'
      ? 'default'
      : 'admin');

  // Determine UI username with intelligent fallbacks
  const isRedis = service.blueprintId.includes('redis');
  const uiUsername =
    service.secrets?.uiUsername ||
    (service.blueprintId === 'postgresql' ? 'admin@portgrid.com' : username);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="glass-modal w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center space-x-3.5">
            <div className="p-2.5 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/20 shadow-inner">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white tracking-tight">{CREDENTIALS_MODAL_STRINGS.title}</h3>
              <p className="text-xs text-slate-400 font-normal">{service.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.08] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Engine Credentials Grid (Host, User, Password) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Host & Port */}
            <div className="bg-black/50 p-3.5 rounded-2xl border border-white/[0.06]">
              <span className="text-[11px] text-slate-500 font-medium block mb-1">{CREDENTIALS_MODAL_STRINGS.hostAndPort}</span>
              <div className="flex items-center justify-between font-mono font-medium text-slate-200 text-xs">
                <span className="truncate">localhost:{service.enginePort}</span>
                <button
                  onClick={() => copyToClipboard(`localhost:${service.enginePort}`, 'host')}
                  className="p-1.5 rounded-lg hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors shrink-0"
                  title={CREDENTIALS_MODAL_STRINGS.copyHostTooltip}
                >
                  {copiedKey === 'host' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Username */}
            <div className="bg-black/50 p-3.5 rounded-2xl border border-white/[0.06]">
              <span className="text-[11px] text-slate-500 font-medium block mb-1">{CREDENTIALS_MODAL_STRINGS.username}</span>
              <div className="flex items-center justify-between font-mono font-medium text-slate-200 text-xs">
                <span className="truncate">{username}</span>
                <button
                  onClick={() => copyToClipboard(username, 'user')}
                  className="p-1.5 rounded-lg hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors shrink-0"
                  title={CREDENTIALS_MODAL_STRINGS.copyUserTooltip}
                >
                  {copiedKey === 'user' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Password */}
            <div className="bg-black/50 p-3.5 rounded-2xl border border-white/[0.06]">
              <span className="text-[11px] text-slate-500 font-medium block mb-1">{CREDENTIALS_MODAL_STRINGS.password}</span>
              <div className="flex items-center justify-between font-mono font-medium text-slate-200 text-xs">
                <span className="truncate mr-1.5">
                  {showPassword ? password : CREDENTIALS_MODAL_STRINGS.maskedPassword}
                </span>
                <div className="flex items-center space-x-0.5 shrink-0">
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1.5 rounded-lg hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors"
                    title={showPassword ? CREDENTIALS_MODAL_STRINGS.hidePasswordTooltip : CREDENTIALS_MODAL_STRINGS.showPasswordTooltip}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => copyToClipboard(password, 'pwd')}
                    className="p-1.5 rounded-lg hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors"
                    title={CREDENTIALS_MODAL_STRINGS.copyPasswordTooltip}
                  >
                    {copiedKey === 'pwd' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Companion Web UI Authentication Banner */}
          {service.uiUrl && (
            <div className="p-4 bg-emerald-500/[0.05] border border-emerald-500/20 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  {CREDENTIALS_MODAL_STRINGS.companionConsoleTitle}
                </span>
                <a
                  href={service.uiUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium"
                >
                  <span>{CREDENTIALS_MODAL_STRINGS.launchConsole}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {isRedis ? (
                <div className="text-xs text-slate-300 leading-relaxed">
                  <span className="text-emerald-300 font-medium">{CREDENTIALS_MODAL_STRINGS.redisDirectAccessTitle}</span> {CREDENTIALS_MODAL_STRINGS.redisDirectAccessDesc}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs font-mono">
                  <div className="bg-black/40 px-3 py-2 rounded-xl border border-white/[0.06] flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">{CREDENTIALS_MODAL_STRINGS.loginUserLabel}</span>
                    <span className="text-slate-200 font-semibold">{uiUsername}</span>
                  </div>
                  <div className="bg-black/40 px-3 py-2 rounded-xl border border-white/[0.06] flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">{CREDENTIALS_MODAL_STRINGS.loginPasswordLabel}</span>
                    <span className="text-slate-200 font-semibold truncate max-w-[120px]">
                      {showPassword ? password : CREDENTIALS_MODAL_STRINGS.maskedPassword}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Connection URI */}
          {service.connectionStrings?.uri && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-sky-400" />
                  {CREDENTIALS_MODAL_STRINGS.connectionUriLabel}
                </label>
                <button
                  onClick={() => copyToClipboard(service.connectionStrings.uri!, 'uri')}
                  className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 font-medium transition-colors"
                >
                  {copiedKey === 'uri' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">{COMMON_STRINGS.copied}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>{CREDENTIALS_MODAL_STRINGS.copyUriButton}</span>
                    </>
                  )}
                </button>
              </div>
              <div className="bg-black/60 font-mono text-xs text-slate-300 p-3.5 rounded-xl border border-white/[0.06] break-all select-all">
                {service.connectionStrings.uri}
              </div>
            </div>
          )}

          {/* JDBC URL (if applicable) */}
          {service.connectionStrings?.jdbc && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <FileCode className="w-3.5 h-3.5 text-emerald-400" />
                  {CREDENTIALS_MODAL_STRINGS.jdbcUrlLabel}
                </label>
                <button
                  onClick={() => copyToClipboard(service.connectionStrings.jdbc!, 'jdbc')}
                  className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 font-medium transition-colors"
                >
                  {copiedKey === 'jdbc' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">{COMMON_STRINGS.copied}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>{CREDENTIALS_MODAL_STRINGS.copyJdbcButton}</span>
                    </>
                  )}
                </button>
              </div>
              <div className="bg-black/60 font-mono text-xs text-slate-300 p-3.5 rounded-xl border border-white/[0.06] break-all select-all">
                {service.connectionStrings.jdbc}
              </div>
            </div>
          )}

          {/* Project .env Snippet */}
          {service.connectionStrings?.envSnippet && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-amber-400" />
                  {CREDENTIALS_MODAL_STRINGS.envSnippetLabel}
                </label>
                <button
                  onClick={() => copyToClipboard(service.connectionStrings.envSnippet, 'env')}
                  className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 font-medium transition-colors"
                >
                  {copiedKey === 'env' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">{COMMON_STRINGS.copied}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>{CREDENTIALS_MODAL_STRINGS.copyEnvButton}</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="bg-black/70 font-mono text-xs text-emerald-300/90 p-4 rounded-2xl border border-white/[0.06] overflow-x-auto whitespace-pre select-all leading-relaxed">
                {service.connectionStrings.envSnippet}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white/[0.02] border-t border-white/[0.08] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/[0.08] hover:bg-white/[0.12] text-white rounded-lg text-xs font-medium transition-colors border border-white/[0.08]"
          >
            {COMMON_STRINGS.close}
          </button>
        </div>
      </div>
    </div>
  );
};
