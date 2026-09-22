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
    <div className="space-y-4 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            <span>Public Smart City Issue Map</span>
          </h1>
          <p className="text-xs text-slate-500">
            Live geographic distribution of reported civic issues and active potential problem hotspots.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-3 space-y-3">
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

        {/* Legend */}
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-bold text-slate-700">Map Legend:</span>
            <span className="inline-flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
              Roads
            </span>
            <span className="inline-flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Sanitation
            </span>
            <span className="inline-flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
              Water
            </span>
            <span className="inline-flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              Streetlights
            </span>
            <span className="inline-flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              Traffic
            </span>
            <span className="inline-flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              Infrastructure
            </span>
          </div>

          <div className="flex items-center gap-2 text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200 text-[11px] font-medium">
            <Flame className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span>Red circles indicate potential high-density complaint hotspots</span>
          </div>
        </div>
      </div>

      <AIDecisionDisclaimer />
    </div>
  );
};
