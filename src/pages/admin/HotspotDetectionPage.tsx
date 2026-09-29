import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { SmartCityMap } from '../../components/maps/SmartCityMap';
import { AIDecisionDisclaimer } from '../../components/common/AIDecisionDisclaimer';
import { Hotspot } from '../../types';
import {
  Flame,
  AlertTriangle,
  MapPin,
  Calendar,
  Layers,
  Search,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  Info,
} from 'lucide-react';

export const HotspotDetectionPage: React.FC = () => {
  const { hotspots, allComplaints, recalculateHotspotsNow } = useApp();
  const complaints = allComplaints;
  const navigate = useNavigate();

  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(
    hotspots.length > 0 ? hotspots[0] : null
  );
  const [dispatchToast, setDispatchToast] = useState<string | null>(null);

  const handleDispatch = (name: string) => {
    setDispatchToast(`Joint inspection work order initialized for ${name}.`);
    setTimeout(() => setDispatchToast(null), 3500);
  };

  const handleRecalculate = () => {
    recalculateHotspotsNow();
    setDispatchToast('Hotspot spatial clusters successfully recalculated across all active complaints.');
    setTimeout(() => setDispatchToast(null), 3500);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Title & Explanation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2 font-mono">
              <span className="w-2 h-2 rounded-full bg-rose-500 shadow-sm" />
              Spatial Density Clustering
            </span>
            <span className="text-[10px] text-slate-600 font-bold px-2.5 py-0.5 rounded-lg font-mono clay-badge">
              DBSCAN Geospatial Cluster Engine
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Civic Hotspots & Geographic Clustering
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-3xl mt-1">
            Identifies localized clusters with high complaint density within municipal sectors. Provides administrative suggestions for ground inspection.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRecalculate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl clay-btn clay-btn-primary text-white text-xs font-bold transition-all shadow-md cursor-pointer shrink-0"
        >
          <TrendingUp className="w-4 h-4 text-amber-400" />
          <span>Recalculate Hotspots</span>
        </button>
      </div>

      {/* Mandatory Disclaimer */}
      <div className="p-5 rounded-3xl clay-card text-xs text-amber-950 flex items-start gap-4">
        <div className="w-10 h-10 rounded-2xl clay-badge clay-badge-amber flex items-center justify-center shrink-0">
          <AlertTriangle className="w-5 h-5 text-amber-700" />
        </div>
        <div className="space-y-1">
          <span className="font-bold text-amber-900 block font-mono text-[11px] uppercase tracking-wide">
            Administrative Hotspot Clarification Note:
          </span>
          <p className="text-amber-800 leading-relaxed text-xs">
            Clustering indicates statistical complaint density within a geographic radius. It does <strong className="font-bold">NOT</strong> prove an underlying systemic root cause. City supervisors should treat these zones as potential hotspots requiring human on-site ground inspection before deploying extensive capital works.
          </p>
        </div>
      </div>

      {/* Dispatch confirmation toast */}
      {dispatchToast && (
        <div className="p-4 clay-badge clay-badge-emerald rounded-2xl text-xs font-bold text-emerald-900 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-4 h-4 text-emerald-700" />
            <span>{dispatchToast}</span>
          </div>
          <span className="text-[10px] text-emerald-700 font-mono">WORK ORDER CREATED</span>
        </div>
      )}

      {/* Map + Hotspots Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: GIS Map View (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="clay-card rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 font-mono">
                <div className="w-6 h-6 rounded-lg clay-inset flex items-center justify-center">
                  <MapPin className="w-3.5 h-3.5 text-slate-700" />
                </div>
                Geographic Heatmap
              </span>
              <span className="text-[11px] text-slate-500 font-mono clay-badge px-2.5 py-0.5 rounded-lg">
                Click pin or hotspot area to select
              </span>
            </div>

            <div className="rounded-2xl overflow-hidden clay-inset p-1 bg-slate-100/50">
              <SmartCityMap
                complaints={complaints}
                hotspots={hotspots}
                selectedHotspotId={selectedHotspot?.id}
                height="h-[520px]"
                showHotspotsByDefault={true}
                showFilterControls={true}
                onSelectHotspot={(hs) => setSelectedHotspot(hs)}
              />
            </div>
          </div>
        </div>

        {/* Right: Hotspots List & Selected Dossier (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="clay-card rounded-3xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 font-mono">
              <div className="w-6 h-6 rounded-lg clay-badge clay-badge-rose flex items-center justify-center">
                <Flame className="w-3.5 h-3.5 text-rose-600" />
              </div>
              Detected Potential Hotspots ({hotspots.length})
            </h3>

            {/* Hotspots Card Selector */}
            <div className="space-y-3.5">
              {hotspots.map((hs) => {
                const isSelected = selectedHotspot?.id === hs.id;
                return (
                  <div
                    key={hs.id}
                    onClick={() => setSelectedHotspot(hs)}
                    className={`p-4 rounded-2xl transition-all cursor-pointer ${
                      isSelected
                        ? 'clay-btn clay-btn-primary text-white scale-101 shadow-lg'
                        : 'clay-card hover:scale-101'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                            isSelected
                              ? 'bg-white/10 text-white'
                              : hs.riskLevel === 'High' || hs.riskLevel === 'Critical'
                              ? 'clay-badge clay-badge-rose text-rose-700'
                              : 'clay-badge clay-badge-amber text-amber-700'
                          }`}
                        >
                          <Flame className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                            {hs.name}
                          </h4>
                          <span className={`text-[10px] font-mono ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                            {hs.locationName || hs.district} • {hs.radiusMeters}m radius
                          </span>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-xl ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : hs.riskLevel === 'High' || hs.riskLevel === 'Critical'
                            ? 'clay-badge clay-badge-rose'
                            : 'clay-badge clay-badge-amber'
                        }`}
                      >
                        {hs.riskLevel} Risk
                      </span>
                    </div>

                    {/* Complaint count, timeframe & confidence */}
                    <div className={`mt-3.5 grid grid-cols-3 gap-2 text-xs p-2.5 rounded-xl ${
                      isSelected ? 'bg-white/10' : 'clay-inset bg-slate-50/70'
                    }`}>
                      <div>
                        <span className={`text-[10px] block font-mono ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>Density:</span>
                        <span className={`font-bold ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                          {hs.complaintCount} reports
                        </span>
                      </div>
                      <div>
                        <span className={`text-[10px] block font-mono ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>Period:</span>
                        <span className={`font-semibold ${isSelected ? 'text-slate-200' : 'text-slate-700'}`}>
                          {hs.timePeriod}
                        </span>
                      </div>
                      <div>
                        <span className={`text-[10px] block font-mono ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>Confidence:</span>
                        <span className={`font-bold ${isSelected ? 'text-emerald-300' : 'text-emerald-700'}`}>
                          {Math.round((hs.confidence ?? 0.88) * 100)}%
                        </span>
                      </div>
                    </div>

                    {/* Detection Note */}
                    <div className={`mt-2.5 text-[11px] italic flex items-center gap-1.5 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                      <span>{hs.detectionNote || 'Potential hotspot detected from repeated reports.'}</span>
                    </div>

                    {/* Category Breakdown */}
                    <div className="mt-3">
                      <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1.5 font-mono ${
                        isSelected ? 'text-slate-300' : 'text-slate-400'
                      }`}>
                        Distribution:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {hs.mainCategories.map((mc, idx) => (
                          <span
                            key={idx}
                            className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-lg ${
                              isSelected
                                ? 'bg-white/10 text-white'
                                : 'clay-badge text-slate-800'
                            }`}
                          >
                            {mc.count} {mc.category.split('/')[0].trim()}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Suggested AI Insight */}
                    <div className={`mt-3 p-3 rounded-xl text-xs ${
                      isSelected
                        ? 'bg-white/10 text-white'
                        : 'clay-inset bg-slate-50/80 text-slate-700'
                    }`}>
                      <span className={`text-[10px] uppercase font-bold block mb-1 font-mono ${
                        isSelected ? 'text-blue-300' : 'text-blue-600'
                      }`}>
                        AI Cluster Recommendation:
                      </span>
                      <p className="leading-relaxed text-xs">
                        "{hs.suggestedAction}"
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Hotspot Action Card */}
          {selectedHotspot && (
            <div className="clay-card rounded-3xl p-5 space-y-3.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900 block font-mono">
                Administrative Dispatch Options for {selectedHotspot.name}
              </span>
              <p className="text-xs text-slate-600 leading-relaxed">
                Dispatch an inter-departmental site inspection crew to verify environmental factors, collection schedules, or drainage capacity.
              </p>
              <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleDispatch(selectedHotspot.name)}
                  className="flex-1 py-3 px-4 clay-btn clay-btn-primary text-white text-xs font-bold rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShieldAlert className="w-4 h-4 text-amber-300" />
                  <span>Dispatch Joint Inspection</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/admin/dashboard')}
                  className="py-3 px-4 clay-btn text-slate-700 text-xs font-bold rounded-2xl transition-all cursor-pointer"
                >
                  Filter Dashboard Table
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
