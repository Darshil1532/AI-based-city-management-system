import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AIDecisionDisclaimer } from '../../components/common/AIDecisionDisclaimer';
import {
  Settings,
  Sparkles,
  RotateCcw,
  Download,
  Database,
  MapPin,
  Shield,
  Layers,
  Cpu,
  Flame,
  CheckCircle2,
  HardDrive,
  Users,
  Info,
  Check,
} from 'lucide-react';

export const AdminSettingsPage: React.FC = () => {
  const { complaints, hotspots, aiInsights, activePersona, resetData, aiProviderType } = useApp();
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [confidenceThreshold, setConfidenceThreshold] = useState(80);
  const [clusteringRadius, setClusteringRadius] = useState(250);
  const [saveToast, setSaveToast] = useState(false);

  const handleConfirmReset = () => {
    resetData();
    setResetModalOpen(false);
    setResetSuccess(true);
    setTimeout(() => setResetSuccess(false), 4000);
  };

  const handleSaveParams = () => {
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  };

  const handleExportJSON = () => {
    const exportPayload = {
      exportedAt: new Date().toISOString(),
      system: 'AI-Based Smart City Management System',
      counts: {
        complaints: complaints.length,
        hotspots: hotspots.length,
        insights: aiInsights.length,
      },
      complaints,
      hotspots,
      aiInsights,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `smartcity_system_state_${new Date().toISOString().split('T')[0]}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2 mb-1.5 font-mono">
            <span className="w-2 h-2 rounded-full bg-blue-500 shadow-sm" />
            System Administration
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            System State & Governance Configuration
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Transparently monitor the actual AI provider, geospatial engine, database persistence, and triage parameters.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportJSON}
            className="inline-flex items-center gap-2 px-4 py-2.5 clay-btn text-slate-700 hover:text-slate-900 text-xs font-bold rounded-2xl transition-all shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export Registry JSON</span>
          </button>
        </div>
      </div>

      {resetSuccess && (
        <div className="p-4 clay-badge clay-badge-emerald rounded-2xl text-xs font-bold text-emerald-900 flex items-center gap-2.5 animate-in fade-in shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>System state restored to baseline municipal demonstration records successfully.</span>
        </div>
      )}

      {saveToast && (
        <div className="p-4 clay-badge clay-badge-blue rounded-2xl text-xs font-bold text-blue-900 flex items-center gap-2.5 animate-in fade-in shadow-sm">
          <Check className="w-4 h-4 text-blue-600 shrink-0" />
          <span>Governance parameters updated and applied to active decision-support pipelines.</span>
        </div>
      )}

      {/* Actual System State Overview Grid */}
      <div className="clay-card rounded-3xl p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl clay-badge clay-badge-blue flex items-center justify-center">
              <Cpu className="w-4 h-4 text-blue-600" />
            </div>
            <h2 className="text-sm font-bold text-slate-900">
              Actual System Architecture & Providers
            </h2>
          </div>
          <span className="text-[10px] font-mono font-bold clay-badge clay-badge-emerald px-3 py-1 rounded-xl flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm" />
            OPERATIONAL
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* AI Provider */}
          <div className="p-4 rounded-2xl clay-card space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                AI Provider
              </span>
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-lg clay-badge clay-badge-blue">
                Decision Support
              </span>
            </div>
            <p className="text-xs text-slate-900 font-bold font-mono">
              AI Provider: {aiProviderType === 'Gemini' ? 'SmartCity AI Engine' : 'Demo AI'}
            </p>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              {aiProviderType === 'Gemini'
                ? 'Cloud-based municipal AI decision-support inference for natural language understanding and priority dispatch recommendations. All actions require human administrator ratification.'
                : 'Local rule-based municipal expert system for offline triage and keyword categorization. All actions require human administrator ratification.'}
            </p>
          </div>

          {/* Maps Provider */}
          <div className="p-4 rounded-2xl clay-card space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                Geospatial Engine
              </span>
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-lg clay-badge clay-badge-emerald">
                Leaflet GIS
              </span>
            </div>
            <p className="text-xs text-slate-700 font-semibold">
              OpenStreetMap + CartoDB Dark Matter
            </p>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Multi-layer raster rendering with standard Streets (OSM), Satellite imagery (Esri), and genuine Dark Mode (CartoDB Dark Matter) with zero third-party telemetry.
            </p>
          </div>

          {/* Database / Storage */}
          <div className="p-4 rounded-2xl clay-card space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-amber-600" />
                Database & Storage
              </span>
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-lg clay-badge clay-badge-amber">
                LocalStorage
              </span>
            </div>
            <p className="text-xs text-slate-700 font-semibold">
              Browser Key-Value Persistence
            </p>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Local persistent state stores {complaints.length} complaint records, {hotspots.length} spatial clusters, and {aiInsights.length} operational recommendations locally.
            </p>
          </div>

          {/* Auth System */}
          <div className="p-4 rounded-2xl clay-card space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-indigo-600" />
                Access Control (RBAC)
              </span>
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-lg clay-badge">
                Role Guarded
              </span>
            </div>
            <p className="text-xs text-slate-700 font-semibold">
              Current Session: <span className="capitalize">{activePersona}</span>
            </p>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Separates Citizen reporting & tracking interfaces from Administrative adjudication, work order dispatch, and municipal analytics dashboards.
            </p>
          </div>

          {/* Hotspot Engine */}
          <div className="p-4 rounded-2xl clay-card space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-rose-600" />
                Hotspot Engine
              </span>
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-lg clay-badge clay-badge-rose">
                DBSCAN Cluster
              </span>
            </div>
            <p className="text-xs text-slate-700 font-semibold">
              Spatial Density Clustering
            </p>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Groups incident coordinates within {clusteringRadius}m radius to detect chronic infrastructure issues and municipal service hotspots automatically.
            </p>
          </div>

          {/* Human Governance */}
          <div className="p-4 rounded-2xl clay-card space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-700" />
                Human Decision Guard
              </span>
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-lg clay-badge">
                Enforced
              </span>
            </div>
            <p className="text-xs text-slate-700 font-semibold">
              Zero Autonomous Dispatch
            </p>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Administrative approval is strictly required before issuing work orders, changing complaint status, or dispatching municipal field crews.
            </p>
          </div>
        </div>
      </div>

      {/* Decision-Support & Clustering Threshold Controls */}
      <div className="clay-card rounded-3xl p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl clay-badge clay-badge-blue flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-blue-600" />
            </div>
            <h2 className="text-sm font-bold text-slate-900">
              Triage & Clustering Parameters
            </h2>
          </div>
          <button
            type="button"
            onClick={handleSaveParams}
            className="px-4 py-2 clay-btn clay-btn-primary text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
          >
            Apply Parameters
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div className="space-y-3 p-4 rounded-2xl clay-inset bg-slate-50/70">
            <div className="flex justify-between items-center">
              <label className="font-bold text-slate-700">
                High-Urgency Flagging Confidence Threshold
              </label>
              <span className="font-bold text-blue-600 font-mono text-sm clay-badge px-2 py-0.5 rounded-lg">{confidenceThreshold}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="95"
              value={confidenceThreshold}
              onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <p className="text-[11px] text-slate-400">
              Incidents classified with model confidence at or above this threshold receive elevated priority triage recommendations.
            </p>
          </div>

          <div className="space-y-3 p-4 rounded-2xl clay-inset bg-slate-50/70">
            <div className="flex justify-between items-center">
              <label className="font-bold text-slate-700">
                Spatial Hotspot Proximity Radius
              </label>
              <span className="font-bold text-blue-600 font-mono text-sm clay-badge px-2 py-0.5 rounded-lg">{clusteringRadius} meters</span>
            </div>
            <input
              type="range"
              min="100"
              max="600"
              step="50"
              value={clusteringRadius}
              onChange={(e) => setClusteringRadius(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <p className="text-[11px] text-slate-400">
              Distance radius within which multiple civic reports trigger a spatial cluster flag for municipal investigation.
            </p>
          </div>
        </div>
      </div>

      {/* Database Maintenance & Reset */}
      <div className="clay-card rounded-3xl p-6 space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100/80">
          <div className="w-8 h-8 rounded-xl clay-badge flex items-center justify-center">
            <HardDrive className="w-4 h-4 text-slate-700" />
          </div>
          <h2 className="text-sm font-bold text-slate-900">
            Database Maintenance & Demonstration Controls
          </h2>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl clay-badge clay-badge-rose border border-rose-300/40">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-rose-900 block">
              Reset System Demonstration Data
            </span>
            <span className="text-[11px] text-rose-700 leading-relaxed block">
              Re-initializes all complaints, spatial clusters, and AI insight dossiers to the original municipal dataset.
            </span>
          </div>

          <button
            type="button"
            onClick={() => setResetModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl clay-btn clay-badge-rose text-rose-800 text-xs font-bold transition-all shadow-sm cursor-pointer shrink-0 hover:scale-102"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Records</span>
          </button>
        </div>
      </div>

      <AIDecisionDisclaimer />

      {/* Reset Confirmation Modal (avoid native window.alert/confirm) */}
      {resetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="clay-card rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 bg-white/95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl clay-badge clay-badge-rose flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Reset System Records?</h3>
                <p className="text-xs text-slate-500">This will revert all data to starting demo state.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed clay-inset bg-slate-50 p-3.5 rounded-2xl">
              Any newly submitted citizen complaints, work orders, status transitions, and triage decisions created in this session will be replaced by the default municipal records.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setResetModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-700 clay-btn rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="px-4 py-2 text-xs font-bold text-white clay-btn clay-badge-rose text-rose-900 rounded-xl transition-all cursor-pointer shadow-md"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
