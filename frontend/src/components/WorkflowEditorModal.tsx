import React, { useState, useEffect } from 'react';
import {
  X,
  Code2,
  Sliders,
  Sparkles,
  Save,
  AlertCircle,
  FileCode,
  Copy,
  Check,
  Plus,
  Trash2,
} from 'lucide-react';
import { ServiceBlueprint } from '../types';
import { WORKFLOW_MODAL_STRINGS, COMMON_STRINGS } from '../constants/strings';

interface WorkflowEditorModalProps {
  isOpen: boolean;
  editingBlueprint: ServiceBlueprint | null;
  onClose: () => void;
  onSave: (blueprint: ServiceBlueprint, isEdit: boolean) => Promise<void>;
}

const TEMPLATES: Record<string, Partial<ServiceBlueprint>> = {
  mongodb: {
    id: 'mongodb',
    name: 'MongoDB 7 & Mongo Express',
    category: 'Database',
    icon: 'Database',
    description: 'Document database paired with Mongo Express web administration console.',
    engine: {
      namePrefix: 'portgrid-mongo',
      image: 'mongo:7-alpine',
      defaultPort: 27017,
      internalPort: 27017,
      env: {
        MONGO_INITDB_ROOT_USERNAME: 'admin',
        MONGO_INITDB_ROOT_PASSWORD: '{{GENERATED_PASSWORD}}',
      },
      volumes: [{ name: 'portgrid_mongo_data', mountPath: '/data/db' }],
    },
    companionUi: {
      name: 'Mongo Express',
      namePrefix: 'portgrid-mongo-ui',
      image: 'mongo-express:latest',
      defaultPort: 8081,
      internalPort: 8081,
      env: {
        ME_CONFIG_MONGODB_ADMINUSERNAME: 'admin',
        ME_CONFIG_MONGODB_ADMINPASSWORD: '{{GENERATED_PASSWORD}}',
        ME_CONFIG_MONGODB_SERVER: '{{ENGINE_HOST}}',
      },
    },
    connectionFormatters: {
      uri: 'mongodb://admin:{{GENERATED_PASSWORD}}@localhost:{{ENGINE_PORT}}/?authSource=admin',
      envSnippet: `MONGO_HOST=localhost\nMONGO_PORT={{ENGINE_PORT}}\nMONGO_USER=admin\nMONGO_PASS={{GENERATED_PASSWORD}}\nMONGO_URL=mongodb://admin:{{GENERATED_PASSWORD}}@localhost:{{ENGINE_PORT}}/?authSource=admin`,
    },
  },
  clickhouse: {
    id: 'clickhouse',
    name: 'ClickHouse OLAP Database',
    category: 'Analytics',
    icon: 'Database',
    description: 'Ultra-fast column-oriented database management system for real-time analytics.',
    engine: {
      namePrefix: 'portgrid-clickhouse',
      image: 'clickhouse/clickhouse-server:24.3-alpine',
      defaultPort: 8123,
      internalPort: 8123,
      env: {
        CLICKHOUSE_USER: 'default',
        CLICKHOUSE_PASSWORD: '{{GENERATED_PASSWORD}}',
      },
      volumes: [{ name: 'portgrid_clickhouse_data', mountPath: '/var/lib/clickhouse' }],
    },
    connectionFormatters: {
      uri: 'http://default:{{GENERATED_PASSWORD}}@localhost:{{ENGINE_PORT}}',
      envSnippet: `CLICKHOUSE_HOST=localhost\nCLICKHOUSE_PORT={{ENGINE_PORT}}\nCLICKHOUSE_USER=default\nCLICKHOUSE_PASSWORD={{GENERATED_PASSWORD}}`,
    },
  },
  meilisearch: {
    id: 'meilisearch',
    name: 'Meilisearch & Instant Search',
    category: 'Search',
    icon: 'Zap',
    description: 'Lightning-fast, hyper-relevant search engine for modern apps.',
    engine: {
      namePrefix: 'portgrid-meili',
      image: 'getmeili/meilisearch:v1.7',
      defaultPort: 7700,
      internalPort: 7700,
      env: {
        MEILI_MASTER_KEY: '{{GENERATED_PASSWORD}}',
        MEILI_ENV: 'development',
      },
      volumes: [{ name: 'portgrid_meili_data', mountPath: '/meili_data' }],
    },
    companionUi: {
      name: 'Meilisearch Web Preview',
      namePrefix: 'portgrid-meili-ui',
      image: '',
      defaultPort: 7700,
      internalPort: 7700,
      env: {},
    },
    connectionFormatters: {
      uri: 'http://localhost:{{ENGINE_PORT}}',
      envSnippet: `MEILISEARCH_HOST=http://localhost:{{ENGINE_PORT}}\nMEILISEARCH_API_KEY={{GENERATED_PASSWORD}}`,
    },
  },
};

export const WorkflowEditorModal: React.FC<WorkflowEditorModalProps> = ({
  isOpen,
  editingBlueprint,
  onClose,
  onSave,
}) => {
  const [editorMode, setEditorMode] = useState<'form' | 'json'>('form');
  const [jsonText, setJsonText] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<any>('Database');
  const [icon, setIcon] = useState('Database');
  const [description, setDescription] = useState('');

  // Engine state
  const [engineImage, setEngineImage] = useState('');
  const [enginePort, setEnginePort] = useState('8080');
  const [engineNamePrefix, setEngineNamePrefix] = useState('portgrid-app');
  const [engineEnvKeys, setEngineEnvKeys] = useState<{ key: string; value: string }[]>([
    { key: 'APP_ENV', value: 'development' },
  ]);
  const [engineVolumeMount, setEngineVolumeMount] = useState('/data');

  // Companion UI state
  const [hasUi, setHasUi] = useState(false);
  const [uiName, setUiName] = useState('');
  const [uiImage, setUiImage] = useState('');
  const [uiPort, setUiPort] = useState('8081');

  // Connection Formatters
  const [uriFormatter, setUriFormatter] = useState('');
  const [envSnippetFormatter, setEnvSnippetFormatter] = useState('');

  useEffect(() => {
    if (editingBlueprint) {
      populateFromBlueprint(editingBlueprint);
    } else {
      // Default initial state
      populateFromBlueprint(TEMPLATES.mongodb as ServiceBlueprint);
    }
  }, [editingBlueprint, isOpen]);

  const populateFromBlueprint = (bp: ServiceBlueprint) => {
    setId(bp.id || '');
    setName(bp.name || '');
    setCategory(bp.category || 'Database');
    setIcon(bp.icon || 'Database');
    setDescription(bp.description || '');

    setEngineImage(bp.engine?.image || '');
    setEnginePort(String(bp.engine?.defaultPort || 8080));
    setEngineNamePrefix(bp.engine?.namePrefix || 'portgrid-app');
    const envs = bp.engine?.env
      ? Object.entries(bp.engine.env).map(([k, v]) => ({ key: k, value: v }))
      : [];
    setEngineEnvKeys(envs.length > 0 ? envs : [{ key: 'APP_ENV', value: 'development' }]);
    setEngineVolumeMount(bp.engine?.volumes?.[0]?.mountPath || '');

    if (bp.companionUi && (bp.companionUi.image || bp.companionUi.defaultPort)) {
      setHasUi(true);
      setUiName(bp.companionUi.name || '');
      setUiImage(bp.companionUi.image || '');
      setUiPort(String(bp.companionUi.defaultPort || 8081));
    } else {
      setHasUi(false);
      setUiName('');
      setUiImage('');
      setUiPort('8081');
    }

    setUriFormatter(bp.connectionFormatters?.uri || '');
    setEnvSnippetFormatter(bp.connectionFormatters?.envSnippet || '');

    setJsonText(JSON.stringify(bp, null, 2));
    setErrorMsg(null);
  };

  const handleTemplateSelect = (templateKey: string) => {
    const tmpl = TEMPLATES[templateKey];
    if (tmpl) {
      populateFromBlueprint(tmpl as ServiceBlueprint);
    }
  };

  if (!isOpen) return null;

  const constructBlueprintObject = (): ServiceBlueprint => {
    if (editorMode === 'json') {
      try {
        const parsed = JSON.parse(jsonText);
        return parsed;
      } catch (err: any) {
        throw new Error(`${WORKFLOW_MODAL_STRINGS.errInvalidJsonPrefix} ${err.message}`);
      }
    }

    // Build from form
    if (!id.trim()) throw new Error(WORKFLOW_MODAL_STRINGS.errIdRequired);
    if (!name.trim()) throw new Error(WORKFLOW_MODAL_STRINGS.errNameRequired);
    if (!engineImage.trim()) throw new Error(WORKFLOW_MODAL_STRINGS.errImageRequired);

    const envMap: Record<string, string> = {};
    for (const item of engineEnvKeys) {
      if (item.key.trim()) {
        envMap[item.key.trim()] = item.value;
      }
    }

    const volumes = engineVolumeMount.trim()
      ? [{ name: `portgrid_${id.toLowerCase().replace(/[^a-z0-9]/g, '_')}_data`, mountPath: engineVolumeMount.trim() }]
      : undefined;

    const bp: ServiceBlueprint = {
      id: id.trim().toLowerCase(),
      name: name.trim(),
      category,
      icon,
      description: description.trim(),
      isOfficial: false,
      engine: {
        namePrefix: engineNamePrefix.trim() || `portgrid-${id.toLowerCase()}`,
        image: engineImage.trim(),
        defaultPort: parseInt(enginePort, 10) || 8080,
        internalPort: parseInt(enginePort, 10) || 8080,
        env: envMap,
        volumes,
      },
      connectionFormatters: {
        uri: uriFormatter.trim() || undefined,
        envSnippet: envSnippetFormatter.trim() || `${id.toUpperCase()}_HOST=localhost\n${id.toUpperCase()}_PORT={{ENGINE_PORT}}`,
      },
    };

    if (hasUi && uiName.trim()) {
      bp.companionUi = {
        name: uiName.trim(),
        namePrefix: `portgrid-${id.toLowerCase()}-ui`,
        image: uiImage.trim(),
        defaultPort: parseInt(uiPort, 10) || 8081,
        internalPort: parseInt(uiPort, 10) || 8081,
        env: {},
      };
    }

    return bp;
  };

  const handleSave = async () => {
    setErrorMsg(null);
    try {
      const blueprint = constructBlueprintObject();

      // Guard check: cannot overwrite official blueprints
      const cleanId = blueprint.id.trim().toLowerCase();
      if (['postgresql', 'redis', 'kafka', 'keycloak', 'jenkins', 'rabbitmq'].includes(cleanId)) {
        throw new Error(WORKFLOW_MODAL_STRINGS.errOfficialOverwrite(cleanId));
      }

      setIsSaving(true);
      await onSave(blueprint, !!editingBlueprint);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-150">
      <div className="glass-modal w-full max-w-3xl rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center space-x-3.5">
            <div className="p-2 bg-gradient-to-tr from-sky-500 to-indigo-500 rounded-xl text-white shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white tracking-tight">
                {editingBlueprint
                  ? WORKFLOW_MODAL_STRINGS.titleEdit(editingBlueprint.name)
                  : WORKFLOW_MODAL_STRINGS.titleNew}
              </h3>
              <p className="text-xs text-slate-400 font-normal">{WORKFLOW_MODAL_STRINGS.subtitle}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Mode switch */}
            <div className="flex items-center bg-black/40 p-1 rounded-xl border border-white/[0.08] text-xs">
              <button
                onClick={() => setEditorMode('form')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                  editorMode === 'form' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                {WORKFLOW_MODAL_STRINGS.formModeTab}
              </button>
              <button
                onClick={() => {
                  try {
                    const bp = constructBlueprintObject();
                    setJsonText(JSON.stringify(bp, null, 2));
                  } catch {}
                  setEditorMode('json');
                }}
                className={`px-3 py-1 rounded-lg font-medium transition-colors flex items-center gap-1 ${
                  editorMode === 'json' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>{WORKFLOW_MODAL_STRINGS.jsonModeTab}</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.08] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-red-950/40 border border-red-500/30 rounded-xl flex items-center space-x-2 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-300 flex-1">
          {/* Preset templates selector */}
          {!editingBlueprint && (
            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800/80">
              <span className="text-slate-400">{WORKFLOW_MODAL_STRINGS.quickStartLabel}</span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleTemplateSelect('mongodb')}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs"
                >
                  MongoDB 7
                </button>
                <button
                  type="button"
                  onClick={() => handleTemplateSelect('clickhouse')}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs"
                >
                  ClickHouse
                </button>
                <button
                  type="button"
                  onClick={() => handleTemplateSelect('meilisearch')}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs"
                >
                  Meilisearch
                </button>
              </div>
            </div>
          )}

          {editorMode === 'form' ? (
            /* Visual Workflow Form */
            <div className="space-y-6">
              {/* Section 1: Basic Information */}
              <div className="space-y-3">
                <h4 className="font-bold text-white text-sm border-b border-slate-800 pb-1.5 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-sky-400" />
                  {WORKFLOW_MODAL_STRINGS.sec1Title}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">{WORKFLOW_MODAL_STRINGS.serviceIdLabel}</label>
                    <input
                      type="text"
                      disabled={!!editingBlueprint}
                      value={id}
                      onChange={(e) => setId(e.target.value)}
                      placeholder={WORKFLOW_MODAL_STRINGS.serviceIdPlaceholder}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-sky-500 font-mono disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">{WORKFLOW_MODAL_STRINGS.displayNameLabel}</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={WORKFLOW_MODAL_STRINGS.displayNamePlaceholder}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-sky-500 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">{WORKFLOW_MODAL_STRINGS.categoryLabel}</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-sky-500"
                    >
                      <option value="Database">Database</option>
                      <option value="Cache">Cache</option>
                      <option value="Message Broker">Message Broker</option>
                      <option value="Search">Search</option>
                      <option value="Analytics">Analytics</option>
                      <option value="Identity">Identity</option>
                      <option value="DevOps">DevOps</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">{WORKFLOW_MODAL_STRINGS.iconLabel}</label>
                    <select
                      value={icon}
                      onChange={(e) => setIcon(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-sky-500"
                    >
                      <option value="Database">Database</option>
                      <option value="Zap">Zap (Lightning/Cache)</option>
                      <option value="Layers">Layers (Message Broker/Queue)</option>
                      <option value="Key">Key (Auth/Identity)</option>
                      <option value="GitBranch">GitBranch (DevOps)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">{WORKFLOW_MODAL_STRINGS.descriptionLabel}</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={WORKFLOW_MODAL_STRINGS.descriptionPlaceholder}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Section 2: Engine Container Specification */}
              <div className="space-y-3">
                <h4 className="font-bold text-white text-sm border-b border-slate-800 pb-1.5 flex items-center gap-1.5">
                  <FileCode className="w-4 h-4 text-emerald-400" />
                  {WORKFLOW_MODAL_STRINGS.sec2Title}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-slate-400 mb-1 font-semibold">{WORKFLOW_MODAL_STRINGS.dockerImageLabel}</label>
                    <input
                      type="text"
                      value={engineImage}
                      onChange={(e) => setEngineImage(e.target.value)}
                      placeholder={WORKFLOW_MODAL_STRINGS.dockerImagePlaceholder}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono placeholder-slate-600 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">{WORKFLOW_MODAL_STRINGS.defaultPortLabel}</label>
                    <input
                      type="number"
                      value={enginePort}
                      onChange={(e) => setEnginePort(e.target.value)}
                      placeholder={WORKFLOW_MODAL_STRINGS.defaultPortPlaceholder}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono placeholder-slate-600 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">{WORKFLOW_MODAL_STRINGS.volumeMountLabel}</label>
                  <input
                    type="text"
                    value={engineVolumeMount}
                    onChange={(e) => setEngineVolumeMount(e.target.value)}
                    placeholder={WORKFLOW_MODAL_STRINGS.volumeMountPlaceholder}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono placeholder-slate-600 focus:outline-none focus:border-sky-500"
                  />
                </div>

                {/* Env Keys */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-slate-400 font-semibold">{WORKFLOW_MODAL_STRINGS.envVarsLabel}</label>
                    <button
                      type="button"
                      onClick={() => setEngineEnvKeys([...engineEnvKeys, { key: '', value: '' }])}
                      className="text-sky-400 hover:text-sky-300 flex items-center gap-1 text-[11px]"
                    >
                      <Plus className="w-3.5 h-3.5" /> {WORKFLOW_MODAL_STRINGS.addVariableButton}
                    </button>
                  </div>
                  <div className="space-y-2">
                    {engineEnvKeys.map((item, idx) => (
                      <div key={idx} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={item.key}
                          onChange={(e) => {
                            const copy = [...engineEnvKeys];
                            copy[idx].key = e.target.value;
                            setEngineEnvKeys(copy);
                          }}
                          placeholder={WORKFLOW_MODAL_STRINGS.keyPlaceholder}
                          className="w-1/3 bg-slate-950 border border-slate-800 rounded-xl p-2 text-white font-mono placeholder-slate-600 focus:outline-none focus:border-sky-500"
                        />
                        <input
                          type="text"
                          value={item.value}
                          onChange={(e) => {
                            const copy = [...engineEnvKeys];
                            copy[idx].value = e.target.value;
                            setEngineEnvKeys(copy);
                          }}
                          placeholder={WORKFLOW_MODAL_STRINGS.valuePlaceholder}
                          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-2 text-white font-mono placeholder-slate-600 focus:outline-none focus:border-sky-500"
                        />
                        <button
                          type="button"
                          onClick={() => setEngineEnvKeys(engineEnvKeys.filter((_, i) => i !== idx))}
                          className="p-2 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Section 3: Companion Web UI */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    {WORKFLOW_MODAL_STRINGS.sec3Title}
                  </h4>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasUi}
                      onChange={(e) => setHasUi(e.target.checked)}
                      className="rounded bg-slate-950 border-slate-800 text-sky-500"
                    />
                    <span className="text-slate-300 font-semibold">{WORKFLOW_MODAL_STRINGS.enableWebUiLabel}</span>
                  </label>
                </div>

                {hasUi && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">{WORKFLOW_MODAL_STRINGS.uiConsoleNameLabel}</label>
                      <input
                        type="text"
                        value={uiName}
                        onChange={(e) => setUiName(e.target.value)}
                        placeholder={WORKFLOW_MODAL_STRINGS.uiConsoleNamePlaceholder}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">{WORKFLOW_MODAL_STRINGS.uiDockerImageLabel}</label>
                      <input
                        type="text"
                        value={uiImage}
                        onChange={(e) => setUiImage(e.target.value)}
                        placeholder={WORKFLOW_MODAL_STRINGS.uiDockerImagePlaceholder}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono placeholder-slate-600 focus:outline-none focus:border-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">{WORKFLOW_MODAL_STRINGS.uiPortLabel}</label>
                      <input
                        type="number"
                        value={uiPort}
                        onChange={(e) => setUiPort(e.target.value)}
                        placeholder={WORKFLOW_MODAL_STRINGS.uiPortPlaceholder}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono placeholder-slate-600 focus:outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Section 4: Connection & .env Templates */}
              <div className="space-y-3">
                <h4 className="font-bold text-white text-sm border-b border-slate-800 pb-1.5 flex items-center gap-1.5">
                  <Code2 className="w-4 h-4 text-amber-400" />
                  {WORKFLOW_MODAL_STRINGS.sec4Title}
                </h4>
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                  <span>{WORKFLOW_MODAL_STRINGS.interpolationTagsLabel}</span>
                  <code className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-sky-400">
                    {'{{GENERATED_PASSWORD}}'}
                  </code>
                  <code className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-emerald-400">
                    {'{{ENGINE_PORT}}'}
                  </code>
                  <code className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-purple-400">
                    {'{{ENGINE_HOST}}'}
                  </code>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">{WORKFLOW_MODAL_STRINGS.connUriLabel}</label>
                  <input
                    type="text"
                    value={uriFormatter}
                    onChange={(e) => setUriFormatter(e.target.value)}
                    placeholder={WORKFLOW_MODAL_STRINGS.connUriPlaceholder}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono placeholder-slate-600 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">{WORKFLOW_MODAL_STRINGS.envSnippetLabel}</label>
                  <textarea
                    rows={3}
                    value={envSnippetFormatter}
                    onChange={(e) => setEnvSnippetFormatter(e.target.value)}
                    placeholder={WORKFLOW_MODAL_STRINGS.envSnippetPlaceholder}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono placeholder-slate-600 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* JSON View & Direct Schema Editor */
            <div className="space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span>{WORKFLOW_MODAL_STRINGS.directJsonLabel}</span>
                <button
                  type="button"
                  onClick={() => {
                    try {
                      setJsonText(JSON.stringify(JSON.parse(jsonText), null, 2));
                    } catch {}
                  }}
                  className="text-sky-400 hover:text-sky-300 text-[11px]"
                >
                  {WORKFLOW_MODAL_STRINGS.formatJsonButton}
                </button>
              </div>
              <textarea
                rows={18}
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-emerald-400 font-mono text-xs focus:outline-none focus:border-sky-500 leading-relaxed"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-colors"
          >
            {COMMON_STRINGS.cancel}
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all shadow-lg shadow-sky-500/20 active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>
              {isSaving
                ? WORKFLOW_MODAL_STRINGS.savingButton
                : editingBlueprint
                ? WORKFLOW_MODAL_STRINGS.saveChangesButton
                : WORKFLOW_MODAL_STRINGS.onboardServiceButton}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
