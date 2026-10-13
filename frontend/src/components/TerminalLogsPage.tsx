import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  ArrowLeft,
  Check,
  ChevronDown,
  Copy,
  Layers,
  Pause,
  Play,
  RefreshCw,
  Terminal,
  Trash2,
} from 'lucide-react';

import { InstalledServiceInstance } from '../types';
import { TERMINAL_PAGE_STRINGS } from '../constants/strings';

interface TerminalLogsPageProps {
  services: InstalledServiceInstance[];
  initialServiceId: string | null;
  onBack: () => void;
}

const POLL_INTERVAL_MS = 1500;

/**
 * Docker's non-TTY log API can return multiplexed stdout/stderr frames.
 * Each frame has an 8-byte header followed by its payload. If the response
 * is not a valid framed stream, treat it as ordinary UTF-8 text.
 *
 * This avoids displaying the invisible frame header's length byte as stray
 * characters at the beginning of log lines.
 */
function decodeContainerLogResponse(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const decoder = new TextDecoder('utf-8');

  if (bytes.length === 0) return '';

  const chunks: Uint8Array[] = [];
  let offset = 0;
  let totalPayloadLength = 0;
  let frameCount = 0;
  let validFramedStream = true;

  while (offset < bytes.length) {
    if (bytes.length - offset < 8) {
      validFramedStream = false;
      break;
    }

    const streamType = bytes[offset];
    const hasExpectedHeader =
      (streamType === 1 || streamType === 2) &&
      bytes[offset + 1] === 0 &&
      bytes[offset + 2] === 0 &&
      bytes[offset + 3] === 0;

    if (!hasExpectedHeader) {
      validFramedStream = false;
      break;
    }

    const payloadLength =
      bytes[offset + 4] * 0x1000000 +
      bytes[offset + 5] * 0x10000 +
      bytes[offset + 6] * 0x100 +
      bytes[offset + 7];

    const payloadStart = offset + 8;
    const payloadEnd = payloadStart + payloadLength;

    if (payloadEnd > bytes.length) {
      validFramedStream = false;
      break;
    }

    const payload = bytes.subarray(payloadStart, payloadEnd);
    chunks.push(payload);
    totalPayloadLength += payload.length;
    frameCount += 1;
    offset = payloadEnd;
  }

  if (validFramedStream && frameCount > 0 && offset === bytes.length) {
    const merged = new Uint8Array(totalPayloadLength);
    let destinationOffset = 0;

    for (const chunk of chunks) {
      merged.set(chunk, destinationOffset);
      destinationOffset += chunk.length;
    }

    return decoder.decode(merged);
  }

  return decoder.decode(bytes);
}

function getStatusTone(status: string | undefined): 'healthy' | 'unhealthy' | 'unknown' {
  const normalized = (status ?? '').toLowerCase();

  if (['running', 'active', 'ready', 'healthy'].some((value) => normalized.includes(value))) {
    return 'healthy';
  }

  if (['stopped', 'exited', 'failed', 'error', 'unhealthy'].some((value) => normalized.includes(value))) {
    return 'unhealthy';
  }

  return 'unknown';
}

export const TerminalLogsPage: React.FC<TerminalLogsPageProps> = ({
  services,
  initialServiceId,
  onBack,
}) => {
  const runningService = services.find((service) => service.status === 'RUNNING');
  const preferredService = initialServiceId
    ? services.find((service) => service.id === initialServiceId)
    : undefined;
  const defaultServiceId = preferredService?.id ?? runningService?.id ?? services[0]?.id ?? '';

  const [selectedServiceId, setSelectedServiceId] = useState<string>(defaultServiceId);
  const [logs, setLogs] = useState('');
  const [clearBaseline, setClearBaseline] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [copied, setCopied] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const copyResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentService = services.find((service) => service.id === selectedServiceId);
  const statusTone = getStatusTone(currentService?.status);

  // Keep the selected service valid if the list is refreshed or a service is removed.
  useEffect(() => {
    if (selectedServiceId && services.some((service) => service.id === selectedServiceId)) return;

    const nextService = services.find((service) => service.status === 'RUNNING') ?? services[0];
    setSelectedServiceId(nextService?.id ?? '');
  }, [services, selectedServiceId]);

  // Poll sequentially rather than setInterval, preventing overlapping requests
  // when a log request takes longer than the polling interval.
  useEffect(() => {
    if (!selectedServiceId) {
      setLogs('');
      setClearBaseline(null);
      setIsLoading(false);
      setFetchError(null);
      return;
    }

    // Pausing cancels the current request and stops future polling immediately.
    if (isPaused) {
      setIsLoading(false);
      return;
    }

    let disposed = false;
    let nextPollTimer: ReturnType<typeof setTimeout> | undefined;
    let controller: AbortController | undefined;

    const poll = async (showLoader: boolean) => {
      controller = new AbortController();
      if (showLoader) setIsLoading(true);

      try {
        const response = await fetch(
          `/api/services/${encodeURIComponent(selectedServiceId)}/logs`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          throw new Error(`Log request failed (${response.status})`);
        }

        const text = decodeContainerLogResponse(await response.arrayBuffer());
        if (disposed) return;

        setLogs(text);
        setFetchError(null);
      } catch (error) {
        if (disposed || (error instanceof DOMException && error.name === 'AbortError')) return;

        console.error('Failed to retrieve logs for service:', selectedServiceId, error);
        setFetchError(error instanceof Error ? error.message : 'Unable to retrieve container logs.');
      } finally {
        if (!disposed) setIsLoading(false);
      }

      if (!disposed) {
        nextPollTimer = setTimeout(() => void poll(false), POLL_INTERVAL_MS);
      }
    };

    void poll(true);

    return () => {
      disposed = true;
      controller?.abort();
      if (nextPollTimer) clearTimeout(nextPollTimer);
    };
  }, [selectedServiceId, isPaused, refreshToken]);

  // Scroll only the log viewport. scrollIntoView() can unexpectedly move the whole page.
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container && autoScroll) {
      container.scrollTop = container.scrollHeight;
    }
  }, [logs, clearBaseline, autoScroll]);

  useEffect(() => {
    return () => {
      if (copyResetTimerRef.current) clearTimeout(copyResetTimerRef.current);
    };
  }, []);

  const visibleLogs = useMemo(() => {
    if (clearBaseline === null) return logs;

    // Hide the output that existed when Clear Screen was clicked, while still
    // allowing newly appended log output to appear on the next poll.
    if (logs.startsWith(clearBaseline)) {
      return logs.slice(clearBaseline.length).replace(/^\r?\n/, '');
    }

    // If the container restarted or log rotation replaced the old content,
    // show the new output instead of leaving the terminal permanently empty.
    return logs;
  }, [logs, clearBaseline]);

  const logLines = useMemo(() => {
    if (!visibleLogs) return [];

    const lines = visibleLogs.replace(/\r\n/g, '\n').split('\n');
    // A trailing newline terminates the final line; it should not render as
    // an extra blank row or inflate the line count. Preserve blank lines inside logs.
    while (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();
    return lines;
  }, [visibleLogs]);

  const handleServiceChange = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    setLogs('');
    setClearBaseline(null);
    setFetchError(null);
    setCopyError(null);
    setIsLoading(Boolean(serviceId) && !isPaused);
    setAutoScroll(true);
  };

  const handleClear = () => {
    if (!logs) return;
    setClearBaseline(logs);
    setCopied(false);
  };

  const handleCopy = async () => {
    if (!visibleLogs.trim()) return;

    try {
      await navigator.clipboard.writeText(visibleLogs);
      setCopied(true);
      setCopyError(null);
      if (copyResetTimerRef.current) clearTimeout(copyResetTimerRef.current);
      copyResetTimerRef.current = setTimeout(() => setCopied(false), 1800);
    } catch (error) {
      console.error('Unable to copy terminal logs:', error);
      setCopyError('Clipboard access was unavailable. Check your browser permissions.');
    }
  };

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const nearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 32;
    setAutoScroll((current) => (current === nearBottom ? current : nearBottom));
  };

  const liveTone = fetchError
    ? 'border-rose-400/25 bg-rose-400/[0.07] text-rose-300'
    : isPaused
      ? 'border-amber-400/25 bg-amber-400/[0.07] text-amber-200'
      : 'border-emerald-400/25 bg-emerald-400/[0.07] text-emerald-300';

  return (
    <main className="min-w-0 space-y-4 pb-8 text-slate-200 animate-in fade-in duration-200">
      {/* Page heading and actions */}
      <section className="rounded-2xl border border-white/[0.08] bg-[#090d16] p-4 shadow-lg sm:p-5">
        <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
          <div className="flex min-w-0 items-start gap-3 sm:items-center">
            <button
              type="button"
              onClick={onBack}
              aria-label={TERMINAL_PAGE_STRINGS.backToServices}
              className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.04] px-3 text-xs font-semibold text-slate-300 transition-colors hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">{TERMINAL_PAGE_STRINGS.backToServices}</span>
            </button>

            <div className="hidden h-9 w-px shrink-0 bg-white/[0.09] sm:block" aria-hidden="true" />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-sky-400/20 bg-sky-400/[0.08] text-sky-300">
                  <Terminal className="h-4 w-4" aria-hidden="true" />
                </div>
                <h1 className="min-w-0 text-base font-semibold tracking-tight text-white sm:text-lg">
                  {TERMINAL_PAGE_STRINGS.title}
                </h1>
                <span
                  role="status"
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-wide ${liveTone}`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                  {fetchError
                    ? 'STREAM ERROR'
                    : isPaused
                      ? TERMINAL_PAGE_STRINGS.pausedBadge
                      : TERMINAL_PAGE_STRINGS.liveBadge}
                </span>
              </div>
              {/* <p className="mt-1.5 text-xs leading-relaxed text-slate-400 sm:ml-12">
                {TERMINAL_PAGE_STRINGS.subtitle}
              </p> */}
              {copyError && (
                <p role="status" className="mt-2 text-[11px] text-rose-300 sm:ml-12">
                  {copyError}
                </p>
              )}
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center xl:flex-nowrap xl:justify-end">
            <div className="relative min-w-0 flex-1 sm:w-64 sm:flex-none xl:w-[260px]">
              <label htmlFor="terminal-service-select" className="sr-only">
                Select service
              </label>
              <select
                id="terminal-service-select"
                value={selectedServiceId}
                onChange={(event) => handleServiceChange(event.target.value)}
                disabled={services.length === 0}
                className="h-10 w-full min-w-0 appearance-none rounded-xl border border-white/[0.1] bg-[#050810] py-2 pl-3 pr-9 text-xs text-slate-200 outline-none transition-colors hover:border-white/[0.16] focus-visible:border-sky-400/60 focus-visible:ring-2 focus-visible:ring-sky-400/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {services.length === 0 ? (
                  <option value="">No services available</option>
                ) : (
                  services.map((service) => (
                    <option key={service.id} value={service.id} className="bg-[#090d16] text-slate-200">
                      {service.name} · :{service.enginePort} · {service.status}
                    </option>
                  ))
                )}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
            </div>

            <button
              type="button"
              onClick={() => setIsPaused((paused) => !paused)}
              aria-pressed={isPaused}
              className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 ${isPaused
                ? 'border-emerald-400/25 bg-emerald-400/[0.08] text-emerald-200 hover:bg-emerald-400/[0.14]'
                : 'border-amber-400/25 bg-amber-400/[0.07] text-amber-200 hover:bg-amber-400/[0.12]'
                }`}
            >
              {isPaused ? (
                <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
              ) : (
                <Pause className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              <span>{isPaused ? TERMINAL_PAGE_STRINGS.resumeStream : TERMINAL_PAGE_STRINGS.pauseStream}</span>
            </button>

            <button
              type="button"
              onClick={handleClear}
              disabled={!visibleLogs}
              title={TERMINAL_PAGE_STRINGS.clearTerminal}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.04] px-3 text-xs font-medium text-slate-300 transition-colors hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{TERMINAL_PAGE_STRINGS.clearTerminal}</span>
            </button>

            <button
              type="button"
              onClick={handleCopy}
              disabled={!visibleLogs.trim()}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-sky-400/25 bg-sky-400/[0.09] px-3 text-xs font-medium text-sky-200 transition-colors hover:bg-sky-400/[0.15] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-300" aria-hidden="true" />
              ) : (
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              <span>{copied ? TERMINAL_PAGE_STRINGS.copiedLogs : TERMINAL_PAGE_STRINGS.copyLogs}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Terminal panel */}
      <section
        aria-label="Service log terminal"
        className="flex h-[calc(100vh-15rem)] min-h-[420px] max-h-[820px] min-w-0 flex-col overflow-hidden rounded-2xl border border-white/[0.09] bg-[#03060f] shadow-2xl"
      >
        {/* Terminal title bar */}
        <div className="flex flex-col gap-3 border-b border-white/[0.07] bg-[#080d19] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex shrink-0 items-center gap-1.5" aria-hidden="true">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-400/90" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-300/90" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/90" />
            </div>
            <div className="min-w-0 border-l border-white/[0.1] pl-3">
              <p className="truncate font-mono text-[11px] text-slate-300" title={currentService?.name ?? 'Terminal'}>
                {currentService?.name ?? 'No service selected'}
                {currentService?.engineContainerId ? ` (${currentService.engineContainerId.slice(0, 12)})` : ''}
              </p>
              {/* <p className="truncate font-mono text-[10px] text-slate-500">
                {currentService?.engineContainerId ? 'Container ID' : 'Container runtime'}
              </p> */}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <button
              type="button"
              onClick={() => setAutoScroll((enabled) => !enabled)}
              aria-pressed={autoScroll}
              className={`inline-flex min-h-8 items-center gap-2 rounded-lg border px-2.5 py-1.5 font-mono text-[10px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 ${autoScroll
                ? 'border-sky-400/25 bg-sky-400/[0.08] text-sky-200'
                : 'border-white/[0.09] bg-white/[0.03] text-slate-400 hover:text-slate-200'
                }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${autoScroll ? 'bg-sky-300' : 'bg-slate-500'}`} aria-hidden="true" />
              Auto-scroll {autoScroll ? 'On' : 'Off'}
            </button>
            <span className="inline-flex min-h-8 items-center rounded-lg border border-white/[0.07] bg-black/20 px-2.5 py-1.5 font-mono text-[10px] text-slate-400">
              {TERMINAL_PAGE_STRINGS.linesCount(logLines.length)}
            </span>
            <button
              type="button"
              onClick={() => setRefreshToken((token) => token + 1)}
              disabled={!selectedServiceId || isPaused}
              title="Refresh logs now"
              aria-label="Refresh logs now"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-slate-400 transition-colors hover:bg-white/[0.07] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Log output */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          role="log"
          aria-label="Container log output"
          aria-live="off"
          className="min-h-0 flex-1 overflow-auto overscroll-contain bg-[#03060f] p-3 font-mono text-[11px] leading-5 text-slate-300 sm:p-4 sm:text-xs"
        >
          {isLoading && !visibleLogs ? (
            <div role="status" className="flex h-full min-h-56 flex-col items-center justify-center gap-3 text-center text-slate-400">
              <RefreshCw className="h-5 w-5 animate-spin text-sky-400" aria-hidden="true" />
              <span className="text-xs">{TERMINAL_PAGE_STRINGS.connecting}</span>
            </div>
          ) : fetchError && !visibleLogs ? (
            <div className="flex h-full min-h-56 flex-col items-center justify-center gap-3 px-4 text-center">
              <div className="rounded-xl border border-rose-400/20 bg-rose-400/[0.07] px-4 py-3">
                <p className="text-xs font-medium text-rose-300">Unable to load container logs</p>
                <p className="mt-1 text-[11px] text-slate-400">{fetchError}</p>
                <button
                  type="button"
                  onClick={() => setRefreshToken((token) => token + 1)}
                  disabled={isPaused}
                  className="mt-3 inline-flex items-center gap-2 rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 py-1.5 text-xs text-slate-200 hover:bg-white/[0.08] disabled:opacity-40"
                >
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                  Try again
                </button>
              </div>
            </div>
          ) : logLines.length === 0 || (logLines.length === 1 && !logLines[0].trim()) ? (
            <div className="flex h-full min-h-56 flex-col items-center justify-center gap-3 px-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.03] text-slate-500">
                <Terminal className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-300">
                  {currentService ? TERMINAL_PAGE_STRINGS.noLogsRecorded : 'Select a service to view its logs'}
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                  {isPaused
                    ? 'The stream is paused. Resume it to fetch new output.'
                    : currentService
                      ? `Engine port :${currentService.enginePort}`
                      : 'Choose a service from the selector above.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="min-w-0 space-y-0.5">
              {logLines.map((line, index) => {
                const normalizedLine = line.toLowerCase();
                const isError = /\b(error|fatal|failed|failure|panic)\b/.test(normalizedLine);
                const isWarning = /\b(warn|warning|caution)\b/.test(normalizedLine);
                const isNotice = /\b(ready|started|listening|success|healthy)\b/.test(normalizedLine);
                const lineColor = isError
                  ? 'text-rose-300'
                  : isWarning
                    ? 'text-amber-200'
                    : isNotice
                      ? 'text-emerald-300'
                      : 'text-slate-300';

                return (
                  <div
                    key={`${index}-${line.slice(0, 24)}`}
                    className={`group grid min-w-0 grid-cols-[2rem_minmax(0,1fr)] gap-3 rounded-md px-1.5 py-0.5 ${lineColor} hover:bg-white/[0.025]`}
                  >
                    <span className="select-none text-right text-[10px] tabular-nums text-slate-600" aria-hidden="true">
                      {index + 1}
                    </span>
                    <span className="min-w-0 whitespace-pre-wrap [overflow-wrap:anywhere]">{line || ' '}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer telemetry */}
        <footer className="flex flex-col gap-2 border-t border-white/[0.07] bg-[#080d19] px-4 py-3 text-[10px] sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-x-4 sm:gap-y-2 sm:text-[11px]">
          <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
            <span className="inline-flex items-center gap-1.5 text-slate-300">
              <Activity className="h-3.5 w-3.5 shrink-0 text-sky-400" aria-hidden="true" />
              <span>Engine :{currentService?.enginePort ?? '—'}</span>
            </span>
            {currentService?.uiPort != null && (
              <span className="text-slate-400">Console :{currentService.uiPort}</span>
            )}
            <span className="inline-flex items-center gap-1.5 text-slate-400">
              <Layers className="h-3.5 w-3.5 shrink-0 text-slate-500" aria-hidden="true" />
              <span>Network: portgrid-net</span>
            </span>
          </div>

          <span
            className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 font-medium ${statusTone === 'healthy'
              ? 'border-emerald-400/20 bg-emerald-400/[0.07] text-emerald-300'
              : statusTone === 'unhealthy'
                ? 'border-rose-400/20 bg-rose-400/[0.07] text-rose-300'
                : 'border-white/[0.09] bg-white/[0.03] text-slate-400'
              }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
            Service: {currentService?.status ?? 'Unknown'}
          </span>
        </footer>
      </section>
    </main>
  );
};
