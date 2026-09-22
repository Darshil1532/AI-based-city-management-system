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
    <div className="space-y-4 max-w-7xl mx-auto pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-0.5 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            <span>GIS GEOSPATIAL COMMAND CONSOLE</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            City Incident & Hotspot GIS Map
          </h1>
          <p className="text-xs text-slate-500">
            Interactive multi-layered city telemetry mapping complaints, automated spatial cluster hotspots, and municipal jurisdiction zones.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200/90 shadow-2xs text-xs font-mono">
            <span className="text-slate-400">Total Incidents: </span>
            <span className="font-bold text-slate-900">{complaints.length}</span>
          </div>
          <div className="bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200 shadow-2xs text-xs font-mono">
            <span className="text-rose-600">Active Clusters: </span>
            <span className="font-bold text-rose-800">{hotspots.length}</span>
          </div>
        </div>
      </div>

      {/* Map Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className={`transition-all ${selectedComplaint || selectedHotspot ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
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

        {/* Side Panel when an item is clicked on the map */}
        {(selectedComplaint || selectedHotspot) && (
          <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4 max-h-[620px] overflow-y-auto">
            {selectedComplaint && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {selectedComplaint.id}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedComplaint(null)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <StatusBadge status={selectedComplaint.status} size="sm" />
                    <PriorityBadge priority={selectedComplaint.priority} size="sm" isAI={true} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{selectedComplaint.title}</h3>
                  <p className="text-xs text-slate-600 mt-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    "{selectedComplaint.description}"
                  </p>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-400 font-mono">Category:</span>
                    <span className="font-semibold text-slate-800">{selectedComplaint.category}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-400 font-mono">Department:</span>
                    <span className="font-semibold text-slate-800">{selectedComplaint.department || 'Public Works'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-400 font-mono">Address:</span>
                    <span className="font-semibold text-slate-800 text-right max-w-[180px] truncate">
                      {selectedComplaint.location.address}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-400 font-mono">Reporter:</span>
                    <span className="font-semibold text-slate-800">{selectedComplaint.citizenName || 'Citizen'}</span>
                  </div>
                </div>

                {selectedComplaint.image && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 font-mono">
                      Field Photo
                    </span>
                    <img
                      src={selectedComplaint.image}
                      alt="Complaint"
                      className="w-full h-32 object-cover rounded-lg border border-slate-200"
                    />
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => navigate(`/admin/complaint/${selectedComplaint.id}`)}
                  className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <span>Open Dossier & Adjudicate</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {selectedHotspot && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-1.5 text-rose-700 font-bold text-xs font-mono">
                    <Flame className="w-4 h-4" />
                    <span>SPATIAL CLUSTER DETECTED</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedHotspot(null)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900">{selectedHotspot.name}</h3>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-[11px] font-mono bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-bold">
                      {selectedHotspot.riskLevel} Risk
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">
                      Radius: {selectedHotspot.radiusMeters}m
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-mono">Incident Density:</span>
                    <span className="font-bold text-slate-800">{selectedHotspot.complaintCount} reports</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-mono">Primary Concern:</span>
                    <span className="font-bold text-slate-800">
                      {selectedHotspot.mainCategories?.[0]?.category || 'Infrastructure'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate('/admin/hotspots')}
                  className="w-full py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <span>Inspect Hotspot Analysis</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
