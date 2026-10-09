import React, { useEffect, useState } from 'react';
import { Navbar } from './components/Navbar';
import { CatalogCard } from './components/CatalogCard';
import { ServiceCard } from './components/ServiceCard';
import { CredentialsModal } from './components/CredentialsModal';
import { UninstallModal } from './components/UninstallModal';
import { LogsModal } from './components/LogsModal';
import { InstallModal } from './components/InstallModal';
import { WorkflowEditorModal } from './components/WorkflowEditorModal';
import { AuditModal } from './components/AuditModal';
import { HomePage } from './components/HomePage';
import { ServiceBlueprint, InstalledServiceInstance, ApprovalTicket, GovernanceSettings } from './types';
import { DASHBOARD_STRINGS, CATALOG_STRINGS } from './constants/strings';
import { Plus, Box, Sparkles, CheckCircle2, Search, Filter } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'home' | 'services' | 'catalog'>('home');
  const [blueprints, setBlueprints] = useState<ServiceBlueprint[]>([]);
  const [services, setServices] = useState<InstalledServiceInstance[]>([]);
  const [installingId, setInstallingId] = useState<string | null>(null);

  // Search & Filter state for catalog
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogCategory, setCatalogCategory] = useState<string>('All');

  // Governance & Dual-Control State
  const [governanceSettings, setGovernanceSettings] = useState<GovernanceSettings>({
    makerCheckerEnabled: true,
    cryptoShreddingEnabled: true,
    securityProfile: 'BANK_GRADE_STRICT',
  });
  const [pendingTicketsCount, setPendingTicketsCount] = useState<number>(0);
  const [createdApprovalTicket, setCreatedApprovalTicket] = useState<ApprovalTicket | null>(null);

  // Modals state
  const [selectedBlueprintForInstall, setSelectedBlueprintForInstall] = useState<ServiceBlueprint | null>(null);
  const [isWorkflowEditorOpen, setIsWorkflowEditorOpen] = useState(false);
  const [editingCustomBlueprint, setEditingCustomBlueprint] = useState<ServiceBlueprint | null>(null);
  const [credentialsService, setCredentialsService] = useState<InstalledServiceInstance | null>(null);
  const [logsService, setLogsService] = useState<InstalledServiceInstance | null>(null);
  const [uninstallTarget, setUninstallTarget] = useState<InstalledServiceInstance | null>(null);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isUninstalling, setIsUninstalling] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchCatalog = async () => {
    try {
      const res = await fetch('/api/catalog');
      if (res.ok) {
        const data = await res.json();
        setBlueprints(data);
      }
    } catch (err) {
      console.error('Error fetching catalog:', err);
    }
  };

  const fetchServices = async () => {
    try {
      const res = await fetch('/api/services');
      if (res.ok) {
        const data = await res.json();
        setServices(data);
      }
    } catch (err) {
      console.error('Error fetching services:', err);
    }
  };

  const fetchGovernance = async () => {
    try {
      const [settingsRes, pendingRes] = await Promise.all([
        fetch('/api/governance/settings'),
        fetch('/api/governance/tickets/pending'),
      ]);
      if (settingsRes.ok) {
        const data = await settingsRes.json();
        setGovernanceSettings(data);
      }
      if (pendingRes.ok) {
        const pending = await pendingRes.json();
        setPendingTicketsCount(pending.length);
      }
    } catch (err) {
      console.error('Error fetching governance:', err);
    }
  };

  useEffect(() => {
    fetchCatalog();
    fetchServices();
    fetchGovernance();
    const interval = setInterval(() => {
      fetchServices();
      fetchGovernance();
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleInstall = async (options: {
    blueprintId: string;
    customName?: string;
    customEnginePort?: number;
    customUiPort?: number;
  }) => {
    setInstallingId(options.blueprintId);
    try {
      const res = await fetch('/api/services/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      });

      if (res.ok) {
        const newInstance = await res.json();
        setSelectedBlueprintForInstall(null);
        await fetchServices();
        showToast(DASHBOARD_STRINGS.toastDeployed(newInstance.name));
        setActiveTab('services');
        setCredentialsService(newInstance);
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(`${DASHBOARD_STRINGS.failedToInstallPrefix} ${errData.message || res.statusText}`);
      }
    } catch (err: any) {
      alert(`${DASHBOARD_STRINGS.installErrorPrefix} ${err.message}`);
    } finally {
      setInstallingId(null);
    }
  };

  const handleSaveCustomBlueprint = async (blueprint: ServiceBlueprint, isEdit: boolean) => {
    const url = isEdit ? `/api/catalog/custom/${blueprint.id}` : '/api/catalog/custom';
    const method = isEdit ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(blueprint),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || DASHBOARD_STRINGS.failedToSaveBlueprint);
    }

    await fetchCatalog();
    showToast(DASHBOARD_STRINGS.toastOnboarded(blueprint.name));
  };

  const handleDeleteCustomBlueprint = async (blueprintId: string) => {
    if (!confirm(DASHBOARD_STRINGS.confirmRemoveBlueprint)) {
      return;
    }

    try {
      const res = await fetch(`/api/catalog/custom/${blueprintId}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchCatalog();
        showToast(DASHBOARD_STRINGS.toastBlueprintRemoved);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(`${DASHBOARD_STRINGS.deleteFailedPrefix} ${err.message}`);
      }
    } catch (err: any) {
      alert(`${DASHBOARD_STRINGS.deleteErrorPrefix} ${err.message}`);
    }
  };

  const handleUninstall = async (serviceId: string, removeVolumes: boolean) => {
    setIsUninstalling(true);
    const startTime = Date.now();
    try {
      const res = await fetch(`/api/services/${serviceId}?removeVolumes=${removeVolumes}`, {
        method: 'DELETE',
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        if (data.requiresApproval && data.ticket) {
          // Maker-Checker ticket generated per Four-Eyes Principle
          setCreatedApprovalTicket(data.ticket);
          await fetchGovernance();
          showToast(DASHBOARD_STRINGS.toastDualAuthSubmitted(data.ticket.id));
        } else {
          // Direct execution with visual delay
          const elapsed = Date.now() - startTime;
          const remainingDelay = Math.max(0, 3000 - elapsed);
          if (remainingDelay > 0) {
            await new Promise((resolve) => setTimeout(resolve, remainingDelay));
          }

          setUninstallTarget(null);
          setCreatedApprovalTicket(null);
          await fetchServices();
          await fetchGovernance();
          showToast(DASHBOARD_STRINGS.toastSanitized);
        }
      } else {
        alert(`${DASHBOARD_STRINGS.uninstallErrorPrefix} ${data.message || res.statusText}`);
      }
    } catch (err: any) {
      alert(`${DASHBOARD_STRINGS.uninstallErrorPrefix} ${err.message}`);
    } finally {
      setIsUninstalling(false);
    }
  };

  const handleStop = async (serviceId: string) => {
    try {
      await fetch(`/api/services/${serviceId}/stop`, { method: 'POST' });
      await fetchServices();
      showToast(DASHBOARD_STRINGS.toastStopped);
    } catch (err: any) {
      alert(`${DASHBOARD_STRINGS.stopErrorPrefix} ${err.message}`);
    }
  };

  const handleStart = async (serviceId: string) => {
    try {
      await fetch(`/api/services/${serviceId}/start`, { method: 'POST' });
      await fetchServices();
      showToast(DASHBOARD_STRINGS.toastStarted);
    } catch (err: any) {
      alert(`${DASHBOARD_STRINGS.startErrorPrefix} ${err.message}`);
    }
  };

  const runningCount = services.filter((s) => s.status === 'RUNNING').length;

  // Filter blueprints
  const filteredBlueprints = blueprints.filter((bp) => {
    const matchesSearch =
      bp.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      bp.description.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      bp.engine.image.toLowerCase().includes(catalogSearch.toLowerCase());

    const matchesCategory =
      catalogCategory === 'All'
        ? true
        : catalogCategory === 'Custom'
        ? bp.isOfficial === false
        : bp.category === catalogCategory;

    return matchesSearch && matchesCategory;
  });

  const categories = DASHBOARD_STRINGS.categories;

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col font-['Inter',sans-serif]">
      {/* Apple-style floating toast notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 glass-modal border border-white/[0.1] text-white px-4 py-3 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.8)] flex items-center space-x-2.5 text-xs font-medium animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        installedCount={services.length}
        runningCount={runningCount}
        pendingTicketsCount={pendingTicketsCount}
        onOpenAudit={() => setIsAuditModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Homepage Overview Tab */}
        {activeTab === 'home' && (
          <HomePage
            blueprints={blueprints}
            services={services}
            onNavigateServices={() => setActiveTab('services')}
            onNavigateCatalog={() => setActiveTab('catalog')}
            onOpenAudit={() => setIsAuditModalOpen(true)}
            onDeployBlueprint={(blueprintId) => {
              const bp = blueprints.find((b) => b.id === blueprintId) || null;
              if (bp) {
                setSelectedBlueprintForInstall(bp);
              } else {
                setActiveTab('catalog');
              }
            }}
          />
        )}

        {/* Active Services Tab */}
        {activeTab === 'services' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-white tracking-tight">{DASHBOARD_STRINGS.title}</h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  {DASHBOARD_STRINGS.subtitle}
                </p>
              </div>

              <button
                onClick={() => setActiveTab('catalog')}
                className="px-3.5 py-2 bg-sky-500 hover:bg-sky-400 text-white text-xs font-medium rounded-xl flex items-center space-x-2 transition-all shadow-[0_2px_12px_rgba(14,165,233,0.3)] active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{DASHBOARD_STRINGS.deployButton}</span>
              </button>
            </div>

            {services.length === 0 ? (
              <div className="glass-surface rounded-3xl p-12 text-center max-w-md mx-auto my-12 border border-white/[0.06] shadow-xl">
                <div className="w-14 h-14 bg-white/[0.04] border border-white/[0.08] rounded-2xl flex items-center justify-center mx-auto mb-4 text-sky-400 shadow-inner">
                  <Box className="w-7 h-7" />
                </div>
                <h3 className="text-sm font-semibold text-white mb-1">{DASHBOARD_STRINGS.emptyTitle}</h3>
                <p className="text-xs text-slate-400 mb-6 leading-relaxed font-normal">
                  {DASHBOARD_STRINGS.emptySubtitle}
                </p>
                <button
                  onClick={() => setActiveTab('catalog')}
                  className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white text-xs font-medium rounded-xl inline-flex items-center space-x-2 transition-colors shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{DASHBOARD_STRINGS.browseCatalogButton}</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {services.map((svc) => (
                  <ServiceCard
                    key={svc.id}
                    service={svc}
                    onOpenCredentials={setCredentialsService}
                    onOpenLogs={setLogsService}
                    onUninstall={setUninstallTarget}
                    onStop={handleStop}
                    onStart={handleStart}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Service Catalog Tab */}
        {activeTab === 'catalog' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-semibold text-white tracking-tight">{CATALOG_STRINGS.title}</h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  {CATALOG_STRINGS.subtitle}
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingCustomBlueprint(null);
                  setIsWorkflowEditorOpen(true);
                }}
                className="px-3.5 py-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-medium rounded-xl flex items-center space-x-2 transition-all shadow-[0_2px_12px_rgba(99,102,241,0.25)] active:scale-95 shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{CATALOG_STRINGS.onboardCustomButton}</span>
              </button>
            </div>

            {/* Apple / Google Style Filter Bar & Search */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-2 bg-white/[0.02] border border-white/[0.06] rounded-2xl">
              {/* Category Segmented Control */}
              <div className="flex flex-wrap items-center gap-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCatalogCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      catalogCategory === cat
                        ? 'bg-white/[0.12] text-white shadow-sm border border-white/[0.1]'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Search input */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  placeholder={CATALOG_STRINGS.searchPlaceholder}
                  className="w-full bg-black/40 border border-white/[0.06] rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500/50"
                />
              </div>
            </div>

            {/* Catalog Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredBlueprints.map((bp) => (
                <CatalogCard
                  key={bp.id}
                  blueprint={bp}
                  isInstalling={installingId === bp.id}
                  isInstalled={services.some((s) => s.blueprintId === bp.id)}
                  onSelect={setSelectedBlueprintForInstall}
                  onEdit={(customBp) => {
                    setEditingCustomBlueprint(customBp);
                    setIsWorkflowEditorOpen(true);
                  }}
                  onDelete={handleDeleteCustomBlueprint}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Modals & Dialogs */}
      <WorkflowEditorModal
        isOpen={isWorkflowEditorOpen}
        editingBlueprint={editingCustomBlueprint}
        onClose={() => {
          setIsWorkflowEditorOpen(false);
          setEditingCustomBlueprint(null);
        }}
        onSave={handleSaveCustomBlueprint}
      />

      <InstallModal
        blueprint={selectedBlueprintForInstall}
        isOpen={!!selectedBlueprintForInstall}
        isInstalling={!!installingId}
        onClose={() => setSelectedBlueprintForInstall(null)}
        onDeploy={handleInstall}
      />

      <CredentialsModal
        service={credentialsService}
        onClose={() => setCredentialsService(null)}
      />

      <LogsModal
        service={logsService}
        onClose={() => setLogsService(null)}
      />

      <UninstallModal
        service={uninstallTarget}
        isOpen={!!uninstallTarget}
        isUninstalling={isUninstalling}
        makerCheckerEnabled={governanceSettings.makerCheckerEnabled}
        createdTicket={createdApprovalTicket}
        onClose={() => {
          if (!isUninstalling) {
            setUninstallTarget(null);
            setCreatedApprovalTicket(null);
          }
        }}
        onConfirm={handleUninstall}
        onOpenGovernance={() => {
          setUninstallTarget(null);
          setCreatedApprovalTicket(null);
          setIsAuditModalOpen(true);
        }}
      />

      <AuditModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        onTicketExecuted={async () => {
          await fetchServices();
          await fetchGovernance();
        }}
      />
    </div>
  );
};
