import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SmartCityMap } from '../../components/maps/SmartCityMap';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { Complaint, Hotspot } from '../../types';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Flame,
  Layers,
  Sparkles,
  Shield,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  X,
  Filter,
} from 'lucide-react';

export const AdminMapPage: React.FC = () => {
  const { allComplaints, hotspots } = useApp();
  const complaints = allComplaints;
  const navigate = useNavigate();

  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-1.5 font-mono">
            <span className="w-2 h-2 rounded-full bg-blue-500 shadow-sm" />
            <span>GIS GEOSPATIAL COMMAND CONSOLE</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            City Incident & Hotspot GIS Map
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Interactive multi-layered city telemetry mapping complaints, automated spatial cluster hotspots, and municipal jurisdiction zones.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <div className="clay-card px-4 py-2 rounded-2xl text-xs font-mono">
            <span className="text-slate-400">Total Incidents: </span>
            <span className="font-bold text-slate-900">{complaints.length}</span>
          </div>
          <div className="clay-badge clay-badge-rose px-4 py-2 rounded-2xl text-xs font-mono">
            <span className="text-rose-600 font-medium">Active Clusters: </span>
            <span className="font-bold text-rose-800">{hotspots.length}</span>
          </div>
        </div>
      </div>

      {/* Map Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className={`transition-all ${selectedComplaint || selectedHotspot ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
          <div className="clay-card rounded-3xl p-4">
            <div className="rounded-2xl overflow-hidden clay-inset p-1 bg-slate-100/50">
              <SmartCityMap
                complaints={complaints}
                hotspots={hotspots}
                height="h-[620px]"
                showHotspotsByDefault={true}
                showFilterControls={true}
                onSelectComplaint={(c) => {
                  setSelectedComplaint(c);
                  setSelectedHotspot(null);
                }}
                onSelectHotspot={(h) => {
                  setSelectedHotspot(h);
                  setSelectedComplaint(null);
                }}
              />
            </div>
          </div>
        </div>

        {/* Side Panel when an item is clicked on the map */}
        {(selectedComplaint || selectedHotspot) && (
          <div className="lg:col-span-4 clay-card rounded-3xl p-6 space-y-5 max-h-[660px] overflow-y-auto">
            {selectedComplaint && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100/80 pb-3">
                  <span className="font-mono text-xs font-bold text-slate-800 clay-badge px-2.5 py-1 rounded-xl">
                    {selectedComplaint.id}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedComplaint(null)}
                    className="w-7 h-7 rounded-xl clay-btn flex items-center justify-center text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <StatusBadge status={selectedComplaint.status} size="sm" />
                    <PriorityBadge priority={selectedComplaint.priority} size="sm" isAI={true} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{selectedComplaint.title}</h3>
                  <p className="text-xs text-slate-700 mt-2 bg-slate-50/80 p-3.5 rounded-2xl clay-inset leading-relaxed">
                    "{selectedComplaint.description}"
                  </p>
                </div>

                <div className="space-y-2 text-xs clay-inset p-3.5 rounded-2xl bg-slate-50/60">
                  <div className="flex justify-between py-1 border-b border-slate-200/50">
                    <span className="text-slate-400 font-mono">Category:</span>
                    <span className="font-bold text-slate-800">{selectedComplaint.category}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/50">
                    <span className="text-slate-400 font-mono">Department:</span>
                    <span className="font-bold text-slate-800">{selectedComplaint.department || 'Public Works'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/50">
                    <span className="text-slate-400 font-mono">Address:</span>
                    <span className="font-bold text-slate-800 text-right max-w-[180px] truncate">
                      {selectedComplaint.location?.address || selectedComplaint.location?.district || 'Municipal Zone'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400 font-mono">Reporter:</span>
                    <span className="font-bold text-slate-800">{selectedComplaint.citizenName || 'Citizen'}</span>
                  </div>
                </div>

                {selectedComplaint.image && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 font-mono">
                      Field Photo
                    </span>
                    <div className="rounded-2xl overflow-hidden clay-inset p-1 bg-slate-100/60">
                      <img
                        src={selectedComplaint.image}
                        alt="Complaint"
                        className="w-full h-32 object-cover rounded-xl"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => navigate(`/admin/complaint/${selectedComplaint.id}`)}
                  className="w-full py-3 px-4 clay-btn clay-btn-primary text-white text-xs font-bold rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <span>Open Dossier & Adjudicate</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {selectedHotspot && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100/80 pb-3">
                  <div className="flex items-center gap-2 text-rose-700 font-bold text-xs font-mono clay-badge clay-badge-rose px-2.5 py-1 rounded-xl">
                    <Flame className="w-4 h-4 text-rose-600" />
                    <span>SPATIAL CLUSTER DETECTED</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedHotspot(null)}
                    className="w-7 h-7 rounded-xl clay-btn flex items-center justify-center text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900">{selectedHotspot.name}</h3>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-lg clay-badge clay-badge-rose">
                      {selectedHotspot.riskLevel} Risk
                    </span>
                    <span className="text-[11px] font-mono text-slate-500 font-bold clay-badge px-2 py-0.5 rounded-lg">
                      Radius: {selectedHotspot.radiusMeters}m
                    </span>
                  </div>
                </div>

                <div className="p-3.5 clay-inset bg-slate-50/70 rounded-2xl text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-mono">Incident Density:</span>
                    <span className="font-bold text-slate-900">{selectedHotspot.complaintCount} reports</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-mono">Primary Concern:</span>
                    <span className="font-bold text-slate-900">
                      {selectedHotspot.mainCategories?.[0]?.category || 'Infrastructure'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate('/admin/hotspots')}
                  className="w-full py-3 px-4 clay-btn clay-badge-rose text-rose-800 text-xs font-bold rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:scale-102"
                >
                  <span>Inspect Hotspot Analysis</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
