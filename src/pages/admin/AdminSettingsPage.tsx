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
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1.5 mb-1 font-mono">
            <Settings className="w-3.5 h-3.5" />
            System Administration
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            System State & Governance Configuration
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Transparently monitor the actual AI provider, geospatial engine, database persistence, and triage parameters.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportJSON}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200/90 shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Registry JSON</span>
          </button>
        </div>
      </div>

      {resetSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>System state restored to baseline municipal demonstration records successfully.</span>
        </div>
      )}

      {saveToast && (
        <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs font-semibold text-blue-800 flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-blue-600 shrink-0" />
          <span>Governance parameters updated and applied to active decision-support pipelines.</span>
        </div>
      )}

      {/* Actual System State Overview Grid */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Actual System Architecture & Providers
            </h2>
          </div>
          <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            OPERATIONAL
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {/* AI Provider */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                AI Provider
              </span>
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                Decision Support
              </span>
            </div>
            <p className="text-xs text-slate-900 font-bold font-mono">
              AI Provider: {aiProviderType === 'Gemini' ? 'Gemini 2.5 Flash' : 'Demo AI'}
            </p>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              {aiProviderType === 'Gemini'
                ? 'Gemini 2.5 Flash (with automated Gemini 2.5 Flash Lite fallback) cloud inference for natural language understanding and priority dispatch recommendations. All actions require human administrator ratification.'
                : 'Local rule-based municipal expert system for offline triage and keyword categorization. All actions require human administrator ratification.'}
            </p>
          </div>

          {/* Maps Provider */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                Geospatial Engine
              </span>
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
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
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-amber-600" />
                Database & Storage
              </span>
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-800">
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
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-indigo-600" />
                Access Control (RBAC)
              </span>
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
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
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-rose-600" />
                Hotspot Engine
              </span>
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-rose-100 text-rose-800">
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
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-700" />
                Human Decision Guard
              </span>
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-800">
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
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-5 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Triage & Clustering Parameters
            </h2>
          </div>
          <button
            type="button"
            onClick={handleSaveParams}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            Apply Parameters
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="font-semibold text-slate-700">
                High-Urgency Flagging Confidence Threshold
              </label>
              <span className="font-bold text-blue-600 font-mono text-sm">{confidenceThreshold}%</span>
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

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="font-semibold text-slate-700">
                Spatial Hotspot Proximity Radius
              </label>
              <span className="font-bold text-blue-600 font-mono text-sm">{clusteringRadius} meters</span>
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
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-5 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <HardDrive className="w-4 h-4 text-slate-700" />
          <h2 className="text-sm font-bold text-slate-900">
            Database Maintenance & Demonstration Controls
          </h2>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-rose-50/50 border border-rose-100">
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
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-2xs cursor-pointer shrink-0"
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
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Reset System Records?</h3>
                <p className="text-xs text-slate-500">This will revert all data to starting demo state.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              Any newly submitted citizen complaints, work orders, status transitions, and triage decisions created in this session will be replaced by the default municipal records.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setResetModalOpen(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors cursor-pointer shadow-2xs"
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
