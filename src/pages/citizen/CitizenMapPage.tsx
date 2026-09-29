import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { SmartCityMap } from '../../components/maps/SmartCityMap';
import { AIDecisionDisclaimer } from '../../components/common/AIDecisionDisclaimer';
import { MapPin, Flame, ShieldAlert, Sparkles } from 'lucide-react';

export const CitizenMapPage: React.FC = () => {
  const { complaints, hotspots } = useApp();
  const navigate = useNavigate();

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl clay-badge clay-badge-blue flex items-center justify-center">
              <MapPin className="w-4 h-4 text-blue-600" />
            </div>
            <span>Public Smart City Issue Map</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Live geographic distribution of reported civic issues and active potential problem hotspots.
          </p>
        </div>
      </div>

      <div className="clay-card rounded-3xl p-5 space-y-4">
        <div className="rounded-2xl overflow-hidden clay-inset p-1 bg-slate-100/50">
          <SmartCityMap
            complaints={complaints}
            hotspots={hotspots}
            height="h-[560px]"
            showHotspotsByDefault={true}
            showFilterControls={true}
            onSelectComplaint={(c) => navigate(`/track?id=${c.id}`)}
            onSelectHotspot={(hs) => {
              // Citizen view of hotspot details
            }}
          />
        </div>

        {/* Legend */}
        <div className="p-4 rounded-2xl clay-inset bg-slate-50/70 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-bold text-slate-700 font-mono text-[11px] uppercase">Map Legend:</span>
            <span className="inline-flex items-center gap-1.5 text-slate-700 font-medium clay-badge px-2 py-0.5 rounded-lg">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-sm" />
              Roads
            </span>
            <span className="inline-flex items-center gap-1.5 text-slate-700 font-medium clay-badge px-2 py-0.5 rounded-lg">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" />
              Sanitation
            </span>
            <span className="inline-flex items-center gap-1.5 text-slate-700 font-medium clay-badge px-2 py-0.5 rounded-lg">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shadow-sm" />
              Water
            </span>
            <span className="inline-flex items-center gap-1.5 text-slate-700 font-medium clay-badge px-2 py-0.5 rounded-lg">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm" />
              Streetlights
            </span>
            <span className="inline-flex items-center gap-1.5 text-slate-700 font-medium clay-badge px-2 py-0.5 rounded-lg">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm" />
              Traffic
            </span>
            <span className="inline-flex items-center gap-1.5 text-slate-700 font-medium clay-badge px-2 py-0.5 rounded-lg">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-sm" />
              Infrastructure
            </span>
          </div>

          <div className="flex items-center gap-2 text-rose-700 font-bold px-3 py-1.5 rounded-xl clay-badge clay-badge-rose text-xs">
            <Flame className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span>Red circles indicate potential high-density complaint hotspots</span>
          </div>
        </div>
      </div>

      <AIDecisionDisclaimer />
    </div>
  );
};
